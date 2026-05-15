import {
  chatMessages,
} from "@/lib/mocks/messages";
import { getFriends } from "@/lib/data/friends";
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

export async function getFriendConversations(): Promise<Conversation[]> {
  const friends = await getFriends();

  return friends.map((friend) => {
    const conversationId = toConversationId(friend.name);
    const seedMessages = ensureConversationMessages(
      conversationId,
      friend.name,
      friend.initials,
    );
    const lastMessage = seedMessages[seedMessages.length - 1];

    return {
      id: conversationId,
      type: "friend",
      name: friend.name,
      initials: friend.initials,
      avatarUrl: friend.avatarUrl,
      level: friend.level,
      preview: lastMessage?.text ?? "",
      time: lastMessage?.time ?? "",
    };
  });
}

export async function getConversationById(id: string): Promise<Conversation | undefined> {
  const conversations = await getFriendConversations();
  return conversations.find((conversation) => conversation.id === id);
}

export function getChatMessages(
  conversationId: string,
  conversationName?: string,
  initials?: string,
): ChatMessage[] {
  ensureConversationMessages(conversationId, conversationName, initials);
  return chatMessages[conversationId] ?? [];
}

// Backend swap point: replace with POST /api/messages/:convId
export function addChatMessage(convId: string, msg: ChatMessage): void {
  if (!chatMessages[convId]) chatMessages[convId] = [];
  chatMessages[convId].push(msg);
}

function toConversationId(name: string): string {
  return `fr-${name.trim().toLowerCase()}`;
}

function ensureConversationMessages(
  conversationId: string,
  conversationName?: string,
  initials?: string,
): ChatMessage[] {
  if (chatMessages[conversationId]) {
    return chatMessages[conversationId];
  }

  if (!conversationName || !initials) {
    chatMessages[conversationId] = [];
    return chatMessages[conversationId];
  }

  chatMessages[conversationId] = [
    {
      sender: conversationName,
      initials,
      text: `Hey, we can talk here whenever you want.`,
      time: "09:00",
    },
  ];

  return chatMessages[conversationId];
}
