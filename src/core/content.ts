/**
 * Schéma du contenu configurable (créatures, œufs, mutations, raretés…).
 * Ajouter une créature / un œuf / une mutation = ajouter une entrée de données,
 * sans toucher à la logique des systèmes.
 */
import type {
  AmbianceId, CurrencyId, EggTypeId, ElementId, ItemId, MutationId, PersonalityId,
  PlayerStats, QuestId, RarityId, SpeciesId,
} from './types';

export interface ElementDef {
  id: ElementId;
  name: string;
  color: string;
  special: boolean;
  /** Avantage offensif (utilisé par les combats — Phase 5). */
  strongAgainst: ElementId[];
}

export type RarityFx = 'soft' | 'sparkle' | 'rays' | 'burst' | 'aurora' | 'nebula' | 'runes' | 'divine' | 'glitch';

export interface RarityDef {
  id: RarityId;
  name: string;
  tier: number;
  color: string;
  glow: string;
  /** Poids d'éclosion par défaut d'une espèce de cette rareté (probabilités centralisées). */
  hatchWeight: number;
  harvestPerHour: number;
  releaseEssence: number;
  discoveryCrystals: number;
  fx: RarityFx;
}

export type BodyShape = 'round' | 'pear' | 'drop' | 'blob' | 'tall' | 'ghost' | 'gem' | 'serpent';
export type EarShape = 'none' | 'cat' | 'bunny' | 'round' | 'fin' | 'leaf' | 'flame' | 'horn' | 'antenna' | 'crystal' | 'feather' | 'mushroom';
export type CrestShape = 'none' | 'sprout' | 'flame' | 'star' | 'halo' | 'gem' | 'bubble' | 'spikes' | 'crown' | 'moon';
export type TailShape = 'none' | 'flame' | 'fish' | 'leaf' | 'bolt' | 'curl' | 'fluffy' | 'star' | 'spike' | 'wisp';
export type WingShape = 'none' | 'small' | 'bat' | 'feather' | 'fairy' | 'fin';
export type EyeStyle = 'round' | 'sparkle' | 'sleepy' | 'fierce' | 'void' | 'gem';
export type MouthStyle = 'smile' | 'fang' | 'o' | 'cat' | 'tiny';
export type PatternStyle = 'none' | 'spots' | 'stripes' | 'belly' | 'stars' | 'scales' | 'runes';

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  belly: string;
  eye: string;
}

export interface ArtSpec {
  body: BodyShape;
  ears: EarShape;
  crest: CrestShape;
  tail: TailShape;
  wings: WingShape;
  eyes: EyeStyle;
  mouth: MouthStyle;
  pattern: PatternStyle;
  feet: boolean;
  /** Échelle visuelle (bébé ≈ 0.8, adulte ≈ 1). */
  scale: number;
  palette: Palette;
  aura?: string;
}

export type EvolutionCondition =
  | { type: 'level'; value: number }
  | { type: 'affection'; value: number }
  | { type: 'timeOfDay'; value: 'day' | 'night' }
  | { type: 'item'; item: ItemId }
  | { type: 'diet'; tag: string; count: number }
  | { type: 'mutation'; mutation: MutationId }
  | { type: 'ambiance'; ambiance: AmbianceId };

export interface EvolutionDef {
  to: SpeciesId;
  conditions: EvolutionCondition[];
}

export type Stage = 'bebe' | 'juvenile' | 'adulte' | 'ancestral';

export interface SpeciesDef {
  id: SpeciesId;
  dex: number;
  name: string;
  /** Espèce / famille (ex. « Dracônet »). */
  family: string;
  element: ElementId;
  rarity: RarityId;
  stage: Stage;
  description: string;
  baseStats: { hp: number; atk: number; def: number; spd: number };
  sizeCm: number;
  weightKg: number;
  favoriteFood: string[];
  evolutions: EvolutionDef[];
  /** Comment l'espèce s'obtient (affichage Ovidex / validation des données). */
  obtainableBy: ('egg' | 'evolution' | 'breeding')[];
  art: ArtSpec;
}

export interface EggVisual {
  base: string;
  secondary: string;
  pattern: 'leaves' | 'waves' | 'lava' | 'clouds' | 'wisps' | 'runes' | 'veins' | 'prism' | 'galaxy' | 'crown';
  glow: string;
}

export interface EggPoolEntry {
  species: SpeciesId;
  /** Multiplicateur appliqué au poids de rareté de l'espèce (défaut 1). */
  weightMul?: number;
}

export interface EggDef {
  id: EggTypeId;
  name: string;
  rarity: RarityId;
  description: string;
  incubationMs: number;
  pool: EggPoolEntry[];
  mutationMultipliers: Partial<Record<MutationId, number>>;
  /** Ambiances qui accélèrent l'incubation. */
  affinity: AmbianceId[];
  /** Si défini, l'œuf ne peut être incubé que dans l'une de ces ambiances. */
  requiresAmbiance?: AmbianceId[];
  visual: EggVisual;
}

export interface MutationDef {
  id: MutationId;
  name: string;
  description: string;
  /** Deux mutations du même groupe sont incompatibles entre elles. */
  group: 'palette' | 'matiere' | 'element' | 'forme';
  baseChance: number;
  statMultiplier: number;
  color: string;
}

export interface AmbianceDef {
  id: AmbianceId;
  name: string;
  description: string;
  color: string;
  mutationMultipliers: Partial<Record<MutationId, number>>;
  /** Multiplicateurs supplémentaires quand l'éclosion a lieu de nuit. */
  nightMultipliers?: Partial<Record<MutationId, number>>;
}

export interface ItemDef {
  id: ItemId;
  name: string;
  description: string;
  kind: 'food';
  xp: number;
  affection: number;
  tags: string[];
  color: string;
}

export interface PersonalityDef {
  id: PersonalityId;
  name: string;
  description: string;
  up: 'hp' | 'atk' | 'def' | 'spd' | null;
  down: 'hp' | 'atk' | 'def' | 'spd' | null;
}

export type ShopOffer =
  | { id: string; kind: 'egg'; ref: EggTypeId; price: Price; requires?: Requirement }
  | { id: string; kind: 'item'; ref: ItemId; quantity: number; price: Price; requires?: Requirement }
  | { id: string; kind: 'incubator_slot'; slotNumber: number; price: Price; requires?: Requirement }
  | { id: string; kind: 'ambiance'; ref: AmbianceId; price: Price; requires?: Requirement };

export interface Price {
  currency: CurrencyId;
  amount: number;
}

export interface Requirement {
  dexCount?: number;
}

export type QuestGoal =
  | { kind: 'stat'; stat: keyof PlayerStats; target: number }
  | { kind: 'dexCount'; target: number }
  | { kind: 'creatureCount'; target: number }
  | { kind: 'maxLevel'; target: number }
  | { kind: 'variantCount'; target: number }
  | { kind: 'incubators'; target: number };

export interface Reward {
  coins?: number;
  crystals?: number;
  essence?: number;
  items?: Partial<Record<ItemId, number>>;
  eggs?: EggTypeId[];
}

export interface QuestDef {
  id: QuestId;
  chapter: string;
  title: string;
  description: string;
  goal: QuestGoal;
  reward: Reward;
}
