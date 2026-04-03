import Avatar from "@/components/Avatar";
import type { Post as PostType } from "@/lib/types";
import { currentUser } from "@/lib/mocks/users";

type PostProps = Omit<PostType, "id">;

export default function Post({
  initials,
  avatarUrl,
  author,
  time,
  room,
  body,
  image,
  imageGrid,
  reactions,
  comments,
}: PostProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-secondary transition-colors hover:border-border-strong">
      {/* Header */}
      <div className="flex items-start gap-[11px] px-4 pt-4 pb-2.5">
        <Avatar initials={initials} avatarUrl={avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium text-text-primary">
            {author}
          </div>
          <div className="text-[12px] text-text-muted">
            {time} · <span className="text-text-tertiary">{room}</span>
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

      {/* Reactions */}
      <div className="flex items-center gap-1.5 px-4 pb-3">
        {reactions.map((r) => (
          <div
            key={r.emoji}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
              r.active
                ? "border-accent-blue/30 bg-accent-blue/10 text-accent-blue"
                : "border-border-subtle bg-bg-tertiary text-text-muted"
            }`}
          >
            <span>{r.emoji}</span>
            <span>{r.count}</span>
          </div>
        ))}
        <button
          type="button"
          className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-border-subtle bg-bg-tertiary text-xs text-text-dimmed transition-colors hover:text-text-tertiary"
        >
          +
        </button>
      </div>

      {/* Comments */}
      {comments.length > 0 && (
        <div className="border-t border-border-default px-4 py-2.5">
          {comments.map((c, i) => (
            <div key={i} className="flex gap-2.5 py-1.5">
              <Avatar initials={c.initials} avatarUrl={c.avatarUrl} size="sm" />
              <div className="min-w-0">
                <span className="text-[12.5px] font-medium text-text-primary">
                  {c.author}
                </span>
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
        <Avatar initials={currentUser.initials} avatarUrl={currentUser.avatarUrl} size="sm" />
        <input
          type="text"
          placeholder="Write a comment..."
          className="flex-1 bg-transparent text-[12.5px] text-text-secondary placeholder:text-text-dimmed outline-none"
        />
      </div>
    </div>
  );
}
