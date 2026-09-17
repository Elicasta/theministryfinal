(()=>{
const ROOM='kingdom-evidence-chapter-11-v1',CHANNEL='kingdom-evidence-chapter-11-v1',SERIES='kingdom-evidence',LESSON='chapter-11-king-confronts-expectations',SYNC_ID=1;
const SESSION_TTL=4*60*60*1000;
const {SLIDES,VERSES,POLLS}=window.KE11_EVIDENCE;
const MANUSCRIPT=window.KE11_MANUSCRIPT||[];
let state={room:ROOM,started:false,slide:0,overlay:null,black:false,activePoll:null,activeQuestion:null,startedAt:null,timerStoppedAt:null,session:'ke11_'+Date.now().toString(36),seq:0,ts:Date.now()};
let bc=null,sbUrl='',sbKey='',sbClient=null,sbChannel=null,writeChain=Promise.resolve(),lastSeq=0,lastSession='',lastTs=0,questions=[],votes=[];
let manuscriptScale=Number(localStorage.getItem('ke11_presenter_scale')||1);
manuscriptScale=Math.max(.82,Math.min(1.45,manuscriptScale));

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titleOf=s=>s?.title||s?.ref||s?.text||s?.kicker||'Slide';
const pollBy=id=>POLLS.find(p=>p.id===id);
const verseIndex=ref=>VERSES.findIndex(v=>v.ref===ref);
const voteCounts=p=>{const out={};p.options.forEach(o=>out[o]=0);votes.filter(v=>v.poll_id===p.id).forEach(v=>{if(Object.hasOwn(out,v.answer))out[v.answer]++});return out};
const totalCounts=c=>Object.values(c).reduce((a,b)=>a+b,0);

function normalizeTimer(){
  if(state.started&&state.slide>=SLIDES.length-1&&state.startedAt&&!state.timerStoppedAt)state.timerStoppedAt=Number(state.ts)||Date.now();
}
function payload(){return{...state,room:ROOM,ts:Date.now()}}
function send(){
  state.seq=(state.seq||0)+1;
  state.ts=Date.now();
  const msg={type:'kingdom_evidence_11_state',room:ROOM,state:payload()};
  try{if(!bc)bc=new BroadcastChannel(CHANNEL);bc.postMessage(msg)}catch(e){}
  sendNetwork(msg);
  renderState();
}
function sendNetwork(msg){
  if(!sbUrl||!sbKey)return;
  writeChain=writeChain.catch(()=>{}).then(()=>fetch(sbUrl+'/rest/v1/sync_state',{
    method:'POST',
    headers:{'Content-Type':'application/json',apikey:sbKey,Authorization:'Bearer '+sbKey,Prefer:'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify({id:SYNC_ID,payload:JSON.stringify(msg),updated_at:new Date().toISOString()})
  }).then(r=>setSync(r.ok,r.ok?'Live sync':'Local only')).catch(()=>setSync(false,'Local only')));
}
function apply(next){
  if(!next||next.room!==ROOM)return;
  const seq=Number(next.seq)||0,ts=Number(next.ts)||0;
  if(next.session&&next.session===lastSession&&seq&&seq<=lastSeq)return;
  if(ts&&lastTs&&ts<lastTs)return;
  if(next.session){lastSession=next.session;lastSeq=seq}
  lastTs=Math.max(lastTs,ts);
  state={...state,...next};
  normalizeTimer();
  renderState();
}
function handle(msg){if(msg?.type==='kingdom_evidence_11_state'&&msg.room===ROOM)apply(msg.state)}
function startLocal(){try{bc=new BroadcastChannel(CHANNEL);bc.onmessage=e=>handle(e.data)}catch(e){}}
function setSync(ok,label){
  const dot=$('presenter-dot'); if(dot)dot.classList.toggle('live',!!ok);
  if($('presenter-sync'))$('presenter-sync').textContent=label;
}
async function readLatest(){
  if(!sbUrl||!sbKey)return;
  try{
    const r=await fetch(sbUrl+`/rest/v1/sync_state?id=eq.${SYNC_ID}&select=payload`,{headers:{apikey:sbKey,Authorization:'Bearer '+sbKey},cache:'no-store'});
    const rows=await r.json(),raw=rows?.[0]?.payload,msg=typeof raw==='string'?JSON.parse(raw):raw;
    if(msg?.type==='kingdom_evidence_11_state'&&msg.room===ROOM&&Date.now()-(msg.state?.ts||0)<SESSION_TTL)handle(msg);
  }catch(e){}
}
async function initNetwork(){
  try{
    const r=await fetch('/api/config',{cache:'no-store'}),c=await r.json();
    sbUrl=c.supabaseUrl||'';sbKey=c.supabaseAnonKey||'';
  }catch(e){}
  if(!sbUrl||!sbKey){setSync(false,'Local only');return}
  await readLatest();
  const sc=document.createElement('script');
  sc.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  sc.onload=()=>{
    try{
      sbClient=window.supabase.createClient(sbUrl,sbKey);
      sbChannel=sbClient.channel('kingdom-evidence-11-presenter').on('postgres_changes',{event:'*',schema:'public',table:'sync_state',filter:`id=eq.${SYNC_ID}`},p=>{
        try{const raw=p.new?.payload,msg=typeof raw==='string'?JSON.parse(raw):raw;handle(msg)}catch(e){}
      }).subscribe(x=>{if(x==='SUBSCRIBED')setSync(true,'Live sync')});
    }catch(e){setSync(false,'Polling sync')}
  };
  document.head.appendChild(sc);
  setInterval(readLatest,3000);
}

function goTo(i,scroll=false){
  const target=Math.max(0,Math.min(Number(i)||0,SLIDES.length-1)),now=Date.now(),wasStarted=state.started;
  if(!wasStarted){state.started=true;state.startedAt=now;state.timerStoppedAt=null}
  else if(state.timerStoppedAt&&target<SLIDES.length-1){
    state.startedAt=Number(state.startedAt||now)+(now-state.timerStoppedAt);
    state.timerStoppedAt=null;
  }
  state.slide=target;
  if(target===SLIDES.length-1&&state.startedAt&&!state.timerStoppedAt)state.timerStoppedAt=now;
  state.black=false;state.overlay=null;state.activePoll=null;state.activeQuestion=null;
  send();
  if(scroll)scrollToSlide(target);
}
function resetLesson(){
  state.started=false;state.slide=0;state.overlay=null;state.black=false;state.activePoll=null;state.activeQuestion=null;
  state.startedAt=null;state.timerStoppedAt=null;state.session='ke11_'+Date.now().toString(36);
  send();
  window.scrollTo({top:0,behavior:'smooth'});
}
function nextSlide(){
  if(state.overlay||state.activePoll||state.activeQuestion){clearTakeover();return}
  if(!state.started){goTo(0,true);return}
  if(state.slide<SLIDES.length-1){goTo(state.slide+1,true);return}
  resetLesson();
}
function prevSlide(){
  if(state.overlay||state.activePoll||state.activeQuestion){clearTakeover();return}
  if(!state.started)return;
  if(state.slide===0){resetLesson();return}
  goTo(state.slide-1,true);
}
function toggleBlack(){state.black=!state.black;if(state.black){state.overlay=null;state.activePoll=null;state.activeQuestion=null}send()}
function clearTakeover(){state.overlay=null;state.activePoll=null;state.activeQuestion=null;state.black=false;send()}
function pushVerse(index){
  const v=VERSES[index];if(!v)return;
  state.overlay={ref:v.ref,text:v.text};state.activePoll=null;state.activeQuestion=null;state.black=false;send();
}
function launchPoll(id){state.overlay=null;state.activeQuestion=null;state.black=false;state.activePoll={id,mode:'question'};send()}
async function showResults(id){
  await loadAudienceData();
  const p=pollBy(id);if(!p)return;
  const c=voteCounts(p),tot=totalCounts(c);
  state.overlay=null;state.activeQuestion=null;state.black=false;state.activePoll={id,mode:'results',results:c,total:tot};send();
}
function closePoll(){state.activePoll=null;send()}
function displayQuestion(i){
  const q=questions[i];if(!q)return;
  state.overlay=null;state.activePoll=null;state.black=false;state.activeQuestion={id:q.id||String(i),text:q.text};send();
}
function scrollToSlide(i){
  document.querySelector(`.note-section[data-slide="${i}"]`)?.scrollIntoView({behavior:'smooth',block:'start'});
}

function inlinePollHtml(id){
  const p=pollBy(id);if(!p)return'';
  const c=voteCounts(p),tot=totalCounts(c);
  return `<div class="inline-poll" data-inline-poll="${esc(id)}">
    <div class="poll-kicker">Live Poll · ${tot} ${tot===1?'response':'responses'}</div>
    <div class="poll-question">${esc(p.question)}</div>
    <div class="poll-options">${p.options.map(o=>`<div class="poll-option"><span>${esc(o)}</span><b>${c[o]||0}</b></div>`).join('')}</div>
    <div class="poll-actions">
      <button type="button" data-poll-launch="${esc(id)}">Launch Question</button>
      <button type="button" class="primary" data-poll-results="${esc(id)}">Show Results</button>
      <button type="button" data-poll-close="${esc(id)}">Close</button>
    </div>
  </div>`;
}
function renderManuscript(){
  const root=$('manuscript');
  root.innerHTML=MANUSCRIPT.map((m,i)=>{
    const refs=(m.refs||[]).map(ref=>{
      const idx=verseIndex(ref);if(idx<0)return'';
      return `<button class="scripture-push" type="button" data-verse="${idx}">Push ${esc(ref)}</button>`;
    }).join('');
    const polls=(m.polls||[]).map(inlinePollHtml).join('');
    return `<section class="note-section" data-slide="${i}">
      <div class="note-head">
        <div class="note-heading-wrap">
          <div class="slide-label">Slide ${String(i+1).padStart(2,'0')}</div>
          <h2 class="note-title">${esc(m.title||titleOf(SLIDES[i]))}</h2>
        </div>
        <button class="cue-button" type="button" data-cue="${i}">Take Slide ${i+1}</button>
      </div>
      <div class="note-body">${m.html||''}${polls}</div>
      ${refs?`<div class="note-scriptures">${refs}</div>`:''}
    </section>`;
  }).join('');
  root.addEventListener('click',e=>{
    const cue=e.target.closest('[data-cue]');if(cue){goTo(Number(cue.dataset.cue),false);return}
    const verse=e.target.closest('[data-verse]');if(verse){pushVerse(Number(verse.dataset.verse));return}
    const launch=e.target.closest('[data-poll-launch]');if(launch){launchPoll(launch.dataset.pollLaunch);return}
    const results=e.target.closest('[data-poll-results]');if(results){showResults(results.dataset.pollResults);return}
    const close=e.target.closest('[data-poll-close]');if(close){closePoll();return}
  });
  applyTextScale();
  renderState();
}

function renderState(){
  normalizeTimer();
  const current=SLIDES[state.slide]||SLIDES[0],next=state.started&&state.slide<SLIDES.length-1?SLIDES[state.slide+1]:SLIDES[0];
  $('live-slide-num').textContent=state.started?`SLIDE ${String(state.slide+1).padStart(2,'0')} / ${SLIDES.length}`:'STANDBY';
  if(state.overlay){$('live-slide-title').textContent=state.overlay.ref;$('live-slide-meta').textContent='Scripture takeover'}
  else if(state.activeQuestion){$('live-slide-title').textContent='Anonymous Question';$('live-slide-meta').textContent=state.activeQuestion.text}
  else if(state.activePoll){const p=pollBy(state.activePoll.id);$('live-slide-title').textContent=state.activePoll.mode==='results'?'Poll Results':'Live Poll';$('live-slide-meta').textContent=p?.question||''}
  else{$('live-slide-title').textContent=state.started?titleOf(current):'The King Confronts Expectations';$('live-slide-meta').textContent=state.started?(current.ref||current.kicker||'Kingdom Evidence'):'Matthew 11:1–19'}
  $('live-next-title').textContent=!state.started?titleOf(SLIDES[0]):state.slide<SLIDES.length-1?titleOf(next):'End lesson';
  $('next-btn').textContent=!state.started?'Start':state.slide<SLIDES.length-1?'Next →':'End';
  $('black-btn').classList.toggle('on',state.black);
  document.querySelectorAll('.note-section').forEach((el,i)=>{
    el.classList.toggle('is-live',state.started&&i===state.slide);
    el.classList.toggle('is-next',state.started&&i===state.slide+1);
    const b=el.querySelector('.cue-button');
    if(b)b.textContent=state.started&&i===state.slide?'LIVE':`Take Slide ${i+1}`;
  });
  document.querySelectorAll('.scripture-push').forEach(b=>{
    const v=VERSES[Number(b.dataset.verse)];
    b.classList.toggle('active',!!state.overlay&&state.overlay.ref===v?.ref);
  });
  document.querySelectorAll('[data-inline-poll]').forEach(card=>{
    const id=card.dataset.inlinePoll;
    card.style.outline=state.activePoll?.id===id?'2px solid #39aee8':'none';
  });
}
function updateTimer(){
  const end=state.timerStoppedAt||Date.now();
  const secs=state.startedAt?Math.max(0,Math.floor((end-state.startedAt)/1000)):0;
  $('presenter-timer').textContent=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');
}

function renderScriptures(filter=''){
  const q=filter.trim().toLowerCase();
  const list=VERSES.map((v,i)=>({v,i})).filter(({v})=>!q||v.ref.toLowerCase().includes(q)||v.text.toLowerCase().includes(q)).slice(0,q?40:12);
  $('scripture-results').innerHTML=list.map(({v,i})=>`<div class="scripture-item">
    <strong>${esc(v.ref)}</strong><p>${esc(v.text)}</p>
    <button class="pbtn" type="button" data-side-verse="${i}">Push Scripture</button>
  </div>`).join('')||'<div class="scripture-item"><p>No matching Scripture.</p></div>';
}
async function loadAudienceData(){
  try{
    const [q,p]=await Promise.all([
      fetch(`/api/questions-list?series_slug=${SERIES}&lesson_slug=${LESSON}`,{cache:'no-store'}),
      fetch(`/api/polls-list?series_slug=${SERIES}&lesson_slug=${LESSON}`,{cache:'no-store'})
    ]);
    const qd=await q.json().catch(()=>({})),pd=await p.json().catch(()=>({}));
    if(q.ok)questions=Array.isArray(qd.questions)?qd.questions:[];
    if(p.ok)votes=Array.isArray(pd.votes)?pd.votes:[];
    renderAudience();
  }catch(e){}
}
function renderAudience(){
  $('question-total').textContent=questions.length;
  $('rail-questions').innerHTML=questions.length?questions.map((q,i)=>`<div class="question-card">
    <p>${esc(q.text)}</p>
    <div class="question-actions"><button type="button" class="${state.activeQuestion?.id===(q.id||String(i))?'':'primary'}" data-question="${i}">${state.activeQuestion?.id===(q.id||String(i))?'Displayed':'Display on Main'}</button></div>
  </div>`).join(''):'<div class="question-card"><p>No anonymous questions yet.</p></div>';
  const total=votes.length;$('poll-total').textContent=total;
  $('rail-polls').innerHTML=POLLS.map(p=>{
    const c=voteCounts(p),tot=totalCounts(c);
    return `<div class="poll-admin-card">
      <h4>${esc(p.question)}</h4>
      <div class="mini"><span>${esc(p.cue)}</span><strong>${tot} responses</strong></div>
      <div class="poll-admin-actions">
        <button type="button" data-rail-launch="${esc(p.id)}">Launch</button>
        <button type="button" class="primary" data-rail-results="${esc(p.id)}">Results</button>
        <button type="button" data-rail-close="${esc(p.id)}">Close</button>
      </div>
    </div>`;
  }).join('');
  MANUSCRIPT.forEach(m=>(m.polls||[]).forEach(id=>{
    const card=document.querySelector(`[data-inline-poll="${CSS.escape(id)}"]`);if(!card)return;
    const replacement=document.createElement('div');replacement.innerHTML=inlinePollHtml(id);
    card.replaceWith(replacement.firstElementChild);
  }));
  renderState();
}
function applyTextScale(){
  document.documentElement.style.setProperty('--manuscript-size',(1.08*manuscriptScale).toFixed(3)+'rem');
  localStorage.setItem('ke11_presenter_scale',String(manuscriptScale));
}

function bind(){
  $('prev-btn').addEventListener('click',prevSlide);
  $('next-btn').addEventListener('click',nextSlide);
  $('black-btn').addEventListener('click',toggleBlack);
  $('clear-btn').addEventListener('click',clearTakeover);
  $('scripture-search').addEventListener('input',e=>renderScriptures(e.target.value));
  $('scripture-results').addEventListener('click',e=>{const b=e.target.closest('[data-side-verse]');if(b)pushVerse(Number(b.dataset.sideVerse))});
  $('rail-polls').addEventListener('click',e=>{
    const a=e.target.closest('[data-rail-launch]');if(a){launchPoll(a.dataset.railLaunch);return}
    const r=e.target.closest('[data-rail-results]');if(r){showResults(r.dataset.railResults);return}
    const c=e.target.closest('[data-rail-close]');if(c){closePoll()}
  });
  $('rail-questions').addEventListener('click',e=>{const b=e.target.closest('[data-question]');if(b)displayQuestion(Number(b.dataset.question))});
  $('text-smaller').addEventListener('click',()=>{manuscriptScale=Math.max(.82,manuscriptScale-.08);applyTextScale()});
  $('text-larger').addEventListener('click',()=>{manuscriptScale=Math.min(1.45,manuscriptScale+.08);applyTextScale()});
  $('text-reset').addEventListener('click',()=>{manuscriptScale=1;applyTextScale()});
}

function mount(){
  renderManuscript();renderScriptures();bind();startLocal();initNetwork();loadAudienceData();
  setInterval(updateTimer,500);setInterval(loadAudienceData,4500);updateTimer();
}
mount();
})();