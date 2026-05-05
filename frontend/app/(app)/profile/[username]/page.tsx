"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import FriendsPanel from "@/components/FriendsPanel";
import InterestPickerModal from "@/components/InterestPickerModal";
import PanelToggleIcon from "@/components/icons/PanelToggleIcon";
import { getProfileByUsername } from "@/lib/data/profile";
import { useCurrentUser } from "@/lib/data/auth";
import { getMyInterests } from "@/lib/data/interests";
import { setPendingConv } from "@/lib/data/messages";
import type { ProfileInterest } from "@/lib/types";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { username } = use(params);
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();

  const profile = currentUser ? getProfileByUsername(username, currentUser) : null;

  if (currentUser && !profile) notFound();

  const [showPanel, setShowPanel] = useState(true);
  const [interests, setInterests] = useState<ProfileInterest[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [interestsLoading, setInterestsLoading] = useState(false);

  useEffect(() => {
    if (!profile?.isSelf) {
      setInterests(profile?.interests ?? []);
      return;
    }

    let active = true;
    setInterestsLoading(true);

    getMyInterests()
      .then((items) => {
        if (active) setInterests(items);
      })
      .catch(() => {
        if (active) setInterests([]);
      })
      .finally(() => {
        if (active) setInterestsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [profile?.isSelf, username, currentUser?.username]);

  if (!profile) return null;

  const { user, isSelf, friends, activity, socials } = profile;

  function handleJoinInterest(interest: ProfileInterest) {
    setInterests((prev) =>
      prev.some((i) => i.name === interest.name) ? prev : [...prev, interest],
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto bg-bg-tertiary">
        {/* Header */}
        <div className="border-b border-border-default bg-bg-secondary px-8 pb-[22px] pt-6">
          <div className="flex items-start justify-between">
            {/* Left: avatar + info */}
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.initials}
                    className="h-[88px] w-[88px] rounded-full border-[3px] border-bg-secondary object-cover"
                  />
                ) : (
                  <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-[3px] border-bg-secondary bg-bg-hover text-[26px] font-medium text-text-primary">
                    {user.initials}
                  </div>
                )}
              </div>
              <div>
                <div className="text-[19px] font-medium">{user.username}</div>
                <div className="mt-[3px] text-[13px] text-text-muted">
                  <span className="font-medium text-text-primary">Level {user.level}</span>
                </div>
                <div className="mt-3.5 flex gap-7">
                  <div>
                    <div className="text-base font-medium">{friends.length}</div>
                    <div className="mt-0.5 text-[11.5px] text-text-muted">Friends</div>
                  </div>
                  <div>
                    <div className="text-base font-medium">{interests.length}</div>
                    <div className="mt-0.5 text-[11.5px] text-text-muted">Interests</div>
                  </div>
                </div>
                {socials.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {socials.map((s) => (
                      <div
                        key={s.platform}
                        className="group relative flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-border-default bg-bg-hover transition-colors hover:border-border-strong hover:bg-social-hover"
                        title={s.label}
                      >
                        <SocialIcon platform={s.platform} />
                        <span className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border-default bg-bg-hover px-[9px] py-1 text-[11px] text-text-primary group-hover:block">
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex flex-col items-end gap-[7px] self-stretch">
              <button
                type="button"
                onClick={() => setShowPanel(!showPanel)}
                className={`flex items-center rounded-[5px] p-1 transition-colors hover:bg-bg-hover hover:text-text-primary ${
                  showPanel ? "text-text-dimmed" : "bg-bg-hover text-text-primary"
                }`}
                title="Toggle panel"
              >
                <PanelToggleIcon className="h-5 w-5" />
              </button>
              {isSelf ? (
                <button
                  type="button"
                  onClick={() => router.push("/profile/edit")}
                  className="mt-auto rounded-[7px] border border-border-default bg-transparent px-[18px] py-[7px] text-[13px] text-text-primary transition-colors hover:bg-bg-hover"
                >
                  Edit profile
                </button>
              ) : (
                <div className="mt-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingConv({
                        id: `fr-${user.username}`,
                        name: user.username,
                        initials: user.initials,
                        avatarUrl: user.avatarUrl,
                        level: user.level,
                      });
                      router.push("/messages");
                    }}
                    className="rounded-[7px] border border-border-default bg-transparent px-[18px] py-[7px] text-[13px] text-text-primary transition-colors hover:bg-bg-hover"
                  >
                    Message
                  </button>
                  <button
                    type="button"
                    className="rounded-[7px] bg-text-primary px-[18px] py-[7px] text-[13px] font-medium text-bg-primary transition-opacity hover:opacity-90"
                  >
                    Add friend
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex items-start gap-3.5 p-5 px-8">
          {/* Left column */}
          <div className="flex flex-1 flex-col gap-3.5">
            <Card title="Bio">
              {user.bio ? (
                <p className="text-[13.5px] leading-relaxed text-text-secondary">{user.bio}</p>
              ) : (
                <p className="text-[13px] italic text-text-dimmed">
                  {isSelf ? "No bio yet — add one in Edit profile." : "No bio."}
                </p>
              )}
            </Card>

            <Card title="Friends">
              {friends.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {friends.map((f) => (
                    <Link
                      key={f.name}
                      href={`/profile/${f.name}`}
                      className="flex items-center gap-2.5 rounded-[7px] px-1 py-1.5 transition-colors hover:bg-bg-hover"
                    >
                      <Avatar initials={f.initials} avatarUrl={(f as { avatarUrl?: string }).avatarUrl} size="md" />
                      <span className="flex-1 text-[13px]">{f.name}</span>
                      <span className="text-[12px] text-text-muted">Lvl. {f.level}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] italic text-text-dimmed">No friends to show.</p>
              )}
            </Card>
          </div>

          {/* Right column */}
          <div className="flex flex-1 flex-col gap-3.5">
            <Card title="Interests">
              {interestsLoading ? (
                <p className="text-[13px] italic text-text-dimmed">Loading interests...</p>
              ) : interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {interests.map((i) => (
                    <div
                      key={i.name}
                      className="flex items-center gap-[7px] rounded-full border border-border-default bg-bg-hover px-3 py-[7px] text-[13px] text-text-primary"
                    >
                      <div className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: i.color }} />
                      {i.name}
                    </div>
                  ))}
                  {isSelf && (
                    <button
                      type="button"
                      onClick={() => setShowPicker(true)}
                      className="rounded-full border border-dashed border-border-default px-3 py-[7px] text-[13px] text-text-muted transition-colors hover:border-solid hover:text-text-primary"
                    >
                      + Add
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] italic text-text-dimmed">No interests yet.</p>
                  {isSelf && (
                    <button
                      type="button"
                      onClick={() => setShowPicker(true)}
                      className="rounded-full border border-dashed border-border-default px-3 py-[7px] text-[13px] text-text-muted transition-colors hover:border-solid hover:text-text-primary"
                    >
                      + Add
                    </button>
                  )}
                </div>
              )}
            </Card>

            <Card title="Recent activity">
              {activity.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {activity.map((a, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-bg-hover text-[15px]">
                        {a.emoji}
                      </div>
                      <div>
                        <div className="text-[13px] leading-relaxed text-text-secondary">{a.text}</div>
                        <div className="mt-[3px] text-[11.5px] text-text-dimmed">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] italic text-text-dimmed">No recent activity.</p>
              )}
            </Card>
          </div>
        </div>
      </div>

      {showPanel && (
        <div className="flex w-[260px] shrink-0">
          <FriendsPanel />
        </div>
      )}

      {isSelf && showPicker && (
        <InterestPickerModal
          joined={interests}
          onJoin={handleJoinInterest}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-secondary p-[18px]">
      <div className="mb-3.5 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </div>
      {children}
    </div>
  );
}

function SocialIcon({ platform }: { platform: string }) {
  const cls = "h-[15px] w-[15px]";
  switch (platform) {
    case "github":
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" /></svg>;
    case "linkedin":
      return <svg className={cls} viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>;
    case "instagram":
      return <svg className={cls} viewBox="0 0 24 24" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>;
    case "spotify":
      return <svg className={cls} viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>;
    case "strava":
      return <svg className={cls} viewBox="0 0 24 24" fill="#FC4C02"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.154-10.172h-3.066m-7.258-2.835l2.184 4.316 2.184-4.316h-4.368z" /></svg>;
    case "steam":
      return <svg className={cls} viewBox="0 0 24 24" fill="#c6d4df"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0z" /></svg>;
    case "portfolio":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
    default:
      return null;
  }
}
