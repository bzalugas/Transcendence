interface ActivityCardProps {
  text: React.ReactNode;
  time: string;
}

export default function ActivityCard({ text, time }: ActivityCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-hover text-sm text-accent-green">
        ✓
      </div>
      <div className="flex-1 text-[13px] text-text-secondary">{text}</div>
      <div className="shrink-0 text-[12px] text-text-dimmed">{time}</div>
    </div>
  );
}
