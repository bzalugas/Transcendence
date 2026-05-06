const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export interface CohortStats {
  students: number;
  online: number;
  topInterest: string;
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
