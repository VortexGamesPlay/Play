import { playNotify, playSoft } from '../services/audio';
import { create } from 'zustand';
import type { GameEvent } from '@core/events';

export type Route =
  | 'sanctuaire' | 'incubateur' | 'collection' | 'bestiaire' | 'laboratoire'
  | 'exploration' | 'arene' | 'chez-nous' | 'boutique' | 'inventaire' | 'communaute' | 'profil' | 'saison';

export const ROUTES: Route[] = ['sanctuaire', 'incubateur', 'collection', 'bestiaire', 'laboratoire', 'exploration', 'arene', 'chez-nous', 'boutique', 'inventaire', 'communaute', 'profil', 'saison'];

export type ToastKind = 'info' | 'success' | 'error' | 'reward';
export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}

export type Modal =
  | { kind: 'creature'; uid: string }
  | { kind: 'dex'; speciesId: string }
  | { kind: 'eggPicker'; slot: number }
  | { kind: 'odds'; eggType: string }
  | { kind: 'feed'; uid?: string; item?: string }
  | { kind: 'hatch'; event: Extract<GameEvent, { type: 'hatched' }> }
  | { kind: 'evolve'; event: Extract<GameEvent, { type: 'evolved' }> }
  | { kind: 'breedFx'; parents: [string, string]; eggUid: string }
  | { kind: 'biome'; biomeId: string }
  | { kind: 'battle' }
  | { kind: 'checkout'; productId: string }
  | { kind: 'teamPicker' }
  | { kind: 'elementGuide' }
  | { kind: 'expedition'; biomeId: string }
  | { kind: 'expeditionResult'; event: Extract<GameEvent, { type: 'expeditionDone' }> }
  | { kind: 'parentPicker'; exclude: string | null; onPick: (uid: string) => void }
  | { kind: 'confirm'; title: string; body: string; confirmLabel: string; danger?: boolean; onConfirm: () => void };

interface UiState {
  route: Route;
  toasts: Toast[];
  modals: Modal[];
  moreOpen: boolean;
  navigate(r: Route): void;
  toast(t: Omit<Toast, 'id'>): void;
  dismissToast(id: number): void;
  openModal(m: Modal): void;
  closeModal(): void;
  setMoreOpen(v: boolean): void;
}

let toastId = 0;

function routeFromHash(): Route {
  const h = (typeof location !== 'undefined' ? location.hash : '').replace(/^#\/?/, '') as Route;
  return ROUTES.includes(h) ? h : 'sanctuaire';
}

export const useUi = create<UiState>((set, get) => ({
  route: routeFromHash(),
  toasts: [],
  modals: [],
  moreOpen: false,
  navigate(route) {
    if (location.hash !== `#${route}`) location.hash = route;
    set({ route, moreOpen: false, modals: [] });
  },
  toast(t) {
    if (t.kind === 'info' || t.kind === 'success') playNotify();
    const id = ++toastId;
    set({ toasts: [...get().toasts.slice(-3), { ...t, id }] });
    setTimeout(() => get().dismissToast(id), t.kind === 'error' ? 4200 : 3200);
  },
  dismissToast(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
  openModal(m) {
    set({ modals: [...get().modals, m] });
  },
  closeModal() {
    if (get().modals.length) playSoft('close');
    set({ modals: get().modals.slice(0, -1) });
  },
  setMoreOpen(v) {
    set({ moreOpen: v });
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    const route = routeFromHash();
    // Changer d'écran ferme les fenêtres ouvertes (sauf si on reste sur le même écran).
    if (route !== useUi.getState().route) useUi.setState({ route, modals: [], moreOpen: false });
  });
}
