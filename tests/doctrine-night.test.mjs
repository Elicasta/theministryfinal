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

test('Oneness uses exactly four objections in the requested order', () => {
  const holinessIndex=lesson.slides.findIndex(s=>s.title.startsWith('HOLINESS ·'));
  assert.ok(holinessIndex>15);
  const slides=lesson.slides.slice(0,holinessIndex);
  const challenges=slides.filter(s=>/^CHALLENGE [1-4] ·/.test(s.title));
  assert.deepEqual(challenges.map(s=>s.title), [
    'CHALLENGE 1 · Who is “US”?',
    'CHALLENGE 2 · Two LORDs?',
    'CHALLENGE 3 · Who is speaking?',
    'CHALLENGE 4 · The Word was WITH God'
  ]);
  for (const former of ['John 17:5','Matthew 3:17','1 Corinthians 15:28'])
    assert.ok(!slides.some(s=>s.ref===former), former+' remains as a separate Oneness challenge');
  assert.ok(slides[0].title==='THE TENETS OF OUR FAITH');
  assert.ok(slides.some(s=>s.ref==='Deuteronomy 6:4'));
  assert.ok(slides.some(s=>s.title==='FOUR OBJECTIONS. ONE GOD.'));
});

test('Genesis 1:26 objection stays isolated until the next slide reveals verse 27', () => {
  const i=lesson.slides.findIndex(s=>s.title==='CHALLENGE 1 · Who is “US”?');
  assert.equal(lesson.slides[i].ref,'Genesis 1:26');
  assert.equal(lesson.slides[i].text, lesson.verses.find(v=>v.ref==='Genesis 1:26').text);
  assert.doesNotMatch(JSON.stringify(lesson.slides[i]), /Genesis 1:27/);
  assert.equal(lesson.slides[i+1].ref,'Genesis 1:27');
  assert.match(lesson.slides[i+1].text, /God created man in his own image/);
});

test('Isaiah 48 uses Instagram speaker-color quotations while marking them interpretive', () => {
  const all=lesson.manuscript.map(x=>x.refs.join(' ')+' '+x.html).join('\n');
  const text=lesson.slides.map(x=>[x.title,...(x.points||[])].join(' ')).join('\n');
  for(const ref of ['Isaiah 48:16','Genesis 19:24','John 1:1','Genesis 1:1–12','Isaiah 44:24'])
    assert.ok(all.includes(ref),ref);
  assert.match(text,/🔴 LORD/);
  assert.match(text,/🔵 ISAIAH/);
  assert.match(all,/NOW, FROM THIS BLUE DOT TO THE NEXT BLUE DOT, ISAIAH/);
  assert.match(all,/not.*(?:original|wrote)|not.*marks in the Hebrew/i);
  assert.match(all,/Trinitarian/i);
});

test('Genesis 1:1 through 12 is represented without missing verses', () => {
  for(let verse=1;verse<=12;verse++) assert.ok(lesson.verses.some(v=>v.ref==='Genesis 1:'+verse&&v.text),'Missing Genesis 1:'+verse);
  const oneness=lesson.slides.slice(0,lesson.slides.findIndex(s=>s.title.startsWith('HOLINESS ·')));
  for(const ref of ['Genesis 1:1–3','Genesis 1:4–6','Genesis 1:7–9','Genesis 1:10–12','Isaiah 44:24']) assert.ok(oneness.some(s=>s.ref===ref),ref);
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

test('study and Apostolic Guide QR cards are projected at opening and dismissal', () => {
  const resourceSlides=lesson.slides.map((s,i)=>({s,i})).filter(x=>x.s.type==='resources');
  assert.equal(resourceSlides.length,2);
  assert.equal(resourceSlides[0].i,1,'Dedicated join slide should follow cover');
  assert.equal(resourceSlides[1].i,lesson.slides.length-1,'Study links should remain on final slide');
  assert.equal(lesson.slides[0].type,'cover');
  assert.match(resourceSlides[0].s.title,/SCAN TO JOIN/);
  assert.match(resourceSlides[1].s.title,/KEEP STUDYING/);
  const introNotes=lesson.manuscript[1].html;
  assert.ok(introNotes.includes('https://theministry.vercel.app/class?lesson='+lesson.id));
  assert.match(introNotes,/https:\/\/apostolicguide\.com\//);
  const engine=load('engine/engine.js');
  const css=load('engine/engine.css');
  assert.match(engine,/const classUrl=\(\)=>location\.origin\+'\/class'\+\(lesson\?\.id\?'\?lesson='\+encodeURIComponent\(lesson\.id\)/);
  assert.match(engine,/const GUIDE_URL='https:\/\/apostolicguide\.com\/'/);
  assert.match(engine,/if\(s\.type==='resources'\)/);
  assert.match(engine,/resourceQrCards\(true\)/);
  assert.match(engine,/resourceQrCards\(false\)/);
  assert.match(css,/resource-qr-large \.resource-qr-image/);
  assert.match(css,/resource-qr-url/);
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
