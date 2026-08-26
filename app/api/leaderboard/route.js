import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import Team from '@/lib/models/Team';
import { publicLeaderboardTeam } from '@/lib/gameConfig';

export async function GET() {
  try {
    await dbConnect();
    const teams = await Team.find({}).sort({ score: -1, updatedAt: 1 }).lean();
    return NextResponse.json({ teams: teams.map(publicLeaderboardTeam) });
  } catch (error) {
    console.error('leaderboard error', error);
    return NextResponse.json({ error: 'Unable to load leaderboard.' }, { status: 500 });
  }
}
