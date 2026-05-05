import type { AvailableInterest, ProfileInterest } from "@/lib/types";

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

  return response.json();
}
