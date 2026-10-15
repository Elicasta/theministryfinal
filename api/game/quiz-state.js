import {translatePublicQuestion,translateResponseStats} from '../../lib/quiz-es.js';
import {authenticatedPlayer,playerCredentials,setPlayerCookie} from '../../lib/game-player-session.js';
import {clean,db,verifyHost,corsNoStore} from '../../lib/game-db.js';
import {expectedQuizEntries,expectedQuizUnits,entryKeyForPlayer,publicQuestion,publicReviewQuestion,SOLO_TEAM_ID} from '../../lib/quiz-engine.js';

const resultPhases=new Set(['quiz_results','quiz_review','quiz_complete']);
const isSolo=t=>t?.id===SOLO_TEAM_ID||t?.isSolo;
const playerView=(p,teams)=>({
  playerId:p.player_id,name:p.name,teamId:p.team_id,language:p.preferred_language==='es'?'es':'en',
  participation:p.team_id===SOLO_TEAM_ID?'solo':'team',
  isCaptain:teams.find(t=>t.id===p.team_id)?.captainPlayerId===p.player_id,
  connected:!!p.connected&&Date.now()-Date.parse(p.last_seen_at)<45000
});
function rosterFor(state,players){
  if(Array.isArray(state.quizRoster)&&state.quizRoster.length)return state.quizRoster;
  if(state.quizMode==='mixed')return expectedQuizEntries(players,state.teams||[]);
  return expectedQuizUnits(state.quizMode,players,state.teams||[]).map(key=>({key,mode:state.quizMode==='team'?'team':'solo',teamId:state.quizMode==='team'?key:players.find(p=>p.player_id===key)?.team_id,playerIds:state.quizMode==='team'?players.filter(p=>p.team_id===key).map(p=>p.player_id):[key]}));
}
function progress(state,players){
  const roster=rosterFor(state,players),locks=state.quizLocks||{};
  const solo=roster.filter(e=>e.mode==='solo');const teams=roster.filter(e=>e.mode==='team');
  return {
    expected:roster.length,submitted:roster.filter(e=>!!locks[e.key]).length,
    solo:{expected:solo.length,submitted:solo.filter(e=>!!locks[e.key]).length},
    teams:(state.teams||[]).filter(t=>!isSolo(t)).map(t=>({
      teamId:t.id,expected:teams.some(e=>e.teamId===t.id)?1:0,
      submitted:teams.some(e=>e.teamId===t.id&&!!locks[e.key])?1:0
    }))
  };
}
function resultsView(results){
  if(!results)return null;
  const safeEntry=e=>({name:e.name,teamId:e.teamId||null,color:e.color||null,correct:e.correct,possible:e.possible,percent:e.percent,peopleRepresented:e.peopleRepresented});
  return {mode:results.mode,submittedUnits:results.submittedUnits,totalUnits:results.totalUnits,
    countedUnits:results.countedUnits,representedPeople:results.representedPeople,
    overallPercent:results.overallPercent,classCorrect:results.classCorrect,classPossible:results.classPossible,
    breakdown:results.breakdown||null,
    soloResults:(results.soloResults||[]).map(safeEntry),teamResults:(results.teamResults||[]).map(safeEntry)};
}
function reviewView(state,pack,isHost,language='en'){
  if(state.phase!=='quiz_review')return null;
  const q=pack.questions?.[state.reviewIndex]||null;
  if(!q)return null;
  const stage=state.reviewStage||'responses';
  const stat=state.quizResults?.questionStats?.find(x=>x.questionId===q.id);
  const showResponses=isHost||stage==='responses'||stage==='answer'||stage==='explanation'||stage==='application';
  return {
    index:state.reviewIndex,total:pack.questions.length,stage,
    question:language==='es'?translatePublicQuestion(publicReviewQuestion(q,stage,isHost)):publicReviewQuestion(q,stage,isHost),
    stats:!stat?null:{
      total:stat.total,answered:stat.answered,unanswered:stat.unanswered,
      // The public review response stage must not disclose the key via the correct percentage.
      ...(isHost||stage!=='responses'?{correctPercent:stat.correctPercent}:{}),
      type:stat.type,responses:showResponses?(language==='es'?translateResponseStats(q,stat).responses:stat.responses):[],
      fillResponses:showResponses?(language==='es'?translateResponseStats(q,stat).fillResponses:(stat.fillResponses||[])):[]
    }
  };
}
export default async function handler(req,res){
  corsNoStore(res);
  if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed'});
  const body=req.method==='POST'?req.body||{}:req.query||{};
  const code=clean(body.code,12).toUpperCase();
  if(!code)return res.status(400).json({error:'Quiz code required'});
  const gq=new URLSearchParams({select:'*',game_code:'eq.'+code,limit:'1'});
  const gr=await db('game_sessions?'+gq.toString()),game=Array.isArray(gr.json)?gr.json[0]:null;
  if(!gr.ok||!game)return res.status(404).json({error:'Quiz not found'});
  if(game.state?.mode!=='quiz')return res.status(409).json({error:'This is a Bible Battle room, not a quiz'});
  let role='public',auth=null;
  const credentials=req.method==='POST'&&!body.hostToken?playerCredentials(req,body,code):{};
  if(body.hostToken&&await verifyHost(code,body.hostToken))role='host';
  else if(req.method==='POST'){
    auth=await authenticatedPlayer(req,body,code);
    if(auth){role='player';setPlayerCookie(res,code,auth)}
  }
  if((body.hostToken||body.playerToken||credentials.cookie||credentials.invalid)&&role==='public')return res.status(401).json({error:'Quiz authentication expired'});
  const pq=new URLSearchParams({select:'player_id,name,team_id,is_captain,connected,last_seen_at,preferred_language',game_id:'eq.'+game.id,order:'joined_at.asc'});
  const pr=await db('game_players?'+pq.toString()),players=pr.ok&&Array.isArray(pr.json)?pr.json:[];
  const teams=game.state.teams||[],pack=game.question_pack||{},questions=Array.isArray(pack.questions)?pack.questions:[];
  const me=role==='player'?players.find(p=>p.player_id===auth.playerId):null;
  const playerLanguage=me?.preferred_language==='es'?'es':'en';
  let submissions=[];
  if(role!=='public'){
    const sq=new URLSearchParams({select:'question_id,player_id,team_id,answer,created_at',game_id:'eq.'+game.id,order:'created_at.asc'});
    const sr=await db('game_submissions?'+sq.toString());
    submissions=sr.ok&&Array.isArray(sr.json)?sr.json:[];
  }
  const myUnit=me?(game.state.quizMode==='mixed'?entryKeyForPlayer(me):game.state.quizMode==='team'?me.team_id:me.player_id):'';
  // A team member may see their team's shared answers. No answer keys are sent in an active quiz.
  const myAnswers=me?submissions.filter(a=>game.state.quizMode==='mixed'
    ? (me.team_id===SOLO_TEAM_ID?a.player_id===me.player_id:a.team_id===me.team_id)
    : (game.state.quizMode==='team'?a.team_id===me.team_id:a.player_id===me.player_id)) : [];
  return res.status(200).json({
    ok:true,gameCode:game.game_code,version:game.version,serverTime:Date.now(),role,
    quiz:{id:pack.id,title:role==='player'&&playerLanguage==='es'?'Mateo 11 | Expectativas, revelación y responsabilidad':pack.title,
      scripture:role==='player'&&playerLanguage==='es'?'Mateo 11 (RVR1960)':pack.scripture,questionCount:questions.length,
      // Host may manage the answer key privately. Clients only receive the prompt and options.
      questions:role==='host'?questions:questions.map(q=>role==='player'&&playerLanguage==='es'?translatePublicQuestion(publicQuestion(q)):publicQuestion(q))},
    state:{mode:'quiz',phase:game.state.phase,quizMode:game.state.quizMode,teams,
      progress:progress(game.state,players),quizStartedAt:game.state.quizStartedAt,
      quizFinishedAt:game.state.quizFinishedAt,quizHistorySavedAt:game.state.quizHistorySavedAt||null,reviewIndex:game.state.reviewIndex||0,
      reviewStage:game.state.reviewStage||'responses',locked:!!game.state.quizLocks?.[myUnit],
      results:resultPhases.has(game.state.phase)?resultsView(game.state.quizResults):null,
      review:reviewView(game.state,pack,role==='host',role==='player'?playerLanguage:'en')},
    players:role==='host'?players.map(p=>playerView(p,teams)):[],
    me:me?playerView(me,teams):null,
    answers:role==='host'?submissions.map(a=>({questionId:a.question_id,teamId:a.team_id,playerId:a.player_id,answer:a.answer}))
      :myAnswers.map(a=>{
        const original=questions.find(q=>q.id===a.question_id);
        const translated=playerLanguage==='es'&&original?translatePublicQuestion(publicQuestion(original)):null;
        const position=original?.choices?.indexOf(a.answer)??-1;
        return {questionId:a.question_id,answer:position>=0&&translated?.choices?.[position]?translated.choices[position]:a.answer};
      }),
  });
}