/**
 * Traduction du contenu du jeu (créatures, œufs, objets, quêtes…).
 * Les fichiers de données sont écrits en français ; à chaque changement de langue, seuls leurs champs de TEXTE
 * sont remplacés (les identifiants, nombres et règles ne changent jamais). Les originaux français sont conservés.
 */
import { ACHIEVEMENTS, DAILY_MISSIONS, SIDE_QUESTS, WEEKLY_MISSIONS } from '@data/missions';
import { AMBIANCES } from '@data/ambiances';
import { BALANCE } from '@data/balance';
import { BIOMES } from '@data/biomes';
import { BOSSES, LEAGUES } from '@data/arena';
import { BUILDINGS, DECORATIONS, THEMES } from '@data/buildings';
import { EGGS } from '@data/eggs';
import { ELEMENTS } from '@data/elements';
import { ITEMS } from '@data/items';
import { MAIN_QUESTS } from '@data/quests';
import { MUTATIONS } from '@data/mutations';
import { PERSONALITIES } from '@data/personalities';
import { PRODUCTS } from '@data/products';
import { RARITIES } from '@data/rarities';
import { RECIPES } from '@data/recipes';
import { SEASONS } from '@data/seasons';
import { SHOP_OFFERS } from '@data/shop';
import { SKILLS } from '@data/skills';
import { SPECIES_LIST } from '@data/species';
import { STATUSES } from '@data/statuses';
import { WEATHERS } from '@data/weather';
import { onLocaleChange, t } from './index';

type Obj = Record<string, unknown>;
const originals = new WeakMap<Obj, Record<string, string>>();

/** [objets, champs à traduire] */
function targets(): [Obj[], string[]][] {
  return [
    [SPECIES_LIST as unknown as Obj[], ['description', 'family']],
    [Object.values(EGGS) as unknown as Obj[], ['name', 'description']],
    [Object.values(ITEMS) as unknown as Obj[], ['name', 'description']],
    [Object.values(MUTATIONS) as unknown as Obj[], ['name', 'description']],
    [Object.values(AMBIANCES) as unknown as Obj[], ['name', 'description']],
    [Object.values(PERSONALITIES) as unknown as Obj[], ['name', 'description']],
    [Object.values(ELEMENTS) as unknown as Obj[], ['name']],
    [Object.values(RARITIES) as unknown as Obj[], ['name']],
    [BIOMES as unknown as Obj[], ['name', 'description']],
    [BIOMES.map((b) => b.secret) as unknown as Obj[], ['name', 'description']],
    [Object.values(WEATHERS) as unknown as Obj[], ['name', 'description']],
    [BUILDINGS as unknown as Obj[], ['name', 'description']],
    [DECORATIONS as unknown as Obj[], ['name', 'description']],
    [Object.values(THEMES) as unknown as Obj[], ['name']],
    [MAIN_QUESTS as unknown as Obj[], ['chapter', 'title', 'description']],
    [[...DAILY_MISSIONS, ...WEEKLY_MISSIONS] as unknown as Obj[], ['title']],
    [ACHIEVEMENTS as unknown as Obj[], ['title', 'description']],
    [Object.values(SKILLS) as unknown as Obj[], ['name', 'description']],
    [Object.values(STATUSES) as unknown as Obj[], ['name', 'description']],
    [LEAGUES as unknown as Obj[], ['name', 'description']],
    [LEAGUES.flatMap((l) => l.fights) as unknown as Obj[], ['title']],
    [BOSSES as unknown as Obj[], ['name', 'title', 'description']],
    [RECIPES as unknown as Obj[], ['name', 'hint']],
    [PRODUCTS as unknown as Obj[], ['name', 'badge']],
    [SEASONS as unknown as Obj[], ['name']],
    [Object.values(BALANCE.expedition.durations) as unknown as Obj[], ['label']],
    [SHOP_OFFERS.filter((o) => o.kind === 'perk') as unknown as Obj[], ['name', 'description']],
  ];
}

/** Tous les textes français du contenu (pour vérifier que chacun a sa traduction). */
export function contentStrings(): string[] {
  const out = new Set<string>();
  for (const [objs, fields] of targets()) {
    for (const o of objs) {
      const orig = originals.get(o);
      for (const f of fields) {
        const v = orig?.[f] ?? o[f];
        if (typeof v === 'string' && v) out.add(v);
      }
    }
  }
  return [...out];
}

export function localizeContent(): void {
  for (const [objs, fields] of targets()) {
    for (const o of objs) {
      let orig = originals.get(o);
      if (!orig) {
        orig = {};
        for (const f of fields) if (typeof o[f] === 'string') orig[f] = o[f] as string;
        originals.set(o, orig);
      }
      for (const [f, fr] of Object.entries(orig)) o[f] = t(fr);
    }
  }
  // Quêtes de biome : textes générés à partir du nom du biome.
  for (const q of SIDE_QUESTS) {
    if (q.goal.kind !== 'biomeExpeditions') continue;
    const biome = BIOMES.find((b) => b.id === (q.goal as { biome: string }).biome)!;
    const target = q.goal.target;
    q.chapter = biome.name;
    q.title = t(target <= 3 ? 'Premiers pas' : 'Habitué des lieux');
    q.description = t('Termine {n} expéditions : {biome}.', { n: target, biome: biome.name });
  }
}

localizeContent();
onLocaleChange(localizeContent);
