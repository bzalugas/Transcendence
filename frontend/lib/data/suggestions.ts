import type { Friend } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export interface SuggestionProfile {
  initials: string;
  avatarUrl?: string;
  name: string;
  level: number;
  online: boolean;
  score: number;
  sharedTags: string[];
  otherTags: string[];
}

export interface FriendRequest {
  id: number;
  initials: string;
  name: string;
  sharedCount: number;
}

// Loads Jaccard-based profile suggestions for the current authenticated user.
export async function getSuggestions(limit = 10): Promise<SuggestionProfile[]> {
  return request<SuggestionProfile[]>(`/suggestions/me?limit=${limit}`);
}

// Loads pending friend requests received by the current user from the API.
export async function getFriendRequests(): Promise<FriendRequest[]> {
  return request<FriendRequest[]>("/friendships/requests/received");
}

// Creates a pending friend request for a profile username.
export async function sendFriendRequest(name: string): Promise<FriendRequest> {
  return request<FriendRequest>(`/friendships/requests/${encodeURIComponent(name)}`, {
    method: "POST",
  });
}

// Accepts one pending friend request received by the current user.
export async function acceptFriendRequest(requestId: number): Promise<Friend> {
  return request<Friend>(`/friendships/requests/${requestId}/accept`, {
    method: "POST",
  });
}

// Rejects one pending friend request received by the current user.
export async function rejectFriendRequest(requestId: number): Promise<void> {
  await request(`/friendships/requests/${requestId}/reject`, {
    method: "POST",
  });
}

// Cancels one pending friend request sent by the current user.
export async function cancelSentRequest(requestId: number): Promise<void> {
  await request(`/friendships/requests/${requestId}`, {
    method: "DELETE",
  });
}

// Loads usernames that already have a pending request from the current user.
export async function getSentRequestNames(): Promise<string[]> {
  const requests = await getSentRequests();
  return requests.map((friendRequest) => friendRequest.name);
}

// Loads pending friend requests sent by the current user.
export async function getSentRequests(): Promise<FriendRequest[]> {
  return request<FriendRequest[]>("/friendships/requests/sent");
}

// Sends an authenticated request to the backend friendship API.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed with ${response.status}`);
  }

  if (response.status === 204) return undefined as T;

  return response.json();
}
