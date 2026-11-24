-- Nanoscale Atlas: accounts and per-user progress.
--
-- Every table is owned row by row: row-level security lets a signed-in user
-- read and write only rows whose user_id is their own auth.uid(). The anon
-- role gets nothing. Rows go when the account is deleted (on delete cascade).
--
-- Sync model (src/sync/): the client is local-first and pushes changes with its
-- own updated_at. For the "latest write wins" tables a trigger drops an update
-- that is older than the stored row, so a stale device can never overwrite a
-- newer change. question_attempts is append-only: insert and select, no update
-- or delete policy. synced_at is set by the server on every write and is the
-- cursor clients pull by.

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  -- what the user chose when offered their browser's old local progress
  local_import text check (local_import in ('imported', 'declined')),
  local_import_at timestamptz
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, coalesce(new.email, ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------- latest-write-wins guard

create function public.lww_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- a client clock far in the future must not win forever
  new.updated_at := least(new.updated_at, now() + interval '5 minutes');
  new.synced_at := now();
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id then
      raise exception 'user_id cannot change';
    end if;
    if new.updated_at < old.updated_at then
      return null; -- the stored row is newer: keep it
    end if;
  end if;
  return new;
end $$;

-- ------------------------------------------------------- lesson progress
-- one row per lesson position (a step id, or review:<section>)

create table public.lesson_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  position text not null check (length(position) between 1 and 120),
  done boolean not null default false,
  -- the step's checks were answered after re-opening the step text
  peeked boolean not null default false,
  deleted boolean not null default false,
  updated_at timestamptz not null,
  synced_at timestamptz not null default now(),
  primary key (user_id, position)
);

-- ------------------------------------------- Revise scheduling (Leitner)

create table public.revise_cards (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id text not null check (length(question_id) between 1 and 120),
  box smallint not null check (box between 1 and 5),
  due timestamptz not null,
  seen integer not null default 0 check (seen >= 0),
  right_count integer not null default 0 check (right_count >= 0),
  deleted boolean not null default false,
  updated_at timestamptz not null,
  synced_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- ------------------------------------------------------ mastery per fact

create table public.fact_mastery (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fact_id text not null check (length(fact_id) between 1 and 120),
  score real not null check (score between 0 and 1),
  mastered boolean not null,
  deleted boolean not null default false,
  updated_at timestamptz not null,
  synced_at timestamptz not null default now(),
  primary key (user_id, fact_id)
);

-- ------------------------------------------------------------- settings
-- one row per setting, so two devices changing different settings both win

create table public.user_settings (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key text not null check (key in ('theme', 'speed', 'last_position', 'gowned')),
  value jsonb not null,
  deleted boolean not null default false,
  updated_at timestamptz not null,
  synced_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- ---------------------------------------------- question attempts (log)

create table public.question_attempts (
  -- made on the device, so a retried push never records an attempt twice
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id text not null check (length(question_id) between 1 and 120),
  result text not null check (result in ('right', 'wrong', 'peeked')),
  answered_at timestamptz not null,
  synced_at timestamptz not null default now()
);
create index question_attempts_user_synced on public.question_attempts (user_id, synced_at);

create function public.attempt_stamp() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.synced_at := now();
  return new;
end $$;
create trigger attempt_stamp before insert on public.question_attempts
  for each row execute function public.attempt_stamp();

do $$
declare t text;
begin
  foreach t in array array['lesson_progress', 'revise_cards', 'fact_mastery', 'user_settings'] loop
    execute format('create trigger lww_guard before insert or update on public.%I for each row execute function public.lww_guard()', t);
    execute format('create index %I on public.%I (user_id, synced_at)', t || '_user_synced', t);
  end loop;
end $$;

-- ------------------------------------------------------ row-level security

alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.revise_cards enable row level security;
alter table public.fact_mastery enable row level security;
alter table public.user_settings enable row level security;
alter table public.question_attempts enable row level security;

revoke all on public.profiles, public.lesson_progress, public.revise_cards, public.fact_mastery,
  public.user_settings, public.question_attempts from anon;
revoke all on public.profiles, public.lesson_progress, public.revise_cards, public.fact_mastery,
  public.user_settings, public.question_attempts from authenticated;

-- profiles: read your own; the only thing you may change is the import choice
grant select on public.profiles to authenticated;
grant update (local_import, local_import_at) on public.profiles to authenticated;
create policy "own profile: read" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "own profile: update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- the latest-write-wins tables: full access to your own rows
do $$
declare t text;
begin
  foreach t in array array['lesson_progress', 'revise_cards', 'fact_mastery', 'user_settings'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy "own rows: read" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "own rows: insert" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy "own rows: update" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy "own rows: delete" on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- attempts: append-only
grant select, insert on public.question_attempts to authenticated;
create policy "own attempts: read" on public.question_attempts for select to authenticated
  using (user_id = (select auth.uid()));
create policy "own attempts: append" on public.question_attempts for insert to authenticated
  with check (user_id = (select auth.uid()));

-- -------------------------------------------------- access-code rate limit
-- Failed access-code attempts per client (a keyed hash of the IP address, never
-- the address itself). Only the server (service role) can use these functions.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.access_failures (
  client text not null,
  at timestamptz not null default now()
);
create index access_failures_client_at on private.access_failures (client, at);

-- seconds until this client may try again (0: go ahead)
create function public.access_blocked_for(p_client text, p_max integer, p_window_seconds integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  n integer;
  oldest timestamptz;
begin
  delete from private.access_failures where at < now() - interval '1 day';
  select count(*), min(at) into n, oldest from private.access_failures
    where client = p_client and at > now() - make_interval(secs => p_window_seconds);
  if n < p_max then return 0; end if;
  return greatest(1, ceil(extract(epoch from (oldest + make_interval(secs => p_window_seconds) - now())))::integer);
end $$;

create function public.access_failed(p_client text) returns void
language sql security definer set search_path = '' as $$
  insert into private.access_failures (client) values (p_client);
$$;

create function public.access_succeeded(p_client text) returns void
language sql security definer set search_path = '' as $$
  delete from private.access_failures where client = p_client;
$$;

revoke execute on function public.access_blocked_for(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.access_failed(text) from public, anon, authenticated;
revoke execute on function public.access_succeeded(text) from public, anon, authenticated;
grant execute on function public.access_blocked_for(text, integer, integer) to service_role;
grant execute on function public.access_failed(text) to service_role;
grant execute on function public.access_succeeded(text) to service_role;

-- trigger helpers are not API endpoints
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.lww_guard() from public, anon, authenticated;
revoke execute on function public.attempt_stamp() from public, anon, authenticated;

-- ------------------------------------------------------ lecture slides
-- A private bucket with no storage policies: neither anon nor signed-in users
-- can list or read it directly. /api/slides (service role) checks the access
-- cookie and the session, then hands out signed URLs that expire in minutes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('slides', 'slides', false, 5242880, array['image/jpeg'])
on conflict (id) do update set public = false;
