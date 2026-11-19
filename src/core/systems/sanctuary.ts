import { BALANCE } from '@data/balance';
import type { Reward } from '../content';
import { assertGame } from '../errors';
import type { GameEvent } from '../events';
import { HOUR } from '../time';
import type { ActionContext, CreatureInstance, GameState } from '../types';
import { essencePerHour, gardenLevel, zoneBonus } from './buildings';
import { getSpecies, harvestRatePerHour } from './creatures';
import { grant } from './economy';
import { isAway } from './exploration';

/** Rendement horaire d'une créature dans le sanctuaire (bonus de zone compris). */
export function creatureRate(state: GameState, c: CreatureInstance): number {
  return harvestRatePerHour(c, zoneBonus(state, getSpecies(c.speciesId).element));
}

/** Pièces produites passivement par les créatures présentes depuis la dernière récolte (plafonné). */
export function pendingHarvest(state: GameState, now: number): number {
  let total = 0;
  for (const c of state.creatures) {
    if (isAway(state, c.uid)) continue;
    const from = Math.max(state.sanctuary.lastHarvestAt, c.hatchedAt);
    const elapsed = Math.min(Math.max(0, now - from), BALANCE.harvestCapMs);
    total += (creatureRate(state, c) * elapsed) / HOUR;
  }
  return Math.floor(total);
}

/** Production des bâtiments (jardin, observatoire) depuis la dernière récolte. */
export function pendingProduce(state: GameState, now: number): Reward {
  const hours = Math.min(Math.max(0, now - state.sanctuary.lastHarvestAt), BALANCE.harvestCapMs) / HOUR;
  const out: Reward = { items: {} };
  const essence = Math.floor(essencePerHour(state) * hours);
  if (essence > 0) out.essence = essence;
  const g = gardenLevel(state);
  if (g > 0) {
    const fruits = Math.floor((g * hours) / 2);
    if (fruits > 0) out.items!.fruit_rose = fruits;
    const seeds = g >= 3 ? Math.floor(((g - 2) * hours) / 3) : 0;
    if (seeds > 0) out.items!.graine_soleil = seeds;
  }
  return out;
}

export function totalHarvestRate(state: GameState): number {
  return Math.round(state.creatures.filter((c) => !isAway(state, c.uid)).reduce((s, c) => s + creatureRate(state, c), 0));
}

export function harvest(draft: GameState, ctx: ActionContext, events: GameEvent[]): void {
  const coins = pendingHarvest(draft, ctx.now);
  const produce = pendingProduce(draft, ctx.now);
  const hasProduce = (produce.essence ?? 0) > 0 || Object.keys(produce.items ?? {}).length > 0;
  assertGame(coins > 0 || hasProduce, 'nothing_to_harvest', 'Rien à récolter pour l\'instant.');
  if (coins > 0) grant(draft, 'coins', coins, 'Récolte du sanctuaire', ctx.now);
  if (produce.essence) grant(draft, 'essence', produce.essence, 'Observatoire de recherche', ctx.now);
  for (const [item, q] of Object.entries(produce.items ?? {})) draft.inventory[item] = (draft.inventory[item] ?? 0) + (q ?? 0);
  draft.sanctuary.lastHarvestAt = ctx.now;
  draft.stats.harvests += 1;
  draft.stats.coinsHarvested += coins;
  events.push({ type: 'harvested', coins, produce });
}
