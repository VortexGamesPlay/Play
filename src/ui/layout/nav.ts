import type { IconName } from '../art/Icons';
import type { Route } from '../../store/uiStore';

export interface NavEntry {
  route: Route;
  label: string;
  icon: IconName;
  /** Phase de développement prévue si l'écran n'est pas encore jouable. */
  phase?: number;
}

export const NAV_MAIN: NavEntry[] = [
  { route: 'sanctuaire', label: 'Sanctuaire', icon: 'sanctuary' },
  { route: 'incubateur', label: 'Incubateur', icon: 'egg' },
  { route: 'collection', label: 'Créatures', icon: 'paw' },
  { route: 'bestiaire', label: 'Bestiaire', icon: 'book' },
];

export const NAV_WORLD: NavEntry[] = [
  { route: 'laboratoire', label: 'Laboratoire', icon: 'flask' },
  { route: 'exploration', label: 'Exploration', icon: 'compass' },
  { route: 'arene', label: 'Arène', icon: 'swords' },
];

export const NAV_OTHER: NavEntry[] = [
  { route: 'boutique', label: 'Boutique', icon: 'bag' },
  { route: 'inventaire', label: 'Inventaire', icon: 'backpack' },
  { route: 'communaute', label: 'Communauté', icon: 'people', phase: 6 },
  { route: 'profil', label: 'Profil', icon: 'gear' },
];

export const ALL_NAV = [...NAV_MAIN, ...NAV_WORLD, ...NAV_OTHER];
export const TITLES = Object.fromEntries(ALL_NAV.map((n) => [n.route, n.label])) as Record<Route, string>;
