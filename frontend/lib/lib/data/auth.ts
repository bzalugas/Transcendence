import { currentUser } from "@/lib/mocks/users";
import type { User } from "@/lib/types";

// Backend swap point: replace with `fetch('/api/me')` or a session call.
export function getCurrentUser(): User {
  return currentUser;
}
