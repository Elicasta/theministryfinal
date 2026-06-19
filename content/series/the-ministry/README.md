# The Ministry lesson content

Folder format:

```text
content/series/the-ministry/
  lesson-1/
    lesson.md
  lesson-2/
    lesson.md
```

Each `lesson.md` contains a fenced `lesson-json` block. Leave `enabled: false` until the lesson is ready.

To test a specific lesson once enabled:

```text
/projector?lesson=lesson-1
/admin?lesson=lesson-1
/mobile?lesson=lesson-1
/scriptures?lesson=lesson-1
/confidence?lesson=lesson-1
```

The hard-coded built-in lesson remains the fallback if the file is disabled, missing, or malformed.
