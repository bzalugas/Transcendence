import { channels } from "@/lib/mocks/channels";
import { channelMembers } from "@/lib/mocks/channelMembers";
import { channelFeeds } from "@/lib/mocks/channelFeed";
import type { Channel, ChannelFeedItem, ChannelMember, Post, User } from "@/lib/types";

// Backend swap point: replace each function body with a `fetch` call
// against the real API. Component-side signatures must stay unchanged.

// Module-level joined channels — backend swap: use session/user profile
const joinedSlugs = new Set(channels.map((c) => c.slug));

export function getAllChannels(): Channel[] {
  return channels;
}

export function getJoinedChannels(): Channel[] {
  return channels.filter((c) => joinedSlugs.has(c.slug));
}

export function leaveChannel(slug: string): void {
  joinedSlugs.delete(slug);
}

export function joinChannel(slug: string): void {
  joinedSlugs.add(slug);
}

export function getChannelBySlug(slug: string): Channel | undefined {
  return channels.find((c) => c.slug === slug);
}

export function getChannelMembers(slug: string): ChannelMember[] {
  return channelMembers[slug] ?? [];
}

export function getChannelFeed(slug: string): ChannelFeedItem[] {
  return channelFeeds[slug] ?? [];
}

// Backend swap point: replace with POST /api/channels/:slug/posts
export function createChannelPost(slug: string, body: string, user: User): Post {
  const channel = getChannelBySlug(slug);
  const label = channel ? `${channel.emoji ?? ""} ${channel.label}`.trim() : slug;

  const post: Post = {
    id: crypto.randomUUID(),
    author: user.username,
    initials: user.initials,
    avatarUrl: user.avatarUrl,
    time: "just now",
    channelSlug: slug,
    channelLabel: label,
    body,
    likeCount: 0,
    liked: false,
    comments: [],
  };

  if (!channelFeeds[slug]) channelFeeds[slug] = [];
  channelFeeds[slug].unshift({ kind: "post", post });
  return post;
}
