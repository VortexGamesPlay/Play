/**
 * Musique originale d'EGGVERSE (composée avec ElevenLabs, fichiers dans public/audio/music).
 * Deux lecteurs en alternance pour des fondus enchaînés entre les zones,
 * et des jingles courts (victoire, éclosion rare…) qui baissent la musique le temps de jouer.
 * Les navigateurs interdisent le son avant une interaction : la lecture démarre au premier toucher.
 */
export const MUSIC_TRACKS = [
  'title', 'sanctuary-day', 'sanctuary-night', 'incubator', 'lab', 'shop', 'arena', 'boss', 'event',
  'biome-foret', 'biome-abysses', 'biome-montagnes', 'biome-volcan', 'biome-marais', 'biome-desert', 'biome-ombres', 'biome-cosmos',
] as const;
export type MusicTrack = (typeof MUSIC_TRACKS)[number];
export type Stinger = 'sting-victory' | 'sting-defeat' | 'sting-rare-hatch' | 'sting-evolution';

const FADE_MS = 1400;
const DUCK = 0.25;

const url = (id: string) => `${import.meta.env.BASE_URL}audio/music/${id}.mp3`;

let enabled = true;
let volume = 0.6;
let sfxVolume = 0.8;
let wanted: MusicTrack | null = null;
let unlocked = false;
let duck = 1;
const players: { el: HTMLAudioElement; track: MusicTrack | null; gain: number }[] = [];
let active = 0;
let raf = 0;

function ensurePlayers() {
  if (players.length || typeof Audio === 'undefined') return;
  for (let i = 0; i < 2; i++) {
    const el = new Audio();
    el.loop = true;
    el.preload = 'none';
    players.push({ el, track: null, gain: 0 });
  }
}

function applyVolumes() {
  for (const p of players) p.el.volume = Math.max(0, Math.min(1, p.gain * volume * duck));
}

/** Fondu : le lecteur actif monte vers 1, l'autre descend vers 0 puis s'arrête. */
function animate() {
  cancelAnimationFrame(raf);
  let last = performance.now();
  const step = (now: number) => {
    const d = (now - last) / FADE_MS;
    last = now;
    let moving = false;
    players.forEach((p, i) => {
      const target = i === active && enabled ? 1 : 0;
      if (p.gain !== target) {
        p.gain = target > p.gain ? Math.min(target, p.gain + d) : Math.max(target, p.gain - d);
        moving = true;
      }
      if (p.gain === 0 && !p.el.paused) p.el.pause();
    });
    applyVolumes();
    if (moving) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

function start() {
  ensurePlayers();
  if (!players.length || !unlocked || !enabled || !wanted || volume <= 0) { animate(); return; }
  const cur = players[active]!;
  if (cur.track !== wanted) {
    active = 1 - active;
    const next = players[active]!;
    if (next.track !== wanted) {
      next.track = wanted;
      next.el.src = url(wanted);
      next.el.currentTime = 0;
    }
  }
  const p = players[active]!;
  if (p.el.paused) {
    void p.el.play().catch((e: unknown) => {
      // AbortError = lecture interrompue par un changement de zone : normal, on ignore.
      // NotAllowedError = le navigateur exige une interaction : on réessaie au prochain toucher.
      if (e instanceof DOMException && e.name === 'NotAllowedError') { unlocked = false; listenForUnlock(); }
    });
  }
  animate();
}

let listening = false;
function listenForUnlock() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  const go = () => {
    unlocked = true;
    listening = false;
    window.removeEventListener('pointerdown', go);
    window.removeEventListener('keydown', go);
    start();
  };
  window.addEventListener('pointerdown', go);
  window.addEventListener('keydown', go);
}

export function initMusic() {
  if (typeof document === 'undefined') return;
  listenForUnlock();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') players.forEach((p) => p.el.pause());
    else start();
  });
}

export function setMusicTrack(track: MusicTrack | null) {
  if (track === wanted) return;
  wanted = track;
  start();
}

export function setMusicEnabled(on: boolean) {
  enabled = on;
  start();
}

export function setMusicVolume(v: number) {
  volume = v;
  applyVolumes();
  start();
}

export function setStingerVolume(v: number) {
  sfxVolume = v;
}

/** Jingle court par-dessus la musique, qui est baissée pendant ce temps. */
export function playStinger(id: Stinger) {
  if (!enabled || !unlocked || typeof Audio === 'undefined') return;
  const el = new Audio(url(id));
  el.volume = Math.min(1, Math.max(volume, sfxVolume) * 0.9);
  duck = DUCK;
  applyVolumes();
  const restore = () => { duck = 1; applyVolumes(); };
  el.addEventListener('ended', restore);
  el.addEventListener('error', restore);
  void el.play().catch(restore);
}
