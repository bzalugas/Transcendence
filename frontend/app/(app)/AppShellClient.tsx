"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import MessageNotificationsProvider from "@/components/MessageNotificationsProvider";
import Sidebar from "@/components/Sidebar";
import { CurrentUserProvider } from "@/lib/data/auth";
import type { User } from "@/lib/types";

export default function AppShellClient({
  currentUser,
  children,
}: {
  currentUser: User;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <CurrentUserProvider user={currentUser}>
      <div className="flex h-dvh overflow-hidden">
        <MessageNotificationsProvider currentUserId={currentUser.id} />
        {!isAdminPage && <Sidebar />}
        <div
          className={`flex flex-1 flex-col overflow-hidden md:flex-row ${
            isAdminPage ? "pb-0" : "pb-16 md:pb-0"
          }`}
        >
          {children}
        </div>
      </div>
    </CurrentUserProvider>
  );
}
