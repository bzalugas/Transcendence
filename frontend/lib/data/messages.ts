import { io, type Socket } from "socket.io-client";
import { API_BASE_URL, API_ORIGIN } from "@/lib/api-url";
import { getJoinedChannels } from "@/lib/data/channels";
import { getFriends } from "@/lib/data/friends";
import { notifyNavBadgesUpdated } from "@/lib/data/nav-events";
import type { ChatMessage, Conversation, MessageAttachment } from "@/lib/types";

// Pending conversation to open when navigating to /messages.
// Stores full user info so the header renders even without an existing conv.
interface PendingConv {
  id: string;
  otherUserId?: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  level: number;
  initialMessage?: string;
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
  const [friends, chats] = await Promise.all([
    getFriends(),
    request<ApiChat[]>("/chats"),
  ]);
  const privateChats = chats.filter((chat) => chat.type === "Private");

  return sortConversationsByActivity(
    friends.map((friend) => {
      const privateChat = privateChats.find((chat) =>
        chat.users.some((user) => user.id === friend.id),
      );
      const lastMessage = privateChat?.lastMessage;

      return {
        id: privateChat
          ? String(privateChat.id)
          : toPendingConversationId(friend.id),
        type: "friend",
        name: friend.name,
        initials: friend.initials,
        avatarUrl: friend.avatarUrl,
        level: friend.level,
        otherUserId: friend.id,
        preview: messagePreview(lastMessage),
        time: lastMessage ? formatTime(lastMessage.createdAt) : "",
        lastMessageAt: lastMessage?.createdAt,
        unread: privateChat?.unreadCount,
      };
    }),
  );
}

export async function getChannelConversations(): Promise<Conversation[]> {
  const [joinedChannels, chats] = await Promise.all([
    getJoinedChannels(),
    request<ApiChat[]>("/chats"),
  ]);
  const channelChats = chats.filter((chat) => chat.type === "Interest");

  const conversations = await Promise.all(
    joinedChannels.map(async (channel) => {
      const chat =
        channelChats.find(
          (candidate) => candidate.channel?.slug === channel.slug,
        ) ??
        (await request<ApiChat>(
          `/chats/channel/${encodeURIComponent(channel.slug)}`,
          {
            method: "POST",
          },
        ));
      const lastMessage = chat.lastMessage;

      return {
        id: String(chat.id),
        type: "channel" as const,
        name: channel.label,
        initials: initials(channel.label),
        channelSlug: channel.slug,
        channelColor: channel.color,
        preview: messagePreview(lastMessage),
        time: lastMessage ? formatTime(lastMessage.createdAt) : "",
        lastMessageAt: lastMessage?.createdAt,
        unread: chat.unreadCount,
      };
    }),
  );

  return sortConversationsByActivity(conversations);
}

export async function getConversationById(
  id: string,
): Promise<Conversation | undefined> {
  const [friendConversations, channelConversations] = await Promise.all([
    getFriendConversations(),
    getChannelConversations(),
  ]);
  const conversations = [...friendConversations, ...channelConversations];
  return conversations.find((conversation) => conversation.id === id);
}

export async function getChatMessages(
  conversation: Conversation,
  currentUserId?: string,
): Promise<{ conversation: Conversation; messages: ChatMessage[] }> {
  const chat = await ensureChat(conversation);
  const messages = await request<ApiMessage[]>(`/chats/${chat.id}/messages`);

  return {
    conversation: {
      ...conversation,
      id: String(chat.id),
      otherUserId:
        getOtherUser(chat, currentUserId)?.id ?? conversation.otherUserId,
    },
    messages: messages.map((message) => toChatMessage(message, currentUserId)),
  };
}

export async function getOrCreatePrivateConversation(
  conversation: Conversation,
): Promise<Conversation> {
  if (conversation.type !== "friend") {
    throw new Error("A private conversation is required");
  }

  const chat = await ensureChat(conversation);

  return {
    ...conversation,
    id: String(chat.id),
  };
}

export async function getOrCreateChannelChat(slug: string): Promise<ApiChat> {
  return request<ApiChat>(`/chats/channel/${encodeURIComponent(slug)}`, {
    method: "POST",
  });
}

export async function getChatMessagesById(
  chatId: string | number,
  currentUserId?: string,
): Promise<ChatMessage[]> {
  const messages = await request<ApiMessage[]>(`/chats/${chatId}/messages`);
  return messages.map((message) => toChatMessage(message, currentUserId));
}

export function joinChat(chatId: string): void {
  const socket = getChatSocket();
  if (!socket.connected) socket.connect();
  socket.emit("chat:join", { chatId });
}

export function leaveChat(chatId: string): void {
  getChatSocket().emit("chat:leave", { chatId });
}

export function sendChatMessage(
  chatId: string,
  content: string,
  chatType: "Private" | "Interest",
  attachmentIds: number[] = [],
): void {
  const socket = getChatSocket();
  if (!socket.connected) socket.connect();
  socket.emit("chat:message", { chatId, content, chatType, attachmentIds });
}

export async function markChatRead(chatId: string | number): Promise<void> {
  await request(`/chats/${chatId}/read`, {
    method: "POST",
  });
  notifyNavBadgesUpdated();
}

export function subscribeToChatMessages(
  listener: (message: ApiMessage) => void,
  onError?: (message: string) => void,
): () => void {
  const socket = getChatSocket();
  const handleMessage = (message: ApiMessage) => listener(message);
  const handleError = (error: { message?: string }) => {
    onError?.(error.message ?? "Chat error");
  };

  socket.on("chat:message", handleMessage);
  socket.on("chat:error", handleError);

  return () => {
    socket.off("chat:message", handleMessage);
    socket.off("chat:error", handleError);
  };
}

export function toChatMessage(
  message: ApiMessage,
  currentUserId?: string,
): ChatMessage {
  return {
    id: String(message.id),
    chatId: String(message.chatId),
    sender: message.sender.username,
    initials: message.sender.initials,
    text: message.content,
    time: formatTime(message.createdAt),
    createdAt: message.createdAt,
    me: message.senderId === currentUserId,
    attachments: message.attachments,
  };
}

export function messagePreview(message?: ApiMessage): string {
  if (!message) return "";
  if (message.content) return message.content;
  if (!message.attachments || message.attachments.length === 0) return "";

  return message.attachments.length === 1
    ? `Attachment: ${message.attachments[0].originalName}`
    : `${message.attachments.length} attachments`;
}

export function sortConversationsByActivity(
  conversations: Conversation[],
): Conversation[] {
  return [...conversations].sort((left, right) => {
    const leftTime = left.lastMessageAt
      ? new Date(left.lastMessageAt).getTime()
      : 0;
    const rightTime = right.lastMessageAt
      ? new Date(right.lastMessageAt).getTime()
      : 0;

    if (leftTime !== rightTime) return rightTime - leftTime;
    return left.name.localeCompare(right.name);
  });
}

function toPendingConversationId(userId?: string): string {
  return userId ? `user:${userId}` : "user:unknown";
}

async function ensureChat(conversation: Conversation): Promise<ApiChat> {
  if (!conversation.id.startsWith("user:")) {
    const chats = await request<ApiChat[]>("/chats");
    const chat = chats.find(
      (candidate) => String(candidate.id) === conversation.id,
    );
    if (!chat) throw new Error("Chat not found");
    assertChatMatchesConversation(chat, conversation);
    return chat;
  }

  if (conversation.type !== "friend") {
    throw new Error("Only private conversations can be created from a user id");
  }

  if (!conversation.otherUserId) {
    throw new Error("Friend id is required to create a private chat");
  }

  return request<ApiChat>(
    `/chats/private/${encodeURIComponent(conversation.otherUserId)}`,
    {
      method: "POST",
    },
  );
}

function assertChatMatchesConversation(
  chat: ApiChat,
  conversation: Conversation,
): void {
  if (conversation.type === "friend" && chat.type !== "Private") {
    throw new Error("Selected conversation is not a private chat");
  }

  if (conversation.type === "channel") {
    if (chat.type !== "Interest") {
      throw new Error("Selected conversation is not a channel chat");
    }

    if (
      conversation.channelSlug &&
      chat.channel?.slug !== conversation.channelSlug
    ) {
      throw new Error("Selected channel chat does not match the channel");
    }
  }
}

function getOtherUser(
  chat: ApiChat,
  currentUserId?: string,
): ApiChatUser | undefined {
  return chat.users.find((user) => user.id !== currentUserId);
}

function getChatSocket(): Socket {
  if (!chatSocket) {
    chatSocket = io(API_ORIGIN, {
      autoConnect: false,
      path: "/api/socket.io",
      withCredentials: true,
    });
  }

  return chatSocket;
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `${init?.method ?? "GET"} ${path} failed with ${response.status}`,
    );
  }

  const body = await response.text();
  if (!body) return undefined as T;

  return JSON.parse(body);
}

let chatSocket: Socket | null = null;

interface ApiChatUser {
  id: string;
  username: string;
  initials: string;
  avatarUrl?: string;
}

export interface ApiChat {
  id: number;
  name: string;
  type: "Interest" | "Group" | "Private";
  channel?: {
    id: number;
    slug: string;
    label: string;
    color: string;
    imageUri: string | null;
  };
  users: ApiChatUser[];
  lastMessage?: ApiMessage;
  unreadCount: number;
}

export interface ApiMessage {
  id: number;
  chatId: number;
  chatType: "Interest" | "Group" | "Private";
  senderId: string;
  content: string;
  type: "Normal" | "Auto";
  createdAt: string;
  sender: ApiChatUser;
  attachments: MessageAttachment[];
}

function initials(value: string): string {
  const parts = value
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toLowerCase();
  }

  return value.slice(0, 2).toLowerCase();
}
