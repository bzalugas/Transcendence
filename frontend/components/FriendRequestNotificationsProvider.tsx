"use client";

import { useEffect } from "react";
import { subscribeToFriendRequests } from "@/lib/data/suggestions";
import { notifyNavBadgesUpdated } from "@/lib/data/nav-events";

export default function FriendRequestNotificationsProvider() {
  useEffect(() => {
    return subscribeToFriendRequests(() => {
      notifyNavBadgesUpdated();
    });
  }, []);

  return null;
}
