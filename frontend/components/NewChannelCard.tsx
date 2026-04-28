import Avatar from "@/components/Avatar";
import type { NewChannelAnnouncement } from "@/lib/types";

type NewChannelCardProps = Omit<NewChannelAnnouncement, "id">;

export default function NewChannelCard({
  creatorInitials,
  creatorName,
  time,
  channelName,
  channelColor,
  memberCount,
}: NewChannelCardProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3.5">
      <div className="mb-3 flex items-center gap-2.5">
        <Avatar initials={creatorInitials} size="md" />
        <div className="text-[12.5px] text-text-muted">
          <strong className="font-medium text-text-primary">
            {creatorName}
          </strong>{" "}
          created a new channel · {time}
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-border-default bg-bg-tertiary px-3.5 py-3">
        <div
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ background: channelColor }}
        />
        <div className="flex-1">
          <div className="text-[13.5px] font-medium text-text-primary">
            {channelName}
          </div>
          <div className="text-[12px] text-text-muted">
            {memberCount} member{memberCount !== 1 && "s"}
          </div>
        </div>
        <button
          type="button"
          className="rounded-lg bg-text-primary px-4 py-1.5 text-[12.5px] font-semibold text-bg-primary transition-opacity hover:opacity-88"
        >
          Join
        </button>
      </div>
    </div>
  );
}
