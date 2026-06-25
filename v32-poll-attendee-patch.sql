-- v32 poll + attendee compatibility patch
-- Run this once in Supabase SQL Editor if polls/attendees are not saving.

create extension if not exists pgcrypto;

-- Attendees compatibility
create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  checked_in_at timestamptz default now(),
  created_at timestamptz not null default now()
);

alter table public.attendees add column if not exists source text default 'session_access';
alter table public.attendees add column if not exists series_slug text default 'the-ministry';
alter table public.attendees add column if not exists lesson_slug text default 'lesson-1';
alter table public.attendees add column if not exists updated_at timestamptz not null default now();

-- Poll compatibility
create table if not exists public.lesson_polls (
  id uuid primary key default gen_random_uuid(),
  poll_id text,
  series_slug text not null default 'the-ministry',
  lesson_slug text not null default 'lesson-1',
  question text,
  created_at timestamptz not null default now()
);

alter table public.lesson_polls add column if not exists poll_type text not null default 'choice';
alter table public.lesson_polls add column if not exists options jsonb not null default '[]'::jsonb;
alter table public.lesson_polls add column if not exists save_anonymous boolean not null default true;
alter table public.lesson_polls add column if not exists status text not null default 'archived';
alter table public.lesson_polls add column if not exists updated_at timestamptz not null default now();
alter table public.lesson_polls add column if not exists archived_at timestamptz;

-- Backfill missing poll ids/questions if any manual rows exist
update public.lesson_polls set poll_id = coalesce(poll_id, 'poll_' || id::text) where poll_id is null;
update public.lesson_polls set question = coalesce(question, 'Untitled poll') where question is null;

-- Add unique poll_id when possible. If duplicates exist, keep the newest and suffix older duplicates.
do $$
begin
  with dupes as (
    select id, poll_id, row_number() over (partition by poll_id order by created_at desc, id desc) rn
    from public.lesson_polls
    where poll_id is not null
  )
  update public.lesson_polls p
  set poll_id = p.poll_id || '_' || p.id::text
  from dupes d
  where p.id = d.id and d.rn > 1;

  begin
    alter table public.lesson_polls add constraint lesson_polls_poll_id_key unique (poll_id);
  exception when duplicate_object then null;
  end;
end $$;

create table if not exists public.lesson_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id text,
  answer text,
  anonymous boolean not null default true,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.lesson_poll_votes add column if not exists client_vote_id text;
update public.lesson_poll_votes set client_vote_id = coalesce(client_vote_id, 'vote_' || id::text) where client_vote_id is null;

-- Add unique client_vote_id when possible.
do $$
begin
  with dupes as (
    select id, client_vote_id, row_number() over (partition by client_vote_id order by created_at desc, id desc) rn
    from public.lesson_poll_votes
    where client_vote_id is not null
  )
  update public.lesson_poll_votes v
  set client_vote_id = v.client_vote_id || '_' || v.id::text
  from dupes d
  where v.id = d.id and d.rn > 1;

  begin
    alter table public.lesson_poll_votes add constraint lesson_poll_votes_client_vote_id_key unique (client_vote_id);
  exception when duplicate_object then null;
  end;
end $$;

create index if not exists attendees_series_lesson_idx on public.attendees(series_slug, lesson_slug, created_at desc);
create index if not exists lesson_polls_series_lesson_idx on public.lesson_polls(series_slug, lesson_slug, created_at desc);
create index if not exists lesson_polls_status_idx on public.lesson_polls(status);
create index if not exists lesson_poll_votes_poll_id_idx on public.lesson_poll_votes(poll_id);

alter table public.attendees enable row level security;
alter table public.lesson_polls enable row level security;
alter table public.lesson_poll_votes enable row level security;

drop policy if exists "event_attendees_insert" on public.attendees;
create policy "event_attendees_insert" on public.attendees for insert to anon with check (true);
drop policy if exists "event_attendees_read" on public.attendees;
create policy "event_attendees_read" on public.attendees for select to anon using (true);

drop policy if exists "event_polls_write" on public.lesson_polls;
create policy "event_polls_write" on public.lesson_polls for all to anon using (true) with check (true);
drop policy if exists "event_polls_read" on public.lesson_polls;
create policy "event_polls_read" on public.lesson_polls for select to anon using (true);

drop policy if exists "event_poll_votes_insert" on public.lesson_poll_votes;
create policy "event_poll_votes_insert" on public.lesson_poll_votes for insert to anon with check (true);
drop policy if exists "event_poll_votes_read" on public.lesson_poll_votes;
create policy "event_poll_votes_read" on public.lesson_poll_votes for select to anon using (true);

do $$
begin
  begin alter publication supabase_realtime add table public.lesson_polls; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.lesson_poll_votes; exception when duplicate_object then null; end;
end $$;
