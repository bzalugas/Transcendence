import { channels } from "@/lib/mocks/channels";
import { channelMembers } from "@/lib/mocks/channelMembers";
import { channelFeeds } from "@/lib/mocks/channelFeed";
import type { Channel, ChannelFeedItem, ChannelMember } from "@/lib/types";

// Backend swap point: replace each function body with a `fetch` call
// against the real API. Component-side signatures must stay unchanged.

export function getAllChannels(): Channel[] {
  return channels;
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
