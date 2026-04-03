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
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-bg-tertiary px-8 py-7">
        <div className="mb-0.5 flex items-center justify-between">
          <div className="text-[19px] font-medium">
            Hello, {currentUser.username} 👋
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
        <div className="mb-1.5 text-[13px] text-text-muted">
          What&apos;s happening in your channels
        </div>

        <Post {...posts[0]} />

        <NewRoomCard
          creatorInitials="mt"
          creatorName="mtellal"
          time="2h ago"
          roomName="Cats"
          roomColor="#c8870a"
          memberCount={1}
        />

        <ActivityCard
          text={
            <>
              <strong className="font-medium text-text-primary">svidal</strong>{" "}
              passed{" "}
              <strong className="font-medium text-text-primary">
                minishell
              </strong>
            </>
          }
          time="4h ago"
        />

        <Post {...posts[1]} />

        <ActivityCard
          text={
            <>
              <strong className="font-medium text-text-primary">pdupont</strong>{" "}
              passed the{" "}
              <strong className="font-medium text-text-primary">
                exam rank 05
              </strong>
            </>
          }
          time="yesterday"
        />
      </div>

      {showPanel && (
        <div className="flex w-[260px] shrink-0">
          <FriendsPanel />
        </div>
      )}
    </>
  );
}
