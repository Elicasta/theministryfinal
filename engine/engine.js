(() => {
'use strict';

const ROOM='ministry-unified-v2', CHANNEL=ROOM, SYNC_ID=1, TYPE='ministry_unified_state', TTL=14400000;
const CLASS_URL=location.origin+'/class', GUIDE_URL='https://apostolicguide.com/';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>String(s??'').replace(/<[^>]*>/g,'').replace(/&middot;/g,'·').replace(/&rarr;/g,'→').replace(/&ldquo;|&rdquo;/g,'"').replace(/&rsquo;/g,"'");
const qr=u=>'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data='+encodeURIComponent(u);

const path=location.pathname.toLowerCase().replace(/\/+$/,'')||'/';
const queryView=(new URLSearchParams(location.search).get('view')||'').toLowerCase();
const pathView={
  '/live':'remote','/teach':'remote','/admin':'remote','/remote':'remote','/mobile':'presenter','/projector':'projector','/scriptures':'scriptures','/scripture':'scriptures',
  '/confidence':'confidence','/obsslides':'obsslides','/obslowerthirds':'obslowerthirds','/class':'class','/presenter':'presenter'
}[path];
const view=queryView||pathView||'remote';

let library=null, lesson=null, questions=[], votes=[], bc=null, sbUrl='', sbKey='', sbClient=null, rtChannel=null, lastTs=0;
let classEmail=localStorage.getItem('ministry_class_email')||'';
let classSession=localStorage.getItem('ministry_class_session')||('class_'+(crypto.randomUUID?crypto.randomUUID():Date.now()+Math.random().toString(16).slice(2)));
localStorage.setItem('ministry_class_session',classSession);

let state={
  room:ROOM,type:TYPE,lessonId:null,started:false,slide:0,overlay:null,scriptureOutput:null,black:false,activePoll:null,activeQuestion:null,
  startedAt:null,timerStoppedAt:null,language:'en',seq:0,ts:Date.now()
};

function titleOf(s){return s?.title||s?.ref||s?.kicker||'Slide'}
function slides(){return lesson?.slides||[]}
function verses(){return lesson?.verses||[]}
function polls(){return lesson?.polls||[]}
function poll(id){return polls().find(p=>String(p.id)===String(id))}
function theme(){document.body.dataset.theme=lesson?.theme||'default';const link=$('lesson-theme-css');if(link){if(lesson?.theme==='evidence'){if(link.getAttribute('href')!=='/kingdom-evidence.css')link.setAttribute('href','/kingdom-evidence.css')}else link.removeAttribute('href')}}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim())}
function langText(en,es){return state.language==='es'?(es||en):en}
function hasSpanishSlide(s){
  return !!(s?.es || lesson?.translations?.es?.slides?.[s?._index]);
}
function localizedSlide(s){
  if(!s || state.language==='en') return s;
  const tr=s.es||lesson?.translations?.es?.slides?.[s._index]||null;
  return tr?{...s,...tr,_english:s}:{...s,_translationMissing:true,_english:s};
}
function localizedPoll(p){
  if(!p||state.language==='en')return p;
  const tr=p.es||lesson?.translations?.es?.polls?.[p.id]||null;
  return tr?{...p,...tr,_english:p}:{...p,_translationMissing:true,_english:p};
}

function slideHtml(raw,withQr=true){
  const s=localizedSlide(raw)||{};
  const k=s.kicker?'<div class="p-kicker">'+esc(clean(s.kicker))+'</div>':'';
  const sub=s.sub?'<div class="p-sub">'+esc(clean(s.sub))+'</div>':'';
  const ref=s.ref?'<div class="p-ref">'+esc(clean(s.ref))+'</div>':'';
  const translation=(state.language==='bilingual'&&s._english&&hasSpanishSlide(s._english))
    ?'<div class="presented-translation"><div class="translation-label">English</div>'+esc(clean(s._english.title||s._english.text||s._english.sub||''))+'</div>':'';
  const missing=(state.language!=='en'&&s._translationMissing)?'<div class="p-sub">Spanish translation not authored for this slide yet.</div>':'';

  if(s.type==='cover')return '<div class="cover">'+k+'<div class="p-title">'+esc(clean(s.title))+'</div><div class="rule"></div>'+sub+ref+missing+(withQr?'<div class="qr-row"><div class="qr"><img src="'+qr(CLASS_URL)+'"><strong>Join Lesson</strong></div><div class="qr"><img src="'+qr(GUIDE_URL)+'"><strong>Apostolic Guide</strong></div></div>':'')+'</div>';
  if(s.type==='verse')return k+ref+'<div class="rule"></div><div class="p-verse">'+esc(clean(s.text||''))+'</div>'+sub+missing+translation;
  if(s.type==='statement')return k+ref+'<div class="statement">'+esc(clean(s.title||s.text||''))+'</div>'+sub+missing+translation;
  if(s.type==='prompt')return k+'<div class="p-title med">'+esc(clean(s.title||s.text||''))+'</div>'+sub+missing+translation;
  if(s.type==='points'||s.type==='illustration')return k+ref+'<div class="p-title med">'+esc(clean(s.title||''))+'</div><ul class="points">'+(s.points||[]).map(x=>'<li>'+esc(clean(x))+'</li>').join('')+'</ul>'+sub+missing+translation;
  if(s.type==='contrast')return k+'<div class="contrast"><div class="contrast-box"><div class="contrast-text">'+esc(clean(s.left||'')).replace(/\n/g,'<br>')+'</div></div><div class="contrast-box right"><div class="contrast-text">'+esc(clean(s.right||'')).replace(/\n/g,'<br>')+'</div></div></div>'+sub+missing+translation;
  if(s.type==='steps')return k+'<div class="p-title med">'+esc(clean(s.title||''))+'</div><div class="steps">'+(s.steps||[]).map((x,i)=>'<div class="step"><div class="step-n">'+(i+1)+'</div><div class="step-t">'+esc(clean(x))+'</div></div>').join('')+'</div>'+sub+missing;
  if(s.type==='check')return k+'<div class="check">'+(s.items||[]).map(x=>'<div class="check-item"><div class="check-l">'+esc(clean(Array.isArray(x)?x[0]:x))+'</div><div class="check-v">'+esc(clean(Array.isArray(x)?x[1]:''))+'</div></div>').join('')+'</div>'+sub+missing;
  if(s.type==='levels')return k+'<div class="p-title med">'+esc(clean(s.title||''))+'</div><div class="levels">'+(s.levels||[]).map((x,i)=>'<div class="level"><div class="level-n">'+(i+1)+'</div><div><div class="level-t">'+esc(clean(Array.isArray(x)?x[1]:x))+'</div><div class="level-d">'+esc(clean(Array.isArray(x)?x[2]:''))+'</div></div></div>').join('')+'</div>'+missing;
  if(s.type==='columns')return k+'<div class="p-title med">'+esc(clean(s.title||''))+'</div><div class="contrast"><div class="contrast-box"><div><div class="check-l">'+esc(clean(s.leftTitle||''))+'</div><ul class="points">'+(s.left||[]).map(x=>'<li>'+esc(clean(x))+'</li>').join('')+'</ul></div></div><div class="contrast-box right"><div><div class="check-l">'+esc(clean(s.rightTitle||''))+'</div><ul class="points">'+(s.right||[]).map(x=>'<li>'+esc(clean(x))+'</li>').join('')+'</ul></div></div></div>'+sub+missing;
  if(s.type==='progression')return k+'<div class="p-title med">'+(s.words||[]).map(esc).join(' → ')+'</div>'+sub+missing;
  return k+'<div class="p-title med">'+esc(clean(titleOf(s)))+'</div>'+sub+missing;
}

function normalizeScripture(v){
  if(!v)return null;
  return {
    ref_en:v.ref_en||v.ref||'',
    text_en:v.text_en||v.text||v.kjv||'',
    ref_es:v.ref_es||'',
    text_es:v.text_es||v.rvr||''
  };
}
function scriptureForSlide(index){
  const s=slides()[index];
  if(!s || s.type!=='verse') return null;
  const preserved=lesson?.slideScriptures?.[index];
  if(preserved && (preserved.text_en||preserved.text)) return normalizeScripture(preserved);
  const match=verses().find(v=>String(v.ref_en||v.ref||'').trim()===String(s.ref||'').trim());
  if(match) return normalizeScripture(match);
  return normalizeScripture({ref_en:s.ref||'',text_en:s.text||'',ref_es:s.ref_es||'',text_es:s.text_es||''});
}
function scriptureHtml(v){
  const sc=normalizeScripture(v); if(!sc)return '';
  const hasEs=!!sc.text_es;
  const spanishRef=sc.ref_es||sc.ref_en;
  return '<div class="scripture-primary">'+
      '<div class="scripture-ref">'+esc(spanishRef)+(hasEs?' · RVR 1960':'')+'</div>'+
      '<div class="scripture-text">'+esc(hasEs?sc.text_es:sc.text_en)+'</div>'+
    '</div>'+
    '<div class="scripture-secondary">'+
      '<div class="scripture-ref">'+esc(sc.ref_en)+(sc.text_en?' · KJV':'')+'</div>'+
      '<div class="scripture-text">'+esc(sc.text_en)+'</div>'+
    '</div>'+
    (!hasEs?'<div class="scripture-missing">Spanish RVR text has not been attached to this Scripture yet.</div>':'');
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
  await initNetwork();
  bind();
  if(view==='class')initClass();
  if(view==='remote')loadAudienceData();
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

function buildPresenter(){
  if($('presenter-lesson'))$('presenter-lesson').textContent=lesson.series+' · '+lesson.sequence+' · '+lesson.title;
  const root=$('manuscript'); if(!root)return;
  const rows=lesson.manuscript?.length?lesson.manuscript:slides().map(s=>({title:titleOf(s),html:s.sub?'<p>'+esc(clean(s.sub))+'</p>':'',refs:s.ref?[s.ref]:[],notes:s.notes||''}));
  root.innerHTML=rows.map((m,i)=>'<section class="note-section" data-note="'+i+'"><div class="note-head"><div><div class="note-label">Slide '+String(i+1).padStart(2,'0')+'</div><div class="note-title">'+esc(clean(m.title||titleOf(slides()[i])))+'</div></div><button class="note-cue" data-cue="'+i+'">Take Slide '+(i+1)+'</button></div><div class="note-body">'+(m.html||'')+'</div>'+((m.refs||[]).length?'<div class="note-label">'+(m.refs||[]).map(esc).join(' · ')+'</div>':'')+(m.notes?'<div class="notes">'+esc(clean(m.notes))+'</div>':'')+'</section>').join('');
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
    $('p-inner').innerHTML=state.started?slideHtml(s,true):slideHtml(ss[0],true);
    const t=takeover();$('p-take').classList.toggle('hidden',!t);$('p-take-inner').innerHTML=t;$('p-black').classList.toggle('hidden',!state.black);
  }
  if(view==='obsslides')$('obs-slide-inner').innerHTML=state.started?slideHtml(s,false):slideHtml(ss[0],false);
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
    c.classList.toggle('wait',!state.scriptureOutput);
    c.innerHTML=state.scriptureOutput
      ? scriptureHtml(state.scriptureOutput)
      : '<div class="scripture-wait-title">WAITING FOR SCRIPTURE</div><div class="scripture-wait-sub">The last Scripture stays here until another Scripture is received.</div>';
  }
  if(view==='confidence')renderConfidence();
  if(view==='remote')renderRemoteCue();
  if(view==='presenter')renderPresenterLive();
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
  document.querySelectorAll('[data-cue]').forEach(b=>{const on=state.started&&Number(b.dataset.cue)===state.slide;b.classList.toggle('live',on);b.textContent=on?'LIVE':'Take Slide '+(Number(b.dataset.cue)+1)});
}

function renderConfidence(){
  const ss=slides(),s=ss[state.slide]||ss[0],n=ss[state.slide+1];
  $('conf-status').textContent=(lesson.series+' · '+lesson.sequence).toUpperCase();
  $('conf-k').textContent=state.started?'Current':'Standby';
  $('conf-title').textContent=state.started?clean(titleOf(localizedSlide(s))):lesson.title;
  $('conf-ref').textContent=state.started?(localizedSlide(s).ref||localizedSlide(s).kicker||lesson.scripture):lesson.scripture;
  $('conf-next').textContent=state.started?(n?clean(titleOf(n)):'End'):clean(titleOf(ss[0]));
  $('conf-notes').textContent=state.started?(s.notes||'No presenter note for this slide.'):'Ready.';
  tick();
}

function tick(){
  const end=state.timerStoppedAt||Date.now(),sec=state.startedAt?Math.max(0,Math.floor((end-state.startedAt)/1000)):0;
  const val=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
  if($('conf-time'))$('conf-time').textContent=val;
}

function go(i){
  const ss=slides();if(!ss.length)return;const t=Math.max(0,Math.min(Number(i)||0,ss.length-1)),now=Date.now();
  if(!state.started){state.started=true;state.startedAt=now;state.timerStoppedAt=null}
  state.slide=t;state.overlay=state.activePoll=state.activeQuestion=null;state.black=false;
  const autoScripture=scriptureForSlide(t);
  if(autoScripture) state.scriptureOutput=autoScripture;
  if(t===ss.length-1)state.timerStoppedAt=null;
  send();render();
}
function next(){if(state.overlay||state.activePoll||state.activeQuestion)return clearTakeover();if(!state.started)return go(0);if(state.slide<slides().length-1)return go(state.slide+1);reset()}
function prev(){if(state.overlay||state.activePoll||state.activeQuestion)return clearTakeover();if(!state.started)return;if(state.slide>0)return go(state.slide-1);reset()}
function reset(){state.started=false;state.slide=0;state.overlay=state.activePoll=state.activeQuestion=null;state.black=false;state.startedAt=null;state.timerStoppedAt=null;send();render()}
function clearTakeover(){state.overlay=state.activePoll=state.activeQuestion=null;state.black=false;send();render()}
function clearScriptureOutput(){state.scriptureOutput=null;send();render()}
function toggleBlack(){state.black=!state.black;send();render()}
function pushVerse(i){const v=verses()[i];if(!v)return;const sc=normalizeScripture(v);state.overlay=sc;state.scriptureOutput=sc;state.activePoll=state.activeQuestion=null;state.black=false;send();render()}
function pushVerseTV(i){const v=verses()[i];if(!v)return;state.scriptureOutput=normalizeScripture(v);send();render()}
function setLanguage(lang){if(!['en','es','bilingual'].includes(lang))return;state.language=lang;send();render()}

async function persistPollDefinition(p,status='live'){
  if(!p)return false;
  const r=await fetch('/api/poll-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({series_slug:lesson.seriesSlug,lesson_slug:lesson.slug,status,poll:{id:p.id,poll_id:p.id,question:p.question,options:p.options,type:'choice',save_anonymous:true}})});
  const d=await r.json().catch(()=>({}));if(!r.ok||d.saved===false)throw new Error(d.error||d.reason||'Poll storage unavailable');return true;
}
async function launchPoll(id){const p=poll(id);if(!p)return;try{await persistPollDefinition(p,'live')}catch(e){console.warn(e)}state.activePoll={id,mode:'question'};state.overlay=state.activeQuestion=null;state.black=false;send();render()}
function voteCounts(p){const out={};(p?.options||[]).forEach(o=>out[o]=0);votes.filter(v=>String(v.poll_id)===String(p?.id)).forEach(v=>{if(Object.hasOwn(out,v.answer))out[v.answer]++});return out}
async function showPollResults(id){await loadAudienceData();const p=poll(id);if(!p)return;const c=voteCounts(p),total=Object.values(c).reduce((a,b)=>a+b,0);state.activePoll={id,mode:'results',results:c,total};state.overlay=state.activeQuestion=null;state.black=false;send();render()}
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
  }catch(e){console.warn('Audience load failed',e)}
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
  setInterval(()=>{if(view==='confidence')renderConfidence()},500);
}

function startLocal(){try{bc=new BroadcastChannel(CHANNEL);bc.onmessage=e=>handle(e.data)}catch(e){}}
async function config(){try{const r=await fetch('/api/config',{cache:'no-store'}),d=await r.json();sbUrl=d.supabaseUrl||'';sbKey=d.supabaseAnonKey||''}catch(e){}}
async function readLatest(){
  if(!sbUrl||!sbKey)return;
  try{
    const r=await fetch(sbUrl+'/rest/v1/sync_state?id=eq.'+SYNC_ID+'&select=payload',{headers:{apikey:sbKey,Authorization:'Bearer '+sbKey},cache:'no-store'});
    const rows=await r.json(),raw=rows?.[0]?.payload,msg=typeof raw==='string'?JSON.parse(raw):raw;
    if(msg?.type===TYPE&&msg.room===ROOM&&Date.now()-(msg.ts||msg.state?.ts||0)<TTL)await handle(msg);
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
      .subscribe(status=>{if(status==='SUBSCRIBED')markSync(true,'Live');if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')markSync(false,'Realtime error')});
  }catch(e){markSync(false,'Realtime error')}};
  if(window.supabase)start();else{const sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';sc.onload=start;document.head.appendChild(sc)}
  setInterval(readLatest,5000);
}
function markSync(ok,label){if($('r-dot'))$('r-dot').classList.toggle('live',ok);if($('r-sync'))$('r-sync').textContent=label;if($('class-dot'))$('class-dot').classList.toggle('live',ok);if($('class-sync'))$('class-sync').textContent=label}
async function handle(msg){
  if(msg?.type!==TYPE||msg.room!==ROOM)return;
  const incoming=msg.state||msg,ts=Number(incoming.ts||msg.ts)||0;if(ts&&lastTs&&ts<lastTs)return;lastTs=Math.max(lastTs,ts);
  const nextLesson=incoming.lessonId||state.lessonId;
  state={...state,...incoming,type:TYPE,room:ROOM};
  if(nextLesson&&nextLesson!==lesson?.id)await loadLesson(nextLesson);
  if(state.started && !state.scriptureOutput){
    const recovered=scriptureForSlide(state.slide);
    if(recovered) state.scriptureOutput=recovered;
  }
  render();
}
function send(){
  state={...state,room:ROOM,type:TYPE,seq:(state.seq||0)+1,ts:Date.now(),lessonId:lesson?.id||state.lessonId};
  const msg={type:TYPE,room:ROOM,state:{...state},ts:state.ts};
  try{if(!bc)bc=new BroadcastChannel(CHANNEL);bc.postMessage(msg)}catch(e){}
  try{rtChannel?.send({type:'broadcast',event:'state',payload:msg})}catch(e){}
  if(sbUrl&&sbKey)fetch(sbUrl+'/rest/v1/sync_state',{method:'POST',headers:{'Content-Type':'application/json',apikey:sbKey,Authorization:'Bearer '+sbKey,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({id:SYNC_ID,payload:JSON.stringify(msg),updated_at:new Date().toISOString()})}).catch(()=>{});
}

function initClass(){
  if(classEmail&&validEmail(classEmail))$('class-gate')?.classList.add('hidden');
  if($('class-email'))$('class-email').value=classEmail;
  $('class-enter')?.addEventListener('click',()=>{
    const v=String($('class-email')?.value||'').trim().toLowerCase();
    if(!validEmail(v)){if($('class-gate-error'))$('class-gate-error').textContent='Enter a valid email address.';return}
    classEmail=v;localStorage.setItem('ministry_class_email',v);$('class-gate')?.classList.add('hidden');renderClass();
  });
  $('class-question-send')?.addEventListener('click',submitQuestion);
}
function renderClass(){
  if(!lesson||view!=='class')return;
  const s=localizedSlide(slides()[state.slide]||slides()[0]||{});
  if($('class-gate-title'))$('class-gate-title').textContent=lesson.title;
  if($('class-series'))$('class-series').textContent=lesson.series+' · '+lesson.sequence;
  if($('class-kicker'))$('class-kicker').textContent=state.started?(s.kicker||lesson.sequence):langText('Waiting for lesson','Esperando la lección');
  if($('class-title'))$('class-title').textContent=state.started?clean(titleOf(s)):lesson.title;
  if($('class-ref'))$('class-ref').textContent=s.ref||lesson.scripture||'';
  if($('class-body'))$('class-body').textContent=s.type==='verse'?(s.text||''):(s.sub||'');
  if($('class-points')){const ps=s.points||s.steps||[];$('class-points').innerHTML=ps.map(x=>'<li>'+esc(clean(x))+'</li>').join('');$('class-points').style.display=ps.length?'block':'none'}
  renderClassPoll();
}
function renderClassPoll(){
  const host=$('class-poll');if(!host)return;
  if(!state.activePoll?.id||state.activePoll.mode!=='question'){host.innerHTML='';return}
  const raw=poll(state.activePoll.id),p=localizedPoll(raw);if(!p||!raw){host.innerHTML='';return}
  const saved=localStorage.getItem('ministry_vote_'+lesson.id+'_'+p.id)||'';
  host.innerHTML='<section class="class-card"><div class="ey">'+esc(langText('Live Poll','Encuesta En Vivo'))+'</div><div class="class-poll-q">'+esc(p.question)+'</div>'+(p.options||[]).map((o,i)=>{const canonical=(raw.options||[])[i]||o;return '<button class="class-choice '+(saved===canonical?'selected':'')+'" data-class-vote-index="'+i+'">'+esc(o)+'</button>'}).join('')+'<div id="class-poll-state" class="class-state">'+(saved?langText('Vote saved. You can change it.','Voto guardado. Puedes cambiarlo.'):langText('Choose one answer.','Escoge una respuesta.'))+'</div></section>';
  host.querySelectorAll('[data-class-vote-index]').forEach(b=>{const i=Number(b.dataset.classVoteIndex),canonical=(raw.options||[])[i];b.onclick=()=>submitVote(raw,canonical)});
}
async function submitVote(p,answer){
  if(!classEmail)return;
  const st=$('class-poll-state'),buttons=[...document.querySelectorAll('[data-class-vote]')];buttons.forEach(b=>b.disabled=true);if(st)st.textContent=langText('Saving vote…','Guardando voto…');
  try{
    const r=await fetch('/api/poll-vote-submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({series_slug:lesson.seriesSlug,lesson_slug:lesson.slug,vote:{poll_id:p.id,pollId:p.id,question:p.question,options:p.options,answer,email:classEmail,session_id:classSession,anonymous:true,id:p.id+'_'+classSession}})});
    const d=await r.json().catch(()=>({}));if(!r.ok||d.saved===false)throw new Error(d.error||d.reason||'Vote was not saved');
    localStorage.setItem('ministry_vote_'+lesson.id+'_'+p.id,answer);renderClassPoll();const done=$('class-poll-state');if(done){done.textContent=langText('Vote saved. You can change it.','Voto guardado. Puedes cambiarlo.');done.classList.add('ok')}
  }catch(e){if(st)st.textContent=(e?.message||'Vote could not be saved')+'. '+langText('Tap an answer to retry.','Toca una respuesta para intentar de nuevo.');buttons.forEach(b=>b.disabled=false)}
}
async function submitQuestion(){
  const ta=$('class-question'),st=$('class-question-state'),text=String(ta?.value||'').trim();if(!text){if(st)st.textContent=langText('Type a question first.','Escribe una pregunta primero.');return}
  if(st)st.textContent=langText('Sending…','Enviando…');
  try{
    const r=await fetch('/api/question-submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'q_'+Date.now()+'_'+Math.random().toString(16).slice(2),text,series_slug:lesson.seriesSlug,lesson_slug:lesson.slug,name:'Anonymous',anonymous:true,session_id:classSession,email:classEmail})});
    const d=await r.json().catch(()=>({}));if(!r.ok||d.saved===false)throw new Error(d.error||d.reason||'Could not send');
    ta.value='';st.textContent=langText('Sent anonymously.','Enviado anónimamente.');st.classList.add('ok')
  }catch(e){st.textContent=e?.message||langText('Could not send.','No se pudo enviar.')}
}

bootstrap().catch(err=>{
  console.error(err);
  document.body.innerHTML='<div style="padding:40px;font-family:system-ui;background:#090909;color:white;min-height:100vh"><h1>Teaching engine could not start</h1><p>'+esc(err.message||String(err))+'</p><p><a href="/lessons" style="color:#61c7ff">Open Lesson Library</a></p></div>';
});
})();