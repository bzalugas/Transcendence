import type { ChannelFeedItem } from "@/lib/types";

export const channelFeeds: Record<string, ChannelFeedItem[]> = {
  photography: [
    {
      kind: "system",
      event: {
        id: "ph-sys-1",
        channelSlug: "photography",
        kind: "join",
        username: "jmoreau",
        time: "2h ago",
      },
    },
    {
      kind: "post",
      post: {
        id: "ph-1",
        initials: "tm",
        avatarUrl:
          "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=150&h=150&fit=crop",
        author: "tmercier",
        time: "3h ago",
        channelSlug: "photography",
        channelLabel: "📷 Photography",
        body: "Early morning shot on campus, low-angle light at 7:30am. Fuji X-T5, 35mm f/1.4. The fog was unreal today.",
        image: { emoji: "🌅", label: "Photo · 4032 × 3024" },
        likeCount: 12,
        liked: true,
        comments: [
          {
            initials: "cl",
            author: "claurent",
            text: "That light is incredible. What ISO were you at?",
            time: "2h ago",
          },
          {
            initials: "tm",
            avatarUrl:
              "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=150&h=150&fit=crop",
            author: "tmercier",
            text: "ISO 400, wide open. The X-T5 handles it well.",
            time: "1h ago",
          },
        ],
      },
    },
    {
      kind: "post",
      post: {
        id: "ph-2",
        initials: "cl",
        author: "claurent",
        time: "yesterday",
        channelSlug: "photography",
        channelLabel: "📷 Photography",
        body: "Weekend shots from Brittany. The weather was perfect for dramatic skies.",
        imageGrid: ["🌊", "🌧️"],
        likeCount: 22,
        liked: true,
        comments: [
          {
            initials: "tm",
            avatarUrl:
              "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=150&h=150&fit=crop",
            author: "tmercier",
            text: "The storm clouds shot is insane, what lens?",
            time: "yesterday",
          },
          {
            initials: "nf",
            author: "nfaure",
            text: "Brittany always delivers. Great series.",
            time: "yesterday",
          },
        ],
      },
    },
    {
      kind: "system",
      event: {
        id: "ph-sys-2",
        channelSlug: "photography",
        kind: "join",
        username: "nfaure",
        time: "2 days ago",
      },
    },
    {
      kind: "post",
      post: {
        id: "ph-3",
        initials: "pd",
        avatarUrl:
          "https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=150&h=150&fit=crop",
        author: "pdupont",
        time: "3 days ago",
        channelSlug: "photography",
        channelLabel: "📷 Photography",
        body: "Anyone have experience with the Sigma 56mm f/1.4 on APS-C? Thinking about picking one up for portraits. Looking for something sharp but not too clinical.",
        likeCount: 4,
        comments: [
          {
            initials: "ab",
            avatarUrl:
              "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=150&h=150&fit=crop",
            author: "abestaev",
            text: "Got one, it's great. Very sharp wide open, nice bokeh. Highly recommend.",
            time: "3 days ago",
          },
          {
            initials: "sv",
            author: "svidal",
            text: "+1, best value portrait lens on APS-C right now.",
            time: "3 days ago",
          },
        ],
      },
    },
    {
      kind: "post",
      post: {
        id: "ph-4",
        initials: "sv",
        author: "svidal",
        time: "4 days ago",
        channelSlug: "photography",
        channelLabel: "📷 Photography",
        body: "Organizing a sunset photowalk this Saturday along the coast. Meeting at campus parking at 5pm. All levels welcome, bring any camera (phone is fine).",
        event: {
          day: "29",
          month: "Mar",
          title: "Sunset Photowalk · Coast",
          subtitle: "Saturday 5pm · Campus parking",
          goingCount: 9,
        },
        likeCount: 15,
        liked: true,
        comments: [
          {
            initials: "pd",
            avatarUrl:
              "https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=150&h=150&fit=crop",
            author: "pdupont",
            text: "I'll be there, been wanting to do a golden hour shoot.",
            time: "4 days ago",
          },
          {
            initials: "cl",
            author: "claurent",
            text: "Count me in. Parking at 5 or meeting inside?",
            time: "4 days ago",
          },
        ],
      },
    },
  ],

  cycling: [
    {
      kind: "post",
      post: {
        id: "cy-1",
        initials: "lm",
        author: "lmartin",
        time: "5h ago",
        channelSlug: "cycling",
        channelLabel: "🚴 Cycling",
        body: "Saturday route is locked: 60km along the river, coffee stop at km 30. Meet 8am at campus.",
        likeCount: 6,
        liked: true,
        comments: [],
      },
    },
  ],

  gaming: [],
  chess: [],
  music: [],
  cyber: [],
  ai: [],
};
