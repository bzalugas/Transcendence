"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import Avatar from "@/components/Avatar";
import FriendsList from "@/components/FriendsList";
import ConfirmModal from "@/components/ConfirmModal";
import UserActionMenu from "@/components/UserActionMenu";
import { blockUser } from "@/lib/data/blocks";
import { useCurrentUser } from "@/lib/data/auth";
import { fileUrl } from "@/lib/data/files";
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
  onBlock?: () => void | Promise<void>;
}

const presenceColor: Record<PresenceStatus, string | undefined> = {
  online: "var(--color-accent-green)",
  away: "var(--color-away)",
  offline: undefined,
};

export default function ChannelAboutPanel({
  channel,
  members,
  onLeave,
  onBlock,
}: ChannelAboutPanelProps) {
  const { user: currentUser } = useCurrentUser();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [blockedNames, setBlockedNames] = useState<Set<string>>(new Set());
  const [activeMember, setActiveMember] = useState<ChannelMember | null>(null);
  const [activeAnchor, setActiveAnchor] = useState<HTMLElement | null>(null);
  const [activeAnchorPosition, setActiveAnchorPosition] = useState({ top: 0, left: 0 });

  const friendMembers = useMemo<Friend[]>(
    () =>
      members
        .filter((m) => !isCurrentMember(m, currentUser) && m.isFriend)
        .map((m) => ({
          initials: m.initials,
          avatarUrl: m.avatarUrl,
          name: m.username,
          level: m.level,
        })),
    [currentUser, members],
  );

  const otherMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          !isCurrentMember(m, currentUser) &&
          !m.isFriend &&
          !blockedNames.has(m.username),
      ),
    [blockedNames, currentUser, members],
  );

  const total = friendMembers.length + otherMembers.length;

  return (
    <>
      <aside className="flex w-full flex-col overflow-hidden border-l border-border-default bg-bg-secondary">
        <div className="shrink-0 px-[18px] pb-4 pt-6">
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
        </div>

        <div className="shrink-0 border-t border-border-default px-[18px] pb-3 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
              Members
            </div>
            <div className="text-[12px] text-text-dimmed">{total}</div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-4">
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
                {otherMembers.map((m) => (
                  <OtherMemberRow
                    key={m.username}
                    member={m}
                    active={activeMember?.username === m.username}
                    onSelect={(event) => {
                      const nextMember = activeMember?.username === m.username
                        ? null
                        : m;
                      const rect = event.currentTarget.getBoundingClientRect();
                      setActiveMember(nextMember);
                      setActiveAnchor(nextMember ? event.currentTarget : null);
                      setActiveAnchorPosition(
                        nextMember ? { top: rect.top, left: rect.left - 248 } : { top: 0, left: 0 },
                      );
                    }}
                  />
                ))}
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

      {activeMember && (
        <OtherMemberPopover
          member={activeMember}
          anchorElement={activeAnchor}
          anchorPosition={activeAnchorPosition}
          onClose={() => {
            setActiveMember(null);
            setActiveAnchor(null);
            setActiveAnchorPosition({ top: 0, left: 0 });
          }}
          onBlock={(name) => {
            setBlockedNames((prev) => new Set([...prev, name]));
            setActiveMember(null);
            setActiveAnchor(null);
            setActiveAnchorPosition({ top: 0, left: 0 });
            void onBlock?.();
          }}
        />
      )}

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

function isCurrentMember(member: ChannelMember, currentUser?: { id: string; username: string } | null) {
  if (member.isSelf) return true;
  if (!currentUser) return false;

  return (
    member.id === currentUser.id ||
    normalizeMemberName(member.username) === normalizeMemberName(currentUser.username)
  );
}

function normalizeMemberName(name: string) {
  return name.trim().toLowerCase();
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

function OtherMemberRow({
  member,
  active,
  onSelect,
}: {
  member: ChannelMember;
  active: boolean;
  onSelect: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const dotColor = presenceColor[member.status];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-2.5 rounded-[7px] px-2 py-1.5 text-left transition-colors hover:bg-bg-hover ${
        active ? "bg-bg-hover" : ""
      }`}
    >
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
    </button>
  );
}

function OtherMemberPopover({
  member,
  anchorElement,
  anchorPosition,
  onClose,
  onBlock,
}: {
  member: ChannelMember;
  anchorElement: HTMLElement | null;
  anchorPosition: { top: number; left: number };
  onClose: () => void;
  onBlock: (name: string) => void;
}) {
  const [showSubMore, setShowSubMore] = useState(false);
  const [confirmActionOpen, setConfirmActionOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const subMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: globalThis.MouseEvent) {
      if (confirmActionOpen) return;

      const target = event.target as Node;
      if (
        popRef.current &&
        !popRef.current.contains(target) &&
        (!subMoreRef.current || !subMoreRef.current.contains(target)) &&
        anchorElement &&
        !anchorElement.contains(target)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [anchorElement, confirmActionOpen, onClose]);

  return (
    <>
      <div
        ref={popRef}
        className="fixed z-[1000] w-[240px] overflow-hidden rounded-[10px] border border-white/[0.12] bg-[#0f0f0e] shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
        style={{ top: anchorPosition.top, left: anchorPosition.left }}
      >
        <div className="flex items-center gap-2.5 rounded-t-[8px] px-3.5 py-[14px] pb-[10px]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a1a18] text-[12px] font-medium text-white">
            {member.avatarUrl ? (
              <img
                src={fileUrl(member.avatarUrl)}
                alt={member.username}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              member.initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${member.username}`}
              onClick={onClose}
              className="inline-block text-[13.5px] font-semibold text-white hover:underline"
            >
              {member.username}
            </Link>
            <div className="mt-px text-[11px] text-[#888888]">
              Level {member.level}
            </div>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowSubMore((current) => !current);
            }}
            className="rounded-[4px] px-1.5 py-0.5 text-[16px] leading-none text-[#666666] transition-colors hover:bg-[#1a1a19] hover:text-white"
          >
            ···
          </button>
        </div>
      </div>

      {showSubMore && (
        <UserActionMenu
          ref={subMoreRef}
          username={member.username}
          anchorPosition={anchorPosition}
          onBlock={async () => {
            await blockUser(member.username);
            onBlock(member.username);
          }}
          onConfirmOpenChange={setConfirmActionOpen}
          onActionComplete={() => {
            setShowSubMore(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
