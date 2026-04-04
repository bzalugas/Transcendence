import Avatar from "@/components/Avatar";
import Link from "next/link";
import { friends, cohortStats } from "@/lib/mocks/friends";

export default function FriendsPanel() {
  return (
    <aside className="flex w-full flex-col overflow-y-auto border-l border-border-default bg-bg-secondary px-[18px] py-6">
      <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
        Friends
      </div>

      <div className="flex flex-col gap-0.5">
        {friends.map((f) => (
          <button
            key={f.name}
            type="button"
            className="flex items-center gap-[9px] rounded-[7px] px-2 py-[5px] transition-colors hover:bg-bg-hover"
          >
            <Avatar initials={f.initials} avatarUrl={f.avatarUrl} size="md" />
            <span className="flex-1 text-left text-[12.5px] text-text-primary">
              {f.name}
            </span>
            <span className="text-[11px] text-text-dimmed">lvl {f.level}</span>
          </button>
        ))}
      </div>

      {/* Cohort stats */}
      <div className="mt-auto">
        <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
          Cohort stats
        </div>
        <div className="flex flex-col gap-2">
          {cohortStats.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between text-[12.5px]"
            >
              <span className="text-text-muted">{s.label}</span>
              <span className="font-medium text-text-primary">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Legal links */}
        <div className="mt-4 flex justify-center gap-3 border-t border-border-default pt-3 text-[10.5px] text-text-dimmed">
          <Link href="/privacy" className="transition-colors hover:text-text-secondary">
            Privacy
          </Link>
          <span>·</span>
          <Link href="/terms" className="transition-colors hover:text-text-secondary">
            Terms
          </Link>
        </div>
      </div>
    </aside>
  );
}
