import { BALANCE } from '@data/balance';
import { ITEMS } from '@data/items';
import { assertGame } from '../errors';
import type { GameEvent } from '../events';
import type { ActionContext, GameState, ItemId } from '../types';
import { addXp, findCreature, getSpecies } from './creatures';
import { removeItem } from './inventory';
import { tr } from '../../i18n';

export function isFavoriteFood(speciesId: string, item: ItemId): boolean {
  const def = ITEMS[item];
  if (!def) return false;
  return def.tags.some((t) => getSpecies(speciesId).favoriteFood.includes(t));
}

export function feed(draft: GameState, uid: string, item: ItemId, ctx: ActionContext, events: GameEvent[]): void {
  const def = ITEMS[item];
  assertGame(def && def.kind === 'food', 'not_food', tr('Cet objet ne se mange pas.'));
  const c = findCreature(draft, uid);
  assertGame(c.level < BALANCE.maxLevel || c.affection < BALANCE.maxAffection, 'maxed',
    tr('Cette créature est déjà au maximum de son niveau et de son affection.'));
  removeItem(draft, item, 1);
  const favorite = isFavoriteFood(c.speciesId, item);
  const xp = Math.round(def.xp * (favorite ? BALANCE.favoriteFoodMultiplier : 1));
  c.affection = Math.min(BALANCE.maxAffection, c.affection + def.affection * (favorite ? 2 : 1));
  for (const tag of def.tags) c.diet[tag] = (c.diet[tag] ?? 0) + 1;
  draft.stats.creaturesFed += 1;
  addXp(draft, c, xp, events);
  events.push({ type: 'fed', uid, xp, favorite });
  void ctx;
}
