# The Ministry v49

Missed-items pass on top of v48.

## Fixed / Added

- Fixed Spanish routing behavior:
  - Español only goes to `/Espanol?lesson=...` as a Spanish participant/slides version.
  - Watching online + Español goes to `/Espanol?online=1&lesson=...` as the Spanish online viewer.
  - Watching online only goes to `/online?lesson=...`.
- Added final login-routing override so older v47/v48 wrappers do not steal the Spanish route.
- Added access-code note: `* access code is all lowercase`.
- Strengthened date-based default lesson selection for permanent routes when no `?lesson=` is supplied.
- Kept `/projector`, `/scriptures`, `/confidence`, `/obslowerthirds`, `/obsslides`, `/mobile` tied to the selected/current lesson instead of requiring query strings.
- Reworked online layout closer to v37:
  - video first
  - lower-third/current cue info under video
  - current slide under that
  - response buttons sticky on desktop / bottom nav on mobile
- Added mobile Bible Bank behind a deliberate `Bible Bank` button.
- Bible Bank uses the full chapter bank already present for Lesson 3: 1 Timothy 4, 2 Timothy 1, 2, and 4.
- Kept replay sync as a planned feature, not rushed into live-safe code.

## SQL

No new SQL. Use the existing v47 stream-config SQL if it has not already been run.
