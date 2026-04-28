"use client";

import PanelToggleIcon from "@/components/icons/PanelToggleIcon";
import type { Channel } from "@/lib/types";

interface ChannelHeaderProps {
  channel: Channel;
  panelOpen: boolean;
  onTogglePanel: () => void;
  onInvite: () => void;
}

export default function ChannelHeader({
  channel,
  panelOpen,
  onTogglePanel,
  onInvite,
}: ChannelHeaderProps) {
  return (
    <div className="bg-bg-tertiary px-8 pt-6">
      <div className="mb-1.5 flex items-center gap-3">
        <div
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ background: channel.color }}
        />
        <div className="text-[20px] font-semibold text-text-primary">
          {channel.label}
        </div>
        <button
          type="button"
          onClick={onInvite}
          className="ml-auto rounded-[7px] border border-border-strong/60 px-4 py-1.5 text-[12.5px] font-medium text-text-primary transition-colors hover:bg-bg-hover"
        >
          Invite
        </button>
        <button
          type="button"
          onClick={onTogglePanel}
          title="Toggle panel"
          className={`flex items-center rounded-[5px] p-1 transition-colors hover:bg-bg-hover hover:text-text-primary ${
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
