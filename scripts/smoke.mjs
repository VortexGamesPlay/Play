// Test de fumée de bout en bout : lance le build (vite preview) et parcourt les écrans principaux.
// Usage : npm run build && node scripts/smoke.mjs [dossierCaptures]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] ?? 'smoke-shots';
mkdirSync(out, { recursive: true });
const server = spawn('node_modules/.bin/vite', ['preview', '--port', '4319', '--strictPort'], { stdio: 'pipe' });
await new Promise((r) => server.stdout.on('data', (d) => d.toString().includes('4319') && r()));
const URL = 'http://localhost:4319/';
const errors = [];
const browser = await chromium.launch();
// Attente en temps réel : les animations CSS ne suivent pas l'horloge simulée.
async function shot(page, path, fullPage = false) { await page.waitForTimeout(900); await page.screenshot({ path, fullPage }); }

async function run(name, viewport) {
  const ctx = await browser.newContext({ locale: 'fr-FR', viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${name}] ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${name}] ${e.message}`));
  await page.clock.install({ time: new Date('2026-11-19T15:00:00') });
  await page.goto(URL);
  await page.waitForSelector('.content');
  await shot(page, `${out}/${name}-01-sanctuaire-vide.png`);

  await page.goto(URL + '#/incubateur');
  await page.waitForSelector('.slot');
  // Incube deux œufs depuis le panier
  for (let i = 0; i < 2; i++) await page.locator('.egg-card button:has-text("Incuber")').first().click();
  await shot(page, `${out}/${name}-02-incubation.png`);
  await page.clock.fastForward('01:00');
  await page.waitForSelector('.hatch-btn');
  await shot(page, `${out}/${name}-03-pret.png`);
  await page.locator('.hatch-btn').first().dispatchEvent('click');
  await page.clock.fastForward(1600);
  await shot(page, `${out}/${name}-04-eclosion-fissures.png`);
  await page.clock.fastForward(3000);
  await page.waitForSelector('.hatch-panel');
  await page.clock.fastForward(1000);
  await shot(page, `${out}/${name}-05-revelation.png`);
  await page.locator('.hatch-panel button:has-text("Voir la fiche")').click();
  await page.waitForSelector('.detail');
  await shot(page, `${out}/${name}-06-fiche.png`);
  await page.locator('.detail button:has-text("Nourrir")').click();
  await page.locator('.picker-row button:has-text("Donner")').first().click();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.locator('.hatch-btn').first().dispatchEvent('click');
  await page.locator('.hatch').dispatchEvent('click'); // passer l'animation
  await page.locator('.hatch-panel button:has-text("Continuer")').click();

  await page.goto(URL + '#/sanctuaire');
  await page.clock.fastForward('02:00:00');
  await page.waitForSelector('.actor');
  await shot(page, `${out}/${name}-07-sanctuaire.png`);
  await page.locator('.quest-card button:has-text("Récupérer")').click();
  await page.locator('.harvest button:has-text("Récolter")').click();
  await page.locator('.daily-card button:has-text("Récupérer")').click();

  for (const r of ['collection', 'bestiaire', 'boutique', 'inventaire', 'laboratoire', 'profil']) {
    await page.goto(URL + '#/' + r);
    await page.waitForTimeout(150);
    await page.clock.fastForward(500);
    await shot(page, `${out}/${name}-08-${r}.png`, true);
  }
  await page.goto(URL + '#/boutique');
  await page.locator('.offer .icon-btn').first().click();
  await page.waitForSelector('.odds-table');
  await shot(page, `${out}/${name}-09-probabilites.png`);
  await page.keyboard.press('Escape');

  // Persistance : rechargement
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('eggverse.save.main')).state.creatures.length);
  await page.reload();
  await page.waitForSelector('.content');
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('eggverse.save.main')).state.creatures.length);
  if (before !== after || after < 2) errors.push(`[${name}] persistance : ${before} → ${after}`);
  console.log(`${name}: ${after} créatures persistées`);
  await ctx.close();
}

try {
  await run('desktop', { width: 1366, height: 820 });
  await run('mobile', { width: 390, height: 844 });
} finally {
  await browser.close();
  server.kill();
}
if (errors.length) { console.error('ERREURS :\n' + errors.join('\n')); process.exit(1); }
console.log('Smoke test OK');
