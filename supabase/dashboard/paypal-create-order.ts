// EGGVERSE — fonction « paypal-create-order » (version à coller dans l'éditeur Supabase, tout en un seul fichier).
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';
const catalog = {"currency": "EUR", "products": [{"id": "cristaux_60", "name": "Poignée de cristaux", "priceCents": 99, "once": false}, {"id": "cristaux_330", "name": "Bourse de cristaux", "priceCents": 499, "once": false}, {"id": "cristaux_700", "name": "Coffret de cristaux", "priceCents": 999, "once": false}, {"id": "cristaux_1500", "name": "Malle de cristaux", "priceCents": 1999, "once": false}, {"id": "pack_debutant", "name": "Trousse du jeune gardien", "priceCents": 299, "once": true}, {"id": "passe_s1", "name": "Passe de saison : L'Éveil des Coquilles", "priceCents": 499, "once": true}, {"id": "terrain_aurore", "name": "Terrain « Jardin d'aurore »", "priceCents": 199, "once": true}, {"id": "lanternes_celestes", "name": "Lanternes célestes", "priceCents": 149, "once": true}]};

interface Product { id: string; name: string; priceCents: number; once: boolean }
const PRODUCTS = catalog.products as Product[];
const CURRENCY = catalog.currency;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new HttpError(500, `Configuration serveur manquante : ${name}`);
  return v;
}

/** Client « service » : contourne la sécurité par ligne, à n'utiliser que côté serveur. */
function admin(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
}

/** Identifie le joueur à partir de son jeton (compte anonyme ou complet). */
async function requireUser(req: Request): Promise<User> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Connexion requise.');
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Session invalide.');
  return data.user;
}

const PAYPAL_BASE = () => (Deno.env.get('PAYPAL_ENV') === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

async function paypalToken(): Promise<string> {
  const basic = btoa(`${env('PAYPAL_CLIENT_ID')}:${env('PAYPAL_CLIENT_SECRET')}`);
  const res = await fetch(`${PAYPAL_BASE()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new HttpError(502, 'Connexion à PayPal impossible.');
  return (await res.json()).access_token;
}

async function paypal<T = Record<string, unknown>>(path: string, body: unknown, requestId?: string): Promise<{ status: number; data: T }> {
  const res = await fetch(`${PAYPAL_BASE()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await paypalToken()}`,
      'Content-Type': 'application/json',
      ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: (await res.json().catch(() => ({}))) as T };
}

const toCents = (value: string) => Math.round(Number(value) * 100);

/** Enveloppe commune : CORS, erreurs lisibles, méthode POST uniquement. */
function handler(fn: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);
    try {
      return await fn(req);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: 'Erreur serveur.' }, 500);
    }
  };
}

// ───────────── Fonction ─────────────
// Crée une commande PayPal pour un produit du catalogue.
// Le PRIX vient du catalogue serveur : le client n'envoie que l'identifiant du produit.

Deno.serve(handler(async (req) => {
  const user = await requireUser(req);
  const { productId } = await req.json().catch(() => ({}));
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) throw new HttpError(400, 'Produit inconnu.');

  const db = admin();
  if (product.once) {
    const { count } = await db.from('purchases').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('product_id', product.id).eq('status', 'captured');
    if ((count ?? 0) > 0) throw new HttpError(409, 'Tu possèdes déjà cet article.');
  }

  const { status, data } = await paypal<{ id?: string }>('/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: product.id,
      custom_id: user.id,
      description: `EGGVERSE — ${product.name}`,
      amount: { currency_code: CURRENCY, value: (product.priceCents / 100).toFixed(2) },
    }],
  }, crypto.randomUUID());
  if (status >= 300 || !data.id) throw new HttpError(502, 'PayPal a refusé la création de la commande.');

  const { error } = await db.from('purchases').insert({
    user_id: user.id, order_id: data.id, product_id: product.id,
    amount_cents: product.priceCents, currency: CURRENCY, provider: 'paypal', status: 'created',
  });
  if (error) throw new HttpError(500, 'Enregistrement de la commande impossible.');
  return json({ orderId: data.id });
}));
