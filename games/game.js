(() => {
'use strict';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const route=location.pathname.toLowerCase().replace(/\/+$/,'')||'/games';
const role=route==='/games/host'?'host':route==='/games/display'?'display':['/games/play','/games/join'].includes(route)?'player':'landing';
const qs=new URLSearchParams(location.search);
const codeFromUrl=()=>String(qs.get('code')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
const now=()=>Date.now();

let snapshot=null,state=null,pack=null,players=[],submissions=[];
let hostAuth=null,playerAuth=null,displayToken=qs.get('dt')||'';
let sb=null,channel=null,pollTimer=null,tickTimer=null,tickPending=false,fetchPending=false;
let audioCtx=null,audioArmed=false,lastEffectKey='',lastPlayerEffectKey='',selectedTeamId=null,setupTimer=null;
let livePc=null,liveDc=null,liveConnected=false,liveConnecting=false,liveMicStream=null,liveMicEnabled=false,liveSessionStarted=false,liveSilentSource=null;
let qrCache={host:'',display:''},lastStealSignal='',battleFxStarted=false;

function show(id){$(id)?.classList.remove('hidden')}
function hide(id){$(id)?.classList.add('hidden')}
function team(id){return (state?.teams||[]).find(t=>t.id===id)||null}
function me(){return players.find(p=>p.playerId===playerAuth?.playerId)||null}
function isCaptain(){return !!me()?.isCaptain}
function category(id){return pack?.categories?.find(c=>c.id===id)}
function activeQ(){return state?.activeQuestion||null}
function joinUrl(code){return location.origin+'/games/play?code='+encodeURIComponent(code)}
function displayUrl(code,dt){return location.origin+'/games/display?code='+encodeURIComponent(code)+(dt?'&dt='+encodeURIComponent(dt):'')}
function renderQr(id,url,key,size=176){
  const el=$(id);if(!el||!window.QRCode||qrCache[key]===url)return;
  qrCache[key]=url;el.innerHTML='';
  new QRCode(el,{text:url,width:size,height:size,colorDark:'#07111e',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
}
function saveHostAuth(v){hostAuth=v;localStorage.setItem('ministry_game_host_auth',JSON.stringify(v))}
function loadHostAuth(){try{return JSON.parse(localStorage.getItem('ministry_game_host_auth')||'null')}catch(e){return null}}
function savePlayerAuth(v){playerAuth=v;localStorage.setItem('ministry_game_player_'+v.code,JSON.stringify(v))}
function loadPlayerAuth(code){try{return JSON.parse(localStorage.getItem('ministry_game_player_'+code)||'null')}catch(e){return null}}

async function api(path,options={}){
  const r=await fetch(path,{cache:'no-store',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(d.error||('Request failed '+r.status));e.status=r.status;e.data=d;throw e}
  return d;
}
function applySnapshot(d){
  if(!d?.ok)return;
  snapshot=d;state=d.state||{};pack=d.pack||{};players=d.players||[];submissions=d.submissions||[];
  state.teams=d.teams||state.teams||[];
  render();
}
async function fetchState(){
  if(fetchPending)return;fetchPending=true;
  try{
    const code=hostAuth?.code||playerAuth?.code||codeFromUrl();if(!code)return;
    if(role==='host')applySnapshot(await api('/api/game/state',{method:'POST',body:JSON.stringify({code,hostToken:hostAuth.hostToken})}));
    else if(role==='player'&&playerAuth)applySnapshot(await api('/api/game/state',{method:'POST',body:JSON.stringify({code,playerId:playerAuth.playerId,playerToken:playerAuth.playerToken})}));
    else applySnapshot(await api('/api/game/state?code='+encodeURIComponent(code)));
    network(true,'Live');
  }catch(e){network(false,e.status===404?'Game not found':'Reconnect')}
  finally{fetchPending=false}
}
async function gameAction(action,extra={}){
  const code=hostAuth?.code||playerAuth?.code;
  const auth=role==='host'?{hostToken:hostAuth?.hostToken}:{playerId:playerAuth?.playerId,playerToken:playerAuth?.playerToken};
  try{
    const d=await api('/api/game/action',{method:'POST',body:JSON.stringify({code,action,...auth,...extra})});
    if(d?.ok&&d.state)applySnapshot(d);
    return d;
  }catch(e){if(e.status===409){await fetchState();return null}throw e}
}
async function connectRealtime(code){
  try{
    const c=await api('/api/config');if(!c.supabaseUrl||!c.supabaseAnonKey||!window.supabase)return;
    sb=window.supabase.createClient(c.supabaseUrl,c.supabaseAnonKey,{realtime:{params:{eventsPerSecond:20}}});
    channel=sb.channel('game:'+code,{config:{broadcast:{self:false}}})
      .on('broadcast',{event:'state'},()=>fetchState())
      .subscribe(status=>network(status==='SUBSCRIBED',status==='SUBSCRIBED'?'Live':'Connecting'));
  }catch(e){}
}
function network(ok,label){
  $('host-dot')?.classList.toggle('on',ok);
  if($('host-network'))$('host-network').textContent=label;
  if($('player-connection')){$('player-connection').textContent=String(label).toUpperCase();$('player-connection').classList.toggle('on',ok)}
}
function startPolling(ms=1200){clearInterval(pollTimer);pollTimer=setInterval(fetchState,ms)}
function seconds(deadline){return Math.max(0,Math.ceil((Number(deadline||0)-now())/1000))}
function currentDeadline(){
  if(state?.phase==='captain')return state.captainDeadline;
  if(state?.phase==='open')return state.teamDeadline;
  if(state?.phase==='steal_buzz')return state.stealBuzzDeadline;
  if(state?.phase==='steal_captain')return state.stealCaptainDeadline;
  if(state?.phase==='steal_open')return state.stealDeadline;
  return null;
}
function phaseLabel(){
  return ({captain:'CAPTAIN PRIORITY',open:'TEAM OPEN',locked:'ANSWER LOCKED',steal_buzz:'STEAL BUZZ',steal_captain:'STEAL CAPTAIN',steal_open:'STEAL TEAM OPEN',steal_locked:'STEAL LOCKED'}[state?.phase]||String(state?.phase||'').replaceAll('_',' ').toUpperCase());
}

function initLanding(){show('landing')}

async function initHost(){
  show('host');
  let saved=loadHostAuth();
  if(saved?.code&&saved?.hostToken){
    hostAuth=saved;
    try{await fetchState()}catch(e){}
  }
  if(!snapshot){
    const d=await api('/api/game/create',{method:'POST',body:JSON.stringify({teamCount:2})});
    hostAuth={code:d.gameCode,hostToken:d.hostToken,displayToken:d.displayToken};saveHostAuth(hostAuth);applySnapshot(d);
  }else if(!hostAuth.displayToken&&saved?.displayToken){hostAuth.displayToken=saved.displayToken}
  wireHost();
  await connectRealtime(hostAuth.code);startPolling(1000);
  clearInterval(tickTimer);tickTimer=setInterval(hostTick,180);
}
function wireHost(){
  $('team-minus').onclick=()=>hostResize(-1);$('team-plus').onclick=()=>hostResize(1);
  $('start-game').onclick=()=>gameAction('START');
  $('host-correct').onclick=()=>gameAction('JUDGE',{correct:true});
  $('host-wrong').onclick=()=>gameAction('JUDGE',{correct:false});
  $('host-steal').onclick=()=>gameAction('OPEN_STEAL');
  $('host-reveal').onclick=()=>gameAction('REVEAL');
  $('host-next').onclick=()=>gameAction('NEXT');
  $('host-final').onclick=()=>gameAction('START_FINAL');
  $('host-end').onclick=()=>gameAction('END');
  $('generate-pack').onclick=generatePack;
  for(const id of ['voice-toggle','sound-toggle','steal-toggle','captain-time','open-time']){
    $(id).onchange=queueSetup;
  }
  document.addEventListener('input',e=>{if(e.target.matches('[data-team-name]'))queueSetup()});
  document.addEventListener('click',e=>{
    const cap=e.target.closest('[data-captain]');if(cap)return gameAction('SET_CAPTAIN',{teamId:cap.dataset.teamId,targetPlayerId:cap.dataset.captain});
    const score=e.target.closest('[data-score-team]');if(score)return gameAction('SET_CONTROL_TEAM',{teamId:score.dataset.scoreTeam});
    const q=e.target.closest('[data-question-id]');if(q&&!q.classList.contains('used'))return gameAction('OPEN_QUESTION',{questionId:q.dataset.questionId});
    const fj=e.target.closest('[data-final-judge]');if(fj)return gameAction('FINAL_JUDGE',{teamId:fj.dataset.teamId,correct:fj.dataset.finalJudge==='correct'});
  });
}
function hostResize(delta){
  if(state.phase!=='lobby')return;
  const n=Math.max(2,Math.min(12,(state.teams||[]).length+delta));
  const teams=Array.from({length:n},(_,i)=>state.teams[i]||{id:'team-'+(i+1),name:'Team '+(i+1)});
  gameAction('SETUP',{teamCount:n,teams,settings:hostSettings()});
}
function hostSettings(){
  return {
    captainMs:Number($('captain-time')?.value)||7000,
    openMs:Number($('open-time')?.value)||5000,
    stealMs:5000,
    autoSteal:$('steal-toggle')?.checked!==false,
    sound:$('sound-toggle')?.checked!==false,
    voice:$('voice-toggle')?.checked===true
  };
}
function queueSetup(){
  if(state?.phase!=='lobby')return;
  clearTimeout(setupTimer);setupTimer=setTimeout(()=>{
    const teams=(state.teams||[]).map(t=>({...t,name:document.querySelector('[data-team-name="'+CSS.escape(t.id)+'"]')?.value||t.name}));
    gameAction('SETUP',{teamCount:teams.length,teams,settings:hostSettings()});
  },350);
}
function hostTick(){
  if(role!=='host'||!state||tickPending)return;
  const d=state?.phase==='result'?state.resultDeadline:currentDeadline();if(!d||now()<Number(d))return;
  tickPending=true;gameAction('TICK').finally(()=>setTimeout(()=>tickPending=false,220));
}
function renderHost(){
  if(!state)return;
  $('host-code').textContent=hostAuth.code;$('big-code').textContent=hostAuth.code;
  $('join-url').textContent=joinUrl(hostAuth.code).replace(/^https?:\/\//,'');
  renderQr('host-qr',joinUrl(hostAuth.code),'host',184);
  $('display-link').href=displayUrl(hostAuth.code,hostAuth.displayToken);
  if($('host-player-top'))$('host-player-top').textContent=players.length+' Player'+(players.length===1?'':'s');
  $('team-count').textContent=state.teams.length;
  if($('team-minus'))$('team-minus').disabled=state.phase!=='lobby'||state.teams.length<=2;
  if($('team-plus'))$('team-plus').disabled=state.phase!=='lobby'||state.teams.length>=12;
  $('voice-toggle').checked=!!state.settings?.voice;$('sound-toggle').checked=state.settings?.sound!==false;$('steal-toggle').checked=state.settings?.autoSteal!==false;
  $('captain-time').value=String(state.settings?.captainMs||7000);$('open-time').value=String(state.settings?.openMs||5000);
  $('pack-title').textContent=pack?.title||'Bible Battle';
  $('team-editor').innerHTML=state.teams.map(t=>'<div class="team-edit"><span class="team-swatch" style="background:'+t.color+'"></span><input data-team-name="'+esc(t.id)+'" value="'+esc(t.name)+'"></div>').join('');
  const lobby=state.phase==='lobby';
  $('host-lobby').classList.toggle('hidden',!lobby);$('host-game').classList.toggle('hidden',lobby);
  $('host-setup-panels')?.classList.toggle('hidden',!lobby);$('host-live-library')?.classList.toggle('hidden',lobby);
  renderLobby();if(!lobby)renderHostGame();
}
function renderLobby(){
  if(!$('lobby-teams'))return;
  $('player-count').textContent=players.length+' connected';
  $('lobby-teams').innerHTML=state.teams.map(t=>{
    const ps=players.filter(p=>p.teamId===t.id);
    return '<div class="lobby-team" style="--team:'+t.color+'"><div class="lobby-team-head"><h3>'+esc(t.name)+'</h3><span class="count-pill">'+ps.length+'</span></div><div class="player-list">'+
      (ps.length?ps.map(p=>'<div class="player-row"><span>'+esc(p.name)+'</span><span>'+(p.isCaptain?'<span class="captain-mark">Captain</span>':'<button class="mini-btn" data-team-id="'+esc(t.id)+'" data-captain="'+esc(p.playerId)+'">Make Captain</button>')+'</span></div>').join(''):'<div class="small-state">Waiting for players…</div>')+
      '</div></div>';
  }).join('');
}
function scorebarHtml(host=false){
  return state.teams.map((t,i)=>'<div class="'+(host?'host-score':'display-team')+' '+(state.controlTeamId===t.id?'control':'')+'" style="--team:'+t.color+'" '+(host?'data-score-team="'+esc(t.id)+'"':'')+'>'+
    (host?'<small>'+esc(t.name)+'</small><strong>'+Number(t.score||0).toLocaleString()+'</strong>':'<span class="team-emblem">'+['♜','♛','♟','♚','✦','◆'][i%6]+'</span><span class="team-copy"><span class="team-name">'+esc(t.name)+'</span><span class="team-score">'+Number(t.score||0).toLocaleString()+'</span><i class="team-pips"><b></b><b></b><b></b><b></b></i></span>')+'</div>').join('');
}
function boardHtml(host=false){
  const cats=pack?.categories||[],rows=pack?.board||[];
  return cats.map(c=>'<div class="'+(host?'host-cat':'game-category')+'">'+esc(c.label)+'</div>').join('')+
    [100,200,300,400,500].map(points=>cats.map(c=>{
      const q=rows.find(x=>x.category===c.id&&Number(x.points)===points),used=q&&(state.usedQuestionIds||[]).includes(q.id);
      if(host)return '<button class="host-tile '+(used?'used':'')+'" data-question-id="'+esc(q?.id||'')+'">'+(q?'$'+points:'—')+'</button>';
      return '<div class="game-tile '+(used?'used':'')+'">'+(q&&!used?'$'+points:'')+'</div>';
    }).join('')).join('');
}
function renderHostGame(){
  const board=$('host-board'),box=$('host-question'),phase=state.phase,q=activeQ(),control=team(state.controlTeamId);
  $('host-scorebar').innerHTML=scorebarHtml(true);
  if($('host-phase'))$('host-phase').textContent=phaseLabel()||'BOARD';
  if($('host-active-meta'))$('host-active-meta').textContent=q?(esc(category(q.category)?.label||q.category)+' · '+q.points+' pts'):(control?.name+' controls the board');
  renderQuestionLibrary();
  if(state.phase==='board'){
    board.classList.remove('hidden');box.classList.add('hidden');
    board.style.setProperty('--cat-count',(pack?.categories||[]).length);board.innerHTML=boardHtml(true);
  }else{
    board.classList.add('hidden');box.classList.remove('hidden');box.innerHTML=hostQuestionHtml();
  }
  $('host-correct').classList.toggle('hidden',!['locked','steal_locked'].includes(phase));
  $('host-wrong').classList.toggle('hidden',!['locked','steal_locked'].includes(phase));
  $('host-steal').classList.add('hidden');$('host-reveal').classList.add('hidden');$('host-next').classList.add('hidden');
  $('host-final').classList.toggle('hidden',phase!=='board');$('host-end').classList.toggle('hidden',phase==='ended');
  if($('host-control-summary')){
    const cap=players.find(p=>p.playerId===control?.captainPlayerId);
    $('host-control-summary').innerHTML='<div class="control-team" style="--team:'+(control?.color||'#f7c84b')+'"><small>TEAM IN CONTROL</small><strong>'+esc(control?.name||'—')+'</strong><span>Captain: '+esc(cap?.name||'Not assigned')+'</span></div>'+
      '<div class="control-line"><span>Mode</span><b>'+esc(phaseLabel()||'BOARD')+'</b></div>'+
      '<div class="control-line"><span>Steals</span><b>'+(state.settings?.autoSteal===false?'MANUAL':'AUTO')+'</b></div>'+
      '<div class="control-line"><span>Judging</span><b>AUTO</b></div>';
  }
  if($('host-device-summary')){
    const online=players.filter(p=>p.connected).length,captains=players.filter(p=>p.isCaptain).length;
    $('host-device-summary').innerHTML='<div class="device-stat"><strong>'+online+'</strong><span>Players online</span></div><div class="device-stat"><strong>'+captains+'</strong><span>Captains</span></div><div class="device-stat"><strong>'+(state.settings?.voice?'ON':'OFF')+'</strong><span>Meridian</span></div>';
  }
  if($('host-answer-notes')){
    const r=state.lastResult;
    $('host-answer-notes').innerHTML=q?'<div><small>CORRECT ANSWER</small><strong>'+esc(q.correctAnswer||r?.correctAnswer||'Hidden until result')+'</strong></div><div><small>REFERENCE</small><strong>'+esc(q.reference||r?.reference||'')+'</strong></div><div class="notes-wide"><small>HOST NOTES</small><span>'+esc(q.explanation||r?.explanation||'Answers are judged automatically against the verified answer set.')+'</span></div>':'<div class="notes-wide"><small>BOARD CONTROL</small><span>The captain of '+esc(control?.name||'the active team')+' chooses the next available question from their phone.</span></div>';
  }
}
function renderQuestionLibrary(){
  const el=$('host-question-library');if(!el)return;
  const rows=pack?.board||[],used=new Set(state.usedQuestionIds||[]);
  if($('library-progress'))$('library-progress').textContent=used.size+' / '+rows.length;
  el.innerHTML=(pack?.categories||[]).map(c=>{
    const qs=rows.filter(q=>q.category===c.id).sort((x,y)=>x.points-y.points);
    return '<section class="library-group"><h4>'+esc(c.label)+' <span>'+qs.length+'</span></h4>'+qs.map(q=>{
      const active=q.id===state.activeQuestionId,done=used.has(q.id);
      return '<button class="library-question '+(active?'active ':'')+(done?'used':'')+'" data-question-id="'+esc(q.id)+'" '+(done?'disabled':'')+'><b>'+q.points+'</b><span>'+esc(q.prompt||c.label+' · '+q.points)+'</span><i>'+(active?'LIVE':done?'USED':'READY')+'</i></button>';
    }).join('')+'</section>';
  }).join('');
}
function hostQuestionHtml(){
  if(state.phase==='final_wager'){
    return '<div class="hq-meta">FINAL SHOWDOWN</div><h2>'+esc(pack?.final?.category||'Final Round')+'</h2><p>Captains are wagering privately.</p><button class="game-btn primary" id="open-final-question">Open Final Question</button>';
  }
  if(['final_answer','final_judging'].includes(state.phase)){
    const answers=state.finalAnswers||{},wagers=state.finalWagers||{};
    return '<div class="hq-meta">FINAL SHOWDOWN</div><h2>'+esc(pack?.final?.prompt||'')+'</h2><div class="suggestion-grid">'+state.teams.map(t=>{
      const ans=answers[t.id];
      return '<div class="suggestion"><b>'+esc(t.name)+' · wager '+(wagers[t.id]??'—')+'</b><div>'+(ans?esc(ans):'Waiting…')+'</div>'+(ans?'<div class="poll-actions"><button class="mini-btn" data-team-id="'+t.id+'" data-final-judge="correct">Correct</button><button class="mini-btn" data-team-id="'+t.id+'" data-final-judge="wrong">Wrong</button></div>':'')+'</div>';
    }).join('')+'</div>';
  }
  if(['winner','ended'].includes(state.phase)){
    const names=(state.winnerTeamIds||[]).map(id=>team(id)?.name).filter(Boolean);
    return '<div class="hq-meta">GAME COMPLETE</div><h2>'+esc(names.join(' + ')||'Winner')+'</h2>';
  }
  const q=activeQ();
  if(!q)return '<div class="hq-meta">'+esc(phaseLabel())+'</div><h2>Waiting for the next board selection.</h2>';
  const activeTeam=state.phase.startsWith('steal_')?team(state.stealTeamId):team(state.controlTeamId);
  const subs=submissions.filter(x=>x.teamId===(activeTeam?.id)),r=state.lastResult||{};
  return '<div class="hq-meta">'+esc(category(q.category)?.label||q.category)+' · '+q.points+' POINTS · '+esc(phaseLabel())+'</div>'+
    '<h2>'+esc(q.prompt)+'</h2>'+
    (currentDeadline()?'<div class="host-clock">'+seconds(currentDeadline())+'</div>':'')+
    (state.phase==='result'?'<div class="host-result '+(r.correct?'correct':'wrong')+'"><b>'+(r.correct?'CORRECT':'INCORRECT')+'</b><span>'+esc(team(r.teamId)?.name||'')+(r.correct?' +'+r.points:'')+'</span></div>':'')+
    (subs.length?'<div class="suggestion-grid">'+subs.map(x=>'<div class="suggestion"><b>'+esc(players.find(p=>p.playerId===x.playerId)?.name||'Player')+(x.isCaptain?' · CAPTAIN':'')+'</b>'+esc(x.answer)+'</div>').join('')+'</div>':'');
}
window.__gameOpenFinal=()=>gameAction('OPEN_FINAL');

async function generatePack(){
  const b=$('generate-pack'),status=$('generator-state'),confirm=$('pack-confirm'),difficulty=$('difficulty').value;
  b.disabled=true;b.classList.add('working');b.textContent='Generating & validating…';
  status.className='pack-status working';status.innerHTML='<span class="pack-spinner"></span><span>OpenAI is building a complete 30-question board. This can take a moment.</span>';
  confirm.classList.add('hidden');confirm.innerHTML='';
  try{
    const d=await api('/api/game/generate',{method:'POST',body:JSON.stringify({code:hostAuth.code,hostToken:hostAuth.hostToken,difficulty})});
    const stamp=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
    status.className='pack-status success';status.innerHTML='<span class="pack-status-icon">✓</span><span><b>NEW PACK READY</b> · '+esc(d.pack?.questionCount||30)+' questions validated and saved.</span>';
    confirm.innerHTML='<div><small>AI GAME PACK</small><strong>'+esc(d.pack?.title||'Bible Battle')+'</strong><span>'+esc(difficulty.toUpperCase())+' · '+esc(d.pack?.questionCount||30)+' QUESTIONS · '+esc(stamp)+'</span></div><button class="mini-btn" id="review-pack">Review Board</button>';
    confirm.classList.remove('hidden');await fetchState();
    $('review-pack')?.addEventListener('click',()=>{document.querySelector('.pack-confirm')?.scrollIntoView({behavior:'smooth',block:'center'});});
  }catch(e){
    status.className='pack-status error';status.innerHTML='<span class="pack-status-icon">!</span><span><b>PACK NOT REPLACED.</b> '+esc(e.message||'AI generator unavailable. The previous pack is still loaded.')+'</span>';
  } finally{b.disabled=false;b.classList.remove('working');b.textContent='Generate New AI Pack'}
}

async function initDisplay(){
  show('display');initBattleFx();const code=codeFromUrl();
  if(!code){$('display-stage').innerHTML='<div class="display-question"><div class="question-category">DISPLAY SETUP</div><h1>Open this screen from the host console.</h1></div>';return}
  $('display-code').textContent='GAME '+code;$('arm-audio').onclick=()=>armAudio();
  await fetchState();await connectRealtime(code);startPolling(900);setInterval(()=>{renderDisplay();updateTimers()},100);
}
function renderDisplay(){
  if(!state)return;
  $('display-scorebar').style.setProperty('--team-count',state.teams.length);$('display-scorebar').innerHTML=scorebarHtml(false);
  const gameCode=snapshot?.gameCode||codeFromUrl();
  $('display-code').textContent='CODE '+gameCode;
  if($('display-join-url'))$('display-join-url').textContent=joinUrl(gameCode).replace(/^https?:\/\//,'');
  renderQr('display-qr',joinUrl(gameCode),'display',96);
  $('voice-disclosure').classList.toggle('hidden',!state.settings?.voice);
  const stage=$('display-stage'),q=activeQ();
  if(state.phase==='lobby'){
    stage.innerHTML='<section class="broadcast-lobby"><div class="lobby-copy"><span>JOIN BIBLE BATTLE</span><strong>'+esc(gameCode)+'</strong><p>Scan the QR code or enter the game code on your phone.</p></div><div class="lobby-team-count">'+players.length+' PLAYERS CONNECTED</div></section>';
  }else if(state.phase==='board'){
    const control=team(state.controlTeamId);
    stage.innerHTML='<div class="board-scene"><div class="board-heading"><span>THE BOARD</span><strong>'+esc(control?.name||'Team')+' controls · captain selects</strong></div><div class="game-board" style="--cat-count:'+(pack?.categories||[]).length+'">'+boardHtml(false)+'</div></div>';
  }else if(['captain','open','steal_captain','steal_open'].includes(state.phase))stage.innerHTML=displayQuestion(q);
  else if(state.phase==='steal_buzz'){
    stage.innerHTML='<section class="broadcast-result steal-scene"><span>STEAL AVAILABLE</span><strong>BUZZ NOW</strong><p>All eligible teams can buzz from their phones.</p><div class="timer-ring compact" data-deadline="'+state.stealBuzzDeadline+'"><strong>'+seconds(state.stealBuzzDeadline)+'</strong></div></section>';
  }else if(state.phase==='reveal'){
    stage.innerHTML='<section class="broadcast-reveal"><div><span>CORRECT ANSWER</span><strong>'+esc(q?.correctAnswer||'')+'</strong><b>'+esc(q?.reference||'')+'</b><p>'+esc(q?.explanation||'')+'</p></div></section>';
  }else if(state.phase==='result'){
    const r=state.lastResult||{},t=team(r.teamId),showAnswer=!!r.correctAnswer;
    stage.innerHTML='<section class="broadcast-result '+(r.correct?'correct':'wrong')+'" style="--team:'+(t?.color||'#35d6ff')+'"><span>'+esc(t?.name||'TEAM')+'</span><strong>'+(r.correct?'CORRECT':'INCORRECT')+'</strong><b>'+(r.correct?'+'+r.points+' POINTS':(state.resultNextPhase==='steal_buzz'?'STEAL OPENS NEXT':'ROUND COMPLETE'))+'</b>'+(showAnswer?'<p>'+esc(r.correctAnswer)+' · '+esc(r.reference||'')+'</p>':'')+'</section>';
  }else if(state.phase==='final_wager'){
    stage.innerHTML='<section class="broadcast-result"><span>FINAL SHOWDOWN</span><strong>'+esc(pack?.final?.category||'Final Round')+'</strong><p>Captains, lock your wagers.</p></section>';
  }else if(['final_answer','final_judging'].includes(state.phase)){
    stage.innerHTML='<section class="broadcast-question"><div class="question-copy"><span>FINAL SHOWDOWN</span><h1>'+esc(pack?.final?.prompt||'Get ready…')+'</h1></div></section>';
  }else if(['winner','ended'].includes(state.phase)){
    const ids=state.winnerTeamIds||[],names=ids.map(id=>team(id)?.name).filter(Boolean),t=team(ids[0]);
    stage.innerHTML='<section class="broadcast-result winner" style="--team:'+(t?.color||'#f7c84b')+'"><span>BIBLE BATTLE CHAMPIONS</span><strong>'+esc(names.join(' + ')||'WINNER')+'</strong><b>'+Number(t?.score||0).toLocaleString()+' POINTS</b></section>';
  }else stage.innerHTML='<section class="broadcast-result"><span>BIBLE BATTLE</span><strong>STANDBY</strong></section>';
  displayEffects();
}
function displayQuestion(q){
  if(!q)return '';
  const activeTeam=state.phase.startsWith('steal_')?team(state.stealTeamId):team(state.controlTeamId),deadline=currentDeadline();
  const choices=(q.choices||[]).length?'<div class="choice-grid">'+q.choices.map((x,i)=>'<div class="display-choice"><b>'+String.fromCharCode(65+i)+'</b><span>'+esc(x)+'</span></div>').join('')+'</div>':'';
  return '<section class="broadcast-question"><div class="question-copy"><div class="question-category">'+esc(category(q.category)?.label||q.category)+' <span>'+q.points+' POINTS</span></div><h1>'+esc(q.prompt)+'</h1>'+choices+'<div class="question-status"><span style="--team:'+(activeTeam?.color||'#f7c84b')+'">'+esc(activeTeam?.name||'Team')+'</span><b>'+esc(phaseLabel())+'</b></div></div><aside class="question-clock"><div class="timer-ring" data-deadline="'+deadline+'"><strong>'+seconds(deadline)+'</strong></div><small>SECONDS</small></aside></section>';
}
function updateTimers(){
  document.querySelectorAll('[data-deadline]').forEach(el=>{
    const d=Number(el.dataset.deadline),left=Math.max(0,d-now()),total=state?.phase==='steal_buzz'?(state.settings?.stealMs||5000):((state.settings?.captainMs||7000)+(state.settings?.openMs||5000));
    el.style.setProperty('--progress',String(Math.max(0,Math.min(1,left/Math.max(1,total)))));
    const s=el.querySelector('strong');if(s)s.textContent=Math.ceil(left/1000);
  });
}
function initBattleFx(){
  if(battleFxStarted)return;const canvas=$('battle-fx-canvas');if(!canvas)return;battleFxStarted=true;
  const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
  const stars=Array.from({length:34},(_,i)=>({x:(i*73%997)/997,y:(i*149%991)/991,r:.5+(i%4)*.32,s:.00004+(i%5)*.000018}));
  function resize(){const d=Math.min(2,window.devicePixelRatio||1),r=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.floor(r.width*d));canvas.height=Math.max(1,Math.floor(r.height*d));ctx.setTransform(d,0,0,d,0,0)}
  resize();addEventListener('resize',resize,{passive:true});
  function frame(ts){
    const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);
    const sweep=(Math.sin(ts*.00018)+1)/2;
    const g=ctx.createLinearGradient(w*(sweep-.3),0,w*(sweep+.25),h);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(246,202,89,.035)');g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    const rg=ctx.createRadialGradient(w*.52,h*.12,0,w*.52,h*.12,Math.max(w,h)*.72);rg.addColorStop(0,'rgba(44,111,168,.075)');rg.addColorStop(.45,'rgba(20,60,96,.025)');rg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=rg;ctx.fillRect(0,0,w,h);
    for(const p of stars){p.y+=p.s*16;if(p.y>1)p.y=0;ctx.beginPath();ctx.arc(p.x*w,p.y*h,p.r,0,Math.PI*2);ctx.fillStyle='rgba(255,231,166,.13)';ctx.fill()}
    requestAnimationFrame(frame);
  }requestAnimationFrame(frame);
}
function effectKey(){return [state?.phase,state?.lastResult?.nonce,(state?.winnerTeamIds||[]).join(',')].join('|')}
function displayEffects(){
  const key=effectKey();if(key===lastEffectKey)return;lastEffectKey=key;
  if(!audioArmed)return;
  if(['captain','steal_captain'].includes(state.phase))playSfx('question');
  if(['locked','steal_locked'].includes(state.phase))playSfx('lock');
  if(state.phase==='steal_buzz')playSfx('steal');
  if(state.phase==='result'){if(state.lastResult?.correct){playSfx('correct');confetti(team(state.lastResult.teamId)?.color||'#35d6ff')}else playSfx('wrong')}
  if(['winner','ended'].includes(state.phase)){playSfx('winner');confetti(team(state.winnerTeamIds?.[0])?.color||'#35d6ff')}
  if(!state.settings?.voice)return;
  if(state.phase==='captain')liveAnnounce('question');
  if(state.phase==='steal_buzz')liveAnnounce('steal');
  if(state.phase==='result')liveAnnounce(state.lastResult?.correct?'correct':'wrong');
  if(state.phase==='final_wager')liveAnnounce('final');
  if(['winner','ended'].includes(state.phase))liveAnnounce('winner');
}
function liveStatus(label,on=false){
  const el=$('live-voice-status');if(el){el.textContent=label;el.classList.toggle('on',on)}
  const btn=$('arm-audio');if(btn)btn.textContent=on?'Meridian Live':(liveConnecting?'Connecting Meridian…':'Start Meridian Live');
}
function liveSend(type,payload={}){
  if(!liveDc||liveDc.readyState!=='open'||!liveSessionStarted)return false;
  try{liveDc.send(JSON.stringify({type,...payload}));return true}catch(e){console.error('Meridian send failed',e);return false}
}
function liveEventText(cue){
  const q=activeQ(),r=state.lastResult||{},t=team(r.teamId),winner=(state.winnerTeamIds||[]).map(id=>team(id)?.name).filter(Boolean);
  if(cue==='ready')return 'Voice host online. Bible Battle is ready.';
  if(cue==='question'&&q)return 'Announce '+(category(q.category)?.label||q.category)+' for '+q.points+' points, then read this exact question: '+q.prompt;
  if(cue==='correct')return (t?.name||'The team')+' is correct and earns '+(r.points||0)+' points. Celebrate briefly.';
  if(cue==='wrong')return (t?.name||'The team')+' is incorrect. '+(state.resultNextPhase==='steal_buzz'?'Tell the other teams a steal is coming.':'The round is complete.');
  if(cue==='steal')return 'Steal is open now. Every eligible team except '+(team(state.controlTeamId)?.name||'the original team')+' can buzz.';
  if(cue==='final')return 'Final Showdown begins. The category is '+(pack?.final?.category||'Final Round')+'. Captains should lock their wagers.';
  if(cue==='winner')return (winner.join(' and ')||'The winning team')+' '+(winner.length===1?'is':'are')+' the Bible Battle champion'+(winner.length===1?'':'s')+'.';
  return '';
}
async function fallbackSpeak(cue){
  if(!state?.settings?.voice||!displayToken)return false;
  try{
    liveStatus('VOICE FALLBACK');
    const r=await fetch('/api/game/voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:snapshot.gameCode,displayToken,cue})});
    if(!r.ok)return false;
    const blob=await r.blob(),url=URL.createObjectURL(blob),audio=new Audio(url);
    audio.onended=()=>{URL.revokeObjectURL(url);liveStatus(liveSessionStarted?'MERIDIAN LIVE':'VOICE FALLBACK',liveSessionStarted)};
    await audio.play();return true;
  }catch(e){console.error('Voice fallback failed',e);return false}
}
function liveAnnounce(cue){
  const text=liveEventText(cue);if(!text)return false;
  if(!liveConnected||!liveSessionStarted){fallbackSpeak(cue);return false}
  const sent=liveSend('session.commentary.append',{event_id:'game_'+cue+'_'+Date.now(),delegation_id:null,content:text});
  if(!sent)fallbackSpeak(cue);
  return sent;
}
function waitForIceComplete(pc,timeout=5000){
  if(pc.iceGatheringState==='complete')return Promise.resolve();
  return new Promise(resolve=>{
    const done=()=>{pc.removeEventListener('icegatheringstatechange',check);clearTimeout(timer);resolve()};
    const check=()=>{if(pc.iceGatheringState==='complete')done()};
    const timer=setTimeout(done,timeout);pc.addEventListener('icegatheringstatechange',check);
  });
}
function createSilentInput(){
  const Ctx=window.AudioContext||window.webkitAudioContext;
  audioCtx=audioCtx||new Ctx();
  const dest=audioCtx.createMediaStreamDestination(),osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
  gain.gain.value=0.000001;osc.frequency.value=20;osc.connect(gain);gain.connect(dest);osc.start();
  liveSilentSource={osc,gain,dest};liveMicStream=dest.stream;return dest.stream;
}
async function startMeridianLive(){
  if(liveConnected||liveConnecting||!displayToken||!state?.settings?.voice)return;
  liveConnecting=true;liveSessionStarted=false;liveStatus('CONNECTING MERIDIAN');
  try{
    livePc=new RTCPeerConnection();
    liveDc=livePc.createDataChannel('oai-events');
    const output=$('live-voice-audio');
    livePc.ontrack=e=>{if(output){output.srcObject=e.streams[0]||new MediaStream([e.track]);output.muted=false;output.volume=1;output.play().catch(err=>console.error('Meridian playback blocked',err))}};
    const silent=createSilentInput();for(const tr of silent.getTracks())livePc.addTrack(tr,silent);
    let startTimer=null;
    liveDc.onopen=()=>liveStatus('MERIDIAN CONNECTED · STARTING');
    liveDc.onclose=()=>{liveConnected=false;liveConnecting=false;liveSessionStarted=false;liveStatus('MERIDIAN OFFLINE')};
    liveDc.onerror=e=>{console.error('Meridian data channel error',e);liveStatus('MERIDIAN DATA ERROR')};
    liveDc.onmessage=e=>{try{
      const evt=JSON.parse(e.data);
      if(evt.type==='session.started'){
        clearTimeout(startTimer);liveSessionStarted=true;liveConnected=true;liveConnecting=false;liveStatus('MERIDIAN LIVE',true);
        liveSend('session.instructions.append',{event_id:'game_host_ready_'+Date.now(),delegation_id:null,content:'Immediately say exactly: Meridian is online. Bible Battle is ready. Then pause and wait silently for game announcements.'});
      }else if(evt.type==='session.output_transcript.delta'){
        liveStatus('MERIDIAN SPEAKING',true);
      }else if(evt.type==='session.instructions.appended'||evt.type==='session.commentary.appended'){
        liveStatus('MERIDIAN LIVE',true);
      }else if(evt.type==='session.closed'){
        liveConnected=false;liveSessionStarted=false;liveStatus('MERIDIAN OFFLINE');
      }else if(evt.type==='error'){
        console.error('Meridian Live error',evt);liveStatus('MERIDIAN ERROR · '+(evt.error?.code||evt.error?.message||'EVENT REJECTED'));
      }
    }catch(err){console.error('Meridian event parse error',err)}};
    const offer=await livePc.createOffer();await livePc.setLocalDescription(offer);await waitForIceComplete(livePc);
    const sdp=livePc.localDescription?.sdp||offer.sdp;
    const r=await fetch('/api/game/live-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:snapshot.gameCode,displayToken,sdp})});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error((d.error||'Live session failed')+(d.details?' · '+d.details:''));
    const answer=d?.transport?.sdp;if(!answer)throw new Error('OpenAI Live did not return an SDP answer');
    await livePc.setRemoteDescription({type:'answer',sdp:answer});
    startTimer=setTimeout(()=>{if(!liveSessionStarted){liveStatus('MERIDIAN START TIMEOUT');fallbackSpeak('ready')}},9000);
  }catch(e){
    console.error('Meridian startup failed',e);liveConnected=false;liveConnecting=false;liveSessionStarted=false;
    try{livePc?.close()}catch(_){}
    try{liveSilentSource?.osc?.stop()}catch(_){}
    livePc=null;liveDc=null;liveMicStream=null;liveSilentSource=null;liveStatus('MERIDIAN UNAVAILABLE');fallbackSpeak('ready');
  }
}
function stopMeridianLive(){
  const wasStarted=liveSessionStarted;
  try{if(wasStarted)liveSend('session.close',{event_id:'game_close_'+Date.now()})}catch(_){}
  liveConnected=false;liveConnecting=false;liveSessionStarted=false;
  try{liveDc?.close()}catch(_){}try{livePc?.close()}catch(_){}
  try{liveSilentSource?.osc?.stop()}catch(_){}
  if(liveMicStream){for(const tr of liveMicStream.getTracks())tr.stop()}
  livePc=null;liveDc=null;liveMicStream=null;liveSilentSource=null;liveMicEnabled=false;liveStatus('MERIDIAN OFFLINE');
}
async function armAudio(){
  try{
    audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();await audioCtx.resume();
    audioArmed=true;playSfx('arm');$('arm-audio')?.classList.add('armed');
    if(state?.settings?.voice)await startMeridianLive();else liveStatus('GAME AUDIO ARMED');
  }catch(e){liveStatus('AUDIO UNAVAILABLE')}
}
function tone(freq,start,duration,gain=.07,type='sine'){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.001,audioCtx.currentTime+start);g.gain.exponentialRampToValueAtTime(gain,audioCtx.currentTime+start+.015);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+start+duration);o.connect(g);g.connect(audioCtx.destination);o.start(audioCtx.currentTime+start);o.stop(audioCtx.currentTime+start+duration+.03)}
function playSfx(n){if(!audioCtx)return;if(n==='arm'){tone(440,0,.08);tone(660,.07,.12)}if(n==='question'){tone(220,0,.11,.05,'sawtooth');tone(440,.08,.16,.06,'sawtooth')}if(n==='lock'){tone(180,0,.12,.07,'square');tone(120,.12,.16,.05,'square')}if(n==='correct'){[523,659,784,1047].forEach((f,i)=>tone(f,i*.07,.22,.07,'triangle'))}if(n==='wrong'){tone(170,0,.28,.08,'sawtooth');tone(110,.12,.34,.07,'sawtooth')}if(n==='steal'){tone(880,0,.08,.06);tone(660,.09,.08,.06);tone(990,.18,.18,.07)}if(n==='winner'){[392,523,659,784,1047].forEach((f,i)=>tone(f,i*.11,.32,.07,'triangle'))}}
function confetti(color){const layer=$('fx-layer');if(!layer)return;for(let i=0;i<72;i++){const p=document.createElement('i');p.className='particle';p.style.setProperty('--p',i%3===0?'#fff':i%3===1?color:'#ffcc57');p.style.setProperty('--x0',(innerWidth/2)+'px');p.style.setProperty('--y0',(innerHeight*.52)+'px');p.style.setProperty('--x1',(Math.random()*innerWidth)+'px');p.style.setProperty('--y1',(Math.random()*innerHeight)+'px');layer.appendChild(p);setTimeout(()=>p.remove(),1600)}}

async function initPlayer(){
  show('player');const code=codeFromUrl();
  if(code){$('join-code-input').value=code;playerAuth=loadPlayerAuth(code)}
  wirePlayer();
  if(playerAuth){
    try{await fetchState();hide('join-step');hide('profile-step');show('player-game');await connectRealtime(code);startPolling(1000);startHeartbeat();return}catch(e){}
  }
  if(code)await connectToGame();
}
function wirePlayer(){
  $('connect-game').onclick=connectToGame;
  $('join-team').onclick=joinSelectedTeam;
  document.addEventListener('click',e=>{
    const pick=e.target.closest('[data-pick-team]');if(pick){selectedTeamId=pick.dataset.pickTeam;renderTeamPicker();$('join-team').disabled=false;return}
    const ans=e.target.closest('[data-answer]');if(ans)return submitAnswer(ans.dataset.answer);
    if(e.target.closest('#captain-pick-question'))return playerDo('OPEN_QUESTION',{questionId:$('captain-board-select')?.value||''});
    if(e.target.closest('#steal-buzz-button'))return playerDo('BUZZ');
    if(e.target.closest('#typed-send'))return submitAnswer($('typed-answer')?.value);
    if(e.target.closest('#submit-wager'))return playerDo('FINAL_WAGER',{wager:Number($('wager-input')?.value)||0});
    if(e.target.closest('#submit-final-answer'))return playerDo('FINAL_ANSWER',{answer:$('final-answer-input')?.value||''});
  });
}
async function connectToGame(){
  const code=String($('join-code-input').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6),err=$('join-error');
  if(code.length!==6){err.textContent='Enter the 6-character game code.';return}
  try{
    const d=await api('/api/game/state?code='+encodeURIComponent(code));applySnapshot(d);$('player-game-code').textContent=code;hide('join-step');show('profile-step');selectedTeamId=null;renderTeamPicker();await connectRealtime(code);
  }catch(e){err.textContent=e.message}
}
function renderTeamPicker(){
  if(!snapshot)return;
  $('team-picker').innerHTML=state.teams.map(t=>'<button class="pick-team '+(selectedTeamId===t.id?'selected':'')+'" data-pick-team="'+esc(t.id)+'" style="--team:'+t.color+'">'+esc(t.name)+'</button>').join('');
}
async function joinSelectedTeam(){
  const code=snapshot?.gameCode||codeFromUrl(),name=String($('player-name').value||'').trim();
  if(!name||!selectedTeamId)return;
  try{
    const d=await api('/api/game/join',{method:'POST',body:JSON.stringify({code,name,teamId:selectedTeamId})});
    playerAuth={code,playerId:d.player.playerId,playerToken:d.playerToken};savePlayerAuth(playerAuth);applySnapshot(d);
    hide('profile-step');show('player-game');$('player-game-code').textContent=code;startPolling(1000);startHeartbeat();if(navigator.vibrate)navigator.vibrate([20,35,20]);
  }catch(e){$('join-error').textContent=e.message}
}
function startHeartbeat(){setInterval(()=>{if(playerAuth)playerDo('HEARTBEAT',{},true)},20000)}
async function playerDo(action,extra={},quiet=false){
  try{const d=await gameAction(action,extra);if(!quiet&&navigator.vibrate)navigator.vibrate(18);return d}
  catch(e){if(!quiet)network(false,e.message);return null}
}
function submitAnswer(answer){answer=String(answer||'').trim();if(answer)playerDo('ANSWER',{answer})}
function renderPlayer(){
  if(!state)return;
  if(!playerAuth){if(!$('profile-step').classList.contains('hidden'))renderTeamPicker();return}
  const p=me(),t=team(p?.teamId);if(!p||!t)return;
  $('player-team-banner').style.setProperty('--team',t.color);$('player-team-banner').innerHTML='<b>'+esc(t.name)+(p.isCaptain?' · CAPTAIN':'')+'</b><strong>'+t.score+'</strong>';
  const host=$('player-content'),q=activeQ();
  if(state.phase==='lobby'){host.innerHTML='<div class="waiting"><strong>YOU’RE IN</strong>Waiting for the host to start.</div>'}
  else if(state.phase==='board'){
    if(p.isCaptain&&t.id===state.controlTeamId){
      const available=(pack?.board||[]).filter(q=>!(state.usedQuestionIds||[]).includes(q.id));
      const groups=(pack?.categories||[]).map(c=>{const opts=available.filter(q=>q.category===c.id).sort((a,b)=>a.points-b.points);return opts.length?'<optgroup label="'+esc(c.label)+'">'+opts.map(q=>'<option value="'+esc(q.id)+'">'+esc(c.label)+' · '+q.points+' points</option>').join('')+'</optgroup>':''}).join('');
      host.innerHTML='<div class="player-card captain-board-picker"><div class="player-phase">YOUR TEAM CONTROLS THE BOARD</div><h2>Choose the next question</h2><select id="captain-board-select" class="board-select">'+groups+'</select><button id="captain-pick-question" class="game-btn primary full">Open Question</button><div class="small-state">Your selection opens immediately for the room.</div></div>';
    }else host.innerHTML='<div class="waiting"><strong>BOARD LIVE</strong>'+esc(team(state.controlTeamId)?.name||'A team')+' controls the board. Their captain is choosing.</div>';
  }
  else if(['captain','open','steal_captain','steal_open'].includes(state.phase))renderPlayerQuestion(host,q,p,t);
  else if(['locked','steal_locked'].includes(state.phase))host.innerHTML='<div class="player-card"><div class="player-phase">ANSWER LOCKED</div><h2>'+esc(team(state.lockedTeamId)?.name||'Team')+'</h2><div class="question">'+esc(state.lockedAnswer||'')+'</div><div class="small-state">Waiting for the host…</div></div>';
  else if(state.phase==='steal_buzz'){
    if(t.id===state.controlTeamId)host.innerHTML='<div class="waiting"><strong>STEAL OPEN</strong>Every other team can buzz right now.</div>';
    else{
      const sig=String(state.stealBuzzDeadline||'');if(sig&&sig!==lastStealSignal){lastStealSignal=sig;if(navigator.vibrate)navigator.vibrate([120,45,120,45,220])}
      host.innerHTML='<div class="player-card steal-takeover" style="--team:'+t.color+'"><div class="player-phase">STEAL AVAILABLE</div><strong class="steal-device-title">YOUR TEAM CAN STEAL</strong><button id="steal-buzz-button" class="buzz-button">BUZZ TO STEAL</button><div class="player-timer">'+seconds(state.stealBuzzDeadline)+'</div><div class="small-state">First server-accepted buzz wins the steal.</div></div>';
    }
  }else if(state.phase==='reveal')host.innerHTML='<div class="player-card"><div class="player-phase">CORRECT ANSWER</div><h2>'+esc(q?.correctAnswer||'')+'</h2><div class="small-state">'+esc(q?.reference||'')+' · '+esc(q?.explanation||'')+'</div></div>';
  else if(state.phase==='result'){const r=state.lastResult||{},nextSteal=state.resultNextPhase==='steal_buzz';host.innerHTML='<div class="waiting result-wait '+(r.correct?'correct':'wrong')+'"><strong>'+(r.correct?'CORRECT':'INCORRECT')+'</strong>'+esc(team(r.teamId)?.name||'')+(r.correct?' earned '+r.points+' points.':nextSteal?' missed. Steal opens next.':' missed. Returning to the board.')+'</div>';playerEffects()}
  else if(state.phase==='final_wager'){
    if(p.isCaptain)host.innerHTML='<div class="player-card"><div class="player-phase">FINAL WAGER</div><h2>'+esc(pack?.final?.category||'Final Round')+'</h2><div class="small-state">You have '+t.score+' points.</div><input id="wager-input" class="answer-input" type="number" min="0" max="'+Math.max(0,t.score)+'" value="'+Math.min(500,Math.max(0,t.score))+'"><button id="submit-wager" class="game-btn primary full">Lock Wager</button></div>';
    else host.innerHTML='<div class="waiting"><strong>FINAL WAGER</strong>Your captain is choosing the wager.</div>';
  }else if(state.phase==='final_answer'){
    if(p.isCaptain){const existing=state.finalAnswers?.[t.id];host.innerHTML=existing?'<div class="waiting"><strong>FINAL LOCKED</strong>'+esc(existing)+'</div>':'<div class="player-card"><div class="player-phase">FINAL SHOWDOWN</div><div class="question">'+esc(pack?.final?.prompt||'')+'</div><input id="final-answer-input" class="answer-input" maxlength="160" placeholder="Final answer"><button id="submit-final-answer" class="game-btn primary full">Lock Final Answer</button></div>'}
    else host.innerHTML='<div class="waiting"><strong>FINAL SHOWDOWN</strong>Your captain is locking the answer.</div>';
  }else if(state.phase==='final_judging')host.innerHTML='<div class="waiting"><strong>FINAL ANSWERS</strong>Host is judging the final round.</div>';
  else if(['winner','ended'].includes(state.phase)){const won=(state.winnerTeamIds||[]).includes(t.id);host.innerHTML='<div class="waiting"><strong>'+(won?'CHAMPIONS!':'GAME OVER')+'</strong>Final score: '+t.score+'</div>';playerEffects(true)}
}
function renderPlayerQuestion(host,q,p,t){
  if(!q)return;
  const stealing=state.phase.startsWith('steal_'),activeTeam=stealing?state.stealTeamId:state.controlTeamId;
  if(t.id!==activeTeam){host.innerHTML='<div class="waiting"><strong>'+esc(team(activeTeam)?.name||'Team')+'</strong>'+(stealing?'has the steal.':'is answering.')+'</div>';return}
  const open=state.phase.endsWith('open'),canLock=p.isCaptain||open,own=submissions.find(x=>x.playerId===p.playerId);
  let controls='';
  if((q.choices||[]).length)controls='<div class="phone-choices">'+q.choices.map((x,i)=>'<button class="phone-choice '+(own?.answer===x?'selected':'')+'" data-answer="'+esc(x)+'"><b>'+String.fromCharCode(65+i)+'</b>'+esc(x)+'</button>').join('')+'</div>';
  else controls='<input id="typed-answer" class="answer-input" maxlength="160" placeholder="Type answer"><button id="typed-send" class="game-btn primary full">'+(canLock?'LOCK ANSWER':'SEND TO CAPTAIN')+'</button>';
  const suggestions=p.isCaptain?captainSuggestions(t.id):'';
  host.innerHTML='<div class="player-card"><div class="player-phase">'+esc(phaseLabel())+'</div><div class="player-timer">'+seconds(currentDeadline())+'</div><div class="question">'+esc(q.prompt)+'</div>'+controls+'<div class="small-state">'+(canLock?'Your next answer is locked and checked automatically.':'Your answer is a suggestion until the captain locks or the team-open window begins.')+'</div>'+suggestions+'</div>';
}
function captainSuggestions(teamId){
  const rows=submissions.filter(x=>x.teamId===teamId);if(!rows.length)return '<div class="suggestions-box"><div class="small-state">No suggestions yet.</div></div>';
  const counts={};for(const x of rows)counts[x.answer]=(counts[x.answer]||0)+1;
  return '<div class="suggestions-box"><div class="panel-label">Team Suggestions</div>'+Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([a,n])=>'<div class="suggestion-count"><span>'+esc(a)+'</span><strong>'+n+'</strong></div>').join('')+'</div>';
}
function playerEffects(force=false){
  const p=me(),t=team(p?.teamId);if(!p||!t)return;
  const key=force?'winner-'+(state.winnerTeamIds||[]).join(','):'result-'+(state.lastResult?.nonce||'');
  if(key===lastPlayerEffectKey)return;lastPlayerEffectKey=key;
  const won=force?(state.winnerTeamIds||[]).includes(t.id):(state.lastResult?.correct&&state.lastResult?.teamId===t.id);
  if(!won)return;
  if(navigator.vibrate)navigator.vibrate(force?[70,50,70,50,140]:[40,30,80]);
  const box=$('player-celebration');box.style.setProperty('--team',t.color);box.innerHTML='<div><div class="celeb-word">'+(force?'CHAMPIONS!':'CORRECT!')+'</div><div class="celeb-points">'+(force?t.score+' PTS':'+'+state.lastResult.points)+'</div></div>';box.classList.remove('hidden');setTimeout(()=>box.classList.add('hidden'),1800);
}

function render(){
  if(role==='host')renderHost();
  else if(role==='display')renderDisplay();
  else if(role==='player')renderPlayer();
}

(async()=>{
  try{
    if(role==='landing')return initLanding();
    if(role==='host')return await initHost();
    if(role==='display')return await initDisplay();
    if(role==='player')return await initPlayer();
  }catch(e){
    document.body.innerHTML='<main class="landing"><section class="landing-card"><div class="brand-kicker">THE MINISTRY GAMES</div><h1>GAME<br><span>OFFLINE</span></h1><p>'+esc(e.message||'The game engine could not start.')+'</p></section></main>';
  }
})();
})();