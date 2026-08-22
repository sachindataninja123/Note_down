import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Loader2, Zap, CheckCircle2, XCircle, Mail } from "lucide-react";
import invitationService from "../features/invitation/invitationService";

export default function InviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();

  const {
    isAuthenticated,
    user,
    isLoading: authLoading,
  } = useSelector((state) => state.auth);

  const [invite, setInvite] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null); // "accepted" | "rejected" | null

  // Fetch invite info first — this alone tells us where to route the user.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await invitationService.getInviteInfo(token);
        if (!cancelled) setInvite(res.data);
      } catch (err) {
        if (!cancelled) {
          setFetchError(
            err.response?.data?.message || "This invitation link is invalid",
          );
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Once we know the invite + auth state, decide where the user needs to go.
  useEffect(() => {
    if (isFetching || authLoading || !invite || fetchError) return;
    if (invite.status !== "pending") return; // handled in render below

    const redirectPath = `/invite/${token}`;

    if (!isAuthenticated) {
      if (invite.userExists) {
        navigate(
          `/login?redirect=${encodeURIComponent(redirectPath)}&email=${encodeURIComponent(
            invite.email,
          )}`,
          { replace: true },
        );
      } else {
        navigate(
          `/register?redirect=${encodeURIComponent(redirectPath)}&email=${encodeURIComponent(
            invite.email,
          )}`,
          { replace: true },
        );
      }
    }
    // If authenticated, stay on this page — render below handles
    // both the "email matches" and "email mismatch" cases.
  }, [
    isFetching,
    authLoading,
    invite,
    fetchError,
    isAuthenticated,
    navigate,
    token,
  ]);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await invitationService.acceptInvite(token);
      toast.success(`Welcome to ${invite.workspace?.name}! 🎉`);
      setResult("accepted");
      setTimeout(() => navigate("/", { replace: true }), 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept invitation");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await invitationService.rejectInvite(token);
      toast.success("Invitation declined");
      setResult("rejected");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to decline invitation",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ---- Render states ----

  if (isFetching || authLoading) {
    return (
      <CenteredShell>
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 mt-3">Loading invitation…</p>
      </CenteredShell>
    );
  }

  if (fetchError) {
    return (
      <CenteredShell>
        <XCircle className="w-10 h-10 text-rose-500 mb-3" />
        <p className="text-slate-900 font-semibold">{fetchError}</p>
        <Link
          to="/"
          className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Go to dashboard
        </Link>
      </CenteredShell>
    );
  }

  if (invite.status !== "pending" || result) {
    const statusToShow = result || invite.status;
    const isAccepted = statusToShow === "accepted";
    const isRejected = statusToShow === "rejected";
    const isExpired = statusToShow === "expired";

    return (
      <CenteredShell>
        {isAccepted ? (
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
        ) : (
          <XCircle className="w-10 h-10 text-slate-400 mb-3" />
        )}
        <p className="text-slate-900 font-semibold">
          {isAccepted && "You've joined the workspace!"}
          {isRejected && "Invitation declined"}
          {isExpired && "This invitation has expired"}
        </p>
        <Link
          to="/"
          className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Go to dashboard
        </Link>
      </CenteredShell>
    );
  }

  // Authenticated, invite pending — but logged in as the wrong account.
  if (isAuthenticated && user?.email !== invite.email) {
    return (
      <CenteredShell>
        <Mail className="w-10 h-10 text-amber-500 mb-3" />
        <p className="text-slate-900 font-semibold text-center">
          This invite was sent to{" "}
          <span className="text-indigo-600">{invite.email}</span>
        </p>
        <p className="text-sm text-slate-500 mt-1 text-center">
          You're logged in as {user?.email}. Log out and sign in with the
          invited email to accept.
        </p>
        <Link
          to={`/login?redirect=${encodeURIComponent(`/invite/${token}`)}&email=${encodeURIComponent(
            invite.email,
          )}`}
          className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Switch account
        </Link>
      </CenteredShell>
    );
  }

  // Authenticated, correct email, pending invite — show Accept/Reject.
  return (
    <CenteredShell>
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 mb-4">
        <Zap className="w-6 h-6" fill="currentColor" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 text-center">
        Join "{invite.workspace?.name}"
      </h1>
      <p className="text-sm text-slate-500 mt-2 text-center">
        You've been invited as a{" "}
        <span className="font-semibold">{invite.role}</span>.
      </p>

      <div className="flex gap-3 mt-6 w-full">
        <button
          onClick={handleReject}
          disabled={isProcessing}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          disabled={isProcessing}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Accept Invite"
          )}
        </button>
      </div>
    </CenteredShell>
  );
}

function CenteredShell({ children }) {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center shadow-sm">
        {children}
      </div>
    </div>
  );
}
