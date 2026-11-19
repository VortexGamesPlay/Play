import { useState, type CSSProperties } from 'react';
import { EGGS } from '@data/eggs';
import { ITEMS } from '@data/items';
import { BALANCE } from '@data/balance';
import { CURRENCY_NAMES } from '@core/systems/economy';
import { EggArt } from '../art/EggArt';
import { CurrencyIcon, Icon } from '../art/Icons';
import { RarityBadge } from '../components/Badges';
import { EmptyState } from '../components/EmptyState';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { groupEggs } from './IncubatorScreen';
import { fmtDateTime, foodTagName } from '../format';

type Tab = 'items' | 'eggs' | 'ledger';

export function InventoryScreen() {
  const state = useGame((s) => s.state);
  const { openModal, navigate } = useUi.getState();
  const [tab, setTab] = useState<Tab>('items');
  const items = Object.entries(state.inventory).filter(([id, q]) => ITEMS[id] && q > 0);
  const eggs = groupEggs(state.eggs);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="wallet-cards">
        {(['coins', 'crystals', 'essence'] as const).map((c) => (
          <div key={c} className="card wallet-card"><CurrencyIcon currency={c} width={34} height={34} /><div><b className="num">{state.wallet[c].toLocaleString('fr-FR')}</b><span>{CURRENCY_NAMES[c]}</span></div></div>
        ))}
      </div>
      <div className="tabs">
        <button className={tab === 'items' ? 'active' : ''} onClick={() => setTab('items')}>Objets<span className="count">{items.reduce((s, [, q]) => s + q, 0)}</span></button>
        <button className={tab === 'eggs' ? 'active' : ''} onClick={() => setTab('eggs')}>Œufs<span className="count">{state.eggs.length}/{BALANCE.maxEggStorage}</span></button>
        <button className={tab === 'ledger' ? 'active' : ''} onClick={() => setTab('ledger')}>Transactions</button>
      </div>

      {tab === 'items' && (items.length === 0 ? <EmptyState icon="backpack" title="Inventaire vide" action={<button className="btn" onClick={() => navigate('boutique')}>Boutique</button>}>La nourriture achetée ou gagnée apparaîtra ici.</EmptyState> : (
        <div className="grid-auto" style={{ ['--min' as string]: '220px' } as CSSProperties}>
          {items.map(([id, q]) => {
            const d = ITEMS[id]!;
            return (
              <div key={id} className="card item-card">
                <div className="row"><span className="food-ic" style={{ ['--fc' as string]: d.color } as CSSProperties} /><div style={{ flex: 1 }}><b>{d.name}</b><div className="muted" style={{ fontSize: 12 }}>×{q} · {d.tags.map(foodTagName).join(', ')}</div></div></div>
                <p className="soft" style={{ fontSize: 13, margin: '8px 0' }}>{d.description}</p>
                <div className="row"><span className="badge soft-badge">+{d.xp} XP</span><span className="badge soft-badge">+{d.affection} affection</span><span className="spacer" />
                  <button className="btn btn-mint btn-sm" disabled={state.creatures.length === 0} onClick={() => openModal({ kind: 'feed', item: id })}>Utiliser</button></div>
              </div>
            );
          })}
        </div>
      ))}

      {tab === 'eggs' && (eggs.length === 0 ? <EmptyState icon="egg" title="Aucun œuf">Récompense quotidienne, quêtes et boutique te fourniront des œufs.</EmptyState> : (
        <div className="grid-auto" style={{ ['--min' as string]: '240px' } as CSSProperties}>
          {eggs.map(([type, list]) => (
            <div key={type} className="card item-card">
              <div className="row"><EggArt type={type} size={44} /><div style={{ flex: 1 }}><b>{EGGS[type]!.name}</b> <span className="muted">×{list.length}</span><div><RarityBadge rarity={EGGS[type]!.rarity} small /></div></div></div>
              <p className="soft" style={{ fontSize: 13, margin: '8px 0' }}>{EGGS[type]!.description}</p>
              <div className="row"><button className="btn btn-ghost btn-sm" onClick={() => openModal({ kind: 'odds', eggType: type })}><Icon name="dice" />Probabilités</button><span className="spacer" /><button className="btn btn-sm" onClick={() => navigate('incubateur')}>Incuber</button></div>
            </div>
          ))}
        </div>
      ))}

      {tab === 'ledger' && (state.ledger.length === 0 ? <EmptyState icon="scroll" title="Aucune transaction">Les gains et dépenses importants sont journalisés ici.</EmptyState> : (
        <div className="card ledger">
          {[...state.ledger].reverse().map((l, i) => (
            <div key={i} className="ledger-row">
              <CurrencyIcon currency={l.currency} width={22} height={22} />
              <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 14 }}>{l.reason}</b><div className="muted" style={{ fontSize: 12 }}>{fmtDateTime(l.at)}</div></div>
              <b className={`num ${l.delta > 0 ? 'pos' : 'neg'}`}>{l.delta > 0 ? '+' : ''}{l.delta.toLocaleString('fr-FR')}</b>
              <span className="muted num" style={{ fontSize: 12, width: 70, textAlign: 'right' }}>{l.balance.toLocaleString('fr-FR')}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
