(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search);
const route=location.pathname.toLowerCase().replace(/\/+$/,'');
const role=route==='/games/quiz/host'?'host':route==='/games/quiz/display'?'display':route==='/games/quiz/play'?'player':'landing';
const hostKey='ministry_quiz_host_auth',lastCodeKey='ministry_quiz_last_code';
const playerKey=c=>'ministry_quiz_player_'+c;
const stages={responses:'Room Responses',answer:'Correct Answer',explanation:'Biblical Explanation',application:'Practical Application'};
let snap=null,state=null,pack=null,people=[],answers=[],me=null,hostAuth=null,playerAuth=null;
let selectedTeamId='',chosenParticipation='solo',currentIndex=0,renderStamp='',shareOrigin=location.origin;
let poll=null,heartbeat=null,supabase=null,realtime=null,qrMemo={};
const solo=t=>t?.id==='solo'||t?.isSolo;
const realTeams=()=>state?.teams?.filter(t=>!solo(t))||[];
const team=id=>state?.teams?.find(t=>t.id===id);
const show=id=>$(id)?.classList.remove('hidden');const hide=id=>$(id)?.classList.add('hidden');
const urlCode=()=>String(params.get('code')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
function esMode(){return role==='player'&&(me?.language==='es'||(!me&&$('quiz-spanish')?.checked))}
function tr(en,es){return esMode()?es:en}
function toast(message){const el=$('quiz-toast');if(!el)return;el.textContent=message;show('quiz-toast');clearTimeout(toast.t);toast.t=setTimeout(()=>hide('quiz-toast'),4300)}
function loadJSON(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
function saveHost(data){hostAuth=data;localStorage.setItem(hostKey,JSON.stringify(data))}
function savePlayer(data){playerAuth=data;localStorage.setItem(lastCodeKey,data.code);localStorage.setItem(playerKey(data.code),JSON.stringify(data))}
function shareLink(code){return shareOrigin+'/games/quiz/play?code='+encodeURIComponent(code)}
function projectorLink(code){return location.origin+'/games/quiz/display?code='+encodeURIComponent(code)}
function qr(id,url,size){const el=$(id);if(!el||!window.QRCode||(qrMemo[id]===url&&el.querySelector('img,canvas')))return;qrMemo[id]=url;el.innerHTML='';new QRCode(el,{text:url,width:size,height:size,colorDark:'#111820',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M})}
async function api(path,body){
  const r=await fetch(path,{cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(d.error||'Request failed');e.status=r.status;throw e}
  return d;
}
function auth(){
  if(role==='host')return {code:hostAuth?.code,hostToken:hostAuth?.hostToken};
  if(role==='player')return {code:playerAuth?.code,playerId:playerAuth?.playerId};
  return {code:urlCode()};
}
async function requestState(){
  const a=auth();if(!a.code)return;
  const d=role==='display'?await api('/api/game/quiz-state?code='+encodeURIComponent(a.code)):
    await api('/api/game/quiz-state',a);
  if(snap&&d.gameCode===snap.gameCode&&Number(d.version)<Number(snap.version))return;
  snap=d;state=d.state;pack=d.quiz;people=d.players||[];answers=d.answers||[];me=d.me||null;
  const next=JSON.stringify([d.version,state,people,answers,me]);
  if(renderStamp!==next){renderStamp=next;render()}
}
async function act(action,extra={}){
  try{const d=await api('/api/game/quiz-action',{...auth(),action,...extra});await requestState();return d}
  catch(e){toast(e.message);return null}
}
function network(text){if($('host-network'))$('host-network').textContent=text;if($('player-connection'))$('player-connection').textContent=text.toUpperCase()}
async function connectNetwork(code){
  try{
    const c=await api('/api/config');shareOrigin=c.shareOrigin||location.origin;
    if(!c.supabaseUrl||!c.supabaseAnonKey)return network('Polling');
    if(!window.supabase){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.min.js';s.onload=resolve;s.onerror=reject;document.head.append(s)})}
    supabase=window.supabase.createClient(c.supabaseUrl,c.supabaseAnonKey,{realtime:{params:{eventsPerSecond:20}}});
    realtime=supabase.channel('game:'+code,{config:{broadcast:{self:false}}}).on('broadcast',{event:'state'},()=>requestState().catch(()=>{})).subscribe(s=>network(s==='SUBSCRIBED'?'Live':'Polling'));
  }catch{network('Polling')}
}
function startPolling(){clearInterval(poll);poll=setInterval(()=>requestState().catch(()=>network('Reconnecting')),1500)}
function startHeartbeat(){clearInterval(heartbeat);heartbeat=setInterval(()=>{if(playerAuth)act('HEARTBEAT')},24000)}

function resultLine(r,i){return '<article class="result-row" style="--team:'+esc(r.color||'#768598')+'"><span class="rank">'+(i+1)+'</span><span class="team-dot"></span><strong>'+esc(r.name)+'</strong><div><b>'+r.percent+'%</b><small>'+r.correct+' / '+r.possible+' correct</small></div></article>'}
function scoreboard(data){
  const soloResults=data?.soloResults||[],teamResults=data?.teamResults||[];
  return '<div class="quiz-scoreboards"><section><div class="panel-label">Solo ranking · '+soloResults.length+' submitted</div><div class="results-list">'+(soloResults.map(resultLine).join('')||'<p class="muted">No solo submissions yet.</p>')+'</div></section>'+ 
  '<section><div class="panel-label">Team ranking · '+teamResults.length+' submitted</div><div class="results-list">'+(teamResults.map(resultLine).join('')||'<p class="muted">No team submissions yet.</p>')+'</div></section></div>';
}
function historyButton(){
  return '<div class="quiz-history-cta"><button class="btn primary" data-history-open>Review my saved answers</button><small>Saved by your game session for future verified Lumaneer profile linking.</small></div>';
}
function closeHistory(){document.getElementById('quiz-history-overlay')?.remove()}
async function openHistory(){
  closeHistory();
  const overlay=document.createElement('div');overlay.id='quiz-history-overlay';overlay.className='quiz-history-overlay';
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','My saved quiz answers');
  overlay.innerHTML='<div class="quiz-history-panel"><button type="button" class="btn small" data-history-close>Close ×</button><h2>Your saved quiz record</h2><p class="muted">Loading your answers…</p></div>';
  document.body.appendChild(overlay);
  try{
    const d=await api('/api/game/quiz-history',auth()),h=d.history,items=h.answers||[];
    overlay.querySelector('.quiz-history-panel').innerHTML='<button type="button" class="btn small quiz-history-close" data-history-close>Close ×</button>'+
      '<div class="eyebrow">MY QUIZ HISTORY · '+esc(h.scripture||'Matthew 11')+'</div>'+
      '<h2>'+esc(h.participation==='team'?(h.teamName||'Team'):'Solo')+' · '+Number(h.percent)+'%</h2>'+
      '<p class="muted">'+Number(h.correct)+' / '+Number(h.total)+' correct · '+esc(h.gameCode)+'</p>'+
      '<div class="quiz-history-answers">'+items.map(item=>'<article class="quiz-history-answer"><div class="quiz-history-answer-meta"><span>QUESTION '+Number(item.order)+' · '+esc(item.reference||'')+'</span><strong class="'+(item.correct?'correct':'missed')+'">'+(item.correct?'Correct':'Review')+'</strong></div>'+
      '<h3>'+esc(item.prompt||'')+'</h3><p><b>Your '+(h.participation==='team'?'team’s ':'')+'answer:</b> '+esc(item.answer||'Not answered')+'</p>'+
      (!item.correct?'<p><b>Scripture answer:</b> '+esc(item.correctAnswer||'')+'</p>':'')+'</article>').join('')+'</div>'+
      '<p class="muted">This record is tied to your authenticated game participation. Future Lumaneer linking requires verified account ownership.</p>';
  }catch(e){const p=overlay.querySelector('.quiz-history-panel .muted');if(p)p.textContent=e.message||'Could not load this record.'}
}
function questionTag(q){return '<div class="review-meta"><span>'+esc(q?.reference||q?.section||'Matthew 11')+'</span><span>'+esc(q?.type==='fill_blank'?'Fill in the blank':'Multiple choice')+'</span></div>'}
function reviewContent(review,host=false,projector=false){
  if(!review)return '<p class="muted">Waiting for the review.</p>';
  const q=review.question||{},stat=review.stats||{},stage=review.stage;
  const steps=['responses','answer','explanation','application'],step=Math.max(0,steps.indexOf(stage));
  if(projector){
    const lead='<div class="quiz-theater-kicker"><span class="quiz-theater-step">REVEAL '+(step+1)+' OF 4</span><span>'+esc(q.reference||'Matthew 11')+'</span></div>';
    const question='<h1 class="quiz-theater-question">'+esc(q.prompt||'')+'</h1>';
    let body='';
    if(stage==='responses'){
      let bars='';
      if(q.type==='fill_blank'){
        const items=stat.fillResponses||[];
        bars=(items.length?items.map((r,i)=>'<div class="quiz-theater-fill" style="--reveal-order:'+i+'"><strong>'+esc(r.answer)+'</strong><span>'+Number(r.percent||0)+'%</span></div>').join(''):'<p class="muted">No saved typed responses.</p>');
      }else{
        bars=(q.choices||[]).map((choice,i)=>{
          const r=(stat.responses||[]).find(x=>x.answer===choice)||{count:0,percent:0};
          return '<div class="quiz-theater-choice" style="--reveal-order:'+i+'"><div class="quiz-theater-choice-label"><b>'+String.fromCharCode(65+i)+'</b><span>'+esc(choice)+'</span><strong>'+Number(r.percent||0)+'%</strong></div><div class="quiz-theater-bar"><i style="--bar-size:'+Math.min(100,Math.max(0,Number(r.percent)||0))+'%"></i></div></div>';
        }).join('');
      }
      body='<div class="quiz-theater-body"><div class="quiz-theater-eyebrow">HOW DID THE ROOM RESPOND?</div>'+question+'<div class="quiz-theater-responses">'+bars+'</div><p class="quiz-theater-nudge">Look at the responses. What made this question difficult?</p></div>';
    }else if(stage==='answer'){
      body='<div class="quiz-theater-body quiz-theater-answer"><div class="quiz-theater-eyebrow">THE SCRIPTURE REVEALS</div>'+question+
        '<div class="quiz-theater-answer-text">'+esc(q.correctAnswer||'')+'</div>'+
        '<div class="quiz-theater-accuracy"><b>'+Number(stat.correctPercent||0)+'%</b><span>of submitted entries answered correctly</span></div></div>';
    }else if(stage==='explanation'){
      body='<div class="quiz-theater-body quiz-theater-explanation"><div class="quiz-theater-eyebrow">GO BACK TO THE TEXT</div>'+
        '<div class="quiz-theater-reference">'+esc(q.reference||'Matthew 11')+'</div>'+
        '<h1 class="quiz-theater-heading">What is Scripture showing us?</h1>'+
        '<p class="quiz-theater-paragraph">'+esc(q.explanation||'')+'</p></div>';
    }else{
      body='<div class="quiz-theater-body quiz-theater-application"><div class="quiz-theater-eyebrow">BRING THE TEXT INTO LIFE</div>'+
        '<h1 class="quiz-theater-heading">Where do we see this today?</h1>'+
        '<p class="quiz-theater-paragraph">'+esc(q.application||'')+'</p>'+
        '<div class="quiz-theater-discuss">Discuss it together. What would obedience look like in a real situation?</div></div>';
    }
    return '<div class="quiz-theater quiz-theater-'+esc(stage)+'">'+lead+body+'</div>';
  }
  let responses='';
  if(q.type==='fill_blank'){
    const items=stat.fillResponses||[];
    responses='<div class="response-bars"><div class="panel-label">Typed responses</div>'+(items.length?items.map(r=>'<div class="quiz-fill-response"><span>'+esc(r.answer)+'</span><strong>'+r.percent+'%</strong></div>').join(''):'<p>No typed answers.</p>')+'</div>';
  }else{
    responses='<div class="response-bars">'+(q.choices||[]).map((choice,i)=>{
      const r=(stat.responses||[]).find(x=>x.answer===choice)||{count:0,percent:0};
      return '<div class="response-row"><div><b>'+String.fromCharCode(65+i)+'</b><span>'+esc(choice)+'</span><strong>'+r.percent+'%</strong></div><div class="meter"><i style="width:'+r.percent+'%"></i></div></div>';
    }).join('')+'</div>';
  }
  let html=questionTag(q)+'<h1 class="review-question">'+esc(q.prompt||'')+'</h1>'+responses;
  if(['answer','explanation','application'].includes(stage))html+='<section class="reveal-block answer"><span>Correct answer · '+esc(q.reference||'')+'</span><h2>'+esc(q.correctAnswer||'')+'</h2><p>'+Number(stat.correctPercent||0)+'% answered correctly</p></section>';
  if(['explanation','application'].includes(stage))html+='<section class="reveal-block"><span>Biblical explanation</span><p>'+esc(q.explanation||'')+'</p></section>';
  if(stage==='application')html+='<section class="reveal-block application"><span>Practical application</span><p>'+esc(q.application||'')+'</p></section>';
  if(host){
    const cues={responses:'Ask the room why the responses differ before revealing the text.',answer:'Let the answer settle. Ask someone to locate it in Matthew 11.',explanation:'Follow the movement of the verse; clarify why the other choices miss it.',application:'Invite one concrete example of obedience. No pressure for a public confession.'};
    html+='<div class="quiz-host-prompt"><strong>HOST DISCUSSION CUE</strong><p>'+esc(cues[stage]||'')+'</p></div>';
  }
  return html;
}

function initLanding(){show('quiz-landing')}
async function initHost(){
  show('quiz-host');hostAuth=loadJSON(hostKey);
  if(hostAuth?.code){try{await requestState()}catch{hostAuth=null;localStorage.removeItem(hostKey)}}
  if(!snap){
    const d=await api('/api/game/quiz-create',{packId:'matthew-11-quiz-review-v4',teamCount:4});
    saveHost({code:d.gameCode,hostToken:d.hostToken,displayToken:d.displayToken});
    await requestState();
  }
  bindHost();await connectNetwork(hostAuth.code);startPolling();
}
function bindHost(){
  $('team-minus').onclick=()=>changeTeams(-1);$('team-plus').onclick=()=>changeTeams(1);
  $('start-quiz').onclick=async()=>{await saveSetup();await act('START_QUIZ')};
  $('close-quiz').onclick=()=>{if(confirm('Close the quiz and score only submitted work?'))act('CLOSE_QUIZ')};
  $('start-review').onclick=()=>act('START_REVIEW');$('review-back').onclick=()=>act('BACK_REVIEW');$('review-next').onclick=()=>act('ADVANCE_REVIEW');
  $('end-review').onclick=()=>{if(confirm('End review and show final scores?'))act('END_REVIEW')};
  document.addEventListener('click',e=>{if(e.target.closest('[data-archive-history]'))act('ARCHIVE_HISTORY')});
  $('new-quiz').onclick=()=>{if(confirm('Start a new quiz room?')){localStorage.removeItem(hostKey);location.reload()}};
  document.addEventListener('input',e=>{if(e.target.matches('[data-team-name]'))scheduleSetup()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeHistory()});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-captain]');if(b)act('SET_CAPTAIN',{teamId:b.dataset.teamId,targetPlayerId:b.dataset.captain})});
  const selector=$('quiz-mode');if(selector){selector.closest('label')?.classList.add('hidden');selector.value='team'}
}
let pendingSetup=null;
function scheduleSetup(){clearTimeout(pendingSetup);pendingSetup=setTimeout(saveSetup,450)}
async function saveSetup(){
  if(state?.phase!=='quiz_lobby')return;
  clearTimeout(pendingSetup);
  const teams=realTeams().map(t=>({...t,name:document.querySelector('[data-team-name="'+CSS.escape(t.id)+'"]')?.value||t.name}));
  return act('SETUP',{teamCount:teams.length,teams});
}
function changeTeams(n){
  if(state.phase!=='quiz_lobby')return;
  const old=realTeams(),count=Math.max(2,Math.min(12,old.length+n));if(count===old.length)return;
  if(count<old.length&&old.slice(count).some(t=>people.some(p=>p.teamId===t.id))){toast('Move participants before removing their team.');return}
  const colors=['#a33d3d','#355f8a','#456d50','#9b7937','#72558e','#9a5b3c'];
  const teams=Array.from({length:count},(_,i)=>old[i]||{id:'team-'+(i+1),name:'Team '+(i+1),color:colors[i%6]});
  act('SETUP',{teamCount:count,teams});
}
function renderHost(){
  if(!state)return;
  const code=snap.gameCode;
  $('host-code').textContent=code;$('big-code').textContent=code;
  $('host-projector-link').href=projectorLink(code);$('join-url').textContent=shareLink(code).replace(/^https?:\/\//,'');qr('host-qr',shareLink(code),178);
  $('player-count').textContent=people.length+' joined';
  $('team-count').textContent=realTeams().length;
  $('team-minus').disabled=state.phase!=='quiz_lobby'||realTeams().length<=2;
  $('team-plus').disabled=state.phase!=='quiz_lobby'||realTeams().length>=12;
  if(!document.activeElement?.matches('[data-team-name]'))$('team-editor').innerHTML=realTeams().map(t=>'<label class="team-edit"><span style="background:'+esc(t.color)+'"></span><input data-team-name="'+esc(t.id)+'" value="'+esc(t.name)+'"></label>').join('');
  for(const section of ['host-lobby','host-active','host-results','host-review','host-complete'])hide(section);
  $('setup-panel').classList.toggle('disabled-panel',state.phase!=='quiz_lobby');
  if(state.phase==='quiz_lobby'){
    show('host-lobby');$('mode-note').textContent='Each participant chooses Solo or Team. Solo participants submit independently; team captains submit one answer set for their group.';
    $('lobby-teams').innerHTML=[...realTeams(),{id:'solo',name:'Solo Participants',color:'#768598'}].map(t=>{
      const ps=people.filter(p=>p.teamId===t.id);
      return '<article class="team-card" style="--team:'+esc(t.color)+'"><div class="team-card-head"><div><span class="team-dot"></span><strong>'+esc(t.name)+'</strong></div><b>'+ps.length+'</b></div>'+
        (ps.length?ps.map(p=>'<div class="player-row"><span>'+esc(p.name)+'</span>'+(t.id==='solo'?'':p.isCaptain?'<strong>Captain</strong>':'<button class="text-button" data-captain="'+esc(p.playerId)+'" data-team-id="'+esc(t.id)+'">Make Captain</button>')+'</div>').join(''):'<p class="muted">Waiting for participants</p>')+'</article>';
    }).join('');
  }else if(state.phase==='quiz_active'){
    show('host-active');const p=state.progress||{};
    $('host-progress-big').textContent=(p.submitted||0)+' / '+(p.expected||0);
    const groups=[...realTeams().map(t=>({...t,...(p.teams||[]).find(e=>e.teamId===t.id)})),{id:'solo',name:'Solo Participants',color:'#768598',...(p.solo||{expected:0,submitted:0})}];
    $('host-progress-teams').innerHTML=groups.map(t=>'<article class="progress-card" style="--team:'+esc(t.color)+'"><div><span class="team-dot"></span><strong>'+esc(t.name)+'</strong><b>'+(t.submitted||0)+' / '+(t.expected||0)+'</b></div><div class="meter"><i style="width:'+(t.expected?Math.round(t.submitted/t.expected*100):0)+'%"></i></div></article>').join('');
  }else if(state.phase==='quiz_results'){
    show('host-results');$('overall-score').textContent=(state.results?.overallPercent??0)+'%';$('host-team-results').innerHTML=scoreboard(state.results)+(state.quizHistorySavedAt?'<p class="quiz-archive-status">Participant answer history archived for Lumaneer.</p>':'<div class="quiz-archive-warning">History has not been confirmed saved. <button class="btn small" data-archive-history>Retry save history</button></div>');
  }else if(state.phase==='quiz_review'){
    show('host-review');const r=state.review;
    $('review-progress').textContent='QUESTION '+((r?.index||0)+1)+' OF '+(r?.total||pack.questionCount);
    $('review-stage-label').textContent=stages[r?.stage]||'Review';$('host-review-card').innerHTML=reviewContent(r,true);
    $('review-back').disabled=r?.index===0&&r?.stage==='responses';
    $('review-next').textContent=r?.index===r?.total-1&&r?.stage==='application'?'Finish Quiz':'Continue →';
  }else{
    show('host-complete');$('complete-score').textContent=(state.results?.overallPercent??0)+'%';$('complete-results').innerHTML=scoreboard(state.results)+(state.quizHistorySavedAt?'<p class="quiz-archive-status">Participant answer history saved.</p>':'<div class="quiz-archive-warning"><button class="btn small" data-archive-history>Retry save history</button></div>');
  }
  const formatRows=document.querySelectorAll('.format-row');if(formatRows[0])formatRows[0].innerHTML='<b>'+pack.questionCount+'</b><span>questions · multiple choice + fill</span>';
}
async function initDisplay(){
  show('quiz-display');if(!urlCode()){$('display-stage').innerHTML='<p>Open this display through the quiz host console.</p>';return}
  await requestState();await connectNetwork(urlCode());startPolling();$('fullscreen').onclick=()=>document.documentElement.requestFullscreen?.();
}
function renderDisplay(){
  if(!state)return;
  $('display-code').textContent=snap.gameCode;qr('display-qr',shareLink(snap.gameCode),72);
  const stage=$('display-stage'),footer=$('display-footer');
  if(state.phase==='quiz_lobby'){
    stage.innerHTML='<div class="quiz-lobby-center"><span class="eyebrow">MATTHEW 11 · QUIZ & REVIEW</span><h1>JOIN THE QUIZ</h1><p>Choose Solo or Team · Español disponible en el registro</p><div class="quiz-lobby-qr-grid"><div class="quiz-lobby-qr-card"><div class="quiz-lobby-qr-title">JOIN THE QUIZ / ENTRAR AL CUESTIONARIO</div><div id="display-join-big" class="quiz-lobby-big-qr"></div><strong class="quiz-lobby-code">'+esc(snap.gameCode)+'</strong></div><div class="quiz-lobby-qr-card"><div class="quiz-lobby-qr-title">APOSTOLIC GUIDE</div><div id="display-guide-big" class="quiz-lobby-big-qr"></div><strong>apostolicguide.com</strong></div></div></div>';
    qr('display-join-big',shareLink(snap.gameCode),220);
    qr('display-guide-big','https://apostolicguide.com/',220);
    footer.innerHTML='<span>'+pack.questionCount+' questions · multiple choice + fill in the blank</span>';
  }else if(state.phase==='quiz_active'){
    const p=state.progress||{};
    stage.innerHTML='<div class="display-message"><span>QUIZ IN PROGRESS</span><h1>'+(p.submitted||0)+' / '+(p.expected||0)+' submitted</h1><p>Answers remain private until the quiz is closed.</p></div>';
    footer.innerHTML='<span>Solo: '+(p.solo?.submitted||0)+' / '+(p.solo?.expected||0)+'</span><strong>Team entries: '+(p.teams||[]).reduce((n,t)=>n+t.submitted,0)+' submitted</strong>';
  }else if(state.phase==='quiz_results'){
    stage.innerHTML='<div class="display-results"><span class="eyebrow">MATTHEW 11 · RESULTS</span><div class="display-overall">'+(state.results?.overallPercent??0)+'%</div><p>Room accuracy · '+(state.results?.submittedUnits||0)+' submitted entries</p>'+scoreboard(state.results)+'</div>';
    footer.innerHTML='<span>Solo and team results are ranked separately.</span>';
  }else if(state.phase==='quiz_review'){
    const r=state.review;
    stage.innerHTML='<div class="display-review"><div class="display-review-head"><span>QUESTION '+((r?.index||0)+1)+' OF '+(r?.total||0)+'</span><div class="quiz-stage-track">'+['responses','answer','explanation','application'].map((phase,i)=>'<span class="'+(i<=['responses','answer','explanation','application'].indexOf(r?.stage)?'active':'')+'" title="'+esc(stages[phase])+'"></span>').join('')+'</div><strong>'+esc(stages[r?.stage]||'Review')+'</strong></div><div class="review-card">'+reviewContent(r,false,true)+'</div></div>';
    footer.innerHTML='<span>'+esc(r?.question?.reference||'Matthew 11')+'</span><strong>'+(r?.stage==='responses'?((r?.stats?.answered||0)+' responses'):(r?.stats?.correctPercent||0)+'% correct')+'</strong>';
  }else{
    stage.innerHTML='<div class="display-results"><span class="eyebrow">MATTHEW 11 · COMPLETE</span><div class="display-overall">'+(state.results?.overallPercent??0)+'%</div><h1>Knowledge → Understanding → Application</h1>'+scoreboard(state.results)+'</div>';
    footer.innerHTML='<strong>Respond to what you learned.</strong>';
  }
}

async function initPlayer(){show('quiz-player');bindPlayer();const code=urlCode()||(params.has('new')?'':localStorage.getItem(lastCodeKey)||'');if(code){$('join-code-input').value=code;await connectToQuiz()}}
function bindPlayer(){
  $('connect-quiz').onclick=connectToQuiz;$('join-team').onclick=joinPlayer;
  const chooser=document.createElement('div');chooser.className='quiz-participation';chooser.id='participation-choice';
  chooser.innerHTML='<div class="panel-label">How will you participate?</div><div class="participation-buttons"><button type="button" class="participation-button active" data-participation="solo">Solo <small>Answer on your own</small></button><button type="button" class="participation-button" data-participation="team">Team <small>Discuss, captain submits</small></button></div>';
  $('team-picker')?.parentElement?.insertBefore(chooser,$('team-picker').previousElementSibling||$('team-picker'));
  document.addEventListener('click',e=>{
    const mode=e.target.closest('[data-participation]');if(mode){chosenParticipation=mode.dataset.participation;renderParticipation();return}
    const t=e.target.closest('[data-pick-team]');if(t){selectedTeamId=t.dataset.pickTeam;renderParticipation();return}
    const choice=e.target.closest('[data-quiz-answer]');if(choice){answerQuestion(choice.dataset.quizAnswer);return}
    const next=e.target.closest('[data-quiz-nav]');if(next){navigateQuiz(Number(next.dataset.quizNav));return}
    if(e.target.closest('#submit-quiz'))submitQuiz();
    if(e.target.closest('[data-history-open]'))openHistory();
    if(e.target.closest('[data-history-close]'))closeHistory();
  });
}
function renderParticipation(){
  document.querySelectorAll('[data-participation]').forEach(b=>b.classList.toggle('active',b.dataset.participation===chosenParticipation));
  const group=$('team-picker');if(!group)return;
  group.classList.toggle('hidden',chosenParticipation==='solo');
  group.innerHTML=realTeams().map(t=>'<button type="button" class="pick-team '+(selectedTeamId===t.id?'selected':'')+'" data-pick-team="'+esc(t.id)+'" style="--team:'+esc(t.color)+'"><span class="team-dot"></span>'+esc(t.name)+'</button>').join('');
  if(group.previousElementSibling&&group.previousElementSibling.id!=='participation-choice')group.previousElementSibling.classList.toggle('hidden',chosenParticipation==='solo');
  $('join-team').disabled=chosenParticipation==='team'&&!selectedTeamId;
  $('join-team').textContent=chosenParticipation==='solo'?'Join as Solo':'Join Team';
}
async function connectToQuiz(){
  const code=String($('join-code-input').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
  if(code.length!==6){$('join-error').textContent='Enter the six-character join code.';return}
  $('connect-quiz').disabled=true;
  try{
    const saved=loadJSON(playerKey(code));
    if(saved?.playerId){
      try{
        await api('/api/game/join',{code,resume:true,playerId:saved.playerId});
        savePlayer({code,playerId:saved.playerId});await enterPlayer(code);return;
      }catch(e){if(e.status!==401&&e.status!==404)throw e;localStorage.removeItem(playerKey(code))}
    }
    const d=await api('/api/game/quiz-state?code='+encodeURIComponent(code));
    snap=d;state=d.state;pack=d.quiz;
    if(state.phase!=='quiz_lobby')throw new Error('The quiz has started. New participants cannot join.');
    hide('join-step');show('profile-step');$('player-code').textContent=code;
    history.replaceState(null,'','/games/quiz/play?code='+encodeURIComponent(code));
    renderParticipation();
  }catch(e){$('join-error').textContent=e.message;show('join-step')}
  finally{$('connect-quiz').disabled=false}
}
async function joinPlayer(){
  const code=snap?.gameCode||urlCode(),name=String($('player-name').value||'').trim();
  const teamId=chosenParticipation==='solo'?'solo':selectedTeamId;
  if(!name||!teamId){toast('Enter your name and select how to participate.');return}
  $('join-team').disabled=true;
  try{
    const d=await api('/api/game/join',{code,name,teamId,language:$('quiz-spanish')?.checked?'es':'en'});
    savePlayer({code,playerId:d.player.playerId});await enterPlayer(code);
  }catch(e){toast(e.message)}finally{$('join-team').disabled=false}
}
async function enterPlayer(code){
  hide('join-step');hide('profile-step');show('player-session');$('player-code').textContent=code;
  history.replaceState(null,'','/games/quiz/play?code='+encodeURIComponent(code));
  await requestState();await connectNetwork(code);startPolling();startHeartbeat();
}
function myAnswer(id){return answers.find(a=>a.questionId===id)?.answer||''}
function canSubmit(){return me?.participation==='solo'||state.quizMode==='individual'||me?.isCaptain}
async function answerQuestion(answer){
  if(state.locked||!canSubmit())return;
  const q=pack.questions?.[currentIndex];if(q)await act('ANSWER',{questionId:q.id,answer});
}
// Next is the save action for typed answers. Do not advance or submit if
// persistence fails: the server remains the source of truth.
async function saveFillAnswer(){
  if(state.locked||!canSubmit())return false;
  const q=pack.questions?.[currentIndex],v=String($('fill-answer-input')?.value||'').trim();
  if(!q||q.type!=='fill_blank')return true;
  if(!v){toast('Enter your answer before continuing.');return false}
  if(v===myAnswer(q.id))return true;
  const saved=await act('ANSWER',{questionId:q.id,answer:v});
  return Boolean(saved);
}
let changingQuestion=false;
async function navigateQuiz(delta){
  if(changingQuestion)return;
  changingQuestion=true;
  try{
    if(pack.questions?.[currentIndex]?.type==='fill_blank'&&canSubmit()){
      if(!await saveFillAnswer())return;
    }
    currentIndex=Math.max(0,Math.min(pack.questionCount-1,currentIndex+delta));
    renderPlayer();
  }finally{changingQuestion=false}
}
async function submitQuiz(){
  if(state.locked||!canSubmit()||changingQuestion)return;
  changingQuestion=true;
  try{
    if(pack.questions?.[currentIndex]?.type==='fill_blank'){
      if(!await saveFillAnswer())return;
    }
    const missing=(pack.questions||[]).filter(q=>!myAnswer(q.id)).length;
    if(missing&&!confirm('There are '+missing+' unanswered questions. Submit anyway?'))return;
    if(confirm('Submit now? Answers cannot be changed afterward.'))await act('SUBMIT_QUIZ');
  }finally{changingQuestion=false}
}
function renderPlayer(){
  if(!state)return;
  if(!playerAuth){if(!$('profile-step')?.classList.contains('hidden'))renderParticipation();return}
  if(!me)return;
  const t=team(me.teamId);
  $('player-team-bar').innerHTML='<span class="team-dot" style="background:'+esc(t?.color||'#768598')+'"></span><strong>'+esc(me.participation==='solo'?'Solo · '+me.name:t?.name||'Team')+'</strong><span>'+esc(me.participation==='solo'?'Individual answers':me.isCaptain?'Team captain':'Team discussion')+'</span>';
  const el=$('player-content');
  if(state.phase==='quiz_lobby'){el.innerHTML='<section class="phone-card waiting-card"><span class="eyebrow">YOU’RE JOINED</span><h1>Matthew 11</h1><p>Waiting for the host to start.</p></section>';return}
  if(state.phase==='quiz_active'){
    if(state.locked){el.innerHTML='<section class="phone-card waiting-card"><span class="eyebrow">SUBMITTED</span><h1>Answers locked.</h1><p>'+state.progress.submitted+' / '+state.progress.expected+' entries submitted.</p></section>';return}
    const q=pack.questions?.[currentIndex];if(!q)return;
    const completed=(pack.questions||[]).filter(x=>myAnswer(x.id)).length;
    let response='';
    if(q.type==='fill_blank'){
      response='<div class="quiz-blank"><label for="fill-answer-input">Enter the missing word</label><input id="fill-answer-input" type="text" maxlength="120" spellcheck="false" autocomplete="off" enterkeyhint="next" value="'+esc(myAnswer(q.id))+'" '+(!canSubmit()?'disabled':'')+' placeholder="Your answer">'+(myAnswer(q.id)?'<small>Saved. Continue when ready.</small>':'<small>Minor spelling mistakes are allowed.</small>')+'</div>';
    }else response='<div class="choice-list">'+(q.choices||[]).map((choice,i)=>'<button class="choice '+(myAnswer(q.id)===choice?'selected':'')+'" data-quiz-answer="'+esc(choice)+'" '+(!canSubmit()?'disabled':'')+'><b>'+String.fromCharCode(65+i)+'</b><span>'+esc(choice)+'</span></button>').join('')+'</div>';
    el.innerHTML='<section class="phone-card quiz-card"><div class="quiz-progress-head"><span>QUESTION '+(currentIndex+1)+' OF '+pack.questionCount+'</span><strong>'+completed+' answered</strong></div><div class="meter"><i style="width:'+Math.round(completed/pack.questionCount*100)+'%"></i></div>'+questionTag(q)+'<h1>'+esc(q.prompt)+'</h1>'+response+
    (!canSubmit()?'<div class="discussion-note">Discuss with your team. Only the captain saves the group response.</div>':'')+
    '<div class="quiz-nav"><button class="btn" data-quiz-nav="-1" '+(currentIndex===0?'disabled':'')+'>← Previous</button>'+(currentIndex===pack.questionCount-1?(canSubmit()?'<button class="btn primary" id="submit-quiz">'+(q.type==='fill_blank'?'Save & Submit':'Submit Quiz')+'</button>':'<button class="btn" disabled>Captain submits</button>'):'<button class="btn primary" data-quiz-nav="1">'+(q.type==='fill_blank'&&canSubmit()?'Save & Next →':'Next →')+'</button>')+'</div></section>';
    return;
  }
  if(state.phase==='quiz_results'){el.innerHTML='<section class="phone-card"><span class="eyebrow">RESULTS</span><h1>Matthew 11</h1>'+scoreboard(state.results)+historyButton()+'<p class="muted">The host will guide the review.</p></section>';return}
  if(state.phase==='quiz_review'){el.innerHTML='<section class="phone-card review-phone"><span class="eyebrow">'+esc(stages[state.review?.stage]||'Review')+'</span>'+reviewContent(state.review)+'</section>';return}
  el.innerHTML='<section class="phone-card"><span class="eyebrow">QUIZ COMPLETE</span><h1>'+(state.results?.overallPercent??0)+'% room accuracy</h1>'+scoreboard(state.results)+historyButton()+'<p class="muted">The goal is not only to know Matthew 11, but to respond to it.</p></section>';
}
function render(){if(role==='host')renderHost();else if(role==='display')renderDisplay();else if(role==='player')renderPlayer()}
if(role==='landing')initLanding();
else if(role==='host')initHost().catch(e=>toast('Host could not load: '+e.message));
else if(role==='display')initDisplay().catch(e=>toast('Display could not load: '+e.message));
else if(role==='player')initPlayer().catch(e=>toast('Quiz could not load: '+e.message));
})();