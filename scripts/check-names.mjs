// Contrôle anti-plagiat des noms : compare tous les noms d'EGGVERSE à la liste publique des noms
// d'espèces d'une licence existante (téléchargée à l'exécution, jamais stockée dans le dépôt).
// Usage : node scripts/check-names.mjs [chemin_csv_local]
// Échoue si un nom est identique, à 2 modifications près, ou partage une racine de 5 lettres ou plus.
import { readFileSync } from 'node:fs';

const SOURCE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv';
const LANGS = new Set(['5', '6', '7', '8', '9']); // fr, de, es, it, en

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

const csv = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : await (await fetch(SOURCE)).text();
const reference = new Set();
for (const line of csv.split('\n').slice(1)) {
  const [, lang, name] = line.split(',');
  if (LANGS.has(lang) && name) reference.add(norm(name));
}
if (reference.size < 1000) throw new Error('Liste de référence incomplète');

// Noms d'EGGVERSE. Les noms de créatures sont des mots inventés : contrôle strict.
// Les autres libellés (familles, œufs, objets…) sont des mots courants du français : seule l'identité exacte est refusée.
const strict = new Map();
const loose = new Map();
const extra = process.env.CANDIDATES ? process.env.CANDIDATES.split(',') : [];
for (const c of extra) strict.set(norm(c), `${c} (candidat)`);
for (const file of ['species', 'eggs', 'items', 'mutations', 'ambiances', 'recipes', 'personalities']) {
  const src = readFileSync(`src/data/${file}.ts`, 'utf8');
  for (const m of src.matchAll(/\b(name|family): '((?:[^'\\]|\\.)*)'/g)) {
    const label = m[2].replace(/\\'/g, "'");
    const isCreatureName = file === 'species' && m[1] === 'name';
    for (const word of label.split(/[\s'’-]+/)) {
      const n = norm(word);
      if (n.length >= 4) (isCreatureName ? strict : loose).set(n, `${label} (${file})`);
    }
  }
}

const problems = [];
for (const [n, label] of strict) {
  for (const r of reference) {
    if (r === n) problems.push(`${label} : identique à un nom existant`);
    else if (n.length >= 5 && r.length >= 5 && lev(n, r) <= 2) problems.push(`${label} : trop proche d'un nom existant (${lev(n, r)} lettre(s) d'écart)`);
    else if (n.length >= 5 && r.length >= 5 && n.slice(0, 5) === r.slice(0, 5)) problems.push(`${label} : même racine (« ${n.slice(0, 5)} ») qu'un nom existant`);
  }
}
for (const [n, label] of loose) if (reference.has(n)) problems.push(`${label} : identique à un nom existant`);
const ours = new Map([...strict, ...loose]);
const unique = [...new Set(problems)];
console.log(`${ours.size} noms vérifiés contre ${reference.size} noms de référence.`);
if (unique.length) { console.log(unique.join('\n')); process.exit(1); }
console.log('Aucun conflit de nom.');
