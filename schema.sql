-- The Ministry app core Supabase schema.
-- Use this for a simple public event deployment with anonymous attendee interaction.
-- For production/public multi-church use, add auth/session-scoped RLS before opening it broadly.

create extension if not exists pgcrypto;

-- 01. Attendee registration / check-in
create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists attendees_email_idx on public.attendees(email);
create index if not exists attendees_checked_in_at_idx on public.attendees(checked_in_at desc);

-- 02. Reflection / workbook responses
create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  session integer not null default 1,
  category text,
  response text not null,
  anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists responses_session_idx on public.responses(session);
create index if not exists responses_created_at_idx on public.responses(created_at desc);

-- 03. Live sync state used by the projector/controller screens.
-- The frontend currently upserts id = 1 and stores the latest command payload.
create table if not exists public.sync_state (
  id integer primary key default 1,
  payload text not null default '{}',
  updated_at timestamptz not null default now(),
  constraint sync_state_singleton check (id = 1)
);

insert into public.sync_state (id, payload)
values (1, '{}')
on conflict (id) do nothing;

-- Helpful for realtime updates.
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists lesson_questions_series_lesson_idx on public.lesson_questions(series_slug, lesson_slug);
create index if not exists lesson_questions_created_at_idx on public.lesson_questions(created_at desc);
create index if not exists lesson_questions_status_idx on public.lesson_questions(status);

-- Optional alias view if you prefer the shorter table name in Supabase UI.
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
  status text not null default 'archived', -- live, archived, killed, replaced
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
  created_at timestamptz not null default now()
);

create index if not exists lesson_poll_votes_poll_id_idx on public.lesson_poll_votes(poll_id);
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

-- 08. Realtime publications
-- If this errors because supabase_realtime already contains the table, it is safe to ignore.
do $$
begin
  begin
    alter publication supabase_realtime add table public.sync_state;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.lesson_questions;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.lesson_polls;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.lesson_poll_votes;
  exception when duplicate_object then null;
  end;
end $$;

-- 09. RLS note
-- Current event-mode setup can stay unrestricted if you are using anon inserts for a live event.
-- Before turning this into a public product, enable RLS and add session/auth-scoped policies.
