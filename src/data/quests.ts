import type { QuestDef } from '@core/content';

/**
 * Quête principale « L'Éveil du Sanctuaire » : objectifs courts qui guident les premières heures.
 * Les quêtes se débloquent dans l'ordre ; la progression est calculée à partir de l'état (core/systems/quests.ts).
 */
export const MAIN_QUESTS: QuestDef[] = [
  { id: 'q01', chapter: 'Chapitre I — L\'Éveil', title: 'Première chaleur', description: 'Place un œuf dans un incubateur et attends son éclosion.',
    goal: { kind: 'stat', stat: 'eggsHatched', target: 1 }, reward: { coins: 100, items: { baie_sucree: 3 } } },
  { id: 'q02', chapter: 'Chapitre I — L\'Éveil', title: 'Petit creux', description: 'Nourris une créature.',
    goal: { kind: 'stat', stat: 'creaturesFed', target: 1 }, reward: { coins: 80, crystals: 3 } },
  { id: 'q03', chapter: 'Chapitre I — L\'Éveil', title: 'Les fruits du sanctuaire', description: 'Récolte les pièces produites par tes créatures dans le Sanctuaire.',
    goal: { kind: 'stat', stat: 'harvests', target: 1 }, reward: { coins: 120, eggs: ['forestier'] } },
  { id: 'q04', chapter: 'Chapitre I — L\'Éveil', title: 'Petite famille', description: 'Possède 4 créatures.',
    goal: { kind: 'creatureCount', target: 4 }, reward: { coins: 150, eggs: ['marin'] } },
  { id: 'q05', chapter: 'Chapitre I — L\'Éveil', title: 'Apprenti naturaliste', description: 'Découvre 3 espèces différentes dans l\'Ovidex.',
    goal: { kind: 'dexCount', target: 3 }, reward: { coins: 200, crystals: 5 } },
  { id: 'q06', chapter: 'Chapitre II — La Croissance', title: 'Grandir ensemble', description: 'Fais atteindre le niveau 5 à une créature.',
    goal: { kind: 'maxLevel', target: 5 }, reward: { coins: 250, items: { graine_soleil: 5 } } },
  { id: 'q07', chapter: 'Chapitre II — La Croissance', title: 'Plus de place', description: 'Possède 3 incubateurs.',
    goal: { kind: 'incubators', target: 3 }, reward: { coins: 300, eggs: ['volcanique'] } },
  { id: 'q08', chapter: 'Chapitre II — La Croissance', title: 'Couveuse confirmée', description: 'Fais éclore 10 œufs.',
    goal: { kind: 'stat', stat: 'eggsHatched', target: 10 }, reward: { coins: 400, crystals: 10 } },
  { id: 'q09', chapter: 'Chapitre II — La Croissance', title: 'Une étrange lueur', description: 'Découvre ta première variante (mutation).',
    goal: { kind: 'variantCount', target: 1 }, reward: { essence: 40, crystals: 10 } },
  { id: 'q10', chapter: 'Chapitre II — La Croissance', title: 'Encyclopédiste', description: 'Découvre 8 espèces.',
    goal: { kind: 'dexCount', target: 8 }, reward: { coins: 600, eggs: ['fantome'] } },
  { id: 'q11', chapter: 'Chapitre III — Les Mystères', title: 'Lien profond', description: 'Fais atteindre le niveau 15 à une créature.',
    goal: { kind: 'maxLevel', target: 15 }, reward: { coins: 800, items: { cristal_sucre: 3 } } },
  { id: 'q12', chapter: 'Chapitre III — Les Mystères', title: 'Gardien reconnu', description: 'Découvre 12 espèces.',
    goal: { kind: 'dexCount', target: 12 }, reward: { crystals: 30, eggs: ['antique'] } },
  { id: 'q13', chapter: 'Chapitre III — Les Mystères', title: 'Collection d\'anomalies', description: 'Découvre 5 variantes différentes.',
    goal: { kind: 'variantCount', target: 5 }, reward: { crystals: 40, essence: 80 } },
  { id: 'q14', chapter: 'Chapitre III — Les Mystères', title: 'Sous les étoiles', description: 'Découvre 15 espèces.',
    goal: { kind: 'dexCount', target: 15 }, reward: { crystals: 60, eggs: ['cosmique'] } },
];
