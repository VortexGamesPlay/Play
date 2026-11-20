import { ACHIEVEMENTS, DAILY_MISSIONS, SIDE_QUESTS, WEEKLY_MISSIONS } from '@data/missions';
import type { MissionDef } from '../content';
import { assertGame } from '../errors';
import type { GameEvent } from '../events';
import { createRng } from '../rng';
import { dayKeyOf } from '../time';
import type { ActionContext, GameState } from '../types';
import { grantReward } from './economy';
import { questProgress } from './quests';
import { tr } from '../../i18n';

/** Lundi de la semaine (clé hebdomadaire). */
export function weekKeyOf(now: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dayKeyOf(d);
}

function seedOf(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** 3 missions tirées de façon déterministe à partir de la clé de période. */
function pickMissions(pool: MissionDef[], key: string): MissionDef[] {
  const rng = createRng(seedOf(key));
  const list = [...pool];
  const out: MissionDef[] = [];
  while (out.length < 3 && list.length) out.push(list.splice(Math.floor(rng.next() * list.length), 1)[0]!);
  return out;
}

export const dailyMissions = (dayKey: string) => pickMissions(DAILY_MISSIONS, `day:${dayKey}`);
export const weeklyMissions = (weekKey: string) => pickMissions(WEEKLY_MISSIONS, `week:${weekKey}`);

/**
 * Au début de chaque action : si le jour ou la semaine a changé, on photographie les statistiques
 * pour mesurer la progression des nouvelles missions.
 */
export function syncPeriods(draft: GameState, ctx: ActionContext): void {
  const wk = weekKeyOf(ctx.now);
  if (draft.missions.dayKey !== ctx.dayKey) {
    draft.missions.dayKey = ctx.dayKey;
    draft.missions.dayBaseline = { ...draft.stats };
    draft.missions.dayClaimed = [];
  }
  if (draft.missions.weekKey !== wk) {
    draft.missions.weekKey = wk;
    draft.missions.weekBaseline = { ...draft.stats };
    draft.missions.weekClaimed = [];
  }
}

export function missionProgress(state: GameState, m: MissionDef, period: 'day' | 'week', now: number): { current: number; done: boolean; claimed: boolean } {
  const key = period === 'day' ? dayKeyOf(new Date(now)) : weekKeyOf(now);
  const sameKey = period === 'day' ? state.missions.dayKey === key : state.missions.weekKey === key;
  const base = period === 'day' ? state.missions.dayBaseline : state.missions.weekBaseline;
  const current = sameKey && base ? Math.max(0, state.stats[m.stat] - base[m.stat]) : 0;
  const claimed = sameKey && (period === 'day' ? state.missions.dayClaimed : state.missions.weekClaimed).includes(m.id);
  return { current: Math.min(current, m.target), done: current >= m.target, claimed };
}

export function claimMission(draft: GameState, id: string, period: 'day' | 'week', ctx: ActionContext, events: GameEvent[]): void {
  const list = period === 'day' ? dailyMissions(ctx.dayKey) : weeklyMissions(weekKeyOf(ctx.now));
  const m = list.find((x) => x.id === id);
  assertGame(m, 'unknown_mission', tr('Cette mission n\'est pas active.'));
  const p = missionProgress(draft, m, period, ctx.now);
  assertGame(!p.claimed, 'claimed', tr('Récompense déjà récupérée.'));
  assertGame(p.done, 'incomplete', tr('Mission pas encore terminée.'));
  (period === 'day' ? draft.missions.dayClaimed : draft.missions.weekClaimed).push(id);
  grantReward(draft, m.reward, `Mission : ${m.title}`, ctx, events);
}

export function claimAchievement(draft: GameState, id: string, ctx: ActionContext, events: GameEvent[]): void {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  assertGame(a, 'unknown', tr('Succès inconnu.'));
  assertGame(!draft.achievements.includes(id), 'claimed', tr('Succès déjà obtenu.'));
  assertGame(questProgress(draft, { ...a, chapter: '', goal: a.goal }).done, 'incomplete', tr('Succès pas encore accompli.'));
  draft.achievements.push(id);
  grantReward(draft, a.reward, `Succès : ${a.title}`, ctx, events);
}

export function claimSideQuest(draft: GameState, id: string, ctx: ActionContext, events: GameEvent[]): void {
  const q = SIDE_QUESTS.find((x) => x.id === id);
  assertGame(q, 'unknown', tr('Quête inconnue.'));
  assertGame(!draft.sideQuests.includes(id), 'claimed', tr('Quête déjà terminée.'));
  assertGame(questProgress(draft, q).done, 'incomplete', tr('Objectif pas encore atteint.'));
  draft.sideQuests.push(id);
  grantReward(draft, q.reward, `Quête : ${q.title}`, ctx, events);
}
