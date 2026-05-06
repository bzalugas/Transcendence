import type { Friend } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// Loads accepted friends for the current authenticated user from the API.
export async function getFriends(): Promise<Friend[]> {
  return request<Friend[]>("/friendships/me");
}

// Loads accepted friends for a public profile username from the API.
export async function getProfileFriends(username: string): Promise<Friend[]> {
  return request<Friend[]>(`/friendships/${encodeURIComponent(username)}`);
}

// Removes an accepted friendship for the current user by profile username.
export async function removeFriend(name: string): Promise<void> {
  await request(`/friendships/me/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
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
