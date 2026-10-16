-- Run once in the Supabase SQL Editor for the Griffons shared game state.
-- The first visitor to open the configured site seeds the single row from
-- their locally saved state (or the built-in defaults if they have no save).
create table if not exists public.griffons_game_state (
  id text primary key check (id = 'main'),
  state jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.griffons_game_state enable row level security;
revoke all on table public.griffons_game_state from anon, authenticated;
grant select, insert, update on table public.griffons_game_state to anon, authenticated;

drop policy if exists "Everyone can read Griffons state" on public.griffons_game_state;
drop policy if exists "Everyone can start Griffons state" on public.griffons_game_state;
drop policy if exists "Everyone can edit Griffons state" on public.griffons_game_state;

create policy "Everyone can read Griffons state"
on public.griffons_game_state for select to anon, authenticated
using (id = 'main');

create policy "Everyone can start Griffons state"
on public.griffons_game_state for insert to anon, authenticated
with check (id = 'main');

create policy "Everyone can edit Griffons state"
on public.griffons_game_state for update to anon, authenticated
using (id = 'main') with check (id = 'main');
