-- Achats en argent réel (PayPal). Seules les fonctions serveur (clé « service ») écrivent dans cette table ;
-- un joueur ne peut que lire SES propres achats (pour restaurer ses achats sur un autre appareil).
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id text not null unique,
  capture_id text unique,
  product_id text not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null,
  provider text not null default 'paypal',
  status text not null check (status in ('created', 'captured', 'refunded', 'failed')),
  raw jsonb,
  created_at timestamptz not null default now(),
  captured_at timestamptz
);

create index if not exists purchases_user_idx on public.purchases (user_id);

alter table public.purchases enable row level security;

drop policy if exists "Lecture de ses propres achats" on public.purchases;
create policy "Lecture de ses propres achats" on public.purchases
  for select using (auth.uid() = user_id);
-- Aucune politique INSERT / UPDATE / DELETE : impossible d'écrire depuis l'application.
