// Outil QA : sauvegarde prête pour tester l'Arène (Phase 5).
// Usage : npx vite-node scripts/make-phase5-save.ts fichier.json
import { writeFileSync } from 'node:fs';
import { createInitialState } from '../src/core/state';
import { createCreature } from '../src/core/systems/creatures';
import { registerInDex } from '../src/core/systems/dex';
import { serialize } from '../src/core/save/serializer';
import { createRng } from '../src/core/rng';
import { makeContext } from '../src/core/time';
const now = new Date('2026-11-19T15:00:00').getTime();
const ctx = makeContext(now, createRng(6));
const s = createInitialState(now);
s.wallet = { coins: 3000, crystals: 50, essence: 100 };
for (const [id, lvl] of [['fournaillon', 16], ['clapotine', 16], ['bosquelin', 18], ['etincelou', 12], ['frimelot', 11]] as const) {
  const c = createCreature(s, id, id === 'clapotine' ? ['doree'] : [], { kind: 'starter' }, ctx);
  c.level = lvl; s.creatures.push(c); registerInDex(s, c, ctx);
}
s.exploration.expeditionsByBiome.foret = 3;
s.settings.locale = 'fr'; // les tests de bout en bout lisent l'interface en français
writeFileSync(process.argv[2]!, serialize(s, now));
