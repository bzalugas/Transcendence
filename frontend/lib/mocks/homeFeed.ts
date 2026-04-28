import type { HomeFeedItem } from "@/lib/types";
import { posts } from "@/lib/mocks/posts";

export const homeFeed: HomeFeedItem[] = [
  { kind: "post", post: posts[0] },
  {
    kind: "new-channel",
    announcement: {
      id: "nc-1",
      creatorInitials: "mt",
      creatorName: "mtellal",
      channelName: "Cats",
      channelColor: "#c8870a",
      memberCount: 1,
      time: "2h ago",
    },
  },
  {
    kind: "activity",
    activity: {
      id: "act-1",
      kind: "passed_project",
      actor: "svidal",
      target: "minishell",
      time: "4h ago",
    },
  },
  { kind: "post", post: posts[1] },
  {
    kind: "activity",
    activity: {
      id: "act-2",
      kind: "passed_exam",
      actor: "pdupont",
      target: "exam rank 05",
      time: "yesterday",
    },
  },
];
