"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import FriendPopover from "@/components/FriendPopover";
import { blockUser } from "@/lib/data/blocks";
import { removeFriend } from "@/lib/data/friends";
import type { Friend } from "@/lib/types";

type FriendsListProps = {
  friends: Friend[];
};

export default function FriendsList({ friends: initialFriends }: FriendsListProps) {
  const [activeFriend, setActiveFriend] = useState<Friend | null>(null);
  const [activeAnchor, setActiveAnchor] = useState<HTMLElement | null>(null);
  const [activeAnchorPosition, setActiveAnchorPosition] = useState({ top: 0, left: 0 });
  const [removedNames, setRemovedNames] = useState<Set<string>>(new Set());
  const displayedFriends = initialFriends.filter((friend) => !removedNames.has(friend.name));

  // Removes a friend through the API and reflects it in the visible list.
  async function handleRemove(name: string) {
    await removeFriend(name);
    setRemovedNames((prev) => new Set([...prev, name]));
    setActiveFriend(null);
    setActiveAnchor(null);
    setActiveAnchorPosition({ top: 0, left: 0 });
  }

  async function handleBlock(name: string) {
    await blockUser(name);
    setRemovedNames((prev) => new Set([...prev, name]));
    setActiveFriend(null);
    setActiveAnchor(null);
    setActiveAnchorPosition({ top: 0, left: 0 });
  }

  return (
    <>
      <div className="flex flex-col gap-0.5">
        {displayedFriends.map((f) => (
          <button
            key={f.name}
            type="button"
            onClick={(event) => {
              const nextFriend = activeFriend?.name === f.name ? null : f;
              const rect = event.currentTarget.getBoundingClientRect();
              setActiveFriend(nextFriend);
              setActiveAnchor(nextFriend ? event.currentTarget : null);
              setActiveAnchorPosition(
                nextFriend ? { top: rect.top, left: rect.left - 248 } : { top: 0, left: 0 },
              );
            }}
            className={`flex items-center gap-[9px] rounded-[7px] px-2 py-[5px] transition-colors hover:bg-bg-hover ${
              activeFriend?.name === f.name ? "bg-bg-hover" : ""
            }`}
          >
            <Avatar initials={f.initials} avatarUrl={f.avatarUrl} size="md" />
            <span className="flex-1 text-left text-[12.5px] text-text-primary">{f.name}</span>
            <span className="text-[11px] text-text-dimmed">lvl {f.level}</span>
          </button>
        ))}
      </div>

      {activeFriend && (
        <FriendPopover
          friend={activeFriend}
          anchorElement={activeAnchor}
          anchorPosition={activeAnchorPosition}
          onClose={() => {
            setActiveFriend(null);
            setActiveAnchor(null);
            setActiveAnchorPosition({ top: 0, left: 0 });
          }}
          onRemove={() => handleRemove(activeFriend.name)}
          onBlock={() => handleBlock(activeFriend.name)}
        />
      )}
    </>
  );
}
