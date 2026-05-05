import {
  profileInterests,
  profileFriends,
  profileActivity,
  profileSocials,
  currentProjects,
} from "@/lib/mocks/profile";
import { channelMembers } from "@/lib/mocks/channelMembers";
import { getFriends } from "@/lib/data/friends";
import type { User } from "@/lib/types";

// Backend swap point: replace with `fetch('/api/profile/:username')`.

export function getMyProfile() {
  return {
    interests: profileInterests,
    friends: profileFriends,
    activity: profileActivity,
    socials: profileSocials,
    currentProjects,
  };
}

export function getProfileByUsername(username: string, currentUser: User) {
  const isSelf = username === currentUser.username;

  if (isSelf) {
    return {
      user: currentUser,
      isSelf: true as const,
      ...getMyProfile(),
    };
  }

  // Look up basic info from other mocks
  const friend = getFriends().find((f) => f.name === username);
  const allMembers = Object.values(channelMembers).flat();
  const member = allMembers.find((m) => m.username === username);

  return {
    user: {
      id: username,
      username,
      initials: friend?.initials ?? member?.initials ?? username.slice(0, 2),
      avatarUrl: friend?.avatarUrl ?? member?.avatarUrl,
      level: friend?.level ?? member?.level ?? 0,
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
