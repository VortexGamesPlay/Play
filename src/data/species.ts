import type { ArtSpec, SpeciesDef } from '@core/content';

/**
 * Bestiaire initial : 30 espèces originales EGGVERSE.
 * Chaque illustration est générée de façon procédurale à partir de `art`
 * (cf. ui/art/CreatureArt.tsx) : ajouter une espèce ne demande aucun asset graphique.
 */

const art = (a: Partial<ArtSpec> & Pick<ArtSpec, 'body' | 'palette'>): ArtSpec => ({
  ears: 'none', crest: 'none', tail: 'none', wings: 'none', eyes: 'round', mouth: 'smile',
  pattern: 'belly', feet: true, scale: 0.85, ...a,
});

export const SPECIES_LIST: SpeciesDef[] = [
  // ───────────── Feu : lignée Pyroli ─────────────
  {
    id: 'pyroli', dex: 1, name: 'Pyroli', family: 'Dracônet', element: 'feu', rarity: 'commun', stage: 'bebe',
    description: 'Un petit dragon de basalte, joueur et têtu. Une braise vivante flotte au-dessus de sa tête et grossit quand il est content.',
    baseStats: { hp: 44, atk: 52, def: 40, spd: 55 }, sizeCm: 32, weightKg: 4.1, favoriteFood: ['poisson', 'fruit'],
    evolutions: [{ to: 'pyrodrake', conditions: [{ type: 'level', value: 16 }] }],
    obtainableBy: ['egg'],
    art: art({ body: 'pear', ears: 'horn', crest: 'ember', tail: 'spike', wings: 'small', eyes: 'sparkle', mouth: 'fang', pattern: 'cracks', scale: 0.8, nativeEgg: 'volcanique',
      palette: { primary: '#d9505a', secondary: '#5e2a3e', accent: '#ffc24a', belly: '#f7a98a', eye: '#2a1420' } }),
  },
  {
    id: 'pyrodrake', dex: 2, name: 'Pyrodrake', family: 'Dracônet', element: 'feu', rarity: 'rare', stage: 'juvenile',
    description: 'Ses ailes ont poussé et il plane au-dessus des coulées de lave. Très protecteur envers les plus petits.',
    baseStats: { hp: 62, atk: 74, def: 56, spd: 70 }, sizeCm: 88, weightKg: 21, favoriteFood: ['poisson'],
    evolutions: [{ to: 'infernyx', conditions: [{ type: 'level', value: 36 }] }],
    obtainableBy: ['evolution'],
    art: art({ body: 'pear', ears: 'horn', crest: 'ember', tail: 'spike', wings: 'bat', eyes: 'fierce', mouth: 'fang', pattern: 'cracks', scale: 0.95,
      palette: { primary: '#c2414f', secondary: '#4a2236', accent: '#ffb23d', belly: '#e88f7a', eye: '#2a1018' } }),
  },
  {
    id: 'infernyx', dex: 3, name: 'Infernyx', family: 'Dracônet', element: 'feu', rarity: 'epique', stage: 'adulte',
    description: 'Sa peau est devenue roche noire, veinée de magma. On raconte qu\'un battement de ses ailes ranime les volcans endormis.',
    baseStats: { hp: 82, atk: 104, def: 74, spd: 88 }, sizeCm: 210, weightKg: 140, favoriteFood: ['poisson'],
    evolutions: [], obtainableBy: ['evolution'],
    art: art({ body: 'tall', ears: 'horn', crest: 'ember', tail: 'spike', wings: 'bat', eyes: 'gem', mouth: 'fang', pattern: 'cracks', scale: 1,
      palette: { primary: '#3a2230', secondary: '#1e1220', accent: '#ff8a2e', belly: '#7a3a3a', eye: '#ffb23d' }, aura: '#ff7a3d' }),
  },
  // ───────────── Eau : lignée Aquabulle ─────────────
  {
    id: 'aquabulle', dex: 4, name: 'Aquabulle', family: 'Bullon', element: 'eau', rarity: 'commun', stage: 'bebe',
    description: 'Une goutte vivante qui souffle des bulles pour communiquer. Chaque bulle contient un petit son différent.',
    baseStats: { hp: 55, atk: 40, def: 48, spd: 45 }, sizeCm: 26, weightKg: 3.2, favoriteFood: ['poisson', 'fruit'],
    evolutions: [{ to: 'marebulle', conditions: [{ type: 'level', value: 16 }] }],
    obtainableBy: ['egg'],
    art: art({ body: 'drop', ears: 'fin', crest: 'bubble', tail: 'wisp', eyes: 'round', mouth: 'o', pattern: 'spots', scale: 0.8,
      palette: { primary: '#5fd8c8', secondary: '#2a9a9e', accent: '#e0fff8', belly: '#c8f7ee', eye: '#12343a' } }),
  },
  {
    id: 'marebulle', dex: 5, name: 'Marébulle', family: 'Bullon', element: 'eau', rarity: 'rare', stage: 'juvenile',
    description: 'Elle surfe sur les vagues qu\'elle crée elle-même. Les marins la considèrent comme un porte-bonheur.',
    baseStats: { hp: 76, atk: 58, def: 66, spd: 62 }, sizeCm: 72, weightKg: 18, favoriteFood: ['poisson'],
    evolutions: [{ to: 'abyssoria', conditions: [{ type: 'level', value: 36 }] }],
    obtainableBy: ['evolution'],
    art: art({ body: 'round', ears: 'fin', crest: 'bubble', tail: 'fish', wings: 'fin', eyes: 'sparkle', mouth: 'smile', pattern: 'spots', scale: 0.95,
      palette: { primary: '#36b8b0', secondary: '#1d6f7e', accent: '#c8fff4', belly: '#bdf0e6', eye: '#0f2a30' } }),
  },
  {
    id: 'abyssoria', dex: 6, name: 'Abyssoria', family: 'Bullon', element: 'eau', rarity: 'epique', stage: 'adulte',
    description: 'Gardienne des fosses abyssales. Les lumières de ses nageoires guident les créatures perdues vers la surface.',
    baseStats: { hp: 104, atk: 78, def: 90, spd: 70 }, sizeCm: 260, weightKg: 190, favoriteFood: ['poisson'],
    evolutions: [], obtainableBy: ['evolution'],
    art: art({ body: 'serpent', ears: 'fin', crest: 'lure', tail: 'fish', wings: 'fin', eyes: 'gem', mouth: 'tiny', pattern: 'scales', feet: false, scale: 1,
      palette: { primary: '#2456b8', secondary: '#13265e', accent: '#5ff0e6', belly: '#9fd8ff', eye: '#5ff0e6' }, aura: '#3fa7f5' }),
  },
  // ───────────── Nature : Mousselin ─────────────
  {
    id: 'mousselin', dex: 7, name: 'Mousselin', family: 'Gardien sylvestre', element: 'nature', rarity: 'commun', stage: 'bebe',
    description: 'Couvert d\'une mousse toute douce, il veille sur les jeunes pousses. Il fait la sieste en photosynthèse.',
    baseStats: { hp: 58, atk: 42, def: 55, spd: 35 }, sizeCm: 30, weightKg: 5, favoriteFood: ['graine', 'fruit'],
    evolutions: [{ to: 'sylvegard', conditions: [{ type: 'level', value: 18 }] }],
    obtainableBy: ['egg'],
    art: art({ body: 'blob', ears: 'leaf', crest: 'sprout', tail: 'leaf', eyes: 'sleepy', mouth: 'smile', pattern: 'spots', scale: 0.8,
      palette: { primary: '#7fd36b', secondary: '#4a9e4a', accent: '#ffb3d1', belly: '#e4f7c8', eye: '#22351c' } }),
  },
  {
    id: 'sylvegard', dex: 8, name: 'Sylvégard', family: 'Gardien sylvestre', element: 'nature', rarity: 'rare', stage: 'adulte',
    description: 'Un gardien patient dont le dos abrite un petit jardin. Les oiseaux y font leur nid sans crainte.',
    baseStats: { hp: 92, atk: 64, def: 88, spd: 42 }, sizeCm: 140, weightKg: 85, favoriteFood: ['graine'],
    evolutions: [], obtainableBy: ['evolution'],
    art: art({ body: 'round', ears: 'leaf', crest: 'crown', tail: 'leaf', eyes: 'round', mouth: 'smile', pattern: 'stripes', scale: 1,
      palette: { primary: '#4ead5b', secondary: '#2f6e3a', accent: '#ffd66b', belly: '#cfeab0', eye: '#1b2a16' }, aura: '#4cc46a' }),
  },
  // ───────────── Glace ─────────────
  {
    id: 'givrelot', dex: 9, name: 'Givrelot', family: 'Flocon', element: 'glace', rarity: 'commun', stage: 'bebe',
    description: 'Il dessine des flocons sur les vitres avec le bout de ses oreilles. Déteste les soupes chaudes.',
    baseStats: { hp: 48, atk: 46, def: 50, spd: 50 }, sizeCm: 28, weightKg: 3.6, favoriteFood: ['mineral', 'fruit'],
    evolutions: [{ to: 'blizzaron', conditions: [{ type: 'level', value: 18 }] }],
    obtainableBy: ['egg'],
    art: art({ body: 'round', ears: 'bunny', crest: 'none', tail: 'fluffy', eyes: 'round', mouth: 'cat', pattern: 'belly', scale: 0.8,
      palette: { primary: '#d8f4ff', secondary: '#8fd3f0', accent: '#5fb8e6', belly: '#ffffff', eye: '#1f3550' } }),
  },
  {
    id: 'blizzaron', dex: 10, name: 'Blizzaron', family: 'Flocon', element: 'glace', rarity: 'rare', stage: 'adulte',
    description: 'Quand il rugit, la neige se met à tomber à des kilomètres. Sa fourrure ne fond jamais.',
    baseStats: { hp: 80, atk: 76, def: 78, spd: 60 }, sizeCm: 150, weightKg: 120, favoriteFood: ['mineral'],
    evolutions: [], obtainableBy: ['evolution'],
    art: art({ body: 'blob', ears: 'crystal', crest: 'spikes', tail: 'fluffy', eyes: 'fierce', mouth: 'fang', pattern: 'stripes', scale: 1,
      palette: { primary: '#bfe9fb', secondary: '#5fa9d6', accent: '#2f6fb0', belly: '#f2fbff', eye: '#103050' }, aura: '#7fdcf0' }),
  },
  // ───────────── Air ─────────────
  {
    id: 'zephyrin', dex: 11, name: 'Zéphyrin', family: 'Plumelet', element: 'air', rarity: 'commun', stage: 'bebe',
    description: 'Si léger qu\'il doit s\'accrocher aux brindilles les jours de vent. Il chante pour appeler la brise.',
    baseStats: { hp: 40, atk: 44, def: 38, spd: 72 }, sizeCm: 22, weightKg: 0.8, favoriteFood: ['graine', 'nectar'],
    evolutions: [{ to: 'aerolis', conditions: [{ type: 'level', value: 18 }] }],
    obtainableBy: ['egg'],
    art: art({ nativeEgg: 'celeste', body: 'round', ears: 'feather', crest: 'none', tail: 'curl', wings: 'feather', eyes: 'sparkle', mouth: 'tiny', pattern: 'belly', scale: 0.75,
      palette: { primary: '#bff0e4', secondary: '#7cc9c0', accent: '#ffffff', belly: '#f4fffb', eye: '#1e3a3a' } }),
  },
  {
    id: 'aerolis', dex: 12, name: 'Aérolis', family: 'Plumelet', element: 'air', rarity: 'rare', stage: 'adulte',
    description: 'Elle dort en plein ciel, portée par les courants. Ses plumes laissent des traînées de vent visibles.',
    baseStats: { hp: 62, atk: 66, def: 54, spd: 102 }, sizeCm: 110, weightKg: 14, favoriteFood: ['nectar'],
    evolutions: [], obtainableBy: ['evolution'],
    art: art({ body: 'tall', ears: 'feather', crest: 'star', tail: 'curl', wings: 'feather', eyes: 'sparkle', mouth: 'tiny', pattern: 'stripes', scale: 1,
      palette: { primary: '#8fe0d0', secondary: '#3f9a9a', accent: '#f2fffb', belly: '#e6fff8', eye: '#123232' }, aura: '#a5d8d0' }),
  },
  // ───────────── Terre ─────────────
  {
    id: 'galetou', dex: 13, name: 'Galetou', family: 'Caillou', element: 'terre', rarity: 'commun', stage: 'bebe',
    description: 'Il ressemble à un galet jusqu\'à ce qu\'il éternue. Collectionne les cailloux brillants.',
    baseStats: { hp: 56, atk: 50, def: 66, spd: 25 }, sizeCm: 24, weightKg: 12, favoriteFood: ['mineral'],
    evolutions: [{ to: 'rocanthe', conditions: [{ type: 'level', value: 18 }] }],
    obtainableBy: ['egg'],
    art: art({ nativeEgg: 'antique', body: 'blob', ears: 'round', crest: 'gem', tail: 'none', eyes: 'sleepy', mouth: 'smile', pattern: 'spots', scale: 0.8,
      palette: { primary: '#c9a27a', secondary: '#8a6a4a', accent: '#7fd0e0', belly: '#ecd8bd', eye: '#2a1d12' } }),
  },
  {
    id: 'rocanthe', dex: 14, name: 'Rocanthe', family: 'Caillou', element: 'terre', rarity: 'rare', stage: 'adulte',
    description: 'Les cristaux qui poussent sur son dos chantent quand la pluie les touche.',
    baseStats: { hp: 84, atk: 78, def: 104, spd: 32 }, sizeCm: 120, weightKg: 260, favoriteFood: ['mineral'],
    evolutions: [], obtainableBy: ['evolution'],
    art: art({ body: 'blob', ears: 'horn', crest: 'gem', tail: 'spike', eyes: 'round', mouth: 'fang', pattern: 'spots', scale: 1,
      palette: { primary: '#a8825a', secondary: '#5e4630', accent: '#7ff0e0', belly: '#d9c2a0', eye: '#1c130a' }, aura: '#c08a52' }),
  },
  // ───────────── Foudre ─────────────
  {
    id: 'etincelou', dex: 15, name: 'Étincelou', family: 'Phalène d\'orage', element: 'foudre', rarity: 'peu_commun', stage: 'bebe',
    description: 'Une petite phalène d\'orage. Ses antennes plumeuses captent l\'électricité de l\'air et ses ailes s\'illuminent à chaque éclair.',
    baseStats: { hp: 42, atk: 58, def: 36, spd: 76 }, sizeCm: 27, weightKg: 2.9, favoriteFood: ['fruit', 'graine'],
    evolutions: [{ to: 'fulgurion', conditions: [{ type: 'level', value: 22 }] }],
    obtainableBy: ['egg'],
    art: art({ nativeEgg: 'celeste', body: 'round', ears: 'feather', crest: 'none', tail: 'none', wings: 'fairy', eyes: 'gem', mouth: 'tiny', pattern: 'stripes', scale: 0.8,
      palette: { primary: '#6f68e6', secondary: '#3a2f9e', accent: '#7ff5ff', belly: '#b9b4ff', eye: '#7ff5ff' } }),
  },
  {
    id: 'fulgurion', dex: 16, name: 'Fulgurion', family: 'Phalène d\'orage', element: 'foudre', rarity: 'epique', stage: 'adulte',
    description: 'Il se déplace d\'un éclair à l\'autre. On ne le voit jamais arriver, seulement repartir.',
    baseStats: { hp: 66, atk: 96, def: 58, spd: 118 }, sizeCm: 130, weightKg: 48, favoriteFood: ['fruit'],
    evolutions: [], obtainableBy: ['evolution'],
    art: art({ body: 'tall', ears: 'feather', crest: 'star', tail: 'bolt', wings: 'fairy', eyes: 'gem', mouth: 'tiny', pattern: 'stripes', scale: 1,
      palette: { primary: '#4a3fc8', secondary: '#221a6e', accent: '#9ff8ff', belly: '#8f88f0', eye: '#9ff8ff' }, aura: '#7ff5ff' }),
  },
  // ───────────── Lumière ─────────────
  {
    id: 'lumiolet', dex: 17, name: 'Lumiolet', family: 'Lucioleur', element: 'lumiere', rarity: 'peu_commun', stage: 'bebe',
    description: 'Une petite boule de lumière qui illumine les chemins des voyageurs égarés. Il s\'éteint quand il boude.',
    baseStats: { hp: 50, atk: 44, def: 46, spd: 60 }, sizeCm: 20, weightKg: 0.6, favoriteFood: ['nectar', 'graine'],
    evolutions: [{ to: 'solarielle', conditions: [{ type: 'level', value: 22 }, { type: 'timeOfDay', value: 'day' }] }],
    obtainableBy: ['egg'],
    art: art({ nativeEgg: 'prismatique', body: 'round', ears: 'none', crest: 'halo', tail: 'none', wings: 'fairy', eyes: 'round', mouth: 'smile', pattern: 'none', feet: false, scale: 0.72,
      palette: { primary: '#fff3b0', secondary: '#ffd166', accent: '#ffffff', belly: '#fffbe6', eye: '#4a3a10' }, aura: '#ffe680' }),
  },
  {
    id: 'solarielle', dex: 18, name: 'Solarielle', family: 'Lucioleur', element: 'lumiere', rarity: 'epique', stage: 'adulte',
    description: 'Elle se lève avec le soleil et danse pour lui. Sa lumière soigne les blessures légères.',
    baseStats: { hp: 78, atk: 70, def: 68, spd: 88 }, sizeCm: 105, weightKg: 9, favoriteFood: ['nectar'],
    evolutions: [], obtainableBy: ['evolution'],
    art: art({ body: 'tall', ears: 'feather', crest: 'halo', tail: 'star', wings: 'fairy', eyes: 'sparkle', mouth: 'smile', pattern: 'none', feet: false, scale: 1,
      palette: { primary: '#ffe28a', secondary: '#ffad3d', accent: '#ffffff', belly: '#fff6d6', eye: '#5a3b00' }, aura: '#ffe680' }),
  },
  // ───────────── Ombre ─────────────
  {
    id: 'noctuli', dex: 19, name: 'Noctuli', family: 'Nyctombre', element: 'ombre', rarity: 'peu_commun', stage: 'bebe',
    description: 'Une petite créature mystérieuse qui ne sort qu\'à la nuit tombée. On dit qu\'elle garde les rêves des enfants.',
    baseStats: { hp: 46, atk: 54, def: 42, spd: 64 }, sizeCm: 25, weightKg: 1.9, favoriteFood: ['champi', 'nectar'],
    evolutions: [{ to: 'noctombre', conditions: [{ type: 'level', value: 22 }, { type: 'timeOfDay', value: 'night' }] }],
    obtainableBy: ['egg'],
    art: art({ nativeEgg: 'fantome', body: 'round', ears: 'feather', crest: 'moon', tail: 'none', wings: 'feather', eyes: 'gem', mouth: 'tiny', pattern: 'stars', scale: 0.78,
      palette: { primary: '#5b4a9e', secondary: '#2e2357', accent: '#c6b8ff', belly: '#8a7ac8', eye: '#ffe66b' } }),
  },
  {
    id: 'noctombre', dex: 20, name: 'Noctombre', family: 'Nyctombre', element: 'ombre', rarity: 'epique', stage: 'adulte',
    description: 'Il voyage d\'ombre en ombre. Ceux qui l\'aperçoivent font toujours le même rêve la nuit suivante.',
    baseStats: { hp: 72, atk: 92, def: 64, spd: 98 }, sizeCm: 140, weightKg: 32, favoriteFood: ['champi'],
    evolutions: [], obtainableBy: ['evolution'],
    art: art({ body: 'tall', ears: 'feather', crest: 'moon', tail: 'wisp', wings: 'feather', eyes: 'gem', mouth: 'tiny', pattern: 'stars', scale: 1,
      palette: { primary: '#3e2f7a', secondary: '#181233', accent: '#b29cff', belly: '#6a58b0', eye: '#ffe14d' }, aura: '#6b4fa8' }),
  },
  // ───────────── Spéciaux ─────────────
  {
    id: 'toxilou', dex: 21, name: 'Toxilou', family: 'Marécot', element: 'toxique', rarity: 'peu_commun', stage: 'bebe',
    description: 'Il vit dans les marais et sent étonnamment bon la menthe. Ses spores font rire ceux qui les respirent.',
    baseStats: { hp: 60, atk: 48, def: 52, spd: 40 }, sizeCm: 29, weightKg: 4.4, favoriteFood: ['champi'],
    evolutions: [], obtainableBy: ['egg'],
    art: art({ nativeEgg: 'corrompu', body: 'pear', ears: 'mushroom', crest: 'none', tail: 'none', eyes: 'sleepy', mouth: 'tiny', pattern: 'spots', scale: 0.8,
      palette: { primary: '#a6d65a', secondary: '#6b9e2e', accent: '#c46fe0', belly: '#e6f5c4', eye: '#2a3a10' } }),
  },
  {
    id: 'fantomignon', dex: 22, name: 'Fantômignon', family: 'Revenant', element: 'spectre', rarity: 'rare', stage: 'bebe',
    description: 'Un petit fantôme timide qui emprunte les chaussettes. Il les rend toujours… parfois des années plus tard.',
    baseStats: { hp: 50, atk: 62, def: 44, spd: 70 }, sizeCm: 34, weightKg: 0.1, favoriteFood: ['champi', 'nectar'],
    evolutions: [], obtainableBy: ['egg'],
    art: art({ body: 'ghost', ears: 'none', crest: 'none', tail: 'none', eyes: 'void', mouth: 'o', pattern: 'none', feet: false, scale: 0.85,
      palette: { primary: '#ece6ff', secondary: '#b8a6f0', accent: '#8a6ff0', belly: '#ffffff', eye: '#2a1f4a' }, aura: '#b8a6f0' }),
  },
  {
    id: 'scarabor', dex: 23, name: 'Scarabor', family: 'Scarabée solaire', element: 'terre', rarity: 'rare', stage: 'juvenile',
    description: 'Il roule des boules de sable doré à travers le désert ancien. Certaines contiendraient des reliques.',
    baseStats: { hp: 66, atk: 70, def: 84, spd: 46 }, sizeCm: 44, weightKg: 9.5, favoriteFood: ['mineral', 'graine'],
    evolutions: [], obtainableBy: ['egg'],
    art: art({ body: 'gem', ears: 'antenna', crest: 'none', tail: 'none', wings: 'small', eyes: 'round', mouth: 'tiny', pattern: 'runes', scale: 0.88,
      palette: { primary: '#2fa89a', secondary: '#1b5e6e', accent: '#f5c542', belly: '#bfe8d8', eye: '#10201e' } }),
  },
  {
    id: 'cristalis', dex: 24, name: 'Cristalis', family: 'Géode', element: 'cristal', rarity: 'epique', stage: 'juvenile',
    description: 'Née au cœur d\'une géode, elle réfracte la lumière en arcs-en-ciel. Son tintement apaise les orages.',
    baseStats: { hp: 64, atk: 66, def: 96, spd: 58 }, sizeCm: 50, weightKg: 22, favoriteFood: ['mineral'],
    evolutions: [], obtainableBy: ['egg'],
    art: art({ body: 'gem', ears: 'crystal', crest: 'gem', tail: 'spike', eyes: 'gem', mouth: 'tiny', pattern: 'none', scale: 0.9,
      palette: { primary: '#b6f0ff', secondary: '#7ab8f0', accent: '#ff9fe0', belly: '#e8fbff', eye: '#3a4fa0' }, aura: '#b6f0ff' }),
  },
  {
    id: 'brumavap', dex: 25, name: 'Brumavap', family: 'Vaporin', element: 'vapeur', rarity: 'epique', stage: 'juvenile',
    description: 'Né de la rencontre du feu et de l\'eau. Il siffle comme une bouilloire quand il est heureux.',
    baseStats: { hp: 70, atk: 72, def: 64, spd: 74 }, sizeCm: 46, weightKg: 1.2, favoriteFood: ['poisson', 'nectar'],
    evolutions: [], obtainableBy: ['breeding'],
    art: art({ nativeEgg: 'marin', body: 'drop', ears: 'round', crest: 'bubble', tail: 'wisp', eyes: 'sparkle', mouth: 'o', pattern: 'spots', feet: false, scale: 0.88,
      palette: { primary: '#dfe8f2', secondary: '#9fb2c8', accent: '#ff9a6a', belly: '#ffffff', eye: '#283445' }, aura: '#c9d6e3' }),
  },
  {
    id: 'astrelune', dex: 26, name: 'Astrélune', family: 'Céleste', element: 'cosmique', rarity: 'legendaire', stage: 'juvenile',
    description: 'Elle tombe parfois du ciel avec les étoiles filantes. Sa fourrure garde la carte des constellations.',
    baseStats: { hp: 82, atk: 80, def: 78, spd: 90 }, sizeCm: 64, weightKg: 7, favoriteFood: ['nectar'],
    evolutions: [], obtainableBy: ['egg'],
    art: art({ body: 'round', ears: 'bunny', crest: 'moon', tail: 'star', wings: 'fairy', eyes: 'sparkle', mouth: 'cat', pattern: 'stars', scale: 0.92,
      palette: { primary: '#6a5ae0', secondary: '#2c2470', accent: '#ffe680', belly: '#b9b0ff', eye: '#fff6c8' }, aura: '#8a7af0' }),
  },
  {
    id: 'nebulion', dex: 27, name: 'Nébulion', family: 'Céleste', element: 'cosmique', rarity: 'mythique', stage: 'adulte',
    description: 'Un lion fait de poussière d\'étoiles. Sa crinière est une nébuleuse où naissent de minuscules soleils.',
    baseStats: { hp: 98, atk: 102, def: 86, spd: 96 }, sizeCm: 190, weightKg: 70, favoriteFood: ['nectar'],
    evolutions: [], obtainableBy: ['egg'],
    art: art({ body: 'tall', ears: 'cat', crest: 'crown', tail: 'star', wings: 'feather', eyes: 'gem', mouth: 'fang', pattern: 'stars', scale: 1,
      palette: { primary: '#3a2d9e', secondary: '#e05ab8', accent: '#9ff0ff', belly: '#8f7af0', eye: '#9ff0ff' }, aura: '#e05ab8' }),
  },
  {
    id: 'fossilith', dex: 28, name: 'Fossilith', family: 'Primordial', element: 'primordial', rarity: 'antique', stage: 'ancestral',
    description: 'Endormi dans l\'ambre depuis des ères. Il se souvient d\'un monde où les créatures parlaient aux montagnes.',
    baseStats: { hp: 110, atk: 92, def: 110, spd: 40 }, sizeCm: 160, weightKg: 410, favoriteFood: ['mineral'],
    evolutions: [], obtainableBy: ['egg'],
    art: art({ body: 'blob', ears: 'horn', crest: 'spikes', tail: 'spike', eyes: 'round', mouth: 'fang', pattern: 'runes', scale: 1,
      palette: { primary: '#d4a45a', secondary: '#7a5328', accent: '#ff9a3d', belly: '#f0dcb0', eye: '#3a2408' }, aura: '#f0d9a8' }),
  },
  {
    id: 'serapheon', dex: 29, name: 'Séraphéon', family: 'Divin', element: 'lumiere', rarity: 'divin', stage: 'ancestral',
    description: 'Aucun registre ne mentionne sa naissance. Ceux qui l\'ont vu éclore parlent d\'un silence absolu, puis d\'un chant.',
    baseStats: { hp: 112, atk: 108, def: 104, spd: 106 }, sizeCm: 230, weightKg: 60, favoriteFood: ['nectar'],
    evolutions: [], obtainableBy: ['egg'],
    art: art({ body: 'tall', ears: 'feather', crest: 'halo', tail: 'star', wings: 'feather', eyes: 'gem', mouth: 'tiny', pattern: 'runes', feet: false, scale: 1,
      palette: { primary: '#fffaf0', secondary: '#ffd84a', accent: '#9fe8ff', belly: '#ffffff', eye: '#ffb300' }, aura: '#fff1a8' }),
  },
  {
    id: 'neantis', dex: 30, name: 'Néantis', family: 'Inconnu', element: 'ombre', rarity: 'secret', stage: 'ancestral',
    description: '[DONNÉES CORROMPUES] … né là où la lumière la plus pure rencontre l\'ombre la plus profonde …',
    baseStats: { hp: 108, atk: 118, def: 96, spd: 112 }, sizeCm: 0, weightKg: 0, favoriteFood: ['nectar', 'champi'],
    evolutions: [], obtainableBy: ['breeding'],
    art: art({ nativeEgg: 'corrompu', body: 'ghost', ears: 'horn', crest: 'crown', tail: 'wisp', wings: 'bat', eyes: 'void', mouth: 'tiny', pattern: 'stars', feet: false, scale: 1,
      palette: { primary: '#120c22', secondary: '#2a1f4a', accent: '#9df5ff', belly: '#3a2a6a', eye: '#9df5ff' }, aura: '#9df5ff' }),
  },
];

export const SPECIES: Record<string, SpeciesDef> = Object.fromEntries(SPECIES_LIST.map((s) => [s.id, s]));
