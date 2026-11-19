import { useEffect, useMemo, useRef, useState } from 'react';
import { BALANCE } from '@data/balance';
import { EGGS } from '@data/eggs';
import { ITEMS } from '@data/items';
import { MUTATIONS } from '@data/mutations';
import { displayName, getSpecies } from '@core/systems/creatures';
import { canClaimDaily, dailyReward, nextStreak } from '@core/systems/daily';
import { activeQuest, questProgress } from '@core/systems/quests';
import { pendingHarvest, totalHarvestRate } from '@core/systems/sanctuary';
import { dayKeyOf, formatDuration, HOUR, isNight } from '@core/time';
import type { CreatureInstance } from '@core/types';
import type { Reward } from '@core/content';
import { CreatureArt } from '../art/CreatureArt';
import { CurrencyIcon, Icon } from '../art/Icons';
import { Bar } from '../components/Bar';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { useNow } from '../hooks/useNow';
import { playSfx } from '../../services/audio';

type Behavior = 'walk' | 'idle' | 'sleep' | 'play' | 'eat';

interface Actor {
  uid: string;
  x: number;
  y: number;
  flip: boolean;
  behavior: Behavior;
  moveMs: number;
  reactAt: number;
}

const MAX_ACTORS = 14;

function rand(min: number, max: number) { return min + Math.random() * (max - min); }

/** Petite IA de comportement : chaque créature choisit régulièrement une activité. */
function useActors(creatures: CreatureInstance[], night: boolean) {
  const [actors, setActors] = useState<Actor[]>([]);
  const nightRef = useRef(night);
  nightRef.current = night;

  useEffect(() => {
    setActors((prev) => {
      const byId = new Map(prev.map((a) => [a.uid, a]));
      return creatures.map((c) => byId.get(c.uid) ?? { uid: c.uid, x: rand(8, 86), y: rand(52, 84), flip: Math.random() < 0.5, behavior: 'idle' as Behavior, moveMs: 0, reactAt: 0 });
    });
  }, [creatures]);

  useEffect(() => {
    const tick = () => {
      setActors((prev) => prev.map((a) => {
        if (Math.random() < 0.45) return a; // garde son activité un moment
        const r = Math.random();
        const sleepBias = nightRef.current ? 0.35 : 0.08;
        if (r < sleepBias) return { ...a, behavior: 'sleep', moveMs: 0 };
        if (r < sleepBias + 0.12) return { ...a, behavior: 'play', moveMs: 0 };
        if (r < sleepBias + 0.2) return { ...a, behavior: 'eat', moveMs: 0 };
        if (r < sleepBias + 0.35) return { ...a, behavior: 'idle', moveMs: 0 };
        const nx = Math.max(6, Math.min(88, a.x + rand(-26, 26)));
        const ny = Math.max(50, Math.min(86, a.y + rand(-12, 12)));
        const dist = Math.hypot(nx - a.x, (ny - a.y) * 1.5);
        return { ...a, x: nx, y: ny, flip: nx < a.x, behavior: 'walk', moveMs: Math.max(900, dist * 110) };
      }));
    };
    const id = setInterval(tick, 2600);
    const first = setTimeout(tick, 300);
    return () => { clearInterval(id); clearTimeout(first); };
  }, []);

  // Fin de déplacement → repos
  useEffect(() => {
    const walking = actors.filter((a) => a.behavior === 'walk');
    if (walking.length === 0) return;
    const t = setTimeout(() => {
      setActors((prev) => prev.map((a) => (a.behavior === 'walk' ? { ...a, behavior: 'idle' } : a)));
    }, Math.max(...walking.map((a) => a.moveMs)));
    return () => clearTimeout(t);
  }, [actors]);

  const react = (uid: string) => setActors((prev) => prev.map((a) => (a.uid === uid ? { ...a, behavior: 'play', reactAt: Date.now() } : a)));
  return { actors, react };
}

function SceneBackdrop({ night }: { night: boolean }) {
  return (
    <svg className="scene-bg" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          {night ? <><stop offset="0" stopColor="#241a5c" /><stop offset="1" stopColor="#5a4aa8" /></> : <><stop offset="0" stopColor="#9fd8ff" /><stop offset="1" stopColor="#ffe4f2" /></>}
        </linearGradient>
        <linearGradient id="hillA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={night ? '#3e6a6a' : '#8fe0a0'} /><stop offset="1" stopColor={night ? '#2a4a52' : '#5fc47e'} /></linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={night ? '#3a6a5a' : '#a8eb9a'} /><stop offset="1" stopColor={night ? '#264a40' : '#74cf7a'} /></linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#sky)" />
      {night ? (
        <g>
          {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 197) % 800} cy={(i * 71) % 170} r={i % 4 === 0 ? 1.8 : 1} fill="white" className="star-twinkle" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />)}
          <path d="M690 40a34 34 0 1 0 22 60 28 28 0 1 1-22-60Z" fill="#fff3c4" />
        </g>
      ) : (
        <g>
          <circle cx="680" cy="70" r="38" fill="#fff3b0" /><circle cx="680" cy="70" r="54" fill="#fff3b0" opacity=".3" />
          <g fill="white" opacity=".9" className="cloud-drift"><ellipse cx="160" cy="70" rx="50" ry="18" /><ellipse cx="190" cy="58" rx="30" ry="18" /><ellipse cx="460" cy="110" rx="40" ry="14" /><ellipse cx="482" cy="100" rx="24" ry="14" /></g>
        </g>
      )}
      <path d="M0 210C120 150 240 170 340 200C460 236 560 150 800 190V400H0Z" fill="url(#hillA)" />
      <path d="M0 250C160 220 300 240 420 236C560 232 680 216 800 236V400H0Z" fill="url(#ground)" />
      {[[70, 214, 1], [740, 206, 1.2], [600, 218, 0.8]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x="-5" y="-6" width="10" height="34" rx="4" fill={night ? '#4a3a3a' : '#a0714a'} />
          <circle cx="0" cy="-24" r="28" fill={night ? '#2f5a4a' : '#5fc47e'} /><circle cx="-16" cy="-12" r="18" fill={night ? '#2a5040' : '#4fb46e'} /><circle cx="16" cy="-14" r="20" fill={night ? '#356a52' : '#6fd48a'} />
        </g>
      ))}
      <ellipse cx="640" cy="340" rx="110" ry="30" fill={night ? '#3a5aa8' : '#7fd0ff'} opacity=".85" />
      <ellipse cx="620" cy="334" rx="60" ry="9" fill="white" opacity=".35" />
      {[[120, 300], [260, 360], [420, 320], [520, 370], [330, 290]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>{[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-4" rx="3" ry="4" fill={['#ff9fd0', '#ffe066', '#c6a7ff', '#ffffff', '#ff9a6a'][i]} transform={`rotate(${r})`} />)}<circle r="2" fill="#ffc23d" /></g>
      ))}
    </svg>
  );
}

function SanctuaryScene({ creatures }: { creatures: CreatureInstance[] }) {
  const now = useNow();
  const night = isNight(new Date(now).getHours());
  const shown = useMemo(() => [...creatures].sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.hatchedAt - a.hatchedAt).slice(0, MAX_ACTORS), [creatures]);
  const { actors, react } = useActors(shown, night);
  const openModal = useUi((s) => s.openModal);
  const byId = useMemo(() => new Map(shown.map((c) => [c.uid, c])), [shown]);

  return (
    <div className={`scene ${night ? 'night' : ''}`}>
      <SceneBackdrop night={night} />
      {actors.map((a) => {
        const c = byId.get(a.uid);
        if (!c) return null;
        const anim = a.behavior === 'walk' ? 'walk' : a.behavior === 'sleep' ? 'sleep' : 'idle';
        return (
          <button
            key={a.uid}
            className={`actor b-${a.behavior}`}
            style={{ left: `${a.x}%`, top: `${a.y}%`, zIndex: Math.round(a.y), transitionDuration: `${a.moveMs}ms, ${a.moveMs}ms` }}
            onClick={() => { playSfx('tap'); react(a.uid); openModal({ kind: 'creature', uid: c.uid }); }}
            aria-label={`${displayName(c)} — ${a.behavior === 'sleep' ? 'dort' : a.behavior === 'eat' ? 'mange' : a.behavior === 'play' ? 'joue' : a.behavior === 'walk' ? 'se promène' : 'se repose'}`}
          >
            <div className="actor-flip" style={{ transform: a.flip ? 'scaleX(-1)' : undefined }}>
              <CreatureArt speciesId={c.speciesId} mutations={c.mutations} hue={c.genes.hue} size={84} anim={anim} seed={c.uid} />
            </div>
            {a.behavior === 'eat' && <span className="actor-bubble"><i /></span>}
            {a.reactAt > 0 && Date.now() - a.reactAt < 1500 && <span className="actor-heart" key={a.reactAt}><Icon name="heartFill" /></span>}
            <span className="actor-name">{displayName(c)}</span>
          </button>
        );
      })}
      {creatures.length > MAX_ACTORS && <div className="scene-note">+{creatures.length - MAX_ACTORS} autres créatures se reposent dans les habitats</div>}
    </div>
  );
}

function RewardLine({ r }: { r: Reward }) {
  return (
    <div className="reward-line">
      {r.coins ? <span><CurrencyIcon currency="coins" />{r.coins}</span> : null}
      {r.crystals ? <span><CurrencyIcon currency="crystals" />{r.crystals}</span> : null}
      {r.essence ? <span><CurrencyIcon currency="essence" />{r.essence}</span> : null}
      {Object.entries(r.items ?? {}).map(([id, q]) => <span key={id}><i className="item-dot" style={{ background: ITEMS[id]?.color }} />{ITEMS[id]?.name} ×{q}</span>)}
      {(r.eggs ?? []).map((e, i) => <span key={i}><Icon name="egg" />{EGGS[e]?.name}</span>)}
    </div>
  );
}

function QuestCard() {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const q = activeQuest(state);
  if (!q) {
    return (
      <div className="card">
        <div className="card-title"><Icon name="trophy" /><h3>Quête principale</h3></div>
        <p className="soft">Tu as terminé tous les chapitres disponibles ! De nouveaux chapitres arriveront avec l'Exploration (Phase 4).</p>
      </div>
    );
  }
  const pr = questProgress(state, q);
  return (
    <div className={`card quest-card ${pr.done ? 'done' : ''}`}>
      <div className="card-title"><Icon name="scroll" /><h3>Quête principale</h3><span className="spacer" /><span className="badge soft-badge">{state.quests.claimed.length + 1}/14</span></div>
      <div className="quest-chapter">{q.chapter}</div>
      <h4 className="quest-title">{q.title}</h4>
      <p className="soft" style={{ fontSize: 14 }}>{q.description}</p>
      <div className="row" style={{ marginTop: 10 }}><Bar value={pr.current / pr.target} /><span className="num" style={{ fontWeight: 800, fontSize: 13 }}>{pr.current}/{pr.target}</span></div>
      <div className="quest-reward"><span className="muted" style={{ fontSize: 12, fontWeight: 800 }}>RÉCOMPENSE</span><RewardLine r={q.reward} /></div>
      <button className="btn btn-mint btn-block" disabled={!pr.done} onClick={() => dispatch({ type: 'claimQuest', questId: q.id })}>
        {pr.done ? <><Icon name="gift" />Récupérer</> : 'En cours…'}
      </button>
    </div>
  );
}

function DailyCard() {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const now = useNow();
  const dayKey = dayKeyOf(new Date(now));
  const can = canClaimDaily(state, dayKey);
  const streak = can ? nextStreak(state, dayKey) : state.daily.streak;
  const reward = dailyReward(streak);
  const tomorrow = new Date(now); tomorrow.setHours(24, 0, 0, 0);
  return (
    <div className={`card daily-card ${can ? 'available' : ''}`}>
      <div className="card-title"><Icon name="gift" /><h3>Récompense du jour</h3></div>
      <div className="streak">
        {Array.from({ length: 7 }, (_, i) => {
          const day = ((streak - 1) % 7) + 1;
          return <span key={i} className={`streak-dot ${i < day - (can ? 1 : 0) ? 'got' : ''} ${can && i === day - 1 ? 'today' : ''} ${i === 6 ? 'big' : ''}`}>{i + 1}</span>;
        })}
      </div>
      <p className="soft" style={{ fontSize: 13, margin: '8px 0' }}>Série : <b>{streak} jour{streak > 1 ? 's' : ''}</b>. Le 7ᵉ jour donne des cristaux.</p>
      <RewardLine r={reward} />
      <button className="btn btn-gold btn-block" style={{ marginTop: 12 }} disabled={!can} onClick={() => dispatch({ type: 'claimDaily' })}>
        {can ? <><Icon name="gift" />Récupérer</> : <>Prochaine dans {formatDuration(tomorrow.getTime() - now)}</>}
      </button>
    </div>
  );
}

function DiscoveriesCard() {
  const discoveries = useGame((s) => s.state.discoveries);
  const openModal = useUi((s) => s.openModal);
  const list = discoveries.slice(-5).reverse();
  return (
    <div className="card">
      <div className="card-title"><Icon name="sparkle" /><h3>Dernières découvertes</h3></div>
      {list.length === 0 ? <p className="soft" style={{ fontSize: 14 }}>Fais éclore un œuf pour enregistrer ta première découverte dans l'Ovidex.</p> : (
        <div className="disc-list">
          {list.map((d, i) => (
            <button key={i} className="disc-item" onClick={() => openModal({ kind: 'dex', speciesId: d.speciesId })}>
              <CreatureArt speciesId={d.speciesId} mutations={d.mutationId ? [d.mutationId] : []} size={40} anim="none" />
              <div><b>{getSpecies(d.speciesId).name}</b><div className="muted" style={{ fontSize: 12 }}>{d.kind === 'species' ? 'Nouvelle espèce' : `Variante ${MUTATIONS[d.mutationId!]?.name}`} · {new Date(d.at).toLocaleDateString('fr-FR')}</div></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SanctuaryScreen() {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const navigate = useUi((s) => s.navigate);
  const now = useNow();
  const pending = pendingHarvest(state, now);
  const rate = totalHarvestRate(state);
  const capFill = Math.min(1, (now - state.sanctuary.lastHarvestAt) / BALANCE.harvestCapMs);

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="card scene-card">
        <div className="scene-head">
          <div>
            <h2>Sanctuaire de {state.player.name}</h2>
            <p className="soft" style={{ fontSize: 14 }}>{state.creatures.length} créature{state.creatures.length > 1 ? 's' : ''} · touche une créature pour interagir</p>
          </div>
        </div>
        {state.creatures.length > 0 ? <SanctuaryScene creatures={state.creatures} /> : (
          <div className="scene empty-scene">
            <SceneBackdrop night={isNight(new Date(now).getHours())} />
            <div className="empty-scene-msg">
              <h3>Ton sanctuaire attend ses premiers habitants</h3>
              <p>Tu as reçu {state.eggs.length} œuf{state.eggs.length > 1 ? 's' : ''} de bienvenue. Place-les dans l'incubateur !</p>
              <button className="btn btn-pink btn-lg" onClick={() => navigate('incubateur')}><Icon name="egg" />Aller à l'incubateur</button>
            </div>
          </div>
        )}
        <div className="harvest">
          <div className="harvest-info">
            <CurrencyIcon currency="coins" width={36} height={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row"><b className="num" style={{ fontSize: 20 }}>{pending.toLocaleString('fr-FR')}</b><span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>pièces produites · {rate}/h</span></div>
              <Bar value={capFill} size="thin" fill="linear-gradient(90deg,#ffc23d,#ff9a3d)" label="Remplissage du stockage" />
              <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>Stockage plein après {BALANCE.harvestCapMs / HOUR} h — pense à revenir !</div>
            </div>
          </div>
          <button className="btn btn-gold" disabled={pending <= 0} onClick={() => dispatch({ type: 'harvest' })}><Icon name="harvest" />Récolter</button>
        </div>
      </div>

      <div className="sanct-grid">
        <QuestCard />
        <DailyCard />
        <DiscoveriesCard />
      </div>
    </div>
  );
}
