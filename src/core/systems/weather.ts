import { BALANCE } from '@data/balance';
import { BIOME_BY_ID, SANCTUARY_WEATHER } from '@data/biomes';
import { WEATHERS } from '@data/weather';
import type { WeatherDef } from '../content';
import { createRng, weightedPick } from '../rng';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * Météo déterministe : même lieu + même tranche de 3 h ⇒ même météo, pour tous les joueurs
 * (et reproductible côté serveur). Aucune donnée à sauvegarder.
 */
export function weatherFor(key: string, table: { weather: string; weight: number }[], now: number): WeatherDef {
  const period = Math.floor(now / BALANCE.weatherPeriodMs);
  const rng = createRng(hash(key) ^ Math.imul(period, 2654435761));
  return WEATHERS[weightedPick(rng, table.map((t) => ({ value: t.weather, weight: t.weight })))]!;
}

export function biomeWeather(biomeId: string, now: number): WeatherDef {
  return weatherFor(`biome:${biomeId}`, BIOME_BY_ID[biomeId]!.weather, now);
}

export function sanctuaryWeather(now: number): WeatherDef {
  return weatherFor('sanctuaire', SANCTUARY_WEATHER, now);
}

export function nextWeatherChange(now: number): number {
  return (Math.floor(now / BALANCE.weatherPeriodMs) + 1) * BALANCE.weatherPeriodMs;
}

/** Probabilité de chaque météo dans une table (affichage transparent). */
export function weatherOdds(table: { weather: string; weight: number }[]): { weather: WeatherDef; probability: number }[] {
  const total = table.reduce((s, t) => s + t.weight, 0);
  return table.map((t) => ({ weather: WEATHERS[t.weather]!, probability: t.weight / total }));
}
