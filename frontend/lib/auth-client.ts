import { createAuthClient } from "better-auth/react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

export const authClient = createAuthClient(
  apiBaseUrl ? { baseURL: `${apiBaseUrl}/api/auth` } : undefined,
);
