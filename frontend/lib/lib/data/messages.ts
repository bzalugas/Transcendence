import {
  friendConversations,
  channelConversations,
  chatMessages,
} from "@/lib/mocks/messages";
import type { ChatMessage, Conversation } from "@/lib/types";

// Backend swap point: replace each function body with `fetch('/api/...')`.

export function getFriendConversations(): Conversation[] {
  return friendConversations;
}

export function getChannelConversations(): Conversation[] {
  return channelConversations;
}

export function getConversationById(id: string): Conversation | undefined {
  return [...friendConversations, ...channelConversations].find(
    (c) => c.id === id,
  );
}

export function getChatMessages(conversationId: string): ChatMessage[] {
  return chatMessages[conversationId] ?? [];
}
