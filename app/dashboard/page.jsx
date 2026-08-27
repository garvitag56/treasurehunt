'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { Camera, KeyRound, Lightbulb, Lock, Trophy, LogOut, Map, Sparkles } from 'lucide-react';
import QRScannerModal from '@/components/QRScannerModal';
import LifelineModal from '@/components/LifelineModal';
import useSocket from '@/hooks/useSocket';

const SESSION_KEY = 'th_team_session';

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lifeline, setLifeline] = useState(null);
  const [lifelineLoading, setLifelineLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [finalPassword, setFinalPassword] = useState('');
  const [finalRiddle, setFinalRiddle] = useState('');
  const [finalUnlocked, setFinalUnlocked] = useState(false);
  const [unlockingFinal, setUnlockingFinal] = useState(false);

  const loadProgress = useCallback(async (accessCode) => {
    const response = await fetch(`/api/progress?accessCode=${encodeURIComponent(accessCode)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setProgress(data);
    setFinalUnlocked(Boolean(data.finalUnlocked));
    setFinalRiddle(data.finalClue || '');
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      router.replace('/login');
      return;
    }
    const parsed = JSON.parse(raw);
    setSession(parsed);
    loadProgress(parsed.accessCode).catch(() => {
      localStorage.removeItem(SESSION_KEY);
      router.replace('/login');
    });
  }, [loadProgress, router]);

  useSocket(
    'leaderboard_update',
    (updatedTeam) => {
      if (session && updatedTeam._id === session.teamId) {
        loadProgress(session.accessCode).catch(() => {});
      }
    },
    { joinLeaderboard: true }
  );

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleScan = useCallback(
    async (token) => {
      if (!session) return;
      setScannerOpen(false);
      setError('');
      try {
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessCode: session.accessCode, token }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setProgress(data);
        setMessage(`+${data.pointsAwarded} points at ${data.checkpointTitle}`);
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.7 } });
      } catch (err) {
        setError(err.message);
      }
    },
    [session]
  );

  async function confirmLifeline() {
    if (!session || !lifeline) return;
    setLifelineLoading(true);
    setError('');
    try {
      const response = await fetch('/api/lifeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: session.accessCode, lifelineType: lifeline }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setProgress(data);
      setMessage('Hint used. Keep moving!');
      setLifeline(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLifelineLoading(false);
    }
  }

  async function unlockFinalTreasure(event) {
    event.preventDefault();
    setUnlockingFinal(true);
    setError('');
    try {
      const response = await fetch('/api/final-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: session.accessCode, password: finalPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setFinalRiddle(data.finalRiddle);
      setFinalUnlocked(true);
      setMessage('Quest complete. Final treasure unlocked!');
      confetti({ particleCount: 220, spread: 100, origin: { y: 0.55 } });
    } catch (err) {
      setError(err.message);
    } finally {
      setUnlockingFinal(false);
    }
  }

  if (!progress) {
    return <main className="flex min-h-screen items-center justify-center text-slate-400">Loading hunt…</main>;
  }

  const percent =
    progress.totalCheckpoints > 0 && progress.completedCount >= progress.totalCheckpoints
      ? 100
      : progress.totalCheckpoints
        ? Math.min(99, Math.round((progress.completedCount / progress.totalCheckpoints) * 100))
        : 0;

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 pb-32 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Team</p>
          <h1 className="text-2xl font-black text-white">{progress.team.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className={`rounded-full p-3 ${showMap ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-amber-300'}`}
            aria-label="Toggle campus map"
          >
            <Map className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => router.push('/leaderboard')}
            className="rounded-full bg-white/10 p-3 text-amber-300"
            aria-label="Leaderboard"
          >
            <Trophy className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(SESSION_KEY);
              router.replace('/login');
            }}
            className="rounded-full bg-white/10 p-3 text-slate-300"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {showMap && (
        <section className="mb-5 overflow-hidden rounded-3xl border border-amber-300/20">
          <img
            src="/campus-map.jpg"
            alt="Campus treasure hunt map"
            className="w-full object-cover"
          />
        </section>
      )}

      <section className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="mb-2 flex items-end justify-between">
          <p className="text-sm text-slate-400">Score</p>
          <p className="text-4xl font-black text-amber-300">{progress.team.score}</p>
        </div>
        <div className="mb-2 flex justify-between text-xs text-slate-400">
          <span>Checkpoint progress</span>
          <span>
            {progress.completedCount}/{progress.totalCheckpoints}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-500" style={{ width: `${percent}%` }} />
        </div>
      </section>

      <section className="mb-5 rounded-3xl border border-amber-300/20 bg-slate-900 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Status</p>
        {finalUnlocked ? (
          <div className="mt-3">
            <div className="flex items-center gap-2 text-amber-300">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <h2 className="text-xl font-bold text-white">Quest to Final treasure unlocked!</h2>
            </div>
            <p className="mt-2 leading-7 text-slate-200">{finalRiddle}</p>
          </div>
        ) : progress.finalEligible ? (
          <div className="mt-3">
            <h2 className="text-xl font-bold text-white">Enter the final password</h2>
            <p className="mt-2 leading-7 text-slate-200">Enter the password, then enter it to reveal the final riddle.</p>
            <form onSubmit={unlockFinalTreasure} className="mt-4 flex gap-2">
              <label className="sr-only" htmlFor="final-password">Final password</label>
              <input
                id="final-password"
                value={finalPassword}
                onChange={(event) => setFinalPassword(event.target.value)}
                placeholder="Seven-word password"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
              />
              <button type="submit" disabled={unlockingFinal || !finalPassword.trim()} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">
                <KeyRound className="h-4 w-4" /> {unlockingFinal ? 'Checking...' : 'Unlock'}
              </button>
            </form>
          </div>
        ) : progress.nextCheckpoint ? (
          <div className="mt-3">
            <h2 className="text-xl font-bold text-white">Keep moving</h2>
            <p className="mt-2 leading-7 text-slate-200">Your next checkpoint will be given by the volunteer on site.</p>
          </div>
        ) : (
          <div className="mt-3 flex items-start gap-3 text-slate-200">
            <Lock className="mt-1 h-5 w-5 text-amber-300" />
            <div>
              <h2 className="text-xl font-bold text-white">Final clue locked</h2>
              <p className="mt-2 leading-7">{progress.lockReason || 'Finish all checkpoints and keep enough points to unlock the final clue.'}</p>
            </div>
          </div>
        )}
      </section>

      {progress.collectedLetters?.length > 0 && (
        <section className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Letters from organisers</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {progress.collectedLetters.map((letter, index) => (
              <span key={`${letter}-${index}`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-lg font-black text-slate-950">{letter}</span>
            ))}
          </div>
        </section>
      )}

      {message && <p className="mb-3 rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">{message}</p>}
      {error && <p className="mb-3 rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200">{error}</p>}

      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={() => setLifeline('HINT')}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
        >
          <Lightbulb className="mb-2 h-5 w-5 text-amber-300" />
          <p className="font-bold text-white">Hint</p>
          <p className="text-xs text-slate-400">-{progress.lifelineCosts.HINT} pts</p>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setScannerOpen(true)}
        className="fixed bottom-6 left-1/2 z-40 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-glow"
        aria-label="Open camera scanner"
      >
        <Camera className="h-7 w-7" />
      </button>

      <QRScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />
      <LifelineModal
        open={Boolean(lifeline)}
        type={lifeline}
        cost={lifeline ? progress.lifelineCosts[lifeline] : 0}
        score={progress.team.score}
        threshold={progress.minPointsThreshold}
        loading={lifelineLoading}
        onClose={() => setLifeline(null)}
        onConfirm={confirmLifeline}
      />
    </main>
  );
}
