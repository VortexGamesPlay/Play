// Test de bout en bout de la boutique premium et de la saison.
// 1) build de préversion en mode test (faux argent) : achats, passe de saison, historique ;
// 2) build normal sans serveur : les achats doivent être indisponibles (rien n'est simulé).
// Usage : node scripts/smoke-premium.mjs [dossierCaptures]
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const SP = process.argv[2] ?? 'smoke-shots';
mkdirSync(SP, { recursive: true });
// Les deux builds simulent un jeu SANS serveur de paiement (on vide l'adresse Supabase du .env.production).
const NO_SERVER = { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' };
execSync('node_modules/.bin/vite build --outDir dist-test', { env: { ...process.env, ...NO_SERVER, VITE_PAYMENTS_TEST: '1' }, stdio: 'ignore' });
execSync('node_modules/.bin/vite build --outDir dist-noserver', { env: { ...process.env, ...NO_SERVER }, stdio: 'ignore' });
const errs = [];
async function serve(dir, port) {
  const server = spawn('node_modules/.bin/vite', ['preview', '--outDir', dir, '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  await new Promise((r) => server.stdout.on('data', (d) => d.toString().includes(String(port)) && r()));
  return server;
}
const b = await chromium.launch();
const shot = async (p, name, full = false) => { await p.waitForTimeout(700); await p.screenshot({ path: `${SP}/prem-${name}.png`, fullPage: full }); };
const crystals = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('eggverse.save.main')).state.wallet.crystals);
let s1, s2;
try {
  s1 = await serve('dist-test', 4324);
  for (const [name, vp] of [['desktop', { width: 1366, height: 860 }], ['mobile', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', (e) => errs.push(`[${name}] ${e.message}`)); p.on('console', (m) => m.type() === 'error' && errs.push(`[${name}] ${m.text()}`));
    await p.goto('http://localhost:4324/#boutique'); await p.waitForSelector('.tabs');
    await p.locator('.tabs button:has-text("Cristaux")').click();
    await shot(p, `${name}-boutique`, true);
    await p.waitForTimeout(1200);
    const before = await crystals(p);
    await p.locator('.offer', { hasText: 'Bourse de cristaux' }).locator('button').click();
    await p.waitForSelector('.consent');
    await shot(p, `${name}-paiement`);
    await p.locator('.modal button:has-text("Payer")').isDisabled().then((d) => { if (!d) errs.push(`[${name}] paiement possible sans consentement`); });
    await p.locator('#consent-digital').check();
    await p.locator('.modal button:has-text("Payer")').click();
    await p.waitForSelector('.modal', { state: 'detached' });
    await p.waitForTimeout(1200);
    const after = await crystals(p);
    if (after - before !== 330) errs.push(`[${name}] cristaux : +${after - before} au lieu de +330`);
    // Passe de saison
    await p.goto('http://localhost:4324/#saison'); await p.waitForSelector('.season-hero');
    await p.locator('.season-pass button').click();
    await p.locator('#consent-digital').check();
    await p.locator('.modal button:has-text("Payer")').click();
    await p.waitForSelector('.season-pass:has-text("Passe actif")');
    await shot(p, `${name}-saison`);
    await p.goto('http://localhost:4324/#profil'); await p.waitForSelector('#spend-limit');
    await shot(p, `${name}-profil`, true);
    console.log(name, '| cristaux', before, '→', after, '| passe actif OK');
    await p.close();
  }
  s2 = await serve('dist-noserver', 4325);
  const p = await b.newPage({ viewport: { width: 1366, height: 860 } });
  await p.goto('http://localhost:4325/#boutique'); await p.waitForSelector('.tabs');
  await p.locator('.tabs button:has-text("Cristaux")').click();
  await p.waitForSelector('text=bientôt disponibles');
  const enabled = await p.locator('.offer.premium button:not([disabled])').count();
  if (enabled) errs.push(`build normal : ${enabled} bouton(s) d'achat actifs sans serveur`);
  await shot(p, 'normal-boutique');
  console.log('build normal | achats indisponibles, rien de simulé');
} finally { await b.close(); s1?.kill(); s2?.kill(); }
if (errs.length) { console.log('ERREURS', errs); process.exit(1); }
console.log('Parcours premium OK');
