-- v59 Audience Notes
-- Run after the base schema. Creates per-attendee saved notes for the online audience notes section.

create table if not exists public.audience_notes (
  id uuid primary key default gen_random_uuid(),
  series_slug text not null default 'the-ministry',
  lesson_slug text not null default 'lesson-4',
  slide_index integer not null default 0,
  slide_title text,
  notes text not null default '',
  name text,
  attendee_id uuid,
  session_id text,
  email_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists audience_notes_series_lesson_idx on public.audience_notes(series_slug, lesson_slug, updated_at desc);
create index if not exists audience_notes_attendee_idx on public.audience_notes(attendee_id);
create index if not exists audience_notes_session_idx on public.audience_notes(session_id);
create index if not exists audience_notes_email_hash_idx on public.audience_notes(email_hash);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'audience_notes_attendee_slide_key') then
    begin
      alter table public.audience_notes add constraint audience_notes_attendee_slide_key unique (series_slug, lesson_slug, slide_index, attendee_id);
    exception when duplicate_object then null;
    end;
  end if;
end $$;

drop trigger if exists audience_notes_set_updated_at on public.audience_notes;
create trigger audience_notes_set_updated_at
before update on public.audience_notes
for each row execute function public.set_updated_at();

alter table public.audience_notes enable row level security;

drop policy if exists "event_audience_notes_insert" on public.audience_notes;
create policy "event_audience_notes_insert" on public.audience_notes for insert to anon with check (true);

drop policy if exists "event_audience_notes_read" on public.audience_notes;
create policy "event_audience_notes_read" on public.audience_notes for select to anon using (true);

drop policy if exists "event_audience_notes_update" on public.audience_notes;
create policy "event_audience_notes_update" on public.audience_notes for update to anon using (true) with check (true);
