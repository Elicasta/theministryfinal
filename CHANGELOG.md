# v59 Lesson 4 + Verse Reliability + Audience Notes

- Added Lesson 4: **What It Takes to Make It** from Matthew 10:16-28.
- Set Lesson 4 open for July 9, 2026.
- Fixed verse-bank reliability by exposing/syncing the active verse bank and forcing push events to P1 and P2.
- Patched mobile verse bank and mobile full Bible Bank pushes so they no longer depend on a missing `window.VERSE_BANK` value.
- Replaced the online audience slideshow card with an audience notes section showing current slide points plus a saved notes textarea.
- Added `/api/notes-save` and `supabase/v59-audience-notes.sql` for per-attendee/session note storage.
