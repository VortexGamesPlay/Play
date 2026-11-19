import type { ItemDef } from '@core/content';

/** Les étiquettes (tags) correspondent aux favoriteFood des espèces et serviront aux évolutions. */
export const ITEMS: Record<string, ItemDef> = {
  baie_sucree:    { id: 'baie_sucree',    name: 'Baie sucrée',     kind: 'food', xp: 25,  affection: 2, tags: ['fruit'],   color: '#ff6f91', description: 'Une baie rose et juteuse. Tout le monde l\'aime.' },
  graine_soleil:  { id: 'graine_soleil',  name: 'Graine solaire',  kind: 'food', xp: 40,  affection: 2, tags: ['graine'],  color: '#ffc93d', description: 'Une graine tiède gorgée de lumière.' },
  poisson_braise: { id: 'poisson_braise', name: 'Poisson braisé',  kind: 'food', xp: 55,  affection: 3, tags: ['poisson'], color: '#ff9a5a', description: 'Croustillant à l\'extérieur, fondant à l\'intérieur.' },
  champi_lune:    { id: 'champi_lune',    name: 'Champi de lune',  kind: 'food', xp: 55,  affection: 3, tags: ['champi'],  color: '#9b8cf0', description: 'Ne pousse que sous la pleine lune. Légèrement pétillant.' },
  cristal_sucre:  { id: 'cristal_sucre',  name: 'Cristal de sucre', kind: 'food', xp: 90, affection: 4, tags: ['mineral'], color: '#9fe8ff', description: 'Un minéral sucré qui croque sous la dent.' },
  pierre_eveil:   { id: 'pierre_eveil',   name: 'Pierre d\'éveil', kind: 'evolution', xp: 0, affection: 0, tags: [], color: '#f0b040', description: 'Une pierre tiède qui révèle ce qui dort sous la roche. Requise pour certaines évolutions.' },
  larme_lune:     { id: 'larme_lune',     name: 'Larme de lune',  kind: 'evolution', xp: 0, affection: 0, tags: [], color: '#b8a6f0', description: 'Une goutte de clair de lune solidifiée. Requise pour certaines évolutions.' },
  nectar_etoile:  { id: 'nectar_etoile',  name: 'Nectar d\'étoile', kind: 'food', xp: 160, affection: 8, tags: ['nectar'], color: '#c6a7ff', description: 'Une goutte de lumière stellaire. Précieux et nourrissant.' },
};
