import { useEffect } from 'react';
import { useGame } from '../../store/gameStore';
import { useUi, type Route } from '../../store/uiStore';
import { initMusic, setMusicTrack, type MusicTrack } from '../../services/music';
import { isNight } from '@core/time';

const BY_ROUTE: Partial<Record<Route, MusicTrack>> = {
  incubateur: 'incubator',
  laboratoire: 'lab',
  boutique: 'shop',
  arene: 'arena',
  saison: 'event',
  exploration: 'biome-foret',
  communaute: 'title',
};

let initialised = false;

/** Choisit la musique selon l'écran, la fenêtre ouverte (biome, combat) et l'heure. */
export function useMusic() {
  const route = useUi((s) => s.route);
  const modals = useUi((s) => s.modals);
  const pending = useGame((s) => s.state.combat.pending);

  useEffect(() => {
    if (!initialised) { initialised = true; initMusic(); }
  }, []);

  useEffect(() => {
    const pick = (): MusicTrack => {
      for (let i = modals.length - 1; i >= 0; i--) {
        const m = modals[i]!;
        if (m.kind === 'battle') return pending?.kind === 'boss' ? 'boss' : 'arena';
        if (m.kind === 'biome' || m.kind === 'expedition') return `biome-${m.biomeId}` as MusicTrack;
      }
      const byRoute = BY_ROUTE[route];
      if (byRoute) return byRoute;
      return isNight(new Date().getHours()) ? 'sanctuary-night' : 'sanctuary-day';
    };
    setMusicTrack(pick());
    // Passage jour / nuit pendant que le jeu reste ouvert.
    const id = setInterval(() => setMusicTrack(pick()), 60_000);
    return () => clearInterval(id);
  }, [route, modals, pending?.kind]);
}
