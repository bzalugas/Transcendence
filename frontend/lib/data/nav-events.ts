export const NAV_BADGES_UPDATED_EVENT = "42connect:nav-badges-updated";

// Announces that sidebar badge counts should be reloaded from the API.
export function notifyNavBadgesUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NAV_BADGES_UPDATED_EVENT));
}

// Registers a browser listener for sidebar badge count refreshes.
export function listenForNavBadgesUpdated(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(NAV_BADGES_UPDATED_EVENT, listener);
  return () => window.removeEventListener(NAV_BADGES_UPDATED_EVENT, listener);
}
