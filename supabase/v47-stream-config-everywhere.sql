-- v47 Stream Config Everywhere
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

-- v36 only allowed id = 'default'. v47 allows one global row plus lesson rows like the-ministry::lesson-2.
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
