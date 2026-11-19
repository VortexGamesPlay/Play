import type { CSSProperties } from 'react';
import { BALANCE } from '@data/balance';
import { ITEMS } from '@data/items';
import { displayName, getSpecies } from '@core/systems/creatures';
import { isFavoriteFood } from '@core/systems/feeding';
import { isAway } from '@core/systems/exploration';
import { CreatureArt } from '../art/CreatureArt';
import { Icon } from '../art/Icons';
import { Bar } from '../components/Bar';
import { EmptyState } from '../components/EmptyState';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { xpToNext } from '@data/balance';

/** Nourrir : soit on a choisi la créature (liste des aliments), soit l'aliment (liste des créatures). */
export function FeedModal({ uid, item }: { uid?: string; item?: string }) {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const { closeModal, navigate } = useUi.getState();

  if (uid) {
    const c = state.creatures.find((x) => x.uid === uid);
    if (!c) return null;
    const foods = Object.entries(state.inventory).filter(([id, q]) => ITEMS[id]?.kind === 'food' && q > 0);
    return (
      <div className="stack">
        <div className="row">
          <CreatureArt speciesId={c.speciesId} mutations={c.mutations} hue={c.genes.hue} size={64} seed={c.uid} />
          <div style={{ flex: 1 }}>
            <b>{displayName(c)}</b> <span className="muted">· Nv {c.level}</span>
            <Bar value={c.level >= BALANCE.maxLevel ? 1 : c.xp / xpToNext(c.level)} size="thin" />
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Aliments favoris : XP ×{BALANCE.favoriteFoodMultiplier} et affection ×2</div>
          </div>
        </div>
        {foods.length === 0 ? (
          <EmptyState icon="leaf" title="Plus de nourriture" action={<button className="btn" onClick={() => { closeModal(); closeModal(); navigate('boutique'); }}><Icon name="bag" />Boutique</button>}>
            Achète de la nourriture en boutique ou gagne-en avec les quêtes.
          </EmptyState>
        ) : (
          <div className="picker-list">
            {foods.map(([id, q]) => {
              const def = ITEMS[id]!;
              const fav = isFavoriteFood(c.speciesId, id);
              return (
                <div key={id} className="picker-row">
                  <span className="food-ic" style={{ ['--fc' as string]: def.color } as CSSProperties} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row-wrap"><b>{def.name}</b><span className="badge soft-badge">×{q}</span>{fav && <span className="badge" style={{ background: '#ffe3f0', color: '#d0346f' }}><Icon name="heartFill" />Favori</span>}</div>
                    <div className="muted" style={{ fontSize: 12 }}>+{Math.round(def.xp * (fav ? BALANCE.favoriteFoodMultiplier : 1))} XP · +{def.affection * (fav ? 2 : 1)} affection</div>
                  </div>
                  <button className="btn btn-mint btn-sm" onClick={() => dispatch({ type: 'feed', uid, item: id })}>Donner</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (item) {
    const def = ITEMS[item];
    const qty = state.inventory[item] ?? 0;
    return (
      <div className="stack">
        <p className="soft">Choisis qui mangera : <b>{def?.name}</b> (×{qty})</p>
        {state.creatures.length === 0 ? <EmptyState icon="paw" title="Aucune créature">Fais éclore un œuf d'abord.</EmptyState> : (
          <div className="picker-list">
            {state.creatures.filter((c) => !isAway(state, c.uid)).map((c) => {
              const fav = isFavoriteFood(c.speciesId, item);
              return (
                <div key={c.uid} className="picker-row">
                  <CreatureArt speciesId={c.speciesId} mutations={c.mutations} hue={c.genes.hue} size={44} anim="none" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row-wrap"><b>{displayName(c)}</b><span className="muted" style={{ fontSize: 12 }}>Nv {c.level} · {getSpecies(c.speciesId).name}</span>{fav && <Icon name="heartFill" width={14} height={14} style={{ color: 'var(--pink)' }} />}</div>
                  </div>
                  <button className="btn btn-mint btn-sm" disabled={qty <= 0} onClick={() => dispatch({ type: 'feed', uid: c.uid, item })}>Donner</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  return null;
}
