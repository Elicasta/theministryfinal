import {authenticatedPlayer,playerCredentials,setPlayerCookie} from '../../lib/game-player-session.js';
import {clean,db,verifyHost,corsNoStore} from '../../lib/game-db.js';
import {expectedQuizUnits} from '../../lib/quiz-engine.js';

const phasesWithResults=new Set(['quiz_results','quiz_review','quiz_complete']);

function safePlayer(p,teams){
  return {
    playerId:p.player_id,name:p.name,teamId:p.team_id,
    isCaptain:teams.find(t=>t.id===p.team_id)?.captainPlayerId===p.player_id,
    connected:!!p.connected&&Date.now()-Date.parse(p.last_seen_at)<45000,lastSeenAt:p.last_seen_at
  };
}
function progressFor(state,players){
  const units=expectedQuizUnits(state.quizMode,players,state.teams||[]);
  const locks=state.quizLocks||{};
  const submitted=units.filter(id=>locks[id]);
  return {
    expected:units.length,submitted:submitted.length,
    teams:(state.teams||[]).map(t=>{
      const teamPlayers=players.filter(p=>p.team_id===t.id);
      const expected=state.quizMode==='team'?(teamPlayers.length?1:0):teamPlayers.length;
      const done=state.quizMode==='team'?(locks[t.id]?1:0):teamPlayers.filter(p=>locks[p.player_id]).length;
      return {teamId:t.id,expected,submitted:done};
    })
  };
}
function reviewPayload(state,pack,role){
  if(state.phase!=='quiz_review')return null;
  const q=pack.questions?.[state.reviewIndex]||null;if(!q)return null;
  const stat=state.quizResults?.questionStats?.find(x=>x.questionId===q.id)||null;
  const stage=state.reviewStage||'responses';
  const out={
    index:state.reviewIndex,total:pack.questions.length,stage,
    question:{id:q.id,section:q.section,category:q.category,prompt:q.prompt,choices:q.choices},
    stats:stat?{total:stat.total,answered:stat.answered,unanswered:stat.unanswered,correctPercent:stat.correctPercent,responses:stat.responses}:null
  };
  if(role==='host'||['answer','explanation','application'].includes(stage)){
    out.question.correctAnswer=q.correctAnswer;out.question.reference=q.reference;
  }
  if(role==='host'||['explanation','application'].includes(stage))out.question.explanation=q.explanation;
  if(role==='host'||stage==='application')out.question.application=q.application;
  return out;
}

export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const body=req.method==='POST'?(req.body||{}):(req.query||{});
  const code=clean(body.code,12).toUpperCase();
  if(!code)return res.status(400).json({error:'Quiz code required'});
  const gq=new URLSearchParams({select:'*',game_code:'eq.'+code,limit:'1'});
  const gr=await db('game_sessions?'+gq.toString());
  const game=Array.isArray(gr.json)?gr.json[0]:null;
  if(!gr.ok||!game)return res.status(404).json({error:'Quiz not found'});
  if(game.state?.mode!=='quiz')return res.status(409).json({error:'This room is a Bible Battle session, not a quiz'});

  let role='public',auth=null;
  const credentials=req.method==='POST'&&!body.hostToken?playerCredentials(req,body,code):{};
  if(body.hostToken&&await verifyHost(code,body.hostToken))role='host';
  else if(req.method==='POST'){
    auth=await authenticatedPlayer(req,body,code);
    if(auth){role='player';setPlayerCookie(res,code,auth)}
  }
  if((body.hostToken||body.playerToken||credentials.cookie||credentials.invalid)&&role==='public')return res.status(401).json({error:'Session expired. Please reconnect.'});

  const pq=new URLSearchParams({select:'player_id,name,team_id,is_captain,connected,last_seen_at',game_id:'eq.'+game.id,order:'joined_at.asc'});
  const pr=await db('game_players?'+pq.toString());
  const players=pr.ok&&Array.isArray(pr.json)?pr.json:[];
  const teams=Array.isArray(game.state?.teams)?game.state.teams:[];
  const pack=game.question_pack||{};
  const questions=Array.isArray(pack.questions)?pack.questions:[];
  let submissions=[];
  if(role==='host'||role==='player'){
    const sq=new URLSearchParams({select:'question_id,player_id,team_id,answer,is_captain,created_at',game_id:'eq.'+game.id,order:'created_at.asc'});
    const sr=await db('game_submissions?'+sq.toString());
    submissions=sr.ok&&Array.isArray(sr.json)?sr.json:[];
  }
  const me=role==='player'?players.find(p=>p.player_id===auth.playerId):null;
  const myUnit=me?(game.state.quizMode==='team'?me.team_id:me.player_id):null;
  const myRows=me?submissions.filter(x=>game.state.quizMode==='team'?x.team_id===me.team_id:x.player_id===me.player_id):[];
  const revealResults=phasesWithResults.has(game.state.phase);
  const results=revealResults&&game.state.quizResults?{
    mode:game.state.quizResults.mode,
    submittedUnits:game.state.quizResults.submittedUnits,totalUnits:game.state.quizResults.totalUnits,
    countedUnits:game.state.quizResults.countedUnits,overallPercent:game.state.quizResults.overallPercent,
    classCorrect:game.state.quizResults.classCorrect,classPossible:game.state.quizResults.classPossible,
    teamResults:game.state.quizResults.teamResults
  }:null;
  const safeQuestions=role==='host'
    ? questions
    : questions.map(q=>({id:q.id,section:q.section,category:q.category,prompt:q.prompt,choices:q.choices}));

  return res.status(200).json({
    ok:true,serverTime:Date.now(),gameCode:game.game_code,version:game.version,
    state:{
      mode:'quiz',phase:game.state.phase,quizMode:game.state.quizMode,
      quizStartedAt:game.state.quizStartedAt,quizFinishedAt:game.state.quizFinishedAt,
      reviewIndex:game.state.reviewIndex||0,reviewStage:game.state.reviewStage||'responses',
      teams,progress:progressFor(game.state,players),results,
      review:reviewPayload(game.state,pack,role),
      locked:myUnit?!!game.state.quizLocks?.[myUnit]:false
    },
    quiz:{id:pack.id,title:pack.title,scripture:pack.scripture,questionCount:questions.length,questions:safeQuestions},
    players:role==='public'?[]:players.map(p=>safePlayer(p,teams)),
    answers:role==='host'?submissions.map(x=>({questionId:x.question_id,playerId:x.player_id,teamId:x.team_id,answer:x.answer,isCaptain:!!x.is_captain}))
      :myRows.map(x=>({questionId:x.question_id,answer:x.answer,teamId:x.team_id})),
    role,
    me:me?safePlayer(me,teams):null
  });
}
