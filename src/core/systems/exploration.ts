import { BALANCE } from '@data/balance';
import { BIOME_BY_ID, BIOMES } from '@data/biomes';
import { EGGS } from '@data/eggs';
import type { BiomeDef, Reward } from '../content';
import { GameError, assertGame } from '../errors';
import type { GameEvent } from '../events';
import { nextUid } from '../ids';
import { randInt, weightedPick } from '../rng';
import type { ActionContext, CreatureInstance, ExpeditionDuration, GameState } from '../types';
import { addXp, computeStats, displayName, findCreature, getSpecies } from './creatures';
import { dexCount } from './dex';
import { grant } from './economy';
import { addEgg } from './inventory';
import { biomeWeather } from './weather';

const X = BALANCE.expedition;

export function isBiomeUnlocked(state: GameState, b: BiomeDef): boolean {
  return dexCount(state) >= b.unlockDex;
}

export function unlockedBiomeCount(state: GameState): number {
  return BIOMES.filter((b) => isBiomeUnlocked(state, b)).length;
}

/** Une créature partie en expédition n'est pas disponible au sanctuaire. */
export function isAway(state: GameState, uid: string): boolean {
  return state.expeditions.some((e) => e.creatureUids.includes(uid));
}

export function assertPresent(state: GameState, uid: string): void {
  assertGame(!isAway(state, uid), 'away', 'Cette créature est partie en expédition.');
}

export function secretFound(state: GameState, biomeId: string): boolean {
  return state.exploration.secretsFound.includes(biomeId);
}

export interface ExpeditionForecast {
  power: number;
  quality: number;
  favored: number;
  rolls: number;
  /** Probabilité, pour chaque tirage, d'obtenir un œuf. */
  eggChancePerRoll: number;
  /** Probabilité d'obtenir au moins un œuf sur toute l'expédition. */
  eggChanceTotal: number;
  eggOdds: { egg: string; probability: number }[];
  materialOdds: { item: string; probability: number }[];
  coins: [number, number];
  xpEach: number;
  weatherId: string;
}

/**
 * Prévision d'une expédition — utilisée par l'affichage ET par le calcul du butin.
 * La qualité dépend de la puissance de l'équipe par rapport à la difficulté du biome,
 * des éléments favorisés par le biome et par la météo.
 */
export function expeditionForecast(state: GameState, biomeId: string, team: CreatureInstance[], duration: ExpeditionDuration, now: number): ExpeditionForecast {
  const b = BIOME_BY_ID[biomeId]!;
  const d = X.durations[duration];
  const weather = biomeWeather(biomeId, now);
  const power = team.reduce((s, c) => s + computeStats(c).power, 0);
  const favored = team.filter((c) => {
    const el = getSpecies(c.speciesId).element;
    return b.favoredElements.includes(el) || weather.elementBonus.includes(el);
  }).length;
  const ratio = b.difficulty > 0 ? power / b.difficulty : 1;
  const quality = Math.max(X.minQuality, Math.min(X.maxQuality, ratio)) * (1 + X.favoredElementBonus * favored);
  const secretBonus = secretFound(state, biomeId) ? b.secret.eggChanceBonus : 0;
  const eggChancePerRoll = Math.min(X.eggChanceCap, (X.baseEggChance * Math.min(quality, 1.3) + secretBonus) * weather.eggChanceMul);
  const rolls = Math.max(1, Math.round(d.rolls * Math.min(1.5, quality) * weather.lootMul));
  const eTotal = b.eggs.reduce((s, e) => s + e.weight, 0);
  const mTotal = b.materials.reduce((s, m) => s + m.weight, 0);
  const coinsMid = X.coinsPerRoll * rolls * quality;
  return {
    power, quality, favored, rolls, eggChancePerRoll,
    eggChanceTotal: 1 - Math.pow(1 - eggChancePerRoll, rolls),
    eggOdds: b.eggs.map((e) => ({ egg: e.egg, probability: e.weight / eTotal })),
    materialOdds: b.materials.map((m) => ({ item: m.item, probability: m.weight / mTotal })),
    coins: [Math.round(coinsMid * 0.8), Math.round(coinsMid * 1.2)],
    xpEach: Math.round(d.xp * Math.min(quality, 1.3)),
    weatherId: weather.id,
  };
}

export function startExpedition(draft: GameState, biomeId: string, uids: string[], duration: ExpeditionDuration, ctx: ActionContext): void {
  const b = BIOME_BY_ID[biomeId];
  assertGame(b, 'unknown_biome', 'Biome inconnu.');
  assertGame(isBiomeUnlocked(draft, b), 'biome_locked', `Découvre ${b.unlockDex} espèces pour atteindre ce biome.`);
  assertGame(X.durations[duration], 'bad_duration', 'Durée invalide.');
  const unique = [...new Set(uids)];
  assertGame(unique.length >= 1 && unique.length <= X.maxTeam, 'bad_team', `Choisis entre 1 et ${X.maxTeam} créatures.`);
  assertGame(draft.expeditions.length < X.maxConcurrent, 'too_many', `${X.maxConcurrent} expéditions au maximum en même temps.`);
  for (const uid of unique) {
    const c = findCreature(draft, uid);
    if (isAway(draft, uid)) throw new GameError('away', `${displayName(c)} est déjà en expédition.`);
  }
  draft.expeditions.push({
    uid: nextUid(draft, 'exp'), biomeId, creatureUids: unique, duration,
    startedAt: ctx.now, endsAt: ctx.now + X.durations[duration].ms,
  });
}

/** Rappel anticipé : l'équipe rentre sans butin. */
export function recallExpedition(draft: GameState, expUid: string): void {
  const i = draft.expeditions.findIndex((e) => e.uid === expUid);
  assertGame(i >= 0, 'unknown_expedition', 'Expédition introuvable.');
  draft.expeditions.splice(i, 1);
}

export function claimExpedition(draft: GameState, expUid: string, ctx: ActionContext, events: GameEvent[]): void {
  const i = draft.expeditions.findIndex((e) => e.uid === expUid);
  assertGame(i >= 0, 'unknown_expedition', 'Expédition introuvable.');
  const exp = draft.expeditions[i]!;
  assertGame(ctx.now >= exp.endsAt, 'not_back', 'L\'équipe n\'est pas encore rentrée.');
  const b = BIOME_BY_ID[exp.biomeId]!;
  const team = exp.creatureUids.map((u) => draft.creatures.find((c) => c.uid === u)).filter((c): c is CreatureInstance => !!c);
  // La météo prise en compte est celle du départ.
  const f = expeditionForecast(draft, exp.biomeId, team, exp.duration, exp.startedAt);

  const reward: Reward = { coins: randInt(ctx.rng, f.coins[0], f.coins[1]), items: {}, eggs: [] };
  for (let r = 0; r < f.rolls; r++) {
    if (ctx.rng.next() < f.eggChancePerRoll) {
      reward.eggs!.push(weightedPick(ctx.rng, f.eggOdds.map((e) => ({ value: e.egg, weight: e.probability }))));
    } else {
      const item = weightedPick(ctx.rng, f.materialOdds.map((m) => ({ value: m.item, weight: m.probability })));
      reward.items![item] = (reward.items![item] ?? 0) + randInt(ctx.rng, 1, 2);
    }
    if (ctx.rng.next() < BALANCE.expedition.foodChance && b.foods.length > 0) {
      const food = b.foods[randInt(ctx.rng, 0, b.foods.length - 1)]!;
      reward.items![food] = (reward.items![food] ?? 0) + 1;
    }
  }

  draft.expeditions.splice(i, 1);
  grant(draft, 'coins', reward.coins!, `Expédition : ${b.name}`, ctx.now);
  for (const [item, qty] of Object.entries(reward.items!)) draft.inventory[item] = (draft.inventory[item] ?? 0) + (qty ?? 0);
  for (const egg of reward.eggs!) if (EGGS[egg]) addEgg(draft, egg, `Expédition : ${b.name}`, ctx.now, { ignoreCap: true });
  for (const c of team) {
    addXp(draft, c, f.xpEach, events);
    c.affection = Math.min(100, c.affection + 3);
  }
  draft.stats.expeditions += 1;
  const count = (draft.exploration.expeditionsByBiome[b.id] ?? 0) + 1;
  draft.exploration.expeditionsByBiome[b.id] = count;

  let secret = false;
  if (count >= b.secret.afterExpeditions && !secretFound(draft, b.id)) {
    draft.exploration.secretsFound.push(b.id);
    grant(draft, 'crystals', X.secretCrystals, `Zone secrète : ${b.secret.name}`, ctx.now);
    secret = true;
  }
  events.push({ type: 'expeditionDone', biomeId: b.id, reward, secretFound: secret, xp: f.xpEach, team: team.map((c) => c.uid) });
}

export function forageReadyAt(state: GameState, biomeId: string): number {
  return (state.exploration.lastForageAt[biomeId] ?? 0) + X.forageCooldownMs;
}

/** Fouille rapide : un petit butin immédiat, avec un temps de recharge par biome. */
export function forage(draft: GameState, biomeId: string, ctx: ActionContext, events: GameEvent[]): void {
  const b = BIOME_BY_ID[biomeId];
  assertGame(b, 'unknown_biome', 'Biome inconnu.');
  assertGame(isBiomeUnlocked(draft, b), 'biome_locked', 'Biome non accessible.');
  assertGame(ctx.now >= forageReadyAt(draft, biomeId), 'cooldown', 'Cette zone a déjà été fouillée récemment.');
  draft.exploration.lastForageAt[biomeId] = ctx.now;
  const reward: Reward = { coins: randInt(ctx.rng, 15, 40), items: {}, eggs: [] };
  const mat = weightedPick(ctx.rng, b.materials.map((m) => ({ value: m.item, weight: m.weight })));
  reward.items![mat] = 1;
  const weather = biomeWeather(biomeId, ctx.now);
  if (ctx.rng.next() < X.forageEggChance * weather.eggChanceMul) {
    reward.eggs!.push(weightedPick(ctx.rng, b.eggs.map((e) => ({ value: e.egg, weight: e.weight }))));
  }
  grant(draft, 'coins', reward.coins!, `Fouille : ${b.name}`, ctx.now);
  draft.inventory[mat] = (draft.inventory[mat] ?? 0) + 1;
  for (const egg of reward.eggs!) addEgg(draft, egg, `Fouille : ${b.name}`, ctx.now, { ignoreCap: true });
  draft.stats.forages += 1;
  events.push({ type: 'foraged', biomeId, reward });
}
