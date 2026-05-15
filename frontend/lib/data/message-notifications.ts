import { notifyNavBadgesUpdated } from "@/lib/data/nav-events";

const unreadMessageCounts = new Map<string, number>();

export function getUnreadMessageCount(): number {
  return Array.from(unreadMessageCounts.values()).reduce(
    (total, count) => total + count,
    0,
  );
}

export function getUnreadMessageCounts(): Record<string, number> {
  return Object.fromEntries(unreadMessageCounts);
}

export function incrementUnreadMessageCount(chatId: string | number): void {
  const key = String(chatId);
  unreadMessageCounts.set(key, (unreadMessageCounts.get(key) ?? 0) + 1);
  notifyNavBadgesUpdated();
}

export function clearUnreadMessageCount(chatId: string | number): void {
  const key = String(chatId);
  if (!unreadMessageCounts.has(key)) return;

  unreadMessageCounts.delete(key);
  notifyNavBadgesUpdated();
}
