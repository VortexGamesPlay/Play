/**
 * Paiements en argent réel.
 * - PayPal (web / PC) : la commande est créée et ENCAISSÉE par le serveur (fonctions Supabase), qui vérifie le montant.
 * - Magasins d'applications (Apple / Google) : Phase 7, avec les applications mobiles.
 * - Mode test : uniquement en développement ou si VITE_PAYMENTS_TEST=1 ; aucun argent réel, toujours signalé comme tel.
 */
import type { PurchaseRecord } from '@core/types';
import { PRODUCT_BY_ID, CURRENCY } from '@data/products';
import { getLocale } from '../../i18n';
import { tr } from '../../i18n';

type Receipt = Omit<PurchaseRecord, 'at'>;

const env = import.meta.env;
const SUPABASE_URL = env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY as string | undefined;
const PAYPAL_CLIENT_ID = env.VITE_PAYPAL_CLIENT_ID as string | undefined;

export const paymentsConfig = {
  /** Le Client ID peut venir du build OU du serveur (fonction paypal-config). */
  paypal: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
  test: env.DEV || env.VITE_PAYMENTS_TEST === '1',
  paypalSandbox: env.VITE_PAYPAL_ENV !== 'live',
};

export const paymentsAvailable = () => paymentsConfig.paypal || paymentsConfig.test;

// ───────────── Mode test ─────────────
export async function purchaseInTestMode(productId: string): Promise<Receipt> {
  const p = PRODUCT_BY_ID[productId];
  if (!p) throw new Error(tr('Produit inconnu.'));
  await new Promise((r) => setTimeout(r, 400));
  return { orderId: `TEST-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, productId, provider: 'test', amountCents: p.priceCents, currency: CURRENCY };
}

// ───────────── PayPal via le serveur ─────────────
let clientPromise: Promise<import('@supabase/supabase-js').SupabaseClient> | null = null;

/** Client Supabase avec une session (compte anonyme en attendant les comptes complets de la Phase 6). */
async function supabase() {
  clientPromise ??= (async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    const { data } = await client.auth.getSession();
    if (!data.session) {
      const { error } = await client.auth.signInAnonymously();
      if (error) throw new Error(tr('Connexion au serveur impossible.'));
    }
    return client;
  })();
  return clientPromise;
}

async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const client = await supabase();
  const { data, error } = await client.functions.invoke(name, { body });
  if (error) {
    let msg = 'Le serveur de paiement ne répond pas.';
    try { msg = (await (error as { context?: Response }).context?.json())?.error ?? msg; } catch { /* message par défaut */ }
    throw new Error(msg);
  }
  return data as T;
}

interface PayPalButtons { render(el: HTMLElement): Promise<void>; close?(): Promise<void> }
interface PayPalNamespace { Buttons(opts: Record<string, unknown>): PayPalButtons }
declare global { interface Window { paypal?: PayPalNamespace } }

/** Client ID public : celui du build s'il existe, sinon demandé au serveur. */
async function paypalClientId(): Promise<string> {
  if (PAYPAL_CLIENT_ID) return PAYPAL_CLIENT_ID;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/paypal-config`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY!, 'Content-Type': 'application/json' },
    body: '{}',
  }).catch(() => null);
  const data = res ? await res.json().catch(() => ({})) : {};
  if (!res?.ok || !data.clientId) throw new Error(data.error ?? tr('Paiement indisponible pour le moment.'));
  return data.clientId as string;
}

let sdkPromise: Promise<PayPalNamespace> | null = null;
function loadPayPalSdk(): Promise<PayPalNamespace> {
  sdkPromise ??= paypalClientId().then((clientId) => new Promise<PayPalNamespace>((resolve, reject) => {
    const s = document.createElement('script');
    const locale = getLocale() === 'fr' ? 'fr_FR' : 'en_US';
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${CURRENCY}&intent=capture&components=buttons&locale=${locale}`;
    s.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error(tr('PayPal indisponible.'))));
    s.onerror = () => { sdkPromise = null; reject(new Error(tr('Impossible de charger PayPal. Vérifie ta connexion.'))); };
    document.head.appendChild(s);
  })).catch((e) => { sdkPromise = null; throw e; });
  return sdkPromise;
}

/** Affiche les boutons PayPal dans `el`. onPaid reçoit le reçu vérifié par le serveur. */
export async function mountPayPalButtons(el: HTMLElement, productId: string, onPaid: (r: Receipt) => void, onError: (msg: string) => void): Promise<() => void> {
  const paypal = await loadPayPalSdk();
  const buttons = paypal.Buttons({
    style: { layout: 'vertical', shape: 'pill', label: 'pay' },
    createOrder: async () => (await callFunction<{ orderId: string }>('paypal-create-order', { productId })).orderId,
    onApprove: async (data: { orderID: string }) => {
      try {
        const r = await callFunction<{ orderId: string; productId: string; amountCents: number; currency: string }>('paypal-capture-order', { orderId: data.orderID });
        onPaid({ ...r, provider: 'paypal' });
      } catch (e) { onError((e as Error).message); }
    },
    onError: (e: unknown) => onError(e instanceof Error ? e.message : 'Paiement interrompu.'),
  });
  await buttons.render(el);
  return () => { void buttons.close?.(); };
}

/** Achats encaissés sur le serveur (pour récupérer un achat payé mais pas encore crédité, ou sur un autre appareil). */
export async function fetchServerPurchases(): Promise<Receipt[]> {
  if (!paymentsConfig.paypal) return [];
  const client = await supabase();
  const { data, error } = await client.from('purchases').select('order_id, product_id, amount_cents, currency').eq('status', 'captured');
  if (error) throw new Error(tr('Impossible de récupérer tes achats.'));
  return (data ?? []).map((r) => ({ orderId: r.order_id, productId: r.product_id, amountCents: r.amount_cents, currency: r.currency, provider: 'paypal' as const }));
}
