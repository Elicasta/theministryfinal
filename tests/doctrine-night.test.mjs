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

test('slide cues expose poll launch, results and close on the iPad only', () => {
  const engine=load('engine/engine.js');
  const ipad=load('engine/ipad-console.js');
  const css=load('engine/ipad-console.css');
  const html=load('engine/index.html');
  assert.equal(lesson.polls.length,11,'All eleven poll cues must remain attached to study slides');
  assert.equal(new Set(lesson.polls.map(p=>p.cueSlide)).size,lesson.polls.length,'One poll per teaching cue');
  for(const p of lesson.polls){
    assert.ok(lesson.slides[p.cueSlide],'Poll is attached to a missing slide: '+p.id);
    assert.equal(p.cue,'Slide '+(p.cueSlide+1));
  }
  assert.match(engine,/function pollsForSlide\(index\)/);
  assert.match(engine,/pollsForSlide\(i\)\.map\(p=>notePollHtml\(p,i\)\)/);
  assert.match(engine,/function notePollHtml\(p,slideIndex\)/);
  for(const action of ['data-ipad-poll-cue-launch','data-ipad-poll-results','data-ipad-poll-close','data-note-poll-status'])
    assert.ok(engine.includes(action),'Manuscript cue missing '+action);
  assert.match(engine,/function renderPresenterLive\(\)/);
  assert.match(engine,/launch\.disabled=liveQuestion/);
  assert.match(engine,/results\.disabled=!active\|\|liveResults/);
  assert.match(engine,/close\.disabled=!active/);
  assert.match(html,/id="ipad-current-poll"/);
  assert.match(ipad,/\$\('ipad-current-poll'\)\?\.addEventListener\('click'/);
  assert.match(ipad,/api\.go\(cueSlide\)/);
  assert.match(ipad,/api\.launchPoll\(el\.dataset\.ipadPollCueLaunch\)/);
  assert.match(ipad,/api\.showPollResults\(id\)/);
  assert.match(ipad,/api\.closePoll\(id\)/);
  assert.match(ipad,/quick\.dataset\.pollAction=/);
  assert.match(css,/\.note-poll-actions/);
  assert.match(css,/\.ipad-poll-toolbar\[hidden\]/);
  assert.ok(!engine.includes('notePollHtml(p,slideIndex)} on projector'),'Poll controls must remain presenter-only');
});

test('iPad navigation stays inside right sidebar and does not obstruct manuscript', () => {
  const html=load('engine/index.html');
  const css=load('engine/ipad-console.css');
  const ipad=load('engine/ipad-console.js');
  const presenter=html.slice(html.indexOf('<div id="presenter"'),html.indexOf('<div id="projector"'));
  const asideStart=presenter.indexOf('<aside class="ipad-sidebar"');
  const navStart=presenter.indexOf('<section class="ipad-nav-panel"');
  const navEnd=presenter.indexOf('</section>',navStart);
  const sessionStart=presenter.indexOf('class="ipad-side-intro"');
  const manuscriptStart=presenter.indexOf('<main id="manuscript"');
  assert.ok(asideStart>manuscriptStart,'Manuscript should precede right-side control rail');
  assert.ok(navStart>asideStart,'Nav card must be nested inside sidebar, not above the manuscript');
  assert.ok(navEnd<sessionStart,'Nav card should be at the top of the right sidebar');
  assert.ok(!presenter.includes('class="ipad-transport"'),'Obstructive full-width toolbar must be removed');
  assert.equal((presenter.match(/id="ipad-next"/g)||[]).length,1);
  for(const id of ['ipad-prev','ipad-next','ipad-clear','ipad-current-poll','ipad-cue-num','ipad-cue-title','ipad-cue-next','ipad-sync']){
    assert.ok(presenter.slice(navStart,navEnd).includes('id="'+id+'"'),id+' must be inside the nav card');
  }
  assert.match(css,/#presenter \.ipad-nav-panel\{position:sticky/);
  assert.match(css,/#presenter \.ipad-nav-panel #ipad-cue-title\{[^\n]*color:#2c2823/);
  assert.match(css,/#presenter \.ipad-manuscript \.note-section\{scroll-margin-top:90px/);
  assert.match(css,/#presenter \.ipad-nav-actions \.ipad-poll-toolbar\{/);
  assert.match(ipad,/\$\('ipad-prev'\)\?\.addEventListener/);
  assert.match(ipad,/\$\('ipad-next'\)\?\.addEventListener/);
  assert.match(ipad,/\$\('ipad-clear'\)\?\.addEventListener/);
});

test('confidence timer starts at first slide, continues, and resets on taking slide one again', () => {
  const engine=load('engine/engine.js');
  const goStart=engine.indexOf('function go(i){');
  const goEnd=engine.indexOf('function next(){',goStart);
  assert.ok(goStart>0&&goEnd>goStart);
  let now=1000;
  const state={started:false,startedAt:null,timerStoppedAt:null,slide:0};
  const go=new Script(engine.slice(goStart,goEnd)+'\n go;')
    .runInNewContext({
      state,
      slides:()=>[{}, {}, {}],
      Date:{now:()=>now},
      scriptureForSlide:()=>null,
      send:()=>{},render:()=>{}
    });
  go(0);
  assert.equal(state.startedAt,1000);
  now=4200;go(1);
  assert.equal(state.startedAt,1000,'Advancing normally must not reset timer');
  now=8400;go(2);
  assert.equal(state.startedAt,1000);
  now=10000;go(0);
  assert.equal(state.startedAt,10000,'Returning to first slide must reset timer');
  now=11000;go(1);
  assert.equal(state.startedAt,10000,'Second advance must continue new timer');
  assert.match(engine,/setInterval\(\(\)=>\{if\(view==='confidence'\)tick\(\)\},500\)/);
});

test('all 39 Doctrine Night verses include verified manually stored RVR1960 Spanish and KJV English', () => {
  assert.equal(lesson.verses.length,39);
  assert.match(lesson.spanishCopyrightNotice,/Reina-Valera 1960/);
  assert.match(lesson.spanishCopyrightNotice,/Sociedades Bíblicas Unidas/);
  for(const v of lesson.verses){
    assert.ok(v.text_en||v.text,'Missing English for '+v.ref);
    assert.ok(v.text_es&&v.text_es.length>15,'Missing Spanish for '+v.ref);
    assert.ok(v.ref_es&&/\\d+:\\d+/.test(v.ref_es),'Missing Spanish reference for '+v.ref);
    assert.equal(v.translation_es,'RVR1960');
  }
  assert.equal(lesson.verses.find(x=>x.ref==='Deuteronomy 6:4').text_es,
    'Oye, Israel: Jehová nuestro Dios, Jehová uno es.');
  assert.match(lesson.verses.find(x=>x.ref==='Isaiah 48:16').text_es,/y ahora me envió Jehová el Señor, y su Espíritu/);
  assert.match(lesson.verses.find(x=>x.ref==='Genesis 19:24').text_es,/de parte de Jehová desde los cielos/);
  assert.match(lesson.verses.find(x=>x.ref==='Acts 2:38').text_es,/en el nombre de Jesucristo/);
  for(let v=1;v<=12;v++)assert.ok(lesson.verses.find(x=>x.ref==='Genesis 1:'+v)?.text_es);
});

test('side TVs render locally stored Spanish even if last synced state has only KJV', () => {
  const engine=load('engine/engine.js');
  const refScript=load('engine/spanish-ref.js');
  const html=load('engine/index.html');
  const context={window:{}};
  new Script(refScript).runInNewContext(context);
  const translate=context.window.MinistrySpanishRef;
  for(const [en,es] of [
    ['Genesis 1:26','Génesis 1:26'],
    ['Isaiah 48:16','Isaías 48:16'],
    ['John 1:1','Juan 1:1'],
    ['Acts 2:38','Hechos 2:38'],
    ['1 Corinthians 11:10','1 Corintios 11:10']
  ])assert.equal(translate(en),es);
  assert.match(html,/src="\\/engine\\/spanish-ref\\.js"/);
  const first=engine.indexOf('function scriptureHtml(v){');
  const last=engine.indexOf('function projectorScriptureHtml(v){',first);
  assert.ok(first>0&&last>first);
  const scriptureHtml=new Script(engine.slice(first,last)+'\\n scriptureHtml;').runInNewContext({
    normalizeScripture:v=>({...v,ref_es:v.ref_es||translate(v.ref_en)}),
    verses:()=>lesson.verses,
    lesson,
    esc:value=>String(value||'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]))
  });
  const stale={ref_en:'Deuteronomy 6:4',ref_es:'Deuteronomio 6:4',text_en:'Hear, O Israel: The LORD our God is one LORD:',text_es:''};
  const result=scriptureHtml(stale);
  assert.match(result,/Oye, Israel: Jehová nuestro Dios, Jehová uno es/);
  assert.match(result,/Hear, O Israel/);
  assert.match(result,/Reina-Valera 1960/);
  assert.doesNotMatch(result,/no disponible|Conecte la fuente|Cargando/);
  assert.match(engine,/if\\(c\\.dataset\\.scriptureKey!==key\\)/,'Unrelated state changes must not flicker the Scripture screen');
  assert.match(engine,/scriptureOutput=null;send\\(\\);render\\(\\)/);
  const handle=engine.slice(engine.indexOf('async function handle(msg){'),engine.indexOf('function send(){'));
  assert.doesNotMatch(handle,/scriptureForSlide/,'Synchronization must not resurrect a cleared Scripture');
  assert.doesNotMatch(engine,/api\\/scripture-rvr1960|queueSpanishVerse|spanishVersePending/);
  assert.match(html,/href="\\/scriptures" target="_blank" rel="noopener">Scripture TVs/);
});

test('confidence monitor has live status, complete manuscript, and stable scroll', () => {
  const html=load('engine/index.html'),engine=load('engine/engine.js'),css=load('engine/engine.css');
  assert.match(html,/id="conf-sync"/);
  assert.match(html,/id="conf-notes"/);
  assert.match(html,/id="conf-poll"/);
  assert.match(engine,/const m=lesson\?\.manuscript\?\.\[idx\]/);
  assert.match(engine,/notes\?\.dataset\.noteKey!==key/);
  assert.match(engine,/notes\.appendChild\(parsed\.content\)/);
  assert.match(engine,/\$\('conf-sync'\)\.dataset\.live=/);
  assert.match(css,/#confidence \.conf-notes-text\{[^\n]*overflow-y:auto/);
  assert.match(html, /href="\/confidence" target="_blank" rel="noopener">Confidence/);
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
