import { create } from 'zustand';
import { applyAction, type GameAction } from '@core/actions';
import { GameError } from '@core/errors';
import type { GameEvent } from '@core/events';
import { createRng, randomSeed } from '@core/rng';
import { deserialize, serialize } from '@core/save/serializer';
import { createInitialState } from '@core/state';
import { makeContext } from '@core/time';
import type { GameState } from '@core/types';
import { getSpecies } from '@core/systems/creatures';
import { CURRENCY_NAMES } from '@core/systems/economy';
import { ITEMS } from '@data/items';
import { EGGS } from '@data/eggs';
import { LocalSaveRepository } from '../services/localSaveRepository';
import type { SaveRepository } from '../services/saveRepository';
import { playSfx, setSoundEnabled } from '../services/audio';
import { useUi } from './uiStore';

type SaveStatus = 'idle' | 'pending' | 'saved' | 'error';

interface GameStore {
  state: GameState;
  ready: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  init(): Promise<void>;
  /** Exécute une action de jeu. Retourne les événements, ou null si l'action a été refusée. */
  dispatch(action: GameAction): GameEvent[] | null;
  saveNow(): Promise<void>;
  exportSave(): string;
  importSave(text: string): void;
  resetGame(): Promise<void>;
}

const AUTOSAVE_DELAY = 800;
let repo: SaveRepository | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function rewardText(r: Extract<GameEvent, { type: 'reward' }>['reward']): string {
  const parts: string[] = [];
  if (r.coins) parts.push(`+${r.coins} ${CURRENCY_NAMES.coins}`);
  if (r.crystals) parts.push(`+${r.crystals} ${CURRENCY_NAMES.crystals}`);
  if (r.essence) parts.push(`+${r.essence} ${CURRENCY_NAMES.essence}`);
  for (const [id, q] of Object.entries(r.items ?? {})) parts.push(`${ITEMS[id]?.name} ×${q}`);
  for (const e of r.eggs ?? []) parts.push(EGGS[e]?.name ?? e);
  return parts.join(' · ');
}

/** Traduit les événements de jeu en retours visuels / sonores. */
function presentEvents(events: GameEvent[], state: GameState) {
  const ui = useUi.getState();
  for (const ev of events) {
    switch (ev.type) {
      case 'reward': ui.toast({ kind: 'reward', title: ev.reason, body: rewardText(ev.reward) }); playSfx('coin'); break;
      case 'purchased': ui.toast({ kind: 'success', title: 'Achat effectué', body: ev.label }); playSfx('buy'); break;
      case 'harvested': ui.toast({ kind: 'reward', title: 'Récolte', body: `+${ev.coins} pièces` }); playSfx('coin'); break;
      case 'levelUp': {
        const c = state.creatures.find((x) => x.uid === ev.uid);
        if (c) ui.toast({ kind: 'success', title: 'Niveau supérieur !', body: `${c.nickname || getSpecies(c.speciesId).name} passe au niveau ${ev.level}` });
        playSfx('levelUp');
        break;
      }
      case 'fed': playSfx('tap'); break;
      case 'released': ui.toast({ kind: 'info', title: 'Créature libérée', body: `+${ev.essence} essence` }); break;
      case 'hatched': ui.openModal({ kind: 'hatch', event: ev }); break;
    }
  }
}

export const useGame = create<GameStore>((set, get) => {
  function scheduleSave() {
    set({ saveStatus: 'pending' });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void get().saveNow(), AUTOSAVE_DELAY);
  }

  return {
    state: createInitialState(Date.now()),
    ready: false,
    saveStatus: 'idle',
    lastSavedAt: null,

    async init() {
      repo = new LocalSaveRepository();
      const res = await repo.load(Date.now());
      setSoundEnabled(res.state.settings.sound);
      set({ state: res.state, ready: true, lastSavedAt: res.savedAt });
      if (res.warning) useUi.getState().toast({ kind: 'error', title: 'Sauvegarde', body: res.warning });
      if (res.source === 'new') await get().saveNow();
      // Sauvegarde de sécurité quand l'application passe en arrière-plan (mobile) ou se ferme.
      const flush = () => { if (get().saveStatus === 'pending') void get().saveNow(); };
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
      window.addEventListener('pagehide', flush);
    },

    dispatch(action) {
      try {
        const ctx = makeContext(Date.now(), createRng(randomSeed()));
        const { state, events } = applyAction(get().state, action, ctx);
        set({ state });
        if (action.type === 'setSetting' && action.key === 'sound') setSoundEnabled(action.value);
        scheduleSave();
        presentEvents(events, state);
        return events;
      } catch (err) {
        if (err instanceof GameError) {
          useUi.getState().toast({ kind: 'error', title: 'Action impossible', body: err.message });
          playSfx('error');
          return null;
        }
        console.error(err);
        useUi.getState().toast({ kind: 'error', title: 'Erreur inattendue', body: 'L\'action n\'a pas été appliquée. Ta progression est intacte.' });
        return null;
      }
    },

    async saveNow() {
      if (!repo) return;
      if (saveTimer) clearTimeout(saveTimer);
      try {
        const now = Date.now();
        await repo.save(get().state, now);
        set({ saveStatus: 'saved', lastSavedAt: now });
      } catch (err) {
        console.error(err);
        set({ saveStatus: 'error' });
        useUi.getState().toast({ kind: 'error', title: 'Sauvegarde impossible', body: 'Le stockage de l\'appareil est peut-être plein. Exporte ta sauvegarde par sécurité.' });
      }
    },

    exportSave() {
      return serialize(get().state, Date.now());
    },

    importSave(text) {
      const { state } = deserialize(text, Date.now());
      setSoundEnabled(state.settings.sound);
      set({ state });
      void get().saveNow();
    },

    async resetGame() {
      await repo?.clear();
      const state = createInitialState(Date.now());
      set({ state });
      await get().saveNow();
    },
  };
});
