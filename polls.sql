-- Optional Supabase tables for future persistent poll storage.
-- The current static template archives polls locally in the presenter browser.
-- Use this only when wiring server-side persistence.

create table if not exists public.lesson_polls (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null unique,
  series_slug text not null default 'the-ministry',
  lesson_slug text not null default 'lesson-1',
  question text not null,
  poll_type text not null default 'choice',
  options jsonb not null default '[]'::jsonb,
  save_anonymous boolean not null default true,
  status text not null default 'archived',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null references public.lesson_polls(poll_id) on delete cascade,
  answer text not null,
  anonymous boolean not null default true,
  display_name text,
  client_vote_id text unique,
  created_at timestamptz not null default now()
);

create index if not exists lesson_polls_series_lesson_idx on public.lesson_polls(series_slug, lesson_slug);
create index if not exists lesson_poll_votes_poll_id_idx on public.lesson_poll_votes(poll_id);

-- Suggested RLS when this becomes public:
-- alter table public.lesson_polls enable row level security;
-- alter table public.lesson_poll_votes enable row level security;
-- Then add insert/select policies scoped to your app/session model.
