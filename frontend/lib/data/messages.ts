import {
  friendConversations,
  chatMessages,
} from "@/lib/mocks/messages";
import type { ChatMessage, Conversation } from "@/lib/types";

// Pending conversation to open when navigating to /messages.
// Stores full user info so the header renders even without an existing conv.
interface PendingConv {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  level: number;
}

let _pendingConv: PendingConv | null = null;

export function setPendingConv(data: PendingConv): void {
  _pendingConv = data;
}

export function getPendingConv(): PendingConv | null {
  return _pendingConv;
}

export function clearPendingConv(): void {
  _pendingConv = null;
}

// Backend swap point: replace each function body with `fetch('/api/...')`.

export function getFriendConversations(): Conversation[] {
  return friendConversations;
}

export function getConversationById(id: string): Conversation | undefined {
  return friendConversations.find((c) => c.id === id);
}

export function getChatMessages(conversationId: string): ChatMessage[] {
  return chatMessages[conversationId] ?? [];
}

// Backend swap point: replace with POST /api/messages/:convId
export function addChatMessage(convId: string, msg: ChatMessage): void {
  if (!chatMessages[convId]) chatMessages[convId] = [];
  chatMessages[convId].push(msg);
}
