import Checkpoint from '@/lib/models/Checkpoint';
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
  const allComplete = checkpoints.length > 0 && completedIds.size >= checkpoints.length;
  const meetsThreshold = (team.score || 0) >= config.MIN_POINTS_THRESHOLD;
  const finalUnlocked = allComplete && meetsThreshold;

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
    finalUnlocked,
    finalClue: finalUnlocked ? config.FINAL_CLUE : null,
    lockReason: !allComplete
      ? 'Complete every checkpoint before the final destination is revealed.'
      : !meetsThreshold
        ? `You need at least ${config.MIN_POINTS_THRESHOLD} points to unlock the final clue.`
        : null,
  };
}

export function emitLeaderboardUpdate(team) {
  const io = getIO();
  if (io && team) {
    Checkpoint.countDocuments({})
      .then((totalCheckpoints) => {
        io.to('leaderboard_room').emit('leaderboard_update', publicLeaderboardTeam(team, totalCheckpoints));
      })
      .catch(() => {
        io.to('leaderboard_room').emit('leaderboard_update', publicLeaderboardTeam(team));
      });
  }
}
