import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const load = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const lesson = JSON.parse(load('content/inner-healing-2026-10-25.json'));
const library = JSON.parse(load('lesson-library.json'));
const manuscript = lesson.manuscript.map(row => row.html).join('\n');
const projector = load('engine/engine.js');
const consoleJs = load('engine/ipad-console.js');
const markup = load('engine/index.html');
const theme = load('engine/inner-healing.css');

test('standalone sermon is registered without altering the default or taught lessons', () => {
  const entry = library.lessons.find(item => item.id === lesson.id);
  assert.ok(entry, 'Sermon must be discoverable through the library');
  assert.equal(entry.series, 'Standalone Lessons');
  assert.equal(entry.engineSource, '/content/inner-healing-2026-10-25.json');
  assert.equal(entry.status, 'ready');
  assert.equal(entry.knownGood, false);
  assert.notEqual(library.latest, lesson.id, 'Do not silently replace the active lesson');
  for (const key of ['presentation', 'projector', 'manuscript', 'student', 'controller', 'scriptures', 'confidence']) {
    assert.ok(entry.artifacts[key]?.includes('lesson=' + lesson.id), 'Missing standalone route: ' + key);
  }
});

test('every manual reveal corresponds to exactly one full iPad manuscript segment', () => {
  assert.equal(lesson.slides.length, 52);
  assert.equal(lesson.manuscript.length, lesson.slides.length);
  assert.equal(lesson.slides[0].type, 'cover');
  assert.equal(lesson.slides.at(-1).type, 'statement');
  for (let i = 0; i < lesson.slides.length; i++) {
    assert.equal(lesson.manuscript[i].slide, i, 'Broken slide mapping at ' + i);
    assert.ok(lesson.manuscript[i].html.includes('<p'), 'Missing script for cue ' + i);
    assert.ok(lesson.slides[i].notes, 'Missing presenter cue for slide ' + i);
  }
});

test('sermon manuscript preserves the full teaching arc and KJV emphasis', () => {
  for (const line of [
    'You can be delivered from the thing that hurt you',
    'Resentment, a Negative View of Life',
    'Recurring Thoughts, Sin',
    'How to Identify the Wounds',
    'Jeremiah 6:14',
    'Who Hurt You?',
    'What Did They Do?',
    'How Were You Hurt?',
    'Why Were You Hurt?',
    'When Were You Hurt?',
    'David and Saul',
    'Forgiveness Does Not Equal Healing',
    'My leg is still broken',
    'Healing Can Be Progressive',
    'I see men as trees',
    'Healing Sets New Boundaries',
    'Healing Defines Relationships',
    'Healing Renews or Replenishes Clarity',
    'Through the Power of God',
    'Through Genuine Processing',
    'Through Actually Recognizing',
    'Come to the Healer This Morning',
    'Ask Him to heal what is happening within you'
  ]) assert.ok(manuscript.includes(line), 'Missing teaching section: ' + line);
  assert.match(manuscript, /class="ih-scripture"><strong><em>Psalm 147:3 \(KJV\)/);
  assert.ok(lesson.verses.some(item => item.ref === 'Matthew 11:28'));
  assert.ok(lesson.verses.some(item => item.ref === 'Mark 8:25'));
});

test('no participation or polls interrupt this long-form sermon', () => {
  assert.deepEqual(lesson.polls, []);
  assert.deepEqual(lesson.prompts, []);
  for (const id of ['ipad-audience-drawer', 'ipad-polls-drawer', 'class-questions-card']) {
    assert.ok(markup.includes('id="' + id + '"'), 'Missing optional panel identifier: ' + id);
    assert.ok(theme.includes('#' + id), 'Audience interface was not hidden: ' + id);
  }
  assert.match(projector, /withQr&&!isMirroredSermon\(\)/);
});

test('one tap on the manuscript cue advances the synchronized projector', () => {
  assert.match(consoleJs, /api\.go\(Number\(el\.dataset\.cue\)\)/);
  assert.match(projector, /const autoScripture=scriptureForSlide\(t\)/);
  assert.match(projector, /function send\(\)/);
  assert.match(projector, /ih-process-grid/);
  assert.match(theme, /prefers-reduced-motion/);
});

test('teaching JavaScript parses and native lesson is a valid slide model', () => {
  assert.doesNotThrow(() => new Script(projector));
  assert.doesNotThrow(() => new Script(consoleJs));
  for (const slide of lesson.slides) {
    assert.ok(['cover', 'statement', 'verse', 'points', 'contrast', 'steps', 'progression'].includes(slide.type),
      'Unsupported cue type: ' + slide.type);
    if (slide.type === 'verse') {
      assert.ok(slide.ref && slide.text, 'Every projected verse needs its full text');
    }
  }
});
