# Lumaneer migration contract — The Ministry Quiz & Review

## Durable source of record
`public.quiz_history` in the existing The Ministry Supabase project contains one row per actual participant per **submitted** quiz room. It survives game room/player cleanup because there is no foreign key with cascading deletion.

Each record contains: `game_id`, `game_code`, `player_id` (authenticated room player identifier), `display_name`, `participation` (solo/team), `entry_key`, team ID/name, captain ID, pack ID, Scripture range, correct/total/percentage, submission/final timestamps, and all per-question `answers`.

Team answers intentionally appear in the history of **each registered member** of the participating team. Each answer records the true submitter in `submittedBy`. One-phone teams can only archive people who actually registered as players; do not invent participant identities.

### Account linking
An existing game player cookie authenticates the room player; it does not prove ownership of an email or a future Lumaneer account. Name matching, an unverified check-in email, and browser local storage are insufficient to join historical rows to an account.

When Lumaneer launches:
1. Authenticate a user and verify email ownership (or authenticate through a trusted provider).
2. On the same device/browser, have the person authenticate their existing quiz participation with the room player credential, or present another secure claim method. For multiple old room codes, each must be independently proven. Captains cannot claim their teammates' records.
3. Server-side atomically populate `verified_profile_subject`, `verified_profile_issuer`, `identity_verified_at` **only** after that proof. Never accept those three columns directly from a game client.
4. Expose an authenticated Lumaneer profile query filtered by verified issuer and subject. Group attempts remain marked as shared scores; do not present them as individually answered work.
5. Support data correction, unlinking and deletion workflows before public launch. Quiz answers are education records and must not be openly indexed.

## Runtime
- `lib/quiz-history.js` materializes rows at quiz finalization and retries idempotently using `UNIQUE(game_id,player_id)`.
- `POST /api/game/quiz-history` verifies the game player's session and only returns **their current room record after answers have closed**.
- `POST /api/game/quiz-action` with host-authenticated `ARCHIVE_HISTORY` retries if history storage was temporarily down.
- The historic migration `supabase/quiz-history-backfill.sql` imports previously finalized single-entry rooms without guessing anyone's identity.

## Future improvements
A dedicated optional account/profile setup for participants is needed before persistent cross-device history can be claimed. Consider an opt-in guest-profile flow with explicit verification and a clear choice when several people share one family device.
