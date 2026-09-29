import { clean, randomCode, randomToken, hashToken, db, broadcastGame, publicGameState, corsNoStore, displayChannel } from '../../lib/game-db.js';
import { BUILTIN_GAME_PACK } from '../../lib/game-pack.js';

const COLORS=['#ff304f','#159dff','#00d597','#f5c44e','#aa6cff','#ff8f3d','#4f7dff','#ff71ce','#7ee787','#f7a8ff','#8ad5ff','#f2cc60'];

export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});

  const body=req.body||{};
  const inputTeams=Array.isArray(body.teams)?body.teams:[];
  const count=Math.max(2,Math.min(Number(body.teamCount)||inputTeams.length||4,12));
  const teams=Array.from({length:count},(_,i)=>({
    id:clean(inputTeams[i]?.id||'team-'+(i+1),40),
    name:clean(inputTeams[i]?.name||(['Team Red','Team Blue','Team Green','Team Gold'][i]||'Team '+(i+1)),40),
    color:clean(inputTeams[i]?.color||COLORS[i%COLORS.length],20),
    score:0,streak:0,bestStreak:0,captainPlayerId:null
  }));
  const settings={
    captainMs:Math.max(3000,Math.min(Number(body.settings?.captainMs)||30000,60000)),
    openMs:Math.max(2000,Math.min(Number(body.settings?.openMs)||5000,12000)),
    stealMs:Math.max(2000,Math.min(Number(body.settings?.stealMs)||5000,10000)),
    autoTurn:body.settings?.autoTurn!==false,
    autoSteal:body.settings?.autoSteal!==false,
    sound:body.settings?.sound!==false,
    voice:body.settings?.voice===true,
    manualJudging:body.settings?.manualJudging!==false
  };

  const hostToken=randomToken();
  const displayToken=randomToken(18);
  const state={
    engine:'ministry-games-v1',displayChannel:displayChannel()+(body.autoProjector===false?':manual':''),phase:'lobby',teams,settings,
    controlTeamId:teams[0].id,activeQuestionId:null,usedQuestionIds:[],
    questionOpenedAt:null,captainDeadline:null,teamDeadline:null,stealDeadline:null,
    lockedAnswer:null,lockedBy:null,stealTeamId:null,lastResult:null,
    final:null,createdAt:new Date().toISOString()
  };

  let code='',write=null;
  for(let attempt=0;attempt<6;attempt++){
    code=randomCode(6);
    write=await db('game_sessions',{
      method:'POST',
      headers:{Prefer:'return=representation'},
      body:JSON.stringify({
        game_code:code,status:'lobby',host_token_hash:hashToken(hostToken),display_token_hash:hashToken(displayToken),
        state,question_pack:BUILTIN_GAME_PACK
      })
    });
    if(write.ok)break;
    if(write.status!==409)return res.status(502).json({error:'Game could not be created',details:write.text});
  }
  if(!write?.ok)return res.status(503).json({error:'Could not allocate a game code'});

  const row=Array.isArray(write.json)?write.json[0]:write.json;
  await db('game_events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({game_id:row.id,game_code:code,kind:'GAME_CREATED',actor_type:'host',payload:{teams:count}})});
  broadcastGame(code,'state',{version:row.version,reason:'GAME_CREATED'}).catch(()=>{});
  return res.status(200).json({...publicGameState(row,[],'host'),hostToken,displayToken});
}
