import { homeFeed } from "@/lib/mocks/homeFeed";
import type { HomeFeedItem } from "@/lib/types";

// Backend swap point: replace with `fetch('/api/feed')` when the API is ready.
export function getHomeFeed(): HomeFeedItem[] {
  return homeFeed;
}
