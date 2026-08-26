'use client';

const medals = ['🥇', '🥈', '🥉'];

export default function LeaderboardRow({ team, rank, highlight }) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-500 ${
        highlight
          ? 'border-amber-300 bg-amber-300/15 shadow-glow'
          : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="w-10 text-center text-xl">{medals[rank - 1] || `#${rank}`}</span>
        <div>
          <p className="font-semibold text-white">{team.name}</p>
          <p className="text-xs text-slate-400">{team.completedCount || 0} checkpoints</p>
        </div>
      </div>
      <p className="text-2xl font-black text-amber-300">{team.score}</p>
    </div>
  );
}
