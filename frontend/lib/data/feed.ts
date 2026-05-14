import type { HomeFeedItem } from "@/lib/types";
import { getChannelFeed, getJoinedChannels } from "@/lib/data/channels";

export type HomePostFeedItem = Extract<HomeFeedItem, { kind: "post" }>;

// Builds the home feed from the posts of every channel joined by the current user.
export async function getHomeFeed(): Promise<HomePostFeedItem[]> {
  const joinedChannels = await getJoinedChannels();
  const channelFeeds = await Promise.all(
    joinedChannels.map((channel) => getChannelFeed(channel.slug)),
  );

  return channelFeeds
    .flatMap((feed) =>
      feed.flatMap((item) => item.kind === "post" ? [{ kind: "post" as const, post: item.post }] : []),
    )
    .sort((first, second) => postTimestamp(second) - postTimestamp(first));
}

function postTimestamp(item: HomePostFeedItem): number {
  return item.post.createdAt ? new Date(item.post.createdAt).getTime() : 0;
}
