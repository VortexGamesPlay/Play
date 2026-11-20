// Outil QA : génère une sauvegarde importable (Profil > Importer) contenant toutes les espèces ou toutes les mutations.
// Usage : npx vite-node scripts/make-showcase-save.ts species|mutations fichier.json
import { writeFileSync } from 'node:fs';
import { createInitialState } from '../src/core/state';
import { createCreature } from '../src/core/systems/creatures';
import { registerInDex } from '../src/core/systems/dex';
import { serialize } from '../src/core/save/serializer';
import { createRng } from '../src/core/rng';
import { makeContext } from '../src/core/time';
import { SPECIES_LIST } from '../src/data/species';
import { MUTATIONS } from '../src/data/mutations';
const now = new Date('2026-11-19T15:00:00').getTime();
const ctx = makeContext(now, createRng(9));
const mode = process.argv[2];
const s = createInitialState(now);
if (mode === 'species') {
  for (const sp of SPECIES_LIST) { const c = createCreature(s, sp.id, [], { kind: 'starter' }, ctx); c.genes.hue = 0; c.hatchedAt = now - SPECIES_LIST.indexOf(sp); s.creatures.push(c); registerInDex(s, c, ctx); }
} else {
  const muts = Object.keys(MUTATIONS);
  muts.forEach((m, i) => { const c = createCreature(s, ['tisonnet','perlouille','lichenou','songelin','etincelou','frimelot'][i % 6]!, [m], { kind: 'starter' }, ctx); c.genes.hue = 0; c.nickname = MUTATIONS[m]!.name; c.hatchedAt = now - i; s.creatures.push(c); });
  const c = createCreature(s, 'cometuse', ['doree', 'cristalline', 'florale', 'mutante'], { kind: 'starter' }, ctx); c.nickname = 'Cumul x4'; c.hatchedAt = now - 50; s.creatures.push(c);
}
s.settings.locale = 'fr'; // les tests de bout en bout lisent l'interface en français
writeFileSync(process.argv[3]!, serialize(s, now));
