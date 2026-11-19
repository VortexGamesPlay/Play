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
export type CrestShape = 'none' | 'sprout' | 'flame' | 'star' | 'halo' | 'gem' | 'bubble' | 'spikes' | 'crown' | 'moon' | 'ember' | 'lure';
export type TailShape = 'none' | 'flame' | 'fish' | 'leaf' | 'bolt' | 'curl' | 'fluffy' | 'star' | 'spike' | 'wisp';
export type WingShape = 'none' | 'small' | 'bat' | 'feather' | 'fairy' | 'fin';
export type EyeStyle = 'round' | 'sparkle' | 'sleepy' | 'fierce' | 'void' | 'gem';
export type MouthStyle = 'smile' | 'fang' | 'o' | 'cat' | 'tiny';
export type PatternStyle = 'none' | 'spots' | 'stripes' | 'belly' | 'stars' | 'scales' | 'runes' | 'cracks';
/** Signature EGGVERSE : fragment de coquille conservé (par défaut selon le stade). */
export type ShellStyle = 'base' | 'cap' | 'shard' | 'none';

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
  /** Fragment de coquille ; défaut : bébé → base, juvénile → chapeau, adulte/ancestral → éclat. */
  shell?: ShellStyle;
  /** Œuf dont la coquille donne sa couleur au fragment (défaut : premier œuf qui contient l'espèce). */
  nativeEgg?: string;
}

export type EvolutionCondition =
  | { type: 'level'; value: number }
  | { type: 'affection'; value: number }
  | { type: 'timeOfDay'; value: 'day' | 'night' }
  | { type: 'item'; item: ItemId }
  | { type: 'diet'; tag: string; count: number }
  | { type: 'mutation'; mutation: MutationId }
  | { type: 'ambiance'; ambiance: AmbianceId }
  /** Météo actuelle du sanctuaire. */
  | { type: 'weather'; weather: string };

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
  /** Comment l'espèce s'obtient (affichage Bestiaire / validation des données). */
  obtainableBy: ('egg' | 'evolution' | 'breeding')[];
  art: ArtSpec;
}

export interface EggVisual {
  base: string;
  secondary: string;
  pattern: 'leaves' | 'waves' | 'lava' | 'clouds' | 'wisps' | 'runes' | 'veins' | 'prism' | 'galaxy' | 'crown' | 'helix';
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
  /** Œuf génétique : son contenu vient des parents (Laboratoire), pas d'une table. */
  genetic?: boolean;
  /** Œuf exclusif à l'exploration (jamais vendu en boutique). */
  exploreOnly?: boolean;
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
  /** food : se mange ; evolution : consommé lors d'une évolution qui l'exige. */
  kind: 'food' | 'evolution' | 'material';
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
  | { id: string; kind: 'ambiance'; ref: AmbianceId; price: Price; requires?: Requirement }
  | { id: string; kind: 'decoration'; ref: string; price: Price; requires?: Requirement }
  | { id: string; kind: 'perk'; ref: string; name: string; description: string; price: Price; requires?: Requirement };

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
  | { kind: 'incubators'; target: number }
  | { kind: 'recipeCount'; target: number }
  | { kind: 'biomeExpeditions'; biome: string; target: number }
  | { kind: 'biomesUnlocked'; target: number }
  | { kind: 'secretsFound'; target: number }
  | { kind: 'buildingLevels'; target: number };

export interface Reward {
  coins?: number;
  crystals?: number;
  essence?: number;
  items?: Partial<Record<ItemId, number>>;
  eggs?: EggTypeId[];
}

/** Un parent de recette : par espèce précise ou par élément. */
export interface RecipeMatcher {
  species?: SpeciesId;
  element?: ElementId;
}

/** Recette génétique secrète : une combinaison de parents peut donner une espèce particulière. */
export interface RecipeDef {
  id: string;
  name: string;
  /** Indice affiché tant que la recette n'est pas découverte. */
  hint: string;
  parents: [RecipeMatcher, RecipeMatcher];
  result: SpeciesId;
  /** Probabilité d'obtenir le résultat quand les parents correspondent. */
  chance: number;
}

export type WeatherId = string;

export interface WeatherDef {
  id: WeatherId;
  name: string;
  description: string;
  /** Événement rare et spectaculaire (affiché comme tel). */
  event?: boolean;
  /** Effets sur les expéditions. */
  lootMul: number;
  eggChanceMul: number;
  /** Éléments avantagés pendant cette météo. */
  elementBonus: ElementId[];
  /** Effet visuel dans les scènes. */
  fx: 'none' | 'rain' | 'snow' | 'fog' | 'storm' | 'stars' | 'embers' | 'aurora' | 'sun' | 'wind';
}

export interface BiomeDef {
  id: string;
  name: string;
  description: string;
  /** Nombre d'espèces découvertes requis pour l'atteindre. */
  unlockDex: number;
  /** Puissance d'équipe conseillée. */
  difficulty: number;
  palette: { sky1: string; sky2: string; ground1: string; ground2: string; accent: string };
  scenery: 'forest' | 'volcano' | 'peaks' | 'reef' | 'space' | 'swamp' | 'dunes' | 'shadows';
  favoredElements: ElementId[];
  materials: { item: ItemId; weight: number }[];
  eggs: { egg: EggTypeId; weight: number }[];
  foods: ItemId[];
  weather: { weather: WeatherId; weight: number }[];
  secret: { name: string; description: string; afterExpeditions: number; eggChanceBonus: number };
  /** Terrain de sanctuaire débloqué par la première expédition dans ce biome. */
  theme: string;
}

export interface BuildingEffect {
  kind: 'creatureCap' | 'eggCap' | 'garden' | 'zone' | 'essence';
  base?: number;
  perLevel: number;
  elements?: ElementId[];
}

export interface BuildingDef {
  id: string;
  name: string;
  description: string;
  /** Niveau de départ (0 = à construire). */
  startLevel: number;
  maxLevel: number;
  /** costs[n] = coût pour passer du niveau n au niveau n+1. */
  costs: { coins: number; materials: Partial<Record<ItemId, number>> }[];
  effect: BuildingEffect;
}

export interface DecorationDef {
  id: string;
  name: string;
  description: string;
  shape: 'lantern' | 'arch' | 'statue' | 'mushrooms' | 'crystals' | 'bench' | 'fountain' | 'garland';
  color: string;
  /** Décoration exclusive (passe de saison ou achat cosmétique) : jamais en boutique de pièces. */
  exclusive?: 'season' | 'premium';
}

export interface ThemeDef {
  id: string;
  name: string;
  sky: [string, string];
  ground: [string, string];
  hill: [string, string];
  nightSky: [string, string];
}

export interface MissionDef {
  id: string;
  title: string;
  stat: keyof PlayerStats;
  target: number;
  reward: Reward;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  goal: QuestGoal;
  reward: Reward;
}

export interface QuestDef {
  id: QuestId;
  chapter: string;
  title: string;
  description: string;
  goal: QuestGoal;
  reward: Reward;
}
