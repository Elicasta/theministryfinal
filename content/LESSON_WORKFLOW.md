# Lesson Library Contract

This repository now treats taught lessons as an archive, not disposable presentation code.

## Stable lesson rule

Once a lesson has been taught cleanly, mark it `stable` in `lesson-library.json`. Stable builds are not rewritten during cleanup passes. New organization work should index or wrap the build instead of changing its teaching engine.

If a stable lesson needs a real correction, make the smallest targeted fix and update the revision notes. Do not refactor the lesson just because a newer architecture exists.

## Required artifacts

Every new lesson should ship with:

1. **Presentation** — the live teaching/controller view.
2. **Projector** — the clean output route.
3. **Manuscript** — a readable teaching document that survives outside the live UI.
4. **Class portal** — when the lesson uses participation, polls, responses, or questions.

The user can still submit lessons the current way: rough notes, manuscript text, Scripture, or an outline in chat. The implementation step normalizes that material into the library contract.

## Metadata

Each lesson entry needs:

- `id` — permanent unique ID.
- `series`
- `sequence`
- `title`
- `scripture`
- `taughtAt`
- `status`
- `knownGood`
- artifact routes

Poll IDs should be namespaced to the lesson when practical. A poll must be persisted before or at launch, and a class-portal vote must visibly report success or failure. Silent vote failures are not acceptable.

## Current architecture

The archive intentionally keeps multiple proven engines:

- Matthew 10 uses the original Ministry master engine.
- Living With Purpose uses its hardened standalone engine.
- Kingdom Principles Alignment and Provision use their standalone engines.
- Matthew 11 uses the Kingdom Evidence engine and full manuscript presenter.

The library is the organizing layer across those engines. It does not force them into one runtime.
