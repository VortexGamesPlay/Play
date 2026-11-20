# Univers sonore d'EGGVERSE

Toute la musique est **originale**, composée pour EGGVERSE avec ElevenLabs Music (forfait payant Creator : usage commercial autorisé).
Style commun : orchestral-folk doux et magique (marimba, célesta, cordes pizzicato, flûte en bois, harpe).

Fichiers : `public/audio/music/*.mp3` (128 kbps, chargés seulement quand on en a besoin).
Lecteur : `src/services/music.ts` (fondus enchaînés entre zones, jingles qui baissent la musique) ; choix de la piste : `src/ui/hooks/useMusic.ts`.

| Fichier | Où | Durée |
|---|---|---|
| title | Communauté (thème principal) | 90 s |
| sanctuary-day / sanctuary-night | Sanctuaire, Collection, Bestiaire, Inventaire, Profil (jour / nuit 20 h–6 h) | 75 s |
| incubator | Incubateur | 60 s |
| biome-foret … biome-cosmos (8) | Exploration et fenêtre de chaque biome | 70 s |
| lab | Laboratoire | 60 s |
| shop | Boutique | 60 s |
| arena / boss | Combats de ligue et de tour / combats de gardiens | 75 s |
| event | Passe de saison et événements | 60 s |
| sting-victory / sting-defeat | Fin de combat | 10–12 s |
| sting-rare-hatch | Éclosion d'une créature rare ou plus, ou d'une variante | 12 s |
| sting-evolution | Évolution | 12 s |

## Effets sonores (10)

Fichiers : `public/audio/sfx/*.mp3` (380 Ko au total), joués par `src/services/audio.ts` (préchargés au premier toucher ; son synthétisé en secours si un fichier manque).

| Son | Utilisation |
|---|---|
| tap | Boutons |
| open | Ouverture de fenêtres |
| whoosh | Transitions, lancement d'une compétence |
| coin | Pièces et récompenses |
| buy | Achat confirmé |
| crack | Coquille qui craque |
| reveal | Éclosion |
| levelUp | Niveau supérieur |
| error | Action impossible |
| hit | Coup reçu en combat |

Réglages joueur (Profil) : interrupteur Son général, volume Musique, volume Effets. La musique démarre au premier toucher (règle des navigateurs) et se met en pause quand l'application passe en arrière-plan.

Crédits ElevenLabs utilisés : environ 18 500 pour la musique + 36 pour les effets, sur le budget de 30 000 accordé.
Les sources restent modifiables dans le « flow » ElevenLabs `5TrEUFBnqDZAPT2fGxaw`.
