import type { ShopOffer } from '@core/content';

/**
 * Boutique — uniquement des monnaies du jeu. Aucune créature n'est vendue contre de l'argent réel.
 * Les probabilités des œufs sont toujours affichées (OddsPanel).
 */
export const SHOP_OFFERS: ShopOffer[] = [
  { id: 'egg_forestier',   kind: 'egg', ref: 'forestier',   price: { currency: 'coins', amount: 120 } },
  { id: 'egg_marin',       kind: 'egg', ref: 'marin',       price: { currency: 'coins', amount: 150 } },
  { id: 'egg_volcanique',  kind: 'egg', ref: 'volcanique',  price: { currency: 'coins', amount: 380 },  requires: { dexCount: 3 } },
  { id: 'egg_fantome',     kind: 'egg', ref: 'fantome',     price: { currency: 'coins', amount: 750 },  requires: { dexCount: 5 } },
  { id: 'egg_celeste',     kind: 'egg', ref: 'celeste',     price: { currency: 'coins', amount: 800 },  requires: { dexCount: 6 } },
  { id: 'egg_antique',     kind: 'egg', ref: 'antique',     price: { currency: 'coins', amount: 2200 }, requires: { dexCount: 9 } },
  { id: 'egg_corrompu',    kind: 'egg', ref: 'corrompu',    price: { currency: 'essence', amount: 120 }, requires: { dexCount: 9 } },
  { id: 'egg_prismatique', kind: 'egg', ref: 'prismatique', price: { currency: 'crystals', amount: 45 }, requires: { dexCount: 11 } },
  { id: 'egg_cosmique',    kind: 'egg', ref: 'cosmique',    price: { currency: 'crystals', amount: 70 }, requires: { dexCount: 13 } },
  { id: 'egg_legendaire',  kind: 'egg', ref: 'legendaire',  price: { currency: 'crystals', amount: 140 }, requires: { dexCount: 15 } },

  { id: 'food_baie',    kind: 'item', ref: 'fruit_rose',    quantity: 5, price: { currency: 'coins', amount: 60 } },
  { id: 'food_graine',  kind: 'item', ref: 'graine_soleil',  quantity: 5, price: { currency: 'coins', amount: 95 } },
  { id: 'food_poisson', kind: 'item', ref: 'poisson_braise', quantity: 3, price: { currency: 'coins', amount: 110 } },
  { id: 'food_champi',  kind: 'item', ref: 'champi_lune',    quantity: 3, price: { currency: 'coins', amount: 110 } },
  { id: 'food_cristal', kind: 'item', ref: 'cristal_sucre',  quantity: 3, price: { currency: 'coins', amount: 190 }, requires: { dexCount: 4 } },
  { id: 'food_nectar',  kind: 'item', ref: 'nectar_etoile',  quantity: 2, price: { currency: 'essence', amount: 30 } },

  { id: 'evo_pierre', kind: 'item', ref: 'coquille_eveil', quantity: 1, price: { currency: 'essence', amount: 40 }, requires: { dexCount: 5 } },
  { id: 'evo_larme',  kind: 'item', ref: 'rosee_lune',   quantity: 1, price: { currency: 'essence', amount: 60 }, requires: { dexCount: 8 } },

  { id: 'slot_3', kind: 'incubator_slot', slotNumber: 3, price: { currency: 'coins', amount: 600 } },
  { id: 'slot_4', kind: 'incubator_slot', slotNumber: 4, price: { currency: 'coins', amount: 1800 }, requires: { dexCount: 5 } },
  { id: 'slot_5', kind: 'incubator_slot', slotNumber: 5, price: { currency: 'coins', amount: 4500 }, requires: { dexCount: 9 } },
  { id: 'slot_6', kind: 'incubator_slot', slotNumber: 6, price: { currency: 'crystals', amount: 80 }, requires: { dexCount: 12 } },

  { id: 'amb_serre',   kind: 'ambiance', ref: 'serre',   price: { currency: 'coins', amount: 450 } },
  { id: 'amb_chaleur', kind: 'ambiance', ref: 'chaleur', price: { currency: 'coins', amount: 450 },  requires: { dexCount: 3 } },
  { id: 'amb_froid',   kind: 'ambiance', ref: 'froid',   price: { currency: 'coins', amount: 450 },  requires: { dexCount: 3 } },
  { id: 'amb_brume',   kind: 'ambiance', ref: 'brume',   price: { currency: 'coins', amount: 1200 }, requires: { dexCount: 6 } },
  { id: 'amb_etoilee', kind: 'ambiance', ref: 'etoilee', price: { currency: 'crystals', amount: 30 }, requires: { dexCount: 8 } },
];
