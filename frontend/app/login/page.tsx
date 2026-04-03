import Link from "next/link";
import Logo42 from "@/components/Logo42";

const features = [
  {
    title: "Rooms",
    description: "Join topic-based groups (photo, cycling, AI, and more).",
  },
  {
    title: "Feed",
    description: "Posts, events, and what's happening across your channels.",
  },
  {
    title: "Messaging",
    description: "Direct messages and group chats with classmates.",
  },
  {
    title: "Profile",
    description: "Favorite interests, friends, and recent activity.",
  },
];

export default function LoginPage() {
  return (
    <div className="flex h-full items-center justify-center p-7">
      <div className="w-[560px] rounded-xl border border-border-strong bg-bg-secondary p-[26px] shadow-[inset_0_1px_0_var(--color-border-subtle)]">
        <h1 className="mb-2 text-[26px] font-bold tracking-tight">
          42 Connect
        </h1>
        <p className="mb-[18px] text-[13.5px] leading-relaxed text-text-secondary">
          A social intranet for students built around{" "}
          <strong className="font-semibold text-text-primary">
            shared interests
          </strong>
          : rooms, posts and events, messaging, and profiles—so you can find
          your people on campus.
        </p>

        <div className="mb-[18px] grid grid-cols-2 gap-x-2.5 gap-y-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[10px] border border-border-strong bg-bg-primary px-3 py-3.5"
            >
              <div className="mb-1.5 text-[13.5px] font-semibold">
                {feature.title}
              </div>
              <div className="text-[12.5px] leading-normal text-text-tertiary">
                {feature.description}
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2.5 rounded-[14px] bg-btn-primary-bg px-[18px] py-4 text-base font-semibold text-btn-primary-text transition-opacity hover:opacity-88"
        >
          <Logo42 className="h-[22px] w-auto" />
          <span>Sign in with 42</span>
        </Link>

        <p className="mt-[18px] text-center text-[11.5px] leading-snug text-text-tertiary">
          Independent project, not affiliated with the 42 school.
        </p>
      </div>
    </div>
  );
}
