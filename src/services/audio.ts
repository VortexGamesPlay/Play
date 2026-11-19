/**
 * Effets sonores synthétisés en temps réel (Web Audio) : aucun fichier audio à charger.
 * La musique d'ambiance par biome arrivera en Phase 8.
 */
type Sfx = 'tap' | 'coin' | 'crack' | 'reveal' | 'levelUp' | 'error' | 'buy' | 'open' | 'whoosh';

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!ctx) ctx = new AudioContext();
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
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
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
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(a.destination);
  src.start(t);
}

const MAJOR = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568];

export function playSfx(name: Sfx, tier = 0) {
  try {
    switch (name) {
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
