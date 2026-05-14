import {
  profileActivity,
  currentProjects,
} from "@/lib/mocks/profile";
import { API_BASE_URL } from "@/lib/api-url";
import type { User } from "@/lib/types";

// Backend swap point: replace with `fetch('/api/profile/:username')`.

export function getMyProfile(user?: User) {
  return {
    interests: [],
    friends: [],
    activity: profileActivity,
    socials: user?.socials ?? [],
    currentProjects,
  };
}

export function getProfileByUsername(username: string, currentUser: User) {
  const isSelf = normalizeProfileKey(username) === normalizeProfileKey(currentUser.username);

  if (isSelf) {
    return {
      user: currentUser,
      isSelf: true as const,
      ...getMyProfile(currentUser),
    };
  }

  return {
    user: {
      id: username,
      username,
      initials: username.slice(0, 2),
      avatarUrl: undefined,
      level: 0,
      bio: undefined as string | undefined,
    },
    isSelf: false as const,
    interests: [],
    friends: [],
    activity: [],
    socials: [],
    currentProjects: [],
  };
}

// Loads one user profile from the database-backed API.
export async function getUserProfileByUsername(username: string): Promise<User | null> {
  const response = await fetch(`${API_BASE_URL}/profiles/${encodeURIComponent(username)}`, {
    credentials: "include",
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`GET /profiles/${username} failed with ${response.status}`);
  }

  return response.json();
}

function normalizeProfileKey(value: string): string {
  return decodeURIComponent(value).trim().toLowerCase();
}
