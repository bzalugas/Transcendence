import {
  suggestions,
  friendRequests,
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
  // Backend will return the real total. For now, mock count.
  return suggestions.length * 4;
}
