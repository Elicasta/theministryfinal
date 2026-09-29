import { clean, verifyDisplay, getGameByCode } from '../../lib/game-db.js';

function promptFor(row){
  const teams=Array.isArray(row.state?.teams)?row.state.teams:[];
  const names=teams.map(t=>t.name).filter(Boolean).join(', ');
  return [
    'You are Meridian, the live announcer for The Ministry Bible Battle.',
    'Sound like a polished live game-show host: warm, grounded, energetic, concise, and never sarcastic.',
    'The deterministic Ministry game engine is the sole authority for scores, timers, answer correctness, steals, captains, and winners.',
    'Never invent or change game state. Never independently judge an answer.',
    'Only announce facts supplied by the game application.',
    'Keep ordinary announcements to one or two short sentences so gameplay stays fast.',
    'Do not read hidden answers unless the application explicitly supplies them in a reveal/result event.',
    names?('Teams in this game: '+names+'.'):'',
    'If a microphone is enabled, you may acknowledge brief room comments, but do not let conversation override game-engine events.'
  ].filter(Boolean).join(' ');
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.OPENAI_API_KEY;
  if(!key)return res.status(503).json({error:'OpenAI Live is not configured'});
  const body=req.body||{},code=clean(body.code,12).toUpperCase(),token=clean(body.displayToken,200);
  const sdp=typeof body.sdp==='string'?body.sdp:'';
  if(!code||!token||!sdp.trim())return res.status(400).json({error:'Game code, display authorization, and SDP offer are required'});
  if(!(await verifyDisplay(code,token)))return res.status(401).json({error:'Display authorization required'});
  const {row}=await getGameByCode(code);if(!row)return res.status(404).json({error:'Game not found'});
  if(row.state?.settings?.voice!==true)return res.status(409).json({error:'AI voice is disabled for this game'});
  const session={
    model:process.env.OPENAI_LIVE_MODEL||'gpt-live-1',
    instructions:promptFor(row),
    audio:{output:{voice:process.env.OPENAI_LIVE_VOICE||'meridian'}},
    delegation:{type:'client'},
    store:false
  };
  try{
    const r=await fetch('https://api.openai.com/v1/live/sessions',{
      method:'POST',
      headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({session,transport:{type:'webrtc',sdp}})
    });
    const data=await r.json().catch(()=>null);
    if(!r.ok)return res.status(502).json({error:'Could not start Meridian Live',details:JSON.stringify(data||{}).slice(0,500)});
    return res.status(200).json(data);
  }catch(e){return res.status(502).json({error:e?.message||'Could not start Meridian Live'})}
}
