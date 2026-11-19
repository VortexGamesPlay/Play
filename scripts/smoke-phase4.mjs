// Test de bout en bout Phase 4 : exploration, expédition, fouille, bâtiments, décorations, missions, trophées.
// Usage : npm run build && node scripts/smoke-phase4.mjs [dossierCaptures]
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const SP = process.argv[2] ?? 'smoke-shots';
mkdirSync(SP, { recursive: true });
execSync(`node_modules/.bin/vite-node scripts/make-phase4-save.ts ${SP}/save-p4.json`);
const server = spawn('node_modules/.bin/vite', ['preview', '--port', '4322', '--strictPort'], { stdio: 'pipe' });
await new Promise((r) => server.stdout.on('data', (d) => d.toString().includes('4322') && r()));
const URL = 'http://localhost:4322/';
const b = await chromium.launch();
const errs = [];
const shot = async (p, name, full = false) => { await p.waitForTimeout(900); await p.screenshot({ path: `${SP}/p4-${name}.png`, fullPage: full }); };
try {
  for (const [name, vp] of [['desktop', { width: 1366, height: 860 }], ['mobile', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', (e) => errs.push(`[${name}] ${e.message}`)); p.on('console', (m) => m.type() === 'error' && errs.push(`[${name}] ${m.text()}`));
    await p.clock.install({ time: new Date('2026-11-19T15:00:00') });
    await p.goto(URL);
    await p.evaluate((t) => localStorage.setItem('eggverse.save.main', t), readFileSync(`${SP}/save-p4.json`, 'utf8'));
    await p.goto(URL + '#/exploration'); await p.reload(); await p.waitForSelector('.map-node');
    await shot(p, `${name}-carte`);
    await p.locator('.map-node', { hasText: 'Forêt enchantée' }).click();
    await p.waitForSelector('.biome-modal');
    await shot(p, `${name}-biome`);
    await p.locator('button:has-text("Fouiller les environs")').click();
    await p.locator('button:has-text("Préparer une expédition")').click();
    await p.locator('.team-pick').nth(0).click();
    await p.locator('.team-pick').nth(1).click();
    await p.locator('.tabs button:has-text("Moyenne")').click();
    await shot(p, `${name}-preparation`);
    await p.locator('button:has-text("Partir en expédition")').click();
    await p.waitForSelector('.expe-row');
    await p.clock.fastForward('01:05:00');
    await p.locator('.expe-row button:has-text("Accueillir")').click();
    await p.waitForSelector('.expe-result');
    await shot(p, `${name}-retour`);
    await p.locator('.expe-result button:has-text("Super")').click();
    // Sanctuaire : décoration + bâtiments
    await p.goto(URL + '#/boutique');
    await p.locator('.tabs button:has-text("Décorations")').click();
    await p.locator('.offer', { hasText: 'Lanternes' }).locator('button.btn').click();
    await p.locator('.offer', { hasText: 'Banc' }).locator('button.btn').click();
    await p.goto(URL + '#/sanctuaire'); await p.waitForSelector('.scene');
    await p.locator('.tabs button:has-text("Aménager")').click();
    await p.locator('.building', { hasText: 'Nichoirs' }).locator('button:has-text("Améliorer")').click();
    await p.locator('.building', { hasText: 'Jardin' }).locator('button:has-text("Construire")').click();
    await p.locator('.theme-chip', { hasText: 'Prairie' }).click();
    await shot(p, `${name}-amenager`, true);
    await p.locator('.tabs button:has-text("Vue")').click();
    await p.locator('.harvest button:has-text("Récolter")').click();
    await p.evaluate(() => window.scrollTo(0, 0));
    await shot(p, `${name}-sanctuaire`);
    await p.goto(URL + '#/profil'); await p.waitForSelector('.trophies');
    await shot(p, `${name}-trophees`, true);
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('eggverse.save.main')).state);
    console.log(name, '| expéditions', st.stats.expeditions, '| nichoirs', st.sanctuary.buildings.nichoirs, '| jardin', st.sanctuary.buildings.jardin, '| déco', Object.keys(st.sanctuary.decorations).join(','), '| matériaux', Object.entries(st.inventory).filter(([k]) => ['bois_lune', 'nacre', 'sable_dore'].includes(k)).map(([k, v]) => `${k}:${v}`).join(' '));
    await p.close();
  }
} finally { await b.close(); server.kill(); }
if (errs.length) { console.log('ERREURS', errs); process.exit(1); }
console.log('Parcours Phase 4 OK');
