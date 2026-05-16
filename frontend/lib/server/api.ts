import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type {
  Channel,
  ChannelFeedItem,
  ChannelMember,
  Friend,
  ProfileSocial,
  ProfileInterest,
  User,
} from "@/lib/types";
import type { HomePostFeedItem } from "@/lib/data/feed";
import type { ProjectGridItem } from "@/lib/data/projects";
import type { FriendRequest, SuggestionProfile } from "@/lib/data/suggestions";
import type { AdminUser, AdminUserPost } from "@/lib/data/admin";

const SERVER_API_BASE_URL =
  process.env.NEXT_INTERNAL_API_URL?.replace(/\/+$/, "") ??
  process.env.INTERNAL_API_URL?.replace(/\/+$/, "") ??
  "https://proxy/api";

type ApiChannel = {
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
};

type ApiChannelMember = {
  id: string;
  username: string;
  initials: string;
  avatarUrl?: string;
  level: number;
  joinedAt: string;
  isFavorite: boolean;
  isFriend: boolean;
  isSelf?: boolean;
};

type ApiProject = {
  id: number;
  slug: string;
  name: string;
  color: string;
  description: string;
  messages?: ProjectGridItem["messages"];
};

type AdminUserResponse = {
  id: string;
  email: string;
  login: string | null;
  name: string | null;
  role: "GUEST" | "USER" | "ADMIN";
  createdAt: string;
  bannedAt?: string | null;
  moderationReason?: string | null;
  profile: {
    firstname: string | null;
    lastname: string | null;
    pseudo: string | null;
    avatarUri: string | null;
    level?: number | null;
    bio?: string | null;
    socials?: ProfileSocial[] | null;
  } | null;
  _count?: {
    posts?: number;
    channels?: number;
    interests?: number;
  };
  friendCount?: number;
};

export async function requireCurrentUser(): Promise<User> {
  const response = await serverFetch("/profiles/me");

  if (response.status === 401) redirect("/login");
  if (response.status === 403) redirect("/login/banned");
  if (!response.ok) throw new Error(`GET /profiles/me failed with ${response.status}`);

  return response.json();
}

export async function getInitialHomeFeed(): Promise<HomePostFeedItem[]> {
  const joinedChannels = await getInitialJoinedChannels();
  const channelFeeds = await Promise.all(
    joinedChannels.map((channel) => getInitialChannelFeed(channel.slug)),
  );

  return channelFeeds
    .flatMap((feed) =>
      feed.flatMap((item) =>
        item.kind === "post" ? [{ kind: "post" as const, post: item.post }] : [],
      ),
    )
    .sort((first, second) => postTimestamp(second) - postTimestamp(first));
}

export async function getInitialJoinedChannels(): Promise<Channel[]> {
  return safeJson<ApiChannel[]>("/channels/joined", []).then((channels) =>
    channels.map(toChannel),
  );
}

export async function getInitialChannel(slug: string): Promise<{
  channel: Channel | null;
  members: ChannelMember[];
  feed: ChannelFeedItem[];
}> {
  const [channel, members, feed] = await Promise.all([
    safeJson<ApiChannel | null>(`/channels/${encodeURIComponent(slug)}`, null),
    safeJson<ApiChannelMember[]>(`/channels/${encodeURIComponent(slug)}/members`, []),
    getInitialChannelFeed(slug),
  ]);

  return {
    channel: channel ? toChannel(channel) : null,
    members: members.map(toChannelMember),
    feed,
  };
}

export async function getInitialChannelFeed(slug: string): Promise<ChannelFeedItem[]> {
  return safeJson<ChannelFeedItem[]>(`/channels/${encodeURIComponent(slug)}/feed`, []);
}

export async function getInitialProfile(username: string): Promise<{
  viewedUser: User | null;
  profileFriends: Friend[];
  profileInterests: ProfileInterest[];
  myFriends: Friend[];
  myInterests: ProfileInterest[];
  sentRequests: FriendRequest[];
}> {
  const encodedUsername = encodeURIComponent(username);
  const [viewedUser, profileFriends, profileInterests, myFriends, myInterests, sentRequests] =
    await Promise.all([
      safeJson<User | null>(`/profiles/${encodedUsername}`, null),
      safeJson<Friend[]>(`/friendships/${encodedUsername}`, []),
      safeJson<ProfileInterest[]>(`/interests/${encodedUsername}`, []),
      safeJson<Friend[]>("/friendships/me", []),
      safeJson<ProfileInterest[]>("/interests/me", []),
      safeJson<FriendRequest[]>("/friendships/requests/sent", []),
    ]);

  return {
    viewedUser,
    profileFriends,
    profileInterests,
    myFriends,
    myInterests,
    sentRequests,
  };
}

export async function getInitialProjects(): Promise<ProjectGridItem[]> {
  const projects = await safeJson<ApiProject[]>("/projects", []);
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    slug: project.slug,
    color: project.color,
    description: project.description,
    messages: project.messages ?? [],
  }));
}

export async function getInitialSuggestions(): Promise<{
  suggestions: SuggestionProfile[];
  friends: Friend[];
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
}> {
  const [suggestions, friends, receivedRequests, sentRequests] = await Promise.all([
    safeJson<SuggestionProfile[]>("/suggestions/me?limit=12", []),
    safeJson<Friend[]>("/friendships/me", []),
    safeJson<FriendRequest[]>("/friendships/requests/received", []),
    safeJson<FriendRequest[]>("/friendships/requests/sent", []),
  ]);

  return { suggestions, friends, receivedRequests, sentRequests };
}

export async function getInitialAdminUsers(): Promise<{
  users: AdminUser[];
  posts: AdminUserPost[];
}> {
  const users = (await safeJson<AdminUserResponse[]>("/admin/users", [])).map(
    toAdminUser,
  );
  const firstUserId = users[0]?.id;
  const posts = firstUserId
    ? await safeJson<AdminUserPost[]>(`/admin/users/${firstUserId}/posts`, [])
    : [];

  return { users, posts };
}

async function safeJson<T>(path: string, fallback: T): Promise<T> {
  const response = await serverFetch(path);
  if (!response.ok) return fallback;
  return response.json();
}

async function serverFetch(path: string, init?: RequestInit): Promise<Response> {
  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  const headers = new Headers(init?.headers);
  if (cookie) headers.set("cookie", cookie);

  return fetch(`${SERVER_API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers,
  });
}

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

function toChannelMember(member: ApiChannelMember): ChannelMember {
  return {
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
  };
}

function postTimestamp(item: HomePostFeedItem): number {
  return item.post.createdAt ? new Date(item.post.createdAt).getTime() : 0;
}

function toAdminUser(user: AdminUserResponse): AdminUser {
  const username = user.profile?.pseudo || user.login || user.name || user.email;
  const firstName = user.profile?.firstname ?? undefined;
  const lastName = user.profile?.lastname ?? undefined;

  return {
    id: user.id,
    email: user.email,
    login: user.login ?? undefined,
    name: user.name ?? undefined,
    username,
    initials: getInitials(username),
    avatarUrl: user.profile?.avatarUri ?? undefined,
    bio: user.profile?.bio ?? undefined,
    level: user.profile?.level ?? 0,
    role: user.role,
    socials: user.profile?.socials ?? [],
    createdAt: user.createdAt,
    firstName,
    lastName,
    postCount: user._count?.posts ?? 0,
    channelCount: user._count?.channels ?? 0,
    interestCount: user._count?.interests ?? 0,
    friendCount: user.friendCount ?? 0,
    bannedAt: user.bannedAt ?? undefined,
    moderationReason: user.moderationReason ?? undefined,
  };
}

function getInitials(name: string): string {
  return (
    name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}
