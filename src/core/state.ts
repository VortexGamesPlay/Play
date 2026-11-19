import { BALANCE } from '@data/balance';
import { addEgg } from './systems/inventory';
import type { GameState } from './types';

export const SCHEMA_VERSION = 1;

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
      creaturesFed: 0, levelUps: 0, released: 0, dailyClaims: 0, speedUps: 0,
    },
    sanctuary: { lastHarvestAt: now },
    daily: { lastClaimDay: null, streak: 0 },
    unlocks: { ambiances: ['neutre'] },
    settings: { sound: true, reducedMotion: false },
    uidCounter: 0,
  };
  for (const egg of BALANCE.startingEggs) addEgg(state, egg, 'Cadeau de bienvenue', now);
  return state;
}
