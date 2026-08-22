import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, resetAuthStatus } from "../features/auth/authSlice";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowBigLeft,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";


export default function Login() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const prefillEmail = searchParams.get("email") || "";

  const [formData, setFormData] = useState({
    email: prefillEmail,
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const { email, password } = formData;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, isError, message, isAuthenticated } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (isAuthenticated) {
      toast.success("Welcome back! 🎉");
      navigate(redirectTo || "/", { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  useEffect(() => {
    if (isError && message) {
      toast.error(message);
    }
  }, [isError, message]);

  useEffect(() => {
    return () => {
      dispatch(resetAuthStatus());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    dispatch(login({ email, password }));
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6 text-slate-900 ">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 mb-4">
            <Zap className="w-6 h-6" fill="currentColor" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            TaskPulse
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Welcome back. Enter your credentials to access your tasks.
          </p>
        </div>

        {/* Card */}
        <div className="p-3">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="name@example.com"
                autoComplete="email"
                required
                className="w-full bg-white text-slate-900 placeholder-slate-400 px-4 py-3.5 rounded-lg outline-none border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full bg-white text-slate-900 placeholder-slate-400 px-4 py-3.5 pr-12 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                />

                <div className="text-right ">
                  <Link
                    to="/forgot-password"
                    className="text-blue-700 text-sm mt-1 cursor-pointer hover:underline duration-200 transition-all"
                  >
                    forgot password?
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
