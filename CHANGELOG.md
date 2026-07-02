# v56 Scripture + Mobile Verse Bank Hotfix

- Shrinks only the bottom secondary scripture line on `/scriptures`.
- Fixes the mobile Verse Bank push path so it broadcasts to main projector/P1 and scripture/P2 like the full Bible Bank.
- Leaves all other v55/v54 behavior untouched.

## v57 - Lesson-specific stream admin
- Changed Online Stream admin save to save the YouTube source to the selected lesson by default instead of overwriting the global fallback every time.
- Added an optional "Also update global fallback" checkbox for cases where one stream should be reused everywhere.
- Added a lesson stream status card in Admin that shows the saved YouTube URL for the selected lesson and the current global fallback.
- Added a Reload Lesson Stream button.
- Switching Lesson 1 / 2 / 3 in Admin now reloads that lesson's saved stream fields.
- Updated `/api/stream-config` GET response to return `lesson_config` and `global_config` separately while still falling back correctly for viewers.
