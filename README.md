# The Ministry Presenter - Master Template

This repo is a static sermon presentation system for live teaching environments.

It is designed to run multiple outputs from one deployed site:

| Route | Purpose |
|---|---|
| `/projector` | Main big-screen teaching projector |
| `/scriptures` | Side scripture screens with KJV primary and RVR 1960 underneath |
| `/confidence` | Speaker confidence monitor with current slide, next main slide, timer, and notes |
| `/admin` | Desktop presenter/admin controller |
| `/mobile` | Phone-friendly presenter controller |
| `/obslowerthirds` | OBS lower-third output |
| `/obsslides` | OBS full-slide output |
| `/online` | Mobile-first online viewer portal with YouTube scheduled live embed, scripture, poll, slide, and response cards |

The current file is intentionally still a single-file app. That keeps deployment simple and makes it safe to duplicate for a new series.

## Safe editing sections

Open `index.html` and edit only these sections for a new series:

```js
SERIES_CONFIG
THEME_CONFIG
PASSWORDS
LESSON1_SLIDES
SCRIPTURE_MAP
VERSE_BANK
QUESTIONS
NOTES_L1
```

The public behavior should stay stable if you only touch those sections.

## Do not edit per series

Avoid changing these unless you are patching a bug across the whole template:

```txt
STATE / SYNC ENGINE
RENDERERS
PROJECTOR / SCRIPTURES / OBS / CONFIDENCE LOGIC
ADMIN / MOBILE CONTROLLERS
INIT
```

Those sections are the live presentation engine.

## Theme changes

Change the series colors in `THEME_CONFIG`:

```js
const THEME_CONFIG = Object.freeze({
  backgroundImage: 'assets/ministry-bg.jpeg',
  colors: {
    bg: '#0A0A0A',
    bgd: '#111111',
    bgc: '#1A1A1A',
    bgcc: '#1E1E1E',
    text: '#F1EDE4',
    muted: '#666666',
    line: '#202020',
    accent: '#E8180D',
    accentDark: '#C41409',
    gold: '#D4933B'
  }
});
```

The CSS variables are applied automatically by `applyThemeConfig()`.

## New series workflow

1. Duplicate this folder.
2. Rename the folder for the new series.
3. Replace the background image in `assets/`.
4. Update `SERIES_CONFIG`.
5. Update `THEME_CONFIG`.
6. Update `LESSON1_SLIDES`, `SCRIPTURE_MAP`, `VERSE_BANK`, `QUESTIONS`, and `NOTES_L1`.
7. Deploy the folder to Vercel.
8. Test every route before using it live.

## ProPresenter setup

Use the deployed site as web outputs.

Recommended URLs:

```txt
https://your-domain.vercel.app/projector
https://your-domain.vercel.app/scriptures
https://your-domain.vercel.app/confidence
```

Use `/admin` or `/mobile` to control the presentation.

Do not build every sermon slide inside ProPresenter. ProPresenter should only hold the web outputs.

## OBS setup

Use browser sources:

```txt
https://your-domain.vercel.app/obslowerthirds
https://your-domain.vercel.app/obsslides
```

Set browser source size to `1920x1080`.

## Deployment

This project deploys as a static Vercel app with two optional API routes:

```txt
api/waitlist.js
api/workbook-submit.js
```

If Supabase or Resend environment variables are not configured, the static presentation still runs.

## Testing checklist

Before a live session, test:

1. Open `/projector`, `/scriptures`, and `/confidence`.
2. Open `/admin`.
3. Confirm outputs show standby screens.
4. Press Start.
5. Confirm Projector 1 moves to slide 1.
6. Confirm `/scriptures` syncs when Auto P2 is on.
7. Confirm `/confidence` shows the correct current and next main slide.
8. Press Next and Previous.
9. Confirm Projector 1 scripture overlay clears on slide changes.
10. Manually push a scripture overlay.
11. Confirm Projector 1 shows KJV only.
12. Confirm `/scriptures` shows KJV and RVR 1960.
13. Confirm OBS lower thirds and OBS slides render cleanly.
14. Test `/mobile` in portrait mode.
15. Confirm no public output shows debug labels or oversized controls.

## Patch rule

If a bug affects the engine, patch the master template first. Then copy the patched engine section into active series folders.

If a change is only series content, edit only that series folder.


### Mobile haptics

Mobile Mode includes light haptic feedback for Start, Previous, Next, Overlay, Clear, and verse push controls. This uses the browser Vibration API. Android Chrome supports it. iOS Safari may ignore it, so the controls still work normally without vibration.

## Mobile controller feedback

The Mobile Mode controller includes two feedback layers:

1. Vibration through `navigator.vibrate()` where the browser supports it. This usually works on Android Chrome and Android installed PWAs.
2. Visual tap feedback for iPhone, iPad, and iOS home-screen PWAs where web vibration is usually ignored.

The visual fallback includes button compression, a quick tap pulse, status glow, and small slide/timer/title bump feedback. This is intentionally local-only and does not change sync behavior.

## v22 Poll System Notes

The poll system is frontend-only in this static template. It uses the existing app sync channel to open polls, close polls, and report votes back to the presenter.

Presenter locations:

- `/admin` → Polls tab
- `/mobile` → Poll button

Poll types:

- Yes / No poll
- Multiple choice poll
- Premade poll bank
- On-the-fly custom poll

Audience behavior:

- When a poll is active, the attendee screen is taken over by the poll overlay.
- Attendees can save their answer anonymously.
- Answers are stored locally in the attendee browser and broadcast back through the existing sync channel when available.

Output behavior:

- Projector/OBS outputs show percentage results.
- Advancing the slide kills the active poll overlay, similar to clearing verse overlays.

Note: because this is still a static presentation template, long-term poll persistence across all devices should eventually move to a real backend. For now, this keeps the live system simple and avoids adding login/database/editor features.


### v23 behavior note

- The `/scriptures` screen should start on the series/title standby screen. It should not show a scripture immediately when Start is pressed.
- When a poll is active, `/scriptures` is intentionally taken over by the poll result display so the side screens can show percentages clearly.
- Advancing slides or closing the poll clears the poll takeover.


### Poll output behavior

When a poll is active:

- `/projector` shows full-screen poll results.
- `/scriptures` shows full-screen poll results.
- `/obsslides` shows full-screen poll results.
- `/obslowerthirds` shows compact broadcast-style poll results in the lower-third position.
- Next or Previous clears the active poll.


## v25 Notes

### Audience slave mode
When the admin starts or advances the presentation, attendee/user screens automatically enter a live session view and follow the admin-controlled slide state. Users can press the top-right `X` to leave the live view. The hub shows `Return to Session` while a session is live.

### Poll persistence
Polls are archived locally in the presenter's browser under `tm_lesson_poll_archive_v1`. This preserves on-the-fly polls and their anonymous answers when a new poll replaces the old one or when a poll is killed/closed. For real cross-device/server persistence, use the optional SQL file in `supabase/polls.sql` as the starting migration.

### Mobile poll editing
While the mobile poll editor is open or an input/textarea is focused, keyboard shortcuts are blocked so spaces/arrows do not move slides before the poll is launched.

### v26 Audience Slave Mode Notes
When the audience/user side enters live slave mode, the slide navigation chrome is hidden so attendees cannot accidentally navigate the lesson. They can exit with the **Exit Live ×** button and return later from the hub using **Return to Session** while the session is live.


### Live Questions
Audience questions submitted from the user hub appear in `/admin` under **Controls → Live Questions**. The panel shows the most recent submitted questions and updates when `question_submit` messages arrive.

### Audience Slave Mode
When a session is live, the audience/user side follows the admin-controlled presentation. In this mode, slide navigation is disabled for the audience. Users can only interact with active polls or press **Exit Live ×** to return to the hub.

## Supabase schema

Run this when setting up persistence:

```sql
-- open Supabase SQL Editor and paste:
supabase/schema.sql
```

The schema includes:

- `attendees`
- `responses`
- `sync_state`
- `lesson_questions`
- `lesson_polls`
- `lesson_poll_votes`

The app still works without persistence. Live questions save locally and broadcast immediately. If `SUPABASE_URL` and `SUPABASE_ANON_KEY` are configured in Vercel, `/api/question-submit` can save live questions into `lesson_questions`.

## Live data notes

Questions and polls use Vercel API routes plus Supabase tables.

Required Vercel environment variables:

```txt
SUPABASE_URL=https://cgliqvizpcctqhsldixn.supabase.co
SUPABASE_ANON_KEY=your_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Run this SQL in Supabase first:

```txt
supabase/schema.sql
```

Admin live data pages:

```txt
/questions
/polls
```

If questions save in Supabase but do not show in `/admin`, check `/api/questions-list` in Vercel logs.

Polls were previously frontend-only. v30 wires poll save and poll vote APIs so `lesson_polls` and `lesson_poll_votes` can fill.

### v31 Admin data notes

Questions now appear inside `/admin` as a **Questions** tab next to Slides, Verse Bank, and Polls. Answered poll results now appear inside the **Polls** tab.

Attendees save when a user enters the session password. This uses `/api/waitlist` and can save a name-only check-in without requiring an email address.

Run `supabase/schema.sql` again after this update so `attendees` has these optional tracking fields:

- `source`
- `series_slug`
- `lesson_slug`

Optional check endpoint:

```txt
/api/attendees-list?series_slug=the-ministry&lesson_slug=lesson-1
```


## v32 Supabase patch
If polls or attendees do not save, run `supabase/v32-poll-attendee-patch.sql` in Supabase SQL Editor, redeploy Vercel, then test one poll and one attendee check-in.

## v33 attendee identity notes

Audience users now enter with:

- name
- email
- access code

The app stores a local `session_id` and receives an `attendee_id` / `email_hash` from `/api/waitlist`.
Questions and poll votes include this attendee/session identity so the admin archive and Supabase data stay tied together without exposing email publicly.

Run this SQL patch if upgrading an older database:

```txt
supabase/v33-attendee-identity-patch.sql
```


## v34 Supabase Realtime Wiring Fix
- Added `/api/config` so browser outputs can load `SUPABASE_URL` and `SUPABASE_ANON_KEY` from Vercel environment variables.
- Restored local-first BroadcastChannel behavior so same-machine controls stay snappy.
- Made Supabase sync fire-and-forget so phone taps do not wait on the network.
- Added visible connection fallback labels for Local only / Live / Realtime error states.
- Did not change projector visuals, confidence layout, poll UI, or routes.

### v35 admin data notes
The Admin Polls tab now shows the currently active live poll and its results, plus answered poll archive beneath it. The Questions tab and right sidebar use the same question normalizer so names display consistently.


## Lesson selection

Lesson 1 remains the default. To run Lesson 2, add `?lesson=lesson-2` to each presentation route:

```txt
/projector?lesson=lesson-2
/scriptures?lesson=lesson-2
/confidence?lesson=lesson-2
/admin?lesson=lesson-2
/mobile?lesson=lesson-2
/obslowerthirds?lesson=lesson-2
/obsslides?lesson=lesson-2
```

The admin screen also includes Lesson 1 and Lesson 2 quick links. Keep all live outputs on the same lesson query so the slide numbers, scripture map, poll archive, questions, and controller stay aligned.

### v38 lesson selection behavior
Use the permanent routes for live screens:

- `/projector`
- `/scriptures`
- `/confidence`
- `/mobile`
- `/obslowerthirds`
- `/obsslides`
- `/admin`

Choose Lesson 1 or Lesson 2 from `/admin`. The selected lesson is broadcast to all open outputs. Query params such as `?lesson=lesson-2` remain available for testing, but are no longer required for normal live use.


### v42 note
Lesson 2 verse bank entries are split verse-by-verse for cleaner mobile control.


## Online viewer portal

Route:

```txt
https://your-domain.vercel.app/online
```

Admin setup:

1. Open `/admin`.
2. Paste the scheduled YouTube Live URL, embed URL, or iframe into **Online Stream**.
3. Set status: `Starting Soon`, `Live`, `Ended`, or `Offline`.
4. Set sync delay in seconds to match YouTube livestream latency.
5. Press **Save Stream**.

Viewer flow:

- Direct link: `/online`
- Login modal option: check **Watching online** after entering name, email, and access code. It redirects to `/online`.

SQL:

Run this if the `live_stream_config` table does not exist yet:

```txt
supabase/v36-online-viewer-live-stream.sql
```

This patch is additive. It does not change projector, scripture, confidence, admin, mobile, OBS, or existing lesson routes.

### v37 Online Stream Memory

The Online Stream panel saves the YouTube/Vimeo/custom embed source globally and to the current lesson.

Run this Supabase patch after deploying v37:

```sql
-- Supabase SQL Editor
-- file: supabase/v37-stream-config-everywhere.sql
```

Behavior:

- `/admin` saves the stream source to `live_stream_config.default` and `live_stream_config.the-ministry::lesson-x`.
- `/online?lesson=lesson-2` loads the lesson-specific stream first.
- `/online` without a lesson falls back to the global/default stream.
- This lets returning viewers see the same stream/replay later while future lessons still have a fallback source.
