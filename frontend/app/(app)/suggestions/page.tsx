"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import FriendsList from "@/components/FriendsList";
import PanelToggleIcon from "@/components/icons/PanelToggleIcon";
import { getSuggestions, getSuggestionsTotal, getFriendRequests } from "@/lib/data/suggestions";
import { getFriends, getCohortStats } from "@/lib/data/friends";

export default function SuggestionsPage() {
  const [showPanel, setShowPanel] = useState(true);
  const [search, setSearch] = useState("");
  const suggestions = getSuggestions();
  const totalProfiles = getSuggestionsTotal();

  const filteredSuggestions = suggestions.filter((s) => {
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
      <div className="flex flex-1 flex-col overflow-y-auto bg-bg-tertiary px-8 py-7">
        <div className="mb-0.5 flex items-center justify-between">
          <div className="text-[19px] font-medium">Suggestions for you</div>
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
        <div className="grid grid-cols-3 gap-[13px]">
          {filteredSuggestions.map((s) => (
            <div
              key={s.name}
              className="flex flex-col gap-[13px] rounded-xl border border-border-default bg-bg-secondary p-[18px] transition-colors hover:border-border-strong"
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar initials={s.initials} size="lg" />
                  {s.online && (
                    <div className="absolute bottom-[1px] right-[1px] h-[9px] w-[9px] rounded-full border-2 border-bg-secondary bg-accent-green" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-medium">{s.name}</div>
                  <div className="mt-[3px] flex items-center gap-1.5 text-[12px] text-text-muted">
                    <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-border-default bg-bg-hover text-[11px] font-medium">
                      {s.level}
                    </div>
                    Level {s.level}
                  </div>
                </div>
                <button className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-border-default text-[22px] font-light leading-none text-text-tertiary transition-colors hover:border-border-strong hover:text-text-primary">
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-[5px]">
                {s.sharedTags.map((t) => (
                  <span key={t} className="rounded-full bg-text-primary px-2.5 py-[3px] text-[12px] text-bg-tertiary">
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
      </div>

      {showPanel && (
        <div className="flex w-[260px] shrink-0">
          <SuggestionsPanel />
        </div>
      )}
    </>
  );
}

function SuggestionsPanel() {
  const friendRequests = getFriendRequests();
  const friends = getFriends();
  const cohortStats = getCohortStats();
  return (
    <aside className="flex w-full flex-col overflow-hidden border-l border-border-default bg-bg-secondary">
      <div className="flex-1 overflow-y-auto px-[18px] py-6">
        {/* Friend requests */}
        <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
          Friend requests{" "}
          <span className="ml-1 rounded-[10px] bg-bg-hover px-1.5 py-px text-[10px] font-semibold text-text-primary">
            {friendRequests.length}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          {friendRequests.map((r) => (
            <div key={r.name} className="flex items-center gap-[9px] py-[7px]">
              <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-[9px] hover:opacity-80">
                <Avatar initials={r.initials} size="md" />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{r.name}</div>
                  <div className="mt-[1px] text-[11px] text-text-dimmed">{r.sharedCount} shared interests</div>
                </div>
              </Link>
              <div className="flex gap-[5px]">
                <button className="rounded-[5px] bg-text-primary px-2.5 py-1 text-[11.5px] font-medium text-bg-tertiary hover:opacity-90">
                  Accept
                </button>
                <button className="rounded-[5px] border border-border-default px-2.5 py-1 text-[11.5px] text-text-muted hover:bg-bg-hover hover:text-text-primary">
                  &#x2715;
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="my-4 h-px bg-border-default" />

        {/* Friends */}
        <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
          Friends
        </div>
        <FriendsList friends={friends} />
      </div>

      {/* Cohort stats (fixed footer) */}
      <div className="shrink-0 border-t border-border-default px-[18px] py-4">
        <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
          Class stats
        </div>
        <div className="flex flex-col gap-2">
          {cohortStats.map((s) => (
            <div key={s.label} className="flex items-center justify-between text-[12.5px]">
              <span className="text-text-muted">{s.label}</span>
              <span className="font-medium text-text-primary">{s.value}</span>
            </div>
          ))}
        </div>

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
