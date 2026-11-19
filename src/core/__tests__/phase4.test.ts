import { describe, expect, it } from 'vitest';
import { BALANCE, BIOME_BY_ID, BUILDING_BY_ID, DAILY_MISSIONS, SPECIES } from '@data/index';
import { createRng } from '../rng';
import { createCreature } from '../systems/creatures';
import { buildingLevel, creatureCap, eggCap, unlockedThemes } from '../systems/buildings';
import { expeditionForecast, isAway } from '../systems/exploration';
import { dailyMissions, missionProgress } from '../systems/missions';
import { pendingHarvest, pendingProduce } from '../systems/sanctuary';
import { biomeWeather, sanctuaryWeather } from '../systems/weather';
import { evolutionOptions } from '../systems/evolution';
import { migrate } from '../save/migrations';
import { SCHEMA_VERSION } from '../state';
import { HOUR, MINUTE, makeContext } from '../time';
import type { GameState } from '../types';
import { newGame, run, T0 } from './helpers';

function add(s: GameState, id: string, level = 10) {
  const c = createCreature(s, id, [], { kind: 'egg', eggType: 'forestier', ambiance: 'neutre', night: false }, makeContext(T0, createRng(2)));
  c.level = level;
  s.creatures.push(c);
  return c;
}

describe('Météo', () => {
  it('est déterministe et change par tranches de 3 h', () => {
    expect(biomeWeather('foret', T0).id).toBe(biomeWeather('foret', T0 + 1000).id);
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) seen.add(sanctuaryWeather(T0 + i * BALANCE.weatherPeriodMs).id);
    expect(seen.size).toBeGreaterThan(3);
  });
  it('les événements rares restent rares', () => {
    let events = 0;
    for (let i = 0; i < 3000; i++) if (biomeWeather('volcan', T0 + i * BALANCE.weatherPeriodMs).event) events++;
    expect(events / 3000).toBeLessThan(0.1);
    expect(events).toBeGreaterThan(0);
  });
});

describe('Expéditions', () => {
  it('cycle complet : départ, absence, retour, butin, XP', () => {
    let s = newGame();
    const a = add(s, 'lichenou', 5);
    s = run(s, { type: 'startExpedition', biomeId: 'foret', uids: [a.uid], duration: 'court' }).state;
    expect(isAway(s, a.uid)).toBe(true);
    expect(() => run(s, { type: 'feed', uid: a.uid, item: 'fruit_rose' })).toThrow(/expédition/);
    expect(() => run(s, { type: 'release', uid: a.uid })).toThrow(/expédition/);
    expect(() => run(s, { type: 'claimExpedition', uid: s.expeditions[0]!.uid }, T0 + MINUTE)).toThrow(/pas encore rentrée/);
    const { state, events } = run(s, { type: 'claimExpedition', uid: s.expeditions[0]!.uid }, T0 + 20 * MINUTE);
    expect(state.expeditions).toHaveLength(0);
    expect(state.stats.expeditions).toBe(1);
    expect(state.exploration.expeditionsByBiome.foret).toBe(1);
    expect(state.wallet.coins).toBeGreaterThan(s.wallet.coins);
    const done = events.find((e) => e.type === 'expeditionDone');
    expect(done && done.type === 'expeditionDone' && done.xp).toBeGreaterThan(0);
  });
  it('refuse un biome verrouillé, une équipe trop grande, une créature déjà partie', () => {
    let s = newGame();
    const [a, b, c, d] = ['lichenou', 'zephyrin', 'frimelot', 'perlouille'].map((x) => add(s, x));
    expect(() => run(s, { type: 'startExpedition', biomeId: 'cosmos', uids: [a!.uid], duration: 'court' })).toThrow(/espèces/);
    expect(() => run(s, { type: 'startExpedition', biomeId: 'foret', uids: [a!.uid, b!.uid, c!.uid, d!.uid], duration: 'court' })).toThrow(/entre 1 et 3/);
    s = run(s, { type: 'startExpedition', biomeId: 'foret', uids: [a!.uid], duration: 'court' }).state;
    expect(() => run(s, { type: 'startExpedition', biomeId: 'foret', uids: [a!.uid], duration: 'court' })).toThrow(/déjà en expédition/);
  });
  it('la qualité dépend de la puissance et des éléments favorisés', () => {
    const s = newGame();
    const weak = add(s, 'tisonnet', 1);
    const strong = add(s, 'tisonnet', 30);
    const nature = add(s, 'lichenou', 30);
    const fw = expeditionForecast(s, 'foret', [weak], 'moyen', T0);
    const fs = expeditionForecast(s, 'foret', [strong], 'moyen', T0);
    const fn = expeditionForecast(s, 'foret', [nature], 'moyen', T0);
    expect(fs.quality).toBeGreaterThan(fw.quality);
    expect(fn.favored).toBeGreaterThanOrEqual(1);
    expect(fs.eggChancePerRoll).toBeLessThanOrEqual(BALANCE.expedition.eggChanceCap);
    expect(fs.eggOdds.reduce((x, o) => x + o.probability, 0)).toBeCloseTo(1);
  });
  it('révèle la zone secrète après assez d\'expéditions', () => {
    let s = newGame();
    const a = add(s, 'lichenou', 20);
    s.exploration.expeditionsByBiome.foret = BIOME_BY_ID.foret!.secret.afterExpeditions - 1;
    s = run(s, { type: 'startExpedition', biomeId: 'foret', uids: [a.uid], duration: 'court' }).state;
    const { state, events } = run(s, { type: 'claimExpedition', uid: s.expeditions[0]!.uid }, T0 + HOUR);
    expect(state.exploration.secretsFound).toContain('foret');
    expect(events.some((e) => e.type === 'expeditionDone' && e.secretFound)).toBe(true);
  });
  it('la fouille donne un matériau et a un temps de recharge', () => {
    const s = newGame();
    const { state } = run(s, { type: 'forage', biomeId: 'foret' });
    expect((state.inventory.bois_lune ?? 0) + (state.inventory.sable_dore ?? 0)).toBe(1);
    expect(() => run(state, { type: 'forage', biomeId: 'foret' }, T0 + MINUTE)).toThrow(/récemment/);
    expect(() => run(state, { type: 'forage', biomeId: 'foret' }, T0 + BALANCE.expedition.forageCooldownMs)).not.toThrow();
  });
});

describe('Sanctuaire : bâtiments', () => {
  it('améliorer coûte des pièces et des matériaux et augmente la capacité', () => {
    const s = newGame();
    s.wallet.coins = 5000;
    expect(() => run(s, { type: 'upgradeBuilding', id: 'nichoirs' })).toThrow(/Bois de lune/);
    s.inventory.bois_lune = 10;
    const before = creatureCap(s);
    const { state } = run(s, { type: 'upgradeBuilding', id: 'nichoirs' });
    expect(buildingLevel(state, 'nichoirs')).toBe(2);
    expect(creatureCap(state)).toBe(before + BUILDING_BY_ID.nichoirs!.effect.perLevel);
    expect(state.inventory.bois_lune).toBe(6);
    expect(state.wallet.coins).toBe(5000 - BUILDING_BY_ID.nichoirs!.costs[1]!.coins);
  });
  it('capacités de départ identiques à avant la Phase 4 pour les œufs', () => {
    expect(eggCap(newGame())).toBe(30);
  });
  it('le jardin et l\'observatoire produisent à la récolte', () => {
    const s = newGame();
    s.sanctuary.buildings.jardin = 2;
    s.sanctuary.buildings.observatoire = 2;
    const p = pendingProduce(s, T0 + 4 * HOUR);
    expect(p.items?.fruit_rose).toBe(4);
    expect(p.essence).toBe(12);
    const { state } = run(s, { type: 'harvest' }, T0 + 4 * HOUR);
    expect(state.inventory.fruit_rose).toBe((s.inventory.fruit_rose ?? 0) + 4);
    expect(state.wallet.essence).toBe(12);
  });
  it('les zones augmentent la production des éléments concernés', () => {
    const s = newGame();
    const c = add(s, 'perlouille', 1);
    c.hatchedAt = T0;
    const base = pendingHarvest(s, T0 + 2 * HOUR);
    s.sanctuary.buildings.bassin = 2;
    expect(pendingHarvest(s, T0 + 2 * HOUR)).toBeGreaterThan(base);
  });
  it('terrains débloqués par l\'exploration, décorations achetées puis masquables', () => {
    let s = newGame();
    expect(unlockedThemes(s)).toEqual(['prairie']);
    expect(() => run(s, { type: 'setTheme', theme: 'neige' })).toThrow();
    s.exploration.expeditionsByBiome.montagnes = 1;
    s = run(s, { type: 'setTheme', theme: 'neige' }).state;
    expect(s.sanctuary.theme).toBe('neige');
    s = run(s, { type: 'buy', offerId: 'deco_banc' }).state;
    expect(s.sanctuary.decorations.banc).toBe(true);
    expect(run(s, { type: 'toggleDecoration', id: 'banc' }).state.sanctuary.decorations.banc).toBe(false);
  });
});

describe('Missions et succès', () => {
  it('3 missions quotidiennes stables pour un jour donné', () => {
    expect(dailyMissions('2026-11-19')).toEqual(dailyMissions('2026-11-19'));
    expect(dailyMissions('2026-11-19')).toHaveLength(3);
    expect(DAILY_MISSIONS.length).toBeGreaterThan(3);
  });
  it('la progression se mesure depuis le début du jour', () => {
    let s = newGame();
    s.stats.harvests = 50; // historique ancien : ne compte pas
    s = run(s, { type: 'setPlayerName', name: 'Test' }).state; // première action du jour → photographie
    const m = { id: 'x', title: '', stat: 'harvests' as const, target: 1, reward: {} };
    expect(missionProgress(s, m, 'day', T0).current).toBe(0);
    s.stats.harvests += 1;
    expect(missionProgress(s, m, 'day', T0).done).toBe(true);
    expect(missionProgress(s, m, 'day', T0 + 24 * HOUR).current).toBe(0);
  });
  it('un succès ne se réclame qu\'une fois et seulement accompli', () => {
    const s = newGame();
    expect(() => run(s, { type: 'claimAchievement', id: 'a_hatch10' })).toThrow(/pas encore/);
    s.stats.eggsHatched = 10;
    const { state } = run(s, { type: 'claimAchievement', id: 'a_hatch10' });
    expect(() => run(state, { type: 'claimAchievement', id: 'a_hatch10' })).toThrow(/déjà/);
  });
  it('quête secondaire de biome', () => {
    const s = newGame();
    s.exploration.expeditionsByBiome.foret = 3;
    expect(run(s, { type: 'claimSideQuest', id: 's_foret_1' }).state.sideQuests).toContain('s_foret_1');
  });
});

describe('Évolution liée à la météo', () => {
  it('Champilou n\'évolue que sous la pluie', () => {
    const s = newGame();
    const c = add(s, 'champilou', 20);
    let rainy = -1, dry = -1;
    for (let i = 0; i < 500 && (rainy < 0 || dry < 0); i++) {
      const t = T0 + i * BALANCE.weatherPeriodMs;
      if (sanctuaryWeather(t).id === 'pluie') rainy = t; else dry = t;
    }
    expect(evolutionOptions(s, c, rainy)[0]!.ready).toBe(true);
    expect(evolutionOptions(s, c, dry)[0]!.ready).toBe(false);
    expect(SPECIES.marecroc).toBeDefined();
  });
});

describe('Migration v3 → v4', () => {
  it('ajoute le monde sans bloquer les grandes collections', () => {
    const v3 = { schemaVersion: 3, sanctuary: { lastHarvestAt: 5 }, creatures: Array.from({ length: 75 }, (_, i) => ({ uid: `c${i}` })) };
    const v4 = migrate(v3, SCHEMA_VERSION) as Record<string, any>;
    expect(v4.sanctuary.lastHarvestAt).toBe(5);
    expect(30 + 20 * v4.sanctuary.buildings.nichoirs).toBeGreaterThanOrEqual(75);
    expect(v4.expeditions).toEqual([]);
    expect(v4.missions.dayKey).toBeNull();
  });
});
