'use client';

import useSocket from '@/hooks/useSocket';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Flag,
  LogOut,
  MapPinned,
  Plus,
  Printer,
  Radio,
  RefreshCcw,
  Shield,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';

const TEAM_KEY = 'th_admin_passkey';

async function adminRequest(passkey, payload) {
  const response = await fetch('/api/admin/manage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-passkey': passkey,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [passkey, setPasskey] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState('teams');
  const [error, setError] = useState('');
  const [teams, setTeams] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [creatingCp, setCreatingCp] = useState(false);
  const [checkpointForm, setCheckpointForm] = useState({
    title: '',
    sequenceOrder: 1,
    pointsReward: 20,
  });

  useSocket(
    'leaderboard_update',
    (updatedTeam) => {
      setTeams((current) => {
        const exists = current.some((t) => t._id === updatedTeam._id);
        if (exists) {
          return current.map((t) =>
            t._id === updatedTeam._id ? { ...t, score: updatedTeam.score, completedCount: updatedTeam.completedCount } : t
          );
        }
        return [...current, updatedTeam];
      });
    },
    { joinLeaderboard: true }
  );

  useEffect(() => {
    const stored = sessionStorage.getItem(TEAM_KEY);
    if (stored) {
      setPasskey(stored);
      unlock(stored).catch(() => sessionStorage.removeItem(TEAM_KEY));
    }
  }, []);

  async function unlock(key = passkey) {
    setError('');
    await adminRequest(key, { action: 'login' });
    sessionStorage.setItem(TEAM_KEY, key);
    setUnlocked(true);
    await refresh(key);
  }

  async function refresh(key = passkey) {
    const [teamRes, checkpointRes] = await Promise.all([
      adminRequest(key, { action: 'listTeams' }),
      adminRequest(key, { action: 'listCheckpoints' }),
    ]);
    setTeams(teamRes.teams || []);
    setCheckpoints(checkpointRes.checkpoints || []);
  }

  async function createTeam(event) {
    event.preventDefault();
    setError('');
    setCreating(true);
    try {
      await adminRequest(passkey, { action: 'createTeam', name: teamName });
      setTeamName('');
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function createCheckpoint(event) {
    event.preventDefault();
    setError('');
    setCreatingCp(true);
    try {
      await adminRequest(passkey, { action: 'createCheckpoint', ...checkpointForm });
      setCheckpointForm((current) => ({
        ...current,
        title: '',
        sequenceOrder: Number(current.sequenceOrder) + 1,
      }));
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingCp(false);
    }
  }

  const rankedTeams = useMemo(
    () => [...teams].sort((a, b) => b.score - a.score || new Date(a.updatedAt) - new Date(b.updatedAt)),
    [teams]
  );

  if (!unlocked) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8">
        <div className="mb-6 flex items-center gap-3 text-slate-100">
          <Shield className="h-6 w-6 text-amber-300" />
          <h1 className="text-2xl font-bold">Admin access</h1>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            unlock().catch((err) => setError(err.message));
          }}
          className="space-y-4"
        >
          <input
            type="password"
            value={passkey}
            onChange={(event) => setPasskey(event.target.value)}
            placeholder="ADMIN_PASSKEY"
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-300"
          />
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button type="submit" className="w-full rounded-2xl bg-amber-400 py-3 font-bold text-slate-950">
            Unlock command panel
          </button>
        </form>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200"
        >
          Go to team login
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Admin panel</h1>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
          >
            Team login
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(TEAM_KEY);
              setUnlocked(false);
              setPasskey('');
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
          <button
            type="button"
            onClick={() => refresh()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
          {tab === 'checkpoints' && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950"
            >
              <Printer className="h-4 w-4" /> Print QR cards
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 no-print">
        <button
          type="button"
          onClick={() => setTab('teams')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'teams' ? 'bg-white text-slate-950' : 'bg-white/10 text-white'}`}
        >
          Teams
        </button>
        <button
          type="button"
          onClick={() => setTab('leaderboard')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'leaderboard' ? 'bg-white text-slate-950' : 'bg-white/10 text-white'}`}
        >
          Leaderboard
        </button>
        <button
          type="button"
          onClick={() => setTab('checkpoints')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'checkpoints' ? 'bg-white text-slate-950' : 'bg-white/10 text-white'}`}
        >
          Checkpoints & QR
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-rose-300 no-print">{error}</p>}

      {tab === 'teams' && (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <form onSubmit={createTeam} className="rounded-3xl border border-white/10 bg-slate-900 p-5 no-print">
            <div className="mb-4 flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-amber-300" />
              <h2 className="font-bold">Create team</h2>
            </div>
            <input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Team name"
              className="mb-3 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
            />
            <button type="submit" disabled={creating} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-2 font-bold text-slate-950 disabled:opacity-50">
              <Plus className="h-4 w-4" /> {creating ? 'Adding...' : 'Add team'}
            </button>
          </form>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
            <div className="grid grid-cols-[1fr_120px_90px_160px] gap-2 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
              <span>Team / code</span>
              <span>Score</span>
              <span>Progress</span>
              <span className="no-print">Emergency</span>
            </div>
            {rankedTeams.map((team) => (
              <div key={team._id} className="grid grid-cols-[1fr_120px_90px_160px] items-center gap-2 border-b border-white/5 px-4 py-3 text-sm text-white">
                <div>
                  <p className="font-semibold">{team.name}</p>
                  <p className="font-mono text-amber-300">{team.accessCode}</p>
                </div>
                <p className="text-lg font-black text-amber-200">{team.score}</p>
                <p>{team.completedCheckpoints?.length || 0}</p>
                <div className="flex gap-2 no-print">
                  <button
                    type="button"
                    onClick={() => adminRequest(passkey, { action: 'resetScore', teamId: team._id, score: 0 }).then(() => refresh())}
                    className="rounded-lg bg-white/10 px-2 py-1 text-xs"
                  >
                    Zero score
                  </button>
                  <button
                    type="button"
                    onClick={() => adminRequest(passkey, { action: 'resetProgress', teamId: team._id }).then(() => refresh())}
                    className="rounded-lg bg-rose-500/20 px-2 py-1 text-xs text-rose-200"
                  >
                    Full reset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete this team permanently? This cannot be undone.')) {
                        adminRequest(passkey, { action: 'deleteTeam', teamId: team._id }).then(() => refresh());
                      }
                    }}
                    className="rounded-lg bg-rose-600/30 px-2 py-1 text-xs text-rose-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!rankedTeams.length && <p className="px-4 py-8 text-slate-400">No teams yet.</p>}
          </div>
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-amber-300" />
            <h2 className="text-xl font-bold">Live leaderboard</h2>
            <div className="ml-auto flex items-center gap-2 text-emerald-300">
              <Radio className="h-4 w-4 animate-pulse" />
              <span className="text-xs uppercase tracking-[0.2em]">Live</span>
            </div>
          </div>

          <div className="space-y-3">
            {rankedTeams.map((team, index) => {
              const progress = team.progressPercent ?? (
                team.totalCheckpoints ? Math.min(100, Math.round(((team.completedCheckpoints?.length || 0) / team.totalCheckpoints) * 100)) : 0
              );
              const medals = ['🥇', '🥈', '🥉'];

              return (
                <div key={team._id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-center text-xl">{medals[index] || `#${index + 1}`}</span>
                      <div>
                        <p className="font-semibold text-white">{team.name}</p>
                        <p className="text-xs text-slate-400">{team.completedCheckpoints?.length || 0} checkpoints</p>
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
            })}
            {!rankedTeams.length && <p className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-slate-400">Waiting for teams to join the hunt.</p>}
          </div>
        </div>
      )}

      {tab === 'checkpoints' && (
        <div className="space-y-6">
          <form onSubmit={createCheckpoint} className="grid gap-3 rounded-3xl border border-white/10 bg-slate-900 p-5 no-print md:grid-cols-2">
            <div className="md:col-span-2 flex items-center gap-2 text-white">
              <MapPinned className="h-5 w-5 text-amber-300" />
              <h2 className="font-bold">Create checkpoint</h2>
            </div>
            <input
              value={checkpointForm.title}
              onChange={(event) => setCheckpointForm({ ...checkpointForm, title: event.target.value })}
              placeholder="Title"
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={checkpointForm.sequenceOrder}
                onChange={(event) => setCheckpointForm({ ...checkpointForm, sequenceOrder: event.target.value })}
                placeholder="Order"
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
              />
              <input
                type="number"
                value={checkpointForm.pointsReward}
                onChange={(event) => setCheckpointForm({ ...checkpointForm, pointsReward: event.target.value })}
                placeholder="Points"
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
              />
            </div>
            <button type="submit" disabled={creatingCp} className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 font-bold text-slate-950 disabled:opacity-50">
              <Plus className="h-4 w-4" /> {creatingCp ? 'Saving...' : 'Save checkpoint'}
            </button>
          </form>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print-grid">
            {checkpoints.map((checkpoint) => (
              <article key={checkpoint._id} className="print-card rounded-3xl border border-white/10 bg-white p-5 text-slate-950">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">Checkpoint {checkpoint.sequenceOrder}</p>
                    <h3 className="text-xl font-black">{checkpoint.title}</h3>
                  </div>
                  <Flag className="h-5 w-5 text-amber-500" />
                </div>
                <div className="mb-4 flex justify-center rounded-2xl bg-slate-50 p-3">
                  <QRCodeSVG value={checkpoint.qrSecretToken} size={180} />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">{checkpoint.pointsReward} points</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 no-print">
                  <button
                    type="button"
                    onClick={() => adminRequest(passkey, { action: 'rotateToken', checkpointId: checkpoint._id }).then(() => refresh())}
                    className="text-xs font-semibold text-slate-500 underline"
                  >
                    Rotate QR token
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete the QR for “${checkpoint.title}”? This cannot be undone.`)) {
                        adminRequest(passkey, { action: 'deleteCheckpoint', checkpointId: checkpoint._id })
                          .then(() => refresh())
                          .catch((err) => setError(err.message));
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete QR
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
