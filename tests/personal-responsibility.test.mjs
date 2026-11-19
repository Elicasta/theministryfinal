import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const id = 'personal-responsibility-2026-11-19';
const lesson = JSON.parse(read('content/' + id + '.json'));
const lib = JSON.parse(read('lesson-library.json'));
const spanish = JSON.parse(read('content/' + id + '-rv1909.json'));
const manuscript = read('content/standalone/personal-responsibility/lesson.md');
const engineHtml = read('engine/index.html');

test('standalone lesson is available from the selector and its direct presenter link', () => {
  const entries = lib.lessons.filter(row => row.id === id);
  assert.equal(entries.length, 1);
  const entry = entries[0];
  assert.equal(entry.series, 'Standalone Lessons');
  assert.equal(entry.status, 'ready');
  assert.equal(entry.engineSource, '/content/' + id + '.json');
  assert.equal(entry.knownGood, false);
  for (const key of ['presentation','projector','manuscript','controller','scriptures','confidence'])
    assert.equal(entry.artifacts[key].split('?lesson=')[1], id);
  assert.ok(engineHtml.includes('/presenter?lesson=' + id));
  assert.ok(engineHtml.includes('/presenter?lesson=breaking-the-cycles-2026-11-12'));
  // Adding a ready-to-use lesson must not unexpectedly replace the active live default.
  assert.equal(lib.latest, 'breaking-the-cycles-2026-11-12');
  assert.ok(lib.rules.stableBuildsAreImmutable);
});

test('the supplied teaching is preserved as the full manuscript, including pacing and prayer', () => {
  assert.equal(lesson.manuscriptSourceMd, manuscript);
  const required = [
    'INTRODUCTION (3–5 Minutes)',
    'POINT 1: PERSONAL RESPONSIBILITY IS MORE THAN A CATCHPHRASE',
    'POINT 2: THE DANGER OF NOT TAKING RESPONSIBILITY',
    'POINT 3: HOW DO WE BEGIN TAKING RESPONSIBILITY?',
    'STEP 1: Examine yourself honestly',
    'STEP 2: Acknowledge your mistakes without excuses',
    'STEP 3: Repent and take action',
    'STEP 4: Stop living in the past and begin moving forward',
    'STEP 5: Be consistent and allow others to help you',
    'People are not responsible for abuse, injustice, or harm inflicted on them',
    'If you reach 45 minutes while teaching a point',
    'Closing Prayer',
    'In Jesus’ name, amen.'
  ];
  for (const phrase of required) assert.ok(manuscript.includes(phrase), 'Missing: ' + phrase);
  assert.equal(lesson.durationMinutes.target, 38);
  assert.equal(lesson.durationMinutes.min, 30);
  assert.equal(lesson.durationMinutes.max, 45);
});

test('every cue synchronizes the iPad manuscript, projector and Spanish TV', () => {
  assert.equal(lesson.slides.length, 38);
  assert.equal(lesson.manuscript.length, 38);
  assert.equal(lesson.slideScriptures.length, 38);
  assert.equal(lesson.slides[0].type, 'cover');
  assert.equal(lesson.slides.at(-1).title, 'CLOSING PRAYER');
  for (const [i,slide] of lesson.slides.entries()) {
    const note=lesson.manuscript[i];
    assert.equal(note.slide,i);
    assert.equal(note.title,slide.title);
    assert.ok(note.html.length>35,'Missing teaching notes for cue '+i);
    assert.ok(slide.es?.title,'Missing Spanish slide title for cue '+i);
    if (slide.type==='verse') {
      const pair=lesson.slideScriptures[i];
      assert.ok(pair,'Missing Scripture mapping for cue '+i);
      assert.equal(pair.ref_en,slide.ref);
      assert.equal(pair.text_en,slide.text);
      assert.equal(pair.text_es,slide.es.text);
      assert.ok(slide.text.length>15,'Empty KJV verse: '+slide.ref);
      assert.ok(slide.es.text.length>12,'Empty Spanish verse: '+slide.ref);
      assert.match(note.html,/class="ih-scripture"/);
      assert.match(note.html,/Reina-Valera 1909/);
      assert.ok(!/Jehov[aá]/i.test(slide.es.text),'Divine name not adapted in '+slide.ref);
    } else {
      assert.equal(lesson.slideScriptures[i],null);
      if (slide.type==='points') {
        assert.ok(slide.points.length>0);
        assert.equal(slide.points.length,slide.es.points.length);
      }
    }
  }
});

test('each quoted KJV reference is in the Scripture bank and Spanish data is honestly labeled', () => {
  assert.equal(lesson.verses.length,24);
  assert.equal(Object.keys(spanish.passages).length,24);
  assert.match(lesson.spanishVersionLabel,/1909/);
  assert.doesNotMatch(lesson.spanishVersionLabel,/1960/);
  assert.equal(lesson.localRvr1960,false);
  for (const row of lesson.verses) {
    assert.equal(row.text_es,spanish.passages[row.ref]);
    assert.equal(row.text_en,row.text);
    assert.ok(row.text_en.trim());
    assert.ok(row.text_es.trim());
    assert.equal(row.spanishSource,'RV1909-adapted');
  }
  assert.match(lesson.verses.find(v=>v.ref==='Romans 14:12').text_en,/give account of himself to God/);
  assert.match(lesson.verses.find(v=>v.ref==='Galatians 6:4-5').text_en,/bear his own burden/);
  assert.match(lesson.verses.find(v=>v.ref==='Proverbs 28:13').text_en,/confesseth and forsaketh/);
  assert.match(lesson.verses.find(v=>v.ref==='James 1:22').text_en,/doers of the word/);
  assert.match(lesson.verses.find(v=>v.ref==='Luke 15:19-20').text_en,/he arose, and came to his father/);
});

test('lesson respects manual Scripture control and does not expose audience polls', () => {
  assert.equal(lesson.sideTvSpanishMirror,true);
  assert.equal(lesson.spanishScreensFollowSlides,true);
  assert.equal(lesson.scriptureManualOnly,true);
  assert.equal(lesson.hideAudienceQr,true);
  assert.equal(lesson.audienceParticipation,false);
  assert.deepEqual(lesson.polls,[]);
  assert.deepEqual(lesson.prompts,[]);
});
