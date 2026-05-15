"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  getFriendConversations,
  joinChat,
  leaveChat,
  subscribeToChatMessages,
} from "@/lib/data/messages";
import { incrementUnreadMessageCount } from "@/lib/data/message-notifications";

export default function MessageNotificationsProvider({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const pathname = usePathname();
  const isMessagesPage = pathname.startsWith("/messages");

  useEffect(() => {
    let active = true;
    const joinedChatIds = new Set<string>();

    getFriendConversations()
      .then((friendConversations) => {
        if (!active) return;

        for (const conversation of friendConversations) {
          if (!conversation.id || conversation.id.startsWith("user:")) {
            continue;
          }

          joinedChatIds.add(conversation.id);
          joinChat(conversation.id);
        }
      })
      .catch(() => {
        // Notification joins are opportunistic; the messages page can still load errors itself.
      });

    return () => {
      active = false;
      for (const chatId of joinedChatIds) {
        leaveChat(chatId);
      }
    };
  }, [currentUserId]);

  useEffect(() => {
    return subscribeToChatMessages((message) => {
      if (isMessagesPage || message.senderId === currentUserId) return;

      incrementUnreadMessageCount(message.chatId);
    });
  }, [currentUserId, isMessagesPage]);

  return null;
}
