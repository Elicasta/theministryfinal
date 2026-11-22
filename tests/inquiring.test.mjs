import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const id='inquiring-2026-11-22',l=JSON.parse(read('content/'+id+'.json')),lib=JSON.parse(read('lesson-library.json')),spanish=JSON.parse(read('content/'+id+'-rvr1960-supplied.json')),css=read('engine/inquiring.css'),html=read('engine/index.html');
const pattern=/^(?:(?:1|2|3) )?[A-Za-z ]+ \\d+:\\d+(?:-\\d+)?$/;
test('archive routes and no new default',()=>{const x=lib.lessons.find(s=>s.id===id);assert.ok(x);assert.equal(x.engineSource,'/content/'+id+'.json');assert.notEqual(lib.latest,id);for(const a of ['presentation','projector','manuscript','scriptures','confidence','controller'])assert.ok(x.artifacts[a].endsWith('?lesson='+id));assert.ok(html.includes('/engine/inquiring.css'))});
test('no empty scriptures, no malformed references, all cues aligned',()=>{
 assert.equal(l.slides.length,39);assert.equal(l.slides.length,l.manuscript.length);assert.equal(l.slides.length,l.slideScriptures.length);
 for(const [i,s] of l.slides.entries()){
 assert.equal(l.manuscript[i].slide,i);assert.equal(l.manuscript[i].title,s.title);assert.ok(l.manuscript[i].html.length>55);assert.ok(s.es?.title);
 if(s.type==='verse'){assert.match(s.ref,pattern);assert.ok(s.text?.trim().length>20);assert.ok(s.es.text?.trim().length>15);assert.equal(l.slideScriptures[i].text_en,s.text);assert.equal(l.slideScriptures[i].text_es,s.es.text);assert.match(l.manuscript[i].html,/ih-scripture/)}
 else assert.equal(l.slideScriptures[i],null);
 }
});
test('Spanish verses and contextual Lord substitutions',()=>{
 assert.equal(Object.keys(spanish.versesByChapter['1 Samuel 30']).length,20);assert.equal(Object.keys(spanish.versesByChapter['Joshua 9']).length,25);
 assert.doesNotMatch(JSON.stringify(l),/Jehov[aá]/i);assert.doesNotMatch(JSON.stringify(spanish),/Jehov[aá]/i);
 for(const p of ['Fíate del Señor','Teme al Señor','David consultó al Señor','no consultaron al Señor','por el Señor, Dios de Israel','altar del Señor'])assert.ok(JSON.stringify(spanish).includes(p),'Missing '+p);
 for(const x of l.verses){assert.match(x.ref,pattern);assert.ok(x.text_en.trim()&&x.text_es.trim());assert.equal(spanish.passages[x.ref],x.text_es)}
 for(const ref of ['Proverbs 12:15','Proverbs 15:22','James 1:22','Acts 13:22','James 1:5','1 Samuel 30:1-20','Joshua 9:3-27','1 Samuel 23:1-5'])assert.ok(l.verses.some(x=>x.ref===ref));
 assert.equal(l.manuscriptSourceMd,read('content/standalone/inquiring/lesson.md'));
});
test('projector typography and verse density',()=>{
 assert.match(css,/p-verse\\{[^}]*font-size:clamp\\(2\\.25rem,3\\.12vw,4rem\\)/);
 assert.match(css,/points li\\{[^}]*font-size:clamp\\(2rem,2\\.8vw,3\\.6rem\\)/);
 assert.ok(l.slides.filter(x=>x.type==='verse').every(x=>x.text.length<400));
 assert.ok(l.slides.filter(x=>x.type==='points').every(x=>x.points.length<=5));
 assert.ok(l.sideTvSpanishMirror&&l.localRvr1960&&l.hideAudienceQr);
});
