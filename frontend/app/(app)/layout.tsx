"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import MessageNotificationsProvider from "@/components/MessageNotificationsProvider";
import Sidebar from "@/components/Sidebar";
import { useCurrentUser } from "@/lib/data/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser, isPending, isAuthenticated, isBanned } = useCurrentUser();
  const isAdminPage = pathname?.startsWith("/admin");

  useEffect(() => {
    if (!isPending && isBanned) {
      router.replace("/login/banned");
      return;
    }

    if (!isPending && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isPending, isAuthenticated, isBanned, router]);

  if (isPending || !isAuthenticated || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-tertiary text-[13px] text-text-muted">
        Loading session...
      </div>
    );
  }

  return (
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
  );
}
