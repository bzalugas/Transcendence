"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Post from "@/components/Post";
import ChannelHeader from "@/components/channel/ChannelHeader";
import ChannelComposer from "@/components/channel/ChannelComposer";
import ChannelSystemEvent from "@/components/channel/ChannelSystemEvent";
import ChannelAboutPanel from "@/components/channel/ChannelAboutPanel";
import ChannelInviteModal from "@/components/channel/ChannelInviteModal";
import {
  getChannelBySlug,
  getChannelFeed,
  getChannelMembers,
  createChannelPost,
  createChannelReply,
  leaveChannel,
} from "@/lib/data/channels";
import { useCurrentUser } from "@/lib/data/auth";
import type { Channel, ChannelFeedItem, ChannelMember } from "@/lib/types";

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
  const [inviteOpen, setInviteOpen] = useState(false);

  // Reset feed when navigating to a different channel
  useEffect(() => {
    let active = true;

    setLoaded(false);
    Promise.all([getChannelBySlug(slug), getChannelMembers(slug), getChannelFeed(slug)])
      .then(([nextChannel, nextMembers, nextFeed]) => {
        if (!active) return;
        setChannel(nextChannel ?? null);
        setMembers(nextMembers);
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

  if (loaded && !channel) notFound();

  if (!channel) {
    return (
      <div className="flex flex-1 items-center justify-center bg-bg-tertiary text-[13px] text-text-muted">
        Loading channel...
      </div>
    );
  }

  // Persists a new channel post and prepends the returned DB-backed post to the feed.
  async function handlePost(body: string) {
    if (!currentUser) return;
    const post = await createChannelPost(slug, body, currentUser);
    setFeed((items) => [{ kind: "post", post }, ...items]);
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto bg-bg-tertiary">
        <ChannelHeader
          channel={channel}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen((p) => !p)}
          onInvite={() => setInviteOpen(true)}
        />

        <div className="flex flex-col gap-3 px-8 pb-7 pt-2">
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
                  onReply={(postId, replyBody) =>
                    createChannelReply(slug, postId, replyBody)
                  }
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
        <div className="flex w-[280px] shrink-0">
          <ChannelAboutPanel
            channel={channel}
            members={members}
            onLeave={async () => {
              await leaveChannel(slug);
              router.push("/");
            }}
          />
        </div>
      )}

      {inviteOpen && (
        <ChannelInviteModal
          channel={channel}
          members={members}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </>
  );
}
