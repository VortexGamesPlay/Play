import type { ItemDef } from '@core/content';

/** Les étiquettes (tags) correspondent aux favoriteFood des espèces et serviront aux évolutions. */
export const ITEMS: Record<string, ItemDef> = {
  fruit_rose:    { id: 'fruit_rose',    name: 'Fruit rose',     kind: 'food', xp: 25,  affection: 2, tags: ['fruit'],   color: '#ff6f91', description: 'Une baie rose et juteuse. Tout le monde l\'aime.' },
  graine_soleil:  { id: 'graine_soleil',  name: 'Graine solaire',  kind: 'food', xp: 40,  affection: 2, tags: ['graine'],  color: '#ffc93d', description: 'Une graine tiède gorgée de lumière.' },
  poisson_braise: { id: 'poisson_braise', name: 'Poisson braisé',  kind: 'food', xp: 55,  affection: 3, tags: ['poisson'], color: '#ff9a5a', description: 'Croustillant à l\'extérieur, fondant à l\'intérieur.' },
  champi_lune:    { id: 'champi_lune',    name: 'Champi de lune',  kind: 'food', xp: 55,  affection: 3, tags: ['champi'],  color: '#9b8cf0', description: 'Ne pousse que sous la pleine lune. Légèrement pétillant.' },
  cristal_sucre:  { id: 'cristal_sucre',  name: 'Cristal de sucre', kind: 'food', xp: 90, affection: 4, tags: ['mineral'], color: '#9fe8ff', description: 'Un minéral sucré qui croque sous la dent.' },
  coquille_eveil:   { id: 'coquille_eveil',   name: 'Coquille d\'éveil', kind: 'evolution', xp: 0, affection: 0, tags: [], color: '#f0b040', description: 'Une pierre tiède qui révèle ce qui dort sous la roche. Requise pour certaines évolutions.' },
  rosee_lune:     { id: 'rosee_lune',     name: 'Rosée lunaire',  kind: 'evolution', xp: 0, affection: 0, tags: [], color: '#b8a6f0', description: 'Une goutte de clair de lune solidifiée. Requise pour certaines évolutions.' },
  // Matériaux d'exploration (constructions du sanctuaire)
  bois_lune:        { id: 'bois_lune',        name: 'Bois de lune',      kind: 'material', xp: 0, affection: 0, tags: [], color: '#b8a070', description: 'Un bois clair qui luit faiblement. Récolté dans la Forêt enchantée.' },
  nacre:            { id: 'nacre',            name: 'Nacre irisée',      kind: 'material', xp: 0, affection: 0, tags: [], color: '#f0e0ff', description: 'Des éclats de coquillages géants du Royaume sous-marin.' },
  givre_eternel:    { id: 'givre_eternel',    name: 'Givre éternel',     kind: 'material', xp: 0, affection: 0, tags: [], color: '#bfefff', description: 'Une glace qui ne fond jamais. Montagnes gelées.' },
  basalte:          { id: 'basalte',          name: 'Basalte tiède',     kind: 'material', xp: 0, affection: 0, tags: [], color: '#6a4a4a', description: 'Une roche volcanique qui garde la chaleur. Volcan ancestral.' },
  mousse_marais:    { id: 'mousse_marais',    name: 'Mousse des marais', kind: 'material', xp: 0, affection: 0, tags: [], color: '#8ab04a', description: 'Une mousse spongieuse et fertile. Marais toxique.' },
  sable_dore:       { id: 'sable_dore',       name: 'Sable doré',        kind: 'material', xp: 0, affection: 0, tags: [], color: '#f0c050', description: 'Un sable fin qui scintille. Désert ancien.' },
  eclat_ombre:      { id: 'eclat_ombre',      name: 'Éclat d\'ombre',     kind: 'material', xp: 0, affection: 0, tags: [], color: '#5a4a8a', description: 'Un fragment de nuit solidifiée. Vallée des ombres.' },
  poussiere_etoile: { id: 'poussiere_etoile', name: 'Poussière d\'étoile', kind: 'material', xp: 0, affection: 0, tags: [], color: '#ffe680', description: 'Une poudre lumineuse tombée des nébuleuses. Dimension cosmique.' },
  nectar_etoile:  { id: 'nectar_etoile',  name: 'Nectar d\'étoile', kind: 'food', xp: 160, affection: 8, tags: ['nectar'], color: '#c6a7ff', description: 'Une goutte de lumière stellaire. Précieux et nourrissant.' },
};
