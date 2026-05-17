"use client";

import { useEffect, useState, type ReactNode } from "react";

export function useResponsiveRightPanel() {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const syncViewport = () => setIsDesktop(query.matches);

    syncViewport();
    query.addEventListener("change", syncViewport);
    return () => query.removeEventListener("change", syncViewport);
  }, []);

  function togglePanel() {
    if (isDesktop) {
      setDesktopOpen((open) => !open);
      return;
    }

    setOverlayOpen((open) => !open);
  }

  return {
    desktopOpen,
    overlayOpen,
    panelOpen: isDesktop ? desktopOpen : overlayOpen,
    togglePanel,
    closeOverlay: () => setOverlayOpen(false),
  };
}

export default function ResponsiveRightPanel({
  desktopOpen,
  overlayOpen,
  onCloseOverlay,
  widthClassName = "w-[260px]",
  children,
}: {
  desktopOpen: boolean;
  overlayOpen: boolean;
  onCloseOverlay: () => void;
  widthClassName?: string;
  children: ReactNode;
}) {
  return (
    <>
      {desktopOpen && (
        <div className={`hidden ${widthClassName} shrink-0 xl:flex`}>
          {children}
        </div>
      )}

      {overlayOpen && (
        <div
          className="fixed inset-0 z-[900] bg-black/20 xl:hidden"
          onClick={onCloseOverlay}
        >
          <div
            className={`absolute bottom-0 right-0 top-0 ${widthClassName} max-w-[calc(100vw-48px)] shadow-[-18px_0_40px_rgba(0,0,0,0.35)]`}
            onClick={(event) => event.stopPropagation()}
          >
            {children}
          </div>
        </div>
      )}
    </>
  );
}
