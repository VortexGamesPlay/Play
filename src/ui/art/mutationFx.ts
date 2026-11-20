/**
 * Effets des mutations sur les illustrations peintes.
 * Chaque mutation combine : filtre de couleur sur l'illustration, calques découpés à sa forme
 * (teinte, texture peinte, reflet animé), particules et halo. Toutes les variantes se cumulent.
 */
export type Particle = 'sparkles' | 'embers' | 'snow' | 'petals' | 'wisps' | 'motes';

export interface FxLayer {
  /** Texture peinte (public/art/tex) ou couleur unie. */
  tex?: string;
  color?: string;
  blend: 'color' | 'overlay' | 'screen' | 'multiply' | 'soft-light' | 'hard-light';
  opacity: number;
  /** Texture qui dérive lentement (galaxie qui tourne, veines qui pulsent). */
  drift?: boolean;
  pulse?: boolean;
}

export interface MutationFx {
  filter?: string;
  layers?: FxLayer[];
  sheen?: 'gold' | 'rainbow' | 'ice';
  particles?: Particle;
  glow?: string;
  opacity?: number;
  /** Classe d'animation supplémentaire sur la créature. */
  cls?: string;
}

export const MUTATION_FX: Record<string, MutationFx> = {
  irisee: { filter: 'hue-rotate(150deg) saturate(1.25)', sheen: 'rainbow', particles: 'sparkles', cls: 'fx-iris' },
  doree: {
    filter: 'sepia(.85) saturate(2.4) hue-rotate(-10deg) brightness(1.08) contrast(1.06)',
    layers: [{ color: '#ffd24a', blend: 'overlay', opacity: 0.4 }],
    sheen: 'gold', particles: 'sparkles', glow: '#ffd84a',
  },
  corrompue: {
    filter: 'saturate(.75) brightness(.82)',
    layers: [{ color: '#3a0f52', blend: 'multiply', opacity: 0.55 }, { tex: 'veines', blend: 'screen', opacity: 0.95, pulse: true }],
    particles: 'motes', glow: '#c040ff',
  },
  antique: {
    filter: 'sepia(.8) saturate(1.15) contrast(1.05)',
    layers: [{ tex: 'runes', blend: 'screen', opacity: 0.8, pulse: true }],
    glow: '#e8c070',
  },
  spectrale: { filter: 'brightness(1.12) saturate(.75)', opacity: 0.62, particles: 'wisps', glow: '#b8a6f0', cls: 'fx-ghost' },
  cristalline: {
    filter: 'saturate(.8) brightness(1.08)',
    layers: [{ color: '#cff4ff', blend: 'color', opacity: 0.3 }, { tex: 'cristal', blend: 'overlay', opacity: 0.9 }],
    sheen: 'ice', particles: 'sparkles', glow: '#9fe8ff',
  },
  cosmique: {
    layers: [{ tex: 'galaxie', blend: 'color', opacity: 1, drift: true }, { tex: 'galaxie', blend: 'screen', opacity: 0.5, drift: true }],
    particles: 'sparkles', glow: '#7a5af0',
  },
  givree: {
    layers: [{ color: '#bfefff', blend: 'color', opacity: 0.45 }, { tex: 'givre', blend: 'screen', opacity: 0.85 }],
    particles: 'snow', glow: '#c8f4ff',
  },
  ardente: {
    filter: 'saturate(1.15)',
    layers: [{ color: '#ff7a2a', blend: 'color', opacity: 0.28 }, { color: '#ffb03d', blend: 'soft-light', opacity: 0.5 }],
    particles: 'embers', glow: '#ff8a3d', cls: 'fx-heat',
  },
  florale: { layers: [{ color: '#ff9fd0', blend: 'soft-light', opacity: 0.55 }], particles: 'petals', glow: '#ffc2e0' },
  mutante: { layers: [{ color: '#9be05a', blend: 'color', opacity: 0.25 }], particles: 'motes', glow: '#9be05a', cls: 'fx-glitch' },
};

/** `painted` : mutation déjà peinte dans l'illustration (on garde seulement halo et particules). */
export function resolveFx(mutations: string[], hue: number, painted?: string) {
  const filters: string[] = [];
  if (hue) filters.push(`hue-rotate(${hue}deg)`);
  const layers: FxLayer[] = [];
  const particles = new Set<Particle>();
  const classes: string[] = [];
  let sheen: MutationFx['sheen'];
  let glow: string | undefined;
  let opacity = 1;
  for (const m of mutations) {
    const fx = MUTATION_FX[m];
    if (!fx) continue;
    if (fx.particles) particles.add(fx.particles);
    if (fx.glow) glow = fx.glow;
    if (m === painted) continue;
    if (fx.filter) filters.push(fx.filter);
    if (fx.layers) layers.push(...fx.layers);
    if (fx.cls) classes.push(fx.cls);
    if (fx.sheen) sheen = fx.sheen;
    if (fx.opacity) opacity = Math.min(opacity, fx.opacity);
  }
  return { filter: filters.join(' ') || undefined, layers, particles: [...particles], classes, sheen, glow, opacity };
}
