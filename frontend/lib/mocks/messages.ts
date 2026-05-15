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
};
