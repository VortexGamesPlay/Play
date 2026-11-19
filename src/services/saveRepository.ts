import type { GameState } from '@core/types';

export type LoadSource = 'main' | 'backup' | 'new';

export interface LoadResult {
  state: GameState;
  source: LoadSource;
  savedAt: number | null;
  /** Message d'avertissement si la sauvegarde principale était inutilisable. */
  warning?: string;
}

/**
 * Abstraction du stockage. Implémentation actuelle : LocalSaveRepository (navigateur / Capacitor / Electron).
 * Phase 6 : CloudSaveRepository (Supabase) — le serveur deviendra la source de vérité,
 * le stockage local servant de cache hors-ligne.
 */
export interface SaveRepository {
  load(now: number): Promise<LoadResult>;
  save(state: GameState, now: number): Promise<void>;
  clear(): Promise<void>;
}
