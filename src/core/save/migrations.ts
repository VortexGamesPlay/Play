/**
 * Migrations de schéma de sauvegarde. Chaque entrée transforme la version N en N+1.
 * Ne jamais modifier une migration publiée : en ajouter une nouvelle.
 */
type RawState = Record<string, unknown> & { schemaVersion?: number };

export const MIGRATIONS: Record<number, (s: RawState) => RawState> = {
  // v1 → v2 (Phase 3) : reproduction et recettes génétiques.
  1: (s) => ({
    ...s,
    recipesFound: [],
    creatures: ((s.creatures as Record<string, unknown>[] | undefined) ?? []).map((c) => ({ breedCount: 0, breedReadyAt: 0, ...c })),
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
