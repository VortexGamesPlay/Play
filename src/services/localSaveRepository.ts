import { deserialize, serialize } from '@core/save/serializer';
import { createInitialState } from '@core/state';
import type { GameState } from '@core/types';
import type { LoadResult, SaveRepository } from './saveRepository';

const MAIN_KEY = 'eggverse.save.main';

/** Stockage de secours en mémoire (si le navigateur bloque le stockage local). */
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(k: string) { return this.data.get(k) ?? null; }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  removeItem(k: string) { this.data.delete(k); }
  setItem(k: string, v: string) { this.data.set(k, v); }
}

/** Retourne le stockage local s'il fonctionne réellement, sinon null. */
export function usableLocalStorage(): Storage | null {
  try {
    const ls = window.localStorage;
    const probe = '__eggverse_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

export function createSaveStorage(): { storage: Storage; persistent: boolean } {
  const ls = usableLocalStorage();
  return ls ? { storage: ls, persistent: true } : { storage: new MemoryStorage(), persistent: false };
}
const BACKUP_KEY = 'eggverse.save.backup';

/** Sauvegarde locale avec copie de secours : une écriture corrompue n'efface jamais la précédente. */
export class LocalSaveRepository implements SaveRepository {
  constructor(private readonly storage: Storage) {}

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
