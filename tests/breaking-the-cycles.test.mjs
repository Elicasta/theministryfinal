import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const id = 'breaking-the-cycles-2026-11-12';
const lesson = JSON.parse(read('content/' + id + '.json'));
const library = JSON.parse(read('lesson-library.json'));
const html = read('engine/index.html');
const engine = read('engine/engine.js');

const passages = [
  ['Ephesians 4:22–24', 'Efesios 4:22-24', 3],
  ['Judges 2:18–19', 'Jueces 2:18-19', 2],
  ['Haggai 1:5–7', 'Hageo 1:5-7', 3],
  ['Micah 7:8–9', 'Miqueas 7:8-9', 2],
  ['Isaiah 43:18–19', 'Isaías 43:18-19', 2],
  ['Deuteronomy 30:19–20', 'Deuteronomio 30:19-20', 2],
  ['Galatians 6:9', 'Gálatas 6:9', 1],
];

test('the new one-off is registered as the latest live iPad manuscript and slide deck', () => {
  assert.equal(library.latest, id);
  const entries = library.lessons.filter(x => x.id === id);
  assert.equal(entries.length, 1);
  const entry = entries[0];
  assert.equal(entry.series, 'Standalone Lessons');
  assert.equal(entry.sequence, 'One-off');
  assert.equal(entry.status, 'ready');
  assert.equal(entry.engineSource, '/content/' + id + '.json');
  for (const route of ['presentation', 'projector', 'manuscript', 'controller', 'scriptures', 'confidence'])
    assert.equal(entry.artifacts[route].split('?lesson=')[1], id);
  assert.ok(html.includes('/presenter?lesson=' + id));
});

test('all 18 cues carry full presenter notes and remain aligned with the projector', () => {
  assert.equal(lesson.slides.length, 18);
  assert.equal(lesson.manuscript.length, 18);
  assert.equal(lesson.slideScriptures.length, 18);
  assert.equal(lesson.slides[0].type, 'cover');
  assert.equal(lesson.slides.at(-1).closingDeclaration, true);
  assert.equal(lesson.slides.filter(s => s.type === 'verse').length, 7);
  for (let i = 0; i < lesson.slides.length; i++) {
    assert.equal(lesson.manuscript[i].slide, i);
    assert.equal(lesson.manuscript[i].title, lesson.slides[i].title);
    assert.ok(lesson.manuscript[i].html.length > 20, 'Missing presenter notes for cue ' + i);
    assert.ok(lesson.slides[i].es, 'Missing Spanish slide text for cue ' + i);
  }
  for (const heading of ['Recognize the Cycle', 'Forgive Yourself', 'Commit to a New Way'])
    assert.ok(lesson.manuscriptSourceMd.includes(heading));
  assert.ok(lesson.manuscriptSourceMd.includes("And this time, I'm not going back."));
});

test('every supplied RVR1960 passage is aligned word-for-word with KJV passage and bank verses', () => {
  assert.equal(lesson.spanishSource, 'RVR1960');
  assert.equal(lesson.suppliedSpanishPassages.length, 7);
  assert.equal(lesson.localRvr1960, true);
  assert.match(lesson.spanishCopyrightNotice, /Sociedades Bíblicas Unidas, 1988/);
  assert.equal(lesson.verses.length, 15);
  for (const [en, es, count] of passages) {
    const slideIndex = lesson.slides.findIndex(s => s.type === 'verse' && s.ref === en);
    assert.notEqual(slideIndex, -1, 'Missing Scripture slide ' + en);
    const slide = lesson.slides[slideIndex];
    const map = lesson.slideScriptures[slideIndex];
    assert.equal(map.ref_en, en);
    assert.equal(map.ref_es, es);
    assert.equal(map.text_en, slide.text);
    assert.equal(map.text_es, slide.es.text);
    assert.equal(map.spanishStatus, 'ready');
    assert.equal(lesson.suppliedSpanishPassages.find(p => p.ref === es).verses.length, count);
    assert.equal(slide.es.text.split('\n').length, count);
  }
  const expectedRvr = {
    'Efesios 4:22':'En cuanto a la pasada manera de vivir, despojaos del viejo hombre, que está viciado conforme a los deseos engañosos,',
    'Jueces 2:19':'Mas acontecía que al morir el juez, ellos volvían atrás, y se corrompían más que sus padres, siguiendo a dioses ajenos para servirles, e inclinándose delante de ellos; y no se apartaban de sus obras, ni de su obstinado camino.',
    'Hageo 1:5':'Pues así ha dicho Jehová de los ejércitos: Meditad bien sobre vuestros caminos.',
    'Miqueas 7:8':'Tú, enemiga mía, no te alegres de mí, porque aunque caí, me levantaré; aunque more en tinieblas, Jehová será mi luz.',
    'Isaías 43:19':'He aquí que yo hago cosa nueva; pronto saldrá a luz; ¿no la conoceréis? Otra vez abriré camino en el desierto, y ríos en la soledad.',
    'Deuteronomio 30:20':'amando a Jehová tu Dios, atendiendo a su voz, y siguiéndole a él; porque él es vida para ti, y prolongación de tus días; a fin de que habites sobre la tierra que juró Jehová a tus padres, Abraham, Isaac y Jacob, que les había de dar.',
    'Gálatas 6:9':'No nos cansemos, pues, de hacer bien; porque a su tiempo segaremos, si no desmayamos.'
  };
  for (const [ref, text] of Object.entries(expectedRvr))
    assert.equal(lesson.verses.find(v => v.ref_es === ref)?.text_es, text);
});

test('scripture TVs remain under manual tech control; audience participation is off', () => {
  assert.equal(lesson.scriptureManualOnly, true);
  assert.equal(lesson.audienceParticipation, false);
  assert.equal(lesson.hideAudienceQr, true);
  assert.equal(lesson.polls.length, 0);
  assert.equal(lesson.prompts.length, 0);
  assert.equal(lesson.sideTvSpanishMirror, false);
  assert.match(engine, /lesson\?\.scriptureManualOnly\?null:scriptureForSlide\(t\)/);
});

test('older stable and existing sermon entries remain indexed unchanged', () => {
  const prior = library.lessons.find(l => l.id === 'how-to-endure-to-the-end-2026-11-05');
  assert.equal(prior.artifacts.presentation, '/presenter?lesson=how-to-endure-to-the-end-2026-11-05');
  assert.equal(prior.engineSource, '/content/how-to-endure-to-the-end-2026-11-05-slides.json');
  assert.ok(library.rules.stableBuildsAreImmutable);
});
