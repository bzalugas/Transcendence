"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import CohortStatsPanel from "@/components/CohortStatsPanel";
import FriendsList from "@/components/FriendsList";
import PanelToggleIcon from "@/components/icons/PanelToggleIcon";
import {
  getSuggestions,
  getFriendRequests,
  sendFriendRequest,
  getSentRequests,
  cancelSentRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  type FriendRequest,
  type SuggestionProfile,
} from "@/lib/data/suggestions";
import { getFriends } from "@/lib/data/friends";
import { notifyNavBadgesUpdated } from "@/lib/data/nav-events";
import type { Friend } from "@/lib/types";

export default function SuggestionsPage() {
  const [showPanel, setShowPanel] = useState(true);
  const [search, setSearch] = useState("");
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [outgoingSuggestions, setOutgoingSuggestions] = useState<Set<string>>(new Set());
  const [dismissingSuggestions, setDismissingSuggestions] = useState<Set<string>>(new Set());
  const [appearingSuggestions, setAppearingSuggestions] = useState<Set<string>>(new Set());
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [cancelingRequests, setCancelingRequests] = useState<Set<number>>(new Set());
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionProfile[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const totalProfiles = suggestions.length;

  useEffect(() => {
    let active = true;

    getSuggestions()
      .then((items) => {
        if (active) setSuggestions(items);
      })
      .catch(() => {
        if (active) setSuggestions([]);
      })
      .finally(() => {
        if (active) setSuggestionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getFriends()
      .then((items) => {
        if (active) setFriendsList(items);
      })
      .catch(() => {
        if (active) setFriendsList([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([getFriendRequests(), getSentRequests()])
      .then(([requests, sent]) => {
        if (!active) return;
        setPendingRequests(requests);
        setSentRequests(sent);
        setRequested(new Set(sent.map((request) => request.name)));
      })
      .catch(() => {
        if (!active) return;
        setPendingRequests([]);
        setSentRequests([]);
        setRequested(new Set());
      });

    return () => {
      active = false;
    };
  }, []);

  // Sends a friend request and marks the suggestion as pending in the UI.
  async function sendRequest(name: string) {
    setSendingRequests((prev) => new Set([...prev, name]));

    try {
      const sentRequest = await sendFriendRequest(name);
      setRequested((prev) => new Set([...prev, name]));
      setOutgoingSuggestions((prev) => new Set([...prev, name]));
      window.setTimeout(() => {
        setDismissingSuggestions((prev) => new Set([...prev, name]));
      }, 500);
      window.setTimeout(() => {
        let visibleNamesAfterRemoval = new Set<string>();
        setSuggestions((prev) => {
          const next = prev.filter((suggestion) => suggestion.name !== name);
          visibleNamesAfterRemoval = new Set(next.map((suggestion) => suggestion.name));
          return next;
        });
        setSentRequests((prev) =>
          prev.some((request) => request.name === sentRequest.name)
            ? prev
            : [sentRequest, ...prev],
        );
        setOutgoingSuggestions((prev) => {
          const next = new Set(prev);
          next.delete(name);
          return next;
        });
        setDismissingSuggestions((prev) => {
          const next = new Set(prev);
          next.delete(name);
          return next;
        });
        window.setTimeout(() => {
          void getSuggestions()
            .then((items) => {
              const enteringNames = items
                .map((item) => item.name)
                .filter((itemName) => !visibleNamesAfterRemoval.has(itemName));

              if (enteringNames.length > 0) {
                setAppearingSuggestions((prev) => new Set([...prev, ...enteringNames]));
              }

              setSuggestions(items);

              if (enteringNames.length > 0) {
                window.requestAnimationFrame(() => {
                  setAppearingSuggestions((prev) => {
                    const next = new Set(prev);
                    enteringNames.forEach((itemName) => next.delete(itemName));
                    return next;
                  });
                });
              }
            })
            .catch(() => {});
        }, 500);
      }, 1200);
    } finally {
      setSendingRequests((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }
  }

  // Accepts a received request and refreshes the real friends list.
  async function acceptRequest(request: FriendRequest) {
    const friend = await acceptFriendRequest(request.id);
    setFriendsList((prev) =>
      prev.some((item) => item.name === friend.name) ? prev : [...prev, friend],
    );
    setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
    notifyNavBadgesUpdated();
  }

  // Rejects a received request and removes it from the pending list.
  async function rejectRequest(request: FriendRequest) {
    await rejectFriendRequest(request.id);
    setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
    notifyNavBadgesUpdated();
  }

  async function cancelRequest(request: FriendRequest) {
    setCancelingRequests((prev) => new Set([...prev, request.id]));

    try {
      await cancelSentRequest(request.id);
      setSentRequests((prev) => prev.filter((item) => item.id !== request.id));
      setRequested((prev) => {
        const next = new Set(prev);
        next.delete(request.name);
        return next;
      });
      void getSuggestions()
        .then(setSuggestions)
        .catch(() => {});
    } finally {
      setCancelingRequests((prev) => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  }

  const filteredSuggestions = suggestions.filter((s) => {
    if (requested.has(s.name) && !outgoingSuggestions.has(s.name)) return false;

    const q = search.toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.sharedTags.some((t) => t.toLowerCase().includes(q)) ||
      s.otherTags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto bg-bg-tertiary px-4 py-5 sm:px-6 md:px-8 md:py-7">
        <div className="mb-0.5 flex items-center justify-between">
          <div className="text-[19px] font-medium">Suggestions for you</div>
          <button
            type="button"
            onClick={() => setShowPanel(!showPanel)}
            className={`hidden items-center rounded-[5px] p-1 transition-colors hover:bg-bg-hover hover:text-text-primary xl:flex ${
              showPanel ? "text-text-dimmed" : "bg-bg-hover text-text-primary"
            }`}
            title="Toggle panel"
          >
            <PanelToggleIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-[18px] mt-[5px] text-[13px] text-text-muted">
          Based on your shared interests -- {totalProfiles} profiles found
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-[22px] w-full rounded-full border border-border-default bg-bg-secondary px-4 py-2.5 text-[13.5px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
          placeholder="Search a profile by name or interest..."
        />

        {/* Cards grid */}
        {suggestionsLoading ? (
          <div className="rounded-xl border border-border-default bg-bg-secondary p-[18px] text-[13px] italic text-text-dimmed">
            Loading suggestions...
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="rounded-xl border border-border-default bg-bg-secondary p-[18px] text-[13px] italic text-text-dimmed">
            No suggestions found.
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-[13px] sm:grid-cols-2 xl:grid-cols-3">
          {filteredSuggestions.map((s) => (
            <div
              key={s.name}
              className={`flex flex-col gap-[13px] rounded-xl border border-border-default bg-bg-secondary p-[18px] transition-all duration-700 hover:border-border-strong ${
                dismissingSuggestions.has(s.name)
                  ? "scale-[0.98] opacity-0"
                  : appearingSuggestions.has(s.name)
                    ? "scale-[0.98] opacity-0"
                  : "scale-100 opacity-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar initials={s.initials} avatarUrl={s.avatarUrl} size="lg" />
                  {s.online && (
                    <div className="absolute bottom-[1px] right-[1px] h-[9px] w-[9px] rounded-full border-2 border-bg-secondary bg-accent-green" />
                  )}
                </div>
                <div className="flex-1">
                  <Link href={`/profile/${s.name}`} className="text-[14px] font-medium hover:underline">{s.name}</Link>
                  <div className="mt-[3px] flex items-center gap-1.5 text-[12px] text-text-muted">
                    Level {s.level}
                  </div>
                </div>
                {requested.has(s.name) ? (
                  <div
                    className="flex h-[34px] shrink-0 items-center justify-center gap-1.5 rounded-full border-[1.5px] border-accent-green/40 bg-accent-green/10 px-3 text-[12px] font-medium text-accent-green"
                    title="Friend request sent"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-[14px] w-[14px]"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Sent
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={sendingRequests.has(s.name)}
                    onClick={() => sendRequest(s.name)}
                    title="Send friend request"
                    className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-border-default text-[22px] font-light leading-none text-text-tertiary transition-colors hover:border-border-strong hover:text-text-primary disabled:cursor-default disabled:opacity-50"
                  >
                    {sendingRequests.has(s.name) ? "..." : "+"}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-[5px]">
                {s.sharedTags.map((t) => (
                  <span key={t} className="rounded-full bg-contrast-soft-bg px-2.5 py-[3px] text-[12px] text-contrast-soft-text">
                    {t}
                  </span>
                ))}
                {s.otherTags.map((t) => (
                  <span key={t} className="rounded-full border border-border-default bg-bg-hover px-2.5 py-[3px] text-[12px] text-text-muted">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        )}

        {sentRequests.length > 0 && (
          <div className="mt-[22px] xl:hidden">
            <SentRequestsList
              requests={sentRequests}
              cancelingIds={cancelingRequests}
              onCancel={cancelRequest}
            />
          </div>
        )}
      </div>

      {showPanel && (
        <div className="hidden w-[260px] shrink-0 xl:flex">
          <SuggestionsPanel
            pendingRequests={pendingRequests}
            sentRequests={sentRequests}
            cancelingIds={cancelingRequests}
            friends={friendsList}
            onAccept={acceptRequest}
            onReject={rejectRequest}
            onCancelSent={cancelRequest}
          />
        </div>
      )}
    </>
  );
}

function SuggestionsPanel({
  pendingRequests,
  sentRequests,
  cancelingIds,
  friends,
  onAccept,
  onReject,
  onCancelSent,
}: {
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  cancelingIds: Set<number>;
  friends: Friend[];
  onAccept: (request: FriendRequest) => void;
  onReject: (request: FriendRequest) => void;
  onCancelSent: (request: FriendRequest) => void;
}) {
  return (
    <aside className="flex w-full flex-col overflow-hidden border-l border-border-default bg-bg-secondary">
      <div className="flex-1 overflow-y-auto px-[18px] py-6">
        {/* Friend requests */}
        <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
          Friend requests{" "}
          <span className="ml-1 rounded-[10px] bg-bg-hover px-1.5 py-px text-[10px] font-semibold text-text-primary">
            {pendingRequests.length}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          {pendingRequests.map((r) => (
            <div key={r.name} className="flex items-center gap-[9px] py-[7px]">
              <Link href={`/profile/${r.name}`} className="flex min-w-0 flex-1 items-center gap-[9px] hover:opacity-80">
                <Avatar initials={r.initials} size="md" />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{r.name}</div>
                  <div className="mt-[1px] text-[11px] text-text-dimmed">{r.sharedCount} shared interests</div>
                </div>
              </Link>
              <div className="flex gap-[5px]">
                <button
                  type="button"
                  onClick={() => onAccept(r)}
                  className="rounded-[5px] bg-text-primary px-2.5 py-1 text-[11.5px] font-medium text-bg-tertiary hover:opacity-90"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => onReject(r)}
                  className="rounded-[5px] border border-border-default px-2.5 py-1 text-[11.5px] text-text-muted hover:bg-bg-hover hover:text-text-primary"
                >
                  &#x2715;
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="my-4 h-px bg-border-default" />

        <SentRequestsList
          requests={sentRequests}
          cancelingIds={cancelingIds}
          onCancel={onCancelSent}
        />

        <div className="my-4 h-px bg-border-default" />

        {/* Friends */}
        <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
          Friends
        </div>
        <FriendsList friends={friends} />
      </div>

      {/* Cohort stats (fixed footer) */}
      <div className="sticky bottom-0 shrink-0 border-t border-border-default bg-bg-secondary px-[18px] py-4">
        <CohortStatsPanel />

        {/* Legal links */}
        <div className="mt-4 flex justify-center gap-3 border-t border-border-default pt-3 text-[10.5px] text-text-dimmed">
          <Link href="/privacy" className="transition-colors hover:text-text-secondary">Privacy</Link>
          <span>·</span>
          <Link href="/terms" className="transition-colors hover:text-text-secondary">Terms</Link>
        </div>
      </div>
    </aside>
  );
}

function SentRequestsList({
  requests,
  cancelingIds,
  onCancel,
}: {
  requests: FriendRequest[];
  cancelingIds: Set<number>;
  onCancel: (request: FriendRequest) => void;
}) {
  return (
    <div>
      <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
        Invitations sent{" "}
        <span className="ml-1 rounded-[10px] bg-bg-hover px-1.5 py-px text-[10px] font-semibold text-text-primary">
          {requests.length}
        </span>
      </div>
      {requests.length === 0 ? (
        <p className="text-[12.5px] italic text-text-dimmed">No sent invitations.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {requests.map((request) => {
            const isCanceling = cancelingIds.has(request.id);
            return (
              <div
                key={request.id}
                className="group flex min-w-0 items-center gap-[9px] rounded-[7px] px-2 py-1.5 transition-colors hover:bg-bg-hover"
              >
                <Link href={`/profile/${request.name}`} className="flex min-w-0 flex-1 items-center gap-[9px] hover:opacity-80">
                  <Avatar initials={request.initials} size="md" />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">{request.name}</div>
                    <div className="mt-[1px] text-[11px] text-text-dimmed">
                      Waiting for response
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  disabled={isCanceling}
                  onClick={() => onCancel(request)}
                  className="rounded-full border border-accent-green/30 bg-accent-green/10 px-2 py-[3px] text-[10.5px] font-medium text-accent-green transition-colors group-hover:border-away/35 group-hover:bg-away/10 group-hover:text-away disabled:cursor-default disabled:opacity-60"
                  title="Cancel invitation"
                >
                  <span className="group-hover:hidden">{isCanceling ? "..." : "Sent"}</span>
                  <span className="hidden group-hover:inline">{isCanceling ? "..." : "Cancel"}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
