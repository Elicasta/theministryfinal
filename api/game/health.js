import { gameEnv, db, corsNoStore } from '../../lib/game-db.js';

export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const env=gameEnv();
  let databaseReachable=false,schemaReady=false;
  if(env.ready){
    const r=await db('game_sessions?select=id&limit=1',{method:'GET',timeoutMs:4000});
    databaseReachable=r.ok;
    schemaReady=r.ok;
  }
  return res.status(databaseReachable?200:503).json({
    ok:databaseReachable&&schemaReady,
    databaseConfigured:env.ready,
    databaseReachable,
    schemaReady,
    openAIConfigured:Boolean(process.env.OPENAI_API_KEY),
    engine:'ministry-games-v1'
  });
}
