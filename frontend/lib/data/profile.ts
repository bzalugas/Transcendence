import {
  profileFriends,
  profileActivity,
  profileSocials,
  currentProjects,
} from "@/lib/mocks/profile";
import { getFriends } from "@/lib/data/friends";
import type { User } from "@/lib/types";

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

function normalizeProfileKey(value: string): string {
  return decodeURIComponent(value).trim().toLowerCase();
}
