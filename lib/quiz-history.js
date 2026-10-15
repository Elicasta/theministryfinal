import {db} from './game-db.js';
import {gradeAnswer,expectedQuizEntries,SOLO_TEAM_ID} from './quiz-engine.js';

function rosterFor(state,players){
  if(Array.isArray(state.quizRoster)&&state.quizRoster.length)return state.quizRoster;
  if(state.quizMode==='mixed')return expectedQuizEntries(players,state.teams||[]);
  if(state.quizMode==='team'){
    return (state.teams||[]).filter(t=>t.id!==SOLO_TEAM_ID&&players.some(p=>p.team_id===t.id))
      .map(t=>({key:t.id,mode:'team',teamId:t.id,playerIds:players.filter(p=>p.team_id===t.id).map(p=>p.player_id)}));
  }
  return players.map(p=>({key:p.player_id,mode:'solo',teamId:p.team_id,playerId:p.player_id,playerIds:[p.player_id]}));
}
function savedAnswer(submissions,entry,questionId){
  const rows=submissions.filter(s=>s.question_id===questionId &&
    (entry.mode==='team'?s.team_id===entry.teamId:s.player_id===(entry.playerId||entry.playerIds?.[0])));
  rows.sort((a,b)=>Date.parse(b.created_at||0)-Date.parse(a.created_at||0));
  return rows[0]||null;
}
export function buildQuizArchive(row,players=[],submissions=[]){
  if(row?.state?.mode!=='quiz')return [];
  const state=row.state, pack=row.question_pack||{},questions=pack.questions||[],locks=state.quizLocks||{};
  const teams=state.teams||[],participants=new Map(players.map(p=>[p.player_id,p]));
  const rows=[];
  for(const entry of rosterFor(state,players)){
    if(!locks[entry.key])continue; // Never invent an attempt for a participant who did not submit.
    const saved=questions.map((q,i)=>{
      const submission=savedAnswer(submissions,entry,q.id),answer=submission?.answer||'';
      return {questionId:q.id,order:i+1,type:q.type||'multiple_choice',reference:q.reference||'',
        prompt:q.prompt||'',answer,correctAnswer:q.correctAnswer||'',
        correct:gradeAnswer(q,answer),submittedBy:submission?.player_id||null};
    });
    const correct=saved.filter(q=>q.correct).length;
    const team=teams.find(t=>t.id===entry.teamId);
    const ids=entry.playerIds?.length?entry.playerIds:[entry.playerId].filter(Boolean);
    for(const id of ids){
      const player=participants.get(id);if(!player)continue;
      rows.push({
        game_id:row.id,game_code:row.game_code,player_id:id,display_name:player.name,
        participation:entry.mode==='team'?'team':'solo',entry_key:entry.key,
        team_id:entry.mode==='team'?entry.teamId:null,
        team_name:entry.mode==='team'?(team?.name||'Team'):null,
        captain_player_id:entry.mode==='team'?(team?.captainPlayerId||null):null,
        pack_id:pack.id||state.quizPackId||'unknown',scripture:pack.scripture||'Matthew 11',
        correct_count:correct,question_count:questions.length,
        percent:questions.length?Math.round(correct/questions.length*100):0,
        answers:saved,submitted_at:locks[entry.key],
        finalized_at:state.quizFinishedAt||new Date().toISOString()
      });
    }
  }
  return rows;
}
export async function archiveQuizHistory(row,players,submissions){
  const rows=buildQuizArchive(row,players,submissions);
  if(!rows.length)return {ok:true,saved:0};
  // Upsert guarantees one per-person attempt per room even when finalize/review retries.
  const r=await db('quiz_history?on_conflict=game_id,player_id',{
    method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify(rows)
  });
  if(!r.ok)throw new Error('Saving quiz history failed ('+r.status+'). The host can retry.');
  return {ok:true,saved:rows.length};
}
