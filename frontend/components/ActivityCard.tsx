import type { Activity } from "@/lib/types";

interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-hover text-sm text-accent-green">
        ✓
      </div>
      <div className="flex-1 text-[13px] text-text-secondary">
        <ActivityText activity={activity} />
      </div>
      <div className="shrink-0 text-[12px] text-text-dimmed">{activity.time}</div>
    </div>
  );
}

function ActivityText({ activity }: { activity: Activity }) {
  const actor = (
    <strong className="font-medium text-text-primary">{activity.actor}</strong>
  );
  const target = (
    <strong className="font-medium text-text-primary">{activity.target}</strong>
  );

  switch (activity.kind) {
    case "passed_project":
      return (
        <>
          {actor} passed {target}
        </>
      );
    case "passed_exam":
      return (
        <>
          {actor} passed the {target}
        </>
      );
    case "reached_level":
      return (
        <>
          {actor} reached {target}
        </>
      );
    case "joined_channel":
      return (
        <>
          {actor} joined {target}
        </>
      );
    case "new_friend":
      return (
        <>
          {actor} is now friends with {target}
        </>
      );
  }
}
