import {authenticatedPlayer,playerCredentials,setPlayerCookie} from '../../lib/game-player-session.js';
import { clean, db, verifyHost, verifyPlayer, publicGameState, corsNoStore, displayChannel, saveGameState } from '../../lib/game-db.js';

import { advanceClock } from '../../lib/game-clock.js';

export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const body=req.method==='POST'?(req.body||{}):req.query||{};
  const code=clean(body.code,12).toUpperCase();
  if(!code)return res.status(400).json({error:'Game code required'});
  const gq=new URLSearchParams({select:'*',game_code:'eq.'+code,limit:'1'});
  const gr=await db('game_sessions?'+gq.toString());
  let game=Array.isArray(gr.json)?gr.json[0]:null;
  if(!gr.ok||!game)return res.status(404).json({error:'Game not found'});

  let role='public';
  const credentials=req.method==='POST'&&!body.hostToken?playerCredentials(req,body,code):{};
  const auth=req.method==='POST'&&!body.hostToken?await authenticatedPlayer(req,body,code):null;
  if(body.hostToken&&await verifyHost(code,body.hostToken))role='host';
  else if(auth){role='player';setPlayerCookie(res,code,auth)}

  if((body.hostToken||body.playerToken||credentials.cookie||credentials.invalid)&&role==='public')return res.status(401).json({error:'Session expired. Please reconnect.'});
  if(role==='host'&&!game.state?.displayChannel){const saved=await saveGameState(game,{...game.state,displayChannel:displayChannel()});if(saved.row)game=saved.row}
  game=await advanceClock(game);
  const pq=new URLSearchParams({select:'player_id,name,team_id,is_captain,connected,last_seen_at',game_id:'eq.'+game.id,order:'joined_at.asc'});
  const pr=await db('game_players?'+pq.toString());
  let privateTeamId=null;
  if(role==='player'){
    const players=Array.isArray(pr.json)?pr.json:[];
    privateTeamId=players.find(p=>p.player_id===auth.playerId)?.team_id||null;
  }
  let submissions=[];
  if(game.state?.activeQuestionId&&(role==='host'||role==='player')){
    const sq=new URLSearchParams({select:'*',game_id:'eq.'+game.id,question_id:'eq.'+game.state.activeQuestionId,order:'created_at.asc'});
    const sr=await db('game_submissions?'+sq.toString());
    submissions=Array.isArray(sr.json)?sr.json:[];
    if(role==='player'&&privateTeamId)submissions=submissions.filter(x=>x.team_id===privateTeamId);
  }
  return res.status(200).json(publicGameState(game,Array.isArray(pr.json)?pr.json:[],role,submissions,privateTeamId));
}
