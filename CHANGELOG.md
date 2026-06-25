# Changelog

## v17 Master Template Cleanup

- Preserved the stable working presentation behavior.
- Consolidated multiple CSS patch blocks into one ordered style block.
- Consolidated multiple JavaScript patch blocks into one ordered script block.
- Added clear editable config sections for series metadata, theme colors, passwords, and lesson data.
- Added `THEME_CONFIG` and `applyThemeConfig()` so future series can change color schemes from one place.
- Kept the app single-file for live stability and simple duplication.
- Removed empty `index.html.tmp`.
- Added README documentation for routes, editing workflow, ProPresenter, OBS, deployment, and testing.

## Notes

This cleanup intentionally does not add login, database editing, markdown loading, or a drag-and-drop lesson builder. Those should come later after the static live presentation system stays stable.

## v18 Sync Snappiness Patch
- Restored local-first sync behavior for fast controller taps.
- Added a bundled `deck_state` message so slide + scripture sync can travel as one command.
- Added message IDs and de-dupe protection to prevent repeated/echoed commands.
- Added localStorage pulse fallback for same-browser outputs.
- Kept Supabase network sync as fire-and-forget so the phone controller does not wait on REST latency.
