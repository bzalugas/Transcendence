"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import FriendsPanel from "@/components/FriendsPanel";
import MessageComposer from "@/components/MessageComposer";
import PanelToggleIcon from "@/components/icons/PanelToggleIcon";
import {
  getChannelConversations,
  getFriendConversations,
  getChatMessages,
  getPendingConv,
  clearPendingConv,
  getOrCreatePrivateConversation,
  joinChat,
  leaveChat,
  sendChatMessage,
  subscribeToChatMessages,
  toChatMessage,
} from "@/lib/data/messages";
import { useCurrentUser } from "@/lib/data/auth";
import type { ChatMessage, Conversation } from "@/lib/types";

export default function MessagesPage() {
  const { user: currentUser } = useCurrentUser();
  const [showPanel, setShowPanel] = useState(true);
  const pending = getPendingConv();
  const [friendConvs, setFriendConvs] = useState<Conversation[]>([]);
  const [channelConvs, setChannelConvs] = useState<Conversation[]>([]);
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
  const composerInputRef = useRef<HTMLInputElement | null>(null);
  const pendingInitialMessageRef = useRef(pending?.initialMessage ?? "");

  // Clear pending after reading — safe to call multiple times
  useEffect(() => {
    clearPendingConv();
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([getFriendConversations(), getChannelConversations()])
      .then(([friendConversations, channelConversations]) => {
        if (!active) return;
        setFriendConvs(friendConversations);
        setChannelConvs(channelConversations);
        setActiveId((currentActiveId) => {
          if (currentActiveId) return currentActiveId;
          return (
            pending?.id ??
            friendConversations[0]?.id ??
            channelConversations[0]?.id ??
            ""
          );
        });
      })
      .finally(() => {
        if (active) setConversationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pending?.id]);

  const activeConv =
    friendConvs.find((conversation) => conversation.id === activeId) ??
    channelConvs.find((conversation) => conversation.id === activeId);

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
  const filteredFriendConvs = friendConvs.filter((conv) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    return (
      conv.name.toLowerCase().includes(q) ||
      conv.preview.toLowerCase().includes(q)
    );
  });
  const filteredChannelConvs = channelConvs.filter((conv) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    return (
      conv.name.toLowerCase().includes(q) ||
      conv.preview.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (!effectiveConv) {
      setMessages([]);
      return;
    }

    let active = true;
    setMessagesLoading(true);
    setChatError(null);

    getChatMessages(effectiveConv, currentUser?.id)
      .then(({ conversation, messages: nextMessages }) => {
        if (!active) return;
        setMessages(nextMessages);
        setActiveId(conversation.id);
        setFriendConvs((conversations) =>
          conversations.map((candidate) =>
            candidate.id === effectiveConv.id
              ? {
                  ...candidate,
                  id: conversation.id,
                  otherUserId:
                    conversation.otherUserId ?? candidate.otherUserId,
                }
              : candidate,
          ),
        );
        setChannelConvs((conversations) =>
          conversations.map((candidate) =>
            candidate.id === effectiveConv.id
              ? {
                  ...candidate,
                  id: conversation.id,
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
  }, [currentUser?.id, effectiveConv?.id]);

  useEffect(() => {
    if (!activeId || activeId.startsWith("user:")) return;

    joinChat(activeId);
    return () => {
      leaveChat(activeId);
    };
  }, [activeId]);

  useEffect(() => {
    const initialMessage = pendingInitialMessageRef.current.trim();
    if (!initialMessage || !activeId || activeId.startsWith("user:")) return;

    pendingInitialMessageRef.current = "";
    sendChatMessage(activeId, initialMessage);
  }, [activeId]);

  useEffect(() => {
    return subscribeToChatMessages((message) => {
      if (String(message.chatId) !== activeId) return;
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
      updateConversationPreview(
        String(message.chatId),
        message.content,
        message.createdAt,
      );
    }, setChatError);
  }, [activeId, currentUser?.id]);

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

  async function handleSend() {
    const text = inputText.trim();
    if (!text || !effectiveConv || !currentUser) return;

    try {
      const conversation = activeId.startsWith("user:")
        ? await getOrCreatePrivateConversation(effectiveConv)
        : effectiveConv;

      if (conversation.id !== activeId) {
        setActiveId(conversation.id);
      }

      joinChat(conversation.id);
      sendChatMessage(conversation.id, text);
      setInputText("");
    } catch (error) {
      setChatError(
        error instanceof Error ? error.message : "Unable to send message",
      );
    }
  }

  function selectConversation(id: string) {
    setActiveId(id);
    setMobileView("chat");
  }

  function updateConversationPreview(
    conversationId: string,
    preview: string,
    createdAt: string,
  ) {
    const date = new Date(createdAt);
    const time = Number.isNaN(date.getTime())
      ? ""
      : `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

    setFriendConvs((conversations) =>
      conversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, preview, time }
          : conversation,
      ),
    );
    setChannelConvs((conversations) =>
      conversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, preview, time }
          : conversation,
      ),
    );
  }

  return (
    <>
      {/* Conversation list */}
      <div
        className={`${mobileView === "chat" ? "hidden" : "flex"} min-h-0 w-full shrink-0 flex-col overflow-hidden bg-bg-secondary md:flex md:h-auto md:w-[270px] md:border-r md:border-border-default`}
      >
        <div className="border-b border-border-default px-4 pb-3.5 pt-5 md:hidden">
          <div className="text-[20px] font-semibold text-text-primary">
            Messages
          </div>
          <div className="mt-1 text-[12.5px] text-text-muted">
            Direct messages
          </div>
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
              key={c.id}
              conv={c}
              active={activeId === c.id}
              onClick={() => selectConversation(c.id)}
            />
          ))}
          {!conversationsLoading && filteredFriendConvs.length === 0 && (
            <div className="px-4 py-3 text-[12.5px] text-text-muted">
              No conversation found.
            </div>
          )}

          <div className="px-4 pb-1.5 pt-5 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
            Channel chats
          </div>
          {conversationsLoading && (
            <div className="px-4 py-3 text-[12.5px] text-text-muted">
              Loading channel chats...
            </div>
          )}
          {filteredChannelConvs.map((c) => (
            <ConversationRow
              key={c.id}
              conv={c}
              active={activeId === c.id}
              onClick={() => selectConversation(c.id)}
            />
          ))}
          {!conversationsLoading && filteredChannelConvs.length === 0 && (
            <div className="px-4 py-3 text-[12.5px] text-text-muted">
              No channel chat found.
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div
        className={`${mobileView === "list" ? "hidden" : "flex"} min-h-0 flex-1 flex-col bg-bg-tertiary md:flex`}
      >
        {/* Chat header */}
        {effectiveConv && (
          <ChatHeader
            conv={effectiveConv}
            onBack={() => setMobileView("list")}
            showPanel={showPanel}
            onTogglePanel={() => setShowPanel(!showPanel)}
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
            <div key={idx}>
              <div
                className={`mb-[5px] text-[11px] font-medium text-text-muted ${msg.me ? "pr-[39px] text-right" : "pl-[39px]"}`}
              >
                {msg.sender}
              </div>
              <div
                className={`flex items-end gap-[9px] ${msg.me ? "flex-row-reverse" : ""}`}
              >
                <Avatar initials={msg.initials} size="md" />
                <div
                  className={`max-w-[min(420px,68vw)] rounded-[14px] px-3.5 py-2.5 text-[13.5px] leading-relaxed sm:max-w-[420px] ${
                    msg.me
                      ? "bg-contrast-soft-bg text-contrast-soft-text"
                      : "border border-border-default bg-bg-secondary text-text-primary"
                  }`}
                >
                  {msg.text}
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

      {showPanel && (
        <div className="hidden w-[260px] shrink-0 xl:flex">
          <FriendsPanel />
        </div>
      )}
    </>
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-hover md:gap-2.5 md:py-2.5 ${
        active ? "bg-bg-hover" : ""
      }`}
    >
      <Avatar initials={conv.initials!} avatarUrl={conv.avatarUrl} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-medium md:text-[13px]">
          {conv.name}
        </div>
        <div className="mt-0.5 truncate text-[12.5px] text-text-muted md:text-[12px]">
          {conv.preview}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[11px] text-text-dimmed">{conv.time}</span>
        {conv.unread && (
          <span className="flex h-[17px] w-[17px] items-center justify-center rounded-full bg-contrast-soft-bg text-[10px] font-semibold text-contrast-soft-text">
            {conv.unread}
          </span>
        )}
      </div>
    </button>
  );
}

function ChatHeader({
  conv,
  onBack,
  showPanel,
  onTogglePanel,
}: {
  conv: Conversation;
  onBack: () => void;
  showPanel: boolean;
  onTogglePanel: () => void;
}) {
  return (
    <div className="flex h-[62px] items-center gap-3 border-b border-border-default bg-bg-secondary px-4 sm:px-[22px]">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary md:hidden"
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
        className={`ml-auto hidden items-center rounded-[5px] p-1 transition-colors hover:bg-bg-hover hover:text-text-primary xl:flex ${
          showPanel ? "text-text-dimmed" : "bg-bg-hover text-text-primary"
        }`}
        title="Toggle panel"
      >
        <PanelToggleIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
