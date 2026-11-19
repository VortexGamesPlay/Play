/**
 * Moteur de combat EGGVERSE — « combat en formation ».
 * Trois créatures par camp, toutes présentes. Chaque manche, elles agissent par ordre de vitesse.
 * Chaque créature dispose d'énergie (+1 par tour) qu'elle dépense pour ses compétences.
 *
 * Le moteur est PUR et DÉTERMINISTE : (combattants, graine, choix du joueur) → toujours le même combat.
 * Une victoire peut donc être vérifiée en rejouant le combat (cf. core/systems/battles.ts).
 */
import { ELEMENTS } from '@data/elements';
import { SKILLS, type SkillDef } from '@data/skills';
import { STATUSES, type StatusId } from '@data/statuses';
import { createRng } from '../rng';
import type { ElementId, Rng } from '../types';

export type Side = 'A' | 'B';

export interface CombatantInit {
  key: string;
  side: Side;
  speciesId: string;
  name: string;
  element: ElementId;
  level: number;
  mutations: string[];
  hue: number;
  stats: { hp: number; atk: number; def: number; spd: number };
  skills: string[];
  /** Multiplicateur de PV (boss). */
  hpMul?: number;
  boss?: boolean;
  /** Créature du joueur correspondante. */
  uid?: string;
}

export interface ActiveStatus { id: StatusId; turns: number; value: number }

export interface Unit extends CombatantInit {
  hp: number;
  maxHp: number;
  energy: number;
  statuses: ActiveStatus[];
  alive: boolean;
}

export type LogEntry =
  | { t: 'round'; round: number }
  | { t: 'turn'; actor: string }
  | { t: 'skill'; actor: string; skill: string; targets: string[] }
  | { t: 'dmg'; target: string; amount: number; crit: boolean; mul: number; source: 'skill' | StatusId }
  | { t: 'heal'; target: string; amount: number }
  | { t: 'status'; target: string; status: StatusId; on: boolean }
  | { t: 'cleanse'; target: string }
  | { t: 'stun'; actor: string }
  | { t: 'ko'; target: string }
  | { t: 'end'; winner: Side | null };

export interface BattleState {
  seed: number;
  round: number;
  order: string[];
  cursor: number;
  steps: number;
  units: Unit[];
  awaiting: string | null;
  ended: boolean;
  winner: Side | null;
  log: LogEntry[];
}

export interface BattleInput { skill: string; target: string | null }

export const ENERGY_MAX = 5;
export const ENERGY_START = 2;
export const MAX_ROUNDS = 40;
export const HP_FACTOR = 3;
const BASE_CRIT = 0.06;

export class BattleError extends Error {}

// ───────────── utilitaires ─────────────

function stepRng(b: BattleState): Rng {
  b.steps += 1;
  return createRng((b.seed ^ Math.imul(b.steps, 0x9e3779b1)) >>> 0);
}

const unit = (b: BattleState, key: string) => b.units.find((u) => u.key === key)!;
const has = (u: Unit, id: StatusId) => u.statuses.find((s) => s.id === id);

export function effectiveSpd(u: Unit): number {
  let v = u.stats.spd;
  const a = has(u, 'allant'); if (a) v *= 1 + a.value;
  const e = has(u, 'engourdi'); if (e) v *= 1 - e.value;
  return v;
}

function effectiveAtk(u: Unit): number {
  let v = u.stats.atk;
  const g = has(u, 'galvanise'); if (g) v *= 1 + g.value;
  const f = has(u, 'fragilise'); if (f) v *= 1 - f.value;
  return v;
}

/** Multiplicateur élémentaire : ×1,5 si l'attaque domine, ×0,75 si la cible résiste. */
export function elementMultiplier(attack: ElementId | null, defender: ElementId): number {
  if (!attack) return 1;
  if (ELEMENTS[attack].strongAgainst.includes(defender)) return 1.5;
  if (ELEMENTS[defender].strongAgainst.includes(attack)) return 0.75;
  return 1;
}

export function allies(b: BattleState, u: Unit) { return b.units.filter((x) => x.side === u.side && x.alive); }
export function foes(b: BattleState, u: Unit) { return b.units.filter((x) => x.side !== u.side && x.alive); }

/** Cibles valides pour une compétence (vide = cible implicite). */
export function legalTargets(b: BattleState, actorKey: string, skillId: string): string[] {
  const u = unit(b, actorKey);
  const sk = SKILLS[skillId]!;
  if (sk.target === 'enemy') return foes(b, u).map((x) => x.key);
  if (sk.target === 'ally') return allies(b, u).map((x) => x.key);
  return [];
}

export function canUse(u: Unit, skillId: string): boolean {
  const sk = SKILLS[skillId];
  return !!sk && u.skills.includes(skillId) && u.energy >= sk.energy;
}

// ───────────── création ─────────────

export function createBattle(inits: CombatantInit[], seed: number): BattleState {
  const b: BattleState = {
    seed: seed >>> 0, round: 0, order: [], cursor: 0, steps: 0, awaiting: null, ended: false, winner: null, log: [],
    units: inits.map((c) => {
      const maxHp = Math.round(c.stats.hp * HP_FACTOR * (c.hpMul ?? 1));
      return { ...c, maxHp, hp: maxHp, energy: ENERGY_START, statuses: [], alive: true };
    }),
  };
  if (!b.units.some((u) => u.side === 'A') || !b.units.some((u) => u.side === 'B')) throw new BattleError('Chaque camp doit avoir au moins une créature.');
  startRound(b);
  advance(b);
  return b;
}

function startRound(b: BattleState) {
  b.round += 1;
  b.order = b.units.filter((u) => u.alive).sort((x, y) => effectiveSpd(y) - effectiveSpd(x) || (x.key < y.key ? -1 : 1)).map((u) => u.key);
  b.cursor = 0;
  b.log.push({ t: 'round', round: b.round });
}

function checkEnd(b: BattleState): boolean {
  const aAlive = b.units.some((u) => u.side === 'A' && u.alive);
  const bAlive = b.units.some((u) => u.side === 'B' && u.alive);
  if (aAlive && bAlive) return false;
  b.ended = true;
  b.winner = aAlive ? 'A' : bAlive ? 'B' : null;
  b.awaiting = null;
  b.log.push({ t: 'end', winner: b.winner });
  return true;
}

function damage(b: BattleState, target: Unit, amount: number, crit: boolean, mul: number, source: 'skill' | StatusId) {
  const dmg = Math.max(1, Math.round(amount));
  target.hp = Math.max(0, target.hp - dmg);
  b.log.push({ t: 'dmg', target: target.key, amount: dmg, crit, mul, source });
  if (target.hp === 0) {
    target.alive = false;
    target.statuses = [];
    b.log.push({ t: 'ko', target: target.key });
  }
}

function heal(b: BattleState, target: Unit, fraction: number) {
  const amount = Math.min(target.maxHp - target.hp, Math.round(target.maxHp * fraction));
  target.hp += amount;
  b.log.push({ t: 'heal', target: target.key, amount });
}

function applyStatus(b: BattleState, target: Unit, id: StatusId, value?: number, turns?: number) {
  const def = STATUSES[id];
  const existing = has(target, id);
  const v = value ?? def.value;
  const t = turns ?? def.turns;
  if (existing) { existing.turns = Math.max(existing.turns, t); existing.value = Math.max(existing.value, v); }
  else target.statuses.push({ id, turns: t, value: v });
  b.log.push({ t: 'status', target: target.key, status: id, on: true });
}

/** Début de tour : énergie, effets sur la durée, expiration des états. Retourne false si l'unité ne peut pas agir. */
function beginTurn(b: BattleState, u: Unit): boolean {
  b.log.push({ t: 'turn', actor: u.key });
  u.energy = Math.min(ENERGY_MAX, u.energy + 1);
  for (const s of [...u.statuses]) {
    if (s.id === 'embrase' || s.id === 'intoxique') damage(b, u, u.maxHp * s.value, false, 1, s.id);
    if (s.id === 'seve' && u.alive) heal(b, u, s.value);
  }
  if (!u.alive) return false;
  const stunned = !!has(u, 'etourdi');
  for (const s of u.statuses) s.turns -= 1;
  for (const s of u.statuses.filter((x) => x.turns <= 0)) b.log.push({ t: 'status', target: u.key, status: s.id, on: false });
  u.statuses = u.statuses.filter((x) => x.turns > 0);
  if (stunned) { b.log.push({ t: 'stun', actor: u.key }); return false; }
  return true;
}

function perform(b: BattleState, u: Unit, sk: SkillDef, targetKey: string | null) {
  const rng = stepRng(b);
  u.energy -= sk.energy;
  let targets: Unit[];
  switch (sk.target) {
    case 'enemy': targets = [unit(b, targetKey!)]; break;
    case 'ally': targets = [unit(b, targetKey!)]; break;
    case 'allEnemies': targets = foes(b, u); break;
    case 'allAllies': targets = allies(b, u); break;
    case 'self': targets = [u]; break;
  }
  b.log.push({ t: 'skill', actor: u.key, skill: sk.id, targets: targets.map((x) => x.key) });
  for (const tg of targets) {
    if (!tg.alive) continue;
    if (sk.power > 0) {
      const atk = effectiveAtk(u);
      const def = tg.stats.def;
      const mul = elementMultiplier(sk.element, tg.element);
      const crit = rng.next() < BASE_CRIT + (sk.critBonus ?? 0);
      const variance = 0.9 + rng.next() * 0.2;
      const shield = has(tg, 'rempart');
      const raw = sk.power * (atk / (atk + def)) * 1.6 * (1 + u.level / 60) * mul * (crit ? 1.5 : 1) * variance * (shield ? 1 - shield.value : 1);
      damage(b, tg, raw, crit, mul, 'skill');
    }
    if (sk.heal && tg.alive) heal(b, tg, sk.heal);
    if (sk.cleanse && tg.alive) {
      tg.statuses = tg.statuses.filter((s) => STATUSES[s.id].kind !== 'malus');
      b.log.push({ t: 'cleanse', target: tg.key });
    }
    if (sk.status && tg.alive && rng.next() < sk.status.chance) applyStatus(b, tg, sk.status.id, sk.status.value, sk.status.turns);
  }
}

// ───────────── IA ─────────────

/** Choix de l'IA (aussi utilisé pour le mode automatique du joueur). Toujours légal. */
export function chooseAction(b: BattleState, actorKey: string): BattleInput {
  const u = unit(b, actorKey);
  const rng = createRng((b.seed ^ Math.imul(b.steps + 7919, 0x85ebca6b) ^ u.key.length) >>> 0);
  const usable = u.skills.filter((id) => canUse(u, id)).map((id) => SKILLS[id]!);
  const team = allies(b, u);
  const enemies = foes(b, u);
  // 1) Soigner un allié en danger
  const hurt = team.filter((x) => x.hp / x.maxHp < 0.4).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
  if (hurt) {
    const healer = usable.find((s) => s.heal && (s.target !== 'self' || hurt.key === u.key));
    if (healer) return { skill: healer.id, target: healer.target === 'ally' ? hurt.key : null };
  }
  // 2) Meilleure attaque estimée
  let best: { score: number; input: BattleInput } | null = null;
  for (const s of usable) {
    if (s.power <= 0) {
      // Compétence de soutien : utilisée de temps en temps
      if (!s.heal && rng.next() < 0.18 && !(s.target === 'self' && s.status && has(u, s.status.id))) {
        const score = 25 + rng.next() * 10;
        if (!best || score > best.score) best = { score, input: { skill: s.id, target: null } };
      }
      continue;
    }
    const pool = s.target === 'enemy' ? enemies : enemies;
    for (const tg of s.target === 'enemy' ? pool : [pool[0]!]) {
      if (!tg) continue;
      const mul = elementMultiplier(s.element, tg.element);
      const hits = s.target === 'allEnemies' ? enemies.length : 1;
      const finisher = tg.hp / tg.maxHp < 0.25 ? 1.3 : 1;
      const score = s.power * mul * hits * finisher + rng.next() * 8;
      if (!best || score > best.score) best = { score, input: { skill: s.id, target: s.target === 'enemy' ? tg.key : null } };
    }
  }
  return best?.input ?? { skill: 'elan', target: enemies[0]!.key };
}

// ───────────── déroulement ─────────────

/** Fait avancer le combat jusqu'à ce qu'une créature du camp A attende un ordre (ou la fin). */
function advance(b: BattleState, autoA = false) {
  while (!b.ended) {
    if (b.cursor >= b.order.length) {
      if (b.round >= MAX_ROUNDS) { b.ended = true; b.winner = null; b.log.push({ t: 'end', winner: null }); return; }
      startRound(b);
    }
    const u = unit(b, b.order[b.cursor]!);
    if (!u.alive) { b.cursor += 1; continue; }
    const canAct = beginTurn(b, u);
    if (checkEnd(b)) return;
    if (!canAct) { b.cursor += 1; continue; }
    if (u.side === 'A' && !autoA) { b.awaiting = u.key; return; }
    const choice = chooseAction(b, u.key);
    perform(b, u, SKILLS[choice.skill]!, choice.target);
    b.cursor += 1;
    if (checkEnd(b)) return;
  }
}

/** Applique l'ordre du joueur pour la créature en attente, puis avance. Retourne un nouvel état. */
export function act(state: BattleState, input: BattleInput): BattleState {
  const b = structuredClone(state);
  b.log = [];
  if (b.ended || !b.awaiting) throw new BattleError('Aucune créature n\'attend d\'ordre.');
  const u = unit(b, b.awaiting);
  const sk = SKILLS[input.skill];
  if (!sk || !canUse(u, input.skill)) throw new BattleError('Compétence indisponible (énergie insuffisante ?).');
  const legal = legalTargets(b, u.key, input.skill);
  if (legal.length > 0 && (!input.target || !legal.includes(input.target))) throw new BattleError('Cible invalide.');
  b.awaiting = null;
  perform(b, u, sk, legal.length > 0 ? input.target : null);
  b.cursor += 1;
  if (!checkEnd(b)) advance(b);
  return b;
}

/** Rejoue intégralement un combat à partir de la graine et des ordres du joueur. */
export function replay(inits: CombatantInit[], seed: number, inputs: BattleInput[]): BattleState {
  let b = createBattle(inits, seed);
  for (const input of inputs) {
    if (b.ended) throw new BattleError('Ordres en trop après la fin du combat.');
    b = act(b, input);
  }
  return b;
}
