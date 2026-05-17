"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import ConfirmModal from "@/components/ConfirmModal";
import { appendUniqueComment } from "@/lib/data/comments";
import type { Comment, FileAsset, Post as PostType } from "@/lib/types";
import { useCurrentUser } from "@/lib/data/auth";
import {
  deleteUploadedFile,
  fileUrl,
  formatFileSize,
  uploadFile,
  UPLOAD_ACCEPT,
  validateUploadFile,
} from "@/lib/data/files";
import type { PostAttachment } from "@/lib/types";

type PostProps = PostType & {
  onReply?: (postId: string, body: string) => Promise<Comment>;
  onUpdate?: (postId: string, body: string, attachmentIds: number[]) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
};

type UploadItem = {
  localId: string;
  fileName: string;
  size: number;
  previewUrl?: string;
  progress: number;
  status: "uploading" | "uploaded" | "error";
  abortController?: AbortController;
  asset?: FileAsset;
  error?: string;
};

const MAX_ATTACHMENTS = 4;

export default function Post({
  id,
  authorId,
  initials,
  avatarUrl,
  author,
  time,
  channelLabel,
  body,
  image,
  imageGrid,
  event,
  attachments,
  likeCount,
  liked,
  comments,
  onReply,
  onUpdate,
  onDelete,
}: PostProps) {
  const { user: currentUser } = useCurrentUser();
  const [isLiked, setIsLiked] = useState(liked ?? false);
  const [count, setCount] = useState(likeCount);
  const [optimisticComments, setOptimisticComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<PostAttachment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(body);
  const [editAttachments, setEditAttachments] = useState<PostAttachment[]>(attachments ?? []);
  const [editUploads, setEditUploads] = useState<UploadItem[]>([]);
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const imageAttachments = attachments?.filter((attachment) => attachment.category === "image") ?? [];
  const previewImageIndex = previewAttachment?.category === "image"
    ? imageAttachments.findIndex((attachment) => attachment.id === previewAttachment.id)
    : -1;
  const canNavigateImages = previewImageIndex >= 0 && imageAttachments.length > 1;
  const canDelete = Boolean(
    onDelete &&
      currentUser &&
      (authorId ? currentUser.id === authorId : currentUser.username === author),
  );
  const canEdit = Boolean(
    onUpdate &&
      currentUser &&
      (authorId ? currentUser.id === authorId : currentUser.username === author),
  );
  const editUploadedAssets = editUploads
    .filter((upload) => upload.status === "uploaded" && upload.asset)
    .map((upload) => upload.asset as FileAsset);
  const isUploadingEdit = editUploads.some((upload) => upload.status === "uploading");
  const visibleComments = mergeComments(comments, optimisticComments);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  // Persists a reply when possible, then adds it to the displayed comments.
  async function submitComment() {
    const text = commentText.trim();
    if (!text || !currentUser) return;

    const newComment = onReply
      ? await onReply(id, text)
      : {
          initials: currentUser.initials,
          avatarUrl: currentUser.avatarUrl,
          author: currentUser.username,
          text,
          time: "just now",
        };

    setOptimisticComments((currentComments) =>
      appendUniqueComment(currentComments, newComment),
    );
    setCommentText("");
  }

  function toggleLike() {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setCount(newLiked ? count + 1 : count - 1);
  }

  async function deletePost() {
    if (!onDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete(id);
      setMenuOpen(false);
      setConfirmDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  function requestDeletePost() {
    if (isDeleting) return;

    setMenuOpen(false);
    setConfirmDeleteOpen(true);
  }

  function beginEdit() {
    setEditText(body);
    setEditAttachments(attachments ?? []);
    setEditUploads([]);
    setEditError("");
    setMenuOpen(false);
    setIsEditing(true);
  }

  function cleanupEditUploads() {
    editUploads.forEach((upload) => {
      upload.abortController?.abort();
      if (upload.previewUrl) URL.revokeObjectURL(upload.previewUrl);
      if (upload.asset) {
        void deleteUploadedFile(upload.asset.id).catch(() => {});
      }
    });
  }

  function cancelEdit() {
    cleanupEditUploads();
    setEditUploads([]);
    setEditAttachments(attachments ?? []);
    setEditText(body);
    setEditError("");
    setIsEditing(false);
  }

  function handleEditFiles(files: FileList | null) {
    if (!files) return;

    const remainingSlots = MAX_ATTACHMENTS - editAttachments.length - editUploads.length;
    const selectedFiles = Array.from(files).slice(0, Math.max(0, remainingSlots));

    if (files.length > remainingSlots) {
      setEditError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
    } else {
      setEditError("");
    }

    selectedFiles.forEach((file) => {
      const validationError = validateUploadFile(file);
      const localId = `${file.name}-${file.size}-${crypto.randomUUID()}`;
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;

      if (validationError) {
        setEditUploads((items) => [
          ...items,
          {
            localId,
            fileName: file.name,
            size: file.size,
            previewUrl,
            progress: 0,
            status: "error",
            error: validationError,
          },
        ]);
        return;
      }

      const abortController = new AbortController();

      setEditUploads((items) => [
        ...items,
        {
          localId,
          fileName: file.name,
          size: file.size,
          previewUrl,
          progress: 0,
          status: "uploading",
          abortController,
        },
      ]);

      void uploadFile(file, (progress) => {
        setEditUploads((items) =>
          items.map((item) => item.localId === localId ? { ...item, progress } : item),
        );
      }, abortController.signal)
        .then((asset) => {
          setEditUploads((items) =>
            items.map((item) =>
              item.localId === localId
                ? { ...item, asset, progress: 100, status: "uploaded" }
                : item,
            ),
          );
        })
        .catch(() => {
          setEditUploads((items) =>
            items.map((item) =>
              item.localId === localId
                ? { ...item, progress: 0, status: "error", error: "Upload failed." }
                : item,
            ),
          );
        });
    });

    if (editFileInputRef.current) editFileInputRef.current.value = "";
  }

  async function removeEditUpload(localId: string) {
    const upload = editUploads.find((item) => item.localId === localId);
    if (!upload) return;

    setEditUploads((items) => items.filter((item) => item.localId !== localId));
    upload.abortController?.abort();
    if (upload.previewUrl) URL.revokeObjectURL(upload.previewUrl);

    if (upload.asset) {
      try {
        await deleteUploadedFile(upload.asset.id);
      } catch {
        // Editing should stay responsive even if orphan cleanup fails.
      }
    }
  }

  async function saveEdit() {
    if (!onUpdate || isSavingEdit || isUploadingEdit) return;

    const nextBody = editText.trim();
    const nextAttachmentIds = [
      ...editAttachments.map((attachment) => attachment.fileId),
      ...editUploadedAssets.map((asset) => asset.id),
    ];

    if (!nextBody && nextAttachmentIds.length === 0) {
      setEditError("Post content or attachment is required.");
      return;
    }

    setIsSavingEdit(true);
    setEditError("");
    try {
      await onUpdate(id, nextBody, nextAttachmentIds);
      editUploads.forEach((upload) => {
        if (upload.previewUrl) URL.revokeObjectURL(upload.previewUrl);
      });
      setEditUploads([]);
      setIsEditing(false);
    } catch {
      setEditError("Could not save post changes.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  function showAdjacentImage(direction: -1 | 1) {
    if (!canNavigateImages) return;
    const nextIndex =
      (previewImageIndex + direction + imageAttachments.length) % imageAttachments.length;
    setPreviewAttachment(imageAttachments[nextIndex]);
  }

  function canPreviewAttachment(attachment: PostAttachment): boolean {
    return attachment.category === "image" || attachment.type === "pdf" || attachment.type === "text_document";
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
        {(canEdit || canDelete) && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="px-1 text-text-muted transition-colors hover:text-text-primary"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Post options"
            >
              ···
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-6 z-20 min-w-[132px] rounded-lg border border-border-subtle bg-bg-secondary py-1 shadow-lg"
              >
                {canEdit && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={beginEdit}
                    className="w-full px-3 py-2 text-left text-[12.5px] font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                  >
                    Edit post
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={requestDeletePost}
                    disabled={isDeleting}
                    className="w-full px-3 py-2 text-left text-[12.5px] font-medium text-red-500 transition-colors hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? "Removing..." : "Remove post"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {confirmDeleteOpen && (
        <ConfirmModal
          title="Are you sure?"
          description="This post will be permanently removed from the channel and feed."
          confirmLabel={isDeleting ? "Removing..." : "Remove"}
          cancelLabel="Cancel"
          tone="danger"
          onCancel={() => {
            if (!isDeleting) setConfirmDeleteOpen(false);
          }}
          onConfirm={() => {
            void deletePost();
          }}
        />
      )}

      {isEditing ? (
        <div className="mx-4 mb-3 space-y-3 rounded-lg border border-border-subtle bg-bg-tertiary p-3">
          <textarea
            value={editText}
            onChange={(e) => {
              setEditText(e.target.value);
              setEditError("");
            }}
            rows={3}
            className="w-full resize-none rounded-lg border border-border-subtle bg-bg-secondary px-3 py-2 text-[13.5px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
            placeholder="Edit your post..."
          />

          {(editAttachments.length > 0 || editUploads.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {editAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative h-[100px] w-[100px] overflow-hidden rounded-lg border border-border-subtle bg-bg-secondary"
                >
                  {attachment.category === "image" ? (
                    <img
                      src={fileUrl(attachment.previewUrl)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2">
                      <div className="rounded-md border border-border-subtle bg-bg-tertiary px-2 py-1 text-[10px] font-semibold uppercase text-text-muted">
                        {attachment.type === "pdf" ? "PDF" : attachment.type === "archive" ? "ZIP" : "FILE"}
                      </div>
                      <div className="line-clamp-2 max-w-full text-center text-[10px] font-medium leading-tight text-text-secondary">
                        {attachment.originalName}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setEditAttachments((items) =>
                        items.filter((item) => item.id !== attachment.id),
                      )
                    }
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[14px] leading-none text-white transition-colors hover:bg-black/80"
                    aria-label={`Remove ${attachment.originalName}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              {editUploads.map((upload) => (
                <div
                  key={upload.localId}
                  className="relative h-[100px] w-[100px] overflow-hidden rounded-lg border border-border-subtle bg-bg-secondary"
                >
                  {upload.previewUrl ? (
                    <img
                      src={upload.asset ? fileUrl(upload.asset.previewUrl) : upload.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2">
                      <div className="rounded-md border border-border-subtle bg-bg-tertiary px-2 py-1 text-[10px] font-semibold uppercase text-text-muted">
                        FILE
                      </div>
                      <div className="line-clamp-2 max-w-full text-center text-[10px] font-medium leading-tight text-text-secondary">
                        {upload.asset?.originalName ?? upload.fileName}
                      </div>
                    </div>
                  )}
                  {upload.status === "uploading" && (
                    <div className="absolute inset-x-1 bottom-1 h-1 overflow-hidden rounded-full bg-black/25">
                      <div
                        className="h-full rounded-full bg-accent-blue transition-[width]"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { void removeEditUpload(upload.localId); }}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[14px] leading-none text-white transition-colors hover:bg-black/80"
                    aria-label={`Remove ${upload.fileName}`}
                  >
                    ×
                  </button>
                  {upload.status === "error" && (
                    <div className="absolute inset-x-0 bottom-0 bg-red-500/90 px-1 py-1 text-center text-[9px] font-medium text-white">
                      {upload.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {editError && (
            <div className="text-[12px] text-red-500">{editError}</div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div>
              <input
                ref={editFileInputRef}
                type="file"
                multiple
                accept={UPLOAD_ACCEPT}
                onChange={(e) => handleEditFiles(e.target.files)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => editFileInputRef.current?.click()}
                disabled={editAttachments.length + editUploads.length >= MAX_ATTACHMENTS}
                className="rounded-[7px] px-3 py-1.5 text-[12.5px] font-medium text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Attach files
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isSavingEdit}
                className="rounded-[7px] px-3 py-1.5 text-[12.5px] font-medium text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { void saveEdit(); }}
                disabled={isSavingEdit || isUploadingEdit}
                className="rounded-[7px] bg-text-primary px-3.5 py-1.5 text-[12.5px] font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isSavingEdit ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Body */}
          {body && (
            <div className="px-4 pb-3 text-[13.5px] leading-relaxed text-text-secondary">
              {body}
            </div>
          )}

          {attachments && attachments.length > 0 && (
            <div className="mx-4 mb-3 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="group relative h-[100px] w-[100px] overflow-hidden rounded-lg border border-border-subtle bg-bg-tertiary text-left transition-opacity hover:opacity-95"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewAttachment(attachment)}
                    className="h-full w-full text-left"
                    aria-label={`Preview ${attachment.originalName}`}
                  >
                    {attachment.category === "image" ? (
                      <img
                        src={fileUrl(attachment.previewUrl)}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2">
                        <div className="rounded-md border border-border-subtle bg-bg-secondary px-2 py-1 text-[10px] font-semibold uppercase text-text-muted">
                          {attachment.type === "pdf" ? "PDF" : attachment.type === "archive" ? "ZIP" : "FILE"}
                        </div>
                        <div className="line-clamp-2 max-w-full text-center text-[10px] font-medium leading-tight text-text-secondary">
                          {attachment.originalName}
                        </div>
                      </div>
                    )}
                  </button>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/45 px-1.5 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {canPreviewAttachment(attachment) ? "Preview" : formatFileSize(attachment.sizeBytes)}
                  </span>
                  <a
                    href={fileUrl(attachment.downloadUrl)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-90 transition-colors hover:bg-black/75"
                    aria-label={`Download ${attachment.originalName}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          )}
        </>
      )}

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
      {visibleComments.length > 0 && (
        <div className="border-t border-border-default px-4 py-2.5">
          {visibleComments.map((c, i) => (
            <div key={c.id ?? i} className="flex gap-2.5 py-1.5">
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
          onKeyDown={(e) => { if (e.key === "Enter") void submitComment(); }}
          placeholder="Write a comment…"
          className="flex-1 bg-transparent text-[12.5px] text-text-secondary placeholder:text-text-dimmed outline-none"
        />
        {commentText.trim() && (
          <button
            type="button"
            onClick={() => { void submitComment(); }}
            className="text-[11.5px] font-medium text-text-primary transition-opacity hover:opacity-80"
          >
            Send
          </button>
        )}
      </div>

      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={previewAttachment.originalName}
          onClick={() => setPreviewAttachment(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewAttachment(null)}
            className="absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-black/70"
          >
            Close
          </button>
          {canNavigateImages && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showAdjacentImage(-1);
                }}
                className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl text-white transition-colors hover:bg-black/70"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showAdjacentImage(1);
                }}
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl text-white transition-colors hover:bg-black/70"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] overflow-hidden rounded-lg bg-bg-secondary shadow-2xl"
          >
            {previewAttachment.category === "image" ? (
              <img
                src={fileUrl(previewAttachment.previewUrl)}
                alt=""
                className="max-h-[88vh] max-w-[92vw] object-contain"
              />
            ) : canPreviewAttachment(previewAttachment) ? (
              <iframe
                src={fileUrl(previewAttachment.previewUrl)}
                title={previewAttachment.originalName}
                className="h-[80vh] w-[80vw] bg-white"
              />
            ) : (
              <div className="flex w-[320px] flex-col items-center gap-3 px-6 py-7 text-center">
                <div className="rounded-md border border-border-subtle bg-bg-tertiary px-3 py-2 text-[12px] font-semibold uppercase text-text-muted">
                  {previewAttachment.type === "archive" ? "ZIP" : "FILE"}
                </div>
                <div className="max-w-full truncate text-[14px] font-medium text-text-primary">
                  {previewAttachment.originalName}
                </div>
                <div className="text-[12px] text-text-muted">
                  {formatFileSize(previewAttachment.sizeBytes)}
                </div>
                <a
                  href={fileUrl(previewAttachment.downloadUrl)}
                  className="rounded-[7px] bg-text-primary px-3.5 py-2 text-[12.5px] font-semibold text-bg-primary transition-opacity hover:opacity-90"
                >
                  Download
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function mergeComments(
  comments: Comment[],
  optimisticComments: Comment[],
): Comment[] {
  return optimisticComments.reduce(appendUniqueComment, comments);
}
