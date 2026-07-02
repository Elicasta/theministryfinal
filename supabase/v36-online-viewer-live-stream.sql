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
