import { BALANCE, xpToNext } from '@data/balance';
import { MUTATIONS } from '@data/mutations';
import { PERSONALITIES } from '@data/personalities';
import { RARITIES } from '@data/rarities';
import { SPECIES } from '@data/species';
import type { SpeciesDef } from '../content';
import { assertGame } from '../errors';
import type { GameEvent } from '../events';
import { nextUid } from '../ids';
import { pick, randFloat, randInt } from '../rng';
import type { ActionContext, CreatureInstance, CreatureOrigin, GameState, Genes, MutationId, SpeciesId } from '../types';

/** Taille et poids individuels : moyenne de l'espèce modulée par le gène de taille (et la mutation Mutante). */
export function bodyMetrics(sp: SpeciesDef, genes: Genes, mutations: MutationId[]): { sizeCm: number; weightKg: number } {
  const f = 0.8 + genes.size * 0.4 * (mutations.includes('mutante') ? 1.25 : 1);
  return { sizeCm: Math.round(sp.sizeCm * f * 10) / 10, weightKg: Math.round(sp.weightKg * Math.pow(f, 3) * 100) / 100 };
}

export function getSpecies(id: SpeciesId): SpeciesDef {
  const s = SPECIES[id];
  if (!s) throw new Error(`Espèce inconnue : ${id}`);
  return s;
}

export function rollGenes(ctx: ActionContext): Genes {
  return {
    hp: randInt(ctx.rng, 0, 31),
    atk: randInt(ctx.rng, 0, 31),
    def: randInt(ctx.rng, 0, 31),
    spd: randInt(ctx.rng, 0, 31),
    hue: Math.round(randFloat(ctx.rng, -12, 12)),
    size: Math.round(ctx.rng.next() * 100) / 100,
  };
}

export function createCreature(
  draft: GameState,
  speciesId: SpeciesId,
  mutations: MutationId[],
  origin: CreatureOrigin,
  ctx: ActionContext,
  opts: { genes?: Genes; generation?: number } = {},
): CreatureInstance {
  const sp = getSpecies(speciesId);
  const genes = opts.genes ?? rollGenes(ctx);
  return {
    uid: nextUid(draft, 'cr'),
    speciesId,
    nickname: null,
    level: 1,
    xp: 0,
    genes,
    personality: pick(ctx.rng, Object.keys(PERSONALITIES)),
    mutations,
    ...bodyMetrics(sp, genes, mutations),
    affection: 10,
    hatchedAt: ctx.now,
    origin,
    favorite: false,
    diet: {},
    generation: opts.generation ?? 1,
    breedCount: 0,
    breedReadyAt: 0,
  };
}

export interface ComputedStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  power: number;
}

/** Statistiques effectives : base d'espèce + gènes + niveau + personnalité + mutations. */
export function computeStats(c: CreatureInstance): ComputedStats {
  const sp = getSpecies(c.speciesId);
  const pers = PERSONALITIES[c.personality];
  const mutMul = c.mutations.reduce((m, id) => m * (MUTATIONS[id]?.statMultiplier ?? 1), 1);
  const stat = (key: 'hp' | 'atk' | 'def' | 'spd') => {
    const base = sp.baseStats[key];
    let v = key === 'hp'
      ? Math.floor(((2 * base + c.genes[key]) * c.level) / 50) + c.level + 10
      : Math.floor(((2 * base + c.genes[key]) * c.level) / 50) + 5;
    if (pers?.up === key) v *= 1.1;
    if (pers?.down === key) v *= 0.9;
    return Math.floor(v * mutMul);
  };
  const hp = stat('hp');
  const atk = stat('atk');
  const def = stat('def');
  const spd = stat('spd');
  return { hp, atk, def, spd, power: Math.round(hp * 0.5 + atk + def + spd) };
}

/** Qualité génétique 0..100 (moyenne des gènes de stats). */
export function geneQuality(g: Genes): number {
  return Math.round(((g.hp + g.atk + g.def + g.spd) / (31 * 4)) * 100);
}

export function displayName(c: CreatureInstance): string {
  return c.nickname || getSpecies(c.speciesId).name;
}

export function findCreature(state: GameState, uid: string): CreatureInstance {
  const c = state.creatures.find((x) => x.uid === uid);
  assertGame(c, 'unknown_creature', 'Créature introuvable.');
  return c;
}

export function addXp(draft: GameState, c: CreatureInstance, xp: number, events: GameEvent[]): void {
  if (c.level >= BALANCE.maxLevel) return;
  c.xp += xp;
  while (c.level < BALANCE.maxLevel && c.xp >= xpToNext(c.level)) {
    c.xp -= xpToNext(c.level);
    c.level += 1;
    draft.stats.levelUps += 1;
    events.push({ type: 'levelUp', uid: c.uid, level: c.level });
  }
  if (c.level >= BALANCE.maxLevel) c.xp = 0;
}

export function harvestRatePerHour(c: CreatureInstance, zoneBonus = 0): number {
  const r = RARITIES[getSpecies(c.speciesId).rarity];
  return r.harvestPerHour * (1 + (c.level - 1) * BALANCE.harvestLevelBonus) * (1 + zoneBonus);
}

export function releaseValue(c: CreatureInstance): number {
  const r = RARITIES[getSpecies(c.speciesId).rarity];
  return Math.round(r.releaseEssence * (1 + c.mutations.length * 0.5) + c.level);
}

export function renameCreature(draft: GameState, uid: string, name: string): void {
  const c = findCreature(draft, uid);
  const clean = name.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20);
  c.nickname = clean.length > 0 ? clean : null;
}

export function toggleFavorite(draft: GameState, uid: string): void {
  const c = findCreature(draft, uid);
  c.favorite = !c.favorite;
}

export function releaseCreature(draft: GameState, uid: string, ctx: ActionContext, events: GameEvent[], grantEssence: (n: number) => void): void {
  const c = findCreature(draft, uid);
  assertGame(!draft.expeditions.some((e) => e.creatureUids.includes(uid)), 'away', 'Cette créature est partie en expédition.');
  assertGame(!c.favorite, 'favorite_locked', 'Retire d\'abord cette créature de tes favoris.');
  const essence = releaseValue(c);
  draft.creatures = draft.creatures.filter((x) => x.uid !== uid);
  draft.stats.released += 1;
  grantEssence(essence);
  events.push({ type: 'released', uid, essence });
  void ctx;
}
