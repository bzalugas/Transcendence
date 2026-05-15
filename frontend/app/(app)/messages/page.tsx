"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import FriendsPanel from "@/components/FriendsPanel";
import MessageComposer from "@/components/MessageComposer";
import PanelToggleIcon from "@/components/icons/PanelToggleIcon";
import {
  getFriendConversations,
  getConversationById,
  getChatMessages,
  addChatMessage,
  getPendingConv,
  clearPendingConv,
} from "@/lib/data/messages";
import { useCurrentUser } from "@/lib/data/auth";
import type { ChatMessage, Conversation } from "@/lib/types";

export default function MessagesPage() {
  const friendConvs = getFriendConversations();
  const { user: currentUser } = useCurrentUser();
  const [showPanel, setShowPanel] = useState(true);

  const pending = getPendingConv();
  const [activeId, setActiveId] = useState<string>(
    () => pending?.id ?? friendConvs[0]?.id ?? "",
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => [...getChatMessages(pending?.id ?? friendConvs[0]?.id ?? "")]);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">(
    () => pending ? "chat" : "list",
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clear pending after reading — safe to call multiple times
  useEffect(() => { clearPendingConv(); }, []);

  const activeConv = getConversationById(activeId);

  // If no stored conv exists, build a virtual one from pending data so the header always renders
  const effectiveConv: Conversation | undefined = activeConv ?? (
    pending && pending.id === activeId
      ? {
          id: pending.id,
          type: "friend" as const,
          name: pending.name,
          initials: pending.initials,
          avatarUrl: pending.avatarUrl,
          level: pending.level,
          preview: "",
          time: "",
          online: false,
        }
      : undefined
  );
  const filteredFriendConvs = friendConvs.filter((conv) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    return (
      conv.name.toLowerCase().includes(q) ||
      conv.preview.toLowerCase().includes(q)
    );
  });

  // Reset messages when switching conversation
  useEffect(() => {
    queueMicrotask(() => {
      setMessages([...getChatMessages(activeId)]);
    });
  }, [activeId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = inputText.trim();
    if (!text || !activeId || !currentUser) return;
    const now = new Date();
    const msg: ChatMessage = {
      sender: currentUser.username,
      initials: currentUser.initials,
      text,
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      me: true,
    };
    addChatMessage(activeId, msg);
    setMessages([...getChatMessages(activeId)]);
    setInputText("");
  }

  function selectConversation(id: string) {
    setActiveId(id);
    setMobileView("chat");
  }

  return (
    <>
      {/* Conversation list */}
      <div className={`${mobileView === "chat" ? "hidden" : "flex"} min-h-0 w-full shrink-0 flex-col overflow-hidden bg-bg-secondary md:flex md:h-auto md:w-[270px] md:border-r md:border-border-default`}>
        <div className="border-b border-border-default px-4 pb-3.5 pt-5 md:hidden">
          <div className="text-[20px] font-semibold text-text-primary">Messages</div>
          <div className="mt-1 text-[12.5px] text-text-muted">
            Direct messages
          </div>
        </div>

        {/* Search */}
        <div className="flex h-[62px] items-center border-b border-border-default px-4">
          <div className="flex w-full items-center gap-2 rounded-full bg-bg-hover px-[13px] py-2 text-[13px] text-text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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
          {filteredFriendConvs.map((c) => (
            <ConversationRow
              key={c.id}
              conv={c}
              active={activeId === c.id}
              onClick={() => selectConversation(c.id)}
            />
          ))}
          {filteredFriendConvs.length === 0 && (
            <div className="px-4 py-3 text-[12.5px] text-text-muted">
              No conversation found.
            </div>
          )}

        </div>
      </div>

      {/* Chat area */}
      <div className={`${mobileView === "list" ? "hidden" : "flex"} min-h-0 flex-1 flex-col bg-bg-tertiary md:flex`}>
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
          {messages.map((msg, idx) => (
            <div key={idx}>
              <div className={`mb-[5px] text-[11px] font-medium text-text-muted ${msg.me ? "pr-[39px] text-right" : "pl-[39px]"}`}>
                {msg.sender}
              </div>
              <div className={`flex items-end gap-[9px] ${msg.me ? "flex-row-reverse" : ""}`}>
                <Avatar initials={msg.initials} size="md" />
                <div
                  className={`max-w-[min(420px,68vw)] rounded-[14px] px-3.5 py-2.5 text-[13.5px] leading-relaxed sm:max-w-[420px] ${
                    msg.me
                      ? "bg-text-primary text-bg-tertiary"
                      : "border border-border-default bg-bg-secondary text-text-primary"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="hidden shrink-0 px-1 text-[10.5px] text-text-dimmed sm:inline">{msg.time}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <MessageComposer
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
        <div className="truncate text-[13.5px] font-medium md:text-[13px]">{conv.name}</div>
        <div className="mt-0.5 truncate text-[12.5px] text-text-muted md:text-[12px]">{conv.preview}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[11px] text-text-dimmed">{conv.time}</span>
        {conv.unread && (
          <span className="flex h-[17px] w-[17px] items-center justify-center rounded-full bg-text-primary text-[10px] font-semibold text-bg-tertiary">
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>
      <Avatar initials={conv.initials!} avatarUrl={conv.avatarUrl} size="lg" />
      <div className="min-w-0">
        <div className="truncate text-[14px] font-medium">{conv.name}</div>
        <div className="mt-0.5 truncate text-[12px] text-text-muted">
          {conv.online ? "Online" : conv.away ? "Away" : "Offline"}
          {conv.level !== undefined && ` · Level ${conv.level}`}
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
