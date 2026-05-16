import AppShellClient from "./AppShellClient";
import { requireCurrentUser } from "@/lib/server/api";
import type { ReactNode } from "react";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const currentUser = await requireCurrentUser();

  return (
    <AppShellClient currentUser={currentUser}>
      {children}
    </AppShellClient>
  );
}
