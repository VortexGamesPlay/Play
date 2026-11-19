import { SPECIES } from '@data/species';
import { EGGS } from '@data/eggs';
import { createInitialState, SCHEMA_VERSION } from '../state';
import type { GameState } from '../types';
import { fnv1a } from './checksum';
import { migrate } from './migrations';

export const SAVE_FORMAT = 'eggverse-save';

export interface SaveEnvelope {
  format: typeof SAVE_FORMAT;
  schemaVersion: number;
  savedAt: number;
  checksum: string;
  state: GameState;
}

export function serialize(state: GameState, now: number): string {
  const body = JSON.stringify(state);
  const envelope = { format: SAVE_FORMAT, schemaVersion: state.schemaVersion, savedAt: now, checksum: fnv1a(body), state };
  return JSON.stringify(envelope);
}

export class SaveError extends Error {}

/** Remplit les champs manquants avec les valeurs par défaut et écarte les références orphelines. */
export function normalizeState(raw: Partial<GameState>, now: number): GameState {
  const base = createInitialState(now);
  const s: GameState = {
    ...base,
    ...raw,
    player: { ...base.player, ...raw.player },
    wallet: { ...base.wallet, ...raw.wallet },
    stats: { ...base.stats, ...raw.stats },
    sanctuary: { ...base.sanctuary, ...raw.sanctuary, buildings: { ...base.sanctuary.buildings, ...raw.sanctuary?.buildings } },
    exploration: { ...base.exploration, ...raw.exploration },
    missions: { ...base.missions, ...raw.missions },
    expeditions: raw.expeditions ?? [],
    achievements: raw.achievements ?? [],
    sideQuests: raw.sideQuests ?? [],
    combat: { ...base.combat, ...raw.combat },
    season: { ...base.season, ...raw.season },
    premium: { ...base.premium, ...raw.premium },
    daily: { ...base.daily, ...raw.daily },
    unlocks: { ...base.unlocks, ...raw.unlocks, perks: raw.unlocks?.perks ?? [] },
    settings: { ...base.settings, ...raw.settings },
    quests: { ...base.quests, ...raw.quests },
    inventory: raw.inventory ?? base.inventory,
    eggs: (raw.eggs ?? base.eggs).filter((e) => !!EGGS[e.type]),
    creatures: (raw.creatures ?? []).filter((c) => !!SPECIES[c.speciesId]).map((c) => ({ ...c, breedCount: c.breedCount ?? 0, breedReadyAt: c.breedReadyAt ?? 0 })),
    recipesFound: raw.recipesFound ?? [],
    incubators: (raw.incubators ?? base.incubators).map((slot) => (slot.egg && !EGGS[slot.egg.type] ? { ...slot, egg: null } : slot)),
    dex: raw.dex ?? {},
    discoveries: raw.discoveries ?? [],
    ledger: raw.ledger ?? [],
    schemaVersion: SCHEMA_VERSION,
  };
  for (const k of ['coins', 'crystals', 'essence'] as const) {
    if (!Number.isFinite(s.wallet[k]) || s.wallet[k] < 0) s.wallet[k] = 0;
  }
  return s;
}

export function deserialize(text: string, now: number): { state: GameState; savedAt: number } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new SaveError('Fichier de sauvegarde illisible.');
  }
  const env = parsed as Partial<SaveEnvelope>;
  if (!env || env.format !== SAVE_FORMAT || typeof env.state !== 'object' || env.state === null) {
    throw new SaveError('Ce fichier n\'est pas une sauvegarde EGGVERSE.');
  }
  if (env.checksum !== fnv1a(JSON.stringify(env.state))) {
    throw new SaveError('Sauvegarde corrompue (somme de contrôle invalide).');
  }
  const migrated = migrate(env.state as unknown as Record<string, unknown>, SCHEMA_VERSION);
  return { state: normalizeState(migrated as Partial<GameState>, now), savedAt: env.savedAt ?? now };
}
