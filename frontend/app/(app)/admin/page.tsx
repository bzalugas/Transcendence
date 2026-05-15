"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import ConfirmModal from "@/components/ConfirmModal";
import {
  banAdminUser,
  deleteAdminContent,
  getAdminUserPosts,
  getAdminUsers,
  unbanAdminUser,
  type AdminUser,
  type AdminUserPost,
} from "@/lib/data/admin";
import { useCurrentUser } from "@/lib/data/auth";

const adminSections = [
  { label: "Users", href: "/admin", active: true },
  { label: "Projects", href: "/admin/projects", active: false },
  { label: "Channels", href: "/admin/channels", active: false },
];

export default function AdminPage() {
  const { user, isPending } = useCurrentUser();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [usersStatus, setUsersStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<AdminUserPost[]>([]);
  const [userPostsStatus, setUserPostsStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [userPostsError, setUserPostsError] = useState<string | null>(null);
  const [moderationAction, setModerationAction] = useState<"ban" | "unban" | null>(null);
  const [contentToDelete, setContentToDelete] = useState<AdminUserPost | null>(null);

  const normalizedUserSearch = userSearchQuery.trim().toLowerCase();
  const filteredUsers = useMemo(() => {
    if (!normalizedUserSearch) return users;

    return users.filter((item) => {
      const searchableText = [
        item.username,
        item.email,
        item.login,
        item.name,
        item.firstName,
        item.lastName,
        item.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedUserSearch);
    });
  }, [normalizedUserSearch, users]);
  const selectedUser = useMemo(
    () => filteredUsers.find((item) => item.id === selectedUserId) ?? filteredUsers[0] ?? null,
    [filteredUsers, selectedUserId],
  );

  async function loadUsers() {
    setUsersStatus("loading");
    setUsersError(null);

    try {
      const loadedUsers = await getAdminUsers();
      setUsers(loadedUsers);
      setSelectedUserId((currentId) => {
        if (currentId && loadedUsers.some((item) => item.id === currentId)) {
          return currentId;
        }

        return loadedUsers[0]?.id ?? null;
      });
      setUsersStatus("ready");
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : "Unable to load users");
      setUsersStatus("error");
    }
  }

  async function loadSelectedUserPosts(userId: string) {
    setUserPostsStatus("loading");
    setUserPostsError(null);

    try {
      setUserPosts(await getAdminUserPosts(userId));
      setUserPostsStatus("ready");
    } catch (error) {
      setUserPostsError(
        error instanceof Error ? error.message : "Unable to load user posts",
      );
      setUserPostsStatus("error");
    }
  }

  async function confirmModerationAction() {
    if (!selectedUser) return;

    if (moderationAction === "ban") {
      await banAdminUser(
        selectedUser.id,
        `Ban from admin review of ${selectedUser.username}'s posts`,
      );
    }

    if (moderationAction === "unban") {
      await unbanAdminUser(selectedUser.id);
    }

    setModerationAction(null);
    await loadUsers();
  }

  async function confirmDeleteContent() {
    if (!contentToDelete || !selectedUser) return;

    await deleteAdminContent(contentToDelete);
    setContentToDelete(null);
    await Promise.all([
      loadSelectedUserPosts(selectedUser.id),
      loadUsers(),
    ]);
  }

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    queueMicrotask(() => {
      void loadUsers();
    });
  }, [user?.role]);

  useEffect(() => {
    if (!selectedUser?.id) {
      queueMicrotask(() => {
        setUserPosts([]);
        setUserPostsStatus("ready");
      });
      return;
    }

    queueMicrotask(() => {
      void loadSelectedUserPosts(selectedUser.id);
    });
  }, [selectedUser?.id]);

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
            Please use a desktop screen to manage users, channels, and requests.
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
                Users
              </div>
            </div>

            <Link
              href="/"
              className="rounded-[7px] bg-accent-blue px-3.5 py-2 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-85"
            >
              Back to app
            </Link>
          </header>

          <section className="flex min-h-0 flex-1">
            <aside className="flex w-[320px] shrink-0 flex-col border-r border-border-default bg-bg-secondary">
              <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-border-default px-4">
                <div>
                  <div className="text-[13px] font-semibold text-text-primary">
                    All users
                  </div>
                  <div className="text-[11.5px] text-text-dimmed">
                    {usersStatus === "ready"
                      ? normalizedUserSearch
                        ? `${filteredUsers.length} of ${users.length} accounts`
                        : `${users.length} accounts`
                      : "Loading accounts"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={loadUsers}
                  className="rounded-[6px] border border-border-default px-2.5 py-1.5 text-[11.5px] text-text-secondary transition-colors hover:border-border-strong hover:bg-bg-hover hover:text-text-primary"
                >
                  Refresh
                </button>
              </div>

              <div className="border-b border-border-default px-4 py-3">
                <label className="sr-only" htmlFor="admin-user-search">
                  Search users
                </label>
                <input
                  id="admin-user-search"
                  type="search"
                  value={userSearchQuery}
                  onChange={(event) => setUserSearchQuery(event.target.value)}
                  placeholder="Search users..."
                  className="h-9 w-full rounded-[7px] border border-border-default bg-bg-tertiary px-3 text-[12.5px] text-text-primary outline-none transition-colors placeholder:text-text-dimmed focus:border-border-strong focus:bg-bg-hover"
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                {usersStatus === "loading" && users.length === 0 ? (
                  <div className="px-3 py-6 text-[12.5px] text-text-muted">
                    Loading users...
                  </div>
                ) : null}

                {usersStatus === "error" ? (
                  <div className="px-3 py-6">
                    <div className="text-[12.5px] font-medium text-danger">
                      Users could not be loaded.
                    </div>
                    <div className="mt-1 text-[12px] leading-relaxed text-text-muted">
                      {usersError}
                    </div>
                  </div>
                ) : null}

                {usersStatus === "ready" && users.length === 0 ? (
                  <div className="px-3 py-6 text-[12.5px] text-text-muted">
                    No users found.
                  </div>
                ) : null}

                {usersStatus === "ready" &&
                users.length > 0 &&
                filteredUsers.length === 0 ? (
                  <div className="px-3 py-6 text-[12.5px] text-text-muted">
                    No users match this search.
                  </div>
                ) : null}

                <div className="flex flex-col gap-1">
                  {filteredUsers.map((item) => {
                    const isSelected = selectedUser?.id === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedUserId(item.id)}
                        className={`flex w-full items-center gap-3 rounded-[7px] px-2.5 py-2.5 text-left transition-colors ${
                          isSelected
                            ? "bg-bg-hover text-text-primary"
                            : "text-text-tertiary hover:bg-bg-hover hover:text-text-primary"
                        }`}
                      >
                        <Avatar
                          initials={item.initials}
                          avatarUrl={item.avatarUrl}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium">
                            {item.username}
                          </div>
                          <div className="truncate text-[11.5px] text-text-dimmed">
                            {item.email}
                          </div>
                        </div>
                        <UserStateBadge user={item} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div className="min-w-0 flex-1 overflow-y-auto px-7 py-6">
              {selectedUser ? (
                <UserProfilePanel
                  user={selectedUser}
                  posts={userPosts}
                  postsStatus={userPostsStatus}
                  postsError={userPostsError}
                  canModerate={selectedUser.id !== user.id && selectedUser.role !== "ADMIN"}
                  onRefreshPosts={() => loadSelectedUserPosts(selectedUser.id)}
                  onOpenModeration={(action) => setModerationAction(action)}
                  onDeleteContent={setContentToDelete}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[13px] text-text-muted">
                  Select a user to open their profile.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
      {moderationAction && selectedUser ? (
        <ConfirmModal
          title={moderationAction === "ban" ? "Ban this user?" : "Unban this user?"}
          description={
            moderationAction === "ban" ? (
              <>
                This will block{" "}
                <span className="font-medium text-white">{selectedUser.username}</span>{" "}
                from using the app.
              </>
            ) : (
              <>
                This will restore app access for{" "}
                <span className="font-medium text-white">{selectedUser.username}</span>.
              </>
            )
          }
          confirmLabel={moderationAction === "ban" ? "Ban" : "Unban"}
          tone={moderationAction === "ban" ? "danger" : "primary"}
          onCancel={() => setModerationAction(null)}
          onConfirm={confirmModerationAction}
        />
      ) : null}
      {contentToDelete ? (
        <ConfirmModal
          title={`Delete this ${contentToDelete.kind}?`}
          description={
            <>
              This will remove the selected {contentToDelete.kind}. Root posts
              will also remove their comments.
            </>
          }
          confirmLabel="Delete"
          tone="danger"
          onCancel={() => setContentToDelete(null)}
          onConfirm={confirmDeleteContent}
        />
      ) : null}
    </>
  );
}

function UserProfilePanel({
  user,
  posts,
  postsStatus,
  postsError,
  canModerate,
  onRefreshPosts,
  onOpenModeration,
  onDeleteContent,
}: {
  user: AdminUser;
  posts: AdminUserPost[];
  postsStatus: "loading" | "ready" | "error";
  postsError: string | null;
  canModerate: boolean;
  onRefreshPosts: () => void;
  onOpenModeration: (action: "ban" | "unban") => void;
  onDeleteContent: (post: AdminUserPost) => void;
}) {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return (
    <div className="mx-auto max-w-[860px]">
      <div className="border-b border-border-default pb-5">
        <div className="flex items-start gap-4">
          <Avatar initials={user.initials} avatarUrl={user.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[22px] font-semibold text-text-primary">
                {user.username}
              </h1>
              <UserStateBadge user={user} />
            </div>
            <div className="mt-1 text-[13px] text-text-muted">
              {displayName || user.email}
            </div>
          </div>
        </div>

        {user.bio ? (
          <p className="mt-5 max-w-[680px] text-[13.5px] leading-relaxed text-text-secondary">
            {user.bio}
          </p>
        ) : (
          <p className="mt-5 text-[13px] text-text-dimmed">No bio yet.</p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-5">
        <section>
          <h2 className="text-[13px] font-semibold text-text-primary">
            Account
          </h2>
          <div className="mt-3 overflow-hidden rounded-[8px] border border-border-default bg-bg-secondary">
            <ProfileRow label="Email" value={user.email} />
            <ProfileRow label="Login" value={user.login ?? "None"} />
            <ProfileRow label="Created" value={formatDate(user.createdAt)} />
            <ProfileRow label="Status" value={getModerationStatus(user)} />
          </div>
        </section>

        <section>
          <h2 className="text-[13px] font-semibold text-text-primary">
            Profile
          </h2>
          <div className="mt-3 overflow-hidden rounded-[8px] border border-border-default bg-bg-secondary">
            <ProfileRow label="Interests" value={String(user.interestCount)} />
            <ProfileRow label="Friends" value={String(user.friendCount)} />
            <ProfileRow label="Social links" value={String(user.socials?.length ?? 0)} />
          </div>
        </section>
      </div>

      <UserPostsSection
        posts={posts}
        postsStatus={postsStatus}
        postsError={postsError}
        canModerate={canModerate}
        isBanned={Boolean(user.bannedAt)}
        onRefresh={onRefreshPosts}
        onOpenModeration={onOpenModeration}
        onDeleteContent={onDeleteContent}
      />
    </div>
  );
}

function UserPostsSection({
  posts,
  postsStatus,
  postsError,
  canModerate,
  isBanned,
  onRefresh,
  onOpenModeration,
  onDeleteContent,
}: {
  posts: AdminUserPost[];
  postsStatus: "loading" | "ready" | "error";
  postsError: string | null;
  canModerate: boolean;
  isBanned: boolean;
  onRefresh: () => void;
  onOpenModeration: (action: "ban" | "unban") => void;
  onDeleteContent: (post: AdminUserPost) => void;
}) {
  const moderationButtonClass = isBanned
    ? "border border-border-default px-3 py-1.5 text-text-secondary hover:border-border-strong hover:bg-bg-hover hover:text-text-primary"
    : "bg-danger px-3 py-1.5 text-white hover:opacity-90";

  return (
    <section className="mt-6 border-t border-border-default pt-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[13px] font-semibold text-text-primary">
            User posts
          </h2>
          <div className="mt-1 text-[12px] text-text-muted">
            {postsStatus === "ready"
              ? `${posts.length} posts and comments`
              : "Loading posts and comments"}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-[6px] border border-border-default px-3 py-1.5 text-[11.5px] font-medium text-text-secondary transition-colors hover:border-border-strong hover:bg-bg-hover hover:text-text-primary"
          >
            Refresh
          </button>
          <button
            type="button"
            disabled={!canModerate}
            onClick={() => onOpenModeration(isBanned ? "unban" : "ban")}
            className={`rounded-[6px] text-[11.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${moderationButtonClass}`}
          >
            {isBanned ? "Unban" : "Ban"}
          </button>
        </div>
      </div>

      {postsStatus === "error" ? (
        <div className="mt-4 rounded-[8px] border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger">
          {postsError ?? "Posts could not be loaded."}
        </div>
      ) : null}

      {postsStatus === "loading" && posts.length === 0 ? (
        <div className="mt-4 rounded-[8px] border border-border-default bg-bg-secondary px-4 py-6 text-center text-[13px] text-text-muted">
          Loading posts...
        </div>
      ) : null}

      {postsStatus === "ready" && posts.length === 0 ? (
        <div className="mt-4 rounded-[8px] border border-border-default bg-bg-secondary px-4 py-6 text-center text-[13px] text-text-muted">
          No channel posts or persisted project discussions found.
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3">
        {posts.map((post) => (
          <article
            key={`${post.kind}-${post.id}`}
            className="rounded-[8px] border border-border-default bg-bg-secondary p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border-default px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-text-muted">
                {post.kind}
              </span>
              <span className="text-[12.5px] font-medium text-text-primary">
                {post.sourceLabel}
              </span>
              <span className="text-[11.5px] text-text-dimmed">
                {formatDateTime(post.createdAt)}
              </span>
            </div>

            {post.parentPreview ? (
              <div className="mt-3 rounded-[6px] border border-border-subtle bg-bg-tertiary px-3 py-2 text-[12px] text-text-muted">
                Reply to: {post.parentPreview}
              </div>
            ) : null}

            <p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-relaxed text-text-secondary">
              {post.body}
            </p>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex gap-3 text-[11.5px] text-text-dimmed">
                <span>{post.replyCount} replies</span>
                <span>{post.reactionCount} reactions</span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteContent(post)}
                className="rounded-[6px] border border-danger/35 px-3 py-1.5 text-[11.5px] font-semibold text-danger transition-colors hover:bg-danger hover:text-white"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-4 border-b border-border-subtle px-3.5 py-2.5 last:border-b-0">
      <div className="shrink-0 text-[12px] text-text-dimmed">{label}</div>
      <div className="min-w-0 truncate text-right text-[12.5px] font-medium text-text-secondary">
        {value}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: NonNullable<AdminUser["role"]> }) {
  const styles = {
    ADMIN: "border-danger/35 bg-danger/10 text-danger",
    USER: "border-accent-blue/35 bg-accent-blue/10 text-accent-blue",
    GUEST: "border-border-strong bg-bg-tertiary text-text-muted",
  };

  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${styles[role]}`}
    >
      {role}
    </span>
  );
}

function UserStateBadge({ user }: { user: AdminUser }) {
  if (user.bannedAt) {
    return (
      <span className="shrink-0 rounded-full border border-danger/40 bg-danger/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-danger">
        Banned
      </span>
    );
  }

  return <RoleBadge role={user.role ?? "USER"} />;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getModerationStatus(user: AdminUser): string {
  if (user.bannedAt) return "Banned";
  return "Active";
}
