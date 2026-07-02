# The Ministry v49

Deploy this build over v48.

## Routes

- `/` current lesson landing
- `/projector` current lesson projector
- `/scriptures` Spanish/English scripture display
- `/obslowerthirds` OBS lower thirds
- `/obsslides` OBS slides
- `/confidence` confidence monitor
- `/mobile` mobile presenter controls
- `/online` English online viewer
- `/Espanol` Spanish participant/slides viewer
- `/Espanol?online=1` Spanish online viewer

## Login routing

- Watching online only → `/online?lesson=current`
- Español only → `/Espanol?lesson=current`
- Watching online + Español → `/Espanol?online=1&lesson=current`

## SQL

No new SQL was added in v49. If the stream-config table has not been created yet, run:

`supabase/v47-stream-config-everywhere.sql`
