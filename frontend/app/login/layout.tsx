"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FallingPattern } from "@/components/ui/falling-pattern";
import { useCurrentUser } from "@/lib/data/auth";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isPending, isAuthenticated } = useCurrentUser();

  useEffect(() => {
    if (!isPending && isAuthenticated) {
      router.replace("/");
    }
  }, [isPending, isAuthenticated, router]);

  if (isPending || isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center bg-bg-tertiary text-[13px] text-text-muted">
        Checking session...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <FallingPattern
          color="var(--primary)"
          duration={150}
          blurIntensity="1rem"
          density={1.5}

        />
      </div>
      <div className="relative z-10 h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
