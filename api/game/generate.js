import {clean,verifyHost,getGameByCode,broadcastGame,corsNoStore,randomToken} from '../../lib/game-db.js';
import {updateRoom,packLibrary,builtins} from '../../lib/game-rounds.js';
import {themes,generationRequest,validatePack,extractOutput} from '../../lib/game-generation.js';

export const maxDuration=60;
const pending=job=>['starting','queued','in_progress'].includes(job?.status);
const summary=job=>job?{status:job.status,startedAt:job.startedAt,packId:job.packId,error:job.error,theme:job.theme}: {status:'idle'};
async function openAI(path,body){
  const response=await fetch('https://api.openai.com/v1/responses'+path,{
    method:body?'POST':'GET',signal:AbortSignal.timeout(25000),
    headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},
    ...(body?{body:JSON.stringify(body)}:{})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error?.message||'Question service unavailable ('+response.status+'). Please retry.');
  return data;
}
export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const body=req.body||{},code=clean(body.code,12).toUpperCase();
  if(!await verifyHost(code,body.hostToken))return res.status(401).json({error:'Host authorization required'});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'OpenAI question generation is not configured'});
  let job;
  try{
    let {row}=await getGameByCode(code);job=row.state.generation;
    if(body.operation==='status'){
      if(!pending(job))return res.status(200).json({ok:true,generation:summary(job)});
      if(Date.now()-Date.parse(job.startedAt)>15*60*1000)throw new Error('Generation expired. Your packs are safe; generate a new pack.');
      if(!job.responseId){
        if(Date.now()-Date.parse(job.startedAt)>60000)throw new Error('Generation did not start. Please retry.');
        return res.status(200).json({ok:true,generation:summary(job)});
      }
      // Transient polling failures leave the resumable job intact.
      let data;try{data=await openAI('/'+encodeURIComponent(job.responseId))}catch(e){return res.status(503).json({error:e.message,generation:summary(job)})}
      if(['queued','in_progress'].includes(data.status))return res.status(200).json({ok:true,generation:{...summary(job),status:data.status}});
      if(data.status!=='completed')throw new Error(data.error?.message||'Question generation '+data.status+'. Please retry.');
      const pack=validatePack(JSON.parse(extractOutput(data)),job.theme,'ai-'+job.id);
      row=await updateRoom(code,current=>{
        if(current.state.generation?.id!==job.id||current.state.generation.status==='completed')return null;
        const saved=packLibrary(current.question_pack).filter(p=>!builtins.some(b=>b.id===p.id)&&p.id!==pack.id).slice(-7);
        return {question_pack:{...current.question_pack,savedPacks:[...saved,pack]},state:{...current.state,generation:{...current.state.generation,status:'completed',packId:pack.id}}};
      });
      broadcastGame(code,'state',{reason:'PACK_GENERATED'}).catch(()=>{});
      return res.status(200).json({ok:true,generation:summary(row.state.generation)});
    }
    if(body.operation&&body.operation!=='start')return res.status(400).json({error:'Unknown generation operation'});
    const id=randomToken(10),theme=Object.hasOwn(themes,body.theme)?body.theme:'apostolic';
    const difficulty=['easy','medium','hard','expert','mixed'].includes(body.difficulty)?body.difficulty:'mixed';
    row=await updateRoom(code,current=>{
      const existing=current.state.generation;
      if(pending(existing)&&Date.now()-Date.parse(existing.startedAt)<15*60*1000)return null;
      if(['winner','ended'].includes(current.state.phase))throw Object.assign(new Error('Create a new game before generating a pack.'),{status:409});
      return {state:{...current.state,generation:{id,status:'starting',theme,difficulty,startedAt:new Date().toISOString()}}};
    });
    job=row.state.generation;
    if(job.id!==id)return res.status(200).json({ok:true,generation:summary(job)});
    const data=await openAI('',generationRequest(theme,difficulty,packLibrary(row.question_pack).flatMap(p=>p.questions.map(q=>q.prompt))));
    if(!data.id)throw new Error('Question service returned no job. Please retry.');
    row=await updateRoom(code,current=>current.state.generation?.id===id?{state:{...current.state,generation:{...job,responseId:data.id,status:'queued'}}}:null);
    return res.status(202).json({ok:true,generation:summary(row.state.generation)});
  }catch(e){
    const error=['TimeoutError','AbortError'].includes(e.name)?'Question service took too long to respond. Please retry.':e.message||'Generation failed';
    if(job?.id)await updateRoom(code,current=>current.state.generation?.id===job.id&&pending(current.state.generation)?{state:{...current.state,generation:{...current.state.generation,status:'failed',error}}}:null).catch(()=>{});
    return res.status(e.status||502).json({error});
  }
}
