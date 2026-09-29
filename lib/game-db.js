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
  const q=new URLSearchParams({select:'game_code,host_token_hash',game_code:'eq.'+clean(code,12),limit:'1'});
  const r=await db('game_sessions?'+q.toString());
  const row=Array.isArray(r.json)?r.json[0]:null;
  const a=Buffer.from(row?.host_token_hash||''),b=Buffer.from(hashToken(token));
  return Boolean(r.ok&&row&&a.length===b.length&&crypto.timingSafeEqual(a,b));
}
export async function verifyDisplay(code,token){
  if(!code||!token)return false;
  const q=new URLSearchParams({select:'game_code,display_token_hash',game_code:'eq.'+clean(code,12),limit:'1'});
  const r=await db('game_sessions?'+q.toString());
  const row=Array.isArray(r.json)?r.json[0]:null;
  const a=Buffer.from(row?.display_token_hash||''),b=Buffer.from(hashToken(token));
  return Boolean(r.ok&&row&&a.length===b.length&&crypto.timingSafeEqual(a,b));
}
export async function verifyPlayer(code,playerId,token){
  if(!code||!playerId||!token)return false;
  const gameQ=new URLSearchParams({select:'id',game_code:'eq.'+clean(code,12),limit:'1'});
  const gameR=await db('game_sessions?'+gameQ.toString());
  const game=Array.isArray(gameR.json)?gameR.json[0]:null;
  if(!game)return false;
  const q=new URLSearchParams({select:'player_id,token_hash',game_id:'eq.'+game.id,player_id:'eq.'+clean(playerId,80),limit:'1'});
  const r=await db('game_players?'+q.toString());
  const row=Array.isArray(r.json)?r.json[0]:null;
  const a=Buffer.from(row?.token_hash||''),b=Buffer.from(hashToken(token));
  return Boolean(r.ok&&row&&a.length===b.length&&crypto.timingSafeEqual(a,b));
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
export function publicGameState(row,players=[],role='public',submissions=[],privateTeamId=null){
  const state=row?.state&&typeof row.state==='object'?structuredClone(row.state):{};
  const pack=row?.question_pack&&typeof row.question_pack==='object'?row.question_pack:{};
  const questions=Array.isArray(pack.questions)?pack.questions:[];
  const active=questions.find(q=>q.id===state.activeQuestionId)||null;
  const reveal=['reveal','winner','ended'].includes(state.phase)||(state.phase==='result'&&state.resultNextPhase!=='steal_buzz');
  const safeQuestion=active?{
    id:active.id,category:active.category,points:active.points,type:active.type,
    prompt:active.prompt,choices:Array.isArray(active.choices)?active.choices:[],
    reference:(reveal||role==='host')?active.reference||'':'',
    explanation:(reveal||role==='host')?active.explanation||'':'',
    correctAnswer:(reveal||role==='host')?active.correctAnswer||'':''
  }:null;
  const teams=Array.isArray(state.teams)?state.teams:[];
  if(role!=='host'){
    const own=privateTeamId?String(privateTeamId):null;
    state.finalWagers=own&&state.finalWagers?.[own]!==undefined?{[own]:state.finalWagers[own]}:{};
    state.finalAnswers=own&&state.finalAnswers?.[own]!==undefined?{[own]:state.finalAnswers[own]}:{};
    state.finalJudged=state.phase==='winner'||state.phase==='ended'?(state.finalJudged||{}):{};
    if(state.lastResult&&!['reveal','result','winner','ended'].includes(state.phase)){
      state.lastResult={correct:state.lastResult.correct,teamId:state.lastResult.teamId,points:state.lastResult.points||0,nonce:state.lastResult.nonce||0};
    }
  }
  const board=questions.map(q=>role==='host'?{
    id:q.id,category:q.category,points:q.points,type:q.type,prompt:q.prompt,
    choices:Array.isArray(q.choices)?q.choices:[],correctAnswer:q.correctAnswer||'',
    acceptedAnswers:Array.isArray(q.acceptedAnswers)?q.acceptedAnswers:[],
    reference:q.reference||'',explanation:q.explanation||''
  }:{id:q.id,category:q.category,points:q.points,type:q.type});
  const safeSubmissions=(role==='host'||role==='player')
    ? (submissions||[]).map(x=>({playerId:x.player_id,teamId:x.team_id,answer:x.answer,isCaptain:!!x.is_captain,createdAt:x.created_at}))
    : [];
  return {
    ok:true,gameCode:row?.game_code||'',version:row?.version||0,status:row?.status||state.phase||'lobby',
    state:{...state,activeQuestion:safeQuestion},
    pack:{
      id:pack.id||'',
      title:pack.title||'Bible Showdown',
      categories:Array.isArray(pack.categories)?pack.categories:[],
      board,
      final:role==='host'?pack.final||null:(state.phase?.startsWith('final')||state.phase==='winner'?{
        id:pack.final?.id||'final',category:pack.final?.category||'Final Round',
        prompt:['final_answer','final_judging','winner','ended'].includes(state.phase)?pack.final?.prompt||'':'',
        choices:Array.isArray(pack.final?.choices)?pack.final.choices:[],
        correctAnswer:['winner','ended'].includes(state.phase)?pack.final?.correctAnswer||'':'',
        reference:['winner','ended'].includes(state.phase)?pack.final?.reference||'':'',
        explanation:state.phase==='winner'?pack.final?.explanation||'':''
      }:null)
    },
    teams,
    players:(players||[]).map(p=>({playerId:p.player_id,name:p.name,teamId:p.team_id,isCaptain:!!p.is_captain,connected:!!p.connected,lastSeenAt:p.last_seen_at})),
    submissions:safeSubmissions
  };
}

export async function getGameByCode(code){
  const q=new URLSearchParams({select:'*',game_code:'eq.'+clean(code,12).toUpperCase(),limit:'1'});
  const r=await db('game_sessions?'+q.toString());
  return {request:r,row:Array.isArray(r.json)?r.json[0]:null};
}
export async function getGamePlayers(gameId){
  const q=new URLSearchParams({select:'*',game_id:'eq.'+gameId,order:'joined_at.asc'});
  const r=await db('game_players?'+q.toString());
  return r.ok&&Array.isArray(r.json)?r.json:[];
}
export async function getQuestionSubmissions(gameId,questionId){
  if(!gameId||!questionId)return [];
  const q=new URLSearchParams({select:'*',game_id:'eq.'+gameId,question_id:'eq.'+clean(questionId,120),order:'created_at.asc'});
  const r=await db('game_submissions?'+q.toString());
  return r.ok&&Array.isArray(r.json)?r.json:[];
}
export async function saveGameState(row,nextState,status){
  const q=new URLSearchParams({game_code:'eq.'+row.game_code,version:'eq.'+String(row.version),select:'*'});
  const r=await db('game_sessions?'+q.toString(),{
    method:'PATCH',
    headers:{Prefer:'return=representation'},
    body:JSON.stringify({state:nextState,status:status||nextState.phase||row.status})
  });
  return {request:r,row:Array.isArray(r.json)?r.json[0]:null};
}
export async function recordGameEvent(row,kind,{actorType='system',playerId=null,teamId=null,payload={}}={}){
  return db('game_events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({
    game_id:row.id,game_code:row.game_code,kind:clean(kind,80),actor_type:clean(actorType,30),
    player_id:playerId||null,team_id:teamId||null,payload
  })});
}
