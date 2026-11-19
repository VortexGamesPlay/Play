import type { GameState } from './types';

/** Identifiants locaux uniques et monotones. En Phase 6, le serveur attribuera les identifiants définitifs. */
export function nextUid(draft: GameState, prefix: string): string {
  draft.uidCounter += 1;
  return `${prefix}_${draft.uidCounter.toString(36)}_${draft.player.createdAt.toString(36).slice(-4)}`;
}
