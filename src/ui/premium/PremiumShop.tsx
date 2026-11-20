import { useEffect, useRef, useState } from 'react';
import { PRODUCTS, PRODUCT_BY_ID, formatPrice, type ProductDef } from '@data/products';
import { DECORATIONS, THEMES } from '@data/buildings';
import { ITEMS } from '@data/items';
import { purchaseBlocker } from '@core/systems/premium';
import { dayKeyOf } from '@core/time';
import { CrystalIcon, Icon } from '../art/Icons';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { useNow } from '../hooks/useNow';
import { mountPayPalButtons, paymentsAvailable, paymentsConfig, purchaseInTestMode } from '../../services/payments';
import { playSfx } from '../../services/audio';
import { tr } from '../../i18n';

export function productContents(p: ProductDef): string[] {
  const g = p.grants;
  const out: string[] = [];
  if (g.crystals) out.push(`${g.crystals} cristaux`);
  for (const [id, q] of Object.entries(g.items ?? {})) out.push(`${ITEMS[id]?.name} ×${q}`);
  for (const d of g.decorations ?? []) out.push(tr('Décoration « {name} »', { name: DECORATIONS.find((x) => x.id === d)?.name ?? d }));
  for (const t of g.themes ?? []) out.push(`Terrain « ${THEMES[t]?.name} »`);
  if (g.season) out.push(tr('Toutes les récompenses du passe de saison (30 paliers)'));
  return out;
}

function TestBanner() {
  return <div className="test-banner"><Icon name="warning" /><span><b>{tr('MODE TEST')}</b> {tr(': aucun argent réel n\'est débité.')}</span></div>;
}

export function PremiumShop() {
  const state = useGame((s) => s.state);
  const openModal = useUi((s) => s.openModal);
  const now = useNow();
  const dayKey = dayKeyOf(new Date(now));
  const groups: [string, ProductDef[]][] = [
    ['Cristaux', PRODUCTS.filter((p) => p.kind === 'crystals')],
    ['Offres', PRODUCTS.filter((p) => p.kind === 'bundle' || p.kind === 'season')],
    [tr('Cosmétiques'), PRODUCTS.filter((p) => p.kind === 'cosmetic')],
  ];
  return (
    <div className="stack" style={{ gap: 16 }}>
      {paymentsConfig.test && !paymentsConfig.paypal && <TestBanner />}
      {!paymentsAvailable() && (
        <div className="status-panel"><Icon name="info" /><p style={{ fontSize: 14 }}><b>{tr('Achats en argent réel : bientôt disponibles.')}</b> {tr('Le serveur de paiement n\'est pas encore branché sur cette version. Tout reste obtenable en jouant gratuitement.')}</p></div>
      )}
      <div className="status-panel fair"><Icon name="check" /><p style={{ fontSize: 13 }}>{tr('Les cristaux servent à aller plus vite (accélérer l\'incubation, objets rares, confort).')} <b>{tr('Aucune créature et aucun œuf ne sont vendus')}</b> {tr(': tout s\'obtient aussi en jouant.')}</p></div>
      {groups.map(([title, list]) => (
        <div key={title} className="stack" style={{ gap: 10 }}>
          <h3 className="detail-h" style={{ margin: 0 }}>{title}</h3>
          <div className="shop-grid">
            {list.map((p) => {
              const why = purchaseBlocker(state, p.id, now, dayKey);
              return (
                <div key={p.id} className={`card offer premium ${why ? 'locked' : ''}`}>
                  {p.badge && <span className="premium-badge">{p.badge}</span>}
                  <div className="offer-visual"><span className={`premium-orb ${p.kind}`}>{p.kind === 'crystals' ? <CrystalIcon width={46} height={46} /> : <Icon name={p.kind === 'season' ? 'trophy' : p.kind === 'cosmetic' ? 'sparkle' : 'gift'} />}</span></div>
                  <b className="offer-name">{p.name}</b>
                  <ul className="premium-list">{productContents(p).map((c) => <li key={c}>{c}</li>)}</ul>
                  <button className="btn btn-pink btn-sm btn-block" style={{ marginTop: 'auto' }} disabled={!!why || !paymentsAvailable()} onClick={() => openModal({ kind: 'checkout', productId: p.id })}>
                    {why ?? formatPrice(p.priceCents)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p className="muted" style={{ fontSize: 12 }}>{tr('Prix TTC. Une limite de dépenses mensuelle peut être réglée dans le Profil. Si tu as moins de 18 ans, demande l\'accord d\'un parent avant tout achat.')}</p>
    </div>
  );
}

export function CheckoutModal({ productId }: { productId: string }) {
  const state = useGame((s) => s.state);
  const dispatch = useGame((s) => s.dispatch);
  const { closeModal, toast } = useUi.getState();
  const now = useNow();
  const p = PRODUCT_BY_ID[productId]!;
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paypalRef = useRef<HTMLDivElement>(null);
  const why = purchaseBlocker(state, productId, now, dayKeyOf(new Date(now)));

  const credit = (receipt: Parameters<typeof purchaseInTestMode> extends never ? never : Awaited<ReturnType<typeof purchaseInTestMode>>) => {
    const ok = dispatch({ type: 'applyPurchase', purchase: receipt });
    if (ok) { playSfx('reveal', 3); toast({ kind: 'success', title: tr('Merci pour ton soutien !'), body: tr('{name} : c\'est crédité.', { name: p.name }) }); closeModal(); }
  };

  useEffect(() => {
    if (!paymentsConfig.paypal || !consent || why || !paypalRef.current) return;
    let unmount: (() => void) | undefined;
    let alive = true;
    mountPayPalButtons(paypalRef.current, productId, (r) => alive && credit(r), (m) => alive && setError(m))
      .then((u) => { unmount = u; })
      .catch((e) => alive && setError((e as Error).message));
    return () => { alive = false; unmount?.(); };
  }, [consent, productId, why]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="stack">
      <div className="checkout-head">
        <span className={`premium-orb ${p.kind}`}>{p.kind === 'crystals' ? <CrystalIcon width={40} height={40} /> : <Icon name={p.kind === 'season' ? 'trophy' : 'gift'} />}</span>
        <div><b style={{ fontSize: 18 }}>{p.name}</b><div className="checkout-price">{formatPrice(p.priceCents)}</div></div>
      </div>
      <ul className="premium-list">{productContents(p).map((c) => <li key={c}>{c}</li>)}</ul>
      {why ? <div className="status-panel"><Icon name="lock" /><p>{why}.</p></div> : (
        <>
          <label className="consent">
            <input id="consent-digital" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{tr('Je demande l\'accès immédiat à ce contenu numérique et je reconnais perdre mon droit de rétractation de 14 jours une fois le contenu fourni (article L221-28 du Code de la consommation).')}</span>
          </label>
          {paymentsConfig.paypal ? (
            <>
              {paymentsConfig.paypalSandbox && <TestBanner />}
              {!consent && <p className="muted" style={{ fontSize: 13 }}>{tr('Coche la case ci-dessus pour afficher le paiement PayPal.')}</p>}
              <div ref={paypalRef} className="paypal-zone" />
            </>
          ) : paymentsConfig.test ? (
            <>
              <TestBanner />
              <button className="btn btn-pink btn-lg" disabled={!consent || busy} onClick={async () => {
                setBusy(true); setError(null);
                try { credit(await purchaseInTestMode(productId)); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
              }}>{busy ? tr('Paiement…') : tr('Payer {p0} (test)', { p0: formatPrice(p.priceCents) })}</button>
            </>
          ) : <div className="status-panel"><Icon name="info" /><p>{tr('Paiements bientôt disponibles.')}</p></div>}
          {error && <p style={{ color: 'var(--danger)', fontWeight: 800, fontSize: 13 }}>{error}</p>}
        </>
      )}
      <p className="muted" style={{ fontSize: 11 }}>{tr('Paiement sécurisé par PayPal. EGGVERSE ne voit jamais tes coordonnées bancaires. Conditions générales de vente : à publier avant l\'ouverture des ventes réelles.')}</p>
    </div>
  );
}
