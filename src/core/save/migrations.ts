/**
 * Migrations de schéma de sauvegarde. Chaque entrée transforme la version N en N+1.
 * Ne jamais modifier une migration publiée : en ajouter une nouvelle.
 */
import { ITEM_RENAMES_V3, MUTATION_RENAMES_V3, SPECIES_RENAMES_V3 } from './renames';

type RawState = Record<string, unknown> & { schemaVersion?: number };
type Obj = Record<string, unknown>;

const rn = (id: unknown) => (typeof id === 'string' ? SPECIES_RENAMES_V3[id] ?? id : id);
const rnPair = (v: unknown) => (Array.isArray(v) ? v.map(rn) : v);
const rnMut = (v: unknown) => (Array.isArray(v) ? v.map((m) => (typeof m === 'string' ? MUTATION_RENAMES_V3[m] ?? m : m)) : v);
function rnGenetics(g: unknown) {
  if (!g || typeof g !== 'object') return g;
  const x = g as Obj;
  return { ...x, speciesId: rn(x.speciesId), parents: rnPair(x.parents), mutations: rnMut(x.mutations) };
}
function rnEgg(e: unknown) {
  if (!e || typeof e !== 'object') return e;
  const x = e as Obj;
  return x.genetics ? { ...x, genetics: rnGenetics(x.genetics) } : x;
}

export const MIGRATIONS: Record<number, (s: RawState) => RawState> = {
  // v1 → v2 (Phase 3) : reproduction et recettes génétiques.
  1: (s) => ({
    ...s,
    recipesFound: [],
    creatures: ((s.creatures as Record<string, unknown>[] | undefined) ?? []).map((c) => ({ breedCount: 0, breedReadyAt: 0, ...c })),
  }),
  // v2 → v3 : nouveaux noms et identifiants (espèces, mutations, objets) — identité 100 % EGGVERSE.
  2: (s) => ({
    ...s,
    creatures: ((s.creatures as Obj[] | undefined) ?? []).map((c) => {
      const origin = c.origin as Obj | undefined;
      return { ...c, speciesId: rn(c.speciesId), mutations: rnMut(c.mutations), origin: origin?.parents ? { ...origin, parents: rnPair(origin.parents) } : origin };
    }),
    dex: Object.fromEntries(Object.entries((s.dex as Record<string, Obj> | undefined) ?? {}).map(([k, v]) => [rn(k) as string, { ...v, speciesId: rn(v.speciesId), variants: rnMut(v.variants) }])),
    discoveries: ((s.discoveries as Obj[] | undefined) ?? []).map((d) => ({
      ...d, speciesId: rn(d.speciesId), ...(typeof d.mutationId === 'string' ? { mutationId: MUTATION_RENAMES_V3[d.mutationId] ?? d.mutationId } : {}),
    })),
    inventory: Object.fromEntries(Object.entries((s.inventory as Record<string, number> | undefined) ?? {}).map(([k, v]) => [ITEM_RENAMES_V3[k] ?? k, v])),
    eggs: ((s.eggs as unknown[] | undefined) ?? []).map(rnEgg),
    incubators: ((s.incubators as Obj[] | undefined) ?? []).map((slot) => ({ ...slot, egg: rnEgg(slot.egg) })),
  }),
};

export function migrate(raw: RawState, targetVersion: number): RawState {
  let s = raw;
  let v = typeof s.schemaVersion === 'number' ? s.schemaVersion : 1;
  if (v > targetVersion) {
    throw new Error(`Sauvegarde créée par une version plus récente du jeu (schéma ${v}). Mets le jeu à jour.`);
  }
  while (v < targetVersion) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`Migration manquante depuis le schéma ${v}.`);
    s = step(s);
    v += 1;
    s.schemaVersion = v;
  }
  return s;
}
