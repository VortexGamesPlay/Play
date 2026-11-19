/**
 * États de combat. value : intensité (fraction). turns : durée par défaut.
 */
export type StatusId = 'embrase' | 'intoxique' | 'engourdi' | 'etourdi' | 'fragilise' | 'galvanise' | 'rempart' | 'seve' | 'allant';

export interface StatusDef {
  id: StatusId;
  name: string;
  description: string;
  kind: 'malus' | 'bonus';
  turns: number;
  value: number;
  color: string;
}

export const STATUSES: Record<StatusId, StatusDef> = {
  embrase:   { id: 'embrase',   name: 'Embrasé',   kind: 'malus', turns: 3, value: 0.06, color: '#ff7a3d', description: 'Perd 6 % de ses PV max au début de chaque tour.' },
  intoxique: { id: 'intoxique', name: 'Rongé', kind: 'malus', turns: 3, value: 0.08, color: '#9bd23d', description: 'Perd 8 % de ses PV max au début de chaque tour.' },
  engourdi:  { id: 'engourdi',  name: 'Engourdi',  kind: 'malus', turns: 2, value: 0.3,  color: '#7fdcf0', description: 'Vitesse réduite de 30 %.' },
  etourdi:   { id: 'etourdi',   name: 'Étourdi',   kind: 'malus', turns: 1, value: 1,    color: '#ffd23d', description: 'Passe son prochain tour.' },
  fragilise: { id: 'fragilise', name: 'Fragilisé', kind: 'malus', turns: 2, value: 0.25, color: '#b8a6f0', description: 'Attaque réduite de 25 %.' },
  galvanise: { id: 'galvanise', name: 'Exalté', kind: 'bonus', turns: 2, value: 0.3,  color: '#ff6fb5', description: 'Attaque augmentée de 30 %.' },
  rempart:   { id: 'rempart',   name: 'Rempart',   kind: 'bonus', turns: 2, value: 0.35, color: '#5cb8ff', description: 'Réduit les dégâts reçus.' },
  seve:      { id: 'seve',      name: 'Sève vive', kind: 'bonus', turns: 3, value: 0.08, color: '#3fcf9f', description: 'Récupère 8 % de ses PV max au début de chaque tour.' },
  allant:    { id: 'allant',    name: 'Allant',    kind: 'bonus', turns: 2, value: 0.3,  color: '#a5d8d0', description: 'Vitesse augmentée de 30 %.' },
};
