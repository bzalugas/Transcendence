"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import CohortStatsPanel from "@/components/CohortStatsPanel";
import FriendsList from "@/components/FriendsList";
import { getFriends } from "@/lib/data/friends";
import type { Friend } from "@/lib/types";

export default function FriendsPanel({
  topSlot,
  friends: friendsProp,
}: {
  topSlot?: ReactNode;
  friends?: Friend[];
} = {}) {
  const [fetchedFriends, setFetchedFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(friendsProp === undefined);

  useEffect(() => {
    if (friendsProp !== undefined) return;

    let active = true;

    getFriends()
      .then((items) => {
        if (active) setFetchedFriends(items);
      })
      .catch(() => {
        if (active) setFetchedFriends([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [friendsProp]);

  const friends = friendsProp ?? fetchedFriends;

  return (
    <aside className="flex w-full flex-col overflow-hidden border-l border-border-default bg-bg-secondary">
      {topSlot && (
        <div className="shrink-0 border-b border-border-default bg-bg-secondary px-[18px] py-5">
          {topSlot}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-[18px] py-6">
        <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
          Friends
        </div>
        {loading ? (
          <p className="text-[12.5px] italic text-text-dimmed">Loading friends...</p>
        ) : friends.length > 0 ? (
          <FriendsList friends={friends} />
        ) : (
          <p className="text-[12.5px] italic text-text-dimmed">No friends yet.</p>
        )}
      </div>

      {/* Cohort stats (fixed footer) */}
      <div className="sticky bottom-0 shrink-0 border-t border-border-default bg-bg-secondary px-[18px] py-4">
        <CohortStatsPanel />

        {/* Legal links */}
        <div className="mt-4 flex justify-center gap-3 border-t border-border-default pt-3 text-[10.5px] text-text-dimmed">
          <Link href="/privacy" className="transition-colors hover:text-text-secondary">Privacy</Link>
          <span>·</span>
          <Link href="/terms" className="transition-colors hover:text-text-secondary">Terms</Link>
        </div>
      </div>
    </aside>
  );
}
