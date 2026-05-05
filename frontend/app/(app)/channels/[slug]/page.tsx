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
  leaveChannel,
} from "@/lib/data/channels";
import { useCurrentUser } from "@/lib/data/auth";
import type { ChannelFeedItem } from "@/lib/types";

interface ChannelPageProps {
  params: Promise<{ slug: string }>;
}

export default function ChannelPage({ params }: ChannelPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();

  // All hooks before any conditional return
  const [feed, setFeed] = useState<ChannelFeedItem[]>(() => [...getChannelFeed(slug)]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Reset feed when navigating to a different channel
  useEffect(() => {
    setFeed([...getChannelFeed(slug)]);
  }, [slug]);

  const channel = getChannelBySlug(slug);
  const members = getChannelMembers(slug);

  if (!channel) notFound();

  function handlePost(body: string) {
    if (!currentUser) return;
    createChannelPost(slug, body, currentUser);
    setFeed([...getChannelFeed(slug)]);
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
                <Post key={item.post.id} {...item.post} />
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
            onLeave={() => {
              leaveChannel(slug);
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
