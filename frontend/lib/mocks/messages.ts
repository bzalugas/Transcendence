import type { ChatMessage, Conversation } from "@/lib/types";

export const friendConversations: Conversation[] = [
  {
    id: "fr-pdupont",
    type: "friend",
    initials: "pd",
    name: "pdupont",
    preview: "did you see the game yesterday?",
    time: "10:42",
    online: true,
    level: 9,
  },
  {
    id: "fr-svidal",
    type: "friend",
    initials: "sv",
    name: "svidal",
    preview: "Are you coming tonight?",
    time: "09:18",
    unread: 2,
    online: true,
    level: 11,
  },
  {
    id: "fr-lmartin",
    type: "friend",
    initials: "lm",
    name: "lmartin",
    preview: "Ok got it, see you tomorrow then",
    time: "yesterday",
    away: true,
    level: 7,
  },
  {
    id: "fr-arenard",
    type: "friend",
    initials: "ar",
    name: "arenard",
    preview: "GG on your level up!",
    time: "yesterday",
    online: true,
    level: 10,
  },
];

export const channelConversations: Conversation[] = [
  {
    id: "ch-photography",
    type: "channel",
    name: "Photography",
    preview: "tmercier: nice shot this morning",
    time: "11:05",
    unread: 5,
    icon: "camera",
    memberCount: 23,
  },
  {
    id: "ch-cycling",
    type: "channel",
    name: "Cycling",
    preview: "Ride Saturday 8am, who's in?",
    time: "08:30",
    icon: "clock",
    memberCount: 14,
  },
  {
    id: "ch-gaming",
    type: "channel",
    name: "Gaming",
    preview: "nfaure: who's playing tonight?",
    time: "yesterday",
    unread: 3,
    icon: "gamepad",
    memberCount: 41,
  },
  {
    id: "ch-chess",
    type: "channel",
    name: "Chess",
    preview: "Internal tournament on Friday!",
    time: "Mon",
    icon: "grid",
    memberCount: 19,
  },
  {
    id: "ch-music",
    type: "channel",
    name: "Music",
    preview: "aroussea: anyone play piano?",
    time: "Mon",
    icon: "music",
    memberCount: 27,
  },
  {
    id: "ch-cyber",
    type: "channel",
    name: "Cyber",
    preview: "New CTF this weekend!",
    time: "Mon",
    icon: "lock",
    memberCount: 33,
  },
  {
    id: "ch-ai",
    type: "channel",
    name: "AI",
    preview: "abestaev: have you tried o3?",
    time: "Mon",
    icon: "bulb",
    memberCount: 56,
  },
];

export const chatMessages: Record<string, ChatMessage[]> = {
  "fr-svidal": [
    {
      sender: "svidal",
      initials: "sv",
      text: "Hey! Are you coming to the cycling ride on Saturday?",
      time: "09:14",
    },
    {
      sender: "abestaev",
      initials: "ab",
      text: "Yes, definitely. What time are we meeting?",
      time: "09:16",
      me: true,
    },
    {
      sender: "svidal",
      initials: "sv",
      text: "8am at the campus parking. Bring rain gear, weather looks iffy.",
      time: "09:18",
    },
  ],
  "fr-pdupont": [
    {
      sender: "pdupont",
      initials: "pd",
      text: "did you see the game yesterday?",
      time: "10:42",
    },
  ],
  "fr-lmartin": [
    {
      sender: "lmartin",
      initials: "lm",
      text: "Ok got it, see you tomorrow then",
      time: "yesterday",
    },
  ],
  "fr-arenard": [
    {
      sender: "arenard",
      initials: "ar",
      text: "GG on your level up!",
      time: "yesterday",
    },
  ],
  "ch-photography": [
    {
      sender: "tmercier",
      initials: "tm",
      text: "nice shot this morning",
      time: "11:05",
    },
  ],
  "ch-cycling": [
    {
      sender: "lmartin",
      initials: "lm",
      text: "Ride Saturday 8am, who's in?",
      time: "08:30",
    },
  ],
  "ch-gaming": [
    {
      sender: "nfaure",
      initials: "nf",
      text: "who's playing tonight?",
      time: "yesterday",
    },
  ],
  "ch-chess": [
    {
      sender: "claurent",
      initials: "cl",
      text: "Internal tournament on Friday!",
      time: "Mon",
    },
  ],
  "ch-music": [
    {
      sender: "aroussea",
      initials: "ar",
      text: "anyone play piano?",
      time: "Mon",
    },
  ],
  "ch-cyber": [
    {
      sender: "svidal",
      initials: "sv",
      text: "New CTF this weekend!",
      time: "Mon",
    },
  ],
  "ch-ai": [
    {
      sender: "abestaev",
      initials: "ab",
      text: "have you tried o3?",
      time: "Mon",
      me: true,
    },
  ],
};
