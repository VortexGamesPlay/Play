import type { EvolutionCondition } from '@core/content';
import { AMBIANCES } from '@data/ambiances';
import { ITEMS } from '@data/items';
import { MUTATIONS } from '@data/mutations';
import { WEATHERS } from '@data/weather';
import { intlLocale, tr, getLocale } from '../i18n';

const TAGS: Record<string, string> = { fruit: 'fruits', graine: 'graines', poisson: 'poissons', champi: 'champignons', mineral: 'minéraux', nectar: 'nectars' };
export const foodTagName = (t: string) => TAGS[t] ?? t;

export function conditionText(c: EvolutionCondition): string {
  switch (c.type) {
    case 'level': return `Niveau ${c.value}`;
    case 'affection': return `Affection ${c.value}`;
    case 'timeOfDay': return c.value === 'day' ? 'De jour' : 'De nuit';
    case 'item': return `Objet : ${ITEMS[c.item]?.name ?? c.item}`;
    case 'diet': return `${c.count} ${foodTagName(c.tag)} mangés`;
    case 'mutation': return `Mutation ${MUTATIONS[c.mutation]?.name ?? c.mutation}`;
    case 'ambiance': return `Née en ambiance ${AMBIANCES[c.ambiance]?.name ?? c.ambiance}`;
    case 'weather': return `Météo du sanctuaire : ${WEATHERS[c.weather]?.name ?? c.weather}`;
  }
}

export const fmtDate = (t: number) => new Date(t).toLocaleDateString(intlLocale(), { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtDateTime = (t: number) => new Date(t).toLocaleString(intlLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Nom affiché d'un gardien : « Gardien » (nom par défaut) est traduit, un nom choisi reste tel quel. */
export const keeperName = (n: string) => (n === 'Gardien' ? (getLocale() === 'fr' ? 'Gardien' : tr('Gardien (nom par défaut)')) : n);
