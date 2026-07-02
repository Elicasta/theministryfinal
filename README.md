# The Ministry v52

Deploy this build over v51.

## Targeted fix

This build only changes the scripture display sizing behavior:

- `/scriptures` / P2 scripture display is reverted to the prior larger layout.
- `/confidence` keeps the same format, but the Spanish scripture translation is larger and easier to read.

## SQL

No new SQL.

Use the existing stream config patch only if it has not already been run:

```txt
supabase/v47-stream-config-everywhere.sql
```


### v53 mobile Bible Bank fix
From mobile presenter mode, Bible Bank verses now use the same Push to Screens behavior as desktop: main projector overlay + scripture screen + confidence/current scripture.
