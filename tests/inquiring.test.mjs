import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const id='inquiring-2026-11-22',l=JSON.parse(read('content/'+id+'.json'));
const lib=JSON.parse(read('lesson-library.json'));
const spanish=JSON.parse(read('content/'+id+'-rvr1960-supplied.json'));
const css=read('engine/inquiring.css'),js=read('engine/engine.js'),html=read('engine/index.html');
const pattern=/^(?:(?:1|2|3) )?[A-Za-z ]+ \d+:\d+(?:-\d+)?$/;
const parseRef=ref=>/^(.*?) (\d+):(\d+)(?:-(\d+))?$/.exec(ref);
test('lesson routes are registered without changing the default',()=>{
 const x=lib.lessons.find(s=>s.id===id);assert.ok(x);
 assert.equal(x.engineSource,'/content/'+id+'.json');assert.notEqual(lib.latest,id);
 for(const a of ['presentation','projector','manuscript','scriptures','confidence','controller'])
   assert.ok(x.artifacts[a].endsWith('?lesson='+id));
 assert.ok(html.includes('/engine/inquiring.css'));
});
test('all projector, Spanish and iPad cues remain synchronized',()=>{
 assert.equal(l.slides.length,50);assert.equal(l.slides.length,l.manuscript.length);
 assert.equal(l.slides.length,l.slideScriptures.length);
 for(const [i,s] of l.slides.entries()){
   assert.equal(l.manuscript[i].slide,i);assert.equal(l.manuscript[i].title,s.title);
   assert.ok(l.manuscript[i].html.length>55);assert.ok(s.es?.title);
   if(s.type==='verse'){
     assert.match(s.ref,pattern);assert.ok(s.text?.trim().length>20);
     assert.ok(s.es.text?.trim().length>15);
     assert.equal(l.slideScriptures[i].text_en,s.text);
     assert.equal(l.slideScriptures[i].text_es,s.es.text);
     assert.match(l.manuscript[i].html,/ih-scripture/);
   }else assert.equal(l.slideScriptures[i],null);
 }
 assert.ok(l.slides.filter(x=>x.type==='verse').every(x=>x.text.length<=240&&x.es.text.length<=240));
});
test('Spanish source, Lord adaptation and safely paginated Scripture bank',()=>{
 assert.equal(Object.keys(spanish.versesByChapter['1 Samuel 30']).length,20);
 assert.equal(Object.keys(spanish.versesByChapter['Joshua 9']).length,25);
 assert.doesNotMatch(JSON.stringify(l),/Jehov[aá]/i);
 assert.doesNotMatch(JSON.stringify(spanish),/Jehov[aá]/i);
 for(const phrase of ['Fíate del Señor','Teme al Señor','David consultó al Señor','no consultaron al Señor','por el Señor, Dios de Israel','altar del Señor'])
   assert.ok(JSON.stringify(spanish).includes(phrase));
 assert.ok(l.scriptureBankSourceReferences.includes('1 Samuel 30:1-20'));
 assert.ok(l.scriptureBankSourceReferences.includes('Joshua 9:3-27'));
 assert.ok(l.verses.every(x=>Math.max(x.text_en.length,x.text_es.length)<=350));
 assert.ok(!l.verses.some(x=>['1 Samuel 30:1-20','Joshua 9:3-27'].includes(x.ref)));
 for(const v of l.verses){
   assert.match(v.ref,pattern);assert.ok(v.text_en.trim()&&v.text_es.trim());
   const m=parseRef(v.ref);
   assert.equal(v.text_es,spanish.passages[v.ref]||((m&&!m[4])?m[3]+' '+spanish.versesByChapter[m[1]+' '+m[2]]?.[m[3]]:''));
 }
 for(const ref of ['1 Samuel 30:1','1 Samuel 30:20','Joshua 9:3','Joshua 9:27','Proverbs 12:15','James 1:22'])
   assert.ok(l.verses.some(x=>x.ref===ref));
 assert.equal(l.manuscriptSourceMd,read('content/standalone/inquiring/lesson.md'));
});
test('paragraph Scripture rendering, centered titles, legible type, uniform bullets and cool blue palette',()=>{
 assert.match(js,/const scriptureParagraph=s=>/);
 assert.match(js,/esc\(scriptureParagraph\(s\.text\|\|''\)\)/);
 assert.match(js,/esc\(scriptureParagraph\(spanish\)\)/);
 assert.match(js,/esc\(scriptureParagraph\(sc\.text_en\)\)/);
 assert.match(css,/white-space:normal/);
 assert.match(css,/text-align:center/);
 assert.match(css,/align-items:center/);
 assert.match(css,/p-verse\{[\s\S]*?font-size:clamp\(2\.5rem,3\.35vw,4\.4rem\)/);
 assert.match(css,/points li:last-child\{[\s\S]*?background:transparent!important/);
 assert.ok(css.includes('#071224')&&css.includes('#7ed5ff'));
});
