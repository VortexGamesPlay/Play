import { BALANCE } from '@data/balance';
import { EGGS } from '@data/eggs';
import { ITEMS } from '@data/items';
import type { Reward } from '../content';
import { GameError, assertGame } from '../errors';
import type { GameEvent } from '../events';
import type { ActionContext, CurrencyId, GameState } from '../types';
import { addEgg } from './inventory';
import { tr } from '../../i18n';

/** Noms des monnaies, traduits à chaque lecture (la langue peut changer en cours de partie). */
export const CURRENCY_NAMES: Record<CurrencyId, string> = {
  get coins() { return tr('pièces'); },
  get crystals() { return tr('cristaux'); },
  get essence() { return tr('essence'); },
};

function log(draft: GameState, currency: CurrencyId, delta: number, reason: string, now: number) {
  draft.ledger.push({ at: now, currency, delta, balance: draft.wallet[currency], reason });
  if (draft.ledger.length > BALANCE.ledgerSize) draft.ledger.splice(0, draft.ledger.length - BALANCE.ledgerSize);
}

export function grant(draft: GameState, currency: CurrencyId, amount: number, reason: string, now: number): void {
  assertGame(Number.isInteger(amount) && amount >= 0, 'invalid_amount', tr('Montant invalide.'));
  if (amount === 0) return;
  draft.wallet[currency] += amount;
  log(draft, currency, amount, reason, now);
}

export function canAfford(state: GameState, currency: CurrencyId, amount: number): boolean {
  return state.wallet[currency] >= amount;
}

export function spend(draft: GameState, currency: CurrencyId, amount: number, reason: string, now: number): void {
  assertGame(Number.isInteger(amount) && amount > 0, 'invalid_amount', tr('Montant invalide.'));
  if (!canAfford(draft, currency, amount)) {
    throw new GameError('insufficient_funds', tr('Il te manque {p0} {p1}.', { p0: amount - draft.wallet[currency], p1: CURRENCY_NAMES[currency] }));
  }
  draft.wallet[currency] -= amount;
  log(draft, currency, -amount, reason, now);
}

/** Distribue une récompense composite (monnaies, objets, œufs). */
export function grantReward(draft: GameState, reward: Reward, reason: string, ctx: ActionContext, events: GameEvent[]): void {
  if (reward.coins) grant(draft, 'coins', reward.coins, reason, ctx.now);
  if (reward.crystals) grant(draft, 'crystals', reward.crystals, reason, ctx.now);
  if (reward.essence) grant(draft, 'essence', reward.essence, reason, ctx.now);
  for (const [item, qty] of Object.entries(reward.items ?? {})) {
    if (!ITEMS[item] || !qty) continue;
    draft.inventory[item] = (draft.inventory[item] ?? 0) + qty;
  }
  for (const egg of reward.eggs ?? []) {
    if (EGGS[egg]) addEgg(draft, egg, reason, ctx.now, { ignoreCap: true });
  }
  events.push({ type: 'reward', reason, reward });
}
