import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Team from '@/lib/models/Team';
import Checkpoint from '@/lib/models/Checkpoint';
import ScanLog from '@/lib/models/ScanLog';
import { buildProgressPayload, emitLeaderboardUpdate } from '@/lib/progress';

export async function POST(request) {
  try {
    await dbConnect();
    const { accessCode, token } = await request.json();
    const code = String(accessCode || '')
      .trim()
      .toUpperCase();
    const secret = String(token || '').trim();

    if (!code || !secret) {
      return NextResponse.json({ error: 'Missing scan data.' }, { status: 400 });
    }

    const team = await Team.findOne({ accessCode: code });
    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 401 });
    }

    const checkpoint = await Checkpoint.findOne({ qrSecretToken: secret });
    if (!checkpoint) {
      return NextResponse.json({ error: 'Unknown QR code. Try scanning again.' }, { status: 404 });
    }

    const checkpoints = await Checkpoint.find({}).sort({ sequenceOrder: 1 }).lean();
    const completedIds = new Set((team.completedCheckpoints || []).map((item) => String(item.checkpointId)));
    const allComplete = checkpoints.length > 0 && completedIds.size >= checkpoints.length;
    const meetsThreshold = (team.score || 0) >= Number(process.env.MIN_POINTS_THRESHOLD || 50);
    const isFinalCheckpoint = !allComplete && checkpoint.sequenceOrder === Math.max(...checkpoints.map((item) => item.sequenceOrder));

    if (isFinalCheckpoint && !meetsThreshold) {
      return NextResponse.json(
        { error: 'You must keep enough points to unlock the final clue before completing the final checkpoint.', blocked: true },
        { status: 403 }
      );
    }

    const updatedTeam = await Team.findOneAndUpdate(
      {
        _id: team._id,
        'completedCheckpoints.checkpointId': { $ne: checkpoint._id },
      },
      {
        $inc: { score: checkpoint.pointsReward },
        $push: {
          completedCheckpoints: {
            checkpointId: checkpoint._id,
            unlockedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updatedTeam) {
      return NextResponse.json(
        { error: 'This checkpoint was already scanned by your team.', alreadyScanned: true },
        { status: 409 }
      );
    }

    await ScanLog.create({
      teamId: updatedTeam._id,
      type: 'CHECKPOINT_SCAN',
      pointsDelta: checkpoint.pointsReward,
      meta: { checkpointId: checkpoint._id, title: checkpoint.title },
    });

    emitLeaderboardUpdate(updatedTeam);
    const progress = await buildProgressPayload(updatedTeam);

    return NextResponse.json({
      success: true,
      pointsAwarded: checkpoint.pointsReward,
      checkpointTitle: checkpoint.title,
      ...progress,
    });
  } catch (error) {
    console.error('scan error', error);
    return NextResponse.json({ error: 'Scan failed. Please try again.' }, { status: 500 });
  }
}
