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

## Effets sonores (57)

Fichiers : `public/audio/sfx/*.mp3` (2,3 Mo), joués par `src/services/audio.ts`. Les sons d'interface se chargent au premier toucher ; les sons de combat et de grandes révélations seulement à l'ouverture d'un combat / d'une éclosion (économie de données mobiles). Son synthétisé en secours si un fichier manque.

| Son | Utilisation |
|---|---|
| tap / open / close / tab / whoosh | Boutons, ouverture et fermeture de fenêtres, onglets, transitions |
| notify | Notifications (seulement si aucun autre son ne vient d'être joué) |
| coin / crystal / claim / buy / harvest | Pièces, cristaux, récompenses, achat, récolte |
| placeEgg / ambiance / speedUp / eggReady / crack / reveal | Œuf posé, ambiance changée, accélération, œuf prêt à éclore (pendant qu'on joue), coquille qui craque, éclosion |
| revealEpic / mutation | Éclosion ou évolution légendaire et plus, variante découverte |
| feed / happy / favorite / release / rename | Nourrir (+ cri de joie si plat préféré), toucher une créature, favori, libérer, renommer |
| levelUp / breed | Niveau supérieur, fusion au laboratoire |
| expeditionStart / expeditionReturn / forage / unlock | Départ, retour d'expédition, fouille, zone secrète découverte |
| upgrade / decorate | Bâtiment amélioré, décoration ou thème |
| battleStart / round | Gong de début de combat, nouvelle manche |
| skill-feu … skill-primordial (15) | Compétence de chaque élément (feu, eau, nature, glace, air, terre, foudre, lumière, ombre, vapeur, cosmique, cristal, toxique, spectre, primordial) ; compétences neutres : whoosh |
| hit / crit / heal / buff / debuff / stun / ko | Coup, coup critique, soin, bonus, malus, étourdi, hors de combat |
| error | Action impossible |

## Ambiances météo (9 boucles)

Fichiers : `public/audio/ambience/*.mp3` (2,3 Mo, boucles de 15 s), lecteur `src/services/ambience.ts`.
Elles jouent doucement sous la musique (volume = 32 % du volume des effets) : au **Sanctuaire** selon sa météo, et dans la **fenêtre d'un biome / d'une expédition** selon la météo du biome. Coupées en combat.

| Météo (effet visuel) | Ambiance |
|---|---|
| rain | Pluie douce |
| storm | Pluie forte et tonnerre lointain |
| snow | Vent froid et cristaux de glace |
| wind | Rafales dans les arbres |
| embers | Braises qui crépitent, grondement de lave |
| fog | Brume, gouttes lointaines |
| stars | Nuit étoilée, grillons |
| aurora | Aurore boréale, nappes cristallines |
| sun | Oiseaux et abeilles (le jour seulement) |

Réglages joueur (Profil) : interrupteur Son général, volume Musique, volume Effets. La musique démarre au premier toucher (règle des navigateurs) et se met en pause quand l'application passe en arrière-plan.

Crédits ElevenLabs utilisés : environ 18 500 pour la musique + environ 700 pour les effets et ambiances (total de la session ≈ 19 200), sur le budget de 30 000 accordé.
Les sources restent modifiables dans le « flow » ElevenLabs `5TrEUFBnqDZAPT2fGxaw`.
