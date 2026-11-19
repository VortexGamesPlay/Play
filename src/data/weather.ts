import type { WeatherDef } from '@core/content';

/**
 * Météo. Elle change toutes les 3 heures, de façon déterministe (core/systems/weather.ts),
 * et influence le butin des expéditions et certaines évolutions.
 */
export const WEATHERS: Record<string, WeatherDef> = {
  soleil:  { id: 'soleil',  name: 'Grand soleil', description: 'Une lumière franche baigne la région.', lootMul: 1, eggChanceMul: 1, elementBonus: ['lumiere', 'feu', 'nature'], fx: 'sun' },
  nuages:  { id: 'nuages',  name: 'Nuageux', description: 'Un ciel doux et changeant.', lootMul: 1, eggChanceMul: 1, elementBonus: ['air'], fx: 'none' },
  pluie:   { id: 'pluie',   name: 'Pluie', description: 'Une pluie tiède qui réveille les marais et les forêts.', lootMul: 1.1, eggChanceMul: 1, elementBonus: ['eau', 'nature', 'toxique'], fx: 'rain' },
  orage:   { id: 'orage',   name: 'Orage', description: 'Les éclairs déchirent le ciel. Les créatures de foudre exultent.', lootMul: 1.15, eggChanceMul: 1.1, elementBonus: ['foudre', 'air'], fx: 'storm' },
  neige:   { id: 'neige',   name: 'Neige', description: 'Des flocons silencieux recouvrent tout.', lootMul: 1, eggChanceMul: 1.05, elementBonus: ['glace', 'cristal'], fx: 'snow' },
  brume:   { id: 'brume',   name: 'Voile de brume', description: 'Un voile épais où l\'on entend des murmures.', lootMul: 0.95, eggChanceMul: 1.2, elementBonus: ['spectre', 'ombre'], fx: 'fog' },
  vent:    { id: 'vent',    name: 'Grand vent', description: 'Des rafales emportent graines et plumes.', lootMul: 1.05, eggChanceMul: 1, elementBonus: ['air'], fx: 'wind' },
  canicule:{ id: 'canicule',name: 'Chaleur écrasante', description: 'L\'air vibre de chaleur.', lootMul: 1, eggChanceMul: 1, elementBonus: ['feu', 'terre'], fx: 'embers' },
  // Événements rares
  pluie_etoiles: { id: 'pluie_etoiles', name: 'Pluie d\'étoiles', event: true, description: 'Des fragments d\'étoiles tombent du ciel. Les œufs sont bien plus nombreux !', lootMul: 1.3, eggChanceMul: 2.5, elementBonus: ['cosmique', 'lumiere'], fx: 'stars' },
  eruption:      { id: 'eruption', name: 'Réveil du volcan', event: true, description: 'Le volcan s\'éveille et rejette des trésors de ses profondeurs.', lootMul: 1.6, eggChanceMul: 1.5, elementBonus: ['feu', 'terre', 'primordial'], fx: 'embers' },
  aurore:        { id: 'aurore', name: 'Aurore boréale', event: true, description: 'Des rideaux de lumière dansent sur les cimes. Les mutations rôdent.', lootMul: 1.3, eggChanceMul: 2, elementBonus: ['glace', 'lumiere', 'cosmique'], fx: 'aurora' },
  maree_lumineuse: { id: 'maree_lumineuse', name: 'Marée lumineuse', event: true, description: 'L\'océan s\'illumine de plancton : les abysses livrent leurs secrets.', lootMul: 1.4, eggChanceMul: 2, elementBonus: ['eau', 'cristal'], fx: 'stars' },
};
