import { useState, type CSSProperties } from 'react';
import { AMBIANCES } from '@data/ambiances';
import { EGGS } from '@data/eggs';
import { ITEMS } from '@data/items';
import { SHOP_OFFERS } from '@data/shop';
import type { ShopOffer } from '@core/content';
import { incubationDuration } from '@core/systems/incubation';
import { offerLabel, offerStatus } from '@core/systems/shop';
import { formatDuration } from '@core/time';
import { EggArt } from '../art/EggArt';
import { Icon } from '../art/Icons';
import { RarityBadge } from '../components/Badges';
import { Price } from '../components/Price';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';

type Tab = 'egg' | 'food' | 'upgrade';

function OfferVisual({ o }: { o: ShopOffer }) {
  if (o.kind === 'egg') return <EggArt type={o.ref} size={70} />;
  if (o.kind === 'item') return <span className="food-ic big" style={{ ['--fc' as string]: ITEMS[o.ref]!.color } as CSSProperties} />;
  if (o.kind === 'ambiance') return <span className="amb-orb" style={{ ['--ac' as string]: AMBIANCES[o.ref]!.color } as CSSProperties} />;
  return <span className="slot-orb"><Icon name="egg" /></span>;
}

function OfferDesc({ o }: { o: ShopOffer }) {
  switch (o.kind) {
    case 'egg': return <><RarityBadge rarity={EGGS[o.ref]!.rarity} small /><p className="soft offer-desc">{EGGS[o.ref]!.description}</p><span className="muted" style={{ fontSize: 12, fontWeight: 700 }}><Icon name="clock" width={12} height={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> {formatDuration(incubationDuration(o.ref, 'neutre'))}</span></>;
    case 'item': return <p className="soft offer-desc">{ITEMS[o.ref]!.description}{ITEMS[o.ref]!.kind === 'food' ? ` (+${ITEMS[o.ref]!.xp} XP)` : ''}</p>;
    case 'ambiance': return <p className="soft offer-desc">{AMBIANCES[o.ref]!.description}</p>;
    case 'incubator_slot': return <p className="soft offer-desc">Un emplacement supplémentaire pour incuber plusieurs œufs en parallèle.</p>;
  }
}

export function ShopScreen() {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const openModal = useUi((s) => s.openModal);
  const [tab, setTab] = useState<Tab>('egg');
  const offers = SHOP_OFFERS.filter((o) => (tab === 'egg' ? o.kind === 'egg' : tab === 'food' ? o.kind === 'item' : o.kind === 'incubator_slot' || o.kind === 'ambiance'));

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="status-panel fair"><Icon name="check" /><p style={{ fontSize: 14 }}><b>Boutique équitable.</b> Tout s'achète avec les monnaies gagnées en jouant — aucun paiement réel. Les probabilités de chaque œuf sont affichées avant l'achat (bouton <Icon name="dice" width={14} height={14} style={{ display: 'inline', verticalAlign: '-2px' }} />).</p></div>
      <div className="tabs">
        <button className={tab === 'egg' ? 'active' : ''} onClick={() => setTab('egg')}><Icon name="egg" width={16} height={16} />Œufs</button>
        <button className={tab === 'food' ? 'active' : ''} onClick={() => setTab('food')}><Icon name="leaf" width={16} height={16} />Nourriture</button>
        <button className={tab === 'upgrade' ? 'active' : ''} onClick={() => setTab('upgrade')}><Icon name="sanctuary" width={16} height={16} />Améliorations</button>
      </div>
      <div className="shop-grid">
        {offers.map((o) => {
          const st = offerStatus(state, o);
          return (
            <div key={o.id} className={`card offer ${st.state}`}>
              {st.state === 'locked' && <span className="offer-lock"><Icon name="lock" />{st.reason}</span>}
              {st.state === 'owned' && <span className="offer-lock owned"><Icon name="check" />Possédé</span>}
              <div className="offer-visual"><OfferVisual o={o} /></div>
              <b className="offer-name">{offerLabel(o)}</b>
              <OfferDesc o={o} />
              <div className="row" style={{ marginTop: 'auto', paddingTop: 10, width: '100%' }}>
                {o.kind === 'egg' && <button className="icon-btn tip" data-tip="Probabilités" onClick={() => openModal({ kind: 'odds', eggType: o.ref })}><Icon name="dice" /></button>}
                <button className="btn btn-sm" style={{ flex: 1 }} disabled={st.state !== 'available'} onClick={() => dispatch({ type: 'buy', offerId: o.id })}>
                  {st.state === 'owned' ? 'Acquis' : <Price currency={o.price.currency} amount={o.price.amount} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
