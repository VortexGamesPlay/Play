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
import { createSaveStorage, LocalSaveRepository } from '../services/localSaveRepository';
import type { SaveRepository } from '../services/saveRepository';
import { playSfx, setSfxVolume, setSoundEnabled } from '../services/audio';
import { playStinger, setMusicEnabled, setMusicVolume, setStingerVolume } from '../services/music';
import { setAmbienceEnabled, setAmbienceVolume } from '../services/ambience';
import { RARITIES } from '@data/rarities';
import { useUi } from './uiStore';
import { setLocale as applyLocale } from '../i18n';
import { downloadSave, flushUpload, scheduleUpload, uploadNow, type CloudSave } from '../services/cloudSave';
import { serverAvailable } from '../services/supabase';
import { fmtDateTime } from '../ui/format';
import { tr } from '../i18n';

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
  /** Compare la partie locale et celle du serveur, et propose / applique la plus récente. */
  syncWithCloud(opts?: { afterLogin?: boolean }): Promise<void>;
  /** Remplace la partie par celle du serveur. */
  adoptCloud(cloud: CloudSave): Promise<void>;
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
/** Sons des actions qui ne produisent pas d'événement dédié. */
const ACTION_SFX: Partial<Record<GameAction['type'], Parameters<typeof playSfx>[0]>> = {
  placeEgg: 'placeEgg', speedUp: 'speedUp', toggleFavorite: 'favorite', startExpedition: 'expeditionStart',
  upgradeBuilding: 'upgrade', toggleDecoration: 'decorate', setTheme: 'decorate', setAmbiance: 'ambiance',
  rename: 'rename', setPlayerName: 'rename',
};

/** Applique les réglages (langue, son général, volumes musique / effets). */
function applyAudioSettings(st: GameState['settings']) {
  applyLocale(st.locale);
  if (typeof document !== 'undefined') document.documentElement.lang = st.locale;
  setSoundEnabled(st.sound);
  setSfxVolume(st.sfxVolume);
  setStingerVolume(st.sfxVolume);
  setMusicVolume(st.musicVolume);
  setMusicEnabled(st.sound);
  setAmbienceVolume(st.sfxVolume);
  setAmbienceEnabled(st.sound);
}

function presentEvents(events: GameEvent[], state: GameState) {
  const ui = useUi.getState();
  for (const ev of events) {
    switch (ev.type) {
      case 'reward': ui.toast({ kind: 'reward', title: ev.reason, body: rewardText(ev.reward) }); playSfx(ev.reward.crystals && !ev.reward.coins ? 'crystal' : 'claim'); break;
      case 'purchased': ui.toast({ kind: 'success', title: tr('Achat effectué'), body: ev.label }); playSfx('buy'); break;
      case 'harvested': {
        const extra = [ev.produce?.essence ? `+${ev.produce.essence} essence` : '', ...Object.entries(ev.produce?.items ?? {}).map(([id, q]) => `${ITEMS[id]?.name} ×${q}`)].filter(Boolean);
        ui.toast({ kind: 'reward', title: tr('Récolte'), body: [`+${ev.coins} pièces`, ...extra].join(' · ') }); playSfx('harvest'); break;
      }
      case 'expeditionDone': ui.openModal({ kind: 'expeditionResult', event: ev }); playSfx(ev.secretFound ? 'unlock' : 'expeditionReturn'); break;
      case 'foraged': ui.toast({ kind: 'reward', title: tr('Fouille'), body: rewardText(ev.reward) || tr('Rien de spécial…') }); playSfx('forage'); break;
      case 'levelUp': {
        const c = state.creatures.find((x) => x.uid === ev.uid);
        if (c) ui.toast({ kind: 'success', title: tr('Niveau supérieur !'), body: tr('{p0} passe au niveau {level}', { p0: c.nickname || getSpecies(c.speciesId).name, level: ev.level }) });
        playSfx('levelUp');
        break;
      }
      case 'fed': playSfx('feed'); if (ev.favorite) setTimeout(() => playSfx('happy'), 450); break;
      case 'released': ui.toast({ kind: 'info', title: tr('Créature libérée'), body: tr('+{essence} essence', { essence: ev.essence }) }); playSfx('release'); break;
      case 'hatched':
        ui.openModal({ kind: 'hatch', event: ev });
        if ((RARITIES[getSpecies(ev.creature.speciesId).rarity]?.tier ?? 0) >= 2 || ev.newVariants.length > 0) playStinger('sting-rare-hatch');
        break;
      case 'evolved': ui.openModal({ kind: 'evolve', event: ev }); playStinger('sting-evolution'); break;
      case 'battleEnded': playStinger(ev.won ? 'sting-victory' : 'sting-defeat'); break;
      case 'bred': ui.openModal({ kind: 'breedFx', parents: ev.parents, eggUid: ev.eggUid }); break;
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
      const { storage, persistent } = createSaveStorage();
      repo = new LocalSaveRepository(storage);
      if (!persistent) {
        useUi.getState().toast({ kind: 'error', title: tr('Sauvegarde limitée'), body: tr('Ton navigateur bloque le stockage : la partie sera perdue à la fermeture. Évite la navigation privée, ou exporte ta sauvegarde depuis le Profil.') });
      }
      const res = await repo.load(Date.now());
      applyAudioSettings(res.state.settings);
      set({ state: res.state, ready: true, lastSavedAt: res.savedAt });
      if (res.warning) useUi.getState().toast({ kind: 'error', title: tr('Sauvegarde'), body: res.warning });
      if (res.source === 'new') {
        // Nouvelle partie : on suit la langue de l'appareil (anglais par défaut, français si l'appareil est en français).
        const fr = typeof navigator !== 'undefined' && /^fr\b/i.test(navigator.language ?? '');
        if (fr) get().dispatch({ type: 'setLocale', locale: 'fr' });
        await get().saveNow();
      }
      if (serverAvailable()) void get().syncWithCloud({ afterLogin: res.source === 'new' });
      // Sauvegarde de sécurité quand l'application passe en arrière-plan (mobile) ou se ferme.
      const flush = () => { if (get().saveStatus === 'pending') void get().saveNow(); flushUpload(); };
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
      window.addEventListener('pagehide', flush);
    },

    dispatch(action) {
      try {
        const ctx = makeContext(Date.now(), createRng(randomSeed()));
        const { state, events } = applyAction(get().state, action, ctx);
        set({ state });
        if (action.type === 'setSetting' || action.type === 'setVolume' || action.type === 'setLocale') applyAudioSettings(state.settings);
        scheduleSave();
        const s = ACTION_SFX[action.type];
        if (s) playSfx(s);
        presentEvents(events, state);
        return events;
      } catch (err) {
        if (err instanceof GameError) {
          useUi.getState().toast({ kind: 'error', title: tr('Action impossible'), body: err.message });
          playSfx('error');
          return null;
        }
        console.error(err);
        useUi.getState().toast({ kind: 'error', title: tr('Erreur inattendue'), body: tr('L\'action n\'a pas été appliquée. Ta progression est intacte.') });
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
        scheduleUpload(get().state);
      } catch (err) {
        console.error(err);
        set({ saveStatus: 'error' });
        useUi.getState().toast({ kind: 'error', title: tr('Sauvegarde impossible'), body: tr('Le stockage de l\'appareil est peut-être plein. Exporte ta sauvegarde par sécurité.') });
      }
    },

    exportSave() {
      return serialize(get().state, Date.now());
    },

    importSave(text) {
      const { state } = deserialize(text, Date.now());
      applyAudioSettings(state.settings);
      set({ state });
      void get().saveNow();
    },

    async syncWithCloud(opts) {
      let cloud: CloudSave | null;
      try { cloud = await downloadSave(); } catch { return; /* hors-ligne : on réessaiera plus tard */ }
      const local = get().state;
      const localAt = get().lastSavedAt ?? 0;
      if (!cloud) { await uploadNow(local).catch(() => {}); return; }
      if (cloud.savedAt <= localAt + 2000) { await uploadNow(local).catch(() => {}); return; }
      // La partie du serveur est plus récente.
      const fresh = local.stats.eggsHatched === 0 && local.creatures.length === 0;
      if (opts?.afterLogin && fresh) { await get().adoptCloud(cloud); return; }
      useUi.getState().openModal({
        kind: 'confirm',
        title: tr('Partie plus récente trouvée en ligne'),
        body: tr('Une sauvegarde du {date} existe sur ton compte ({n} créatures). La charger remplacera la partie de cet appareil ({m} créatures).', { date: fmtDateTime(cloud.savedAt), n: cloud.state.creatures.length, m: local.creatures.length }),
        confirmLabel: tr('Charger la partie en ligne'),
        onConfirm: () => { useUi.getState().closeModal(); void get().adoptCloud(cloud!); },
      });
    },

    async adoptCloud(cloud) {
      applyAudioSettings(cloud.state.settings);
      set({ state: cloud.state });
      await get().saveNow();
      useUi.getState().toast({ kind: 'success', title: tr('Partie récupérée'), body: tr('Ta partie a été chargée depuis ton compte.') });
    },

    async resetGame() {
      await repo?.clear();
      const state = createInitialState(Date.now());
      set({ state });
      await get().saveNow();
    },
  };
});
