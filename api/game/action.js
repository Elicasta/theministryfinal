import {authenticatedPlayer} from '../../lib/game-player-session.js';
import {
  clean, db, verifyHost, verifyPlayer, getGameByCode, getGamePlayers,
  getQuestionSubmissions, saveGameState, recordGameEvent, broadcastGame,
  publicGameState, corsNoStore
} from '../../lib/game-db.js';

import { advanceClock } from '../../lib/game-clock.js';

const nowMs=()=>Date.now();
const qById=(row,id)=>(Array.isArray(row.question_pack?.questions)?row.question_pack.questions:[]).find(q=>q.id===id)||null;
const activeQuestion=row=>qById(row,row.state?.activeQuestionId);
const responseStatus=phase=>phase==='ended'?'ended':phase||'lobby';
const normalizeAnswer=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
function answerMatches(q,answer){
  const got=normalizeAnswer(answer);
  if(!got)return false;
  const accepted=[q?.correctAnswer,...(Array.isArray(q?.acceptedAnswers)?q.acceptedAnswers:[])].filter(Boolean).map(normalizeAnswer);
  return accepted.includes(got);
}
function applyJudgement(state,q,teamId,answer,isSteal,correct){
  const points=correct?Math.max(0,Math.round(Number(q?.points||0)*(isSteal?.6:1))):0;
  state.teams=(state.teams||[]).map(t=>{if(t.id!==teamId)return t;const streak=correct?(Number(t.streak)||0)+1:0;return {...t,score:(Number(t.score)||0)+points,streak,bestStreak:Math.max(Number(t.bestStreak)||0,Number(t.streak)||0,streak)}});
  state.lastResult={correct,isSteal,teamId,points,answer,correctAnswer:q?.correctAnswer||'',reference:q?.reference||'',explanation:q?.explanation||'',nonce:nowMs()};
  state.phase='result';
  state.resultDeadline=nowMs()+2200;
  state.resultNextPhase=(!correct&&!isSteal&&q?.stealAllowed!==false&&state.settings?.autoSteal!==false&&(state.teams||[]).length>1)?'steal_buzz':'board';
  return state;
}

async function hydrate(row,role,player){
  const players=await getGamePlayers(row.id);
  let submissions=[];
  if(row.state?.activeQuestionId && (role==='host'||role==='player')){
    const all=await getQuestionSubmissions(row.id,row.state.activeQuestionId);
    submissions=role==='host'?all:all.filter(x=>x.team_id===player?.team_id);
  }
  return publicGameState(row,players,role,submissions,player?.team_id||null);
}
async function commit(row,state,kind,meta={}){
  state.activity=[{kind,teamId:meta.teamId||null,points:meta.payload?.points||0,at:new Date().toISOString()},...(state.activity||[])].slice(0,12);
  const saved=await saveGameState(row,{...state,updatedAt:new Date().toISOString()},responseStatus(state.phase));
  if(!saved.row)return {conflict:true};
  await recordGameEvent(saved.row,kind,meta);
  broadcastGame(saved.row.game_code,'state',{version:saved.row.version,reason:kind}).catch(()=>{});
  return {row:saved.row};
}
function clearRound(state){
  return {
    ...state,questionTeamId:null,timerPausedAt:null,activeQuestionId:null,questionOpenedAt:null,captainDeadline:null,teamDeadline:null,
    lockedAnswer:null,lockedBy:null,lockedTeamId:null,stealTeamId:null,stealBuzzDeadline:null,
    stealCaptainDeadline:null,stealDeadline:null,lastResult:null,resultDeadline:null,resultNextPhase:null
  };
}
function winnerIds(state){
  const teams=[...(state.teams||[])];
  const top=Math.max(...teams.map(t=>Number(t.score)||0),0);
  return teams.filter(t=>(Number(t.score)||0)===top).map(t=>t.id);
}

export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const body=req.body||{},code=clean(body.code,12).toUpperCase(),action=clean(body.action,50).toUpperCase();
  if(!code||!action)return res.status(400).json({error:'Game code and action are required'});

  let loaded=await getGameByCode(code),row=loaded.row;
  if(!loaded.request.ok||!row)return res.status(404).json({error:'Game not found'});
  row=await advanceClock(row);
  let state=row.state||{},role='public',player=null;

  const auth=body.hostToken?null:await authenticatedPlayer(req,body,code);
  if(body.hostToken&&await verifyHost(code,body.hostToken))role='host';
  else if(auth){
    role='player';
    const players=await getGamePlayers(row.id);
    player=players.find(p=>p.player_id===auth.playerId)||null;
    if(player)player.is_captain=state.teams?.find(t=>t.id===player.team_id)?.captainPlayerId===player.player_id;
    if(!player)return res.status(401).json({error:'Player session expired'});
  } else return res.status(401).json({error:'Invalid game credentials'});

  const hostOnly=new Set(['PAUSE','RESUME','RESET_TIMER','ADJUST_SCORE','SETUP','SET_AUTO_TURN','SET_CAPTAIN','SET_CONTROL_TEAM','START','TICK','JUDGE','OPEN_STEAL','REVEAL','NEXT','START_FINAL','OPEN_FINAL','FINAL_JUDGE','END']);
  const playerOnly=new Set(['ANSWER','BUZZ','FINAL_WAGER','FINAL_ANSWER','HEARTBEAT']);
  if(hostOnly.has(action)&&role!=='host')return res.status(403).json({error:'Host action required'});
  if(playerOnly.has(action)&&role!=='player')return res.status(403).json({error:'Player action required'});

  if(['ended','winner'].includes(state.phase)&&!['HEARTBEAT','END'].includes(action))return res.status(409).json({error:'This game is complete. Create a new game to play again.'});
  if(state.timerPausedAt&&['ANSWER','BUZZ'].includes(action))return res.status(409).json({error:'The host has paused the round.'});
  if(['PAUSE','RESUME','RESET_TIMER'].includes(action)){
    if(!['captain','open','steal_buzz','steal_captain','steal_open'].includes(state.phase))return res.status(409).json({error:'No active timer'});
    const t=nowMs(),keys=['captainDeadline','teamDeadline','stealBuzzDeadline','stealCaptainDeadline','stealDeadline'];
    if(action==='PAUSE'&&!state.timerPausedAt)state.timerPausedAt=t;
    if(action==='RESUME'&&state.timerPausedAt){for(const k of keys)if(state[k])state[k]+=t-state.timerPausedAt;state.timerPausedAt=null}
    if(action==='RESET_TIMER'){
      const key={captain:'captainDeadline',open:'teamDeadline',steal_buzz:'stealBuzzDeadline',steal_captain:'stealCaptainDeadline',steal_open:'stealDeadline'}[state.phase];
      const duration=state.phase==='captain'?state.settings.captainMs:state.phase==='open'?state.settings.openMs:state.settings.stealMs;
      const delta=t+duration-state[key];for(const k of keys)if(state[k])state[k]+=delta;state.timerPausedAt=null;
    }
    const c=await commit(row,state,'TIMER_'+action,{actorType:'host'});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'host'));
  }
  if(action==='ADJUST_SCORE'){
    const delta=Number(body.delta),target=state.teams.find(t=>t.id===body.teamId);
    if(!target||!Number.isInteger(delta)||Math.abs(delta)>5000)return res.status(400).json({error:'Invalid score adjustment'});
    target.score=Math.max(0,target.score+delta);
    const c=await commit(row,state,'SCORE_ADJUSTED',{actorType:'host',teamId:target.id,payload:{points:delta}});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'host'));
  }
  if(action==='SETUP'){
    if(state.phase!=='lobby')return res.status(409).json({error:'Setup is locked after the game starts'});
    const incoming=Array.isArray(body.teams)?body.teams:[];
    const count=Math.max(2,Math.min(Number(body.teamCount)||incoming.length||state.teams?.length||2,12));
    const palette=['#35d6ff','#ff5d70','#46e7a4','#ffcc57','#aa6cff','#ff8f3d','#4f7dff','#ff71ce','#7ee787','#f7a8ff','#8ad5ff','#f2cc60'];
    const old=Array.isArray(state.teams)?state.teams:[];
    const nextTeams=Array.from({length:count},(_,i)=>({
      id:clean(incoming[i]?.id||old[i]?.id||('team-'+(i+1)),40),
      name:clean(incoming[i]?.name||old[i]?.name||('Team '+(i+1)),40),
      color:clean(incoming[i]?.color||old[i]?.color||palette[i%palette.length],20),
      score:Number(old[i]?.score)||0,streak:Number(old[i]?.streak)||0,bestStreak:Number(old[i]?.bestStreak)||0,captainPlayerId:old[i]?.captainPlayerId||null
    }));
    const keptIds=new Set(nextTeams.map(t=>t.id)),removed=old.filter(t=>!keptIds.has(t.id));
    if(removed.length){
      const players=await getGamePlayers(row.id);
      const occupied=removed.find(t=>players.some(p=>p.team_id===t.id));
      if(occupied)return res.status(409).json({error:occupied.name+' still has players. Move them before removing that team.'});
    }
    state.teams=nextTeams;
    state.controlTeamId=state.teams.some(t=>t.id===state.controlTeamId)?state.controlTeamId:state.teams[0].id;
    state.settings={
      captainMs:Math.max(3000,Math.min(Number(body.settings?.captainMs??state.settings?.captainMs)||30000,60000)),
      openMs:Math.max(2000,Math.min(Number(body.settings?.openMs??state.settings?.openMs)||5000,12000)),
      stealMs:Math.max(2000,Math.min(Number(body.settings?.stealMs??state.settings?.stealMs)||5000,10000)),
      autoTurn:body.settings?.autoTurn??state.settings?.autoTurn??true,
      autoSteal:body.settings?.autoSteal??state.settings?.autoSteal??true,
      sound:body.settings?.sound??state.settings?.sound??true,
      voice:body.settings?.voice??state.settings?.voice??false,
      manualJudging:body.settings?.manualJudging??state.settings?.manualJudging??true
    };
    const c=await commit(row,state,'SETUP_UPDATED',{actorType:'host'});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,role,player));
  }

  if(action==='SET_AUTO_TURN'){
    if(typeof body.enabled!=='boolean')return res.status(400).json({error:'Choose on or off'});
    state.settings={...state.settings,autoTurn:body.enabled};
    const c=await commit(row,state,'AUTO_TURN_CHANGED',{actorType:'host'});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'host'));
  }

  if(action==='SET_CAPTAIN'){
    if(!['lobby','board'].includes(state.phase))return res.status(409).json({error:'Change captains in the lobby or between questions.'});
    const teamId=clean(body.teamId,40),targetPlayerId=clean(body.targetPlayerId,80);
    const players=await getGamePlayers(row.id),target=players.find(p=>p.player_id===targetPlayerId&&p.team_id===teamId);
    if(!target)return res.status(400).json({error:'Player is not on that team'});
    await db('game_players?game_id=eq.'+row.id+'&team_id=eq.'+encodeURIComponent(teamId),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_captain:false})});
    await db('game_players?game_id=eq.'+row.id+'&player_id=eq.'+encodeURIComponent(targetPlayerId),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_captain:true})});
    state.teams=(state.teams||[]).map(t=>t.id===teamId?{...t,captainPlayerId:targetPlayerId}:t);
    const c=await commit(row,state,'CAPTAIN_CHANGED',{actorType:'host',playerId:targetPlayerId,teamId});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'host'));
  }

  if(action==='SET_CONTROL_TEAM'){
    if(!['lobby','board'].includes(state.phase))return res.status(409).json({error:'Change the active team between questions'});
    const teamId=clean(body.teamId,40);
    if(!(state.teams||[]).some(t=>t.id===teamId))return res.status(400).json({error:'Team not found'});
    state.controlTeamId=teamId;
    const c=await commit(row,state,'CONTROL_TEAM_CHANGED',{actorType:'host',teamId});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'host'));
  }

  if(action==='START'){
    if(state.phase!=='lobby')return res.status(409).json({error:'Game has already started'});
    state=clearRound(state);state.phase='board';state.usedQuestionIds=[];state.winnerTeamIds=[];state.finalWagers={};state.finalAnswers={};state.finalJudged={};
    state.teams=(state.teams||[]).map(t=>({...t,score:0,streak:0,bestStreak:0}));
    const players=await getGamePlayers(row.id),captained=state.teams.find(t=>players.some(p=>p.team_id===t.id&&p.is_captain));
    if(captained&&!players.some(p=>p.team_id===state.controlTeamId&&p.is_captain))state.controlTeamId=captained.id;
    const c=await commit(row,state,'GAME_STARTED',{actorType:'host',teamId:state.controlTeamId});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'host'));
  }

  if(action==='OPEN_QUESTION'){
    if(role==='player'&&(!player?.is_captain||player.team_id!==state.controlTeamId))return res.status(403).json({error:'Only the captain of the team in control can choose the board question'});
    if(role!=='host'&&role!=='player')return res.status(403).json({error:'Question selection not allowed'});
    if(state.phase!=='board')return res.status(409).json({error:'Return to the board first'});
    const questionId=clean(body.questionId,120),q=qById(row,questionId);
    if(!q)return res.status(404).json({error:'Question not found'});
    if((state.usedQuestionIds||[]).includes(questionId))return res.status(409).json({error:'Question already used'});
    const t=nowMs(),captainMs=Number(state.settings?.captainMs)||7000,openMs=Number(state.settings?.openMs)||5000;
    state={...state,questionTeamId:state.controlTeamId,phase:'captain',activeQuestionId:questionId,questionOpenedAt:t,captainDeadline:t+captainMs,teamDeadline:t+captainMs+openMs,
      lockedAnswer:null,lockedBy:null,lockedTeamId:null,stealTeamId:null,stealBuzzDeadline:null,stealCaptainDeadline:null,stealDeadline:null,lastResult:null,
      usedQuestionIds:[...(state.usedQuestionIds||[]),questionId]};
    const c=await commit(row,state,'QUESTION_OPENED',{actorType:role,playerId:player?.player_id||null,teamId:state.controlTeamId,payload:{questionId}});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,role,player));
  }

  if(action==='TICK')return res.status(200).json(await hydrate(row,'host'));

  if(action==='ANSWER'){
    const q=activeQuestion(row);if(!q)return res.status(409).json({error:'No active question'});
    const answer=clean(body.answer,500);if(!answer)return res.status(400).json({error:'Answer required'});
    const stealing=state.phase?.startsWith('steal_'),activeTeam=stealing?state.stealTeamId:state.controlTeamId;
    if(player.team_id!==activeTeam)return res.status(403).json({error:'Your team is not answering'});
    const isCaptain=!!player.is_captain,allowed=['captain','open','steal_captain','steal_open'];
    if(!allowed.includes(state.phase))return res.status(409).json({error:'Answer window is closed'});

    const write=await db('game_submissions?on_conflict=game_id,question_id,player_id',{
      method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({game_id:row.id,game_code:code,question_id:q.id,player_id:player.player_id,team_id:player.team_id,answer,is_captain:isCaptain,created_at:new Date().toISOString()})
    });
    if(!write.ok)return res.status(502).json({error:'Answer could not be saved'});

    const captainPhase=state.phase==='captain'||state.phase==='steal_captain',openPhase=state.phase==='open'||state.phase==='steal_open';
    if((captainPhase&&isCaptain)||openPhase){
      state.lockedAnswer=answer;state.lockedBy=player.player_id;state.lockedTeamId=player.team_id;
      if(state.settings?.manualJudging!==false){
        state.phase=stealing?'steal_locked':'locked';
        const c=await commit(row,state,'ANSWER_LOCKED',{actorType:'player',playerId:player.player_id,teamId:player.team_id});
        if(c.conflict)return res.status(409).json({error:'An answer was already locked'});
        return res.status(200).json(await hydrate(c.row,'player',player));
      }
      const correct=answerMatches(q,answer);
      state=applyJudgement(state,q,player.team_id,answer,stealing,correct);
      const c=await commit(row,state,correct?'ANSWER_CORRECT':'ANSWER_WRONG',{actorType:'player',playerId:player.player_id,teamId:player.team_id,payload:{autoJudged:true,isSteal:stealing,points:state.lastResult?.points||0}});
      if(!c.conflict)return res.status(200).json(await hydrate(c.row,'player',player));
      loaded=await getGameByCode(code);row=loaded.row;
    }else await recordGameEvent(row,'ANSWER_SUGGESTED',{actorType:'player',playerId:player.player_id,teamId:player.team_id});
    return res.status(200).json(await hydrate(row,'player',player));
  }

  if(action==='BUZZ'){
    if(state.phase!=='steal_buzz')return res.status(409).json({error:'Steal is not open'});
    if(player.team_id===state.controlTeamId)return res.status(403).json({error:'The original team cannot steal'});
    if(state.stealTeamId)return res.status(409).json({error:'Another team got the steal'});
    const t=nowMs(),captainMs=Math.min(4000,Number(state.settings?.captainMs)||4000),stealMs=Number(state.settings?.stealMs)||5000;
    state.lockedAnswer=null;state.lockedBy=null;state.lockedTeamId=null;
    state.stealTeamId=player.team_id;state.phase='steal_captain';state.stealCaptainDeadline=t+captainMs;state.stealDeadline=t+captainMs+stealMs;
    const c=await commit(row,state,'STEAL_CLAIMED',{actorType:'player',playerId:player.player_id,teamId:player.team_id});
    if(c.conflict)return res.status(409).json({error:'Another team got the steal'});
    return res.status(200).json(await hydrate(c.row,'player',player));
  }

  if(action==='OPEN_STEAL'){
    if(!['captain','open','locked'].includes(state.phase)||!activeQuestion(row))return res.status(409).json({error:'Steal is unavailable now'});
    const t=nowMs();state.timerPausedAt=null;state.phase='steal_buzz';state.stealTeamId=null;state.stealBuzzDeadline=t+(Number(state.settings?.stealMs)||5000);
    const c=await commit(row,state,'STEAL_OPENED',{actorType:'host'});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'host'));
  }

  if(action==='JUDGE'){
    if(!['captain','open','locked','steal_captain','steal_open','steal_locked'].includes(state.phase))return res.status(409).json({error:'This question has already been judged or is not active'});
    const correct=body.correct===true,q=activeQuestion(row),isSteal=state.phase.startsWith('steal_');
    const teamId=state.lockedTeamId||(isSteal?state.stealTeamId:state.controlTeamId);
    if(!q||!state.teams.some(t=>t.id===teamId))return res.status(409).json({error:'No team is answering'});
    state=applyJudgement(state,q,teamId,state.lockedAnswer||'(spoken answer)',isSteal,correct);
    state.timerPausedAt=null;
    const points=state.lastResult.points;
    const c=await commit(row,state,correct?'ANSWER_CORRECT':'ANSWER_WRONG',{actorType:'host',teamId,payload:{points,isSteal}});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'host'));
  }

  if(action==='REVEAL'){
    if(!activeQuestion(row)||['board','lobby'].includes(state.phase))return res.status(409).json({error:'No question to reveal'});
    state.timerPausedAt=null;state.resultDeadline=null;state.phase='reveal';
    const c=await commit(row,state,'ANSWER_REVEALED',{actorType:'host'});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'host'));
  }

  if(action==='NEXT'){
    if(!['reveal','result'].includes(state.phase))return res.status(409).json({error:'Reveal the answer before continuing'});
    if(state.settings?.autoTurn!==false){
      const original=state.questionTeamId||state.controlTeamId;
      const index=Math.max(0,state.teams.findIndex(t=>t.id===original));
      state.controlTeamId=state.teams[(index+1)%state.teams.length].id;
    }
    state=clearRound(state);state.phase='board';
    const c=await commit(row,state,'RETURNED_TO_BOARD',{actorType:'host'});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'host'));
  }

  if(action==='START_FINAL'){
    if(state.phase!=='board')return res.status(409).json({error:'Return to the board to start the final round'});
    state=clearRound(state);state.phase='final_wager';state.finalWagers={};state.finalAnswers={};state.finalJudged={};
    const c=await commit(row,state,'FINAL_STARTED',{actorType:'host'});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'host'));
  }

  if(action==='FINAL_WAGER'){
    if(state.phase!=='final_wager'||!player.is_captain)return res.status(403).json({error:'Only captains can wager right now'});
    const t=(state.teams||[]).find(x=>x.id===player.team_id),max=Math.max(0,Number(t?.score)||0),wager=Math.max(0,Math.min(Math.round(Number(body.wager)||0),max));
    if(Object.hasOwn(state.finalWagers||{},player.team_id))return res.status(409).json({error:'Wager is already locked'});
    state.finalWagers={...(state.finalWagers||{}),[player.team_id]:wager};
    const c=await commit(row,state,'FINAL_WAGERED',{actorType:'player',playerId:player.player_id,teamId:player.team_id,payload:{wager}});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'player',player));
  }

  if(action==='OPEN_FINAL'){
    if(state.phase!=='final_wager')return res.status(409).json({error:'Final wager phase is not active'});
    state.phase='final_answer';
    const c=await commit(row,state,'FINAL_QUESTION_OPENED',{actorType:'host'});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'host'));
  }

  if(action==='FINAL_ANSWER'){
    if(state.phase!=='final_answer'||!player.is_captain)return res.status(403).json({error:'Only captains can lock the final answer'});
    const answer=clean(body.answer,500);if(!answer)return res.status(400).json({error:'Answer required'});
    if(Object.hasOwn(state.finalAnswers||{},player.team_id))return res.status(409).json({error:'Final answer is already locked'});
    state.finalAnswers={...(state.finalAnswers||{}),[player.team_id]:answer};
    const c=await commit(row,state,'FINAL_ANSWER_LOCKED',{actorType:'player',playerId:player.player_id,teamId:player.team_id});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'player',player));
  }

  if(action==='FINAL_JUDGE'){
    if(!['final_answer','final_judging'].includes(state.phase))return res.status(409).json({error:'Final answer phase is not active'});
    const teamId=clean(body.teamId,40),correct=body.correct===true,wager=Number(state.finalWagers?.[teamId])||0;
    if(!state.teams.some(t=>t.id===teamId)||Object.hasOwn(state.finalJudged||{},teamId))return res.status(409).json({error:'Team not found or already judged'});
    state.teams=(state.teams||[]).map(t=>t.id===teamId?{...t,score:Math.max(0,(Number(t.score)||0)+(correct?wager:-wager))}:t);
    state.finalJudged={...(state.finalJudged||{}),[teamId]:correct};state.phase='final_judging';
    const expected=state.teams.length;
    if(expected&&Object.keys(state.finalJudged).length>=expected){state.phase='winner';state.winnerTeamIds=winnerIds(state)}
    const c=await commit(row,state,'FINAL_JUDGED',{actorType:'host',teamId,payload:{correct,wager}});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    return res.status(200).json(await hydrate(c.row,'host'));
  }

  if(action==='END'){
    state.phase='ended';state.winnerTeamIds=state.winnerTeamIds?.length?state.winnerTeamIds:winnerIds(state);
    const c=await commit(row,state,'GAME_ENDED',{actorType:'host'});
    if(c.conflict)return res.status(409).json({error:'Game changed. Retry.'});
    await db('game_sessions?game_code=eq.'+encodeURIComponent(code),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({ended_at:new Date().toISOString()})});
    return res.status(200).json(await hydrate(c.row,'host'));
  }

  if(action==='HEARTBEAT'){
    await db('game_players?game_id=eq.'+row.id+'&player_id=eq.'+encodeURIComponent(player.player_id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({connected:true,last_seen_at:new Date().toISOString()})});
    return res.status(200).json({ok:true});
  }

  return res.status(400).json({error:'Unknown action'});
}
