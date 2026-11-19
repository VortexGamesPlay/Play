// Outil : liste les textes sans traduction anglaise (contenu du jeu + appels t('…') du code).
// Usage : npx vite-node scripts/i18n-extract.ts [content|ui]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { contentStrings } from '../src/i18n/content';
import { EN } from '../src/i18n/en';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) && !p.includes('i18n/en') && !p.includes('__tests__') ? [p] : [];
  });
}

export function uiStrings(): string[] {
  const out = new Set<string>();
  const re = /\bt[p]?\(\s*'((?:[^'\\]|\\.)*)'/g;
  const re2 = /\btp\([^,]+,\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'/g;
  for (const f of walk('src')) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(re)) out.add(m[1]!.replace(/\\'/g, "'"));
    for (const m of src.matchAll(re2)) { out.add(m[1]!.replace(/\\'/g, "'")); out.add(m[2]!.replace(/\\'/g, "'")); }
  }
  return [...out];
}

const mode = process.argv[2] ?? 'content';
const list = (mode === 'ui' ? uiStrings() : contentStrings()).filter((s) => EN[s] === undefined);
console.log(JSON.stringify(list, null, 0));
console.error(`${list.length} textes sans traduction (${mode})`);
