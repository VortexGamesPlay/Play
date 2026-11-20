// Outil QA : sauvegarde de milieu de partie pour tester le monde (Phase 4).
// Usage : npx vite-node scripts/make-phase4-save.ts fichier.json
import { writeFileSync } from 'node:fs';
import { createInitialState } from '../src/core/state';
import { createCreature } from '../src/core/systems/creatures';
import { registerInDex } from '../src/core/systems/dex';
import { serialize } from '../src/core/save/serializer';
import { createRng } from '../src/core/rng';
import { makeContext } from '../src/core/time';
const now = new Date('2026-11-19T15:00:00').getTime();
const ctx = makeContext(now, createRng(5));
const s = createInitialState(now);
s.wallet = { coins: 8000, crystals: 120, essence: 300 };
s.inventory = { ...s.inventory, bois_lune: 10, nacre: 4 };
const ids = ['lichenou', 'tisonnet', 'perlouille', 'frimelot', 'zephyrin', 'caillounet', 'etincelou', 'lucilet', 'songelin', 'champilou'];
ids.forEach((id, i) => {
  const c = createCreature(s, id, i === 2 ? ['irisee'] : [], { kind: 'egg', eggType: 'forestier', ambiance: 'neutre', night: false }, ctx);
  c.level = 6 + i; c.affection = 40; c.hatchedAt = now - 3 * 3600_000;
  s.creatures.push(c); registerInDex(s, c, ctx);
});
s.sanctuary.lastHarvestAt = now - 3 * 3600_000;
s.settings.locale = 'fr'; // les tests de bout en bout lisent l'interface en français
writeFileSync(process.argv[2]!, serialize(s, now));
