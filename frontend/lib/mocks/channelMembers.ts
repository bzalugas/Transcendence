import type { ChannelMember } from "@/lib/types";

export const channelMembers: Record<string, ChannelMember[]> = {
  photography: [
    {
      initials: "sv",
      username: "svidal",
      level: 11,
      status: "online",
      isFriend: true,
    },
    {
      initials: "tm",
      avatarUrl:
        "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=150&h=150&fit=crop",
      username: "tmercier",
      level: 14,
      status: "online",
      isFriend: true,
    },
    {
      initials: "cl",
      username: "claurent",
      level: 12,
      status: "online",
      isFriend: true,
    },
    {
      initials: "pd",
      avatarUrl:
        "https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=150&h=150&fit=crop",
      username: "pdupont",
      level: 9,
      status: "offline",
      isFriend: true,
    },
    {
      initials: "jm",
      username: "jmoreau",
      level: 6,
      status: "offline",
      isFriend: false,
    },
    {
      initials: "nf",
      username: "nfaure",
      level: 9,
      status: "offline",
      isFriend: false,
    },
    {
      initials: "lm",
      username: "lmartin",
      level: 7,
      status: "away",
      isFriend: true,
    },
    {
      initials: "ab",
      avatarUrl:
        "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=150&h=150&fit=crop",
      username: "abestaev",
      level: 12,
      status: "online",
      isFriend: false,
      isSelf: true,
    },
  ],
  cycling: [
    { initials: "ab", username: "abestaev", level: 12, status: "online", isFriend: false, isSelf: true },
    { initials: "lm", username: "lmartin", level: 7, status: "away", isFriend: true },
    { initials: "sv", username: "svidal", level: 11, status: "online", isFriend: true },
  ],
  gaming: [
    { initials: "ab", username: "abestaev", level: 12, status: "online", isFriend: false, isSelf: true },
    { initials: "nf", username: "nfaure", level: 9, status: "offline", isFriend: false },
    { initials: "tm", username: "tmercier", level: 14, status: "online", isFriend: true },
  ],
  chess: [
    { initials: "ab", username: "abestaev", level: 12, status: "online", isFriend: false, isSelf: true },
    { initials: "cl", username: "claurent", level: 12, status: "online", isFriend: true },
  ],
  music: [
    { initials: "ab", username: "abestaev", level: 12, status: "online", isFriend: false, isSelf: true },
    { initials: "ar", username: "aroussea", level: 7, status: "offline", isFriend: false },
  ],
  cyber: [
    { initials: "ab", username: "abestaev", level: 12, status: "online", isFriend: false, isSelf: true },
    { initials: "sv", username: "svidal", level: 11, status: "online", isFriend: true },
  ],
  ai: [
    { initials: "ab", username: "abestaev", level: 12, status: "online", isFriend: false, isSelf: true },
    { initials: "pd", username: "pdupont", level: 9, status: "offline", isFriend: true },
  ],
};
