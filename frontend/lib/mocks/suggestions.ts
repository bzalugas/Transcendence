export interface SuggestionProfile {
  initials: string;
  name: string;
  level: number;
  online: boolean;
  sharedTags: string[];
  otherTags: string[];
}

export const suggestions: SuggestionProfile[] = [
  { initials: "tm", name: "tmercier", level: 14, online: true, sharedTags: ["Photo", "Cycling", "Chess", "Gaming"], otherTags: ["Guitar"] },
  { initials: "cl", name: "claurent", level: 12, online: false, sharedTags: ["Photo", "Gaming", "Music"], otherTags: ["Swimming", "Comics"] },
  { initials: "ar", name: "aroussea", level: 7, online: true, sharedTags: ["Chess", "Cycling", "Music"], otherTags: ["Running"] },
  { initials: "jb", name: "jbernard", level: 18, online: false, sharedTags: ["Photo", "Gaming"], otherTags: ["Drawing", "Reading"] },
  { initials: "nf", name: "nfaure", level: 9, online: true, sharedTags: ["Gaming", "Chess", "Cycling", "Music"], otherTags: ["Robotics"] },
  { initials: "sc", name: "schauvet", level: 5, online: false, sharedTags: ["Photo", "Music"], otherTags: ["Science", "Nature"] },
];

export const friendRequests = [
  { initials: "jb", name: "jbernard", sharedCount: 3 },
  { initials: "sc", name: "schauvet", sharedCount: 2 },
];
