import type { ActionContext, Rng } from './types';

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;

/** La nuit va de 20h à 6h (heure locale). */
export function isNight(hour: number): boolean {
  return hour >= 20 || hour < 6;
}

export function dayKeyOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function previousDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return dayKeyOf(date);
}

export function makeContext(now: number, rng: Rng): ActionContext {
  const date = new Date(now);
  return { now, rng, hour: date.getHours(), dayKey: dayKeyOf(date) };
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}
