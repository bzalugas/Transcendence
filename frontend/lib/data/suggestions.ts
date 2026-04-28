import {
  suggestions,
  friendRequests,
  suggestionsTotal,
  type SuggestionProfile,
} from "@/lib/mocks/suggestions";

// Backend swap point: replace with real API calls.

export function getSuggestions(): SuggestionProfile[] {
  return suggestions;
}

export function getFriendRequests() {
  return friendRequests;
}

export function getSuggestionsTotal(): number {
  return suggestionsTotal;
}

// Module-level sent requests — persists across navigations during the session
const _sentRequests = new Set<string>();

export function sendFriendRequest(name: string): void {
  _sentRequests.add(name);
}

export function getSentRequestNames(): string[] {
  return Array.from(_sentRequests);
}
