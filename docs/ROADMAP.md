# Feuille de route et état réel

Légende : ✅ terminé et vérifié · 🟡 partiel (détail indiqué) · ⏳ non commencé

## Phase 1 — Fondations ✅

| Élément | État |
|---|---|
| Architecture en couches (core / data / services / store / ui) | ✅ |
| Navigation : barre latérale PC, barre inférieure + feuille « Plus » sur mobile, URL par écran (`#/bestiaire`), bouton retour | ✅ |
| Interface : système de design, modales, notifications, infobulles, barres, badges de rareté, transitions | ✅ |
| Données centralisées et validées automatiquement | ✅ |
| Sauvegarde automatique, copie de secours, migrations, export / import | ✅ |
| Inventaire (objets, œufs, journal des transactions) | ✅ |
| Trois monnaies (pièces, cristaux, essence) avec journal | ✅ |
| Paramètres (son, animations réduites), profil, réinitialisation | ✅ |

## Phase 2 — Cœur du jeu ✅

| Élément | État |
|---|---|
| 10 œufs (design unique animé, rareté, temps, conditions, table configurable) | ✅ |
| Incubateurs (2 au départ, jusqu'à 6), 6 ambiances qui influencent les mutations, bonus de nuit réel (20h–6h) | ✅ |
| Accélération transparente (1 cristal / 10 min restantes) | ✅ |
| Animation d'éclosion : tremblements, fissures, lumière, particules, ouverture, apparition selon la rareté | ✅ |
| 30 espèces originales (bébés, juvéniles, adultes, ancestraux), 15 éléments | ✅ |
| 9 raretés avec couleur, effet et probabilité centralisée | ✅ |
| 11 mutations visuelles cumulables (groupes compatibles) | ✅ |
| Bestiaire : silhouettes, catégories, filtres, recherche, fiches, lignées, variantes, historique, complétion | ✅ |
| Probabilités réelles affichées (espèces + mutations, par ambiance, jour / nuit) | ✅ |


## Phase 3 — Profondeur ✅

| Élément | État |
|---|---|
| Nourriture, XP, niveaux (1–50), affection, régime alimentaire suivi | ✅ |
| Évolutions avec conditions : niveau, affection, jour/nuit, objet (consommé), alimentation, ambiance de naissance, mutation | ✅ |
| Embranchements : Lichenou, Frimelot et Caillounet ont chacun deux évolutions possibles (choix définitif) | ✅ |
| 6 nouvelles espèces (36 au total) : Pétalys, Aurgile, Frimelune, Marécroc, Voilunaire, Sarcophor | ✅ |
| Objets d'évolution (Coquille d'éveil, Rosée lunaire) achetables en essence | ✅ |
| Cinématique d'évolution (lueur, alternance accélérée des silhouettes, éclair, révélation) | ✅ |
| Laboratoire : choix des parents, compatibilité, prévisions exactes avant validation, coût | ✅ |
| Règles : niveau 10+, affection 20+, 4 fusions max par créature, repos de 1 h | ✅ |
| Héritage : chaque gène d'un parent (±3, bond +5 possible), teinte et taille moyennes, génération | ✅ |
| Transmission des mutations (35 %, 70 % avec stabilisateur d'essence), groupes incompatibles respectés | ✅ |
| 4 recettes secrètes (Brumavap, Cristalis, Cométuse, Néantelle), carnet de recettes avec indices | ✅ |
| Œuf génétique (motif ADN), animation de fusion, éclosion qui révèle la recette | ✅ |
| Quêtes du Chapitre IV (évolution, fusion, recette, 22 espèces) | ✅ |
| Sauvegarde : schéma v2 avec migration automatique depuis v1 | ✅ |

_Reste pour plus tard :_ conditions d'évolution liées à la météo (arrivera avec la météo, Phase 4) ; davantage d'espèces et de recettes (contenu, sans changement de moteur).

## Phase 4 — Monde ✅

| Élément | État |
|---|---|
| 8 biomes illustrés et animés, débloqués par la progression du Bestiaire, sur une carte du monde | ✅ |
| Météo par biome et pour le sanctuaire (12 types, dont 4 événements rares : Pluie d'étoiles, Éruption, Aurore boréale, Marée lumineuse), change toutes les 3 h, déterministe | ✅ |
| Expéditions : équipe de 1 à 3, trois durées, qualité selon puissance / éléments / météo, prévisions exactes avant départ, rappel possible | ✅ |
| Fouille rapide par biome (recharge 20 min) | ✅ |
| 8 matériaux, 4 œufs exclusifs à l'exploration, 4 créatures exclusives (40 espèces au total) | ✅ |
| Zones secrètes (une par biome) révélées par l'exploration | ✅ |
| Bâtiments améliorables : Nichoirs (capacité), Grenier (œufs), Jardin (nourriture), Bassin et Fournaise (zones aquatique et volcanique), Observatoire (essence) | ✅ |
| Décorations visibles dans la scène, 5 terrains de sanctuaire débloqués par l'exploration | ✅ |
| Effets météo animés dans le sanctuaire ; créatures en expédition absentes de la scène | ✅ |
| Missions quotidiennes et hebdomadaires (3 + 3), quêtes secondaires de biome (16), succès / trophées (16), Chapitre V de la quête principale | ✅ |
| Évolution liée à la météo (Champilou → Marécroc sous la pluie) | ✅ |
| Sauvegarde v4 avec migration | ✅ |

**Décision technique — Phaser non retenu (pour l'instant).** L'exploration a été conçue en expéditions et scènes illustrées (SVG + CSS), qui fonctionnent aussi bien sur mobile que sur PC sans moteur supplémentaire (~1 Mo). Phaser ne sera ajouté que si une exploration en temps réel (déplacement libre d'un personnage) est décidée ; le cœur du jeu reste indépendant du rendu.

_Reste pour plus tard :_ musiques d'ambiance par biome (Phase 8), boss communautaires et événements saisonniers partagés (Phase 6, nécessitent un serveur).

## Phase 5 — Combats ⏳
Tour par tour, équipes de 3, énergie, compétences, statuts · table des forces élémentaires (déjà dans `data/elements.ts`) · PNJ, arènes, boss, récompenses.

## Phase 6 — Multijoueur ⏳
Supabase (comptes, synchronisation, validation serveur) · amis, visites, échanges sécurisés, marché, classements, événements communautaires. Voir ARCHITECTURE.md.

## Phase 7 — Multiplateforme ⏳
Capacitor (Android / iOS), Electron (Windows / macOS), PWA hors ligne, tests par format.

## Phase 8 — Finitions ⏳
Musiques par biome, sons enrichis, effets visuels, optimisation, tests complets.

## Limites connues (honnêtes)

- Hors ligne, un joueur peut modifier sa sauvegarde ou l'horloge système : attendu jusqu'à la Phase 6.
- La boutique ne propose aucun achat en argent réel ; aucune monétisation n'est implémentée.
- Les textes sont en français, directement dans les composants (pas encore d'i18n).
