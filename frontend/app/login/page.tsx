"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo42 from "@/components/Logo42";
import TermsAcceptanceModal from "@/components/TermsAcceptanceModal";

const features = [
  {
    title: "Rooms",
    description: "Join topic-based groups (photo, cycling, AI, and more).",
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
      <div className="w-[560px] rounded-xl border border-border-strong bg-bg-secondary p-[26px] shadow-[inset_0_1px_0_var(--color-border-subtle)]">
        <h1 className="mb-2 text-[26px] font-bold tracking-tight">
          42 Connect
        </h1>
        <p className="mb-[18px] text-[13.5px] leading-relaxed text-text-secondary">
          A social intranet for students built around{" "}
          <strong className="font-semibold text-text-primary">
            shared interests
          </strong>
          : rooms, posts and events, messaging, and profiles—so you can find
          your people on campus.
        </p>

        <div className="mb-[18px] grid grid-cols-2 gap-x-2.5 gap-y-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[10px] border border-border-strong bg-bg-primary px-3 py-3.5"
            >
              <div className="mb-1.5 text-[13.5px] font-semibold">
                {feature.title}
              </div>
              <div className="text-[12.5px] leading-normal text-text-tertiary">
                {feature.description}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSignIn}
          className="flex w-full items-center justify-center gap-2.5 rounded-[14px] bg-btn-primary-bg px-[18px] py-4 text-base font-semibold text-btn-primary-text transition-opacity hover:opacity-88"
        >
          <Logo42 className="h-[22px] w-auto" />
          <span>Sign in with 42</span>
        </button>

        <div className="my-[14px] flex items-center gap-3">
          <div className="h-px flex-1 bg-border-default" />
          <span className="text-[11.5px] text-text-dimmed">or</span>
          <div className="h-px flex-1 bg-border-default" />
        </div>

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

        <p className="mt-[18px] text-center text-[11.5px] leading-snug text-text-tertiary">
          Independent project, not affiliated with the 42 school.
        </p>
        <div className="mt-3 flex justify-center gap-3 text-[11px] text-text-muted">
          <Link href="/privacy" className="hover:text-text-secondary">
            Privacy Policy
          </Link>
          <span>|</span>
          <Link href="/terms" className="hover:text-text-secondary">
            Terms of Service
          </Link>
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
