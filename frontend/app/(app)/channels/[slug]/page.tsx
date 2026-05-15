"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Post from "@/components/Post";
import ChannelHeader from "@/components/channel/ChannelHeader";
import ChannelComposer from "@/components/channel/ChannelComposer";
import ChannelSystemEvent from "@/components/channel/ChannelSystemEvent";
import ChannelAboutPanel from "@/components/channel/ChannelAboutPanel";
import {
  getChannelBySlug,
  getChannelFeed,
  getChannelMembers,
  createChannelPost,
  createChannelReply,
  updateChannelPost,
  deleteChannelPost,
  leaveChannel,
  joinChannelRealtime,
  leaveChannelRealtime,
  subscribeToChannelPosts,
  subscribeToChannelReplies,
} from "@/lib/data/channels";
import { useCurrentUser } from "@/lib/data/auth";
import type {
  Channel,
  ChannelFeedItem,
  ChannelMember,
  Comment,
} from "@/lib/types";

interface ChannelPageProps {
  params: Promise<{ slug: string }>;
}

export default function ChannelPage({ params }: ChannelPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();

  // All hooks before any conditional return
  const [feed, setFeed] = useState<ChannelFeedItem[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  // Reset feed when navigating to a different channel
  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (active) setLoaded(false);
    });
    Promise.all([
      getChannelBySlug(slug),
      getChannelMembers(slug),
      getChannelFeed(slug),
    ])
      .then(([nextChannel, nextMembers, nextFeed]) => {
        if (!active) return;
        setChannel(nextChannel ?? null);
        setMembers(
          nextMembers.map((m) => ({
            ...m,
            isSelf: currentUser ? m.username === currentUser.username : false,
          })),
        );
        setFeed(nextFeed);
      })
      .catch(() => {
        if (!active) return;
        setChannel(null);
        setMembers([]);
        setFeed([]);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    joinChannelRealtime(slug);

    const unsubscribePosts = subscribeToChannelPosts((event) => {
      if (event.slug !== slug) return;

      setFeed((items) => {
        if (
          items.some(
            (item) => item.kind === "post" && item.post.id === event.post.id,
          )
        ) {
          return items;
        }

        return [{ kind: "post", post: event.post }, ...items];
      });
    });
    const unsubscribeReplies = subscribeToChannelReplies((event) => {
      if (event.slug !== slug) return;

      appendCommentToFeed(event.postId, event.comment);
    });

    return () => {
      unsubscribePosts();
      unsubscribeReplies();
      leaveChannelRealtime(slug);
    };
  }, [slug]);

  if (loaded && !channel) notFound();

  if (!channel) {
    return (
      <div className="flex flex-1 items-center justify-center bg-bg-tertiary text-[13px] text-text-muted">
        Loading channel...
      </div>
    );
  }

  // Persists a new channel post and prepends the returned DB-backed post to the feed.
  async function handlePost(body: string, attachmentIds: number[]) {
    if (!currentUser) return;
    const post = await createChannelPost(
      slug,
      body,
      currentUser,
      attachmentIds,
    );
    setFeed((items) =>
      items.some((item) => item.kind === "post" && item.post.id === post.id)
        ? items
        : [{ kind: "post", post }, ...items],
    );
  }

  async function handleDeletePost(postId: string) {
    await deleteChannelPost(slug, postId);
    setFeed((items) =>
      items.filter((item) => item.kind !== "post" || item.post.id !== postId),
    );
  }

  async function handleUpdatePost(
    postId: string,
    body: string,
    attachmentIds: number[],
  ) {
    const post = await updateChannelPost(slug, postId, body, attachmentIds);
    setFeed((items) =>
      items.map((item) =>
        item.kind === "post" && item.post.id === postId
          ? { kind: "post", post }
          : item,
      ),
    );
  }

  async function handleReply(postId: string, replyBody: string) {
    const comment = await createChannelReply(slug, postId, replyBody);
    appendCommentToFeed(postId, comment);
    return comment;
  }

  function appendCommentToFeed(postId: string, comment: Comment) {
    setFeed((items) =>
      items.map((item) =>
        item.kind === "post" && item.post.id === postId
          ? {
              kind: "post",
              post: {
                ...item.post,
                comments: appendComment(item.post.comments, comment),
              },
            }
          : item,
      ),
    );
  }

  async function refreshChannelVisibility() {
    const [nextMembers, nextFeed] = await Promise.all([
      getChannelMembers(slug),
      getChannelFeed(slug),
    ]);

    setMembers(
      nextMembers.map((m) => ({
        ...m,
        isSelf: currentUser ? m.username === currentUser.username : false,
      })),
    );
    setFeed(nextFeed);
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto bg-bg-tertiary">
        <ChannelHeader
          channel={channel}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen((p) => !p)}
        />

        <div className="flex flex-col gap-3 px-4 pb-7 pt-2 sm:px-6 md:px-8">
          <ChannelComposer channelLabel={channel.label} onPost={handlePost} />

          {feed.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-default bg-bg-secondary px-4 py-12 text-center text-[13px] text-text-muted">
              No posts yet in {channel.label}. Be the first to share something.
            </div>
          ) : (
            feed.map((item) =>
              item.kind === "post" ? (
                <Post
                  key={item.post.id}
                  {...item.post}
                  onReply={handleReply}
                  onUpdate={handleUpdatePost}
                  onDelete={handleDeletePost}
                />
              ) : (
                <ChannelSystemEvent
                  key={item.event.id}
                  event={item.event}
                  channel={channel}
                />
              ),
            )
          )}
        </div>
      </div>

      {panelOpen && (
        <div className="hidden w-[280px] shrink-0 xl:flex">
          <ChannelAboutPanel
            channel={channel}
            members={members}
            onLeave={async () => {
              await leaveChannel(slug);
              router.push("/");
            }}
            onBlock={refreshChannelVisibility}
          />
        </div>
      )}
    </>
  );
}

function appendComment(comments: Comment[], comment: Comment): Comment[] {
  if (comment.id && comments.some((candidate) => candidate.id === comment.id)) {
    return comments;
  }

  return [...comments, comment];
}
