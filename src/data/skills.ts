import type { ElementId } from '@core/types';
import type { StatusId } from './statuses';

export type SkillTarget = 'enemy' | 'allEnemies' | 'self' | 'ally' | 'allAllies';

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  /** null = sans élément (aucun multiplicateur). */
  element: ElementId | null;
  /** Puissance (0 = compétence sans dégâts). */
  power: number;
  energy: number;
  target: SkillTarget;
  /** Niveau d'apprentissage. */
  level: number;
  status?: { id: StatusId; chance: number; value?: number; turns?: number };
  /** Soin en fraction des PV max de la cible. */
  heal?: number;
  /** Retire les malus de la cible. */
  cleanse?: boolean;
  critBonus?: number;
}

const s = (x: SkillDef) => x;

/** Compétences communes à toutes les créatures. */
export const COMMON_SKILLS: SkillDef[] = [
  s({ id: 'elan', name: 'Coup d\'élan', element: null, power: 30, energy: 0, target: 'enemy', level: 1, description: 'Une charge simple qui ne coûte aucune énergie.' }),
  s({ id: 'garde', name: 'Posture de garde', element: null, power: 0, energy: 1, target: 'self', level: 5, status: { id: 'rempart', chance: 1, value: 0.35 }, description: 'Se protège : dégâts reçus réduits pendant 2 tours.' }),
];

/** Trois compétences par élément, apprises aux niveaux 1, 10 et 20. */
export const ELEMENT_SKILLS: Record<ElementId, SkillDef[]> = {
  feu: [
    s({ id: 'feu1', name: 'Braise vive', element: 'feu', power: 45, energy: 1, target: 'enemy', level: 1, status: { id: 'embrase', chance: 0.3 }, description: 'Projette une braise ; peut embraser la cible.' }),
    s({ id: 'feu2', name: 'Haleine de forge', element: 'feu', power: 35, energy: 2, target: 'allEnemies', level: 10, description: 'Un souffle brûlant qui touche tous les adversaires.' }),
    s({ id: 'feu3', name: 'Cœur de magma', element: 'feu', power: 90, energy: 4, target: 'enemy', level: 20, status: { id: 'embrase', chance: 0.5 }, description: 'Libère la chaleur du noyau terrestre.' }),
  ],
  eau: [
    s({ id: 'eau1', name: 'Jet de perles', element: 'eau', power: 45, energy: 1, target: 'enemy', level: 1, description: 'Une salve de gouttes dures comme des perles.' }),
    s({ id: 'eau2', name: 'Onde apaisante', element: 'eau', power: 0, energy: 2, target: 'allAllies', level: 10, heal: 0.2, description: 'Soigne toute l\'équipe de 20 % de ses PV.' }),
    s({ id: 'eau3', name: 'Lame des profondeurs', element: 'eau', power: 85, energy: 4, target: 'enemy', level: 20, description: 'Une vague surgie des abysses.' }),
  ],
  nature: [
    s({ id: 'nat1', name: 'Fouet de ronces', element: 'nature', power: 45, energy: 1, target: 'enemy', level: 1, description: 'Des ronces fouettent la cible.' }),
    s({ id: 'nat2', name: 'Sève guérisseuse', element: 'nature', power: 0, energy: 2, target: 'ally', level: 10, heal: 0.35, description: 'Soigne un allié de 35 % de ses PV.' }),
    s({ id: 'nat3', name: 'Tempête de pollen', element: 'nature', power: 50, energy: 3, target: 'allEnemies', level: 20, status: { id: 'fragilise', chance: 0.4 }, description: 'Un nuage de pollen qui affaiblit les adversaires.' }),
  ],
  glace: [
    s({ id: 'gla1', name: 'Éclat de givre', element: 'glace', power: 45, energy: 1, target: 'enemy', level: 1, status: { id: 'engourdi', chance: 0.25 }, description: 'Un éclat glacé qui peut engourdir.' }),
    s({ id: 'gla2', name: 'Mur de frimas', element: 'glace', power: 0, energy: 2, target: 'allAllies', level: 10, status: { id: 'rempart', chance: 1, value: 0.25 }, description: 'Protège toute l\'équipe pendant 2 tours.' }),
    s({ id: 'gla3', name: 'Rafale polaire', element: 'glace', power: 60, energy: 4, target: 'allEnemies', level: 20, status: { id: 'engourdi', chance: 0.3 }, description: 'Un vent glacial sur tous les adversaires.' }),
  ],
  air: [
    s({ id: 'air1', name: 'Bourrasque vive', element: 'air', power: 40, energy: 1, target: 'enemy', level: 1, critBonus: 0.08, description: 'Rapide et précise : coups critiques plus fréquents.' }),
    s({ id: 'air2', name: 'Vent porteur', element: 'air', power: 0, energy: 2, target: 'allAllies', level: 10, status: { id: 'allant', chance: 1 }, description: 'Accélère toute l\'équipe pendant 2 tours.' }),
    s({ id: 'air3', name: 'Tourbillon céleste', element: 'air', power: 55, energy: 3, target: 'allEnemies', level: 20, description: 'Un tourbillon qui balaie tous les adversaires.' }),
  ],
  terre: [
    s({ id: 'ter1', name: 'Jet de rocaille', element: 'terre', power: 50, energy: 1, target: 'enemy', level: 1, description: 'Des cailloux lancés avec force.' }),
    s({ id: 'ter2', name: 'Carapace de grès', element: 'terre', power: 0, energy: 1, target: 'self', level: 10, status: { id: 'rempart', chance: 1, value: 0.5 }, description: 'Une solide protection pendant 2 tours.' }),
    s({ id: 'ter3', name: 'Fracture du sol', element: 'terre', power: 65, energy: 4, target: 'allEnemies', level: 20, description: 'Le sol se fend sous tous les adversaires.' }),
  ],
  foudre: [
    s({ id: 'fou1', name: 'Arc électrique', element: 'foudre', power: 45, energy: 1, target: 'enemy', level: 1, status: { id: 'etourdi', chance: 0.1 }, description: 'Un arc qui peut étourdir la cible.' }),
    s({ id: 'fou2', name: 'Surtension', element: 'foudre', power: 0, energy: 1, target: 'self', level: 10, status: { id: 'galvanise', chance: 1 }, description: 'Augmente son attaque pendant 2 tours.' }),
    s({ id: 'fou3', name: 'Colonne d\'orage', element: 'foudre', power: 95, energy: 4, target: 'enemy', level: 20, status: { id: 'etourdi', chance: 0.25 }, description: 'Un pilier de foudre s\'abat sur la cible.' }),
  ],
  lumiere: [
    s({ id: 'lum1', name: 'Trait de lumière', element: 'lumiere', power: 45, energy: 1, target: 'enemy', level: 1, description: 'Un rayon pur et éblouissant.' }),
    s({ id: 'lum2', name: 'Aube bienfaisante', element: 'lumiere', power: 0, energy: 3, target: 'allAllies', level: 10, heal: 0.25, cleanse: true, description: 'Soigne l\'équipe et retire ses malus.' }),
    s({ id: 'lum3', name: 'Éclat d\'aurore', element: 'lumiere', power: 80, energy: 4, target: 'enemy', level: 20, description: 'Toute la lumière du matin concentrée.' }),
  ],
  ombre: [
    s({ id: 'omb1', name: 'Griffe nocturne', element: 'ombre', power: 50, energy: 1, target: 'enemy', level: 1, critBonus: 0.06, description: 'Une griffe surgie de l\'obscurité.' }),
    s({ id: 'omb2', name: 'Voile obscur', element: 'ombre', power: 0, energy: 1, target: 'self', level: 10, status: { id: 'rempart', chance: 1, value: 0.4 }, description: 'Se fond dans l\'ombre pendant 2 tours.' }),
    s({ id: 'omb3', name: 'Songe noir', element: 'ombre', power: 70, energy: 3, target: 'enemy', level: 20, status: { id: 'etourdi', chance: 0.2 }, description: 'Plonge la cible dans un rêve inquiétant.' }),
  ],
  vapeur: [
    s({ id: 'vap1', name: 'Jet bouillant', element: 'vapeur', power: 45, energy: 1, target: 'enemy', level: 1, status: { id: 'embrase', chance: 0.2 }, description: 'Un jet d\'eau brûlante.' }),
    s({ id: 'vap2', name: 'Brume tiède', element: 'vapeur', power: 0, energy: 2, target: 'allAllies', level: 10, status: { id: 'seve', chance: 1 }, description: 'L\'équipe récupère des PV pendant 3 tours.' }),
    s({ id: 'vap3', name: 'Colonne de vapeur', element: 'vapeur', power: 85, energy: 4, target: 'enemy', level: 20, description: 'Une colonne sifflante jaillit sous la cible.' }),
  ],
  cosmique: [
    s({ id: 'cos1', name: 'Poussière d\'astre', element: 'cosmique', power: 50, energy: 1, target: 'enemy', level: 1, description: 'Une pluie de poussière stellaire.' }),
    s({ id: 'cos2', name: 'Poids des astres', element: 'cosmique', power: 0, energy: 2, target: 'allEnemies', level: 10, status: { id: 'engourdi', chance: 0.5 }, description: 'Alourdit les adversaires.' }),
    s({ id: 'cos3', name: 'Naissance d\'étoile', element: 'cosmique', power: 75, energy: 4, target: 'allEnemies', level: 20, description: 'Une étoile naît au milieu du combat.' }),
  ],
  cristal: [
    s({ id: 'cri1', name: 'Facette tranchante', element: 'cristal', power: 45, energy: 1, target: 'enemy', level: 1, description: 'Un éclat de cristal affûté.' }),
    s({ id: 'cri2', name: 'Prisme protecteur', element: 'cristal', power: 0, energy: 2, target: 'allAllies', level: 10, status: { id: 'rempart', chance: 1, value: 0.3 }, description: 'Un prisme qui protège l\'équipe.' }),
    s({ id: 'cri3', name: 'Lance de quartz', element: 'cristal', power: 90, energy: 4, target: 'enemy', level: 20, description: 'Une immense lance cristalline.' }),
  ],
  toxique: [
    s({ id: 'tox1', name: 'Crachat corrosif', element: 'toxique', power: 40, energy: 1, target: 'enemy', level: 1, status: { id: 'intoxique', chance: 0.4 }, description: 'Peut intoxiquer la cible.' }),
    s({ id: 'tox2', name: 'Nuée de moisissure', element: 'toxique', power: 0, energy: 2, target: 'allEnemies', level: 10, status: { id: 'intoxique', chance: 0.5 }, description: 'Une nuée qui intoxique les adversaires.' }),
    s({ id: 'tox3', name: 'Marée de vase', element: 'toxique', power: 70, energy: 4, target: 'allEnemies', level: 20, status: { id: 'intoxique', chance: 0.3 }, description: 'Une vague de vase sur tous les adversaires.' }),
  ],
  spectre: [
    s({ id: 'spe1', name: 'Frisson glacé', element: 'spectre', power: 45, energy: 1, target: 'enemy', level: 1, status: { id: 'fragilise', chance: 0.25 }, description: 'Un frisson qui peut affaiblir.' }),
    s({ id: 'spe2', name: 'Forme diaphane', element: 'spectre', power: 0, energy: 1, target: 'self', level: 10, status: { id: 'rempart', chance: 1, value: 0.6, turns: 1 }, description: 'Devient presque intangible pendant 1 tour.' }),
    s({ id: 'spe3', name: 'Appel de l\'au-delà', element: 'spectre', power: 85, energy: 4, target: 'enemy', level: 20, status: { id: 'etourdi', chance: 0.2 }, description: 'Une voix venue d\'ailleurs glace la cible.' }),
  ],
  primordial: [
    s({ id: 'pri1', name: 'Écho des âges', element: 'primordial', power: 50, energy: 1, target: 'enemy', level: 1, description: 'Un grondement venu du fond des temps.' }),
    s({ id: 'pri2', name: 'Mémoire de pierre', element: 'primordial', power: 0, energy: 2, target: 'self', level: 10, status: { id: 'seve', chance: 1 }, description: 'Récupère des PV pendant 3 tours.' }),
    s({ id: 'pri3', name: 'Âge oublié', element: 'primordial', power: 100, energy: 5, target: 'enemy', level: 20, description: 'La force d\'une ère disparue.' }),
  ],
};

export const SKILLS: Record<string, SkillDef> = Object.fromEntries(
  [...COMMON_SKILLS, ...Object.values(ELEMENT_SKILLS).flat()].map((k) => [k.id, k]),
);
