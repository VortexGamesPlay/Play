import type { Reward } from '@core/content';

export interface EnemyDef {
  species: string;
  level: number;
  mutations?: string[];
  hpMul?: number;
  boss?: boolean;
}

export interface LeagueFight {
  id: string;
  rival: string;
  title: string;
  enemies: EnemyDef[];
  champion?: boolean;
  firstReward: Reward;
  repeatReward: Reward;
}

export interface LeagueDef {
  id: string;
  name: string;
  tier: number;
  description: string;
  color: string;
  /** Ligue précédente à terminer pour y accéder. */
  requires: string | null;
  fights: LeagueFight[];
}

export interface BossDef {
  id: string;
  biomeId: string;
  name: string;
  title: string;
  description: string;
  /** Expéditions à réaliser dans le biome pour le débusquer. */
  unlockExpeditions: number;
  enemies: EnemyDef[];
  firstReward: Reward;
  dailyReward: Reward;
}

const fight = (id: string, rival: string, title: string, enemies: EnemyDef[], tier: number, champion = false): LeagueFight => ({
  id, rival, title, enemies, champion,
  firstReward: champion ? { coins: 400 * tier, crystals: 15 * tier, essence: 20 * tier } : { coins: 120 * tier, crystals: 2 * tier },
  repeatReward: { coins: Math.round((champion ? 120 : 40) * tier) },
});
const e = (species: string, level: number, mutations?: string[]): EnemyDef => ({ species, level, mutations });

/** Ligue des Coquilles : quatre arènes de difficulté croissante, chacune gardée par un champion. */
export const LEAGUES: LeagueDef[] = [
  {
    id: 'bourgeons', name: 'Arène des Bourgeons', tier: 1, color: '#7fd36b', requires: null,
    description: 'Une clairière entourée de pierres levées où les jeunes gardiens font leurs premières armes.',
    fights: [
      fight('b1', 'Capucine', 'Apprentie botaniste', [e('lichenou', 3)], 1),
      fight('b2', 'Anatole', 'Petit pêcheur', [e('perlouille', 4), e('zephyrin', 3)], 1),
      fight('b3', 'Sidonie', 'Collectionneuse de cailloux', [e('caillounet', 5), e('frimelot', 5)], 1),
      fight('b4', 'Firmin', 'Rêveur des prés', [e('lucilet', 6), e('tisonnet', 6), e('zephyrin', 6)], 1),
      fight('b5', 'Bérénice', 'Championne des Bourgeons', [e('bosquelin', 10), e('tisonnet', 9), e('perlouille', 9)], 1, true),
    ],
  },
  {
    id: 'marees', name: 'Arène des Marées', tier: 2, color: '#3fa7f5', requires: 'bourgeons',
    description: 'Un amphithéâtre de nacre au bord de l\'océan. Les vagues y applaudissent les beaux combats.',
    fights: [
      fight('m1', 'Gustave', 'Plongeur', [e('clapotine', 12), e('perlouille', 11)], 2),
      fight('m2', 'Philomène', 'Gardienne des glaces', [e('banquisard', 13), e('frimelot', 12), e('nevelin', 12)], 2),
      fight('m3', 'Ambroise', 'Marin d\'orage', [e('etincelou', 14), e('clapotine', 14), e('aerolis', 14)], 2),
      fight('m4', 'Clémence', 'Surfeuse des vagues', [e('nacrelle', 16), e('clapotine', 16), e('cristalis', 15)], 2),
      fight('m5', 'Capitaine Ysaline', 'Championne des Marées', [e('abyssoria', 20), e('banquisard', 19), e('orageline', 18)], 2, true),
    ],
  },
  {
    id: 'braises', name: 'Arène des Braises', tier: 3, color: '#ff7a3d', requires: 'marees',
    description: 'Creusée dans un ancien cratère, ses gradins de basalte restent tièdes la nuit.',
    fights: [
      fight('f1', 'Barnabé', 'Forgeron', [e('fournaillon', 22), e('rocanthe', 22)], 3),
      fight('f2', 'Ottilie', 'Exploratrice du désert', [e('sphingres', 24), e('sarcophor', 23), e('caillounet', 24)], 3),
      fight('f3', 'Théodore', 'Alchimiste', [e('brumavap', 25), e('marecroc', 25), e('champilou', 25)], 3),
      fight('f4', 'Adélaïde', 'Gardienne des cendres', [e('basaltor', 27), e('aurgile', 26), e('fournaillon', 26)], 3),
      fight('f5', 'Maître Ignace', 'Champion des Braises', [e('basaltor', 31), e('sarcophor', 30), e('orageline', 30)], 3, true),
    ],
  },
  {
    id: 'astres', name: 'Arène des Astres', tier: 4, color: '#7a5af0', requires: 'braises',
    description: 'Une arène suspendue entre deux nébuleuses. On dit que les étoiles y viennent regarder.',
    fights: [
      fight('a1', 'Évariste', 'Astronome', [e('cometuse', 33), e('aubelys', 33)], 4),
      fight('a2', 'Hortense', 'Veilleuse des songes', [e('revombre', 35), e('voilunaire', 35), e('songelin', 35)], 4),
      fight('a3', 'Léopold', 'Archiviste', [e('ambrelith', 37), e('cristalis', 36), e('aurgile', 36)], 4),
      fight('a4', 'Mahaut', 'Voyageuse céleste', [e('baleinastre', 39), e('cometuse', 38), e('frimelune', 38)], 4),
      fight('a5', 'Dame Astrée', 'Championne des Astres', [e('serapheon', 45), e('baleinastre', 43), e('revombre', 43)], 4, true),
    ],
  },
];

/** Gardiens anciens : un boss par biome, à débusquer par l'exploration. */
export const BOSSES: BossDef[] = [
  { id: 'boss_foret', biomeId: 'foret', name: 'Vieux Bosquelin', title: 'Gardien de la Forêt enchantée', unlockExpeditions: 3,
    description: 'Un Bosquelin millénaire dont la mousse cache des clairières entières.',
    enemies: [{ species: 'bosquelin', level: 14, hpMul: 4, boss: true }, e('lichenou', 10), e('lichenou', 10)],
    firstReward: { crystals: 25, essence: 30, items: { bois_lune: 6 } }, dailyReward: { coins: 300, items: { bois_lune: 3 } } },
  { id: 'boss_abysses', biomeId: 'abysses', name: 'Abyssoria des grands fonds', title: 'Gardienne du Royaume sous-marin', unlockExpeditions: 3,
    description: 'Sa lanterne guide les égarés… ou les attire vers le fond.',
    enemies: [{ species: 'abyssoria', level: 18, hpMul: 4, boss: true }, e('nacrelle', 14), e('clapotine', 14)],
    firstReward: { crystals: 30, essence: 35, items: { nacre: 6 } }, dailyReward: { coins: 380, items: { nacre: 3 } } },
  { id: 'boss_montagnes', biomeId: 'montagnes', name: 'Banquisard des cimes', title: 'Gardien des Montagnes gelées', unlockExpeditions: 3,
    description: 'Quand il rugit, les avalanches se figent pour l\'écouter.',
    enemies: [{ species: 'banquisard', level: 22, hpMul: 4, boss: true }, e('nevelin', 18), e('frimelune', 18)],
    firstReward: { crystals: 30, essence: 40, items: { givre_eternel: 6 } }, dailyReward: { coins: 450, items: { givre_eternel: 3 } } },
  { id: 'boss_volcan', biomeId: 'volcan', name: 'Basaltor primitif', title: 'Gardien du Volcan ancestral', unlockExpeditions: 3,
    description: 'Ses sabots ont façonné les coulées de lave du volcan.',
    enemies: [{ species: 'basaltor', level: 26, hpMul: 4, boss: true }, e('fournaillon', 22), e('tisonnet', 22)],
    firstReward: { crystals: 35, essence: 45, items: { basalte: 6 } }, dailyReward: { coins: 520, items: { basalte: 3 } } },
  { id: 'boss_marais', biomeId: 'marais', name: 'Marécroc souverain', title: 'Gardien du Marais toxique', unlockExpeditions: 3,
    description: 'Le roi des marais ne quitte jamais son trône de champignons.',
    enemies: [{ species: 'marecroc', level: 29, hpMul: 4, boss: true }, e('vasounet', 25), e('champilou', 25)],
    firstReward: { crystals: 35, essence: 50, items: { mousse_marais: 6 } }, dailyReward: { coins: 580, items: { mousse_marais: 3 } } },
  { id: 'boss_desert', biomeId: 'desert', name: 'Grand Sarcophor', title: 'Gardien du Désert ancien', unlockExpeditions: 3,
    description: 'Il pose une seule énigme. Personne n\'a jamais donné la bonne réponse.',
    enemies: [{ species: 'sarcophor', level: 33, hpMul: 4, boss: true }, e('sphingres', 29), e('aurgile', 29)],
    firstReward: { crystals: 40, essence: 55, items: { sable_dore: 6 } }, dailyReward: { coins: 650, items: { sable_dore: 3 } } },
  { id: 'boss_ombres', biomeId: 'ombres', name: 'Rêvombre éternel', title: 'Gardien de la Vallée des ombres', unlockExpeditions: 3,
    description: 'Il a avalé tous les cauchemars de la vallée.',
    enemies: [{ species: 'revombre', level: 37, hpMul: 4, boss: true }, e('ombrelin', 33), e('voilunaire', 33)],
    firstReward: { crystals: 45, essence: 60, items: { eclat_ombre: 6 } }, dailyReward: { coins: 720, items: { eclat_ombre: 3 } } },
  { id: 'boss_cosmos', biomeId: 'cosmos', name: 'Baleinastre originelle', title: 'Gardienne de la Dimension cosmique', unlockExpeditions: 3,
    description: 'La première baleine des étoiles. Une galaxie entière tourne dans son dos.',
    enemies: [{ species: 'baleinastre', level: 42, hpMul: 4, boss: true }, e('cometuse', 38), e('cometuse', 38)],
    firstReward: { crystals: 60, essence: 80, items: { poussiere_etoile: 6 } }, dailyReward: { coins: 850, items: { poussiere_etoile: 3 } } },
];

/** Tour des épreuves : étages générés à l'infini, de plus en plus difficiles. */
export const TOWER = {
  baseLevel: 4,
  levelPerFloor: 2,
  /** Récompense de chaque nouvel étage atteint. */
  floorReward: (floor: number): Reward => ({ coins: 60 + floor * 15, ...(floor % 5 === 0 ? { crystals: 5 + floor / 5 } : {}) }),
};
