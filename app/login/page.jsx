'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, KeyRound } from 'lucide-react';

const SESSION_KEY = 'th_team_session';

export default function LoginPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) router.replace('/dashboard');
  }, [router]);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          accessCode: data.team.accessCode,
          teamId: data.team._id,
          name: data.team.name,
        })
      );
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-glow">
          <Compass className="h-8 w-8" />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300">College induction</p>
        <h1 className="mt-2 text-4xl font-black text-white">Treasure Hunt</h1>
        <p className="mt-3 text-slate-400">Enter your team’s 6-character access code to start.</p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-amber-300/20">
          <img
            src="/campus-map.jpg"
            alt="Campus treasure hunt map"
            className="w-full object-cover opacity-90"
          />
        </div>
      </div>

      <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <label className="mb-2 flex items-center gap-2 text-sm text-slate-300">
          <KeyRound className="h-4 w-4" /> Team access code
        </label>
        <input
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value.toUpperCase().slice(0, 6))}
          maxLength={6}
          placeholder="ABC123"
          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-center font-mono text-3xl tracking-[0.4em] text-amber-300 outline-none focus:border-amber-300"
        />
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        <button
          type="submit"
          disabled={loading || accessCode.length !== 6}
          className="mt-5 w-full rounded-2xl bg-amber-400 py-3 text-lg font-black text-slate-950 disabled:opacity-40"
        >
          {loading ? 'Checking…' : 'Enter hunt'}
        </button>
      </form>
    </main>
  );
}
