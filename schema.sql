-- The Ministry app Supabase schema
-- Run this in Supabase SQL Editor.
-- This creates the tables needed for live questions, polls, poll votes, attendee registration, workbook responses, and sync state.

create extension if not exists pgcrypto;

-- 01. Attendee registration / check-in
create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  email_hash text,
  session_id text,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists attendees_email_idx on public.attendees(email);
create index if not exists attendees_email_hash_idx on public.attendees(email_hash);
create index if not exists attendees_session_id_idx on public.attendees(session_id);
create index if not exists attendees_checked_in_at_idx on public.attendees(checked_in_at desc);

alter table public.attendees add column if not exists source text default 'session_access';
alter table public.attendees add column if not exists series_slug text default 'the-ministry';
alter table public.attendees add column if not exists lesson_slug text default 'lesson-1';
create index if not exists attendees_series_lesson_idx on public.attendees(series_slug, lesson_slug, created_at desc);


-- 02. Reflection / workbook responses
create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  session integer not null default 1,
  category text,
  response text not null,
  anonymous boolean not null default false,
  attendee_id uuid,
  session_id text,
  email_hash text,
  created_at timestamptz not null default now()
);

create index if not exists responses_session_idx on public.responses(session);
create index if not exists responses_created_at_idx on public.responses(created_at desc);

-- 03. Live sync state
create table if not exists public.sync_state (
  id integer primary key default 1,
  payload text not null default '{}',
  updated_at timestamptz not null default now(),
  constraint sync_state_singleton check (id = 1)
);

insert into public.sync_state (id, payload)
values (1, '{}')
on conflict (id) do nothing;

alter table public.sync_state replica identity full;

-- 04. Live audience questions
create table if not exists public.lesson_questions (
  id uuid primary key default gen_random_uuid(),
  question_id text unique,
  series_slug text not null default 'the-ministry',
  lesson_slug text not null default 'lesson-1',
  name text,
  text text not null,
  status text not null default 'new', -- new, answered, hidden, archived
  anonymous boolean not null default true,
  attendee_id uuid,
  session_id text,
  email_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists lesson_questions_series_lesson_idx on public.lesson_questions(series_slug, lesson_slug);
create index if not exists lesson_questions_created_at_idx on public.lesson_questions(created_at desc);
create index if not exists lesson_questions_status_idx on public.lesson_questions(status);

create or replace view public.questions as
select * from public.lesson_questions;

-- 05. Poll definitions/archive
create table if not exists public.lesson_polls (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null unique,
  series_slug text not null default 'the-ministry',
  lesson_slug text not null default 'lesson-1',
  question text not null,
  poll_type text not null default 'choice', -- yesno, choice
  options jsonb not null default '[]'::jsonb,
  save_anonymous boolean not null default true,
  status text not null default 'archived', -- live, archived, killed, closed, replaced
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists lesson_polls_series_lesson_idx on public.lesson_polls(series_slug, lesson_slug);
create index if not exists lesson_polls_created_at_idx on public.lesson_polls(created_at desc);
create index if not exists lesson_polls_status_idx on public.lesson_polls(status);

-- 06. Poll votes
create table if not exists public.lesson_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null references public.lesson_polls(poll_id) on delete cascade,
  answer text not null,
  anonymous boolean not null default true,
  display_name text,
  client_vote_id text unique,
  attendee_id uuid,
  session_id text,
  email_hash text,
  created_at timestamptz not null default now()
);

create index if not exists lesson_poll_votes_poll_id_idx on public.lesson_poll_votes(poll_id);
create index if not exists lesson_poll_votes_session_idx on public.lesson_poll_votes(session_id);
create index if not exists lesson_poll_votes_email_hash_idx on public.lesson_poll_votes(email_hash);
create index if not exists lesson_poll_votes_created_at_idx on public.lesson_poll_votes(created_at desc);

-- 07. Updated-at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists attendees_set_updated_at on public.attendees;
create trigger attendees_set_updated_at
before update on public.attendees
for each row execute function public.set_updated_at();

drop trigger if exists sync_state_set_updated_at on public.sync_state;
create trigger sync_state_set_updated_at
before update on public.sync_state
for each row execute function public.set_updated_at();

drop trigger if exists lesson_questions_set_updated_at on public.lesson_questions;
create trigger lesson_questions_set_updated_at
before update on public.lesson_questions
for each row execute function public.set_updated_at();

drop trigger if exists lesson_polls_set_updated_at on public.lesson_polls;
create trigger lesson_polls_set_updated_at
before update on public.lesson_polls
for each row execute function public.set_updated_at();

-- 08. RLS policies for current public event mode
-- This is event-mode permissive. Tighten this later when admin login exists.
alter table public.attendees enable row level security;
alter table public.responses enable row level security;
alter table public.sync_state enable row level security;
alter table public.lesson_questions enable row level security;
alter table public.lesson_polls enable row level security;
alter table public.lesson_poll_votes enable row level security;

drop policy if exists "event_attendees_insert" on public.attendees;
create policy "event_attendees_insert" on public.attendees for insert to anon with check (true);
drop policy if exists "event_attendees_read" on public.attendees;
create policy "event_attendees_read" on public.attendees for select to anon using (true);

drop policy if exists "event_responses_insert" on public.responses;
create policy "event_responses_insert" on public.responses for insert to anon with check (true);
drop policy if exists "event_responses_read" on public.responses;
create policy "event_responses_read" on public.responses for select to anon using (true);

drop policy if exists "event_sync_read" on public.sync_state;
create policy "event_sync_read" on public.sync_state for select to anon using (true);
drop policy if exists "event_sync_write" on public.sync_state;
create policy "event_sync_write" on public.sync_state for all to anon using (true) with check (true);

drop policy if exists "event_questions_insert" on public.lesson_questions;
create policy "event_questions_insert" on public.lesson_questions for insert to anon with check (true);
drop policy if exists "event_questions_read" on public.lesson_questions;
create policy "event_questions_read" on public.lesson_questions for select to anon using (true);
drop policy if exists "event_questions_update" on public.lesson_questions;
create policy "event_questions_update" on public.lesson_questions for update to anon using (true) with check (true);

drop policy if exists "event_polls_write" on public.lesson_polls;
create policy "event_polls_write" on public.lesson_polls for all to anon using (true) with check (true);
drop policy if exists "event_polls_read" on public.lesson_polls;
create policy "event_polls_read" on public.lesson_polls for select to anon using (true);

drop policy if exists "event_poll_votes_insert" on public.lesson_poll_votes;
create policy "event_poll_votes_insert" on public.lesson_poll_votes for insert to anon with check (true);
drop policy if exists "event_poll_votes_read" on public.lesson_poll_votes;
create policy "event_poll_votes_read" on public.lesson_poll_votes for select to anon using (true);

-- 09. Realtime publications
-- If any command complains that the table is already in the publication, it is safe to ignore.
do $$
begin
  begin alter publication supabase_realtime add table public.sync_state; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.lesson_questions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.lesson_polls; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.lesson_poll_votes; exception when duplicate_object then null; end;
end $$;


-- v36 Online Viewer + Live Stream Config
-- Run this after the base schema if you want /online to remember the YouTube scheduled live source for new viewers.

create table if not exists public.live_stream_config (
  id text primary key default 'default',
  series_slug text not null default 'the-ministry',
  lesson_slug text not null default 'lesson-1',
  status text not null default 'starting-soon', -- offline, starting-soon, live, ended
  provider text not null default 'youtube',
  embed_url text,
  title text not null default 'The Ministry Live',
  service_label text not null default 'Sunday Service · Online Portal',
  sync_delay_seconds integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint live_stream_config_singleton check (id = 'default')
);

insert into public.live_stream_config (id)
values ('default')
on conflict (id) do nothing;

alter table public.live_stream_config enable row level security;

drop policy if exists "event_live_stream_read" on public.live_stream_config;
create policy "event_live_stream_read" on public.live_stream_config
for select to anon using (true);

drop policy if exists "event_live_stream_write" on public.live_stream_config;
create policy "event_live_stream_write" on public.live_stream_config
for all to anon using (true) with check (true);

drop trigger if exists live_stream_config_set_updated_at on public.live_stream_config;
create trigger live_stream_config_set_updated_at
before update on public.live_stream_config
for each row execute function public.set_updated_at();

do $$
begin
  begin alter publication supabase_realtime add table public.live_stream_config; exception when duplicate_object then null; end;
end $$;
-- v37 Stream Config Everywhere
-- Run after the base schema/v36 patch.
-- This keeps the current stream saved globally and also remembers it per lesson.

create table if not exists public.live_stream_config (
  id text primary key default 'default',
  series_slug text not null default 'the-ministry',
  lesson_slug text not null default 'lesson-1',
  status text not null default 'starting-soon', -- offline, starting-soon, live, ended
  provider text not null default 'youtube',
  embed_url text,
  title text not null default 'The Ministry Live',
  service_label text not null default 'Sunday Service · Online Portal',
  sync_delay_seconds integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- v36 only allowed id = 'default'. v37 allows one global row plus lesson rows like the-ministry::lesson-2.
alter table public.live_stream_config drop constraint if exists live_stream_config_singleton;

alter table public.live_stream_config add column if not exists series_slug text not null default 'the-ministry';
alter table public.live_stream_config add column if not exists lesson_slug text not null default 'lesson-1';
alter table public.live_stream_config add column if not exists status text not null default 'starting-soon';
alter table public.live_stream_config add column if not exists provider text not null default 'youtube';
alter table public.live_stream_config add column if not exists embed_url text;
alter table public.live_stream_config add column if not exists title text not null default 'The Ministry Live';
alter table public.live_stream_config add column if not exists service_label text not null default 'Sunday Service · Online Portal';
alter table public.live_stream_config add column if not exists sync_delay_seconds integer not null default 10;
alter table public.live_stream_config add column if not exists created_at timestamptz not null default now();
alter table public.live_stream_config add column if not exists updated_at timestamptz not null default now();

insert into public.live_stream_config (id, series_slug, lesson_slug)
values ('default', 'the-ministry', 'lesson-1')
on conflict (id) do nothing;

create index if not exists live_stream_config_series_lesson_idx
on public.live_stream_config(series_slug, lesson_slug, updated_at desc);

alter table public.live_stream_config enable row level security;

drop policy if exists "event_live_stream_read" on public.live_stream_config;
create policy "event_live_stream_read" on public.live_stream_config
for select to anon using (true);

drop policy if exists "event_live_stream_write" on public.live_stream_config;
create policy "event_live_stream_write" on public.live_stream_config
for all to anon using (true) with check (true);

drop trigger if exists live_stream_config_set_updated_at on public.live_stream_config;
create trigger live_stream_config_set_updated_at
before update on public.live_stream_config
for each row execute function public.set_updated_at();

do $$
begin
  begin alter publication supabase_realtime add table public.live_stream_config; exception when duplicate_object then null; end;
end $$;
