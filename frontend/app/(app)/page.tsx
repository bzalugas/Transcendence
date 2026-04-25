"use client";

import { useState } from "react";
import Post from "@/components/Post";
import ActivityCard from "@/components/ActivityCard";
import NewChannelCard from "@/components/NewChannelCard";
import FriendsPanel from "@/components/FriendsPanel";
import PanelToggleIcon from "@/components/icons/PanelToggleIcon";
import { getHomeFeed } from "@/lib/data/feed";
import { getCurrentUser } from "@/lib/data/auth";

export default function HomePage() {
  const [showPanel, setShowPanel] = useState(true);
  const currentUser = getCurrentUser();
  const feed = getHomeFeed();

  return (
    <>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-bg-tertiary px-8 py-7">
        <div className="mb-0.5 flex items-center justify-between">
          <div className="text-[19px] font-medium">
            Hello, {currentUser.username}
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

        {feed.map((item) => {
          switch (item.kind) {
            case "post":
              return <Post key={item.post.id} {...item.post} />;
            case "new-channel":
              return (
                <NewChannelCard
                  key={item.announcement.id}
                  {...item.announcement}
                />
              );
            case "activity":
              return (
                <ActivityCard key={item.activity.id} activity={item.activity} />
              );
          }
        })}
      </div>

      {showPanel && (
        <div className="flex w-[260px] shrink-0">
          <FriendsPanel />
        </div>
      )}
    </>
  );
}
