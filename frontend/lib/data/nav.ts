import { API_BASE_URL } from "@/lib/api-url";
import type { NavBadges } from "@/lib/types";

interface ApiFriendRequest {
  id: number;
}

interface ApiChat {
  unreadCount?: number;
}

// Loads sidebar badge counts from API-backed user data.
export async function getNavBadges(): Promise<NavBadges> {
  const [receivedRequests, chats] = await Promise.all([
    request<ApiFriendRequest[]>("/friendships/requests/received"),
    request<ApiChat[]>("/chats"),
  ]);

  return {
    suggestions: receivedRequests.length,
    messages: chats.reduce((total, chat) => total + (chat.unreadCount ?? 0), 0),
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
