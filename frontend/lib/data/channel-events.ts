export const CHANNELS_UPDATED_EVENT = "42connect:channels-updated";

// Announces that the current user's channel memberships changed.
export function notifyChannelsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHANNELS_UPDATED_EVENT));
}

// Registers a browser listener for channel membership changes.
export function listenForChannelsUpdated(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(CHANNELS_UPDATED_EVENT, listener);
  return () => window.removeEventListener(CHANNELS_UPDATED_EVENT, listener);
}
