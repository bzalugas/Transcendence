"use client";

import { useCallback, useEffect, useState } from "react";
import Post from "@/components/Post";
import FriendsPanel from "@/components/FriendsPanel";
import PanelToggleIcon from "@/components/icons/PanelToggleIcon";
import { getHomeFeed, type HomePostFeedItem } from "@/lib/data/feed";
import { listenForChannelsUpdated } from "@/lib/data/channel-events";
import { appendUniqueComment } from "@/lib/data/comments";
import { useCurrentUser } from "@/lib/data/auth";
import {
  createChannelReply,
  deleteChannelPost,
  getJoinedChannels,
  joinChannelRealtime,
  leaveChannelRealtime,
  subscribeToChannelPosts,
  subscribeToChannelReplies,
  updateChannelPost,
} from "@/lib/data/channels";
import type { Comment } from "@/lib/types";

export default function HomePage() {
  const [showPanel, setShowPanel] = useState(true);
  const [feed, setFeed] = useState<HomePostFeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState("");
  const { user: currentUser } = useCurrentUser();

  const appendCommentToFeed = useCallback(
    (postId: string, comment: Comment) => {
      setFeed((items) =>
        items.map((item) =>
          item.post.id === postId
            ? {
                ...item,
                post: {
                  ...item.post,
                  comments: appendUniqueComment(item.post.comments, comment),
                },
              }
            : item,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    let active = true;

    function loadHomeFeed() {
      setLoadingFeed(true);
      getHomeFeed()
        .then((items) => {
          if (!active) return;
          setFeed(items);
          setFeedError("");
        })
        .catch(() => {
          if (!active) return;
          setFeed([]);
          setFeedError("Unable to load your feed.");
        })
        .finally(() => {
          if (active) setLoadingFeed(false);
        });
    }

    loadHomeFeed();
    const stopListening = listenForChannelsUpdated(loadHomeFeed);

    return () => {
      active = false;
      stopListening();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const joinedSlugs = new Set<string>();

    getJoinedChannels()
      .then((channels) => {
        if (!active) return;

        for (const channel of channels) {
          joinedSlugs.add(channel.slug);
          joinChannelRealtime(channel.slug);
        }
      })
      .catch(() => {});

    const unsubscribePosts = subscribeToChannelPosts((event) => {
      if (!joinedSlugs.has(event.slug)) return;

      setFeed((items) => {
        if (items.some((item) => item.post.id === event.post.id)) return items;

        return [{ kind: "post" as const, post: event.post }, ...items].sort(
          (first, second) => postTimestamp(second) - postTimestamp(first),
        );
      });
    });
    const unsubscribeReplies = subscribeToChannelReplies((event) => {
      if (!joinedSlugs.has(event.slug)) return;

      appendCommentToFeed(event.postId, event.comment);
    });

    return () => {
      active = false;
      unsubscribePosts();
      unsubscribeReplies();
      for (const slug of joinedSlugs) {
        leaveChannelRealtime(slug);
      }
    };
  }, [appendCommentToFeed]);

  function removePostFromFeed(postId: string) {
    setFeed((items) => items.filter((item) => item.post.id !== postId));
  }

  async function handleDeletePost(channelSlug: string, postId: string) {
    await deleteChannelPost(channelSlug, postId);
    removePostFromFeed(postId);
  }

  async function handleUpdatePost(
    channelSlug: string,
    postId: string,
    body: string,
    attachmentIds: number[],
  ) {
    const post = await updateChannelPost(
      channelSlug,
      postId,
      body,
      attachmentIds,
    );
    setFeed((items) =>
      items.map((item) =>
        item.post.id === postId ? { kind: "post", post } : item,
      ),
    );
  }

  async function handleReply(
    channelSlug: string,
    postId: string,
    replyBody: string,
  ) {
    const comment = await createChannelReply(channelSlug, postId, replyBody);
    appendCommentToFeed(postId, comment);
    return comment;
  }

  //   IF NOT LOGGED -> REDIRECT TO SIGN IN SIGN UP
  if (!currentUser) return null;

  return (
    <>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-bg-tertiary px-4 py-5 sm:px-6 md:px-8 md:py-7">
        <div className="mb-0.5 flex items-center justify-between">
          <div className="text-[19px] font-medium">
            Hello, {currentUser.username}
          </div>
          <button
            type="button"
            onClick={() => setShowPanel(!showPanel)}
            className={`hidden items-center rounded-[5px] p-1 transition-colors hover:bg-bg-hover hover:text-text-primary xl:flex ${
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

        {loadingFeed ? (
          <div className="rounded-xl border border-border-default bg-bg-secondary p-[18px] text-[13px] italic text-text-dimmed">
            Loading feed...
          </div>
        ) : feedError ? (
          <div className="rounded-xl border border-border-default bg-bg-secondary p-[18px] text-[13px] italic text-danger">
            {feedError}
          </div>
        ) : feed.length === 0 ? (
          <div className="rounded-xl border border-border-default bg-bg-secondary p-[18px] text-[13px] italic text-text-dimmed">
            No posts yet in your interests.
          </div>
        ) : (
          feed.map((item) => (
            <Post
              key={item.post.id}
              {...item.post}
              onReply={(postId, replyBody) =>
                handleReply(item.post.channelSlug, postId, replyBody)
              }
              onUpdate={(postId, body, attachmentIds) =>
                handleUpdatePost(
                  item.post.channelSlug,
                  postId,
                  body,
                  attachmentIds,
                )
              }
              onDelete={(postId) =>
                handleDeletePost(item.post.channelSlug, postId)
              }
            />
          ))
        )}
      </div>

      {showPanel && (
        <div className="hidden w-[260px] shrink-0 xl:flex">
          <FriendsPanel />
        </div>
      )}
    </>
  );
}

function postTimestamp(item: HomePostFeedItem): number {
  return item.post.createdAt ? new Date(item.post.createdAt).getTime() : 0;
}
