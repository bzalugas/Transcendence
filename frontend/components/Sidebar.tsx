"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo42 from "@/components/Logo42";
import Avatar from "@/components/Avatar";
import SettingsPopup from "@/components/SettingsPopup";
import {
  HomeIcon,
  ProjectsIcon,
  SuggestionsIcon,
  MessagesIcon,
  ProfileIcon,
  SettingsIcon,
} from "@/components/icons/NavIcons";
import { rooms } from "@/lib/mocks/rooms";
import { currentUser } from "@/lib/mocks/users";
import { navBadges } from "@/lib/mocks/nav";

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/projects", label: "Projects", icon: ProjectsIcon },
  { href: "/suggestions", label: "Suggestions", icon: SuggestionsIcon, badgeKey: "suggestions" as const },
  { href: "/messages", label: "Messages", icon: MessagesIcon, badgeKey: "messages" as const },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLButtonElement>(null);

  return (
    <aside className="flex w-[220px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border-default bg-bg-secondary px-4 py-6">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 px-2.5 pb-[22px] pt-1 text-base font-medium tracking-tight text-text-primary"
      >
        <Logo42 className="h-[22px] w-auto" />
        <span>Connect</span>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon, badgeKey }) => {
          const isActive = pathname === href;
          const badge = badgeKey ? navBadges[badgeKey] : undefined;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-[7px] px-2.5 py-[9px] text-[13.5px] transition-colors hover:bg-bg-hover hover:text-text-primary ${
                isActive
                  ? "font-medium text-text-primary [&_svg]:stroke-[2.5]"
                  : "text-text-tertiary"
              }`}
            >
              <Icon />
              <span>{label}</span>
              {badge && (
                <span className="ml-auto rounded-[10px] bg-text-primary px-1.5 py-px text-[10px] font-semibold text-bg-tertiary">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Separator */}
      <div className="my-2.5 h-px bg-border-default" />

      {/* Rooms */}
      <div className="mb-2 mt-1 px-2.5 text-[10.5px] font-medium uppercase tracking-wider text-text-muted">
        Channels
      </div>
      <nav className="flex flex-col gap-0.5">
        {rooms.map(({ slug, label, color }) => (
          <Link
            key={slug}
            href={`/rooms/${slug}`}
            className={`flex items-center gap-[9px] rounded-[7px] px-2.5 py-2 text-[13px] transition-colors hover:bg-bg-hover hover:text-text-primary ${
              pathname === `/rooms/${slug}`
                ? "text-text-primary"
                : "text-text-tertiary"
            }`}
          >
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: color }}
            />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="mt-auto border-t border-border-default pt-3.5">
        <div className="flex items-center gap-[9px] rounded-[7px] px-2.5 py-[9px] hover:bg-bg-hover">
          <Avatar initials={currentUser.initials} avatarUrl={currentUser.avatarUrl} size="md" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-text-primary">
              {currentUser.username}
            </div>
            <div className="text-[11.5px] text-text-muted">
              Level {currentUser.level}
            </div>
          </div>
          <button
            ref={settingsRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSettingsOpen(!settingsOpen);
            }}
            className="flex items-center rounded-[5px] p-1.5 text-text-dimmed transition-colors hover:bg-bg-hover hover:text-text-primary"
            title="Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      <SettingsPopup
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        anchorRef={settingsRef}
      />
    </aside>
  );
}
