export function getGameConfig() {
  return {
    MIN_POINTS_THRESHOLD: Number(process.env.MIN_POINTS_THRESHOLD || 50),
    HINT_COST: Number(process.env.HINT_COST || 10),
    FINAL_CLUE:
      process.env.FINAL_CLUE ||
      'The final gathering is at the Main Auditorium. Show this screen to the organizers.',
    ADMIN_PASSKEY: process.env.ADMIN_PASSKEY || '',
  };
}

export function getLifelineCost(lifelineType) {
  const config = getGameConfig();
  if (lifelineType === 'HINT') return config.HINT_COST;
  return null;
}

export function normalizeFinalPassword(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function serializeTeam(team) {
  if (!team) return null;
  const obj = typeof team.toObject === 'function' ? team.toObject() : team;
  return {
    _id: String(obj._id),
    name: obj.name,
    score: obj.score || 0,
    completedCheckpoints: (obj.completedCheckpoints || []).map((item) => ({
      checkpointId: String(item.checkpointId),
      unlockedAt: item.unlockedAt,
    })),
    usedLifelines: obj.usedLifelines || [],
    updatedAt: obj.updatedAt,
  };
}

export function publicLeaderboardTeam(team, totalCheckpoints = null) {
  const serialized = serializeTeam(team);
  const completedCount = serialized.completedCheckpoints.length;
  const total = Number.isFinite(totalCheckpoints) && totalCheckpoints > 0 ? totalCheckpoints : completedCount || 1;
  const progressPercent = total ? Math.min(100, Math.round((completedCount / total) * 100)) : 0;

  return {
    _id: serialized._id,
    name: serialized.name,
    score: serialized.score,
    completedCount,
    totalCheckpoints: total,
    progressPercent,
    updatedAt: serialized.updatedAt,
  };
}
