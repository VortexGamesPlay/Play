-- Les projets Supabase récents n'accordent plus automatiquement les droits aux rôles de l'API.
-- Le serveur (clé « service ») doit pouvoir écrire les achats ; un joueur connecté peut lire les siens (RLS).
grant select, insert, update on table public.purchases to service_role;
grant select on table public.purchases to authenticated;
