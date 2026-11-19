import type { Palette } from '@core/content';
import { lighten, mix, rotateHue, sepia } from './color';

/**
 * Apparence des mutations : transformation de palette + couches visuelles.
 * Pour ajouter une mutation : une entrée ici (et dans data/mutations.ts). Le moteur de rendu ne change pas.
 */
export type Overlay = 'sparkles' | 'cracks' | 'runes' | 'facets' | 'frost' | 'embers' | 'flowers' | 'thirdEye' | 'wisps';

export interface MutationLook {
  palette?: (p: Palette) => Palette;
  overlays?: Overlay[];
  /** Remplit le corps d'un motif cosmique. */
  cosmicBody?: boolean;
  /** Opacité du corps (translucidité spectrale). */
  opacity?: number;
  glow?: string;
}

const map = (p: Palette, f: (c: string, k: keyof Palette) => string): Palette =>
  ({ primary: f(p.primary, 'primary'), secondary: f(p.secondary, 'secondary'), accent: f(p.accent, 'accent'), belly: f(p.belly, 'belly'), eye: f(p.eye, 'eye') });

export const MUTATION_LOOKS: Record<string, MutationLook> = {
  chromatique: { palette: (p) => map(p, (c, k) => (k === 'eye' ? c : rotateHue(c, 150))), overlays: ['sparkles'] },
  doree: { palette: (p) => ({ ...p, primary: '#f7c948', secondary: '#d4911a', accent: '#fff1a8', belly: '#fff4cf' }), overlays: ['sparkles'], glow: '#ffd84a' },
  corrompue: {
    palette: (p) => ({ primary: mix(p.primary, '#2a1438', 0.65), secondary: mix(p.secondary, '#14081e', 0.7), accent: '#e040ff', belly: mix(p.belly, '#5a2a6a', 0.6), eye: '#ff4fd8' }),
    overlays: ['cracks'], glow: '#c040ff',
  },
  antique: { palette: (p) => ({ ...map(p, sepia), accent: '#e8c070' }), overlays: ['runes'] },
  spectrale: { opacity: 0.68, overlays: ['wisps'], glow: '#b8a6f0' },
  cristalline: { palette: (p) => map(p, (c, k) => (k === 'eye' ? c : mix(c, '#d8f6ff', 0.35))), overlays: ['facets'], glow: '#9fe8ff' },
  cosmique: { cosmicBody: true, glow: '#7a5af0' },
  givree: { palette: (p) => ({ ...p, primary: mix(p.primary, '#c8f2ff', 0.45), secondary: mix(p.secondary, '#7fc8f0', 0.4), belly: lighten(p.belly, 4) }), overlays: ['frost'] },
  ardente: { palette: (p) => ({ ...p, primary: mix(p.primary, '#ff8a3d', 0.35), secondary: mix(p.secondary, '#d9452b', 0.3) }), overlays: ['embers'], glow: '#ff8a3d' },
  florale: { palette: (p) => ({ ...p, primary: mix(p.primary, '#ffc2e0', 0.22) }), overlays: ['flowers'] },
  mutante: { palette: (p) => ({ ...p, primary: mix(p.primary, '#9be05a', 0.2) }), overlays: ['thirdEye'] },
};

export function resolveLook(base: Palette, mutations: string[], hue: number) {
  let palette = hue ? map(base, (c, k) => (k === 'eye' ? c : rotateHue(c, hue))) : { ...base };
  const overlays = new Set<Overlay>();
  let cosmicBody = false;
  let opacity = 1;
  let glow: string | undefined;
  for (const m of mutations) {
    const look = MUTATION_LOOKS[m];
    if (!look) continue;
    if (look.palette) palette = look.palette(palette);
    look.overlays?.forEach((o) => overlays.add(o));
    if (look.cosmicBody) cosmicBody = true;
    if (look.opacity) opacity = Math.min(opacity, look.opacity);
    if (look.glow) glow = look.glow;
  }
  return { palette, overlays, cosmicBody, opacity, glow };
}
