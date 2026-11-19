import { PRODUCT_BY_ID } from '@data/products';
import { GameError, assertGame } from '../errors';
import type { GameEvent } from '../events';
import type { ActionContext, GameState, PurchaseRecord } from '../types';
import { grantReward } from './economy';
import { currentSeason } from './season';

/** Total dépensé pendant le mois civil de `now` (centimes). */
export function spentThisMonth(state: GameState, now: number): number {
  const d = new Date(now);
  return state.premium.purchases
    .filter((p) => { const x = new Date(p.at); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth(); })
    .reduce((s, p) => s + p.amountCents, 0);
}

export function ownsProduct(state: GameState, productId: string): boolean {
  return state.premium.purchases.some((p) => p.productId === productId);
}

/** Raison pour laquelle un produit ne peut pas être acheté maintenant (null = achetable). */
export function purchaseBlocker(state: GameState, productId: string, now: number, dayKey: string): string | null {
  const p = PRODUCT_BY_ID[productId];
  if (!p) return 'Produit inconnu';
  if (p.once && ownsProduct(state, productId)) return 'Déjà acheté';
  if (p.grants.season) {
    const s = currentSeason(dayKey);
    if (!s || s.id !== p.grants.season) return 'Saison terminée';
  }
  const limit = state.premium.spendLimitCents;
  if (limit !== null && spentThisMonth(state, now) + p.priceCents > limit) return 'Limite de dépenses mensuelle atteinte';
  return null;
}

/**
 * Applique un achat dont le paiement a été CONFIRMÉ par le prestataire (serveur PayPal, magasin d'applications)
 * ou simulé en mode test. Idempotent : un même numéro de commande n'est jamais appliqué deux fois.
 * Phase 6 : le serveur deviendra la source de vérité et appliquera lui-même les achats à la sauvegarde.
 */
export function applyPurchase(draft: GameState, rec: Omit<PurchaseRecord, 'at'>, ctx: ActionContext, events: GameEvent[]): void {
  const p = PRODUCT_BY_ID[rec.productId];
  assertGame(p, 'unknown_product', 'Produit inconnu.');
  assertGame(rec.orderId && typeof rec.orderId === 'string', 'bad_order', 'Commande invalide.');
  if (draft.premium.purchases.some((x) => x.orderId === rec.orderId)) throw new GameError('already_applied', 'Cet achat a déjà été pris en compte.');
  assertGame(rec.amountCents === p.priceCents, 'bad_amount', 'Le montant payé ne correspond pas au prix du produit.');
  if (p.once) assertGame(!ownsProduct(draft, p.id), 'owned', 'Tu possèdes déjà cet article.');
  draft.premium.purchases.push({ ...rec, at: ctx.now });
  const g = p.grants;
  for (const d of g.decorations ?? []) if (!(d in draft.sanctuary.decorations)) draft.sanctuary.decorations[d] = true;
  for (const t of g.themes ?? []) if (!draft.premium.ownedThemes.includes(t)) draft.premium.ownedThemes.push(t);
  if (g.season && draft.season.id === g.season) draft.season.premium = true;
  grantReward(draft, { crystals: g.crystals, items: g.items }, `Achat : ${p.name}`, ctx, events);
}

export function setSpendLimit(draft: GameState, cents: number | null): void {
  assertGame(cents === null || (Number.isInteger(cents) && cents >= 0 && cents <= 100000), 'bad_limit', 'Limite invalide.');
  draft.premium.spendLimitCents = cents;
}
