import { createAuthClient } from "better-auth/react";
import { AUTH_BASE_URL } from "@/lib/api-url";

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
});
