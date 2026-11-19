import { BALANCE } from '@data/balance';
import { RARITIES } from '@data/rarities';
import { SPECIES_LIST } from '@data/species';
import type { ActionContext, CreatureInstance, GameState, MutationId } from '../types';
import { getSpecies } from './creatures';
import { grant } from './economy';

export interface DexRegistration {
  newSpecies: boolean;
  newVariants: MutationId[];
  crystalsAwarded: number;
}

/** Enregistre une créature obtenue dans le Bestiaire et attribue les récompenses de découverte. */
export function registerInDex(draft: GameState, c: CreatureInstance, ctx: ActionContext): DexRegistration {
  const sp = getSpecies(c.speciesId);
  let entry = draft.dex[c.speciesId];
  const newSpecies = !entry || entry.obtainedCount === 0;
  if (!entry) {
    entry = { speciesId: c.speciesId, firstObtainedAt: null, obtainedCount: 0, variants: [] };
    draft.dex[c.speciesId] = entry;
  }
  if (entry.firstObtainedAt === null) entry.firstObtainedAt = ctx.now;
  entry.obtainedCount += 1;

  const newVariants = c.mutations.filter((m) => !entry!.variants.includes(m));
  entry.variants.push(...newVariants);

  let crystals = 0;
  if (newSpecies) {
    crystals += RARITIES[sp.rarity].discoveryCrystals;
    draft.discoveries.push({ at: ctx.now, kind: 'species', speciesId: c.speciesId, creatureUid: c.uid });
  }
  for (const m of newVariants) {
    crystals += BALANCE.variantDiscoveryCrystals;
    draft.discoveries.push({ at: ctx.now, kind: 'variant', speciesId: c.speciesId, mutationId: m, creatureUid: c.uid });
  }
  if (draft.discoveries.length > BALANCE.discoveryLogSize) {
    draft.discoveries.splice(0, draft.discoveries.length - BALANCE.discoveryLogSize);
  }
  if (crystals > 0) grant(draft, 'crystals', crystals, newSpecies ? `Découverte : ${sp.name}` : `Variante : ${sp.name}`, ctx.now);
  return { newSpecies, newVariants, crystalsAwarded: crystals };
}

export function dexCount(state: GameState): number {
  return Object.values(state.dex).filter((e) => e.obtainedCount > 0).length;
}

export function variantCount(state: GameState): number {
  return Object.values(state.dex).reduce((s, e) => s + e.variants.length, 0);
}

export function dexCompletion(state: GameState): number {
  return dexCount(state) / SPECIES_LIST.length;
}

export function isDiscovered(state: GameState, speciesId: string): boolean {
  return (state.dex[speciesId]?.obtainedCount ?? 0) > 0;
}
