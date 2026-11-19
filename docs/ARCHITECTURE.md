# Architecture EGGVERSE

```
src/
├── core/                 Moteur de règles — TypeScript pur, AUCUNE dépendance au DOM
│   ├── types.ts          État du jeu (GameState) et entités
│   ├── content.ts        Schéma du contenu configurable (espèces, œufs, mutations…)
│   ├── actions.ts        applyAction(state, action, ctx) → { state, events }
│   ├── events.ts         Événements émis (éclosion, niveau, récompense…)
│   ├── rng.ts            RNG déterministe (Mulberry32) + tirages pondérés
│   ├── time.ts           Jour/nuit, jours calendaires, formatage des durées
│   ├── state.ts          Nouvelle partie
│   ├── systems/          economy · inventory · incubation · hatching · odds · creatures
│   │                     dex · feeding · sanctuary · daily · quests · shop
│   └── save/             serializer (enveloppe + somme de contrôle) · migrations
├── data/                 TOUT le contenu et l'équilibrage, sans logique
│   ├── species.ts        30 espèces (stats, évolutions, apparence procédurale)
│   ├── eggs.ts           10 œufs (tables, temps, affinités, conditions)
│   ├── rarities.ts       9 raretés — SOURCE UNIQUE des poids de probabilité
│   ├── mutations.ts      11 mutations (groupes d'incompatibilité)
│   ├── ambiances.ts      6 ambiances d'incubateur (influence sur les mutations)
│   ├── items.ts · personalities.ts · shop.ts · quests.ts · elements.ts
│   ├── balance.ts        Constantes d'équilibrage
│   └── validate.ts       Intégrité référentielle du contenu
├── services/             Effets de bord : sauvegarde (interface + localStorage), audio
├── store/                gameStore (relie le cœur à React, autosave) · uiStore (navigation, modales, toasts)
└── ui/                   React : layout, écrans, modales, composants, art procédural
```

## Flux d'une action

```
Clic → useGame.dispatch(action)
     → applyAction(state, action, { now, rng, hour, dayKey })   // pur, atomique
         ├─ structuredClone(state) → draft
         ├─ systèmes métier (lèvent GameError si l'action est invalide)
         └─ retourne { state, events }
     → set(state) → autosave différée (800 ms) + sauvegarde au passage en arrière-plan
     → events → animations (éclosion), toasts, sons
```

- **Atomicité** : en cas d'erreur, l'état d'origine n'est jamais modifié.
- **Déterminisme** : le temps et l'aléatoire sont injectés (`ActionContext`). Avec la même graine, la même action produit le même résultat → tests reproductibles et validation serveur possible.

## Probabilités centralisées

- Les poids viennent **uniquement** de `data/rarities.ts` (`hatchWeight`) × un multiplicateur optionnel par œuf (`weightMul`).
- `core/systems/odds.ts` calcule les probabilités d'espèces et de mutations. **Ces mêmes fonctions** servent au tirage (`hatching.ts`) et à l'affichage (`OddsModal`).
- Les mutations sont tirées **une fois par groupe** (`palette`, `matiere`, `element`, `forme`) : deux mutations d'un même groupe sont incompatibles, des groupes différents se cumulent. Chaque probabilité est plafonnée (`BALANCE.mutationChanceCap = 35 %`) : aucune mutation n'est garantie.

## Ajouter du contenu (sans toucher au moteur)

| Ajout | Fichier(s) |
|---|---|
| Espèce | une entrée dans `data/species.ts` (+ l'ajouter à la table d'un œuf si elle éclôt) |
| Œuf | une entrée dans `data/eggs.ts` (+ offre dans `data/shop.ts` si vendu) |
| Mutation | une entrée dans `data/mutations.ts` + son apparence dans `ui/art/mutationLook.ts` |
| Ambiance | `data/ambiances.ts` + offre boutique |
| Quête | `data/quests.ts` |
| Évolution / embranchement | `evolutions` de l'espèce source dans `data/species.ts` (conditions : niveau, affection, jour/nuit, objet, alimentation, ambiance de naissance, mutation) |
| Recette génétique secrète | `data/recipes.ts` (parents par espèce ou élément, chance) |

`npm test` exécute `validateContent()` : toute référence cassée fait échouer les tests.

## Génétique (Laboratoire)

- `core/systems/breeding.ts` : règles (niveau, affection, fertilité, repos), coût, héritage des gènes et des mutations.
- `breedingOdds(a, b)` dans `odds.ts` : recettes applicables puis formes de base des deux lignées. **Même fonction** pour le tirage et pour l'affichage du Laboratoire.
- L'espèce, les gènes et les mutations héritées sont fixés au moment de la fusion et stockés dans l'œuf (`EggInstance.genetics`) ; l'ambiance d'incubation peut encore ajouter une mutation dans un groupe libre. Côté serveur (Phase 6), la fusion sera exécutée avec la RNG serveur : le client ne pourra pas « relancer » un œuf.

## Rendu des créatures

`ui/art/CreatureArt.tsx` assemble une créature à partir de son `ArtSpec` : forme du corps (8), oreilles (12), crête (10), queue (10), ailes (6), yeux (6), bouche (5), motif (7) et palette. Les gènes décalent la teinte (±12°) ; les mutations transforment la palette et ajoutent des couches (`mutationLook.ts`). Animations CSS : repos, marche, attaque, sommeil, clignement, battement d'ailes, queue. Les silhouettes de l'Ovidex passent par un filtre SVG (forme pure).

## Sauvegarde

- Enveloppe `{ format, schemaVersion, savedAt, checksum, state }`. La somme FNV-1a détecte la **corruption**, pas la triche.
- `LocalSaveRepository` : écriture principale + copie de secours ; repli automatique sur la copie si la principale est illisible ; fichier défaillant conservé pour diagnostic.
- Migrations chaînées dans `core/save/migrations.ts` ; `normalizeState` complète les champs manquants et écarte les références à du contenu supprimé.
- Export / import JSON dans le Profil (transfert manuel entre appareils en attendant la Phase 6).

## Plan multijoueur et sécurité (Phase 6)

1. **Supabase Auth** pour les comptes ; tables `profiles`, `creatures`, `eggs`, `wallets`, `ledger`, `dex_entries`, `trades`, `world_discoveries`.
2. Le client n'envoie que des **intentions** (`GameAction`). Une Edge Function exécute `applyAction` (même code, importé depuis `src/core`) avec l'horloge et la RNG **serveur**, puis persiste le résultat dans une transaction.
3. Row Level Security : un joueur ne lit/écrit que ses lignes ; les échanges passent par une fonction serveur qui verrouille les deux créatures (`SELECT … FOR UPDATE`) → pas de duplication.
4. Journal des transactions côté serveur (le `ledger` local en est la préfiguration).
5. Le `SaveRepository` local devient un cache hors ligne ; une file d'actions est rejouée à la reconnexion.
