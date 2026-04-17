"use client";

import { useState } from "react";
import Post from "@/components/Post";
import ActivityCard from "@/components/ActivityCard";
import NewRoomCard from "@/components/NewRoomCard";
import FriendsPanel from "@/components/FriendsPanel";
import PanelToggleIcon from "@/components/icons/PanelToggleIcon";
import { posts } from "@/lib/mocks/posts";
import { currentUser } from "@/lib/mocks/users";

export default function HomePage() {
  const [showPanel, setShowPanel] = useState(true);

  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto bg-bg-tertiary">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pb-4 pt-7">
          <div>
            <div className="text-[19px] font-medium">
              Hello, {currentUser.username}
            </div>
            <div className="mt-0.5 text-[12.5px] text-text-muted">
              What&apos;s happening in your channels
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPanel(!showPanel)}
            className={`flex items-center rounded-[5px] p-1 transition-colors hover:bg-bg-hover hover:text-text-primary ${
              showPanel ? "text-text-dimmed" : "bg-bg-hover text-text-primary"
            }`}
            title="Toggle panel"
          >
            <PanelToggleIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Activity banner — bg plus clair que le feed */}
        <div className="mx-8 mb-5 rounded-xl border border-border-default bg-bg-secondary px-4 py-3">
          <div className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
            Recent activity
          </div>
          <div className="flex flex-col gap-2">
            <ActivityCard
              text={
                <>
                  <strong className="font-medium text-text-primary">svidal</strong>{" "}
                  passed{" "}
                  <strong className="font-medium text-text-primary">minishell</strong>
                </>
              }
              time="4h ago"
            />
            <ActivityCard
              text={
                <>
                  <strong className="font-medium text-text-primary">pdupont</strong>{" "}
                  passed the{" "}
                  <strong className="font-medium text-text-primary">exam rank 05</strong>
                </>
              }
              time="yesterday"
            />
            <NewRoomCard
              creatorInitials="mt"
              creatorName="mtellal"
              time="2h ago"
              roomName="Cats"
              roomColor="#c8870a"
              memberCount={1}
            />
          </div>
        </div>

        {/* Feed — fond plus sombre, cards ressortent */}
        <div className="flex flex-col gap-3 px-8 pb-7">
          <Post {...posts[0]} />
          <Post {...posts[1]} />
        </div>
      </div>

      {showPanel && (
        <div className="flex w-[260px] shrink-0">
          <FriendsPanel />
        </div>
      )}
    </>
  );
}
