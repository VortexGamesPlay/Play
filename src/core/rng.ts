import type { Rng } from './types';

/** Mulberry32 — RNG déterministe, rapide, reproductible (tests, replays, validation serveur). */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0]!;
  }
  return Math.floor(Math.random() * 2 ** 32);
}

export function randInt(rng: Rng, min: number, maxInclusive: number): number {
  return min + Math.floor(rng.next() * (maxInclusive - min + 1));
}

export function randFloat(rng: Rng, min: number, max: number): number {
  return min + rng.next() * (max - min);
}

export function pick<T>(rng: Rng, list: readonly T[]): T {
  if (list.length === 0) throw new Error('pick() sur une liste vide');
  return list[Math.floor(rng.next() * list.length)]!;
}

/** Tirage pondéré. Les poids <= 0 sont ignorés. */
export function weightedPick<T>(rng: Rng, entries: readonly { value: T; weight: number }[]): T {
  const valid = entries.filter((e) => e.weight > 0);
  const total = valid.reduce((s, e) => s + e.weight, 0);
  if (total <= 0) throw new Error('weightedPick() sans poids positif');
  let r = rng.next() * total;
  for (const e of valid) {
    r -= e.weight;
    if (r < 0) return e.value;
  }
  return valid[valid.length - 1]!.value;
}
