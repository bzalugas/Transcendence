import type { Channel, ChannelSystemEvent as SystemEvent } from "@/lib/types";

interface ChannelSystemEventProps {
  event: SystemEvent;
  channel: Channel;
}

export default function ChannelSystemEvent({
  event,
  channel,
}: ChannelSystemEventProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3 text-[13px] text-text-muted">
      <div
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: channel.color }}
      />
      <span>
        <strong className="font-medium text-text-primary">
          {event.username}
        </strong>{" "}
        joined {channel.label}
      </span>
      <span className="ml-auto text-[11.5px] text-text-dimmed">{event.time}</span>
    </div>
  );
}
