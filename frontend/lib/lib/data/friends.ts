import { friends, cohortStats } from "@/lib/mocks/friends";
import type { CohortStat, Friend } from "@/lib/types";

// Backend swap point: replace with real API calls.

export function getFriends(): Friend[] {
  return friends;
}

export function getCohortStats(): CohortStat[] {
  return cohortStats;
}
