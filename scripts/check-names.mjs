// Contrôle anti-plagiat des noms d'EGGVERSE.
// Compare nos noms aux listes publiques d'une licence existante (espèces, attaques, talents, objets ; 5 langues),
// téléchargées à l'exécution et JAMAIS stockées dans le dépôt.
// Usage : node scripts/check-names.mjs [dossier_csv_local]
//   - noms de créatures (mots inventés) : refusés si identiques, à ≤ 2 lettres, ou même racine de 5 lettres qu'une espèce ;
//   - noms de compétences et d'états : refusés si identiques (ou à ≤ 2 lettres pour ≥ 8 lettres) à une attaque / un talent ;
//   - tous les autres libellés (objets, familles, œufs…) : refusés s'ils sont identiques à un nom existant.
import { readFileSync } from 'node:fs';

const BASE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
const FILES = { species: 'pokemon_species_names.csv', moves: 'move_names.csv', abilities: 'ability_names.csv', items: 'item_names.csv', natures: 'nature_names.csv' };
const LOCAL = { species: 'names.csv', moves: 'moves.csv', abilities: 'abilities.csv', items: 'items.csv', natures: 'natures.csv' };
const LANGS = new Set(['5', '6', '7', '8', '9']); // fr, de, es, it, en
const dir = process.argv[2];

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
async function load(kind) {
  const text = dir ? readFileSync(`${dir}/${LOCAL[kind]}`, 'utf8') : await (await fetch(BASE + FILES[kind])).text();
  const set = new Set();
  for (const line of text.split('\n').slice(1)) {
    const [, lang, name] = line.split(',');
    if (LANGS.has(lang) && name) set.add(norm(name));
  }
  if (set.size < (kind === 'natures' ? 100 : 500)) throw new Error(`Liste de référence incomplète : ${kind}`);
  return set;
}
const ref = Object.fromEntries(await Promise.all(Object.keys(FILES).map(async (k) => [k, await load(k)])));
const anyRef = new Set([...ref.species, ...ref.moves, ...ref.abilities, ...ref.items, ...ref.natures]);
const attacks = new Set([...ref.moves, ...ref.abilities]);

const labels = (file, re = /\b(name|family|title): '((?:[^'\\]|\\.)*)'/g) => {
  let src;
  try { src = readFileSync(`src/data/${file}.ts`, 'utf8'); } catch { return []; }
  return [...src.matchAll(re)].map((m) => ({ field: m[1], label: m[2].replace(/\\'/g, "'"), file }));
};

const problems = [];
let count = 0;
// 1. Créatures
for (const { field, label } of labels('species')) {
  if (field !== 'name') continue;
  count++;
  const n = norm(label);
  for (const r of ref.species) {
    if (r === n) problems.push(`Créature « ${label} » : identique à un nom existant`);
    else if (n.length >= 5 && r.length >= 5 && lev(n, r) <= 2) problems.push(`Créature « ${label} » : trop proche d'un nom existant`);
    else if (n.length >= 5 && r.length >= 5 && n.slice(0, 5) === r.slice(0, 5)) problems.push(`Créature « ${label} » : même racine (« ${n.slice(0, 5)} ») qu'un nom existant`);
  }
}
// 2. Compétences et états de combat
for (const { label } of [...labels('skills'), ...labels('statuses')]) {
  count++;
  const n = norm(label);
  for (const r of attacks) {
    if (r === n) problems.push(`Compétence « ${label} » : identique à une attaque / un talent existant`);
    else if (n.length >= 8 && lev(n, r) <= 2) problems.push(`Compétence « ${label} » : trop proche d'une attaque / d'un talent existant`);
  }
}
// 3. Tous les autres libellés
for (const file of ['species', 'eggs', 'items', 'mutations', 'ambiances', 'recipes', 'personalities', 'biomes', 'weather', 'buildings', 'arena', 'seasons']) {
  for (const { field, label } of labels(file)) {
    if (file === 'species' && field === 'name') continue;
    count++;
    if (anyRef.has(norm(label))) problems.push(`« ${label} » (${file}) : identique à un nom existant`);
  }
}
for (const p of JSON.parse(readFileSync('supabase/functions/_shared/catalog.json', 'utf8')).products) {
  count++;
  if (anyRef.has(norm(p.name))) problems.push(`Produit « ${p.name} » : identique à un nom existant`);
}
// 4. Traductions anglaises du contenu (mêmes règles, appliquées aux noms anglais)
{
  const unq = (x) => x.replace(/\\'/g, "'");
  const skillNames = new Set([...labels('skills'), ...labels('statuses')].map((l) => l.label));
  const en = readFileSync('src/i18n/en.content.ts', 'utf8');
  for (const m of en.matchAll(/'((?:[^'\\]|\\.)*)':\s*'((?:[^'\\]|\\.)*)'/g)) {
    const fr = unq(m[1]), label = unq(m[2]);
    if (label.length > 40) continue; // descriptions : phrases, pas des noms
    count++;
    const n = norm(label);
    if (!n) continue; // « +10 % » : pas un nom
    if (skillNames.has(fr)) {
      for (const r of attacks) {
        if (r === n) problems.push(`Compétence anglaise « ${label} » : identique à une attaque / un talent existant`);
        else if (n.length >= 8 && lev(n, r) <= 2) problems.push(`Compétence anglaise « ${label} » : trop proche d'une attaque / d'un talent existant`);
      }
    } else if (anyRef.has(n)) problems.push(`Nom anglais « ${label} » (pour « ${fr} ») : identique à un nom existant`);
  }
}
const unique = [...new Set(problems)];
console.log(`${count} noms vérifiés contre ${anyRef.size} noms de référence (espèces, attaques, talents, objets).`);
if (unique.length) { console.log(unique.join('\n')); process.exit(1); }
console.log('Aucun conflit de nom.');
