import { creatureCap } from './buildings';
import { MUTATIONS } from '@data/mutations';
import { assertGame } from '../errors';
import type { GameEvent } from '../events';
import { weightedPick } from '../rng';
import { isNight } from '../time';
import type { ActionContext, GameState, MutationId } from '../types';
import { createCreature } from './creatures';
import { registerInDex } from './dex';
import { isReady } from './incubation';
import { mutationOdds, speciesOdds } from './odds';
import { tr } from '../../i18n';

/** Tire les mutations : un tirage par groupe, d'après les probabilités effectives de odds.ts. */
export function rollMutations(eggType: string, ambiance: string, night: boolean, ctx: ActionContext, takenGroups: Set<string> = new Set()): MutationId[] {
  const odds = mutationOdds(eggType, ambiance, night).filter((o) => !takenGroups.has(o.group));
  const groups = new Map<string, typeof odds>();
  for (const o of odds) groups.set(o.group, [...(groups.get(o.group) ?? []), o]);
  const result: MutationId[] = [];
  for (const list of groups.values()) {
    const r = ctx.rng.next();
    let cumulative = 0;
    for (const o of list) {
      cumulative += o.probability;
      if (r < cumulative) {
        result.push(o.mutationId);
        break;
      }
    }
  }
  return result;
}

export function hatch(draft: GameState, slotIndex: number, ctx: ActionContext, events: GameEvent[]): void {
  const slot = draft.incubators[slotIndex];
  assertGame(slot && slot.egg, 'slot_empty', tr('Cet incubateur est vide.'));
  assertGame(isReady(slot, ctx.now), 'not_ready', tr('Cet œuf n\'est pas encore prêt.'));
  assertGame(draft.creatures.length < creatureCap(draft), 'sanctuary_full',
    tr('Ton sanctuaire est plein ({p0} créatures). Agrandis les Nichoirs ou libère une créature.', { p0: creatureCap(draft) }));

  const egg = slot.egg;
  const night = isNight(ctx.hour);
  let creature;
  const g = egg.genetics;
  if (g) {
    // Œuf génétique : espèce, gènes et mutations héritées fixés lors de la fusion ;
    // l'ambiance peut encore ajouter des mutations dans les groupes restés libres.
    const taken = new Set(g.mutations.map((m) => MUTATIONS[m]?.group).filter((x): x is NonNullable<typeof x> => !!x));
    const mutations = [...g.mutations, ...rollMutations(egg.type, slot.ambiance, night, ctx, taken)];
    creature = createCreature(draft, g.speciesId, mutations, { kind: 'breeding', parents: g.parents, ambiance: slot.ambiance, night }, ctx, { genes: g.genes, generation: g.generation });
    if (g.recipeId && !draft.recipesFound.includes(g.recipeId)) draft.recipesFound.push(g.recipeId);
  } else {
    const speciesId = weightedPick(ctx.rng, speciesOdds(egg.type).map((o) => ({ value: o.speciesId, weight: o.probability })));
    const mutations = rollMutations(egg.type, slot.ambiance, night, ctx);
    creature = createCreature(draft, speciesId, mutations, { kind: 'egg', eggType: egg.type, ambiance: slot.ambiance, night }, ctx);
  }
  draft.creatures.push(creature);
  slot.egg = null;
  slot.startedAt = 0;
  slot.readyAt = 0;
  draft.stats.eggsHatched += 1;

  const reg = registerInDex(draft, creature, ctx);
  events.push({ type: 'hatched', creature: structuredClone(creature), ...reg });
}
