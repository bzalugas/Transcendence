"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import FriendsPanel from "@/components/FriendsPanel";
import MessageComposer from "@/components/MessageComposer";
import ResponsiveRightPanel, { useResponsiveRightPanel } from "@/components/ResponsiveRightPanel";
import PanelToggleIcon from "@/components/icons/PanelToggleIcon";
import { getBlockedUsers } from "@/lib/data/blocks";
import {
  createProjectMessage,
  getAllProjects,
  type ProjectDiscussionMessage,
  type ProjectGridItem,
} from "@/lib/data/projects";
import { useCurrentUser } from "@/lib/data/auth";

export default function ProjectsPageClient({
  initialProjects,
}: {
  initialProjects: ProjectGridItem[];
}) {
  const {
    desktopOpen: panelDesktopOpen,
    overlayOpen: panelOverlayOpen,
    panelOpen,
    togglePanel,
    closeOverlay,
  } = useResponsiveRightPanel();
  const [projectSearch, setProjectSearch] = useState("");
  const [projects, setProjects] = useState<ProjectGridItem[]>(initialProjects);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const { user: currentUser } = useCurrentUser();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [blockedNames, setBlockedNames] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;

    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q)
      );
    });
  }, [projectSearch, projects]);

  const activeProject =
    activeSlug ? projects.find((project) => project.slug === activeSlug) : null;

  const activeMessages = activeProject
    ? filterVisibleMessages(
        activeProject.messages,
        blockedNames,
      )
    : [];
  const mostActiveProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const recentMessagesA = countRecentMessages([
          ...filterVisibleMessages(a.messages, blockedNames),
        ]);
        const recentMessagesB = countRecentMessages([
          ...filterVisibleMessages(b.messages, blockedNames),
        ]);

        return recentMessagesB - recentMessagesA;
      })
      .slice(0, 3);
  }, [blockedNames, projects]);

  useEffect(() => {
    if (!currentUser || currentUser.role === "GUEST") return;

    let mounted = true;
    queueMicrotask(() => {
      if (mounted) setProjectsLoading(true);
    });

    getAllProjects()
      .then((loadedProjects) => {
        if (!mounted) return;
        setProjects(loadedProjects);
      })
      .finally(() => {
        if (!mounted) return;
        setProjectsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role === "GUEST") return;

    let mounted = true;

    getBlockedUsers()
      .then((users) => {
        if (!mounted) return;
        setBlockedNames(
          new Set(users.map((user) => normalizeProfileName(user.name))),
        );
      })
      .catch(() => {
        if (mounted) setBlockedNames(new Set());
      });

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!activeSlug) return;
    if (projects.some((project) => project.slug === activeSlug)) return;
    queueMicrotask(() => {
      setActiveSlug(null);
    });
  }, [activeSlug, projects]);

  useEffect(() => {
    if (!activeProject) return;

    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [activeMessages.length, activeProject]);

  useEffect(() => {
    if (!activeProject) return;

    requestAnimationFrame(() => {
      composerInputRef.current?.focus();
    });
  }, [activeProject]);

  if (!currentUser) return null;
  if (currentUser.role === "GUEST") {
    return <LockedProjectsView />;
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || !currentUser) return;

    if (!activeProject) return;

    const message = await createProjectMessage(activeProject.slug, text);
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.slug === activeProject.slug
          ? { ...project, messages: [...project.messages, message] }
          : project,
      ),
    );
    setDraft("");
  }

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-bg-tertiary">
        {!activeProject && (
          <div className="flex items-start justify-between px-4 pt-5 sm:px-6 md:px-8 md:pt-6">
            <div>
              <div className="text-[20px] font-semibold">Projects</div>
              <div className="mb-4 mt-1 text-[12.5px] text-text-muted">
                Project discussions for the 42 common core
              </div>
            </div>
            <button
              type="button"
              onClick={togglePanel}
              className={`mt-1 hidden items-center rounded-[5px] p-1 transition-colors hover:bg-bg-hover hover:text-text-primary md:flex ${
                panelOpen ? "text-text-dimmed" : "bg-bg-hover text-text-primary"
              }`}
              title="Toggle panel"
            >
              <PanelToggleIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {!activeProject ? (
          <div className="flex flex-col px-4 pb-6 sm:px-6 md:px-8">
            <input
              type="text"
              value={projectSearch}
              onChange={(event) => setProjectSearch(event.target.value)}
              className="w-full rounded-lg border border-border-default bg-bg-secondary px-3.5 py-2.5 text-[13.5px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
              placeholder="Search a project..."
            />

            <div className="mt-4 text-[11px] font-medium uppercase tracking-[0.08em] text-text-dimmed">
              {projectsLoading ? "Loading projects" : `${filteredProjects.length} discussions`}
            </div>

            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.slug}
                  project={project}
	                  recentMessageCount={countRecentMessages([
	                    ...filterVisibleMessages(project.messages, blockedNames),
	                  ])}
                  onClick={() => setActiveSlug(project.slug)}
                />
              ))}
            </div>

            {!projectsLoading && filteredProjects.length === 0 && (
              <div className="mt-6 text-center text-[13px] text-text-muted">
                No project found.
              </div>
            )}
          </div>
        ) : (
          <div className="grid min-h-[calc(100dvh-150px)] flex-1 border-t border-border-subtle lg:min-h-0 lg:grid-cols-[184px_minmax(0,1fr)]">
            <aside className="hidden min-h-0 border-r border-border-subtle bg-bg-secondary/40 md:flex md:flex-col">
              <div className="flex h-[62px] items-center border-b border-border-subtle px-3">
                <button
                  type="button"
                  onClick={() => setActiveSlug(null)}
                  className="group flex w-full items-center gap-2 rounded-[8px] border border-border-default bg-bg-secondary px-3 py-2 text-[12.5px] font-medium text-text-secondary transition-colors hover:border-border-strong hover:bg-bg-hover hover:text-text-primary"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="shrink-0 transition-transform group-hover:-translate-x-0.5"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  <span className="truncate">Back to projects</span>
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                <div className="flex flex-col gap-0.5">
                  {projects.map((project) => (
                    <ProjectListItem
                      key={project.slug}
                      project={project}
                      active={project.slug === activeProject.slug}
                      onClick={() => setActiveSlug(project.slug)}
                    />
                  ))}
                </div>
              </div>
            </aside>

            <section className="flex min-h-0 min-w-0 flex-col">
              <div className="flex min-h-[62px] items-center gap-3 border-b border-border-subtle px-4 py-2 sm:h-[62px] sm:px-5 sm:py-0">
                <button
                  type="button"
                  onClick={() => setActiveSlug(null)}
                  className="shrink-0 rounded-[7px] border border-border-default bg-bg-secondary px-3 py-1.5 text-[12.5px] font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary lg:hidden"
                >
                  Back
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold">{activeProject.name}</div>
                  <div className="line-clamp-2 text-[12px] leading-snug text-text-muted sm:truncate">
                    {activeProject.description}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={togglePanel}
                  className={`hidden shrink-0 rounded-[5px] p-1 transition-colors hover:bg-bg-hover hover:text-text-primary md:flex ${
                    panelOpen ? "text-text-dimmed" : "bg-bg-hover text-text-primary"
                  }`}
                  title="Toggle panel"
                >
                  <PanelToggleIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
                <div className="flex w-full flex-col gap-3">
                  {activeMessages.map((message, index) => (
                    <ProjectMessage key={`${message.sender}-${message.time}-${index}`} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <MessageComposer
                inputRef={composerInputRef}
                value={draft}
                onChange={setDraft}
                onSend={handleSend}
                placeholder={`Message #${activeProject.name}`}
                allowAttachments={false}
              />
            </section>
          </div>
        )}
      </div>

      <ResponsiveRightPanel
        desktopOpen={panelDesktopOpen}
        overlayOpen={panelOverlayOpen}
        onCloseOverlay={closeOverlay}
      >
        <FriendsPanel
          topSlot={
            <ProjectsActivityPanel projects={mostActiveProjects} />
          }
        />
      </ResponsiveRightPanel>
    </>
  );
}

function LockedProjectsView() {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-center bg-bg-tertiary px-6">
      <div className="max-w-[420px] text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border-default bg-bg-secondary text-[22px]">
          🔒
        </div>
        <div className="mt-4 text-[20px] font-semibold text-text-primary">
          Projects locked
        </div>
        <div className="mt-2 text-[13px] leading-relaxed text-text-muted">
          Project discussions are reserved for accounts connected with 42.
          Guest accounts can keep using the rest of the site.
        </div>
      </div>
    </div>
  );
}

function ProjectsActivityPanel({
  projects,
}: {
  projects: ProjectGridItem[];
}) {
  return (
    <>
      <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
        Top 3 most active projects
      </div>
      <div className="flex flex-col">
        {projects.map((project) => (
          <div
            key={project.slug}
            className="flex items-center gap-2.5 rounded-[7px] px-2 py-1"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: project.color }} />
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-text-primary">
              {project.name}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function ProjectCard({
  project,
  recentMessageCount,
  onClick,
}: {
  project: ProjectGridItem;
  recentMessageCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[126px] w-full flex-col overflow-hidden rounded-lg border border-border-default bg-bg-secondary p-[18px] text-left shadow-[inset_0_1px_0_var(--color-border-subtle)] transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-bg-hover"
    >
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: project.color }} />

      <div className="min-w-0 pt-px">
        <div className="truncate text-[14px] font-semibold text-text-primary">{project.name}</div>
        <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-text-dimmed">
          {recentMessageCount} recent message{recentMessageCount !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="mt-3 line-clamp-3 text-[12.5px] leading-relaxed text-text-muted">
        {project.description}
      </div>
    </button>
  );
}

function countRecentMessages(messages: ProjectDiscussionMessage[]) {
  return messages.filter((message) => message.daysAgo < 14).length;
}

function filterVisibleMessages(
  messages: ProjectDiscussionMessage[],
  blockedNames: Set<string>,
) {
  return messages.filter(
    (message) => message.me || !blockedNames.has(normalizeProfileName(message.sender)),
  );
}

function normalizeProfileName(name: string) {
  return name.trim().toLowerCase();
}

function ProjectListItem({
  project,
  active,
  onClick,
}: {
  project: ProjectGridItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[7px] px-2.5 py-2 text-left transition-colors hover:bg-bg-hover hover:text-text-primary ${
        active
          ? "bg-bg-hover text-text-primary"
          : "text-text-tertiary"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: project.color }} />
        <span className="min-w-0 truncate text-[13px] font-medium">
          {project.name}
        </span>
      </div>
    </button>
  );
}

function ProjectMessage({ message }: { message: ProjectDiscussionMessage }) {
  return (
    <div className={`flex gap-2.5 ${message.me ? "justify-end" : ""}`}>
      {!message.me && (
        <Avatar
          initials={message.initials}
          avatarUrl={message.avatarUrl}
          size="sm"
        />
      )}
      <div className={`max-w-[88%] sm:max-w-[78%] ${message.me ? "items-end" : "items-start"} flex flex-col`}>
        <div className="mb-1 flex items-baseline gap-2 text-[11.5px]">
          <span className="font-medium text-text-secondary">{message.me ? "You" : message.sender}</span>
          <span className="text-text-dimmed">{message.time}</span>
        </div>
        <div
          className={`rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
            message.me
              ? "bg-contrast-soft-bg text-contrast-soft-text"
              : "border border-border-default bg-bg-secondary text-text-secondary"
          }`}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}
