
## v61 - Audience Notes UI visible fix

- Replaced the online viewer Current Slide card with a visible Teaching Notes card.
- Teaching Notes now shows the current slide's point list instead of the slide preview.
- Notes textarea is bound even when the card is rendered in the base HTML.
- Old online slide preview is hard-hidden so older layout patches cannot bring it back.
- Kept v60 point-forward lesson slides and verse push fixes unchanged.

# v59 Lesson 4 + Verse Reliability + Audience Notes

- Added Lesson 4: **What It Takes to Make It** from Matthew 10:16-28.
- Set Lesson 4 open for July 9, 2026.
- Fixed verse-bank reliability by exposing/syncing the active verse bank and forcing push events to P1 and P2.
- Patched mobile verse bank and mobile full Bible Bank pushes so they no longer depend on a missing `window.VERSE_BANK` value.
- Replaced the online audience slideshow card with an audience notes section showing current slide points plus a saved notes textarea.
- Added `/api/notes-save` and `supabase/v59-audience-notes.sql` for per-attendee/session note storage.

## v60 - Point-forward lesson slides
- Reworked Lesson 4 slideshow from scripture-heavy to point-forward teaching slides.
- Kept core scripture slides for Matthew 10:16, Matthew 10:19-20, Matthew 10:22, and Matthew 10:28.
- Preserved verse push reliability patch and audience saved notes system from v59.

## v62 Admin Lesson 4 Button
- Added the missing Lesson 4 button to the presenter/admin command bar.
- Marked Lesson 4 open in base lesson metadata so admin/home routes do not treat it as locked.
- Added a small runtime guard that reinserts the Lesson 4 admin button if older layout code redraws the command bar.
