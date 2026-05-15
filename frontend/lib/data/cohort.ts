import { API_BASE_URL } from "@/lib/api-url";

export interface CohortStats {
  students: number;
  topInterest: string;
  mostActive: string;
  activeGroups: number;
}

// Loads real cohort statistics from the database-backed profile API.
export async function getCohortStats(): Promise<CohortStats> {
  const response = await fetch(`${API_BASE_URL}/profiles/stats`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`GET /profiles/stats failed with ${response.status}`);
  }

  return response.json();
}
