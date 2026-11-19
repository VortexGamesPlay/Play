# Direction artistique des créatures — « style Coquille »

EGGVERSE doit être reconnaissable au premier coup d'œil, **sans ressembler à aucune licence existante**.
Toute nouvelle créature respecte les règles ci-dessous (elles sont appliquées automatiquement par `ui/art/CreatureArt.tsx`).

## Les trois signatures

1. **La coquille-héritage.** Chaque créature garde un morceau de l'œuf dont elle est née, aux couleurs de cet œuf :
   - bébé → assis dans le **bas de sa coquille** ;
   - juvénile → porte le **haut de la coquille en chapeau**, légèrement penché ;
   - adulte / ancestral → n'en garde qu'un **éclat en pendentif**.
   La coquille raconte donc l'âge et l'origine de la créature. (`art.shell` et `art.nativeEgg` permettent de forcer un style.)
2. **Le noyau.** Une gemme lumineuse, de la couleur de l'élément, qui pulse doucement : sertie dans la coquille chez les bébés, sur la poitrine ou dans l'éclat chez les autres.
3. **Le visage EGGVERSE.** Yeux en amande petits et écartés, un seul reflet, un cil extérieur ; taches de rousseur (jamais de joues roses rondes) ; petite bouche ; trait de contour fin et coloré (jamais noir).

## Noms (anti-plagiat)

- Chaque nom de créature est un mot inventé, à consonance française, propre à EGGVERSE.
- `npm run check:names` compare automatiquement les noms de créatures, de compétences, d'états de combat, d'objets et tous les autres libellés aux listes publiques d'espèces, d'attaques, de talents et d'objets (5 langues). Les noms de personnages (rivaux) ne figurent pas dans ces listes : ils sont choisis à la main parmi des prénoms français peu courants, en évitant les noms de personnages connus.
- Détail du contrôle : il compare automatiquement tous les noms à la liste publique des noms d'espèces d'une licence existante (5 langues, ~2 700 noms, téléchargée à l'exécution et **jamais stockée dans le dépôt**). Un nom est refusé s'il est identique, à 2 lettres près, ou s'il partage une racine de 5 lettres. Les libellés en français courant (familles, objets, œufs) ne sont refusés qu'en cas d'identité exacte.
- Vocabulaire maison : **Bestiaire** (encyclopédie), **mutation Irisée** (variante de couleur), **Coquille d'éveil** et **Rosée lunaire** (objets d'évolution), **Fruit rose**. On n'emploie pas le vocabulaire propre à une licence existante (« -dex », « chromatique » au sens de variante, pierres d'évolution, « baies », balles de capture, dresseurs…).

## Interdits (anti-plagiat)

- Pas de grands yeux étoilés façon mascotte.
- Pas d'archétypes reconnaissables d'une licence existante : rongeur jaune électrique, lézard ou dragon de feu ailé, trio de départ feu/eau/plante présenté comme un choix, lion cosmique, fée lunaire venue de l'espace, scarabée qui roule une boule, hibou de nuit, créature avec un jardin sur le dos, etc.
- Concepts retenus à la place : béliers de basalte (feu), gelées marines (eau), gardiens des clairières (nature), phalènes d'orage (foudre), gardiens des songes (ombre), sphinx de grès (désert), méduse-comète et baleine des étoiles (cosmique), golem d'ambre (primordial).
- Pas de nom, design, objet ou symbole emprunté (ex. balle de capture).
- Un élément ≠ une couleur imposée : la Foudre d'EGGVERSE est violette et cyan (phalènes d'orage), le Feu est rouge basalte et braise.

## Contrôle

`npx vite-node scripts/make-showcase-save.ts species fichier.json` produit une sauvegarde contenant les 30 espèces, à importer dans le Profil pour relire toute la galerie.
