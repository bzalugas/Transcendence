"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import PanelToggleIcon from "@/components/icons/PanelToggleIcon";
import { suggestions, friendRequests } from "@/lib/mocks/suggestions";
import { friends, cohortStats } from "@/lib/mocks/friends";
import { rooms } from "@/lib/mocks/rooms";

const filterTags = ["All", ...rooms.map((r) => r.label)];

export default function SuggestionsPage() {
  const [showPanel, setShowPanel] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

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
        <div className="mb-[22px] mt-[5px] text-[13px] text-text-muted">
          Based on your shared interests -- {suggestions.length * 4} profiles found
        </div>

        {/* Filters */}
        <div className="mb-[22px] flex flex-wrap gap-2">
          {filterTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveFilter(tag)}
              className={`rounded-full border px-4 py-[7px] text-[13px] transition-all ${
                activeFilter === tag
                  ? "border-text-primary bg-text-primary text-bg-tertiary"
                  : "border-border-default text-text-tertiary hover:border-border-strong hover:text-text-primary"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-3 gap-[13px]">
          {suggestions.map((s) => (
            <div
              key={s.name}
              className="flex cursor-pointer flex-col gap-[13px] rounded-xl border border-border-default bg-bg-secondary p-[18px] transition-colors hover:border-border-strong"
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
                <button className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-border-default text-[22px] font-light leading-none text-text-tertiary transition-colors hover:border-border-strong hover:text-text-primary">
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
  return (
    <aside className="flex w-full flex-col overflow-y-auto border-l border-border-default bg-bg-secondary px-[18px] py-6">
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
            <Avatar initials={r.initials} size="md" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium">{r.name}</div>
              <div className="mt-[1px] text-[11px] text-text-dimmed">{r.sharedCount} shared interests</div>
            </div>
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
      <div className="flex flex-col gap-0.5">
        {friends.map((f) => (
          <button
            key={f.name}
            type="button"
            className="flex items-center gap-[9px] rounded-[7px] px-2 py-[5px] transition-colors hover:bg-bg-hover"
          >
            <Avatar initials={f.initials} avatarUrl={f.avatarUrl} size="md" />
            <span className="flex-1 text-left text-[12.5px] text-text-primary">{f.name}</span>
            <span className="text-[11px] text-text-dimmed">lvl {f.level}</span>
          </button>
        ))}
      </div>

      {/* Cohort stats */}
      <div className="mt-auto">
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
      </div>
    </aside>
  );
}
