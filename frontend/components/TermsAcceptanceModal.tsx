"use client";

import { useState } from "react";
import Link from "next/link";

export default function TermsAcceptanceModal({
  open,
  onAccept,
  onDecline,
}: {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [checked, setChecked] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-[460px] animate-[modalIn_0.25s_ease-out] rounded-xl border border-border-strong bg-bg-secondary p-6 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <h2 className="mb-1 text-[20px] font-bold tracking-tight">
          Terms &amp; Conditions
        </h2>
        <p className="mb-5 text-[13px] leading-relaxed text-text-secondary">
          Before continuing, please review and accept our terms.
        </p>

        {/* Scrollable summary */}
        <div className="mb-5 max-h-[220px] overflow-y-auto rounded-lg border border-border-default bg-bg-primary p-4 text-[12.5px] leading-relaxed text-text-secondary scrollbar-thin">
          <p className="mb-3">
            By using 42&nbsp;Connect you agree to follow our rules:
          </p>
          <ul className="list-disc space-y-1.5 pl-4">
            <li>
              Your account is created via 42&nbsp;OAuth. You are responsible for
              all activity under your account.
            </li>
            <li>
              You must not post illegal, harassing, or discriminatory content.
            </li>
            <li>
              We collect your 42 intra data (username, email, campus, coalition)
              and content you create on the platform.
            </li>
            <li>
              Your data is used to operate the platform and is never sold to
              third parties.
            </li>
            <li>
              You can request access, correction, or deletion of your data at
              any time.
            </li>
            <li>
              We use essential cookies only — no third-party tracking.
            </li>
            <li>
              We reserve the right to moderate content and suspend accounts that
              violate these terms.
            </li>
          </ul>
        </div>

        {/* Checkbox */}
        <label className="mb-5 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border-strong accent-accent-blue"
          />
          <span className="text-[12.5px] leading-snug text-text-secondary">
            I have read and accept the{" "}
            <Link
              href="/terms"
              target="_blank"
              className="font-medium text-accent-blue hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="font-medium text-accent-blue hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {/* Buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={onDecline}
            className="flex-1 rounded-[10px] border border-border-strong px-4 py-3 text-[13px] font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={!checked}
            className="flex-1 rounded-[10px] bg-btn-primary-bg px-4 py-3 text-[13px] font-semibold text-btn-primary-text transition-opacity hover:opacity-88 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Accept &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}
