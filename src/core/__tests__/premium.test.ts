import { describe, expect, it } from 'vitest';
import { PRODUCT_BY_ID, PRODUCTS } from '@data/products';
import { SEASONS } from '@data/seasons';
import { currentSeason, seasonLevel, seasonPoints } from '../systems/season';
import { maxExpeditions } from '../systems/exploration';
import { purchaseBlocker, spentThisMonth } from '../systems/premium';
import { unlockedThemes } from '../systems/buildings';
import { migrate } from '../save/migrations';
import { SCHEMA_VERSION } from '../state';
import { newGame, run, T0 } from './helpers';

const buy = (productId: string, orderId = `TEST-${productId}`) => ({
  type: 'applyPurchase' as const,
  purchase: { orderId, productId, provider: 'test' as const, amountCents: PRODUCT_BY_ID[productId]!.priceCents, currency: 'EUR' },
});

describe('Catalogue', () => {
  it('ne vend ni créature ni œuf', () => {
    for (const p of PRODUCTS) {
      expect(Object.keys(p.grants)).not.toContain('eggs');
      expect(Object.keys(p.grants)).not.toContain('creatures');
    }
  });
  it('a des prix positifs et des identifiants uniques', () => {
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(PRODUCTS.length);
    for (const p of PRODUCTS) expect(p.priceCents).toBeGreaterThan(0);
  });
});

describe('Achats', () => {
  it('crédite les cristaux et journalise l\'achat', () => {
    const s = newGame();
    const { state } = run(s, buy('cristaux_330'));
    expect(state.wallet.crystals).toBe(s.wallet.crystals + 330);
    expect(state.premium.purchases).toHaveLength(1);
    expect(spentThisMonth(state, T0)).toBe(499);
  });
  it('est idempotent : une commande n\'est jamais appliquée deux fois', () => {
    const s = run(newGame(), buy('cristaux_60', 'ORDER-1')).state;
    expect(() => run(s, buy('cristaux_60', 'ORDER-1'))).toThrow(/déjà été pris en compte/);
  });
  it('refuse un montant qui ne correspond pas au prix', () => {
    const bad = buy('cristaux_1500');
    bad.purchase.amountCents = 1;
    expect(() => run(newGame(), bad)).toThrow(/montant/);
  });
  it('les achats uniques ne se rachètent pas', () => {
    const s = run(newGame(), buy('pack_debutant')).state;
    expect(s.sanctuary.decorations.arche_aurore).toBe(true);
    expect(purchaseBlocker(s, 'pack_debutant', T0, '2026-11-19')).toBe('Déjà acheté');
    expect(() => run(s, buy('pack_debutant', 'X2'))).toThrow(/possèdes déjà/);
  });
  it('le terrain cosmétique devient disponible', () => {
    const s = run(newGame(), buy('terrain_aurore')).state;
    expect(unlockedThemes(s)).toContain('aurore');
  });
  it('respecte la limite de dépenses mensuelle', () => {
    let s = run(newGame(), { type: 'setSpendLimit', cents: 500 }).state;
    s = run(s, buy('cristaux_330')).state;
    expect(purchaseBlocker(s, 'cristaux_60', T0, '2026-11-19')).toMatch(/Limite/);
  });
});

describe('Saison', () => {
  it('une saison est en cours à la date de test', () => {
    expect(currentSeason('2026-11-19')?.id).toBe('s1');
    expect(currentSeason('2030-01-01')).toBeNull();
  });
  it('les points viennent du jeu depuis le début de la saison', () => {
    let s = newGame();
    s.stats.eggsHatched = 100; // avant la saison : ne compte pas
    s = run(s, { type: 'setPlayerName', name: 'Test' }).state;
    expect(seasonPoints(s, SEASONS[0]!)).toBe(0);
    s.stats.battlesWon += 20; // 20 × 15 = 300 points
    expect(seasonPoints(s, SEASONS[0]!)).toBe(300);
    expect(seasonLevel(s, SEASONS[0]!)).toBe(1);
  });
  it('récompenses gratuites pour tous, récompenses du passe après achat', () => {
    let s = run(newGame(), { type: 'setPlayerName', name: 'Test' }).state;
    s.stats.expeditions += 80; // 2 000 points → palier 10
    s = run(s, { type: 'claimSeasonReward', level: 1, track: 'free' }).state;
    expect(() => run(s, { type: 'claimSeasonReward', level: 1, track: 'free' })).toThrow(/déjà/);
    expect(() => run(s, { type: 'claimSeasonReward', level: 10, track: 'premium' })).toThrow(/passe/);
    expect(() => run(s, { type: 'claimSeasonReward', level: 12, track: 'free' })).toThrow(/palier 12/);
    s = run(s, buy('passe_s1')).state;
    expect(s.season.premium).toBe(true);
    s = run(s, { type: 'claimSeasonReward', level: 10, track: 'premium' }).state;
    expect(s.sanctuary.decorations.statue_eveil).toBe(true);
  });
  it('le passe d\'une saison terminée ne s\'achète plus', () => {
    expect(purchaseBlocker(newGame(), 'passe_s1', T0, '2030-01-01')).toBe('Saison terminée');
  });
});

describe('Améliorations en cristaux', () => {
  it('le Sac d\'explorateur ajoute une expédition simultanée', () => {
    const s = newGame();
    s.wallet.crystals = 500;
    for (let i = 0; i < 6; i++) s.dex[`x${i}`] = { speciesId: `x${i}`, firstObtainedAt: 1, obtainedCount: 1, variants: [] };
    expect(maxExpeditions(s)).toBe(3);
    const { state } = run(s, { type: 'buy', offerId: 'perk_sac' });
    expect(maxExpeditions(state)).toBe(4);
    expect(() => run(state, { type: 'buy', offerId: 'perk_sac' })).toThrow(/déjà/);
  });
});

describe('Migration v5 → v6', () => {
  it('ajoute saison, achats et améliorations', () => {
    const v6 = migrate({ schemaVersion: 5, unlocks: { ambiances: ['neutre', 'serre'] } }, SCHEMA_VERSION) as Record<string, any>;
    expect(v6.unlocks).toEqual({ ambiances: ['neutre', 'serre'], perks: [] });
    expect(v6.premium.purchases).toEqual([]);
    expect(v6.season.premium).toBe(false);
  });
});
