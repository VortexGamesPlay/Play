# Fonctions à coller dans l'éditeur Supabase

Versions « tout-en-un » (un seul fichier) des fonctions de `supabase/functions/`, pour les déployer depuis le tableau de bord
sans outil en ligne de commande. Elles sont GÉNÉRÉES : modifier les originaux dans `supabase/functions/`, puis régénérer.

Pour chaque fichier : Supabase → Edge Functions → Deploy a new function → Via Editor →
nom = nom du fichier sans « .ts » → coller le contenu → Deploy.
Pour `paypal-webhook` uniquement : désactiver « Verify JWT » (PayPal appelle cette fonction sans jeton ; sa signature est vérifiée dans le code).

Secrets requis (Edge Functions → Secrets) : PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENV=sandbox
(et plus tard PAYPAL_WEBHOOK_ID pour les remboursements). SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.
