import type { BuildingDef, DecorationDef, ThemeDef } from '@core/content';

/** Bâtiments du sanctuaire, améliorables avec des pièces et des matériaux d'exploration. */
export const BUILDINGS: BuildingDef[] = [
  {
    id: 'nichoirs', name: 'Nichoirs', startLevel: 1, maxLevel: 5,
    description: 'Les habitats de tes créatures. Chaque niveau accueille plus de pensionnaires.',
    effect: { kind: 'creatureCap', base: 30, perLevel: 20 },
    costs: [
      { coins: 0, materials: {} },
      { coins: 600, materials: { bois_lune: 4 } },
      { coins: 1800, materials: { bois_lune: 8, nacre: 4 } },
      { coins: 4500, materials: { bois_lune: 12, givre_eternel: 6, basalte: 6 } },
      { coins: 9000, materials: { bois_lune: 16, mousse_marais: 8, sable_dore: 8 } },
    ],
  },
  {
    id: 'grenier', name: 'Grenier à œufs', startLevel: 1, maxLevel: 5,
    description: 'Un grenier douillet et tempéré pour conserver plus d\'œufs.',
    effect: { kind: 'eggCap', base: 22, perLevel: 8 },
    costs: [
      { coins: 0, materials: {} },
      { coins: 500, materials: { bois_lune: 3 } },
      { coins: 1400, materials: { bois_lune: 6, nacre: 3 } },
      { coins: 3500, materials: { basalte: 6, sable_dore: 4 } },
      { coins: 7000, materials: { givre_eternel: 8, eclat_ombre: 4 } },
    ],
  },
  {
    id: 'jardin', name: 'Jardin nourricier', startLevel: 0, maxLevel: 4,
    description: 'Un potager qui produit de la nourriture, récoltée avec les pièces du sanctuaire.',
    effect: { kind: 'garden', perLevel: 1 },
    costs: [
      { coins: 400, materials: { bois_lune: 3 } },
      { coins: 1200, materials: { bois_lune: 6, mousse_marais: 3 } },
      { coins: 3000, materials: { mousse_marais: 8, sable_dore: 4 } },
      { coins: 6000, materials: { poussiere_etoile: 4, mousse_marais: 10 } },
    ],
  },
  {
    id: 'bassin', name: 'Bassin des marées', startLevel: 0, maxLevel: 4,
    description: 'Une zone aquatique : les créatures d\'eau, de glace, de cristal et de vapeur y produisent davantage.',
    effect: { kind: 'zone', perLevel: 0.12, elements: ['eau', 'glace', 'cristal', 'vapeur'] },
    costs: [
      { coins: 800, materials: { nacre: 4 } },
      { coins: 2000, materials: { nacre: 8, givre_eternel: 3 } },
      { coins: 4500, materials: { nacre: 12, givre_eternel: 6 } },
      { coins: 8000, materials: { nacre: 16, poussiere_etoile: 3 } },
    ],
  },
  {
    id: 'fournaise', name: 'Fournaise', startLevel: 0, maxLevel: 4,
    description: 'Une zone volcanique : les créatures de feu, de terre, de foudre et primordiales y produisent davantage.',
    effect: { kind: 'zone', perLevel: 0.12, elements: ['feu', 'terre', 'foudre', 'primordial'] },
    costs: [
      { coins: 800, materials: { basalte: 4 } },
      { coins: 2000, materials: { basalte: 8, sable_dore: 3 } },
      { coins: 4500, materials: { basalte: 12, sable_dore: 6 } },
      { coins: 8000, materials: { basalte: 16, eclat_ombre: 3 } },
    ],
  },
  {
    id: 'observatoire', name: 'Observatoire de recherche', startLevel: 0, maxLevel: 4,
    description: 'Une installation de recherche qui distille de l\'essence à partir des observations de tes créatures.',
    effect: { kind: 'essence', perLevel: 1.5 },
    costs: [
      { coins: 1500, materials: { givre_eternel: 4, bois_lune: 4 } },
      { coins: 3500, materials: { eclat_ombre: 4, sable_dore: 6 } },
      { coins: 7000, materials: { poussiere_etoile: 6, eclat_ombre: 6 } },
      { coins: 12000, materials: { poussiere_etoile: 12, givre_eternel: 10 } },
    ],
  },
];

export const BUILDING_BY_ID: Record<string, BuildingDef> = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));

/** Décorations purement esthétiques, placées dans la scène du sanctuaire. */
export const DECORATIONS: DecorationDef[] = [
  { id: 'lanternes', name: 'Lanternes flottantes', shape: 'lantern', color: '#ffc85a', description: 'Elles s\'allument toutes seules à la tombée de la nuit.' },
  { id: 'arche', name: 'Arche fleurie', shape: 'arch', color: '#ff9fd0', description: 'Une arche de fleurs qui changent de couleur au fil des saisons.' },
  { id: 'statue', name: 'Statue de coquille', shape: 'statue', color: '#e8e0ff', description: 'Hommage au tout premier œuf de ton sanctuaire.' },
  { id: 'champignons', name: 'Cercle de champignons', shape: 'mushrooms', color: '#c46fe0', description: 'Les petites créatures adorent y faire la ronde.' },
  { id: 'cristaux', name: 'Jardin de cristaux', shape: 'crystals', color: '#9fe8ff', description: 'Des cristaux qui tintent quand le vent souffle.' },
  { id: 'banc', name: 'Banc du gardien', shape: 'bench', color: '#c08a52', description: 'Pour regarder tes créatures jouer.' },
  { id: 'fontaine', name: 'Fontaine aux vœux', shape: 'fountain', color: '#7fd0ff', description: 'On dit qu\'y jeter une pièce porte bonheur aux œufs.' },
  { id: 'guirlande', name: 'Guirlande d\'étoiles', shape: 'garland', color: '#ffe680', description: 'Une guirlande qui scintille doucement.' },
];

/** Terrains du sanctuaire, débloqués par l'exploration. */
export const THEMES: Record<string, ThemeDef> = {
  prairie: { id: 'prairie', name: 'Prairie', sky: ['#9fd8ff', '#ffe4f2'], ground: ['#a8eb9a', '#74cf7a'], hill: ['#8fe0a0', '#5fc47e'], nightSky: ['#241a5c', '#5a4aa8'] },
  lagon: { id: 'lagon', name: 'Lagon', sky: ['#8fe8ff', '#fff4d6'], ground: ['#ffe9b8', '#f0d090'], hill: ['#6fd8d0', '#3fb8b0'], nightSky: ['#1a2a5c', '#3a6aa8'] },
  neige: { id: 'neige', name: 'Plaine enneigée', sky: ['#cfe6ff', '#f6f0ff'], ground: ['#ffffff', '#dfe8f8'], hill: ['#e8f0ff', '#b8cbe8'], nightSky: ['#1a2050', '#4a5aa8'] },
  cendres: { id: 'cendres', name: 'Terres de cendres', sky: ['#ffc8a0', '#ffe8c8'], ground: ['#d8a878', '#a8784a'], hill: ['#c08a5a', '#8a5a3a'], nightSky: ['#2a1420', '#6a3a4a'] },
  lune: { id: 'lune', name: 'Jardin lunaire', sky: ['#6a5ae0', '#c8b8ff'], ground: ['#a89ae8', '#7a6ad0'], hill: ['#8a7ae0', '#5a4ab8'], nightSky: ['#0e0a2a', '#3a2d9e'] },
};
