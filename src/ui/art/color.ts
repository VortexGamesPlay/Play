/** Petits utilitaires de couleur (hex ↔ HSL) pour les variantes génétiques et les mutations. */
export interface Hsl { h: number; s: number; l: number }

export function hexToHsl(hex: string): Hsl {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const S = Math.max(0, Math.min(100, s)) / 100, L = Math.max(0, Math.min(100, l)) / 100;
  const H = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const x = c * (1 - Math.abs(((H / 60) % 2) - 1));
  const m = L - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (H < 60) [r, g, b] = [c, x, 0];
  else if (H < 120) [r, g, b] = [x, c, 0];
  else if (H < 180) [r, g, b] = [0, c, x];
  else if (H < 240) [r, g, b] = [0, x, c];
  else if (H < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export const rotateHue = (hex: string, deg: number) => { const c = hexToHsl(hex); return hslToHex({ ...c, h: c.h + deg }); };
export const lighten = (hex: string, amt: number) => { const c = hexToHsl(hex); return hslToHex({ ...c, l: c.l + amt }); };
export const darken = (hex: string, amt: number) => lighten(hex, -amt);
export const sepia = (hex: string) => { const c = hexToHsl(hex); return hslToHex({ h: 34, s: 32 + c.s * 0.1, l: c.l }); };

export function mix(a: string, b: string, t: number): string {
  const pa = a.replace('#', ''), pb = b.replace('#', '');
  const ch = (p: string, i: number) => parseInt(p.slice(i, i + 2), 16);
  const out = [0, 2, 4].map((i) => Math.round(ch(pa, i) * (1 - t) + ch(pb, i) * t).toString(16).padStart(2, '0'));
  return `#${out.join('')}`;
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
