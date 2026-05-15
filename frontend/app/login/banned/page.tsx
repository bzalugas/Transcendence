"use client";

import Link from "next/link";
import Logo42 from "@/components/Logo42";
import { authClient } from "@/lib/auth-client";

export default function BannedAccountPage() {
  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4 sm:p-7">
      <div className="w-full max-w-[460px] rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <Logo42 className="h-8 w-auto" />
          <h1 className="text-[28px] font-bold tracking-tight text-text-primary sm:text-[32px]">
            Account suspended
          </h1>
        </div>

        <div className="rounded-[12px] border border-danger/25 bg-danger/10 px-4 py-3">
          <div className="text-[14px] font-semibold text-danger">
            You have been banned from this app.
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
            Your account can no longer access Transcendence. If you believe this is a
            mistake, please contact an administrator.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex-1 rounded-[12px] bg-btn-primary-bg px-4 py-3 text-[13.5px] font-semibold text-btn-primary-text transition-opacity hover:opacity-90"
          >
            Sign out
          </button>
          <Link
            href="/terms"
            className="flex-1 rounded-[12px] border border-border-strong px-4 py-3 text-center text-[13.5px] font-medium text-text-primary transition-colors hover:bg-bg-hover"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
