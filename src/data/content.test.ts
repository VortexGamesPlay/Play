import { describe, expect, it } from 'vitest';
import { EGGS, SPECIES_LIST, validateContent } from './index';

describe('Contenu du jeu', () => {
  it('ne contient aucune référence cassée', () => {
    expect(validateContent()).toEqual([]);
  });
  it('numérote les espèces sans trou (1..N)', () => {
    expect(SPECIES_LIST.length).toBeGreaterThanOrEqual(36);
    expect(SPECIES_LIST.map((s) => s.dex).sort((a, b) => a - b)).toEqual(Array.from({ length: SPECIES_LIST.length }, (_, i) => i + 1));
  });
  it('contient les 10 catégories d\'œufs du cahier des charges + l\'œuf génétique', () => {
    expect(Object.values(EGGS).filter((e) => !e.genetic)).toHaveLength(10);
    expect(EGGS.hybride?.genetic).toBe(true);
  });
  it('propose plusieurs évolutions pour au moins une espèce', () => {
    expect(SPECIES_LIST.filter((s) => s.evolutions.length > 1).length).toBeGreaterThanOrEqual(3);
  });
});
