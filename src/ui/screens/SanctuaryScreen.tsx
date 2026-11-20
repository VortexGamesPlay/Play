import { useEffect, useMemo, useRef, useState } from 'react';
import { THEMES } from '@data/buildings';
import { isAway } from '@core/systems/exploration';
import { pendingProduce } from '@core/systems/sanctuary';
import { sanctuaryWeather } from '@core/systems/weather';
import { WEATHER_ICON, WeatherFx } from '../art/Scenery';
import { darken } from '../art/color';
import { BuildPanel, MissionsCard } from './SanctuaryPanels';
import { BALANCE } from '@data/balance';
import { EGGS } from '@data/eggs';
import { ITEMS } from '@data/items';
import { MUTATIONS } from '@data/mutations';
import { displayName, getSpecies } from '@core/systems/creatures';
import { canClaimDaily, dailyReward, nextStreak } from '@core/systems/daily';
import { activeQuest, questProgress } from '@core/systems/quests';
import { pendingHarvest, totalHarvestRate } from '@core/systems/sanctuary';
import { dayKeyOf, formatDuration, HOUR, isNight } from '@core/time';
import type { GameState, CreatureInstance } from '@core/types';
import type { Reward } from '@core/content';
import { CreatureArt } from '../art/CreatureArt';
import { CurrencyIcon, Icon } from '../art/Icons';
import { Bar } from '../components/Bar';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { useNow } from '../hooks/useNow';
import { playSfx } from '../../services/audio';
import { keeperName } from '../format';
import { tr, intlLocale, tp } from '../../i18n';

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

/** Fond du sanctuaire : terrain choisi, jour/nuit, bâtiments construits et décorations. */
function SceneBackdrop({ night, sanctuary }: { night: boolean; sanctuary?: Partial<GameState['sanctuary']> }) {
  const own = useGame((s) => s.state.sanctuary);
  const sanct = (sanctuary
    ? { ...own, theme: sanctuary.theme ?? own.theme, buildings: sanctuary.buildings ?? {}, decorations: sanctuary.decorations ?? {} }
    : own) as GameState['sanctuary'];
  const level = (id: string) => sanct.buildings[id] ?? 0;
  const t = THEMES[sanct.theme] ?? THEMES.prairie!;
  const sky = night ? t.nightSky : t.sky;
  const shade = (c: string) => (night ? darken(c, 28) : c);
  const deco = (id: string) => sanct.decorations[id] === true;
  return (
    <svg className="scene-bg" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} /></linearGradient>
        <linearGradient id="hillA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={shade(t.hill[0])} /><stop offset="1" stopColor={shade(t.hill[1])} /></linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={shade(t.ground[0])} /><stop offset="1" stopColor={shade(t.ground[1])} /></linearGradient>
        <linearGradient id="sanctuaryPlateau" x1="0" y1="0" x2="0.15" y2="1"><stop offset="0" stopColor={shade(t.ground[0])} /><stop offset="1" stopColor={shade(t.ground[1])} /></linearGradient>
        <linearGradient id="sanctuaryEdge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={shade(darken(t.hill[1], 20))} /><stop offset="1" stopColor={shade(darken(t.hill[1], 34))} /></linearGradient>
        <linearGradient id="sanctuaryPath" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ead9b2" /><stop offset="1" stopColor="#c9aa7b" /></linearGradient>
        <linearGradient id="sanctuaryWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b6efff" /><stop offset="1" stopColor="#4fa9d6" /></linearGradient>
        <clipPath id="sanctuaryGroundClip"><path d="M28 267L399 176L772 267L400 405Z" /></clipPath>
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
      {level('observatoire') > 0 && (
        <g transform="translate(520 178)"><rect x="-16" y="-10" width="32" height="40" rx="4" fill={shade('#e8e0ff')} /><path d="M-22-10a22 22 0 0 1 44 0Z" fill={shade('#7b5cff')} /><rect x="2" y="-30" width="22" height="7" rx="3" fill={shade('#5a3ee0')} transform="rotate(-30 2 -30)" />{night && <circle cx="0" cy="8" r="5" fill="#ffe680" />}</g>
      )}
      <path d="M0 250C160 220 300 240 420 236C560 232 680 216 800 236V400H0Z" fill="url(#ground)" />
      {/* Plateau isométrique : un lieu construit en profondeur, sans modèles 3D. */}
      <g className="sanctuary-island">
        <path d="M28 267L399 176L772 267L400 405Z" fill="url(#sanctuaryEdge)" opacity=".95" />
        <path d="M28 267L399 176L772 267L400 386Z" fill="url(#sanctuaryPlateau)" stroke="#d2efb0" strokeWidth="3" />
        <g clipPath="url(#sanctuaryGroundClip)">
          <path d="M-30 286C120 240 210 250 315 278S520 322 830 246" fill="none" stroke="#d9edaa" strokeWidth="2" opacity=".22" />
          <path d="M60 312L400 226L735 310" fill="none" stroke="#e8f3c6" strokeWidth="1.5" strokeDasharray="5 12" opacity=".2" />
          <path d="M110 267C190 276 225 316 320 321C415 326 474 271 570 269C632 268 674 284 710 302" fill="none" stroke="#416f57" strokeWidth="43" strokeLinecap="round" opacity=".28" />
          <path d="M110 260C190 269 225 309 320 314C415 319 474 264 570 262C632 261 674 277 710 295" fill="none" stroke="url(#sanctuaryPath)" strokeWidth="34" strokeLinecap="round" />
          <path d="M110 255C190 264 225 304 320 309C415 314 474 259 570 257C632 256 674 272 710 290" fill="none" stroke="#f6e8c9" strokeWidth="2" strokeDasharray="3 13" strokeLinecap="round" opacity=".7" />
          <path d="M80 335L202 305L250 322L127 355Z" fill={shade(t.hill[1])} opacity=".6" />
          <path d="M500 346L624 310L700 339L576 375Z" fill={shade(t.hill[1])} opacity=".65" />
          <path d="M295 245L372 226L421 244L344 264Z" fill="#b9e48c" opacity=".55" />
          <path d="M550 221L623 203L663 218L590 237Z" fill="#b9e48c" opacity=".5" />
          <path d="M80 280C118 269 145 268 170 274" fill="none" stroke="#d8f1b1" strokeWidth="5" strokeLinecap="round" opacity=".5" />
          <path d="M635 321C660 311 681 306 706 311" fill="none" stroke="#d8f1b1" strokeWidth="5" strokeLinecap="round" opacity=".5" />
          {Array.from({ length: 18 }, (_, i) => <ellipse key={`grass-${i}`} cx={75 + (i * 83) % 650} cy={260 + (i * 47) % 100} rx="2.2" ry="5" fill={i % 2 ? shade(t.hill[0]) : shade(t.hill[1])} opacity=".55" transform={`rotate(${i * 23} ${75 + (i * 83) % 650} ${260 + (i * 47) % 100})`} />)}
        </g>
        <path d="M28 267L399 386L400 405L28 286Z" fill={shade(darken(t.hill[1], 20))} opacity=".45" />
        <path d="M400 386L772 267L772 286L400 405Z" fill={shade(darken(t.hill[1], 32))} opacity=".55" />
        <path d="M38 268L399 181L761 268" fill="none" stroke="#eff8cf" strokeWidth="2" opacity=".5" />
        <g opacity=".9"><path d="M165 283l18-12 18 7-18 13Z" fill="#d8c8a1" /><path d="M183 291v-8l18-5v8Z" fill="#9b896c" /><path d="M650 283l15-10 17 6-16 11Z" fill="#d8c8a1" /><path d="M666 290v-8l16-3v8Z" fill="#9b896c" /><path d="M335 354l20-12 19 7-20 13Z" fill="#d8c8a1" /><path d="M354 362v-8l20-5v8Z" fill="#9b896c" /></g>
        <path d="M575 322C600 304 632 306 657 317C677 326 679 341 657 350C631 361 596 355 577 343C564 335 564 328 575 322Z" fill="#367fa7" opacity=".55" />
        <path d="M572 316C596 300 631 302 655 313C676 323 676 337 654 346C629 356 595 350 575 338C561 330 561 323 572 316Z" fill="url(#sanctuaryWater)" stroke="#d5f7ff" strokeWidth="2" />
        <path d="M585 320C604 312 626 313 643 320" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".55" className="star-twinkle" />
        <path d="M578 329C596 337 618 340 640 333" fill="none" stroke="#d8fbff" strokeWidth="2" strokeLinecap="round" opacity=".65" />
      </g>
      {[[70, 214, 1], [740, 206, 1.2], [600, 218, 0.8]].map(([x, y, k], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
          <rect x="-5" y="-6" width="10" height="34" rx="4" fill={shade('#a0714a')} />
          <circle cx="0" cy="-24" r="28" fill={shade(t.hill[1])} /><circle cx="-16" cy="-12" r="18" fill={shade(darken(t.hill[1], 6))} /><circle cx="16" cy="-14" r="20" fill={shade(t.hill[0])} />
        </g>
      ))}
      {Array.from({ length: Math.min(5, level('nichoirs')) }, (_, i) => (
        <g key={`n${i}`} transform={`translate(${150 + i * 34} ${244 - (i % 2) * 6}) scale(.8)`}><rect x="-12" y="-14" width="24" height="20" rx="3" fill={shade('#f6e2c0')} /><path d="M-16-12L0-28L16-12Z" fill={shade('#d9505a')} /><circle cx="0" cy="-5" r="4" fill={shade('#5a3a2a')} /></g>
      ))}
      <ellipse cx="640" cy="340" rx={110 + level('bassin') * 14} ry={30 + level('bassin') * 4} fill={night ? '#3a5aa8' : '#7fd0ff'} opacity=".85" />
      <ellipse cx="620" cy="334" rx="60" ry="9" fill="white" opacity=".35" />
      {level('bassin') > 0 && <g fill="#c8f0ff">{[600, 660, 700].map((x, i) => <circle key={i} className="bubble-up" style={{ animationDelay: `${i}s` }} cx={x} cy="340" r="3" />)}</g>}
      {level('fournaise') > 0 && (
        <g transform="translate(95 300)"><path d="M-34 20L-20-16H20L34 20Z" fill={shade('#5a3a3a')} /><ellipse cx="0" cy="-16" rx="20" ry="6" fill="#ff8a3d" className="lava-glow" /><circle cx="0" cy="-34" r={6 + level('fournaise') * 2} fill="#ffb03d" opacity=".5" className="lava-glow" /></g>
      )}
      {level('jardin') > 0 && (
        <g transform="translate(330 330)">{Array.from({ length: 2 + level('jardin') }, (_, i) => <g key={i} transform={`translate(${i * 22} ${(i % 2) * 6})`}><rect x="-8" y="-2" width="16" height="10" rx="3" fill={shade('#8a5a3a')} /><circle cx="0" cy="-6" r="6" fill={shade('#5fc47e')} /><circle cx="3" cy="-8" r="2.5" fill="#ff6f91" /></g>)}</g>
      )}
      {deco('lanternes') && [[260, 200], [430, 190], [560, 205]].map(([x, y], i) => <g key={`l${i}`} className="float-island" style={{ animationDelay: `${i}s` }}><g transform={`translate(${x} ${y})`}><rect x="-6" y="-8" width="12" height="15" rx="4" fill="#ffc85a" /><circle r={night ? 16 : 10} fill="#ffc85a" opacity=".3" /></g></g>)}
      {deco('arche') && <g transform="translate(470 300)"><path d="M-30 30V0A30 30 0 0 1 30 0V30" stroke={shade('#7fb05a')} strokeWidth="6" fill="none" />{[-26, -14, 0, 14, 26].map((x, i) => <circle key={i} cx={x} cy={-Math.sqrt(Math.max(0, 900 - x * x)) + 2} r="5" fill={['#ff9fd0', '#ffe066', '#c6a7ff', '#ff9fd0', '#ffe066'][i]} />)}</g>}
      {deco('statue') && <g transform="translate(400 280)"><rect x="-16" y="10" width="32" height="10" rx="2" fill={shade('#c8c0e0')} /><path d="M0-24C14-24 20-6 20 2C20 12 12 14 0 14C-12 14-20 12-20 2C-20-6-14-24 0-24Z" fill={shade('#e8e0ff')} /><path d="M-14 0l6 4 5-5 5 5 6-4" stroke={shade('#b8a6f0')} strokeWidth="2" fill="none" /></g>}
      {deco('champignons') && [[210, 360], [235, 368], [190, 372]].map(([x, y], i) => <g key={`m${i}`} transform={`translate(${x} ${y})`}><rect x="-3" y="-8" width="6" height="10" fill="#f0e6d8" /><path d="M-11-6a11 9 0 0 1 22 0Z" fill="#c46fe0" /></g>)}
      {deco('cristaux') && <g transform="translate(540 360)">{[[-14, 0, 1], [0, -6, 1.3], [14, 2, 0.9]].map(([x, y, k], i) => <path key={i} transform={`translate(${x} ${y}) scale(${k})`} d="M0-22L7-4L0 6L-7-4Z" fill="#9fe8ff" stroke="white" strokeWidth="1.5" />)}</g>}
      {deco('banc') && <g transform="translate(300 290)"><rect x="-26" y="-6" width="52" height="7" rx="3" fill={shade('#c08a52')} /><rect x="-24" y="-16" width="48" height="6" rx="3" fill={shade('#a8743f')} /><rect x="-22" y="0" width="4" height="10" fill={shade('#8a5a3a')} /><rect x="18" y="0" width="4" height="10" fill={shade('#8a5a3a')} /></g>}
      {deco('fontaine') && <g transform="translate(380 368)"><ellipse rx="30" ry="9" fill={shade('#c8c0e0')} /><ellipse cy="-2" rx="24" ry="6" fill="#7fd0ff" /><rect x="-4" y="-26" width="8" height="24" fill={shade('#d8d0f0')} /><circle cy="-30" r="6" fill="#7fd0ff" className="lava-glow" /></g>}
      {deco('guirlande') && <g><path d="M60 120Q400 190 760 110" stroke={shade('#8a7a6a')} strokeWidth="2" fill="none" />{Array.from({ length: 14 }, (_, i) => <circle key={i} cx={60 + i * 50} cy={120 + Math.sin((i / 13) * Math.PI) * 40 - i * 0.7} r="4" fill="#ffe680" className="star-twinkle" style={{ animationDelay: `${i * 0.2}s` }} />)}</g>}
      {[[120, 300], [260, 360], [420, 320], [520, 370], [330, 290]].map(([x, y], i) => (
        <g key={`f${i}`} transform={`translate(${x} ${y})`}>{[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-4" rx="3" ry="4" fill={['#ff9fd0', '#ffe066', '#c6a7ff', '#ffffff', '#ff9a6a'][i]} transform={`rotate(${r})`} />)}<circle r="2" fill="#ffc23d" /></g>
      ))}
    </svg>
  );
}

/** Scène vivante du sanctuaire. `visit` : sanctuaire d'un ami (lecture seule, ses décorations à lui). */
export function SanctuaryScene({ creatures, visit }: { creatures: CreatureInstance[]; visit?: Partial<GameState['sanctuary']> }) {
  const now = useNow();
  const night = isNight(new Date(now).getHours());
  const weather = sanctuaryWeather(now);
  const shown = useMemo(() => [...creatures].sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.hatchedAt - a.hatchedAt).slice(0, MAX_ACTORS), [creatures]);
  const { actors, react } = useActors(shown, night);
  const openModal = useUi((s) => s.openModal);
  const byId = useMemo(() => new Map(shown.map((c) => [c.uid, c])), [shown]);

  return (
    <div className={`scene ${night ? 'night' : ''}`}>
      <SceneBackdrop night={night} sanctuary={visit} />
      <WeatherFx fx={weather.fx} density={0.7} />
      {actors.map((a) => {
        const c = byId.get(a.uid);
        if (!c) return null;
        const anim = a.behavior === 'walk' ? 'walk' : a.behavior === 'sleep' ? 'sleep' : 'idle';
        return (
          <button
            key={a.uid}
            className={`actor b-${a.behavior}`}
            style={{ left: `${a.x}%`, top: `${a.y}%`, zIndex: Math.round(a.y), transitionDuration: `${a.moveMs}ms, ${a.moveMs}ms` }}
            onClick={() => { playSfx('happy'); react(a.uid); if (!visit) openModal({ kind: 'creature', uid: c.uid }); }}
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
      {!visit && creatures.length > MAX_ACTORS && <div className="scene-note">+{creatures.length - MAX_ACTORS} {tr('autres créatures se reposent dans les habitats')}</div>}
    </div>
  );
}

function RewardLine({ r }: { r: Reward }) {
  return (
    <div className="reward-line">
      {r.coins ? <span><CurrencyIcon currency="coins" />{r.coins}</span> : null}
      {r.crystals ? <span><CurrencyIcon currency="crystals" />{r.crystals}</span> : null}
      {r.essence ? <span><CurrencyIcon currency="essence" />{r.essence}</span> : null}
      {Object.entries(r.items ?? {}).map(([id, q]) => <span key={id}><i className="item-dot" style={{ background: ITEMS[id]?.color }} />{ITEMS[id]?.name} {tr('×')}{q}</span>)}
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
        <div className="card-title"><Icon name="trophy" /><h3>{tr('Quête principale')}</h3></div>
        <p className="soft">{tr('Tu as terminé tous les chapitres disponibles ! De nouveaux chapitres arriveront avec l\'Exploration (Phase 4).')}</p>
      </div>
    );
  }
  const pr = questProgress(state, q);
  return (
    <div className={`card quest-card ${pr.done ? 'done' : ''}`}>
      <div className="card-title"><Icon name="scroll" /><h3>{tr('Quête principale')}</h3><span className="spacer" /><span className="badge soft-badge">{state.quests.claimed.length + 1}/14</span></div>
      <div className="quest-chapter">{q.chapter}</div>
      <h4 className="quest-title">{q.title}</h4>
      <p className="soft" style={{ fontSize: 14 }}>{q.description}</p>
      <div className="row" style={{ marginTop: 10 }}><Bar value={pr.current / pr.target} /><span className="num" style={{ fontWeight: 800, fontSize: 13 }}>{pr.current}/{pr.target}</span></div>
      <div className="quest-reward"><span className="muted" style={{ fontSize: 12, fontWeight: 800 }}>{tr('RÉCOMPENSE')}</span><RewardLine r={q.reward} /></div>
      <button className="btn btn-mint btn-block" disabled={!pr.done} onClick={() => dispatch({ type: 'claimQuest', questId: q.id })}>
        {pr.done ? <><Icon name="gift" />{tr('Récupérer')}</> : tr('En cours…')}
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
      <div className="card-title"><Icon name="gift" /><h3>{tr('Récompense du jour')}</h3></div>
      <div className="streak">
        {Array.from({ length: 7 }, (_, i) => {
          const day = ((streak - 1) % 7) + 1;
          return <span key={i} className={`streak-dot ${i < day - (can ? 1 : 0) ? 'got' : ''} ${can && i === day - 1 ? 'today' : ''} ${i === 6 ? 'big' : ''}`}>{i + 1}</span>;
        })}
      </div>
      <p className="soft" style={{ fontSize: 13, margin: '8px 0' }}>{tr('Série :')} <b>{tp(streak, '{n} jour', '{n} jours')}</b>{tr('. Le 7ᵉ jour donne des cristaux.')}</p>
      <RewardLine r={reward} />
      <button className="btn btn-gold btn-block" style={{ marginTop: 12 }} disabled={!can} onClick={() => dispatch({ type: 'claimDaily' })}>
        {can ? <><Icon name="gift" />{tr('Récupérer')}</> : <>{tr('Prochaine dans')} {formatDuration(tomorrow.getTime() - now)}</>}
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
      <div className="card-title"><Icon name="sparkle" /><h3>{tr('Dernières découvertes')}</h3></div>
      {list.length === 0 ? <p className="soft" style={{ fontSize: 14 }}>{tr('Fais éclore un œuf pour enregistrer ta première découverte dans le Bestiaire.')}</p> : (
        <div className="disc-list">
          {list.map((d, i) => (
            <button key={i} className="disc-item" onClick={() => openModal({ kind: 'dex', speciesId: d.speciesId })}>
              <CreatureArt speciesId={d.speciesId} mutations={d.mutationId ? [d.mutationId] : []} size={40} anim="none" />
              <div><b>{getSpecies(d.speciesId).name}</b><div className="muted" style={{ fontSize: 12 }}>{d.kind === 'species' ? tr('Nouvelle espèce') : tr('Variante {name}', { name: MUTATIONS[d.mutationId!]?.name })} · {new Date(d.at).toLocaleDateString(intlLocale())}</div></div>
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
  const present = state.creatures.filter((c) => !isAway(state, c.uid));
  const produce = pendingProduce(state, now);
  const hasProduce = (produce.essence ?? 0) > 0 || Object.keys(produce.items ?? {}).length > 0;
  const [tab, setTab] = useState<'vue' | 'amenager'>('vue');
  const weather = sanctuaryWeather(now);

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="card scene-card">
        <div className="scene-head">
          <div>
            <h2>{tr('Sanctuaire de')} {keeperName(state.player.name)}</h2>
            <p className="soft" style={{ fontSize: 14 }}>{tp(present.length, '{n} présente', '{n} présentes')}{state.expeditions.length ? tr(' · {p0} en expédition', { p0: state.creatures.length - present.length }) : ''} · <Icon name={WEATHER_ICON[weather.fx]} width={14} height={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> {weather.name}</p>
          </div>
          <span className="spacer" />
          <div className="tabs" style={{ flex: 'none' }}>
            <button className={tab === 'vue' ? 'active' : ''} onClick={() => setTab('vue')}><Icon name="sanctuary" width={16} height={16} />{tr('Vue')}</button>
            <button className={tab === 'amenager' ? 'active' : ''} onClick={() => setTab('amenager')}><Icon name="hammer" width={16} height={16} />{tr('Aménager')}</button>
          </div>
        </div>
        {present.length > 0 ? <SanctuaryScene creatures={present} /> : state.creatures.length > 0 ? (
          <div className="scene empty-scene"><SceneBackdrop night={isNight(new Date(now).getHours())} />
            <div className="empty-scene-msg"><h3>{tr('Tout le monde est en expédition')}</h3><p>{tr('Le sanctuaire est bien calme… Tes créatures reviendront bientôt avec leur butin.')}</p><button className="btn" onClick={() => navigate('exploration')}><Icon name="compass" />{tr('Voir les expéditions')}</button></div>
          </div>
        ) : (
          <div className="scene empty-scene">
            <SceneBackdrop night={isNight(new Date(now).getHours())} />
            <div className="empty-scene-msg">
              <h3>{tr('Ton sanctuaire attend ses premiers habitants')}</h3>
              <p>{tp(state.eggs.length, 'Tu as reçu {n} œuf de bienvenue. Place-le dans l\'incubateur !', 'Tu as reçu {n} œufs de bienvenue. Place-les dans l\'incubateur !')}</p>
              <button className="btn btn-pink btn-lg" onClick={() => navigate('incubateur')}><Icon name="egg" />{tr('Aller à l\'incubateur')}</button>
            </div>
          </div>
        )}
        <div className="harvest">
          <div className="harvest-info">
            <CurrencyIcon currency="coins" width={36} height={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row"><b className="num" style={{ fontSize: 20 }}>{pending.toLocaleString(intlLocale())}</b><span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>{tr('pièces produites ·')} {rate}/h</span></div>
              <Bar value={capFill} size="thin" fill="linear-gradient(90deg,#ffc23d,#ff9a3d)" label={tr('Remplissage du stockage')} />
              <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{tr('Stockage plein après')} {BALANCE.harvestCapMs / HOUR} {tr('h — pense à revenir !')}</div>
            </div>
          </div>
          {hasProduce && <div className="harvest-extra"><span className="muted" style={{ fontSize: 12, fontWeight: 800 }}>{tr('+ BÂTIMENTS')}</span><RewardLine r={produce} /></div>}
          <button className="btn btn-gold" disabled={pending <= 0 && !hasProduce} onClick={() => dispatch({ type: 'harvest' })}><Icon name="harvest" />{tr('Récolter')}</button>
        </div>
      </div>

      {tab === 'amenager' && <BuildPanel />}
      <div className="sanct-grid">
        <MissionsCard />
        <QuestCard />
        <DailyCard />
        <DiscoveriesCard />
      </div>
    </div>
  );
}
