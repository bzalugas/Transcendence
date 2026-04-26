"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/data/auth";

export default function ProfileRedirect() {
  const router = useRouter();
  const { username } = getCurrentUser();

  useEffect(() => {
    router.replace(`/profile/${username}`);
  }, [router, username]);

  return null;
}
