import { describe, expect, it } from 'vitest';
import { BALANCE, ITEMS, MUTATIONS, RECIPES, SPECIES } from '@data/index';
import { createRng } from '../rng';
import { createCreature } from '../systems/creatures';
import { evolutionOptions } from '../systems/evolution';
import { breedBlocker, breedingCost, inheritGenes } from '../systems/breeding';
import { baseFormOf, breedingOdds } from '../systems/odds';
import { migrate } from '../save/migrations';
import { deserialize, serialize } from '../save/serializer';
import { SCHEMA_VERSION } from '../state';
import { SPECIES_RENAMES_V3 } from '../save/renames';
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
    const c = withCreature(s, 'tisonnet', { level: 10 });
    expect(() => run(s, { type: 'evolve', uid: c.uid, to: 'fournaillon' })).toThrow(/conditions/);
  });
  it('fait évoluer, conserve gènes et niveau, enregistre l\'espèce', () => {
    const s = newGame();
    const c = withCreature(s, 'tisonnet', { level: 16 });
    const { state, events } = run(s, { type: 'evolve', uid: c.uid, to: 'fournaillon' });
    const after = state.creatures.find((x) => x.uid === c.uid)!;
    expect(after.speciesId).toBe('fournaillon');
    expect(after.genes).toEqual(c.genes);
    expect(after.level).toBe(16);
    expect(state.dex.fournaillon?.obtainedCount).toBe(1);
    expect(events[0]).toMatchObject({ type: 'evolved', from: 'tisonnet', to: 'fournaillon', newSpecies: true });
  });
  it('gère les branches : régime alimentaire', () => {
    const s = newGame();
    const c = withCreature(s, 'lichenou', { level: 14, diet: { fruit: 8 } });
    const opts = evolutionOptions(s, c, NOON);
    expect(opts.find((o) => o.def.to === 'petalys')!.ready).toBe(true);
    expect(opts.find((o) => o.def.to === 'bosquelin')!.ready).toBe(false);
  });
  it('gère le moment de la journée et l\'affection', () => {
    const s = newGame();
    const c = withCreature(s, 'frimelot', { level: 16, affection: 60 });
    expect(() => run(s, { type: 'evolve', uid: c.uid, to: 'frimelune' }, NOON)).toThrow();
    expect(run(s, { type: 'evolve', uid: c.uid, to: 'frimelune' }, NIGHT).state.creatures.at(-1)!.speciesId).toBe('frimelune');
  });
  it('consomme l\'objet d\'évolution', () => {
    const s = newGame();
    const c = withCreature(s, 'caillounet', { level: 12 });
    expect(() => run(s, { type: 'evolve', uid: c.uid, to: 'aurgile' })).toThrow();
    s.inventory.coquille_eveil = 1;
    const { state } = run(s, { type: 'evolve', uid: c.uid, to: 'aurgile' });
    expect(state.inventory.coquille_eveil).toBeUndefined();
  });
  it('gère l\'environnement de naissance (ambiance)', () => {
    const s = newGame();
    const cold = withCreature(s, 'sphingres', { level: 20 });
    const hot = withCreature(s, 'sphingres', { level: 20, origin: { kind: 'egg', eggType: 'volcanique', ambiance: 'chaleur', night: false } });
    expect(evolutionOptions(s, cold, NOON)[0]!.ready).toBe(false);
    expect(evolutionOptions(s, hot, NOON)[0]!.ready).toBe(true);
  });
});

describe('Reproduction', () => {
  function parents(a = 'tisonnet', b = 'perlouille') {
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
    for (const [a, b] of [['tisonnet', 'perlouille'], ['aubelys', 'revombre'], ['lichenou', 'lichenou'], ['fournaillon', 'caillounet']]) {
      const odds = breedingOdds(a!, b!);
      expect(odds.reduce((x, o) => x + o.probability, 0)).toBeCloseTo(1, 10);
    }
    expect(breedingOdds('tisonnet', 'perlouille').find((o) => o.speciesId === 'brumavap')?.probability).toBeCloseTo(0.3);
    const both = breedingOdds('aubelys', 'revombre');
    expect(both.some((o) => o.speciesId === 'neantelle')).toBe(true);
    expect(both.some((o) => o.speciesId === 'cometuse')).toBe(true);
  });
  it('donne la forme de base de la lignée', () => {
    expect(baseFormOf('basaltor')).toBe('tisonnet');
    expect(breedingOdds('basaltor', 'basaltor')).toEqual([{ speciesId: 'tisonnet', probability: 1, recipeId: null }]);
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
    const v1 = { schemaVersion: 1, creatures: [{ uid: 'x', speciesId: 'tisonnet' }] };
    const v2 = migrate(v1, SCHEMA_VERSION);
    expect(v2.schemaVersion).toBe(SCHEMA_VERSION);
    expect(v2.recipesFound).toEqual([]);
    expect((v2.creatures as { breedCount: number }[])[0]!.breedCount).toBe(0);
  });
  it('convertit les anciens identifiants d\'espèces (v2 → v3)', () => {
    const [oldId, newId] = Object.entries(SPECIES_RENAMES_V3)[0]!;
    const v2 = { schemaVersion: 2, creatures: [{ uid: 'x', speciesId: oldId, origin: { kind: 'breeding', parents: [oldId, oldId] } }],
      dex: { [oldId]: { speciesId: oldId, obtainedCount: 1, variants: [] } }, discoveries: [{ speciesId: oldId }],
      eggs: [{ uid: 'e', type: 'hybride', genetics: { speciesId: oldId, parents: [oldId, oldId] } }], incubators: [{ egg: null }] };
    const v3 = migrate(v2, SCHEMA_VERSION) as Record<string, any>;
    expect(v3.creatures[0].speciesId).toBe(newId);
    expect(v3.creatures[0].origin.parents).toEqual([newId, newId]);
    expect(v3.dex[newId].speciesId).toBe(newId);
    expect(v3.dex[oldId]).toBeUndefined();
    expect(v3.discoveries[0].speciesId).toBe(newId);
    expect(v3.eggs[0].genetics.speciesId).toBe(newId);
    for (const id of Object.values(SPECIES_RENAMES_V3)) expect(SPECIES[id]).toBeDefined();
  });
  it('convertit les mutations et objets renommés (v2 → v3)', () => {
    const v2 = { schemaVersion: 2, creatures: [{ uid: 'x', speciesId: 'aerolis', mutations: ['chromatique', 'givree'] }],
      dex: { aerolis: { speciesId: 'aerolis', variants: ['chromatique'] } }, discoveries: [{ speciesId: 'aerolis', mutationId: 'chromatique' }],
      inventory: { baie_sucree: 3, pierre_eveil: 1 }, eggs: [], incubators: [] };
    const v3 = migrate(v2, SCHEMA_VERSION) as Record<string, any>;
    expect(v3.creatures[0].mutations).toEqual(['irisee', 'givree']);
    expect(v3.dex.aerolis.variants).toEqual(['irisee']);
    expect(v3.discoveries[0].mutationId).toBe('irisee');
    expect(v3.inventory).toEqual({ fruit_rose: 3, coquille_eveil: 1 });
    expect(MUTATIONS.irisee).toBeDefined();
    expect(ITEMS.fruit_rose && ITEMS.coquille_eveil).toBeTruthy();
  });
  it('relit une sauvegarde complète', () => {
    const s = newGame();
    expect(deserialize(serialize(s, T0), T0).state).toEqual(s);
  });
});
