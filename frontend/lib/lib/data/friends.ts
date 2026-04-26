import { friends, cohortStats } from "@/lib/mocks/friends";
import type { CohortStat, Friend } from "@/lib/types";

// Module-level mutable list — backend swap: replace all functions with real API calls.
const _friends: Friend[] = [...friends];

export function getFriends(): Friend[] {
  return [..._friends];
}

export function removeFriend(name: string): void {
  const idx = _friends.findIndex((f) => f.name === name);
  if (idx !== -1) _friends.splice(idx, 1);
}

export function addFriend(friend: Friend): void {
  if (!_friends.some((f) => f.name === friend.name)) {
    _friends.push(friend);
  }
}

export function getCohortStats(): CohortStat[] {
  return cohortStats;
}
