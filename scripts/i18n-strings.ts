// Liste des textes traduisibles du code (appels t / tp / tr). Utilisé par l'outil d'extraction et par le test de complétude.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) && !p.includes('i18n/en') && !p.includes('__tests__') ? [p] : [];
  });
}

export function uiStrings(): string[] {
  const out = new Set<string>();
  const re = /\b(?:t|tp|tr)\(\s*'((?:[^'\\]|\\.)*)'/g;
  const re2 = /\btp\([^,]+,\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'/g;
  for (const f of walk('src')) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(re)) out.add(m[1]!.replace(/\\'/g, "'"));
    for (const m of src.matchAll(re2)) { out.add(m[1]!.replace(/\\'/g, "'")); out.add(m[2]!.replace(/\\'/g, "'")); }
  }
  return [...out];
}

