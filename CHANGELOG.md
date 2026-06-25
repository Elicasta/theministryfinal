
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
