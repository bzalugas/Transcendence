export const siteName = "42 Connect";
export const siteDescription =
  "A secure social intranet for 42 students to connect through channels, projects, profiles, and messages.";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://localhost").replace(
    /\/+$/,
    "",
  );
}

export function absoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
