import { eggCap } from './buildings';
import { EGGS } from '@data/eggs';
import { ITEMS } from '@data/items';
import { assertGame } from '../errors';
import { nextUid } from '../ids';
import type { EggInstance, EggTypeId, GameState, ItemId } from '../types';
import { tr } from '../../i18n';

export function addItem(draft: GameState, item: ItemId, qty: number): void {
  assertGame(!!ITEMS[item], 'unknown_item', tr('Objet inconnu.'));
  assertGame(Number.isInteger(qty) && qty > 0, 'invalid_qty', tr('Quantité invalide.'));
  draft.inventory[item] = (draft.inventory[item] ?? 0) + qty;
}

export function removeItem(draft: GameState, item: ItemId, qty: number): void {
  const have = draft.inventory[item] ?? 0;
  assertGame(have >= qty, 'missing_item', tr('Tu n\'as pas assez de {p0}.', { p0: ITEMS[item]?.name ?? 'cet objet' }));
  const left = have - qty;
  if (left === 0) delete draft.inventory[item];
  else draft.inventory[item] = left;
}

export function eggStorageFull(state: GameState): boolean {
  return state.eggs.length >= eggCap(state);
}

export function addEgg(draft: GameState, type: EggTypeId, source: string, now: number, opts: { ignoreCap?: boolean } = {}): EggInstance {
  assertGame(!!EGGS[type], 'unknown_egg', tr('Œuf inconnu.'));
  if (!opts.ignoreCap) {
    assertGame(!eggStorageFull(draft), 'egg_storage_full', tr('Ton panier d\'œufs est plein ({p0} max). Agrandis le Grenier à œufs.', { p0: eggCap(draft) }));
  }
  const egg: EggInstance = { uid: nextUid(draft, 'egg'), type, obtainedAt: now, source };
  draft.eggs.push(egg);
  draft.stats.eggsObtained += 1;
  return egg;
}
