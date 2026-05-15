"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";
import {
  createAdminProject,
  deleteAdminProject,
  getAdminProjects,
  type AdminProject,
} from "@/lib/data/admin";
import { useCurrentUser } from "@/lib/data/auth";

const adminSections = [
  { label: "Users", href: "/admin", active: false },
  { label: "Projects", href: "/admin/projects", active: true },
  { label: "Channels", href: "/admin/channels", active: false },
];

const initialForm = {
  name: "",
  description: "",
  color: "#4a9eff",
};

export default function AdminProjectsPage() {
  const { user, isPending } = useCurrentUser();
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formStatus, setFormStatus] = useState<"idle" | "saving">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<AdminProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<AdminProject | null>(null);

  async function loadProjects() {
    setStatus("loading");
    setError(null);

    try {
      setProjects(await getAdminProjects());
      setStatus("ready");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load projects");
      setStatus("error");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormStatus("saving");
    setFormError(null);

    try {
      const project = await createAdminProject(form);
      setProjects((currentProjects) => [...currentProjects, project]);
      setForm(initialForm);
      setCreatedProject(project);
    } catch (createError) {
      setFormError(
        createError instanceof Error ? createError.message : "Unable to create project",
      );
    } finally {
      setFormStatus("idle");
    }
  }

  async function confirmDeleteProject() {
    if (!projectToDelete) return;

    try {
      await deleteAdminProject(projectToDelete.id);
      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.id !== projectToDelete.id),
      );
      setProjectToDelete(null);
      setError(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Unable to delete project",
      );
      setProjectToDelete(null);
    }
  }

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    queueMicrotask(() => {
      void loadProjects();
    });
  }, [user?.role]);

  if (isPending) return null;

  if (user?.role !== "ADMIN") {
    return (
      <div className="flex flex-1 items-center justify-center bg-bg-tertiary px-6">
        <div className="text-center">
          <div className="text-[18px] font-semibold text-text-primary">
            Admin access required
          </div>
          <div className="mt-2 text-[13px] text-text-muted">
            This area is only available to administrators.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 items-center justify-center bg-bg-tertiary px-6 md:hidden">
        <div className="max-w-[320px] text-center">
          <div className="text-[18px] font-semibold text-text-primary">
            Admin panel unavailable on mobile
          </div>
          <div className="mt-2 text-[13px] leading-relaxed text-text-muted">
            Please use a desktop screen to manage projects.
          </div>
        </div>
      </div>

      <div className="hidden min-h-0 flex-1 bg-bg-primary md:flex">
        <aside className="flex w-[236px] shrink-0 flex-col border-r border-border-default bg-bg-secondary px-4 py-5">
          <div className="px-2">
            <div className="inline-flex items-center rounded-full border border-danger/35 bg-danger/10 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-danger">
              Admin mode
            </div>
            <div className="mt-4 text-[18px] font-semibold text-text-primary">
              Admin panel
            </div>
            <div className="mt-1 text-[12.5px] leading-relaxed text-text-muted">
              Manage roles, channels, projects, and moderation actions.
            </div>
          </div>

          <nav className="mt-6 flex flex-col gap-1">
            {adminSections.map((section) => (
              <Link
                key={section.label}
                href={section.href}
                className={`rounded-[7px] px-2.5 py-2 text-left transition-colors ${
                  section.active
                    ? "bg-bg-hover text-text-primary"
                    : "text-text-tertiary hover:bg-bg-hover hover:text-text-primary"
                }`}
              >
                <div className="text-[13px] font-medium">{section.label}</div>
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-border-default pt-4">
            <div className="px-2 text-[11.5px] text-text-dimmed">
              Signed in as
            </div>
            <div className="mt-1 truncate px-2 text-[13px] font-medium text-text-primary">
              {user.username}
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-bg-tertiary">
          <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-border-default px-7">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-danger">
                  Admin mode
                </span>
                <span className="text-[12px] text-text-dimmed">
                  Desktop management console
                </span>
              </div>
              <div className="mt-1 text-[18px] font-semibold text-text-primary">
                Projects
              </div>
            </div>

            <Link
              href="/"
              className="rounded-[7px] border border-border-default bg-bg-secondary px-3.5 py-2 text-[12.5px] font-medium text-text-secondary transition-colors hover:border-border-strong hover:bg-bg-hover hover:text-text-primary"
            >
              Back to app
            </Link>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
            <div className="mx-auto grid max-w-[1080px] grid-cols-[340px_minmax(0,1fr)] gap-6">
              <form
                onSubmit={handleSubmit}
                className="self-start rounded-[8px] border border-border-default bg-bg-secondary p-4"
              >
                <div className="text-[13px] font-semibold text-text-primary">
                  Add project
                </div>
                <div className="mt-1 text-[12px] leading-relaxed text-text-muted">
                  The slug is generated automatically from the project name.
                </div>

                <label className="mt-4 block text-[12px] font-medium text-text-secondary">
                  Name
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        name: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-9 w-full rounded-[7px] border border-border-default bg-bg-tertiary px-3 text-[12.5px] text-text-primary outline-none transition-colors placeholder:text-text-dimmed focus:border-border-strong focus:bg-bg-hover"
                    placeholder="Project name"
                    maxLength={80}
                    required
                  />
                </label>

                <label className="mt-3 block text-[12px] font-medium text-text-secondary">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        description: event.target.value,
                      }))
                    }
                    className="mt-1.5 min-h-[96px] w-full resize-none rounded-[7px] border border-border-default bg-bg-tertiary px-3 py-2 text-[12.5px] leading-relaxed text-text-primary outline-none transition-colors placeholder:text-text-dimmed focus:border-border-strong focus:bg-bg-hover"
                    placeholder="Short project description"
                    maxLength={240}
                    required
                  />
                </label>

                <label className="mt-3 block text-[12px] font-medium text-text-secondary">
                  Color
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          color: event.target.value,
                        }))
                      }
                      className="h-9 w-12 rounded-[7px] border border-border-default bg-bg-tertiary p-1"
                      aria-label="Project color"
                    />
                    <input
                      type="text"
                      value={form.color}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          color: event.target.value,
                        }))
                      }
                      className="h-9 min-w-0 flex-1 rounded-[7px] border border-border-default bg-bg-tertiary px-3 text-[12.5px] text-text-primary outline-none transition-colors placeholder:text-text-dimmed focus:border-border-strong focus:bg-bg-hover"
                      placeholder="#4a9eff"
                      pattern="#[0-9a-fA-F]{6}"
                      required
                    />
                  </div>
                </label>

                {formError ? (
                  <div className="mt-3 text-[12px] text-danger">
                    {formError}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={formStatus === "saving"}
                  className="mt-4 w-full rounded-[7px] bg-btn-primary-bg px-3 py-2 text-[12.5px] font-semibold text-btn-primary-text transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {formStatus === "saving" ? "Adding..." : "Add project"}
                </button>
              </form>

              <div className="min-w-0">
                <div className="flex items-center justify-between gap-4 border-b border-border-default pb-4">
                  <div>
                    <div className="text-[13px] font-semibold text-text-primary">
                      Project list
                    </div>
                    <div className="mt-1 text-[12px] text-text-muted">
                      {status === "ready"
                        ? `${projects.length} projects`
                        : "Loading projects"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={loadProjects}
                    className="rounded-[6px] border border-border-default px-3 py-1.5 text-[11.5px] font-medium text-text-secondary transition-colors hover:border-border-strong hover:bg-bg-hover hover:text-text-primary"
                  >
                    Refresh
                  </button>
                </div>

                {status === "error" ? (
                  <div className="mt-4 rounded-[8px] border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger">
                    {error ?? "Projects could not be loaded."}
                  </div>
                ) : null}

                {status === "loading" && projects.length === 0 ? (
                  <div className="mt-4 rounded-[8px] border border-border-default bg-bg-secondary px-4 py-6 text-center text-[13px] text-text-muted">
                    Loading projects...
                  </div>
                ) : null}

                {status === "ready" && projects.length === 0 ? (
                  <div className="mt-4 rounded-[8px] border border-border-default bg-bg-secondary px-4 py-6 text-center text-[13px] text-text-muted">
                    No projects yet.
                  </div>
                ) : null}

                <div className="mt-4 flex flex-col gap-3">
                  {projects.map((project) => (
                    <article
                      key={project.id}
                      className="rounded-[8px] border border-border-default bg-bg-secondary p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: project.color }}
                              aria-hidden="true"
                            />
                            <h2 className="truncate text-[14px] font-semibold text-text-primary">
                              {project.name}
                            </h2>
                          </div>
                          <div className="mt-1 text-[11.5px] text-text-dimmed">
                            /projects/{project.slug} - {project.messageCount} messages
                          </div>
                          <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
                            {project.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProjectToDelete(project)}
                          className="shrink-0 rounded-[6px] border border-danger/35 px-3 py-1.5 text-[11.5px] font-semibold text-danger transition-colors hover:bg-danger hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {projectToDelete ? (
        <ConfirmModal
          title="Delete this project?"
          description={
            <>
              This will delete{" "}
              <span className="font-medium text-white">{projectToDelete.name}</span>{" "}
              and its discussion messages.
            </>
          }
          confirmLabel="Delete"
          tone="danger"
          onCancel={() => setProjectToDelete(null)}
          onConfirm={confirmDeleteProject}
        />
      ) : null}

      {createdProject ? (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-[4px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCreatedProject(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setCreatedProject(null);
          }}
          tabIndex={-1}
          ref={(element) => element?.focus()}
        >
          <div className="w-[380px] rounded-[14px] border border-white/[0.12] bg-[#0f0f0e] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="mb-2 text-[16px] font-semibold text-white">
              Project created
            </div>
            <div className="mb-5 text-[12.5px] leading-relaxed text-[#888888]">
              <span className="font-medium text-white">{createdProject.name}</span>{" "}
              has been added to the project list.
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCreatedProject(null)}
                className="rounded-[6px] bg-text-primary px-4 py-[7px] text-[12.5px] font-medium text-bg-primary transition-opacity hover:opacity-90"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
