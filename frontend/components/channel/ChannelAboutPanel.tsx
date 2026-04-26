"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import FriendsList from "@/components/FriendsList";
import ConfirmModal from "@/components/ConfirmModal";
import type {
  Channel,
  ChannelMember,
  Friend,
  PresenceStatus,
} from "@/lib/types";

interface ChannelAboutPanelProps {
  channel: Channel;
  members: ChannelMember[];
  onLeave: () => void;
}

const presenceColor: Record<PresenceStatus, string | undefined> = {
  online: "var(--color-accent-green)",
  away: "var(--color-away)",
  offline: undefined,
};

const VISIBLE_OTHERS = 4;

export default function ChannelAboutPanel({
  channel,
  members,
  onLeave,
}: ChannelAboutPanelProps) {
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showAllOthers, setShowAllOthers] = useState(false);

  const friendMembers = useMemo<Friend[]>(
    () =>
      members
        .filter((m) => !m.isSelf && m.isFriend)
        .map((m) => ({
          initials: m.initials,
          avatarUrl: m.avatarUrl,
          name: m.username,
          level: m.level,
        })),
    [members],
  );

  const otherMembers = useMemo(
    () => members.filter((m) => !m.isSelf && !m.isFriend),
    [members],
  );

  const total = channel.memberCount ?? members.length;
  const visibleOthers = showAllOthers
    ? otherMembers
    : otherMembers.slice(0, VISIBLE_OTHERS);

  return (
    <>
      <aside className="flex w-full flex-col overflow-hidden border-l border-border-default bg-bg-secondary">
        <div className="flex-1 overflow-y-auto px-[18px] py-6">
          <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
            About
          </div>

          {channel.description && (
            <div className="rounded-lg border border-border-subtle bg-bg-tertiary p-3">
              <p className="text-[12.5px] leading-relaxed text-text-tertiary">
                {channel.description}
              </p>
            </div>
          )}

          <div className="py-2">
            {channel.createdAt && (
              <InfoRow label="Created" value={channel.createdAt} />
            )}
            {channel.postCount !== undefined && (
              <InfoRow label="Posts" value={String(channel.postCount)} />
            )}
          </div>

          <div className="my-4 h-px bg-border-default" />

          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
              Members
            </div>
            <div className="text-[12px] text-text-dimmed">{total}</div>
          </div>

          {friendMembers.length > 0 && (
            <>
              <div className="mb-1 px-2 text-[10.5px] uppercase tracking-wider text-text-dimmed">
                Friends
              </div>
              <FriendsList friends={friendMembers} />
            </>
          )}

          {otherMembers.length > 0 && (
            <>
              <div className="mb-1 mt-3 px-2 text-[10.5px] uppercase tracking-wider text-text-dimmed">
                Others
              </div>
              <div className="flex flex-col gap-0.5">
                {visibleOthers.map((m) => (
                  <OtherMemberRow key={m.username} member={m} />
                ))}
                {otherMembers.length > VISIBLE_OTHERS && (
                  <button
                    type="button"
                    onClick={() => setShowAllOthers((v) => !v)}
                    className="px-2 py-1.5 text-left text-[12px] text-text-dimmed transition-colors hover:text-text-tertiary"
                  >
                    {showAllOthers
                      ? "Show less"
                      : `Show all ${otherMembers.length} others…`}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-border-default px-[18px] py-4">
          <button
            type="button"
            onClick={() => setConfirmLeave(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-[7px] border border-danger/30 px-3 py-2.5 text-[12.5px] text-danger transition-colors hover:bg-danger/10"
          >
            Leave channel
          </button>
        </div>
      </aside>

      {confirmLeave && (
        <ConfirmModal
          title={`Leave ${channel.label}?`}
          description={
            <>
              You&apos;ll stop seeing posts from{" "}
              <span className="font-medium text-white">{channel.label}</span> in
              your feed. You can join back later.
            </>
          }
          confirmLabel="Leave"
          tone="danger"
          onCancel={() => setConfirmLeave(false)}
          onConfirm={() => {
            setConfirmLeave(false);
            onLeave();
          }}
        />
      )}
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className="text-[12px] text-text-muted">{label}</span>
      <span className="text-[12.5px] font-medium text-text-primary">
        {value}
      </span>
    </div>
  );
}

function OtherMemberRow({ member }: { member: ChannelMember }) {
  const dotColor = presenceColor[member.status];
  return (
    <Link href={`/profile/${member.username}`} className="flex items-center gap-2.5 rounded-[7px] px-2 py-1.5 transition-colors hover:bg-bg-hover">
      <div className="relative">
        <Avatar
          initials={member.initials}
          avatarUrl={member.avatarUrl}
          size="md"
        />
        {dotColor && (
          <span
            className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-bg-secondary"
            style={{ background: dotColor }}
          />
        )}
      </div>
      <span className="flex-1 text-[12.5px] text-text-tertiary">
        {member.username}
      </span>
      <span className="text-[11px] text-text-dimmed">lvl {member.level}</span>
    </Link>
  );
}
