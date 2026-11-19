import type { CSSProperties } from 'react';
import { DECORATIONS, THEMES } from '@data/buildings';
import { ITEMS } from '@data/items';
import { PRODUCTS, formatPrice } from '@data/products';
import { SEASON_POINTS, type SeasonReward } from '@data/seasons';
import { currentSeason, seasonLevel, seasonPoints } from '@core/systems/season';
import { dayKeyOf, formatDuration } from '@core/time';
import { CurrencyIcon, Icon } from '../art/Icons';
import { Bar } from '../components/Bar';
import { EmptyState } from '../components/EmptyState';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { useNow } from '../hooks/useNow';

const STAT_LABEL: Record<string, string> = {
  eggsHatched: 'Faire éclore un œuf', battlesWon: 'Gagner un combat', bossesDefeated: 'Vaincre un gardien ancien', expeditions: 'Terminer une expédition',
  forages: 'Fouiller un biome', evolutions: 'Faire évoluer une créature', breedings: 'Réaliser une fusion', harvests: 'Récolter au sanctuaire',
  creaturesFed: 'Donner un repas', dailyClaims: 'Récompense quotidienne', buildingUpgrades: 'Améliorer un bâtiment',
};

function RewardChips({ r }: { r: SeasonReward }) {
  return (
    <div className="season-chips">
      {r.coins ? <span><CurrencyIcon currency="coins" width={14} height={14} />{r.coins}</span> : null}
      {r.crystals ? <span><CurrencyIcon currency="crystals" width={14} height={14} />{r.crystals}</span> : null}
      {r.essence ? <span><CurrencyIcon currency="essence" width={14} height={14} />{r.essence}</span> : null}
      {Object.entries(r.items ?? {}).map(([id, q]) => <span key={id}><i style={{ background: ITEMS[id]?.color }} />{ITEMS[id]?.name} ×{q}</span>)}
      {(r.decorations ?? []).map((d) => <span key={d} className="excl"><Icon name="sparkle" width={12} height={12} />{DECORATIONS.find((x) => x.id === d)?.name}</span>)}
      {(r.themes ?? []).map((t) => <span key={t} className="excl"><Icon name="map" width={12} height={12} />Terrain {THEMES[t]?.name}</span>)}
    </div>
  );
}

export function SeasonScreen() {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const openModal = useUi((s) => s.openModal);
  const now = useNow();
  const season = currentSeason(dayKeyOf(new Date(now)));
  if (!season) return <EmptyState icon="trophy" title="Aucune saison en cours">La prochaine saison commencera bientôt.</EmptyState>;
  const synced = state.season.id === season.id;
  const pts = seasonPoints(state, season);
  const lvl = seasonLevel(state, season);
  const end = new Date(`${season.end}T23:59:59`).getTime();
  const pass = PRODUCTS.find((p) => p.grants.season === season.id);
  const into = pts - lvl * season.pointsPerLevel;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card season-hero">
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="badge soft-badge"><Icon name="clock" />Se termine dans {formatDuration(end - now)}</span>
          <h2>Saison 1 : {season.name}</h2>
          <p className="soft" style={{ fontSize: 14 }}>Gagne des points en jouant pour monter de palier. Les récompenses de gauche sont gratuites pour tout le monde ; celles du passe se débloquent avec un achat unique pour la saison (sans abonnement).</p>
          <div className="row" style={{ marginTop: 10 }}><b className="num" style={{ fontSize: 20 }}>Palier {lvl}/{season.levels}</b><span className="muted num" style={{ fontSize: 13 }}>{lvl >= season.levels ? 'Saison terminée à 100 % !' : `${into}/${season.pointsPerLevel} points`}</span></div>
          <Bar value={lvl >= season.levels ? 1 : into / season.pointsPerLevel} size="thick" />
        </div>
        <div className="season-pass">
          {state.season.premium && synced ? <><Icon name="check" /><b>Passe actif</b></> : pass && (
            <>
              <b>Passe de saison</b>
              <span className="muted" style={{ fontSize: 12 }}>≈ 500 cristaux, 3 cosmétiques exclusifs</span>
              <button className="btn btn-gold" onClick={() => openModal({ kind: 'checkout', productId: pass.id })}>{formatPrice(pass.priceCents)}</button>
            </>
          )}
        </div>
      </div>

      <div className="season-track">
        {Array.from({ length: season.levels }, (_, i) => i + 1).map((l) => {
          const reached = lvl >= l;
          const freeDone = state.season.claimedFree.includes(l);
          const premDone = state.season.claimedPremium.includes(l);
          return (
            <div key={l} className={`season-col ${reached ? 'reached' : ''}`}>
              <span className="season-lvl num">{l}</span>
              <div className={`season-cell free ${freeDone ? 'done' : ''}`}>
                <RewardChips r={season.free[l]!} />
                <button className="btn btn-mint btn-sm" disabled={!reached || freeDone} onClick={() => dispatch({ type: 'claimSeasonReward', level: l, track: 'free' })}>{freeDone ? <Icon name="check" /> : reached ? 'Prendre' : <Icon name="lock" />}</button>
              </div>
              <div className={`season-cell premium ${premDone ? 'done' : ''} ${state.season.premium ? '' : 'nopass'}`} style={{ ['--x' as string]: 1 } as CSSProperties}>
                <RewardChips r={season.premium[l]!} />
                <button className="btn btn-gold btn-sm" disabled={!reached || premDone || !state.season.premium} onClick={() => dispatch({ type: 'claimSeasonReward', level: l, track: 'premium' })}>{premDone ? <Icon name="check" /> : reached && state.season.premium ? 'Prendre' : <Icon name="lock" />}</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-title"><Icon name="info" /><h3>Gagner des points de saison</h3></div>
        <div className="grid-auto" style={{ ['--min' as string]: '220px' } as CSSProperties}>
          {Object.entries(SEASON_POINTS).map(([k, v]) => <div key={k} className="mission-row"><span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{STAT_LABEL[k]}</span><b className="num">+{v}</b></div>)}
        </div>
      </div>
    </div>
  );
}
