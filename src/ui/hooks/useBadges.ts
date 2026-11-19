import { isReady } from '@core/systems/incubation';
import { canClaimDaily } from '@core/systems/daily';
import { activeQuest, questProgress } from '@core/systems/quests';
import { dayKeyOf } from '@core/time';
import { canEvolve } from '@core/systems/evolution';
import { useGame } from '../../store/gameStore';
import type { Route } from '../../store/uiStore';
import { useNow } from './useNow';

/** Pastilles de notification de la navigation. */
export function useBadges(): Partial<Record<Route, number>> {
  const state = useGame((s) => s.state);
  const now = useNow();
  const ready = state.incubators.filter((s) => isReady(s, now)).length;
  const q = activeQuest(state);
  const sanct = (canClaimDaily(state, dayKeyOf(new Date(now))) ? 1 : 0) + (q && questProgress(state, q).done ? 1 : 0);
  const hour = new Date(now).getHours();
  const evo = state.creatures.filter((c) => canEvolve(state, c, hour)).length;
  return { incubateur: ready || undefined, sanctuaire: sanct || undefined, collection: evo || undefined };
}
