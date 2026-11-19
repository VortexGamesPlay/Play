import type { ElementDef } from '@core/content';
import type { ElementId } from '@core/types';

export const ELEMENTS: Record<ElementId, ElementDef> = {
  feu:        { id: 'feu',        name: 'Feu',        color: '#ff7a3d', special: false, strongAgainst: ['nature', 'glace'] },
  eau:        { id: 'eau',        name: 'Eau',        color: '#3fa7f5', special: false, strongAgainst: ['feu', 'terre'] },
  nature:     { id: 'nature',     name: 'Nature',     color: '#4cc46a', special: false, strongAgainst: ['eau', 'terre'] },
  glace:      { id: 'glace',      name: 'Glace',      color: '#7fdcf0', special: false, strongAgainst: ['air', 'nature'] },
  air:        { id: 'air',        name: 'Air',        color: '#a5d8d0', special: false, strongAgainst: ['nature', 'foudre'] },
  terre:      { id: 'terre',      name: 'Terre',      color: '#c08a52', special: false, strongAgainst: ['foudre', 'feu'] },
  foudre:     { id: 'foudre',     name: 'Foudre',     color: '#ffd23d', special: false, strongAgainst: ['eau', 'air'] },
  lumiere:    { id: 'lumiere',    name: 'Lumière',    color: '#ffe680', special: false, strongAgainst: ['ombre', 'spectre'] },
  ombre:      { id: 'ombre',      name: 'Ombre',      color: '#6b4fa8', special: false, strongAgainst: ['lumiere', 'spectre'] },
  vapeur:     { id: 'vapeur',     name: 'Vapeur',     color: '#c9d6e3', special: true,  strongAgainst: ['glace', 'feu'] },
  cosmique:   { id: 'cosmique',   name: 'Cosmique',   color: '#5a4bd6', special: true,  strongAgainst: ['ombre', 'primordial'] },
  cristal:    { id: 'cristal',    name: 'Cristal',    color: '#b6f0ff', special: true,  strongAgainst: ['foudre', 'toxique'] },
  toxique:    { id: 'toxique',    name: 'Toxique',    color: '#9bd23d', special: true,  strongAgainst: ['nature', 'eau'] },
  spectre:    { id: 'spectre',    name: 'Spectre',    color: '#b8a6f0', special: true,  strongAgainst: ['lumiere', 'cosmique'] },
  primordial: { id: 'primordial', name: 'Primordial', color: '#d4a45a', special: true,  strongAgainst: ['cristal', 'vapeur'] },
};
