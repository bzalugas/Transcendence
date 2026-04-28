"use client";

type Tone = "danger" | "primary";

interface ConfirmModalProps {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: Tone;
  onCancel: () => void;
  onConfirm: () => void;
}

const toneStyles: Record<Tone, string> = {
  danger: "bg-[#e84545] text-white hover:opacity-90",
  primary: "bg-text-primary text-bg-primary hover:opacity-90",
};

export default function ConfirmModal({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "primary",
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-[4px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
      tabIndex={-1}
      ref={(el) => el?.focus()}
    >
      <div className="w-[380px] rounded-[14px] border border-white/[0.12] bg-[#0f0f0e] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="mb-2 text-[16px] font-semibold text-white">{title}</div>
        <div className="mb-5 text-[12.5px] leading-relaxed text-[#888888]">
          {description}
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[6px] border border-white/10 bg-[#1a1a19] px-4 py-[7px] text-[12.5px] text-[#c9c6c1] transition-colors hover:bg-[#222220] hover:text-white"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-[6px] px-4 py-[7px] text-[12.5px] font-medium transition-opacity ${toneStyles[tone]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
