import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const engine=read('engine/engine.js');
const css=read('engine/inner-healing.css');
const lesson=JSON.parse(read('content/breaking-the-cycles-2026-11-12.json'));
const slice=(begin,end)=>{
  const a=engine.indexOf(begin),b=engine.indexOf(end,a);
  assert.ok(a>=0&&b>a,'Missing runtime function '+begin);
  return engine.slice(a,b);
};
const functions=slice('function titleOf(s){','function normalizeScripture(v){')+
  '\n'+slice('function sermonSpanishSideSlide(s){','function sideTvExplanationHtml(note){');
const screenBranch=slice("if(view==='scriptures'){","if(view==='confidence')renderConfidence();");
const escapeHtml=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function makeTV(){
  const classes=new Set(),node={innerHTML:'',dataset:{},classList:{
    remove(...names){names.forEach(x=>classes.delete(x))},
    add(...names){names.forEach(x=>classes.add(x))},
    toggle(name,on){on?classes.add(name):classes.delete(name)}
  }};
  const state={started:false,slide:0,seq:0,scriptureRevision:0,scriptureOutput:null,
    scriptureCueMode:'slide',sideScreenCleared:false};
  const context={lesson,state,ss:lesson.slides,s:lesson.slides[0],view:'scriptures',
    esc:escapeHtml,clean:x=>String(x||''),
    $:key=>key==='scripture-content'?node:null,
    resourceQrCards:()=>'',
    scriptureHtml:v=>'<div lang="es" class="scripture-primary"><div class="scripture-text">'+escapeHtml(v.text_es||'')+'</div></div>',
    sideTvExplanationHtml:()=>'',trackSideScripture:()=>{}};
  const api=new Script(functions+'\n({slideHtml,sermonSpanishSideSlide});').runInNewContext(context);
  const renderScript=new Script('(()=>{'+screenBranch+'})()');
  const draw=()=>{context.s=lesson.slides[state.slide]||lesson.slides[0];renderScript.runInNewContext(context)};
  return {state,node,classes,api,draw};
}

test('Spanish side TVs always show the current slide, not the waiting screen',()=>{
  const tv=makeTV();
  assert.equal(lesson.sideTvSpanishMirror,true);
  tv.draw();
  assert.match(tv.node.innerHTML,/ROMPIENDO LOS CICLOS/);
  assert.doesNotMatch(tv.node.innerHTML,/ESPERANDO LA ESCRITURA/);
  tv.state.started=true;
  for(let i=0;i<lesson.slides.length;i++){
    tv.state.slide=i;tv.state.seq++;
    tv.draw();
    const slide=lesson.slides[i];
    const expected=slide.type==='verse'?slide.es.text:slide.type==='progression'?
      slide.es.steps[0]:slide.es.title;
    assert.ok(tv.node.innerHTML.includes(escapeHtml(expected)),
      'Spanish cue '+(i+1)+' did not render: '+slide.title);
    assert.doesNotMatch(tv.node.innerHTML,/ESPERANDO LA ESCRITURA|RVR1960 no disponible/);
    assert.ok(tv.classes.has('ih-slide-mode'), 'Spanish TV left slide mode at '+i);
  }
  tv.state.started=false;tv.state.slide=10;tv.state.seq++;
  tv.draw();assert.match(tv.node.innerHTML,/ROMPIENDO LOS CICLOS/);
});

test('main slides remain in English and Spanish does not disappear on progression slides',()=>{
  const tv=makeTV();
  for(const slide of lesson.slides){
    const en=tv.api.slideHtml(slide,false,'en');
    const es=tv.api.sermonSpanishSideSlide(slide);
    assert.ok(en.includes(escapeHtml(slide.type==='verse'?slide.text:slide.title))||
      (slide.type==='progression'&&en.includes(escapeHtml(slide.steps[0]))),
      'Main slide not readable: '+slide.title);
    assert.ok(es.length>70,'Empty Spanish screen: '+slide.title);
    if(slide.type==='progression')for(const step of slide.es.steps)
      assert.ok(es.includes(escapeHtml(step)), 'Spanish step missing: '+step);
  }
});

test('one presenter cue updates both Spanish TVs and clears manual overrides on next/previous/reset',()=>{
  const left=makeTV(),right=makeTV();
  const state={started:false,slide:0,seq:0,overlay:null,activePoll:null,activeQuestion:null,
    scriptureRevision:0,scriptureOutput:null,scriptureCueMode:'slide',sideScreenCleared:false,
    startedAt:null,timerStoppedAt:null,black:false};
  let sent=0,rendered=0;
  function send(){
    sent++;
    for(const tv of [left,right]){
      Object.assign(tv.state,state,{seq:sent});
      tv.draw();
    }
  }
  const code=slice('function go(i){','function toggleBlack(){');
  const actions=new Script(code+'\n({go,next,prev,reset,clearPresentedScripture})')
    .runInNewContext({state,lesson,slides:()=>lesson.slides,sessionNow:()=>123456,
      isMirroredSermon:()=>true,send,render:()=>{rendered++},
      scriptureForSlide:()=>null,resolveSpanish:()=>{throw Error('Unexpected lookup')}});
  actions.go(8);assert.match(left.node.innerHTML,/Cuando rechazamos la corrección/);
  assert.equal(left.node.innerHTML,right.node.innerHTML);
  actions.next();assert.match(left.node.innerHTML,/El que ama la instrucción/);
  actions.next();assert.match(left.node.innerHTML,/Se revela un error/);
  state.scriptureCueMode='manual';
  state.scriptureOutput={ref_en:'Proverbs 12:1',text_es:'Texto manual de prueba'};
  state.overlay={ref_en:'Proverbs 12:1'};
  send();assert.match(right.node.innerHTML,/Texto manual de prueba/);
  actions.next();
  assert.equal(state.slide,11);
  assert.match(left.node.innerHTML,/El oído que escucha las amonestaciones/);
  assert.doesNotMatch(right.node.innerHTML,/Texto manual de prueba/);
  assert.equal(state.scriptureCueMode,'slide');
  actions.prev();assert.match(right.node.innerHTML,/Se revela un error/);
  actions.reset();assert.match(left.node.innerHTML,/ROMPIENDO LOS CICLOS/);
  assert.equal(right.node.innerHTML,left.node.innerHTML);
  assert.equal(state.started,false);
  assert.equal(sent,7);
  assert.equal(rendered,6);
});

test('shared mirror styling and reconnect handling cover this sermon without changing legacy lessons',()=>{
  assert.match(engine,/document\.body\.dataset\.spanishMirror=isMirroredSermon\(\)\?'true':'false'/);
  assert.match(css,/body\[data-spanish-mirror="true"\] #scriptures \.ih-side-slide/);
  assert.match(css,/body\[data-spanish-mirror="true"\] #scriptures \.scripture-inner\.ih-slide-mode/);
  assert.match(engine,/if\(next\.id==='inner-healing-2026-10-25'\|\|next\.sideTvSpanishMirror===true\)/);
  assert.match(engine,/setInterval\(readLatest,3000\)/);
  assert.match(engine,/window\.addEventListener\('online',catchUp\)/);
  assert.match(engine,/bc\.postMessage\(msg\)/);
  assert.match(engine,/rtChannel\?\.send\(/);
  assert.match(engine,/const scriptureTakeover=state\.scriptureCueMode==='manual'&&!!state\.scriptureOutput/);
  assert.equal(lesson.scriptureManualOnly,true);
  assert.ok(lesson.slides.every(slide=>slide.es));
  assert.doesNotThrow(()=>new Script(engine));
});
