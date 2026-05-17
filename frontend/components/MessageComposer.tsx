"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Theme as EmojiPickerTheme } from "emoji-picker-react";
import {
  deleteUploadedFile,
  fileUrl,
  formatFileSize,
  uploadFile,
  UPLOAD_ACCEPT,
  validateUploadFile,
} from "@/lib/data/files";
import type { FileAsset } from "@/lib/types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (attachmentIds: number[]) => void | Promise<void>;
  placeholder: string;
  inputRef?: React.Ref<HTMLInputElement>;
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

export default function MessageComposer({
  value,
  onChange,
  onSend,
  placeholder,
  inputRef,
}: MessageComposerProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadedAssets = uploads
    .filter((upload) => upload.status === "uploaded" && upload.asset)
    .map((upload) => upload.asset as FileAsset);
  const isUploading = uploads.some((upload) => upload.status === "uploading");
  const canSend = !isUploading && (value.trim() || uploadedAssets.length > 0);

  async function sendMessage() {
    if (!canSend) return;
    await onSend(uploadedAssets.map((asset) => asset.id));
    uploads.forEach((upload) => {
      if (upload.previewUrl) URL.revokeObjectURL(upload.previewUrl);
    });
    setUploads([]);
    setUploadError("");
    setEmojiOpen(false);
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;

    const remainingSlots = MAX_ATTACHMENTS - uploads.length;
    const selectedFiles = Array.from(files).slice(
      0,
      Math.max(0, remainingSlots),
    );

    if (files.length > remainingSlots) {
      setUploadError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
    } else {
      setUploadError("");
    }

    selectedFiles.forEach((file) => {
      const validationError = validateUploadFile(file);
      const localId = `${file.name}-${file.size}-${crypto.randomUUID()}`;
      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;

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

      void uploadFile(
        file,
        (progress) => {
          setUploads((items) =>
            items.map((item) =>
              item.localId === localId ? { ...item, progress } : item,
            ),
          );
        },
        abortController.signal,
      )
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
                ? {
                    ...item,
                    progress: 0,
                    status: "error",
                    error: "Upload failed.",
                  }
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

    upload.abortController?.abort();
    if (upload.previewUrl) URL.revokeObjectURL(upload.previewUrl);

    if (upload.asset) {
      try {
        await deleteUploadedFile(upload.asset.id);
      } catch {
        // The composer should still let the user remove a stale local upload.
      }
    }

    setUploads((items) => items.filter((item) => item.localId !== localId));
  }

  return (
    <div className="border-t border-border-default bg-bg-secondary px-3 py-3 sm:px-[22px] sm:py-3.5">
      {(uploads.length > 0 || uploadError) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {uploads.map((upload) => (
            <div
              key={upload.localId}
              className="flex max-w-full items-center gap-2 rounded-[7px] border border-border-default bg-bg-hover px-2 py-1.5 text-[11.5px] text-text-muted"
            >
              {upload.previewUrl ? (
                <img
                  src={
                    upload.asset
                      ? fileUrl(upload.asset.previewUrl)
                      : upload.previewUrl
                  }
                  alt=""
                  className="h-8 w-8 rounded-[5px] object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-bg-secondary text-[10px] font-semibold">
                  FILE
                </span>
              )}
              <span className="min-w-0 max-w-[180px] truncate">
                {upload.asset?.originalName ?? upload.fileName}
              </span>
              <span className="shrink-0">
                {upload.status === "uploading"
                  ? `${upload.progress}%`
                  : upload.status === "error"
                    ? (upload.error ?? "Upload failed")
                    : formatFileSize(upload.asset?.sizeBytes ?? upload.size)}
              </span>
              <button
                type="button"
                onClick={() => {
                  void removeUpload(upload.localId);
                }}
                className="shrink-0 text-text-dimmed transition-colors hover:text-text-primary"
                aria-label={`Remove ${upload.fileName}`}
              >
                x
              </button>
            </div>
          ))}
          {uploadError && (
            <div className="text-[12px] text-red-500">{uploadError}</div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 sm:gap-5">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={UPLOAD_ACCEPT}
          onChange={(event) => handleFiles(event.target.files)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploads.length >= MAX_ATTACHMENTS}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-text-dimmed transition-colors hover:text-text-primary disabled:opacity-40"
          title="Attach"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
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
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
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
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void sendMessage();
            }
          }}
          className="min-w-0 flex-1 rounded-full border border-border-default bg-bg-hover px-4 py-2.5 text-[13.5px] text-text-tertiary outline-none focus:border-border-strong focus:text-text-primary"
          placeholder={placeholder}
        />

        <button
          type="button"
          onClick={() => {
            void sendMessage();
          }}
          disabled={!canSend}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-text-primary text-bg-tertiary transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
