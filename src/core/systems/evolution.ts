import type { EvolutionCondition, EvolutionDef } from '../content';
import { assertGame } from '../errors';
import type { GameEvent } from '../events';
import { isNight } from '../time';
import type { ActionContext, CreatureInstance, GameState } from '../types';
import { bodyMetrics, findCreature, getSpecies } from './creatures';
import { registerInDex } from './dex';
import { removeItem } from './inventory';
import { assertPresent, isAway } from './exploration';
import { sanctuaryWeather } from './weather';
import { tr } from '../../i18n';

export interface ConditionCheck {
  condition: EvolutionCondition;
  met: boolean;
  /** Progression lisible, ex. « 5/8 ». */
  progress?: string;
}

export interface EvolutionOption {
  def: EvolutionDef;
  checks: ConditionCheck[];
  ready: boolean;
}

export function checkCondition(state: GameState, c: CreatureInstance, cond: EvolutionCondition, now: number): ConditionCheck {
  const hour = new Date(now).getHours();
  switch (cond.type) {
    case 'level': return { condition: cond, met: c.level >= cond.value, progress: `${Math.min(c.level, cond.value)}/${cond.value}` };
    case 'affection': return { condition: cond, met: c.affection >= cond.value, progress: `${Math.min(c.affection, cond.value)}/${cond.value}` };
    case 'timeOfDay': return { condition: cond, met: cond.value === 'night' ? isNight(hour) : !isNight(hour) };
    case 'item': {
      const have = state.inventory[cond.item] ?? 0;
      return { condition: cond, met: have > 0, progress: `${Math.min(have, 1)}/1` };
    }
    case 'diet': {
      const n = c.diet[cond.tag] ?? 0;
      return { condition: cond, met: n >= cond.count, progress: `${Math.min(n, cond.count)}/${cond.count}` };
    }
    case 'mutation': return { condition: cond, met: c.mutations.includes(cond.mutation) };
    case 'ambiance': return { condition: cond, met: c.origin.kind !== 'starter' && c.origin.ambiance === cond.ambiance };
    case 'weather': return { condition: cond, met: sanctuaryWeather(now).id === cond.weather };
  }
}

/** Toutes les branches d'évolution d'une créature, avec l'état de chaque condition. */
export function evolutionOptions(state: GameState, c: CreatureInstance, now: number): EvolutionOption[] {
  return getSpecies(c.speciesId).evolutions.map((def) => {
    const checks = def.conditions.map((cond) => checkCondition(state, c, cond, now));
    return { def, checks, ready: checks.every((x) => x.met) };
  });
}

export function canEvolve(state: GameState, c: CreatureInstance, now: number): boolean {
  return !isAway(state, c.uid) && evolutionOptions(state, c, now).some((o) => o.ready);
}

export function evolve(draft: GameState, uid: string, to: string, ctx: ActionContext, events: GameEvent[]): void {
  const c = findCreature(draft, uid);
  assertPresent(draft, uid);
  const option = evolutionOptions(draft, c, ctx.now).find((o) => o.def.to === to);
  assertGame(option, 'no_evolution', tr('Cette créature ne peut pas évoluer vers cette espèce.'));
  assertGame(option.ready, 'evolution_locked', tr('Toutes les conditions d\'évolution ne sont pas remplies.'));
  for (const cond of option.def.conditions) {
    if (cond.type === 'item') removeItem(draft, cond.item, 1);
  }
  const from = c.speciesId;
  c.speciesId = to;
  Object.assign(c, bodyMetrics(getSpecies(to), c.genes, c.mutations));
  c.affection = Math.min(100, c.affection + 10);
  draft.stats.evolutions += 1;
  const reg = registerInDex(draft, c, ctx);
  events.push({ type: 'evolved', uid, from, to, newSpecies: reg.newSpecies, crystalsAwarded: reg.crystalsAwarded });
}
