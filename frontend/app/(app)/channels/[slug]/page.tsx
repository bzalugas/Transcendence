"use client";

import { use, useMemo, useState } from "react";
import { notFound } from "next/navigation";
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
} from "@/lib/data/channels";

interface ChannelPageProps {
  params: Promise<{ slug: string }>;
}

export default function ChannelPage({ params }: ChannelPageProps) {
  const { slug } = use(params);
  const channel = useMemo(() => getChannelBySlug(slug), [slug]);
  if (!channel) notFound();

  const feed = useMemo(() => getChannelFeed(slug), [slug]);
  const members = useMemo(() => getChannelMembers(slug), [slug]);

  const [panelOpen, setPanelOpen] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

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
          <ChannelComposer channelLabel={channel.label} />

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
              /* leave channel — to wire up later */
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
