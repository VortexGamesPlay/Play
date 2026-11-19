import { useState, type CSSProperties } from 'react';
import { BUILDINGS, DECORATIONS, THEMES } from '@data/buildings';
import { BIOMES } from '@data/biomes';
import { ELEMENTS } from '@data/elements';
import { ITEMS } from '@data/items';
import type { BuildingDef } from '@core/content';
import { buildingLevel, unlockedThemes, upgradeCost } from '@core/systems/buildings';
import { dailyMissions, missionProgress, weekKeyOf, weeklyMissions } from '@core/systems/missions';
import { dayKeyOf, formatDuration } from '@core/time';
import { CurrencyIcon, Icon } from '../art/Icons';
import { Bar } from '../components/Bar';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { useNow } from '../hooks/useNow';
import { RewardList } from './ExplorationScreen';

function effectText(b: BuildingDef, level: number): string {
  const e = b.effect;
  const v = (e.base ?? 0) + e.perLevel * level;
  switch (e.kind) {
    case 'creatureCap': return `${v} créatures`;
    case 'eggCap': return `${v} œufs`;
    case 'garden': return level === 0 ? 'Aucune production' : `${level} Fruit rose / 2 h${level >= 3 ? ` · ${level - 2} Graine solaire / 3 h` : ''}`;
    case 'zone': return level === 0 ? 'Aucun bonus' : `+${Math.round(e.perLevel * level * 100)} % de production (${e.elements!.map((x) => ELEMENTS[x].name).join(', ')})`;
    case 'essence': return level === 0 ? 'Aucune production' : `${v} essence / h`;
  }
}

function BuildingCard({ b }: { b: BuildingDef }) {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const navigate = useUi((s) => s.navigate);
  const lvl = buildingLevel(state, b.id);
  const cost = upgradeCost(state, b.id);
  const missing = cost ? Object.entries(cost.materials).filter(([id, q]) => (state.inventory[id] ?? 0) < (q ?? 0)) : [];
  const canPay = cost && state.wallet.coins >= cost.coins && missing.length === 0;
  return (
    <div className={`card building ${lvl === 0 ? 'unbuilt' : ''}`}>
      <div className="row"><b className="building-name">{b.name}</b><span className="spacer" /><span className="badge soft-badge">{lvl === 0 ? 'À construire' : `Niv. ${lvl}/${b.maxLevel}`}</span></div>
      <p className="soft" style={{ fontSize: 13, margin: '4px 0 8px' }}>{b.description}</p>
      <div className="building-levels">{Array.from({ length: b.maxLevel }, (_, i) => <i key={i} className={i < lvl ? 'on' : ''} />)}</div>
      <dl className="kv" style={{ fontSize: 13, marginTop: 8 }}>
        <dt>Actuel</dt><dd>{effectText(b, lvl)}</dd>
        {cost && <><dt>Prochain</dt><dd>{effectText(b, lvl + 1)}</dd></>}
      </dl>
      {cost ? (
        <>
          <div className="cost-list">
            {cost.coins > 0 && <span className={`loot-chip ${state.wallet.coins < cost.coins ? 'missing' : ''}`}><CurrencyIcon currency="coins" width={16} height={16} />{cost.coins.toLocaleString('fr-FR')}</span>}
            {Object.entries(cost.materials).map(([id, q]) => {
              const have = state.inventory[id] ?? 0;
              return <span key={id} className={`loot-chip ${have < (q ?? 0) ? 'missing' : ''}`}><i style={{ background: ITEMS[id]?.color }} />{ITEMS[id]?.name} {have}/{q}</span>;
            })}
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            {missing.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => navigate('exploration')}><Icon name="compass" />Trouver</button>}
            <span className="spacer" />
            <button className="btn btn-sm" disabled={!canPay} onClick={() => dispatch({ type: 'upgradeBuilding', id: b.id })}><Icon name="hammer" />{lvl === 0 ? 'Construire' : 'Améliorer'}</button>
          </div>
        </>
      ) : <p style={{ fontWeight: 800, color: 'var(--mint)', fontSize: 13, marginTop: 8 }}><Icon name="check" width={14} height={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Niveau maximum</p>}
    </div>
  );
}

export function BuildPanel() {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const navigate = useUi((s) => s.navigate);
  const themes = unlockedThemes(state);
  const owned = Object.keys(state.sanctuary.decorations);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="section-title" style={{ marginTop: 0 }}><Icon name="hammer" width={22} height={22} style={{ color: 'var(--violet)' }} /><h2>Bâtiments</h2><span className="muted">Matériaux rapportés des expéditions</span></div>
      <div className="grid-auto" style={{ ['--min' as string]: '270px' } as CSSProperties}>{BUILDINGS.map((b) => <BuildingCard key={b.id} b={b} />)}</div>

      <div className="section-title"><Icon name="map" width={22} height={22} style={{ color: 'var(--violet)' }} /><h2>Terrain</h2></div>
      <div className="row-wrap">
        {Object.values(THEMES).map((t) => {
          const ok = themes.includes(t.id);
          const from = BIOMES.find((b) => b.theme === t.id && t.id !== 'prairie');
          return (
            <button key={t.id} className={`theme-chip ${state.sanctuary.theme === t.id ? 'active' : ''} ${ok ? '' : 'locked'}`} disabled={!ok} title={ok ? '' : `Débloqué après une expédition : ${from?.name}`}
              onClick={() => dispatch({ type: 'setTheme', theme: t.id })} style={{ ['--t1' as string]: t.sky[0], ['--t2' as string]: t.ground[1] } as CSSProperties}>
              <i />{t.name}{!ok && <Icon name="lock" width={12} height={12} />}
            </button>
          );
        })}
      </div>

      <div className="section-title"><Icon name="sparkle" width={22} height={22} style={{ color: 'var(--violet)' }} /><h2>Décorations</h2><span className="muted">{owned.length}/{DECORATIONS.length}</span></div>
      {owned.length === 0 ? (
        <div className="status-panel"><Icon name="info" /><p style={{ fontSize: 14 }}>Aucune décoration pour l'instant. <button className="btn btn-ghost btn-sm" onClick={() => navigate('boutique')}>Voir la boutique</button></p></div>
      ) : (
        <div className="row-wrap">
          {DECORATIONS.filter((d) => owned.includes(d.id)).map((d) => (
            <label key={d.id} className="deco-toggle">
              <i style={{ background: d.color }} />{d.name}
              <button className={`toggle ${state.sanctuary.decorations[d.id] ? 'on' : ''}`} aria-pressed={state.sanctuary.decorations[d.id]} aria-label={`Afficher ${d.name}`} onClick={() => dispatch({ type: 'toggleDecoration', id: d.id })} />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function MissionsCard() {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const now = useNow();
  const [period, setPeriod] = useState<'day' | 'week'>('day');
  const list = period === 'day' ? dailyMissions(dayKeyOf(new Date(now))) : weeklyMissions(weekKeyOf(now));
  const end = new Date(now);
  if (period === 'day') end.setHours(24, 0, 0, 0);
  else { end.setDate(end.getDate() + (7 - ((end.getDay() + 6) % 7))); end.setHours(0, 0, 0, 0); }
  return (
    <div className="card">
      <div className="card-title"><Icon name="clock" /><h3>Missions</h3><span className="spacer" />
        <div className="tabs small"><button className={period === 'day' ? 'active' : ''} onClick={() => setPeriod('day')}>Jour</button><button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>Semaine</button></div>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        {list.map((m) => {
          const p = missionProgress(state, m, period, now);
          return (
            <div key={m.id} className={`mission-row ${p.claimed ? 'claimed' : ''}`}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 14 }}>{m.title}</b>
                <Bar value={p.current / m.target} size="thin" />
                <RewardList r={m.reward} />
              </div>
              <button className="btn btn-mint btn-sm" disabled={!p.done || p.claimed} onClick={() => dispatch({ type: 'claimMission', id: m.id, period })}>
                {p.claimed ? <Icon name="check" /> : p.done ? 'Récupérer' : `${p.current}/${m.target}`}
              </button>
            </div>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Nouvelles missions dans {formatDuration(end.getTime() - now)}</p>
    </div>
  );
}
