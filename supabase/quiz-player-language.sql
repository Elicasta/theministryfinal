-- Preserve per-player quiz language without changing existing player/session identity.
alter table public.game_players
  add column if not exists preferred_language text not null default 'en'
  check (preferred_language in ('en','es'));
comment on column public.game_players.preferred_language
  is 'Per-room quiz display preference (English KJV or Spanish RVR1960); scores remain canonical.';
