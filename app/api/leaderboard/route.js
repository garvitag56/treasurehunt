import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import Team from '@/lib/models/Team';
import Checkpoint from '@/lib/models/Checkpoint';
import { publicLeaderboardTeam } from '@/lib/gameConfig';

export async function GET() {
  try {
    await dbConnect();
    const [teams, totalCheckpoints] = await Promise.all([
      Team.find({}).sort({ score: -1, updatedAt: 1 }).lean(),
      Checkpoint.countDocuments({}),
    ]);
    return NextResponse.json({ teams: teams.map((team) => publicLeaderboardTeam(team, totalCheckpoints)) });
  } catch (error) {
    console.error('leaderboard error', error);
    return NextResponse.json({ error: 'Unable to load leaderboard.' }, { status: 500 });
  }
}
