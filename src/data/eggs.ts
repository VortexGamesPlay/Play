import type { EggDef } from '@core/content';
import { HOUR, MINUTE, SECOND } from '@core/time';

/**
 * Œufs. Les probabilités affichées au joueur sont CALCULÉES à partir de ces données
 * par core/systems/odds.ts — la même fonction que celle utilisée pour l'éclosion.
 */
export const EGGS: Record<string, EggDef> = {
  forestier: {
    id: 'forestier', name: 'Œuf forestier', rarity: 'commun', incubationMs: 30 * SECOND,
    description: 'Trouvé entre les racines d\'un vieux chêne. Il sent la mousse et la rosée.',
    pool: [{ species: 'mousselin' }, { species: 'zephyrin' }, { species: 'galetou' }, { species: 'pyroli', weightMul: 0.5 },
      { species: 'etincelou' }, { species: 'lumiolet' }, { species: 'toxilou', weightMul: 0.5 }],
    mutationMultipliers: { florale: 1.5 }, affinity: ['serre'],
    visual: { base: '#a8e08a', secondary: '#5fa85a', pattern: 'leaves', glow: '#d9ffc2' },
  },
  marin: {
    id: 'marin', name: 'Œuf marin', rarity: 'commun', incubationMs: 45 * SECOND,
    description: 'Poli par les vagues, il clapote doucement quand on le secoue.',
    pool: [{ species: 'aquabulle' }, { species: 'givrelot' }, { species: 'toxilou', weightMul: 0.6 }, { species: 'cristalis', weightMul: 0.6 }],
    mutationMultipliers: { givree: 1.3 }, affinity: ['froid'],
    visual: { base: '#8fd6ff', secondary: '#3a8ee0', pattern: 'waves', glow: '#d0f2ff' },
  },
  volcanique: {
    id: 'volcanique', name: 'Œuf volcanique', rarity: 'peu_commun', incubationMs: 2 * MINUTE,
    description: 'Brûlant au toucher. Des veines de magma pulsent sous sa coquille.',
    pool: [{ species: 'pyroli', weightMul: 1.5 }, { species: 'galetou' }, { species: 'etincelou' }, { species: 'scarabor' }, { species: 'cristalis', weightMul: 0.5 }],
    mutationMultipliers: { ardente: 2 }, affinity: ['chaleur'],
    visual: { base: '#5a2a2a', secondary: '#ff6a2a', pattern: 'lava', glow: '#ffb07a' },
  },
  celeste: {
    id: 'celeste', name: 'Œuf céleste', rarity: 'rare', incubationMs: 5 * MINUTE,
    description: 'Il flotte à quelques centimètres du sol et suit les courants d\'air.',
    pool: [{ species: 'zephyrin' }, { species: 'lumiolet', weightMul: 1.5 }, { species: 'etincelou' }, { species: 'astrelune', weightMul: 1.2 }],
    mutationMultipliers: { cosmique: 1.5, chromatique: 1.3 }, affinity: ['etoilee'],
    visual: { base: '#e6f4ff', secondary: '#9cc8ff', pattern: 'clouds', glow: '#ffffff' },
  },
  fantome: {
    id: 'fantome', name: 'Œuf fantôme', rarity: 'rare', incubationMs: 5 * MINUTE,
    description: 'À moitié transparent. On jurerait l\'entendre chuchoter la nuit.',
    pool: [{ species: 'noctuli', weightMul: 1.4 }, { species: 'fantomignon', weightMul: 2 }, { species: 'toxilou' }],
    mutationMultipliers: { spectrale: 2.5 }, affinity: ['brume'],
    visual: { base: '#d6ccff', secondary: '#8a6ff0', pattern: 'wisps', glow: '#efeaff' },
  },
  antique: {
    id: 'antique', name: 'Œuf antique', rarity: 'epique', incubationMs: 15 * MINUTE,
    description: 'Exhumé dans le désert ancien. Des glyphes tournent lentement à sa surface.',
    pool: [{ species: 'scarabor', weightMul: 1.5 }, { species: 'galetou' }, { species: 'cristalis' }, { species: 'fossilith', weightMul: 3 }],
    mutationMultipliers: { antique: 4 }, affinity: ['chaleur'],
    visual: { base: '#e3c78f', secondary: '#8a6a3a', pattern: 'runes', glow: '#fff0c8' },
  },
  corrompu: {
    id: 'corrompu', name: 'Œuf corrompu', rarity: 'epique', incubationMs: 15 * MINUTE,
    description: 'Une énergie instable s\'en échappe. Il est chaud et froid à la fois.',
    pool: [{ species: 'noctuli', weightMul: 1.5 }, { species: 'toxilou', weightMul: 1.5 }, { species: 'fantomignon' }],
    mutationMultipliers: { corrompue: 5, mutante: 2.5 }, affinity: ['brume'],
    visual: { base: '#3a1f4a', secondary: '#c040ff', pattern: 'veins', glow: '#e09aff' },
  },
  prismatique: {
    id: 'prismatique', name: 'Œuf prismatique', rarity: 'legendaire', incubationMs: 30 * MINUTE,
    description: 'Sa coquille décompose la lumière. Les créatures qui en naissent sont rarement ordinaires.',
    pool: [{ species: 'pyroli' }, { species: 'aquabulle' }, { species: 'mousselin' }, { species: 'givrelot' }, { species: 'zephyrin' },
      { species: 'galetou' }, { species: 'etincelou' }, { species: 'lumiolet' }, { species: 'noctuli' }, { species: 'cristalis', weightMul: 2 }],
    mutationMultipliers: { chromatique: 6, cristalline: 3, doree: 2 }, affinity: ['serre', 'froid'],
    visual: { base: '#ffffff', secondary: '#ff9fe0', pattern: 'prism', glow: '#ffffff' },
  },
  cosmique: {
    id: 'cosmique', name: 'Œuf cosmique', rarity: 'mythique', incubationMs: 1 * HOUR,
    description: 'Tombé avec une météorite. Il ne peut éclore que sous un ciel étoilé.',
    pool: [{ species: 'astrelune', weightMul: 4 }, { species: 'nebulion', weightMul: 6 }, { species: 'lumiolet' }, { species: 'noctuli' }],
    mutationMultipliers: { cosmique: 4 }, affinity: [], requiresAmbiance: ['etoilee'],
    visual: { base: '#1d1650', secondary: '#7a5af0', pattern: 'galaxy', glow: '#b9a8ff' },
  },
  legendaire: {
    id: 'legendaire', name: 'Œuf légendaire', rarity: 'legendaire', incubationMs: 2 * HOUR,
    description: 'Couronné d\'or. Aucun gardien n\'a jamais su ce qu\'il contiendrait.',
    pool: [{ species: 'astrelune', weightMul: 4 }, { species: 'nebulion', weightMul: 4 }, { species: 'fossilith', weightMul: 4 }, { species: 'serapheon', weightMul: 5 }],
    mutationMultipliers: { doree: 3 }, affinity: ['etoilee', 'chaleur'],
    visual: { base: '#fff3c4', secondary: '#f0b020', pattern: 'crown', glow: '#fff6c8' },
  },
};
