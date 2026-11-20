import { BUILDING_BY_ID, BUILDINGS, DECORATIONS, THEMES } from '@data/buildings';
import { BIOMES } from '@data/biomes';
import { ITEMS } from '@data/items';
import type { BuildingDef } from '../content';
import { GameError, assertGame } from '../errors';
import type { ActionContext, ElementId, GameState } from '../types';
import { spend } from './economy';
import { removeItem } from './inventory';
import { tr } from '../../i18n';

export function buildingLevel(state: GameState, id: string): number {
  return state.sanctuary.buildings[id] ?? BUILDING_BY_ID[id]?.startLevel ?? 0;
}

function effectValue(state: GameState, kind: BuildingDef['effect']['kind']): number {
  const b = BUILDINGS.find((x) => x.effect.kind === kind)!;
  const lvl = buildingLevel(state, b.id);
  return (b.effect.base ?? 0) + b.effect.perLevel * lvl;
}

export const creatureCap = (state: GameState) => effectValue(state, 'creatureCap');
export const eggCap = (state: GameState) => effectValue(state, 'eggCap');
export const gardenLevel = (state: GameState) => buildingLevel(state, 'jardin');
export const essencePerHour = (state: GameState) => effectValue(state, 'essence');

/** Bonus de production selon les zones (bassin, fournaise) pour un élément. */
export function zoneBonus(state: GameState, element: ElementId): number {
  let bonus = 0;
  for (const b of BUILDINGS) {
    if (b.effect.kind === 'zone' && b.effect.elements?.includes(element)) bonus += b.effect.perLevel * buildingLevel(state, b.id);
  }
  return bonus;
}

export function upgradeCost(state: GameState, id: string) {
  const b = BUILDING_BY_ID[id];
  if (!b) return null;
  const lvl = buildingLevel(state, id);
  return lvl >= b.maxLevel ? null : b.costs[lvl] ?? null;
}

export function upgradeBuilding(draft: GameState, id: string, ctx: ActionContext): void {
  const b = BUILDING_BY_ID[id];
  assertGame(b, 'unknown_building', tr('Bâtiment inconnu.'));
  const cost = upgradeCost(draft, id);
  assertGame(cost, 'max_level', tr('{name} est déjà au niveau maximum.', { name: b.name }));
  for (const [item, qty] of Object.entries(cost.materials)) {
    if ((draft.inventory[item] ?? 0) < (qty ?? 0)) {
      throw new GameError('missing_material', tr('Il manque {p0} × {name}. Explore les biomes pour en trouver.', { p0: (qty ?? 0) - (draft.inventory[item] ?? 0), name: ITEMS[item]?.name }));
    }
  }
  if (cost.coins > 0) spend(draft, 'coins', cost.coins, tr('Construction : {name}', { name: b.name }), ctx.now);
  for (const [item, qty] of Object.entries(cost.materials)) if (qty) removeItem(draft, item, qty);
  draft.sanctuary.buildings[id] = buildingLevel(draft, id) + 1;
  draft.stats.buildingUpgrades += 1;
}

export function totalBuildingLevels(state: GameState): number {
  return BUILDINGS.reduce((s, b) => s + buildingLevel(state, b.id), 0);
}

export function toggleDecoration(draft: GameState, id: string): void {
  assertGame(id in draft.sanctuary.decorations, 'not_owned', tr('Tu ne possèdes pas cette décoration.'));
  draft.sanctuary.decorations[id] = !draft.sanctuary.decorations[id];
}

export function unlockedThemes(state: GameState): string[] {
  const out = new Set(['prairie', ...state.premium.ownedThemes]);
  for (const b of BIOMES) if ((state.exploration.expeditionsByBiome[b.id] ?? 0) > 0) out.add(b.theme);
  return [...out].filter((t) => THEMES[t]);
}

export function setTheme(draft: GameState, theme: string): void {
  assertGame(unlockedThemes(draft).includes(theme), 'theme_locked', tr('Ce terrain se débloque en explorant le biome correspondant.'));
  draft.sanctuary.theme = theme;
}

export const DECORATION_IDS = DECORATIONS.map((d) => d.id);
