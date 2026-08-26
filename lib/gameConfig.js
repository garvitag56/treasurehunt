export function getGameConfig() {
  return {
    MIN_POINTS_THRESHOLD: Number(process.env.MIN_POINTS_THRESHOLD || 50),
    HINT_COST: Number(process.env.HINT_COST || 10),
    SKIP_COST: Number(process.env.SKIP_COST || 25),
    FINAL_CLUE:
      process.env.FINAL_CLUE ||
      'The final gathering is at the Main Auditorium. Show this screen to a volunteer.',
    ADMIN_PASSKEY: process.env.ADMIN_PASSKEY || '',
  };
}

export function getLifelineCost(lifelineType) {
  const config = getGameConfig();
  if (lifelineType === 'HINT') return config.HINT_COST;
  if (lifelineType === 'SKIP') return config.SKIP_COST;
  return null;
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

export function publicLeaderboardTeam(team) {
  const serialized = serializeTeam(team);
  return {
    _id: serialized._id,
    name: serialized.name,
    score: serialized.score,
    completedCount: serialized.completedCheckpoints.length,
    updatedAt: serialized.updatedAt,
  };
}
