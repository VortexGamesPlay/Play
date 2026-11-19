# Rapport d'analyse initial — EGGVERSE

_Date : 19 novembre 2026_

## 1. État du projet existant

| Élément | Constat |
|---|---|
| Dépôt | `maxencelefebvre6-pixel/Play`, branche `claude/eggverse-game-development-p0py91` |
| Historique | **Aucun commit** |
| Fichiers | **Aucun** (dépôt vide hormis `.git`) |
| Technologies en place | Aucune |
| Fonctionnalités existantes | Aucune |

**Conséquence :** il n'y avait aucune architecture à préserver ni aucun fichier à conserver. Le projet a été initialisé de zéro, en suivant l'architecture cible du cahier des charges, avec les ajustements justifiés ci-dessous.

## 2. Environnement disponible

- Node.js 22, npm 10, accès au registre npm.
- Chromium + Playwright préinstallés (utilisés pour les tests de bout en bout et les captures).
- Pas de SDK Android / Xcode dans le conteneur : les builds natifs (Phase 7) devront être produits sur une machine équipée ou en CI.

## 3. Choix techniques

| Besoin | Choix | Justification |
|---|---|---|
| Langage | **TypeScript strict** | Sécurité des refactorings sur un projet de plusieurs années. |
| Interface | **React 18** | Écrans riches (Bestiaire, fiches, boutique), écosystème mature. |
| État | **Zustand** | Store minimal ; la logique métier reste hors de React. |
| Build | **Vite** (`base: './'`) | Rapide ; le build fonctionne aussi en `file://` (Electron) et dans Capacitor. |
| Tests | **Vitest** + script **Playwright** | Tests unitaires du cœur + parcours réel dans un navigateur. |
| Rendu 2D | **SVG procédural** (Phases 1-2) | 30 espèces et 11 mutations sans aucun asset ; poids nul ; nets à toute taille. |
| Moteur 2D | **Phaser 3 — reporté à la Phase 4** | Rien dans les Phases 1-2 ne nécessite de tilemap ni de physique. L'ajouter maintenant alourdirait le bundle (~1 Mo) sans bénéfice. Il sera introduit pour l'exploration des biomes ; le cœur du jeu est indépendant du rendu. |
| Mobile / PC | **Capacitor / Electron — Phase 7** | Le build web est déjà compatible (chemins relatifs, safe-areas iOS, cibles tactiles ≥ 44 px). |
| Backend | **Supabase — Phase 6** | Le cœur est écrit pour être rejoué côté serveur (voir ARCHITECTURE.md). |

## 4. Risques techniques identifiés

| Risque | Impact | Mitigation |
|---|---|---|
| Triche : le client possède l'état complet (Phases 1-5 hors ligne) | Ressources / créatures falsifiées | Réducteur pur et déterministe, rejouable côté serveur ; en Phase 6, le serveur devient la source de vérité (actions validées, RNG serveur). La somme de contrôle locale ne protège **que** contre la corruption. |
| Dérive des probabilités entre affichage et tirage | Perte de confiance, problème légal (loot boxes) | Une **seule** fonction calcule les probabilités (`core/systems/odds.ts`) ; un test vérifie que la fréquence observée correspond à l'affichage. |
| Migrations de sauvegarde | Perte de progression | Schéma versionné, migrations chaînées, copie de secours, normalisation des champs manquants, fichiers corrompus conservés. |
| Croissance du contenu (centaines d'espèces) | Données incohérentes | `validateContent()` vérifie toute l'intégrité référentielle à chaque test et au démarrage en dev. |
| Performance mobile du sanctuaire | Saccades | Nombre de créatures animées plafonné (14), animations CSS composées, horloge partagée unique. |
| Builds iOS / Android | Non testables dans ce conteneur | À réaliser en Phase 7 sur machine équipée / CI. |
| Temps réel et triche à l'horloge | Accélération des incubations en changeant l'heure système | Accepté hors ligne ; validé par l'horodatage serveur en Phase 6. |
