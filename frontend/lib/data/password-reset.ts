import { AUTH_BASE_URL } from "@/lib/api-url";

export async function requestPasswordReset(email: string, redirectTo: string): Promise<void> {
  await request("/request-password-reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, redirectTo }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await request("/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, newPassword }),
  });
}

async function request(path: string, init: RequestInit): Promise<void> {
  const response = await fetch(`${AUTH_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} failed with ${response.status}`);
  }
}
