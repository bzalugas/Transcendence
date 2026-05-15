import { API_BASE_URL } from "@/lib/api-url";
import type { ProfileSocial, User } from "@/lib/types";

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

export type AdminUser = User & {
  email: string;
  login?: string;
  name?: string;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  postCount: number;
  channelCount: number;
  interestCount: number;
  friendCount: number;
  bannedAt?: string;
  moderationReason?: string;
};

export type AdminUserPost = {
  id: string;
  kind: "post" | "comment" | "message";
  source: "channel" | "project";
  sourceLabel: string;
  channelId?: number;
  projectId?: number;
  parentId: string | null;
  parentPreview: string | null;
  body: string;
  createdAt: string;
  replyCount: number;
  reactionCount: number;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`GET /admin/users failed with ${response.status}`);
  }

  const users = (await response.json()) as AdminUserResponse[];
  return users.map(toAdminUser);
}

export async function getAdminUserPosts(userId: string): Promise<AdminUserPost[]> {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/posts`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`GET /admin/users/${userId}/posts failed with ${response.status}`);
  }

  return response.json();
}

export async function banAdminUser(userId: string, reason?: string) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/ban`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    throw new Error(`POST /admin/users/${userId}/ban failed with ${response.status}`);
  }

  return response.json();
}

export async function unbanAdminUser(userId: string) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/unban`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`POST /admin/users/${userId}/unban failed with ${response.status}`);
  }

  return response.json();
}

export async function deleteAdminContent(post: AdminUserPost) {
  const endpoint =
    post.source === "project"
      ? `${API_BASE_URL}/admin/project-messages/${post.id}`
      : `${API_BASE_URL}/admin/posts/${post.id}`;
  const response = await fetch(endpoint, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`DELETE ${endpoint} failed with ${response.status}`);
  }

  return response.json();
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
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}
