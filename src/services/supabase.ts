/**
 * Connexion partagée au serveur EGGVERSE (Supabase, Europe).
 * Chaque appareil reçoit d'abord un compte invité (anonyme) ; le joueur peut ensuite le relier à son e-mail
 * pour retrouver sa partie sur un autre appareil.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { tr } from '../i18n';

const env = import.meta.env;
export const SUPABASE_URL = env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const serverAvailable = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);

let clientPromise: Promise<SupabaseClient> | null = null;

/** Client Supabase (sans créer de compte). */
export function getClient(): Promise<SupabaseClient> {
  if (!serverAvailable()) return Promise.reject(new Error(tr('Serveur indisponible.')));
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, { auth: { persistSession: true, autoRefreshToken: true } }));
  return clientPromise;
}

/** Client avec une session : crée un compte invité si besoin. */
export async function withSession(): Promise<SupabaseClient> {
  const client = await getClient();
  const { data } = await client.auth.getSession();
  if (!data.session) {
    const { error } = await client.auth.signInAnonymously();
    if (error) throw new Error(tr('Connexion au serveur impossible.'));
  }
  return client;
}

export interface AccountInfo { userId: string; email: string | null; guest: boolean }

export async function currentAccount(): Promise<AccountInfo | null> {
  if (!serverAvailable()) return null;
  const client = await getClient();
  const { data } = await client.auth.getSession();
  const u = data.session?.user;
  return u ? { userId: u.id, email: u.email ?? null, guest: !u.email } : null;
}
