import { AMBIANCES } from './ambiances';
import { ELEMENTS } from './elements';
import { EGGS } from './eggs';
import { ITEMS } from './items';
import { MUTATIONS } from './mutations';
import { MAIN_QUESTS } from './quests';
import { RARITIES } from './rarities';
import { RECIPES } from './recipes';
import { BIOMES } from './biomes';
import { BUILDINGS, DECORATIONS, THEMES } from './buildings';
import { WEATHERS } from './weather';
import { BOSSES, LEAGUES } from './arena';
import { ELEMENT_SKILLS, SKILLS } from './skills';
import { STATUSES } from './statuses';
import { ACHIEVEMENTS, DAILY_MISSIONS, SIDE_QUESTS, WEEKLY_MISSIONS } from './missions';
import { SHOP_OFFERS } from './shop';
import { SPECIES_LIST, SPECIES } from './species';

/**
 * Vérifie l'intégrité référentielle de tout le contenu.
 * Exécuté par les tests (et au démarrage en dev) : une faute de frappe dans un id est détectée immédiatement.
 */
export function validateContent(): string[] {
  const errors: string[] = [];
  const dexSeen = new Set<number>();
  const idSeen = new Set<string>();

  for (const s of SPECIES_LIST) {
    if (idSeen.has(s.id)) errors.push(`Espèce en double : ${s.id}`);
    idSeen.add(s.id);
    if (dexSeen.has(s.dex)) errors.push(`Numéro d'Bestiaire en double : ${s.dex}`);
    dexSeen.add(s.dex);
    if (!ELEMENTS[s.element]) errors.push(`${s.id} : élément inconnu ${s.element}`);
    if (!RARITIES[s.rarity]) errors.push(`${s.id} : rareté inconnue ${s.rarity}`);
    for (const evo of s.evolutions) {
      if (!SPECIES[evo.to]) errors.push(`${s.id} : évolution vers espèce inconnue ${evo.to}`);
      for (const c of evo.conditions) {
        if (c.type === 'item' && ITEMS[c.item]?.kind !== 'evolution') errors.push(`${s.id} : objet d'évolution inconnu ${c.item}`);
        if (c.type === 'mutation' && !MUTATIONS[c.mutation]) errors.push(`${s.id} : mutation inconnue ${c.mutation}`);
        if (c.type === 'ambiance' && !AMBIANCES[c.ambiance]) errors.push(`${s.id} : ambiance inconnue ${c.ambiance}`);
      }
    }
  }
  const evolvedInto = new Set(SPECIES_LIST.flatMap((s) => s.evolutions.map((e) => e.to)));
  const inEggs = new Set(Object.values(EGGS).flatMap((e) => e.pool.map((p) => p.species)));
  for (const s of SPECIES_LIST) {
    if (s.obtainableBy.includes('egg') && !inEggs.has(s.id)) errors.push(`${s.id} est marqué « œuf » mais n'apparaît dans aucun œuf`);
    if (s.obtainableBy.includes('evolution') && !evolvedInto.has(s.id)) errors.push(`${s.id} est marqué « évolution » sans espèce source`);
    if (s.obtainableBy.includes('breeding') && !RECIPES.some((r) => r.result === s.id)) errors.push(`${s.id} est marqué « reproduction » sans recette`);
  }

  for (const egg of Object.values(EGGS)) {
    if (!RARITIES[egg.rarity]) errors.push(`Œuf ${egg.id} : rareté inconnue`);
    if (egg.genetic) { if (egg.pool.length > 0) errors.push(`Œuf génétique ${egg.id} : ne doit pas avoir de table`); }
    else if (egg.pool.length === 0) errors.push(`Œuf ${egg.id} : table vide`);
    for (const p of egg.pool) {
      const sp = SPECIES[p.species];
      if (!sp) errors.push(`Œuf ${egg.id} : espèce inconnue ${p.species}`);
      else if (!sp.obtainableBy.includes('egg')) errors.push(`Œuf ${egg.id} : ${p.species} n'est pas obtenable par œuf`);
    }
    for (const m of Object.keys(egg.mutationMultipliers)) if (!MUTATIONS[m]) errors.push(`Œuf ${egg.id} : mutation inconnue ${m}`);
    for (const a of [...egg.affinity, ...(egg.requiresAmbiance ?? [])]) if (!AMBIANCES[a]) errors.push(`Œuf ${egg.id} : ambiance inconnue ${a}`);
  }

  for (const amb of Object.values(AMBIANCES)) {
    for (const m of [...Object.keys(amb.mutationMultipliers), ...Object.keys(amb.nightMultipliers ?? {})]) {
      if (!MUTATIONS[m]) errors.push(`Ambiance ${amb.id} : mutation inconnue ${m}`);
    }
  }

  const offerIds = new Set<string>();
  for (const o of SHOP_OFFERS) {
    if (offerIds.has(o.id)) errors.push(`Offre en double : ${o.id}`);
    offerIds.add(o.id);
    if (o.kind === 'egg' && !EGGS[o.ref]) errors.push(`Offre ${o.id} : œuf inconnu`);
    if (o.kind === 'item' && !ITEMS[o.ref]) errors.push(`Offre ${o.id} : objet inconnu`);
    if (o.kind === 'ambiance' && !AMBIANCES[o.ref]) errors.push(`Offre ${o.id} : ambiance inconnue`);
    if (o.price.amount <= 0) errors.push(`Offre ${o.id} : prix invalide`);
  }

  const recipeIds = new Set<string>();
  for (const r of RECIPES) {
    if (recipeIds.has(r.id)) errors.push(`Recette en double : ${r.id}`);
    recipeIds.add(r.id);
    if (!SPECIES[r.result]) errors.push(`Recette ${r.id} : espèce inconnue ${r.result}`);
    if (r.chance <= 0 || r.chance >= 1) errors.push(`Recette ${r.id} : chance invalide`);
    for (const m of r.parents) {
      if (m.species && !SPECIES[m.species]) errors.push(`Recette ${r.id} : parent inconnu ${m.species}`);
      if (m.element && !ELEMENTS[m.element]) errors.push(`Recette ${r.id} : élément inconnu ${m.element}`);
      if (!m.species && !m.element) errors.push(`Recette ${r.id} : parent sans critère`);
    }
  }

  // Monde
  for (const b of BIOMES) {
    for (const m of b.materials) if (ITEMS[m.item]?.kind !== 'material') errors.push(`Biome ${b.id} : matériau inconnu ${m.item}`);
    for (const e of b.eggs) if (!EGGS[e.egg] || EGGS[e.egg]!.genetic) errors.push(`Biome ${b.id} : œuf invalide ${e.egg}`);
    for (const f of b.foods) if (ITEMS[f]?.kind !== 'food') errors.push(`Biome ${b.id} : nourriture inconnue ${f}`);
    for (const w of b.weather) if (!WEATHERS[w.weather]) errors.push(`Biome ${b.id} : météo inconnue ${w.weather}`);
    for (const el of b.favoredElements) if (!ELEMENTS[el]) errors.push(`Biome ${b.id} : élément inconnu ${el}`);
    if (!THEMES[b.theme]) errors.push(`Biome ${b.id} : terrain inconnu ${b.theme}`);
  }
  for (const egg of Object.values(EGGS)) {
    if (egg.exploreOnly && SHOP_OFFERS.some((o) => o.kind === 'egg' && o.ref === egg.id)) errors.push(`Œuf ${egg.id} : exclusif à l'exploration mais vendu`);
    if (egg.exploreOnly && !BIOMES.some((b) => b.eggs.some((e) => e.egg === egg.id))) errors.push(`Œuf ${egg.id} : exclusif mais absent des biomes`);
  }
  for (const bd of BUILDINGS) {
    if (bd.costs.length !== bd.maxLevel) errors.push(`Bâtiment ${bd.id} : ${bd.costs.length} coûts pour ${bd.maxLevel} niveaux`);
    for (const c of bd.costs) for (const m of Object.keys(c.materials)) if (ITEMS[m]?.kind !== 'material') errors.push(`Bâtiment ${bd.id} : matériau inconnu ${m}`);
  }
  for (const o of SHOP_OFFERS) if (o.kind === 'decoration' && !DECORATIONS.some((d) => d.id === o.ref)) errors.push(`Offre ${o.id} : décoration inconnue`);
  for (const m of [...DAILY_MISSIONS, ...WEEKLY_MISSIONS]) if (m.target <= 0) errors.push(`Mission ${m.id} : objectif invalide`);
  for (const q of SIDE_QUESTS) if (q.goal.kind === 'biomeExpeditions' && !BIOMES.some((b) => b.id === (q.goal as { biome: string }).biome)) errors.push(`Quête ${q.id} : biome inconnu`);
  if (new Set(ACHIEVEMENTS.map((a) => a.id)).size !== ACHIEVEMENTS.length) errors.push('Succès en double');
  for (const s of SPECIES_LIST) for (const e of s.evolutions) for (const c of e.conditions) if (c.type === 'weather' && !WEATHERS[c.weather]) errors.push(`${s.id} : météo inconnue ${c.weather}`);

  // Combats
  for (const [el, list] of Object.entries(ELEMENT_SKILLS)) {
    if (!ELEMENTS[el as keyof typeof ELEMENTS]) errors.push(`Compétences : élément inconnu ${el}`);
    if (list.length !== 3) errors.push(`Compétences ${el} : 3 attendues`);
  }
  for (const sk of Object.values(SKILLS)) {
    if (sk.status && !STATUSES[sk.status.id]) errors.push(`Compétence ${sk.id} : état inconnu`);
    if (sk.energy < 0 || sk.energy > 5) errors.push(`Compétence ${sk.id} : énergie invalide`);
  }
  for (const s of SPECIES_LIST) if (!ELEMENT_SKILLS[s.element]) errors.push(`${s.id} : aucune compétence pour l'élément ${s.element}`);
  const fightIds = new Set<string>();
  for (const l of LEAGUES) {
    if (l.requires && !LEAGUES.some((x) => x.id === l.requires)) errors.push(`Ligue ${l.id} : prérequis inconnu`);
    for (const f of l.fights) {
      if (fightIds.has(f.id)) errors.push(`Combat en double : ${f.id}`);
      fightIds.add(f.id);
      for (const en of f.enemies) if (!SPECIES[en.species]) errors.push(`Combat ${f.id} : espèce inconnue ${en.species}`);
    }
  }
  for (const b of BOSSES) {
    if (!BIOMES.some((x) => x.id === b.biomeId)) errors.push(`Gardien ${b.id} : biome inconnu`);
    for (const en of b.enemies) if (!SPECIES[en.species]) errors.push(`Gardien ${b.id} : espèce inconnue ${en.species}`);
  }

  for (const q of MAIN_QUESTS) {
    for (const e of q.reward.eggs ?? []) if (!EGGS[e]) errors.push(`Quête ${q.id} : œuf inconnu ${e}`);
    for (const i of Object.keys(q.reward.items ?? {})) if (!ITEMS[i]) errors.push(`Quête ${q.id} : objet inconnu ${i}`);
  }
  return errors;
}
