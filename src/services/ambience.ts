/**
 * Ambiances météo en boucle (pluie, neige, orage…), jouées doucement sous la musique.
 * Fichiers : public/audio/ambience/*.mp3 (créés avec ElevenLabs). Volume lié au volume des effets.
 */
export type AmbienceId = 'rain' | 'snow' | 'storm' | 'wind' | 'embers' | 'fog' | 'stars' | 'aurora' | 'sun';
const IDS: AmbienceId[] = ['rain', 'snow', 'storm', 'wind', 'embers', 'fog', 'stars', 'aurora', 'sun'];
const LEVEL = 0.32;
const FADE_MS = 1200;

let enabled = true;
let volume = 0.8;
let wanted: AmbienceId | null = null;
let unlocked = false;
let el: HTMLAudioElement | null = null;
let current: AmbienceId | null = null;
let gain = 0;
let raf = 0;

export const isAmbience = (v: string): v is AmbienceId => (IDS as string[]).includes(v);

function apply() { if (el) el.volume = Math.max(0, Math.min(1, gain * volume * LEVEL)); }

function fadeTo(target: number, then?: () => void) {
  cancelAnimationFrame(raf);
  let last = performance.now();
  const step = (now: number) => {
    const d = (now - last) / FADE_MS; last = now;
    gain = target > gain ? Math.min(target, gain + d) : Math.max(target, gain - d);
    apply();
    if (gain !== target) raf = requestAnimationFrame(step); else then?.();
  };
  raf = requestAnimationFrame(step);
}

function update() {
  if (typeof Audio === 'undefined') return;
  const target = enabled && unlocked && volume > 0 ? wanted : null;
  if (target === current && el && !el.paused) { fadeTo(1); return; }
  if (current && el) {
    // On éteint l'ambiance actuelle avant d'en lancer une autre.
    fadeTo(0, () => { el?.pause(); current = null; if (target) update(); });
    return;
  }
  if (!target) return;
  el ??= Object.assign(new Audio(), { loop: true, preload: 'none' });
  el.src = `${import.meta.env.BASE_URL}audio/ambience/${target}.mp3`;
  current = target;
  gain = 0; apply();
  void el.play().then(() => fadeTo(1)).catch((e: unknown) => {
    if (e instanceof DOMException && e.name === 'NotAllowedError') { unlocked = false; current = null; listen(); }
  });
}

let listening = false;
function listen() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  const go = () => { unlocked = true; listening = false; window.removeEventListener('pointerdown', go); update(); };
  window.addEventListener('pointerdown', go);
}

export function initAmbience() {
  listen();
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') el?.pause(); else if (current && el) void el.play().catch(() => {});
  });
}

export function setAmbience(id: AmbienceId | null) {
  if (id === wanted) return;
  wanted = id;
  update();
}

export function setAmbienceEnabled(on: boolean) { enabled = on; update(); }
export function setAmbienceVolume(v: number) { volume = v; apply(); update(); }
