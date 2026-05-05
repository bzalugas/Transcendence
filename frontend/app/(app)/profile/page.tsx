"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/data/auth";

export default function ProfileRedirect() {
  const router = useRouter();
  const { user } = useCurrentUser();

  useEffect(() => {
    if (user) router.replace(`/profile/${user.username}`);
  }, [router, user]);

  return null;
}
