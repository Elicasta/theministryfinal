import { clean, verifyDisplay, getGameByCode, corsNoStore } from '../../lib/game-db.js';

function currentQuestion(row){
  const qs=Array.isArray(row.question_pack?.questions)?row.question_pack.questions:[];
  return qs.find(q=>q.id===row.state?.activeQuestionId)||null;
}
function voiceText(row,cue){
  const state=row.state||{},q=currentQuestion(row),teams=Array.isArray(state.teams)?state.teams:[];
  const team=id=>teams.find(t=>t.id===id);
  if(cue==='ready')return 'Voice host online. Bible Battle is ready.';
  if(cue==='question'&&q)return `${q.category}. For ${q.points} points. ${q.prompt}`;
  if(cue==='correct')return `Correct! ${team(state.lastResult?.teamId)?.name||'That team'} earns ${state.lastResult?.points||0} points.`;
  if(cue==='wrong')return 'Not quite. The steal is open.';
  if(cue==='steal')return 'Steal opportunity. Other teams, get ready to buzz.';
  if(cue==='winner'){
    const ids=state.winnerTeamIds||[],names=ids.map(id=>team(id)?.name).filter(Boolean);
    return names.length===1?`${names[0]} wins Bible Battle!`:`We have co-champions: ${names.join(' and ')}!`;
  }
  if(cue==='final')return `Final Showdown. The category is ${row.question_pack?.final?.category||'The Bible'}.`;
  return '';
}
export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.OPENAI_API_KEY;
  if(!key)return res.status(503).json({error:'AI voice is not configured'});
  const body=req.body||{},code=clean(body.code,12).toUpperCase(),token=clean(body.displayToken,200),cue=clean(body.cue,30).toLowerCase();
  if(!code||!token||!(await verifyDisplay(code,token)))return res.status(401).json({error:'Display authorization required'});
  const {row}=await getGameByCode(code);if(!row)return res.status(404).json({error:'Game not found'});
  if(row.state?.settings?.voice!==true)return res.status(409).json({error:'AI voice is disabled for this game'});
  const input=voiceText(row,cue);if(!input)return res.status(400).json({error:'Voice cue is unavailable'});
  try{
    const r=await fetch('https://api.openai.com/v1/audio/speech',{
      method:'POST',
      headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({
        model:process.env.OPENAI_TTS_MODEL||'gpt-4o-mini-tts',
        voice:process.env.OPENAI_GAME_VOICE||'cedar',
        input,
        instructions:'Energetic, warm game-show host. Crisp pacing, competitive but friendly. Do not sound sarcastic.'
      })
    });
    if(!r.ok){const t=await r.text().catch(()=>'');return res.status(502).json({error:'Voice generation failed',details:t.slice(0,300)})}
    const bytes=Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type',r.headers.get('content-type')||'audio/mpeg');
    return res.status(200).send(bytes);
  }catch(e){return res.status(502).json({error:e?.message||'Voice generation failed'})}
}
