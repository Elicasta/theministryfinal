(()=>{
'use strict';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const route=(location.pathname.toLowerCase().replace(/\/+$/,'')||'/games/quiz');
const role=route==='/games/quiz/host'?'host':route==='/games/quiz/display'?'display':route==='/games/quiz/play'?'player':'landing';
const qs=new URLSearchParams(location.search);
let snapshot=null,state=null,quiz=null,players=[],answers=[],me=null;
let hostAuth=null,playerAuth=null,selectedTeamId=null,quizIndex=0,renderKey='';
let pollTimer=null,sb=null,channel=null,shareOrigin=location.origin,qrCache={};

const hostKey='ministry_quiz_host_auth';
const playerCodeKey='ministry_quiz_last_code';
const playerKey=code=>'ministry_quiz_player_'+code;
const codeFromUrl=()=>String(qs.get('code')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
const show=id=>$(id)?.classList.remove('hidden');
const hide=id=>$(id)?.classList.add('hidden');
function toast(message){const el=$('quiz-toast');if(!el)return;el.textContent=message;el.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.add('hidden'),4000)}
function saveHost(v){hostAuth=v;localStorage.setItem(hostKey,JSON.stringify(v))}
function loadHost(){try{return JSON.parse(localStorage.getItem(hostKey)||'null')}catch{return null}}
function savePlayer(v){playerAuth=v;localStorage.setItem(playerCodeKey,v.code);localStorage.setItem(playerKey(v.code),JSON.stringify(v))}
function loadPlayer(code){try{return JSON.parse(localStorage.getItem(playerKey(code))||'null')}catch{return null}}
function joinUrl(code){return shareOrigin+'/games/quiz/play?code='+encodeURIComponent(code)}
function displayUrl(code){return location.origin+'/games/quiz/display?code='+encodeURIComponent(code)}
function team(id){return (state?.teams||[]).find(t=>t.id===id)||null}
function teamIndex(id){return Math.max(0,(state?.teams||[]).findIndex(t=>t.id===id))}
function teamColor(id){return team(id)?.color||'#697386'}
function renderQr(id,url,size=180){const el=$(id);if(!el||!window.QRCode||qrCache[id]===url)return;qrCache[id]=url;el.innerHTML='';new QRCode(el,{text:url,width:size,height:size,colorDark:'#111820',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M})}

async function api(path,options={}){
  const r=await fetch(path,{cache:'no-store',signal:AbortSignal.timeout(15000),...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(d.error||('Request failed '+r.status));e.status=r.status;throw e}
  return d;
}
function authBody(){
  if(role==='host')return {code:hostAuth?.code,hostToken:hostAuth?.hostToken};
  if(role==='player')return {code:playerAuth?.code,playerId:playerAuth?.playerId};
  return {code:codeFromUrl()};
}
async function fetchState(){
  const auth=authBody();if(!auth.code)return;
  const d=role==='display'
    ? await api('/api/game/quiz-state?code='+encodeURIComponent(auth.code))
    : await api('/api/game/quiz-state',{method:'POST',body:JSON.stringify(auth)});
  applySnapshot(d);
}
function applySnapshot(d){
  if(!d?.ok)return;
  if(snapshot&&d.gameCode===snapshot.gameCode&&Number(d.version)<Number(snapshot.version))return;
  snapshot=d;state=d.state||{};quiz=d.quiz||{};players=d.players||[];answers=d.answers||[];me=d.me||null;
  const key=JSON.stringify([d.version,state.phase,state.progress,state.results,state.review,players,answers]);
  if(key!==renderKey){renderKey=key;render()}
}
async function act(action,extra={}){
  const payload={...authBody(),action,...extra};
  try{const d=await api('/api/game/quiz-action',{method:'POST',body:JSON.stringify(payload)});await fetchState();return d}
  catch(e){toast(e.message);if(e.status===401&&role==='player'){localStorage.removeItem(playerKey(playerAuth?.code||''));location.reload()}return null}
}
async function connectRealtime(code){
  try{
    const c=await api('/api/config');shareOrigin=c.shareOrigin||location.origin;
    if(!c.supabaseUrl||!c.supabaseAnonKey)return;
    if(!window.supabase){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.min.js';s.onload=resolve;s.onerror=reject;document.head.append(s)})}
    sb=window.supabase.createClient(c.supabaseUrl,c.supabaseAnonKey,{realtime:{params:{eventsPerSecond:20}}});
    channel=sb.channel('game:'+code,{config:{broadcast:{self:false}}}).on('broadcast',{event:'state'},()=>fetchState()).subscribe(status=>setNetwork(status==='SUBSCRIBED'?'Live':'Connecting'));
  }catch{setNetwork('Polling')}
}
function setNetwork(label){if($('host-network'))$('host-network').textContent=label;if($('player-connection'))$('player-connection').textContent=String(label).toUpperCase()}
function startPolling(){clearInterval(pollTimer);pollTimer=setInterval(()=>fetchState().catch(()=>setNetwork('Reconnecting')),1200)}
function startHeartbeat(){setInterval(()=>{if(playerAuth)act('HEARTBEAT')},20000)}

function initLanding(){show('quiz-landing')}

async function initHost(){
  show('quiz-host');
  try{const c=await api('/api/config');shareOrigin=c.shareOrigin||location.origin}catch{}
  const saved=loadHost();
  if(saved?.code&&saved?.hostToken){
    hostAuth=saved;
    try{await fetchState()}catch(e){if(e.status===401||e.status===404){localStorage.removeItem(hostKey);hostAuth=null}else throw e}
  }
  if(!snapshot){
    const d=await api('/api/game/quiz-create',{method:'POST',body:JSON.stringify({teamCount:4,quizMode:'individual',packId:'matthew-11-quiz-review-v1'})});
    saveHost({code:d.gameCode,hostToken:d.hostToken,displayToken:d.displayToken});
    await fetchState();
  }
  bindHost();
  await connectRealtime(hostAuth.code);startPolling();
}
function bindHost(){
  $('team-minus').onclick=()=>resizeTeams(-1);
  $('team-plus').onclick=()=>resizeTeams(1);
  $('quiz-mode').onchange=queueSetup;
  $('start-quiz').onclick=async()=>{await saveSetup();await act('START_QUIZ')};
  $('close-quiz').onclick=()=>{if(confirm('Close the quiz now and score submitted work?'))act('CLOSE_QUIZ')};
  $('start-review').onclick=()=>act('START_REVIEW');
  $('review-next').onclick=()=>act('ADVANCE_REVIEW');
  $('review-back').onclick=()=>act('BACK_REVIEW');
  $('end-review').onclick=()=>{if(confirm('End the review and show the final summary?'))act('END_REVIEW')};
  $('new-quiz').onclick=()=>{if(confirm('Create a new quiz room?')){localStorage.removeItem(hostKey);location.reload()}};
  document.addEventListener('input',e=>{if(e.target.matches('[data-team-name]'))queueSetup()});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-captain]');if(b)act('SET_CAPTAIN',{teamId:b.dataset.teamId,targetPlayerId:b.dataset.captain})});
}
let setupTimer=null;
function queueSetup(){clearTimeout(setupTimer);setupTimer=setTimeout(saveSetup,350)}
async function saveSetup(){
  if(state?.phase!=='quiz_lobby')return;
  const teams=(state.teams||[]).map(t=>({...t,name:document.querySelector('[data-team-name="'+CSS.escape(t.id)+'"]')?.value||t.name}));
  await act('SETUP',{teamCount:teams.length,teams,quizMode:$('quiz-mode').value});
}
function resizeTeams(delta){
  if(state?.phase!=='quiz_lobby')return;
  const current=state.teams||[],n=Math.max(2,Math.min(12,current.length+delta));if(n===current.length)return;
  if(delta<0){const removed=current.slice(n);if(removed.some(t=>players.some(p=>p.teamId===t.id))){toast('Move players before removing their team.');return}}
  const teams=Array.from({length:n},(_,i)=>current[i]||{id:'team-'+(i+1),name:'Team '+(i+1),color:['#a33d3d','#355f8a','#456d50','#9b7937','#72558e','#9a5b3c'][i%6]});
  act('SETUP',{teamCount:n,teams,quizMode:$('quiz-mode').value});
}
function renderHost(){
  if(!state)return;
  $('host-code').textContent=snapshot.gameCode;$('big-code').textContent=snapshot.gameCode;
  $('join-url').textContent=joinUrl(snapshot.gameCode).replace(/^https?:\/\//,'');
  $('host-projector-link').href=displayUrl(snapshot.gameCode);
  renderQr('host-qr',joinUrl(snapshot.gameCode),178);
  $('player-count').textContent=players.length+' connected';
  $('team-count').textContent=state.teams.length;
  $('team-minus').disabled=state.phase!=='quiz_lobby'||state.teams.length<=2;
  $('team-plus').disabled=state.phase!=='quiz_lobby'||state.teams.length>=12;
  if(document.activeElement?.id!=='quiz-mode')$('quiz-mode').value=state.quizMode||'individual';
  if(!document.activeElement?.matches('[data-team-name]')){
    $('team-editor').innerHTML=state.teams.map(t=>'<label class="team-edit"><span style="background:'+esc(t.color)+'"></span><input data-team-name="'+esc(t.id)+'" value="'+esc(t.name)+'"></label>').join('');
  }
  const phase=state.phase;
  for(const id of ['host-lobby','host-active','host-results','host-review','host-complete'])hide(id);
  if(phase==='quiz_lobby')renderHostLobby();
  else if(phase==='quiz_active')renderHostActive();
  else if(phase==='quiz_results')renderHostResults();
  else if(phase==='quiz_review')renderHostReview();
  else renderHostComplete();
  $('setup-panel').classList.toggle('disabled-panel',phase!=='quiz_lobby');
}
function renderHostLobby(){
  show('host-lobby');
  $('mode-note').textContent=state.quizMode==='team'
    ? 'Team mode: each team discusses together and the captain submits one answer. One phone can represent an entire team.'
    : 'Individual mode: each person answers privately. Individual accuracy is rolled into the team percentage.';
  $('lobby-teams').innerHTML=state.teams.map(t=>{
    const ps=players.filter(p=>p.teamId===t.id);
    return '<article class="team-card" style="--team:'+esc(t.color)+'"><div class="team-card-head"><div><span class="team-dot"></span><strong>'+esc(t.name)+'</strong></div><b>'+ps.length+'</b></div>'+
      (ps.length?ps.map(p=>'<div class="player-row"><span>'+esc(p.name)+'</span>'+(p.isCaptain?'<strong>Captain</strong>':'<button class="text-button" data-team-id="'+esc(t.id)+'" data-captain="'+esc(p.playerId)+'">Make Captain</button>')+'</div>').join(''):'<p class="muted">Waiting for participants.</p>')+
      '</article>';
  }).join('');
}
function renderHostActive(){
  show('host-active');
  const p=state.progress||{submitted:0,expected:0,teams:[]};
  $('host-progress-big').textContent=p.submitted+' / '+p.expected;
  $('host-progress-teams').innerHTML=state.teams.map(t=>{
    const x=p.teams?.find(y=>y.teamId===t.id)||{submitted:0,expected:0};
    const pct=x.expected?Math.round(x.submitted/x.expected*100):0;
    return '<article class="progress-card" style="--team:'+esc(t.color)+'"><div><span class="team-dot"></span><strong>'+esc(t.name)+'</strong><b>'+x.submitted+' / '+x.expected+'</b></div><div class="meter"><i style="width:'+pct+'%"></i></div><small>'+pct+'% submitted</small></article>';
  }).join('');
}
function resultRows(results){
  return (results?.teamResults||[]).map((r,i)=>'<article class="result-row" style="--team:'+esc(r.color)+'"><span class="rank">'+(i+1)+'</span><span class="team-dot"></span><strong>'+esc(r.name)+'</strong><div><b>'+r.percent+'%</b><small>'+r.correct+' / '+r.possible+' correct</small></div></article>').join('');
}
function renderHostResults(){
  show('host-results');$('overall-score').textContent=(state.results?.overallPercent||0)+'%';$('host-team-results').innerHTML=resultRows(state.results);
}
const stageNames={responses:'Room Response',answer:'Correct Answer',explanation:'Explanation',application:'Practical Application'};
function responseBars(review){
  const stats=review?.stats;if(!stats)return '';
  const choices=review.question?.choices||[];
  return '<div class="response-bars">'+choices.map((choice,i)=>{
    const r=stats.responses?.find(x=>x.answer===choice)||{count:0,percent:0};
    return '<div class="response-row"><div><b>'+String.fromCharCode(65+i)+'</b><span>'+esc(choice)+'</span><strong>'+r.percent+'%</strong></div><div class="meter"><i style="width:'+r.percent+'%"></i></div></div>';
  }).join('')+(stats.unanswered?'<div class="unanswered">'+stats.unanswered+' no answer</div>':'')+'</div>';
}
function reviewCard(review,host=false){
  if(!review)return '<div class="empty-state">Review data unavailable.</div>';
  const q=review.question||{},stage=review.stage;
  let body=responseBars(review);
  if(['answer','explanation','application'].includes(stage))body+='<section class="reveal-block answer"><span>Correct answer</span><h2>'+esc(q.correctAnswer||'')+'</h2><p>'+esc(q.reference||'')+' · '+(review.stats?.correctPercent||0)+'% answered correctly</p></section>';
  if(['explanation','application'].includes(stage))body+='<section class="reveal-block"><span>Explanation</span><p>'+esc(q.explanation||'')+'</p></section>';
  if(stage==='application')body+='<section class="reveal-block application"><span>Practical application</span><p>'+esc(q.application||'')+'</p></section>';
  if(host&&stage!=='responses'&&review.stats)body='<div class="host-stat-strip"><b>'+review.stats.correctPercent+'%</b><span>room accuracy</span><span>'+review.stats.answered+' answered</span><span>'+review.stats.unanswered+' skipped</span></div>'+body;
  return '<div class="review-meta"><span>'+esc(q.section||'')+'</span><span>'+esc(q.category||'')+'</span></div><h1 class="review-question">'+esc(q.prompt||'')+'</h1>'+body;
}
function renderHostReview(){
  show('host-review');const r=state.review;
  $('review-progress').textContent='QUESTION '+((r?.index||0)+1)+' OF '+(r?.total||quiz.questionCount||0);
  $('review-stage-label').textContent=stageNames[r?.stage]||'Review';
  $('host-review-card').innerHTML=reviewCard(r,true);
  $('review-back').disabled=(r?.index||0)===0&&r?.stage==='responses';
  $('review-next').textContent=r?.stage==='application'&&r?.index===r?.total-1?'Review Complete':'Continue →';
}
function renderHostComplete(){
  show('host-complete');$('complete-score').textContent=(state.results?.overallPercent||0)+'%';$('complete-results').innerHTML=resultRows(state.results);
}

async function initDisplay(){
  show('quiz-display');
  const code=codeFromUrl();if(!code){$('display-stage').innerHTML='<div class="display-message"><span>QUIZ & REVIEW</span><h1>Open this display from the host console.</h1></div>';return}
  await fetchState();renderQr('display-qr',joinUrl(code),98);$('display-code').textContent=code;
  await connectRealtime(code);startPolling();
  $('fullscreen').onclick=()=>document.documentElement.requestFullscreen?.();
}
function renderDisplay(){
  if(!state)return;const stage=$('display-stage'),footer=$('display-footer');
  renderQr('display-qr',joinUrl(snapshot.gameCode),98);$('display-code').textContent=snapshot.gameCode;
  if(state.phase==='quiz_lobby'){
    stage.innerHTML='<div class="display-message"><span>MATTHEW 11 · QUIZ & REVIEW</span><h1>Join the quiz.</h1><p>'+(state.quizMode==='team'?'Discuss together. Your team captain will submit.':'Answer privately. Your score will contribute to your team.')+'</p></div>';
    footer.innerHTML=state.teams.map(t=>'<div><span class="team-dot" style="background:'+esc(t.color)+'"></span>'+esc(t.name)+'</div>').join('');
  }else if(state.phase==='quiz_active'){
    const p=state.progress||{submitted:0,expected:0};
    stage.innerHTML='<div class="display-message"><span>QUIZ IN PROGRESS</span><h1>'+p.submitted+' / '+p.expected+' submitted</h1><p>Answers stay private until the quiz is closed.</p></div><div class="display-progress">'+state.teams.map(t=>{const x=p.teams?.find(y=>y.teamId===t.id)||{submitted:0,expected:0},pct=x.expected?Math.round(x.submitted/x.expected*100):0;return '<div><strong>'+esc(t.name)+'</strong><span>'+x.submitted+' / '+x.expected+'</span><div class="meter"><i style="width:'+pct+'%;background:'+esc(t.color)+'"></i></div></div>'}).join('')+'</div>';
    footer.innerHTML='<span>Matthew 11</span><strong>Quiz in progress</strong>';
  }else if(state.phase==='quiz_results'){
    stage.innerHTML='<div class="display-results"><span class="eyebrow">MATTHEW 11 · RESULTS</span><div class="display-overall">'+(state.results?.overallPercent||0)+'%</div><p>overall room accuracy</p><div class="display-result-list">'+resultRows(state.results)+'</div></div>';
    footer.innerHTML='<span>Results are in.</span><strong>Review begins next.</strong>';
  }else if(state.phase==='quiz_review'){
    stage.innerHTML='<div class="display-review"><div class="display-review-head"><span>QUESTION '+((state.review?.index||0)+1)+' OF '+(state.review?.total||0)+'</span><strong>'+esc(stageNames[state.review?.stage]||'Review')+'</strong></div>'+reviewCard(state.review,false)+'</div>';
    footer.innerHTML='<span>'+esc(state.review?.question?.section||'Matthew 11')+'</span><strong>'+(state.review?.stats?.correctPercent||0)+'% answered correctly</strong>';
  }else{
    stage.innerHTML='<div class="display-results"><span class="eyebrow">MATTHEW 11 · COMPLETE</span><div class="display-overall">'+(state.results?.overallPercent||0)+'%</div><h1>Knowledge → Understanding → Application</h1><div class="display-result-list">'+resultRows(state.results)+'</div></div>';
    footer.innerHTML='<span>Quiz & Review complete</span><strong>Respond to what you have learned.</strong>';
  }
}

async function initPlayer(){
  show('quiz-player');bindPlayer();
  const code=codeFromUrl()||(qs.get('new')?'':localStorage.getItem(playerCodeKey)||'');
  if(code){$('join-code-input').value=code;await connectToQuiz()}
}
function bindPlayer(){
  $('connect-quiz').onclick=connectToQuiz;
  $('join-team').onclick=joinSelectedTeam;
  document.addEventListener('click',e=>{
    const pick=e.target.closest('[data-pick-team]');if(pick){selectedTeamId=pick.dataset.pickTeam;renderTeamPicker();$('join-team').disabled=false;return}
    const choice=e.target.closest('[data-quiz-answer]');if(choice)return chooseAnswer(choice.dataset.quizAnswer);
    const nav=e.target.closest('[data-quiz-nav]');if(nav){quizIndex=Math.max(0,Math.min((quiz.questionCount||1)-1,quizIndex+Number(nav.dataset.quizNav)));renderPlayer();return}
    if(e.target.closest('#submit-quiz'))return submitQuiz();
  });
}
async function connectToQuiz(){
  const code=String($('join-code-input').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6),err=$('join-error');
  if(code.length!==6){err.textContent='Enter the 6-character quiz code.';return}
  $('connect-quiz').disabled=true;err.textContent='Connecting…';
  try{
    const saved=loadPlayer(code);
    if(saved?.playerId){
      try{
        await api('/api/game/join',{method:'POST',body:JSON.stringify({code,resume:true,playerId:saved.playerId})});
        playerAuth={code,playerId:saved.playerId};savePlayer(playerAuth);await enterPlayer(code);return;
      }catch(e){if(e.status!==401&&e.status!==404)throw e;localStorage.removeItem(playerKey(code))}
    }
    const d=await api('/api/game/quiz-state?code='+encodeURIComponent(code));applySnapshot(d);
    hide('join-step');show('profile-step');$('player-code').textContent=code;history.replaceState(null,'','/games/quiz/play?code='+encodeURIComponent(code));selectedTeamId=null;renderTeamPicker();
  }catch(e){err.textContent=e.message;show('join-step')}
  finally{$('connect-quiz').disabled=false}
}
function renderTeamPicker(){
  if(!state)return;
  $('team-picker').innerHTML=state.teams.map(t=>'<button class="pick-team '+(selectedTeamId===t.id?'selected':'')+'" data-pick-team="'+esc(t.id)+'" style="--team:'+esc(t.color)+'"><span class="team-dot"></span>'+esc(t.name)+'</button>').join('');
}
async function joinSelectedTeam(){
  const code=snapshot?.gameCode||codeFromUrl(),name=String($('player-name').value||'').trim();if(!name||!selectedTeamId){toast('Enter your name and choose a team.');return}
  $('join-team').disabled=true;
  try{
    const d=await api('/api/game/join',{method:'POST',body:JSON.stringify({code,name,teamId:selectedTeamId})});
    playerAuth={code,playerId:d.player.playerId};savePlayer(playerAuth);await enterPlayer(code);
  }catch(e){toast(e.message)}finally{$('join-team').disabled=false}
}
async function enterPlayer(code){
  hide('join-step');hide('profile-step');show('player-session');$('player-code').textContent=code;
  history.replaceState(null,'','/games/quiz/play?code='+encodeURIComponent(code));
  await fetchState();await connectRealtime(code);startPolling();startHeartbeat();
}
function myAnswer(questionId){return answers.find(a=>a.questionId===questionId)?.answer||''}
async function chooseAnswer(answer){
  if(state.locked)return;
  const q=quiz.questions?.[quizIndex];if(!q)return;
  const captain=!!me?.isCaptain;
  if(state.quizMode==='team'&&!captain){toast('Your captain submits the team answer.');return}
  await act('ANSWER',{questionId:q.id,answer});
}
async function submitQuiz(){
  if(state.locked)return;
  const unanswered=(quiz.questions||[]).filter(q=>!myAnswer(q.id)).length;
  if(unanswered&&!confirm('You still have '+unanswered+' unanswered question'+(unanswered===1?'':'s')+'. Submit anyway?'))return;
  if(confirm(state.quizMode==='team'?'Submit your team quiz? Answers will lock.':'Submit your quiz? Answers will lock.'))await act('SUBMIT_QUIZ');
}
function renderPlayer(){
  if(!state)return;
  if(!playerAuth){if(!$('profile-step')?.classList.contains('hidden'))renderTeamPicker();return}
  if(!me)return;
  const t=team(me.teamId);
  $('player-team-bar').innerHTML='<span class="team-dot" style="background:'+esc(t?.color||'#777')+'"></span><strong>'+esc(t?.name||'Team')+'</strong><span>'+esc(state.quizMode==='team'?(me.isCaptain?'Captain · team submission':'Team discussion'):'Individual quiz')+'</span>';
  const host=$('player-content');
  if(state.phase==='quiz_lobby'){host.innerHTML='<section class="phone-card waiting-card"><span class="eyebrow">YOU’RE IN</span><h1>Matthew 11</h1><p>Waiting for the host to start the quiz.</p></section>';return}
  if(state.phase==='quiz_active'){renderPlayerQuiz(host);return}
  if(state.phase==='quiz_results'){host.innerHTML='<section class="phone-card"><span class="eyebrow">QUIZ RESULTS</span><h1>Team Scores</h1><div class="phone-results">'+resultRows(state.results)+'</div><p class="muted">The host will begin the question-by-question review.</p></section>';return}
  if(state.phase==='quiz_review'){host.innerHTML='<section class="phone-card review-phone"><span class="eyebrow">'+esc(stageNames[state.review?.stage]||'Review')+'</span>'+reviewCard(state.review,false)+'</section>';return}
  host.innerHTML='<section class="phone-card"><span class="eyebrow">QUIZ COMPLETE</span><h1>'+(state.results?.overallPercent||0)+'% room accuracy</h1><div class="phone-results">'+resultRows(state.results)+'</div><p class="muted">Carry the application with you. The goal was not only to know Matthew 11, but to respond to it.</p></section>';
}
function renderPlayerQuiz(host){
  const questions=quiz.questions||[],total=questions.length,q=questions[Math.min(quizIndex,total-1)];if(!q)return;
  const answered=questions.filter(x=>myAnswer(x.id)).length,selected=myAnswer(q.id),canAnswer=state.quizMode==='individual'||me.isCaptain;
  if(state.locked){host.innerHTML='<section class="phone-card waiting-card"><span class="eyebrow">SUBMITTED</span><h1>Your answers are locked.</h1><p>'+state.progress.submitted+' / '+state.progress.expected+' submitted. Waiting for the room.</p></section>';return}
  host.innerHTML='<section class="phone-card quiz-card"><div class="quiz-progress-head"><span>QUESTION '+(quizIndex+1)+' OF '+total+'</span><strong>'+answered+' answered</strong></div><div class="meter"><i style="width:'+(total?Math.round(answered/total*100):0)+'%"></i></div>'+
    '<div class="question-meta"><span>'+esc(q.section||'Matthew 11')+'</span><span>'+esc(q.category||'')+'</span></div><h1>'+esc(q.prompt)+'</h1>'+
    '<div class="choice-list">'+(q.choices||[]).map((choice,i)=>'<button class="choice '+(selected===choice?'selected':'')+'" data-quiz-answer="'+esc(choice)+'" '+(!canAnswer?'disabled':'')+'><b>'+String.fromCharCode(65+i)+'</b><span>'+esc(choice)+'</span></button>').join('')+'</div>'+
    (canAnswer?'':'<div class="discussion-note">Discuss this question with your team. Your captain will submit the team answer.</div>')+
    '<div class="quiz-nav"><button class="btn" data-quiz-nav="-1" '+(quizIndex===0?'disabled':'')+'>← Previous</button>'+(quizIndex<total-1?'<button class="btn primary" data-quiz-nav="1">Next →</button>':'<button id="submit-quiz" class="btn primary">Submit Quiz</button>')+'</div></section>';
}
function render(){
  if(role==='host')renderHost();
  else if(role==='display')renderDisplay();
  else if(role==='player')renderPlayer();
}

if(role==='landing')initLanding();
if(role==='host')initHost();
if(role==='display')initDisplay();
if(role==='player')initPlayer();
})();