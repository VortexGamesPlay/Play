import type { RarityDef } from '@core/content';
import type { RarityId } from '@core/types';

/**
 * SOURCE UNIQUE des probabilités par rareté.
 * hatchWeight : poids de base d'une espèce de cette rareté dans un œuf.
 * Les œufs peuvent l'ajuster via weightMul, mais ne redéfinissent jamais de probabilité absolue.
 */
export const RARITIES: Record<RarityId, RarityDef> = {
  commun:     { id: 'commun',     name: 'Commun',     tier: 0, color: '#8fa3b8', glow: '#cfdae6', hatchWeight: 1000, harvestPerHour: 30,  releaseEssence: 4,   discoveryCrystals: 2,  fx: 'soft' },
  peu_commun: { id: 'peu_commun', name: 'Peu commun', tier: 1, color: '#4fbf7a', glow: '#a6f0c2', hatchWeight: 480,  harvestPerHour: 45,  releaseEssence: 8,   discoveryCrystals: 3,  fx: 'sparkle' },
  rare:       { id: 'rare',       name: 'Rare',       tier: 2, color: '#3d8ef0', glow: '#9cc8ff', hatchWeight: 200,  harvestPerHour: 70,  releaseEssence: 16,  discoveryCrystals: 5,  fx: 'rays' },
  epique:     { id: 'epique',     name: 'Épique',     tier: 3, color: '#9b5cf0', glow: '#d2b4ff', hatchWeight: 70,   harvestPerHour: 110, releaseEssence: 32,  discoveryCrystals: 8,  fx: 'burst' },
  legendaire: { id: 'legendaire', name: 'Légendaire', tier: 4, color: '#f0a020', glow: '#ffe08a', hatchWeight: 18,   harvestPerHour: 180, releaseEssence: 70,  discoveryCrystals: 15, fx: 'aurora' },
  mythique:   { id: 'mythique',   name: 'Mythique',   tier: 5, color: '#ef4f8f', glow: '#ffb3d1', hatchWeight: 6,    harvestPerHour: 260, releaseEssence: 120, discoveryCrystals: 25, fx: 'nebula' },
  antique:    { id: 'antique',    name: 'Antique',    tier: 6, color: '#b08850', glow: '#f0d9a8', hatchWeight: 4,    harvestPerHour: 300, releaseEssence: 150, discoveryCrystals: 30, fx: 'runes' },
  divin:      { id: 'divin',      name: 'Divin',      tier: 7, color: '#ffd84a', glow: '#fffbe0', hatchWeight: 1.5,  harvestPerHour: 400, releaseEssence: 220, discoveryCrystals: 40, fx: 'divine' },
  secret:     { id: 'secret',     name: 'Secret',     tier: 8, color: '#1d1530', glow: '#9df5ff', hatchWeight: 0.5,  harvestPerHour: 500, releaseEssence: 300, discoveryCrystals: 50, fx: 'glitch' },
};

export const RARITY_ORDER: RarityId[] = Object.values(RARITIES)
  .sort((a, b) => a.tier - b.tier)
  .map((r) => r.id);
