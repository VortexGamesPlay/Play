import { BALANCE } from '@data/balance';
import { MUTATIONS } from '@data/mutations';
import { RARITIES } from '@data/rarities';
import { assertGame } from '../errors';
import type { GameEvent } from '../events';
import { randInt, weightedPick } from '../rng';
import type { ActionContext, CreatureInstance, EggGenetics, GameState, Genes, MutationId } from '../types';
import { displayName, findCreature, getSpecies } from './creatures';
import { spend } from './economy';
import { addEgg, eggStorageFull } from './inventory';
import { breedingOdds } from './odds';
import { assertPresent } from './exploration';
import { tr } from '../../i18n';

const B = BALANCE.breeding;

/** Raison pour laquelle une créature ne peut pas se reproduire maintenant (null si elle le peut). */
export function breedBlocker(c: CreatureInstance, now: number): string | null {
  if (c.level < B.minLevel) return `Niveau ${B.minLevel} requis`;
  if (c.affection < B.minAffection) return `Affection ${B.minAffection} requise`;
  if (c.breedCount >= B.maxBreeds) return 'Fertilité épuisée';
  if (c.breedReadyAt > now) return 'Se repose';
  return null;
}

export function breedingCost(a: CreatureInstance, b: CreatureInstance, stabilize: boolean): { coins: number; essence: number } {
  const tiers = RARITIES[getSpecies(a.speciesId).rarity].tier + RARITIES[getSpecies(b.speciesId).rarity].tier;
  return { coins: B.coins, essence: B.essenceBase + B.essencePerTier * tiers + (stabilize ? B.stabilizerEssence : 0) };
}

export type Compatibility = 'secret' | 'harmonieuse' | 'bonne';

export function compatibility(a: CreatureInstance, b: CreatureInstance): Compatibility {
  if (breedingOdds(a.speciesId, b.speciesId).some((o) => o.recipeId)) return 'secret';
  return getSpecies(a.speciesId).element === getSpecies(b.speciesId).element ? 'harmonieuse' : 'bonne';
}

/** Probabilité de transmission de chaque mutation présente chez les parents (avant incompatibilités de groupe). */
export function inheritanceOdds(a: CreatureInstance, b: CreatureInstance, stabilize: boolean): { mutationId: MutationId; probability: number }[] {
  const p = stabilize ? B.stabilizedInheritChance : B.inheritChance;
  const ids = [...new Set([...a.mutations, ...b.mutations])];
  return ids.map((m) => {
    const copies = Number(a.mutations.includes(m)) + Number(b.mutations.includes(m));
    return { mutationId: m, probability: 1 - Math.pow(1 - p, copies) };
  });
}

function clampGene(v: number) { return Math.max(0, Math.min(31, v)); }

/** Chaque gène vient d'un des deux parents, avec une légère dérive et parfois un bond. */
export function inheritGenes(a: Genes, b: Genes, ctx: ActionContext): Genes {
  const stat = (k: 'hp' | 'atk' | 'def' | 'spd') => {
    const base = ctx.rng.next() < 0.5 ? a[k] : b[k];
    const surge = ctx.rng.next() < B.geneSurgeChance ? 5 : 0;
    return clampGene(base + randInt(ctx.rng, -B.geneDrift, B.geneDrift) + surge);
  };
  return {
    hp: stat('hp'), atk: stat('atk'), def: stat('def'), spd: stat('spd'),
    hue: Math.max(-12, Math.min(12, Math.round((a.hue + b.hue) / 2 + randInt(ctx.rng, -4, 4)))),
    size: Math.max(0, Math.min(1, Math.round(((a.size + b.size) / 2 + (ctx.rng.next() - 0.5) * 0.2) * 100) / 100)),
  };
}

function inheritMutations(a: CreatureInstance, b: CreatureInstance, stabilize: boolean, ctx: ActionContext): MutationId[] {
  const out: MutationId[] = [];
  const groups = new Set<string>();
  for (const o of inheritanceOdds(a, b, stabilize)) {
    const g = MUTATIONS[o.mutationId]?.group;
    if (!g || groups.has(g)) continue;
    if (ctx.rng.next() < o.probability) { out.push(o.mutationId); groups.add(g); }
  }
  return out;
}

export function breed(draft: GameState, uidA: string, uidB: string, stabilize: boolean, ctx: ActionContext, events: GameEvent[]): void {
  assertGame(uidA !== uidB, 'same_parent', tr('Il faut deux créatures différentes.'));
  const a = findCreature(draft, uidA);
  const b = findCreature(draft, uidB);
  assertPresent(draft, uidA);
  assertPresent(draft, uidB);
  for (const c of [a, b]) {
    const why = breedBlocker(c, ctx.now);
    assertGame(!why, 'breed_blocked', tr('{p0} ne peut pas participer : {why}.', { p0: displayName(c), why: why ?? '' }));
  }
  assertGame(!eggStorageFull(draft), 'egg_storage_full', tr('Ton panier d\'œufs est plein.'));

  const cost = breedingCost(a, b, stabilize);
  spend(draft, 'essence', cost.essence, tr('Laboratoire : fusion génétique'), ctx.now);
  spend(draft, 'coins', cost.coins, tr('Laboratoire : fusion génétique'), ctx.now);

  const outcome = weightedPick(ctx.rng, breedingOdds(a.speciesId, b.speciesId).map((o) => ({ value: o, weight: o.probability })));
  const genetics: EggGenetics = {
    speciesId: outcome.speciesId,
    genes: inheritGenes(a.genes, b.genes, ctx),
    mutations: inheritMutations(a, b, stabilize, ctx),
    generation: Math.max(a.generation, b.generation) + 1,
    parents: [a.speciesId, b.speciesId],
    parentNames: [displayName(a), displayName(b)],
    recipeId: outcome.recipeId,
  };
  const egg = addEgg(draft, 'hybride', tr('Fusion de {p0} et {p1}', { p0: displayName(a), p1: displayName(b) }), ctx.now);
  egg.genetics = genetics;

  for (const c of [a, b]) {
    c.breedCount += 1;
    c.breedReadyAt = ctx.now + B.cooldownMs;
  }
  draft.stats.breedings += 1;
  events.push({ type: 'bred', eggUid: egg.uid, parents: [uidA, uidB] });
}
