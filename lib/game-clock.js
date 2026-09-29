import { saveGameState } from './game-db.js';

// Reads advance expired windows too, so sleeping/closed host tabs cannot stall play.
export async function advanceClock(row, now=Date.now()) {
  const s=structuredClone(row.state);
  if(s.timerPausedAt)return row;
  let changed=false;
  if(s.phase==='result'&&now>=s.resultDeadline){
    s.phase=s.resultNextPhase==='steal_buzz'?'steal_buzz':'reveal';
    if(s.phase==='steal_buzz'){s.stealTeamId=null;s.lockedAnswer=null;s.lockedBy=null;s.lockedTeamId=null;s.stealBuzzDeadline=now+(s.settings.stealMs||5000)}
    s.resultDeadline=null;s.resultNextPhase=null;changed=true;
  }else if(s.phase==='captain'&&now>=s.captainDeadline){s.phase='open';changed=true}
  else if(s.phase==='open'&&now>=s.teamDeadline){
    s.teams=(s.teams||[]).map(t=>t.id===s.controlTeamId?{...t,streak:0,bestStreak:Math.max(Number(t.bestStreak)||0,Number(t.streak)||0)}:t);
    const q=row.question_pack?.questions?.find(q=>q.id===s.activeQuestionId);
    s.phase=s.settings.autoSteal===false||q?.stealAllowed===false||(s.teams||[]).length<2?'reveal':'steal_buzz';
    if(s.phase==='steal_buzz')s.stealBuzzDeadline=now+(s.settings.stealMs||5000);
    changed=true;
  }else if(s.phase==='steal_captain'&&now>=s.stealCaptainDeadline){s.phase='steal_open';changed=true}
  else if((s.phase==='steal_open'&&now>=s.stealDeadline)||(s.phase==='steal_buzz'&&now>=s.stealBuzzDeadline)){if(s.phase==='steal_open')s.teams=(s.teams||[]).map(t=>t.id===s.stealTeamId?{...t,streak:0,bestStreak:Math.max(Number(t.bestStreak)||0,Number(t.streak)||0)}:t);s.phase='reveal';changed=true}
  if(!changed)return row;
  const saved=await saveGameState(row,s,s.phase);
  if(saved.row)return advanceClock(saved.row,now);
  // Return a fresh state after a concurrent buzz, judgement, or clock transition.
  const {getGameByCode}=await import('./game-db.js');
  return (await getGameByCode(row.game_code)).row||row;
}
