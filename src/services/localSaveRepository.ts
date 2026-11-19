import { deserialize, serialize } from '@core/save/serializer';
import { createInitialState } from '@core/state';
import type { GameState } from '@core/types';
import type { LoadResult, SaveRepository } from './saveRepository';

const MAIN_KEY = 'eggverse.save.main';
const BACKUP_KEY = 'eggverse.save.backup';

/** Sauvegarde locale avec copie de secours : une écriture corrompue n'efface jamais la précédente. */
export class LocalSaveRepository implements SaveRepository {
  constructor(private readonly storage: Storage = window.localStorage) {}

  async load(now: number): Promise<LoadResult> {
    const main = this.storage.getItem(MAIN_KEY);
    if (main) {
      try {
        const { state, savedAt } = deserialize(main, now);
        return { state, savedAt, source: 'main' };
      } catch (err) {
        const backup = this.storage.getItem(BACKUP_KEY);
        if (backup) {
          try {
            const { state, savedAt } = deserialize(backup, now);
            return { state, savedAt, source: 'backup', warning: `Sauvegarde principale illisible (${(err as Error).message}). Copie de secours restaurée.` };
          } catch {
            /* on tombe sur une nouvelle partie */
          }
        }
        // On conserve le fichier défaillant pour diagnostic plutôt que de l'écraser silencieusement.
        this.storage.setItem(`${MAIN_KEY}.corrupt.${now}`, main);
        return { state: createInitialState(now), savedAt: null, source: 'new', warning: 'Aucune sauvegarde lisible : une nouvelle partie a été créée.' };
      }
    }
    return { state: createInitialState(now), savedAt: null, source: 'new' };
  }

  async save(state: GameState, now: number): Promise<void> {
    const text = serialize(state, now);
    const previous = this.storage.getItem(MAIN_KEY);
    if (previous) this.storage.setItem(BACKUP_KEY, previous);
    this.storage.setItem(MAIN_KEY, text);
  }

  async clear(): Promise<void> {
    this.storage.removeItem(MAIN_KEY);
    this.storage.removeItem(BACKUP_KEY);
  }
}
