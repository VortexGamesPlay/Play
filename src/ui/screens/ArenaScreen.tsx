import { useState, type CSSProperties } from 'react';
import { BOSSES, LEAGUES, TOWER, type EnemyDef, type LeagueFight } from '@data/arena';
import { BIOME_BY_ID } from '@data/biomes';
import { ELEMENTS } from '@data/elements';
import { computeStats, displayName, getSpecies } from '@core/systems/creatures';
import { isDiscovered } from '@core/systems/dex';
import { isAway } from '@core/systems/exploration';
import { bossUnlocked, leagueProgress, leagueUnlocked, MAX_TEAM, skillsFor, towerEnemies } from '@core/systems/battles';
import type { ElementId } from '@core/types';
import { CreatureArt } from '../art/CreatureArt';
import { ElementIcon, Icon } from '../art/Icons';
import { BiomeScenery } from '../art/Scenery';
import { EmptyState } from '../components/EmptyState';
import { RewardList } from './ExplorationScreen';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { playSfx } from '../../services/audio';
import { SKILLS } from '@data/skills';
import { tr } from '../../i18n';

type Tab = 'ligue' | 'gardiens' | 'tour';

function EnemyRow({ enemies }: { enemies: EnemyDef[] }) {
  const state = useGame((s) => s.state);
  return (
    <div className="enemy-row">
      {enemies.map((e, i) => {
        const known = isDiscovered(state, e.species);
        return (
          <div key={i} className={`enemy ${e.boss ? 'boss' : ''}`}>
            <CreatureArt speciesId={e.species} mutations={e.mutations} size={e.boss ? 64 : 46} anim="none" silhouette={!known} />
            <span className="num">{tr('Nv')} {e.level}</span>
          </div>
        );
      })}
    </div>
  );
}

function useFight() {
  const dispatch = useGame((s) => s.dispatch);
  const openModal = useUi((s) => s.openModal);
  return (kind: 'league' | 'boss' | 'tower', ref: string) => {
    if (dispatch({ type: 'startBattle', kind, ref })) { playSfx('open'); openModal({ kind: 'battle' }); }
  };
}

function TeamPanel() {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const openModal = useUi((s) => s.openModal);
  const team = state.combat.team.map((u) => state.creatures.find((c) => c.uid === u)).filter(Boolean);
  const best = () => {
    const uids = state.creatures.filter((c) => !isAway(state, c.uid)).sort((a, b) => computeStats(b).power - computeStats(a).power).slice(0, MAX_TEAM).map((c) => c.uid);
    dispatch({ type: 'setTeam', uids });
  };
  const power = team.reduce((s, c) => s + computeStats(c!).power, 0);
  return (
    <div className="card team-panel">
      <div className="card-title"><Icon name="swords" /><h3>{tr('Équipe de combat')}</h3><span className="spacer" /><span className="badge soft-badge">{tr('Puissance')} {power}</span></div>
      <div className="team-slots">
        {Array.from({ length: MAX_TEAM }, (_, i) => {
          const c = team[i];
          return c ? (
            <button key={i} className={`team-slot ${isAway(state, c.uid) ? 'away' : ''}`} onClick={() => openModal({ kind: 'teamPicker' })}>
              <CreatureArt speciesId={c.speciesId} mutations={c.mutations} hue={c.genes.hue} size={70} seed={c.uid} />
              <b>{displayName(c)}</b><span className="muted num">{tr('Nv')} {c.level} · {computeStats(c).power}</span>
              {isAway(state, c.uid) && <span className="cr-away"><Icon name="compass" />{tr('En expédition')}</span>}
            </button>
          ) : (
            <button key={i} className="team-slot empty" onClick={() => openModal({ kind: 'teamPicker' })}><span className="slot-plus"><Icon name="plus" /></span>{tr('Choisir')}</button>
          );
        })}
      </div>
      <div className="row-wrap" style={{ marginTop: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={best} disabled={state.creatures.length === 0}><Icon name="sparkle" />{tr('Meilleure équipe')}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => openModal({ kind: 'elementGuide' })}><Icon name="book" />{tr('Guide des éléments')}</button>
      </div>
    </div>
  );
}

export function TeamPickerModal() {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const close = useUi.getState().closeModal;
  const [sel, setSel] = useState<string[]>(state.combat.team.filter((u) => state.creatures.some((c) => c.uid === u)));
  const list = [...state.creatures].sort((a, b) => computeStats(b).power - computeStats(a).power);
  const toggle = (uid: string) => setSel((s) => (s.includes(uid) ? s.filter((x) => x !== uid) : s.length < MAX_TEAM ? [...s, uid] : s));
  if (list.length === 0) return <EmptyState icon="paw" title={tr('Aucune créature')}>{tr('Fais éclore des œufs pour composer une équipe.')}</EmptyState>;
  return (
    <div className="stack">
      <p className="soft" style={{ fontSize: 14 }}>{tr('Choisis jusqu\'à')} {MAX_TEAM} {tr('créatures. Mélange les éléments : chacun domine certains éléments et en craint d\'autres.')}</p>
      <div className="team-grid">
        {list.map((c) => {
          const sp = getSpecies(c.speciesId);
          const on = sel.includes(c.uid);
          const away = isAway(state, c.uid);
          return (
            <button key={c.uid} className={`team-pick ${on ? 'on' : ''}`} disabled={away} onClick={() => toggle(c.uid)} aria-pressed={on}>
              <span className="team-fav"><ElementIcon element={sp.element} style={{ color: ELEMENTS[sp.element].color }} /></span>
              <CreatureArt speciesId={c.speciesId} mutations={c.mutations} hue={c.genes.hue} size={58} anim={on ? 'idle' : 'none'} />
              <b>{displayName(c)}</b>
              <span className="muted num">{away ? tr('En expédition') : tr('Nv {level} · {power}', { level: c.level, power: computeStats(c).power })}</span>
              <span className="muted" style={{ fontSize: 10 }}>{skillsFor(sp.element, c.level).length} {tr('compétences')}</span>
            </button>
          );
        })}
      </div>
      <button className="btn btn-pink" onClick={() => { dispatch({ type: 'setTeam', uids: sel }); close(); }}>{tr('Valider l\'équipe (')}{sel.length}/{MAX_TEAM})</button>
    </div>
  );
}

export function ElementGuideModal() {
  return (
    <div className="stack">
      <p className="soft" style={{ fontSize: 14 }}>{tr('Une compétence de l\'élément dominant inflige')} <b>{tr('×1,5')}</b> {tr('dégâts. Si la cible domine l\'élément de l\'attaque, les dégâts sont réduits à')} <b>{tr('×0,75')}</b>{tr('. Les compétences sans élément (Coup d\'élan, Posture de garde) sont neutres.')}</p>
      <div className="el-guide">
        {(Object.keys(ELEMENTS) as ElementId[]).map((id) => {
          const el = ELEMENTS[id];
          const weakTo = (Object.keys(ELEMENTS) as ElementId[]).filter((o) => ELEMENTS[o].strongAgainst.includes(id));
          return (
            <div key={id} className="el-guide-row">
              <span className="badge element-badge" style={{ ['--ec' as string]: el.color } as CSSProperties}><ElementIcon element={id} style={{ color: el.color }} />{el.name}</span>
              <span className="muted" style={{ fontSize: 12, fontWeight: 800 }}>domine</span>
              <span className="row-wrap" style={{ gap: 4 }}>{el.strongAgainst.map((x) => <ElementIcon key={x} element={x} width={18} height={18} style={{ color: ELEMENTS[x].color }} />)}</span>
              <span className="muted" style={{ fontSize: 12, fontWeight: 800 }}>craint</span>
              <span className="row-wrap" style={{ gap: 4 }}>{weakTo.map((x) => <ElementIcon key={x} element={x} width={18} height={18} style={{ color: ELEMENTS[x].color }} />)}</span>
            </div>
          );
        })}
      </div>
      <h3 className="detail-h">{tr('Compétences par élément')}</h3>
      <p className="muted" style={{ fontSize: 13 }}>{tr('Chaque créature apprend 3 compétences de son élément (niveaux 1, 10 et 20), plus Coup d\'élan et Posture de garde (niveau 5). L\'énergie (5 max) remonte de 1 à chaque tour.')}</p>
      <div className="el-skills">
        {(Object.keys(ELEMENTS) as ElementId[]).map((id) => (
          <div key={id} className="el-skill-row"><ElementIcon element={id} width={18} height={18} style={{ color: ELEMENTS[id].color }} />
            {skillsFor(id, 99).filter((s) => SKILLS[s]!.element === id).map((s) => <span key={s} className="tip" data-tip={SKILLS[s]!.description}>{SKILLS[s]!.name}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function FightRow({ f, leagueId, index }: { f: LeagueFight; leagueId: string; index: number }) {
  const state = useGame((s) => s.state);
  const fight = useFight();
  const progress = leagueProgress(state, leagueId);
  const open = leagueUnlocked(state, leagueId) && index <= progress;
  const done = index < progress;
  return (
    <div className={`fight-row ${f.champion ? 'champion' : ''} ${done ? 'done' : ''} ${open ? '' : 'locked'}`}>
      <div className="fight-who">
        <b>{f.rival}</b><span className="muted">{f.title}</span>
        {f.champion && <span className="badge rarity-badge t4" style={{ ['--rc' as string]: '#f0a020' } as CSSProperties}><Icon name="trophy" />{tr('Champion')}</span>}
      </div>
      <EnemyRow enemies={f.enemies} />
      <div className="fight-reward">{done ? <><span className="muted" style={{ fontSize: 11, fontWeight: 800 }}>{tr('REVANCHE')}</span><RewardList r={f.repeatReward} /></> : <RewardList r={f.firstReward} />}</div>
      <button className="btn btn-sm" disabled={!open} onClick={() => fight('league', f.id)}>{done ? <><Icon name="check" />{tr('Rejouer')}</> : open ? <><Icon name="swords" />{tr('Combattre')}</> : <Icon name="lock" />}</button>
    </div>
  );
}

export function ArenaScreen() {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const openModal = useUi((s) => s.openModal);
  const fight = useFight();
  const [tab, setTab] = useState<Tab>('ligue');
  const p = state.combat.pending;
  const floor = state.combat.towerFloor + 1;
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="intro-banner">
        <h2>{tr('L\'Arène')}</h2>
        <p className="soft">{tr('Des combats en formation : trois créatures de chaque côté, qui agissent par ordre de vitesse. Chaque compétence coûte de l\'énergie, qui remonte à chaque tour. Joue l\'élément dominant pour frapper plus fort !')}</p>
      </div>
      {p && (
        <div className="event-banner"><Icon name="swords" /><div style={{ flex: 1 }}><b>{tr('Un combat est en cours.')}</b><div style={{ fontSize: 13 }}>{tr('Il reprendra depuis son début (même tirage).')}</div></div>
          <button className="btn btn-sm" onClick={() => openModal({ kind: 'battle' })}>{tr('Reprendre')}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'abandonBattle' })}>{tr('Abandonner')}</button>
        </div>
      )}
      <TeamPanel />
      <div className="tabs">
        <button className={tab === 'ligue' ? 'active' : ''} onClick={() => setTab('ligue')}><Icon name="trophy" width={16} height={16} />{tr('Ligue des Coquilles')}</button>
        <button className={tab === 'gardiens' ? 'active' : ''} onClick={() => setTab('gardiens')}><Icon name="starFill" width={16} height={16} />{tr('Gardiens anciens')}</button>
        <button className={tab === 'tour' ? 'active' : ''} onClick={() => setTab('tour')}><Icon name="sanctuary" width={16} height={16} />{tr('Tour des épreuves')}</button>
      </div>

      {tab === 'ligue' && LEAGUES.map((l) => {
        const prog = leagueProgress(state, l.id);
        const open = leagueUnlocked(state, l.id);
        return (
          <div key={l.id} className={`card league ${open ? '' : 'locked'}`} style={{ ['--lc' as string]: l.color } as CSSProperties}>
            <div className="league-head"><i /><div style={{ flex: 1 }}><h3>{l.name}</h3><p className="soft" style={{ fontSize: 13 }}>{l.description}</p></div><span className="badge soft-badge">{prog}/{l.fights.length}</span></div>
            {open ? <div className="stack" style={{ gap: 6 }}>{l.fights.map((f, i) => <FightRow key={f.id} f={f} leagueId={l.id} index={i} />)}</div>
              : <p className="muted" style={{ fontSize: 13, fontWeight: 700 }}><Icon name="lock" width={14} height={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> {tr('Bats le champion de l\'arène précédente pour y accéder.')}</p>}
          </div>
        );
      })}

      {tab === 'gardiens' && (
        <div className="grid-auto" style={{ ['--min' as string]: '300px' } as CSSProperties}>
          {BOSSES.map((b) => {
            const open = bossUnlocked(state, b.id);
            const biome = BIOME_BY_ID[b.biomeId]!;
            const count = state.exploration.expeditionsByBiome[b.biomeId] ?? 0;
            const first = !state.combat.bossFirst.includes(b.id);
            const dailyDone = state.combat.bossDaily[b.id] === dayKey;
            return (
              <div key={b.id} className={`card boss-card ${open ? '' : 'locked'}`}>
                <div className="boss-hero"><BiomeScenery biome={biome} />{open ? <CreatureArt speciesId={b.enemies[0]!.species} size={120} /> : <CreatureArt speciesId={b.enemies[0]!.species} size={120} silhouette anim="none" />}</div>
                <b className="building-name">{open ? b.name : '???'}</b>
                <span className="muted" style={{ fontSize: 12, fontWeight: 800 }}>{b.title}</span>
                <p className="soft" style={{ fontSize: 13, margin: '6px 0' }}>{open ? b.description : tr('Termine {unlockExpeditions} expéditions dans ce biome pour le débusquer ({p1}/{unlockExpeditions}).', { unlockExpeditions: b.unlockExpeditions, p1: Math.min(count, b.unlockExpeditions) })}</p>
                {open && <EnemyRow enemies={b.enemies} />}
                <div style={{ margin: '8px 0' }}>{first ? <><span className="muted" style={{ fontSize: 11, fontWeight: 800 }}>{tr('PREMIÈRE VICTOIRE')}</span><RewardList r={b.firstReward} /></> : <><span className="muted" style={{ fontSize: 11, fontWeight: 800 }}>{dailyDone ? tr('RÉCOMPENSE DU JOUR OBTENUE') : tr('RÉCOMPENSE DU JOUR')}</span>{!dailyDone && <RewardList r={b.dailyReward} />}</>}</div>
                <button className="btn btn-pink btn-sm" disabled={!open} onClick={() => fight('boss', b.id)}><Icon name="swords" />{tr('Affronter')}</button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'tour' && (
        <div className="card tower">
          <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
            <div><h3 style={{ fontSize: 20 }}>{tr('Étage')} {floor}</h3><p className="soft" style={{ fontSize: 13 }}>{tr('Meilleur étage atteint :')} <b>{state.combat.towerFloor}</b>{tr('. Chaque étage est plus difficile ; tous les 5 étages, des cristaux.')}</p></div>
            <button className="btn btn-pink" onClick={() => fight('tower', String(floor))}><Icon name="swords" />{tr('Monter à l\'étage')} {floor}</button>
          </div>
          <h3 className="detail-h">{tr('Adversaires')}</h3>
          <EnemyRow enemies={towerEnemies(floor)} />
          <h3 className="detail-h">{tr('Récompense')}</h3>
          <RewardList r={TOWER.floorReward(floor)} />
          <div className="status-panel" style={{ marginTop: 12 }}><Icon name="info" /><p style={{ fontSize: 13 }}><b>{tr('Classements en ligne : Phase 6.')}</b> {tr('Ton record est déjà enregistré et sera publié quand les comptes en ligne arriveront. Les combats entre joueurs sont prévus dans une version future.')}</p></div>
        </div>
      )}

      <div className="row-wrap muted" style={{ fontSize: 13, fontWeight: 800 }}>
        <span>{tr('Victoires :')} {state.stats.battlesWon}</span><span>·</span><span>{tr('Défaites :')} {state.stats.battlesLost}</span><span>·</span><span>{tr('Gardiens vaincus :')} {state.stats.bossesDefeated}</span>
      </div>
    </div>
  );
}
