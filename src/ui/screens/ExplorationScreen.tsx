import { useMemo, useState, type CSSProperties } from 'react';
import { BALANCE } from '@data/balance';
import { BIOME_BY_ID, BIOMES } from '@data/biomes';
import { EGGS } from '@data/eggs';
import { ELEMENTS } from '@data/elements';
import { ITEMS } from '@data/items';
import { SIDE_QUESTS } from '@data/missions';
import { THEMES } from '@data/buildings';
import type { BiomeDef, Reward } from '@core/content';
import type { GameEvent } from '@core/events';
import { computeStats, displayName, getSpecies } from '@core/systems/creatures';
import { dexCount } from '@core/systems/dex';
import { expeditionForecast, forageReadyAt, isAway, isBiomeUnlocked, maxExpeditions, secretFound } from '@core/systems/exploration';
import { questProgress } from '@core/systems/quests';
import { biomeWeather, nextWeatherChange, weatherOdds } from '@core/systems/weather';
import { formatDuration } from '@core/time';
import type { ExpeditionDuration } from '@core/types';
import { CreatureArt } from '../art/CreatureArt';
import { EggArt } from '../art/EggArt';
import { CurrencyIcon, ElementIcon, Icon } from '../art/Icons';
import { BiomeScenery, WEATHER_ICON, WeatherFx } from '../art/Scenery';
import { RarityBadge } from '../components/Badges';
import { Bar } from '../components/Bar';
import { EmptyState } from '../components/EmptyState';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { useNow } from '../hooks/useNow';
import { formatPct } from '../modals/OddsModal';
import { playSfx } from '../../services/audio';
import { tr, tp } from '../../i18n';

const X = BALANCE.expedition;
/** Position des biomes sur la carte (en % de la carte). */
const MAP_POS: Record<string, [number, number]> = {
  foret: [24, 58], abysses: [19, 30], montagnes: [44, 18], volcan: [62, 46],
  marais: [38, 78], desert: [80, 72], ombres: [81, 30], cosmos: [62, 10],
};

function ItemChip({ id, qty }: { id: string; qty?: number }) {
  const d = ITEMS[id];
  if (!d) return null;
  return <span className="loot-chip"><i style={{ background: d.color }} />{d.name}{qty ? tr(' ×{qty}', { qty }) : ''}</span>;
}

export function RewardList({ r }: { r: Reward }) {
  return (
    <div className="loot-list">
      {r.coins ? <span className="loot-chip"><CurrencyIcon currency="coins" width={16} height={16} />{r.coins}</span> : null}
      {r.crystals ? <span className="loot-chip"><CurrencyIcon currency="crystals" width={16} height={16} />{r.crystals}</span> : null}
      {r.essence ? <span className="loot-chip"><CurrencyIcon currency="essence" width={16} height={16} />{r.essence}</span> : null}
      {Object.entries(r.items ?? {}).map(([id, q]) => <ItemChip key={id} id={id} qty={q} />)}
      {(r.eggs ?? []).map((e, i) => <span key={i} className="loot-chip egg"><EggArt type={e} size={16} />{EGGS[e]?.name}</span>)}
    </div>
  );
}

function ActiveExpeditions() {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const openModal = useUi((s) => s.openModal);
  const now = useNow();
  if (state.expeditions.length === 0) return null;
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="section-title" style={{ marginTop: 0 }}><Icon name="compass" width={22} height={22} style={{ color: 'var(--violet)' }} /><h2>{tr('Expéditions en cours')}</h2><span className="muted">{state.expeditions.length}/{maxExpeditions(state)}</span></div>
      {state.expeditions.map((e) => {
        const b = BIOME_BY_ID[e.biomeId]!;
        const done = now >= e.endsAt;
        const team = e.creatureUids.map((u) => state.creatures.find((c) => c.uid === u)).filter(Boolean);
        return (
          <div key={e.uid} className={`card expe-row ${done ? 'done' : ''}`}>
            <div className="expe-thumb"><BiomeScenery biome={b} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{b.name}</b> <span className="muted" style={{ fontSize: 12 }}>· {X.durations[e.duration].label}</span>
              <div className="row" style={{ gap: 2, margin: '2px 0 6px' }}>{team.map((c) => <CreatureArt key={c!.uid} speciesId={c!.speciesId} mutations={c!.mutations} hue={c!.genes.hue} size={34} anim={done ? 'idle' : 'walk'} />)}</div>
              <Bar value={Math.min(1, (now - e.startedAt) / (e.endsAt - e.startedAt))} size="thin" fill={done ? '#3fcf9f' : undefined} />
            </div>
            {done ? (
              <button className="btn btn-mint" onClick={() => { playSfx('open'); dispatch({ type: 'claimExpedition', uid: e.uid }); }}><Icon name="gift" />{tr('Accueillir')}</button>
            ) : (
              <div className="stack" style={{ gap: 4, alignItems: 'flex-end' }}>
                <span className="num" style={{ fontWeight: 800 }}>{formatDuration(e.endsAt - now)}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => openModal({
                  kind: 'confirm', title: tr('Rappeler l\'équipe ?'), confirmLabel: tr('Rappeler'), danger: true,
                  body: tr('L\'équipe rentre immédiatement, mais sans aucun butin.'),
                  onConfirm: () => dispatch({ type: 'recallExpedition', uid: e.uid }),
                })}>{tr('Rappeler')}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ExplorationScreen() {
  const state = useGame((s) => s.state);
  const openModal = useUi((s) => s.openModal);
  const now = useNow();
  const dex = dexCount(state);
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="intro-banner">
        <h2>{tr('Le monde d\'EGGVERSE')}</h2>
        <p className="soft">{tr('Envoie des équipes de créatures en expédition pour rapporter des matériaux, de la nourriture et des œufs exclusifs. La météo change toutes les 3 heures et transforme chaque biome ; des événements rares y surviennent.')}</p>
      </div>
      <ActiveExpeditions />
      <div className="world-map card">
        <svg className="map-bg" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9fe0ff" /><stop offset="1" stopColor="#7fb8f0" /></linearGradient></defs>
          <rect width="1000" height="620" fill="url(#sea)" />
          {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${(i * 173) % 1000} ${(i * 97) % 620}q14-8 28 0t28 0`} stroke="white" strokeWidth="3" fill="none" opacity=".35" />)}
          <path d="M80 380C40 280 120 160 260 130C380 40 560 30 700 90C860 80 960 200 930 330C960 470 820 580 650 560C520 610 360 600 240 560C110 540 100 470 80 380Z" fill="#f6efd8" stroke="#e8d8b0" strokeWidth="8" />
          <path d="M140 400C120 320 180 220 290 200C400 120 560 110 680 160C820 160 880 250 860 340C880 450 780 520 650 510C540 550 380 540 270 510C180 500 160 460 140 400Z" fill="#d9f2c8" opacity=".7" />
          {Object.values(MAP_POS).slice(0, -1).map(([x, y], i) => {
            const [nx, ny] = Object.values(MAP_POS)[i + 1]!;
            return <path key={i} d={`M${x * 10} ${y * 6.2}Q${(x + nx) * 5 + 30} ${(y + ny) * 3.1 - 30} ${nx * 10} ${ny * 6.2}`} stroke="#b8a070" strokeWidth="4" strokeDasharray="4 10" fill="none" strokeLinecap="round" />;
          })}
        </svg>
        {BIOMES.map((b) => {
          const [x, y] = MAP_POS[b.id]!;
          const open = isBiomeUnlocked(state, b);
          const w = biomeWeather(b.id, now);
          const away = state.expeditions.filter((e) => e.biomeId === b.id).length;
          return (
            <button key={b.id} className={`map-node ${open ? '' : 'locked'} ${w.event && open ? 'event' : ''}`} style={{ left: `${x}%`, top: `${y}%`, ['--ac' as string]: b.palette.accent } as CSSProperties}
              onClick={() => { playSfx('open'); openModal({ kind: 'biome', biomeId: b.id }); }}>
              <span className="map-orb"><BiomeScenery biome={b} />{!open && <Icon name="lock" className="map-lock" />}</span>
              <span className="map-label">{b.name}</span>
              <span className="map-sub">{open ? <><Icon name={WEATHER_ICON[w.fx]} width={12} height={12} />{w.name}{away ? ' · ' + tp(away, '{n} équipe', '{n} équipes') : ''}</> : tr('{dex}/{max} espèces', { dex, max: b.unlockDex })}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BiomeModal({ biomeId }: { biomeId: string }) {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const openModal = useUi((s) => s.openModal);
  const now = useNow();
  const b = BIOME_BY_ID[biomeId]!;
  const open = isBiomeUnlocked(state, b);
  const w = biomeWeather(b.id, now);
  const count = state.exploration.expeditionsByBiome[b.id] ?? 0;
  const forageAt = forageReadyAt(state, b.id);
  const exclusives = b.eggs.filter((e) => EGGS[e.egg]?.exploreOnly);
  const eTotal = b.eggs.reduce((s, e) => s + e.weight, 0);
  return (
    <div className="stack biome-modal">
      <div className="biome-hero">
        <BiomeScenery biome={b} />
        <WeatherFx fx={w.fx} />
        <div className="biome-weather"><Icon name={WEATHER_ICON[w.fx]} />{w.name}<span className="muted"> {tr('· change dans')} {formatDuration(nextWeatherChange(now) - now)}</span></div>
      </div>
      {w.event && <div className="event-banner"><Icon name="sparkle" /><div><b>{tr('Événement :')} {w.name} !</b><div style={{ fontSize: 13 }}>{w.description}</div></div></div>}
      <p className="soft">{b.description}</p>
      {!open ? (
        <div className="status-panel"><Icon name="lock" /><p>{tr('Découvre')} <b>{b.unlockDex} {tr('espèces')}</b> {tr('dans le Bestiaire pour atteindre ce biome (')}{dexCount(state)}/{b.unlockDex}).</p></div>
      ) : (
        <div className="row-wrap">
          <button className="btn btn-pink" disabled={state.expeditions.length >= maxExpeditions(state)} onClick={() => openModal({ kind: 'expedition', biomeId: b.id })}><Icon name="compass" />{tr('Préparer une expédition')}</button>
          <button className="btn btn-ghost" disabled={now < forageAt} onClick={() => dispatch({ type: 'forage', biomeId: b.id })}>
            <Icon name="search" />{now < forageAt ? tr('Fouille dans {p0}', { p0: formatDuration(forageAt - now) }) : tr('Fouiller les environs')}
          </button>
        </div>
      )}
      <div className="biome-cols">
        <div>
          <h3 className="detail-h">{tr('Œufs trouvables')}</h3>
          <div className="odds-table compact">
            {b.eggs.map((e) => (
              <div key={e.egg} className="odds-row"><EggArt type={e.egg} size={22} /><span style={{ flex: 1, fontWeight: 700 }}>{EGGS[e.egg]!.name}{EGGS[e.egg]!.exploreOnly && <span className="badge soft-badge" style={{ marginLeft: 6 }}>{tr('Exclusif')}</span>}</span><b className="num">{formatPct(e.weight / eTotal)}</b></div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>{tr('Part de chaque œuf quand une expédition en trouve un.')}</p>
          <h3 className="detail-h">{tr('Ressources')}</h3>
          <div className="loot-list">{b.materials.map((m) => <ItemChip key={m.item} id={m.item} />)}{b.foods.map((f) => <ItemChip key={f} id={f} />)}</div>
          <h3 className="detail-h">{tr('Éléments à l\'aise ici')}</h3>
          <div className="row-wrap">{b.favoredElements.map((el) => <span key={el} className="badge element-badge" style={{ ['--ec' as string]: ELEMENTS[el].color } as CSSProperties}><ElementIcon element={el} style={{ color: ELEMENTS[el].color }} />{ELEMENTS[el].name}</span>)}</div>
        </div>
        <div>
          <h3 className="detail-h">{tr('Zone secrète')}</h3>
          {secretFound(state, b.id) ? (
            <div className="status-panel secret"><Icon name="starFill" /><div><b>{b.secret.name}</b><p style={{ fontSize: 13 }}>{b.secret.description} {tr('Chance d\'œuf +')}{Math.round(b.secret.eggChanceBonus * 100)} {tr('pts dans ce biome.')}</p></div></div>
          ) : (
            <div className="status-panel"><Icon name="map" /><div><b>???</b><p style={{ fontSize: 13 }}>{tr('Des rumeurs parlent d\'un lieu caché. Expéditions :')} {count}/{b.secret.afterExpeditions}</p><Bar value={count / b.secret.afterExpeditions} size="thin" /></div></div>
          )}
          <h3 className="detail-h">{tr('Quêtes du biome')}</h3>
          <div className="stack" style={{ gap: 6 }}>
            {SIDE_QUESTS.filter((q) => q.goal.kind === 'biomeExpeditions' && q.goal.biome === b.id).map((q) => {
              const p = questProgress(state, q);
              const claimed = state.sideQuests.includes(q.id);
              return (
                <div key={q.id} className="mission-row">
                  <div style={{ flex: 1 }}><b style={{ fontSize: 14 }}>{q.title}</b><div className="muted" style={{ fontSize: 12 }}>{q.description}</div><Bar value={p.current / p.target} size="thin" /></div>
                  <button className="btn btn-mint btn-sm" disabled={!p.done || claimed} onClick={() => dispatch({ type: 'claimSideQuest', id: q.id })}>{claimed ? <Icon name="check" /> : `${p.current}/${p.target}`}</button>
                </div>
              );
            })}
          </div>
          <h3 className="detail-h">{tr('Météo possible')}</h3>
          <div className="row-wrap">{weatherOdds(b.weather).map(({ weather, probability }) => <span key={weather.id} className={`badge ${weather.event ? 'mutation-badge' : 'soft-badge'}`} style={{ ['--mc' as string]: '#ffb03d' } as CSSProperties}><Icon name={WEATHER_ICON[weather.fx]} />{weather.name} {formatPct(probability)}</span>)}</div>
          {exclusives.length > 0 && <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>{tr('Terrain de sanctuaire débloqué après une expédition :')} {THEMES[b.theme]?.name}.</p>}
        </div>
      </div>
    </div>
  );
}

export function ExpeditionModal({ biomeId }: { biomeId: string }) {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const { closeModal } = useUi.getState();
  const now = useNow();
  const b: BiomeDef = BIOME_BY_ID[biomeId]!;
  const [team, setTeam] = useState<string[]>([]);
  const [duration, setDuration] = useState<ExpeditionDuration>('court');
  const available = useMemo(() => state.creatures.filter((c) => !isAway(state, c.uid)).sort((a, c) => computeStats(c).power - computeStats(a).power), [state]);
  const chosen = team.map((u) => state.creatures.find((c) => c.uid === u)!).filter(Boolean);
  const f = chosen.length ? expeditionForecast(state, biomeId, chosen, duration, now) : null;
  const toggle = (uid: string) => setTeam((t) => (t.includes(uid) ? t.filter((x) => x !== uid) : t.length < X.maxTeam ? [...t, uid] : t));
  const w = biomeWeather(biomeId, now);

  return (
    <div className="stack">
      <p className="soft" style={{ fontSize: 14 }}>{tr('Choisis jusqu\'à')} {X.maxTeam} {tr('créatures. Puissance conseillée :')} <b>{b.difficulty}</b>{tr('. Les créatures')} <b>{b.favoredElements.map((e) => ELEMENTS[e].name).join(', ')}</b>{w.elementBonus.length ? <> {tr('et, avec la météo actuelle,')} <b>{w.elementBonus.map((e) => ELEMENTS[e].name).join(', ')}</b></> : null} {tr('rapportent davantage.')}</p>
      {available.length === 0 ? <EmptyState icon="paw" title={tr('Aucune créature disponible')}>{tr('Toutes tes créatures sont déjà en route.')}</EmptyState> : (
        <div className="team-grid">
          {available.map((c) => {
            const el = getSpecies(c.speciesId).element;
            const fav = b.favoredElements.includes(el) || w.elementBonus.includes(el);
            const on = team.includes(c.uid);
            return (
              <button key={c.uid} className={`team-pick ${on ? 'on' : ''}`} onClick={() => toggle(c.uid)} aria-pressed={on}>
                {fav && <span className="team-fav tip" data-tip={tr('Élément avantagé')}><ElementIcon element={el} style={{ color: ELEMENTS[el].color }} /></span>}
                <CreatureArt speciesId={c.speciesId} mutations={c.mutations} hue={c.genes.hue} size={58} anim={on ? 'walk' : 'none'} />
                <b>{displayName(c)}</b>
                <span className="muted num">{tr('Nv')} {c.level} · {computeStats(c).power}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="tabs">
        {(Object.keys(X.durations) as ExpeditionDuration[]).map((d) => <button key={d} className={duration === d ? 'active' : ''} onClick={() => setDuration(d)}>{X.durations[d].label}</button>)}
      </div>
      {f && (
        <div className="card forecast">
          <div className="row"><b>{tr('Qualité de l\'expédition')}</b><span className="spacer" /><span className="num" style={{ fontWeight: 800 }}>{Math.round(f.quality * 100)} %</span></div>
          <Bar value={f.quality / 1.6} fill={f.quality >= 1 ? 'linear-gradient(90deg,#3fcf9f,#5cb8ff)' : 'linear-gradient(90deg,#ffc23d,#ff7a5c)'} />
          <dl className="kv" style={{ marginTop: 10 }}>
            <dt>{tr('Puissance de l\'équipe')}</dt><dd>{f.power} / {b.difficulty}{f.favored ? tr(' · {favored} avantagée(s)', { favored: f.favored }) : ''}</dd>
            <dt>{tr('Fouilles')}</dt><dd>{f.rolls}</dd>
            <dt>{tr('Chance d\'œuf')}</dt><dd>{formatPct(f.eggChancePerRoll)} {tr('par fouille ·')} <b>{formatPct(f.eggChanceTotal)}</b> {tr('d\'en rapporter au moins un')}</dd>
            <dt>{tr('Pièces')}</dt><dd>{f.coins[0]} – {f.coins[1]}</dd>
            <dt>{tr('Expérience')}</dt><dd>+{f.xpEach} {tr('XP par créature')}</dd>
            <dt>{tr('Durée')}</dt><dd>{formatDuration(X.durations[duration].ms)}</dd>
          </dl>
        </div>
      )}
      <button className="btn btn-pink btn-lg" disabled={!f} onClick={() => {
        if (dispatch({ type: 'startExpedition', biomeId, uids: team, duration })) { playSfx('whoosh'); closeModal(); closeModal(); }
      }}><Icon name="compass" />{tr('Partir en expédition')}</button>
    </div>
  );
}

export function ExpeditionResult({ event }: { event: Extract<GameEvent, { type: 'expeditionDone' }> }) {
  const state = useGame((s) => s.state);
  const close = useUi.getState().closeModal;
  const b = BIOME_BY_ID[event.biomeId]!;
  return (
    <div className="stack expe-result">
      <div className="biome-hero small"><BiomeScenery biome={b} />
        <div className="expe-team">{event.team.map((u) => { const c = state.creatures.find((x) => x.uid === u); return c ? <CreatureArt key={u} speciesId={c.speciesId} mutations={c.mutations} hue={c.genes.hue} size={80} anim="walk" /> : null; })}</div>
      </div>
      {event.secretFound && <div className="event-banner"><Icon name="starFill" /><div><b>{tr('Zone secrète découverte :')} {b.secret.name} !</b><div style={{ fontSize: 13 }}>{b.secret.description}</div></div></div>}
      <p className="soft">{tr('Ton équipe est rentrée de')} <b>{b.name}</b> {tr('et a gagné')} <b>{event.xp} {tr('XP')}</b> chacun.</p>
      <RewardList r={event.reward} />
      {(event.reward.eggs?.length ?? 0) > 0 && <p style={{ fontWeight: 800, color: 'var(--pink)' }}><Icon name="egg" width={16} height={16} style={{ display: 'inline', verticalAlign: '-3px' }} /> {tp(event.reward.eggs!.length, '{n} œuf ajouté au panier !', '{n} œufs ajoutés au panier !')}</p>}
      <div className="row-wrap">{event.reward.eggs?.map((e, i) => <RarityBadge key={i} rarity={EGGS[e]!.rarity} small />)}</div>
      <button className="btn btn-pink" onClick={close}>{tr('Super !')}</button>
    </div>
  );
}
