import {authenticatedPlayer,playerCredentials,setPlayerCookie} from '../../lib/game-player-session.js';
import { clean, randomToken, hashToken, db, broadcastGame, publicGameState, corsNoStore, getGameByCode, saveGameState } from '../../lib/game-db.js';

export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const body=req.body||{};
  const code=clean(body.code,12).toUpperCase();
  const name=clean(body.name,40);
  const teamId=clean(body.teamId,40);
  if(!code)return res.status(400).json({error:'Game code, name, and team are required'});

  const gq=new URLSearchParams({select:'*',game_code:'eq.'+code,limit:'1'});
  const gr=await db('game_sessions?'+gq.toString());
  const game=Array.isArray(gr.json)?gr.json[0]:null;
  if(!gr.ok||!game)return res.status(404).json({error:'Game not found'});
  const credentials=playerCredentials(req,body,code);
  if(credentials.cookie||credentials.invalid||body.resume||body.playerToken){
    const auth=await authenticatedPlayer(req,body,code);
    if(!auth)return res.status(credentials.cookie||credentials.invalid||body.playerToken?401:404).json({error:'Your saved player session could not be restored. Reconnect with the original browser.'});
    const pq=new URLSearchParams({select:'*',game_id:'eq.'+game.id,order:'joined_at.asc'});
    const pr=await db('game_players?'+pq),players=pr.json||[],player=players.find(p=>p.player_id===auth.playerId);
    if(!player)return res.status(401).json({error:'Player session unavailable'});
    if(teamId&&teamId!==player.team_id)return res.status(403).json({error:'This device is already joined to another team. Refreshing cannot change your team.'});
    setPlayerCookie(res,code,auth);
    return res.status(200).json({...publicGameState(game,players,'player',[],player.team_id),player:{playerId:player.player_id,name:player.name,teamId:player.team_id,isCaptain:game.state.teams.find(t=>t.id===player.team_id)?.captainPlayerId===player.player_id}});
  }
  if(!name||!teamId)return res.status(400).json({error:'Name and team are required'});
  if(game.status==='ended')return res.status(409).json({error:'This game has ended'});
  if(game.state?.mode==='quiz'&&game.state.phase!=='quiz_lobby')return res.status(409).json({error:'This quiz has started. New participants can no longer join.'});

  const teams=Array.isArray(game.state?.teams)?game.state.teams:[];
  const team=teams.find(t=>t.id===teamId);
  if(!team)return res.status(400).json({error:'Team not found'});

  const playerId='p_'+crypto.randomUUID();
  const playerToken=randomToken();
  const tq=new URLSearchParams({select:'id',game_id:'eq.'+game.id,team_id:'eq.'+teamId,is_captain:'eq.true',limit:'1'});
  const tr=await db('game_players?'+tq.toString());
  const needsCaptain=tr.ok&&Array.isArray(tr.json)&&tr.json.length===0;

  const write=await db('game_players',{
    method:'POST',headers:{Prefer:'return=representation'},
    body:JSON.stringify({
      game_id:game.id,player_id:playerId,token_hash:hashToken(playerToken),
      name,team_id:teamId,is_captain:needsCaptain,connected:true,last_seen_at:new Date().toISOString()
    })
  });
  if(!write.ok)return res.status(502).json({error:'Could not join game',details:write.text});
  const player=Array.isArray(write.json)?write.json[0]:write.json;

  // Claim captain with the same optimistic lock as scoring; never replace a
  // newer round state with the stale lobby snapshot read at join time.
  let refreshed=(await getGameByCode(code)).row||game;
  for(let attempt=0;attempt<5;attempt++){
    const currentTeam=refreshed.state.teams.find(t=>t.id===teamId);
    if(currentTeam?.captainPlayerId)break;
    const next=structuredClone(refreshed.state);
    next.teams=next.teams.map(t=>t.id===teamId?{...t,captainPlayerId:playerId}:t);
    const saved=await saveGameState(refreshed,next);
    if(saved.row){refreshed=saved.row;break}
    refreshed=(await getGameByCode(code)).row||refreshed;
  }
  const isCaptain=refreshed.state.teams.find(t=>t.id===teamId)?.captainPlayerId===playerId;
  await db('game_players?game_id=eq.'+game.id+'&player_id=eq.'+encodeURIComponent(playerId),{method:'PATCH',body:JSON.stringify({is_captain:isCaptain})});

  await db('game_events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({
    game_id:game.id,game_code:code,kind:'PLAYER_JOINED',actor_type:'player',
    player_id:playerId,team_id:teamId,payload:{name,isCaptain:needsCaptain}
  })});
  broadcastGame(code,'state',{reason:'PLAYER_JOINED'}).catch(()=>{});

  const pq=new URLSearchParams({select:'*',game_id:'eq.'+game.id,order:'joined_at.asc'});
  const pr=await db('game_players?'+pq.toString());
  refreshed=(await getGameByCode(code)).row||refreshed;
  setPlayerCookie(res,code,{playerId,playerToken});
  return res.status(200).json({
    ...publicGameState(refreshed,Array.isArray(pr.json)?pr.json:[],'player',[],teamId),
    player:{playerId,name,teamId,isCaptain},
    playerToken
  });
}
