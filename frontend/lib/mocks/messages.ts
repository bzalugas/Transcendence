export interface Conversation {
  type: "friend" | "room";
  initials?: string;
  name: string;
  preview: string;
  time: string;
  unread?: number;
  online?: boolean;
  away?: boolean;
  icon?: string;
}

export const conversations: Conversation[] = [
  { type: "friend", initials: "pd", name: "pdupont", preview: "did you see the game yesterday?", time: "10:42", online: true },
  { type: "friend", initials: "sv", name: "svidal", preview: "Are you coming tonight?", time: "09:18", unread: 2, online: true },
  { type: "friend", initials: "lm", name: "lmartin", preview: "Ok got it, see you tomorrow then", time: "yesterday", away: true },
  { type: "friend", initials: "ar", name: "arenard", preview: "GG on your level up!", time: "yesterday", online: true },
];

export const roomConversations: Conversation[] = [
  { type: "room", name: "Photography", preview: "tmercier: nice shot this morning", time: "11:05", unread: 5, icon: "camera" },
  { type: "room", name: "Cycling", preview: "Ride Saturday 8am, who's in?", time: "08:30", icon: "clock" },
  { type: "room", name: "Gaming", preview: "nfaure: who's playing tonight?", time: "yesterday", unread: 3, icon: "gamepad" },
  { type: "room", name: "Chess", preview: "Internal tournament on Friday!", time: "Mon", icon: "grid" },
  { type: "room", name: "Music", preview: "aroussea: anyone play piano?", time: "Mon", icon: "music" },
  { type: "room", name: "Cyber", preview: "New CTF this weekend!", time: "Mon", icon: "lock" },
  { type: "room", name: "AI", preview: "abestaev: have you tried o3?", time: "Mon", icon: "bulb" },
];

export interface ChatMessage {
  sender: string;
  initials: string;
  text: string;
  time: string;
  me?: boolean;
}

export const chatMessages: ChatMessage[] = [
  { sender: "svidal", initials: "sv", text: "Hey! Are you coming to the cycling ride on Saturday?", time: "09:14" },
];
