import { describe, expect, it } from 'vitest';
import { BALANCE, EGGS, MUTATIONS, SHOP_OFFERS } from '@data/index';
import { GameError } from '../errors';
import { createRng, weightedPick } from '../rng';
import { deserialize, serialize } from '../save/serializer';
import { anyMutationChance, mutationOdds, speciesOdds } from '../systems/odds';
import { pendingHarvest } from '../systems/sanctuary';
import { makeContext, HOUR, MINUTE } from '../time';
import { rollMutations } from '../systems/hatching';
import { newGame, run, T0 } from './helpers';

describe('RNG', () => {
  it('est déterministe pour une même graine', () => {
    const a = createRng(7), b = createRng(7);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });
  it('respecte les poids', () => {
    const rng = createRng(1);
    let hits = 0;
    for (let i = 0; i < 10000; i++) if (weightedPick(rng, [{ value: 'a', weight: 1 }, { value: 'b', weight: 3 }]) === 'a') hits++;
    expect(hits / 10000).toBeCloseTo(0.25, 1);
  });
});

describe('Probabilités centralisées', () => {
  it('les probabilités d\'espèces de chaque œuf somment à 1', () => {
    for (const egg of Object.keys(EGGS).filter((e) => !EGGS[e]!.genetic)) {
      const sum = speciesOdds(egg).reduce((s, o) => s + o.probability, 0);
      expect(sum).toBeCloseTo(1, 10);
    }
  });
  it('aucune mutation n\'est jamais garantie', () => {
    for (const egg of Object.keys(EGGS)) {
      for (const amb of ['neutre', 'chaleur', 'froid', 'serre', 'etoilee', 'brume']) {
        for (const o of mutationOdds(egg, amb, true)) expect(o.probability).toBeLessThanOrEqual(BALANCE.mutationChanceCap);
        expect(anyMutationChance(egg, amb, true)).toBeLessThan(1);
      }
    }
  });
  it('l\'ambiance influence réellement les mutations', () => {
    const neutral = mutationOdds('forestier', 'neutre', false).find((o) => o.mutationId === 'givree')!.probability;
    const cold = mutationOdds('forestier', 'froid', false).find((o) => o.mutationId === 'givree')!.probability;
    const hot = mutationOdds('forestier', 'chaleur', false).find((o) => o.mutationId === 'givree')!.probability;
    expect(cold).toBeGreaterThan(neutral * 3);
    expect(hot).toBe(0);
  });
  it('la nuit renforce la mutation cosmique en ambiance étoilée', () => {
    const day = mutationOdds('cosmique', 'etoilee', false).find((o) => o.mutationId === 'cosmique')!.probability;
    const night = mutationOdds('cosmique', 'etoilee', true).find((o) => o.mutationId === 'cosmique')!.probability;
    expect(night).toBeGreaterThan(day);
  });
  it('la fréquence observée des mutations correspond aux probabilités affichées', () => {
    const rng = createRng(123);
    const ctx = makeContext(T0, rng);
    const N = 40000;
    const counts: Record<string, number> = {};
    for (let i = 0; i < N; i++) for (const m of rollMutations('corrompu', 'brume', false, ctx)) counts[m] = (counts[m] ?? 0) + 1;
    for (const o of mutationOdds('corrompu', 'brume', false)) {
      expect((counts[o.mutationId] ?? 0) / N).toBeCloseTo(o.probability, 2);
    }
  });
  it('n\'attribue jamais deux mutations du même groupe', () => {
    const ctx = makeContext(T0, createRng(5));
    for (let i = 0; i < 5000; i++) {
      const groups = rollMutations('prismatique', 'serre', true, ctx).map((m) => MUTATIONS[m]!.group);
      expect(new Set(groups).size).toBe(groups.length);
    }
  });
});

describe('Économie', () => {
  it('refuse un achat sans fonds suffisants et ne modifie pas l\'état', () => {
    const s = newGame();
    s.wallet.coins = 10;
    expect(() => run(s, { type: 'buy', offerId: 'egg_forestier' })).toThrow(GameError);
    expect(s.wallet.coins).toBe(10);
  });
  it('débite, crédite et journalise un achat', () => {
    const s = newGame();
    const { state, events } = run(s, { type: 'buy', offerId: 'egg_forestier' });
    expect(state.wallet.coins).toBe(s.wallet.coins - 120);
    expect(state.eggs).toHaveLength(s.eggs.length + 1);
    expect(state.ledger.at(-1)).toMatchObject({ currency: 'coins', delta: -120 });
    expect(events[0]).toMatchObject({ type: 'purchased' });
  });
  it('verrouille les offres selon la progression de l\'Ovidex', () => {
    const s = newGame();
    s.wallet.coins = 99999;
    expect(() => run(s, { type: 'buy', offerId: 'egg_volcanique' })).toThrow(/Découvre 3 espèces/);
  });
  it('ne permet pas d\'acheter deux fois le même module d\'ambiance', () => {
    let s = newGame();
    s.wallet.coins = 5000;
    s = run(s, { type: 'buy', offerId: 'amb_serre' }).state;
    expect(() => run(s, { type: 'buy', offerId: 'amb_serre' })).toThrow(/déjà/);
  });
  it('toutes les offres ont un prix en monnaie du jeu', () => {
    for (const o of SHOP_OFFERS) expect(['coins', 'crystals', 'essence']).toContain(o.price.currency);
  });
});

describe('Incubation et éclosion', () => {
  it('cycle complet : placer, attendre, éclore, enregistrer dans l\'Ovidex', () => {
    let s = newGame();
    const egg = s.eggs[0]!;
    s = run(s, { type: 'placeEgg', eggUid: egg.uid, slot: 0 }).state;
    expect(s.incubators[0]!.egg?.uid).toBe(egg.uid);
    expect(() => run(s, { type: 'hatch', slot: 0 }, T0 + 1000)).toThrow(/pas encore prêt/);
    const { state, events } = run(s, { type: 'hatch', slot: 0 }, T0 + EGGS.forestier!.incubationMs);
    expect(state.creatures).toHaveLength(1);
    expect(state.incubators[0]!.egg).toBeNull();
    const ev = events.find((e) => e.type === 'hatched');
    expect(ev && ev.type === 'hatched' && ev.newSpecies).toBe(true);
    expect(state.dex[state.creatures[0]!.speciesId]!.obtainedCount).toBe(1);
    expect(state.wallet.crystals).toBeGreaterThan(s.wallet.crystals);
  });
  it('empêche de placer un œuf dans un incubateur occupé', () => {
    let s = newGame();
    s = run(s, { type: 'placeEgg', eggUid: s.eggs[0]!.uid, slot: 0 }).state;
    expect(() => run(s, { type: 'placeEgg', eggUid: s.eggs[0]!.uid, slot: 0 })).toThrow(/occupé/);
  });
  it('l\'œuf cosmique exige l\'ambiance étoilée', () => {
    const s = newGame();
    s.eggs.push({ uid: 'x', type: 'cosmique', obtainedAt: T0, source: 'test' });
    expect(() => run(s, { type: 'placeEgg', eggUid: 'x', slot: 0 })).toThrow(/Nuit étoilée/);
  });
  it('l\'affinité d\'ambiance accélère l\'incubation', () => {
    let s = newGame();
    s.unlocks.ambiances.push('serre');
    s = run(s, { type: 'setAmbiance', slot: 0, ambiance: 'serre' }).state;
    s = run(s, { type: 'placeEgg', eggUid: s.eggs[0]!.uid, slot: 0 }).state;
    expect(s.incubators[0]!.readyAt - T0).toBe(EGGS.forestier!.incubationMs * BALANCE.affinitySpeedMultiplier);
  });
  it('l\'accélération coûte des cristaux et rend l\'œuf prêt', () => {
    let s = newGame();
    s.eggs.push({ uid: 'v', type: 'volcanique', obtainedAt: T0, source: 'test' });
    s = run(s, { type: 'placeEgg', eggUid: 'v', slot: 0 }).state;
    const { state } = run(s, { type: 'speedUp', slot: 0 });
    expect(state.wallet.crystals).toBe(s.wallet.crystals - 1);
    expect(run(state, { type: 'hatch', slot: 0 }).state.creatures).toHaveLength(1);
  });
});

describe('Élevage', () => {
  function withCreature() {
    let s = newGame();
    s = run(s, { type: 'placeEgg', eggUid: s.eggs[0]!.uid, slot: 0 }).state;
    return run(s, { type: 'hatch', slot: 0 }, T0 + HOUR).state;
  }
  it('nourrir consomme l\'objet et donne de l\'expérience', () => {
    const s = withCreature();
    const uid = s.creatures[0]!.uid;
    const { state, events } = run(s, { type: 'feed', uid, item: 'baie_sucree' }, T0 + HOUR);
    expect(state.inventory.baie_sucree).toBe((s.inventory.baie_sucree ?? 0) - 1);
    expect(events.some((e) => e.type === 'levelUp')).toBe(true);
  });
  it('la récolte du sanctuaire est plafonnée', () => {
    const s = withCreature();
    const cap = pendingHarvest(s, T0 + HOUR + BALANCE.harvestCapMs);
    expect(pendingHarvest(s, T0 + HOUR + BALANCE.harvestCapMs * 10)).toBe(cap);
    expect(cap).toBeGreaterThan(0);
  });
  it('on ne peut pas libérer un favori', () => {
    let s = withCreature();
    const uid = s.creatures[0]!.uid;
    s = run(s, { type: 'toggleFavorite', uid }).state;
    expect(() => run(s, { type: 'release', uid })).toThrow(/favoris/);
  });
  it('libérer rend de l\'essence', () => {
    const s = withCreature();
    const { state } = run(s, { type: 'release', uid: s.creatures[0]!.uid });
    expect(state.creatures).toHaveLength(0);
    expect(state.wallet.essence).toBeGreaterThan(0);
  });
});

describe('Quêtes et quotidien', () => {
  it('ne permet pas de réclamer une quête incomplète', () => {
    expect(() => run(newGame(), { type: 'claimQuest', questId: 'q01' })).toThrow(/pas encore atteint/);
  });
  it('la récompense quotidienne ne se réclame qu\'une fois par jour et suit la série', () => {
    let s = run(newGame(), { type: 'claimDaily' }).state;
    expect(() => run(s, { type: 'claimDaily' }, T0 + MINUTE)).toThrow(/déjà/);
    s = run(s, { type: 'claimDaily' }, T0 + 24 * HOUR).state;
    expect(s.daily.streak).toBe(2);
  });
});

describe('Sauvegarde', () => {
  it('aller-retour sans perte', () => {
    const s = run(newGame(), { type: 'claimDaily' }).state;
    const { state } = deserialize(serialize(s, T0), T0);
    expect(state).toEqual(s);
  });
  it('détecte une sauvegarde altérée', () => {
    const text = serialize(newGame(), T0).replace('"coins":300', '"coins":999999');
    expect(() => deserialize(text, T0)).toThrow(/corrompue/);
  });
  it('rejette un fichier étranger', () => {
    expect(() => deserialize('{"hello":1}', T0)).toThrow(/pas une sauvegarde/);
  });
});
