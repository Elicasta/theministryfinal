import {authenticatedPlayer} from '../../lib/game-player-session.js';
import {clean,db,verifyHost,corsNoStore,broadcastGame,recordGameEvent,getGameByCode,getGamePlayers} from '../../lib/game-db.js';
import {updateRoom} from '../../lib/game-rounds.js';
import {computeQuizResults,expectedQuizUnits,nextReviewState,previousReviewState} from '../../lib/quiz-engine.js';

async function loadSubmissions(gameId){
  const q=new URLSearchParams({select:'*',game_id:'eq.'+gameId,order:'created_at.asc'});
  const r=await db('game_submissions?'+q.toString());
  return r.ok&&Array.isArray(r.json)?r.json:[];
}
async function announce(row,kind,actorType='system',player=null,payload={}){
  await recordGameEvent(row,kind,{actorType,playerId:player?.player_id||null,teamId:player?.team_id||null,payload});
  broadcastGame(row.game_code,'state',{reason:kind}).catch(()=>{});
}
function captainFor(state,player){
  return state.teams?.find(t=>t.id===player?.team_id)?.captainPlayerId===player?.player_id;
}
async function finalize(code){
  const {row}=await getGameByCode(code);if(!row)return null;
  const players=await getGamePlayers(row.id),submissions=await loadSubmissions(row.id);
  const results=computeQuizResults({
    pack:row.question_pack,players,teams:row.state.teams||[],submissions,
    locks:row.state.quizLocks||{},mode:row.state.quizMode
  });
  const updated=await updateRoom(code,current=>{
    if(current.state?.mode!=='quiz'||current.state.phase!=='quiz_active')return null;
    const scoreByTeam=new Map(results.teamResults.map(t=>[t.teamId,t.percent]));
    const teams=(current.state.teams||[]).map(t=>({...t,score:scoreByTeam.get(t.id)||0}));
    return {state:{...current.state,phase:'quiz_results',teams,quizResults:results,quizFinishedAt:new Date().toISOString(),reviewIndex:0,reviewStage:'responses'},status:'quiz_results'};
  });
  return updated;
}

export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const body=req.body||{},code=clean(body.code,12).toUpperCase(),action=clean(body.action,60).toUpperCase();
  if(!code||!action)return res.status(400).json({error:'Quiz code and action are required'});
  let {row}=await getGameByCode(code);
  if(!row)return res.status(404).json({error:'Quiz not found'});
  if(row.state?.mode!=='quiz')return res.status(409).json({error:'This is not a quiz room'});

  const isHost=body.hostToken&&await verifyHost(code,body.hostToken);
  const auth=!isHost?await authenticatedPlayer(req,body,code):null;
  const players=await getGamePlayers(row.id);
  const player=auth?players.find(p=>p.player_id===auth.playerId):null;
  if(!isHost&&!player)return res.status(401).json({error:'Session expired. Please reconnect.'});

  if(action==='HEARTBEAT'){
    if(!player)return res.status(403).json({error:'Player session required'});
    await db('game_players?game_id=eq.'+row.id+'&player_id=eq.'+encodeURIComponent(player.player_id),{
      method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({connected:true,last_seen_at:new Date().toISOString()})
    });
    return res.status(200).json({ok:true});
  }

  if(action==='SETUP'){
    if(!isHost)return res.status(403).json({error:'Host access required'});
    if(row.state.phase!=='quiz_lobby')return res.status(409).json({error:'Quiz setup is locked after the quiz starts'});
    const incoming=Array.isArray(body.teams)?body.teams:row.state.teams||[];
    const count=Math.max(2,Math.min(Number(body.teamCount)||incoming.length||4,12));
    const old=row.state.teams||[];
    const next=Array.from({length:count},(_,i)=>({
      ...(old[i]||{}),id:clean(incoming[i]?.id||old[i]?.id||'team-'+(i+1),40),
      name:clean(incoming[i]?.name||old[i]?.name||'Team '+(i+1),40),
      color:clean(incoming[i]?.color||old[i]?.color||'#556070',20),
      score:0,streak:0,bestStreak:0,captainPlayerId:old[i]?.captainPlayerId||null
    }));
    const kept=new Set(next.map(t=>t.id)),removed=old.filter(t=>!kept.has(t.id));
    if(removed.some(t=>players.some(p=>p.team_id===t.id)))return res.status(409).json({error:'Move players before removing their team.'});
    const quizMode=body.quizMode==='team'?'team':'individual';
    row=await updateRoom(code,current=>({state:{...current.state,teams:next,quizMode},status:'quiz_lobby'}));
    await announce(row,'QUIZ_SETUP_UPDATED','host',null,{quizMode,teams:count});
    return res.status(200).json({ok:true});
  }

  if(action==='SET_CAPTAIN'){
    if(!isHost)return res.status(403).json({error:'Host access required'});
    const teamId=clean(body.teamId,40),targetPlayerId=clean(body.targetPlayerId,100);
    const target=players.find(p=>p.player_id===targetPlayerId&&p.team_id===teamId);
    if(!target)return res.status(400).json({error:'Player not found on that team'});
    row=await updateRoom(code,current=>({state:{...current.state,teams:(current.state.teams||[]).map(t=>t.id===teamId?{...t,captainPlayerId:targetPlayerId}:t)}}));
    await db('game_players?game_id=eq.'+row.id+'&team_id=eq.'+encodeURIComponent(teamId),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_captain:false})});
    await db('game_players?game_id=eq.'+row.id+'&player_id=eq.'+encodeURIComponent(targetPlayerId),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_captain:true})});
    await announce(row,'QUIZ_CAPTAIN_CHANGED','host',null,{teamId,targetPlayerId});
    return res.status(200).json({ok:true});
  }

  if(action==='START_QUIZ'){
    if(!isHost)return res.status(403).json({error:'Host access required'});
    if(row.state.phase!=='quiz_lobby')return res.status(409).json({error:'Quiz has already started'});
    if(!players.length)return res.status(409).json({error:'At least one player must join before starting'});
    if(row.state.quizMode==='team'){
      const occupied=new Set(players.map(p=>p.team_id));
      const missing=(row.state.teams||[]).filter(t=>occupied.has(t.id)&&!t.captainPlayerId);
      if(missing.length)return res.status(409).json({error:'Every participating team needs a captain before team quiz mode can start'});
    }
    row=await updateRoom(code,current=>({state:{
      ...current.state,phase:'quiz_active',quizLocks:{},quizResults:null,quizStartedAt:new Date().toISOString(),
      quizFinishedAt:null,reviewIndex:0,reviewStage:'responses',
      teams:(current.state.teams||[]).map(t=>({...t,score:0}))
    },status:'quiz_active'}));
    await announce(row,'QUIZ_STARTED','host',null,{quizMode:row.state.quizMode});
    return res.status(200).json({ok:true});
  }

  if(action==='ANSWER'){
    if(!player)return res.status(403).json({error:'Player session required'});
    if(row.state.phase!=='quiz_active')return res.status(409).json({error:'The quiz is not accepting answers'});
    const unit=row.state.quizMode==='team'?player.team_id:player.player_id;
    if(row.state.quizLocks?.[unit])return res.status(409).json({error:'This quiz has already been submitted'});
    if(row.state.quizMode==='team'&&!captainFor(row.state,player))return res.status(403).json({error:'Only the team captain submits answers in team mode'});
    const questionId=clean(body.questionId,120),answer=clean(body.answer,500);
    const q=row.question_pack?.questions?.find(x=>x.id===questionId);
    if(!q)return res.status(400).json({error:'Question not found'});
    if(!q.choices?.includes(answer))return res.status(400).json({error:'Choose one of the available answers'});
    const path='game_submissions?on_conflict=game_id,question_id,player_id';
    const write=await db(path,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({
      game_id:row.id,game_code:code,question_id:questionId,player_id:player.player_id,
      team_id:player.team_id,answer,is_captain:captainFor(row.state,player)
    })});
    if(!write.ok)return res.status(502).json({error:'Answer could not be saved'});
    broadcastGame(code,'state',{reason:'QUIZ_ANSWER_SAVED'}).catch(()=>{});
    return res.status(200).json({ok:true});
  }

  if(action==='SUBMIT_QUIZ'){
    if(!player)return res.status(403).json({error:'Player session required'});
    if(row.state.phase!=='quiz_active')return res.status(409).json({error:'The quiz is not accepting submissions'});
    if(row.state.quizMode==='team'&&!captainFor(row.state,player))return res.status(403).json({error:'Only the team captain can submit the team quiz'});
    const unit=row.state.quizMode==='team'?player.team_id:player.player_id;
    row=await updateRoom(code,current=>{
      if(current.state.quizLocks?.[unit])return null;
      return {state:{...current.state,quizLocks:{...(current.state.quizLocks||{}),[unit]:new Date().toISOString()}}};
    });
    await announce(row,'QUIZ_SUBMITTED','player',player,{unit});
    const freshPlayers=await getGamePlayers(row.id);
    const expected=expectedQuizUnits(row.state.quizMode,freshPlayers,row.state.teams||[]);
    if(expected.length&&expected.every(id=>row.state.quizLocks?.[id]))row=await finalize(code)||row;
    if(row.state.phase==='quiz_results')await announce(row,'QUIZ_RESULTS_READY','system');
    return res.status(200).json({ok:true,finished:row.state.phase==='quiz_results'});
  }

  if(action==='CLOSE_QUIZ'){
    if(!isHost)return res.status(403).json({error:'Host access required'});
    if(row.state.phase!=='quiz_active')return res.status(409).json({error:'Quiz is not active'});
    row=await finalize(code);
    if(!row)return res.status(409).json({error:'Quiz changed. Retry.'});
    await announce(row,'QUIZ_RESULTS_READY','host');
    return res.status(200).json({ok:true});
  }

  if(action==='START_REVIEW'){
    if(!isHost)return res.status(403).json({error:'Host access required'});
    if(row.state.phase!=='quiz_results')return res.status(409).json({error:'Results must be ready before review'});
    row=await updateRoom(code,current=>({state:{...current.state,phase:'quiz_review',reviewIndex:0,reviewStage:'responses'},status:'quiz_review'}));
    await announce(row,'QUIZ_REVIEW_STARTED','host');
    return res.status(200).json({ok:true});
  }

  if(action==='ADVANCE_REVIEW'){
    if(!isHost)return res.status(403).json({error:'Host access required'});
    if(row.state.phase!=='quiz_review')return res.status(409).json({error:'Review is not active'});
    const total=row.question_pack?.questions?.length||0;
    const next=nextReviewState(row.state.reviewIndex||0,row.state.reviewStage||'responses',total);
    row=await updateRoom(code,current=>({state:{...current.state,reviewIndex:next.index,reviewStage:next.stage}}));
    await announce(row,'QUIZ_REVIEW_ADVANCED','host',null,{index:next.index,stage:next.stage,done:next.done});
    return res.status(200).json({ok:true,done:next.done});
  }

  if(action==='BACK_REVIEW'){
    if(!isHost)return res.status(403).json({error:'Host access required'});
    if(row.state.phase!=='quiz_review')return res.status(409).json({error:'Review is not active'});
    const prev=previousReviewState(row.state.reviewIndex||0,row.state.reviewStage||'responses');
    row=await updateRoom(code,current=>({state:{...current.state,reviewIndex:prev.index,reviewStage:prev.stage}}));
    await announce(row,'QUIZ_REVIEW_BACK','host',null,prev);
    return res.status(200).json({ok:true});
  }

  if(action==='END_REVIEW'){
    if(!isHost)return res.status(403).json({error:'Host access required'});
    if(!['quiz_review','quiz_results'].includes(row.state.phase))return res.status(409).json({error:'Quiz review is not active'});
    row=await updateRoom(code,current=>({state:{...current.state,phase:'quiz_complete'},status:'quiz_complete'}));
    await announce(row,'QUIZ_COMPLETED','host');
    return res.status(200).json({ok:true});
  }

  return res.status(400).json({error:'Unknown quiz action'});
}
