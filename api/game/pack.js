import {clean,verifyHost,corsNoStore,broadcastGame} from '../../lib/game-db.js';
import {updateRoom,selectRound} from '../../lib/game-rounds.js';
export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const body=req.body||{},code=clean(body.code,12).toUpperCase();
  if(!await verifyHost(code,body.hostToken))return res.status(401).json({error:'Host authorization required'});
  try{
    await updateRoom(code,row=>selectRound(row,clean(body.packId,100)));
    broadcastGame(code,'state',{reason:'ROUND_CHANGED'}).catch(()=>{});
    return res.status(200).json({ok:true});
  }catch(e){return res.status(e.status||502).json({error:e.message})}
}
