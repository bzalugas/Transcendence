import type { NavBadges } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

interface ApiFriendRequest {
  id: number;
}

// Loads sidebar badge counts from API-backed user data.
export async function getNavBadges(): Promise<NavBadges> {
  const receivedRequests = await request<ApiFriendRequest[]>("/friendships/requests/received");

  return {
    suggestions: receivedRequests.length,
    messages: 0,
  };
}

// Sends an authenticated request to the backend API for navigation metadata.
async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`GET ${path} failed with ${response.status}`);
  }

  return response.json();
}
