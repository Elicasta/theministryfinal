-- Backward-compatible poll migration entrypoint.
-- Prefer running supabase/schema.sql now. It includes polls, votes, questions, sync_state, attendees, and responses.
\i ./schema.sql
