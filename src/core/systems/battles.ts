import { BOSSES, LEAGUES, TOWER, type EnemyDef } from '@data/arena';
import { COMMON_SKILLS, ELEMENT_SKILLS } from '@data/skills';
import { SPECIES_LIST } from '@data/species';
import type { Reward } from '../content';
import { replay, type BattleInput, type CombatantInit } from '../combat/engine';
import { GameError, assertGame } from '../errors';
import type { GameEvent } from '../events';
import { createRng } from '../rng';
import type { ActionContext, CreatureInstance, ElementId, GameState, PendingBattle } from '../types';
import { addXp, computeStats, displayName, getSpecies } from './creatures';
import { grantReward } from './economy';
import { isAway } from './exploration';
import { isBiomeUnlocked } from './exploration';
import { BIOME_BY_ID } from '@data/biomes';
import { tr } from '../../i18n';

export const MAX_TEAM = 3;

/** Compétences connues selon l'élément et le niveau. */
export function skillsFor(element: ElementId, level: number): string[] {
  return [...COMMON_SKILLS, ...ELEMENT_SKILLS[element]].filter((s) => level >= s.level).map((s) => s.id);
}

export function combatantFromCreature(c: CreatureInstance, i: number): CombatantInit {
  const sp = getSpecies(c.speciesId);
  const st = computeStats(c);
  return {
    key: `A${i}`, side: 'A', uid: c.uid, speciesId: c.speciesId, name: displayName(c), element: sp.element,
    level: c.level, mutations: c.mutations, hue: c.genes.hue,
    stats: { hp: st.hp, atk: st.atk, def: st.def, spd: st.spd }, skills: skillsFor(sp.element, c.level),
  };
}

export function combatantFromEnemy(d: EnemyDef, i: number): CombatantInit {
  const sp = getSpecies(d.species);
  const fake: CreatureInstance = {
    uid: `enemy${i}`, speciesId: d.species, nickname: null, level: d.level, xp: 0,
    genes: { hp: 16, atk: 16, def: 16, spd: 16, hue: 0, size: 0.5 }, personality: 'curieux', mutations: d.mutations ?? [],
    sizeCm: 0, weightKg: 0, affection: 0, hatchedAt: 0, origin: { kind: 'starter' }, favorite: false, diet: {}, generation: 1, breedCount: 0, breedReadyAt: 0,
  };
  const st = computeStats(fake);
  return {
    key: `B${i}`, side: 'B', speciesId: d.species, name: sp.name, element: sp.element, level: d.level, mutations: d.mutations ?? [], hue: 0,
    stats: { hp: st.hp, atk: st.atk, def: st.def, spd: st.spd }, skills: skillsFor(sp.element, d.level), hpMul: d.hpMul, boss: d.boss,
  };
}

/** Étage de la tour : adversaires générés de façon déterministe à partir du numéro d'étage. */
export function towerEnemies(floor: number): EnemyDef[] {
  const rng = createRng(floor * 7919 + 17);
  const pool = SPECIES_LIST.filter((s) => s.rarity !== 'secret' && s.rarity !== 'divin');
  const count = Math.min(3, 1 + Math.floor((floor + 1) / 3));
  const level = TOWER.baseLevel + floor * TOWER.levelPerFloor;
  return Array.from({ length: count }, () => ({ species: pool[Math.floor(rng.next() * pool.length)]!.id, level }));
}

export function leagueProgress(state: GameState, leagueId: string): number {
  return state.combat.league[leagueId] ?? 0;
}

export function leagueUnlocked(state: GameState, leagueId: string): boolean {
  const l = LEAGUES.find((x) => x.id === leagueId);
  if (!l) return false;
  if (!l.requires) return true;
  const prev = LEAGUES.find((x) => x.id === l.requires)!;
  return leagueProgress(state, prev.id) >= prev.fights.length;
}

export function bossUnlocked(state: GameState, bossId: string): boolean {
  const b = BOSSES.find((x) => x.id === bossId);
  if (!b) return false;
  const biome = BIOME_BY_ID[b.biomeId]!;
  return isBiomeUnlocked(state, biome) && (state.exploration.expeditionsByBiome[b.biomeId] ?? 0) >= b.unlockExpeditions;
}

function enemiesFor(state: GameState, kind: PendingBattle['kind'], ref: string): EnemyDef[] {
  if (kind === 'league') {
    for (const l of LEAGUES) {
      const idx = l.fights.findIndex((f) => f.id === ref);
      if (idx < 0) continue;
      assertGame(leagueUnlocked(state, l.id), 'locked', tr('Termine d\'abord l\'arène précédente.'));
      assertGame(idx <= leagueProgress(state, l.id), 'locked', tr('Bats d\'abord les adversaires précédents de cette arène.'));
      return l.fights[idx]!.enemies;
    }
    throw new GameError('unknown', tr('Combat inconnu.'));
  }
  if (kind === 'boss') {
    const b = BOSSES.find((x) => x.id === ref);
    assertGame(b, 'unknown', tr('Gardien inconnu.'));
    assertGame(bossUnlocked(state, b.id), 'locked', tr('Explore davantage ce biome pour débusquer ce gardien.'));
    return b.enemies;
  }
  const floor = state.combat.towerFloor + 1;
  assertGame(ref === String(floor), 'bad_floor', tr('Étage invalide.'));
  return towerEnemies(floor);
}

export function setTeam(draft: GameState, uids: string[]): void {
  const unique = [...new Set(uids)];
  assertGame(unique.length <= MAX_TEAM, 'team_size', tr('{MAX_TEAM} créatures au maximum.', { MAX_TEAM }));
  for (const u of unique) assertGame(draft.creatures.some((c) => c.uid === u), 'unknown_creature', tr('Créature introuvable.'));
  draft.combat.team = unique;
}

export function startBattle(draft: GameState, kind: PendingBattle['kind'], ref: string, ctx: ActionContext): void {
  assertGame(!draft.combat.pending, 'pending', tr('Un combat est déjà en cours.'));
  const team = draft.combat.team.map((u) => draft.creatures.find((c) => c.uid === u)).filter((c): c is CreatureInstance => !!c);
  assertGame(team.length >= 1, 'no_team', tr('Compose ton équipe de combat (1 à 3 créatures).'));
  for (const c of team) assertGame(!isAway(draft, c.uid), 'away', tr('{p0} est en expédition.', { p0: displayName(c) }));
  const enemies = enemiesFor(draft, kind, ref);
  draft.combat.pending = {
    kind, ref, startedAt: ctx.now,
    seed: Math.floor(ctx.rng.next() * 0xffffffff),
    combatants: [...team.map(combatantFromCreature), ...enemies.map(combatantFromEnemy)],
  };
}

export function abandonBattle(draft: GameState): void {
  assertGame(draft.combat.pending, 'no_battle', tr('Aucun combat en cours.'));
  draft.combat.pending = null;
  draft.stats.battlesLost += 1;
}

/** Termine le combat : le moteur REJOUE le combat avec les ordres fournis avant toute récompense. */
export function finishBattle(draft: GameState, inputs: BattleInput[], ctx: ActionContext, events: GameEvent[]): void {
  const p = draft.combat.pending;
  assertGame(p, 'no_battle', tr('Aucun combat en cours.'));
  let result;
  try {
    result = replay(p.combatants, p.seed, inputs);
  } catch (err) {
    throw new GameError('invalid_battle', tr('Combat invalide : {message}', { message: (err as Error).message }));
  }
  assertGame(result.ended, 'unfinished', tr('Le combat n\'est pas terminé.'));
  draft.combat.pending = null;
  const won = result.winner === 'A';
  const enemyLevels = p.combatants.filter((c) => c.side === 'B').reduce((s, c) => s + c.level * (c.boss ? 2 : 1), 0);
  const xp = won ? Math.round(enemyLevels * 6) : Math.round(enemyLevels * 1.5);
  for (const u of result.units.filter((x) => x.side === 'A')) {
    const c = draft.creatures.find((x) => x.uid === u.uid);
    if (c) addXp(draft, c, u.alive ? xp : Math.round(xp / 2), events);
  }
  let reward: Reward = {};
  let label = '';
  if (won) {
    draft.stats.battlesWon += 1;
    if (p.kind === 'league') {
      for (const l of LEAGUES) {
        const idx = l.fights.findIndex((f) => f.id === p.ref);
        if (idx < 0) continue;
        const f = l.fights[idx]!;
        const first = idx === leagueProgress(draft, l.id);
        if (first) draft.combat.league[l.id] = idx + 1;
        reward = first ? f.firstReward : f.repeatReward;
        label = `${l.name} : ${f.rival}`;
      }
    } else if (p.kind === 'boss') {
      const b = BOSSES.find((x) => x.id === p.ref)!;
      label = b.name;
      draft.stats.bossesDefeated += 1;
      if (!draft.combat.bossFirst.includes(b.id)) { draft.combat.bossFirst.push(b.id); reward = b.firstReward; }
      else if (draft.combat.bossDaily[b.id] !== ctx.dayKey) { draft.combat.bossDaily[b.id] = ctx.dayKey; reward = b.dailyReward; }
    } else {
      const floor = Number(p.ref);
      draft.combat.towerFloor = Math.max(draft.combat.towerFloor, floor);
      reward = TOWER.floorReward(floor);
      label = `Tour des épreuves : étage ${floor}`;
    }
    if (Object.keys(reward).length) grantReward(draft, reward, `Victoire — ${label}`, ctx, events);
  } else {
    draft.stats.battlesLost += 1;
  }
  events.push({ type: 'battleEnded', won, kind: p.kind, ref: p.ref, reward, xp, rounds: result.round });
}
