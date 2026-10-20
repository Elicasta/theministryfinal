import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const load = path => readFileSync(new URL('../'+path, import.meta.url), 'utf8');
const lesson = JSON.parse(load('content/doctrine-night-2026-10-20.json'));
const library = JSON.parse(load('lesson-library.json'));

test('doctrine night is registered with all session views', () => {
  const entry = library.lessons.find(l => l.id === lesson.id);
  assert.ok(entry);
  assert.equal(entry.engineSource, '/content/doctrine-night-2026-10-20.json');
  for (const key of ['presentation','projector','manuscript','student','controller','scriptures','confidence'])
    assert.ok(entry.artifacts[key], 'Missing '+key);
});

test('every slide has aligned manuscript, poll cues and unique poll IDs', () => {
  assert.equal(lesson.slides.length, lesson.manuscript.length);
  assert.ok(lesson.slides.length >= 30);
  assert.ok(lesson.polls.length >= 10);
  for (const [i, row] of lesson.manuscript.entries()) {
    assert.equal(row.slide, i, 'Manuscript slide index '+i);
    assert.equal(row.title, lesson.slides[i].title, 'Manuscript title '+i);
    assert.match(row.html, /<p>|<ul>/);
  }
  assert.equal(new Set(lesson.polls.map(p => p.id)).size, lesson.polls.length);
  for (const p of lesson.polls) {
    assert.ok(Number.isInteger(p.cueSlide) && p.cueSlide >= 0 && p.cueSlide < lesson.slides.length, p.id);
    assert.equal(p.cue, 'Slide '+(p.cueSlide+1), p.id);
    assert.ok(p.options.length >= 2);
  }
});

test('Oneness challenge preserves objections and Scripture context', () => {
  const all = lesson.manuscript.map(x => x.refs.join(' ')+' '+x.html).join('\n');
  for (const ref of ['Isaiah 48:16','Genesis 19:24','John 17:5','John 1:1','Matthew 3:16','1 Corinthians 15:28']) assert.ok(all.includes(ref), ref);
  assert.match(all, /Trinitarian/i);
  assert.match(all, /punctuation|quotation marks/i);
});

test('Greek study distinguishes name from power and includes saving name', () => {
  const all = lesson.manuscript.map(x => x.refs.join(' ')+' '+x.html).join('\n');
  assert.match(all, /onoma/i);
  assert.match(all, /exousia/i);
  assert.match(all, /εἰς τὸ ὄνομα/);
  assert.match(all, /Acts 4:12/);
  assert.ok(lesson.verses.some(v => v.ref === 'Acts 4:12'));
  assert.equal(lesson.slides.filter(x => x.title === 'There is none other name').length, 1);
});

test('holiness, head covering, baptism and Spirit reception are all taught', () => {
  const all = lesson.manuscript.map(x => x.refs.join(' ')+' '+x.html).join('\n');
  for (const phrase of ['1 Corinthians 11:10','because of the angels','Matthew 28:19','Acts 2:38','Acts 10:46','Holy Ghost']) assert.ok(all.toLowerCase().includes(phrase.toLowerCase()), phrase);
});

test('iPad console script parses and controller identifiers match markup', () => {
  const js=load('engine/ipad-console.js');
  const engine=load('engine/engine.js');
  const html=load('engine/index.html');
  new Script(js,{filename:'ipad-console.js'});
  new Script(engine,{filename:'engine.js'});
  for (const id of ['ipad-prev','ipad-next','ipad-clear','ipad-black','ipad-lesson-select','ipad-poll-list','ipad-verse-list','ipad-q-list','ipad-feedback','ipad-refresh','ipad-end']) {
    assert.ok(html.includes('id="'+id+'"'),id+' missing in HTML');
    assert.ok(js.includes("'"+id+"'"),id+' not wired in console');
  }
  assert.match(html, /ipad-console\.js/);
  assert.match(engine, /window\.MinistryIpad=/);
  assert.match(engine, /poll was not launched/i);
  assert.match(engine, /Cannot verify vote counts/);
});
