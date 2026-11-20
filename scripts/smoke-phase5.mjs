// Test de bout en bout Phase 5 : équipe, combat manuel, combat automatique, gardien ancien, tour.
// Usage : npm run build && node scripts/smoke-phase5.mjs [dossierCaptures]
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const SP = process.argv[2] ?? 'smoke-shots';
mkdirSync(SP, { recursive: true });
execSync(`node_modules/.bin/vite-node scripts/make-phase5-save.ts ${SP}/save-p5.json`);
const server = spawn('node_modules/.bin/vite', ['preview', '--port', '4323', '--strictPort'], { stdio: 'pipe' });
await new Promise((r) => server.stdout.on('data', (d) => d.toString().includes('4323') && r()));
const URL = 'http://localhost:4323/';
const b = await chromium.launch();
const errs = [];
const shot = async (p, name, full = false) => { await p.waitForTimeout(700); await p.screenshot({ path: `${SP}/p5-${name}.png`, fullPage: full }); };
async function waitResult(p) {
  for (let i = 0; i < 400; i++) {
    if (await p.locator('.battle-panel.result').count()) return;
    await p.clock.runFor(1000);
  }
  throw new Error('Le combat ne se termine pas');
}
try {
  for (const [name, vp] of [['desktop', { width: 1366, height: 860 }], ['mobile', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ locale: 'fr-FR', viewport: vp }); await p.route(/supabase\.co/, (r) => r.abort()); // jamais de faux joueurs sur le vrai serveur
    p.on('pageerror', (e) => errs.push(`[${name}] ${e.message}`)); p.on('console', (m) => m.type() === 'error' && !m.text().includes('Failed to load resource') && errs.push(`[${name}] ${m.text()}`));
    await p.clock.install({ time: new Date('2026-11-19T15:00:00') });
    await p.goto(URL);
    await p.evaluate((t) => localStorage.setItem('eggverse.save.main', t), readFileSync(`${SP}/save-p5.json`, 'utf8'));
    await p.goto(URL + '#/arene'); await p.reload(); await p.waitForSelector('.team-panel');
    await p.locator('button:has-text("Meilleure équipe")').click();
    await shot(p, `${name}-arene`);
    // Combat manuel : première compétence offensive, puis une cible
    await p.locator('.fight-row').first().locator('button:has-text("Combattre")').click();
    await p.waitForSelector('.battle');
    for (let i = 0; i < 30 && !(await p.locator('.skill:not([disabled])').count()); i++) await p.clock.runFor(500);
    await shot(p, `${name}-combat-choix`);
    await p.locator('.skill:not([disabled])', { hasText: 'Coup d' }).first().click();
    if (await p.locator('.bunit.targetable').count()) await p.locator('.bunit.targetable').first().click();
    await p.clock.runFor(600);
    await shot(p, `${name}-combat-action`);
    // Le reste en automatique, vitesse ×2
    await p.locator('.battle-top .chip', { hasText: 'Auto' }).click();
    await p.locator('.battle-top .chip', { hasText: '×2' }).click();
    await waitResult(p);
    await shot(p, `${name}-combat-resultat`);
    await p.locator('.battle-panel.result button:has-text("Continuer")').click();
    // Gardien ancien de la forêt
    await p.locator('.tabs button:has-text("Gardiens anciens")').click();
    await shot(p, `${name}-gardiens`);
    await p.locator('.boss-card').first().locator('button:has-text("Affronter")').click();
    await p.waitForSelector('.battle');
    await p.clock.runFor(1500);
    await shot(p, `${name}-boss`);
    await p.locator('.battle-top .chip', { hasText: 'Auto' }).click();
    await p.locator('.battle-top .chip', { hasText: '×2' }).click();
    await waitResult(p);
    await p.locator('.battle-panel.result button:has-text("Continuer")').click();
    await p.clock.runFor(2000); // laisse passer la sauvegarde automatique (différée de 800 ms)
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('eggverse.save.main')).state);
    console.log(name, '| victoires', st.stats.battlesWon, '| défaites', st.stats.battlesLost, '| ligue', JSON.stringify(st.combat.league), '| gardiens', st.combat.bossFirst.join(','), '| niveaux', st.creatures.map((c) => c.level).join(','));
    if (st.stats.battlesWon + st.stats.battlesLost !== 2) errs.push(`[${name}] 2 combats attendus`);
    await p.close();
  }
} finally { await b.close(); server.kill(); }
if (errs.length) { console.log('ERREURS', errs); process.exit(1); }
console.log('Parcours Phase 5 OK');
