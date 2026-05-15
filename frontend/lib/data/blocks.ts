import { API_BASE_URL } from "@/lib/api-url";
import type { Friend } from "@/lib/types";

export interface BlockedUser extends Friend {
  blockedAt: string;
}

export async function getBlockedUsers(): Promise<BlockedUser[]> {
  return request<BlockedUser[]>("/blocks/me");
}

export async function blockUser(name: string): Promise<BlockedUser> {
  return request<BlockedUser>(`/blocks/${encodeURIComponent(name)}`, {
    method: "POST",
  });
}

export async function unblockUser(name: string): Promise<void> {
  await request(`/blocks/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}

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
