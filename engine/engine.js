(() => {
'use strict';

const ROOM='ministry-unified-v2', CHANNEL=ROOM, SYNC_ID=1, TYPE='ministry_unified_state', TTL=14400000;
const GUIDE_URL='https://apostolicguide.com/';
const spanishCache=new Map();
const classUrl=()=>location.origin+'/class'+(lesson?.id?'?lesson='+encodeURIComponent(lesson.id):'');
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>String(s??'').replace(/<[^>]*>/g,'').replace(/&middot;/g,'·').replace(/&rarr;/g,'→').replace(/&ldquo;|&rdquo;/g,'"').replace(/&rsquo;/g,"'");
const qr=u=>'https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&data='+encodeURIComponent(u);

const path=location.pathname.toLowerCase().replace(/\/+$/,'')||'/';
const queryView=(new URLSearchParams(location.search).get('view')||'').toLowerCase();
const pathView={
  '/live':'remote','/teach':'remote','/admin':'remote','/remote':'remote','/mobile':'presenter','/projector':'projector','/scriptures':'scriptures','/scripture':'scriptures',
  '/confidence':'confidence','/obsslides':'obsslides','/obslowerthirds':'obslowerthirds','/class':'class','/presenter':'presenter'
}[path];
const view=queryView||pathView||'remote';

let library=null, lesson=null, questions=[], votes=[], bc=null, sbUrl='', sbKey='', sbClient=null, rtChannel=null, lastTs=0;
let queuedSyncState=null,syncWriteBusy=false;
// A lightweight server clock aligns independent iPad, confidence and control devices.
// The old local Date.now clock remains a fallback whenever the network is unavailable.
let clockOffsetMs=0;
function sessionNow(){return Date.now()+clockOffsetMs}
async function syncServerClock(){
  const before=Date.now(),controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),2500);
  try{
    const response=await fetch('/api/session-time',{cache:'no-store',signal:controller.signal});
    const after=Date.now();
    if(!response.ok||after-before>4500)return false;
    const result=await response.json();
    const serverTime=Number(result.now);
    if(!Number.isFinite(serverTime)||serverTime<1000000000000)return false;
    clockOffsetMs=serverTime-(before+after)/2;
    tick();
    return true;
  }catch(e){return false}
  finally{clearTimeout(timeout)}
}
function elapsedSessionSeconds(sessionState=state,now=sessionNow()){
  if(!sessionState?.started||!Number.isFinite(Number(sessionState.startedAt))||
     Number(sessionState.startedAt)<=0)return 0;
  const end=Number(sessionState.timerStoppedAt)||now;
  return Math.max(0,Math.floor((end-Number(sessionState.startedAt))/1000));
}
function sessionElapsedLabel(seconds){
  const s=Math.max(0,Math.floor(Number(seconds)||0));
  return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
}
async function flushSyncState(){
  if(syncWriteBusy||!sbUrl||!sbKey)return;
  syncWriteBusy=true;
  try{
    while(queuedSyncState){
      const msg=queuedSyncState;queuedSyncState=null;
      try{
        const response=await fetch(sbUrl+'/rest/v1/sync_state',{
          method:'POST',
          headers:{'Content-Type':'application/json',apikey:sbKey,Authorization:'Bearer '+sbKey,Prefer:'resolution=merge-duplicates,return=minimal'},
          body:JSON.stringify({id:SYNC_ID,payload:JSON.stringify(msg),updated_at:new Date(msg.ts).toISOString()})
        });
        if(!response.ok)throw new Error('Sync write returned '+response.status);
      }catch(err){window.MinistryIpadStatus?.('Live sync write failed. Check the projector and connection.','error')}
    }
  }finally{syncWriteBusy=false}
}
let classEmail=localStorage.getItem('ministry_class_email')||'';
let classLanguage=localStorage.getItem('ministry_class_language')||(/^es\b/i.test(navigator.language||'')?'es':'en');
if(!['en','es'].includes(classLanguage))classLanguage='en';
let classSession=localStorage.getItem('ministry_class_session')||('class_'+(crypto.randomUUID?crypto.randomUUID():Date.now()+Math.random().toString(16).slice(2)));
localStorage.setItem('ministry_class_session',classSession);

let state={
  room:ROOM,type:TYPE,lessonId:null,started:false,slide:0,overlay:null,scriptureOutput:null,black:false,activePoll:null,activeQuestion:null,
  startedAt:null,timerStoppedAt:null,language:'en',scriptureRevision:0,seq:0,ts:Date.now()
};

function titleOf(s){return s?.title||s?.ref||s?.kicker||'Slide'}
function slides(){return lesson?.slides||[]}
function verses(){return lesson?.verses||[]}
function polls(){return lesson?.polls||[]}
function poll(id){return polls().find(p=>String(p.id)===String(id))}
function pollsForSlide(index){return polls().filter(p=>Number.isInteger(p.cueSlide)&&p.cueSlide===index)}
function theme(){document.body.dataset.theme=lesson?.theme||'default';document.body.dataset.lesson=lesson?.id||'';const link=$('lesson-theme-css');if(link){if(lesson?.theme==='evidence'){if(link.getAttribute('href')!=='/kingdom-evidence.css')link.setAttribute('href','/kingdom-evidence.css')}else link.removeAttribute('href')}}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim())}
function langText(en,es){return state.language==='es'?(es||en):en}
function classText(en,es){return classLanguage==='es'?(es||en):en}
function hasSpanishSlide(s){
  return !!(s?.es || lesson?.translations?.es?.slides?.[s?._index]);
}
function localizedSlide(s,language=state.language){
  if(!s || language==='en') return s;
  const tr=s.es||lesson?.translations?.es?.slides?.[s._index]||null;
  return tr?{...s,...tr,_english:s}:{...s,_translationMissing:true,_english:s};
}
function localizedPoll(p,language=state.language){
  if(!p||language==='en')return p;
  const tr=p.es||lesson?.translations?.es?.polls?.[p.id]||null;
  return tr?{...p,...tr,_english:p}:{...p,_translationMissing:true,_english:p};
}

function resourceQrCards(large=false){
  const items=[
    {label:'JOIN THE LIVE STUDY',hint:'Follow Scripture · Answer polls · Ask questions',url:classUrl()},
    {label:'APOSTOLIC GUIDE',hint:'Continue your Bible study',url:GUIDE_URL}
  ];
  const cards=items.map(item=>'<div class="resource-qr-card"><div class="resource-qr-image"><img src="'+qr(item.url)+'" alt="Scan to open '+esc(item.label)+'" decoding="async" referrerpolicy="no-referrer" onerror="this.closest(\'.resource-qr-image\').classList.add(\'qr-failed\')"></div><div class="resource-qr-label">'+esc(item.label)+'</div>'+(large?'<div class="resource-qr-hint">'+esc(item.hint)+'</div>':'')+'<div class="resource-qr-url">'+esc(item.url.replace('https://','').replace('http://',''))+'</div></div>').join('');
  return '<div class="resource-qr-grid '+(large?'resource-qr-large':'resource-qr-small')+'">'+cards+'</div>';
}

function slideHtml(raw,withQr=true,language=state.language){
  const s=localizedSlide(raw,language)||{};
  const k=s.kicker?'<div class="p-kicker">'+esc(clean(s.kicker))+'</div>':'';
  const sub=s.sub?'<div class="p-sub">'+esc(clean(s.sub))+'</div>':'';
  const ref=s.ref?'<div class="p-ref">'+esc(clean(s.ref))+'</div>':'';
  const translation=(language==='bilingual'&&s._english&&hasSpanishSlide(s._english))
    ?'<div class="presented-translation"><div class="translation-label">English</div>'+esc(clean(s._english.title||s._english.text||s._english.sub||''))+'</div>':'';
  const missing=(language!=='en'&&s._translationMissing)?'<div class="p-sub">Spanish translation not authored for this slide yet.</div>':'';

  if(s.type==='cover')return '<div class="cover">'+k+'<div class="p-title">'+esc(clean(s.title))+'</div><div class="rule"></div>'+sub+ref+missing+(withQr&&lesson?.id!=='inner-healing-2026-10-25'?resourceQrCards(false):'')+'</div>';
  if(s.type==='resources')return '<div class="resource-qr-slide">'+k+'<div class="p-title med">'+esc(clean(s.title||'Study & resources'))+'</div>'+sub+resourceQrCards(true)+missing+'</div>';
  if(s.type==='verse')return k+ref+'<div class="rule"></div><div class="p-verse">'+esc(clean(s.text||''))+'</div>'+sub+missing+translation;
  if(s.type==='statement')return k+ref+'<div class="statement">'+esc(clean(s.title||s.text||''))+'</div>'+sub+missing+translation;
  if(s.type==='prompt')return k+'<div class="p-title med">'+esc(clean(s.title||s.text||''))+'</div>'+sub+missing+translation;
  if(s.type==='points'||s.type==='illustration')return k+ref+'<div class="p-title med">'+esc(clean(s.title||''))+'</div><ul class="points">'+(s.points||[]).map(x=>'<li>'+esc(clean(x))+'</li>').join('')+'</ul>'+sub+missing+translation;
  if(s.type==='contrast')return k+'<div class="contrast"><div class="contrast-box"><div class="contrast-text">'+esc(clean(s.left||'')).replace(/\n/g,'<br>')+'</div></div><div class="contrast-box right"><div class="contrast-text">'+esc(clean(s.right||'')).replace(/\n/g,'<br>')+'</div></div></div>'+sub+missing+translation;
  if(s.type==='steps')return k+'<div class="p-title med">'+esc(clean(s.title||''))+'</div><div class="steps">'+(s.steps||[]).map((x,i)=>'<div class="step"><div class="step-n">'+(i+1)+'</div><div class="step-t">'+esc(clean(x))+'</div></div>').join('')+'</div>'+sub+missing;
  if(s.type==='check')return k+'<div class="check">'+(s.items||[]).map(x=>'<div class="check-item"><div class="check-l">'+esc(clean(Array.isArray(x)?x[0]:x))+'</div><div class="check-v">'+esc(clean(Array.isArray(x)?x[1]:''))+'</div></div>').join('')+'</div>'+sub+missing;
  if(s.type==='levels')return k+'<div class="p-title med">'+esc(clean(s.title||''))+'</div><div class="levels">'+(s.levels||[]).map((x,i)=>'<div class="level"><div class="level-n">'+(i+1)+'</div><div><div class="level-t">'+esc(clean(Array.isArray(x)?x[1]:x))+'</div><div class="level-d">'+esc(clean(Array.isArray(x)?x[2]:''))+'</div></div></div>').join('')+'</div>'+missing;
  if(s.type==='columns')return k+'<div class="p-title med">'+esc(clean(s.title||''))+'</div><div class="contrast"><div class="contrast-box"><div><div class="check-l">'+esc(clean(s.leftTitle||''))+'</div><ul class="points">'+(s.left||[]).map(x=>'<li>'+esc(clean(x))+'</li>').join('')+'</ul></div></div><div class="contrast-box right"><div><div class="check-l">'+esc(clean(s.rightTitle||''))+'</div><ul class="points">'+(s.right||[]).map(x=>'<li>'+esc(clean(x))+'</li>').join('')+'</ul></div></div></div>'+sub+missing;
  if(s.type==='progression'&&lesson?.id==='inner-healing-2026-10-25') {
    const words=(s.words||[]).slice(0,5);
    return '<div class="ih-visual"><div class="ih-visual-eyebrow">'+esc(clean(s.kicker||'THE PROCESS'))+'</div><div class="ih-process-grid">'+words.map((word,i)=>'<div class="ih-process-step"><span class="ih-step-n">'+String(i+1).padStart(2,'0')+'</span><strong>'+esc(clean(word))+'</strong></div>').join('<div class="ih-process-arrow" aria-hidden="true">→</div>')+'</div>'+sub+'</div>';
  }
  if(s.type==='progression')return k+'<div class="p-title med">'+(s.words||[]).map(esc).join(' → ')+'</div>'+sub+missing;
  return k+'<div class="p-title med">'+esc(clean(titleOf(s)))+'</div>'+sub+missing;
}

function normalizeScripture(v){
  if(!v)return null;
  const en=v.ref_en||v.ref||'';
  return {
    ref_en:en, text_en:v.text_en||v.text||v.kjv||'',
    ref_es:v.ref_es||(window.MinistrySpanishRef?.(en)||en),
    text_es:v.text_es||v.rvr||'', spanishSource:v.spanishSource||'',
    spanishStatus:v.spanishStatus||'', spanishError:v.spanishError||'',
    revision:Number(v.revision)||0, fumsId:v.fumsId||'',
    copyright:v.copyright||lesson?.spanishCopyrightNotice||''
  };
}
function scriptureForSlide(index){
  const s=slides()[index];
  if(!s||s.type!=='verse')return null;
  const preserved=lesson?.slideScriptures?.[index];
  if(preserved&&(preserved.text_en||preserved.text))return normalizeScripture(preserved);
  const match=verses().find(v=>String(v.ref_en||v.ref||'').trim()===String(s.ref||'').trim());
  if(match)return normalizeScripture(match);
  return normalizeScripture({ref_en:s.ref||'',text_en:s.text||'',ref_es:s.ref_es||'',text_es:s.text_es||''});
}
function scriptureHtml(v){
  const sc=normalizeScripture(v);if(!sc)return '';
  const match=verses().find(row=>String(row.ref_en||row.ref||'').trim()===String(sc.ref_en).trim());
  if(match){
    sc.text_es=sc.text_es||match.text_es||'';
    sc.ref_es=sc.ref_es||match.ref_es||'';
    sc.copyright=sc.copyright||lesson?.spanishCopyrightNotice||'';
  }
  const spanish=sc.text_es||'';
  const spanishRef=sc.ref_es||sc.ref_en;
  const version=lesson?.id==='inner-healing-2026-10-25'
    ?'REINA-VALERA 1960 · RVR1960'
    :sc.spanishSource==='RVR1960'?'RVR1960':(spanish&&/adaptaci[oó]n|adaptado|editorial/i.test(lesson?.spanishSource||'')?'RVR 1960 · ADAPTACIÓN «EL SEÑOR»':(spanish?'TEXTO ESPAÑOL DE LA LECCIÓN':'RVR1960'));
  const sized=spanish.length>190?' scripture-long':spanish.length>105?' scripture-medium':'';
  const missing=sc.spanishStatus==='loading'?'Buscando el texto RVR1960…':
    (lesson?.id==='inner-healing-2026-10-25'?'RVR1960 no está guardada para esta referencia. ':'RVR1960 no disponible. ')+(sc.spanishError||'Comprueba la conexión de la Biblia.');
  const primary=spanish
    ? '<div class="scripture-primary'+sized+'"><div class="scripture-ref">'+esc(spanishRef)+' · '+version+'</div><div class="scripture-text" lang="es">'+esc(spanish)+'</div></div>'
    : '<div class="scripture-primary scripture-unavailable"><div class="scripture-ref">'+esc(spanishRef)+' · '+esc(version)+'</div><div class="scripture-missing">'+esc(missing)+'</div></div>';
  const english=(lesson?.id==='inner-healing-2026-10-25'||!spanish)&&sc.text_en?'<div class="scripture-secondary"><div class="scripture-ref">'+esc(sc.ref_en)+' · KJV</div><div class="scripture-text" lang="en">'+esc(sc.text_en)+'</div></div>':'';
  const notice=spanish&&(sc.spanishSource==='RVR1960'||lesson?.spanishCopyrightNotice)&&sc.copyright
    ?'<div class="scripture-copyright">'+esc(sc.copyright)+'</div>':'';
  return primary+english+notice;
}
async function resolveSpanish(sc,revision){
  if(!sc?.ref_en||!sc?.text_en)return;
  const ref=String(sc.ref_en).trim();
  // Never silently label edited or missing Spanish as RVR1960.
  let entry=spanishCache.get(ref);
  if(!entry){
    try{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6500);
      let res;
      try{res=await fetch('/api/scripture?mode=spanish&ref='+encodeURIComponent(ref),{cache:'no-store',signal:controller.signal})}
      finally{clearTimeout(timer)}
      entry=await res.json().catch(()=>({ok:false,error:'The Spanish response was not readable'}));
      if(!res.ok||!entry.ok)entry={ok:false,error:entry.message||entry.error||'RVR1960 is not configured for this app'};
      // Cache successful licensed passages, not configuration or network errors.
      if(entry.ok)spanishCache.set(ref,entry);
    }catch(error){entry={ok:false,error:error.name==='AbortError'?'Spanish verse request timed out':error.message}}
  }
  // An older request must never replace a newer verse on a live side screen.
  if(state.scriptureRevision!==revision||String(state.scriptureOutput?.ref_en||'').trim()!==ref)return;
  if(entry.ok){
    state.scriptureOutput={...state.scriptureOutput,text_es:entry.text_es,
      spanishSource:'RVR1960',spanishStatus:'ready',spanishError:'',
      copyright:entry.copyright||'',fumsId:entry.fumsId||'',revision};
    if(state.overlay&&String(state.overlay.ref_en||'').trim()===ref)state.overlay={...state.overlay,text_es:entry.text_es,spanishSource:'RVR1960'};
  }else{
    state.scriptureOutput={...state.scriptureOutput,spanishStatus:'unavailable',
      spanishError:entry.error||'No authorized RVR1960 text available',revision};
    window.MinistryIpadStatus?.('English verse sent. '+state.scriptureOutput.spanishError,'error');
  }
  send();render();
}
function takeScripture(v,target='both'){
  const input=normalizeScripture(v);
  const bank=lesson?.id==='inner-healing-2026-10-25'
    ?verses().find(row=>String(row.ref_en||row.ref).replace(/–/g,'-')===String(input?.ref_en||'').replace(/–/g,'-')):null;
  const sc=bank?normalizeScripture({...bank,...v,text_es:bank.text_es,ref_es:bank.ref_es,
    spanishSource:bank.spanishSource||'RVR1960',spanishStatus:'ready',copyright:bank.copyright||lesson?.spanishCopyrightNotice||''}):input;
  if(!sc?.ref_en||!sc?.text_en){
    window.MinistryIpadStatus?.('Scripture needs a reference and KJV text before it can be sent.','error');
    return false;
  }
  state.scriptureRevision=(state.scriptureRevision||0)+1;
  const revision=state.scriptureRevision;
  state.scriptureOutput={...sc,revision,spanishStatus:sc.text_es?'ready':'loading'};
  if(lesson?.id==='inner-healing-2026-10-25'){
    state.scriptureCueMode='manual';
    state.sideScreenCleared=false;
    if(!sc.text_es){state.scriptureOutput.spanishStatus='unavailable';
      state.scriptureOutput.spanishError='La RVR1960 guardada incluye únicamente los pasajes de este sermón.';}
  }
  if(target!=='tv'){
    state.overlay={...sc};state.activePoll=state.activeQuestion=null;state.black=false;
  }
  send();render();
  if(lesson?.id!=='inner-healing-2026-10-25')resolveSpanish(sc,revision);
  return true;
}
function trackSideScripture(){
  const id=state.scriptureOutput?.fumsId;
  if(!id||!window._BAPI?.t||window._ministryTrackedFums===id)return;
  try{window._BAPI.t(id);window._ministryTrackedFums=id}catch(e){}
}
function sermonSpanishSideSlide(s){
  const slide=s||slides()[0];
  const kind=String(slide.type||'statement').replace(/[^a-z-]/g,'');
  const content=slideHtml(slide,false,'es');
  return '<div class="ih-side-slide ih-side-'+kind+'" lang="es" data-sermon-cue="'+state.slide+'">'
    +content+(slide.type==='verse'?'<div class="ih-side-verse-source">Reina-Valera 1960 (RVR1960)</div><div class="ih-side-verse-copyright">'+esc(lesson.spanishCopyrightNotice||'')+'</div>':'')+'</div>';
}
function sideTvExplanationHtml(note){
  if(!note?.title||!note?.body)return '';
  return '<aside class="scripture-teaching" lang="es"><div class="scripture-teaching-label">EXPLICACIÓN DE LA LECCIÓN</div><h2>'+esc(note.title)+'</h2><p>'+esc(note.body)+'</p></aside>';
}
function projectorScriptureHtml(v){
  const sc=normalizeScripture(v); if(!sc)return '';
  return '<div class="take-ref">'+esc(sc.ref_en)+'</div><div class="take-text">'+esc(sc.text_en)+'</div>';
}

function takeover(){
  if(state.overlay)return projectorScriptureHtml(state.overlay);
  if(state.activeQuestion)return '<div class="take-k">'+esc(langText('Anonymous Question','Pregunta Anónima'))+'</div><div class="take-q">'+esc(state.activeQuestion.text)+'</div>';
  if(state.activePoll){
    const raw=poll(state.activePoll.id), p=localizedPoll(raw); if(!p)return '';
    if(state.activePoll.mode==='question')return '<div class="take-k">'+esc(langText('Live Poll','Encuesta En Vivo'))+'</div><div class="take-q">'+esc(p.question)+'</div><div class="poll-options">'+(p.options||[]).map((o,i)=>'<div class="step"><div class="step-n">'+String.fromCharCode(65+i)+'</div><div class="step-t">'+esc(o)+'</div></div>').join('')+'</div>';
    const c=state.activePoll.results||{},t=state.activePoll.total||0;
    return '<div class="take-k">'+esc(langText('Live Results','Resultados'))+' · '+t+'</div><div class="take-q">'+esc(p.question)+'</div><div class="poll-options">'+(p.options||[]).map((o,i)=>{const canonical=(raw.options||[])[i]||o,n=c[canonical]||0,pc=t?Math.round(n/t*100):0;return '<div class="poll-option"><div class="poll-label">'+esc(o)+'</div><div class="poll-bar"><div class="poll-fill" style="width:'+pc+'%"></div></div><div class="poll-pct">'+pc+'%</div></div>'}).join('')+'</div>';
  }
  return '';
}

async function loadLesson(id,{broadcast=false,reset=false}={}){
  const target=id||library?.latest;
  const next=await window.MinistryLessonLoader.get(target);
  lesson=next; state.lessonId=next.id; theme();
  try{localStorage.setItem('ministry_engine_lesson',next.id)}catch(e){}
  document.title=next.title+' · The Ministry';
  if(reset){state.started=false;state.slide=0;state.overlay=state.activePoll=state.activeQuestion=null;state.scriptureOutput=null;state.black=false;state.startedAt=null;state.timerStoppedAt=null}
  buildForView();
  render();
  if(broadcast)send();
}

async function bootstrap(){
  library=await window.MinistryLessonLoader.library();
  const qLesson=new URLSearchParams(location.search).get('lesson');
  const preferred=qLesson||localStorage.getItem('ministry_engine_lesson')||library.latest;
  await loadLesson(preferred);
  showView();
  startLocal();
  await syncServerClock();
  await initNetwork();
  bind();
  if(view==='class')initClass();
  if((view==='remote'||view==='presenter')&&lesson?.id!=='inner-healing-2026-10-25')loadAudienceData();
}

function showView(){
  const id={remote:'remote',presenter:'presenter',projector:'projector',confidence:'confidence',scriptures:'scriptures',obsslides:'obsslides',obslowerthirds:'obslowerthirds',class:'class-portal'}[view]||'remote';
  $(id)?.classList.remove('hidden');
  if(['projector','confidence','scriptures','obsslides','obslowerthirds'].includes(view))document.body.style.overflow='hidden';
}

function buildForView(){
  if(view==='remote')buildRemote();
  if(view==='presenter')buildPresenter();
  if(view==='class')renderClass();
}

function buildRemote(){
  const sel=$('lesson-select');
  if(sel&&library){
    sel.innerHTML=library.lessons.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===lesson.id?'selected':'')+'>'+esc(x.series+' · '+x.sequence+' · '+x.title)+'</option>').join('');
  }
  const list=$('slide-list'); if(list)list.innerHTML=slides().map((s,i)=>'<button class="slide-item" data-slide="'+i+'"><span class="si-n">'+String(i+1).padStart(2,'0')+'</span><span><span class="si-k">'+esc(s.type||'slide')+'</span><span class="si-t">'+esc(clean(titleOf(s)))+'</span></span></button>').join('');
  const vb=$('verse-list'); if(vb)vb.innerHTML=verses().length?verses().map((v,i)=>'<div class="verse-row"><div><div class="v-ref">'+esc(v.ref||v.ref_en||'')+'</div><div class="v-text">'+esc(v.text||v.text_en||'')+'</div></div><div class="verse-actions"><button class="btn small" data-verse="'+i+'">Push Everywhere</button><button class="btn small" data-verse-tv="'+i+'">TV Only</button></div></div>').join(''):'<div class="qa-item"><p>No separate Scripture bank is attached to this archived lesson yet.</p></div>';
  renderPollAdmin();
}

function notePollHtml(p,slideIndex){
  return '<div class="note-poll" data-note-poll="'+esc(p.id)+'"><div class="note-poll-eyebrow">POLL CUE · SLIDE '+(slideIndex+1)+'</div><div class="note-poll-question">'+esc(p.question)+'</div><div class="note-poll-actions"><button type="button" class="note-poll-launch" data-ipad-poll-cue-launch="'+esc(p.id)+'" data-ipad-poll-cue-slide="'+slideIndex+'">Launch Poll</button><button type="button" class="note-poll-secondary" data-ipad-poll-results="'+esc(p.id)+'" disabled>Show Results</button><button type="button" class="note-poll-secondary" data-ipad-poll-close="'+esc(p.id)+'" disabled>Close Poll</button></div><div class="note-poll-status" data-note-poll-status aria-live="polite">Ready to launch when you reach this slide.</div></div>';
}

function buildPresenter(){
  if($('presenter-lesson'))$('presenter-lesson').textContent=lesson.series+' · '+lesson.sequence+' · '+lesson.title;
  const root=$('manuscript'); if(!root)return;
  const rows=lesson.manuscript?.length?lesson.manuscript:slides().map(s=>({title:titleOf(s),html:s.sub?'<p>'+esc(clean(s.sub))+'</p>':'',refs:s.ref?[s.ref]:[],notes:s.notes||''}));
  root.innerHTML=rows.map((m,i)=>'<section class="note-section" data-note="'+i+'"><div class="note-head"><div><div class="note-label">Cue '+String(i+1).padStart(2,'0')+' / '+rows.length+'</div><div class="note-title">'+esc(clean(m.title||titleOf(slides()[i])))+'</div></div><button type="button" class="note-cue" data-cue="'+i+'" aria-label="Take projector cue '+(i+1)+': '+esc(clean(titleOf(slides()[i])))+'">TAKE CUE '+String(i+1).padStart(2,'0')+'</button></div>'+pollsForSlide(i).map(p=>notePollHtml(p,i)).join('')+'<div class="note-body">'+(m.html||'')+'</div>'+((m.refs||[]).length?'<div class="note-label">'+(m.refs||[]).map(esc).join(' · ')+'</div>':'')+(m.notes?'<div class="notes">'+esc(clean(m.notes))+'</div>':'')+'</section>').join('');
  window.MinistryIpadMount?.();
}

function renderPollAdmin(){
  const host=$('poll-list');if(!host)return;
  host.innerHTML=polls().length?polls().map(p=>'<div class="poll-admin"><div class="poll-cue">'+esc(p.cue||'Poll')+'</div><p>'+esc(p.question)+'</p><div class="poll-actions"><button class="btn small" data-poll-launch="'+esc(p.id)+'">Launch</button><button class="btn small" data-poll-results="'+esc(p.id)+'">Results</button><button class="btn small" data-poll-close="'+esc(p.id)+'">Close</button></div></div>').join(''):'<div class="qa-item"><p>This archived lesson has no unified poll definitions yet.</p></div>';
  if($('poll-badge'))$('poll-badge').textContent=votes.length;
}

function render(){
  if(!lesson)return;theme();
  const ss=slides(),s=ss[state.slide]||ss[0];
  if(view==='projector'){
    $('p-inner').innerHTML=state.started?slideHtml(s,true,lesson?.id==='inner-healing-2026-10-25'?'en':state.language):slideHtml(ss[0],true,lesson?.id==='inner-healing-2026-10-25'?'en':state.language);
    const t=takeover();$('p-take').classList.toggle('hidden',!t);$('p-take-inner').innerHTML=t;$('p-black').classList.toggle('hidden',!state.black);
  }
  if(view==='obsslides')$('obs-slide-inner').innerHTML=state.started?slideHtml(s,false,lesson?.id==='inner-healing-2026-10-25'?'en':state.language):slideHtml(ss[0],false,lesson?.id==='inner-healing-2026-10-25'?'en':state.language);
  if(view==='obslowerthirds'){
    const box=$('lower-box');let d=null;
    if(state.overlay)d={title:state.overlay.ref_es&&state.language!=='en'?state.overlay.ref_es:(state.overlay.ref_en||state.overlay.ref),sub:state.language==='en'?(state.overlay.text_en||state.overlay.text):(state.overlay.text_es||state.overlay.text_en||state.overlay.text)};
    else if(state.activeQuestion)d={title:langText('Anonymous Question','Pregunta Anónima'),sub:state.activeQuestion.text};
    else if(state.activePoll){const p=localizedPoll(poll(state.activePoll.id));d={title:langText('Live Poll','Encuesta En Vivo'),sub:p?.question||''}}
    else if(state.started){const ls=localizedSlide(s);d={title:ls.ref||ls.kicker||titleOf(ls),sub:ls.sub||''}}
    box.classList.toggle('hidden',!d);if(d){$('lower-series').textContent=lesson.series+' · '+lesson.sequence;$('lower-title').textContent=d.title;$('lower-sub').textContent=d.sub}
  }
  if(view==='scriptures'){
    const c=$('scripture-content');
    if(lesson?.id==='inner-healing-2026-10-25'){
      const explicit=state.scriptureCueMode==='manual'&&!state.sideScreenCleared&&state.scriptureOutput;
      const cleared=!!state.sideScreenCleared;
      const key=JSON.stringify([lesson.id,state.started,state.slide,state.seq,cleared,
        explicit&&state.scriptureRevision,explicit&&state.scriptureOutput?.ref_en]);
      c.classList.toggle('wait',!state.started||cleared);
      c.classList.remove('with-explanation');
      c.classList.toggle('ih-slide-mode',!!state.started&&!explicit&&!cleared);
      if(c.dataset.scriptureKey!==key){
        c.dataset.scriptureKey=key;
        c.innerHTML=cleared?'<div class="scripture-wait-title">ESCRITURA DESPEJADA</div>':
          explicit?scriptureHtml(state.scriptureOutput):
          sermonSpanishSideSlide(state.started?s:ss[0]);
      }
    }else{
      const current=state.scriptureOutput;
      const note=!current&&state.started&&s.type!=='verse'?s.tvExplanationEs:null;
      const key=JSON.stringify([lesson.id,state.scriptureRevision,current?.ref_en||current?.ref||'',current?.text_es||'',current?.spanishStatus||'',current?.fumsId||'',note?.title||'',note?.body||'']);
      c.classList.toggle('wait',!current&&!note);
      c.classList.toggle('with-explanation',!!note);
      if(c.dataset.scriptureKey!==key){
        c.dataset.scriptureKey=key;
        c.innerHTML=(current?scriptureHtml(current):note?'':'<div class="scripture-wait-title">ESPERANDO LA ESCRITURA</div><div class="scripture-wait-sub">El último versículo permanece hasta que llegue uno nuevo.</div>')+sideTvExplanationHtml(note);
        trackSideScripture();
      }
    }
  }
  if(view==='confidence')renderConfidence();
  if(view==='remote')renderRemoteCue();
  if(view==='presenter'){renderPresenterLive();tick()}
  if(view==='class')renderClass();
}

function renderRemoteCue(){
  const ss=slides(),s=ss[state.slide]||ss[0],next=state.started?(ss[state.slide+1]||null):ss[0];
  if($('cue-num'))$('cue-num').textContent=state.started?String(state.slide+1).padStart(2,'0'):'00';
  if($('cue-title'))$('cue-title').textContent=state.started?clean(titleOf(localizedSlide(s))):'Standby';
  if($('cue-type'))$('cue-type').textContent=lesson.series+' · '+lesson.sequence;
  if($('cue-notes'))$('cue-notes').textContent=state.started?(s.notes||'No presenter note for this slide.'):(lesson.title+' · '+lesson.scripture);
  if($('next-cue'))$('next-cue').innerHTML='<strong>Next</strong>'+esc(next?clean(titleOf(next)):'End');
  if($('next-btn'))$('next-btn').textContent=!state.started?'Start':state.slide>=ss.length-1?'End':'Next →';
  if($('black-btn'))$('black-btn').classList.toggle('on',state.black);
  if($('scripture-tv-state')){
    const sc=normalizeScripture(state.scriptureOutput);
    $('scripture-tv-state').innerHTML=sc
      ? '<strong>'+esc(sc.ref_es||sc.ref_en)+'</strong> · persistent on side TV'
      : '<strong>Standby</strong> · Spanish RVR / English KJV';
  }
  document.querySelectorAll('[data-slide]').forEach(b=>b.classList.toggle('on',state.started&&Number(b.dataset.slide)===state.slide));
}

function renderPresenterLive(){
  document.querySelectorAll('[data-note]').forEach(n=>n.classList.toggle('is-live',state.started&&Number(n.dataset.note)===state.slide));
  document.querySelectorAll('[data-cue]').forEach(b=>{const on=state.started&&Number(b.dataset.cue)===state.slide;b.classList.toggle('live',on);b.textContent=on?'ON SCREEN':'TAKE CUE '+String(Number(b.dataset.cue)+1).padStart(2,'0')});
  document.querySelectorAll('[data-note-poll]').forEach(box=>{
    const active=state.activePoll?.id===box.dataset.notePoll;
    const liveQuestion=active&&state.activePoll.mode==='question';
    const liveResults=active&&state.activePoll.mode==='results';
    box.classList.toggle('note-poll-live',active);
    const launch=box.querySelector('[data-ipad-poll-cue-launch]');
    if(launch){launch.disabled=liveQuestion;launch.textContent=liveQuestion?'Poll Live':liveResults?'Show Question':'Launch Poll'}
    const results=box.querySelector('[data-ipad-poll-results]');
    if(results)results.disabled=!active||liveResults;
    const close=box.querySelector('[data-ipad-poll-close]');
    if(close)close.disabled=!active;
    const status=box.querySelector('[data-note-poll-status]');
    if(status)status.textContent=liveQuestion?'LIVE · Audience can vote now':liveResults?'RESULTS ON PROJECTOR · Close to return to slide':'Ready to launch when you reach this slide.';
  });
  window.MinistryIpadRender?.();
}

function renderConfidence(){
  const ss=slides(),s=ss[state.slide]||ss[0],n=ss[state.slide+1];
  const idx=state.started?state.slide:0;
  const m=lesson?.manuscript?.[idx];
  $('conf-status').textContent=(lesson.series+' · '+lesson.sequence).toUpperCase();
  $('conf-k').textContent=state.started?'CURRENT · SLIDE '+(state.slide+1)+' / '+ss.length:'STANDBY';
  $('conf-title').textContent=state.started?clean(titleOf(localizedSlide(s))):lesson.title;
  const overlayRef=state.overlay?.ref_en||state.overlay?.ref||'';
  $('conf-ref').textContent=overlayRef?'ON PROJECTOR · '+clean(overlayRef):
    state.started?(localizedSlide(s).ref||localizedSlide(s).kicker||lesson.scripture):lesson.scripture;
  $('conf-next').textContent=state.started?(n?clean(titleOf(n)):'End'):clean(titleOf(ss[0]));
  const notes=$('conf-notes');
  const key=lesson.id+':'+idx+':'+(state.started?'live':'standby');
  if(notes?.dataset.noteKey!==key){
    notes.dataset.noteKey=key;
    notes.textContent='';
    if(state.started && m?.html){
      const parsed=document.createElement('template');
      parsed.innerHTML=m.html;
      // The manuscript comes from authored lesson files, not audience submissions.
      notes.appendChild(parsed.content);
    }else notes.textContent=state.started?(s.notes||'No presenter note for this slide.'):'Waiting for the lesson to start.';
    notes.scrollTop=0;
  }
  const live=state.activePoll?.id&&poll(state.activePoll.id);
  const pollTag=$('conf-poll');
  if(pollTag){pollTag.hidden=!live;pollTag.textContent=live?(state.activePoll.mode==='results'?'POLL RESULTS · ':'LIVE POLL · ')+live.question:''}
  tick();
}

function tick(){
  const val=sessionElapsedLabel(elapsedSessionSeconds());
  // Never run independent counters on the iPad and confidence displays.
  // Each reads the shared session start timestamp even after Safari suspends.
  for(const id of ['conf-time','ipad-time']){
    const el=$(id);if(!el)continue;
    if(el.textContent!==val)el.textContent=val;
    el.dataset.running=state.started?'yes':'no';
    el.setAttribute('aria-label',state.started?'Session elapsed time '+val:'Session not started');
  }
}

function go(i){
  const ss=slides();if(!ss.length)return;
  const t=Math.max(0,Math.min(Number(i)||0,ss.length-1)),now=sessionNow();
  if(!state.started||t===0){state.started=true;state.startedAt=now;state.timerStoppedAt=null}
  state.slide=t;state.overlay=state.activePoll=state.activeQuestion=null;state.black=false;
  if(lesson?.id==='inner-healing-2026-10-25'){
    state.scriptureRevision=(state.scriptureRevision||0)+1;
    state.scriptureOutput=null;
    state.scriptureCueMode='slide';
    state.sideScreenCleared=false;
  }
  const autoScripture=scriptureForSlide(t);
  let revision=null;
  if(autoScripture){
    revision=state.scriptureRevision=(state.scriptureRevision||0)+1;
    state.scriptureOutput={...autoScripture,revision,spanishStatus:autoScripture.text_es?'ready':'loading'};
  }
  send();render();
  if(autoScripture&&lesson?.id!=='inner-healing-2026-10-25')resolveSpanish(autoScripture,revision);
}
function next(){if(lesson?.id==='inner-healing-2026-10-25'&&state.overlay?.ref_en&&state.started)return go(Math.min(state.slide+1,slides().length-1));if(state.overlay||state.activePoll||state.activeQuestion)return clearTakeover();if(!state.started)return go(0);if(state.slide<slides().length-1)return go(state.slide+1);reset()}
function prev(){if(state.overlay||state.activePoll||state.activeQuestion)return clearTakeover();if(!state.started)return;if(state.slide>0)return go(state.slide-1);reset()}
function reset(){state.started=false;state.slide=0;state.overlay=state.activePoll=state.activeQuestion=null;state.black=false;state.startedAt=null;state.timerStoppedAt=null;send();render()}
function clearTakeover(){state.overlay=state.activePoll=state.activeQuestion=null;state.black=false;send();render()}
function clearScriptureOutput(){state.scriptureRevision=(state.scriptureRevision||0)+1;state.scriptureOutput=null;send();render()}
function clearPresentedScripture(){
  // A single transport command clears only the scripture takeover and side screen.
  // Ordinary slide state, timer, and any unrelated audience state stay untouched.
  const hasScripture=!!state.scriptureOutput||!!(state.overlay&&(state.overlay.ref_en||state.overlay.ref));
  if(!hasScripture)return false;
  state.scriptureRevision=(state.scriptureRevision||0)+1;
  state.scriptureOutput=null;
  if(state.overlay&&(state.overlay.ref_en||state.overlay.ref))state.overlay=null;
  if(lesson?.id==='inner-healing-2026-10-25'){
    state.scriptureCueMode='slide';
    state.sideScreenCleared=true;
  }
  send();render();
  return true;
}
function toggleBlack(){state.black=!state.black;send();render()}
function pushVerse(i){const v=verses()[i];return v?takeScripture(v,'both'):false}
function pushVerseTV(i){const v=verses()[i];return v?takeScripture(v,'tv'):false}
function pushScripture(v,target='both'){return takeScripture(v,target)}
function setLanguage(lang){if(!['en','es','bilingual'].includes(lang))return;state.language=lang;send();render()}

async function persistPollDefinition(p,status='live'){
  if(!p)return false;
  const r=await fetch('/api/poll-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({series_slug:lesson.seriesSlug,lesson_slug:lesson.slug,status,poll:{id:p.id,poll_id:p.id,question:p.question,options:p.options,type:'choice',save_anonymous:true}})});
  const d=await r.json().catch(()=>({}));if(!r.ok||d.saved===false)throw new Error(d.error||d.reason||'Poll storage unavailable');return true;
}
async function launchPoll(id){const p=poll(id);if(!p)return;try{await persistPollDefinition(p,'live')}catch(e){console.warn(e);window.MinistryIpadStatus?.('Poll was not launched: '+(e.message||'storage unavailable'),'error');return}state.activePoll={id,mode:'question'};state.overlay=state.activeQuestion=null;state.black=false;send();render();window.MinistryIpadStatus?.('Poll live: '+p.question,'ok')}
function voteCounts(p){const out={};(p?.options||[]).forEach(o=>out[o]=0);votes.filter(v=>String(v.poll_id)===String(p?.id)).forEach(v=>{if(Object.hasOwn(out,v.answer))out[v.answer]++});return out}
async function showPollResults(id){const ok=await loadAudienceData();if(!ok){window.MinistryIpadStatus?.('Cannot verify vote counts. Results not shown.','error');return}const p=poll(id);if(!p)return;const c=voteCounts(p),total=Object.values(c).reduce((a,b)=>a+b,0);state.activePoll={id,mode:'results',results:c,total};state.overlay=state.activeQuestion=null;state.black=false;send();render();window.MinistryIpadStatus?.('Results shown: '+total+' recorded vote(s).','ok')}
async function closePoll(id){const p=poll(id||state.activePoll?.id);if(p)persistPollDefinition(p,'closed').catch(()=>{});state.activePoll=null;send();render()}
function showQuestion(i){const q=questions[i];if(!q)return;state.activeQuestion={id:q.id||q.question_id||String(i),text:q.text};state.overlay=state.activePoll=null;state.black=false;send();render()}

async function loadAudienceData(){
  if(!lesson)return;
  try{
    const [q,p]=await Promise.all([
      fetch('/api/questions-list?series_slug='+encodeURIComponent(lesson.seriesSlug)+'&lesson_slug='+encodeURIComponent(lesson.slug),{cache:'no-store'}),
      fetch('/api/polls-list?series_slug='+encodeURIComponent(lesson.seriesSlug)+'&lesson_slug='+encodeURIComponent(lesson.slug),{cache:'no-store'})
    ]);
    const qd=await q.json().catch(()=>({})),pd=await p.json().catch(()=>({}));
    questions=q.ok&&Array.isArray(qd.questions)?qd.questions:[];
    votes=p.ok&&Array.isArray(pd.votes)?pd.votes:[];
    if(view==='remote'){
      if($('q-badge'))$('q-badge').textContent=questions.length;
      if($('q-list'))$('q-list').innerHTML=questions.length?questions.map((x,i)=>'<div class="qa-item"><p>'+esc(x.text)+'</p><button class="btn small" data-question="'+i+'">Display</button></div>').join(''):'<div class="qa-item"><p>No anonymous questions yet.</p></div>';
      renderPollAdmin();
    }
  if(view==='presenter')window.MinistryIpadAudience?.();
    return q.ok&&p.ok;
  }catch(e){console.warn('Audience load failed',e);window.MinistryIpadStatus?.('Could not refresh audience responses.','error');return false}
}

function bind(){
  if(view==='remote'){
    $('lesson-select')?.addEventListener('change',e=>loadLesson(e.target.value,{broadcast:true,reset:true}));
    $('prev-btn')?.addEventListener('click',prev);$('next-btn')?.addEventListener('click',next);$('black-btn')?.addEventListener('click',toggleBlack);$('clear-btn')?.addEventListener('click',clearTakeover);$('clear-scripture-btn')?.addEventListener('click',clearScriptureOutput);$('refresh-audience')?.addEventListener('click',loadAudienceData);
    document.addEventListener('click',e=>{
      const s=e.target.closest('[data-slide]');if(s)return go(Number(s.dataset.slide));
      const v=e.target.closest('[data-verse]');if(v)return pushVerse(Number(v.dataset.verse));
      const tv=e.target.closest('[data-verse-tv]');if(tv)return pushVerseTV(Number(tv.dataset.verseTv));
      const pl=e.target.closest('[data-poll-launch]');if(pl)return launchPoll(pl.dataset.pollLaunch);
      const pr=e.target.closest('[data-poll-results]');if(pr)return showPollResults(pr.dataset.pollResults);
      const pc=e.target.closest('[data-poll-close]');if(pc)return closePoll(pc.dataset.pollClose);
      const q=e.target.closest('[data-question]');if(q)return showQuestion(Number(q.dataset.question));
    });
    setInterval(loadAudienceData,4500);
  }
  if(view==='presenter'){
    document.addEventListener('click',e=>{const b=e.target.closest('[data-cue]');if(b)go(Number(b.dataset.cue))});
  }
  setInterval(()=>{if(view==='confidence'||view==='presenter')tick()},500);
  setInterval(()=>{void syncServerClock()},60000);
  const catchUp=()=>{tick();void syncServerClock().then(()=>{tick();return readLatest()})};
  // iPad Safari suspends timers in the background. Catch up on foreground,
  // back/forward restores, or network return, without restarting the session.
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)catchUp()});
  window.addEventListener('pageshow',catchUp);
  window.addEventListener('online',catchUp);
  if(view==='scriptures')setInterval(trackSideScripture,1500);
}

function startLocal(){try{bc=new BroadcastChannel(CHANNEL);bc.onmessage=e=>handle(e.data)}catch(e){}}
async function config(){try{const r=await fetch('/api/config',{cache:'no-store'}),d=await r.json();sbUrl=d.supabaseUrl||'';sbKey=d.supabaseAnonKey||''}catch(e){}}
async function readLatest(){
  if(!sbUrl||!sbKey)return;
  try{
    const r=await fetch(sbUrl+'/rest/v1/sync_state?id=eq.'+SYNC_ID+'&select=payload',{headers:{apikey:sbKey,Authorization:'Bearer '+sbKey},cache:'no-store'});
    const rows=await r.json(),raw=rows?.[0]?.payload,msg=typeof raw==='string'?JSON.parse(raw):raw;
    if(msg?.type===TYPE&&msg.room===ROOM&&sessionNow()-(msg.ts||msg.state?.ts||0)<TTL)await handle(msg);
  }catch(e){}
}
async function initNetwork(){
  await config();
  if(!sbUrl||!sbKey){markSync(false,'Local only');return}
  await readLatest();
  const start=()=>{try{
    sbClient=window.supabase.createClient(sbUrl,sbKey,{realtime:{params:{eventsPerSecond:20}}});
    rtChannel=sbClient.channel('ministry-unified-live')
      .on('broadcast',{event:'state'},({payload})=>handle(payload))
      .on('postgres_changes',{event:'*',schema:'public',table:'sync_state',filter:'id=eq.'+SYNC_ID},p=>{try{const raw=p.new?.payload,m=typeof raw==='string'?JSON.parse(raw):raw;handle(m)}catch(e){}})
      .subscribe(status=>{
        if(status==='SUBSCRIBED'){markSync(true,'Live');void readLatest()}
        if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED')markSync(false,'Realtime error')
      });
  }catch(e){markSync(false,'Realtime error')}};
  if(window.supabase)start();else{const sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';sc.onload=start;document.head.appendChild(sc)}
  setInterval(readLatest,3000);
}
function markSync(ok,label){if($('conf-sync')){$('conf-sync').textContent=label;$('conf-sync').dataset.live=ok?'yes':'no'}if($('ipad-sync')){$('ipad-sync').textContent=label;$('ipad-sync').dataset.live=ok?'yes':'no'}if($('r-dot'))$('r-dot').classList.toggle('live',ok);if($('r-sync'))$('r-sync').textContent=label;if($('class-dot'))$('class-dot').classList.toggle('live',ok);if($('class-sync'))$('class-sync').textContent=label}
async function handle(msg){
  if(msg?.type!==TYPE||msg.room!==ROOM)return;
  const incoming=msg.state||msg,ts=Number(incoming.ts||msg.ts)||0;if(ts&&lastTs&&ts<=lastTs)return;lastTs=Math.max(lastTs,ts);
  const nextLesson=incoming.lessonId||state.lessonId;
  state={...state,...incoming,type:TYPE,room:ROOM};
  if(nextLesson&&nextLesson!==lesson?.id)await loadLesson(nextLesson);
  // Scripture TV state is explicit: clearing it stays cleared until a verse is actually sent.
  render();
}
function send(){
  const ts=Math.max(sessionNow(),lastTs+1);lastTs=ts;
  state={...state,room:ROOM,type:TYPE,seq:(state.seq||0)+1,ts,lessonId:lesson?.id||state.lessonId};
  const msg={type:TYPE,room:ROOM,state:{...state},ts:state.ts};
  try{if(!bc)bc=new BroadcastChannel(CHANNEL);bc.postMessage(msg)}catch(e){}
  try{rtChannel?.send({type:'broadcast',event:'state',payload:msg})}catch(e){}
  if(sbUrl&&sbKey){queuedSyncState=msg;void flushSyncState()}
}

const classLabels={
  liveClass:['Live Class','Clase en vivo'],
  intro:['Follow the lesson live, answer polls, and ask anonymous questions.','Sigue la lección en vivo, participa en las encuestas y envía preguntas anónimas.'],
  emailLabel:['Email address','Correo electrónico'],
  privacy:['Your email lets you participate. Questions are shown anonymously.','Tu correo permite participar. Tus preguntas se muestran de forma anónima.'],
  enter:['Enter Lesson','Entrar a la lección'],
  connecting:['Connecting','Conectando'],
  anonymousQuestion:['Anonymous Question','Pregunta anónima'],
  send:['Send Question','Enviar pregunta'],
  ask:['Ask something from the lesson…','Escribe una pregunta sobre la lección…']
};
function renderClassLanguageUi(){
  if(view!=='class')return;
  const root=$('class-portal');if(root)root.lang=classLanguage;
  document.querySelectorAll('[data-class-language]').forEach(b=>{
    const active=b.dataset.classLanguage===classLanguage;
    b.setAttribute('aria-pressed',active?'true':'false');
    b.classList.toggle('selected',active);
  });
  document.querySelectorAll('[data-class-i18n]').forEach(el=>{
    const words=classLabels[el.dataset.classI18n];if(words)el.textContent=words[classLanguage==='es'?1:0];
  });
  document.querySelectorAll('[data-class-placeholder]').forEach(el=>{
    const words=classLabels[el.dataset.classPlaceholder];if(words)el.placeholder=words[classLanguage==='es'?1:0];
  });
}
function setClassLanguage(language){
  if(!['en','es'].includes(language))return;
  classLanguage=language;
  try{localStorage.setItem('ministry_class_language',language)}catch(e){}
  renderClassLanguageUi();
  renderClass();
}

function initClass(){
  renderClassLanguageUi();
  document.querySelectorAll('[data-class-language]').forEach(b=>b.addEventListener('click',()=>setClassLanguage(b.dataset.classLanguage)));
  if(classEmail&&validEmail(classEmail))$('class-gate')?.classList.add('hidden');
  if($('class-email'))$('class-email').value=classEmail;
  $('class-enter')?.addEventListener('click',()=>{
    const v=String($('class-email')?.value||'').trim().toLowerCase();
    if(!validEmail(v)){if($('class-gate-error'))$('class-gate-error').textContent=classText('Enter a valid email address.','Escribe un correo electrónico válido.');return}
    classEmail=v;localStorage.setItem('ministry_class_email',v);$('class-gate')?.classList.add('hidden');renderClass();
  });
  $('class-question-send')?.addEventListener('click',submitQuestion);
}
function renderClass(){
  if(!lesson||view!=='class')return;
  renderClassLanguageUi();
  const raw=slides()[state.slide]||slides()[0]||{};
  const s=localizedSlide(raw,classLanguage);
  if($('class-gate-title'))$('class-gate-title').textContent=classLanguage==='es'?(lesson.title_es||lesson.title):lesson.title;
  if($('class-series'))$('class-series').textContent=classLanguage==='es'?(lesson.sequence_es||lesson.series+' · '+lesson.sequence):lesson.series+' · '+lesson.sequence;
  if($('class-kicker'))$('class-kicker').textContent=state.started?(s.kicker||lesson.sequence):classText('Waiting for lesson','Esperando la lección');
  if($('class-title'))$('class-title').textContent=state.started?clean(titleOf(s)):(classLanguage==='es'?(lesson.title_es||lesson.title):lesson.title);
  const ref=s.ref||lesson.scripture||'';
  if($('class-ref'))$('class-ref').textContent=classLanguage==='es'?(window.MinistrySpanishRef?.(ref)||ref):ref;
  const body=$('class-body');
  if(body){
    if(s.type==='contrast'){
      body.innerHTML='<div class="class-comparison"><div>'+esc(s.left||'')+'</div><div>'+esc(s.right||'')+'</div></div>';
    }else body.textContent=s.type==='verse'?(s.text||''):(s.sub||'');
  }
  if($('class-points')){
    const ps=s.points||s.steps||[];
    $('class-points').innerHTML=ps.map(x=>'<li>'+esc(clean(x))+'</li>').join('');
    $('class-points').style.display=ps.length?'block':'none';
  }
  renderClassPoll();
}
function renderClassPoll(){
  const host=$('class-poll');if(!host)return;
  if(!state.activePoll?.id||state.activePoll.mode!=='question'){host.innerHTML='';return}
  const raw=poll(state.activePoll.id),p=localizedPoll(raw,classLanguage);if(!p||!raw){host.innerHTML='';return}
  const saved=localStorage.getItem('ministry_vote_'+lesson.id+'_'+p.id)||'';
  host.innerHTML='<section class="class-card"><div class="ey">'+esc(classText('Live Poll','Encuesta en vivo'))+'</div><div class="class-poll-q">'+esc(p.question)+'</div>'+(p.options||[]).map((o,i)=>{const canonical=(raw.options||[])[i]||o;return '<button class="class-choice '+(saved===canonical?'selected':'')+'" data-class-vote-index="'+i+'">'+esc(o)+'</button>'}).join('')+'<div id="class-poll-state" class="class-state">'+(saved?classText('Vote saved. You can change it.','Voto guardado. Puedes cambiarlo.'):classText('Choose one answer.','Elige una respuesta.'))+'</div></section>';
  host.querySelectorAll('[data-class-vote-index]').forEach(b=>{const i=Number(b.dataset.classVoteIndex),canonical=(raw.options||[])[i];b.onclick=()=>submitVote(raw,canonical)});
}
async function submitVote(p,answer){
  if(!classEmail)return;
  const st=$('class-poll-state'),buttons=[...document.querySelectorAll('[data-class-vote-index]')];buttons.forEach(b=>b.disabled=true);if(st)st.textContent=classText('Saving vote…','Guardando el voto…');
  try{
    const r=await fetch('/api/poll-vote-submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({series_slug:lesson.seriesSlug,lesson_slug:lesson.slug,vote:{poll_id:p.id,pollId:p.id,question:p.question,options:p.options,answer,email:classEmail,session_id:classSession,anonymous:true,id:p.id+'_'+classSession}})});
    const d=await r.json().catch(()=>({}));if(!r.ok||d.saved===false)throw new Error(d.error||d.reason||'Vote was not saved');
    localStorage.setItem('ministry_vote_'+lesson.id+'_'+p.id,answer);renderClassPoll();const done=$('class-poll-state');if(done){done.textContent=classText('Vote saved. You can change it.','Voto guardado. Puedes cambiarlo.');done.classList.add('ok')}
  }catch(e){if(st)st.textContent=(e?.message||'Vote could not be saved')+'. '+classText('Tap an answer to retry.','Toca una respuesta para volver a intentarlo.');buttons.forEach(b=>b.disabled=false)}
}
async function submitQuestion(){
  const ta=$('class-question'),st=$('class-question-state'),text=String(ta?.value||'').trim();if(!text){if(st)st.textContent=classText('Type a question first.','Primero escribe una pregunta.');return}
  if(st)st.textContent=classText('Sending…','Enviando…');
  try{
    const r=await fetch('/api/question-submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'q_'+Date.now()+'_'+Math.random().toString(16).slice(2),text,series_slug:lesson.seriesSlug,lesson_slug:lesson.slug,name:'Anonymous',anonymous:true,session_id:classSession,email:classEmail})});
    const d=await r.json().catch(()=>({}));if(!r.ok||d.saved===false)throw new Error(d.error||d.reason||'Could not send');
    ta.value='';st.textContent=classText('Sent anonymously.','Enviada de forma anónima.');st.classList.add('ok')
  }catch(e){st.textContent=e?.message||classText('Could not send.','No se pudo enviar.')}
}

window.MinistryIpad={view,getLesson:()=>lesson,getLibrary:()=>library,getState:()=>state,getQuestions:()=>questions,getVotes:()=>votes,loadLesson,go,next,prev,reset,clearTakeover,clearScriptureOutput,clearPresentedScripture,toggleBlack,pushVerse,pushVerseTV,pushScripture,launchPoll,showPollResults,closePoll,showQuestion,loadAudienceData};

// Narrow bridge for the authenticated-presenter-facing console. Never expose secrets or raw database credentials.
window.MinistryIpadBridge={
 snapshot:()=>({lesson,library,state:{...state},questions:[...questions],votes:[...votes]}),
 loadLesson:id=>loadLesson(id,{broadcast:true,reset:true}),
 go,prev,next,reset,clearTakeover,clearScriptureOutput,clearPresentedScripture,toggleBlack,
 pushVerse,pushVerseTV,pushScripture,launchPoll,showPollResults,closePoll,showQuestion,loadAudienceData
};
bootstrap().catch(err=>{
  console.error(err);
  document.body.innerHTML='<div style="padding:40px;font-family:system-ui;background:#090909;color:white;min-height:100vh"><h1>Teaching engine could not start</h1><p>'+esc(err.message||String(err))+'</p><p><a href="/lessons" style="color:#61c7ff">Open Lesson Library</a></p></div>';
});
})();