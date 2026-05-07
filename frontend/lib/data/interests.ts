import type { AvailableInterest, ProfileInterest } from "@/lib/types";
import { notifyChannelsUpdated } from "@/lib/data/channel-events";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// Loads the complete interest catalog from the API for search and joining.
export async function getAllInterests(): Promise<AvailableInterest[]> {
  const response = await fetch(`${API_BASE_URL}/interests`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`GET /interests failed with ${response.status}`);
  }

  return response.json();
}

// Loads interests joined by the currently authenticated user.
export async function getMyInterests(): Promise<ProfileInterest[]> {
  const response = await fetch(`${API_BASE_URL}/interests/me`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`GET /interests/me failed with ${response.status}`);
  }

  return response.json();
}

// Loads interests joined by a public profile username.
export async function getProfileInterests(username: string): Promise<ProfileInterest[]> {
  const response = await fetch(`${API_BASE_URL}/interests/${encodeURIComponent(username)}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`GET /interests/${username} failed with ${response.status}`);
  }

  return response.json();
}

// Adds an interest to the authenticated user's profile and returns it.
export async function joinMyInterest(
  interest: AvailableInterest,
): Promise<ProfileInterest> {
  const response = await fetch(`${API_BASE_URL}/interests/me/${interest.id}`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`POST /interests/me/${interest.id} failed with ${response.status}`);
  }

  const joinedInterest = await response.json();
  notifyChannelsUpdated();
  return joinedInterest;
}

// Removes an interest from the authenticated user and refreshes channel listeners.
export async function leaveMyInterest(interestId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/interests/me/${interestId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`DELETE /interests/me/${interestId} failed with ${response.status}`);
  }

  notifyChannelsUpdated();
}
