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
  | { kind: 'breeding'; parents: [SpeciesId, SpeciesId]; ambiance: AmbianceId; night: boolean }
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
  /** Nombre de reproductions déjà effectuées (limité). */
  breedCount: number;
  /** Horodatage avant lequel la créature se repose après une reproduction. */
  breedReadyAt: number;
}

/** Contenu génétique d'un œuf issu du Laboratoire, déterminé au moment de la fusion. */
export interface EggGenetics {
  speciesId: SpeciesId;
  genes: Genes;
  /** Mutations héritées des parents (d'autres peuvent apparaître à l'éclosion). */
  mutations: MutationId[];
  generation: number;
  parents: [SpeciesId, SpeciesId];
  parentNames: [string, string];
  recipeId: string | null;
}

export interface EggInstance {
  uid: string;
  type: EggTypeId;
  obtainedAt: number;
  source: string;
  genetics?: EggGenetics;
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
  evolutions: number;
  breedings: number;
  expeditions: number;
  forages: number;
  buildingUpgrades: number;
  battlesWon: number;
  battlesLost: number;
  bossesDefeated: number;
}

export interface PendingBattle {
  kind: 'league' | 'boss' | 'tower';
  ref: string;
  seed: number;
  startedAt: number;
  /** Instantané des combattants au lancement (rejoué tel quel pour vérification). */
  combatants: import('./combat/engine').CombatantInit[];
}

export type ExpeditionDuration = 'court' | 'moyen' | 'long';

export interface ExpeditionInstance {
  uid: string;
  biomeId: string;
  creatureUids: string[];
  duration: ExpeditionDuration;
  startedAt: number;
  endsAt: number;
}

export interface MissionsState {
  dayKey: string | null;
  dayBaseline: PlayerStats | null;
  dayClaimed: string[];
  weekKey: string | null;
  weekBaseline: PlayerStats | null;
  weekClaimed: string[];
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
  sanctuary: {
    lastHarvestAt: number;
    buildings: Record<string, number>;
    /** Décorations possédées → affichée ou non dans la scène. */
    decorations: Record<string, boolean>;
    theme: string;
  };
  expeditions: ExpeditionInstance[];
  exploration: {
    expeditionsByBiome: Record<string, number>;
    secretsFound: string[];
    lastForageAt: Record<string, number>;
  };
  missions: MissionsState;
  /** Succès réclamés (trophées). */
  achievements: string[];
  /** Quêtes secondaires réclamées. */
  sideQuests: string[];
  combat: {
    team: string[];
    pending: PendingBattle | null;
    /** Nombre de combats remportés dans chaque arène (progression séquentielle). */
    league: Record<string, number>;
    bossFirst: string[];
    bossDaily: Record<string, string>;
    towerFloor: number;
  };
  daily: { lastClaimDay: string | null; streak: number };
  unlocks: { ambiances: AmbianceId[] };
  /** Recettes génétiques secrètes découvertes. */
  recipesFound: string[];
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
