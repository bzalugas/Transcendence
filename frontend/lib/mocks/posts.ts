import type { Post } from "@/lib/types";

export const posts: Post[] = [
  {
    id: "1",
    initials: "tm",
    avatarUrl: "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=150&h=150&fit=crop",
    author: "tmercier",
    time: "1h ago",
    room: "📷 Photography",
    body: "Early morning shot on campus, low-angle light at 7:30am. Fuji X-T5, 35mm f/1.4 🌫️",
    image: { emoji: "🌅", label: "Photo · 4032 × 3024" },
    reactions: [
      { emoji: "👍", count: 34, active: true },
      { emoji: "❤️", count: 8 },
    ],
    comments: [
      {
        initials: "pd",
        avatarUrl: "https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=150&h=150&fit=crop",
        author: "pdupont",
        text: "Magnifique, the light at that hour is something else",
        time: "45min ago",
      },
      {
        initials: "sv",
        author: "svidal",
        text: "What aperture did you use for this?",
        time: "30min ago",
      },
    ],
  },
  {
    id: "2",
    initials: "cl",
    author: "claurent",
    time: "yesterday",
    room: "📷 Photography",
    body: "Weekend shots from Brittany. The weather was perfect for dramatic skies.",
    imageGrid: ["🌊", "🌧️"],
    reactions: [
      { emoji: "❤️", count: 22, active: true },
      { emoji: "🔥", count: 5 },
    ],
    comments: [
      {
        initials: "tm",
        avatarUrl: "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=150&h=150&fit=crop",
        author: "tmercier",
        text: "Those dramatic clouds are perfect",
        time: "20h ago",
      },
      {
        initials: "mt",
        avatarUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150&h=150&fit=crop",
        author: "mtellal",
        text: "Brittany never disappoints",
        time: "18h ago",
      },
    ],
  },
];
