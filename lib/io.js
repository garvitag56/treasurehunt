export function setIO(io) {
  global.__treasureHuntIO = io;
}

export function getIO() {
  return global.__treasureHuntIO || null;
}
