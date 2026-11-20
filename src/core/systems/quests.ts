import { MAIN_QUESTS } from '@data/quests';
import type { QuestDef } from '../content';
import { assertGame } from '../errors';
import type { GameEvent } from '../events';
import type { ActionContext, GameState } from '../types';
import { dexCount, variantCount } from './dex';
import { grantReward } from './economy';
import { unlockedBiomeCount } from './exploration';
import { totalBuildingLevels } from './buildings';
import { tr } from '../../i18n';

export function questProgress(state: GameState, q: QuestDef): { current: number; target: number; done: boolean } {
  const g = q.goal;
  let current = 0;
  switch (g.kind) {
    case 'stat': current = state.stats[g.stat]; break;
    case 'dexCount': current = dexCount(state); break;
    case 'creatureCount': current = state.creatures.length; break;
    case 'maxLevel': current = state.creatures.reduce((m, c) => Math.max(m, c.level), 0); break;
    case 'variantCount': current = variantCount(state); break;
    case 'incubators': current = state.incubators.length; break;
    case 'recipeCount': current = state.recipesFound.length; break;
    case 'biomeExpeditions': current = state.exploration.expeditionsByBiome[g.biome] ?? 0; break;
    case 'biomesUnlocked': current = unlockedBiomeCount(state); break;
    case 'secretsFound': current = state.exploration.secretsFound.length; break;
    case 'buildingLevels': current = totalBuildingLevels(state); break;
  }
  return { current: Math.min(current, g.target), target: g.target, done: current >= g.target };
}

/** Quête principale active = première quête non réclamée. */
export function activeQuest(state: GameState): QuestDef | null {
  return MAIN_QUESTS.find((q) => !state.quests.claimed.includes(q.id)) ?? null;
}

export function claimQuest(draft: GameState, questId: string, ctx: ActionContext, events: GameEvent[]): void {
  const q = activeQuest(draft);
  assertGame(q && q.id === questId, 'quest_unavailable', tr('Cette quête n\'est pas disponible.'));
  assertGame(questProgress(draft, q).done, 'quest_incomplete', tr('Objectif pas encore atteint.'));
  draft.quests.claimed.push(q.id);
  grantReward(draft, q.reward, `Quête : ${q.title}`, ctx, events);
}
