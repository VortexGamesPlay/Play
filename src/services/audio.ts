/**
 * Effets sonores synthétisés en temps réel (Web Audio) : aucun fichier audio à charger.
 * La musique originale est gérée par services/music.ts.
 */
type Sfx = 'tap' | 'coin' | 'crack' | 'reveal' | 'levelUp' | 'error' | 'buy' | 'open' | 'whoosh' | 'hit';

/** Les 10 effets sonores originaux (ElevenLabs), dans public/audio/sfx. Le son synthétisé sert de secours. */
const SAMPLE_NAMES: Sfx[] = ['tap', 'coin', 'crack', 'reveal', 'levelUp', 'error', 'buy', 'open', 'whoosh', 'hit'];
const samples = new Map<Sfx, AudioBuffer>();
let samplesRequested = false;

function loadSamples(a: AudioContext) {
  if (samplesRequested || typeof fetch === 'undefined') return;
  samplesRequested = true;
  for (const n of SAMPLE_NAMES) {
    fetch(`${import.meta.env.BASE_URL}audio/sfx/${n}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((buf) => a.decodeAudioData(buf))
      .then((decoded) => { samples.set(n, decoded); })
      .catch(() => { /* fichier indisponible : on garde le son synthétisé */ });
  }
}

/** Joue l'échantillon s'il est chargé ; renvoie false sinon. */
function playSample(name: Sfx, gain = 1): boolean {
  const a = ac();
  const buf = samples.get(name);
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

export function playSfx(name: Sfx, tier = 0) {
  try {
    if (!ac()) return;
    const quiet: Partial<Record<Sfx, number>> = { tap: 0.55, open: 0.6, whoosh: 0.7, hit: 0.8 };
    if (playSample(name, quiet[name] ?? 0.9)) {
      // Les éclosions très rares gardent une note grave en plus, pour marquer le moment.
      if (name === 'reveal' && tier >= 5) tone(130.8, 0, 1.4, 'sine', 0.1);
      return;
    }
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
}
