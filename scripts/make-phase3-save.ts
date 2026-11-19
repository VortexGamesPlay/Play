// Outil QA : sauvegarde avec des créatures prêtes à évoluer et à se reproduire (Phase 3).
// Usage : npx vite-node scripts/make-phase3-save.ts fichier.json
import { writeFileSync } from 'node:fs';
import { createInitialState } from '../src/core/state';
import { createCreature } from '../src/core/systems/creatures';
import { registerInDex } from '../src/core/systems/dex';
import { serialize } from '../src/core/save/serializer';
import { createRng } from '../src/core/rng';
import { makeContext } from '../src/core/time';
const now = new Date('2026-11-19T15:00:00').getTime();
const ctx = makeContext(now, createRng(4));
const s = createInitialState(now);
s.wallet = { coins: 5000, crystals: 100, essence: 400 };
s.inventory.pierre_eveil = 1;
const add = (id: string, level: number, mut: string[] = []) => {
  const c = createCreature(s, id, mut, { kind: 'egg', eggType: 'forestier', ambiance: 'neutre', night: false }, ctx);
  c.level = level; c.affection = 50; s.creatures.push(c); registerInDex(s, c, ctx); return c;
};
add('pyroli', 16, ['doree']);
add('aquabulle', 12);
add('galetou', 13);
add('mousselin', 9);
writeFileSync(process.argv[2]!, serialize(s, now));
