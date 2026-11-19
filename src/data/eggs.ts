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
    pool: [{ species: 'lichenou' }, { species: 'zephyrin' }, { species: 'caillounet' }, { species: 'tisonnet', weightMul: 0.5 },
      { species: 'etincelou' }, { species: 'lucilet' }, { species: 'champilou', weightMul: 0.5 }],
    mutationMultipliers: { florale: 1.5 }, affinity: ['serre'],
    visual: { base: '#a8e08a', secondary: '#5fa85a', pattern: 'leaves', glow: '#d9ffc2' },
  },
  marin: {
    id: 'marin', name: 'Œuf marin', rarity: 'commun', incubationMs: 45 * SECOND,
    description: 'Poli par les vagues, il clapote doucement quand on le secoue.',
    pool: [{ species: 'perlouille' }, { species: 'frimelot' }, { species: 'champilou', weightMul: 0.6 }, { species: 'cristalis', weightMul: 0.6 }],
    mutationMultipliers: { givree: 1.3 }, affinity: ['froid'],
    visual: { base: '#8fd6ff', secondary: '#3a8ee0', pattern: 'waves', glow: '#d0f2ff' },
  },
  volcanique: {
    id: 'volcanique', name: 'Œuf volcanique', rarity: 'peu_commun', incubationMs: 2 * MINUTE,
    description: 'Brûlant au toucher. Des veines de magma pulsent sous sa coquille.',
    pool: [{ species: 'tisonnet', weightMul: 1.5 }, { species: 'caillounet' }, { species: 'etincelou' }, { species: 'sphingres' }, { species: 'cristalis', weightMul: 0.5 }],
    mutationMultipliers: { ardente: 2 }, affinity: ['chaleur'],
    visual: { base: '#5a2a2a', secondary: '#ff6a2a', pattern: 'lava', glow: '#ffb07a' },
  },
  celeste: {
    id: 'celeste', name: 'Œuf céleste', rarity: 'rare', incubationMs: 5 * MINUTE,
    description: 'Il flotte à quelques centimètres du sol et suit les courants d\'air.',
    pool: [{ species: 'zephyrin' }, { species: 'lucilet', weightMul: 1.5 }, { species: 'etincelou' }, { species: 'cometuse', weightMul: 1.2 }],
    mutationMultipliers: { cosmique: 1.5, irisee: 1.3 }, affinity: ['etoilee'],
    visual: { base: '#e6f4ff', secondary: '#9cc8ff', pattern: 'clouds', glow: '#ffffff' },
  },
  fantome: {
    id: 'fantome', name: 'Œuf fantôme', rarity: 'rare', incubationMs: 5 * MINUTE,
    description: 'À moitié transparent. On jurerait l\'entendre chuchoter la nuit.',
    pool: [{ species: 'songelin', weightMul: 1.4 }, { species: 'linceulet', weightMul: 2 }, { species: 'champilou' }],
    mutationMultipliers: { spectrale: 2.5 }, affinity: ['brume'],
    visual: { base: '#d6ccff', secondary: '#8a6ff0', pattern: 'wisps', glow: '#efeaff' },
  },
  antique: {
    id: 'antique', name: 'Œuf antique', rarity: 'epique', incubationMs: 15 * MINUTE,
    description: 'Exhumé dans le désert ancien. Des glyphes tournent lentement à sa surface.',
    pool: [{ species: 'sphingres', weightMul: 1.5 }, { species: 'caillounet' }, { species: 'cristalis' }, { species: 'ambrelith', weightMul: 3 }],
    mutationMultipliers: { antique: 4 }, affinity: ['chaleur'],
    visual: { base: '#e3c78f', secondary: '#8a6a3a', pattern: 'runes', glow: '#fff0c8' },
  },
  corrompu: {
    id: 'corrompu', name: 'Œuf corrompu', rarity: 'epique', incubationMs: 15 * MINUTE,
    description: 'Une énergie instable s\'en échappe. Il est chaud et froid à la fois.',
    pool: [{ species: 'songelin', weightMul: 1.5 }, { species: 'champilou', weightMul: 1.5 }, { species: 'linceulet' }],
    mutationMultipliers: { corrompue: 5, mutante: 2.5 }, affinity: ['brume'],
    visual: { base: '#3a1f4a', secondary: '#c040ff', pattern: 'veins', glow: '#e09aff' },
  },
  prismatique: {
    id: 'prismatique', name: 'Œuf prismatique', rarity: 'legendaire', incubationMs: 30 * MINUTE,
    description: 'Sa coquille décompose la lumière. Les créatures qui en naissent sont rarement ordinaires.',
    pool: [{ species: 'tisonnet' }, { species: 'perlouille' }, { species: 'lichenou' }, { species: 'frimelot' }, { species: 'zephyrin' },
      { species: 'caillounet' }, { species: 'etincelou' }, { species: 'lucilet' }, { species: 'songelin' }, { species: 'cristalis', weightMul: 2 }],
    mutationMultipliers: { irisee: 6, cristalline: 3, doree: 2 }, affinity: ['serre', 'froid'],
    visual: { base: '#ffffff', secondary: '#ff9fe0', pattern: 'prism', glow: '#ffffff' },
  },
  cosmique: {
    id: 'cosmique', name: 'Œuf cosmique', rarity: 'mythique', incubationMs: 1 * HOUR,
    description: 'Tombé avec une météorite. Il ne peut éclore que sous un ciel étoilé.',
    pool: [{ species: 'cometuse', weightMul: 4 }, { species: 'baleinastre', weightMul: 6 }, { species: 'lucilet' }, { species: 'songelin' }],
    mutationMultipliers: { cosmique: 4 }, affinity: [], requiresAmbiance: ['etoilee'],
    visual: { base: '#1d1650', secondary: '#7a5af0', pattern: 'galaxy', glow: '#b9a8ff' },
  },
  // Œufs exclusifs à l'exploration (jamais vendus)
  abyssal: {
    id: 'abyssal', name: 'Œuf abyssal', rarity: 'rare', incubationMs: 4 * MINUTE, exploreOnly: true,
    description: 'Ramené des profondeurs. Il émet une lueur bleutée au rythme des marées.',
    pool: [{ species: 'nacrelle', weightMul: 3 }, { species: 'perlouille' }, { species: 'cristalis', weightMul: 0.6 }],
    mutationMultipliers: { cristalline: 1.5 }, affinity: ['froid'],
    visual: { base: '#2a5aa8', secondary: '#7fe0ff', pattern: 'waves', glow: '#9ff0ff' },
  },
  glacial: {
    id: 'glacial', name: 'Œuf glacial', rarity: 'peu_commun', incubationMs: 3 * MINUTE, exploreOnly: true,
    description: 'Trouvé dans une crevasse. Son givre ne fond même pas au creux de la main.',
    pool: [{ species: 'nevelin', weightMul: 3 }, { species: 'frimelot' }, { species: 'zephyrin' }],
    mutationMultipliers: { givree: 2 }, affinity: ['froid'],
    visual: { base: '#eef6ff', secondary: '#9cc8f0', pattern: 'clouds', glow: '#ffffff' },
  },
  marecage: {
    id: 'marecage', name: 'Œuf des marais', rarity: 'peu_commun', incubationMs: 3 * MINUTE, exploreOnly: true,
    description: 'Couvert de mousse et légèrement collant. Il bouillonne doucement.',
    pool: [{ species: 'vasounet', weightMul: 3 }, { species: 'champilou' }, { species: 'lichenou' }],
    mutationMultipliers: { mutante: 1.8, florale: 1.3 }, affinity: ['serre'],
    visual: { base: '#7f9a4a', secondary: '#c46fe0', pattern: 'leaves', glow: '#d8ffb0' },
  },
  crepuscule: {
    id: 'crepuscule', name: 'Œuf crépusculaire', rarity: 'rare', incubationMs: 6 * MINUTE, exploreOnly: true,
    description: 'Il absorbe la lumière autour de lui. Une lanterne minuscule semble briller à l\'intérieur.',
    pool: [{ species: 'ombrelin', weightMul: 3 }, { species: 'songelin' }, { species: 'linceulet' }],
    mutationMultipliers: { spectrale: 1.6, corrompue: 1.3 }, affinity: ['brume'],
    visual: { base: '#2e2250', secondary: '#ffc85a', pattern: 'wisps', glow: '#ffd88a' },
  },
  hybride: {
    id: 'hybride', name: 'Œuf génétique', rarity: 'epique', incubationMs: 8 * MINUTE, genetic: true,
    description: 'Né au Laboratoire de la fusion de deux créatures. Son contenu dépend de la génétique de ses parents.',
    pool: [], mutationMultipliers: {}, affinity: ['serre'],
    visual: { base: '#e8f6ff', secondary: '#7b5cff', pattern: 'helix', glow: '#c8b8ff' },
  },
  legendaire: {
    id: 'legendaire', name: 'Œuf légendaire', rarity: 'legendaire', incubationMs: 2 * HOUR,
    description: 'Couronné d\'or. Aucun gardien n\'a jamais su ce qu\'il contiendrait.',
    pool: [{ species: 'cometuse', weightMul: 4 }, { species: 'baleinastre', weightMul: 4 }, { species: 'ambrelith', weightMul: 4 }, { species: 'serapheon', weightMul: 5 }],
    mutationMultipliers: { doree: 3 }, affinity: ['etoilee', 'chaleur'],
    visual: { base: '#fff3c4', secondary: '#f0b020', pattern: 'crown', glow: '#fff6c8' },
  },
};
