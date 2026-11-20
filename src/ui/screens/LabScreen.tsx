import { useEffect, useState, type CSSProperties } from 'react';
import { BALANCE } from '@data/balance';
import { ELEMENTS } from '@data/elements';
import { MUTATIONS } from '@data/mutations';
import { RECIPES } from '@data/recipes';
import { SPECIES } from '@data/species';
import { breedBlocker, breedingCost, compatibility, inheritanceOdds } from '@core/systems/breeding';
import { displayName, getSpecies } from '@core/systems/creatures';
import { isDiscovered } from '@core/systems/dex';
import { breedingOdds } from '@core/systems/odds';
import { isAway } from '@core/systems/exploration';
import { formatDuration } from '@core/time';
import type { CreatureInstance } from '@core/types';
import { CreatureArt } from '../art/CreatureArt';
import { EggArt } from '../art/EggArt';
import { ElementIcon, Icon } from '../art/Icons';
import { MutationBadge, RarityBadge } from '../components/Badges';
import { EmptyState } from '../components/EmptyState';
import { Price } from '../components/Price';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { useNow } from '../hooks/useNow';
import { formatPct } from '../modals/OddsModal';
import { playSfx } from '../../services/audio';

const B = BALANCE.breeding;
const COMPAT: Record<string, { label: string; color: string; text: string }> = {
  secret: { label: 'Résonance mystérieuse', color: '#c040ff', text: 'Ces deux créatures réveillent une recette secrète…' },
  harmonieuse: { label: 'Harmonieuse', color: '#3fcf9f', text: 'Même élément : leurs gènes s\'accordent naturellement.' },
  bonne: { label: 'Compatible', color: '#5cb8ff', text: 'Éléments différents : l\'œuf portera l\'une ou l\'autre lignée.' },
};

function ParentSlot({ c, label, onPick, onClear }: { c: CreatureInstance | null; label: string; onPick: () => void; onClear: () => void }) {
  if (!c) {
    return (
      <button className="lab-slot empty" onClick={onPick}>
        <span className="slot-plus"><Icon name="plus" /></span>
        <b>{label}</b>
        <span className="muted" style={{ fontSize: 12 }}>Niveau {B.minLevel}+ · affection {B.minAffection}+</span>
      </button>
    );
  }
  const sp = getSpecies(c.speciesId);
  return (
    <div className="lab-slot">
      <button className="icon-btn lab-clear" onClick={onClear} aria-label="Retirer"><Icon name="close" /></button>
      <CreatureArt speciesId={c.speciesId} mutations={c.mutations} hue={c.genes.hue} size={120} seed={c.uid} />
      <b>{displayName(c)}</b>
      <span className="muted" style={{ fontSize: 12, fontWeight: 800 }}>Nv {c.level} · Gén. {c.generation} · fertilité {B.maxBreeds - c.breedCount}/{B.maxBreeds}</span>
      <div className="row-wrap" style={{ justifyContent: 'center' }}>
        <span className="badge element-badge" style={{ ['--ec' as string]: ELEMENTS[sp.element].color } as CSSProperties}><ElementIcon element={sp.element} style={{ color: ELEMENTS[sp.element].color }} />{ELEMENTS[sp.element].name}</span>
        {c.mutations.map((m) => <MutationBadge key={m} mutation={m} />)}
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onPick}>Changer</button>
    </div>
  );
}

export function ParentPickerModal({ exclude, onPick }: { exclude: string | null; onPick: (uid: string) => void }) {
  const state = useGame((s) => s.state);
  const creatures = state.creatures;
  const close = useUi.getState().closeModal;
  const now = useNow();
  const list = creatures.filter((c) => c.uid !== exclude)
    .map((c) => ({ c, why: isAway(state, c.uid) ? 'En expédition' : breedBlocker(c, now) }))
    .sort((a, b) => Number(!!a.why) - Number(!!b.why) || b.c.level - a.c.level);
  if (list.length === 0) return <EmptyState icon="paw" title="Aucune créature disponible">Fais éclore d'autres œufs pour pouvoir composer un couple.</EmptyState>;
  return (
    <div className="picker-list">
      {list.map(({ c, why }) => (
        <div key={c.uid} className={`picker-row ${why ? 'disabled' : ''}`}>
          <CreatureArt speciesId={c.speciesId} mutations={c.mutations} hue={c.genes.hue} size={48} anim="none" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row-wrap"><b>{displayName(c)}</b><span className="muted" style={{ fontSize: 12 }}>Nv {c.level} · {getSpecies(c.speciesId).name}</span></div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
              {why ? (why === 'Se repose' ? `Se repose encore ${formatDuration(c.breedReadyAt - now)}` : why) : `Fertilité ${B.maxBreeds - c.breedCount}/${B.maxBreeds} · affection ${c.affection}`}
            </div>
          </div>
          <button className="btn btn-sm" disabled={!!why} onClick={() => { onPick(c.uid); close(); }}>Choisir</button>
        </div>
      ))}
    </div>
  );
}

/** Animation de fusion : les deux parents se rejoignent, une double hélice tourne, l'œuf apparaît. */
export function BreedFx({ parents, eggUid }: { parents: [string, string]; eggUid: string }) {
  const state = useGame((s) => s.state);
  const { closeModal, navigate } = useUi.getState();
  const [stage, setStage] = useState(0);
  useEffect(() => {
    playSfx('breed');
    const t = [setTimeout(() => setStage(1), 300), setTimeout(() => { setStage(2); playSfx('reveal', 3); }, 2300)];
    return () => t.forEach(clearTimeout);
  }, []);
  const [a, b] = parents.map((uid) => state.creatures.find((c) => c.uid === uid));
  const egg = state.eggs.find((e) => e.uid === eggUid);
  return (
    <div className={`hatch fusion-${stage}`} style={{ ['--rc' as string]: '#9b5cf0', ['--rg' as string]: '#d2b4ff' } as CSSProperties} role="dialog" aria-modal="true" aria-label="Fusion génétique">
      <div className="hatch-bg" />
      <div className="fusion-stage">
        {a && <div className="fusion-parent a"><CreatureArt speciesId={a.speciesId} mutations={a.mutations} hue={a.genes.hue} size={150} /></div>}
        {b && <div className="fusion-parent b"><CreatureArt speciesId={b.speciesId} mutations={b.mutations} hue={b.genes.hue} size={150} /></div>}
        <svg className="fusion-helix" viewBox="0 0 60 100" aria-hidden="true">
          <path d="M15 0C45 15 15 35 45 50S15 85 45 100" stroke="#d2b4ff" strokeWidth="4" fill="none" />
          <path d="M45 0C15 15 45 35 15 50S45 85 15 100" stroke="#ff9fd0" strokeWidth="4" fill="none" />
        </svg>
        <div className="fusion-egg"><EggArt type="hybride" size={120} wobble /></div>
      </div>
      {stage >= 2 ? (
        <div className="hatch-panel">
          <h2 className="hatch-name" style={{ fontSize: 24 }}>Œuf génétique obtenu !</h2>
          <p className="soft">{egg?.genetics ? `${egg.genetics.parentNames[0]} × ${egg.genetics.parentNames[1]} — génération ${egg.genetics.generation}.` : ''} Son contenu restera un mystère jusqu'à l'éclosion.</p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 14, gap: 10 }}>
            <button className="btn btn-ghost" onClick={closeModal}>Rester au labo</button>
            <button className="btn btn-pink" onClick={() => { closeModal(); navigate('incubateur'); }}><Icon name="egg" />Incuber</button>
          </div>
        </div>
      ) : <div className="hatch-skip">Fusion en cours…</div>}
    </div>
  );
}

function Forecast({ a, b, stabilize }: { a: CreatureInstance; b: CreatureInstance; stabilize: boolean }) {
  const state = useGame((s) => s.state);
  const odds = breedingOdds(a.speciesId, b.speciesId);
  const inh = inheritanceOdds(a, b, stabilize);
  const comp = COMPAT[compatibility(a, b)]!;
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="compat" style={{ ['--cc' as string]: comp.color } as CSSProperties}><Icon name="sparkle" /><div><b>{comp.label}</b><div className="soft" style={{ fontSize: 13 }}>{comp.text}</div></div></div>
      <h3 className="detail-h" style={{ margin: '4px 0 0' }}>Espèce de l'œuf</h3>
      <div className="odds-table">
        {odds.map((o) => {
          const known = isDiscovered(state, o.speciesId);
          const sp = SPECIES[o.speciesId]!;
          return (
            <div key={`${o.speciesId}${o.recipeId}`} className={`odds-row ${o.recipeId ? 'recipe' : ''}`}>
              <CreatureArt speciesId={o.speciesId} size={40} anim="none" silhouette={!known} />
              <span style={{ flex: 1, fontWeight: 800 }}>{known ? sp.name : '???'}{o.recipeId && <span className="muted" style={{ fontSize: 11, display: 'block' }}>Recette secrète</span>}</span>
              <RarityBadge rarity={sp.rarity} small />
              <b className="num odds-pct">{formatPct(o.probability)}</b>
            </div>
          );
        })}
      </div>
      <h3 className="detail-h" style={{ margin: '4px 0 0' }}>Héritage</h3>
      <p className="soft" style={{ fontSize: 13 }}>Chaque gène (PV, Att, Déf, Vit) vient de l'un des parents, ±{B.geneDrift}, avec {Math.round(B.geneSurgeChance * 100)} % de chance d'un bond (+5). Teinte et taille : moyenne des parents. Génération {Math.max(a.generation, b.generation) + 1}.</p>
      {inh.length > 0 ? (
        <div className="odds-table compact">
          {inh.map((m) => (
            <div key={m.mutationId} className="odds-row"><i className="amb-dot" style={{ background: MUTATIONS[m.mutationId]!.color }} /><span style={{ flex: 1, fontWeight: 700 }}>Transmettre {MUTATIONS[m.mutationId]!.name}</span><b className="num odds-pct">jusqu'à {formatPct(m.probability)}</b></div>
          ))}
        </div>
      ) : <p className="muted" style={{ fontSize: 13 }}>Aucun parent n'est muté : l'œuf ne pourra muter qu'à l'éclosion, selon l'ambiance.</p>}
    </div>
  );
}

export function LabScreen() {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const openModal = useUi((s) => s.openModal);
  const now = useNow();
  const [ua, setUa] = useState<string | null>(null);
  const [ub, setUb] = useState<string | null>(null);
  const [stabilize, setStabilize] = useState(false);
  const a = state.creatures.find((c) => c.uid === ua) ?? null;
  const b = state.creatures.find((c) => c.uid === ub) ?? null;
  const pick = (slot: 0 | 1) => openModal({ kind: 'parentPicker', exclude: slot === 0 ? ub : ua, onPick: slot === 0 ? setUa : setUb });
  const cost = a && b ? breedingCost(a, b, stabilize) : null;
  const blockers = [a, b].filter(Boolean).map((c) => breedBlocker(c!, now)).filter(Boolean);
  const affordable = cost && state.wallet.essence >= cost.essence && state.wallet.coins >= cost.coins;
  const eligibleCount = state.creatures.filter((c) => !breedBlocker(c, now)).length;

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="intro-banner">
        <h2>Laboratoire génétique</h2>
        <p className="soft">Associe deux créatures pour obtenir un <b>œuf génétique</b> qui hérite de leurs gènes, de leur teinte et parfois de leurs mutations. Certaines combinaisons réveillent des <b>recettes secrètes</b>. Toutes les probabilités sont affichées avant de valider.</p>
      </div>

      {eligibleCount < 2 && (
        <div className="status-panel"><Icon name="info" /><p style={{ fontSize: 14 }}>Il te faut au moins deux créatures de <b>niveau {B.minLevel}</b> avec <b>{B.minAffection} d'affection</b>. Nourris-les pour les faire grandir ({eligibleCount} prête{eligibleCount > 1 ? 's' : ''} actuellement).</p></div>
      )}

      <div className="lab-grid">
        <ParentSlot c={a} label="Premier parent" onPick={() => pick(0)} onClear={() => setUa(null)} />
        <div className="lab-center">
          <svg viewBox="0 0 60 100" width="46" height="76" aria-hidden="true" className="lab-helix">
            <path d="M15 0C45 15 15 35 45 50S15 85 45 100" stroke="#7b5cff" strokeWidth="4" fill="none" />
            <path d="M45 0C15 15 45 35 15 50S45 85 15 100" stroke="#ff7ab6" strokeWidth="4" fill="none" />
          </svg>
        </div>
        <ParentSlot c={b} label="Second parent" onPick={() => pick(1)} onClear={() => setUb(null)} />
      </div>

      {a && b && (
        <div className="lab-forecast">
          <div className="card"><Forecast a={a} b={b} stabilize={stabilize} /></div>
          <div className="card stack">
            <div className="setting" style={{ borderBottom: 0 }}>
              <Icon name="flask" />
              <div><b>Stabilisateur d'essence</b><span>Transmission des mutations : {Math.round(B.inheritChance * 100)} % → {Math.round(B.stabilizedInheritChance * 100)} % (+{B.stabilizerEssence} essence)</span></div>
              <button className={`toggle ${stabilize ? 'on' : ''}`} aria-pressed={stabilize} aria-label="Stabilisateur" onClick={() => setStabilize(!stabilize)} />
            </div>
            <div className="row-wrap"><span className="muted" style={{ fontWeight: 800 }}>Coût</span><Price currency="essence" amount={cost!.essence} /><Price currency="coins" amount={cost!.coins} /></div>
            <p className="muted" style={{ fontSize: 12 }}>Après une fusion, chaque parent se repose {B.cooldownMs / 3600000} h. Une créature peut participer à {B.maxBreeds} fusions au maximum. L'essence s'obtient en libérant des créatures et via les quêtes.</p>
            {blockers.length > 0 && <p style={{ color: 'var(--danger)', fontWeight: 800, fontSize: 13 }}>{blockers.join(' · ')}</p>}
            <button className="btn btn-pink btn-lg" disabled={blockers.length > 0 || !affordable} onClick={() => {
              const ev = dispatch({ type: 'breed', a: a.uid, b: b.uid, stabilize });
              if (ev) { setUa(null); setUb(null); setStabilize(false); }
            }}><Icon name="sparkle" />Lancer la fusion</button>
          </div>
        </div>
      )}

      <div className="section-title"><Icon name="book" width={22} height={22} style={{ color: 'var(--violet)' }} /><h2>Carnet de recettes</h2><span className="muted">{state.recipesFound.length}/{RECIPES.length}</span></div>
      <div className="grid-auto" style={{ ['--min' as string]: '260px' } as CSSProperties}>
        {RECIPES.map((r) => {
          const found = state.recipesFound.includes(r.id);
          const parentText = (i: 0 | 1) => { const m = r.parents[i]; return m.species ? SPECIES[m.species]!.name : `une créature ${ELEMENTS[m.element!].name}`; };
          return (
            <div key={r.id} className={`card recipe-card ${found ? 'found' : ''}`}>
              <CreatureArt speciesId={r.result} size={64} anim={found ? 'idle' : 'none'} silhouette={!found} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{found ? r.name : 'Recette inconnue'}</b>
                <p className="soft" style={{ fontSize: 13, marginTop: 2 }}>{found ? `${parentText(0)} + ${parentText(1)} → ${SPECIES[r.result]!.name} (${formatPct(r.chance)})` : `« ${r.hint} »`}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
