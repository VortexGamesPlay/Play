import { useState, type CSSProperties } from 'react';
import { BALANCE, xpToNext } from '@data/balance';
import { AMBIANCES } from '@data/ambiances';
import { EGGS } from '@data/eggs';
import { PERSONALITIES } from '@data/personalities';
import { RARITIES } from '@data/rarities';
import { computeStats, displayName, geneQuality, getSpecies, releaseValue } from '@core/systems/creatures';
import { CreatureArt } from '../art/CreatureArt';
import { SPECIES } from '@data/species';
import { evolutionOptions } from '@core/systems/evolution';
import { creatureRate } from '@core/systems/sanctuary';
import { isDiscovered } from '@core/systems/dex';
import { useNow } from '../hooks/useNow';
import { EssenceIcon, Icon } from '../art/Icons';
import { ElementBadge, MutationBadge, RarityBadge } from '../components/Badges';
import { Bar } from '../components/Bar';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { conditionText, fmtDateTime, foodTagName } from '../format';
import { tr } from '../../i18n';

type Anim = 'idle' | 'walk' | 'attack' | 'sleep';
const ANIMS: [Anim, string][] = [['idle', 'Repos'], ['walk', 'Marche'], ['attack', 'Attaque'], ['sleep', 'Sommeil']];
const STAT_MAX = 160;

export function CreatureDetail({ uid }: { uid: string }) {
  const state = useGame((s) => s.state);
  const c = state.creatures.find((x) => x.uid === uid);
  const now = useNow();
  const dispatch = useGame((s) => s.dispatch);
  const { openModal, closeModal } = useUi.getState();
  const [anim, setAnim] = useState<Anim>('idle');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  if (!c) {
    return <p className="soft">{tr('Cette créature n\'est plus dans ton sanctuaire.')}</p>;
  }
  const sp = getSpecies(c.speciesId);
  const r = RARITIES[sp.rarity];
  const st = computeStats(c);
  const pers = PERSONALITIES[c.personality];
  const maxed = c.level >= BALANCE.maxLevel;
  const evoOptions = evolutionOptions(state, c, now);

  return (
    <div className="detail" style={{ ['--rc' as string]: r.color, ['--rg' as string]: r.glow } as CSSProperties}>
      <div className="detail-hero">
        <div className="detail-art">
          <CreatureArt speciesId={c.speciesId} mutations={c.mutations} hue={c.genes.hue} size={210} anim={anim} seed={c.uid} />
        </div>
        <div className="row-wrap" style={{ justifyContent: 'center' }}>
          {ANIMS.map(([a, l]) => <button key={a} className={`chip ${anim === a ? 'active' : ''}`} onClick={() => setAnim(a)}>{l}</button>)}
        </div>
      </div>

      <div className="detail-body">
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="muted num" style={{ fontSize: 12, fontWeight: 800 }}>{tr('N°')} {String(sp.dex).padStart(3, '0')} · {sp.family}</div>
            {editing ? (
              <form className="row" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'rename', uid, name }); setEditing(false); }}>
                <div className="field" style={{ flex: 1 }}><input autoFocus maxLength={20} value={name} onChange={(e) => setName(e.target.value)} placeholder={sp.name} aria-label={tr('Surnom')} /></div>
                <button className="btn btn-sm" type="submit">{tr('OK')}</button>
              </form>
            ) : (
              <h2 className="detail-name">{displayName(c)}{c.nickname && <span className="muted" style={{ fontSize: 14 }}> ({sp.name})</span>}
                <button className="icon-btn" style={{ width: 32, height: 32, display: 'inline-grid', verticalAlign: 'middle', marginLeft: 6 }} onClick={() => { setName(c.nickname ?? ''); setEditing(true); }} aria-label={tr('Renommer')}><Icon name="edit" /></button>
              </h2>
            )}
          </div>
          <button className={`icon-btn ${c.favorite ? 'fav-on' : ''}`} onClick={() => dispatch({ type: 'toggleFavorite', uid })} aria-label={tr('Favori')} aria-pressed={c.favorite}>
            <Icon name={c.favorite ? 'heartFill' : 'heart'} style={{ color: c.favorite ? 'var(--pink)' : undefined }} />
          </button>
        </div>
        <div className="row-wrap" style={{ margin: '8px 0 12px' }}>
          <RarityBadge rarity={sp.rarity} />
          <ElementBadge element={sp.element} />
          {c.mutations.map((m) => <MutationBadge key={m} mutation={m} />)}
        </div>

        <div className="detail-xp">
          <div className="row"><b>{tr('Niveau')} {c.level}</b><span className="spacer" /><span className="muted num" style={{ fontSize: 13 }}>{maxed ? tr('Niveau max') : `${c.xp} / ${xpToNext(c.level)} XP`}</span></div>
          <Bar value={maxed ? 1 : c.xp / xpToNext(c.level)} />
          <div className="row" style={{ marginTop: 8 }}><Icon name="heartFill" width={16} height={16} style={{ color: 'var(--pink)' }} /><b style={{ fontSize: 13 }}>{tr('Affection')}</b><span className="spacer" /><span className="muted num" style={{ fontSize: 13 }}>{c.affection}/{BALANCE.maxAffection}</span></div>
          <Bar value={c.affection / BALANCE.maxAffection} fill="linear-gradient(90deg,#ff9fd0,#ff5c9a)" size="thin" />
        </div>

        <div className="row" style={{ gap: 8, margin: '14px 0' }}>
          <button className="btn btn-mint" style={{ flex: 1 }} onClick={() => openModal({ kind: 'feed', uid })}><Icon name="leaf" />{tr('Nourrir')}</button>
          <button className="btn btn-ghost" onClick={() => openModal({ kind: 'dex', speciesId: c.speciesId })}><Icon name="book" />{tr('Bestiaire')}</button>
        </div>

        <h3 className="detail-h">{tr('Statistiques')} <span className="badge soft-badge">{tr('Puissance')} {st.power}</span></h3>
        <div className="stats">
          {([['PV', st.hp, '#3fcf9f', 'hp'], ['Attaque', st.atk, '#ff7a5c', 'atk'], ['Défense', st.def, '#5cb8ff', 'def'], ['Vitesse', st.spd, '#ffc23d', 'spd']] as const).map(([l, v, col, k]) => (
            <div key={l} className="stat-row">
              <span className="stat-l">{l}{pers?.up === k && <b className="up">▲</b>}{pers?.down === k && <b className="down">▼</b>}</span>
              <Bar value={v / STAT_MAX} fill={col} size="thin" />
              <b className="num">{v}</b>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>{tr('Énergie et compétences de combat : Phase 5 (Arène).')}</p>

        <h3 className="detail-h">{tr('Génétique')}</h3>
        <dl className="kv">
          <dt>{tr('Qualité génétique')}</dt><dd>{geneQuality(c.genes)} %</dd>
          <dt>{tr('Gènes PV / Att / Déf / Vit')}</dt><dd className="num">{c.genes.hp} / {c.genes.atk} / {c.genes.def} / {c.genes.spd} <span className="muted">{tr('(sur 31)')}</span></dd>
          <dt>{tr('Personnalité')}</dt><dd>{pers?.name} <span className="muted" style={{ fontWeight: 600 }}>— {pers?.description}</span></dd>
          <dt>{tr('Taille')}</dt><dd>{c.sizeCm > 0 ? `${c.sizeCm} cm` : '???'}</dd>
          <dt>{tr('Poids')}</dt><dd>{c.weightKg > 0 ? `${c.weightKg} kg` : '???'}</dd>
          <dt>{tr('Variation de teinte')}</dt><dd>{c.genes.hue > 0 ? '+' : ''}{c.genes.hue}°</dd>
          <dt>{tr('Génération')}</dt><dd>{c.generation}</dd>
        </dl>

        {c.mutations.length > 0 && (
          <>
            <h3 className="detail-h">{tr('Mutations')}</h3>
            <div className="stack" style={{ gap: 6 }}>{c.mutations.map((m) => <div key={m} className="row"><MutationBadge mutation={m} /></div>)}</div>
          </>
        )}

        <h3 className="detail-h">{tr('Évolutions')}</h3>
        {sp.evolutions.length === 0 ? <p className="soft" style={{ fontSize: 14 }}>{tr('Forme finale : aucune évolution connue pour cette espèce.')}</p> : (
          <div className="stack" style={{ gap: 8 }}>
            {evoOptions.map((o) => {
              const known = isDiscovered(state, o.def.to);
              return (
                <div key={o.def.to} className={`evo-row ${o.ready ? 'ready' : ''}`}>
                  <CreatureArt speciesId={o.def.to} size={52} anim={o.ready ? 'idle' : 'none'} silhouette={!known} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b>{known ? SPECIES[o.def.to]?.name : '???'}</b>
                    <div className="row-wrap" style={{ marginTop: 4 }}>
                      {o.checks.map((ck, i) => (
                        <span key={i} className={`badge cond ${ck.met ? 'met' : ''}`}><Icon name={ck.met ? 'check' : 'lock'} />{conditionText(ck.condition)}{ck.progress && !ck.met ? ` (${ck.progress})` : ''}</span>
                      ))}
                    </div>
                  </div>
                  <button className="btn btn-pink btn-sm" disabled={!o.ready} onClick={() => openModal({
                    kind: 'confirm', title: tr('Lancer l\'évolution ?'), confirmLabel: tr('Évoluer'),
                    body: tr('{p0} va se transformer. Son niveau, ses gènes, sa personnalité et ses mutations sont conservés.{p1} L\'évolution est définitive.', { p0: displayName(c), p1: o.def.conditions.some((x) => x.type === 'item') ? ' L\'objet requis sera consommé.' : '' }),
                    onConfirm: () => dispatch({ type: 'evolve', uid, to: o.def.to }),
                  })}><Icon name="sparkle" />{tr('Évoluer')}</button>
                </div>
              );
            })}
            {evoOptions.length > 1 && <p className="muted" style={{ fontSize: 12 }}>{tr('Plusieurs chemins possibles : un seul peut être choisi.')}</p>}
          </div>
        )}

        <h3 className="detail-h">{tr('Origine')}</h3>
        <dl className="kv">
          <dt>{tr('Éclosion')}</dt><dd>{fmtDateTime(c.hatchedAt)}</dd>
          {c.origin.kind === 'breeding' && <><dt>{tr('Parents')}</dt><dd>{SPECIES[c.origin.parents[0]]?.name} {tr('×')} {SPECIES[c.origin.parents[1]]?.name}</dd><dt>{tr('Ambiance')}</dt><dd>{AMBIANCES[c.origin.ambiance]?.name}</dd></>}
          <dt>{tr('Reproduction')}</dt><dd>{c.breedCount}/{BALANCE.breeding.maxBreeds} fusions{c.breedReadyAt > Date.now() ? tr(' · se repose') : ''}</dd>
          {c.origin.kind === 'egg' && <><dt>{tr('Œuf')}</dt><dd>{EGGS[c.origin.eggType]?.name}</dd><dt>{tr('Ambiance')}</dt><dd>{AMBIANCES[c.origin.ambiance]?.name}{c.origin.night ? tr(' · de nuit') : tr(' · de jour')}</dd></>}
          <dt>{tr('Production')}</dt><dd>{Math.round(creatureRate(state, c))} {tr('pièces / h')}</dd>
          <dt>{tr('Aliments préférés')}</dt><dd>{sp.favoriteFood.map(foodTagName).join(', ')}</dd>
        </dl>

        <div className="detail-danger">
          <button className="btn btn-ghost btn-sm" disabled={c.favorite} title={c.favorite ? tr('Retire-la des favoris pour pouvoir la libérer') : undefined}
            onClick={() => openModal({
              kind: 'confirm', danger: true, title: tr('Libérer {p0} ?', { p0: displayName(c) }), confirmLabel: tr('Libérer'),
              body: tr('{p0} retournera à l\'état sauvage. Tu recevras {p1} essence. Cette action est définitive.', { p0: displayName(c), p1: releaseValue(c) }),
              onConfirm: () => { dispatch({ type: 'release', uid }); closeModal(); },
            })}>
            <EssenceIcon width={16} height={16} />{tr('Libérer (+')}{releaseValue(c)} essence)
          </button>
        </div>
      </div>
    </div>
  );
}
