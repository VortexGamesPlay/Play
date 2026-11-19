import { AMBIANCES } from './ambiances';
import { ELEMENTS } from './elements';
import { EGGS } from './eggs';
import { ITEMS } from './items';
import { MUTATIONS } from './mutations';
import { MAIN_QUESTS } from './quests';
import { RARITIES } from './rarities';
import { RECIPES } from './recipes';
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
    if (dexSeen.has(s.dex)) errors.push(`Numéro d'Ovidex en double : ${s.dex}`);
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

  for (const q of MAIN_QUESTS) {
    for (const e of q.reward.eggs ?? []) if (!EGGS[e]) errors.push(`Quête ${q.id} : œuf inconnu ${e}`);
    for (const i of Object.keys(q.reward.items ?? {})) if (!ITEMS[i]) errors.push(`Quête ${q.id} : objet inconnu ${i}`);
  }
  return errors;
}
