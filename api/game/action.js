import { clean, db, verifyHost, verifyPlayer, broadcastGame, publicGameState, corsNoStore } from '../../lib/game-db.js';

function now(){return Date.now()}
function normalizeAnswer(v){return clean(v,300)}
function teamById(state,id){return (state.teams||[]).find(t=>t.id===id)||null}
function questionById(pack,id){return (pack.questions||[]).find(q=>q.id===id)||null}
function clearQuestionState(state){
  return {
    ...state,phase:'board',activeQuestionId:null,questionOpenedAt:null,captainDeadline:null,teamDeadline:null,
    stealDeadline:null,lockedAnswer:null,lockedBy:null,stealTeamId:null,lastResult:null
  };
}
async function logEvent(game,kind,actorType,payload={},player=null){
  return db('game_events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({
    game_id:game.id,game_code:game.game_code,kind,actor_type:actorType,
    player_id:player?.player_id||null,team_id:player?.team_id||payload?.teamId||null,payload
  })});
}
async function saveState(game,state,status=state.phase){
  const q=new URLSearchParams();
  q.set('game_code','eq.'+game.game_code);
  q.set('version','eq.'+game.version);
  const r=await db('game_sessions?'+q.toString(),{
    method:'PATCH',
    headers:{Prefer:'return=representation'},
    body:JSON.stringify({state,status,ended_at:status==='ended'?new Date().toISOString():null})
  });
  const row=Array.isArray(r.json)?r.json[0]:null;
  if(!r.ok)return {error:r};
  if(!row)return {conflict:true};
  return {row};
}
async function loadGame(code){
  const q=new URLSearchParams({select:'*',game_code:'eq.'+code,limit:'1'});
  const r=await db('game_sessions?'+q.toString());
  return {r,game:Array.isArray(r.json)?r.json[0]:null};
}
async function loadPlayers(gameId){
  const q=new URLSearchParams({select:'*',game_id:'eq.'+gameId,order:'joined_at.asc'});
  const r=await db('game_players?'+q.toString());
  return Array.isArray(r.json)?r.json:[];
}

export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const body=req.body||{};
  const code=clean(body.code,12).toUpperCase();
  const action=clean(body.action,60);
  if(!code||!action)return res.status(400).json({error:'Game code and action required'});

  const {r,game}=await loadGame(code);
  if(!r.ok||!game)return res.status(404).json({error:'Game not found'});
  if(game.status==='ended'&&action!=='state')return res.status(409).json({error:'Game has ended'});

  const host=body.hostToken?await verifyHost(code,body.hostToken):false;
  const playerOk=!host&&body.playerId&&body.playerToken?await verifyPlayer(code,body.playerId,body.playerToken):false;
  let player=null;
  if(playerOk){
    const pq=new URLSearchParams({select:'*',game_id:'eq.'+game.id,player_id:'eq.'+clean(body.playerId,80),limit:'1'});
    const pr=await db('game_players?'+pq.toString());
    player=Array.isArray(pr.json)?pr.json[0]:null;
    if(player)db('game_players?id=eq.'+player.id,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({connected:true,last_seen_at:new Date().toISOString()})}).catch(()=>{});
  }
  if(!host&&!player)return res.status(401).json({error:'Game authorization failed'});

  const pack=game.question_pack||{};
  let state=game.state||{};
  const currentQuestion=questionById(pack,state.activeQuestionId);
  const actorType=host?'host':'player';

  if(host){
    if(action==='start'){
      if(state.phase!=='lobby')return res.status(409).json({error:'Game already started'});
      state={...state,phase:'board',startedAt:new Date().toISOString(),controlTeamId:state.controlTeamId||(state.teams||[])[0]?.id||null};
      await logEvent(game,'GAME_STARTED','host');
    } else if(action==='choose_question'){
      if(state.phase!=='board')return res.status(409).json({error:'Board is not active'});
      const questionId=clean(body.questionId,100);
      const q=questionById(pack,questionId);
      if(!q)return res.status(400).json({error:'Question not found'});
      if((state.usedQuestionIds||[]).includes(questionId))return res.status(409).json({error:'Question already used'});
      const opened=now(),captainMs=Number(state.settings?.captainMs)||7000,openMs=Number(state.settings?.openMs)||5000;
      state={...state,phase:'question',activeQuestionId:questionId,questionOpenedAt:opened,captainDeadline:opened+captainMs,teamDeadline:opened+captainMs+openMs,stealDeadline:null,lockedAnswer:null,lockedBy:null,stealTeamId:null,lastResult:null};
      await logEvent(game,'QUESTION_OPENED','host',{questionId,teamId:state.controlTeamId});
    } else if(action==='timeout'){
      if(!['question','steal_question'].includes(state.phase))return res.status(409).json({error:'No live question to time out'});
      if(state.phase==='question'&&state.settings?.autoSteal!==false){
        state={...state,phase:'steal_open',stealDeadline:now()+3000,lockedAnswer:null,lockedBy:null};
        await logEvent(game,'STEAL_OPENED','host',{reason:'timeout'});
      }else{
        state={...state,phase:'result',lastResult:{correct:false,teamId:state.stealTeamId||state.controlTeamId,points:0,reason:'timeout'}};
        await logEvent(game,'QUESTION_TIMED_OUT','host');
      }
    } else if(action==='open_steal'){
      if(!['answer_locked','question'].includes(state.phase))return res.status(409).json({error:'Steal cannot open now'});
      state={...state,phase:'steal_open',stealDeadline:now()+3000};
      await logEvent(game,'STEAL_OPENED','host',{reason:'manual'});
    } else if(action==='reveal'){
      if(!currentQuestion)return res.status(409).json({error:'No active question'});
      state={...state,phase:'reveal'};
      await logEvent(game,'ANSWER_REVEALED','host',{questionId:currentQuestion.id});
    } else if(action==='correct'){
      if(!currentQuestion)return res.status(409).json({error:'No active question'});
      const scoringTeamId=state.lockedBy?.teamId||state.stealTeamId||state.controlTeamId;
      if(!scoringTeamId)return res.status(409).json({error:'No team has an answer'});
      const awarded=Number(currentQuestion.points)||0;
      state={...state,
        teams:(state.teams||[]).map(t=>t.id===scoringTeamId?{...t,score:Number(t.score||0)+awarded,streak:Number(t.streak||0)+1}:t),
        phase:'result',controlTeamId:scoringTeamId,
        lastResult:{correct:true,teamId:scoringTeamId,points:awarded,answer:currentQuestion.correctAnswer,reference:currentQuestion.reference||''}
      };
      await logEvent(game,'ANSWER_CORRECT','host',{teamId:scoringTeamId,points:awarded,questionId:currentQuestion.id});
    } else if(action==='wrong'){
      if(!currentQuestion)return res.status(409).json({error:'No active question'});
      const missedTeamId=state.lockedBy?.teamId||state.stealTeamId||state.controlTeamId;
      state={...state,teams:(state.teams||[]).map(t=>t.id===missedTeamId?{...t,streak:0}:t)};
      if(state.phase==='steal_question'||state.stealTeamId){
        state={...state,phase:'result',lastResult:{correct:false,teamId:missedTeamId,points:0,answer:currentQuestion.correctAnswer,reference:currentQuestion.reference||''}};
        await logEvent(game,'STEAL_WRONG','host',{teamId:missedTeamId,questionId:currentQuestion.id});
      }else if(state.settings?.autoSteal!==false){
        state={...state,phase:'steal_open',stealDeadline:now()+3000,lockedAnswer:null,lockedBy:null};
        await logEvent(game,'ANSWER_WRONG','host',{teamId:missedTeamId,questionId:currentQuestion.id,steal:true});
      }else{
        state={...state,phase:'result',lastResult:{correct:false,teamId:missedTeamId,points:0,answer:currentQuestion.correctAnswer,reference:currentQuestion.reference||''}};
        await logEvent(game,'ANSWER_WRONG','host',{teamId:missedTeamId,questionId:currentQuestion.id,steal:false});
      }
    } else if(action==='next'){
      if(!currentQuestion)return res.status(409).json({error:'No active question'});
      const used=[...new Set([...(state.usedQuestionIds||[]),currentQuestion.id])];
      state=clearQuestionState({...state,usedQuestionIds:used});
      await logEvent(game,'BOARD_RETURNED','host',{questionId:currentQuestion.id});
    } else if(action==='assign_captain'){
      const teamId=clean(body.teamId,40),playerId=clean(body.playerId,80);
      const players=await loadPlayers(game.id);
      const target=players.find(p=>p.player_id===playerId&&p.team_id===teamId);
      if(!target)return res.status(400).json({error:'Player is not on that team'});
      await db('game_players?game_id=eq.'+game.id+'&team_id=eq.'+encodeURIComponent(teamId),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_captain:false})});
      await db('game_players?id=eq.'+target.id,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_captain:true})});
      state={...state,teams:(state.teams||[]).map(t=>t.id===teamId?{...t,captainPlayerId:playerId}:t)};
      await logEvent(game,'CAPTAIN_ASSIGNED','host',{teamId,playerId});
    } else if(action==='set_control'){
      const teamId=clean(body.teamId,40);
      if(!teamById(state,teamId))return res.status(400).json({error:'Team not found'});
      state={...state,controlTeamId:teamId};
      await logEvent(game,'CONTROL_CHANGED','host',{teamId});
    } else if(action==='adjust_score'){
      const teamId=clean(body.teamId,40),delta=Math.max(-5000,Math.min(Number(body.delta)||0,5000));
      if(!teamById(state,teamId))return res.status(400).json({error:'Team not found'});
      state={...state,teams:(state.teams||[]).map(t=>t.id===teamId?{...t,score:Number(t.score||0)+delta}:t)};
      await logEvent(game,'SCORE_ADJUSTED','host',{teamId,delta});
    } else if(action==='end'){
      const teams=[...(state.teams||[])],best=Math.max(...teams.map(t=>Number(t.score||0)),0);
      const winners=teams.filter(t=>Number(t.score||0)===best).map(t=>t.id);
      state={...state,phase:'winner',winnerTeamIds:winners,endedAt:new Date().toISOString()};
      await logEvent(game,'GAME_ENDED','host',{winnerTeamIds:winners});
    } else {
      return res.status(400).json({error:'Unknown host action'});
    }
  } else {
    if(action==='submit_answer'){
      if(!currentQuestion||!['question','steal_question'].includes(state.phase))return res.status(409).json({error:'Answers are not open'});
      const activeTeam=state.phase==='steal_question'?state.stealTeamId:state.controlTeamId;
      if(player.team_id!==activeTeam)return res.status(403).json({error:'Your team is not answering'});
      if(state.lockedAnswer)return res.status(409).json({error:'An answer is already locked'});
      const answer=normalizeAnswer(body.answer);
      if(!answer)return res.status(400).json({error:'Answer required'});
      const t=now(),captainDeadline=Number(state.captainDeadline)||0,teamDeadline=Number(state.teamDeadline)||0;
      if(teamDeadline&&t>teamDeadline)return res.status(409).json({error:'Time expired'});
      await logEvent(game,'ANSWER_SUGGESTED','player',{questionId:currentQuestion.id,answer,teamId:player.team_id},player);
      const canLock=player.is_captain||t>=captainDeadline;
      if(canLock){
        state={...state,phase:'answer_locked',lockedAnswer:answer,lockedBy:{playerId:player.player_id,name:player.name,teamId:player.team_id,isCaptain:!!player.is_captain},lockedAt:t};
        await logEvent(game,'ANSWER_LOCKED','player',{questionId:currentQuestion.id,answer,teamId:player.team_id,isCaptain:!!player.is_captain},player);
      }else{
        return res.status(200).json({ok:true,saved:true,locked:false,reason:'suggestion_saved',captainDeadline});
      }
    } else if(action==='buzz_steal'){
      if(state.phase!=='steal_open')return res.status(409).json({error:'Steal is not open'});
      if(player.team_id===state.controlTeamId)return res.status(403).json({error:'The original team cannot steal its own question'});
      if(state.stealDeadline&&now()>state.stealDeadline)return res.status(409).json({error:'Steal window closed'});
      const t=now(),captainMs=Math.min(3000,Number(state.settings?.captainMs)||3000),stealMs=Number(state.settings?.stealMs)||5000;
      state={...state,phase:'steal_question',stealTeamId:player.team_id,lockedAnswer:null,lockedBy:null,captainDeadline:t+captainMs,teamDeadline:t+stealMs,stealDeadline:null};
      await logEvent(game,'STEAL_CLAIMED','player',{teamId:player.team_id},player);
    } else if(action==='heartbeat'){
      return res.status(200).json({ok:true});
    } else {
      return res.status(400).json({error:'Unknown player action'});
    }
  }

  const saved=await saveState(game,state,action==='end'?'ended':state.phase);
  if(saved.conflict)return res.status(409).json({error:'Game changed before this action completed. Retry.'});
  if(saved.error)return res.status(502).json({error:'Game state could not be saved',details:saved.error.text});

  broadcastGame(code,'state',{version:saved.row.version,reason:action}).catch(()=>{});
  const players=await loadPlayers(game.id);
  return res.status(200).json(publicGameState(saved.row,players,host?'host':'player'));
}
