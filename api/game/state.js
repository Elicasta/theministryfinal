import { clean, db, verifyHost, verifyPlayer, publicGameState, corsNoStore } from '../../lib/game-db.js';

export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const body=req.method==='POST'?(req.body||{}):req.query||{};
  const code=clean(body.code,12).toUpperCase();
  if(!code)return res.status(400).json({error:'Game code required'});
  const gq=new URLSearchParams({select:'*',game_code:'eq.'+code,limit:'1'});
  const gr=await db('game_sessions?'+gq.toString());
  const game=Array.isArray(gr.json)?gr.json[0]:null;
  if(!gr.ok||!game)return res.status(404).json({error:'Game not found'});

  let role='public';
  if(body.hostToken&&await verifyHost(code,body.hostToken))role='host';
  else if(body.playerId&&body.playerToken&&await verifyPlayer(code,body.playerId,body.playerToken))role='player';

  const pq=new URLSearchParams({select:'player_id,name,team_id,is_captain,connected,last_seen_at',game_id:'eq.'+game.id,order:'joined_at.asc'});
  const pr=await db('game_players?'+pq.toString());
  return res.status(200).json(publicGameState(game,Array.isArray(pr.json)?pr.json:[],role));
}
