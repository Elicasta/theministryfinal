import crypto from 'node:crypto';

export function clean(value,max=2000){
  return String(value??'').replace(/\s+/g,' ').trim().slice(0,max);
}
export function hashToken(value){
  return crypto.createHash('sha256').update(String(value||'')).digest('hex');
}
export function randomToken(bytes=24){
  return crypto.randomBytes(bytes).toString('base64url');
}
export function randomCode(len=6){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes=crypto.randomBytes(len);
  return Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');
}
export function gameEnv(){
  const url=process.env.SUPABASE_URL||'';
  const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';
  return {url,key,ready:Boolean(url&&key)};
}
export async function db(path,opts={}){
  const {url,key,ready}=gameEnv();
  if(!ready) return {ok:false,status:503,text:'Game database is not configured',json:null};
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),opts.timeoutMs||5500);
  try{
    const res=await fetch(url+'/rest/v1/'+path,{
      ...opts,
      signal:controller.signal,
      headers:{
        apikey:key,
        Authorization:'Bearer '+key,
        'Content-Type':'application/json',
        ...(opts.headers||{})
      }
    });
    const text=await res.text().catch(()=>'');
    let json=null;
    try{json=text?JSON.parse(text):null}catch(e){}
    return {ok:res.ok,status:res.status,text,json};
  }catch(e){
    if(e?.name==='AbortError')return {ok:false,status:504,text:'Database request timed out',json:null};
    return {ok:false,status:500,text:e?.message||'Database request failed',json:null};
  }finally{clearTimeout(timer)}
}
export async function verifyHost(code,token){
  if(!code||!token)return false;
  const q=new URLSearchParams({select:'game_code,token_hash',game_code:'eq.'+clean(code,12),limit:'1'});
  const r=await db('game_hosts?'+q.toString());
  const row=Array.isArray(r.json)?r.json[0]:null;
  return Boolean(r.ok&&row&&crypto.timingSafeEqual(Buffer.from(row.token_hash),Buffer.from(hashToken(token))));
}
export async function verifyPlayer(code,playerId,token){
  if(!code||!playerId||!token)return false;
  const q=new URLSearchParams({select:'game_code,player_id,token_hash',game_code:'eq.'+clean(code,12),player_id:'eq.'+clean(playerId,80),limit:'1'});
  const r=await db('game_player_tokens?'+q.toString());
  const row=Array.isArray(r.json)?r.json[0]:null;
  return Boolean(r.ok&&row&&crypto.timingSafeEqual(Buffer.from(row.token_hash),Buffer.from(hashToken(token))));
}
export function corsNoStore(res){
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');
}

export async function broadcastGame(code,event,payload){
  const {url,key,ready}=gameEnv();
  if(!ready)return false;
  try{
    const r=await fetch(url+'/realtime/v1/api/broadcast/game:'+encodeURIComponent(clean(code,12))+'/events/'+encodeURIComponent(clean(event,60)),{
      method:'POST',
      headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify(payload||{})
    });
    return r.ok;
  }catch(e){return false}
}
export function publicGameState(row,players=[],role='public'){
  const state=row?.state&&typeof row.state==='object'?structuredClone(row.state):{};
  const pack=row?.question_pack&&typeof row.question_pack==='object'?row.question_pack:{};
  const questions=Array.isArray(pack.questions)?pack.questions:[];
  const active=questions.find(q=>q.id===state.activeQuestionId)||null;
  const safeQuestion=active?{
    id:active.id,category:active.category,points:active.points,type:active.type,
    prompt:active.prompt,choices:Array.isArray(active.choices)?active.choices:[],
    reference:(state.phase==='reveal'||state.phase==='result'||state.phase==='winner')?active.reference||'':'',
    explanation:(state.phase==='reveal'||state.phase==='result'||state.phase==='winner')?active.explanation||'':'',
    correctAnswer:(state.phase==='reveal'||state.phase==='result'||role==='host')?active.correctAnswer||'':''
  }:null;
  const teams=Array.isArray(state.teams)?state.teams:[];
  return {
    ok:true,gameCode:row?.game_code||'',version:row?.version||0,status:row?.status||state.phase||'lobby',
    state:{...state,activeQuestion:safeQuestion},
    teams,
    players:(players||[]).map(p=>({playerId:p.player_id,name:p.name,teamId:p.team_id,isCaptain:!!p.is_captain,connected:!!p.connected,lastSeenAt:p.last_seen_at}))
  };
}
