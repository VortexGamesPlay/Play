import { describe, expect, it } from 'vitest';
import { LEAGUES, SKILLS } from '@data/index';
import { act, BattleError, chooseAction, createBattle, elementMultiplier, replay, type BattleInput, type BattleState, type CombatantInit } from '../combat/engine';
import { combatantFromEnemy, skillsFor, towerEnemies } from '../systems/battles';
import { createRng } from '../rng';
import { createCreature } from '../systems/creatures';
import { migrate } from '../save/migrations';
import { SCHEMA_VERSION } from '../state';
import { makeContext } from '../time';
import type { GameState } from '../types';
import { newGame, run, T0 } from './helpers';

function team(side: 'A' | 'B', species: string[], level: number): CombatantInit[] {
  return species.map((sp, i) => ({ ...combatantFromEnemy({ species: sp, level }, i), key: `${side}${i}`, side }));
}

function autoPlay(b: BattleState): { b: BattleState; inputs: BattleInput[] } {
  const inputs: BattleInput[] = [];
  while (!b.ended) {
    const inp = chooseAction(b, b.awaiting!);
    inputs.push(inp);
    b = act(b, inp);
  }
  return { b, inputs };
}

describe('Moteur de combat', () => {
  it('multiplicateurs élémentaires', () => {
    expect(elementMultiplier('eau', 'feu')).toBe(1.5);
    expect(elementMultiplier('feu', 'eau')).toBe(0.75);
    expect(elementMultiplier('feu', 'air')).toBe(1);
    expect(elementMultiplier(null, 'feu')).toBe(1);
  });
  it('apprend les compétences selon le niveau', () => {
    expect(skillsFor('feu', 1)).toEqual(['elan', 'feu1']);
    expect(skillsFor('feu', 20)).toEqual(['elan', 'garde', 'feu1', 'feu2', 'feu3']);
  });
  it('est déterministe : même graine + mêmes ordres = même combat', () => {
    const inits = [...team('A', ['tisonnet', 'perlouille', 'lichenou'], 12), ...team('B', ['frimelot', 'caillounet', 'zephyrin'], 12)];
    const { b, inputs } = autoPlay(createBattle(inits, 1234));
    const r = replay(inits, 1234, inputs);
    expect(r.ended).toBe(true);
    expect(r.winner).toBe(b.winner);
    expect(r.units.map((u) => u.hp)).toEqual(b.units.map((u) => u.hp));
  });
  it('une équipe bien plus forte gagne, une plus faible perd', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const strong = autoPlay(createBattle([...team('A', ['basaltor', 'abyssoria', 'orageline'], 40), ...team('B', ['lichenou', 'tisonnet'], 5)], seed));
      expect(strong.b.winner).toBe('A');
      const weak = autoPlay(createBattle([...team('A', ['lichenou'], 3), ...team('B', ['basaltor', 'abyssoria'], 35)], seed));
      expect(weak.b.winner).toBe('B');
    }
  });
  it('tous les combats se terminent', () => {
    for (let seed = 0; seed < 60; seed++) {
      const { b } = autoPlay(createBattle([...team('A', ['caillounet', 'rocanthe'], 15), ...team('B', ['aurgile', 'caillounet'], 15)], seed));
      expect(b.ended).toBe(true);
    }
  });
  it('refuse une compétence sans énergie ou une cible invalide', () => {
    const b = createBattle([...team('A', ['tisonnet'], 25), ...team('B', ['lichenou'], 25)], 9);
    expect(b.awaiting).toBe('A0');
    expect(() => act(b, { skill: 'feu3', target: 'B0' })).toThrow(BattleError); // 4 énergie requises
    expect(() => act(b, { skill: 'feu1', target: 'A0' })).toThrow(/Cible/);
    expect(() => act(b, { skill: 'eau1', target: 'B0' })).toThrow(); // compétence non connue
  });
  it('l\'énergie se recharge et se dépense', () => {
    let b = createBattle([...team('A', ['tisonnet'], 20), ...team('B', ['caillounet'], 50)], 3);
    const before = b.units.find((u) => u.key === 'A0')!.energy;
    b = act(b, { skill: 'feu1', target: 'B0' });
    const a = b.units.find((u) => u.key === 'A0')!;
    if (!b.ended) expect(a.energy).toBe(Math.min(5, before - SKILLS.feu1!.energy + 1));
  });
  it('les effets sur la durée infligent des dégâts et l\'étourdissement fait passer un tour', () => {
    let b = createBattle([...team('A', ['champilou'], 10), ...team('B', ['tisonnet'], 10)], 5);
    const tg = b.units.find((u) => u.key === 'B0')!;
    tg.statuses.push({ id: 'intoxique', turns: 3, value: 0.08 }, { id: 'etourdi', turns: 1, value: 1 });
    const hp = tg.hp;
    b = act(b, { skill: 'garde', target: null });
    expect(b.log.some((l) => l.t === 'dmg' && l.source === 'intoxique')).toBe(true);
    expect(b.log.some((l) => l.t === 'stun' && l.actor === 'B0')).toBe(true);
    expect(b.units.find((u) => u.key === 'B0')!.hp).toBeLessThan(hp);
  });
  it('génère les étages de la tour de façon stable', () => {
    expect(towerEnemies(7)).toEqual(towerEnemies(7));
    expect(towerEnemies(1).length).toBe(1);
    expect(towerEnemies(9).length).toBe(3);
  });
});

function withTeam(s: GameState, species: string[], level: number) {
  const uids = species.map((sp) => {
    const c = createCreature(s, sp, [], { kind: 'starter' }, makeContext(T0, createRng(4)));
    c.level = level;
    s.creatures.push(c);
    return c.uid;
  });
  return run(s, { type: 'setTeam', uids }).state;
}

function playPending(s: GameState): BattleInput[] {
  const p = s.combat.pending!;
  return autoPlay(createBattle(p.combatants, p.seed)).inputs;
}

describe('Combats dans le jeu', () => {
  it('exige une équipe', () => {
    expect(() => run(newGame(), { type: 'startBattle', kind: 'league', ref: 'b1' })).toThrow(/équipe/);
  });
  it('victoire vérifiée par rejeu : progression et récompense de première victoire, puis récompense réduite', () => {
    let s = withTeam(newGame(), ['basaltor', 'abyssoria', 'orageline'], 30);
    expect(() => run(s, { type: 'startBattle', kind: 'league', ref: 'b2' })).toThrow(/précédents/);
    s = run(s, { type: 'startBattle', kind: 'league', ref: 'b1' }).state;
    const coins = s.wallet.coins;
    let res = run(s, { type: 'finishBattle', inputs: playPending(s) });
    expect(res.events.find((e) => e.type === 'battleEnded')).toMatchObject({ won: true });
    expect(res.state.combat.league.bourgeons).toBe(1);
    expect(res.state.wallet.coins).toBe(coins + LEAGUES[0]!.fights[0]!.firstReward.coins!);
    s = run(res.state, { type: 'startBattle', kind: 'league', ref: 'b1' }).state;
    res = run(s, { type: 'finishBattle', inputs: playPending(s) });
    expect(res.state.wallet.coins).toBe(s.wallet.coins + LEAGUES[0]!.fights[0]!.repeatReward.coins!);
    expect(res.state.combat.league.bourgeons).toBe(1);
  });
  it('refuse des ordres falsifiés ou un combat inachevé', () => {
    let s = withTeam(newGame(), ['lichenou'], 10);
    s = run(s, { type: 'startBattle', kind: 'league', ref: 'b1' }).state;
    expect(() => run(s, { type: 'finishBattle', inputs: [] })).toThrow(/pas terminé/);
    expect(() => run(s, { type: 'finishBattle', inputs: [{ skill: 'feu3', target: 'B0' }] })).toThrow(/invalide/);
  });
  it('les créatures gagnent de l\'expérience', () => {
    let s = withTeam(newGame(), ['basaltor'], 30);
    s = run(s, { type: 'startBattle', kind: 'tower', ref: '1' }).state;
    const xpBefore = s.creatures[0]!.xp + s.creatures[0]!.level * 1000;
    const { state } = run(s, { type: 'finishBattle', inputs: playPending(s) });
    expect(state.creatures[0]!.xp + state.creatures[0]!.level * 1000).toBeGreaterThan(xpBefore);
    expect(state.combat.towerFloor).toBe(1);
    expect(() => run(state, { type: 'startBattle', kind: 'tower', ref: '5' })).toThrow(/Étage/);
  });
  it('les gardiens anciens se débusquent par l\'exploration', () => {
    const s = withTeam(newGame(), ['basaltor'], 30);
    expect(() => run(s, { type: 'startBattle', kind: 'boss', ref: 'boss_foret' })).toThrow(/Explore/);
    s.exploration.expeditionsByBiome.foret = 3;
    expect(run(s, { type: 'startBattle', kind: 'boss', ref: 'boss_foret' }).state.combat.pending?.kind).toBe('boss');
  });
  it('abandonner compte comme une défaite', () => {
    let s = withTeam(newGame(), ['lichenou'], 5);
    s = run(s, { type: 'startBattle', kind: 'tower', ref: '1' }).state;
    const { state } = run(s, { type: 'abandonBattle' });
    expect(state.combat.pending).toBeNull();
    expect(state.stats.battlesLost).toBe(1);
  });
  it('migration v4 → v5', () => {
    const v5 = migrate({ schemaVersion: 4 }, SCHEMA_VERSION) as Record<string, any>;
    expect(v5.combat).toEqual({ team: [], pending: null, league: {}, bossFirst: [], bossDaily: {}, towerFloor: 0 });
  });
});
