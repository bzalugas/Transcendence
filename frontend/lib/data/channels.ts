import { io, type Socket } from "socket.io-client";
import { API_BASE_URL, API_ORIGIN } from "@/lib/api-url";
import type {
  Channel,
  ChannelFeedItem,
  ChannelMember,
  Comment,
  Post,
  User,
} from "@/lib/types";
import { notifyChannelsUpdated } from "@/lib/data/channel-events";

let channelsCache: Channel[] = [];

interface ApiChannel {
  id: number;
  interestId: number;
  slug: string;
  label: string;
  color: string;
  imageUri: string | null;
  description?: string;
  memberCount: number;
  postCount: number;
  joined?: boolean;
  isFavorite?: boolean;
}

interface ApiChannelMember {
  id: string;
  username: string;
  initials: string;
  avatarUrl?: string;
  level: number;
  joinedAt: string;
  isFavorite: boolean;
  isFriend: boolean;
  isSelf?: boolean;
}

// Loads every channel from the database-backed API.
export async function getAllChannels(): Promise<Channel[]> {
  const channels = await request<ApiChannel[]>("/channels");
  channelsCache = channels.map(toChannel);
  return channelsCache;
}

// Loads channels joined by the currently authenticated user.
export async function getJoinedChannels(): Promise<Channel[]> {
  const channels = await request<ApiChannel[]>("/channels/joined");
  const joinedChannels = channels.map(toChannel);
  mergeChannelCache(joinedChannels);
  return joinedChannels;
}

// Leaves a channel and its matching interest for the current user.
export async function leaveChannel(slug: string): Promise<void> {
  await request(`/channels/${slug}/leave`, { method: "DELETE" });
  channelsCache = channelsCache.filter((channel) => channel.slug !== slug);
  notifyChannelsUpdated();
}

// Joins a channel and its matching interest for the current user.
export async function joinChannel(slug: string): Promise<Channel> {
  const channel = toChannel(
    await request<ApiChannel>(`/channels/${slug}/join`, { method: "POST" }),
  );
  mergeChannelCache([channel]);
  notifyChannelsUpdated();
  return channel;
}

// Loads one channel from the database-backed API by its slug.
export async function getChannelBySlug(
  slug: string,
): Promise<Channel | undefined> {
  try {
    const channel = toChannel(await request<ApiChannel>(`/channels/${slug}`));
    mergeChannelCache([channel]);
    return channel;
  } catch {
    return undefined;
  }
}

// Loads channel members from the database-backed API.
export async function getChannelMembers(
  slug: string,
): Promise<ChannelMember[]> {
  const members = await request<ApiChannelMember[]>(
    `/channels/${slug}/members`,
  );
  return members.map((member) => ({
    id: member.id,
    username: member.username,
    initials: member.initials,
    avatarUrl: member.avatarUrl,
    level: member.level,
    status: "offline",
    isFriend: member.isFriend,
    joinedAt: member.joinedAt,
    isFavorite: member.isFavorite,
    isSelf: member.isSelf,
  }));
}

// Loads the persisted post feed for one channel.
export async function getChannelFeed(slug: string): Promise<ChannelFeedItem[]> {
  return request<ChannelFeedItem[]>(`/channels/${slug}/feed`);
}

// Creates a persisted post in one channel for the current authenticated user.
export async function createChannelPost(
  slug: string,
  body: string,
  _user: User,
  attachmentIds: number[] = [],
): Promise<Post> {
  return request<Post>(`/channels/${slug}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: body, attachmentIds }),
  });
}

// Replaces a persisted post's content and attached files for its author.
export async function updateChannelPost(
  slug: string,
  postId: string,
  body: string,
  attachmentIds: number[] = [],
): Promise<Post> {
  return request<Post>(`/channels/${slug}/posts/${postId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: body, attachmentIds }),
  });
}

// Removes a persisted post owned by the current authenticated user.
export async function deleteChannelPost(
  slug: string,
  postId: string,
): Promise<void> {
  await request(`/channels/${slug}/posts/${postId}`, { method: "DELETE" });
}

// Creates a persisted reply attached to one post in a channel.
export async function createChannelReply(
  slug: string,
  postId: string,
  body: string,
): Promise<Comment> {
  return request<Comment>(`/channels/${slug}/posts/${postId}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: body }),
  });
}

export function joinChannelRealtime(slug: string): void {
  const socket = getChannelSocket();
  if (!socket.connected) socket.connect();
  socket.emit("channel:join", { slug });
}

export function leaveChannelRealtime(slug: string): void {
  getChannelSocket().emit("channel:leave", { slug });
}

export function subscribeToChannelPosts(
  listener: (event: { slug: string; post: Post }) => void,
  onError?: (message: string) => void,
): () => void {
  const socket = getChannelSocket();
  const handlePost = (event: { slug: string; post: Post }) => listener(event);
  const handleError = (error: { message?: string }) => {
    onError?.(error.message ?? "Channel realtime error");
  };

  socket.on("channel:post", handlePost);
  socket.on("channel:error", handleError);

  return () => {
    socket.off("channel:post", handlePost);
    socket.off("channel:error", handleError);
  };
}

export function subscribeToChannelReplies(
  listener: (event: { slug: string; postId: string; comment: Comment }) => void,
  onError?: (message: string) => void,
): () => void {
  const socket = getChannelSocket();
  const handleReply = (event: {
    slug: string;
    postId: string;
    comment: Comment;
  }) => listener(event);
  const handleError = (error: { message?: string }) => {
    onError?.(error.message ?? "Channel realtime error");
  };

  socket.on("channel:reply", handleReply);
  socket.on("channel:error", handleError);

  return () => {
    socket.off("channel:reply", handleReply);
    socket.off("channel:error", handleError);
  };
}

// Sends an authenticated request to the backend API and validates the response.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      `${init?.method ?? "GET"} ${path} failed with ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Converts the backend channel DTO into the frontend Channel type.
function toChannel(channel: ApiChannel): Channel {
  return {
    id: channel.id,
    interestId: channel.interestId,
    slug: channel.slug,
    label: channel.label,
    color: channel.color,
    imageUri: channel.imageUri,
    description: channel.description,
    memberCount: channel.memberCount,
    postCount: channel.postCount,
    joined: channel.joined,
    isFavorite: channel.isFavorite,
  };
}

// Keeps recently loaded channels available for local post labels.
function mergeChannelCache(channels: Channel[]): void {
  const bySlug = new Map(
    channelsCache.map((channel) => [channel.slug, channel]),
  );

  for (const channel of channels) {
    bySlug.set(channel.slug, channel);
  }

  channelsCache = Array.from(bySlug.values());
}

function getChannelSocket(): Socket {
  if (!channelSocket) {
    channelSocket = io(API_ORIGIN, {
      autoConnect: false,
      path: "/api/socket.io",
      withCredentials: true,
    });
  }

  return channelSocket;
}

let channelSocket: Socket | null = null;
