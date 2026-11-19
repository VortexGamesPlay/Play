/**
 * Renommage des espèces (schéma v3) : identifiants d'origine → identifiants actuels.
 * Conservé uniquement pour convertir les anciennes sauvegardes.
 */
export const SPECIES_RENAMES_V3: Record<string, string> = {
  pyrodrake: 'fournaillon',
  pyroli: 'tisonnet',
  infernyx: 'basaltor',
  aquabulle: 'perlouille',
  marebulle: 'clapotine',
  mousselin: 'lichenou',
  sylvegard: 'bosquelin',
  givrelune: 'frimelune',
  givrelot: 'frimelot',
  blizzaron: 'banquisard',
  galetou: 'caillounet',
  orolithe: 'aurgile',
  fulgurion: 'orageline',
  lumiolet: 'lucilet',
  solarielle: 'aubelys',
  noctuli: 'songelin',
  noctombre: 'revombre',
  toxilou: 'champilou',
  fantomignon: 'linceulet',
  spectrelune: 'voilunaire',
  scarabor: 'sphingres',
  astrelune: 'cometuse',
  nebulion: 'baleinastre',
  fossilith: 'ambrelith',
  neantis: 'neantelle',
};

/** Mutations renommées (schéma v3). */
export const MUTATION_RENAMES_V3: Record<string, string> = { chromatique: 'irisee' };

/** Objets renommés (schéma v3). */
export const ITEM_RENAMES_V3: Record<string, string> = { baie_sucree: 'fruit_rose', pierre_eveil: 'coquille_eveil', larme_lune: 'rosee_lune' };
