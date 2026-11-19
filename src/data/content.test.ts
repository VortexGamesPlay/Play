import { describe, expect, it } from 'vitest';
import { EGGS, SPECIES_LIST, validateContent } from './index';

describe('Contenu du jeu', () => {
  it('ne contient aucune référence cassée', () => {
    expect(validateContent()).toEqual([]);
  });
  it('contient 30 espèces avec des numéros 1..30', () => {
    expect(SPECIES_LIST).toHaveLength(30);
    expect(SPECIES_LIST.map((s) => s.dex).sort((a, b) => a - b)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });
  it('contient les 10 catégories d\'œufs', () => {
    expect(Object.keys(EGGS)).toHaveLength(10);
  });
});
