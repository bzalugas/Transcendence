"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import { getFriends } from "@/lib/data/friends";
import type { Channel, ChannelMember, Friend } from "@/lib/types";

interface ChannelInviteModalProps {
  channel: Channel;
  members: ChannelMember[];
  onClose: () => void;
}

export default function ChannelInviteModal({
  channel,
  members,
  onClose,
}: ChannelInviteModalProps) {
  const [search, setSearch] = useState("");
  const [sent, setSent] = useState<Set<string>>(new Set());

  const friends = getFriends();
  const memberNames = useMemo(
    () => new Set(members.map((m) => m.username)),
    [members],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => f.name.toLowerCase().includes(q));
  }, [friends, search]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleInvite(friend: Friend) {
    setSent((prev) => {
      const next = new Set(prev);
      next.add(friend.name);
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-[4px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-[380px] max-h-[520px] flex-col overflow-hidden rounded-[14px] border border-white/[0.12] bg-bg-secondary shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-[18px]">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: channel.color }}
            />
            <div className="text-[16px] font-semibold text-text-primary">
              Invite to {channel.label}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] px-2 py-0.5 text-[18px] leading-none text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends..."
            autoFocus
            className="w-full rounded-[7px] border border-white/10 bg-bg-hover px-3 py-2 text-[13px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-white/20"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3.5">
          {filtered.length === 0 ? (
            <div className="px-2 py-8 text-center text-[12.5px] text-text-dimmed">
              No friend matches &ldquo;{search}&rdquo;.
            </div>
          ) : (
            filtered.map((f) => {
              const isMember = memberNames.has(f.name);
              const isSent = sent.has(f.name);
              return (
                <div
                  key={f.name}
                  className="flex items-center gap-2.5 rounded-[7px] px-2 py-2 transition-colors hover:bg-bg-hover"
                >
                  <Avatar initials={f.initials} avatarUrl={f.avatarUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-text-primary">
                      {f.name}
                    </div>
                    <div className="text-[11px] text-text-dimmed">
                      Level {f.level}
                    </div>
                  </div>
                  {isMember ? (
                    <span className="cursor-default rounded-[6px] border border-border-subtle bg-bg-hover px-3 py-[5px] text-[11.5px] text-text-dimmed">
                      Member
                    </span>
                  ) : isSent ? (
                    <span className="cursor-default rounded-[6px] border border-accent-green/30 bg-accent-green/10 px-3 py-[5px] text-[11.5px] font-medium text-accent-green">
                      Sent
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleInvite(f)}
                      className="rounded-[6px] bg-text-primary px-3 py-[5px] text-[11.5px] font-medium text-bg-primary transition-opacity hover:opacity-90"
                    >
                      Invite
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
