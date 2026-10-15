-- Ministry Quiz & Review: durable per-member historical answers for future Lumaneer profiles.
-- Do not cascade from transient game_sessions/game_players: history must survive room cleanup.
create table if not exists public.quiz_history (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null,
  game_code text not null,
  player_id text not null,
  display_name text not null,
  participation text not null check (participation in ('solo','team')),
  entry_key text not null,
  team_id text,
  team_name text,
  captain_player_id text,
  pack_id text not null,
  scripture text,
  correct_count integer not null default 0 check (correct_count >= 0),
  question_count integer not null default 0 check (question_count >= 0),
  percent integer not null default 0 check (percent between 0 and 100),
  answers jsonb not null default '[]'::jsonb,
  submitted_at timestamptz,
  finalized_at timestamptz not null default now(),
  -- Populated only by a future verified account-binding service.
  verified_profile_subject text,
  verified_profile_issuer text,
  identity_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(game_id, player_id),
  constraint quiz_history_account_verified check (
    (verified_profile_subject is null and verified_profile_issuer is null and identity_verified_at is null)
    or (verified_profile_subject is not null and verified_profile_issuer is not null and identity_verified_at is not null)
  )
);
create index if not exists quiz_history_player_idx on public.quiz_history(game_id, player_id);
create index if not exists quiz_history_profile_idx on public.quiz_history(verified_profile_issuer, verified_profile_subject, finalized_at desc)
  where verified_profile_subject is not null;
create index if not exists quiz_history_code_idx on public.quiz_history(game_code, finalized_at desc);
alter table public.quiz_history enable row level security;
-- No browser-facing policies. Service role only; APIs authorize every history read.
comment on table public.quiz_history is 'Durable per-person solo and team question history. Lumaneer verified identity linking is reserved, not inferred from names or unverified emails.';
