'use client';

import { useEffect, useState } from 'react';
import { Radio, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import useSocket from '@/hooks/useSocket';
import LeaderboardRow from '@/components/LeaderboardRow';

function sortTeams(teams) {
  return [...teams].sort((a, b) => b.score - a.score || new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0));
}

export default function LeaderboardPage() {
  const [teams, setTeams] = useState([]);
  const [flashId, setFlashId] = useState(null);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((response) => response.json())
      .then((data) => setTeams(sortTeams(data.teams || [])))
      .catch(() => {});
  }, []);

  useSocket(
    'leaderboard_update',
    (updatedTeam) => {
      setFlashId(updatedTeam._id);
      setTeams((current) => {
        const existing = current.find((team) => team._id === updatedTeam._id);
        const mergedTeam = {
          ...updatedTeam,
          totalCheckpoints: updatedTeam.totalCheckpoints || existing?.totalCheckpoints || updatedTeam.completedCount || 1,
          progressPercent:
            updatedTeam.progressPercent ??
            (updatedTeam.totalCheckpoints
              ? Math.min(100, Math.round((updatedTeam.completedCount / updatedTeam.totalCheckpoints) * 100))
              : existing?.progressPercent ?? 0),
        };
        const next = current.filter((team) => team._id !== updatedTeam._id);
        next.push(mergedTeam);
        return sortTeams(next);
      });
      setTimeout(() => setFlashId(null), 1200);
    },
    { joinLeaderboard: true }
  );

  useSocket('leaderboard_full', (allTeams) => {
    setTeams(sortTeams(allTeams || []));
  });

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-300">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <div className="flex items-center gap-2 text-emerald-300">
          <Radio className="h-4 w-4 animate-pulse" />
          <span className="text-xs uppercase tracking-[0.2em]">Live</span>
        </div>
      </div>
      <h1 className="mb-6 text-4xl font-black text-white">Leaderboard</h1>
      <div className="space-y-3">
        {teams.map((team, index) => (
          <LeaderboardRow key={team._id} team={team} rank={index + 1} highlight={flashId === team._id} />
        ))}
        {!teams.length && <p className="text-slate-400">Waiting for teams to join the hunt.</p>}
      </div>
    </main>
  );
}
