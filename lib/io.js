export function setIO(io) {
  globalThis.__treasureHuntIO = io;
}

export function getIO() {
  return globalThis.__treasureHuntIO || null;
}
