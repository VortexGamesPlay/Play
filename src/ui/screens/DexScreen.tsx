import { useMemo, useState, type CSSProperties } from 'react';
import { ELEMENTS } from '@data/elements';
import { MUTATIONS } from '@data/mutations';
import { RARITIES, RARITY_ORDER } from '@data/rarities';
import { SPECIES_LIST } from '@data/species';
import { dexCompletion, dexCount, isDiscovered, variantCount } from '@core/systems/dex';
import type { ElementId, RarityId } from '@core/types';
import { CreatureArt } from '../art/CreatureArt';
import { ElementIcon, Icon } from '../art/Icons';
import { EmptyState } from '../components/EmptyState';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { getSpecies } from '@core/systems/creatures';
import { fmtDateTime } from '../format';

type Cat = 'all' | 'known' | 'unknown' | 'variants' | 'legend' | 'secret' | 'history';
const LEGEND_TIERS = 4;

export function DexScreen() {
  const state = useGame((s) => s.state);
  const openModal = useUi((s) => s.openModal);
  const [cat, setCat] = useState<Cat>('all');
  const [q, setQ] = useState('');
  const [el, setEl] = useState<ElementId | null>(null);
  const [rar, setRar] = useState<RarityId | null>(null);

  const known = dexCount(state);
  const pct = Math.round(dexCompletion(state) * 100);
  const totalVariants = SPECIES_LIST.length * Object.keys(MUTATIONS).length;

  const cats: [Cat, string, number][] = [
    ['all', 'Toutes', SPECIES_LIST.length],
    ['known', 'Découvertes', known],
    ['unknown', 'Inconnues', SPECIES_LIST.length - known],
    ['variants', 'Variantes', variantCount(state)],
    ['legend', 'Légendaires', SPECIES_LIST.filter((s) => RARITIES[s.rarity].tier >= LEGEND_TIERS && s.rarity !== 'secret').length],
    ['secret', 'Secrètes', SPECIES_LIST.filter((s) => s.rarity === 'secret').length],
    ['history', 'Historique', state.discoveries.length],
  ];

  const list = useMemo(() => SPECIES_LIST.filter((s) => {
    const k = isDiscovered(state, s.id);
    if (cat === 'known' && !k) return false;
    if (cat === 'unknown' && k) return false;
    if (cat === 'variants' && !(state.dex[s.id]?.variants.length)) return false;
    if (cat === 'legend' && !(RARITIES[s.rarity].tier >= LEGEND_TIERS && s.rarity !== 'secret')) return false;
    if (cat === 'secret' && s.rarity !== 'secret') return false;
    if (el && s.element !== el) return false;
    if (rar && s.rarity !== rar) return false;
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      const num = String(s.dex).padStart(3, '0');
      if (!(num.includes(needle) || (k && (s.name.toLowerCase().includes(needle) || s.family.toLowerCase().includes(needle))))) return false;
    }
    return true;
  }), [state, cat, el, rar, q]);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card dex-hero">
        <div className="dex-ring" style={{ ['--p' as string]: pct } as CSSProperties}><b className="num">{pct}%</b><span>complété</span></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>Ovidex</h2>
          <p className="soft" style={{ fontSize: 14 }}>L'encyclopédie des créatures oubliées. Chaque éclosion lève un peu plus le voile.</p>
          <div className="dex-stats">
            <div><b className="num">{known}/{SPECIES_LIST.length}</b><span>espèces</span></div>
            <div><b className="num">{variantCount(state)}/{totalVariants}</b><span>variantes</span></div>
            <div><b className="num">{state.stats.eggsHatched}</b><span>éclosions</span></div>
          </div>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {cats.map(([id, l, n]) => <button key={id} role="tab" aria-selected={cat === id} className={cat === id ? 'active' : ''} onClick={() => setCat(id)}>{l}<span className="count">{n}</span></button>)}
      </div>

      {cat === 'history' ? (
        state.discoveries.length === 0 ? <EmptyState icon="book" title="Aucune découverte">Tes découvertes seront consignées ici, avec leur date.</EmptyState> : (
          <div className="card history">
            {[...state.discoveries].reverse().map((d, i) => (
              <button key={i} className="disc-item" onClick={() => openModal({ kind: 'dex', speciesId: d.speciesId })}>
                <CreatureArt speciesId={d.speciesId} mutations={d.mutationId ? [d.mutationId] : []} size={44} anim="none" />
                <div style={{ flex: 1 }}><b>{getSpecies(d.speciesId).name}</b><div className="muted" style={{ fontSize: 12 }}>{d.kind === 'species' ? 'Nouvelle espèce' : `Variante ${MUTATIONS[d.mutationId!]?.name}`}</div></div>
                <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>{fmtDateTime(d.at)}</span>
              </button>
            ))}
          </div>
        )
      ) : (
        <>
          <div className="filters">
            <div className="field" style={{ flex: '1 1 220px' }}><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, famille ou numéro…" aria-label="Rechercher" /></div>
            <select className="select" value={rar ?? ''} onChange={(e) => setRar((e.target.value || null) as RarityId | null)} aria-label="Rareté">
              <option value="">Toutes raretés</option>
              {RARITY_ORDER.map((r) => <option key={r} value={r}>{RARITIES[r].name}</option>)}
            </select>
          </div>
          <div className="el-filter">
            {Object.values(ELEMENTS).map((e) => (
              <button key={e.id} className={`chip ${el === e.id ? 'active' : ''}`} style={{ ['--cc' as string]: e.color } as CSSProperties} onClick={() => setEl(el === e.id ? null : e.id)}>
                <ElementIcon element={e.id} style={{ color: e.color }} />{e.name}
              </button>
            ))}
          </div>
          {list.length === 0 ? <EmptyState icon="search" title="Aucune espèce">Aucune entrée ne correspond à ces filtres.</EmptyState> : (
            <div className="dex-grid">
              {list.map((s) => {
                const k = isDiscovered(state, s.id);
                const entry = state.dex[s.id];
                const r = RARITIES[s.rarity];
                return (
                  <button key={s.id} className={`dex-cell ${k ? 'known' : 'unknown'} t${r.tier} ${s.rarity === 'secret' ? 'secret' : ''}`} style={{ ['--rc' as string]: r.color, ['--rg' as string]: r.glow } as CSSProperties} onClick={() => openModal({ kind: 'dex', speciesId: s.id })}>
                    <span className="dex-num num">{String(s.dex).padStart(3, '0')}</span>
                    {k && (entry?.variants.length ?? 0) > 0 && <span className="dex-var tip" data-tip={`${entry!.variants.length} variante(s)`}><Icon name="sparkle" /></span>}
                    <CreatureArt speciesId={s.id} size={92} anim={k ? 'idle' : 'none'} silhouette={!k} seed={s.id} />
                    <b className="dex-name">{k ? s.name : s.rarity === 'secret' ? '◆ ◆ ◆' : '???'}</b>
                    <span className="dex-meta">{k ? <><ElementIcon element={s.element} style={{ color: ELEMENTS[s.element].color }} width={14} height={14} />{r.name}</> : <span className="rar-hint" />}</span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
