/**
 * Types du domaine EGGVERSE.
 * Ce module ne dépend d'AUCUNE API navigateur : il pourra être exécuté côté serveur
 * (validation autoritaire des actions en Phase 6).
 */

export type ElementId =
  | 'feu' | 'eau' | 'nature' | 'glace' | 'air' | 'terre' | 'foudre' | 'lumiere' | 'ombre'
  | 'vapeur' | 'cosmique' | 'cristal' | 'toxique' | 'spectre' | 'primordial';

export type RarityId =
  | 'commun' | 'peu_commun' | 'rare' | 'epique' | 'legendaire'
  | 'mythique' | 'antique' | 'divin' | 'secret';

export type CurrencyId = 'coins' | 'crystals' | 'essence';
export type Wallet = Record<CurrencyId, number>;

export type SpeciesId = string;
export type EggTypeId = string;
export type MutationId = string;
export type ItemId = string;
export type AmbianceId = string;
export type PersonalityId = string;
export type QuestId = string;

/** Gènes individuels. Stats 0..31, hue en degrés (-12..12), size 0..1. */
export interface Genes {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  hue: number;
  size: number;
}

export type CreatureOrigin =
  | { kind: 'egg'; eggType: EggTypeId; ambiance: AmbianceId; night: boolean }
  | { kind: 'starter' };

export interface CreatureInstance {
  uid: string;
  speciesId: SpeciesId;
  nickname: string | null;
  level: number;
  xp: number;
  genes: Genes;
  personality: PersonalityId;
  mutations: MutationId[];
  sizeCm: number;
  weightKg: number;
  /** 0..100 */
  affection: number;
  hatchedAt: number;
  origin: CreatureOrigin;
  favorite: boolean;
  /** Compteur des aliments consommés par étiquette (servira aux évolutions — Phase 3). */
  diet: Record<string, number>;
  generation: number;
}

export interface EggInstance {
  uid: string;
  type: EggTypeId;
  obtainedAt: number;
  source: string;
}

export interface IncubatorSlot {
  egg: EggInstance | null;
  startedAt: number;
  readyAt: number;
  ambiance: AmbianceId;
}

export interface DexEntry {
  speciesId: SpeciesId;
  firstObtainedAt: number | null;
  obtainedCount: number;
  /** Mutations déjà observées sur cette espèce. */
  variants: MutationId[];
}

export interface DiscoveryLogEntry {
  at: number;
  kind: 'species' | 'variant';
  speciesId: SpeciesId;
  mutationId?: MutationId;
  creatureUid: string;
}

export interface LedgerEntry {
  at: number;
  currency: CurrencyId;
  delta: number;
  balance: number;
  reason: string;
}

export interface PlayerStats {
  eggsObtained: number;
  eggsHatched: number;
  purchases: number;
  harvests: number;
  coinsHarvested: number;
  creaturesFed: number;
  levelUps: number;
  released: number;
  dailyClaims: number;
  speedUps: number;
}

export interface Settings {
  sound: boolean;
  reducedMotion: boolean;
}

export interface GameState {
  schemaVersion: number;
  player: { name: string; createdAt: number };
  wallet: Wallet;
  inventory: Record<ItemId, number>;
  eggs: EggInstance[];
  incubators: IncubatorSlot[];
  creatures: CreatureInstance[];
  dex: Record<SpeciesId, DexEntry>;
  discoveries: DiscoveryLogEntry[];
  ledger: LedgerEntry[];
  quests: { claimed: QuestId[] };
  stats: PlayerStats;
  sanctuary: { lastHarvestAt: number };
  daily: { lastClaimDay: string | null; streak: number };
  unlocks: { ambiances: AmbianceId[] };
  settings: Settings;
  uidCounter: number;
}

/** Contexte injecté dans chaque action : le temps et l'aléatoire ne sont jamais lus implicitement. */
export interface ActionContext {
  now: number;
  rng: Rng;
  /** Heure locale (0..23) — utilisée pour le cycle jour/nuit. */
  hour: number;
  /** Jour local au format YYYY-MM-DD pour les récompenses quotidiennes. */
  dayKey: string;
}

export interface Rng {
  /** Flottant uniforme dans [0, 1). */
  next(): number;
}
