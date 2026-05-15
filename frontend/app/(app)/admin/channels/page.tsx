"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";
import {
  approveAdminInterestRequest,
  createAdminChannel,
  deleteAdminChannel,
  getAdminChannels,
  getAdminInterestRequests,
  rejectAdminInterestRequest,
  type AdminChannel,
  type AdminInterestRequest,
} from "@/lib/data/admin";
import { useCurrentUser } from "@/lib/data/auth";

const adminSections = [
  { label: "Users", href: "/admin", active: false },
  { label: "Projects", href: "/admin/projects", active: false },
  { label: "Channels", href: "/admin/channels", active: true },
];

const initialForm = {
  name: "",
  description: "",
  color: "#4a9eff",
};

const initialRequestForm = {
  name: "",
  description: "",
  color: "#4a9eff",
};

export default function AdminChannelsPage() {
  const { user, isPending } = useCurrentUser();
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [requests, setRequests] = useState<AdminInterestRequest[]>([]);
  const [channelsStatus, setChannelsStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [requestsStatus, setRequestsStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formStatus, setFormStatus] = useState<"idle" | "saving">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [createdChannel, setCreatedChannel] = useState<AdminChannel | null>(null);
  const [channelToDelete, setChannelToDelete] = useState<AdminChannel | null>(null);
  const [requestToEdit, setRequestToEdit] = useState<AdminInterestRequest | null>(null);
  const [requestForm, setRequestForm] = useState(initialRequestForm);
  const [requestEditError, setRequestEditError] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);

  async function loadChannels() {
    setChannelsStatus("loading");
    setChannelsError(null);

    try {
      setChannels(await getAdminChannels());
      setChannelsStatus("ready");
    } catch (error) {
      setChannelsError(error instanceof Error ? error.message : "Unable to load channels");
      setChannelsStatus("error");
    }
  }

  async function loadRequests() {
    setRequestsStatus("loading");
    setRequestsError(null);

    try {
      setRequests(await getAdminInterestRequests());
      setRequestsStatus("ready");
    } catch (error) {
      setRequestsError(error instanceof Error ? error.message : "Unable to load requests");
      setRequestsStatus("error");
    }
  }

  async function handleCreateChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormStatus("saving");
    setFormError(null);

    try {
      const channel = await createAdminChannel(form);
      setChannels((currentChannels) => [...currentChannels, channel]);
      setForm(initialForm);
      setCreatedChannel(channel);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create channel");
    } finally {
      setFormStatus("idle");
    }
  }

  async function confirmDeleteChannel() {
    if (!channelToDelete) return;

    try {
      await deleteAdminChannel(channelToDelete.id);
      setChannels((currentChannels) =>
        currentChannels.filter((channel) => channel.id !== channelToDelete.id),
      );
      setChannelToDelete(null);
      setChannelsError(null);
    } catch (error) {
      setChannelsError(error instanceof Error ? error.message : "Unable to delete channel");
      setChannelToDelete(null);
    }
  }

  function openRequestEditor(request: AdminInterestRequest) {
    setRequestToEdit(request);
    setRequestForm({
      name: request.name,
      description: getEditableRequestDescription(request.description),
      color: "#4a9eff",
    });
    setRequestEditError(null);
  }

  async function submitRequestEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requestToEdit) return;

    setBusyRequestId(requestToEdit.id);
    setRequestsError(null);
    setRequestEditError(null);

    try {
      const channel = await approveAdminInterestRequest(requestToEdit.id, requestForm);
      setChannels((currentChannels) => {
        if (currentChannels.some((item) => item.id === channel.id)) {
          return currentChannels;
        }

        return [...currentChannels, channel];
      });
      setRequests((currentRequests) =>
        currentRequests.filter((item) => item.id !== requestToEdit.id),
      );
      setRequestToEdit(null);
      setRequestForm(initialRequestForm);
    } catch (error) {
      setRequestEditError(
        error instanceof Error ? error.message : "Unable to add this interest",
      );
    } finally {
      setBusyRequestId(null);
    }
  }

  async function rejectRequest(request: AdminInterestRequest) {
    setBusyRequestId(request.id);
    setRequestsError(null);

    try {
      await rejectAdminInterestRequest(request.id);
      setRequests((currentRequests) =>
        currentRequests.filter((item) => item.id !== request.id),
      );
    } catch (error) {
      setRequestsError(error instanceof Error ? error.message : "Unable to reject request");
    } finally {
      setBusyRequestId(null);
    }
  }

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    queueMicrotask(() => {
      void loadChannels();
      void loadRequests();
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
            Please use a desktop screen to manage channels.
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
                Channels
              </div>
            </div>

            <Link
              href="/"
              className="rounded-[7px] border border-border-default bg-bg-secondary px-3.5 py-2 text-[12.5px] font-medium text-text-secondary transition-colors hover:border-border-strong hover:bg-bg-hover hover:text-text-primary"
            >
              Back to app
            </Link>
          </header>

          <section className="grid min-h-0 flex-1 grid-cols-[minmax(360px,0.95fr)_minmax(420px,1.05fr)] gap-6 overflow-hidden px-7 py-6">
            <div className="flex min-h-0 flex-col rounded-[8px] border border-border-default bg-bg-secondary">
              <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-border-default px-4">
                <div>
                  <div className="text-[13px] font-semibold text-text-primary">
                    Current channels
                  </div>
                  <div className="text-[11.5px] text-text-dimmed">
                    {channelsStatus === "ready"
                      ? `${channels.length} channels`
                      : "Loading channels"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={loadChannels}
                  className="rounded-[6px] border border-border-default px-2.5 py-1.5 text-[11.5px] text-text-secondary transition-colors hover:border-border-strong hover:bg-bg-hover hover:text-text-primary"
                >
                  Refresh
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                {channelsError ? (
                  <div className="mb-3 text-[12px] text-danger">{channelsError}</div>
                ) : null}

                {channelsStatus === "loading" && channels.length === 0 ? (
                  <div className="px-2 py-6 text-[12.5px] text-text-muted">
                    Loading channels...
                  </div>
                ) : null}

                {channelsStatus === "ready" && channels.length === 0 ? (
                  <div className="px-2 py-6 text-[12.5px] text-text-muted">
                    No channels yet.
                  </div>
                ) : null}

                <div className="flex flex-col gap-2">
                  {channels.map((channel) => (
                    <article
                      key={channel.id}
                      className="rounded-[8px] border border-border-subtle bg-bg-tertiary px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: channel.color }}
                              aria-hidden="true"
                            />
                            <div className="truncate text-[13px] font-semibold text-text-primary">
                              {channel.name}
                            </div>
                          </div>
                          <div className="mt-1 text-[11.5px] text-text-dimmed">
                            {channel.memberCount} members
                          </div>
                          {channel.description ? (
                            <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-text-muted">
                              {channel.description}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => setChannelToDelete(channel)}
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

            <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-6">
              <form
                onSubmit={handleCreateChannel}
                className="rounded-[8px] border border-border-default bg-bg-secondary p-4"
              >
                <div className="text-[13px] font-semibold text-text-primary">
                  Create channel
                </div>
                <div className="mt-1 text-[12px] text-text-muted">
                  Create a channel directly without going through a request.
                </div>

                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_112px] gap-3">
                  <label className="block text-[12px] font-medium text-text-secondary">
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
                      placeholder="Channel name"
                      maxLength={50}
                      required
                    />
                  </label>

                  <label className="block text-[12px] font-medium text-text-secondary">
                    Color
                    <input
                      type="color"
                      value={form.color}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          color: event.target.value,
                        }))
                      }
                      className="mt-1.5 h-9 w-full rounded-[7px] border border-border-default bg-bg-tertiary p-1"
                      aria-label="Channel color"
                    />
                  </label>
                </div>

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
                    className="mt-1.5 min-h-[70px] w-full resize-none rounded-[7px] border border-border-default bg-bg-tertiary px-3 py-2 text-[12.5px] leading-relaxed text-text-primary outline-none transition-colors placeholder:text-text-dimmed focus:border-border-strong focus:bg-bg-hover"
                    placeholder="Short channel description"
                    maxLength={500}
                  />
                </label>

                {formError ? (
                  <div className="mt-3 text-[12px] text-danger">{formError}</div>
                ) : null}

                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={formStatus === "saving"}
                    className="rounded-[7px] bg-btn-primary-bg px-4 py-2 text-[12.5px] font-semibold text-btn-primary-text transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {formStatus === "saving" ? "Creating..." : "Create channel"}
                  </button>
                </div>
              </form>

              <div className="flex min-h-0 flex-col rounded-[8px] border border-border-default bg-bg-secondary">
                <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-border-default px-4">
                  <div>
                    <div className="text-[13px] font-semibold text-text-primary">
                      Channel requests
                    </div>
                    <div className="text-[11.5px] text-text-dimmed">
                      {requestsStatus === "ready"
                        ? `${requests.length} pending`
                        : "Loading requests"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={loadRequests}
                    className="rounded-[6px] border border-border-default px-2.5 py-1.5 text-[11.5px] text-text-secondary transition-colors hover:border-border-strong hover:bg-bg-hover hover:text-text-primary"
                  >
                    Refresh
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                  {requestsError ? (
                    <div className="mb-3 text-[12px] text-danger">{requestsError}</div>
                  ) : null}

                  {requestsStatus === "loading" && requests.length === 0 ? (
                    <div className="px-2 py-6 text-[12.5px] text-text-muted">
                      Loading requests...
                    </div>
                  ) : null}

                  {requestsStatus === "ready" && requests.length === 0 ? (
                    <div className="px-2 py-6 text-[12.5px] text-text-muted">
                      No pending requests.
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2">
                    {requests.map((request) => {
                      const isBusy = busyRequestId === request.id;

                      return (
                        <article
                          key={request.id}
                          className="rounded-[8px] border border-border-subtle bg-bg-tertiary px-3 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-[13px] font-semibold text-text-primary">
                                {request.name}
                              </div>
                              <div className="mt-1 text-[11.5px] text-text-dimmed">
                                Requested by {request.requester} - {formatDate(request.requestedAt)}
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-relaxed text-text-muted">
                                {request.description}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  void rejectRequest(request);
                                }}
                                className="rounded-[6px] border border-border-default px-3 py-1.5 text-[11.5px] font-medium text-text-secondary transition-colors hover:border-border-strong hover:bg-bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  openRequestEditor(request);
                                }}
                                className="rounded-[6px] bg-btn-primary-bg px-3 py-1.5 text-[11.5px] font-semibold text-btn-primary-text transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {channelToDelete ? (
        <ConfirmModal
          title="Delete this channel?"
          description={
            <>
              This will delete{" "}
              <span className="font-medium text-white">{channelToDelete.name}</span>{" "}
              and remove its memberships.
            </>
          }
          confirmLabel="Delete"
          tone="danger"
          onCancel={() => setChannelToDelete(null)}
          onConfirm={confirmDeleteChannel}
        />
      ) : null}

      {createdChannel ? (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-[4px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCreatedChannel(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setCreatedChannel(null);
          }}
          tabIndex={-1}
          ref={(element) => element?.focus()}
        >
          <div className="w-[380px] rounded-[14px] border border-white/[0.12] bg-[#0f0f0e] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="mb-2 text-[16px] font-semibold text-white">
              Channel created
            </div>
            <div className="mb-5 text-[12.5px] leading-relaxed text-[#888888]">
              <span className="font-medium text-white">{createdChannel.name}</span>{" "}
              has been added to the channel list.
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCreatedChannel(null)}
                className="rounded-[6px] bg-text-primary px-4 py-[7px] text-[12.5px] font-medium text-bg-primary transition-opacity hover:opacity-90"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {requestToEdit ? (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-[4px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setRequestToEdit(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setRequestToEdit(null);
          }}
        >
          <form
            onSubmit={submitRequestEditor}
            className="w-[440px] rounded-[14px] border border-white/[0.12] bg-[#0f0f0e] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
          >
            <div className="text-[16px] font-semibold text-white">
              Edit request
            </div>
            <div className="mt-1 text-[12.5px] leading-relaxed text-[#888888]">
              Review the request, adjust the details, then add it as an interest channel.
            </div>

            <label className="mt-5 block text-[12px] font-medium text-text-secondary">
              Name
              <input
                type="text"
                value={requestForm.name}
                onChange={(event) =>
                  setRequestForm((currentForm) => ({
                    ...currentForm,
                    name: event.target.value,
                  }))
                }
                className="mt-1.5 h-9 w-full rounded-[7px] border border-border-default bg-bg-tertiary px-3 text-[12.5px] text-text-primary outline-none transition-colors placeholder:text-text-dimmed focus:border-border-strong focus:bg-bg-hover"
                maxLength={50}
                required
              />
            </label>

            <label className="mt-3 block text-[12px] font-medium text-text-secondary">
              Description
              <textarea
                value={requestForm.description}
                onChange={(event) =>
                  setRequestForm((currentForm) => ({
                    ...currentForm,
                    description: event.target.value,
                  }))
                }
                className="mt-1.5 min-h-[118px] w-full resize-none rounded-[7px] border border-border-default bg-bg-tertiary px-3 py-2 text-[12.5px] leading-relaxed text-text-primary outline-none transition-colors placeholder:text-text-dimmed focus:border-border-strong focus:bg-bg-hover"
                maxLength={500}
                required
              />
            </label>

            <label className="mt-3 block text-[12px] font-medium text-text-secondary">
              Color
              <div className="mt-1.5 flex gap-2">
                <input
                  type="color"
                  value={requestForm.color}
                  onChange={(event) =>
                    setRequestForm((currentForm) => ({
                      ...currentForm,
                      color: event.target.value,
                    }))
                  }
                  className="h-9 w-12 rounded-[7px] border border-border-default bg-bg-tertiary p-1"
                  aria-label="Channel color"
                />
                <input
                  type="text"
                  value={requestForm.color}
                  onChange={(event) =>
                    setRequestForm((currentForm) => ({
                      ...currentForm,
                      color: event.target.value,
                    }))
                  }
                  className="h-9 min-w-0 flex-1 rounded-[7px] border border-border-default bg-bg-tertiary px-3 text-[12.5px] text-text-primary outline-none transition-colors placeholder:text-text-dimmed focus:border-border-strong focus:bg-bg-hover"
                  pattern="#[0-9a-fA-F]{6}"
                  required
                />
              </div>
            </label>

            {requestEditError ? (
              <div className="mt-3 text-[12px] text-danger">{requestEditError}</div>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRequestToEdit(null)}
                className="rounded-[6px] border border-white/10 bg-[#1a1a19] px-4 py-[7px] text-[12.5px] text-[#c9c6c1] transition-colors hover:bg-[#222220] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyRequestId === requestToEdit.id}
                className="rounded-[6px] bg-text-primary px-4 py-[7px] text-[12.5px] font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busyRequestId === requestToEdit.id ? "Adding..." : "Add interest"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getEditableRequestDescription(description: string): string {
  return description.replace(/^New request:\n/gm, "").trim();
}
