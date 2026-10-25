import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const engine=read('engine/engine.js');
const lesson=JSON.parse(read('content/inner-healing-2026-10-25.json'));
const section=(begin,end)=>{
  const from=engine.indexOf(begin),to=engine.indexOf(end,from);
  assert.ok(from>=0&&to>from,'Cannot extract '+begin);
  return engine.slice(from,to);
};

test('session clock endpoint exposes server time only and prohibits caching',()=>{
  const file=read('api/session-time.js');
  const handler=new Script(file.replace('export default function handler','function handler')+'\nhandler;')
    .runInNewContext({Date:{now:()=>1800000000123}});
  const headers={};
  const response={
    setHeader:(k,v)=>{headers[k]=v;return response},
    status:value=>{response.code=value;return response},
    json:data=>{response.payload=data;return response}
  };
  handler({method:'GET'},response);
  assert.equal(response.code,200);
  assert.equal(response.payload.now,1800000000123);
  assert.match(headers['Cache-Control'],/no-store/);
  handler({method:'POST'},response);
  assert.equal(response.code,405);
});

test('two devices with different wall clocks show identical elapsed times after calibration',async()=>{
  const clock=section('let clockOffsetMs=0;','async function flushSyncState()');
  const baseline=1800000000000;
  function device(skew){
    let trueTime=baseline;
    let calls=0;
    const mockClock={
      Date:{now:()=>trueTime+skew},
      AbortController,clearTimeout,setTimeout,
      tick:()=>{calls++},
      fetch:async(url,opts)=>{
        assert.equal(url,'/api/session-time');
        assert.equal(opts.cache,'no-store');
        return {ok:true,json:async()=>({now:trueTime})};
      }
    };
    const api=new Script(clock+'\n({syncServerClock,sessionNow,elapsedSessionSeconds,sessionElapsedLabel});')
      .runInNewContext(mockClock);
    return {api,advance:ms=>{trueTime+=ms},calls:()=>calls};
  }
  const a=device(37000),b=device(-64000);
  assert.equal(await a.api.syncServerClock(),true);
  assert.equal(await b.api.syncServerClock(),true);
  assert.equal(a.api.sessionNow(),baseline);
  assert.equal(b.api.sessionNow(),baseline);
  const session={started:true,startedAt:baseline,slide:0};
  a.advance(85500);b.advance(85500);
  const left=a.api.sessionElapsedLabel(a.api.elapsedSessionSeconds(session));
  const right=b.api.sessionElapsedLabel(b.api.elapsedSessionSeconds(session));
  assert.equal(left,'01:25');
  assert.equal(right,left);
  assert.equal(a.api.elapsedSessionSeconds({...session,started:false}),0);
  assert.equal(b.api.elapsedSessionSeconds({...session,startedAt:null}),0);
  assert.equal(a.api.sessionElapsedLabel(a.api.elapsedSessionSeconds({...session,timerStoppedAt:baseline+25000})),'00:25');
  assert.ok(a.calls()>0&&b.calls()>0);
});

test('iPad and confidence time displays are derived from one session timestamp',()=>{
  const content=section('function tick(){','function go(i){');
  const elements=Object.fromEntries(['ipad-time','conf-time'].map(id=>[id,{
    textContent:'',dataset:{},attributes:{},
    setAttribute(k,v){this.attributes[k]=v}
  }]));
  let state={started:false,startedAt:null};
  let now=1800000000000;
  const tick=new Script(content+'\ntick;').runInNewContext({
    state,
    sessionNow:()=>now,
    elapsedSessionSeconds:()=>!state.started?0:Math.max(0,Math.floor((now-state.startedAt)/1000)),
    sessionElapsedLabel:n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0'),
    $:id=>elements[id]
  });
  tick();
  assert.equal(elements['ipad-time'].textContent,'00:00');
  assert.equal(elements['conf-time'].dataset.running,'no');
  state.started=true;state.startedAt=now;
  now+=72500;tick();
  assert.equal(elements['ipad-time'].textContent,'01:12');
  assert.equal(elements['conf-time'].textContent,'01:12');
  assert.equal(elements['ipad-time'].dataset.running,'yes');
  now+=1200;tick();
  assert.equal(elements['ipad-time'].textContent,elements['conf-time'].textContent);
  state.started=false;state.startedAt=null;tick();
  assert.equal(elements['conf-time'].textContent,'00:00');
  assert.equal(elements['ipad-time'].textContent,'00:00');
});

test('confidence view loads full current manuscript, next cue and live Scripture overlay',()=>{
  const code=section('function renderConfidence(){','function tick(){');
  const elements={};
  const get=id=>elements[id]||(elements[id]={
    textContent:'',dataset:{},hidden:false,scrollTop:10,
    appendChild(value){this.appended=value},
    setAttribute(){}
  });
  const state={started:true,slide:2,overlay:null,activePoll:null};
  const fn=new Script(code+'\nrenderConfidence;').runInNewContext({
    lesson,state,slides:()=>lesson.slides,
    $:get,clean:x=>String(x||''),
    titleOf:s=>s.title||s.ref||s.kicker,
    localizedSlide:x=>x,poll:()=>null,tick:()=>{},
    document:{createElement:()=>({innerHTML:'',get content(){return {html:this.innerHTML}}})}
  });
  fn();
  assert.equal(get('conf-k').textContent,'CURRENT · SLIDE 3 / 52');
  assert.equal(get('conf-title').textContent,'Psalm 147:3');
  assert.equal(get('conf-ref').textContent,'Psalm 147:3');
  assert.equal(get('conf-next').textContent,lesson.slides[3].title);
  assert.equal(get('conf-notes').appendended,undefined);
  assert.equal(get('conf-notes').appended.html,lesson.manuscript[2].html);
  assert.equal(get('conf-notes').scrollTop,0);
  state.overlay={ref_en:'Hebrews 12:15',text_en:'...'};
  fn();
  assert.equal(get('conf-title').textContent,'Psalm 147:3','Keep current teaching cue visible');
  assert.equal(get('conf-ref').textContent,'ON PROJECTOR · Hebrews 12:15');
  state.slide=3;state.overlay=null;
  fn();
  assert.equal(get('conf-title').textContent,lesson.slides[3].title);
  assert.equal(get('conf-notes').appended.html,lesson.manuscript[3].html);
});

test('rejoining the live session preserves timer origin and missed cues are replayed',()=>{
  assert.match(engine,/await syncServerClock\(\);\s*await initNetwork\(\)/);
  assert.match(engine,/const t=Math\.max\(0,Math\.min\(Number\(i\)\|\|0,ss\.length-1\)\),now=sessionNow\(\)/);
  assert.match(engine,/Date\.now\(\)\+clockOffsetMs/);
  assert.match(engine,/window\.addEventListener\('pageshow',catchUp\)/);
  assert.match(engine,/window\.addEventListener\('online',catchUp\)/);
  assert.match(engine,/document\.addEventListener\('visibilitychange'/);
  assert.match(engine,/if\(status==='SUBSCRIBED'\)\{markSync\(true,'Live'\);void readLatest\(\)\}/);
  assert.match(engine,/setInterval\(readLatest,3000\)/);
  assert.match(engine,/const ts=Math\.max\(sessionNow\(\),lastTs\+1\)/);
  const resetBody=section('function reset(){','function clearTakeover(){');
  assert.match(resetBody,/state\.startedAt=null/);
  assert.match(resetBody,/send\(\);render\(\)/);
  const confHTML=read('engine/index.html');
  for(const key of ['ipad-time','conf-time','conf-notes','conf-sync'])
    assert.match(confHTML,new RegExp('id="'+key+'"'));
  const s=lesson.manuscript.map(m=>m.html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()).join(' ');
  assert.equal(lesson.manuscript.length,52);
  assert.equal(s.split(/\s+/).length,4721);
});
