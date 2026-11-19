import type { RecipeDef } from '@core/content';

/**
 * Recettes génétiques secrètes. Quand deux parents correspondent (dans un ordre quelconque),
 * l'œuf a `chance` d'être de l'espèce résultat. Le reste revient aux formes de base des parents.
 * Les probabilités sont calculées par core/systems/odds.ts (breedingOdds), affichées avant chaque fusion.
 */
export const RECIPES: RecipeDef[] = [
  { id: 'r_vapeur', name: 'Vapeur vivante', hint: 'Quand la flamme embrasse la vague…',
    parents: [{ element: 'feu' }, { element: 'eau' }], result: 'brumavap', chance: 0.3 },
  { id: 'r_geode', name: 'Géode chantante', hint: 'La pierre patiente et le givre éternel…',
    parents: [{ element: 'terre' }, { element: 'glace' }], result: 'cristalis', chance: 0.2 },
  { id: 'r_astre', name: 'Naissance d\'un astre', hint: 'Le jour qui rencontre la nuit…',
    parents: [{ element: 'lumiere' }, { element: 'ombre' }], result: 'cometuse', chance: 0.06 },
  { id: 'r_neant', name: 'Le Néant', hint: 'La lumière la plus pure et l\'ombre la plus profonde, chacune à son apogée…',
    parents: [{ species: 'aubelys' }, { species: 'revombre' }], result: 'neantelle', chance: 0.08 },
];
