"use client";

import { useState } from "react";

export type ConfirmAction = "remove" | "block" | "report";

type Props = {
  action: ConfirmAction;
  friendName: string;
  onCancel: () => void;
  onConfirm: (details?: string) => void;
};

const TITLES: Record<ConfirmAction, string> = {
  remove: "Remove friend?",
  block: "Block user?",
  report: "Report user?",
};

const CONFIRM_LABELS: Record<ConfirmAction, string> = {
  remove: "Remove",
  block: "Block",
  report: "Report",
};

export default function ConfirmActionModal({ action, friendName, onCancel, onConfirm }: Props) {
  const [details, setDetails] = useState("");

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-[4px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
      tabIndex={-1}
      ref={(el) => el?.focus()}
    >
      <div className="w-[380px] rounded-[14px] border border-white/[0.12] bg-[#0f0f0e] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="mb-2 text-[16px] font-semibold text-white">{TITLES[action]}</div>
        <div className="mb-4 text-[12.5px] leading-relaxed text-[#888888]">
          {action === "remove" && <>Are you sure you want to remove <span className="font-medium text-white">{friendName}</span> from your friends?</>}
          {action === "block" && <>Blocking <span className="font-medium text-white">{friendName}</span> will remove them from your friends and hide their activity. You can unblock them later in your settings.</>}
          {action === "report" && <>Report <span className="font-medium text-white">{friendName}</span> to moderators. You can add details below to help us review.</>}
        </div>
        {action === "report" && (
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Add details (optional)..."
            rows={4}
            className="mb-5 w-full resize-none rounded-[6px] border border-white/10 bg-[#1a1a19] px-3 py-2 text-[12.5px] text-white outline-none placeholder:text-[#666666] focus:border-white/20"
          />
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[6px] border border-white/10 bg-[#1a1a19] px-4 py-[7px] text-[12.5px] text-[#c9c6c1] transition-colors hover:bg-[#222220] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(action === "report" ? details : undefined)}
            className="rounded-[6px] bg-[#e84545] px-4 py-[7px] text-[12.5px] font-medium text-white transition-opacity hover:opacity-90"
          >
            {CONFIRM_LABELS[action]}
          </button>
        </div>
      </div>
    </div>
  );
}
