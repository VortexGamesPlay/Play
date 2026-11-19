import type { AchievementDef, MissionDef, QuestDef } from '@core/content';

/** Missions quotidiennes : 3 sont tirées chaque jour dans cette liste (tirage déterministe). */
export const DAILY_MISSIONS: MissionDef[] = [
  { id: 'd_hatch', title: 'Faire éclore 2 œufs', stat: 'eggsHatched', target: 2, reward: { coins: 150, crystals: 2 } },
  { id: 'd_feed', title: 'Donner 5 repas', stat: 'creaturesFed', target: 5, reward: { coins: 120, items: { fruit_rose: 2 } } },
  { id: 'd_harvest', title: 'Récolter 2 fois', stat: 'harvests', target: 2, reward: { coins: 100, essence: 5 } },
  { id: 'd_expe', title: 'Terminer 1 expédition', stat: 'expeditions', target: 1, reward: { coins: 150, crystals: 2 } },
  { id: 'd_forage', title: 'Fouiller 3 fois', stat: 'forages', target: 3, reward: { coins: 120, essence: 5 } },
  { id: 'd_level', title: 'Gagner 3 niveaux', stat: 'levelUps', target: 3, reward: { coins: 150, items: { graine_soleil: 2 } } },
];

/** Missions hebdomadaires : 3 tirées chaque semaine. */
export const WEEKLY_MISSIONS: MissionDef[] = [
  { id: 'w_hatch', title: 'Faire éclore 12 œufs', stat: 'eggsHatched', target: 12, reward: { coins: 900, crystals: 15 } },
  { id: 'w_expe', title: 'Terminer 10 expéditions', stat: 'expeditions', target: 10, reward: { coins: 1000, crystals: 15 } },
  { id: 'w_breed', title: 'Réaliser 2 fusions', stat: 'breedings', target: 2, reward: { essence: 60, crystals: 10 } },
  { id: 'w_evo', title: 'Faire évoluer 2 créatures', stat: 'evolutions', target: 2, reward: { essence: 50, crystals: 10 } },
  { id: 'w_feed', title: 'Donner 35 repas', stat: 'creaturesFed', target: 35, reward: { coins: 700, items: { cristal_sucre: 3 } } },
  { id: 'w_build', title: 'Améliorer 1 bâtiment', stat: 'buildingUpgrades', target: 1, reward: { coins: 800, crystals: 10 } },
];

/** Quêtes secondaires : une paire par biome, disponibles en parallèle. */
export const SIDE_QUESTS: QuestDef[] = [
  ['foret', 'Forêt enchantée'], ['abysses', 'Royaume sous-marin'], ['montagnes', 'Montagnes gelées'], ['volcan', 'Volcan ancestral'],
  ['marais', 'Marais toxique'], ['desert', 'Désert ancien'], ['ombres', 'Vallée des ombres'], ['cosmos', 'Dimension cosmique'],
].flatMap(([biome, name]) => [
  { id: `s_${biome}_1`, chapter: name!, title: 'Premiers pas', description: `Termine 3 expéditions : ${name}.`, goal: { kind: 'biomeExpeditions' as const, biome: biome!, target: 3 }, reward: { coins: 400, crystals: 5 } },
  { id: `s_${biome}_2`, chapter: name!, title: 'Habitué des lieux', description: `Termine 12 expéditions : ${name}.`, goal: { kind: 'biomeExpeditions' as const, biome: biome!, target: 12 }, reward: { coins: 1200, crystals: 15, essence: 20 } },
]);

/** Succès : récompenses uniques, conservés comme trophées. */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'a_hatch10', title: 'Couveur', description: 'Faire éclore 10 œufs.', goal: { kind: 'stat', stat: 'eggsHatched', target: 10 }, reward: { crystals: 10 } },
  { id: 'a_hatch50', title: 'Maître couveur', description: 'Faire éclore 50 œufs.', goal: { kind: 'stat', stat: 'eggsHatched', target: 50 }, reward: { crystals: 30 } },
  { id: 'a_hatch200', title: 'Légende des couvées', description: 'Faire éclore 200 œufs.', goal: { kind: 'stat', stat: 'eggsHatched', target: 200 }, reward: { crystals: 80 } },
  { id: 'a_dex10', title: 'Naturaliste', description: 'Découvrir 10 espèces.', goal: { kind: 'dexCount', target: 10 }, reward: { crystals: 15 } },
  { id: 'a_dex25', title: 'Érudit', description: 'Découvrir 25 espèces.', goal: { kind: 'dexCount', target: 25 }, reward: { crystals: 40 } },
  { id: 'a_dex40', title: 'Mémoire du monde', description: 'Découvrir 40 espèces.', goal: { kind: 'dexCount', target: 40 }, reward: { crystals: 100 } },
  { id: 'a_var5', title: 'Chasseur d\'anomalies', description: 'Découvrir 5 variantes.', goal: { kind: 'variantCount', target: 5 }, reward: { crystals: 15 } },
  { id: 'a_var20', title: 'Collectionneur de prodiges', description: 'Découvrir 20 variantes.', goal: { kind: 'variantCount', target: 20 }, reward: { crystals: 50 } },
  { id: 'a_lvl30', title: 'Lien indéfectible', description: 'Faire atteindre le niveau 30 à une créature.', goal: { kind: 'maxLevel', target: 30 }, reward: { crystals: 25 } },
  { id: 'a_evo5', title: 'Témoin des métamorphoses', description: 'Faire évoluer 5 créatures.', goal: { kind: 'stat', stat: 'evolutions', target: 5 }, reward: { essence: 60 } },
  { id: 'a_breed5', title: 'Généticien', description: 'Réaliser 5 fusions.', goal: { kind: 'stat', stat: 'breedings', target: 5 }, reward: { essence: 80 } },
  { id: 'a_recipe', title: 'Alchimiste', description: 'Découvrir toutes les recettes secrètes.', goal: { kind: 'recipeCount', target: 4 }, reward: { crystals: 60 } },
  { id: 'a_expe25', title: 'Aventurier', description: 'Terminer 25 expéditions.', goal: { kind: 'stat', stat: 'expeditions', target: 25 }, reward: { crystals: 25 } },
  { id: 'a_biomes', title: 'Cartographe', description: 'Atteindre les 8 biomes.', goal: { kind: 'biomesUnlocked', target: 8 }, reward: { crystals: 50 } },
  { id: 'a_secret', title: 'Gardien des secrets', description: 'Trouver 3 zones secrètes.', goal: { kind: 'secretsFound', target: 3 }, reward: { crystals: 40 } },
  { id: 'a_build', title: 'Bâtisseur', description: 'Cumuler 12 niveaux de bâtiments.', goal: { kind: 'buildingLevels', target: 12 }, reward: { crystals: 30 } },
];
