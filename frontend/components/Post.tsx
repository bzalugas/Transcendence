"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import type { Comment, Post as PostType } from "@/lib/types";
import { useCurrentUser } from "@/lib/data/auth";

type PostProps = Omit<PostType, "id">;

export default function Post({
  initials,
  avatarUrl,
  author,
  time,
  channelLabel,
  body,
  image,
  imageGrid,
  event,
  likeCount,
  liked,
  comments,
}: PostProps) {
  const { user: currentUser } = useCurrentUser();
  const [isLiked, setIsLiked] = useState(liked ?? false);
  const [count, setCount] = useState(likeCount);
  const [localComments, setLocalComments] = useState<Comment[]>([...comments]);
  const [commentText, setCommentText] = useState("");

  function submitComment() {
    const text = commentText.trim();
    if (!text || !currentUser) return;
    const newComment: Comment = {
      initials: currentUser.initials,
      avatarUrl: currentUser.avatarUrl,
      author: currentUser.username,
      text,
      time: "just now",
    };
    setLocalComments([...localComments, newComment]);
    setCommentText("");
  }

  function toggleLike() {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setCount(newLiked ? count + 1 : count - 1);
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-secondary transition-colors hover:border-border-strong">
      {/* Header */}
      <div className="flex items-start gap-[11px] px-4 pt-4 pb-2.5">
        <Avatar initials={initials} avatarUrl={avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${author}`}
            className="text-[13.5px] font-medium text-text-primary hover:underline"
          >
            {author}
          </Link>
          <div className="text-[12px] text-text-muted">
            {time} · <span className="text-text-tertiary">{channelLabel}</span>
          </div>
        </div>
        <button
          type="button"
          className="px-1 text-text-muted transition-colors hover:text-text-primary"
        >
          ···
        </button>
      </div>

      {/* Body */}
      <div className="px-4 pb-3 text-[13.5px] leading-relaxed text-text-secondary">
        {body}
      </div>

      {/* Single image */}
      {image && (
        <div className="mx-4 mb-3 flex items-center justify-center rounded-lg border border-border-subtle bg-bg-tertiary py-8">
          <div className="text-center text-text-dimmed">
            <div className="mb-2 text-[38px]">{image.emoji}</div>
            <div className="text-xs">{image.label}</div>
          </div>
        </div>
      )}

      {/* Image grid */}
      {imageGrid && (
        <div className="mx-4 mb-3 grid grid-cols-2 gap-1.5">
          {imageGrid.map((emoji, i) => (
            <div
              key={i}
              className="flex items-center justify-center rounded-lg border border-border-subtle bg-bg-tertiary py-8 text-[32px]"
            >
              {emoji}
            </div>
          ))}
        </div>
      )}

      {/* Event card */}
      {event && (
        <div className="mx-4 mb-3 rounded-lg border border-border-subtle bg-bg-hover px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-border-subtle bg-bg-tertiary">
              <div className="text-[18px] font-medium leading-none text-text-primary">
                {event.day}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
                {event.month}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-medium text-text-primary">
                {event.title}
              </div>
              <div className="text-[12px] text-text-muted">{event.subtitle}</div>
            </div>
            <button
              type="button"
              className="rounded-full bg-btn-primary-bg px-3.5 py-1.5 text-[12px] font-medium text-btn-primary-text transition-opacity hover:opacity-90"
            >
              Join
            </button>
          </div>
          <div className="mt-2.5 text-[11.5px] text-text-muted">
            {event.goingCount} going
          </div>
        </div>
      )}

      {/* Like */}
      <div className="flex items-center gap-1.5 px-4 pb-3">
        <button
          type="button"
          onClick={toggleLike}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
            isLiked
              ? "border-accent-blue/30 bg-accent-blue/10 text-accent-blue"
              : "border-border-subtle bg-bg-tertiary text-text-muted hover:text-text-primary"
          }`}
          aria-pressed={isLiked}
        >
          <span>👍</span>
          <span>{count}</span>
        </button>
      </div>

      {/* Comments */}
      {localComments.length > 0 && (
        <div className="border-t border-border-default px-4 py-2.5">
          {localComments.map((c, i) => (
            <div key={i} className="flex gap-2.5 py-1.5">
              <Avatar initials={c.initials} avatarUrl={c.avatarUrl} size="sm" />
              <div className="min-w-0">
                <Link
                  href={`/profile/${c.author}`}
                  className="text-[12.5px] font-medium text-text-primary hover:underline"
                >
                  {c.author}
                </Link>
                <span className="ml-1.5 text-[12.5px] text-text-secondary">
                  {c.text}
                </span>
                <div className="text-[11px] text-text-dimmed">{c.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment input */}
      <div className="flex items-center gap-2.5 border-t border-border-default px-4 py-2.5">
        <Avatar initials={currentUser?.initials ?? "me"} avatarUrl={currentUser?.avatarUrl} size="sm" />
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }}
          placeholder="Write a comment…"
          className="flex-1 bg-transparent text-[12.5px] text-text-secondary placeholder:text-text-dimmed outline-none"
        />
        {commentText.trim() && (
          <button
            type="button"
            onClick={submitComment}
            className="text-[11.5px] font-medium text-accent-blue transition-opacity hover:opacity-80"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
