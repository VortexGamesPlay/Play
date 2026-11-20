import { describe, expect, it } from 'vitest';
import { contentStrings } from './content';
import { EN } from './en';
import { uiStrings } from '../../scripts/i18n-strings';

describe('Traduction anglaise', () => {
  it('traduit tout le contenu du jeu', () => {
    expect(contentStrings().filter((s) => EN[s] === undefined)).toEqual([]);
  });
  it('traduit tous les textes de l\'interface', () => {
    expect(uiStrings().filter((s) => EN[s] === undefined)).toEqual([]);
  });
  it('garde les mêmes paramètres {…} dans les deux langues', () => {
    const params = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    const bad = Object.entries(EN).filter(([fr, en]) => en !== '' && params(fr) !== params(en)).map(([fr]) => fr);
    expect(bad).toEqual([]);
  });
});
