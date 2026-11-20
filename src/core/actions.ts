import { GameError, assertGame } from './errors';
import { t } from '../i18n';
import type { GameEvent } from './events';
import { releaseCreature, renameCreature, toggleFavorite } from './systems/creatures';
import { claimDaily } from './systems/daily';
import { breed } from './systems/breeding';
import { evolve } from './systems/evolution';
import { claimExpedition, forage, recallExpedition, startExpedition } from './systems/exploration';
import { setTheme, toggleDecoration, upgradeBuilding } from './systems/buildings';
import { claimAchievement, claimMission, claimSideQuest, syncPeriods } from './systems/missions';
import { assertPresent } from './systems/exploration';
import { abandonBattle, finishBattle, setTeam, startBattle } from './systems/battles';
import type { BattleInput } from './combat/engine';
import type { PendingBattle, PurchaseRecord } from './types';
import { applyPurchase, setSpendLimit } from './systems/premium';
import { claimSeasonReward, syncSeason } from './systems/season';
import { grant } from './systems/economy';
import { feed } from './systems/feeding';
import { hatch } from './systems/hatching';
import { placeEgg, removeEgg, setAmbiance, speedUp } from './systems/incubation';
import { claimQuest } from './systems/quests';
import { harvest } from './systems/sanctuary';
import { buy } from './systems/shop';
import type { ActionContext, ExpeditionDuration, GameState } from './types';

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
  | { type: 'setSetting'; key: 'sound' | 'reducedMotion'; value: boolean }
  | { type: 'setVolume'; key: 'musicVolume' | 'sfxVolume'; value: number }
  | { type: 'setLocale'; locale: 'en' | 'fr' }
  | { type: 'evolve'; uid: string; to: string }
  | { type: 'breed'; a: string; b: string; stabilize: boolean }
  | { type: 'startExpedition'; biomeId: string; uids: string[]; duration: ExpeditionDuration }
  | { type: 'claimExpedition'; uid: string }
  | { type: 'recallExpedition'; uid: string }
  | { type: 'forage'; biomeId: string }
  | { type: 'upgradeBuilding'; id: string }
  | { type: 'toggleDecoration'; id: string }
  | { type: 'setTheme'; theme: string }
  | { type: 'claimMission'; id: string; period: 'day' | 'week' }
  | { type: 'claimAchievement'; id: string }
  | { type: 'claimSideQuest'; id: string }
  | { type: 'setTeam'; uids: string[] }
  | { type: 'startBattle'; kind: PendingBattle['kind']; ref: string }
  | { type: 'finishBattle'; inputs: BattleInput[] }
  | { type: 'abandonBattle' }
  | { type: 'applyPurchase'; purchase: Omit<PurchaseRecord, 'at'> }
  | { type: 'claimSeasonReward'; level: number; track: 'free' | 'premium' }
  | { type: 'setSpendLimit'; cents: number | null };

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
  syncPeriods(draft, ctx);
  syncSeason(draft, ctx);
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
    case 'feed': assertPresent(draft, action.uid); feed(draft, action.uid, action.item, ctx, events); break;
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
    case 'setVolume':
      assertGame(Number.isFinite(action.value) && action.value >= 0 && action.value <= 1, 'bad_volume', t('Volume invalide.'));
      draft.settings[action.key] = Math.round(action.value * 100) / 100;
      break;
    case 'setLocale':
      if (action.locale !== 'en' && action.locale !== 'fr') throw new GameError('bad_locale', t('Langue inconnue.'));
      draft.settings.locale = action.locale;
      break;
    case 'evolve': evolve(draft, action.uid, action.to, ctx, events); break;
    case 'breed': breed(draft, action.a, action.b, action.stabilize, ctx, events); break;
    case 'startExpedition': startExpedition(draft, action.biomeId, action.uids, action.duration, ctx); break;
    case 'claimExpedition': claimExpedition(draft, action.uid, ctx, events); break;
    case 'recallExpedition': recallExpedition(draft, action.uid); break;
    case 'forage': forage(draft, action.biomeId, ctx, events); break;
    case 'upgradeBuilding': upgradeBuilding(draft, action.id, ctx); break;
    case 'toggleDecoration': toggleDecoration(draft, action.id); break;
    case 'setTheme': setTheme(draft, action.theme); break;
    case 'claimMission': claimMission(draft, action.id, action.period, ctx, events); break;
    case 'claimAchievement': claimAchievement(draft, action.id, ctx, events); break;
    case 'claimSideQuest': claimSideQuest(draft, action.id, ctx, events); break;
    case 'setTeam': setTeam(draft, action.uids); break;
    case 'startBattle': startBattle(draft, action.kind, action.ref, ctx); break;
    case 'finishBattle': finishBattle(draft, action.inputs, ctx, events); break;
    case 'abandonBattle': abandonBattle(draft); break;
    case 'applyPurchase': applyPurchase(draft, action.purchase, ctx, events); break;
    case 'claimSeasonReward': claimSeasonReward(draft, action.level, action.track, ctx, events); break;
    case 'setSpendLimit': setSpendLimit(draft, action.cents); break;
    default: {
      const never: never = action;
      throw new GameError('unknown_action', `Action inconnue : ${JSON.stringify(never)}`);
    }
  }
  return { state: draft, events };
}
