"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { ProfileSocial, User } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

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
    socials?: ProfileSocial[] | null;
  } | null;
  socials?: ProfileSocial[] | null;
};

// Reads the better-auth session and exposes the logged-in user in the app's User shape.
export function useCurrentUser(): {
  user: User | null;
  isPending: boolean;
  isAuthenticated: boolean;
} {
  const session = authClient.useSession();
  const sessionUser = session.data?.user as BetterAuthSessionUser | undefined;
  const sessionUserId = sessionUser?.id;
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const fallbackUser = sessionUser ? toAppUser(sessionUser) : null;

  useEffect(() => {
    if (!sessionUserId) {
      queueMicrotask(() => setProfileUser(null));
      return;
    }

    let active = true;

    fetch(`${API_BASE_URL}/profiles/me`, {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) throw new Error(`GET /profiles/me failed with ${response.status}`);
        return response.json();
      })
      .then((user: User) => {
        if (active) setProfileUser(user);
      })
      .catch(() => {
        if (active) setProfileUser(null);
      });

    return () => {
      active = false;
    };
  }, [sessionUserId]);

  const user = profileUser ?? fallbackUser;

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
    socials: sessionUser.profile?.socials ?? sessionUser.socials ?? [],
  };
}

// Updates the better-auth user record and persisted profile fields supported by the API.
export async function updateCurrentUser(
  updates: Partial<Pick<User, "username" | "bio" | "initials" | "socials">>,
): Promise<User | null> {
  const client = authClient as typeof authClient & {
    updateUser?: (data: { name?: string | null }) => Promise<unknown>;
  };

  if (updates.username) {
    await client.updateUser?.({ name: updates.username });
  }

  if ("bio" in updates || "socials" in updates) {
    const response = await fetch(`${API_BASE_URL}/profiles/me`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...("bio" in updates ? { bio: updates.bio ?? null } : {}),
        ...("socials" in updates ? { socials: updates.socials ?? [] } : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(`PATCH /profiles/me failed with ${response.status}`);
    }

    return response.json();
  }

  return null;
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
