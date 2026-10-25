# The Importance of Inner Healing · Live teaching guide

**Type:** One-off sermon, not part of Matthew 10/11 or the active teaching series.  
**Lesson ID:** `inner-healing-2026-10-25`  
**Format:** One complete manuscript + 52 manual projector cues.  
**Audience participation:** Off. No polls, question panels, or discussion breaks.

## Launch

- **iPad manuscript and live controller:** `/presenter?lesson=inner-healing-2026-10-25`
- **iPad alternate URL:** `/mobile?lesson=inner-healing-2026-10-25`
- **Main projector:** `/projector?lesson=inner-healing-2026-10-25`
- **Confidence monitor:** `/confidence?lesson=inner-healing-2026-10-25`
- **Side scripture screens:** `/scriptures?lesson=inner-healing-2026-10-25`
- **Clean OBS slide feed:** `/obsslides?lesson=inner-healing-2026-10-25`

Before the service, open iPad and projector on the same lesson and verify that **Next** moves the visible slide. Use the inline **TAKE CUE** button at any point to jump directly to that manuscript's visual. This action sends the visual to the projector and synchronizes connected displays.

## Presenter rhythm

1. Read the entire manuscript on the iPad. No sermon paragraphs are removed to make slides.
2. Each manuscript section is labeled `Cue XX / 52`. Its **TAKE CUE XX** button projects that specific visual.
3. Press **Next** to reveal the next planned phrase, point, diagram or verse. The projector does not advance on a clock.
4. Multiple sequential slides with **BUILD 1/3**, **BUILD 2/3**, etc. reveal cumulative talking points one at a time.
5. The scripture TV retains the most recent verse until a different verse is sent or the screen is cleared, independent of other slides. A verse slide automatically sends its reference to the scripture output.
6. **Black Projector** and **Clear Overlay** remain available as manual emergency controls.

## Main sequences

| Moment | Visual pacing |
| --- | --- |
| Opening | Title, central declaration, Psalm 147:3 |
| Symptoms | Resentment, negative outlook, recurring cycles build one by one |
| Recurring thoughts and addictions | Three progressive statements, no audience interaction |
| Why hurt controls us | Three symptoms, a wound → lens → reaction diagram, four responses |
| Five wound questions | Five-question roadmap and one full-screen question per step |
| David and Saul | Refusal to retaliate, distance and boundaries |
| Forgiveness versus healing | Side-by-side contrast, the broken-leg illustration in two reveals |
| Mark 8 | Sight restored progressively, then a visual three-stage diagram |
| Results of healing | Boundaries, relationships, clarity |
| How healing happens | Three-part roadmap followed by personal application |
| Invitation | Isaiah 61:1, private invitation, Matthew 11:28, final declaration |

## Editorial guardrails

- The complete supplied manuscript is preserved across the slides' **manuscript** entries. Slide text intentionally highlights selected statements only.
- KJV passages are bold and italic inside the iPad transcript. Scripture quotations on the projector are styled for legibility.
- No new doctrine, teaching claim, or audience question was inserted to fill empty slides.
- The one-off presentation styling is scoped to this lesson ID. Existing stable lessons keep their authored themes.
- English source Scriptures are attached. No unverified Spanish translation has been invented.
- The existing active lesson in `lesson-library.json` is intentionally unchanged.
- Before setting `knownGood: true`, run a live-device rehearsal including iPad, projector, scripture screen, confidence monitor and reconnect/sync behavior.

## Validation

`npm test` includes `tests/inner-healing.test.mjs`. It checks:
- Library and per-output route integrity
- All 52 cue ↔ manuscript links
- Important teaching sections and KJV formatting
- No polls or audience questions
- Actual manuscript cue → projector navigation
- JavaScript parse health and slide model validity

