"use client";

import { createContext, createElement, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { API_BASE_URL } from "@/lib/api-url";
import type { ProfileSocial, User } from "@/lib/types";

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

const CurrentUserContext = createContext<User | null>(null);

export function CurrentUserProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  return createElement(CurrentUserContext.Provider, { value: user }, children);
}

// Reads the better-auth session and exposes the logged-in user in the app's User shape.
export function useCurrentUser(): {
  user: User | null;
  isPending: boolean;
  isAuthenticated: boolean;
  isBanned: boolean;
} {
  const initialUser = useContext(CurrentUserContext);
  const session = authClient.useSession();
  const sessionUser = session.data?.user as BetterAuthSessionUser | undefined;
  const sessionUserId = sessionUser?.id ?? initialUser?.id;
  const [profileUser, setProfileUser] = useState<User | null>(initialUser);
  const [isProfilePending, setIsProfilePending] = useState(false);
  const [profileFailedUserId, setProfileFailedUserId] = useState<string | null>(null);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    if (!sessionUserId) {
      if (session.isPending) return;

      queueMicrotask(() => {
        setProfileUser(null);
        setProfileFailedUserId(null);
        setIsProfilePending(false);
        setIsBanned(false);
      });
      return;
    }

    let active = true;
    let checkingProfile = false;
    const activeSessionUserId = sessionUserId;

    async function loadProfile(showPending: boolean) {
      if (checkingProfile) return;
      checkingProfile = true;

      if (showPending) {
        queueMicrotask(() => {
          if (active) setIsProfilePending(true);
        });
      }

      try {
        const response = await fetch(`${API_BASE_URL}/profiles/me`, {
          credentials: "include",
        });
        if (response.status === 403) {
          throw new BannedAccountError();
        }
        if (!response.ok) throw new Error(`GET /profiles/me failed with ${response.status}`);
        const user = (await response.json()) as User;
        if (!active) return;
        setProfileUser(user);
        setProfileFailedUserId(null);
        setIsBanned(false);
      } catch (error) {
        if (!active) return;
        setProfileUser(null);
        setProfileFailedUserId(activeSessionUserId);
        setIsBanned(error instanceof BannedAccountError);
      } finally {
        if (active) setIsProfilePending(false);
        checkingProfile = false;
      }
    }

    function revalidateProfile() {
      void loadProfile(false);
    }

    void loadProfile(true);
    const intervalId = window.setInterval(revalidateProfile, 15_000);
    window.addEventListener("focus", revalidateProfile);
    document.addEventListener("visibilitychange", revalidateProfile);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", revalidateProfile);
      document.removeEventListener("visibilitychange", revalidateProfile);
    };
  }, [sessionUserId, session.isPending]);

  const user = profileUser;
  const isResolvingProfile =
    Boolean(sessionUserId) &&
    profileFailedUserId !== sessionUserId &&
    (isProfilePending || profileUser?.id !== sessionUserId);

  return {
    user,
    isPending: !profileUser && (session.isPending || isResolvingProfile),
    isAuthenticated: Boolean(user),
    isBanned,
  };
}

class BannedAccountError extends Error {}

// Updates the better-auth user record and persisted profile fields supported by the API.
export async function updateCurrentUser(
  updates: Partial<Pick<User, "username" | "bio" | "avatarUrl" | "initials" | "socials">>,
): Promise<User | null> {
  const client = authClient as typeof authClient & {
    updateUser?: (data: { name?: string | null }) => Promise<unknown>;
  };

  if (updates.username) {
    await client.updateUser?.({ name: updates.username });
  }

  if ("bio" in updates || "socials" in updates || "avatarUrl" in updates) {
    const response = await fetch(`${API_BASE_URL}/profiles/me`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...("bio" in updates ? { bio: updates.bio ?? null } : {}),
        ...("socials" in updates ? { socials: updates.socials ?? [] } : {}),
        ...("avatarUrl" in updates ? { avatarUri: updates.avatarUrl ?? null } : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(`PATCH /profiles/me failed with ${response.status}`);
    }

    return response.json();
  }

  return null;
}
