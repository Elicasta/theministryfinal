# The Ministry v56

Deploy over v55. No SQL changes.

Test:
- `/scriptures`: bottom English/KJV secondary line should be smaller.
- `/mobile`: tap a regular Verse Bank verse. It should push to `/projector`, `/scriptures`, and `/confidence`.

## v57 stream behavior

The Online Stream admin panel is now lesson-specific.

- Save Stream saves to the currently selected lesson.
- Check "Also update global fallback" only when you intentionally want the same stream to become the default fallback.
- Switching lesson buttons in Admin reloads the saved YouTube link for that lesson.
- `/online?lesson=lesson-2` reads Lesson 2 first, then falls back to global only if Lesson 2 has no saved stream.

No new SQL is required if `supabase/v47-stream-config-everywhere.sql` has already been run.
