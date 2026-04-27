import { navBadges } from "@/lib/mocks/nav";
import type { NavBadges } from "@/lib/types";

// Backend swap point: replace with realtime counts (eg. WebSocket-driven).
export function getNavBadges(): NavBadges {
  return navBadges;
}
