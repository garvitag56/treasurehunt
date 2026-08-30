import Checkpoint from '@/lib/models/Checkpoint';
import GameSettings from '@/lib/models/GameSettings';
import { getGameConfig, publicLeaderboardTeam } from '@/lib/gameConfig';
import { getIO } from '@/lib/io';

export async function findNextCheckpoint(team) {
  const completedIds = new Set(
    (team.completedCheckpoints || []).map((item) => String(item.checkpointId))
  );
  const checkpoints = await Checkpoint.find({}).sort({ sequenceOrder: 1 }).lean();
  return checkpoints.find((checkpoint) => !completedIds.has(String(checkpoint._id))) || null;
}

export async function buildProgressPayload(team) {
  const config = getGameConfig();
  const checkpoints = await Checkpoint.find({}).sort({ sequenceOrder: 1 }).lean();
  const completedIds = new Set(
    (team.completedCheckpoints || []).map((item) => String(item.checkpointId))
  );
  const nextCheckpoint = checkpoints.find((checkpoint) => !completedIds.has(String(checkpoint._id))) || null;
  const finalCheckpointId = checkpoints.length ? String(checkpoints[checkpoints.length - 1]._id) : null;
  const meetsThreshold = (team.score || 0) >= config.MIN_POINTS_THRESHOLD;
  const finalEligible = completedIds.size >= Math.max(0, checkpoints.length - 1) && meetsThreshold;
  const finalUnlocked = Boolean(team.finalTreasureUnlocked);
  const settings = finalUnlocked ? await GameSettings.findOne({ key: 'main' }).lean() : null;

  return {
    team: {
      _id: String(team._id),
      name: team.name,
      accessCode: team.accessCode,
      score: team.score || 0,
      completedCheckpoints: team.completedCheckpoints || [],
      usedLifelines: team.usedLifelines || [],
    },
    totalCheckpoints: checkpoints.length,
    completedCount: completedIds.size,
    nextCheckpoint: nextCheckpoint
      ? {
          _id: String(nextCheckpoint._id),
          title: nextCheckpoint.title,
          sequenceOrder: nextCheckpoint.sequenceOrder,
          clueText: nextCheckpoint.clueText,
        }
      : null,
    minPointsThreshold: config.MIN_POINTS_THRESHOLD,
    lifelineCosts: { HINT: config.HINT_COST },
    collectedLetters: (team.completedCheckpoints || [])
      .filter((item) => String(item.checkpointId) !== finalCheckpointId)
      .map((item) => item.unlockLetter)
      .filter(Boolean),
    finalEligible,
    finalUnlocked,
    finalClue: finalUnlocked ? settings?.finalRiddle || 'Your final riddle is ready. Scan the final checkpoint when you reach it.' : null,
    lockReason: completedIds.size < Math.max(0, checkpoints.length - 1)
      ? 'Complete the second-last checkpoint to request the final password.'
      : !meetsThreshold
        ? `You need at least ${config.MIN_POINTS_THRESHOLD} points to unlock the final clue.`
        : null,
  };
}

export function emitTeamProgressUpdate(team) {
  const io = getIO();
  if (!io || !team) return;

  const teamIdRoom = team?._id ? `team_${String(team._id)}` : null;
  const accessCodeRoom = team?.accessCode ? `team_${String(team.accessCode).toUpperCase()}` : null;

  const payload = {
    teamId: String(team._id),
    accessCode: String(team.accessCode || '').toUpperCase(),
    updatedAt: new Date().toISOString(),
  };

  if (teamIdRoom) io.to(teamIdRoom).emit('team_progress_update', payload);
  if (accessCodeRoom) io.to(accessCodeRoom).emit('team_progress_update', payload);
}

export function emitLeaderboardUpdate(team) {
  const io = getIO();
  if (io && team) {
    emitTeamProgressUpdate(team);
    Checkpoint.countDocuments({})
      .then((totalCheckpoints) => {
        io.to('leaderboard_room').emit('leaderboard_update', publicLeaderboardTeam(team, totalCheckpoints));
      })
      .catch(() => {
        io.to('leaderboard_room').emit('leaderboard_update', publicLeaderboardTeam(team));
      });
  }
}
