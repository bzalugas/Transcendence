const rawApiUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_FRONTEND_URL?.replace(/\/+$/, "") ??
  "https://localhost";
const apiOrigin = rawApiUrl?.endsWith("/api")
  ? rawApiUrl.slice(0, -4)
  : rawApiUrl;

export const API_ORIGIN = apiOrigin ?? "";
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const AUTH_BASE_URL = `${API_BASE_URL}/auth`;
