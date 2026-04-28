import Link from "next/link";
import FriendsList from "@/components/FriendsList";
import { getFriends, getCohortStats } from "@/lib/data/friends";

export default function FriendsPanel() {
  const friends = getFriends();
  const cohortStats = getCohortStats();
  return (
    <aside className="flex w-full flex-col overflow-hidden border-l border-border-default bg-bg-secondary">
      <div className="flex-1 overflow-y-auto px-[18px] py-6">
        <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
          Friends
        </div>
        <FriendsList friends={friends} />
      </div>

      {/* Cohort stats (fixed footer) */}
      <div className="shrink-0 border-t border-border-default px-[18px] py-4">
        <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
          Cohort stats
        </div>
        <div className="flex flex-col gap-2">
          {cohortStats.map((s) => (
            <div key={s.label} className="flex items-center justify-between text-[12.5px]">
              <span className="text-text-muted">{s.label}</span>
              <span className="font-medium text-text-primary">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Legal links */}
        <div className="mt-4 flex justify-center gap-3 border-t border-border-default pt-3 text-[10.5px] text-text-dimmed">
          <Link href="/privacy" className="transition-colors hover:text-text-secondary">Privacy</Link>
          <span>·</span>
          <Link href="/terms" className="transition-colors hover:text-text-secondary">Terms</Link>
        </div>
      </div>
    </aside>
  );
}
