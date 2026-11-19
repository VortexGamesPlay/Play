/**
 * Internationalisation. Langue par défaut : anglais. Langue source du code : français.
 * Les textes sont écrits en français dans le code et traduits à l'affichage : t('Texte français') → texte anglais.
 * Les paramètres s'écrivent {nom} : t('Il te manque {n} pièces.', { n: 3 }).
 * Module pur (aucune dépendance au navigateur) : utilisable par le moteur et par le futur serveur.
 */
import { EN } from './en';

export type Locale = 'en' | 'fr';
export const LOCALES: { id: Locale; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
];

let current: Locale = 'en';
const listeners = new Set<() => void>();
const missing = new Set<string>();

export function getLocale(): Locale { return current; }

export function setLocale(l: Locale): void {
  if (l === current) return;
  current = l;
  listeners.forEach((f) => f());
}

export function onLocaleChange(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

function fill(s: string, params?: Record<string, string | number>): string {
  return params ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m)) : s;
}

/** Traduit un texte écrit en français. */
export function t(fr: string, params?: Record<string, string | number>): string {
  if (current === 'fr') return fill(fr, params);
  const en = EN[fr];
  if (en === undefined && !missing.has(fr)) {
    missing.add(fr);
    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') console.warn(`[i18n] traduction manquante : ${fr}`);
  }
  return fill(en ?? fr, params);
}

/** Choisit la forme singulier / pluriel. */
export function tp(n: number, one: string, many: string, params?: Record<string, string | number>): string {
  return t(Math.abs(n) >= 2 ? many : one, { n, ...params });
}

/** Locale Intl pour les nombres, dates et prix. */
export function intlLocale(): string { return current === 'fr' ? 'fr-FR' : 'en-US'; }

export const fmtNum = (n: number) => n.toLocaleString(intlLocale());

export function missingTranslations(): string[] { return [...missing]; }
