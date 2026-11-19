import { BALANCE } from '@data/balance';
import type { Reward } from '../content';
import { assertGame } from '../errors';
import type { GameEvent } from '../events';
import { previousDayKey } from '../time';
import type { ActionContext, GameState } from '../types';
import { grantReward } from './economy';

export function canClaimDaily(state: GameState, dayKey: string): boolean {
  return state.daily.lastClaimDay !== dayKey;
}

/** Série en cours si le joueur réclame aujourd'hui. */
export function nextStreak(state: GameState, dayKey: string): number {
  return state.daily.lastClaimDay === previousDayKey(dayKey) ? state.daily.streak + 1 : 1;
}

export function dailyReward(streak: number): Reward {
  const d = BALANCE.daily;
  const bonusDays = Math.min(streak - 1, d.maxStreakBonusDays);
  const reward: Reward = { coins: d.baseCoins + bonusDays * d.coinsPerStreakDay, eggs: [d.egg] };
  if (streak % 7 === 0) reward.crystals = d.weeklyCrystals;
  return reward;
}

export function claimDaily(draft: GameState, ctx: ActionContext, events: GameEvent[]): void {
  assertGame(canClaimDaily(draft, ctx.dayKey), 'daily_claimed', 'Récompense du jour déjà récupérée. Reviens demain !');
  const streak = nextStreak(draft, ctx.dayKey);
  draft.daily = { lastClaimDay: ctx.dayKey, streak };
  draft.stats.dailyClaims += 1;
  grantReward(draft, dailyReward(streak), `Récompense quotidienne (jour ${streak})`, ctx, events);
}
