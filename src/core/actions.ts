import { GameError } from './errors';
import type { GameEvent } from './events';
import { releaseCreature, renameCreature, toggleFavorite } from './systems/creatures';
import { claimDaily } from './systems/daily';
import { grant } from './systems/economy';
import { feed } from './systems/feeding';
import { hatch } from './systems/hatching';
import { placeEgg, removeEgg, setAmbiance, speedUp } from './systems/incubation';
import { claimQuest } from './systems/quests';
import { harvest } from './systems/sanctuary';
import { buy } from './systems/shop';
import type { ActionContext, GameState, Settings } from './types';

/**
 * Toutes les intentions du joueur. Ce format sérialisable est aussi celui qui sera envoyé
 * au serveur (Phase 6) : le serveur rejouera la même fonction `applyAction` pour valider.
 */
export type GameAction =
  | { type: 'placeEgg'; eggUid: string; slot: number }
  | { type: 'removeEgg'; slot: number }
  | { type: 'setAmbiance'; slot: number; ambiance: string }
  | { type: 'speedUp'; slot: number }
  | { type: 'hatch'; slot: number }
  | { type: 'buy'; offerId: string }
  | { type: 'harvest' }
  | { type: 'claimDaily' }
  | { type: 'claimQuest'; questId: string }
  | { type: 'feed'; uid: string; item: string }
  | { type: 'rename'; uid: string; name: string }
  | { type: 'toggleFavorite'; uid: string }
  | { type: 'release'; uid: string }
  | { type: 'setPlayerName'; name: string }
  | { type: 'setSetting'; key: keyof Settings; value: boolean };

export interface ActionResult {
  state: GameState;
  events: GameEvent[];
}

/**
 * Réducteur pur : (état, action, contexte) → nouvel état + événements.
 * L'état d'entrée n'est jamais modifié ; en cas d'erreur, rien n'est appliqué (transaction atomique).
 */
export function applyAction(state: GameState, action: GameAction, ctx: ActionContext): ActionResult {
  const draft = structuredClone(state);
  const events: GameEvent[] = [];
  switch (action.type) {
    case 'placeEgg': placeEgg(draft, action.eggUid, action.slot, ctx); break;
    case 'removeEgg': removeEgg(draft, action.slot); break;
    case 'setAmbiance': setAmbiance(draft, action.slot, action.ambiance); break;
    case 'speedUp': speedUp(draft, action.slot, ctx); break;
    case 'hatch': hatch(draft, action.slot, ctx, events); break;
    case 'buy': buy(draft, action.offerId, ctx, events); break;
    case 'harvest': harvest(draft, ctx, events); break;
    case 'claimDaily': claimDaily(draft, ctx, events); break;
    case 'claimQuest': claimQuest(draft, action.questId, ctx, events); break;
    case 'feed': feed(draft, action.uid, action.item, ctx, events); break;
    case 'rename': renameCreature(draft, action.uid, action.name); break;
    case 'toggleFavorite': toggleFavorite(draft, action.uid); break;
    case 'release':
      releaseCreature(draft, action.uid, ctx, events, (n) => grant(draft, 'essence', n, 'Libération d\'une créature', ctx.now));
      break;
    case 'setPlayerName': {
      const name = action.name.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20);
      if (!name) throw new GameError('invalid_name', 'Le nom ne peut pas être vide.');
      draft.player.name = name;
      break;
    }
    case 'setSetting': draft.settings[action.key] = action.value; break;
    default: {
      const never: never = action;
      throw new GameError('unknown_action', `Action inconnue : ${JSON.stringify(never)}`);
    }
  }
  return { state: draft, events };
}
