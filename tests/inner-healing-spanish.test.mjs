import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const lesson=JSON.parse(read('content/inner-healing-2026-10-25.json'));
const engine=read('engine/engine.js');
const escapeHtml=x=>String(x||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slice=(start,end)=>{const a=engine.indexOf(start),b=engine.indexOf(end,a);assert.ok(a!==-1&&b>a,start+' not found');return engine.slice(a,b);};
const renderFunctions=slice('function slideHtml(raw,withQr=true,language=state.language){','function normalizeScripture(v){')+
  '\n'+slice('function sermonSpanishSideSlide(s){','function sideTvExplanationHtml(note){')+
  '\n ({slideHtml,sermonSpanishSideSlide});';
function runRender(){
  const state={language:'en',slide:0};
  const render=new Script(renderFunctions).runInNewContext({
    lesson,state,esc:escapeHtml,clean:x=>String(x||''),slides:()=>lesson.slides,
    localizedSlide:(s,lang)=>lang==='es'?{...s,...s.es,_english:s}:s,
    hasSpanishSlide:()=>true,resourceQrCards:()=>'',titleOf:s=>s.title||s.ref||s.kicker
  });
  return {state,...render};
}
test('52 authored Spanish cues cover every slide type and cumulative reveal',()=>{
  assert.equal(lesson.slides.length,52);
  const types=new Set();
  for(const [index,s] of lesson.slides.entries()){
    assert.ok(s.es,'Missing Spanish cue '+index);
    if(s.type!=='cover')assert.ok(s.es.kicker,'Missing Spanish kicker '+index);
    types.add(s.type);
    for(const key of ['title','sub','text','left','right']){
      if(s[key])assert.ok(s.es[key],`Cue ${index} ${key} is not translated`);
    }
    for(const key of ['points','steps','words']){
      if(s[key])assert.equal(s.es[key]?.length,s[key].length,`Cue ${index} ${key} is out of sync`);
    }
  }
  assert.ok(['cover','statement','verse','points','steps','contrast','progression'].every(x=>types.has(x)));
  assert.deepEqual([...lesson.slides[4].es.points],['Resentimiento']);
  assert.equal(lesson.slides[6].es.points.length,3);
  assert.equal(lesson.slides[21].es.points.length,4);
});
test('all 38 supplied sermon Scripture passages are saved as RVR1960 with publisher notice',()=>{
  assert.equal(lesson.verses.length,38);
  assert.match(lesson.spanishSource,/RVR1960/);
  assert.match(lesson.spanishCopyrightNotice,/Sociedades Bíblicas en América Latina, 1960/);
  assert.match(lesson.spanishCopyrightNotice,/Sociedades Bíblicas Unidas, 1988/);
  for(const [i,v] of lesson.verses.entries()){
    assert.ok(v.ref_en&&v.ref_es,'Missing translated verse reference '+i);
    assert.ok(v.text_en&&v.text_es,'Missing translated verse text '+i);
    assert.equal(v.spanishSource,'RVR1960');
    assert.equal(v.spanishStatus,'ready');
    assert.equal(v.copyright,lesson.spanishCopyrightNotice);
  }
  for(const s of lesson.slides.filter(x=>x.type==='verse')){
    const b=lesson.verses.find(v=>v.ref_en===s.ref);
    assert.equal(s.es.text,b.text_es);
  }
});
test('main projector stays English while side output shows each localized Spanish cue',()=>{
  const {state,slideHtml,sermonSpanishSideSlide}=runRender();
  for(let i=0;i<lesson.slides.length;i++){
    state.slide=i;
    const main=slideHtml(lesson.slides[i],true,'en');
    const side=sermonSpanishSideSlide(lesson.slides[i]);
    const es=lesson.slides[i].es;
    assert.match(side,/lang="es"/);
    const mainTitle=lesson.slides[i].title||lesson.slides[i].ref;
    const sideTitle=es.title||es.ref||es.kicker;
    assert.ok(main.includes(escapeHtml(mainTitle)),`English main missing on cue ${i}`);
    assert.ok(side.includes(escapeHtml(sideTitle)),`Spanish side missing on cue ${i}`);
    if(es.points)for(const item of es.points)assert.ok(side.includes(escapeHtml(item)),`Point missing on cue ${i}`);
    if(es.steps)for(const item of es.steps)assert.ok(side.includes(escapeHtml(item)),`Step missing on cue ${i}`);
    if(es.words)for(const item of es.words)assert.ok(side.includes(escapeHtml(item)),`Diagram item missing on cue ${i}`);
  }
  const {slideHtml:renderSlide}=runRender();
  assert.ok(!renderSlide(lesson.slides[6],false,'en').includes('Ciclos que se repiten'));
  assert.ok(renderSlide(lesson.slides[6],false,'es').includes('Ciclos que se repiten'));
});
test('manuscript stays full-length, English, and unchanged by translation',()=>{
  assert.equal(lesson.manuscript.length,52);
  const text=lesson.manuscript.map((m,i)=>{
    assert.equal(m.slide,i);
    assert.ok(m.html.length>20);
    return m.html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  }).join(' ');
  assert.equal(text.split(/\s+/).length,4721);
  for(const p of ['You can be delivered from the thing that hurt you','David spared Saul, but he didn’t immediately go back','Forgiveness didn’t automatically restore the bone','Come to the healer this morning.'])
    assert.ok(text.includes(p),'Missing original section: '+p);
});
test('side screen uses cue number in render key, independent of Scripture output',()=>{
  assert.match(engine,/if\(lesson\?\.id==='inner-healing-2026-10-25'\)\{/);
  assert.match(engine,/state\.started,state\.slide,state\.seq,/);
  assert.match(engine,/sermonSpanishSideSlide\(currentSlide\)/);
  assert.match(engine,/state\.scriptureCueMode='slide'/);
  assert.match(engine,/state\.scriptureCueMode='manual'/);
  assert.match(engine,/state\.sideScreenCleared=false/);
  assert.match(engine,/if\(lesson\?\.id!=='inner-healing-2026-10-25'\)resolveSpanish/);
  assert.doesNotThrow(()=>new Script(engine));
});
test('moving to a new teaching cue clears stale manual verse and prepares the next Spanish slide',()=>{
  let sends=0,renders=0,lookups=0;
  const state={started:false,slide:0,overlay:null,activePoll:null,activeQuestion:null,
    scriptureRevision:0,scriptureOutput:null,black:false,startedAt:null,timerStoppedAt:null};
  const go=new Script(slice('function go(i){','function next(){')+'\ngo;').runInNewContext({
    state,lesson,slides:()=>lesson.slides,Date:{now:()=>1000},sessionNow:()=>1000,
    scriptureForSlide:i=>{
      const s=lesson.slides[i];return s.type==='verse'?{ref_en:s.ref,text_en:s.text,ref_es:s.es.ref,text_es:s.es.text}:null;
    },
    send:()=>{sends++},render:()=>{renders++},resolveSpanish:()=>{lookups++}
  });
  go(4);assert.equal(state.slide,4);assert.equal(state.scriptureOutput,null);
  state.overlay={ref_en:'Hebrews 12:15',text_en:'...'};
  state.scriptureOutput={ref_en:'Hebrews 12:15'};
  state.scriptureCueMode='manual';
  go(5);
  assert.equal(state.slide,5);assert.equal(state.overlay,null);assert.equal(state.scriptureOutput,null);
  assert.equal(state.scriptureCueMode,'slide');
  go(11);
  assert.equal(state.scriptureOutput.ref_es,'Salmos 139:23-24');
  assert.ok(state.scriptureOutput.text_es);
  go(12);
  assert.equal(state.scriptureOutput,null);
  assert.equal(lookups,0,'Authored sermon content must not require API lookup');
  assert.equal(sends,4);assert.equal(renders,4);
});


test('user-pasted RVR1960 is preserved verbatim for representative short, long, and multi-verse references',()=>{
  const refs={
    'Psalm 147:3':'El sana a los quebrantados de corazón, Y venda sus heridas.',
    'Proverbs 28:1':'Huye el impío sin que nadie lo persiga; Mas el justo está confiado como un león.',
    '2 Corinthians 10:5':'derribando argumentos y toda altivez que se levanta contra el conocimiento de Dios, y llevando cautivo todo pensamiento a la obediencia a Cristo,',
    'Psalm 139:23–24':'23 Examíname, oh Dios, y conoce mi corazón; Pruébame y conoce mis pensamientos; 24 Y ve si hay en mí camino de perversidad, Y guíame en el camino eterno.',
    'Ephesians 4:31–32':'31 Quítense de vosotros toda amargura, enojo, ira, gritería y maledicencia, y toda malicia. 32 Antes sed benignos unos con otros, misericordiosos, perdonándoos unos a otros, como Dios también os perdonó a vosotros en Cristo.',
    'Mark 8:24':'El, mirando, dijo: Veo los hombres como árboles, pero los veo que andan.',
    'Isaiah 61:1':'El Espíritu de Jehová el Señor está sobre mí, porque me ungió Jehová; me ha enviado a predicar buenas nuevas a los abatidos, a vendar a los quebrantados de corazón, a publicar libertad a los cautivos, y a los presos apertura de la cárcel;',
    'Matthew 11:28':'Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.'
  };
  for(const [ref,expected] of Object.entries(refs)){
    const scripture=lesson.verses.find(v=>v.ref_en===ref);
    assert.ok(scripture,ref+' missing');
    assert.equal(scripture.text_es,expected,ref+' differs from supplied text');
  }
  assert.equal(lesson.verses.find(v=>v.ref_en==='Psalm 147:3').ref_es,'Salmos 147:3');
  assert.equal(lesson.slides.filter(v=>v.type==='verse').length,10);
  for(const slide of lesson.slides.filter(v=>v.type==='verse')){
    assert.equal(slide.es.translationKind,'RVR1960');
    assert.equal(slide.es.text,lesson.verses.find(v=>v.ref_en===slide.ref).text_es);
  }
});
test('live sermon engine uses cached RVR1960 from user-provided lesson for manuscript tap, no API',()=>{
  assert.match(engine,/spanishSource:bank\.spanishSource\|\|'RVR1960'/);
  assert.match(engine,/spanishStatus:'ready',copyright:bank\.copyright/);
  assert.match(engine,/REINA-VALERA 1960 · RVR1960/);
  assert.match(engine,/ih-side-verse-source/);
  assert.match(engine,/ih-side-verse-copyright/);
  assert.match(engine,/lesson\.spanishCopyrightNotice/);
  assert.match(engine,/if\(lesson\?\.id!=='inner-healing-2026-10-25'\)resolveSpanish/);
  assert.doesNotMatch(engine,/TRADUCCIÓN PROPIA DEL KJV/);
});


test('cover text is clean in English and Spanish, and side-TV presentation is centered',()=>{
  const cover=lesson.slides[0];
  assert.equal(cover.type,'cover');
  assert.ok(!cover.kicker,'English cover must have no special-message label');
  assert.ok(!cover.es.kicker,'Spanish cover must have no special-message label');
  assert.equal(cover.title,'The Importance of Inner Healing');
  assert.equal(cover.es.title,'La importancia de la sanidad interior');
  const {state,slideHtml,sermonSpanishSideSlide}=runRender();
  state.slide=0;
  const en=slideHtml(cover,true,'en'),es=sermonSpanishSideSlide(cover);
  assert.doesNotMatch(en,/A STANDALONE MESSAGE/);
  assert.doesNotMatch(es,/UN MENSAJE ESPECIAL/);
  assert.match(en,/The Importance of Inner Healing/);
  assert.match(es,/La importancia de la sanidad interior/);
  const css=read('engine/inner-healing.css');
  assert.match(css,/#scriptures \.scripture-inner\.ih-slide-mode\s*\{[^}]*align-items:center;[^}]*justify-content:center;/);
  assert.match(css,/#scriptures \.ih-side-slide\s*\{[^}]*justify-content:center;[^}]*align-items:center;[^}]*text-align:center;/);
  assert.match(css,/#scriptures \.ih-side-cover \.cover\s*\{[^}]*align-items:center;[^}]*text-align:center;/);
  assert.match(css,/65-inch panels/);
  assert.match(css,/#projector \.cover\s*,/);
  assert.match(css,/#scriptures \.ih-side-slide \.points li\s*\{[^}]*justify-content:center;/);
  assert.match(css,/#scriptures \.ih-side-slide \.contrast-box\s*\{[^}]*justify-content:center;/);
  assert.match(css,/#scriptures \.ih-side-slide \.ih-process-step\s*\{[^}]*align-items:center;/);
});
