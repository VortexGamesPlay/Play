// Test de bout en bout Phase 3 (évolution, laboratoire, éclosion d'un œuf génétique).
// Usage : npm run build && npm run smoke:phase3 [dossierCaptures]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)('playwright');
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const SP = process.argv[2] ?? 'smoke-shots';
mkdirSync(SP, { recursive: true });
execSync(`node_modules/.bin/vite-node scripts/make-phase3-save.ts ${SP}/save-p3.json`);
const server = spawn('node_modules/.bin/vite', ['preview', '--port', '4321', '--strictPort'], { stdio: 'pipe' });
await new Promise((r) => server.stdout.on('data', (d) => d.toString().includes('4321') && r()));
const b = await chromium.launch();
const errs = [];
for (const [name, vp] of [['desktop', { width: 1366, height: 860 }], ['mobile', { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: vp });
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.clock.install({ time: new Date('2026-11-19T15:00:00') });
  await p.goto('http://localhost:4321/');
  await p.evaluate((t) => localStorage.setItem('eggverse.save.main', t), readFileSync(`${SP}/save-p3.json`, 'utf8'));
  await p.goto('http://localhost:4321/#/collection'); await p.reload(); await p.waitForSelector('.cr-card');
  await p.waitForTimeout(800); await p.screenshot({ path: `${SP}/p3-${name}-collection.png` });
  // Évolution de Pyroli
  await p.locator('.cr-card', { hasText: 'Pyroli' }).click();
  await p.waitForSelector('.evo-row.ready');
  await p.waitForTimeout(600); await p.screenshot({ path: `${SP}/p3-${name}-fiche.png` });
  await p.locator('.evo-row.ready button').first().click();
  await p.locator('.modal button:has-text("Évoluer")').click();
  await p.clock.fastForward(2500); await p.waitForTimeout(300);
  await p.screenshot({ path: `${SP}/p3-${name}-evo-alternance.png` });
  await p.clock.fastForward(3000); await p.waitForSelector('.hatch-panel'); await p.waitForTimeout(1000);
  await p.screenshot({ path: `${SP}/p3-${name}-evo-revelation.png` });
  await p.locator('.hatch-panel button:has-text("Continuer")').click();
  // Laboratoire
  await p.goto('http://localhost:4321/#/laboratoire'); await p.waitForSelector('.lab-slot');
  await p.locator('.lab-slot.empty').first().click();
  await p.locator('.picker-row', { hasText: 'Pyrodrake' }).locator('button').click();
  await p.locator('.lab-slot.empty').first().click();
  await p.locator('.picker-row', { hasText: 'Aquabulle' }).locator('button').click();
  await p.waitForSelector('.lab-forecast'); await p.waitForTimeout(600);
  await p.screenshot({ path: `${SP}/p3-${name}-labo.png`, fullPage: true });
  await p.locator('button:has-text("Lancer la fusion")').click();
  await p.clock.fastForward(2600); await p.waitForSelector('.hatch-panel'); await p.waitForTimeout(900);
  await p.screenshot({ path: `${SP}/p3-${name}-fusion.png` });
  await p.locator('.hatch-panel button:has-text("Incuber")').click();
  await p.locator('.egg-card', { hasText: 'génétique' }).locator('button:has-text("Incuber")').click();
  await p.clock.fastForward('00:10:00');
  await p.locator('.hatch-btn').first().dispatchEvent('click');
  await p.locator('.hatch').dispatchEvent('click');
  await p.waitForSelector('.hatch-panel'); await p.waitForTimeout(900);
  await p.screenshot({ path: `${SP}/p3-${name}-eclosion-hybride.png` });
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem('eggverse.save.main')).state);
  const last = st.creatures.at(-1);
  console.log(name, 'né :', last.speciesId, 'gén.', last.generation, 'origine', last.origin.kind, '| espèces:', st.creatures.map((c) => c.speciesId).join(','));
  await p.close();
}
await b.close(); server.kill();
if (errs.length) { console.log('ERREURS', errs); process.exit(1); }
console.log('Parcours Phase 3 OK');
