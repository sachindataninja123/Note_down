import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AppShell from "../components/layout/AppShell";
import toast from "react-hot-toast";
import { changePassword } from "../features/auth/authSlice";
import NotificationPreferences from "../components/settings/NotificationPrefrences";

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const getInitials = (name) => {
    if (!name) return "TP";
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleInputChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    if (oldPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setIsSubmitting(true);
    const promise = dispatch(
      changePassword({ oldPassword, newPassword })
    ).unwrap();

    toast.promise(promise, {
      loading: "Updating password...",
      success: "Password changed successfully! Other sessions logged out.",
      error: (err) => err || "Failed to update password",
    });

    try {
      await promise;
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="Settings">
      {/* Main Container */}
      <div className="max-w-4xl space-y-6 sm:space-y-8">
        
        {/* User Profile Header Card */}
        <section className="bg-white rounded-3xl border border-line p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-linear-to-br from-[#432DD7] to-[#6654E8] flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold shadow-lg shadow-[#432DD7]/20 shrink-0">
            {getInitials(user?.name)}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-3 border-white" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink-900 truncate">
                {user?.name || "TaskPulse User"}
              </h1>
              <span className="inline-flex self-center sm:self-auto items-center px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-wider border border-brand-100">
                Active Member
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-400 truncate">{user?.email}</p>
            <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-medium bg-[#F7F7F5] border border-line text-[#63656F] px-2.5 py-1 rounded-lg">
                Personal Space
              </span>
              <span className="text-[11px] font-medium bg-[#F7F7F5] border border-line text-[#63656F] px-2.5 py-1 rounded-lg">
                JWT Authenticated
              </span>
            </div>
          </div>
        </section>

        <NotificationPreferences />

        {/* Change Password Card */}
        <section className="bg-white rounded-3xl border border-line p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-6">
          <div className="border-b border-line pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-brand-600 flex items-center justify-center font-bold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-ink-900">Security & Password</h2>
                <p className="text-xs text-ink-400">Update your password to keep your account safe.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
            {/* Current Password */}
            <div>
              <label className="block text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? "text" : "password"}
                  name="oldPassword"
                  placeholder="••••••••"
                  value={passwordData.oldPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#FAFAF8] border border-line rounded-xl px-3.5 py-2.5 text-[13px] text-ink-900 outline-none focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-[#432DD7]/10 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-900 transition text-xs cursor-pointer"
                >
                  {showOldPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* New Password & Confirm Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    name="newPassword"
                    placeholder="At least 6 characters"
                    value={passwordData.newPassword}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="w-full bg-[#FAFAF8] border border-line rounded-xl px-3.5 py-2.5 text-[13px] text-ink-900 outline-none focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-[#432DD7]/10 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-900 transition text-xs cursor-pointer"
                  >
                    {showNewPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-type new password"
                  value={passwordData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#FAFAF8] border border-line rounded-xl px-3.5 py-2.5 text-[13px] text-ink-900 outline-none focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-[#432DD7]/10 transition"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-[#432DD7]/20 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}