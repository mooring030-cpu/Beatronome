-- Beatronome v0.8 Cloud Sync
-- Run once in Supabase > SQL Editor for the project used by Beatronome.

create table if not exists public.beatronome_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  presets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.beatronome_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists beatronome_sync_updated_at on public.beatronome_sync;
create trigger beatronome_sync_updated_at
before update on public.beatronome_sync
for each row execute function public.beatronome_set_updated_at();

alter table public.beatronome_sync enable row level security;

drop policy if exists "beatronome_select_own" on public.beatronome_sync;
create policy "beatronome_select_own" on public.beatronome_sync
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "beatronome_insert_own" on public.beatronome_sync;
create policy "beatronome_insert_own" on public.beatronome_sync
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "beatronome_update_own" on public.beatronome_sync;
create policy "beatronome_update_own" on public.beatronome_sync
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "beatronome_delete_own" on public.beatronome_sync;
create policy "beatronome_delete_own" on public.beatronome_sync
for delete to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.beatronome_sync to authenticated;
