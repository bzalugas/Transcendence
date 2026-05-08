"use client";

import { useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import {
  deleteUploadedFile,
  fileUrl,
  formatFileSize,
  uploadFile,
  UPLOAD_ACCEPT,
  validateUploadFile,
} from "@/lib/data/files";
import { useCurrentUser } from "@/lib/data/auth";
import type { FileAsset } from "@/lib/types";

interface ChannelComposerProps {
  channelLabel: string;
  onPost: (body: string, attachmentIds: number[]) => void | Promise<void>;
}

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

export default function ChannelComposer({ channelLabel, onPost }: ChannelComposerProps) {
  const [text, setText] = useState("");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: currentUser } = useCurrentUser();

  const uploadedAssets = uploads
    .filter((upload) => upload.status === "uploaded" && upload.asset)
    .map((upload) => upload.asset as FileAsset);
  const isUploading = uploads.some((upload) => upload.status === "uploading");
  const canPost = Boolean(currentUser) && !isUploading && (text.trim() || uploadedAssets.length > 0);

  // Sends the composed text and already uploaded file ids to the parent.
  async function handlePost() {
    if (!canPost) return;

    await onPost(text.trim(), uploadedAssets.map((asset) => asset.id));
    uploads.forEach((upload) => {
      if (upload.previewUrl) URL.revokeObjectURL(upload.previewUrl);
    });
    setText("");
    setUploads([]);
    setUploadError("");
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;

    const remainingSlots = MAX_ATTACHMENTS - uploads.length;
    const selectedFiles = Array.from(files).slice(0, Math.max(0, remainingSlots));

    if (files.length > remainingSlots) {
      setUploadError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
    } else {
      setUploadError("");
    }

    selectedFiles.forEach((file) => {
      const validationError = validateUploadFile(file);
      const localId = `${file.name}-${file.size}-${crypto.randomUUID()}`;
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;

      if (validationError) {
        setUploads((items) => [
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

      setUploads((items) => [
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
        setUploads((items) =>
          items.map((item) => item.localId === localId ? { ...item, progress } : item),
        );
      }, abortController.signal)
        .then((asset) => {
          setUploads((items) =>
            items.map((item) =>
              item.localId === localId
                ? { ...item, asset, progress: 100, status: "uploaded" }
                : item,
            ),
          );
        })
        .catch(() => {
          setUploads((items) =>
            items.map((item) =>
              item.localId === localId
                ? { ...item, progress: 0, status: "error", error: "Upload failed." }
                : item,
            ),
          );
        });
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function removeUpload(localId: string) {
    const upload = uploads.find((item) => item.localId === localId);
    if (!upload) return;

    setUploads((items) => items.filter((item) => item.localId !== localId));
    if (upload.previewUrl) URL.revokeObjectURL(upload.previewUrl);
    upload.abortController?.abort();

    if (upload.asset) {
      try {
        await deleteUploadedFile(upload.asset.id);
      } catch {
        // If server cleanup fails, keep the composer responsive.
      }
    }
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <Avatar initials={currentUser?.initials ?? "me"} avatarUrl={currentUser?.avatarUrl} size="md" />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void handlePost(); }}
          placeholder={`Share something with ${channelLabel}...`}
          className="flex-1 bg-transparent text-[13.5px] text-text-primary outline-none placeholder:text-text-dimmed"
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={UPLOAD_ACCEPT}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          title="Attach files"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploads.length >= MAX_ATTACHMENTS}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-text-dimmed transition-colors hover:bg-bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px]"
          >
            <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => { void handlePost(); }}
          disabled={!canPost}
          className="rounded-[7px] bg-text-primary px-3.5 py-1.5 text-[12.5px] font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Post
        </button>
      </div>

      {(uploads.length > 0 || uploadError) && (
        <div className="mt-3 space-y-2 border-t border-border-default pt-3">
          {uploads.map((upload) => (
            <div
              key={upload.localId}
              className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-bg-tertiary p-2"
            >
              {upload.previewUrl ? (
                <img
                  src={upload.asset ? fileUrl(upload.asset.previewUrl) : upload.previewUrl}
                  alt=""
                  className="h-12 w-12 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border-subtle bg-bg-secondary text-[11px] font-semibold text-text-muted">
                  FILE
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-medium text-text-primary">
                  {upload.asset?.originalName ?? upload.fileName}
                </div>
                <div className="text-[11.5px] text-text-muted">
                  {formatFileSize(upload.asset?.sizeBytes ?? upload.size)}
                  {upload.status === "uploading" && ` · ${upload.progress}%`}
                  {upload.status === "uploaded" && " · ready"}
                  {upload.status === "error" && ` · ${upload.error}`}
                </div>
                {upload.status === "uploading" && (
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-bg-hover">
                    <div
                      className="h-full rounded-full bg-accent-blue transition-[width]"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { void removeUpload(upload.localId); }}
                className="rounded-[7px] px-2 py-1 text-[12px] font-medium text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
              >
                Remove
              </button>
            </div>
          ))}
          {uploadError && (
            <div className="text-[12px] text-red-500">{uploadError}</div>
          )}
        </div>
      )}
    </div>
  );
}
