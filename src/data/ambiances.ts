import type { AmbianceDef } from '@core/content';

/**
 * Ambiances d'incubateur : l'environnement influence les mutations (jamais garanties).
 */
export const AMBIANCES: Record<string, AmbianceDef> = {
  neutre: {
    id: 'neutre', name: 'Neutre', color: '#d8d0f0',
    description: 'Une chaleur douce et stable. Aucune influence particulière.',
    mutationMultipliers: {},
  },
  chaleur: {
    id: 'chaleur', name: 'Chaleur volcanique', color: '#ff8a3d',
    description: 'Pierres brûlantes. Favorise les mutations ardentes, défavorise le cristal.',
    mutationMultipliers: { ardente: 4, cristalline: 0.5, givree: 0 },
  },
  froid: {
    id: 'froid', name: 'Froid polaire', color: '#7fdcf0',
    description: 'Glace éternelle. Favorise les mutations givrées et cristallines.',
    mutationMultipliers: { givree: 4, cristalline: 1.6, ardente: 0 },
  },
  serre: {
    id: 'serre', name: 'Serre luxuriante', color: '#4cc46a',
    description: 'Humidité et pollen. Favorise les mutations florales et irisées.',
    mutationMultipliers: { florale: 4, irisee: 1.4 },
  },
  etoilee: {
    id: 'etoilee', name: 'Nuit étoilée', color: '#5a4bd6',
    description: 'Un ciel artificiel. Favorise les mutations cosmiques, surtout lors des vraies nuits (20h–6h).',
    mutationMultipliers: { cosmique: 2.5, spectrale: 1.3 },
    nightMultipliers: { cosmique: 2 },
  },
  brume: {
    id: 'brume', name: 'Brume spectrale', color: '#b8a6f0',
    description: 'Un voile froid venu de l\'au-delà. Favorise les mutations spectrales et corrompues.',
    mutationMultipliers: { spectrale: 3.5, corrompue: 1.5 },
    nightMultipliers: { spectrale: 1.3 },
  },
};
