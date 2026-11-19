import { BALANCE } from '@data/balance';
import { addEgg } from './systems/inventory';
import type { GameState } from './types';

export const SCHEMA_VERSION = 6;

export function createInitialState(now: number): GameState {
  const state: GameState = {
    schemaVersion: SCHEMA_VERSION,
    player: { name: 'Gardien', createdAt: now },
    wallet: { ...BALANCE.startingWallet },
    inventory: { ...BALANCE.startingInventory },
    eggs: [],
    incubators: Array.from({ length: BALANCE.startingIncubators }, () => ({ egg: null, startedAt: 0, readyAt: 0, ambiance: 'neutre' })),
    creatures: [],
    dex: {},
    discoveries: [],
    ledger: [],
    quests: { claimed: [] },
    stats: {
      eggsObtained: 0, eggsHatched: 0, purchases: 0, harvests: 0, coinsHarvested: 0,
      creaturesFed: 0, levelUps: 0, released: 0, dailyClaims: 0, speedUps: 0, evolutions: 0, breedings: 0, expeditions: 0, forages: 0, buildingUpgrades: 0, battlesWon: 0, battlesLost: 0, bossesDefeated: 0,
    },
    sanctuary: { lastHarvestAt: now, buildings: { nichoirs: 1, grenier: 1 }, decorations: {}, theme: 'prairie' },
    expeditions: [],
    exploration: { expeditionsByBiome: {}, secretsFound: [], lastForageAt: {} },
    missions: { dayKey: null, dayBaseline: null, dayClaimed: [], weekKey: null, weekBaseline: null, weekClaimed: [] },
    achievements: [],
    sideQuests: [],
    combat: { team: [], pending: null, league: {}, bossFirst: [], bossDaily: {}, towerFloor: 0 },
    daily: { lastClaimDay: null, streak: 0 },
    unlocks: { ambiances: ['neutre'], perks: [] },
    season: { id: null, baseline: null, premium: false, claimedFree: [], claimedPremium: [] },
    premium: { purchases: [], spendLimitCents: null, ownedThemes: [] },
    recipesFound: [],
    settings: { sound: true, reducedMotion: false, locale: 'en' },
    uidCounter: 0,
  };
  for (const egg of BALANCE.startingEggs) addEgg(state, egg, 'Cadeau de bienvenue', now);
  return state;
}
