export interface User {
  id: string;
  username: string;
  initials: string;
  avatarUrl?: string;
  level: number;
}

export interface Room {
  slug: string;
  label: string;
  color: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  active?: boolean;
}

export interface Comment {
  initials: string;
  avatarUrl?: string;
  author: string;
  text: string;
  time: string;
}

export interface Post {
  id: string;
  initials: string;
  avatarUrl?: string;
  author: string;
  time: string;
  room: string;
  body: string;
  image?: { emoji: string; label: string };
  imageGrid?: string[];
  reactions: Reaction[];
  comments: Comment[];
}

export interface Friend {
  initials: string;
  avatarUrl?: string;
  name: string;
  level: number;
}

export interface CohortStat {
  label: string;
  value: string;
}

export interface NavBadges {
  suggestions: number;
  messages: number;
}
