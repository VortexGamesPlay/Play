import type { CSSProperties } from 'react';
import { AMBIANCES } from '@data/ambiances';
import { BALANCE } from '@data/balance';
import { EGGS } from '@data/eggs';
import { MUTATIONS } from '@data/mutations';
import { RARITIES } from '@data/rarities';
import { SHOP_OFFERS } from '@data/shop';
import { canIncubateIn, incubationDuration, isReady, progressOf, speedUpCost } from '@core/systems/incubation';
import { formatDuration, isNight } from '@core/time';
import type { EggInstance, IncubatorSlot } from '@core/types';
import { EggArt } from '../art/EggArt';
import { CrystalIcon, Icon } from '../art/Icons';
import { RarityBadge } from '../components/Badges';
import { EmptyState } from '../components/EmptyState';
import { Price } from '../components/Price';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { useNow } from '../hooks/useNow';
import { playSfx } from '../../services/audio';

/** Regroupe les œufs identiques ; chaque œuf génétique reste à part (contenu unique). */
export function groupEggs(eggs: EggInstance[]): [string, EggInstance[]][] {
  const map = new Map<string, EggInstance[]>();
  for (const e of eggs) {
    const key = e.genetics ? e.uid : e.type;
    map.set(key, [...(map.get(key) ?? []), e]);
  }
  return [...map.values()]
    .sort((a, b) => RARITIES[EGGS[a[0]!.type]!.rarity].tier - RARITIES[EGGS[b[0]!.type]!.rarity].tier)
    .map((list) => [list[0]!.type, list]);
}

export function geneticsLabel(e: EggInstance): string | null {
  return e.genetics ? `${e.genetics.parentNames[0]} × ${e.genetics.parentNames[1]}` : null;
}

function Ring({ value, color }: { value: number; color: string }) {
  const r = 70, c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 160 160" aria-hidden="true">
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(123,92,255,.12)" strokeWidth="9" />
      <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value)} transform="rotate(-90 80 80)" style={{ transition: 'stroke-dashoffset .5s' }} />
    </svg>
  );
}

function AmbianceSelect({ slot, index }: { slot: IncubatorSlot; index: number }) {
  const unlocked = useGame((s) => s.state.unlocks.ambiances);
  const dispatch = useGame((s) => s.dispatch);
  const amb = AMBIANCES[slot.ambiance]!;
  if (slot.egg) {
    return <span className="amb-chip" style={{ ['--ac' as string]: amb.color } as CSSProperties}><i />{amb.name}</span>;
  }
  return (
    <label className="amb-select" style={{ ['--ac' as string]: amb.color } as CSSProperties}>
      <i />
      <select value={slot.ambiance} onChange={(e) => dispatch({ type: 'setAmbiance', slot: index, ambiance: e.target.value })} aria-label="Ambiance de l'incubateur">
        {unlocked.map((a) => <option key={a} value={a}>{AMBIANCES[a]!.name}</option>)}
      </select>
    </label>
  );
}

function SlotCard({ slot, index }: { slot: IncubatorSlot; index: number }) {
  const now = useNow();
  const dispatch = useGame((s) => s.dispatch);
  const crystals = useGame((s) => s.state.wallet.crystals);
  const openModal = useUi((s) => s.openModal);
  const amb = AMBIANCES[slot.ambiance]!;

  if (!slot.egg) {
    return (
      <div className="slot card" style={{ ['--ac' as string]: amb.color } as CSSProperties}>
        <div className="slot-head"><b>Incubateur {index + 1}</b><AmbianceSelect slot={slot} index={index} /></div>
        <button className="slot-empty" onClick={() => { playSfx('open'); openModal({ kind: 'eggPicker', slot: index }); }}>
          <span className="slot-plus"><Icon name="plus" /></span>
          <b>Placer un œuf</b>
          <span className="muted" style={{ fontSize: 12 }}>{amb.description}</span>
        </button>
      </div>
    );
  }

  const egg = EGGS[slot.egg.type]!;
  const ready = isReady(slot, now);
  const progress = progressOf(slot, now);
  const cost = speedUpCost(slot, now);
  const rc = RARITIES[egg.rarity].color;
  return (
    <div className={`slot card ${ready ? 'ready' : ''}`} style={{ ['--ac' as string]: amb.color, ['--rc' as string]: rc } as CSSProperties}>
      <div className="slot-head"><b>Incubateur {index + 1}</b><AmbianceSelect slot={slot} index={index} /></div>
      <div className="slot-egg">
        <Ring value={progress} color={ready ? '#3fcf9f' : rc} />
        <div className="slot-egg-art"><EggArt type={slot.egg.type} size={78} wobble={ready || progress > 0.8} /></div>
        {ready && <div className="slot-glow" />}
      </div>
      <div className="slot-name">{egg.name} <RarityBadge rarity={egg.rarity} small /></div>
      <div className="slot-time num">{ready ? 'Prêt à éclore !' : <><Icon name="clock" width={14} height={14} />{formatDuration(slot.readyAt - now)}</>}</div>
      <div className="slot-actions">
        {ready ? (
          <button className="btn btn-pink btn-block btn-lg hatch-btn" onClick={() => { playSfx('crack'); dispatch({ type: 'hatch', slot: index }); }}><Icon name="sparkle" />Faire éclore</button>
        ) : (
          <>
            <button className="btn btn-sm" disabled={crystals < cost} onClick={() => dispatch({ type: 'speedUp', slot: index })} title={`Coût : ${cost} cristaux (1 cristal / ${BALANCE.speedUpMsPerCrystal / 60000} min restantes)`}>
              <Icon name="bolt" />Accélérer <span className="price"><CrystalIcon />{cost}</span>
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => openModal({
              kind: 'confirm', title: 'Retirer l\'œuf ?', body: 'L\'œuf retournera dans ton panier mais la progression d\'incubation sera perdue.', confirmLabel: 'Retirer',
              onConfirm: () => dispatch({ type: 'removeEgg', slot: index }),
            })}>Retirer</button>
          </>
        )}
      </div>
    </div>
  );
}

export function EggPickerModal({ slot }: { slot: number }) {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const { closeModal, openModal, navigate } = useUi.getState();
  const s = state.incubators[slot];
  if (!s) return null;
  const groups = groupEggs(state.eggs);
  const amb = AMBIANCES[s.ambiance]!;
  return (
    <div className="stack">
      <div className="status-panel" style={{ background: `color-mix(in srgb, ${amb.color} 14%, white)` }}>
        <Icon name="info" />
        <div><b>Ambiance : {amb.name}</b><div className="soft" style={{ fontSize: 13 }}>{amb.description}</div></div>
      </div>
      {groups.length === 0 ? (
        <EmptyState icon="egg" title="Aucun œuf dans ton panier" action={<button className="btn" onClick={() => { closeModal(); navigate('boutique'); }}><Icon name="bag" />Boutique</button>}>
          Récupère des œufs via la récompense quotidienne, les quêtes ou la boutique.
        </EmptyState>
      ) : (
        <div className="picker-list">
          {groups.map(([type, eggs]) => {
            const egg = EGGS[type]!;
            const ok = canIncubateIn(type, s.ambiance);
            const dur = incubationDuration(type, s.ambiance);
            const fast = egg.affinity.includes(s.ambiance);
            return (
              <div key={eggs[0]!.uid} className={`picker-row ${ok ? '' : 'disabled'}`}>
                <EggArt type={type} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row-wrap"><b>{egg.name}</b><RarityBadge rarity={egg.rarity} small /><span className="badge soft-badge">×{eggs.length}</span></div>
                  {geneticsLabel(eggs[0]!) && <div className="soft" style={{ fontSize: 12, fontWeight: 700 }}>Parents : {geneticsLabel(eggs[0]!)}</div>}
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    <Icon name="clock" width={12} height={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> {formatDuration(dur)}
                    {fast && <b style={{ color: 'var(--mint)' }}> · ambiance favorable (−25 %)</b>}
                    {!ok && <b style={{ color: 'var(--danger)' }}> · nécessite {egg.requiresAmbiance!.map((a) => AMBIANCES[a]!.name).join(' / ')}</b>}
                  </div>
                </div>
                <button className="icon-btn tip" data-tip="Probabilités" onClick={() => openModal({ kind: 'odds', eggType: type })}><Icon name="dice" /></button>
                <button className="btn btn-sm" disabled={!ok} onClick={() => { closeModal(); dispatch({ type: 'placeEgg', eggUid: eggs[0]!.uid, slot }); playSfx('whoosh'); }}>Incuber</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function IncubatorScreen() {
  const state = useGame((s) => s.state);
  const navigate = useUi((s) => s.navigate);
  const now = useNow();
  const night = isNight(new Date(now).getHours());
  const nextSlotOffer = SHOP_OFFERS.find((o) => o.kind === 'incubator_slot' && o.slotNumber === state.incubators.length + 1);
  const groups = groupEggs(state.eggs);

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="intro-banner">
        <div>
          <h2>Les incubateurs</h2>
          <p className="soft">Chaque incubateur possède une <b>ambiance</b> qui influence les mutations (jamais garanties) et peut accélérer certains œufs. {night ? 'Il fait nuit : les mutations cosmiques sont renforcées sous la Nuit étoilée.' : 'Certaines mutations sont renforcées la nuit (20h–6h).'}</p>
        </div>
      </div>

      <div className="slots-grid">
        {state.incubators.map((s, i) => <SlotCard key={i} slot={s} index={i} />)}
        {nextSlotOffer && (
          <div className="slot card locked-slot">
            <Icon name="lock" width={34} height={34} />
            <b>Incubateur {state.incubators.length + 1}</b>
            <span className="muted" style={{ fontSize: 13 }}>Disponible en boutique</span>
            <Price currency={nextSlotOffer.price.currency} amount={nextSlotOffer.price.amount} />
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('boutique')}>Voir en boutique</button>
          </div>
        )}
      </div>

      <div className="section-title"><Icon name="egg" width={22} height={22} style={{ color: 'var(--violet)' }} /><h2>Panier d'œufs</h2><span className="muted">{state.eggs.length}/{BALANCE.maxEggStorage}</span></div>
      {groups.length === 0 ? (
        <EmptyState icon="egg" title="Ton panier est vide" action={<button className="btn" onClick={() => navigate('boutique')}><Icon name="bag" />Trouver des œufs</button>}>
          Récompense quotidienne, quêtes et boutique te fourniront de nouveaux œufs. L'exploration des biomes arrivera en Phase 4.
        </EmptyState>
      ) : (
        <div className="grid-auto" style={{ ['--min' as string]: '150px' } as CSSProperties}>
          {groups.map(([type, eggs]) => <EggBagCard key={eggs[0]!.uid} type={type} count={eggs.length} firstUid={eggs[0]!.uid} label={geneticsLabel(eggs[0]!)} />)}
        </div>
      )}

      <div className="section-title"><Icon name="sparkle" width={22} height={22} style={{ color: 'var(--violet)' }} /><h2>Influence des ambiances</h2></div>
      <div className="grid-auto" style={{ ['--min' as string]: '240px' } as CSSProperties}>
        {Object.values(AMBIANCES).map((a) => {
          const owned = state.unlocks.ambiances.includes(a.id);
          return (
            <div key={a.id} className={`card amb-card ${owned ? '' : 'locked'}`} style={{ ['--ac' as string]: a.color } as CSSProperties}>
              <div className="row"><i className="amb-dot" /><b>{a.name}</b><span className="spacer" />{owned ? <span className="badge soft-badge"><Icon name="check" />Débloquée</span> : <span className="badge soft-badge"><Icon name="lock" />Boutique</span>}</div>
              <p className="soft" style={{ fontSize: 13, margin: '6px 0' }}>{a.description}</p>
              <div className="row-wrap">
                {Object.entries(a.mutationMultipliers).map(([m, v]) => <span key={m} className="badge soft-badge">{MUTATIONS[m]?.name} ×{v}</span>)}
                {Object.entries(a.nightMultipliers ?? {}).map(([m, v]) => <span key={`n${m}`} className="badge soft-badge"><Icon name="moon" />{MUTATIONS[m]?.name} ×{v}</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EggBagCard({ type, count, firstUid, label }: { type: string; count: number; firstUid: string; label: string | null }) {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const openModal = useUi((s) => s.openModal);
  const egg = EGGS[type]!;
  const freeSlot = state.incubators.findIndex((s) => !s.egg && canIncubateIn(type, s.ambiance));
  return (
    <div className="card egg-card" style={{ ['--rc' as string]: RARITIES[egg.rarity].color } as CSSProperties}>
      <span className="badge soft-badge egg-count">×{count}</span>
      <EggArt type={type} size={64} />
      <b style={{ fontSize: 14, textAlign: 'center' }}>{egg.name}</b>
      <RarityBadge rarity={egg.rarity} small />
      {label && <span className="muted" style={{ fontSize: 11, fontWeight: 800, textAlign: 'center' }}>{label}</span>}
      <div className="row" style={{ marginTop: 6 }}>
        <button className="icon-btn tip" data-tip="Probabilités" onClick={() => openModal({ kind: 'odds', eggType: type })}><Icon name="dice" /></button>
        <button className="btn btn-sm" disabled={freeSlot < 0} title={freeSlot < 0 ? 'Aucun incubateur libre compatible' : undefined}
          onClick={() => { dispatch({ type: 'placeEgg', eggUid: firstUid, slot: freeSlot }); playSfx('whoosh'); }}>
          Incuber
        </button>
      </div>
    </div>
  );
}
