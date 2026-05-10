"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/data/password-reset";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="flex h-full items-center justify-center p-7">
      <div className="w-[420px] rounded-xl border border-border-strong bg-bg-secondary p-[26px] text-[13px] text-text-muted shadow-[inset_0_1px_0_var(--color-border-subtle)]">
        Loading reset form...
      </div>
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const invalidToken = searchParams.get("error") === "INVALID_TOKEN";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(invalidToken ? "This reset link is invalid or expired." : "");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const pwRules = [
    { label: "12 characters", test: password.length >= 12 },
    { label: "Uppercase & lowercase", test: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "A number", test: /\d/.test(password) },
    { label: "A special character", test: /[^a-zA-Z0-9]/.test(password) },
  ];
  const passwordValid = pwRules.every((rule) => rule.test);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is invalid or expired.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (!passwordValid) {
      setError("Password does not meet the requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push("/login/guest"), 1200);
    } catch {
      setError("Could not reset your password. The link may be expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-7">
      <div className="w-[420px] rounded-xl border border-border-strong bg-bg-secondary p-[26px] shadow-[inset_0_1px_0_var(--color-border-subtle)]">
        <Link
          href="/login/guest"
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
          Reset password
        </h1>
        <p className="mb-[22px] text-[13.5px] text-text-muted">
          Choose a new password for your account.
        </p>

        {success ? (
          <div className="rounded-lg border border-accent-green/40 bg-accent-green/10 px-3.5 py-3 text-[13px] text-accent-green">
            Your password has been updated. Redirecting to sign in...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-muted">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Min. 12 characters"
                  autoComplete="new-password"
                  className="w-full rounded-[10px] border border-border-default bg-bg-primary px-3.5 py-3 pr-11 text-[14px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dimmed transition-colors hover:text-text-primary"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {password.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                  {pwRules.map((rule) => (
                    <div key={rule.label} className="flex items-center gap-1.5">
                      <div
                        className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                          rule.test ? "bg-accent-green" : "bg-text-dimmed"
                        }`}
                      />
                      <span
                        className={`text-[11px] transition-colors ${
                          rule.test ? "text-accent-green" : "text-text-dimmed"
                        }`}
                      >
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`transition-opacity ${!passwordValid ? "pointer-events-none opacity-40" : ""}`}>
              <label className="mb-1.5 block text-[12px] font-medium text-text-muted">
                Confirm password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                onPaste={(event) => event.preventDefault()}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className="w-full rounded-[10px] border border-border-default bg-bg-primary px-3.5 py-3 text-[14px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || invalidToken}
              className="mt-1 w-full rounded-[14px] bg-btn-primary-bg px-[18px] py-3.5 text-[15px] font-semibold text-btn-primary-text transition-opacity hover:opacity-88 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        <p className="mt-[22px] text-center text-[13px] text-text-muted">
          Remember your password?{" "}
          <Link
            href="/login/guest"
            className="font-medium text-text-primary transition-colors hover:text-accent-blue"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
