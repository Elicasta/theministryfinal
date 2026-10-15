import {authenticatedPlayer} from '../../lib/game-player-session.js';
import {archiveQuizHistory} from '../../lib/quiz-history.js';
import {clean,db,verifyHost,corsNoStore,broadcastGame,recordGameEvent,getGameByCode,getGamePlayers} from '../../lib/game-db.js';
import {updateRoom} from '../../lib/game-rounds.js';
import {
  computeQuizResults,expectedQuizEntries,expectedQuizUnits,entryKeyForPlayer,
  validateAnswer,nextReviewState,previousReviewState,SOLO_TEAM_ID
} from '../../lib/quiz-engine.js';

const realTeams=state=>(state.teams||[]).filter(t=>t.id!==SOLO_TEAM_ID&&!t.isSolo);
function entryKey(state,player){
  return state.quizMode==='mixed'?entryKeyForPlayer(player)
    :state.quizMode==='team'?player.team_id:player.player_id;
}
function eligibleEntries(state,players){
  if(state.quizMode==='mixed')return expectedQuizEntries(players,state.teams||[]);
  return expectedQuizUnits(state.quizMode,players,state.teams||[]).map(key=>({
    key,mode:state.quizMode==='team'?'team':'solo',teamId:state.quizMode==='team'?key:null,
    playerIds:state.quizMode==='team'?players.filter(p=>p.team_id===key).map(p=>p.player_id):[key]
  }));
}
function isCaptain(state,player){
  return (state.teams||[]).some(t=>t.id===player?.team_id&&t.id!==SOLO_TEAM_ID&&t.captainPlayerId===player?.player_id);
}
function mayAnswer(state,player){
  if(state.quizMode==='mixed')return player.team_id===SOLO_TEAM_ID||isCaptain(state,player);
  return state.quizMode==='individual'||isCaptain(state,player);
}
async function submissionsFor(id){
  const q=new URLSearchParams({select:'*',game_id:'eq.'+id,order:'created_at.asc'});
  const r=await db('game_submissions?'+q.toString());
  if(!r.ok)throw new Error('Could not read saved quiz answers');
  return Array.isArray(r.json)?r.json:[];
}
async function announce(row,kind,actorType='system',player=null,payload={}){
  await recordGameEvent(row,kind,{actorType,playerId:player?.player_id||null,teamId:player?.team_id||null,payload});
  broadcastGame(row.game_code,'state',{reason:kind}).catch(()=>{});
}
async function persistHistory(code){
  const {row}=await getGameByCode(code);
  if(!row||row.state?.mode!=='quiz')return false;
  if(row.state.quizHistorySavedAt)return true;
  const roster=await getGamePlayers(row.id),submissions=await submissionsFor(row.id);
  await archiveQuizHistory(row,roster,submissions);
  // Recording a successful archive is idempotent, while the archive itself is
  // keyed by game_id + player_id. Review can safely retry after outages.
  await updateRoom(code,current=>{
    if(current.state.quizHistorySavedAt)return null;
    return {state:{...current.state,quizHistorySavedAt:new Date().toISOString()}};
  });
  return true;
}
async function finalize(code){
  const {row}=await getGameByCode(code);if(!row||row.state?.phase!=='quiz_active')return null;
  const players=await getGamePlayers(row.id),submissions=await submissionsFor(row.id);
  const results=computeQuizResults({
    pack:row.question_pack,players,teams:row.state.teams||[],submissions,
    locks:row.state.quizLocks||{},mode:row.state.quizMode||'individual'
  });
  const updated=await updateRoom(code,current=>{
    if(current.state?.phase!=='quiz_active'||current.state?.mode!=='quiz')return null;
    const percentages=new Map(results.teamResults.map(t=>[t.teamId,t.percent]));
    return {state:{...current.state,phase:'quiz_results',quizResults:results,
      quizFinishedAt:new Date().toISOString(),reviewIndex:0,reviewStage:'responses',
      teams:(current.state.teams||[]).map(t=>({...t,score:percentages.get(t.id)||0}))},status:'quiz_results'};
  });
  if(updated)await persistHistory(code).catch(error=>console.error('Quiz history deferred:',error.message));
  return updated;
}
export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const body=req.body||{},code=clean(body.code,12).toUpperCase(),action=clean(body.action,60).toUpperCase();
  if(!code||!action)return res.status(400).json({error:'Quiz code and action required'});
  let {row}=await getGameByCode(code);
  if(!row)return res.status(404).json({error:'Quiz not found'});
  if(row.state?.mode!=='quiz')return res.status(409).json({error:'This is not a quiz room'});
  const host=!!body.hostToken&&await verifyHost(code,body.hostToken);
  const auth=!host?await authenticatedPlayer(req,body,code):null;
  const players=await getGamePlayers(row.id),player=auth?players.find(p=>p.player_id===auth.playerId):null;
  if(!host&&!player)return res.status(401).json({error:'Session expired. Rejoin using the original browser.'});
  if(action==='HEARTBEAT'){
    if(!player)return res.status(403).json({error:'Player login required'});
    await db('game_players?game_id=eq.'+row.id+'&player_id=eq.'+encodeURIComponent(player.player_id),{
      method:'PATCH',headers:{Prefer:'return=minimal'},
      body:JSON.stringify({connected:true,last_seen_at:new Date().toISOString()})
    });
    return res.status(200).json({ok:true});
  }
  if(action==='SETUP'){
    if(!host)return res.status(403).json({error:'Host access required'});
    if(row.state.phase!=='quiz_lobby')return res.status(409).json({error:'Quiz setup is locked'});
    const incoming=Array.isArray(body.teams)?body.teams:realTeams(row.state);
    const count=Math.max(2,Math.min(Number(body.teamCount)||incoming.length||4,12));
    const old=realTeams(row.state);
    const next=Array.from({length:count},(_,i)=>({
      ...(old[i]||{}),id:old[i]?.id||'team-'+(i+1),
      name:clean(incoming[i]?.name||old[i]?.name||'Team '+(i+1),40),
      color:old[i]?.color||'#657483',captainPlayerId:old[i]?.captainPlayerId||null,
      score:0,streak:0,bestStreak:0
    }));
    const removed=old.slice(count);
    if(removed.some(t=>players.some(p=>p.team_id===t.id)))return res.status(409).json({error:'Move participants before removing their team'});
    const solo=(row.state.teams||[]).find(t=>t.id===SOLO_TEAM_ID);
    row=await updateRoom(code,current=>({state:{...current.state,teams:[...next,...(solo?[solo]:[])],quizMode:current.state.quizMode==='mixed'?'mixed':current.state.quizMode},status:'quiz_lobby'}));
    await announce(row,'QUIZ_SETUP_UPDATED','host',null,{teams:count});
    return res.status(200).json({ok:true});
  }
  if(action==='SET_CAPTAIN'){
    if(!host)return res.status(403).json({error:'Host access required'});
    if(!['quiz_lobby','quiz_active'].includes(row.state.phase))return res.status(409).json({error:'Quiz has closed'});
    const teamId=clean(body.teamId,40),targetPlayerId=clean(body.targetPlayerId,100);
    if(teamId===SOLO_TEAM_ID)return res.status(400).json({error:'Solo participants do not have a captain'});
    if(!players.some(p=>p.player_id===targetPlayerId&&p.team_id===teamId))return res.status(400).json({error:'Player is not on that team'});
    row=await updateRoom(code,current=>({state:{...current.state,teams:(current.state.teams||[]).map(t=>t.id===teamId?{...t,captainPlayerId:targetPlayerId}:t)}}));
    await db('game_players?game_id=eq.'+row.id+'&team_id=eq.'+encodeURIComponent(teamId),{
      method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_captain:false})
    });
    await db('game_players?game_id=eq.'+row.id+'&player_id=eq.'+encodeURIComponent(targetPlayerId),{
      method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_captain:true})
    });
    await announce(row,'QUIZ_CAPTAIN_CHANGED','host',null,{teamId});
    return res.status(200).json({ok:true});
  }
  if(action==='START_QUIZ'){
    if(!host)return res.status(403).json({error:'Host access required'});
    if(row.state.phase!=='quiz_lobby')return res.status(409).json({error:'Quiz already started'});
    const roster=eligibleEntries(row.state,players);
    if(!roster.length)return res.status(409).json({error:'At least one participant must join'});
    const participatingTeams=new Set(roster.filter(e=>e.mode==='team').map(e=>e.teamId));
    if(realTeams(row.state).some(t=>participatingTeams.has(t.id)&&!t.captainPlayerId))
      return res.status(409).json({error:'Every participating team needs a captain'});
    row=await updateRoom(code,current=>{
      if(current.state.phase!=='quiz_lobby')return null;
      return {state:{...current.state,phase:'quiz_active',quizRoster:roster,
        quizLocks:{},quizResults:null,quizStartedAt:new Date().toISOString(),quizFinishedAt:null,
        reviewIndex:0,reviewStage:'responses'},status:'quiz_active'};
    });
    await announce(row,'QUIZ_STARTED','host',null,{units:roster.length});
    return res.status(200).json({ok:true});
  }
  if(action==='ANSWER'){
    if(!player)return res.status(403).json({error:'Player login required'});
    if(row.state.phase!=='quiz_active')return res.status(409).json({error:'Quiz not accepting answers'});
    if(!mayAnswer(row.state,player))return res.status(403).json({error:'Only your team captain may submit'});
    const unit=entryKey(row.state,player);
    if(!unit||!eligibleEntries(row.state,players).some(e=>e.key===unit))return res.status(403).json({error:'Not on the quiz roster'});
    if(row.state.quizLocks?.[unit])return res.status(409).json({error:'Answers are locked'});
    const questionId=clean(body.questionId,120),q=row.question_pack?.questions?.find(x=>x.id===questionId);
    const raw=String(body.answer??'');
    const validated=validateAnswer(q?.type?q:{...q,type:'multiple_choice'},raw);
    if(!validated.ok)return res.status(400).json({error:validated.reason});
    // Re-read state immediately before the write so stale clients cannot edit after submission.
    const current=(await getGameByCode(code)).row;
    if(current.state.phase!=='quiz_active'||current.state.quizLocks?.[unit])return res.status(409).json({error:'Submission is locked'});
    const write=await db('game_submissions?on_conflict=game_id,question_id,player_id',{
      method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({game_id:row.id,game_code:code,question_id:questionId,
        player_id:player.player_id,team_id:player.team_id,
        answer:validated.answer,is_captain:isCaptain(row.state,player),created_at:new Date().toISOString()})
    });
    if(!write.ok)return res.status(502).json({error:'Could not save answer'});
    broadcastGame(code,'state',{reason:'QUIZ_ANSWER_SAVED'}).catch(()=>{});
    return res.status(200).json({ok:true});
  }
  if(action==='SUBMIT_QUIZ'){
    if(!player)return res.status(403).json({error:'Player login required'});
    if(row.state.phase!=='quiz_active')return res.status(409).json({error:'Quiz already closed'});
    if(!mayAnswer(row.state,player))return res.status(403).json({error:'Only your team captain may submit'});
    const unit=entryKey(row.state,player);
    if(!eligibleEntries(row.state,players).some(e=>e.key===unit))return res.status(403).json({error:'Not on the quiz roster'});
    if(row.state.quizLocks?.[unit])return res.status(200).json({ok:true,alreadySubmitted:true});
    row=await updateRoom(code,current=>{
      if(current.state.phase!=='quiz_active'||current.state.quizLocks?.[unit])return null;
      return {state:{...current.state,quizLocks:{...(current.state.quizLocks||{}),[unit]:new Date().toISOString()}}};
    });
    if(!row)return res.status(409).json({error:'Submission state changed. Refresh and retry.'});
    await announce(row,'QUIZ_SUBMITTED','player',player,{unit});
    const roster=row.state.quizRoster?.length?row.state.quizRoster:eligibleEntries(row.state,players);
    if(roster.length&&roster.every(e=>row.state.quizLocks?.[e.key])){
      const finished=await finalize(code);
      if(finished){row=finished;await announce(row,'QUIZ_RESULTS_READY','system');}
    }
    return res.status(200).json({ok:true,finished:row.state.phase==='quiz_results'});
  }
  if(action==='CLOSE_QUIZ'){
    if(!host)return res.status(403).json({error:'Host access required'});
    if(row.state.phase!=='quiz_active')return res.status(409).json({error:'Quiz not active'});
    row=await finalize(code);
    if(!row)return res.status(409).json({error:'Quiz state changed'});
    await announce(row,'QUIZ_RESULTS_READY','host');
    return res.status(200).json({ok:true});
  }
  if(action==='ARCHIVE_HISTORY'){
    if(!host)return res.status(403).json({error:'Host access required'});
    if(!['quiz_results','quiz_review','quiz_complete'].includes(row.state.phase))
      return res.status(409).json({error:'Results are not final yet'});
    try{await persistHistory(code);return res.status(200).json({ok:true,archived:true})}
    catch{return res.status(503).json({error:'History could not be saved. Retry shortly.'})}
  }
  if(action==='START_REVIEW'){
    if(!host)return res.status(403).json({error:'Host access required'});
    if(row.state.phase!=='quiz_results')return res.status(409).json({error:'Results not ready'});
    try{await persistHistory(code)}
    catch(error){return res.status(503).json({error:'Could not save everyone’s quiz history. Retry Begin Review.'})}
    row=await updateRoom(code,current=>({state:{...current.state,phase:'quiz_review',reviewIndex:0,reviewStage:'responses'},status:'quiz_review'}));
    await announce(row,'QUIZ_REVIEW_STARTED','host');
    return res.status(200).json({ok:true});
  }
  if(action==='ADVANCE_REVIEW'){
    if(!host)return res.status(403).json({error:'Host access required'});
    if(row.state.phase!=='quiz_review')return res.status(409).json({error:'Review not active'});
    const next=nextReviewState(row.state.reviewIndex||0,row.state.reviewStage||'responses',row.question_pack?.questions?.length||0);
    if(next.done){
      row=await updateRoom(code,current=>({state:{...current.state,phase:'quiz_complete'},status:'quiz_complete'}));
      await announce(row,'QUIZ_COMPLETED','host');
      return res.status(200).json({ok:true,done:true});
    }
    row=await updateRoom(code,current=>({state:{...current.state,reviewIndex:next.index,reviewStage:next.stage}}));
    await announce(row,'QUIZ_REVIEW_ADVANCED','host',null,{index:next.index,stage:next.stage});
    return res.status(200).json({ok:true,done:false});
  }
  if(action==='BACK_REVIEW'){
    if(!host)return res.status(403).json({error:'Host access required'});
    if(row.state.phase!=='quiz_review')return res.status(409).json({error:'Review not active'});
    const prev=previousReviewState(row.state.reviewIndex||0,row.state.reviewStage||'responses');
    row=await updateRoom(code,current=>({state:{...current.state,reviewIndex:prev.index,reviewStage:prev.stage}}));
    await announce(row,'QUIZ_REVIEW_BACK','host',null,prev);
    return res.status(200).json({ok:true});
  }
  if(action==='END_REVIEW'){
    if(!host)return res.status(403).json({error:'Host access required'});
    if(!['quiz_review','quiz_results'].includes(row.state.phase))return res.status(409).json({error:'Review not active'});
    row=await updateRoom(code,current=>({state:{...current.state,phase:'quiz_complete'},status:'quiz_complete'}));
    await announce(row,'QUIZ_COMPLETED','host');
    return res.status(200).json({ok:true});
  }
  return res.status(400).json({error:'Unknown quiz action'});
}