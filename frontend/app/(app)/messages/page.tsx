"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import {
  getFriendConversations,
  getChannelConversations,
  getConversationById,
  getChatMessages,
} from "@/lib/data/messages";
import type { Conversation } from "@/lib/types";

export default function MessagesPage() {
  const friendConvs = getFriendConversations();
  const channelConvs = getChannelConversations();
  const [activeId, setActiveId] = useState<string>(friendConvs[0]?.id ?? "");
  const activeConv = getConversationById(activeId);
  const messages = getChatMessages(activeId);

  return (
    <>
      {/* Conversation list */}
      <div className="flex w-[270px] shrink-0 flex-col overflow-hidden border-r border-border-default bg-bg-secondary">
        {/* Search */}
        <div className="border-b border-border-default px-4 pb-3 pt-4">
          <div className="flex items-center gap-2 rounded-full bg-bg-hover px-[13px] py-2 text-[13px] text-text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Search...</span>
          </div>
        </div>

        {/* Conv list */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pb-1.5 pt-3.5 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
            Friends
          </div>
          {friendConvs.map((c) => (
            <ConversationRow
              key={c.id}
              conv={c}
              active={activeId === c.id}
              onClick={() => setActiveId(c.id)}
            />
          ))}

          <div className="px-4 pb-1.5 pt-3.5 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
            Channels
          </div>
          {channelConvs.map((c) => (
            <ConversationRow
              key={c.id}
              conv={c}
              active={activeId === c.id}
              onClick={() => setActiveId(c.id)}
            />
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col bg-bg-tertiary">
        {/* Chat header */}
        {activeConv && <ChatHeader conv={activeConv} />}

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-[22px] py-[22px]">
          {/* Date sep */}
          <div className="flex items-center gap-3 text-[11.5px] text-text-dimmed">
            <div className="h-px flex-1 bg-border-default" />
            <span>Today</span>
            <div className="h-px flex-1 bg-border-default" />
          </div>

          {messages.map((msg, idx) => (
            <div key={idx}>
              <div className="mb-[5px] pl-[39px] text-[11px] font-medium text-text-muted">
                {msg.sender}
              </div>
              <div className={`flex items-end gap-[9px] ${msg.me ? "flex-row-reverse" : ""}`}>
                <Avatar initials={msg.initials} size="md" />
                <div
                  className={`max-w-[420px] rounded-[14px] px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                    msg.me
                      ? "bg-text-primary text-bg-tertiary"
                      : "border border-border-default bg-bg-secondary text-text-primary"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="shrink-0 px-1 text-[10.5px] text-text-dimmed">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2.5 border-t border-border-default bg-bg-secondary px-[22px] py-3.5">
          <button className="text-[18px] text-text-dimmed transition-colors hover:text-text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button className="text-[18px] text-text-dimmed transition-colors hover:text-text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>
          <input
            className="flex-1 rounded-full border border-border-default bg-bg-hover px-4 py-2.5 text-[13.5px] text-text-tertiary outline-none focus:border-border-strong focus:text-text-primary"
            placeholder="Write a message..."
          />
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-text-primary text-bg-tertiary hover:opacity-85">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>
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
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-bg-hover ${
        active ? "bg-bg-hover" : ""
      }`}
    >
      {conv.type === "friend" ? (
        <div className="relative">
          <Avatar initials={conv.initials!} avatarUrl={conv.avatarUrl} size="lg" />
          {conv.online && (
            <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-bg-secondary bg-accent-green" />
          )}
          {conv.away && (
            <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-bg-hover bg-away" />
          )}
        </div>
      ) : (
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[9px] border border-border-default bg-bg-hover text-[17px]">
          <ChannelIcon icon={conv.icon} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{conv.name}</div>
        <div className="mt-0.5 truncate text-[12px] text-text-muted">{conv.preview}</div>
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

function ChatHeader({ conv }: { conv: Conversation }) {
  return (
    <div className="flex items-center gap-3 border-b border-border-default bg-bg-secondary px-[22px] py-3.5">
      {conv.type === "friend" ? (
        <div className="relative">
          <Avatar initials={conv.initials!} avatarUrl={conv.avatarUrl} size="lg" />
          {conv.online && (
            <div className="absolute bottom-[1px] right-[1px] h-[9px] w-[9px] rounded-full border-2 border-bg-secondary bg-accent-green" />
          )}
          {conv.away && (
            <div className="absolute bottom-[1px] right-[1px] h-[9px] w-[9px] rounded-full border-2 border-bg-secondary bg-away" />
          )}
        </div>
      ) : (
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[9px] border border-border-default bg-bg-hover text-[17px]">
          <ChannelIcon icon={conv.icon} />
        </div>
      )}
      <div>
        <div className="text-[14px] font-medium">{conv.name}</div>
        <div className="mt-0.5 text-[12px] text-text-muted">
          {conv.type === "friend" ? (
            <>
              {conv.online ? "Online" : conv.away ? "Away" : "Offline"}
              {conv.level !== undefined && ` · Level ${conv.level}`}
            </>
          ) : (
            <>{conv.memberCount ?? 0} members</>
          )}
        </div>
      </div>
      <div className="ml-auto flex gap-1.5">
        <button className="flex h-8 w-8 items-center justify-center rounded-[7px] text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-[7px] text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ChannelIcon({ icon }: { icon?: string }) {
  const props = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (icon) {
    case "camera":
      return <svg {...props}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
    case "clock":
      return <svg {...props}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
    case "gamepad":
      return <svg {...props}><rect x="2" y="6" width="20" height="12" rx="2" /><line x1="6" y1="12" x2="6" y2="12" /><line x1="10" y1="12" x2="10" y2="12" /></svg>;
    case "grid":
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="3" x2="9" y2="21" /></svg>;
    case "music":
      return <svg {...props}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;
    case "lock":
      return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
    case "bulb":
      return <svg {...props}><path d="M12 2a4 4 0 0 1 4 4c0 2-2 3-2 5h-4c0-2-2-3-2-5a4 4 0 0 1 4-4z" /><line x1="10" y1="15" x2="14" y2="15" /><line x1="10" y1="18" x2="14" y2="18" /></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="10" /></svg>;
  }
}
