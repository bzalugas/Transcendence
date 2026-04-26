"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo42 from "@/components/Logo42";
import TermsAcceptanceModal from "@/components/TermsAcceptanceModal";

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
  const router = useRouter();
  const [showTerms, setShowTerms] = useState(false);

  const handleSignIn = () => {
    const accepted = localStorage.getItem("terms_accepted");
    if (accepted === "true") {
      router.push("/");
    } else {
      setShowTerms(true);
    }
  };

  const handleAccept = () => {
    localStorage.setItem("terms_accepted", "true");
    setShowTerms(false);
    router.push("/");
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

        {/* Primary CTA */}
        <button
          onClick={handleSignIn}
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
