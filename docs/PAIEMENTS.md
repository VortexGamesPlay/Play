# Paiements et économie premium

## Principes (décidés avec le porteur du projet)

- Achats simples, **sans abonnement** : packs de cristaux, offre de démarrage, passe de saison (prix unique par saison), cosmétiques.
- **Aucune créature, aucun œuf** vendu contre de l'argent réel ; tout avantage de jeu reste obtenable gratuitement.
- Limite de dépenses mensuelle réglable par le joueur (Profil). Consentement légal obligatoire avant chaque paiement.
- Prix : **un seul catalogue**, `supabase/functions/_shared/catalog.json`, lu par le jeu et par le serveur. Le serveur ne fait jamais confiance au prix envoyé par l'appareil.

## Fonctionnement

```
Joueur ─ choisit un produit ─▶ jeu ─ productId ─▶ fonction « paypal-create-order » ─▶ PayPal (commande au prix du catalogue)
Joueur ─ valide dans PayPal ─▶ jeu ─ orderId ─▶ fonction « paypal-capture-order » ─▶ PayPal (encaissement)
                                               └─ vérifie statut, montant, devise, produit ─▶ enregistre l'achat (table purchases)
jeu ◀─ reçu vérifié ─ crédite l'achat (une seule fois par numéro de commande)
PayPal ─ remboursement ─▶ fonction « paypal-webhook » (signature vérifiée) ─▶ achat marqué « remboursé »
```

- Comptes : connexion **anonyme** Supabase automatique (les comptes complets arrivent en Phase 6 et reprendront ces achats).
- « Restaurer mes achats » (Profil) recrédite un achat payé mais interrompu avant le crédit.
- Sans configuration serveur, la boutique affiche « bientôt disponibles » (rien n'est simulé). Le **mode test** (faux argent) n'existe qu'en développement ou avec `VITE_PAYMENTS_TEST=1`, et il est toujours signalé.
- Applications mobiles : Apple et Google imposent leur propre paiement pour les achats intégrés — prévu avec la Phase 7.

## Mise en service (à faire une fois)

**Côté porteur du projet**
1. Compte PayPal **Business** → developer.paypal.com → *Apps & Credentials* → *Sandbox* → *Create App* : **Client ID** + **Secret**.
2. Projet **Supabase** (région Europe) : URL du projet, clé `anon`, clé `service_role`.
3. Transmettre les secrets **par le formulaire sécurisé** (jamais dans la conversation ni dans le dépôt).

**Côté technique** (avec la CLI Supabase)
```bash
supabase link --project-ref <ref>
supabase db push                                   # crée la table purchases + sécurité
supabase secrets set PAYPAL_CLIENT_ID=… PAYPAL_CLIENT_SECRET=… PAYPAL_ENV=sandbox PAYPAL_WEBHOOK_ID=…
supabase functions deploy paypal-create-order paypal-capture-order paypal-webhook
```
Puis, dans `.env.local` du jeu : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PAYPAL_CLIENT_ID` (voir `.env.example`).
Passage en réel : identifiants PayPal *Live*, `PAYPAL_ENV=live`, `VITE_PAYPAL_ENV=live`, et les documents légaux publiés.

## Vérifications

- `npm test` : règles d'achat (idempotence, montant, achats uniques, limite mensuelle, saison).
- `node scripts/smoke-premium.mjs` : parcours complet en mode test + vérification qu'aucun achat n'est possible sans serveur.
- Code serveur : `deno check supabase/functions/*/index.ts`. Un test en sandbox PayPal réel sera fait dès que les identifiants seront fournis.
