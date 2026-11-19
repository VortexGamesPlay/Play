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

## Interdits (anti-plagiat)

- Pas de grands yeux étoilés façon mascotte.
- Pas d'archétypes reconnaissables d'une licence existante : rongeur jaune électrique, lézard orange à queue enflammée, tortue à carapace bleue, etc.
- Pas de nom, design, objet ou symbole emprunté (ex. balle de capture).
- Un élément ≠ une couleur imposée : la Foudre d'EGGVERSE est violette et cyan (phalènes d'orage), le Feu est rouge basalte et braise.

## Contrôle

`npx vite-node scripts/make-showcase-save.ts species fichier.json` produit une sauvegarde contenant les 30 espèces, à importer dans le Profil pour relire toute la galerie.
