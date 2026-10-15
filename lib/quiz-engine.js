/**
 * Quiz & Review v2 scoring engine.
 * Works with the existing game_sessions, game_players and game_submissions shape.
 * No email, account token or correct-answer key is needed on a participant device.
 */
const normalizeText = value => String(value ?? '')
  .normalize('NFKC')
  .replace(/[\u2018\u2019]/g, "'")
  .trim()
  .toLocaleLowerCase('en-US')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// One-word Scripture blanks accept minor typing errors, but do not treat
// a different meaningful short word as correct merely because it is close.
function editingDistanceAtMost(a,b,limit){
  if(Math.abs(a.length-b.length)>limit)return false;
  const row0=Array.from({length:b.length+1},(_,i)=>i);
  let previous=row0, beforePrevious=null;
  for(let i=1;i<=a.length;i++){
    const row=[i];
    for(let j=1;j<=b.length;j++){
      let cost=a[i-1]===b[j-1]?0:1;
      let value=Math.min(previous[j]+1,row[j-1]+1,previous[j-1]+cost);
      if(i>1&&j>1&&beforePrevious&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])value=Math.min(value,beforePrevious[j-2]+1);
      row.push(value);
    }
    beforePrevious=previous;previous=row;
  }
  return previous[b.length]<=limit;
}
export function gradeAnswer(question, answer) {
  if (!question) return false;
  const clean = normalizeText(answer);
  if (!clean) return false;
  const candidates = question.type === 'fill_blank'
    ? (question.acceptedAnswers?.length ? question.acceptedAnswers : [question.correctAnswer])
    : [question.correctAnswer];
  return candidates.some(candidate => {
    const target=normalizeText(candidate);
    if(clean===target)return true;
    if(question.type!=='fill_blank'||!target||clean.includes(' ')||target.includes(' '))return false;
    // A short substitution can turn 'light' into 'night' or another real word.
    if(target.length<6){
      if(clean.length!==target.length)return false;
      for(let i=1;i<clean.length;i++)if(clean[i-1]===target[i]&&clean[i]===target[i-1]&&clean.slice(0,i-1)===target.slice(0,i-1)&&clean.slice(i+1)===target.slice(i+1))return true;
      return false;
    }
    return editingDistanceAtMost(clean,target,target.length>=10?2:1);
  });
}

export function answerMatches(answer, correctAnswer) {
  return gradeAnswer({ type: 'multiple_choice', correctAnswer }, answer);
}

export function validateAnswer(question, answer) {
  if (!question) return { ok:false, reason:'Unknown question' };
  if (typeof answer !== 'string' || !answer.trim())
    return { ok:false, reason:'Answer cannot be empty' };
  if (answer.length > 120) return { ok:false, reason:'Answer too long' };
  if (question.type === 'multiple_choice') {
    if (!Array.isArray(question.choices) || !question.choices.includes(answer))
      return { ok:false, reason:'Choose one of the displayed options' };
  } else if (question.type === 'fill_blank') {
    if (!/^[\p{L}\p{N}\s'’.,-]+$/u.test(answer))
      return { ok:false, reason:'Enter the missing word or phrase' };
  } else return { ok:false, reason:'Unsupported question type' };
  return { ok:true, answer:answer.trim() };
}

/**
 * A player chooses participation, not the host:
 *   solo: one answer set, one lock, one individual score
 *   team: one answer set and lock per team, captain submits
 *
 * Using team_id='solo' for solo players is compatible with the existing join
 * endpoint (which expects a team_id). The 'solo' team is NOT a scored team.
 */
export const SOLO_TEAM_ID = 'solo';
export const participationMode = p => (
  p?.participationMode === 'solo' || p?.team_id === SOLO_TEAM_ID ? 'solo' : 'team'
);
export function quizUnitKey(mode,player) {
  return mode==='mixed'?entryKeyForPlayer(player):mode==='team'?String(player?.team_id||''):String(player?.player_id||'');
}

export function entryKeyForPlayer(player) {
  if (!player?.player_id) return '';
  return participationMode(player) === 'solo'
    ? `solo:${player.player_id}`
    : `team:${player.team_id}`;
}

export function expectedQuizEntries(players=[], teams=[]) {
  const eligibleTeams = new Set(teams.filter(t=>t.id!==SOLO_TEAM_ID).map(t=>t.id));
  const entries = [];
  const encountered = new Set();
  for (const p of players) {
    if (!p?.player_id || !p?.team_id) continue;
    const mode = participationMode(p);
    if (mode === 'team' && !eligibleTeams.has(p.team_id)) continue;
    const key = entryKeyForPlayer(p);
    if (encountered.has(key)) {
      const entry = entries.find(x=>x.key===key);
      if (entry) entry.playerIds.push(p.player_id);
      continue;
    }
    encountered.add(key);
    entries.push({key,mode,playerId:mode==='solo'?p.player_id:null,
      teamId:mode==='team'?p.team_id:null,
      playerIds:[p.player_id],name:mode==='solo'?p.name||'Participant':teams.find(t=>t.id===p.team_id)?.name||'Team'});
  }
  return entries;
}

// Keep the original function contract for existing quiz modes and tests.
export function expectedQuizUnits(mode, players=[], teams=[]) {
  if (mode === 'mixed') return expectedQuizEntries(players,teams).map(x=>x.key);
  if (mode === 'team') {
    const occupied = new Set(players.map(p=>p.team_id).filter(Boolean));
    return teams.filter(t=>occupied.has(t.id)&&t.id!==SOLO_TEAM_ID).map(t=>t.id);
  }
  return players.map(p=>p.player_id).filter(Boolean);
}

function entriesForMode(mode,players,teams) {
  if (mode==='mixed') return expectedQuizEntries(players,teams);
  const units=expectedQuizUnits(mode,players,teams);
  return units.map(key=>({
    key, mode:mode==='team'?'team':'solo',
    teamId:mode==='team'?key:players.find(p=>p.player_id===key)?.team_id||null,
    playerId:mode==='individual'?key:null,
    playerIds:mode==='team'?players.filter(p=>p.team_id===key).map(p=>p.player_id):[key],
    name:mode==='team'?teams.find(t=>t.id===key)?.name||'Team':players.find(p=>p.player_id===key)?.name||'Participant'
  }));
}

const rowTime = row => Number.isFinite(Date.parse(row.created_at)) ? Date.parse(row.created_at) : 0;
function answersForEntry(entry,submissions) {
  const relevant = submissions.filter(row=> entry.mode==='team'
    ? row.team_id===entry.teamId
    : row.player_id===entry.playerId);
  // Latest valid save for each question. The write path should still enforce one
  // captain per team and the existing (game_id, question_id, player_id) key.
  const answers=new Map();
  for (const row of relevant) {
    const previous=answers.get(row.question_id);
    if(!previous || rowTime(row)>=rowTime(previous)) answers.set(row.question_id,row);
  }
  return answers;
}

function percent(numerator,denominator) {
  return denominator ? Math.round(numerator / denominator * 100) : 0;
}

export function computeQuizResults({
  pack,players=[],teams=[],submissions=[],locks={},mode='mixed'
}) {
  const questions=Array.isArray(pack?.questions)?pack.questions:[];
  const expected=entriesForMode(mode,players,teams);
  const locked=expected.filter(entry=>Boolean(locks[entry.key]));
  // Only submitted entries appear in final results, including host early-close.
  // When nobody submits, the class score is 0 with a denominator of 0.
  const counted=locked;
  const answeredByEntry=new Map(counted.map(entry=>[entry.key,answersForEntry(entry,submissions)]));
  const scoreFor=entry=>questions.reduce((count,q)=>{
    return count+(gradeAnswer(q,answeredByEntry.get(entry.key)?.get(q.id)?.answer)?1:0);
  },0);
  const entryResults=counted.map(entry=>({
    key:entry.key,mode:entry.mode,teamId:entry.teamId,playerId:entry.playerId,
    name:entry.name,peopleRepresented:entry.playerIds.length,
    correct:scoreFor(entry),possible:questions.length,
    percent:percent(scoreFor(entry),questions.length)
  }));
  const soloResults=entryResults.filter(x=>x.mode==='solo')
    .sort((a,b)=>b.percent-a.percent||a.name.localeCompare(b.name));
  let teamResults=entryResults.filter(x=>x.mode==='team').map(r=>({
    ...r,color:teams.find(t=>t.id===r.teamId)?.color||null,
    units:1,teamId:r.teamId
  })).sort((a,b)=>b.percent-a.percent||a.name.localeCompare(b.name));
  // Old Quiz v1 'individual' sessions aggregated each member into their team.
  // Do not silently change their saved scoring contract during an upgrade.
  if(mode==='individual') {
    teamResults=teams.filter(t=>t.id!==SOLO_TEAM_ID).map(t=>{
      const group=entryResults.filter(r=>players.some(p=>p.player_id===r.playerId&&p.team_id===t.id));
      const correct=group.reduce((n,r)=>n+r.correct,0),possible=group.reduce((n,r)=>n+r.possible,0);
      return {name:t.name,color:t.color,teamId:t.id,units:group.length,correct,possible,percent:percent(correct,possible),peopleRepresented:group.length};
    }).filter(r=>r.units>0).sort((a,b)=>b.percent-a.percent||a.name.localeCompare(b.name));
  }
  const questionStats=questions.map(q=>{
    const counts=Object.fromEntries((q.choices||[]).map(x=>[x,0]));
    const fills=new Map();
    let answered=0,correct=0,solosCorrect=0,teamsCorrect=0,solosTotal=0,teamsTotal=0;
    for(const entry of counted){
      const answer=answeredByEntry.get(entry.key)?.get(q.id)?.answer;
      if(entry.mode==='solo')solosTotal++;else teamsTotal++;
      if(answer!==undefined&&answer!==null&&answer!==''){
        answered++;
        if(q.type==='multiple_choice')counts[answer]=(counts[answer]||0)+1;
        else fills.set(normalizeText(answer),(fills.get(normalizeText(answer))||0)+1);
        if(gradeAnswer(q,answer)){
          correct++;
          if(entry.mode==='solo')solosCorrect++;else teamsCorrect++;
        }
      }
    }
    return {
      questionId:q.id,type:q.type,total:counted.length,answered,
      unanswered:counted.length-answered,correct,correctPercent:percent(correct,counted.length),
      soloCorrectPercent:percent(solosCorrect,solosTotal),
      teamCorrectPercent:percent(teamsCorrect,teamsTotal),
      responses:q.type==='multiple_choice'
        ? Object.entries(counts).map(([answer,count])=>({answer,count,percent:percent(count,counted.length)}))
        : [],
      // Host-only review data. Do not expose raw fill responses before review.
      fillResponses:q.type==='fill_blank'
        ? [...fills].map(([answer,count])=>({answer,count,percent:percent(count,counted.length)}))
        : []
    };
  });
  const classCorrect=entryResults.reduce((n,x)=>n+x.correct,0);
  const classPossible=counted.length*questions.length;
  return {
    mode,submittedUnits:locked.length,totalUnits:expected.length,
    countedUnits:counted.length,representedPeople:counted.reduce((n,e)=>n+e.playerIds.length,0),
    overallPercent:percent(classCorrect,classPossible),classCorrect,classPossible,
    soloResults,teamResults,questionStats,
    breakdown:{soloEntries:soloResults.length,teamEntries:teamResults.length,
      soloPercent:percent(soloResults.reduce((n,x)=>n+x.correct,0),soloResults.length*questions.length),
      teamPercent:percent(teamResults.reduce((n,x)=>n+x.correct,0),teamResults.length*questions.length)}
  };
}

const STAGES=['responses','answer','explanation','application'];
export function nextReviewState(index,stage,total){
  const position=Math.max(0,STAGES.indexOf(stage));
  if(position<STAGES.length-1)return {index,stage:STAGES[position+1],done:false};
  if(index+1<total)return {index:index+1,stage:'responses',done:false};
  return {index,stage:'application',done:true};
}
export function previousReviewState(index,stage){
  const position=Math.max(0,STAGES.indexOf(stage));
  if(position>0)return {index,stage:STAGES[position-1]};
  if(index>0)return {index:index-1,stage:'application'};
  return {index:0,stage:'responses'};
}

export function publicQuestion(question) {
  const {id,type,reference,section,category,prompt,choices}=question;
  return {id,type,reference,section,category,prompt,...(choices?{choices}: {})};
}

export function publicReviewQuestion(question,stage,host=false) {
  const result=publicQuestion(question);
  if (host || ['answer','explanation','application'].includes(stage))
    result.correctAnswer=question.correctAnswer;
  if (host || ['explanation','application'].includes(stage))
    result.explanation=question.explanation;
  if (host || stage==='application') result.application=question.application;
  return result;
}