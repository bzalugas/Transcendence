"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Friend } from "@/lib/types";
import { getAllChannels } from "@/lib/data/channels";
import { addChatMessage, setPendingConv } from "@/lib/data/messages";
import { useCurrentUser } from "@/lib/data/auth";
import GameModal from "@/components/GameModal";
import ConfirmActionModal, { type ConfirmAction } from "@/components/ConfirmActionModal";

type FriendPopoverProps = {
  friend: Friend;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onRemove?: () => void;
};

export default function FriendPopover({ friend, anchorRef, onClose, onRemove }: FriendPopoverProps) {
  const router = useRouter();
  const channels = getAllChannels();
  const { user: currentUser } = useCurrentUser();
  const [msgText, setMsgText] = useState("");
  const popRef = useRef<HTMLDivElement>(null);
  const subMoreRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [showSubMore, setShowSubMore] = useState(false);
  const [showSubChannels, setShowSubChannels] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.top, left: rect.left - 248 });
  }, [anchorRef]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (confirmAction || showGameModal) return;
      const target = e.target as Node;
      if (
        popRef.current && !popRef.current.contains(target) &&
        (!subMoreRef.current || !subMoreRef.current.contains(target)) &&
        anchorRef.current && !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose, anchorRef, confirmAction, showGameModal]);

  const initials = friend.initials ?? friend.name.slice(0, 2);

  function handleSendMessage() {
    const text = msgText.trim();
    if (!text || !currentUser) return;
    const convId = `fr-${friend.name}`;
    const now = new Date();
    addChatMessage(convId, {
      sender: currentUser.username,
      initials: currentUser.initials,
      text,
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      me: true,
    });
    setPendingConv({
      id: convId,
      name: friend.name,
      initials: friend.initials,
      avatarUrl: friend.avatarUrl,
      level: friend.level,
    });
    onClose();
    router.push("/messages");
  }

  return (
    <>
      {/* Main popover */}
      <div
        ref={popRef}
        className="fixed z-[1000] w-[240px] overflow-hidden rounded-[10px] border border-white/[0.12] bg-[#0f0f0e] shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
        style={{ top: pos.top, left: pos.left }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 rounded-t-[8px] px-3.5 py-[14px] pb-[10px]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a1a18] text-[12px] font-medium text-white">
            {friend.avatarUrl
              ? <img src={friend.avatarUrl} alt={friend.name} className="h-9 w-9 rounded-full object-cover" />
              : initials}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${friend.name}`}
              onClick={onClose}
              className="inline-block text-[13.5px] font-semibold text-white hover:underline"
            >
              {friend.name}
            </Link>
            <div className="mt-px text-[11px] text-[#888888]">Level {friend.level}</div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowSubMore(!showSubMore); setShowSubChannels(false); }}
            className="rounded-[4px] px-1.5 py-0.5 text-[16px] leading-none text-[#666666] transition-colors hover:bg-[#1a1a19] hover:text-white"
          >
            ···
          </button>
        </div>

        <div className="h-px bg-white/[0.08]" />

        {/* Message input */}
        <div className="px-3.5 py-2.5">
          <input
            type="text"
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
            placeholder="Send a message…"
            className="w-full rounded-[6px] border border-white/10 bg-[#1a1a19] px-2.5 py-2 text-[12px] text-white outline-none placeholder:text-[#666666] focus:border-white/20"
          />
        </div>

        <div className="h-px bg-white/[0.08]" />

        {/* Actions */}
        <div className="px-2 py-1.5">
          <button
            type="button"
            onClick={() => setShowGameModal(true)}
            className="flex w-full items-center gap-2 rounded-[5px] px-2 py-[7px] text-[12.5px] text-[#c9c6c1] transition-colors hover:bg-[#1a1a19] hover:text-white"
          >
            Play a game
          </button>
        </div>
      </div>

      {/* Sub-popover (3 dots) */}
      {showSubMore && (
        <div
          ref={subMoreRef}
          className="fixed z-[1001] w-[220px] rounded-[10px] border border-white/[0.12] bg-[#0f0f0e] px-2 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
          style={{ top: pos.top, left: pos.left + 248 }}
        >
          <div
            className="relative"
            onMouseEnter={() => setShowSubChannels(true)}
            onMouseLeave={() => setShowSubChannels(false)}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-[5px] px-2 py-[7px] text-[12.5px] text-[#c9c6c1] transition-colors hover:bg-[#1a1a19] hover:text-white"
            >
              <span className="text-[10px] text-[#666666]">◂</span>
              Invite to a channel
            </button>
            {showSubChannels && (
              <div className="absolute right-full top-0 mr-1 w-[200px] overflow-hidden rounded-[10px] border border-white/[0.12] bg-[#0f0f0e] px-2 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
                {channels.map((r) => (
                  <button
                    key={r.slug}
                    type="button"
                    onClick={() => { setShowSubChannels(false); onClose(); }}
                    className="flex w-full items-center gap-2 rounded-[5px] px-2 py-[7px] text-[12.5px] text-[#c9c6c1] transition-colors hover:bg-[#1a1a19] hover:text-white"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} />
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="my-1 h-px bg-white/[0.08]" />
          <button
            type="button"
            onClick={() => { setShowSubMore(false); setConfirmAction("remove"); }}
            className="flex w-full items-center gap-2 rounded-[5px] px-2 py-[7px] text-[12.5px] text-[#e84545] transition-colors hover:bg-[rgba(232,69,69,0.1)]"
          >
            Remove friend
          </button>
          <button
            type="button"
            onClick={() => { setShowSubMore(false); setConfirmAction("block"); }}
            className="flex w-full items-center gap-2 rounded-[5px] px-2 py-[7px] text-[12.5px] text-[#e84545] transition-colors hover:bg-[rgba(232,69,69,0.1)]"
          >
            Block
          </button>
          <button
            type="button"
            onClick={() => { setShowSubMore(false); setConfirmAction("report"); }}
            className="flex w-full items-center gap-2 rounded-[5px] px-2 py-[7px] text-[12.5px] text-[#e84545] transition-colors hover:bg-[rgba(232,69,69,0.1)]"
          >
            Report
          </button>
        </div>
      )}

      {showGameModal && (
        <GameModal
          friendName={friend.name}
          onClose={() => { setShowGameModal(false); onClose(); }}
        />
      )}

      {confirmAction && (
        <ConfirmActionModal
          action={confirmAction}
          friendName={friend.name}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            setConfirmAction(null);
            if (confirmAction === "remove" || confirmAction === "block") {
              onRemove?.();
            }
            onClose();
          }}
        />
      )}
    </>
  );
}
