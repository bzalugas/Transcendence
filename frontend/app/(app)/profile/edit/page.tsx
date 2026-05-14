"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateCurrentUser, useCurrentUser } from "@/lib/data/auth";
import { fileUrl } from "@/lib/data/files";
import type { ProfileSocial } from "@/lib/types";

const AVATAR_OUTPUT_SIZE = 256;
const MAX_AVATAR_DATA_URL_LENGTH = 90 * 1024;
const AVATAR_ACCEPT = "image/jpeg,image/png";
const AVATAR_MIN_ZOOM = 1;
const AVATAR_MAX_ZOOM = 3;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png"]);

type AvatarEditorState = {
  src: string;
};

type CropRect = {
  x: number;
  y: number;
  size: number;
};

type Point = {
  x: number;
  y: number;
};

type Size = {
  width: number;
  height: number;
};

export default function EditProfilePage() {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorFrameRef = useRef<HTMLDivElement>(null);
  const editorImageRef = useRef<HTMLImageElement>(null);
  const imageDragRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);

  /* ── form state ── */
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [avatarEditor, setAvatarEditor] = useState<AvatarEditorState | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [avatarZoom, setAvatarZoom] = useState(AVATAR_MIN_ZOOM);
  const [avatarMinZoom, setAvatarMinZoom] = useState(AVATAR_MIN_ZOOM);
  const [avatarPan, setAvatarPan] = useState<Point>({ x: 0, y: 0 });
  const [avatarImageSize, setAvatarImageSize] = useState<Size | null>(null);
  const [editorFrameSize, setEditorFrameSize] = useState<Size | null>(null);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [socials, setSocials] = useState<ProfileSocial[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* ── new-social input ── */
  const [newPlatform, setNewPlatform] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    queueMicrotask(() => {
      setUsername(currentUser.username);
      setBio(currentUser.bio ?? "");
      setAvatarPreview(currentUser.avatarUrl ?? "");
      setAvatarChanged(false);
      setAvatarError("");
      setSocials(currentUser.socials ?? []);
    });
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (avatarEditor?.src) URL.revokeObjectURL(avatarEditor.src);
    };
  }, [avatarEditor?.src]);

  /* ── avatar upload handler ── */
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!AVATAR_TYPES.has(file.type)) {
      setAvatarError("Please select a JPG or PNG image.");
      return;
    }

    setAvatarError("");
    setAvatarZoom(AVATAR_MIN_ZOOM);
    setAvatarMinZoom(AVATAR_MIN_ZOOM);
    setAvatarPan({ x: 0, y: 0 });
    setAvatarImageSize(null);
    setEditorFrameSize(null);
    setCropRect(null);
    setAvatarEditor((current) => {
      if (current?.src) URL.revokeObjectURL(current.src);
      return {
        src: URL.createObjectURL(file),
      };
    });
  }

  function closeAvatarEditor() {
    setAvatarEditor((current) => {
      if (current?.src) URL.revokeObjectURL(current.src);
      return null;
    });
    setCropRect(null);
    setAvatarZoom(AVATAR_MIN_ZOOM);
    setAvatarMinZoom(AVATAR_MIN_ZOOM);
    setAvatarPan({ x: 0, y: 0 });
    setAvatarImageSize(null);
    setEditorFrameSize(null);
    imageDragRef.current = null;
  }

  function initializeCrop() {
    window.requestAnimationFrame(() => {
      const frame = editorFrameRef.current;
      const image = editorImageRef.current;
      if (!frame || !image) return;

      const frameBounds = frame.getBoundingClientRect();
      const frameSize = {
        width: frameBounds.width,
        height: frameBounds.height,
      };
      const size = Math.min(frameSize.width, frameSize.height) * 0.72;
      const crop = {
        x: (frameSize.width - size) / 2,
        y: (frameSize.height - size) / 2,
        size,
      };
      const imageSize = getCoverImageSize(image, {
        width: crop.size,
        height: crop.size,
      });
      const nextZoom = AVATAR_MIN_ZOOM;

      setEditorFrameSize(frameSize);
      setAvatarImageSize(imageSize);
      setCropRect(crop);
      setAvatarMinZoom(nextZoom);
      setAvatarZoom(nextZoom);
      setAvatarPan(clampAvatarPan({ x: 0, y: 0 }, nextZoom, crop, imageSize, frameSize));
    });
  }

  function updateAvatarZoom(nextZoom: number) {
    const zoom = clamp(nextZoom, avatarMinZoom, Math.max(AVATAR_MAX_ZOOM, avatarMinZoom));
    setAvatarZoom(zoom);
    setAvatarPan((current) => clampAvatarPan(current, zoom));
  }

  function handleAvatarWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const factor = event.deltaY < 0 ? 1.08 : 0.92;
    updateAvatarZoom(avatarZoom * factor);
  }

  function beginImagePan(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    imageDragRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      panX: avatarPan.x,
      panY: avatarPan.y,
    };
  }

  function moveImagePan(event: React.PointerEvent<HTMLDivElement>) {
    const drag = imageDragRef.current;
    if (!drag) return;

    setAvatarPan(clampAvatarPan({
      x: drag.panX + event.clientX - drag.clientX,
      y: drag.panY + event.clientY - drag.clientY,
    }));
  }

  function endImagePan() {
    imageDragRef.current = null;
  }

  function applyAvatarCrop() {
    const image = editorImageRef.current;
    const crop = cropRect;

    if (!image || !crop) return;

    const imageBounds = getAvatarImageRect();
    if (!imageBounds) return;

    const sourceX = ((crop.x - imageBounds.x) / imageBounds.width) * image.naturalWidth;
    const sourceY = ((crop.y - imageBounds.y) / imageBounds.height) * image.naturalHeight;
    const sourceSize = (crop.size / imageBounds.width) * image.naturalWidth;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = AVATAR_OUTPUT_SIZE;
    canvas.height = AVATAR_OUTPUT_SIZE;
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      AVATAR_OUTPUT_SIZE,
      AVATAR_OUTPUT_SIZE,
    );

    const dataUrl = avatarCanvasToDataUrl(canvas);
    if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
      setAvatarError("Cropped avatar is too large. Try a simpler image.");
      return;
    }

    setAvatarPreview(dataUrl);
    setAvatarChanged(true);
    setAvatarError("");
    closeAvatarEditor();
  }

  function getAvatarImageRect() {
    const frame = editorFrameSize;
    const image = avatarImageSize;
    if (!frame || !image) return null;

    const width = image.width * avatarZoom;
    const height = image.height * avatarZoom;

    return {
      x: (frame.width - width) / 2 + avatarPan.x,
      y: (frame.height - height) / 2 + avatarPan.y,
      width,
      height,
    };
  }

  function getAvatarBaseImageRect() {
    const frame = editorFrameSize;
    const image = avatarImageSize;
    if (!frame || !image) return null;

    return {
      x: (frame.width - image.width) / 2,
      y: (frame.height - image.height) / 2,
      width: image.width,
      height: image.height,
    };
  }

  function clampAvatarPan(
    pan: Point,
    zoom = avatarZoom,
    crop = cropRect,
    image = avatarImageSize,
    frame = editorFrameSize,
  ): Point {
    if (!crop || !image || !frame) return pan;

    const imageWidth = image.width * zoom;
    const imageHeight = image.height * zoom;
    const imageXAtCenter = (frame.width - imageWidth) / 2;
    const imageYAtCenter = (frame.height - imageHeight) / 2;
    const minX = crop.x + crop.size - imageWidth - imageXAtCenter;
    const maxX = crop.x - imageXAtCenter;
    const minY = crop.y + crop.size - imageHeight - imageYAtCenter;
    const maxY = crop.y - imageYAtCenter;

    return {
      x: clamp(pan.x, Math.min(minX, maxX), Math.max(minX, maxX)),
      y: clamp(pan.y, Math.min(minY, maxY), Math.max(minY, maxY)),
    };
  }

  /* ── socials helpers ── */
  function addSocial() {
    const platform = newPlatform.trim().toLowerCase();
    const label = newLabel.trim();
    const url = normalizeSocialUrl(newUrl);

    if (!platform || !label || !url) return;

    setSocials((prev) => [...prev, { platform, label, url }]);
    setNewPlatform("");
    setNewLabel("");
    setNewUrl("");
  }

  function removeSocial(idx: number) {
    setSocials((prev) => prev.filter((_, i) => i !== idx));
  }



  /* ── save ── */
  async function handleSave() {
    const trimmed = username.trim();
    if (!trimmed || !currentUser) return;

    setSaving(true);
    setSaveError(null);

    try {
      await updateCurrentUser({
        username: trimmed,
        bio: bio.trim() || undefined,
        socials,
        ...(avatarChanged ? { avatarUrl: avatarPreview || undefined } : {}),
      });
      router.push(`/profile/${trimmed}`);
    } catch {
      setSaveError("Could not save your profile. Please check that the API is running.");
    } finally {
      setSaving(false);
    }
  }

  if (!currentUser) return null;

  const avatarBaseImageRect = getAvatarBaseImageRect();

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-bg-tertiary">
      {/* Header */}
      <div className="border-b border-border-default bg-bg-secondary px-4 pb-5 pt-5 sm:px-6 md:px-8 md:pt-6">
        <h1 className="text-[19px] font-medium">Edit profile</h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Update your public profile information.
        </p>
        {saveError && (
          <p className="mt-3 text-[13px] text-danger">
            {saveError}
          </p>
        )}
      </div>

      {/* Form body */}
      <div className="mx-auto w-full max-w-[680px] space-y-6 px-4 py-5 sm:px-6 md:px-8 md:py-7">
        {/* ─── Avatar ─── */}
        <Section title="Avatar">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="relative h-[88px] w-[88px] shrink-0">
              {avatarPreview ? (
                <img
                  src={fileUrl(avatarPreview)}
                  alt="avatar"
                  className="h-full w-full rounded-full border-[3px] border-bg-secondary object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full border-[3px] border-bg-secondary bg-bg-hover text-[26px] font-medium text-text-primary">
                  {currentUser.initials}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-[7px] border border-border-default bg-transparent px-4 py-[7px] text-[13px] text-text-primary transition-colors hover:bg-bg-hover"
              >
                Upload new photo
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview("");
                    setAvatarChanged(true);
                    setAvatarError("");
                  }}
                  className="ml-0 rounded-[7px] px-4 py-[7px] text-[13px] text-danger transition-colors hover:bg-danger/10 sm:ml-2"
                >
                  Remove
                </button>
              )}
              <p className="text-[11.5px] text-text-dimmed">
                JPG or PNG. Saved as {AVATAR_OUTPUT_SIZE}x{AVATAR_OUTPUT_SIZE} JPEG.
              </p>
              {avatarError && (
                <p className="text-[12px] text-danger">{avatarError}</p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </Section>

        {/* ─── Username ─── */}
        <Section title="Profile details">
          <FieldGroup label="Username">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-[6px] border border-border-default bg-bg-hover px-3 py-2 text-[13px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
            />
          </FieldGroup>

          <FieldGroup label="Bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell us a bit about yourself…"
              className="w-full resize-none rounded-[6px] border border-border-default bg-bg-hover px-3 py-2 text-[13px] leading-relaxed text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
            />
          </FieldGroup>
        </Section>

        {/* ─── Socials ─── */}
        <Section title="Socials">
          <div className="space-y-2">
            {socials.map((s, idx) => (
              <div
                key={`${s.platform}-${idx}`}
                className="flex items-center gap-3 rounded-[8px] border border-border-default bg-bg-hover px-3 py-2"
              >
                <span className="min-w-[70px] text-[12px] font-medium capitalize text-text-muted">
                  {s.platform}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] text-text-secondary">{s.label}</span>
                  <span className="truncate text-[11.5px] text-text-dimmed">{s.url}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSocial(idx)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[14px] text-text-dimmed transition-colors hover:bg-danger/10 hover:text-danger"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}

            {/* Add row */}
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-end">
              <FieldGroup label="Platform" compact>
                <input
                  type="text"
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  placeholder="e.g. twitter"
                  className="w-full rounded-[6px] border border-border-default bg-bg-hover px-3 py-[7px] text-[12.5px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
                />
              </FieldGroup>
              <FieldGroup label="Label" compact>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. @username"
                  className="w-full rounded-[6px] border border-border-default bg-bg-hover px-3 py-[7px] text-[12.5px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
                />
              </FieldGroup>
              <FieldGroup label="URL" compact>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  onKeyDown={(e) => { if (e.key === "Enter") addSocial(); }}
                  className="w-full rounded-[6px] border border-border-default bg-bg-hover px-3 py-[7px] text-[12.5px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
                />
              </FieldGroup>
              <button
                type="button"
                onClick={addSocial}
                className="shrink-0 rounded-[6px] border border-dashed border-border-default px-3 py-[7px] text-[12.5px] text-text-muted transition-colors hover:border-solid hover:text-text-primary"
              >
                + Add
              </button>
            </div>
          </div>
        </Section>

        {/* ─── Action bar ─── */}
        <div className="flex flex-col-reverse gap-3 border-t border-border-default pt-5 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => router.push(`/profile/${currentUser.username}`)}
            className="rounded-[7px] border border-border-default bg-transparent px-[18px] py-[8px] text-[13px] text-text-primary transition-colors hover:bg-bg-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-[7px] bg-btn-primary-bg px-[18px] py-[8px] text-[13px] font-medium text-btn-primary-text transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
      {avatarEditor && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/65 px-4 backdrop-blur-[4px]">
          <div className="max-h-[calc(100vh-32px)] w-full max-w-[560px] overflow-y-auto rounded-[14px] border border-border-default bg-bg-secondary shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="border-b border-border-default px-5 py-4">
              <div className="text-[15px] font-semibold">Crop profile photo</div>
              <div className="mt-1 text-[12px] text-text-muted">
                Drag the photo and use the wheel to zoom.
              </div>
            </div>

            <div className="p-5">
              <div
                ref={editorFrameRef}
                className="relative flex h-[min(360px,60vh)] w-full cursor-grab touch-none select-none items-center justify-center overflow-hidden rounded-lg border border-border-default bg-bg-tertiary active:cursor-grabbing"
                onPointerDown={beginImagePan}
                onPointerMove={moveImagePan}
                onPointerUp={endImagePan}
                onPointerCancel={endImagePan}
                onWheel={handleAvatarWheel}
              >
                <img
                  src={avatarEditor.src}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full scale-105 select-none object-cover opacity-35 blur-md"
                  draggable={false}
                />
                <img
                  ref={editorImageRef}
                  src={avatarEditor.src}
                  alt=""
                  onLoad={initializeCrop}
                  className={
                    avatarBaseImageRect
                      ? "absolute select-none object-contain"
                      : "max-h-full max-w-full select-none object-contain"
                  }
                  draggable={false}
                  style={avatarBaseImageRect
                    ? {
                        left: avatarBaseImageRect.x,
                        top: avatarBaseImageRect.y,
                        width: avatarBaseImageRect.width,
                        height: avatarBaseImageRect.height,
                        transform: `translate3d(${avatarPan.x}px, ${avatarPan.y}px, 0) scale(${avatarZoom})`,
                        transformOrigin: "center center",
                      }
                    : undefined}
                />
                {cropRect && (
                  <>
                    <div
                      className="pointer-events-none absolute rounded-full border-2 border-white bg-white/5 shadow-[0_0_0_9999px_rgba(245,245,245,0.34)]"
                      style={{
                        left: cropRect.x,
                        top: cropRect.y,
                        width: cropRect.size,
                        height: cropRect.size,
                      }}
                    />
                  </>
                )}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <label htmlFor="avatar-zoom" className="shrink-0 text-[12px] font-medium text-text-muted">
                  Zoom
                </label>
                <input
                  id="avatar-zoom"
                  type="range"
                  min={avatarMinZoom}
                  max={Math.max(AVATAR_MAX_ZOOM, avatarMinZoom)}
                  step="0.05"
                  value={avatarZoom}
                  onChange={(event) => updateAvatarZoom(Number(event.target.value))}
                  className="w-full accent-btn-primary-bg"
                />
                <span className="w-10 text-right text-[11.5px] text-text-dimmed">
                  {Math.round(avatarZoom * 100)}%
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border-default px-5 py-4">
              <button
                type="button"
                onClick={closeAvatarEditor}
                className="rounded-[7px] border border-border-default px-4 py-2 text-[13px] text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyAvatarCrop}
                disabled={!cropRect}
                className="rounded-[7px] bg-btn-primary-bg px-4 py-2 text-[13px] font-medium text-btn-primary-text transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-50"
              >
                Use photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Normalizes social URLs so saved links are clickable and accepted by the API.
function normalizeSocialUrl(value: string): string | null {
  const trimmed = value.trim();
  const url = trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getCoverImageSize(image: HTMLImageElement, frame: Size): Size {
  const naturalWidth = image.naturalWidth || frame.width;
  const naturalHeight = image.naturalHeight || frame.height;
  const scale = Math.max(frame.width / naturalWidth, frame.height / naturalHeight);

  return {
    width: naturalWidth * scale,
    height: naturalHeight * scale,
  };
}

function avatarCanvasToDataUrl(canvas: HTMLCanvasElement): string {
  for (const quality of [0.9, 0.82, 0.74, 0.66, 0.58]) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_AVATAR_DATA_URL_LENGTH) return dataUrl;
  }

  return canvas.toDataURL("image/jpeg", 0.5);
}

/* ── Section card ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-secondary p-[18px]">
      <div className="mb-3.5 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </div>
      {children}
    </div>
  );
}

/* ── Field label + input wrapper ── */
function FieldGroup({
  label,
  compact,
  children,
}: {
  label: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={compact ? "flex-1" : "mt-4 block first:mt-0"}>
      <div className="mb-1.5 text-[11.5px] font-medium text-text-muted">{label}</div>
      {children}
    </label>
  );
}
