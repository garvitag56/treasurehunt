import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Team from '@/lib/models/Team';
import ScanLog from '@/lib/models/ScanLog';
import { getGameConfig, getLifelineCost } from '@/lib/gameConfig';
import { buildProgressPayload, emitLeaderboardUpdate, findNextCheckpoint } from '@/lib/progress';

export async function POST(request) {
  try {
    await dbConnect();
    const { accessCode, lifelineType } = await request.json();
    const code = String(accessCode || '')
      .trim()
      .toUpperCase();
    const type = String(lifelineType || '').toUpperCase();

    if (!['HINT', 'SKIP'].includes(type)) {
      return NextResponse.json({ error: 'Unknown lifeline.' }, { status: 400 });
    }

    const team = await Team.findOne({ accessCode: code });
    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 401 });
    }

    const cost = getLifelineCost(type);
    const { MIN_POINTS_THRESHOLD } = getGameConfig();

    if (team.score - cost < MIN_POINTS_THRESHOLD) {
      return NextResponse.json(
        {
          error: `Lifeline blocked. Score would drop below the ${MIN_POINTS_THRESHOLD}-point threshold.`,
          blocked: true,
        },
        { status: 403 }
      );
    }

    const nextCheckpoint = await findNextCheckpoint(team);
    if (!nextCheckpoint) {
      return NextResponse.json({ error: 'No remaining checkpoints for a lifeline.' }, { status: 400 });
    }

    if (type === 'HINT') {
      const alreadyHinted = (team.usedLifelines || []).some(
        (item) => item.lifelineType === 'HINT' && String(item.checkpointId) === String(nextCheckpoint._id)
      );
      if (alreadyHinted) {
        return NextResponse.json(
          { error: 'Your team already used a hint for this checkpoint.', bonusHint: nextCheckpoint.bonusHint },
          { status: 409 }
        );
      }
    }

    const update = {
      $inc: { score: -cost },
      $push: {
        usedLifelines: {
          lifelineType: type,
          cost,
          usedAt: new Date(),
          checkpointId: nextCheckpoint._id,
        },
      },
    };

    if (type === 'SKIP') {
      update.$push.completedCheckpoints = {
        checkpointId: nextCheckpoint._id,
        unlockedAt: new Date(),
      };
    }

    const updatedTeam = await Team.findOneAndUpdate(
      {
        _id: team._id,
        score: { $gte: cost + MIN_POINTS_THRESHOLD },
      },
      update,
      { new: true }
    );

    if (!updatedTeam) {
      return NextResponse.json(
        {
          error: `Lifeline blocked. Score would drop below the ${MIN_POINTS_THRESHOLD}-point threshold.`,
          blocked: true,
        },
        { status: 403 }
      );
    }

    await ScanLog.create({
      teamId: updatedTeam._id,
      type: 'LIFELINE_USED',
      pointsDelta: -cost,
      meta: { lifelineType: type, checkpointId: nextCheckpoint._id, title: nextCheckpoint.title },
    });

    emitLeaderboardUpdate(updatedTeam);
    const progress = await buildProgressPayload(updatedTeam);

    return NextResponse.json({
      success: true,
      lifelineType: type,
      cost,
      bonusHint: type === 'HINT' ? nextCheckpoint.bonusHint || 'Look for staff in bright volunteer tees nearby.' : null,
      skippedTitle: type === 'SKIP' ? nextCheckpoint.title : null,
      ...progress,
    });
  } catch (error) {
    console.error('lifeline error', error);
    return NextResponse.json({ error: 'Unable to use lifeline.' }, { status: 500 });
  }
}
