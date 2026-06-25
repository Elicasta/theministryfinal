-- v33 attendee identity patch
-- Run this in Supabase SQL Editor after v32 if attendee/email/poll identity columns are missing.
-- Safe to run more than once.

create extension if not exists pgcrypto;

-- Attendee identity
alter table public.attendees add column if not exists email text;
alter table public.attendees add column if not exists email_hash text;
alter table public.attendees add column if not exists session_id text;
alter table public.attendees add column if not exists source text default 'session_access';
alter table public.attendees add column if not exists series_slug text default 'the-ministry';
alter table public.attendees add column if not exists lesson_slug text default 'lesson-1';
alter table public.attendees add column if not exists checked_in_at timestamptz not null default now();
alter table public.attendees add column if not exists created_at timestamptz not null default now();
alter table public.attendees add column if not exists updated_at timestamptz not null default now();

create index if not exists attendees_email_idx on public.attendees(email);
create index if not exists attendees_email_hash_idx on public.attendees(email_hash);
create index if not exists attendees_session_id_idx on public.attendees(session_id);
create index if not exists attendees_series_lesson_idx on public.attendees(series_slug, lesson_slug, created_at desc);

-- Add unique identity per series/lesson/email hash only if it does not exist.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'attendees_series_lesson_email_hash_key') then
    begin
      alter table public.attendees
      add constraint attendees_series_lesson_email_hash_key unique (series_slug, lesson_slug, email_hash);
    exception when duplicate_object then null;
    end;
  end if;
end $$;

-- Questions identity
alter table public.lesson_questions add column if not exists attendee_id uuid;
alter table public.lesson_questions add column if not exists session_id text;
alter table public.lesson_questions add column if not exists email_hash text;
create index if not exists lesson_questions_session_idx on public.lesson_questions(session_id);
create index if not exists lesson_questions_email_hash_idx on public.lesson_questions(email_hash);

-- Poll votes identity
alter table public.lesson_poll_votes add column if not exists attendee_id uuid;
alter table public.lesson_poll_votes add column if not exists session_id text;
alter table public.lesson_poll_votes add column if not exists email_hash text;
alter table public.lesson_poll_votes add column if not exists client_vote_id text;
create index if not exists lesson_poll_votes_session_idx on public.lesson_poll_votes(session_id);
create index if not exists lesson_poll_votes_email_hash_idx on public.lesson_poll_votes(email_hash);
create index if not exists lesson_poll_votes_client_vote_id_idx on public.lesson_poll_votes(client_vote_id);

-- Prevent one session from creating unlimited votes for one poll.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_poll_votes_poll_session_key') then
    begin
      alter table public.lesson_poll_votes
      add constraint lesson_poll_votes_poll_session_key unique (poll_id, session_id);
    exception when duplicate_object then null;
    end;
  end if;
end $$;

-- Optional email-level uniqueness when email_hash is available.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_poll_votes_poll_email_hash_key') then
    begin
      alter table public.lesson_poll_votes
      add constraint lesson_poll_votes_poll_email_hash_key unique (poll_id, email_hash);
    exception when duplicate_object then null;
    end;
  end if;
end $$;

-- Responses identity
alter table public.responses add column if not exists attendee_id uuid;
alter table public.responses add column if not exists session_id text;
alter table public.responses add column if not exists email_hash text;

-- RLS policies stay event-mode permissive for now.
alter table public.attendees enable row level security;
alter table public.lesson_questions enable row level security;
alter table public.lesson_poll_votes enable row level security;

drop policy if exists "event_attendees_insert" on public.attendees;
create policy "event_attendees_insert" on public.attendees for insert to anon with check (true);
drop policy if exists "event_attendees_read" on public.attendees;
create policy "event_attendees_read" on public.attendees for select to anon using (true);
drop policy if exists "event_attendees_update" on public.attendees;
create policy "event_attendees_update" on public.attendees for update to anon using (true) with check (true);

do $$
begin
  begin alter publication supabase_realtime add table public.attendees; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.lesson_questions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.lesson_poll_votes; exception when duplicate_object then null; end;
end $$;
