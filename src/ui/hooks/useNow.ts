import { useSyncExternalStore } from 'react';

/** Horloge partagée (un seul intervalle pour toute l'application). */
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 500);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) { clearInterval(timer); timer = null; }
  };
}

export function useNow(): number {
  return useSyncExternalStore(subscribe, () => now, () => now);
}
