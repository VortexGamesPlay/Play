import { BALANCE } from '@data/balance';
import { assertGame } from '../errors';
import type { GameEvent } from '../events';
import { HOUR } from '../time';
import type { ActionContext, GameState } from '../types';
import { harvestRatePerHour } from './creatures';
import { grant } from './economy';

/** Pièces produites passivement par les créatures depuis la dernière récolte (plafonné). */
export function pendingHarvest(state: GameState, now: number): number {
  let total = 0;
  for (const c of state.creatures) {
    const from = Math.max(state.sanctuary.lastHarvestAt, c.hatchedAt);
    const elapsed = Math.min(Math.max(0, now - from), BALANCE.harvestCapMs);
    total += (harvestRatePerHour(c) * elapsed) / HOUR;
  }
  return Math.floor(total);
}

export function totalHarvestRate(state: GameState): number {
  return Math.round(state.creatures.reduce((s, c) => s + harvestRatePerHour(c), 0));
}

export function harvest(draft: GameState, ctx: ActionContext, events: GameEvent[]): void {
  const coins = pendingHarvest(draft, ctx.now);
  assertGame(coins > 0, 'nothing_to_harvest', 'Rien à récolter pour l\'instant.');
  grant(draft, 'coins', coins, 'Récolte du sanctuaire', ctx.now);
  draft.sanctuary.lastHarvestAt = ctx.now;
  draft.stats.harvests += 1;
  draft.stats.coinsHarvested += coins;
  events.push({ type: 'harvested', coins });
}
