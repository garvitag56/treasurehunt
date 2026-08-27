import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Team from '@/lib/models/Team';
import Checkpoint from '@/lib/models/Checkpoint';
import GameSettings from '@/lib/models/GameSettings';
import { getGameConfig, normalizeFinalPassword } from '@/lib/gameConfig';

export async function POST(request) {
  try {
    await dbConnect();
    const { accessCode, password } = await request.json();
    const code = String(accessCode || '').trim().toUpperCase();
    const team = await Team.findOne({ accessCode: code }).lean();
    if (!team) return NextResponse.json({ error: 'Team not found.' }, { status: 401 });

    const [checkpointCount, settings] = await Promise.all([
      Checkpoint.countDocuments({}),
      GameSettings.findOne({ key: 'main' }).lean(),
    ]);

    // Check if admin has set a password at all
    if (!settings || !settings.finalPassword || !settings.finalPassword.trim()) {
      return NextResponse.json({ error: 'The final password has not been set by the admin yet. Ask a volunteer.' }, { status: 400 });
    }

    const completedCount = new Set((team.completedCheckpoints || []).map((item) => String(item.checkpointId))).size;
    const threshold = getGameConfig().MIN_POINTS_THRESHOLD;

    if (completedCount < Math.max(0, checkpointCount - 1) || (team.score || 0) < threshold) {
      return NextResponse.json({ error: 'Complete the second-last checkpoint and meet the points threshold first.' }, { status: 403 });
    }

    // Check if user actually submitted something
    const submittedPassword = String(password || '').trim();
    if (!submittedPassword) {
      return NextResponse.json({ error: 'Enter the final password.' }, { status: 400 });
    }

    // Compare: normalize both sides identically
    const normalizedSubmitted = normalizeFinalPassword(submittedPassword);
    const normalizedExpected = normalizeFinalPassword(settings.finalPassword);

    if (normalizedSubmitted !== normalizedExpected) {
      return NextResponse.json({ error: 'That password is incorrect. Try again.' }, { status: 401 });
    }

    await Team.updateOne({ _id: team._id }, { $set: { finalTreasureUnlocked: true } });

    return NextResponse.json({ success: true, finalRiddle: settings.finalRiddle || 'Your final riddle is ready. Scan the final checkpoint when you reach it.' });
  } catch (error) {
    console.error('final unlock error', error);
    return NextResponse.json({ error: 'Unable to unlock the final riddle.' }, { status: 500 });
  }
}