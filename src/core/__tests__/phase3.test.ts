import { describe, expect, it } from 'vitest';
import { BALANCE, RECIPES, SPECIES } from '@data/index';
import { createRng } from '../rng';
import { createCreature } from '../systems/creatures';
import { evolutionOptions } from '../systems/evolution';
import { breedBlocker, breedingCost, inheritGenes } from '../systems/breeding';
import { baseFormOf, breedingOdds } from '../systems/odds';
import { migrate } from '../save/migrations';
import { deserialize, serialize } from '../save/serializer';
import { SCHEMA_VERSION } from '../state';
import { makeContext, HOUR } from '../time';
import type { GameState } from '../types';
import { newGame, run, T0 } from './helpers';

const NOON = T0; // 12h : jour
const NIGHT = new Date(2026, 10, 19, 23, 0, 0).getTime();

function withCreature(s: GameState, speciesId: string, patch: Partial<GameState['creatures'][0]> = {}) {
  const c = createCreature(s, speciesId, [], { kind: 'egg', eggType: 'forestier', ambiance: 'neutre', night: false }, makeContext(T0, createRng(1)));
  Object.assign(c, patch);
  s.creatures.push(c);
  return c;
}

describe('Évolutions', () => {
  it('refuse une évolution dont les conditions ne sont pas remplies', () => {
    const s = newGame();
    const c = withCreature(s, 'pyroli', { level: 10 });
    expect(() => run(s, { type: 'evolve', uid: c.uid, to: 'pyrodrake' })).toThrow(/conditions/);
  });
  it('fait évoluer, conserve gènes et niveau, enregistre l\'espèce', () => {
    const s = newGame();
    const c = withCreature(s, 'pyroli', { level: 16 });
    const { state, events } = run(s, { type: 'evolve', uid: c.uid, to: 'pyrodrake' });
    const after = state.creatures.find((x) => x.uid === c.uid)!;
    expect(after.speciesId).toBe('pyrodrake');
    expect(after.genes).toEqual(c.genes);
    expect(after.level).toBe(16);
    expect(state.dex.pyrodrake?.obtainedCount).toBe(1);
    expect(events[0]).toMatchObject({ type: 'evolved', from: 'pyroli', to: 'pyrodrake', newSpecies: true });
  });
  it('gère les branches : régime alimentaire', () => {
    const s = newGame();
    const c = withCreature(s, 'mousselin', { level: 14, diet: { fruit: 8 } });
    const opts = evolutionOptions(s, c, 12);
    expect(opts.find((o) => o.def.to === 'petalys')!.ready).toBe(true);
    expect(opts.find((o) => o.def.to === 'sylvegard')!.ready).toBe(false);
  });
  it('gère le moment de la journée et l\'affection', () => {
    const s = newGame();
    const c = withCreature(s, 'givrelot', { level: 16, affection: 60 });
    expect(() => run(s, { type: 'evolve', uid: c.uid, to: 'givrelune' }, NOON)).toThrow();
    expect(run(s, { type: 'evolve', uid: c.uid, to: 'givrelune' }, NIGHT).state.creatures.at(-1)!.speciesId).toBe('givrelune');
  });
  it('consomme l\'objet d\'évolution', () => {
    const s = newGame();
    const c = withCreature(s, 'galetou', { level: 12 });
    expect(() => run(s, { type: 'evolve', uid: c.uid, to: 'orolithe' })).toThrow();
    s.inventory.pierre_eveil = 1;
    const { state } = run(s, { type: 'evolve', uid: c.uid, to: 'orolithe' });
    expect(state.inventory.pierre_eveil).toBeUndefined();
  });
  it('gère l\'environnement de naissance (ambiance)', () => {
    const s = newGame();
    const cold = withCreature(s, 'scarabor', { level: 20 });
    const hot = withCreature(s, 'scarabor', { level: 20, origin: { kind: 'egg', eggType: 'volcanique', ambiance: 'chaleur', night: false } });
    expect(evolutionOptions(s, cold, 12)[0]!.ready).toBe(false);
    expect(evolutionOptions(s, hot, 12)[0]!.ready).toBe(true);
  });
});

describe('Reproduction', () => {
  function parents(a = 'pyroli', b = 'aquabulle') {
    const s = newGame();
    s.wallet = { coins: 10000, crystals: 0, essence: 1000 };
    const pa = withCreature(s, a, { level: 12, affection: 40 });
    const pb = withCreature(s, b, { level: 12, affection: 40 });
    return { s, pa, pb };
  }
  it('respecte niveau, affection, fertilité et repos', () => {
    const { pa } = parents();
    expect(breedBlocker({ ...pa, level: 5 }, T0)).toMatch(/Niveau/);
    expect(breedBlocker({ ...pa, affection: 0 }, T0)).toMatch(/Affection/);
    expect(breedBlocker({ ...pa, breedCount: BALANCE.breeding.maxBreeds }, T0)).toMatch(/Fertilité/);
    expect(breedBlocker({ ...pa, breedReadyAt: T0 + 1 }, T0)).toMatch(/repose/);
    expect(breedBlocker(pa, T0)).toBeNull();
  });
  it('refuse deux fois la même créature', () => {
    const { s, pa } = parents();
    expect(() => run(s, { type: 'breed', a: pa.uid, b: pa.uid, stabilize: false })).toThrow(/différentes/);
  });
  it('débite le coût, crée un œuf génétique et met les parents au repos', () => {
    const { s, pa, pb } = parents();
    const cost = breedingCost(pa, pb, true);
    const { state } = run(s, { type: 'breed', a: pa.uid, b: pb.uid, stabilize: true });
    expect(state.wallet.essence).toBe(1000 - cost.essence);
    const egg = state.eggs.at(-1)!;
    expect(egg.type).toBe('hybride');
    expect(egg.genetics?.generation).toBe(2);
    expect(state.creatures.find((c) => c.uid === pa.uid)!.breedReadyAt).toBe(T0 + BALANCE.breeding.cooldownMs);
    expect(() => run(state, { type: 'breed', a: pa.uid, b: pb.uid, stabilize: false })).toThrow(/repose/);
  });
  it('les issues d\'une fusion somment à 1 et incluent les recettes', () => {
    for (const [a, b] of [['pyroli', 'aquabulle'], ['solarielle', 'noctombre'], ['mousselin', 'mousselin'], ['pyrodrake', 'galetou']]) {
      const odds = breedingOdds(a!, b!);
      expect(odds.reduce((x, o) => x + o.probability, 0)).toBeCloseTo(1, 10);
    }
    expect(breedingOdds('pyroli', 'aquabulle').find((o) => o.speciesId === 'brumavap')?.probability).toBeCloseTo(0.3);
    const both = breedingOdds('solarielle', 'noctombre');
    expect(both.some((o) => o.speciesId === 'neantis')).toBe(true);
    expect(both.some((o) => o.speciesId === 'astrelune')).toBe(true);
  });
  it('donne la forme de base de la lignée', () => {
    expect(baseFormOf('infernyx')).toBe('pyroli');
    expect(breedingOdds('infernyx', 'infernyx')).toEqual([{ speciesId: 'pyroli', probability: 1, recipeId: null }]);
  });
  it('les gènes hérités restent dans les bornes', () => {
    const ctx = makeContext(T0, createRng(3));
    for (let i = 0; i < 2000; i++) {
      const g = inheritGenes({ hp: 31, atk: 0, def: 31, spd: 0, hue: 12, size: 1 }, { hp: 31, atk: 0, def: 0, spd: 31, hue: -12, size: 0 }, ctx);
      for (const k of ['hp', 'atk', 'def', 'spd'] as const) expect(g[k]).toBeGreaterThanOrEqual(0), expect(g[k]).toBeLessThanOrEqual(31);
      expect(g.size).toBeGreaterThanOrEqual(0); expect(g.size).toBeLessThanOrEqual(1);
    }
  });
  it('l\'œuf génétique éclôt avec l\'espèce et les gènes prévus, et révèle la recette', () => {
    const { s, pa, pb } = parents();
    let state = run(s, { type: 'breed', a: pa.uid, b: pb.uid, stabilize: false }).state;
    const egg = state.eggs.at(-1)!;
    egg.genetics = { ...egg.genetics!, speciesId: 'brumavap', recipeId: 'r_vapeur', mutations: ['doree'] };
    state = run(state, { type: 'placeEgg', eggUid: egg.uid, slot: 0 }).state;
    const { state: after, events } = run(state, { type: 'hatch', slot: 0 }, T0 + HOUR);
    const born = after.creatures.at(-1)!;
    expect(born.speciesId).toBe('brumavap');
    expect(born.genes).toEqual(egg.genetics!.genes);
    expect(born.mutations).toContain('doree');
    expect(born.origin.kind).toBe('breeding');
    expect(after.recipesFound).toContain('r_vapeur');
    expect(events.some((e) => e.type === 'hatched' && e.newSpecies)).toBe(true);
  });
  it('chaque recette référence une espèce existante', () => {
    for (const r of RECIPES) expect(SPECIES[r.result]).toBeDefined();
  });
});

describe('Migration de sauvegarde', () => {
  it('passe une sauvegarde v1 en v2 sans perte', () => {
    const v1 = { schemaVersion: 1, creatures: [{ uid: 'x', speciesId: 'pyroli' }] };
    const v2 = migrate(v1, SCHEMA_VERSION);
    expect(v2.schemaVersion).toBe(2);
    expect(v2.recipesFound).toEqual([]);
    expect((v2.creatures as { breedCount: number }[])[0]!.breedCount).toBe(0);
  });
  it('relit une sauvegarde v2 complète', () => {
    const s = newGame();
    expect(deserialize(serialize(s, T0), T0).state).toEqual(s);
  });
});
