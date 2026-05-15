"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Theme as EmojiPickerTheme } from "emoji-picker-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
}

export default function MessageComposer({
  value,
  onChange,
  onSend,
  placeholder,
}: MessageComposerProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);

  function sendMessage() {
    if (!value.trim()) return;
    onSend();
    setEmojiOpen(false);
  }

  return (
    <div className="flex items-center gap-3 border-t border-border-default bg-bg-secondary px-3 py-3 sm:gap-5 sm:px-[22px] sm:py-3.5">
      <button
        type="button"
        className="hidden h-9 w-9 shrink-0 items-center justify-center text-text-dimmed transition-colors hover:text-text-primary sm:flex"
        title="Attach"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <div className="relative hidden sm:block">
        <button
          type="button"
          onClick={() => setEmojiOpen((open) => !open)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center transition-colors hover:text-text-primary ${
            emojiOpen ? "text-text-primary" : "text-text-dimmed"
          }`}
          title="Emoji"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>

        {emojiOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setEmojiOpen(false)}
            />
            <div className="absolute bottom-full left-0 z-20 mb-2">
              <EmojiPicker
                theme={EmojiPickerTheme.DARK}
                onEmojiClick={(emojiData) => {
                  onChange(value + emojiData.emoji);
                  setEmojiOpen(false);
                }}
                width={320}
                height={380}
                lazyLoadEmojis
              />
            </div>
          </>
        )}
      </div>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
          }
        }}
        className="min-w-0 flex-1 rounded-full border border-border-default bg-bg-hover px-4 py-2.5 text-[13.5px] text-text-tertiary outline-none focus:border-border-strong focus:text-text-primary"
        placeholder={placeholder}
      />

      <button
        type="button"
        onClick={sendMessage}
        disabled={!value.trim()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-text-primary text-bg-tertiary transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
    </div>
  );
}
