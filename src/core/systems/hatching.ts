import { BALANCE } from '@data/balance';
import { assertGame } from '../errors';
import type { GameEvent } from '../events';
import { weightedPick } from '../rng';
import { isNight } from '../time';
import type { ActionContext, GameState, MutationId } from '../types';
import { createCreature } from './creatures';
import { registerInDex } from './dex';
import { isReady } from './incubation';
import { mutationOdds, speciesOdds } from './odds';

/** Tire les mutations : un tirage par groupe, d'après les probabilités effectives de odds.ts. */
export function rollMutations(eggType: string, ambiance: string, night: boolean, ctx: ActionContext): MutationId[] {
  const odds = mutationOdds(eggType, ambiance, night);
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
  assertGame(slot && slot.egg, 'slot_empty', 'Cet incubateur est vide.');
  assertGame(isReady(slot, ctx.now), 'not_ready', 'Cet œuf n\'est pas encore prêt.');
  assertGame(draft.creatures.length < BALANCE.maxCreatures, 'sanctuary_full',
    `Ton sanctuaire est plein (${BALANCE.maxCreatures} créatures). Libère une créature pour faire de la place.`);

  const egg = slot.egg;
  const night = isNight(ctx.hour);
  const speciesId = weightedPick(ctx.rng, speciesOdds(egg.type).map((o) => ({ value: o.speciesId, weight: o.probability })));
  const mutations = rollMutations(egg.type, slot.ambiance, night, ctx);

  const creature = createCreature(draft, speciesId, mutations, { kind: 'egg', eggType: egg.type, ambiance: slot.ambiance, night }, ctx);
  draft.creatures.push(creature);
  slot.egg = null;
  slot.startedAt = 0;
  slot.readyAt = 0;
  draft.stats.eggsHatched += 1;

  const reg = registerInDex(draft, creature, ctx);
  events.push({ type: 'hatched', creature: structuredClone(creature), ...reg });
}
