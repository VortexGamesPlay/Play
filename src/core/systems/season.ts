import { SEASON_POINTS, SEASONS, type SeasonDef, type SeasonReward } from '@data/seasons';
import { assertGame } from '../errors';
import type { GameEvent } from '../events';
import type { ActionContext, GameState } from '../types';
import { grantReward } from './economy';
import { tr } from '../../i18n';

/** Saison en cours à une date donnée (clé YYYY-MM-DD). */
export function currentSeason(dayKey: string): SeasonDef | null {
  return SEASONS.find((s) => dayKey >= s.start && dayKey <= s.end) ?? null;
}

/** Au début de chaque action : nouvelle saison ⇒ nouvelle photographie des statistiques et nouveau passe. */
export function syncSeason(draft: GameState, ctx: ActionContext): void {
  const s = currentSeason(ctx.dayKey);
  const id = s?.id ?? null;
  if (draft.season.id !== id) {
    draft.season = { id, baseline: s ? { ...draft.stats } : null, premium: false, claimedFree: [], claimedPremium: [] };
  }
}

export function seasonPoints(state: GameState, season: SeasonDef | null): number {
  if (!season || state.season.id !== season.id || !state.season.baseline) return 0;
  let pts = 0;
  for (const [k, w] of Object.entries(SEASON_POINTS)) {
    const key = k as keyof typeof SEASON_POINTS;
    pts += Math.max(0, state.stats[key] - state.season.baseline[key]) * (w ?? 0);
  }
  return pts;
}

export function seasonLevel(state: GameState, season: SeasonDef | null): number {
  if (!season) return 0;
  return Math.min(season.levels, Math.floor(seasonPoints(state, season) / season.pointsPerLevel));
}

/** Distribue une récompense de saison (monnaies, objets, cosmétiques). */
export function grantSeasonReward(draft: GameState, r: SeasonReward, label: string, ctx: ActionContext, events: GameEvent[]) {
  const { decorations, themes, ...base } = r;
  for (const d of decorations ?? []) if (!(d in draft.sanctuary.decorations)) draft.sanctuary.decorations[d] = true;
  for (const t of themes ?? []) if (!draft.premium.ownedThemes.includes(t)) draft.premium.ownedThemes.push(t);
  grantReward(draft, base, label, ctx, events);
}

export function claimSeasonReward(draft: GameState, level: number, track: 'free' | 'premium', ctx: ActionContext, events: GameEvent[]): void {
  const s = currentSeason(ctx.dayKey);
  assertGame(s && draft.season.id === s.id, 'no_season', tr('Aucune saison en cours.'));
  assertGame(Number.isInteger(level) && level >= 1 && level <= s.levels, 'bad_level', tr('Palier invalide.'));
  assertGame(seasonLevel(draft, s) >= level, 'locked', tr('Atteins le palier {level} pour récupérer cette récompense.', { level }));
  if (track === 'premium') assertGame(draft.season.premium, 'no_pass', tr('Cette récompense fait partie du passe de saison.'));
  const claimed = track === 'free' ? draft.season.claimedFree : draft.season.claimedPremium;
  assertGame(!claimed.includes(level), 'claimed', tr('Récompense déjà récupérée.'));
  claimed.push(level);
  grantSeasonReward(draft, (track === 'free' ? s.free : s.premium)[level]!, `Saison — palier ${level}${track === 'premium' ? ' (passe)' : ''}`, ctx, events);
}
