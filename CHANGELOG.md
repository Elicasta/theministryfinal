## v32 Poll/Attendee Supabase Compatibility
- Made poll save API independent of `on_conflict` so older Supabase tables work.
- Made poll archive API use `select=*` and safer ordering.
- Added `supabase/v32-poll-attendee-patch.sql` for existing projects.
- Preserved admin tabs, audience lock, and presentation behavior.


## v28 User Interaction Lock + Admin Questions Panel
- Locked audience slave mode so left/right screen taps no longer advance or reverse slides.
- Kept poll overlays interactive while the live audience view is locked.
- Added a persistent Live Questions panel back into the admin controls.
- Questions submitted from the user side now show in the admin questions panel.


## v27 Confidence Poll Fit
- Fitted live poll results inside the confidence monitor current-slide panel.
- Reduced poll question/results typography so results no longer overflow the confidence box.
- Preserved projector, scripture, OBS, user slave mode, and mobile controller behavior.


## v24 Poll Main Screen Routing
- Active polls now take over the main projector and OBS full slide outputs.
- OBS lower thirds now shows active poll results in a lower-third format instead of a full-screen takeover.
- Poll overlays still clear on Next/Previous.

# Changelog

## v23 Scripture Standby + Poll Scripture Takeover
- `/scriptures` now stays on the title/series standby screen when the presentation starts.
- Removed the automatic slide-0 scripture push on Start.
- `/scriptures` now becomes a full-screen poll results display while a poll is active.
- Next/Previous/poll close clears the poll takeover state.

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

## v19 Emergency Sync Rollback
- Rolled back the experimental v18 deck_state sync patch.
- Restored the stable v17 slide/start behavior.
- Kept master-template cleanup, README, and CHANGELOG structure.
- No visual changes.
- No feature changes.

Use this version if v18 gets stuck after the Start slide.

## v20 Mobile Haptics
- Added mobile haptic feedback helper using `navigator.vibrate()` where supported.
- Added haptic feedback to Mobile Mode Start, Previous, Next, Overlay, Clear, and verse push controls.
- Preserved v19 stable sync behavior and did not change routes, visuals, or data structure.

## v21 Mobile PWA Tap Feedback
- Kept v19/v20 stable sync behavior unchanged.
- Kept Android/web vibration support through `navigator.vibrate()`.
- Added iOS/PWA-safe visual tap feedback for Mobile Mode controls.
- Added button press compression, quick pulse, status glow, and slide/timer/title bump feedback.
- Applied feedback to Start, Previous, Next, Overlay, X Verse, Clear, Close, and verse-bank buttons.
- No route, visual output, projector, scripture, OBS, confidence, or data-structure changes.

## v22 Polls + Scripture Output Adjustments
- Set OBS lower thirds to green screen by default for chroma key workflows.
- Changed the scripture side screen so Spanish RVR 1960 is the primary large text and KJV is the smaller supporting text.
- Added a frontend live poll system using the existing sync channel.
- Added premade poll bank and custom poll launcher in admin.
- Added Poll button and poll launcher in Mobile Mode.
- Added yes/no and multi-choice poll support.
- Added anonymous answer saving on attendee devices through localStorage.
- Added live poll result percentage overlay for projector/OBS outputs.
- Poll overlays clear when the presenter advances slides.


## v25 Audience Slave Mode + Poll Persistence Polish
- Added audience slave mode so attendee screens follow the admin-controlled presentation while live.
- Added top-right X to exit live slave mode and a Return to Session button on the user hub.
- Added poll display inside the confidence monitor current-slide area.
- Added mobile Poll live indicator and Kill Poll button.
- Archived active polls and answers into local lesson storage when replaced, killed, closed, or cleared by slide navigation.
- Added keyboard shortcut guard so editing a poll question/options does not advance slides.
- Added optional SQL migration notes for future Supabase poll persistence.

## v26 Audience Slave Mode Polish
- Hid slideshow navigation controls while the audience user side is in slave/live-follow mode.
- Kept a clear Exit Live control at the top right so users can leave slave mode.
- Kept Return to Session available from the user hub when a live session is active.

## v29 Confidence Restore + SQL Coverage
- Restored confidence monitor slide formatting after poll state by clearing `poll-current` when normal slide/scripture rendering resumes.
- Added full Supabase schema migration for attendees, responses, sync state, live questions, polls, and poll votes.
- Added optional `/api/question-submit` endpoint for persistent live questions when Supabase env vars are configured.

## v30 Live Data Admin Fix
- Admin questions now fetch from Supabase through `/api/questions-list` instead of only local BroadcastChannel/localStorage.
- Added `/questions` admin page for submitted questions with Answered/Hidden controls.
- Added `/polls` admin page with live and answered poll archive.
- Wired poll creation/archive to `/api/poll-save`.
- Wired poll votes to `/api/poll-vote-submit`.
- Added question update API for marking questions answered/hidden/new.
- Expanded `supabase/schema.sql` with event-mode RLS policies and poll/question tables.

## v31 Admin tabs + attendee check-in fix
- Moved live questions into an admin tab next to Polls instead of relying on separate raw dashboard pages.
- Added answered poll results directly inside the Polls admin tab.
- Kept /questions and /polls routes as optional utility pages, but admin workflow now stays inside /admin.
- Fixed attendee check-in saving by allowing name-only session access records in api/waitlist.js.
- Added attendee source/series/lesson fields to Supabase schema and added api/attendees-list.js for checking saved attendees.

## v33 Attendee Identity Patch
- Required name + email + access code for audience entry.
- Saved attendee session identity in Supabase.
- Linked questions and poll votes to attendee/session identity.
- Added safer poll duplicate handling by session/email hash.
- Added Supabase patch `supabase/v33-attendee-identity-patch.sql`.


## v34 Supabase Realtime Wiring Fix
- Added `/api/config` so browser outputs can load `SUPABASE_URL` and `SUPABASE_ANON_KEY` from Vercel environment variables.
- Restored local-first BroadcastChannel behavior so same-machine controls stay snappy.
- Made Supabase sync fire-and-forget so phone taps do not wait on the network.
- Added visible connection fallback labels for Local only / Live / Realtime error states.
- Did not change projector visuals, confidence layout, poll UI, or routes.

## v35 Admin live data display polish
- Standardized question display names between the sidebar and Questions tab.
- Added live poll results into the Polls tab, not only the right sidebar.
- Kept answered poll archive inside the Polls tab.
- No route, sync, projector, scripture, confidence, or audience behavior changes.
