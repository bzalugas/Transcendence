"use client";

type Props = {
  friendName: string;
  onClose: () => void;
};

const games = [
  { id: "pong", icon: "🏓", name: "Pong", desc: "Classic 1v1, first to 5 points" },
  { id: "tictactoe", icon: "✖", name: "Tic Tac Toe", desc: "Align 3 symbols to win" },
  { id: "bomberman", icon: "💣", name: "Bomberman", desc: "Drop bombs, last one standing" },
];

export default function GameModal({ friendName, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-[4px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      tabIndex={-1}
      ref={(el) => el?.focus()}
    >
      <div className="w-[520px] rounded-[14px] border border-white/[0.12] bg-[#0f0f0e] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <div className="text-[18px] font-semibold text-white">Play a game</div>
            <span className="text-[18px] font-semibold text-[#555555]">(soon...)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] px-2 py-1 text-[20px] leading-none text-[#666666] transition-colors hover:bg-[#1a1a19] hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="mb-6 text-[12.5px] text-[#888888]">
          Choose a game against {friendName}
        </div>
        <div className="grid grid-cols-3 gap-3.5">
          {games.map((g) => (
            <div
              key={g.id}
              className="rounded-[12px] border border-white/10 bg-[#1a1a19] px-4 py-6 text-center opacity-40"
            >
              <span className="mb-3.5 block text-[32px]">{g.icon}</span>
              <div className="text-[14px] font-semibold text-white">{g.name}</div>
              <div className="mt-1 text-[11.5px] leading-snug text-[#888888]">{g.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
