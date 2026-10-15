import {clean,randomCode,randomToken,hashToken,db,broadcastGame,corsNoStore,displayChannel} from '../../lib/game-db.js';
import {getQuizPack} from '../../lib/quiz-pack.js';
import {SOLO_TEAM_ID} from '../../lib/quiz-engine.js';

const COLORS=['#a33d3d','#355f8a','#456d50','#9b7937','#72558e','#9a5b3c','#3f6182','#8b5574','#5d7448','#79684d','#4f7182','#746278'];

export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const body=req.body||{};
  const incoming=Array.isArray(body.teams)?body.teams:[];
  const count=Math.max(2,Math.min(Number(body.teamCount)||incoming.length||4,12));
  const teams=Array.from({length:count},(_,i)=>({
    id:'team-'+(i+1),
    name:clean(incoming[i]?.name||(['Team One','Team Two','Team Three','Team Four'][i]||'Team '+(i+1)),40),
    color:COLORS[i],score:0,streak:0,bestStreak:0,captainPlayerId:null
  }));
  teams.push({id:SOLO_TEAM_ID,name:'Solo Participants',color:'#768598',isSolo:true,score:0,streak:0,bestStreak:0,captainPlayerId:null});
  const pack=getQuizPack(clean(body.packId,120));
  const hostToken=randomToken(),displayToken=randomToken(18);
  const state={
    engine:'ministry-quiz-v2',mode:'quiz',displayChannel:displayChannel(),
    phase:'quiz_lobby',quizMode:'mixed',teams,quizPackId:pack.id,
    quizLocks:{},quizRoster:[],quizStartedAt:null,quizFinishedAt:null,quizResults:null,
    reviewIndex:0,reviewStage:'responses',createdAt:new Date().toISOString()
  };
  let code='',write;
  for(let attempt=0;attempt<6;attempt++){
    code=randomCode(6);
    write=await db('game_sessions',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
      game_code:code,status:'quiz_lobby',host_token_hash:hashToken(hostToken),
      display_token_hash:hashToken(displayToken),state,question_pack:pack
    })});
    if(write.ok)break;
    if(write.status!==409)return res.status(502).json({error:'Could not create quiz'});
  }
  if(!write?.ok)return res.status(503).json({error:'Could not allocate quiz code'});
  const row=Array.isArray(write.json)?write.json[0]:write.json;
  await db('game_events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({
    game_id:row.id,game_code:code,kind:'QUIZ_CREATED',actor_type:'host',payload:{quizMode:'mixed',packId:pack.id,teams:count}
  })});
  broadcastGame(code,'state',{version:row.version,reason:'QUIZ_CREATED'}).catch(()=>{});
  return res.status(200).json({ok:true,gameCode:code,hostToken,displayToken,serverTime:Date.now()});
}