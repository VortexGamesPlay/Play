/**
 * Compte joueur par e-mail, sans mot de passe : on reçoit un code à 6 chiffres.
 * - Compte invité → on relie l'e-mail au compte actuel (la partie et les achats restent attachés).
 * - E-mail déjà utilisé → on se connecte à ce compte (pour retrouver sa partie sur un autre appareil).
 */
import { tr } from '../i18n';
import { getClient, withSession } from './supabase';

export type CodeMode = 'link' | 'login';

const clean = (e: string) => e.trim().toLowerCase();
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

export async function requestCode(email: string): Promise<CodeMode> {
  const mail = clean(email);
  if (!emailOk(mail)) throw new Error(tr('Adresse e-mail invalide.'));
  const client = await withSession();
  const { data } = await client.auth.getSession();
  const guest = !data.session?.user.email;
  if (guest) {
    const { error } = await client.auth.updateUser({ email: mail });
    if (!error) return 'link';
    if (!/already|exists|registered/i.test(error.message)) throw new Error(friendly(error.message));
  }
  const { error } = await client.auth.signInWithOtp({ email: mail, options: { shouldCreateUser: true } });
  if (error) throw new Error(friendly(error.message));
  return 'login';
}

export async function verifyCode(email: string, code: string, mode: CodeMode): Promise<void> {
  const client = await getClient();
  const { error } = await client.auth.verifyOtp({ email: clean(email), token: code.trim(), type: mode === 'link' ? 'email_change' : 'email' });
  if (error) throw new Error(/expired|invalid/i.test(error.message) ? tr('Code incorrect ou expiré.') : friendly(error.message));
}

export async function signOut(): Promise<void> {
  const client = await getClient();
  await client.auth.signOut();
}

function friendly(msg: string): string {
  if (/rate limit|too many|seconds/i.test(msg)) return tr('Trop de demandes : patiente quelques minutes avant de redemander un code.');
  if (/not allowed|disabled/i.test(msg)) return tr('La connexion par e-mail n\'est pas encore activée sur le serveur.');
  return msg;
}
