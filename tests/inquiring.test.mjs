import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const id='inquiring-2026-11-22',lesson=JSON.parse(read('content/'+id+'.json')),lib=JSON.parse(read('lesson-library.json')),spanish=JSON.parse(read('content/'+id+'-rvr1960-supplied.json')),css=read('engine/inquiring.css'),html=read('engine/index.html');
test('lesson is listed without replacing last stable live default',()=>{
 const row=lib.lessons.find(x=>x.id===id);assert.ok(row);assert.equal(row.status,'ready');assert.equal(row.engineSource,'/content/'+id+'.json');assert.notEqual(lib.latest,id);
 for(const k of ['presentation','projector','manuscript','controller','scriptures','confidence'])assert.ok(row.artifacts[k].endsWith('?lesson='+id));
 assert.ok(html.includes('/engine/inquiring.css'));assert.ok(html.includes('/presenter?lesson='+id));
});
test('each projector cue has full aligned iPad notes and translated slide',()=>{
 assert.equal(lesson.slides.length,lesson.manuscript.length);assert.equal(lesson.slides.length,lesson.slideScriptures.length);assert.ok(lesson.slides.length>=30);
 lesson.slides.forEach((s,i)=>{assert.equal(lesson.manuscript[i].slide,i);assert.equal(lesson.manuscript[i].title,s.title);assert.ok(lesson.manuscript[i].html.length>60);assert.ok(s.es?.title);
 if(s.type==='verse'){assert.equal(lesson.slideScriptures[i].text_en,s.text);assert.equal(lesson.slideScriptures[i].text_es,s.es.text);assert.match(lesson.manuscript[i].html,/ih-scripture/)}else assert.equal(lesson.slideScriptures[i],null)});
});
test('supplied Spanish passages intact except contextual Señor substitutions',()=>{
 assert.equal(Object.keys(spanish.versesByChapter['1 Samuel 30']).length,20);
 assert.equal(Object.keys(spanish.versesByChapter['Joshua 9']).length,25);
 assert.match(lesson.spanishVersionLabel,/1960.*Señor/);
 assert.doesNotMatch(JSON.stringify(spanish),/Jehová/i);assert.doesNotMatch(JSON.stringify(lesson),/Jehová/i);
 for(const part of ['Fíate del Señor','Teme al Señor','David consultó al Señor','no consultaron al Señor','por el Señor, Dios de Israel','altar del Señor'])assert.ok(JSON.stringify(spanish).includes(part));
 for(const r of lesson.verses){assert.ok(r.text_en&&r.text_es);assert.equal(r.spanishSource,'RVR1960-adapted')}
 assert.equal(lesson.sideTvSpanishMirror,true);assert.equal(lesson.audienceParticipation,false);assert.equal(lesson.hideAudienceQr,true);
});
test('scripture is large on projector and stories are in the bank',()=>{
 assert.match(css,/p-verse\{[^}]*font-size:clamp\(2\.25rem,3\.12vw,4rem\)/);
 assert.match(css,/points li\{[^}]*font-size:clamp\(2rem,2\.8vw,3\.6rem\)/);
 assert.ok(lesson.slides.filter(s=>s.type==='verse').every(s=>s.text.length<650));
 assert.ok(lesson.slides.filter(s=>s.type==='points').every(s=>s.points.length<=5));
 for(const ref of ['1 Samuel 30:1-20','Joshua 9:3-27','1 Samuel 23:1-5','Proverbs 3:5-7','James 1:5'])assert.ok(lesson.verses.some(r=>r.ref===ref));
 assert.equal(lesson.manuscriptSourceMd,read('content/standalone/inquiring/lesson.md'));
});
