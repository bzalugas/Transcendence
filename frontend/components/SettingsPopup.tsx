"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/ThemeContext";
import { authClient } from "@/lib/auth-client";
import { useCurrentUser } from "@/lib/data/auth";
import {
  getBlockedUsers,
  unblockUser,
  type BlockedUser,
} from "@/lib/data/blocks";
import { fileUrl } from "@/lib/data/files";
import ConfirmModal from "@/components/ConfirmModal";

export default function SettingsPopup({
  open,
  onClose,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const { theme, setTheme } = useTheme();
  const { user: currentUser } = useCurrentUser();
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [confirmUnblockUser, setConfirmUnblockUser] = useState<BlockedUser | null>(null);
  const [unblockingName, setUnblockingName] = useState<string | null>(null);

  // Deletes the better-auth session before returning the user to the login page.
  async function handleLogout() {
    onClose();
    await authClient.signOut();
    window.location.href = "/login";
  }

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        left: rect.left,
        top: rect.top - 10,
      });
    }
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (showBlockedModal || confirmUnblockUser) return;

      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open, onClose, anchorRef, confirmUnblockUser, showBlockedModal]);

  useEffect(() => {
    if (!open) return;

    let active = true;
    queueMicrotask(() => {
      if (active) setBlockedLoading(true);
    });

    getBlockedUsers()
      .then((users) => {
        if (active) setBlockedUsers(users);
      })
      .catch(() => {
        if (active) setBlockedUsers([]);
      })
      .finally(() => {
        if (active) setBlockedLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  async function handleConfirmedUnblock() {
    if (!confirmUnblockUser || unblockingName) return;

    const name = confirmUnblockUser.name;
    setUnblockingName(name);
    try {
      await unblockUser(name);
      setBlockedUsers((current) => current.filter((user) => user.name !== name));
      setConfirmUnblockUser(null);
    } finally {
      setUnblockingName(null);
    }
  }

  if (!open) return null;

  return (
    <>
      <div
        ref={popupRef}
        className="fixed z-[1000] w-[260px] overflow-hidden rounded-[10px] border border-border-strong bg-bg-secondary shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
        style={{ left: pos.left, top: pos.top, transform: "translateY(-100%)" }}
      >
        <div className="px-3.5 pb-2.5 pt-3.5 text-[13px] font-semibold">Settings</div>
        <Sep />

        {/* Theme */}
        <Section label="Theme">
          <Row active={theme === "dark"} onClick={() => setTheme("dark")}>Dark</Row>
          <Row active={theme === "light"} onClick={() => setTheme("light")}>Light</Row>
        </Section>
        <Sep />

        {/* Blocked */}
        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between gap-3 px-2 pb-1.5 pt-1">
            <div className="text-[10.5px] uppercase tracking-wider text-text-muted">
              Blocked users
            </div>
            <button
              type="button"
              onClick={() => setShowBlockedModal(true)}
              className="rounded-[5px] px-2 py-1 text-[11.5px] text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              View
            </button>
          </div>
          <div className="px-2 pb-1 text-[11.5px] text-text-dimmed">
            {blockedLoading
              ? "Loading..."
              : `${blockedUsers.length} blocked ${blockedUsers.length === 1 ? "user" : "users"}`}
          </div>
        </div>
        <Sep />

        {/* Privacy */}
        <Section label="Privacy">
          <Link
            href="/settings/privacy"
            onClick={onClose}
            className="flex w-full items-center rounded-[5px] px-2 py-[7px] text-[12.5px] text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            Privacy & data
          </Link>
          <Link
            href="/privacy"
            onClick={onClose}
            className="flex w-full items-center rounded-[5px] px-2 py-[7px] text-[12.5px] text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            Privacy & Terms
          </Link>
        </Section>
        <Sep />

        {currentUser?.role === "ADMIN" && (
          <>
            {/* Admin */}
            <Section label="Admin">
              <Link
                href="/admin"
                onClick={onClose}
                className="flex w-full items-center justify-between rounded-[5px] px-2 py-[7px] text-[12.5px] text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
              >
                <span>Admin panel</span>
                <span className="text-[11.5px] text-text-muted">Open</span>
              </Link>
            </Section>
            <Sep />
          </>
        )}

        {/* Logout */}
        <div className="px-2 py-1.5 pb-2.5">
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-[5px] px-2 py-[7px] text-[12.5px] text-danger transition-colors hover:bg-danger/10"
          >
            Log out
          </button>
        </div>
      </div>

      {showBlockedModal && (
        <BlockedUsersModal
          users={blockedUsers}
          loading={blockedLoading}
          unblockingName={unblockingName}
          onClose={() => setShowBlockedModal(false)}
          onUnblock={(user) => setConfirmUnblockUser(user)}
        />
      )}

      {confirmUnblockUser && (
        <ConfirmModal
          title="Unblock user?"
          description={
            <>
              <span className="font-medium text-white">{confirmUnblockUser.name}</span>{" "}
              will be able to see your profile and activity again.
            </>
          }
          confirmLabel={unblockingName ? "Unblocking..." : "Unblock"}
          tone="danger"
          onCancel={() => {
            if (!unblockingName) setConfirmUnblockUser(null);
          }}
          onConfirm={() => {
            void handleConfirmedUnblock();
          }}
        />
      )}
    </>
  );
}

function BlockedUsersModal({
  users,
  loading,
  unblockingName,
  onClose,
  onUnblock,
}: {
  users: BlockedUser[];
  loading: boolean;
  unblockingName: string | null;
  onClose: () => void;
  onUnblock: (user: BlockedUser) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[1900] flex items-center justify-center bg-black/60 backdrop-blur-[4px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      tabIndex={-1}
      ref={(element) => element?.focus()}
    >
      <div className="flex max-h-[min(520px,calc(100vh-40px))] w-[420px] max-w-[calc(100vw-32px)] flex-col rounded-[14px] border border-white/[0.12] bg-[#0f0f0e] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div>
            <div className="text-[16px] font-semibold text-white">Blocked users</div>
            <div className="mt-0.5 text-[12px] text-[#888888]">
              Manage users you have blocked.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] px-2 py-1 text-[16px] leading-none text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
            aria-label="Close blocked users"
          >
            &times;
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {loading && (
            <div className="px-2 py-8 text-center text-[12.5px] text-text-dimmed">
              Loading...
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="px-2 py-8 text-center text-[12.5px] text-text-dimmed">
              No blocked users
            </div>
          )}

          {!loading && users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-[8px] px-2 py-2 transition-colors hover:bg-bg-hover"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-hover text-[12px] font-medium text-text-primary">
                {user.avatarUrl ? (
                  <img
                    src={fileUrl(user.avatarUrl)}
                    alt={user.name}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  user.initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-text-primary">
                  {user.name}
                </div>
                <div className="text-[11.5px] text-text-dimmed">
                  Level {user.level}
                </div>
              </div>
              <button
                type="button"
                disabled={unblockingName === user.name}
                onClick={() => onUnblock(user)}
                className="shrink-0 rounded-[6px] border border-white/10 px-3 py-[6px] text-[12px] text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary disabled:cursor-default disabled:opacity-60"
              >
                {unblockingName === user.name ? "Unblocking..." : "Unblock"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Sep() {
  return <div className="h-px bg-border-default" />;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-2 py-1.5">
      <div className="px-2 pb-1.5 pt-1 text-[10.5px] uppercase tracking-wider text-text-muted">
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[5px] px-2 py-[7px] text-[12.5px] text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
    >
      <span>{children}</span>
      {active && <span className="text-[11.5px] text-text-muted">{"\u25CF"}</span>}
    </button>
  );
}
