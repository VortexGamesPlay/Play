import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { BIOME_BY_ID } from '@data/biomes';
import { BOSSES, LEAGUES } from '@data/arena';
import { ELEMENTS } from '@data/elements';
import { SKILLS } from '@data/skills';
import { STATUSES, type StatusId } from '@data/statuses';
import { act, canUse, chooseAction, createBattle, legalTargets, type BattleInput, type BattleState, type LogEntry, type Unit } from '@core/combat/engine';
import type { GameEvent } from '@core/events';
import { CreatureArt } from '../art/CreatureArt';
import { ElementIcon, Icon } from '../art/Icons';
import { BiomeScenery } from '../art/Scenery';
import { RewardList } from '../screens/ExplorationScreen';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { COMBAT_SFX, playSfx, preloadSfx, SKILL_ELEMENTS, type Sfx } from '../../services/audio';
import { tr, tp } from '../../i18n';

interface UnitView { hp: number; alive: boolean; statuses: StatusId[] }
interface Floater { id: number; key: string; text: string; kind: 'dmg' | 'crit' | 'heal' | 'info' }

const STEP_MS = 520;
let floaterId = 0;

function initialView(b: BattleState): Record<string, UnitView> {
  return Object.fromEntries(b.units.map((u) => [u.key, { hp: u.maxHp, alive: true, statuses: [] }]));
}

function BattleBackdrop({ kind, refId }: { kind: string; refId: string }) {
  if (kind === 'boss') {
    const boss = BOSSES.find((b) => b.id === refId);
    const biome = boss && BIOME_BY_ID[boss.biomeId];
    if (biome) return <div className="battle-bg"><BiomeScenery biome={biome} /></div>;
  }
  const color = kind === 'league' ? LEAGUES.find((l) => l.fights.some((f) => f.id === refId))?.color ?? '#7b5cff' : '#5a4aa8';
  return (
    <div className="battle-bg" style={{ ['--lc' as string]: color } as CSSProperties}>
      <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="arena-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={kind === 'tower' ? '#1d1650' : '#bfe0ff'} /><stop offset="1" stopColor={kind === 'tower' ? '#5a4aa8' : '#fff0f6'} /></linearGradient>
        </defs>
        <rect width="800" height="400" fill="url(#arena-sky)" />
        {kind === 'tower' && Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 197) % 800} cy={(i * 71) % 200} r={i % 4 ? 1 : 2} fill="white" className="star-twinkle" />)}
        <ellipse cx="400" cy="330" rx="420" ry="120" fill={kind === 'tower' ? '#3a2f6e' : '#cfe8b8'} />
        <ellipse cx="400" cy="330" rx="300" ry="78" fill="none" stroke={color} strokeWidth="6" opacity=".6" />
        {[-260, -130, 130, 260].map((dx, i) => <g key={i} transform={`translate(${400 + dx} ${215 + Math.abs(dx) / 8})`}><rect x="-14" y="-60" width="28" height="64" rx="6" fill={kind === 'tower' ? '#2a2050' : '#d8d0c0'} /><path d="M-14-60h28l-14-14Z" fill={color} /></g>)}
      </svg>
    </div>
  );
}

function BattleUnitCard({ u, view, acting, hit, targetable, onTarget, floaters }: {
  u: Unit; view: UnitView; acting: boolean; hit: boolean; targetable: boolean; onTarget: () => void; floaters: Floater[];
}) {
  const pct = view.hp / u.maxHp;
  const size = u.boss ? 150 : 104;
  return (
    <button className={`bunit ${u.side} ${view.alive ? '' : 'ko'} ${acting ? 'acting' : ''} ${hit ? 'hit' : ''} ${targetable ? 'targetable' : ''} ${u.boss ? 'boss' : ''}`}
      onClick={targetable ? onTarget : undefined} disabled={!targetable} aria-label={tr('{name}, {p1} PV', { name: u.name, p1: Math.round(view.hp) })}>
      <div className="bunit-floaters">{floaters.map((f) => <span key={f.id} className={`floater ${f.kind}`}>{f.text}</span>)}</div>
      <div className="bunit-art" style={{ transform: u.side === 'B' ? 'scaleX(-1)' : undefined }}>
        <CreatureArt speciesId={u.speciesId} mutations={u.mutations} hue={u.hue} size={size} anim={!view.alive ? 'none' : acting ? 'attack' : 'idle'} seed={u.key} />
      </div>
      <div className="bunit-info">
        <div className="bunit-name"><ElementIcon element={u.element} style={{ color: ELEMENTS[u.element].color }} /><em className="bname">{u.name}</em><span>{tr('Nv')} {u.level}</span>{u.boss && <b className="boss-tag">{tr('Gardien')}</b>}</div>
        <div className={`hpbar ${pct < 0.25 ? 'low' : pct < 0.5 ? 'mid' : ''}`}><i style={{ width: `${pct * 100}%` }} /><span className="num">{Math.ceil(view.hp)}/{u.maxHp}</span></div>
        <div className="bunit-row">
          <span className="energy" aria-label={tr('Énergie {energy}', { energy: u.energy })}>{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < u.energy ? 'on' : ''} />)}</span>
          {view.statuses.map((s) => <span key={s} className="bstatus tip" data-tip={`${STATUSES[s].name} : ${STATUSES[s].description}`} style={{ background: STATUSES[s].color }} />)}
        </div>
      </div>
    </button>
  );
}

export function BattleView() {
  // Instantané au montage : le combat en attente disparaît de l'état dès qu'il est validé.
  const livePending = useGame((s) => s.state.combat.pending);
  const [pending] = useState(livePending);
  const dispatch = useGame((s) => s.dispatch);
  const { closeModal, openModal } = useUi.getState();
  const initial = useMemo(() => (pending ? createBattle(pending.combatants, pending.seed) : null), [pending]);
  const [battle, setBattle] = useState<BattleState | null>(initial);
  const [inputs, setInputs] = useState<BattleInput[]>([]);
  const [queue, setQueue] = useState<LogEntry[]>(initial?.log ?? []);
  const [view, setView] = useState<Record<string, UnitView>>(initial ? initialView(initial) : {});
  const [actor, setActor] = useState<string | null>(null);
  const [hitKey, setHitKey] = useState<string | null>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [caption, setCaption] = useState('Le combat commence !');
  const [selected, setSelected] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const [fast, setFast] = useState(false);
  const [result, setResult] = useState<Extract<GameEvent, { type: 'battleEnded' }> | null>(null);
  const finishing = useRef(false);
  const name = useCallback((key: string) => battle?.units.find((u) => u.key === key)?.name ?? key, [battle]);

  const float = (key: string, text: string, kind: Floater['kind']) => {
    const id = ++floaterId;
    setFloaters((f) => [...f, { id, key, text, kind }]);
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 1200);
  };

  // Gong d'ouverture du combat
  useEffect(() => { preloadSfx(COMBAT_SFX); playSfx('battleStart'); }, []);

  // Animation : une entrée du journal à la fois
  useEffect(() => {
    if (queue.length === 0) return;
    const e = queue[0]!;
    const delay = (e.t === 'skill' || e.t === 'dmg' ? STEP_MS : e.t === 'round' ? 350 : 160) / (fast ? 2.2 : 1);
    const t = setTimeout(() => {
      switch (e.t) {
        case 'round': setCaption(`Manche ${e.round}`); if (e.round > 1) playSfx('round'); break;
        case 'turn': setActor(e.actor); break;
        case 'skill': {
          setActor(e.actor); setCaption(`${name(e.actor)} utilise ${SKILLS[e.skill]?.name} !`);
          const el = SKILLS[e.skill]?.element;
          playSfx(el && (SKILL_ELEMENTS as readonly string[]).includes(el) ? (`skill-${el}` as Sfx) : 'whoosh');
          break;
        }
        case 'dmg':
          setView((v) => ({ ...v, [e.target]: { ...v[e.target]!, hp: Math.max(0, v[e.target]!.hp - e.amount) } }));
          setHitKey(e.target); setTimeout(() => setHitKey(null), 300);
          float(e.target, `-${e.amount}`, e.crit ? 'crit' : 'dmg');
          if (e.crit) float(e.target, 'Critique !', 'info');
          if (e.mul > 1) float(e.target, 'Efficace !', 'info');
          if (e.mul < 1) float(e.target, 'Peu efficace', 'info');
          playSfx(e.crit ? 'crit' : 'hit');
          break;
        case 'heal':
          setView((v) => ({ ...v, [e.target]: { ...v[e.target]!, hp: v[e.target]!.hp + e.amount } }));
          if (e.amount > 0) { float(e.target, `+${e.amount}`, 'heal'); playSfx('heal'); }
          break;
        case 'status':
          setView((v) => {
            const cur = v[e.target]!.statuses.filter((s) => s !== e.status);
            return { ...v, [e.target]: { ...v[e.target]!, statuses: e.on ? [...cur, e.status] : cur } };
          });
          if (e.on) { float(e.target, STATUSES[e.status].name, 'info'); playSfx(STATUSES[e.status].kind === 'bonus' ? 'buff' : 'debuff'); }
          break;
        case 'cleanse': setView((v) => ({ ...v, [e.target]: { ...v[e.target]!, statuses: v[e.target]!.statuses.filter((s) => STATUSES[s].kind !== 'malus') } })); break;
        case 'stun': setCaption(`${name(e.actor)} est étourdi et passe son tour.`); playSfx('stun'); break;
        case 'ko': setView((v) => ({ ...v, [e.target]: { ...v[e.target]!, alive: false, statuses: [] } })); setCaption(`${name(e.target)} est hors de combat !`); playSfx('ko'); break;
        case 'end': setCaption(e.winner === 'A' ? 'Victoire !' : e.winner === 'B' ? 'Défaite…' : 'Égalité : temps écoulé.'); break;
      }
      setQueue((q) => q.slice(1));
    }, delay);
    return () => clearTimeout(t);
  }, [queue, fast, name]);

  const idle = queue.length === 0;
  const awaiting = idle && battle && !battle.ended ? battle.awaiting : null;
  const awaitingUnit = awaiting ? battle!.units.find((u) => u.key === awaiting)! : null;

  const send = useCallback((input: BattleInput) => {
    if (!battle) return;
    const next = act(battle, input);
    setInputs((i) => [...i, input]);
    setBattle(next);
    setQueue(next.log);
    setSelected(null);
  }, [battle]);

  // Mode automatique : l'IA choisit pour le joueur (les ordres sont enregistrés comme les autres)
  useEffect(() => {
    if (!auto || !awaiting || !battle) return;
    const t = setTimeout(() => send(chooseAction(battle, awaiting)), 250 / (fast ? 2 : 1));
    return () => clearTimeout(t);
  }, [auto, awaiting, battle, send, fast]);

  useEffect(() => { if (awaiting) { setActor(awaiting); setCaption(`À toi : que doit faire ${name(awaiting)} ?`); } }, [awaiting, name]);

  // Fin : le jeu rejoue le combat pour vérifier avant d'attribuer les récompenses
  useEffect(() => {
    if (!battle?.ended || !idle || finishing.current) return;
    finishing.current = true;
    const t = setTimeout(() => {
      const events = dispatch({ type: 'finishBattle', inputs });
      const ev = events?.find((x): x is Extract<GameEvent, { type: 'battleEnded' }> => x.type === 'battleEnded');
      if (ev) { setResult(ev); playSfx(ev.won ? 'reveal' : 'error', ev.won ? 3 : 0); }
      else closeModal();
    }, 700);
    return () => clearTimeout(t);
  }, [battle?.ended, idle, inputs, dispatch, closeModal]);

  if (!battle || !pending) return null;

  const selectedSkill = selected ? SKILLS[selected] : null;
  const targets = awaiting && selected ? legalTargets(battle, awaiting, selected) : [];
  const choose = (skillId: string) => {
    if (!awaiting) return;
    playSfx('tap');
    const legal = legalTargets(battle, awaiting, skillId);
    if (legal.length === 0) send({ skill: skillId, target: null });
    else if (legal.length === 1) send({ skill: skillId, target: legal[0]! });
    else setSelected(skillId);
  };
  const side = (s: 'A' | 'B') => battle.units.filter((u) => u.side === s);

  return (
    <div className="battle" role="dialog" aria-modal="true" aria-label={tr('Combat')}>
      <BattleBackdrop kind={pending.kind} refId={pending.ref} />
      <div className="battle-top">
        <button className="btn btn-ghost btn-sm" style={{ visibility: result || battle.ended ? 'hidden' : 'visible' }} onClick={() => openModal({ kind: 'confirm', danger: true, title: tr('Abandonner le combat ?'), confirmLabel: tr('Abandonner'), body: tr('Le combat sera compté comme une défaite, sans récompense.'), onConfirm: () => { dispatch({ type: 'abandonBattle' }); closeModal(); } })}>
          <Icon name="close" />{tr('Fuir')}
        </button>
        <span className="battle-round">{tr('Manche')} {battle.round}</span>
        <div className="row" style={{ gap: 6 }}>
          <button className={`chip ${fast ? 'active' : ''}`} onClick={() => setFast(!fast)}>{tr('×2')}</button>
          <button className={`chip ${auto ? 'active' : ''}`} onClick={() => setAuto(!auto)}><Icon name="motion" />{tr('Auto')}</button>
        </div>
      </div>
      <div className="battle-field">
        <div className="bside B">{side('B').map((u) => <BattleUnitCard key={u.key} u={u} view={view[u.key]!} acting={actor === u.key && !idle} hit={hitKey === u.key} targetable={targets.includes(u.key)} onTarget={() => send({ skill: selected!, target: u.key })} floaters={floaters.filter((f) => f.key === u.key)} />)}</div>
        <div className="battle-caption">{caption}</div>
        <div className="bside A">{side('A').map((u) => <BattleUnitCard key={u.key} u={u} view={view[u.key]!} acting={actor === u.key} hit={hitKey === u.key} targetable={targets.includes(u.key)} onTarget={() => send({ skill: selected!, target: u.key })} floaters={floaters.filter((f) => f.key === u.key)} />)}</div>
      </div>

      {result ? (
        <div className="battle-panel result">
          <h2 className={result.won ? 'win' : 'lose'}>{result.won ? tr('Victoire !') : tr('Défaite')}</h2>
          <p className="soft">{result.won ? tp(result.rounds, 'Victoire en {n} manche.', 'Victoire en {n} manches.') : tr('Entraîne tes créatures, varie les éléments et réessaie !')} {tr('Expérience : +')}{result.xp} {tr('par créature.')}</p>
          {Object.keys(result.reward).length > 0 ? <RewardList r={result.reward} /> : result.won && <p className="muted" style={{ fontSize: 13 }}>{tr('Récompense déjà obtenue aujourd\'hui.')}</p>}
          <button className="btn btn-pink" onClick={closeModal}>{tr('Continuer')}</button>
        </div>
      ) : (
        <div className="battle-panel">
          {awaitingUnit && !auto ? (
            <>
              <div className="row" style={{ marginBottom: 8 }}>
                <b>{awaitingUnit.name}</b><span className="energy big">{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < awaitingUnit.energy ? 'on' : ''} />)}</span>
                {selectedSkill && <span className="muted" style={{ fontSize: 13, fontWeight: 800 }}>{tr('Choisis une cible pour')} {selectedSkill.name}<button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={() => setSelected(null)}>{tr('Annuler')}</button></span>}
              </div>
              <div className="skills">
                {awaitingUnit.skills.map((id) => {
                  const sk = SKILLS[id]!;
                  const ok = canUse(awaitingUnit, id);
                  return (
                    <button key={id} className={`skill ${selected === id ? 'on' : ''}`} disabled={!ok} onClick={() => choose(id)} title={sk.description}
                      style={{ ['--sc' as string]: sk.element ? ELEMENTS[sk.element].color : '#8f88b0' } as CSSProperties}>
                      <span className="skill-name">{sk.element && <ElementIcon element={sk.element} style={{ color: ELEMENTS[sk.element].color }} />}{sk.name}</span>
                      <span className="skill-meta">{sk.power > 0 ? tr('Puissance {power}', { power: sk.power }) : sk.heal ? tr('Soin {p0} %', { p0: Math.round(sk.heal * 100) }) : tr('Soutien')}{sk.target === 'allEnemies' ? tr(' · tous') : sk.target === 'allAllies' ? tr(' · équipe') : ''}</span>
                      <span className="skill-cost">{Array.from({ length: sk.energy }, (_, i) => <i key={i} />)}{sk.energy === 0 && 'gratuit'}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : <p className="soft" style={{ textAlign: 'center', fontWeight: 800 }}>{auto && !battle.ended ? tr('Mode automatique…') : '…'}</p>}
        </div>
      )}
    </div>
  );
}
