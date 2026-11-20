-- Phase 6 : sauvegarde dans le cloud et classements.
-- Chaque joueur (compte anonyme ou e-mail) a UNE sauvegarde ; il ne peut lire et écrire que la sienne.
create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data text not null check (length(data) < 3000000),
  saved_at bigint not null,
  schema_version integer not null,
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;
create policy "Lire sa sauvegarde" on public.saves for select using ((select auth.uid()) = user_id);
create policy "Créer sa sauvegarde" on public.saves for insert with check ((select auth.uid()) = user_id);
create policy "Mettre à jour sa sauvegarde" on public.saves for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on table public.saves to authenticated;

-- Classement public, calculé par le serveur à partir de la sauvegarde (personne ne peut y écrire directement).
create table if not exists public.leaderboard (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  dex integer not null default 0,
  tower integer not null default 0,
  wins integer not null default 0,
  bosses integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.leaderboard enable row level security;
create policy "Classement public" on public.leaderboard for select using (true);
grant select on table public.leaderboard to anon, authenticated;

create or replace function public.refresh_leaderboard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  s jsonb;
begin
  begin
    s := (new.data::jsonb) -> 'state';
  exception when others then
    return new; -- sauvegarde illisible : on ne touche pas au classement
  end;
  insert into public.leaderboard (user_id, name, dex, tower, wins, bosses, updated_at)
  values (
    new.user_id,
    left(coalesce(nullif(trim(s #>> '{player,name}'), ''), 'Gardien'), 24),
    coalesce((select count(*) from jsonb_each(coalesce(s -> 'dex', '{}'::jsonb)) e where e.value ->> 'firstObtainedAt' is not null), 0),
    least(coalesce((s #>> '{combat,towerFloor}')::int, 0), 10000),
    least(coalesce((s #>> '{stats,battlesWon}')::int, 0), 1000000),
    least(coalesce((s #>> '{stats,bossesDefeated}')::int, 0), 1000000),
    now()
  )
  on conflict (user_id) do update set name = excluded.name, dex = excluded.dex, tower = excluded.tower,
    wins = excluded.wins, bosses = excluded.bosses, updated_at = now();
  return new;
end;
$$;
revoke execute on function public.refresh_leaderboard() from public, anon, authenticated;

create trigger saves_refresh_leaderboard after insert or update on public.saves
  for each row execute function public.refresh_leaderboard();
