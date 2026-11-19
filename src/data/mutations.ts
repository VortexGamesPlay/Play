import type { MutationDef } from '@core/content';

/**
 * Mutations visuelles. baseChance = probabilité de base par éclosion,
 * modulée par l'œuf, l'ambiance de l'incubateur et la nuit (cf. core/systems/odds.ts).
 * Ajouter une mutation : ajouter une entrée ici + (optionnel) un rendu dans ui/art/mutationLook.ts.
 */
export const MUTATIONS: Record<string, MutationDef> = {
  chromatique: { id: 'chromatique', name: 'Chromatique', group: 'palette', baseChance: 0.02,  statMultiplier: 1.02, color: '#ff6fb5', description: 'Les pigments de la créature ont tourné : une palette entièrement inédite.' },
  doree:       { id: 'doree',       name: 'Dorée',       group: 'palette', baseChance: 0.008, statMultiplier: 1.05, color: '#f5c542', description: 'Un pelage d\'or pur qui scintille au moindre rayon.' },
  corrompue:   { id: 'corrompue',   name: 'Corrompue',   group: 'palette', baseChance: 0.008, statMultiplier: 1.06, color: '#7a2a8f', description: 'Une énergie trouble parcourt son corps de veines luminescentes.' },
  antique:     { id: 'antique',     name: 'Antique',     group: 'palette', baseChance: 0.006, statMultiplier: 1.05, color: '#b08850', description: 'Des runes oubliées sont gravées sur sa peau, teintée de sépia.' },
  spectrale:   { id: 'spectrale',   name: 'Spectrale',   group: 'matiere', baseChance: 0.012, statMultiplier: 1.03, color: '#b8a6f0', description: 'Son corps est translucide, comme à moitié dans un autre monde.' },
  cristalline: { id: 'cristalline', name: 'Cristalline', group: 'matiere', baseChance: 0.012, statMultiplier: 1.04, color: '#9fe8ff', description: 'Des facettes cristallines recouvrent sa silhouette et diffractent la lumière.' },
  cosmique:    { id: 'cosmique',    name: 'Cosmique',    group: 'matiere', baseChance: 0.006, statMultiplier: 1.06, color: '#5a4bd6', description: 'Une galaxie entière semble tourner sous sa peau.' },
  givree:      { id: 'givree',      name: 'Givrée',      group: 'element', baseChance: 0.015, statMultiplier: 1.02, color: '#a9ecff', description: 'Éclos dans le froid : du givre perle sur ses contours.' },
  ardente:     { id: 'ardente',     name: 'Ardente',     group: 'element', baseChance: 0.015, statMultiplier: 1.02, color: '#ff8a3d', description: 'Éclos dans la chaleur : des braises dansent autour de lui.' },
  florale:     { id: 'florale',     name: 'Florale',     group: 'element', baseChance: 0.015, statMultiplier: 1.02, color: '#ff9fd0', description: 'Éclos parmi les plantes : des fleurs poussent sur sa tête.' },
  mutante:     { id: 'mutante',     name: 'Mutante',     group: 'forme',   baseChance: 0.012, statMultiplier: 1.04, color: '#7bd23d', description: 'Un troisième œil s\'est ouvert. Il voit des choses étranges.' },
};
