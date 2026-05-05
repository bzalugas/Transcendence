"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { authClient } from "@/lib/auth-client";

export default function SettingsPopup({
  open,
  onClose,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [lang, setLang] = useState<"en" | "fr">("en");
  const { theme, setTheme } = useTheme();
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

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
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-[1000] w-[260px] overflow-hidden rounded-[10px] border border-border-strong bg-bg-secondary shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
      style={{ left: pos.left, top: pos.top, transform: "translateY(-100%)" }}
    >
      <div className="px-3.5 pb-2.5 pt-3.5 text-[13px] font-semibold">Settings</div>
      <Sep />

      {/* Language */}
      <Section label="Language">
        <Row active={lang === "en"} onClick={() => setLang("en")}>English</Row>
        <Row active={lang === "fr"} onClick={() => setLang("fr")}>Francais</Row>
      </Section>
      <Sep />

      {/* Theme */}
      <Section label="Theme">
        <Row active={theme === "dark"} onClick={() => setTheme("dark")}>Dark</Row>
        <Row active={theme === "light"} onClick={() => setTheme("light")}>Light</Row>
      </Section>
      <Sep />

      {/* Blocked */}
      <Section label="Blocked users">
        <div className="px-2 py-1.5 text-center text-[11.5px] text-text-dimmed">
          No blocked users
        </div>
      </Section>
      <Sep />

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
