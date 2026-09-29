import {db,corsNoStore,displayChannel} from '../../lib/game-db.js';

// Permanent audience URL follows the newest host room. A newer lobby or ended
// room deliberately prevents an abandoned older room from taking over again.
export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const query=new URLSearchParams({select:'game_code,status,created_at,updated_at',order:'created_at.desc',limit:'1','state->>displayChannel':'eq.'+displayChannel()});
  const result=await db('game_sessions?'+query);
  if(!result.ok)return res.status(503).json({error:'Game service is unavailable. Reconnecting shortly.'});
  const room=result.json?.[0];
  const active=room&&!['lobby','ended'].includes(room.status)&&(room.status!=='winner'||Date.now()-Date.parse(room.updated_at)<20000);
  return res.status(200).json({ok:true,gameCode:active?room.game_code:null,status:active?'live':'standby',serverTime:Date.now()});
}
