(() => {
'use strict';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=v=>JSON.parse(JSON.stringify(v));
const COLORS=['#35d6ff','#ff5d70','#46e7a4','#ffcc57','#aa6cff','#ff8f45','#55a7ff','#f06dff'];
const route=location.pathname.toLowerCase().replace(/\/+$/,'')||'/games';
const role=route==='/games/host'?'host':route==='/games/display'?'display':['/games/play','/games/join'].includes(route)?'player':'landing';
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const normalize=v=>String(v??'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');
const now=()=>Date.now();
const randomId=(prefix='p')=>prefix+'_'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));
const randomCode=()=>Array.from({length:6},()=>alphabet[Math.floor(Math.random()*alphabet.length)]).join('');
const teamTemplate=(i)=>({id:'team_'+(i+1),name:['Lions','Eagles','Bereans','Fire','Kingdom','Acts 2','Witnesses','Overcomers'][i]||('Team '+(i+1)),color:COLORS[i%COLORS.length],score:0,streak:0,captainPlayerId:null});
const defaultSettings=()=>({captainPriorityMs:7000,teamOpenMs:5000,stealBuzzMs:3000,stealAnswerMs:6000,stealMultiplier:.6,autoSteal:true,sounds:true,aiVoice:false});
const newState=(code)=>({
  type:'ministry_game_state',version:1,code,seq:0,ts:now(),phase:'lobby',
  teams:[teamTemplate(0),teamTemplate(1)],players:[],pack:clone(window.MINISTRY_GAME_BUILTIN_PACK),
  settings:defaultSettings(),controlTeamId:'team_1',activeQuestionId:null,usedIds:[],
  captainUntil:null,answerUntil:null,lockedAnswer:null,lockedBy:null,lockedTeamId:null,
  suggestions:{},steal:{teamId:null,buzzUntil:null,captainUntil:null,answerUntil:null},
  result:null,resultNonce:0,finalWagers:{},finalAnswers:{},finalJudged:{},winnerTeamId:null
});

let state=null, channel=null, client=null, config=null, player=null, selectedTeamId=null;
let lastStateTs=0,lastDisplayPhase='',lastQuestionSpoken='',lastCelebrationNonce=0,audioCtx=null,audioArmed=false;
let hostTickTimer=null;

function show(id){$(id)?.classList.remove('hidden')}
function hide(id){$(id)?.classList.add('hidden')}
function question(){return state?.pack?.questions?.find(q=>q.id===state.activeQuestionId)||null}
function team(id){return state?.teams?.find(t=>t.id===id)||null}
function playerById(id){return state?.players?.find(p=>p.id===id)||null}
function isCaptain(p=player){return !!p && team(p.teamId)?.captainPlayerId===p.id}
function category(id){return state?.pack?.categories?.find(c=>c.id===id)}
function codeFromUrl(){return (new URLSearchParams(location.search).get('code')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)}
function joinUrl(code){return location.origin+'/games/play?code='+encodeURIComponent(code)}
function displayUrl(code){return location.origin+'/games/display?code='+encodeURIComponent(code)}
function saveHost(){if(role==='host'&&state){try{localStorage.setItem('ministry_game_host_state',JSON.stringify({savedAt:now(),state}))}catch(e){}}}
function loadHost(){
  try{
    const raw=JSON.parse(localStorage.getItem('ministry_game_host_state')||'null');
    if(raw?.state?.type==='ministry_game_state'&&now()-(raw.savedAt||0)<21600000)return raw.state;
  }catch(e){}
  return null;
}
function savePlayer(){
  if(!player||!state?.code)return;
  try{localStorage.setItem('ministry_game_player_'+state.code,JSON.stringify(player))}catch(e){}
}
function loadPlayer(code){
  try{return JSON.parse(localStorage.getItem('ministry_game_player_'+code)||'null')}catch(e){return null}
}

async function getConfig(){
  if(config)return config;
  try{
    const r=await fetch('/api/config',{cache:'no-store'}),d=await r.json();
    config={url:d.supabaseUrl||'',key:d.supabaseAnonKey||''};
  }catch(e){config={url:'',key:''}}
  return config;
}
async function connect(code){
  code=String(code||'').toUpperCase();
  if(!code)return false;
  const c=await getConfig();
  if(!c.url||!c.key||!window.supabase){network(false,'Realtime unavailable');return false}
  try{
    client=window.supabase.createClient(c.url,c.key,{realtime:{params:{eventsPerSecond:30}}});
    channel=client.channel('ministry-game:'+code,{
      config:{broadcast:{self:true,ack:false},presence:{key:role==='host'?'host':(player?.id||randomId('presence'))}}
    });
    channel
      .on('broadcast',{event:'game'},({payload})=>handleEvent(payload))
      .on('presence',{event:'sync'},()=>{if(role==='host')renderHostLobby()})
      .subscribe(async status=>{
        if(status==='SUBSCRIBED'){
          network(true,'Live');
          if(role==='host'){
            await channel.track({kind:'host',code});
            broadcastState();
          }else{
            await channel.track({kind:role,code,playerId:player?.id||null,name:player?.name||null,teamId:player?.teamId||null});
            send({kind:'REQUEST_STATE'});
          }
        }
        if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED')network(false,'Reconnect');
      });
    return true;
  }catch(e){network(false,'Realtime error');return false}
}
function network(ok,label){
  if($('host-dot'))$('host-dot').classList.toggle('on',ok);
  if($('host-network'))$('host-network').textContent=label;
  if($('player-connection')){$('player-connection').textContent=label.toUpperCase();$('player-connection').classList.toggle('on',ok)}
}
function send(payload){
  if(!channel)return;
  channel.send({type:'broadcast',event:'game',payload:{...payload,code:state?.code||payload.code,at:now()}});
}
function broadcastState(){
  if(role!=='host'||!state)return;
  state.seq=(state.seq||0)+1;state.ts=now();saveHost();
  send({kind:'STATE',state});
  renderAll();
}
function acceptState(next){
  if(!next||next.type!=='ministry_game_state')return;
  const ts=Number(next.ts)||0;if(ts&&lastStateTs&&ts<lastStateTs)return;lastStateTs=Math.max(lastStateTs,ts);
  state=next;
  if(role==='player'&&player){
    const canonical=playerById(player.id);
    if(canonical){player={...player,...canonical};savePlayer()}
  }
  renderAll();
}
function handleEvent(msg){
  if(!msg||!msg.kind)return;
  if(msg.kind==='STATE'&&role!=='host')return acceptState(msg.state);
  if(role!=='host')return;
  if(msg.kind==='REQUEST_STATE')return broadcastState();
  if(msg.kind==='JOIN')return hostJoin(msg);
  if(msg.kind==='ANSWER')return hostAnswer(msg);
  if(msg.kind==='BUZZ')return hostBuzz(msg);
  if(msg.kind==='FINAL_WAGER')return hostFinalWager(msg);
  if(msg.kind==='FINAL_ANSWER')return hostFinalAnswer(msg);
}

function renderAll(){
  if(role==='host'){renderHost();return}
  if(role==='display'){renderDisplay();return}
  if(role==='player'){renderPlayer();return}
}
function initLanding(){show('landing')}

function initHost(){
  show('host');
  state=loadHost()||newState(randomCode());
  state.settings={...defaultSettings(),...(state.settings||{})};
  $('host-code').textContent='· '+state.code;$('big-code').textContent=state.code;$('join-url').textContent=joinUrl(state.code).replace(/^https?:\/\//,'');
  $('display-link').href=displayUrl(state.code);
  bindHost();
  connect(state.code);
  renderHost();
  hostTickTimer=setInterval(hostClockTick,120);
}
function bindHost(){
  $('team-minus').onclick=()=>setTeamCount(state.teams.length-1);
  $('team-plus').onclick=()=>setTeamCount(state.teams.length+1);
  $('start-game').onclick=startGame;
  $('generate-pack').onclick=generatePack;
  $('voice-toggle').onchange=e=>{state.settings.aiVoice=e.target.checked;broadcastState()};
  $('sound-toggle').onchange=e=>{state.settings.sounds=e.target.checked;broadcastState()};
  $('steal-toggle').onchange=e=>{state.settings.autoSteal=e.target.checked;broadcastState()};
  $('captain-time').onchange=e=>{state.settings.captainPriorityMs=Number(e.target.value);broadcastState()};
  $('open-time').onchange=e=>{state.settings.teamOpenMs=Number(e.target.value);broadcastState()};
  $('host-correct').onclick=()=>judge(true);
  $('host-wrong').onclick=()=>judge(false);
  $('host-steal').onclick=openSteal;
  $('host-reveal').onclick=hostReveal;
  $('host-next').onclick=hostNext;
  $('host-final').onclick=startFinal;
  $('host-end').onclick=endGame;
  document.addEventListener('input',e=>{
    const input=e.target.closest('[data-team-name]');
    if(input){const t=team(input.dataset.teamName);if(t){t.name=input.value.slice(0,22)||'Team';broadcastState()}}
  });
  document.addEventListener('click',e=>{
    const cap=e.target.closest('[data-captain]');if(cap)return assignCaptain(cap.dataset.teamId,cap.dataset.captain);
    const score=e.target.closest('[data-score-team]');if(score){state.controlTeamId=score.dataset.scoreTeam;broadcastState();return}
    const tile=e.target.closest('[data-question-id]');if(tile)return selectQuestion(tile.dataset.questionId);
    const finalJudge=e.target.closest('[data-final-judge]');if(finalJudge)return judgeFinal(finalJudge.dataset.teamId,finalJudge.dataset.finalJudge==='correct');
  });
}
function setTeamCount(n){
  n=Math.max(2,Math.min(8,n));
  while(state.teams.length<n)state.teams.push(teamTemplate(state.teams.length));
  while(state.teams.length>n){
    const removed=state.teams.pop();state.players=state.players.filter(p=>p.teamId!==removed.id);
  }
  if(!team(state.controlTeamId))state.controlTeamId=state.teams[0].id;
  broadcastState();
}
function renderHost(){
  $('host-code').textContent='· '+state.code;$('big-code').textContent=state.code;
  $('team-count').textContent=state.teams.length;
  $('voice-toggle').checked=!!state.settings.aiVoice;$('sound-toggle').checked=!!state.settings.sounds;$('steal-toggle').checked=!!state.settings.autoSteal;
  $('captain-time').value=String(state.settings.captainPriorityMs);$('open-time').value=String(state.settings.teamOpenMs);
  $('pack-title').textContent=state.pack?.title||'Game Pack';
  $('team-editor').innerHTML=state.teams.map(t=>'<div class="team-edit"><span class="team-swatch" style="background:'+t.color+'"></span><input data-team-name="'+t.id+'" value="'+esc(t.name)+'"></div>').join('');
  const playing=state.phase!=='lobby';
  $('host-lobby').classList.toggle('hidden',playing);$('host-game').classList.toggle('hidden',!playing);
  renderHostLobby();if(playing)renderHostGame();
}
function renderHostLobby(){
  if(!state)return;
  $('player-count').textContent=state.players.length+' connected';
  $('lobby-teams').innerHTML=state.teams.map(t=>{
    const ps=state.players.filter(p=>p.teamId===t.id);
    return '<div class="lobby-team" style="--team:'+t.color+'"><div class="lobby-team-head"><h3>'+esc(t.name)+'</h3><span class="count-pill">'+ps.length+'</span></div><div class="player-list">'+
      (ps.length?ps.map(p=>'<div class="player-row"><span>'+esc(p.name)+'</span><span>'+(t.captainPlayerId===p.id?'<span class="captain-mark">Captain</span>':'<button class="mini-btn" data-team-id="'+t.id+'" data-captain="'+p.id+'">Make Captain</button>')+'</span></div>').join(''):'<div class="small-state">Waiting for players…</div>')+
      '</div></div>';
  }).join('');
}
function assignCaptain(teamId,playerId){
  const t=team(teamId);if(!t)return;t.captainPlayerId=playerId;broadcastState();
}
function hostJoin(msg){
  if(!msg.player?.id||!team(msg.player.teamId))return;
  const p={id:String(msg.player.id),name:String(msg.player.name||'Player').slice(0,24),teamId:msg.player.teamId,joinedAt:msg.at||now()};
  const i=state.players.findIndex(x=>x.id===p.id);if(i>=0)state.players[i]={...state.players[i],...p};else state.players.push(p);
  const t=team(p.teamId);if(t&&!t.captainPlayerId)t.captainPlayerId=p.id;
  broadcastState();
}
function startGame(){
  if(!state.players.length){$('generator-state').textContent='Players can still join after the game starts.'}
  state.phase='board';state.usedIds=[];state.activeQuestionId=null;state.result=null;state.lockedAnswer=null;state.suggestions={};
  state.teams.forEach(t=>{t.score=0;t.streak=0});
  state.controlTeamId=state.teams[0]?.id||null;broadcastState();
}
function renderScorebar(targetId,display=false){
  const el=$(targetId);if(!el)return;el.style.setProperty('--team-count',state.teams.length);
  el.innerHTML=state.teams.map(t=>display
    ?'<div class="display-team '+(state.controlTeamId===t.id?'control':'')+'" style="--team:'+t.color+'"><span class="team-name">'+esc(t.name)+'</span><span class="team-score">'+t.score+'</span></div>'
    :'<div class="host-score '+(state.controlTeamId===t.id?'control':'')+'" data-score-team="'+t.id+'" style="--team:'+t.color+'"><small>'+esc(t.name)+(t.captainPlayerId?' · captain set':'')+'</small><strong>'+t.score+'</strong></div>'
  ).join('');
}
function boardHtml(host=false){
  const cats=state.pack.categories||[],qs=state.pack.questions||[];
  const rows=[cats.map(c=>'<div class="'+(host?'host-cat':'game-category')+'">'+esc(c.label)+'</div>').join('')];
  const values=[100,200,300,400,500];
  for(const points of values){
    rows.push(cats.map(c=>{
      const q=qs.find(x=>x.category===c.id&&Number(x.points)===points),used=q&&state.usedIds.includes(q.id);
      if(host)return '<button class="host-tile '+(used?'used':'')+'" '+(q?'data-question-id="'+q.id+'"':'disabled')+'>'+ (q?points:'—') +'</button>';
      return '<div class="game-tile '+(used?'used':'')+'">'+(q&&!used?points:'')+'</div>';
    }).join(''));
  }
  return rows.join('');
}
function renderHostGame(){
  renderScorebar('host-scorebar');
  const board=$('host-board'),qbox=$('host-question');
  const boardPhase=state.phase==='board';
  board.classList.toggle('hidden',!boardPhase);qbox.classList.toggle('hidden',boardPhase);
  if(boardPhase){
    board.style.setProperty('--cat-count',state.pack.categories.length);
    board.innerHTML=boardHtml(true);
  }else renderHostQuestion();
  ['host-correct','host-wrong','host-steal','host-reveal','host-next','host-final'].forEach(id=>hide(id));
  if(state.phase==='locked'){show('host-reveal')}
  if(state.phase==='reveal'){show('host-correct');show('host-wrong');if(!state.steal?.teamId)show('host-steal')}
  if(state.phase==='result'){show('host-next');if(state.usedIds.length>=Math.min(15,state.pack.questions.length))show('host-final')}
  if(state.phase==='final_wager'){show('host-reveal');$('host-reveal').textContent='Open Final Question'}
  else if(state.phase==='final_reveal'){show('host-next');$('host-next').textContent='Reveal Winner'}
  else {$('host-reveal').textContent='Reveal Answer';$('host-next').textContent='Back to Board'}
}
function renderHostQuestion(){
  const q=state.phase.startsWith('final')?state.pack.final:question();
  if(!q){$('host-question').innerHTML='<div class="small-state">Waiting…</div>';return}
  const active=team(state.steal?.teamId||state.activeTeamId);
  const phaseLabel=state.phase.replaceAll('_',' ');
  let extra='';
  if(state.phase==='answering'){
    const entries=Object.values(state.suggestions||{});
    extra='<div class="suggestion-grid">'+(entries.length?entries.map(x=>'<div class="suggestion"><b>'+esc(x.name)+'</b>'+esc(x.answer)+'</div>').join(''):'<div class="small-state">Team suggestions will appear here.</div>')+'</div>';
  }
  if(state.lockedAnswer)extra+='<div class="locked-answer">'+esc(state.lockedAnswer)+'</div>';
  if(['reveal','result'].includes(state.phase))extra+='<div class="answer-key"><b>'+esc(q.correctAnswer)+'</b><div>'+esc(q.reference||'')+' · '+esc(q.explanation||'')+'</div></div>';
  if(state.phase==='final_wager')extra='<div class="suggestion-grid">'+state.teams.map(t=>'<div class="suggestion"><b>'+esc(t.name)+'</b>'+(state.finalWagers[t.id]!=null?'Wager: '+state.finalWagers[t.id]:'Waiting for captain…')+'</div>').join('')+'</div>';
  if(state.phase==='final_reveal')extra='<div class="answer-key"><b>'+esc(q.correctAnswer)+'</b><div>'+esc(q.reference||'')+'</div></div><div class="suggestion-grid">'+state.teams.map(t=>{
    const ans=state.finalAnswers[t.id]?.answer||'No answer',judged=state.finalJudged[t.id];
    return '<div class="suggestion"><b>'+esc(t.name)+' · '+(state.finalWagers[t.id]||0)+' pts</b><div>'+esc(ans)+'</div><div style="margin-top:8px">'+
      (judged?'<span class="captain-mark">'+esc(judged)+'</span>':'<button class="mini-btn" data-team-id="'+t.id+'" data-final-judge="correct">Correct</button> <button class="mini-btn" data-team-id="'+t.id+'" data-final-judge="wrong">Wrong</button>')+'</div></div>';
  }).join('')+'</div>';
  $('host-question').innerHTML='<div class="hq-meta"><span>'+esc(category(q.category)?.label||q.category||'Final')+'</span><span>'+esc(phaseLabel)+'</span><span>'+esc(active?.name||'All Teams')+'</span></div><h2>'+esc(q.prompt)+'</h2>'+extra;
}
function selectQuestion(id){
  if(state.phase!=='board'||state.usedIds.includes(id))return;
  const q=state.pack.questions.find(x=>x.id===id);if(!q)return;
  state.activeQuestionId=id;state.activeTeamId=state.controlTeamId||state.teams[0].id;
  if(!state.usedIds.includes(id))state.usedIds.push(id);
  state.lockedAnswer=state.lockedBy=state.lockedTeamId=null;state.suggestions={};state.result=null;state.steal={teamId:null,buzzUntil:null,captainUntil:null,answerUntil:null};
  state.phase='answering';state.captainUntil=now()+state.settings.captainPriorityMs;state.answerUntil=state.captainUntil+state.settings.teamOpenMs;
  broadcastState();
}
function hostAnswer(msg){
  if(!msg.playerId||!msg.teamId)return;
  const p=playerById(msg.playerId);if(!p||p.teamId!==msg.teamId)return;
  const tnow=now();
  if(state.phase==='answering'){
    if(msg.teamId!==state.activeTeamId||tnow>state.answerUntil||state.lockedAnswer)return;
    const captain=team(msg.teamId)?.captainPlayerId===msg.playerId;
    if(captain||tnow>state.captainUntil)return lockAnswer(msg);
    state.suggestions[msg.playerId]={name:p.name,answer:String(msg.answer||'').slice(0,120),at:msg.at||tnow};broadcastState();return;
  }
  if(state.phase==='steal_answer'){
    if(msg.teamId!==state.steal.teamId||tnow>state.steal.answerUntil||state.lockedAnswer)return;
    const captain=team(msg.teamId)?.captainPlayerId===msg.playerId;
    if(captain||tnow>state.steal.captainUntil)return lockAnswer(msg);
    state.suggestions[msg.playerId]={name:p.name,answer:String(msg.answer||'').slice(0,120),at:msg.at||tnow};broadcastState();
  }
}
function lockAnswer(msg){
  state.lockedAnswer=String(msg.answer||'').trim().slice(0,160)||'No answer';
  state.lockedBy=msg.playerId;state.lockedTeamId=msg.teamId;state.phase='locked';broadcastState();
}
function hostReveal(){
  if(state.phase==='locked'){state.phase='reveal';broadcastState();return}
  if(state.phase==='final_wager'){
    state.phase='final_answering';state.activeQuestionId=state.pack.final.id;state.captainUntil=now()+10000;state.answerUntil=now()+20000;state.finalAnswers={};broadcastState();return;
  }
}
function answerIsCorrect(q,answer){
  const a=normalize(answer);return (q.acceptedAnswers||[q.correctAnswer]).some(x=>normalize(x)===a);
}
function judge(correct){
  if(state.phase!=='reveal')return;
  if(correct){
    const tid=state.lockedTeamId||state.activeTeamId,t=team(tid);if(!t)return;
    const base=question()?.points||0,pts=state.steal?.teamId===tid?Math.max(10,Math.round((base*state.settings.stealMultiplier)/10)*10):base;
    t.score+=pts;t.streak=(t.streak||0)+1;state.controlTeamId=tid;
    state.result={correct:true,teamId:tid,points:pts,answer:state.lockedAnswer};
  }else{
    const t=team(state.lockedTeamId);if(t)t.streak=0;
    if(!state.steal?.teamId&&state.settings.autoSteal)return openSteal();
    finishWrong();
    return;
  }
  state.resultNonce++;state.phase='result';broadcastState();
}
function finishWrong(){
  state.result={correct:false,teamId:state.lockedTeamId||state.activeTeamId,points:0,answer:state.lockedAnswer||'No answer'};
  state.resultNonce++;state.phase='result';state.controlTeamId=nextTeamId(state.activeTeamId);broadcastState();
}
function nextTeamId(id){
  const i=Math.max(0,state.teams.findIndex(t=>t.id===id));return state.teams[(i+1)%state.teams.length]?.id;
}
function openSteal(){
  if(!question()?.stealAllowed&&question()?.stealAllowed!==undefined)return finishWrong();
  const eligible=state.teams.filter(t=>t.id!==state.activeTeamId);
  if(!eligible.length)return finishWrong();
  state.phase='steal_buzz';state.lockedAnswer=state.lockedBy=state.lockedTeamId=null;state.suggestions={};
  state.steal={teamId:null,buzzUntil:now()+state.settings.stealBuzzMs,captainUntil:null,answerUntil:null};broadcastState();
}
function hostBuzz(msg){
  if(state.phase!=='steal_buzz'||state.steal.teamId||now()>state.steal.buzzUntil)return;
  if(msg.teamId===state.activeTeamId||!team(msg.teamId)||!playerById(msg.playerId))return;
  state.steal.teamId=msg.teamId;state.phase='steal_answer';state.steal.captainUntil=now()+Math.min(3000,state.settings.stealAnswerMs/2);state.steal.answerUntil=now()+state.settings.stealAnswerMs;state.suggestions={};broadcastState();
}
function hostClockTick(){
  if(role!=='host'||!state)return;
  const t=now();
  if(state.phase==='answering'&&state.answerUntil&&t>state.answerUntil&&!state.lockedAnswer){
    state.lockedAnswer='No answer';state.lockedTeamId=state.activeTeamId;state.phase='reveal';broadcastState();
  }else if(state.phase==='steal_buzz'&&state.steal.buzzUntil&&t>state.steal.buzzUntil&&!state.steal.teamId){
    finishWrong();
  }else if(state.phase==='steal_answer'&&state.steal.answerUntil&&t>state.steal.answerUntil&&!state.lockedAnswer){
    state.lockedAnswer='No answer';state.lockedTeamId=state.steal.teamId;state.phase='reveal';broadcastState();
  }else if(state.phase==='final_answering'&&state.answerUntil&&t>state.answerUntil){
    state.phase='final_reveal';broadcastState();
  }
  if(role==='host'&&state.phase!=='lobby')renderHostGame();
}
function hostNext(){
  if(state.phase==='result'){
    state.phase='board';state.activeQuestionId=null;state.lockedAnswer=state.lockedBy=state.lockedTeamId=null;state.result=null;state.suggestions={};state.steal={teamId:null,buzzUntil:null,captainUntil:null,answerUntil:null};broadcastState();return;
  }
  if(state.phase==='final_reveal'){
    const sorted=[...state.teams].sort((a,b)=>b.score-a.score);state.winnerTeamId=sorted[0]?.id||null;state.phase='winner';broadcastState();
  }
}
function startFinal(){
  state.phase='final_wager';state.finalWagers={};state.finalAnswers={};state.finalJudged={};state.result=null;state.activeQuestionId=state.pack.final.id;broadcastState();
}
function hostFinalWager(msg){
  if(state.phase!=='final_wager')return;
  const t=team(msg.teamId),p=playerById(msg.playerId);if(!t||!p||t.captainPlayerId!==p.id)return;
  const max=Math.max(0,t.score),value=Math.max(0,Math.min(max,Math.floor(Number(msg.wager)||0)));state.finalWagers[t.id]=value;broadcastState();
}
function hostFinalAnswer(msg){
  if(state.phase!=='final_answering'||now()>state.answerUntil)return;
  const t=team(msg.teamId),p=playerById(msg.playerId);if(!t||!p)return;
  const captain=t.captainPlayerId===p.id;if(!captain&&now()<state.captainUntil)return;
  if(!state.finalAnswers[t.id]){state.finalAnswers[t.id]={answer:String(msg.answer||'').slice(0,160),playerId:p.id,name:p.name,at:msg.at||now()};broadcastState()}
}
function judgeFinal(teamId,correct){
  if(state.phase!=='final_reveal'||state.finalJudged[teamId])return;
  const t=team(teamId);if(!t)return;const wager=Number(state.finalWagers[teamId]||0);t.score+=correct?wager:-wager;state.finalJudged[teamId]=correct?'Correct':'Wrong';broadcastState();
}
function endGame(){
  const sorted=[...state.teams].sort((a,b)=>b.score-a.score);state.winnerTeamId=sorted[0]?.id||null;state.phase='winner';broadcastState();
}
async function generatePack(){
  const b=$('generate-pack');b.disabled=true;$('generator-state').textContent='Generating and validating a new game pack…';
  try{
    const r=await fetch('/api/game-generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({difficulty:$('difficulty').value,count:30})});
    const d=await r.json().catch(()=>({}));if(!r.ok||!d.pack)throw new Error(d.error||'Question generator unavailable');
    state.pack=d.pack;state.usedIds=[];$('generator-state').textContent='AI pack ready. Review before live use.';broadcastState();
  }catch(e){$('generator-state').textContent=(e.message||'Generator unavailable')+' Built-in pack kept.'}
  finally{b.disabled=false}
}

function initDisplay(){
  show('display');
  const code=codeFromUrl();
  if(!code){$('display-stage').innerHTML='<div class="display-question"><div class="question-category">DISPLAY SETUP</div><h1>Open this display from the host console.</h1></div>';return}
  $('display-code').textContent='GAME '+code;state=newState(code);state.phase='waiting';connect(code);renderDisplay();
  $('arm-audio').onclick=()=>{armAudio();$('arm-audio').classList.add('armed')};
  setInterval(renderDisplay,100);
}
function renderDisplay(){
  if(!state)return;
  renderScorebar('display-scorebar',true);
  $('display-code').textContent='GAME '+state.code;
  $('voice-disclosure').classList.toggle('hidden',!state.settings?.aiVoice);
  const stage=$('display-stage');
  const q=state.phase.startsWith('final')?state.pack?.final:question();
  if(state.phase==='waiting'||state.phase==='lobby'){
    stage.innerHTML='<div class="display-question"><div class="question-category">JOIN THE GAME</div><h1>'+esc(state.code)+'</h1><div class="reveal-explain">'+esc(joinUrl(state.code).replace(/^https?:\/\//,''))+'</div></div>';
  }else if(state.phase==='board'){
    stage.innerHTML='<div class="game-board" style="--cat-count:'+state.pack.categories.length+'">'+boardHtml(false)+'</div>';
  }else if(state.phase==='answering'||state.phase==='steal_answer'||state.phase==='final_answering'){
    stage.innerHTML=displayQuestionHtml(q);
  }else if(state.phase==='locked'){
    const t=team(state.lockedTeamId);
    stage.innerHTML='<div class="display-question"><div class="answer-lock">'+esc(t?.name||'Team')+' locked an answer</div><div class="answer-big">'+esc(state.lockedAnswer)+'</div></div>';
  }else if(state.phase==='reveal'){
    stage.innerHTML='<div class="display-question"><div class="question-category">CORRECT ANSWER</div><div class="answer-big">'+esc(q?.correctAnswer||'')+'</div><div class="reveal-ref">'+esc(q?.reference||'')+'</div><div class="reveal-explain">'+esc(q?.explanation||'')+'</div></div>';
  }else if(state.phase==='steal_buzz'){
    stage.innerHTML='<div class="display-question"><div class="question-category">ANY OTHER TEAM</div><div class="steal-call">STEAL!</div><div class="timer-ring" data-deadline="'+state.steal.buzzUntil+'"><strong>'+secondsLeft(state.steal.buzzUntil)+'</strong></div></div>';
  }else if(state.phase==='result'){
    const t=team(state.result?.teamId),ok=state.result?.correct;
    stage.innerHTML='<div class="display-question" style="--team:'+(t?.color||'#35d6ff')+'"><div class="result-word '+(ok?'correct':'wrong')+'">'+(ok?'CORRECT':'MISSED')+'</div><div class="question-category">'+esc(t?.name||'')+(ok?' · +'+state.result.points:'')+'</div></div>';
  }else if(state.phase==='final_wager'){
    stage.innerHTML='<div class="display-question"><div class="question-category">FINAL SHOWDOWN</div><h1>'+esc(state.pack.final.category||'Final Round')+'</h1><div class="reveal-explain">Captains, lock your wagers.</div></div>';
  }else if(state.phase==='final_reveal'){
    stage.innerHTML='<div class="display-question"><div class="question-category">FINAL ANSWER</div><div class="answer-big">'+esc(state.pack.final.correctAnswer)+'</div><div class="reveal-ref">'+esc(state.pack.final.reference||'')+'</div></div>';
  }else if(state.phase==='winner'){
    const t=team(state.winnerTeamId)||[...state.teams].sort((a,b)=>b.score-a.score)[0];
    stage.innerHTML='<div class="display-question" style="--team:'+(t?.color||'#35d6ff')+'"><div class="question-category">BIBLE SHOWDOWN CHAMPIONS</div><div class="winner-name">'+esc(t?.name||'')+'</div><div class="winner-score">'+(t?.score||0)+' POINTS</div></div>';
  }
  updateTimers();
  displayEffects();
}
function displayQuestionHtml(q){
  if(!q)return '';
  const deadline=state.phase==='steal_answer'?state.steal.answerUntil:state.answerUntil;
  const captainUntil=state.phase==='steal_answer'?state.steal.captainUntil:state.captainUntil;
  const open=now()>captainUntil;
  const active=team(state.phase==='steal_answer'?state.steal.teamId:state.activeTeamId);
  const choices=(q.choices||[]).length?'<div class="choice-grid">'+q.choices.map((x,i)=>'<div class="display-choice"><b>'+String.fromCharCode(65+i)+'</b>'+esc(x)+'</div>').join('')+'</div>':'';
  return '<div class="display-question"><div class="question-category">'+esc(category(q.category)?.label||q.category||'Final')+' <span class="question-points">'+(q.points||'FINAL')+'</span></div><h1>'+esc(q.prompt)+'</h1>'+choices+'<div class="phase-tag '+(open?'open':'')+'">'+esc(active?.name||'All Teams')+' · '+(open?'TEAM OPEN':'CAPTAIN PRIORITY')+'</div><div class="timer-ring" data-deadline="'+deadline+'"><strong>'+secondsLeft(deadline)+'</strong></div></div>';
}
function secondsLeft(deadline){return Math.max(0,Math.ceil(((deadline||now())-now())/1000))}
function updateTimers(){document.querySelectorAll('[data-deadline]').forEach(el=>{const d=Number(el.dataset.deadline)||now(),left=Math.max(0,d-now()),total=state.phase==='steal_buzz'?state.settings.stealBuzzMs:(state.phase==='steal_answer'?state.settings.stealAnswerMs:(state.phase==='final_answering'?20000:state.settings.captainPriorityMs+state.settings.teamOpenMs));el.style.setProperty('--progress',String(Math.max(0,Math.min(1,left/total))));const strong=el.querySelector('strong');if(strong)strong.textContent=Math.ceil(left/1000)})}
function displayEffects(){
  if(lastDisplayPhase!==state.phase){
    const previous=lastDisplayPhase;lastDisplayPhase=state.phase;
    if(state.settings?.sounds&&audioArmed){
      if(state.phase==='answering')playSfx('question');
      if(state.phase==='locked')playSfx('lock');
      if(state.phase==='steal_buzz')playSfx('steal');
      if(state.phase==='winner')playSfx('winner');
    }
    if(state.phase==='answering'&&state.settings?.aiVoice)voiceQuestion(question());
  }
  if(state.phase==='result'&&state.resultNonce!==lastCelebrationNonce){
    lastCelebrationNonce=state.resultNonce;
    if(state.result?.correct){confetti(team(state.result.teamId)?.color||'#35d6ff');if(state.settings?.sounds&&audioArmed)playSfx('correct')}
    else if(state.settings?.sounds&&audioArmed)playSfx('wrong');
  }
}
function armAudio(){
  try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume();audioArmed=true;playSfx('arm')}catch(e){}
}
function tone(freq,start,duration,gain=.08,type='sine'){
  if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,audioCtx.currentTime+start);g.gain.linearRampToValueAtTime(gain,audioCtx.currentTime+start+.01);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+start+duration);o.connect(g);g.connect(audioCtx.destination);o.start(audioCtx.currentTime+start);o.stop(audioCtx.currentTime+start+duration+.03)
}
function playSfx(name){
  if(!audioCtx)return;
  if(name==='arm'){tone(440,0,.08,.04);tone(660,.07,.12,.04)}
  if(name==='question'){tone(220,0,.11,.05,'sawtooth');tone(440,.08,.16,.06,'sawtooth')}
  if(name==='lock'){tone(180,0,.12,.07,'square');tone(120,.12,.16,.05,'square')}
  if(name==='correct'){[523,659,784,1047].forEach((f,i)=>tone(f,i*.07,.22,.07,'triangle'))}
  if(name==='wrong'){tone(170,0,.28,.08,'sawtooth');tone(110,.12,.34,.07,'sawtooth')}
  if(name==='steal'){tone(880,0,.08,.06);tone(660,.09,.08,.06);tone(990,.18,.18,.07)}
  if(name==='winner'){[392,523,659,784,1047].forEach((f,i)=>tone(f,i*.11,.32,.07,'triangle'))}
}
function confetti(color){
  const layer=$('fx-layer');if(!layer)return;
  for(let i=0;i<72;i++){const p=document.createElement('i');p.className='particle';p.style.setProperty('--p',i%3===0?'#fff':i%3===1?color:'#ffcc57');p.style.setProperty('--x0',(window.innerWidth/2)+'px');p.style.setProperty('--y0',(window.innerHeight*.52)+'px');p.style.setProperty('--x1',(Math.random()*window.innerWidth)+'px');p.style.setProperty('--y1',(Math.random()*window.innerHeight)+'px');layer.appendChild(p);setTimeout(()=>p.remove(),1600)}
}
async function voiceQuestion(q){
  if(!q||lastQuestionSpoken===q.id)return;lastQuestionSpoken=q.id;
  try{
    const r=await fetch('/api/game-voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:(category(q.category)?.label||q.category||'Question')+'. For '+(q.points||'final')+' points. '+q.prompt})});
    if(!r.ok)return;const blob=await r.blob(),url=URL.createObjectURL(blob),a=new Audio(url);a.onended=()=>URL.revokeObjectURL(url);await a.play();
  }catch(e){}
}

function initPlayer(){
  show('player');
  const code=codeFromUrl();if(code){$('join-code-input').value=code;connectPlayerCode(code)}
  $('connect-game').onclick=()=>connectPlayerCode($('join-code-input').value);
  $('join-team').onclick=finishJoin;
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-pick-team]');if(t){selectedTeamId=t.dataset.pickTeam;renderTeamPicker()}
    const ans=e.target.closest('[data-answer]');if(ans){submitPlayerAnswer(ans.dataset.answer);return}
    const buzz=e.target.closest('#steal-buzz-button');if(buzz&&player)send({kind:'BUZZ',playerId:player.id,teamId:player.teamId});
    const wager=e.target.closest('#submit-wager');if(wager)return submitWager();
    const final=e.target.closest('#submit-final-answer');if(final)return submitFinalAnswer();
  });
}
async function connectPlayerCode(raw){
  const code=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
  if(code.length<4){$('join-error').textContent='Enter the game code.';return}
  state=newState(code);state.phase='waiting';player=loadPlayer(code);$('player-game-code').textContent=code;
  const ok=await connect(code);if(!ok){$('join-error').textContent='Could not connect to the game network.';return}
  $('join-error').textContent='Connected. Waiting for host…';hide('join-step');
  if(player?.name&&player?.teamId){show('player-game');send({kind:'JOIN',player});channel.track({kind:'player',code,playerId:player.id,name:player.name,teamId:player.teamId});}
  else show('profile-step');
}
function renderTeamPicker(){
  if(!state)return;$('team-picker').innerHTML=state.teams.map(t=>'<button class="pick-team '+(selectedTeamId===t.id?'selected':'')+'" style="--team:'+t.color+'" data-pick-team="'+t.id+'">'+esc(t.name)+'</button>').join('');$('join-team').disabled=!selectedTeamId||!$('player-name').value.trim();
}
function finishJoin(){
  const name=$('player-name').value.trim().slice(0,24);if(!name||!selectedTeamId)return;
  player={id:player?.id||randomId('player'),name,teamId:selectedTeamId};savePlayer();hide('profile-step');show('player-game');
  send({kind:'JOIN',player});channel?.track({kind:'player',code:state.code,playerId:player.id,name:player.name,teamId:player.teamId});renderPlayer();
}
function renderPlayer(){
  if(!state)return;
  if(!player){if(!$('profile-step').classList.contains('hidden'))renderTeamPicker();return}
  const t=team(player.teamId);if(!t)return;
  $('player-team-banner').style.setProperty('--team',t.color);$('player-team-banner').innerHTML='<b>'+esc(t.name)+(isCaptain()?' · CAPTAIN':'')+'</b><strong>'+t.score+'</strong>';
  const host=$('player-content'),q=state.phase.startsWith('final')?state.pack.final:question();
  if(state.phase==='lobby'||state.phase==='waiting'){host.innerHTML='<div class="waiting"><strong>YOU’RE IN</strong>Waiting for the host to start.</div>';return}
  if(state.phase==='board'){host.innerHTML='<div class="waiting"><strong>BOARD LIVE</strong>'+esc(team(state.controlTeamId)?.name||'A team')+' controls the board.</div>';return}
  if(state.phase==='answering')return renderPlayerAnswer(host,q,state.activeTeamId,state.captainUntil,state.answerUntil,false);
  if(state.phase==='locked'){host.innerHTML='<div class="player-card"><div class="player-phase">ANSWER LOCKED</div><h2>'+esc(team(state.lockedTeamId)?.name||'Team')+'</h2><div class="question">'+esc(state.lockedAnswer)+'</div><div class="small-state">Waiting for the reveal…</div></div>';return}
  if(state.phase==='reveal'){host.innerHTML='<div class="player-card"><div class="player-phase">CORRECT ANSWER</div><h2>'+esc(q.correctAnswer)+'</h2><div class="small-state">'+esc(q.reference||'')+' · '+esc(q.explanation||'')+'</div></div>';return}
  if(state.phase==='steal_buzz'){
    if(player.teamId===state.activeTeamId)host.innerHTML='<div class="waiting"><strong>STEAL OPEN</strong>Other teams can steal.</div>';
    else host.innerHTML='<div class="player-card"><div class="player-phase">STEAL WINDOW</div><button id="steal-buzz-button" class="buzz-button">BUZZ</button><div class="player-timer">'+secondsLeft(state.steal.buzzUntil)+'</div></div>';
    return;
  }
  if(state.phase==='steal_answer')return renderPlayerAnswer(host,q,state.steal.teamId,state.steal.captainUntil,state.steal.answerUntil,true);
  if(state.phase==='result'){
    host.innerHTML='<div class="waiting"><strong>'+(state.result.correct?'SCORE!':'ROUND OVER')+'</strong>'+esc(team(state.result.teamId)?.name||'')+(state.result.correct?' earned '+state.result.points+' points.':'')+'</div>';
    celebratePlayer();return;
  }
  if(state.phase==='final_wager'){
    if(isCaptain())host.innerHTML='<div class="player-card"><div class="player-phase">FINAL WAGER</div><h2>'+esc(state.pack.final.category)+'</h2><div class="small-state">You have '+t.score+' points.</div><input id="wager-input" class="answer-input" type="number" min="0" max="'+Math.max(0,t.score)+'" value="'+Math.min(500,Math.max(0,t.score))+'"><button id="submit-wager" class="game-btn primary full">Lock Wager</button></div>';
    else host.innerHTML='<div class="waiting"><strong>FINAL WAGER</strong>Your captain is choosing the wager.</div>';
    return;
  }
  if(state.phase==='final_answering')return renderFinalAnswer(host,q);
  if(state.phase==='final_reveal'){host.innerHTML='<div class="player-card"><div class="player-phase">FINAL ANSWER</div><h2>'+esc(q.correctAnswer)+'</h2><div class="small-state">'+esc(q.reference||'')+'</div></div>';return}
  if(state.phase==='winner'){
    const w=team(state.winnerTeamId);host.innerHTML='<div class="waiting"><strong>'+esc(w?.name||'WINNER')+'</strong>'+((w?.id===player.teamId)?'You won Bible Showdown!':'Final score: '+t.score)+'</div>';celebratePlayer(true);
  }
}
function renderPlayerAnswer(host,q,activeTeamId,captainUntil,deadline,isSteal){
  if(player.teamId!==activeTeamId){host.innerHTML='<div class="waiting"><strong>'+esc(team(activeTeamId)?.name||'Team')+'</strong>'+(isSteal?'attempting the steal.':'is answering.')+'</div>';return}
  const open=now()>captainUntil,cap=isCaptain();
  const canFinal=cap||open;
  const submitted=state.suggestions?.[player.id];
  let controls='';
  if((q.choices||[]).length){
    controls='<div class="phone-choices">'+q.choices.map((x,i)=>'<button class="phone-choice '+(submitted?.answer===x?'selected':'')+'" data-answer="'+esc(x)+'"><b>'+String.fromCharCode(65+i)+'</b>'+esc(x)+'</button>').join('')+'</div>';
  }else{
    controls='<input id="typed-answer" class="answer-input" maxlength="120" placeholder="Type answer"><button class="game-btn primary full" id="typed-send"> '+(canFinal?'LOCK ANSWER':'SEND TO CAPTAIN')+' </button>';
    setTimeout(()=>{const b=$('typed-send');if(b)b.onclick=()=>submitPlayerAnswer($('typed-answer').value)},0);
  }
  const suggestionHtml=cap?captainSuggestions():'';
  host.innerHTML='<div class="player-card"><div class="player-phase">'+(isSteal?'STEAL ATTEMPT · ':'')+(open?'TEAM OPEN':'CAPTAIN PRIORITY')+'</div><div class="player-timer">'+secondsLeft(deadline)+'</div><div class="question">'+esc(q.prompt)+'</div>'+controls+'<div class="small-state">'+(canFinal?'Your answer will lock for the team.':'Send your suggestion. Your captain can lock the final answer.')+'</div>'+suggestionHtml+'</div>';
}
function captainSuggestions(){
  const values=Object.values(state.suggestions||{});if(!values.length)return '<div class="suggestions-box"><div class="small-state">No team suggestions yet.</div></div>';
  const counts={};values.forEach(x=>counts[x.answer]=(counts[x.answer]||0)+1);
  return '<div class="suggestions-box"><div class="panel-label">Team Suggestions</div>'+Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([a,n])=>'<div class="suggestion-count"><span>'+esc(a)+'</span><strong>'+n+'</strong></div>').join('')+'</div>';
}
function submitPlayerAnswer(answer){
  answer=String(answer||'').trim();if(!answer||!player)return;
  send({kind:'ANSWER',playerId:player.id,teamId:player.teamId,answer});if(navigator.vibrate)navigator.vibrate(18);
}
function submitWager(){
  const wager=Number($('wager-input')?.value||0);send({kind:'FINAL_WAGER',playerId:player.id,teamId:player.teamId,wager});if(navigator.vibrate)navigator.vibrate([20,40,20]);
}
function renderFinalAnswer(host,q){
  const cap=isCaptain(),open=now()>state.captainUntil,can=cap||open,existing=state.finalAnswers[player.teamId];
  if(existing){host.innerHTML='<div class="waiting"><strong>FINAL LOCKED</strong>'+esc(existing.answer)+'</div>';return}
  host.innerHTML='<div class="player-card"><div class="player-phase">FINAL SHOWDOWN · '+(open?'TEAM OPEN':'CAPTAIN PRIORITY')+'</div><div class="player-timer">'+secondsLeft(state.answerUntil)+'</div><div class="question">'+esc(q.prompt)+'</div><input id="final-answer-input" class="answer-input" maxlength="120" placeholder="Final answer"><button id="submit-final-answer" class="game-btn primary full" '+(can?'':'disabled')+'>'+(can?'LOCK FINAL ANSWER':'CAPTAIN DECIDES')+'</button></div>';
}
function submitFinalAnswer(){const a=$('final-answer-input')?.value.trim();if(a)send({kind:'FINAL_ANSWER',playerId:player.id,teamId:player.teamId,answer:a})}
function celebratePlayer(force=false){
  if(!state.result&&!force)return;if(!force&&state.resultNonce===lastCelebrationNonce)return;lastCelebrationNonce=force?lastCelebrationNonce:state.resultNonce;
  const t=team(player.teamId),won=force?(state.winnerTeamId===player.teamId):(state.result?.correct&&state.result.teamId===player.teamId);
  if(!won)return;
  const box=$('player-celebration');box.style.setProperty('--team',t.color);box.innerHTML='<div><div class="celeb-word">'+(force?'CHAMPIONS!':'CORRECT!')+'</div><div class="celeb-points">'+(force?t.score+' PTS':'+'+state.result.points)+'</div></div>';box.classList.remove('hidden');if(navigator.vibrate)navigator.vibrate([60,40,80,40,120]);setTimeout(()=>box.classList.add('hidden'),1800);
}

setInterval(()=>{if(role==='player'&&player)renderPlayer()},250);

if(role==='landing')initLanding();
if(role==='host')initHost();
if(role==='display')initDisplay();
if(role==='player'){
  initPlayer();
  $('player-name')?.addEventListener('input',renderTeamPicker);
}
})();