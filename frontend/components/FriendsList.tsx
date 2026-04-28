"use client";

import { useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import FriendPopover from "@/components/FriendPopover";
import { removeFriend } from "@/lib/data/friends";
import type { Friend } from "@/lib/types";

type FriendsListProps = {
  friends: Friend[];
};

export default function FriendsList({ friends: initialFriends }: FriendsListProps) {
  const [displayedFriends, setDisplayedFriends] = useState<Friend[]>(initialFriends);
  const [activeFriend, setActiveFriend] = useState<Friend | null>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  function handleRemove(name: string) {
    removeFriend(name);
    setDisplayedFriends((prev) => prev.filter((f) => f.name !== name));
    setActiveFriend(null);
  }

  return (
    <>
      <div className="flex flex-col gap-0.5">
        {displayedFriends.map((f) => (
          <button
            key={f.name}
            ref={(el) => { if (el) buttonRefs.current.set(f.name, el); }}
            type="button"
            onClick={() => setActiveFriend(activeFriend?.name === f.name ? null : f)}
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
          anchorRef={{ current: buttonRefs.current.get(activeFriend.name) ?? null }}
          onClose={() => setActiveFriend(null)}
          onRemove={() => handleRemove(activeFriend.name)}
        />
      )}
    </>
  );
}
