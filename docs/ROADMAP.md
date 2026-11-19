# Feuille de route et état réel

Légende : ✅ terminé et vérifié · 🟡 partiel (détail indiqué) · ⏳ non commencé

## Phase 1 — Fondations ✅

| Élément | État |
|---|---|
| Architecture en couches (core / data / services / store / ui) | ✅ |
| Navigation : barre latérale PC, barre inférieure + feuille « Plus » sur mobile, URL par écran (`#/ovidex`), bouton retour | ✅ |
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
| Ovidex : silhouettes, catégories, filtres, recherche, fiches, lignées, variantes, historique, complétion | ✅ |
| Probabilités réelles affichées (espèces + mutations, par ambiance, jour / nuit) | ✅ |

### Livré en avance (bases des phases suivantes)

- 🟡 **Phase 3** : nourriture, XP, niveaux (50), affection et régime alimentaire. _Pas encore :_ évolutions, reproduction, génétique héritée.
- 🟡 **Phase 4** : sanctuaire vivant (promenade, sommeil plus fréquent la nuit, repas, jeu, réaction au toucher), récolte passive de pièces, cycle jour/nuit, quête principale (14 étapes), récompense quotidienne avec série. _Pas encore :_ habitats, décorations, bâtiments, biomes, expéditions, météo, quêtes secondaires / hebdomadaires.

## Phase 3 — Profondeur ⏳ (prochaine)
Évolutions (conditions déjà dans les données) avec cinématique · Laboratoire : compatibilité, héritage des gènes / teintes / éléments / mutations, recettes secrètes (Brumavap, Néantis) · usages de l'Essence · plus d'espèces et de branches d'évolution.

## Phase 4 — Monde ⏳
Phaser 3 pour les biomes · 8 biomes avec œufs, ressources et secrets · expéditions · météo · habitats et bâtiments améliorables · quêtes secondaires, quotidiennes, hebdomadaires, succès.

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
