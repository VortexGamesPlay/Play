import { HOUR, MINUTE } from '@core/time';

/** Constantes d'équilibrage centralisées. */
export const BALANCE = {
  startingWallet: { coins: 300, crystals: 10, essence: 0 },
  startingEggs: ['forestier', 'forestier', 'marin'] as string[],
  startingInventory: { fruit_rose: 5 } as Record<string, number>,
  startingIncubators: 2,
  maxIncubators: 6,
  harvestCapMs: 8 * HOUR,
  /** Bonus de récolte par niveau de créature. */
  harvestLevelBonus: 0.03,
  maxLevel: 50,
  maxAffection: 100,
  /** Plafond absolu de probabilité d'une mutation : jamais garantie. */
  mutationChanceCap: 0.35,
  /** Réduction du temps d'incubation si l'ambiance est favorable à l'œuf. */
  affinitySpeedMultiplier: 0.75,
  /** Accélération : 1 cristal par tranche de 10 minutes restantes (min. 1). */
  speedUpMsPerCrystal: 10 * MINUTE,
  favoriteFoodMultiplier: 1.5,
  ledgerSize: 200,
  discoveryLogSize: 300,
  variantDiscoveryCrystals: 5,
  breeding: {
    minLevel: 10,
    minAffection: 20,
    /** Nombre maximal de reproductions par créature. */
    maxBreeds: 4,
    cooldownMs: 1 * HOUR,
    coins: 150,
    essenceBase: 15,
    essencePerTier: 5,
    /** Probabilité de transmettre chaque mutation d'un parent. */
    inheritChance: 0.35,
    /** Avec stabilisateur (coût en essence supplémentaire). */
    stabilizedInheritChance: 0.7,
    stabilizerEssence: 30,
    /** Variation aléatoire d'un gène hérité (±). */
    geneDrift: 3,
    /** Chance qu'un gène hérité fasse un bond (+5). */
    geneSurgeChance: 0.06,
    /** Plafond de la somme des chances de recettes. */
    recipeChanceCap: 0.9,
  },
  expedition: {
    durations: {
      court: { ms: 15 * MINUTE, rolls: 2, xp: 40, label: 'Courte (15 min)' },
      moyen: { ms: 1 * HOUR, rolls: 4, xp: 140, label: 'Moyenne (1 h)' },
      long: { ms: 4 * HOUR, rolls: 9, xp: 450, label: 'Longue (4 h)' },
    },
    maxTeam: 3,
    maxConcurrent: 3,
    baseEggChance: 0.05,
    eggChanceCap: 0.45,
    favoredElementBonus: 0.15,
    coinsPerRoll: 25,
    foodChance: 0.3,
    /** Bornes du facteur de qualité (puissance de l'équipe / difficulté du biome). */
    minQuality: 0.35,
    maxQuality: 1.6,
    forageCooldownMs: 20 * MINUTE,
    forageEggChance: 0.03,
    secretCrystals: 20,
  },
  weatherPeriodMs: 3 * HOUR,
  daily: {
    baseCoins: 120,
    coinsPerStreakDay: 30,
    maxStreakBonusDays: 6,
    egg: 'forestier',
    weeklyCrystals: 15,
  },
};

/** XP nécessaire pour passer du niveau `level` au suivant. */
export function xpToNext(level: number): number {
  return Math.round(20 * Math.pow(level, 1.5));
}
