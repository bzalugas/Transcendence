import { currentUser } from "@/lib/mocks/users";
import type { User } from "@/lib/types";

// Module-level mutable user state — backend swap: replace with session/JWT.
const _user: User = { ...currentUser };

export function getCurrentUser(): User {
  return _user;
}

// Backend swap point: replace with PATCH /api/me
export function updateCurrentUser(updates: Partial<Pick<User, "username" | "bio" | "initials">>): void {
  Object.assign(_user, updates);
}
