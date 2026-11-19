import type { Reward } from './content';
import type { CreatureInstance, MutationId } from './types';

/** Événements émis par les actions : l'interface s'en sert pour les animations et notifications. */
export type GameEvent =
  | { type: 'hatched'; creature: CreatureInstance; newSpecies: boolean; newVariants: MutationId[]; crystalsAwarded: number }
  | { type: 'levelUp'; uid: string; level: number }
  | { type: 'reward'; reason: string; reward: Reward }
  | { type: 'purchased'; offerId: string; label: string }
  | { type: 'harvested'; coins: number; produce?: Reward }
  | { type: 'fed'; uid: string; xp: number; favorite: boolean }
  | { type: 'released'; uid: string; essence: number }
  | { type: 'evolved'; uid: string; from: string; to: string; newSpecies: boolean; crystalsAwarded: number }
  | { type: 'bred'; eggUid: string; parents: [string, string] }
  | { type: 'expeditionDone'; biomeId: string; reward: Reward; secretFound: boolean; xp: number; team: string[] }
  | { type: 'foraged'; biomeId: string; reward: Reward };
