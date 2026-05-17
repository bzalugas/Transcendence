export interface User {
  id: string;
  username: string;
  initials: string;
  avatarUrl?: string;
  bio?: string;
  level: number;
  role?: "GUEST" | "USER" | "ADMIN";
  socials?: ProfileSocial[];
}

export interface ProfileSocial {
  id?: number;
  platform: string;
  label: string;
  url: string;
}

export interface ProfileInterest {
  id?: number;
  name: string;
  color: string;
  members?: number;
}

export interface AvailableInterest extends ProfileInterest {
  id: number;
  desc: string;
  members: number;
}

export type PresenceStatus = "online" | "offline" | "away";

export interface Channel {
  id?: number;
  interestId?: number;
  slug: string;
  label: string;
  color: string;
  imageUri?: string | null;
  emoji?: string;
  description?: string;
  tagline?: string;
  memberCount?: number;
  postCount?: number;
  createdAt?: string;
  joined?: boolean;
  isFavorite?: boolean;
}

export interface ChannelMember {
  id?: string;
  initials: string;
  avatarUrl?: string;
  username: string;
  level: number;
  status: PresenceStatus;
  isFriend: boolean;
  isSelf?: boolean;
  joinedAt?: string;
  isFavorite?: boolean;
}

export interface Comment {
  id?: string;
  authorId?: string;
  initials: string;
  avatarUrl?: string;
  author: string;
  text: string;
  time: string;
}

export interface PostEvent {
  day: string;
  month: string;
  title: string;
  subtitle: string;
  goingCount: number;
}

export type FileCategory = "image" | "document" | "archive" | "other";
export type AttachmentType =
  | "image"
  | "pdf"
  | "text_document"
  | "archive"
  | "word_document"
  | "open_document";

export interface FileAsset {
  id: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: FileCategory;
  attachmentType: AttachmentType;
  previewUrl: string;
  downloadUrl: string;
}

export interface PostAttachment {
  id: string;
  fileId: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: FileCategory;
  type: AttachmentType;
  previewUrl: string;
  downloadUrl: string;
}

export type MessageAttachment = PostAttachment;

export interface Post {
  id: string;
  createdAt?: string;
  authorId?: string;
  initials: string;
  avatarUrl?: string;
  author: string;
  time: string;
  channelSlug: string;
  channelLabel: string;
  body: string;
  image?: { emoji: string; label: string };
  imageGrid?: string[];
  event?: PostEvent;
  attachments?: PostAttachment[];
  likeCount: number;
  liked?: boolean;
  comments: Comment[];
}

export interface ChannelSystemEvent {
  id: string;
  channelSlug: string;
  kind: "join";
  username: string;
  time: string;
}

export type ChannelFeedItem =
  | { kind: "post"; post: Post }
  | { kind: "system"; event: ChannelSystemEvent };

export type ActivityKind =
  | "passed_project"
  | "passed_exam"
  | "reached_level"
  | "joined_channel"
  | "new_friend";

export interface Activity {
  id: string;
  kind: ActivityKind;
  actor: string;
  target: string;
  time: string;
}

export interface NewChannelAnnouncement {
  id: string;
  creatorInitials: string;
  creatorName: string;
  channelName: string;
  channelColor: string;
  memberCount: number;
  time: string;
}

export type HomeFeedItem =
  | { kind: "post"; post: Post }
  | { kind: "new-channel"; announcement: NewChannelAnnouncement }
  | { kind: "activity"; activity: Activity };

export type ConversationType = "friend";

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string;
  preview: string;
  time: string;
  lastMessageAt?: string;
  unread?: number;
  otherUserId?: string;
  // Friend-specific
  initials?: string;
  avatarUrl?: string;
  online?: boolean;
  away?: boolean;
  level?: number;
}

export interface ChatMessage {
  id?: string;
  chatId?: string;
  sender: string;
  initials: string;
  text: string;
  time: string;
  createdAt?: string;
  me?: boolean;
  attachments?: MessageAttachment[];
}

export interface Friend {
  id?: string;
  initials: string;
  avatarUrl?: string;
  name: string;
  level: number;
}

export interface NavBadges {
  suggestions: number;
  messages: number;
}
