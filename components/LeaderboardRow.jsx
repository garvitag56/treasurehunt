'use client';

const medals = ['🥇', '🥈', '🥉'];

export default function LeaderboardRow({ team, rank, highlight }) {
  const total = Number(team.totalCheckpoints || 0);
  const progress = typeof team.progressPercent === 'number' ? team.progressPercent : total ? Math.round(((team.completedCount || 0) / total) * 100) : 0;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 transition-all duration-500 ${
        highlight
          ? 'border-amber-300 bg-amber-300/15 shadow-glow'
          : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-10 text-center text-xl">{medals[rank - 1] || `#${rank}`}</span>
          <div>
            <p className="font-semibold text-white">{team.name}</p>
            <p className="text-xs text-slate-400">{team.completedCount || 0} checkpoints</p>
          </div>
        </div>
        <p className="text-2xl font-black text-amber-300">{team.score}</p>
      </div>

      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-400">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-500 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
