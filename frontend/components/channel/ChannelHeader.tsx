"use client";

import PanelToggleIcon from "@/components/icons/PanelToggleIcon";
import type { Channel } from "@/lib/types";

interface ChannelHeaderProps {
  channel: Channel;
  panelOpen: boolean;
  onTogglePanel: () => void;
}

export default function ChannelHeader({
  channel,
  panelOpen,
  onTogglePanel,
}: ChannelHeaderProps) {
  return (
    <div className="bg-bg-tertiary px-4 pt-5 sm:px-6 md:px-8 md:pt-6">
      <div className="mb-1.5 flex flex-wrap items-center gap-3">
        <div
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ background: channel.color }}
        />
        <div className="text-[20px] font-semibold text-text-primary">
          {channel.label}
        </div>
        <button
          type="button"
          onClick={onTogglePanel}
          title="Toggle panel"
          className={`ml-auto hidden items-center rounded-[5px] p-1 transition-colors hover:bg-bg-hover hover:text-text-primary md:flex ${
            panelOpen ? "text-text-dimmed" : "bg-bg-hover text-text-primary"
          }`}
        >
          <PanelToggleIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="mb-4 text-[12.5px] text-text-muted">
        {channel.memberCount ?? 0} member
        {channel.memberCount === 1 ? "" : "s"}
        {channel.tagline && <> · {channel.tagline}</>}
      </div>
    </div>
  );
}
