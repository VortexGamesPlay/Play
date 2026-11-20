/**
 * Effets sonores synthétisés en temps réel (Web Audio) : aucun fichier audio à charger.
 * La musique originale est gérée par services/music.ts.
 */
export type Sfx =
  | 'tap' | 'coin' | 'crack' | 'reveal' | 'levelUp' | 'error' | 'buy' | 'open' | 'whoosh' | 'hit'
  | 'feed' | 'happy' | 'favorite' | 'placeEgg' | 'speedUp' | 'release' | 'breed' | 'crystal' | 'claim' | 'harvest'
  | 'expeditionStart' | 'expeditionReturn' | 'forage' | 'upgrade' | 'unlock' | 'decorate' | 'notify'
  | 'heal' | 'buff' | 'debuff' | 'ko' | 'crit' | 'stun'
  | 'eggReady' | 'mutation' | 'revealEpic' | 'battleStart' | 'round' | 'ambiance' | 'rename' | 'tab' | 'close'
  | `skill-${SkillElement}`;

/** Éléments qui ont leur propre son de compétence. */
export const SKILL_ELEMENTS = ['feu', 'eau', 'nature', 'glace', 'air', 'terre', 'foudre', 'lumiere', 'ombre', 'vapeur', 'cosmique', 'cristal', 'toxique', 'spectre', 'primordial'] as const;
type SkillElement = (typeof SKILL_ELEMENTS)[number];

/** Les effets sonores originaux (ElevenLabs), dans public/audio/sfx. Le son synthétisé sert de secours. */
const SAMPLE_NAMES: Sfx[] = [
  'tap', 'coin', 'crack', 'reveal', 'levelUp', 'error', 'buy', 'open', 'whoosh', 'hit',
  'feed', 'happy', 'favorite', 'placeEgg', 'speedUp', 'release', 'breed', 'crystal', 'claim', 'harvest',
  'expeditionStart', 'expeditionReturn', 'forage', 'upgrade', 'unlock', 'decorate', 'notify',
  'heal', 'buff', 'debuff', 'ko', 'crit', 'stun',
  'eggReady', 'mutation', 'revealEpic', 'battleStart', 'round', 'ambiance', 'rename', 'tab', 'close',
  ...SKILL_ELEMENTS.map((e) => `skill-${e}` as const),
];
/** Sons de secours (synthétisés) pour les nouveaux effets, si le fichier manque. */
const FALLBACK: Partial<Record<Sfx, Sfx>> = {
  feed: 'tap', happy: 'tap', favorite: 'tap', placeEgg: 'whoosh', speedUp: 'whoosh', release: 'whoosh', breed: 'whoosh',
  crystal: 'coin', claim: 'buy', harvest: 'coin', expeditionStart: 'whoosh', expeditionReturn: 'open', forage: 'coin',
  upgrade: 'buy', unlock: 'levelUp', decorate: 'tap', notify: 'open', heal: 'levelUp', buff: 'open', debuff: 'error',
  ko: 'error', crit: 'hit', stun: 'error',
  eggReady: 'crack', mutation: 'levelUp', revealEpic: 'reveal', battleStart: 'open', round: 'tap', ambiance: 'open',
  rename: 'tap', tab: 'tap', close: 'tap',
  ...Object.fromEntries(SKILL_ELEMENTS.map((e) => [`skill-${e}`, 'whoosh'])),
};
const samples = new Map<Sfx, AudioBuffer>();
const requested = new Set<Sfx>();
/** Sons de combat et de grandes révélations : chargés seulement quand on en a besoin (économie de données mobiles). */
export const COMBAT_SFX: Sfx[] = ['battleStart', 'round', 'hit', 'crit', 'heal', 'buff', 'debuff', 'stun', 'ko', ...SKILL_ELEMENTS.map((e) => `skill-${e}` as const)];
const LAZY = new Set<Sfx>([...COMBAT_SFX, 'revealEpic', 'mutation']);

function loadSample(a: AudioContext, n: Sfx) {
  if (requested.has(n) || typeof fetch === 'undefined') return;
  requested.add(n);
  fetch(`${import.meta.env.BASE_URL}audio/sfx/${n}.mp3`)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then((buf) => a.decodeAudioData(buf))
    .then((decoded) => { samples.set(n, decoded); })
    .catch(() => { requested.delete(n); /* fichier indisponible : on garde le son synthétisé */ });
}

function loadSamples(a: AudioContext) {
  for (const n of SAMPLE_NAMES) if (!LAZY.has(n)) loadSample(a, n);
}

/** Précharge un groupe de sons (ex. à l'ouverture d'un combat). */
export function preloadSfx(names: Sfx[]) {
  const a = ac();
  if (a) for (const n of names) loadSample(a, n);
}

/** Joue l'échantillon s'il est chargé ; renvoie false sinon. */
function playSample(name: Sfx, gain = 1): boolean {
  const a = ac();
  const buf = samples.get(name);
  if (a && !buf && SAMPLE_NAMES.includes(name)) loadSample(a, name);
  if (!a || !buf) return false;
  const src = a.createBufferSource();
  src.buffer = buf;
  const g = a.createGain();
  g.gain.value = Math.min(1, sfxVol * gain);
  src.connect(g).connect(a.destination);
  src.start();
  return true;
}

let ctx: AudioContext | null = null;
let enabled = true;
let sfxVol = 0.8;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

export function setSfxVolume(v: number) {
  sfxVol = v;
}

function ac(): AudioContext | null {
  if (!enabled || sfxVol <= 0) return null;
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!ctx) { ctx = new AudioContext(); loadSamples(ctx); }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12, slideTo?: number) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * sfxVol * 1.25), t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(start: number, dur: number, gain = 0.15, freq = 1800) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + start;
  const buffer = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = gain * sfxVol * 1.25;
  src.connect(filter).connect(g).connect(a.destination);
  src.start(t);
}

const MAJOR = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568];

let lastSfxAt = 0;

export function playSfx(name: Sfx, tier = 0) {
  lastSfxAt = Date.now();
  try {
    if (!ac()) return;
    const quiet: Partial<Record<Sfx, number>> = { tap: 0.55, open: 0.6, whoosh: 0.7, hit: 0.8, notify: 0.6, happy: 0.7, decorate: 0.7, favorite: 0.7, tab: 0.5, close: 0.5, round: 0.7 };
    // Éclosion / évolution légendaire ou plus : grande révélation dédiée.
    if (name === 'reveal' && tier >= 4 && playSample('revealEpic', 1)) return;
    if (playSample(name, quiet[name] ?? 0.85)) {
      // Les éclosions très rares gardent une note grave en plus, pour marquer le moment.
      if (name === 'reveal' && tier >= 5) tone(130.8, 0, 1.4, 'sine', 0.1);
      return;
    }
    const fb = FALLBACK[name];
    if (fb) { playSfx(fb, tier); return; }
    switch (name) {
      case 'hit': noise(0, 0.1, 0.2, 600); tone(160, 0, 0.12, 'triangle', 0.08, 80); break;
      case 'tap': tone(660, 0, 0.08, 'triangle', 0.06); break;
      case 'open': tone(520, 0, 0.1, 'sine', 0.06, 780); break;
      case 'whoosh': noise(0, 0.35, 0.08, 900); break;
      case 'coin': tone(988, 0, 0.08, 'square', 0.04); tone(1318, 0.07, 0.18, 'square', 0.04); break;
      case 'buy': tone(660, 0, 0.1, 'triangle', 0.08); tone(880, 0.08, 0.1, 'triangle', 0.08); tone(1320, 0.16, 0.2, 'triangle', 0.08); break;
      case 'crack': noise(0, 0.12, 0.25, 2500); tone(180, 0, 0.1, 'square', 0.04, 90); break;
      case 'error': tone(220, 0, 0.12, 'sawtooth', 0.05); tone(180, 0.1, 0.18, 'sawtooth', 0.05); break;
      case 'levelUp': MAJOR.slice(0, 4).forEach((f, i) => tone(f, i * 0.07, 0.22, 'triangle', 0.07)); break;
      case 'reveal': {
        const notes = MAJOR.slice(0, Math.min(MAJOR.length, 3 + Math.ceil(tier / 2)));
        notes.forEach((f, i) => tone(f, i * 0.09, 0.5, 'sine', 0.09));
        if (tier >= 3) notes.forEach((f, i) => tone(f * 2, 0.4 + i * 0.06, 0.6, 'triangle', 0.04));
        if (tier >= 5) tone(130.8, 0, 1.4, 'sine', 0.1);
        break;
      }
    }
  } catch {
    /* l'audio ne doit jamais casser le jeu */
  }
}

// Prépare les effets dès le premier toucher (le navigateur l'exige), pour que le tout premier clic ait déjà son vrai son.
if (typeof window !== 'undefined') {
  const prime = () => { window.removeEventListener('pointerdown', prime, true); ac(); };
  window.addEventListener('pointerdown', prime, true);
  // Onglets : un petit « tic » pour tous les onglets du jeu.
  window.addEventListener('click', (e) => {
    const btn = (e.target as Element | null)?.closest?.('.tabs button, [role="tab"]');
    if (btn && !btn.classList.contains('on') && !btn.getAttribute('aria-selected')?.includes('true')) playSfx('tab');
  }, true);
}

/** Son discret joué seulement si aucun autre son ne vient d'être joué (évite les doublons). */
export function playSoft(name: Sfx) {
  setTimeout(() => { if (Date.now() - lastSfxAt > 300) playSfx(name); }, 30);
}

export function playNotify() {
  playSoft('notify');
}
