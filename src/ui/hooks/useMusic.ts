import { useEffect } from 'react';
import { useGame } from '../../store/gameStore';
import { useUi, type Route } from '../../store/uiStore';
import { initMusic, setMusicTrack, type MusicTrack } from '../../services/music';
import { isNight } from '@core/time';
import { biomeWeather, sanctuaryWeather } from '@core/systems/weather';
import { isReady } from '@core/systems/incubation';
import { initAmbience, isAmbience, setAmbience, type AmbienceId } from '../../services/ambience';
import { playSfx } from '../../services/audio';

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
    if (!initialised) { initialised = true; initMusic(); initAmbience(); }
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
    /** Ambiance météo : celle du biome ouvert, ou celle du sanctuaire sur l'écran Sanctuaire. */
    const pickAmbience = (): AmbienceId | null => {
      const now = Date.now();
      let fx: string | null = null;
      const top = modals[modals.length - 1];
      if (top?.kind === 'battle') return null;
      for (let i = modals.length - 1; i >= 0 && !fx; i--) {
        const m = modals[i]!;
        if (m.kind === 'biome' || m.kind === 'expedition') fx = biomeWeather(m.biomeId, now).fx;
      }
      if (!fx && route === 'sanctuaire' && modals.length === 0) fx = sanctuaryWeather(now).fx;
      if (fx === 'sun' && isNight(new Date().getHours())) return null;
      return fx && isAmbience(fx) ? fx : null;
    };
    const refresh = () => { setMusicTrack(pick()); setAmbience(pickAmbience()); };
    refresh();
    // Passage jour / nuit et changement de météo pendant que le jeu reste ouvert.
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [route, modals, pending?.kind]);
}

/** Petit signal sonore quand un œuf devient prêt à éclore pendant qu'on joue. */
export function useEggReadyChime() {
  const incubators = useGame((s) => s.state.incubators);
  useEffect(() => {
    let prev = incubators.filter((sl) => sl.egg && isReady(sl, Date.now())).length;
    const id = setInterval(() => {
      const n = incubators.filter((sl) => sl.egg && isReady(sl, Date.now())).length;
      if (n > prev) playSfx('eggReady');
      prev = n;
    }, 1000);
    return () => clearInterval(id);
  }, [incubators]);
}
