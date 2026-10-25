import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const engine=read('engine/engine.js');
const lesson=JSON.parse(read('content/inner-healing-2026-10-25.json'));
const from=engine.indexOf("if(view==='scriptures'){");
const to=engine.indexOf("if(view==='confidence')renderConfidence();",from);
assert.ok(from>=0&&to>from,'Cannot extract side-screen renderer');
const sideBranch=engine.slice(from,to);
const clearStart=engine.indexOf('function clearTakeover(){');
const clearEnd=engine.indexOf('function toggleBlack(){',clearStart);
assert.ok(clearStart>=0&&clearEnd>clearStart);
const clearFunctions=engine.slice(clearStart,clearEnd);

function createSide(overrideLesson=lesson){
  const classes=new Set();
  const node={dataset:{},innerHTML:'',
    classList:{
      toggle(name,on){if(on)classes.add(name);else classes.delete(name)},
      add(...names){names.forEach(name=>classes.add(name))},
      remove(...names){names.forEach(name=>classes.delete(name))}
    }};
  const state={
    started:false,slide:0,seq:0,scriptureRevision:0,scriptureOutput:null,
    scriptureCueMode:'slide',sideScreenCleared:false,overlay:null,black:false,
    activePoll:null,activeQuestion:null
  };
  let broadcasts=0,repaints=0;
  const context={
    view:'scriptures',state,lesson:overrideLesson,ss:overrideLesson.slides,
    s:overrideLesson.slides[0],$:(id)=>id==='scripture-content'?node:null,
    sermonSpanishSideSlide:slide=>'<div lang="es" class="mirrored">'+
      (slide.es.title||slide.es.text||slide.es.kicker)+
      (slide.es.points||[]).join('|')+'</div>',
    scriptureHtml:v=>'<div lang="es" class="scripture">'+v.text_es+'</div>',
    sideTvExplanationHtml:()=>'',trackSideScripture:()=>{},
    normalizeScripture:v=>v,send:()=>{broadcasts++},render:()=>{repaints++}
  };
  const render=new Script('(()=>{'+sideBranch+'})()').runInNewContext(context);
  const functions=new Script(clearFunctions+'\n({clearPresentedScripture,clearTakeover,clearScriptureOutput});')
    .runInNewContext(context);
  return {state,node,classes,render:()=>{context.s=overrideLesson.slides[state.slide];renderSide();},
    functions,getSent:()=>broadcasts,getRendered:()=>repaints};
  function renderSide(){
    // A fresh invocation captures the updated live cue (the production render() does too).
    new Script('(()=>{'+sideBranch+'})()').runInNewContext(context);
  }
}
const allSpanishCues=lesson.slides;

test('standby uses the Spanish cover, not ESPERANDO LA ESCRITURA',()=>{
  const side=createSide();
  side.state.sideScreenCleared=true; // compatible with previous persisted live state
  side.render();
  assert.match(side.node.innerHTML,/La importancia de la sanidad interior/);
  assert.doesNotMatch(side.node.innerHTML,/ESCRITURA DESPEJADA|ESPERANDO LA ESCRITURA/);
  assert.ok(side.classes.has('ih-slide-mode'));
  assert.ok(!side.classes.has('wait'));
});

test('every one of the 52 English cues has its corresponding Spanish side cue, even if old clear state survives',()=>{
  const side=createSide();
  side.state.started=true;
  side.state.sideScreenCleared=true;
  for(let i=0;i<allSpanishCues.length;i++){
    side.state.slide=i;side.state.seq++;
    side.render();
    const slide=allSpanishCues[i];
    const spanish=slide.es.title||slide.es.text||slide.es.kicker;
    assert.ok(side.node.innerHTML.includes(spanish),'Spanish missing for cue '+(i+1));
    assert.ok(side.node.innerHTML.includes('lang="es"'),'Not Spanish for cue '+(i+1));
    assert.doesNotMatch(side.node.innerHTML,/ESCRITURA DESPEJADA|ESPERANDO LA ESCRITURA/);
    assert.ok(side.classes.has('ih-slide-mode'),'Side screen not in slide mode '+i);
    for(const p of slide.es.points||[])
      assert.ok(side.node.innerHTML.includes(p),'Missing progressive bullet on cue '+(i+1));
  }
});

test('tapping a manuscript verse overrides Spanish side TV, then X restores the exact current Spanish cue',()=>{
  const side=createSide();
  side.state.started=true;side.state.slide=6;side.state.seq=10;
  side.render();
  const spanishSlide=side.node.innerHTML;
  assert.match(spanishSlide,/Ciclos que se repiten/);
  side.state.scriptureCueMode='manual';
  side.state.scriptureOutput={ref_en:'Hebrews 12:15',text_es:'Mirad bien, no sea que alguno deje de alcanzar la gracia de Dios;'};
  side.state.overlay={ref_en:'Hebrews 12:15'};
  side.state.scriptureRevision++;
  side.state.seq++;
  side.render();
  assert.match(side.node.innerHTML,/Mirad bien/);
  assert.doesNotMatch(side.node.innerHTML,/Ciclos que se repiten/);
  assert.ok(!side.classes.has('ih-slide-mode'));
  assert.equal(side.functions.clearPresentedScripture(),true);
  side.state.seq++;
  side.render();
  assert.equal(side.node.innerHTML,spanishSlide);
  assert.equal(side.state.scriptureOutput,null);
  assert.equal(side.state.overlay,null);
  assert.equal(side.state.scriptureCueMode,'slide');
  assert.equal(side.state.sideScreenCleared,false);
  assert.ok(side.getSent()>=1);
});

test('Clear Overlay and Clear Scripture TV both return side TV to Spanish slide without blanking',()=>{
  const side=createSide();
  side.state.started=true;side.state.slide=23;side.state.seq=1;
  const showManual=()=>{side.state.scriptureOutput={ref_en:'Romans 12:19',text_es:'No os venguéis vosotros mismos'};side.state.overlay={ref_en:'Romans 12:19'};side.state.scriptureCueMode='manual';side.state.seq++;side.render();};
  showManual();side.functions.clearTakeover();side.state.seq++;side.render();
  assert.match(side.node.innerHTML,/¿Cómo identificamos la herida\?/);
  assert.equal(side.state.scriptureOutput,null);
  showManual();side.functions.clearScriptureOutput();side.state.seq++;side.render();
  assert.match(side.node.innerHTML,/¿Cómo identificamos la herida\?/);
  assert.equal(side.state.overlay,null);
});

test('an old saved cleared state is ignored after reconnection, and the next cue remains Spanish',()=>{
  const side=createSide();
  side.state.started=true;side.state.slide=1;side.state.sideScreenCleared=true;
  side.render();
  assert.match(side.node.innerHTML,/Puedes ser libre de aquello que te hirió/);
  side.state.slide=2;side.state.seq=22;side.render();
  assert.match(side.node.innerHTML,/El sana a los quebrantados de corazón/);
  assert.ok(side.classes.has('ih-slide-mode'));
  assert.doesNotMatch(engine,/ESCRITURA DESPEJADA/);
});

test('legacy teaching sessions retain their original persistent Scripture TV route',()=>{
  assert.match(sideBranch,/const current=state\.scriptureOutput/);
  assert.match(sideBranch,/trackSideScripture\(\)/);
  assert.match(sideBranch,/ESPERANDO LA ESCRITURA/);
  assert.match(sideBranch,/sideTvExplanationHtml\(note\)/);
  assert.equal(lesson.manuscript.length,52);
  assert.equal(lesson.verses.filter(v=>v.spanishSource==='RVR1960').length,38);
});
