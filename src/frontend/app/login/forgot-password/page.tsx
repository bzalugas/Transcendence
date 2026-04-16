"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex h-full items-center justify-center p-7">
        <div className="w-[420px] rounded-xl border border-border-strong bg-bg-secondary p-[26px] shadow-[inset_0_1px_0_var(--color-border-subtle)]">
          {/* Success icon */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-border-default bg-bg-hover">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent-green"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <h1 className="mb-1.5 text-center text-[22px] font-bold tracking-tight">
            Check your email
          </h1>
          <p className="mb-[22px] text-center text-[13.5px] leading-relaxed text-text-muted">
            We sent a password reset link to{" "}
            <span className="font-medium text-text-primary">{email}</span>.
            <br />
            Please check your inbox and follow the instructions.
          </p>

          <button
            onClick={() => setSent(false)}
            className="mb-3 w-full rounded-[14px] border border-border-strong bg-transparent px-[18px] py-3.5 text-[15px] font-medium text-text-primary transition-colors hover:bg-bg-hover"
          >
            Try another email
          </button>

          <Link
            href="/login/guest"
            className="block text-center text-[13px] text-text-muted transition-colors hover:text-text-primary"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-7">
      <div className="w-[420px] rounded-xl border border-border-strong bg-bg-secondary p-[26px] shadow-[inset_0_1px_0_var(--color-border-subtle)]">
        {/* Header */}
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
          Forgot password?
        </h1>
        <p className="mb-[22px] text-[13.5px] text-text-muted">
          Enter your email and we&apos;ll send you a reset link
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
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

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="mt-1 w-full rounded-[14px] bg-btn-primary-bg px-[18px] py-3.5 text-[15px] font-semibold text-btn-primary-text transition-opacity hover:opacity-88"
          >
            Send reset link
          </button>
        </form>

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
