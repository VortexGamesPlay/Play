import type { Reward } from '@core/content';
import type { PlayerStats } from '@core/types';

export interface SeasonReward extends Reward {
  decorations?: string[];
  themes?: string[];
}

export interface SeasonDef {
  id: string;
  name: string;
  start: string; // YYYY-MM-DD inclus
  end: string;   // YYYY-MM-DD inclus
  levels: number;
  pointsPerLevel: number;
  free: Record<number, SeasonReward>;
  premium: Record<number, SeasonReward>;
}

/** Points de saison gagnés en jouant (calculés à partir des statistiques depuis le début de la saison). */
export const SEASON_POINTS: Partial<Record<keyof PlayerStats, number>> = {
  eggsHatched: 20, battlesWon: 15, bossesDefeated: 60, expeditions: 25, forages: 5,
  evolutions: 40, breedings: 30, harvests: 5, creaturesFed: 2, dailyClaims: 30, buildingUpgrades: 40,
};

function track(levels: number, make: (lvl: number) => SeasonReward): Record<number, SeasonReward> {
  return Object.fromEntries(Array.from({ length: levels }, (_, i) => [i + 1, make(i + 1)]));
}

/** Saison 1. Le passe est un achat unique pour la saison (aucun abonnement). */
export const SEASONS: SeasonDef[] = [
  {
    id: 's1', name: 'L\'Éveil des Coquilles', start: '2026-11-15', end: '2027-01-31', levels: 30, pointsPerLevel: 200,
    free: track(30, (l) => (l % 5 === 0 ? { crystals: 10 } : l % 2 === 0 ? { items: { fruit_rose: 3 } } : { coins: 100 + l * 10 })),
    premium: track(30, (l) => {
      if (l === 10) return { decorations: ['statue_eveil'], crystals: 30 };
      if (l === 20) return { decorations: ['fontaine_nacree'], crystals: 30 };
      if (l === 30) return { themes: ['aurore'], crystals: 60 };
      if (l % 5 === 0) return { crystals: 40, essence: 30 };
      if (l % 3 === 0) return { items: { nectar_etoile: 1, cristal_sucre: 2 } };
      return { crystals: 15, coins: 150 };
    }),
  },
];
