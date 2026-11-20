import { useMemo, useState, type CSSProperties } from 'react';
import { ELEMENTS } from '@data/elements';
import { RARITIES, RARITY_ORDER } from '@data/rarities';
import { ITEMS } from '@data/items';
import { canEvolve } from '@core/systems/evolution';
import { creatureCap } from '@core/systems/buildings';
import { isAway } from '@core/systems/exploration';
import { useNow } from '../hooks/useNow';
import { computeStats, displayName, getSpecies } from '@core/systems/creatures';
import type { ElementId, RarityId } from '@core/types';
import { ElementIcon, Icon } from '../art/Icons';
import { CreatureCard } from '../components/CreatureCard';
import { EmptyState } from '../components/EmptyState';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { tr } from '../../i18n';

type Sort = 'recent' | 'level' | 'rarity' | 'power' | 'name' | 'dex';

export function CollectionScreen() {
  const state = useGame((s) => s.state);
  const creatures = state.creatures;
  const now = useNow();
  const { openModal, navigate } = useUi.getState();
  const [sort, setSort] = useState<Sort>('recent');
  const [el, setEl] = useState<ElementId | null>(null);
  const [rar, setRar] = useState<RarityId | null>(null);
  const [fav, setFav] = useState(false);
  const [mut, setMut] = useState(false);
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const l = creatures.filter((c) => {
      const sp = getSpecies(c.speciesId);
      if (el && sp.element !== el) return false;
      if (rar && sp.rarity !== rar) return false;
      if (fav && !c.favorite) return false;
      if (mut && c.mutations.length === 0) return false;
      if (q.trim() && !displayName(c).toLowerCase().includes(q.trim().toLowerCase()) && !sp.name.toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    });
    const tier = (id: string) => RARITIES[getSpecies(id).rarity].tier;
    const cmp: Record<Sort, (a: typeof l[0], b: typeof l[0]) => number> = {
      recent: (a, b) => b.hatchedAt - a.hatchedAt,
      level: (a, b) => b.level - a.level || b.xp - a.xp,
      rarity: (a, b) => tier(b.speciesId) - tier(a.speciesId) || b.mutations.length - a.mutations.length,
      power: (a, b) => computeStats(b).power - computeStats(a).power,
      name: (a, b) => displayName(a).localeCompare(displayName(b), 'fr'),
      dex: (a, b) => getSpecies(a.speciesId).dex - getSpecies(b.speciesId).dex,
    };
    return l.sort(cmp[sort]);
  }, [creatures, sort, el, rar, fav, mut, q]);

  if (creatures.length === 0) {
    return <EmptyState icon="paw" title={tr('Aucune créature pour l\'instant')} action={<button className="btn btn-pink" onClick={() => navigate('incubateur')}><Icon name="egg" />{tr('Faire éclore un œuf')}</button>}>{tr('Tes créatures apparaîtront ici dès leur éclosion.')}</EmptyState>;
  }

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 22 }}>{tr('Mes créatures')} <span className="muted num" style={{ fontSize: 15 }}>{creatures.length}/{creatureCap(state)}</span></h2>
        {(() => {
          const food = Object.keys(useGame.getState().state.inventory).find((id) => ITEMS[id]?.kind === 'food');
          return <button className="btn btn-ghost btn-sm" onClick={() => food && openModal({ kind: 'feed', item: food })} disabled={!food}><Icon name="leaf" />{tr('Nourrir…')}</button>;
        })()}
      </div>
      <div className="filters">
        <div className="field" style={{ flex: '1 1 200px' }}><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr('Rechercher…')} aria-label={tr('Rechercher')} /></div>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label={tr('Trier')}>
          <option value="recent">{tr('Plus récentes')}</option><option value="level">{tr('Niveau')}</option><option value="rarity">{tr('Rareté')}</option>
          <option value="power">{tr('Puissance')}</option><option value="dex">{tr('N° Bestiaire')}</option><option value="name">{tr('Nom')}</option>
        </select>
        <select className="select" value={rar ?? ''} onChange={(e) => setRar((e.target.value || null) as RarityId | null)} aria-label={tr('Rareté')}>
          <option value="">{tr('Toutes raretés')}</option>
          {RARITY_ORDER.map((r) => <option key={r} value={r}>{RARITIES[r].name}</option>)}
        </select>
        <button className={`chip ${fav ? 'active' : ''}`} style={{ ['--cc' as string]: '#ff7ab6' } as CSSProperties} onClick={() => setFav(!fav)}><Icon name="heartFill" />{tr('Favoris')}</button>
        <button className={`chip ${mut ? 'active' : ''}`} onClick={() => setMut(!mut)}><Icon name="sparkle" />{tr('Mutées')}</button>
      </div>
      <div className="el-filter">
        {Object.values(ELEMENTS).filter((e) => creatures.some((c) => getSpecies(c.speciesId).element === e.id)).map((e) => (
          <button key={e.id} className={`chip ${el === e.id ? 'active' : ''}`} style={{ ['--cc' as string]: e.color } as CSSProperties} onClick={() => setEl(el === e.id ? null : e.id)}>
            <ElementIcon element={e.id} style={{ color: e.color }} />{e.name}
          </button>
        ))}
      </div>
      {list.length === 0 ? <EmptyState icon="search" title={tr('Aucun résultat')}>{tr('Aucune créature ne correspond à ces filtres.')}</EmptyState> : (
        <div className="cr-grid">{list.map((c) => <CreatureCard key={c.uid} c={c} evolvable={canEvolve(state, c, now)} away={isAway(state, c.uid)} onClick={() => openModal({ kind: 'creature', uid: c.uid })} />)}</div>
      )}
    </div>
  );
}
