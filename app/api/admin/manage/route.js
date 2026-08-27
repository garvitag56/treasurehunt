import crypto from 'crypto';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Team from '@/lib/models/Team';
import Checkpoint from '@/lib/models/Checkpoint';
import ScanLog from '@/lib/models/ScanLog';
import GameSettings from '@/lib/models/GameSettings';
import { getGameConfig, normalizeFinalPassword, publicLeaderboardTeam } from '@/lib/gameConfig';
import { emitLeaderboardUpdate } from '@/lib/progress';

function unauthorized() {
  return NextResponse.json({ error: 'Invalid admin passkey.' }, { status: 401 });
}

function assertAdmin(request, bodyPasskey) {
  const headerKey = request.headers.get('x-admin-passkey') || '';
  const passkey = headerKey || bodyPasskey || '';
  const expected = getGameConfig().ADMIN_PASSKEY;
  return Boolean(expected) && passkey === expected;
}

function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return code;
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    if (!assertAdmin(request, body.passkey)) return unauthorized();

    const { action } = body;

    if (action === 'login') {
      return NextResponse.json({ ok: true });
    }

    if (action === 'listTeams') {
      const [teams, totalCheckpoints] = await Promise.all([
        Team.find({}).sort({ score: -1, updatedAt: 1 }).lean(),
        Checkpoint.countDocuments({}),
      ]);
      return NextResponse.json({
        teams: teams.map((team) => ({ ...team, totalCheckpoints, progressPercent: totalCheckpoints ? Math.min(100, Math.round(((team.completedCheckpoints || []).length / totalCheckpoints) * 100)) : 0 })),
      });
    }

    if (action === 'listCheckpoints') {
      const checkpoints = await Checkpoint.find({}).sort({ sequenceOrder: 1 }).lean();
      return NextResponse.json({ checkpoints });
    }

    if (action === 'getSettings') {
      const settings = await GameSettings.findOne({ key: 'main' }).lean();
      return NextResponse.json({ settings: settings || { finalPassword: '', finalRiddle: '' } });
    }

    if (action === 'saveSettings') {
      const finalPassword = normalizeFinalPassword(body.finalPassword);
      const passwordWords = finalPassword ? finalPassword.split(' ') : [];
      if (passwordWords.length !== 7) {
        return NextResponse.json({ error: 'Final password must contain exactly 7 words.' }, { status: 400 });
      }
      const settings = await GameSettings.findOneAndUpdate(
        { key: 'main' },
        { $set: { finalPassword, finalRiddle: String(body.finalRiddle || '').trim() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return NextResponse.json({ settings });
    }

    if (action === 'listLogs') {
      const logs = await ScanLog.find({}).sort({ createdAt: -1 }).limit(100).lean();
      return NextResponse.json({ logs });
    }

    if (action === 'createTeam') {
      const name = String(body.name || '').trim();
      if (!name) return NextResponse.json({ error: 'Team name is required.' }, { status: 400 });

      let accessCode = generateAccessCode();
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const exists = await Team.findOne({ accessCode });
        if (!exists) break;
        accessCode = generateAccessCode();
      }

      const team = await Team.create({ name, accessCode, score: Number(body.startingScore || 0) });
      emitLeaderboardUpdate(team);
      return NextResponse.json({ team });
    }

    if (action === 'resetScore') {
      const team = await Team.findByIdAndUpdate(
        body.teamId,
        { $set: { score: Number(body.score ?? 0) } },
        { new: true }
      );
      if (!team) return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
      emitLeaderboardUpdate(team);
      return NextResponse.json({ team });
    }

    if (action === 'resetProgress') {
      const team = await Team.findByIdAndUpdate(
        body.teamId,
        { $set: { score: 0, finalTreasureUnlocked: false, completedCheckpoints: [], usedLifelines: [] } },
        { new: true }
      );
      if (!team) return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
      emitLeaderboardUpdate(team);
      return NextResponse.json({ team });
    }

    if (action === 'createCheckpoint') {
      const checkpoint = await Checkpoint.create({
        title: String(body.title || '').trim(),
        sequenceOrder: Number(body.sequenceOrder),
        qrSecretToken: crypto.randomBytes(16).toString('hex'),
        pointsReward: Number(body.pointsReward || 0),
        unlockLetter: body.isFinalCheckpoint ? '' : String(body.unlockLetter || '').trim().toUpperCase(),
        clueText: String(body.clueText || '').trim(),
        bonusHint: String(body.bonusHint || '').trim(),
      });
      return NextResponse.json({ checkpoint });
    }

    if (action === 'updateCheckpoint') {
      const checkpoint = await Checkpoint.findByIdAndUpdate(
        body.checkpointId,
        {
          $set: {
            title: String(body.title || '').trim(),
            sequenceOrder: Number(body.sequenceOrder),
            pointsReward: Number(body.pointsReward || 0),
            unlockLetter: String(body.unlockLetter || '').trim().toUpperCase(),
            clueText: String(body.clueText || '').trim(),
            bonusHint: String(body.bonusHint || '').trim(),
          },
        },
        { new: true }
      );
      if (!checkpoint) return NextResponse.json({ error: 'Checkpoint not found.' }, { status: 404 });
      return NextResponse.json({ checkpoint });
    }

    if (action === 'rotateToken') {
      const checkpoint = await Checkpoint.findByIdAndUpdate(
        body.checkpointId,
        { $set: { qrSecretToken: crypto.randomBytes(16).toString('hex') } },
        { new: true }
      );
      if (!checkpoint) return NextResponse.json({ error: 'Checkpoint not found.' }, { status: 404 });
      return NextResponse.json({ checkpoint });
    }

    if (action === 'deleteTeam') {
      const team = await Team.findByIdAndDelete(body.teamId);
      if (!team) return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
      await ScanLog.deleteMany({ teamId: team._id });
      const io = global.__treasureHuntIO;
      if (io) {
        const teams = await Team.find({}).sort({ score: -1, updatedAt: 1 }).lean();
        io.to('leaderboard_room').emit('leaderboard_full', teams.map(publicLeaderboardTeam));
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'deleteCheckpoint') {
      await Checkpoint.findByIdAndDelete(body.checkpointId);
      return NextResponse.json({ ok: true });
    }

    if (action === 'leaderboard') {
      const [teams, totalCheckpoints] = await Promise.all([
        Team.find({}).sort({ score: -1, updatedAt: 1 }).lean(),
        Checkpoint.countDocuments({}),
      ]);
      return NextResponse.json({ teams: teams.map((team) => publicLeaderboardTeam(team, totalCheckpoints)) });
    }

    return NextResponse.json({ error: 'Unknown admin action.' }, { status: 400 });
  } catch (error) {
    console.error('admin error', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Duplicate value. Check team name or sequence order.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Admin request failed.' }, { status: 500 });
  }
}
