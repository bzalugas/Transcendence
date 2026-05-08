"use client";

import { useEffect, useState } from "react";
import {
  getLatestExportPreview,
  latestExportDownloadUrl,
  requestDataDeletion,
  requestDataExport,
  type DataOperationResult,
  type ExportPreview,
} from "@/lib/data/privacy";

type OperationState = "idle" | "loading" | "success" | "error";

export default function PrivacySettingsPage() {
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null);
  const [exportState, setExportState] = useState<OperationState>("idle");
  const [deleteState, setDeleteState] = useState<OperationState>("idle");
  const [lastResult, setLastResult] = useState<DataOperationResult | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    let active = true;

    getLatestExportPreview()
      .then((preview) => {
        if (active) setExportPreview(preview);
      })
      .catch(() => {
        if (active) setExportPreview(null);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleExportRequest() {
    setExportState("loading");
    setLastResult(null);

    try {
      const result = await requestDataExport();
      setLastResult(result);
      setExportState("success");
    } catch {
      setExportState("error");
    }
  }

  async function handleDeletionRequest() {
    if (deleteConfirmText !== "DELETE") return;

    setDeleteState("loading");
    setLastResult(null);

    try {
      const result = await requestDataDeletion();
      setLastResult(result);
      setDeleteState("success");
      setDeleteConfirmOpen(false);
      setDeleteConfirmText("");
    } catch {
      setDeleteState("error");
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-bg-tertiary">
      <div className="border-b border-border-default bg-bg-secondary px-8 pb-5 pt-6">
        <h1 className="text-[19px] font-medium">Privacy & Data</h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Control your personal data, download a copy, or ask us to delete it.
        </p>
      </div>

      <div className="mx-auto w-full max-w-[780px] space-y-5 px-8 py-7">
        {lastResult && (
          <div className="rounded-lg border border-border-subtle bg-bg-secondary px-4 py-3">
            <div className="text-[13px] font-medium text-text-primary">
              Request queued
            </div>
            <div className="mt-1 text-[12.5px] text-text-muted">
              {lastResult.message}
            </div>
          </div>
        )}

        <Section
          title="Data export"
          description="Get a readable archive of your account data, including JSON records, CSV summaries, and uploaded files where available."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoTile label="Format" value="JSON archive + CSV summaries" />
            <InfoTile label="Delivery" value="Confirmation email" />
          </div>

          {exportPreview && (
            <div className="mt-4 rounded-lg border border-border-subtle bg-bg-tertiary p-3">
              <div className="mb-2 text-[12.5px] font-medium text-text-primary">
                Latest export preview
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {exportPreview.sections.map((section) => (
                  <div
                    key={section.label}
                    className="flex items-center justify-between rounded-md bg-bg-secondary px-3 py-2 text-[12.5px]"
                  >
                    <span className="text-text-muted">{section.label}</span>
                    <span className="font-medium text-text-primary">{section.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { void handleExportRequest(); }}
              disabled={exportState === "loading"}
              className="rounded-[7px] bg-text-primary px-3.5 py-2 text-[12.5px] font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {exportState === "loading" ? "Requesting..." : "Request my data"}
            </button>
            <a
              href={latestExportDownloadUrl()}
              onClick={(event) => event.preventDefault()}
              className="rounded-[7px] border border-border-default px-3.5 py-2 text-[12.5px] font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              Download latest copy
            </a>
          </div>

          {exportState === "error" && (
            <p className="mt-3 text-[12.5px] text-danger">
              Could not request an export.
            </p>
          )}
        </Section>

        <Section
          title="Deletion request"
          description="Request removal of your account data. We will ask you to confirm by email before deletion starts."
          danger
        >
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
            <div className="text-[13px] font-medium text-danger">
              This is permanent
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-text-muted">
              Once confirmed, deletion will remove your profile data, sessions, social links, uploaded files, friendships, memberships, and other account-linked records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            className="mt-4 rounded-[7px] border border-danger/40 px-3.5 py-2 text-[12.5px] font-semibold text-danger transition-colors hover:bg-danger/10"
          >
            Delete my data
          </button>

          {deleteState === "error" && (
            <p className="mt-3 text-[12.5px] text-danger">
              Could not request deletion.
            </p>
          )}
        </Section>
      </div>

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
          <div className="w-full max-w-[420px] rounded-lg border border-border-strong bg-bg-secondary p-5 shadow-2xl">
            <h2 className="text-[16px] font-semibold text-text-primary">
              Confirm deletion request
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
              Type DELETE to continue. We will send a confirmation email before deleting your data.
            </p>
            <input
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
              className="mt-4 w-full rounded-[7px] border border-border-default bg-bg-hover px-3 py-2 text-[13px] text-text-primary outline-none focus:border-border-strong"
              placeholder="DELETE"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteConfirmText("");
                }}
                className="rounded-[7px] px-3.5 py-2 text-[12.5px] font-medium text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { void handleDeletionRequest(); }}
                disabled={deleteConfirmText !== "DELETE" || deleteState === "loading"}
                className="rounded-[7px] bg-danger px-3.5 py-2 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {deleteState === "loading" ? "Requesting..." : "Request deletion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  description,
  danger,
  children,
}: {
  title: string;
  description: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-secondary p-5">
      <div className="mb-4">
        <h2 className={`text-[15px] font-semibold ${danger ? "text-danger" : "text-text-primary"}`}>
          {title}
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-text-muted">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-tertiary px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-text-dimmed">
        {label}
      </div>
      <div className="mt-1 text-[13px] font-medium text-text-primary">
        {value}
      </div>
    </div>
  );
}
