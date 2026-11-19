import { BALANCE } from '@data/balance';
import { AMBIANCES } from '@data/ambiances';
import { EGGS } from '@data/eggs';
import { MUTATIONS } from '@data/mutations';
import { RARITIES } from '@data/rarities';
import { SPECIES } from '@data/species';
import type { MutationDef } from '../content';
import type { AmbianceId, EggTypeId, MutationId, SpeciesId } from '../types';

/**
 * CALCUL CENTRAL DES PROBABILITÉS.
 * Ces fonctions sont utilisées à la fois pour le tirage réel ET pour l'affichage au joueur :
 * les probabilités affichées sont donc toujours exactes.
 */

export interface SpeciesOdd {
  speciesId: SpeciesId;
  probability: number;
}

export function speciesOdds(eggType: EggTypeId): SpeciesOdd[] {
  const egg = EGGS[eggType];
  if (!egg) throw new Error(`Œuf inconnu : ${eggType}`);
  const weights = egg.pool.map((p) => {
    const sp = SPECIES[p.species]!;
    return { speciesId: p.species, weight: RARITIES[sp.rarity].hatchWeight * (p.weightMul ?? 1) };
  });
  const total = weights.reduce((s, w) => s + w.weight, 0);
  return weights
    .map((w) => ({ speciesId: w.speciesId, probability: w.weight / total }))
    .sort((a, b) => b.probability - a.probability);
}

export interface MutationOdd {
  mutationId: MutationId;
  probability: number;
  group: MutationDef['group'];
}

/** Probabilité brute (avant résolution des incompatibilités de groupe). */
function rawMutationChance(m: MutationDef, eggType: EggTypeId, ambiance: AmbianceId, night: boolean): number {
  const egg = EGGS[eggType]!;
  const amb = AMBIANCES[ambiance] ?? AMBIANCES.neutre!;
  let p = m.baseChance;
  p *= egg.mutationMultipliers[m.id] ?? 1;
  p *= amb.mutationMultipliers[m.id] ?? 1;
  if (night) p *= amb.nightMultipliers?.[m.id] ?? 1;
  return Math.min(p, BALANCE.mutationChanceCap);
}

/**
 * Chaque groupe de mutations est tiré une seule fois (les mutations d'un même groupe sont incompatibles).
 * Probabilité effective = part de l'intervalle [0,1) attribuée à la mutation dans son groupe.
 */
export function mutationOdds(eggType: EggTypeId, ambiance: AmbianceId, night: boolean): MutationOdd[] {
  const byGroup = new Map<string, MutationDef[]>();
  for (const m of Object.values(MUTATIONS)) {
    const list = byGroup.get(m.group) ?? [];
    list.push(m);
    byGroup.set(m.group, list);
  }
  const out: MutationOdd[] = [];
  for (const list of byGroup.values()) {
    let cumulative = 0;
    for (const m of list) {
      const raw = rawMutationChance(m, eggType, ambiance, night);
      const effective = Math.max(0, Math.min(raw, 1 - cumulative));
      cumulative += effective;
      out.push({ mutationId: m.id, probability: effective, group: m.group });
    }
  }
  return out;
}

/** Probabilité d'obtenir au moins une mutation. */
export function anyMutationChance(eggType: EggTypeId, ambiance: AmbianceId, night: boolean): number {
  const odds = mutationOdds(eggType, ambiance, night);
  const groups = new Map<string, number>();
  for (const o of odds) groups.set(o.group, (groups.get(o.group) ?? 0) + o.probability);
  let none = 1;
  for (const p of groups.values()) none *= 1 - p;
  return 1 - none;
}
