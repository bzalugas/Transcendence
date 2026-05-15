"use client";

import { useCurrentUser } from "@/lib/data/auth";

export default function AdminPage() {
  const { user, isPending } = useCurrentUser();

  if (isPending) return null;

  if (user?.role !== "ADMIN") {
    return (
      <div className="flex flex-1 items-center justify-center bg-bg-tertiary px-6">
        <div className="text-center">
          <div className="text-[18px] font-semibold text-text-primary">
            Admin access required
          </div>
          <div className="mt-2 text-[13px] text-text-muted">
            This area is only available to administrators.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 items-center justify-center bg-bg-tertiary px-6 md:hidden">
        <div className="max-w-[320px] text-center">
          <div className="text-[18px] font-semibold text-text-primary">
            Admin panel unavailable on mobile
          </div>
          <div className="mt-2 text-[13px] leading-relaxed text-text-muted">
            Please use a desktop screen to manage users, channels, and requests.
          </div>
        </div>
      </div>

      <div className="hidden flex-1 flex-col bg-bg-tertiary px-8 py-7 md:flex">
        <div className="text-[20px] font-semibold text-text-primary">
          Admin panel
        </div>
        <div className="mt-1 text-[13px] text-text-muted">
          Management tools will live here.
        </div>
      </div>
    </>
  );
}
