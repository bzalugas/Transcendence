"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import FriendsPanel from "@/components/FriendsPanel";
import MessageComposer from "@/components/MessageComposer";
import ResponsiveRightPanel, { useResponsiveRightPanel } from "@/components/ResponsiveRightPanel";
import PanelToggleIcon from "@/components/icons/PanelToggleIcon";
import { fileUrl, formatFileSize } from "@/lib/data/files";
import {
  getFriendConversations,
  getChatMessages,
  getPendingConv,
  clearPendingConv,
  getOrCreatePrivateConversation,
  joinChat,
  markChatRead,
  messagePreview,
  sendChatMessage,
  sortConversationsByActivity,
  subscribeToChatMessages,
  toChatMessage,
} from "@/lib/data/messages";
import {
  clearUnreadMessageCount,
  getUnreadMessageCounts,
  incrementUnreadMessageCount,
} from "@/lib/data/message-notifications";
import { useCurrentUser } from "@/lib/data/auth";
import type { ChatMessage, Conversation, MessageAttachment } from "@/lib/types";

export default function MessagesPage() {
  const { user: currentUser } = useCurrentUser();
  const {
    desktopOpen: panelDesktopOpen,
    overlayOpen: panelOverlayOpen,
    panelOpen,
    togglePanel,
    closeOverlay,
  } = useResponsiveRightPanel();
  const pending = getPendingConv();
  const [friendConvs, setFriendConvs] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>(() => pending?.id ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">(() =>
    pending ? "chat" : "list",
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingInitialMessageRef = useRef(pending?.initialMessage ?? "");
  const activeIdRef = useRef(activeId);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Clear pending after reading — safe to call multiple times
  useEffect(() => {
    clearPendingConv();
  }, []);

  useEffect(() => {
    let active = true;

    getFriendConversations()
      .then((friendConversations) => {
        if (!active) return;
        setFriendConvs(
          sortConversationsByActivity(
            withUnreadCounts(friendConversations, getUnreadMessageCounts()),
          ),
        );
        setActiveId((currentActiveId) => {
          if (currentActiveId) return currentActiveId;
          return pending?.id ?? friendConversations[0]?.id ?? "";
        });
      })
      .finally(() => {
        if (active) setConversationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pending?.id]);

  const activeConv = friendConvs.find(
    (conversation) => conversation.id === activeId,
  );

  // If no stored conv exists, build a virtual one from pending data so the header always renders
  const effectiveConv: Conversation | undefined = useMemo(
    () =>
      activeConv ??
      (pending && pending.id === activeId
        ? {
            id: pending.id,
            type: "friend" as const,
            name: pending.name,
            initials: pending.initials,
            avatarUrl: pending.avatarUrl,
            level: pending.level,
            otherUserId: pending.otherUserId,
            preview: "",
            time: "",
            online: false,
          }
        : undefined),
    [activeConv, activeId, pending],
  );
  const effectiveConvId = effectiveConv?.id;
  const effectiveConvType = effectiveConv?.type;
  const effectiveConvName = effectiveConv?.name;
  const effectiveConvInitials = effectiveConv?.initials;
  const effectiveConvAvatarUrl = effectiveConv?.avatarUrl;
  const effectiveConvLevel = effectiveConv?.level;
  const effectiveConvOtherUserId = effectiveConv?.otherUserId;
  const messageLoadConversation: Conversation | undefined = useMemo(() => {
    if (!effectiveConvId || !effectiveConvType || !effectiveConvName) {
      return undefined;
    }

    return {
      id: effectiveConvId,
      type: effectiveConvType,
      name: effectiveConvName,
      initials: effectiveConvInitials,
      avatarUrl: effectiveConvAvatarUrl,
      level: effectiveConvLevel,
      otherUserId: effectiveConvOtherUserId,
      preview: "",
      time: "",
    };
  }, [
    effectiveConvAvatarUrl,
    effectiveConvId,
    effectiveConvInitials,
    effectiveConvLevel,
    effectiveConvName,
    effectiveConvOtherUserId,
    effectiveConvType,
  ]);
  const filteredFriendConvs = friendConvs.filter((conv) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    return (
      conv.name.toLowerCase().includes(q) ||
      conv.preview.toLowerCase().includes(q)
    );
  });
  const totalUnreadMessages = friendConvs.reduce(
    (total, conversation) => total + (conversation.unread ?? 0),
    0,
  );

  const updateConversationPreview = useCallback(
    (
      conversationId: string,
      senderId: string,
      preview: string,
      createdAt: string,
      options: { incrementUnread?: boolean } = {},
    ) => {
      const date = new Date(createdAt);
      const time = Number.isNaN(date.getTime())
        ? ""
        : `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

      setFriendConvs((conversations) =>
        sortConversationsByActivity(
          conversations.map((conversation) =>
            isFriendConversationForMessage(conversation, conversationId, senderId)
              ? {
                  ...conversation,
                  id: conversationId,
                  preview,
                  time,
                  lastMessageAt: createdAt,
                  unread: options.incrementUnread
                    ? (conversation.unread ?? 0) + 1
                    : conversation.unread,
                }
              : conversation,
          ),
        ),
      );
    },
    [],
  );

  useEffect(() => {
    let active = true;
    const selectedConversation = messageLoadConversation;

    if (!selectedConversation) {
      queueMicrotask(() => {
        if (active) setMessages([]);
      });
      return () => {
        active = false;
      };
    }

    queueMicrotask(() => {
      if (!active) return;
      setMessagesLoading(true);
      setChatError(null);
    });

    getChatMessages(selectedConversation, currentUser?.id)
      .then(({ conversation, messages: nextMessages }) => {
        if (!active) return;
        setMessages(nextMessages);
        setActiveId(conversation.id);
        clearUnreadMessageCount(conversation.id);
        void markChatRead(conversation.id);
        setFriendConvs((conversations) =>
          conversations.map((candidate) =>
            selectedConversation.type === "friend" &&
            candidate.id === selectedConversation.id
              ? {
                  ...candidate,
                  id: conversation.id,
                  otherUserId:
                    conversation.otherUserId ?? candidate.otherUserId,
                }
              : candidate,
          ),
        );
      })
      .catch((error) => {
        if (active)
          setChatError(
            error instanceof Error ? error.message : "Unable to load messages",
          );
      })
      .finally(() => {
        if (active) setMessagesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    currentUser?.id,
    messageLoadConversation,
  ]);

  useEffect(() => {
    const initialMessage = pendingInitialMessageRef.current.trim();
    if (
      !initialMessage ||
      !activeId ||
      activeId.startsWith("user:")
    )
      return;

    pendingInitialMessageRef.current = "";
    sendChatMessage(activeId, initialMessage, "Private");
  }, [activeId]);

  useEffect(() => {
    return subscribeToChatMessages((message) => {
      const messageChatId = String(message.chatId);
      const isActiveConversation = isMessageForActiveConversation(
        messageChatId,
        message.senderId,
        activeIdRef.current,
        currentUser?.id,
      );

      if (isActiveConversation) {
        if (activeIdRef.current !== messageChatId) {
          activeIdRef.current = messageChatId;
          setActiveId(messageChatId);
          joinChat(messageChatId);
        }
        clearUnreadMessageCount(messageChatId);
        void markChatRead(messageChatId);

        setMessages((currentMessages) => {
          if (
            currentMessages.some(
              (currentMessage) => currentMessage.id === String(message.id),
            )
          ) {
            return currentMessages;
          }

          return [...currentMessages, toChatMessage(message, currentUser?.id)];
        });
      }
      updateConversationPreview(
        messageChatId,
        message.senderId,
        messagePreview(message),
        message.createdAt,
        {
          incrementUnread:
            !isActiveConversation && message.senderId !== currentUser?.id,
        },
      );
      if (!isActiveConversation && message.senderId !== currentUser?.id) {
        incrementUnreadMessageCount(messageChatId);
      }
    }, setChatError);
  }, [currentUser?.id, updateConversationPreview]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!effectiveConv?.id) return;

    requestAnimationFrame(() => {
      composerInputRef.current?.focus();
    });
  }, [effectiveConv]);

  async function handleSend(attachmentIds: number[] = []) {
    const text = inputText.trim();
    if ((!text && attachmentIds.length === 0) || !effectiveConv || !currentUser)
      return;

    try {
      const conversation = effectiveConv.id.startsWith("user:")
        ? await getOrCreatePrivateConversation(effectiveConv)
        : effectiveConv;

      if (conversation.id !== activeId) {
        setActiveId(conversation.id);
      }

      joinChat(conversation.id);
      sendChatMessage(conversation.id, text, "Private", attachmentIds);
      setInputText("");
    } catch (error) {
      setChatError(
        error instanceof Error ? error.message : "Unable to send message",
      );
    }
  }

  function selectConversation(conversation: Conversation) {
    setActiveId(conversation.id);
    setMobileView("chat");
    clearConversationUnread(conversation.id);
    if (!conversation.id.startsWith("user:")) {
      clearUnreadMessageCount(conversation.id);
      void markChatRead(conversation.id);
    }
  }

  function clearConversationUnread(
    conversationId: string,
  ) {
    setFriendConvs((conversations) =>
      conversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unread: undefined }
          : conversation,
      ),
    );
  }

  return (
    <>
      {/* Conversation list */}
      <div
        className={`${mobileView === "chat" ? "hidden" : "flex"} min-h-0 w-full shrink-0 flex-col overflow-hidden bg-bg-secondary lg:flex lg:h-auto lg:w-[270px] lg:border-r lg:border-border-default`}
      >
        <div className="border-b border-border-default px-4 pb-3.5 pt-5 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[20px] font-semibold text-text-primary">
              Messages
            </div>
            {totalUnreadMessages > 0 && (
              <UnreadBadge count={totalUnreadMessages} />
            )}
          </div>
          <div className="mt-1 text-[12.5px] text-text-muted">
            Direct messages
          </div>
        </div>

        <div className="hidden h-[62px] items-center justify-between gap-3 border-b border-border-default px-4 lg:flex">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-text-primary">
              Messages
            </div>
            <div className="mt-0.5 text-[11.5px] text-text-muted">
              Direct messages
            </div>
          </div>
          {totalUnreadMessages > 0 && (
            <UnreadBadge count={totalUnreadMessages} />
          )}
        </div>

        {/* Search */}
        <div className="flex h-[62px] items-center border-b border-border-default px-4">
          <div className="flex w-full items-center gap-2 rounded-full bg-bg-hover px-[13px] py-2 text-[13px] text-text-muted">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-muted"
              placeholder="Search..."
            />
          </div>
        </div>

        {/* Conv list */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pb-1.5 pt-3.5 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
            Friends
          </div>
          {conversationsLoading && (
            <div className="px-4 py-3 text-[12.5px] text-text-muted">
              Loading conversations...
            </div>
          )}
          {filteredFriendConvs.map((c) => (
            <ConversationRow
              key={`friend:${c.id}`}
              conv={c}
              active={activeId === c.id}
              onClick={() => selectConversation(c)}
            />
          ))}
          {!conversationsLoading && filteredFriendConvs.length === 0 && (
            <div className="px-4 py-3 text-[12.5px] text-text-muted">
              No conversation found.
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div
        className={`${mobileView === "list" ? "hidden" : "flex"} min-h-0 flex-1 flex-col bg-bg-tertiary lg:flex`}
      >
        {/* Chat header */}
        {effectiveConv && (
          <ChatHeader
            conv={effectiveConv}
            onBack={() => setMobileView("list")}
            panelOpen={panelOpen}
            onTogglePanel={togglePanel}
          />
        )}

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4 sm:px-[22px] sm:py-[22px]">
          {messagesLoading && (
            <div className="text-[12.5px] text-text-muted">
              Loading messages...
            </div>
          )}
          {chatError && (
            <div className="text-[12.5px] text-red-400">{chatError}</div>
          )}
          {messages.map((msg, idx) => (
            <div key={msg.id ?? idx}>
              <div
                className={`mb-[5px] text-[11px] font-medium text-text-muted ${msg.me ? "pr-[39px] text-right" : "pl-[39px]"}`}
              >
                {msg.sender}
              </div>
              <div
                className={`flex min-w-0 items-end gap-[9px] ${msg.me ? "flex-row-reverse" : ""}`}
              >
                <Avatar initials={msg.initials} size="md" />
                <div
                  className={`min-w-0 max-w-[calc(100vw-96px)] overflow-hidden rounded-[14px] px-3.5 py-2.5 text-[13.5px] leading-relaxed sm:max-w-[min(420px,68vw)] ${
                    msg.me
                      ? "bg-contrast-soft-bg text-contrast-soft-text"
                      : "border border-border-default bg-bg-secondary text-text-primary"
                  }`}
                >
                  {msg.text && <div className="whitespace-pre-wrap break-words">{msg.text}</div>}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div
                      className={`mt-2 grid gap-2 ${msg.text ? "" : "mt-0"}`}
                    >
                      {msg.attachments.map((attachment) => (
                        <MessageAttachmentCard
                          key={attachment.id}
                          attachment={attachment}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <span className="hidden shrink-0 px-1 text-[10.5px] text-text-dimmed sm:inline">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <MessageComposer
          inputRef={composerInputRef}
          value={inputText}
          onChange={setInputText}
          onSend={handleSend}
          placeholder="Write a message..."
        />
      </div>

      <ResponsiveRightPanel
        desktopOpen={panelDesktopOpen}
        overlayOpen={panelOverlayOpen}
        onCloseOverlay={closeOverlay}
      >
        <FriendsPanel />
      </ResponsiveRightPanel>
    </>
  );
}

function withUnreadCounts(
  conversations: Conversation[],
  unreadCounts: Record<string, number>,
): Conversation[] {
  return conversations.map((conversation) => ({
    ...conversation,
    unread: unreadCounts[conversation.id] || conversation.unread,
  }));
}

function isMessageForActiveConversation(
  messageChatId: string,
  senderId: string,
  activeId: string,
  currentUserId?: string,
): boolean {
  if (messageChatId === activeId) return true;
  if (senderId === currentUserId) return false;

  return activeId === `user:${senderId}`;
}

function isFriendConversationForMessage(
  conversation: Conversation,
  messageChatId: string,
  senderId: string,
): boolean {
  if (conversation.id === messageChatId) return true;
  if (conversation.type !== "friend") return false;

  return (
    conversation.id === `user:${senderId}` ||
    conversation.otherUserId === senderId
  );
}

function UnreadBadge({ count }: { count: number }) {
  return (
    <span className="shrink-0 rounded-[10px] bg-text-primary px-1.5 py-px text-[10px] font-semibold text-bg-tertiary">
      {count}
    </span>
  );
}

function MessageAttachmentCard({
  attachment,
}: {
  attachment: MessageAttachment;
}) {
  const canPreview =
    attachment.category === "image" ||
    attachment.mimeType === "application/pdf" ||
    attachment.mimeType === "text/plain";

  return (
    <a
      href={fileUrl(
        canPreview ? attachment.previewUrl : attachment.downloadUrl,
      )}
      target="_blank"
      rel="noreferrer"
      className="flex min-w-0 items-center gap-2 rounded-[8px] border border-border-default bg-bg-hover/60 p-2 text-left transition-colors hover:border-border-strong"
    >
      {attachment.category === "image" ? (
        <img
          src={fileUrl(attachment.previewUrl)}
          alt={attachment.originalName}
          className="h-12 w-12 shrink-0 rounded-[6px] object-cover"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] bg-bg-secondary text-[10px] font-semibold uppercase text-text-muted">
          {attachment.type === "archive" ? "zip" : "file"}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-medium text-text-primary">
          {attachment.originalName}
        </span>
        <span className="mt-0.5 block text-[11px] text-text-muted">
          {formatFileSize(attachment.sizeBytes)}
        </span>
      </span>
    </a>
  );
}

function ConversationRow({
  conv,
  active,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const unreadCount = conv.unread ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-hover lg:gap-2.5 lg:py-2.5 ${
        active ? "bg-bg-hover" : ""
      }`}
    >
      <Avatar initials={conv.initials!} avatarUrl={conv.avatarUrl} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-medium lg:text-[13px]">
          {conv.name}
        </div>
        <div className="mt-0.5 truncate text-[12.5px] text-text-muted lg:text-[12px]">
          {conv.preview}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[11px] text-text-dimmed">{conv.time}</span>
        {unreadCount > 0 && (
          <span className="flex h-[17px] w-[17px] items-center justify-center rounded-full bg-contrast-soft-bg text-[10px] font-semibold text-contrast-soft-text">
            {unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}

function ChatHeader({
  conv,
  onBack,
  panelOpen,
  onTogglePanel,
}: {
  conv: Conversation;
  onBack: () => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
}) {
  return (
    <div className="flex h-[62px] items-center gap-3 border-b border-border-default bg-bg-secondary px-4 sm:px-[22px]">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary lg:hidden"
        aria-label="Back to conversations"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>
      <Avatar initials={conv.initials!} avatarUrl={conv.avatarUrl} size="lg" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${encodeURIComponent(conv.name)}`}
            className="truncate text-[14px] font-medium transition-colors hover:text-text-muted"
          >
            {conv.name}
          </Link>
          {conv.level !== undefined && (
            <span className="shrink-0 text-[12px] text-text-muted">
              Level {conv.level}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onTogglePanel}
        className={`ml-auto flex items-center rounded-[5px] p-1 transition-colors hover:bg-bg-hover hover:text-text-primary ${
          panelOpen ? "text-text-dimmed" : "bg-bg-hover text-text-primary"
        }`}
        title="Toggle panel"
      >
        <PanelToggleIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
