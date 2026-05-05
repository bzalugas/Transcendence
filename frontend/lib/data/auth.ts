"use client";

import { authClient } from "@/lib/auth-client";
import type { User } from "@/lib/types";

type BetterAuthSessionUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  username?: string | null;
  login?: string | null;
  bio?: string | null;
  level?: number | null;
  profile?: {
    bio?: string | null;
    level?: number | null;
    avatarUri?: string | null;
  } | null;
};

// Reads the better-auth session and exposes the logged-in user in the app's User shape.
export function useCurrentUser(): {
  user: User | null;
  isPending: boolean;
  isAuthenticated: boolean;
} {
  const session = authClient.useSession();
  const sessionUser = session.data?.user as BetterAuthSessionUser | undefined;
  const user = sessionUser ? toAppUser(sessionUser) : null;

  return {
    user,
    isPending: session.isPending,
    isAuthenticated: Boolean(user),
  };
}

// Converts better-auth's session user payload into the frontend profile/user contract.
export function toAppUser(sessionUser: BetterAuthSessionUser): User {
  const username =
    sessionUser.login ??
    sessionUser.username ??
    sessionUser.name ??
    sessionUser.email?.split("@")[0] ??
    "student";

  return {
    id: sessionUser.id ?? username,
    username,
    initials: getInitials(username),
    avatarUrl: sessionUser.profile?.avatarUri ?? sessionUser.image ?? undefined,
    bio: sessionUser.profile?.bio ?? sessionUser.bio ?? undefined,
    level: sessionUser.profile?.level ?? sessionUser.level ?? 0,
  };
}

// Updates the better-auth user record for fields currently supported by the auth client.
export async function updateCurrentUser(
  updates: Partial<Pick<User, "username" | "bio" | "initials">>,
): Promise<void> {
  const client = authClient as typeof authClient & {
    updateUser?: (data: { name?: string | null }) => Promise<unknown>;
  };

  if (updates.username) {
    await client.updateUser?.({ name: updates.username });
  }
}

// Builds compact avatar initials from a login, display name, or email-derived username.
function getInitials(value: string): string {
  const parts = value
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toLowerCase();
  }

  return value.slice(0, 2).toLowerCase();
}
