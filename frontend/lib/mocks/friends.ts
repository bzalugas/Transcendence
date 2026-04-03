import type { Friend, CohortStat } from "@/lib/types";

export const friends: Friend[] = [
  { initials: "mt", name: "mtellal", level: 14, avatarUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150&h=150&fit=crop" },
  { initials: "ba", name: "bazaluga", level: 11, avatarUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=150&h=150&fit=crop" },
  { initials: "lu", name: "lumaret", level: 9 },
  { initials: "js", name: "jsom", level: 13, avatarUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&h=150&fit=crop" },
  { initials: "ra", name: "rabouzia", level: 7 },
  { initials: "ar", name: "arenard", level: 10, avatarUrl: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=150&h=150&fit=crop" },
];

export const cohortStats: CohortStat[] = [
  { label: "Students", value: "342" },
  { label: "Online", value: "47" },
  { label: "Top interest", value: "Gaming" },
  { label: "Active groups", value: "12" },
];
