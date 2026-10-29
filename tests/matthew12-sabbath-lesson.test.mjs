import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const lesson=JSON.parse(read('content/matthew-12-lord-of-the-sabbath-lesson-1.json'));
const supplied=JSON.parse(read('content/matthew-12-lesson-1-rvr1960-supplied.json'));
const library=JSON.parse(read('lesson-library.json'));
const engine=read('engine/engine.js');
const escapeHtml=x=>String(x||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slice=(from,to)=>{
 const start=engine.indexOf(from),end=engine.indexOf(to,start);
 assert.ok(start>=0&&end>start,from+' missing from engine');
 return engine.slice(start,end);
};
function renderHarness(){
 const state={slide:0,started:true,language:'en'};
 const fn=slice('function slideHtml(raw,withQr=true,language=state.language){','function normalizeScripture(v){')+
  '\n'+slice('function sermonSpanishSideSlide(s){','function sideTvExplanationHtml(note){')+
  '\n({slideHtml,sermonSpanishSideSlide})';
 const functions=new Script(fn).runInNewContext({
  state,lesson,esc:escapeHtml,clean:x=>String(x||''),slides:()=>lesson.slides,isMirroredSermon:()=>true,
  localizedSlide:(slide,lang)=>lang==='es'?{...slide,...slide.es,_english:slide}:slide,
  hasSpanishSlide:()=>true,resourceQrCards:()=>'',titleOf:s=>s.title||s.ref||s.kicker
 });
 return {state,...functions};
}
test('registered as Matthew chapter 12 lesson 1 without replacing live default',()=>{
 assert.equal(lesson.id,'matthew-12-lord-of-the-sabbath-lesson-1');
 assert.equal(lesson.series,'Matthew Chapter 12');
 assert.equal(lesson.sequence,'Lesson 1');
 assert.equal(lesson.sideTvSpanishMirror,true);
 assert.equal(library.lessons.filter(l=>l.id===lesson.id).length,1);
 assert.equal(library.lessons.find(l=>l.id===lesson.id).engineSource,'/content/'+lesson.id+'.json');
 assert.notEqual(library.latest,lesson.id);
 assert.equal(lesson.polls.length,0);
});

test('every original paragraph and heading survives in unmodified manuscript source, 83 ordered iPad cues',()=>{
 assert.ok(lesson.manuscriptSourceMd.startsWith('# THE LORD OF THE SABBATH'));
 assert.ok(lesson.manuscriptSourceMd.endsWith('while refusing to learn from the mercy of the Lord who gives rest.**'));
 assert.equal(lesson.manuscriptSourceLength,lesson.manuscriptSourceMd.length);
 assert.equal(lesson.slides.length,83);
 assert.equal(lesson.manuscript.length,83);
 assert.equal(lesson.slideScriptures.length,83);
 const html=lesson.manuscript.map((m,i)=>{
   assert.equal(m.slide,i);
   assert.ok(m.html.length>0,'Empty iPad manuscript cue '+i);
   return m.html;
 }).join('');
 for(const text of [
  'Jesus is offering something greater than physical rest',
  'A yoke represents service and submission',
  'The Sabbath was not something the Pharisees invented',
  'There was no ordinary bread available',
  'Their service did not make them guilty',
  'God was not rejecting the sacrificial system',
  'He is not merely giving His opinion concerning the Law',
  'If they recognized the importance of rescuing an animal',
  'They condemned an act of restoration',
  'A bruised reed is already weakened',
  'The One who calls us to obedience',
  'Because we cannot claim to know the Lord of the Sabbath'
 ])assert.ok(html.includes(text),'A manuscript point is missing: '+text);
 assert.equal((html.match(/class="ih-scripture"/g)||[]).length,34);
});

test('all teaching slides have English/Spanish content and eight teaching lists reveal cumulatively',()=>{
 const points=lesson.slides.filter(s=>s.type==='points');
 assert.equal(points.length,24);
 assert.equal(lesson.slides.filter(s=>s.type==='verse').length,18);
 for(const [i,s] of lesson.slides.entries()){
  assert.ok(s.es,'Spanish missing on cue '+i);
  assert.ok(s.es.title||s.es.text,'Spanish title and verse missing on cue '+i);
  if(s.type==='points'){
   assert.equal(s.points.length,s.es.points.length,'Different reveal sizes on cue '+i);
   assert.match(s.kicker,/ · POINT [123]\/3$/);
   assert.match(s.es.kicker,/ · PUNTO [123]\/3$/);
  }
 }
 for(let i=0;i<points.length;i+=3){
  for(let n=1;n<=3;n++){
   assert.equal(points[i+n-1].points.length,n);
   assert.deepEqual(points[i+n-1].points,[...points[i+2].points.slice(0,n)]);
   assert.deepEqual(points[i+n-1].es.points,[...points[i+2].es.points.slice(0,n)]);
  }
 }
});

test('every user-supplied RVR1960 passage is available without an API request, 43 exact Spanish verses',()=>{
 assert.equal(supplied.passages.length,18);
 assert.equal(lesson.verses.length,43);
 assert.equal(lesson.verses.filter(v=>v.spanishSource==='RVR1960'&&v.text_en&&v.text_es).length,43);
 for(const group of supplied.passages){
  const m=group.ref.match(/:(\d+)(?:-(\d+))?$/);
  assert.ok(m,'Invalid passage reference '+group.ref);
  const start=Number(m[1]),end=Number(m[2]||m[1]);
  const matched=lesson.verses.filter(v=>v.ref.startsWith(group.ref.replace(/:\d+(?:-\d+)?$/,':'))&&
    Number(v.ref.split(':').pop())>=start&&Number(v.ref.split(':').pop())<=end);
  assert.equal(matched.length,end-start+1,'Missing supplied passage '+group.ref);
  const assembled=matched.sort((a,b)=>Number(a.ref.split(':').pop())-Number(b.ref.split(':').pop()))
   .map(v=>(start===end?'':v.ref.split(':').pop()+' ')+v.text_es).join(' ');
  assert.equal(assembled,group.text_es,'Supplied RVR1960 modified: '+group.ref);
 }
 assert.ok(lesson.spanishCopyrightNotice.includes('Reina-Valera 1960'));
});

test('each KJV projector cue has a matched RVR1960 Spanish side-TV verse cue',()=>{
 const {state,slideHtml,sermonSpanishSideSlide}=renderHarness();
 for(const [index,s] of lesson.slides.entries()){
   state.slide=index;
   const en=slideHtml(s,true,'en'),es=sermonSpanishSideSlide(s);
   assert.match(es,/lang="es"/);
   const english=s.type==='verse'?s.ref:(s.title||s.ref||s.kicker),spanish=s.es.title||s.es.ref||s.es.kicker;
   assert.ok(en.includes(escapeHtml(english)),'English slide missing at '+index);
   assert.ok(es.includes(escapeHtml(spanish)),'Spanish slide missing at '+index);
   if(s.type==='verse'){
     assert.ok(en.includes('KJV'));
     assert.ok(es.includes('RVR1960'));
     assert.ok(es.includes(escapeHtml(s.es.text)),'Exact provided RVR text missing at '+index);
   }
   for(const p of s.es.points||[])assert.ok(es.includes(escapeHtml(p)),'Spanish reveal missing: '+p);
 }
});

test('side TVs never show a blanked/waiting scripture while current English cue advances',()=>{
 const start=engine.indexOf("if(view==='scriptures'){"),end=engine.indexOf("if(view==='confidence')renderConfidence();",start);
 assert.ok(start>=0&&end>start);
 const content=engine.slice(start,end),classes=new Set();
 const c={dataset:{},innerHTML:'',classList:{
  add(...items){items.forEach(i=>classes.add(i))},remove(...items){items.forEach(i=>classes.delete(i))},
  toggle(i,on){if(on)classes.add(i);else classes.delete(i)}
 }};
 const state={started:true,slide:0,seq:0,scriptureCueMode:'slide',sideScreenCleared:true,scriptureOutput:null,scriptureRevision:0};
 const env={view:'scriptures',lesson,state,ss:lesson.slides,s:lesson.slides[0],$:(id)=>id==='scripture-content'?c:null,
  isMirroredSermon:()=>true,scriptureHtml:v=>'RVR '+v.text_es,
  sermonSpanishSideSlide:s=>'<div lang="es">'+(s.es.title||s.es.ref||s.es.text)+'</div>',
  sideTvExplanationHtml:()=>'',trackSideScripture:()=>{}};
 const run=new Script('(()=>{'+content+'})()');
 for(let i=0;i<lesson.slides.length;i++){
  state.slide=i;state.seq++;env.s=lesson.slides[i];run.runInNewContext(env);
  assert.ok(c.innerHTML.includes(env.s.es.title||env.s.es.ref||env.s.es.text),'Spanish cue '+i+' not shown');
  assert.ok(classes.has('ih-slide-mode'));
  assert.doesNotMatch(c.innerHTML,/ESCRITURA DESPEJADA|ESPERANDO LA ESCRITURA/);
 }
 state.scriptureCueMode='manual';state.scriptureOutput={ref_en:'Matthew 12:8',text_es:'porque el Hijo del Hombre es Señor del día de reposo.'};state.scriptureRevision++;run.runInNewContext(env);
 assert.match(c.innerHTML,/porque el Hijo/);
 state.scriptureCueMode='slide';state.scriptureOutput=null;state.seq++;run.runInNewContext(env);
 assert.match(c.innerHTML,/No podemos afirmar/);
});

test('iPad timer, native renderer, full manuscript and 65-inch styles are connected',()=>{
 assert.match(engine,/function isMirroredSermon\(\)/);
 assert.match(engine,/lesson\?\.sideTvSpanishMirror===true/);
 assert.match(engine,/const val=sessionElapsedLabel\(elapsedSessionSeconds\(\)\)/);
 assert.match(engine,/sermonSpanishSideSlide\(currentSlide\)/);
 assert.match(engine,/if\(autoScripture&&!isMirroredSermon\(\)\)resolveSpanish/);
 assert.match(read('engine/index.html'),/engine\/matthew12\.css/);
 assert.match(read('engine/matthew12.css'),/body\[data-lesson="matthew-12-lord-of-the-sabbath-lesson-1"\] #scriptures/);
 const ipad=read('engine/ipad-console.js');
 assert.match(ipad,/lesson\.sideTvSpanishMirror===true/);
 assert.match(ipad,/ipad-scripture-tap/);
 assert.match(ipad,/data-ipad-inline-clear/);
});
