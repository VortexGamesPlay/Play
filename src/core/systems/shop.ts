import { AMBIANCES } from '@data/ambiances';
import { EGGS } from '@data/eggs';
import { ITEMS } from '@data/items';
import { SHOP_OFFERS } from '@data/shop';
import { DECORATIONS } from '@data/buildings';
import type { ShopOffer } from '../content';
import { GameError, assertGame } from '../errors';
import type { GameEvent } from '../events';
import type { ActionContext, GameState } from '../types';
import { dexCount } from './dex';
import { canAfford, spend } from './economy';
import { addIncubator } from './incubation';
import { addEgg, addItem, eggStorageFull } from './inventory';

export function offerLabel(o: ShopOffer): string {
  switch (o.kind) {
    case 'egg': return EGGS[o.ref]!.name;
    case 'item': return `${ITEMS[o.ref]!.name} ×${o.quantity}`;
    case 'incubator_slot': return `Incubateur n°${o.slotNumber}`;
    case 'ambiance': return `Module « ${AMBIANCES[o.ref]!.name} »`;
    case 'decoration': return DECORATIONS.find((d) => d.id === o.ref)?.name ?? o.ref;
  }
}

export type OfferStatus =
  | { state: 'available' }
  | { state: 'locked'; reason: string }
  | { state: 'owned' }
  | { state: 'unaffordable' };

export function offerStatus(state: GameState, o: ShopOffer): OfferStatus {
  if (o.kind === 'incubator_slot' && state.incubators.length >= o.slotNumber) return { state: 'owned' };
  if (o.kind === 'ambiance' && state.unlocks.ambiances.includes(o.ref)) return { state: 'owned' };
  if (o.kind === 'decoration' && o.ref in state.sanctuary.decorations) return { state: 'owned' };
  if (o.requires?.dexCount && dexCount(state) < o.requires.dexCount) {
    return { state: 'locked', reason: `Découvre ${o.requires.dexCount} espèces` };
  }
  if (o.kind === 'incubator_slot' && state.incubators.length !== o.slotNumber - 1) {
    return { state: 'locked', reason: `Achète d'abord l'incubateur n°${o.slotNumber - 1}` };
  }
  if (o.kind === 'egg' && eggStorageFull(state)) return { state: 'locked', reason: 'Panier d\'œufs plein' };
  if (!canAfford(state, o.price.currency, o.price.amount)) return { state: 'unaffordable' };
  return { state: 'available' };
}

export function buy(draft: GameState, offerId: string, ctx: ActionContext, events: GameEvent[]): void {
  const o = SHOP_OFFERS.find((x) => x.id === offerId);
  assertGame(o, 'unknown_offer', 'Offre introuvable.');
  const status = offerStatus(draft, o);
  if (status.state === 'owned') throw new GameError('owned', 'Tu possèdes déjà cet article.');
  if (status.state === 'locked') throw new GameError('locked', `Article verrouillé : ${status.reason}.`);
  const label = offerLabel(o);
  spend(draft, o.price.currency, o.price.amount, `Boutique : ${label}`, ctx.now);
  switch (o.kind) {
    case 'egg': addEgg(draft, o.ref, 'Boutique', ctx.now); break;
    case 'item': addItem(draft, o.ref, o.quantity); break;
    case 'incubator_slot': addIncubator(draft); break;
    case 'ambiance': draft.unlocks.ambiances.push(o.ref); break;
    case 'decoration': draft.sanctuary.decorations[o.ref] = true; break;
  }
  draft.stats.purchases += 1;
  events.push({ type: 'purchased', offerId, label });
}
