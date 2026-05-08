"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateCurrentUser, useCurrentUser } from "@/lib/data/auth";
import type { ProfileSocial } from "@/lib/types";



export default function EditProfilePage() {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── form state ── */
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
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
      setSocials(currentUser.socials ?? []);
    });
  }, [currentUser]);

  /* ── avatar upload handler ── */
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
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
      });
      router.push(`/profile/${trimmed}`);
    } catch {
      setSaveError("Could not save your profile. Please check that the API is running.");
    } finally {
      setSaving(false);
    }
  }

  if (!currentUser) return null;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-bg-tertiary">
      {/* Header */}
      <div className="border-b border-border-default bg-bg-secondary px-8 pb-5 pt-6">
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
      <div className="mx-auto w-full max-w-[680px] space-y-6 px-8 py-7">
        {/* ─── Avatar ─── */}
        <Section title="Avatar">
          <div className="flex items-center gap-5">
            <div className="relative h-[88px] w-[88px] shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
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
                  onClick={() => setAvatarPreview("")}
                  className="ml-2 rounded-[7px] px-4 py-[7px] text-[13px] text-danger transition-colors hover:bg-danger/10"
                >
                  Remove
                </button>
              )}
              <p className="text-[11.5px] text-text-dimmed">JPG, PNG or GIF. Max 2 MB.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
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
            <div className="flex items-end gap-2 pt-1">
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
        <div className="flex items-center justify-end gap-3 border-t border-border-default pt-5">
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
