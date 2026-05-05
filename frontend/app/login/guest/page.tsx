"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TermsAcceptanceModal from "@/components/TermsAcceptanceModal";
import { authClient } from "@/lib/auth-client";

export default function GuestLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    const accepted = localStorage.getItem("terms_accepted");
    if (accepted === "true") {
      signInWithEmail();
    } else {
      setShowTerms(true);
    }
  };

  // Creates a real better-auth session for email/password login.
  const signInWithEmail = async () => {
    setLoading(true);
    setError("");

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Sign in failed.");
      return;
    }

    router.push("/");
  };

  const handleAccept = () => {
    localStorage.setItem("terms_accepted", "true");
    setShowTerms(false);
    signInWithEmail();
  };

  const handleDecline = () => {
    setShowTerms(false);
  };

  return (
    <div className="flex h-full items-center justify-center p-7">
      <div className="w-[420px] rounded-2xl border border-white/10 bg-white/5 p-[26px] shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <Link
          href="/login"
          className="mb-5 flex items-center gap-2 text-[13px] text-text-muted transition-colors hover:text-text-primary"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </Link>

        <h1 className="mb-1.5 text-[22px] font-bold tracking-tight">
          Welcome back
        </h1>
        <p className="mb-[22px] text-[13.5px] text-text-muted">
          Sign in with your email and password
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Email */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-muted">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-[10px] border border-border-default bg-bg-primary px-3.5 py-3 text-[14px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
            />
          </div>

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-[12px] font-medium text-text-muted">
                Password
              </label>
              <Link
                href="/login/forgot-password"
                className="text-[11.5px] text-text-dimmed transition-colors hover:text-text-primary"
              >
                Forgot password?
              </Link>
            </div>
            <div className={`relative transition-opacity ${!email ? "pointer-events-none opacity-40" : ""}`}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={!email}
                className="w-full rounded-[10px] border border-border-default bg-bg-primary px-3.5 py-3 pr-11 text-[14px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dimmed transition-colors hover:text-text-primary"
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-[14px] bg-btn-primary-bg px-[18px] py-3.5 text-[15px] font-semibold text-btn-primary-text transition-opacity hover:opacity-88"
          >
            Sign in
          </button>
        </form>

        {/* Register link */}
        <p className="mt-[22px] text-center text-[13px] text-text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/login/register"
            className="font-medium text-text-primary transition-colors hover:text-accent-blue"
          >
            Register
          </Link>
        </p>
      </div>

      <TermsAcceptanceModal
        open={showTerms}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </div>
  );
}
