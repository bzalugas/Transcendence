"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import { useCurrentUser } from "@/lib/data/auth";

interface ChannelComposerProps {
  channelLabel: string;
  onPost: (body: string) => void;
}

export default function ChannelComposer({ channelLabel, onPost }: ChannelComposerProps) {
  const [text, setText] = useState("");
  const { user: currentUser } = useCurrentUser();

  function handlePost() {
    const body = text.trim();
    if (!body || !currentUser) return;
    onPost(body);
    setText("");
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <Avatar initials={currentUser?.initials ?? "me"} avatarUrl={currentUser?.avatarUrl} size="md" />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handlePost(); }}
          placeholder={`Share something with ${channelLabel}...`}
          className="flex-1 bg-transparent text-[13.5px] text-text-primary outline-none placeholder:text-text-dimmed"
        />
        <button
          type="button"
          title="Attach photo"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-text-dimmed transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px]"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handlePost}
          disabled={!text.trim()}
          className="rounded-[7px] bg-text-primary px-3.5 py-1.5 text-[12.5px] font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Post
        </button>
      </div>
    </div>
  );
}
