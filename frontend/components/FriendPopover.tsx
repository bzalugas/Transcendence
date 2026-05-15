"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Friend } from "@/lib/types";
import { addChatMessage, setPendingConv } from "@/lib/data/messages";
import { useCurrentUser } from "@/lib/data/auth";
import { fileUrl } from "@/lib/data/files";
import GameModal from "@/components/GameModal";
import UserActionMenu from "@/components/UserActionMenu";

type FriendPopoverProps = {
  friend: Friend;
  anchorElement: HTMLElement | null;
  anchorPosition: { top: number; left: number };
  onClose: () => void;
  onRemove?: () => void | Promise<void>;
  onBlock?: () => void | Promise<void>;
};

export default function FriendPopover({
  friend,
  anchorElement,
  anchorPosition,
  onClose,
  onRemove,
  onBlock,
}: FriendPopoverProps) {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const [msgText, setMsgText] = useState("");
  const popRef = useRef<HTMLDivElement>(null);
  const subMoreRef = useRef<HTMLDivElement>(null);
  const [showSubMore, setShowSubMore] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [confirmActionOpen, setConfirmActionOpen] = useState(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (confirmActionOpen || showGameModal) return;
      const target = e.target as Node;
      if (
        popRef.current && !popRef.current.contains(target) &&
        (!subMoreRef.current || !subMoreRef.current.contains(target)) &&
        anchorElement && !anchorElement.contains(target)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose, anchorElement, confirmActionOpen, showGameModal]);

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
        style={{ top: anchorPosition.top, left: anchorPosition.left }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 rounded-t-[8px] px-3.5 py-[14px] pb-[10px]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a1a18] text-[12px] font-medium text-white">
            {friend.avatarUrl
              ? <img src={fileUrl(friend.avatarUrl)} alt={friend.name} className="h-9 w-9 rounded-full object-cover" />
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
          {(onRemove || onBlock) && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowSubMore(!showSubMore); }}
              className="rounded-[4px] px-1.5 py-0.5 text-[16px] leading-none text-[#666666] transition-colors hover:bg-[#1a1a19] hover:text-white"
            >
              ···
            </button>
          )}
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

      {showSubMore && (onRemove || onBlock) && (
        <UserActionMenu
          ref={subMoreRef}
          username={friend.name}
          anchorPosition={anchorPosition}
          onRemove={onRemove}
          onBlock={onBlock}
          onConfirmOpenChange={setConfirmActionOpen}
          onActionComplete={() => {
            setShowSubMore(false);
            onClose();
          }}
        />
      )}

      {showGameModal && (
        <GameModal
          friendName={friend.name}
          onClose={() => { setShowGameModal(false); onClose(); }}
        />
      )}

    </>
  );
}
