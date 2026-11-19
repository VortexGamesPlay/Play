import { AMBIANCES } from '@data/ambiances';
import { BALANCE } from '@data/balance';
import { EGGS } from '@data/eggs';
import { GameError, assertGame } from '../errors';
import type { ActionContext, AmbianceId, EggTypeId, GameState, IncubatorSlot } from '../types';
import { spend } from './economy';

export function incubationDuration(eggType: EggTypeId, ambiance: AmbianceId): number {
  const egg = EGGS[eggType]!;
  const mul = egg.affinity.includes(ambiance) ? BALANCE.affinitySpeedMultiplier : 1;
  return Math.round(egg.incubationMs * mul);
}

export function canIncubateIn(eggType: EggTypeId, ambiance: AmbianceId): boolean {
  const egg = EGGS[eggType];
  if (!egg) return false;
  return !egg.requiresAmbiance || egg.requiresAmbiance.includes(ambiance);
}

function getSlot(state: GameState, index: number): IncubatorSlot {
  const slot = state.incubators[index];
  assertGame(slot, 'unknown_slot', 'Incubateur introuvable.');
  return slot;
}

export function placeEgg(draft: GameState, eggUid: string, slotIndex: number, ctx: ActionContext): void {
  const slot = getSlot(draft, slotIndex);
  assertGame(!slot.egg, 'slot_busy', 'Cet incubateur est déjà occupé.');
  const idx = draft.eggs.findIndex((e) => e.uid === eggUid);
  assertGame(idx >= 0, 'unknown_egg', 'Œuf introuvable.');
  const egg = draft.eggs[idx]!;
  if (!canIncubateIn(egg.type, slot.ambiance)) {
    const req = EGGS[egg.type]!.requiresAmbiance!.map((a) => AMBIANCES[a]?.name).join(' ou ');
    throw new GameError('ambiance_required', `${EGGS[egg.type]!.name} ne peut éclore qu'en ambiance : ${req}.`);
  }
  draft.eggs.splice(idx, 1);
  slot.egg = egg;
  slot.startedAt = ctx.now;
  slot.readyAt = ctx.now + incubationDuration(egg.type, slot.ambiance);
}

/** Retire un œuf : il retourne dans le panier, la progression est perdue. */
export function removeEgg(draft: GameState, slotIndex: number): void {
  const slot = getSlot(draft, slotIndex);
  assertGame(slot.egg, 'slot_empty', 'Cet incubateur est vide.');
  draft.eggs.push(slot.egg);
  slot.egg = null;
  slot.startedAt = 0;
  slot.readyAt = 0;
}

export function setAmbiance(draft: GameState, slotIndex: number, ambiance: AmbianceId): void {
  const slot = getSlot(draft, slotIndex);
  assertGame(!!AMBIANCES[ambiance], 'unknown_ambiance', 'Ambiance inconnue.');
  assertGame(draft.unlocks.ambiances.includes(ambiance), 'ambiance_locked', 'Cette ambiance n\'est pas encore débloquée.');
  assertGame(!slot.egg, 'slot_busy', 'On ne peut pas changer l\'ambiance pendant une incubation.');
  slot.ambiance = ambiance;
}

export function isReady(slot: IncubatorSlot, now: number): boolean {
  return !!slot.egg && now >= slot.readyAt;
}

export function progressOf(slot: IncubatorSlot, now: number): number {
  if (!slot.egg) return 0;
  const total = slot.readyAt - slot.startedAt;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now - slot.startedAt) / total));
}

export function speedUpCost(slot: IncubatorSlot, now: number): number {
  if (!slot.egg) return 0;
  const remaining = slot.readyAt - now;
  if (remaining <= 0) return 0;
  return Math.max(1, Math.ceil(remaining / BALANCE.speedUpMsPerCrystal));
}

export function speedUp(draft: GameState, slotIndex: number, ctx: ActionContext): void {
  const slot = getSlot(draft, slotIndex);
  assertGame(slot.egg, 'slot_empty', 'Cet incubateur est vide.');
  const cost = speedUpCost(slot, ctx.now);
  assertGame(cost > 0, 'already_ready', 'Cet œuf est déjà prêt à éclore.');
  spend(draft, 'crystals', cost, `Accélération : ${EGGS[slot.egg.type]!.name}`, ctx.now);
  slot.readyAt = ctx.now;
  draft.stats.speedUps += 1;
}

export function addIncubator(draft: GameState): void {
  assertGame(draft.incubators.length < BALANCE.maxIncubators, 'max_incubators', 'Nombre maximum d\'incubateurs atteint.');
  draft.incubators.push({ egg: null, startedAt: 0, readyAt: 0, ambiance: 'neutre' });
}
