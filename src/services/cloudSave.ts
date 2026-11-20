/**
 * Sauvegarde dans le cloud (Phase 6). La sauvegarde locale reste la référence immédiate (jeu hors-ligne possible) ;
 * une copie est envoyée au serveur quelques secondes après chaque changement, et récupérée sur un nouvel appareil.
 */
import type { GameState } from '@core/types';
import { deserialize, serialize } from '@core/save/serializer';
import { serverAvailable, withSession } from './supabase';

const UPLOAD_DELAY = 8_000;
let pending: GameState | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let uploading = false;
let lastUploadedAt = 0;
let lastError: string | null = null;
const listeners = new Set<() => void>();

export interface CloudStatus { enabled: boolean; lastUploadedAt: number; uploading: boolean; error: string | null }
export const cloudStatus = (): CloudStatus => ({ enabled: serverAvailable(), lastUploadedAt, uploading, error: lastError });
export function onCloudStatus(f: () => void) { listeners.add(f); return () => { listeners.delete(f); }; }
const notify = () => listeners.forEach((f) => f());

export interface CloudSave { state: GameState; savedAt: number }

/** Lit la sauvegarde du compte connecté (null s'il n'en a pas encore). */
export async function downloadSave(): Promise<CloudSave | null> {
  if (!serverAvailable()) return null;
  const client = await withSession();
  const { data, error } = await client.from('saves').select('data, saved_at').maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const { state } = deserialize(data.data as string, Date.now());
  return { state, savedAt: Number(data.saved_at) };
}

/** Envoie immédiatement la partie au serveur. */
export async function uploadNow(state: GameState): Promise<void> {
  if (!serverAvailable()) return;
  const now = Date.now();
  uploading = true; notify();
  try {
    const client = await withSession();
    const { data: s } = await client.auth.getSession();
    const userId = s.session!.user.id;
    const { error } = await client.from('saves').upsert({ user_id: userId, data: serialize(state, now), saved_at: now, schema_version: state.schemaVersion, updated_at: new Date(now).toISOString() });
    if (error) throw new Error(error.message);
    lastUploadedAt = now; lastError = null;
  } catch (e) {
    lastError = (e as Error).message;
    throw e;
  } finally {
    uploading = false; notify();
  }
}

/** Programme un envoi (regroupe les changements rapprochés). */
export function scheduleUpload(state: GameState): void {
  if (!serverAvailable()) return;
  pending = state;
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    const s = pending; pending = null;
    if (s) void uploadNow(s).catch(() => { /* hors-ligne : réessayé au prochain changement */ });
  }, UPLOAD_DELAY);
}

/** Envoi de dernière chance quand l'application passe en arrière-plan. */
export function flushUpload(): void {
  if (!pending) return;
  if (timer) { clearTimeout(timer); timer = null; }
  const s = pending; pending = null;
  void uploadNow(s).catch(() => {});
}
