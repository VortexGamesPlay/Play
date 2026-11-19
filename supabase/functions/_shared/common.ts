// Utilitaires communs aux fonctions serveur EGGVERSE (Deno / Supabase Edge Functions).
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';
import catalog from './catalog.json' with { type: 'json' };

export interface Product { id: string; name: string; priceCents: number; once: boolean }
export const PRODUCTS = catalog.products as Product[];
export const CURRENCY = catalog.currency;

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new HttpError(500, `Configuration serveur manquante : ${name}`);
  return v;
}

/** Client « service » : contourne la sécurité par ligne, à n'utiliser que côté serveur. */
export function admin(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
}

/** Identifie le joueur à partir de son jeton (compte anonyme ou complet). */
export async function requireUser(req: Request): Promise<User> {
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

export async function paypal<T = Record<string, unknown>>(path: string, body: unknown, requestId?: string): Promise<{ status: number; data: T }> {
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

export const toCents = (value: string) => Math.round(Number(value) * 100);

/** Enveloppe commune : CORS, erreurs lisibles, méthode POST uniquement. */
export function handler(fn: (req: Request) => Promise<Response>) {
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
