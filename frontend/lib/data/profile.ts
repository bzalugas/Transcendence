import {
  profileFriends,
  profileActivity,
  profileSocials,
  currentProjects,
} from "@/lib/mocks/profile";
import { getFriends } from "@/lib/data/friends";
import type { User } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// Backend swap point: replace with `fetch('/api/profile/:username')`.

export function getMyProfile() {
  return {
    interests: [],
    friends: profileFriends,
    activity: profileActivity,
    socials: profileSocials,
    currentProjects,
  };
}

export function getProfileByUsername(username: string, currentUser: User) {
  const isSelf = normalizeProfileKey(username) === normalizeProfileKey(currentUser.username);

  if (isSelf) {
    return {
      user: currentUser,
      isSelf: true as const,
      ...getMyProfile(),
    };
  }

  // Look up basic info from the remaining friend fallback.
  const friend = getFriends().find((f) => f.name === username);

  return {
    user: {
      id: username,
      username,
      initials: friend?.initials ?? username.slice(0, 2),
      avatarUrl: friend?.avatarUrl,
      level: friend?.level ?? 0,
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
