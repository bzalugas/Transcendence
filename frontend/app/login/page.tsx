"use client";

import { useState } from "react";
import Link from "next/link";
import Logo42 from "@/components/Logo42";
import TermsAcceptanceModal from "@/components/TermsAcceptanceModal";
import { authClient } from "@/lib/auth-client";

const FRONTEND_BASE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:8080";

const features = [
  {
    title: "Channels",
    description: "Join topic-based channels (photo, cycling, AI, and more).",
  },
  {
    title: "Feed",
    description: "Posts, events, and what's happening across your channels.",
  },
  {
    title: "Messaging",
    description: "Direct messages and group chats with classmates.",
  },
  {
    title: "Profile",
    description: "Favorite interests, friends, and recent activity.",
  },
];

export default function LoginPage() {
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = () => {
    setError("");
    const accepted = localStorage.getItem("terms_accepted");
    if (accepted === "true") {
      signInWith42();
    } else {
      setShowTerms(true);
    }
  };

  // Starts the 42 OAuth flow through better-auth and reports provider errors.
  const signInWith42 = async () => {
    setLoading(true);
    setError("");

    const { error } = await authClient.signIn.social({
      provider: "42school",
      callbackURL: FRONTEND_BASE_URL,
      newUserCallbackURL: FRONTEND_BASE_URL,
    });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Sign in failed.");
    }
  };

  const handleAccept = () => {
    localStorage.setItem("terms_accepted", "true");
    setShowTerms(false);
    signInWith42();
  };

  const handleDecline = () => {
    setShowTerms(false);
  };

  return (
    <div className="flex h-full items-center justify-center p-7">
      <div className="w-[480px] rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Logo42 className="h-8 w-auto" />
          <h1 className="text-[32px] font-bold tracking-tight text-text-primary">
            Connect
          </h1>
        </div>

        <p className="mb-8 text-[14px] leading-relaxed text-text-tertiary">
          A social intranet for students built around shared interests: rooms, posts, messaging, and profiles—so you can find your people on campus.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
            {error}
          </div>
        )}

        {/* Primary CTA */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2.5 rounded-[14px] bg-btn-primary-bg px-[18px] py-4 text-base font-semibold text-btn-primary-text transition-opacity hover:opacity-88"
        >
          <Logo42 className="h-[20px] w-auto" />
          <span>Sign in with 42</span>
        </button>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11.5px] text-text-dimmed">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Secondary CTA */}
        <Link
          href="/login/guest"
          className="flex w-full items-center justify-center gap-2.5 rounded-[14px] border border-border-strong bg-transparent px-[18px] py-4 text-[15px] font-medium text-text-primary transition-colors hover:bg-bg-hover"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Continue as Guest</span>
        </Link>

        {/* Footer */}
        <div className="mt-8 border-t border-white/10 pt-5 text-center">
          <p className="mb-2 text-[11.5px] text-text-dimmed">
            Independent project, not affiliated with 42 school.
          </p>
          <div className="flex justify-center gap-3 text-[11px] text-text-dimmed">
            <Link href="/privacy" className="hover:text-text-tertiary">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-text-tertiary">Terms of Service</Link>
          </div>
        </div>
      </div>

      <TermsAcceptanceModal
        open={showTerms}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </div>
  );
}
