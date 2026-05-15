"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import CohortStatsPanel from "@/components/CohortStatsPanel";
import PanelToggleIcon from "@/components/icons/PanelToggleIcon";
import { getLfgPosts, getAllProjects, getTrendingProjects } from "@/lib/data/projects";
import type { LfgPost } from "@/lib/mocks/projects";
import { useCurrentUser } from "@/lib/data/auth";

export default function ProjectsPage() {
  const [showPanel, setShowPanel] = useState(true);
  const [activeTab, setActiveTab] = useState<"lfg" | "all">("lfg");
  const [projectSearch, setProjectSearch] = useState("");
  const [lfgSearch, setLfgSearch] = useState("");
  const lfgPosts = getLfgPosts();
  const allProjects = getAllProjects();
  const { user: currentUser } = useCurrentUser();
  const [appliedKeys, setAppliedKeys] = useState<Set<string>>(new Set());

  if (!currentUser) return null;

  function handleApply(key: string) {
    setAppliedKeys((prev) => new Set([...prev, key]));
  }

  const filteredProjects = allProjects.filter((p) => {
    const q = projectSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  const filteredLfg = lfgPosts.filter((p) => {
    const q = lfgSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.project.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto bg-bg-tertiary">
        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-5 sm:px-6 md:px-8 md:pt-6">
          <div>
            <div className="text-[20px] font-semibold">Projects</div>
            <div className="mb-4 mt-1 text-[12.5px] text-text-muted">
              Find teammates, share progress, team up on 42 projects
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPanel(!showPanel)}
            className={`mt-1 hidden items-center rounded-[5px] p-1 transition-colors hover:bg-bg-hover hover:text-text-primary xl:flex ${
              showPanel ? "text-text-dimmed" : "bg-bg-hover text-text-primary"
            }`}
            title="Toggle panel"
          >
            <PanelToggleIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mx-4 mb-1 flex gap-0 overflow-x-auto border-b border-border-default sm:mx-6 md:mx-8">
          <button
            onClick={() => setActiveTab("lfg")}
            className={`-mb-px border-b-2 px-[18px] py-2.5 text-[13.5px] transition-colors ${
              activeTab === "lfg"
                ? "border-text-primary text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            Looking for team
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`-mb-px border-b-2 px-[18px] py-2.5 text-[13.5px] transition-colors ${
              activeTab === "all"
                ? "border-text-primary text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            All projects
          </button>
        </div>

        {/* LFG tab */}
        {activeTab === "lfg" && (
          <>
            {/* Composer */}
            <div className="mx-4 mt-4 rounded-xl border border-border-default bg-bg-secondary p-4 sm:mx-6 md:mx-8">
              <div className="mb-2.5 flex items-center gap-2.5">
                <Avatar initials={currentUser.initials} avatarUrl={currentUser.avatarUrl} size="md" />
                <input
                  className="flex-1 bg-transparent text-[13.5px] text-text-primary outline-none placeholder:text-text-dimmed"
                  placeholder="Looking for teammates? Describe what you need..."
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select className="cursor-pointer appearance-none rounded-md border border-border-default bg-bg-hover px-2.5 py-1.5 text-[12px] text-text-secondary outline-none hover:border-border-strong">
                  <option value="">Project...</option>
                  {allProjects.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="w-full rounded-md border border-border-default bg-bg-hover px-2.5 py-1.5 text-[12px] text-text-secondary outline-none placeholder:text-text-dimmed sm:w-20"
                  placeholder="Spots"
                />
                <button className="rounded-[7px] bg-text-primary px-4 py-1.5 text-[12.5px] font-medium text-bg-tertiary hover:opacity-90 sm:ml-auto">
                  Post
                </button>
              </div>
            </div>

            {/* LFG cards */}
            <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 md:px-8">
              <input
                type="text"
                value={lfgSearch}
                onChange={(e) => setLfgSearch(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3.5 py-2.5 text-[13.5px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
                placeholder="Search a team or project..."
              />
              {filteredLfg.map((post) => {
                const key = `${post.name}-${post.project}`;
                return (
                  <LfgCard
                    key={key}
                    post={post}
                    applied={appliedKeys.has(key)}
                    onApply={() => handleApply(key)}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* All projects tab */}
        {activeTab === "all" && (
          <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 md:px-8">
            <input
              type="text"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-bg-secondary px-3.5 py-2.5 text-[13.5px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
              placeholder="Search a project..."
            />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((p) => (
                <div
                  key={p.name}
                  className={`flex cursor-pointer flex-col gap-2.5 rounded-xl border p-4 transition-colors hover:border-border-strong ${
                    p.unread
                      ? "border-card-unread-border bg-card-unread-bg"
                      : "border-border-default bg-bg-secondary"
                  }`}
                >
                  <div className="flex items-center gap-[9px]">
                    <div className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: p.color }} />
                    <span className="text-[13.5px] font-medium">{p.name}</span>
                    {p.unread && <div className="ml-auto h-[7px] w-[7px] shrink-0 rounded-full bg-accent-blue" />}
                  </div>
                  <div className="text-[11.5px] leading-snug text-text-muted">{p.description}</div>
                  <div className="mt-auto flex gap-3">
                    <span className="text-[11px] text-text-dimmed"><span className="font-medium text-stat-val">{p.looking}</span> looking</span>
                    <span className="text-[11px] text-text-dimmed"><span className="font-medium text-stat-val">{p.active}</span> active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showPanel && (
        <div className="hidden w-[280px] shrink-0 xl:flex">
          <ProjectsPanel />
        </div>
      )}
    </>
  );
}

function LfgCard({ post, applied, onApply }: { post: LfgPost; applied: boolean; onApply: () => void }) {

  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-bg-secondary transition-colors hover:border-border-strong">
      {/* Header */}
      <div className="flex items-center gap-[11px] px-4 pb-2.5 pt-4">
        <div className="relative">
          <Avatar initials={post.initials} size="lg" />
          {post.online && !post.away && (
            <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-bg-secondary bg-accent-green" />
          )}
          {post.away && (
            <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-bg-secondary bg-away" />
          )}
        </div>
        <div>
          <Link href="/profile" className="inline-block text-[13.5px] font-medium hover:underline">
            {post.name}
          </Link>
          <div className="mt-0.5 text-[12px] text-text-muted">{post.time}</div>
        </div>
        <div className="ml-auto whitespace-nowrap rounded-full border border-border-default bg-bg-hover px-3 py-1 text-[12.5px] text-text-muted">
          <span className="font-medium text-text-primary">{post.commonInterests}</span> common interest{post.commonInterests !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-border-default bg-bg-hover px-3 py-1 text-[12.5px] font-medium">
          <div className="h-[7px] w-[7px] rounded-full" style={{ background: post.projectColor }} />
          {post.project}
        </div>
        <div className="text-[13px] leading-relaxed text-text-secondary">{post.description}</div>
      </div>

      {/* Team members */}
      <div className="flex items-center gap-1.5 px-4 pb-3">
        <span className="text-[11.5px] text-text-dimmed">Team:</span>
        {post.teamMembers.map((m) => (
          <div
            key={m}
            className="-ml-1 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-bg-secondary bg-bg-hover text-[8px] font-medium first:ml-0"
          >
            {m}
          </div>
        ))}
        {Array.from({ length: post.spotsLeft }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="-ml-1 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-bg-secondary bg-transparent text-[8px] text-text-dimmed ring-1 ring-border-default"
          >
            ?
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2.5 border-t border-border-subtle px-4 py-2.5">
        <span className="flex-1 text-[12px] text-text-muted">
          {post.spotsLeft > 0 ? (
            <><strong className="text-text-primary">{post.spotsLeft}</strong> spot{post.spotsLeft > 1 ? "s" : ""} left</>
          ) : (
            <span className="text-text-dimmed">Team complete</span>
          )}
        </span>
        {post.spotsLeft > 0 ? (
          applied ? (
            <span className="rounded-md border border-[rgba(90,158,58,0.3)] bg-[rgba(90,158,58,0.1)] px-3.5 py-[5px] text-[12px] font-medium text-accent-green">
              Applied
            </span>
          ) : (
            <button
              onClick={onApply}
              className="rounded-md bg-text-primary px-3.5 py-[5px] text-[12px] font-medium text-bg-tertiary hover:opacity-90"
            >
              Apply
            </button>
          )
        ) : (
          <span className="rounded-md border border-border-subtle bg-bg-hover px-3.5 py-[5px] text-[12px] text-text-dimmed">
            Full
          </span>
        )}
      </div>
    </div>
  );
}

function ProjectsPanel() {
  const trendingProjects = getTrendingProjects();
  return (
    <aside className="flex w-full flex-col overflow-y-auto border-l border-border-default bg-bg-secondary px-[18px] py-6">
      <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
        Trending Projects this week
      </div>
      <div className="flex flex-col gap-0.5">
        {trendingProjects.map((t, idx) => (
          <div
            key={t.name}
            className="flex cursor-pointer items-center gap-2.5 rounded-[7px] px-2 py-[7px] transition-colors hover:bg-bg-hover"
          >
            <span className="w-3.5 text-center text-[11px] font-semibold text-text-dimmed">{idx + 1}</span>
            <span className="flex-1 text-[13px] text-text-secondary">{t.name}</span>
            <span className="text-[11px] text-text-dimmed">{t.messages} msgs</span>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 mt-auto bg-bg-secondary pt-1">
        <div className="my-4 h-px bg-border-default" />
        <CohortStatsPanel />
      </div>
    </aside>
  );
}
