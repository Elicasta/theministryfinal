# The Ministry v59

Lesson 4 and audience notes patch.

## What changed

- Added Lesson 4: **What It Takes to Make It** — Matthew 10:16-28.
- Opened July 9, 2026 as the active/default lesson.
- Fixed verse-bank pushes so desktop, mobile verse bank, and mobile full Bible Bank send to:
  - P1 main projector overlay
  - P2 scripture screen
  - confidence monitor active scripture
- Replaced the online audience slide card with **Audience Notes**:
  - shows the current teaching points
  - gives each attendee a notes box
  - saves locally under their attendee/session identity
  - posts to `/api/notes-save` when Supabase is configured
  - reloads saved notes through `/api/notes-list` when attendee identity is available

## SQL

Run this once in Supabase if you want remote account/session note saving:

- `supabase/v59-audience-notes.sql`

The notes still save locally on-device if the SQL has not been run yet.

## Test

Open these after deploy:

- `/projector?lesson=lesson-4`
- `/scriptures?lesson=lesson-4`
- `/confidence?lesson=lesson-4`
- `/online?lesson=lesson-4`

From admin/mobile, push Matthew 10:16 from the verse bank. It should appear on the main projector overlay and the scripture screen.
