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
