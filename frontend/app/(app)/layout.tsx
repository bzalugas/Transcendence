import type { Metadata } from "next";
import AppShellClient from "./AppShellClient";
import { requireCurrentUser } from "@/lib/server/api";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

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
