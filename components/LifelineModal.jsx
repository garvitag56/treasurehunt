'use client';

import { AlertTriangle, Lightbulb, X } from 'lucide-react';

export default function LifelineModal({
  open,
  onClose,
  onConfirm,
  type,
  cost,
  score,
  threshold,
  loading,
}) {
  if (!open) return null;

  const remaining = score - cost;
  const isHint = type === 'HINT';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Lifeline</p>
            <h2 className="mt-1 text-2xl font-bold text-white">{isHint ? 'Buy a hint' : 'Buy a hint'}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/10 p-2 text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-amber-100">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5" />
            <p className="text-sm leading-6">
              This costs <span className="font-bold">{cost} points</span>. Your score would become{' '}
              <span className="font-bold">{remaining}</span>.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 py-3 font-semibold text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-amber-400 py-3 font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Working…' : `Spend ${cost} pts`}
          </button>
        </div>
      </div>
    </div>
  );
}
