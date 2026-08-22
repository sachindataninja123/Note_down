import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Loader2, ShieldCheck, Mail, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import {
  forgotPassword,
  verifyOtp,
  resetPassword,
  clearResetFlow,
} from "../features/auth/authSlice";

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, otpSent, otpVerified, resetToken } = useSelector(
    (state) => state.auth
  );

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    return () => {
      dispatch(clearResetFlow());
    };
  }, [dispatch]);

  // Step 1: Send 6-Digit OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    const promise = dispatch(forgotPassword(email.trim())).unwrap();
    toast.promise(promise, {
      loading: "Sending OTP to your email...",
      success: "If an account exists, a 6-digit code has been sent!",
      error: (err) => err || "Failed to send reset OTP",
    });
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    const promise = dispatch(
      verifyOtp({ email: email.trim(), otp: otp.trim() })
    ).unwrap();

    toast.promise(promise, {
      loading: "Verifying code...",
      success: "Code verified successfully!",
      error: (err) => err || "Invalid or expired OTP",
    });
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const promise = dispatch(
      resetPassword({ resetToken, newPassword })
    ).unwrap();

    toast.promise(promise, {
      loading: "Resetting password...",
      success: "Password reset successfully! Please sign in.",
      error: (err) => err || "Failed to reset password",
    });

    try {
      await promise;
      navigate("/login", { replace: true });
    } catch {
      // Handled by toast
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6 text-slate-900">
      <div className="w-full max-w-md">
        
        {/* Header Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 mb-4 shadow-sm">
            {!otpSent ? (
              <Mail className="w-6 h-6" />
            ) : !otpVerified ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <KeyRound className="w-6 h-6" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {!otpSent
              ? "Forgot Password"
              : !otpVerified
              ? "Verify Security Code"
              : "Set New Password"}
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            {!otpSent
              ? "Enter your registered email address to receive a verification code."
              : !otpVerified
              ? `Enter the 6-digit code sent to ${email}.`
              : "Enter your new account password below."}
          </p>
        </div>

        {/* Dynamic Multi-Step Form */}
        <div className="p-3">
          {/* STEP 1: Request OTP */}
          {!otpSent && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-white text-slate-900 placeholder-slate-400 px-4 py-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Code"}
              </button>
            </form>
          )}

          {/* STEP 2: Verify OTP */}
          {otpSent && !otpVerified && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  className="w-full text-center tracking-[0.4em] font-mono text-xl bg-white text-slate-900 placeholder-slate-300 px-4 py-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Code"}
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full text-xs font-semibold text-indigo-600 hover:text-indigo-700 text-center block pt-1 cursor-pointer"
              >
                Resend verification code
              </button>
            </form>
          )}

          {/* STEP 3: Reset Password */}
          {otpVerified && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-white text-slate-900 placeholder-slate-400 px-4 py-3.5 pr-12 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white text-slate-900 placeholder-slate-400 px-4 py-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center disabled:opacity-60 cursor-pointer pt-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset & Log In"}
              </button>
            </form>
          )}
        </div>

        {/* Back to Login Link */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}