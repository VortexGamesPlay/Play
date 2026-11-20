-- Phase 6 : amis, visites de sanctuaires et cadeaux quotidiens.
-- Tout passe par des fonctions serveur qui vérifient l'amitié : personne ne lit la sauvegarde d'un autre joueur.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  friend_code text not null unique,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Lire son profil" on public.profiles for select using ((select auth.uid()) = user_id);
grant select on table public.profiles to authenticated;

create table if not exists public.friendships (
  user_id uuid not null references auth.users (id) on delete cascade,
  friend_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
alter table public.friendships enable row level security;
create policy "Voir ses amitiés" on public.friendships for select using ((select auth.uid()) = user_id);
grant select on table public.friendships to authenticated;

create table if not exists public.gifts (
  sender uuid not null references auth.users (id) on delete cascade,
  recipient uuid not null references auth.users (id) on delete cascade,
  day date not null default ((now() at time zone 'utc')::date),
  claimed boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (sender, recipient, day)
);
alter table public.gifts enable row level security; -- aucun accès direct : uniquement via les fonctions

-- Mon code ami (créé au premier appel). Alphabet sans caractères ambigus (0/O, 1/I).
create or replace function public.my_friend_code() returns text
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); c text; tries int := 0;
begin
  if me is null then raise exception 'Connexion requise.'; end if;
  select friend_code into c from public.profiles where user_id = me;
  if c is not null then return c; end if;
  loop
    tries := tries + 1;
    c := (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 8));
    begin
      insert into public.profiles (user_id, friend_code) values (me, c);
      return c;
    exception when unique_violation then
      if exists (select 1 from public.profiles where user_id = me) then return (select friend_code from public.profiles where user_id = me); end if;
      if tries > 10 then raise; end if;
    end;
  end loop;
end; $$;

create or replace function public.add_friend(code text) returns text
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); other uuid; n int;
begin
  if me is null then raise exception 'Connexion requise.'; end if;
  select user_id into other from public.profiles where friend_code = upper(trim(code));
  if other is null then raise exception 'Code ami introuvable.'; end if;
  if other = me then raise exception 'C''est ton propre code !'; end if;
  select count(*) into n from public.friendships where user_id = me;
  if n >= 50 then raise exception '50 amis au maximum.'; end if;
  insert into public.friendships (user_id, friend_id) values (me, other), (other, me) on conflict do nothing;
  return coalesce((select name from public.leaderboard where user_id = other), 'Gardien');
end; $$;

create or replace function public.remove_friend(friend uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.friendships where (user_id = auth.uid() and friend_id = friend) or (user_id = friend and friend_id = auth.uid());
$$;

create or replace function public.list_friends()
returns table (friend_id uuid, name text, dex int, tower int, wins int, last_seen timestamptz, gift_sent_today boolean, gift_waiting boolean)
language sql stable security definer set search_path = '' as $$
  select f.friend_id,
         coalesce(l.name, 'Gardien'), coalesce(l.dex, 0), coalesce(l.tower, 0), coalesce(l.wins, 0), l.updated_at,
         exists (select 1 from public.gifts g where g.sender = auth.uid() and g.recipient = f.friend_id and g.day = (now() at time zone 'utc')::date),
         exists (select 1 from public.gifts g where g.sender = f.friend_id and g.recipient = auth.uid() and not g.claimed)
  from public.friendships f
  left join public.leaderboard l on l.user_id = f.friend_id
  where f.user_id = auth.uid()
  order by l.updated_at desc nulls last;
$$;

create or replace function public.send_gift(friend uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); inserted int;
begin
  if not exists (select 1 from public.friendships where user_id = me and friend_id = friend) then raise exception 'Ce joueur n''est pas ton ami.'; end if;
  insert into public.gifts (sender, recipient) values (me, friend) on conflict do nothing;
  get diagnostics inserted = row_count;
  return inserted > 0;
end; $$;

-- Récupère les cadeaux reçus (au plus 20 d'un coup) et renvoie leur nombre.
create or replace function public.claim_gifts() returns integer
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with c as (
    select sender, recipient, day from public.gifts where recipient = auth.uid() and not claimed order by created_at limit 20
  )
  update public.gifts g set claimed = true from c where g.sender = c.sender and g.recipient = c.recipient and g.day = c.day;
  get diagnostics n = row_count;
  return n;
end; $$;

-- Visite : uniquement la partie publique du sanctuaire d'un ami.
create or replace function public.friend_sanctuary(friend uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare s jsonb;
begin
  if not exists (select 1 from public.friendships where user_id = auth.uid() and friend_id = friend) then raise exception 'Ce joueur n''est pas ton ami.'; end if;
  select (data::jsonb) -> 'state' into s from public.saves where user_id = friend;
  if s is null then return null; end if;
  return jsonb_build_object(
    'name', left(coalesce(s #>> '{player,name}', 'Gardien'), 24),
    'sanctuary', jsonb_build_object('theme', s #> '{sanctuary,theme}', 'buildings', s #> '{sanctuary,buildings}', 'decorations', s #> '{sanctuary,decorations}'),
    'creatures', coalesce((
      select jsonb_agg(x.c) from (
        select jsonb_build_object('uid', c ->> 'uid', 'speciesId', c ->> 'speciesId', 'mutations', coalesce(c -> 'mutations', '[]'::jsonb),
                                  'hue', coalesce((c #>> '{genes,hue}')::numeric, 0), 'nickname', c ->> 'nickname', 'level', (c ->> 'level')::int,
                                  'favorite', coalesce((c ->> 'favorite')::boolean, false)) as c
        from jsonb_array_elements(coalesce(s -> 'creatures', '[]'::jsonb)) c
        order by coalesce((c ->> 'favorite')::boolean, false) desc, (c ->> 'level')::int desc nulls last
        limit 12
      ) x), '[]'::jsonb),
    'dex', (select count(*) from jsonb_each(coalesce(s -> 'dex', '{}'::jsonb)) e where e.value ->> 'firstObtainedAt' is not null),
    'creatureCount', jsonb_array_length(coalesce(s -> 'creatures', '[]'::jsonb))
  );
end; $$;

revoke execute on function public.my_friend_code(), public.add_friend(text), public.remove_friend(uuid), public.list_friends(), public.send_gift(uuid), public.claim_gifts(), public.friend_sanctuary(uuid) from public, anon;
grant execute on function public.my_friend_code(), public.add_friend(text), public.remove_friend(uuid), public.list_friends(), public.send_gift(uuid), public.claim_gifts(), public.friend_sanctuary(uuid) to authenticated;
