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

type AdminProjectResponse = {
  id: number;
  slug: string;
  name: string;
  color: string;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages?: number;
  };
};

export type AdminProject = {
  id: number;
  slug: string;
  name: string;
  color: string;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

type AdminChannelResponse = {
  id: number;
  description: string | null;
  interest: {
    id: number;
    name: string;
    color: string | null;
  };
  _count?: {
    users?: number;
  };
};

export type AdminChannel = {
  id: number;
  interestId: number;
  name: string;
  color: string;
  description: string;
  memberCount: number;
};

type AdminChannelMemberResponse = {
  id: string;
  username: string;
  initials: string;
  avatarUrl?: string;
  email: string;
  role: "GUEST" | "USER" | "ADMIN";
  level: number;
  joinedAt: string;
};

export type AdminChannelMember = AdminChannelMemberResponse;

type AdminInterestRequestResponse = {
  id: number;
  name: string;
  description: string;
  status: string;
  requestedAt: string;
  requester: string;
};

export type AdminInterestRequest = AdminInterestRequestResponse;

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

export async function getAdminProjects(): Promise<AdminProject[]> {
  const response = await fetch(`${API_BASE_URL}/admin/projects`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`GET /admin/projects failed with ${response.status}`);
  }

  const projects = (await response.json()) as AdminProjectResponse[];
  return projects.map(toAdminProject);
}

export async function createAdminProject(project: {
  name: string;
  description: string;
  color: string;
}): Promise<AdminProject> {
  const response = await fetch(`${API_BASE_URL}/admin/projects`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error(
        `Cannot create [ ${project.name} ] because a project with this name already exists.`,
      );
    }

    throw new Error(`POST /admin/projects failed with ${response.status}`);
  }

  return toAdminProject((await response.json()) as AdminProjectResponse);
}

export async function deleteAdminProject(projectId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/projects/${projectId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`DELETE /admin/projects/${projectId} failed with ${response.status}`);
  }
}

export async function getAdminChannels(): Promise<AdminChannel[]> {
  const response = await fetch(`${API_BASE_URL}/admin/channels`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`GET /admin/channels failed with ${response.status}`);
  }

  const channels = (await response.json()) as AdminChannelResponse[];
  return channels.map(toAdminChannel);
}

export async function createAdminChannel(channel: {
  name: string;
  color: string;
  description: string;
}): Promise<AdminChannel> {
  const response = await fetch(`${API_BASE_URL}/admin/channels`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(channel),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error(
        `Cannot create [ ${channel.name} ] because a channel with this name already exists.`,
      );
    }

    throw new Error(`POST /admin/channels failed with ${response.status}`);
  }

  return toAdminChannel((await response.json()) as AdminChannelResponse);
}

export async function deleteAdminChannel(channelId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/channels/${channelId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`DELETE /admin/channels/${channelId} failed with ${response.status}`);
  }
}

export async function getAdminChannelMembers(
  channelId: number,
): Promise<AdminChannelMember[]> {
  const response = await fetch(`${API_BASE_URL}/admin/channels/${channelId}/members`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`GET /admin/channels/${channelId}/members failed with ${response.status}`);
  }

  return response.json();
}

export async function removeAdminUserFromChannel(
  userId: string,
  channelId: number,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/admin/users/${userId}/channels/${channelId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(`DELETE /admin/users/${userId}/channels/${channelId} failed with ${response.status}`);
  }
}

export async function getAdminInterestRequests(): Promise<AdminInterestRequest[]> {
  const response = await fetch(`${API_BASE_URL}/admin/interest-requests`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`GET /admin/interest-requests failed with ${response.status}`);
  }

  return response.json();
}

export async function approveAdminInterestRequest(
  requestId: number,
  request: { name: string; description: string; color: string },
): Promise<AdminChannel> {
  const response = await fetch(
    `${API_BASE_URL}/admin/interest-requests/${requestId}/approve`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error(
        `Cannot create [ ${request.name} ] because a channel with this name already exists.`,
      );
    }

    throw new Error(`POST /admin/interest-requests/${requestId}/approve failed with ${response.status}`);
  }

  return toAdminChannel((await response.json()) as AdminChannelResponse);
}

export async function rejectAdminInterestRequest(requestId: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/admin/interest-requests/${requestId}/reject`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(`POST /admin/interest-requests/${requestId}/reject failed with ${response.status}`);
  }
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

function toAdminProject(project: AdminProjectResponse): AdminProject {
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    color: project.color,
    description: project.description,
    sortOrder: project.sortOrder,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    messageCount: project._count?.messages ?? 0,
  };
}

function toAdminChannel(channel: AdminChannelResponse): AdminChannel {
  return {
    id: channel.id,
    interestId: channel.interest.id,
    name: channel.interest.name,
    color: channel.interest.color ?? "#6b7280",
    description: channel.description ?? "",
    memberCount: channel._count?.users ?? 0,
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
