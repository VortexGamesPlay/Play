/** Erreur métier : message lisible destiné au joueur. */
export class GameError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export function assertGame(cond: unknown, code: string, message: string): asserts cond {
  if (!cond) throw new GameError(code, message);
}
