const norm=value=>String(value??'').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim();

export function answerMatches(answer,correctAnswer){
  return norm(answer)===norm(correctAnswer);
}

export function quizUnitKey(mode,player){
  return mode==='team'?String(player?.team_id||''):String(player?.player_id||'');
}

export function expectedQuizUnits(mode,players,teams=[]){
  if(mode==='team'){
    const occupied=new Set((players||[]).map(p=>p.team_id).filter(Boolean));
    return (teams||[]).map(t=>t.id).filter(id=>occupied.has(id));
  }
  return (players||[]).map(p=>p.player_id).filter(Boolean);
}

export function computeQuizResults({pack,players=[],teams=[],submissions=[],locks={},mode='individual'}){
  const questions=Array.isArray(pack?.questions)?pack.questions:[];
  const expected=expectedQuizUnits(mode,players,teams);
  const locked=expected.filter(id=>locks?.[id]);
  const counted=locked.length?locked:expected;
  const byQuestion=new Map(questions.map(q=>[q.id,[]]));
  for(const row of submissions||[]){
    if(byQuestion.has(row.question_id))byQuestion.get(row.question_id).push(row);
  }
  const unitAnswers=new Map();
  for(const unitId of counted){
    const rows=(submissions||[]).filter(row=>mode==='team'?row.team_id===unitId:row.player_id===unitId);
    unitAnswers.set(unitId,new Map(rows.map(row=>[row.question_id,row.answer])));
  }
  const questionStats=questions.map(q=>{
    const counts=Object.fromEntries((q.choices||[]).map(choice=>[choice,0]));
    let correct=0,answered=0;
    for(const unitId of counted){
      const answer=unitAnswers.get(unitId)?.get(q.id);
      if(answer!==undefined&&answer!==''){
        answered++;
        if(!(answer in counts))counts[answer]=0;
        counts[answer]++;
        if(answerMatches(answer,q.correctAnswer))correct++;
      }
    }
    const total=counted.length;
    const responses=Object.entries(counts).map(([answer,count])=>({
      answer,count,percent:total?Math.round(count/total*100):0
    }));
    return {
      questionId:q.id,total,answered,unanswered:Math.max(0,total-answered),correct,
      correctPercent:total?Math.round(correct/total*100):0,responses
    };
  });
  const teamResults=(teams||[]).map(team=>{
    const teamUnits=mode==='team'
      ? counted.filter(id=>id===team.id)
      : counted.filter(id=>players.some(p=>p.player_id===id&&p.team_id===team.id));
    let earned=0;
    const possible=teamUnits.length*questions.length;
    for(const unitId of teamUnits){
      for(const q of questions){
        const answer=unitAnswers.get(unitId)?.get(q.id);
        if(answerMatches(answer,q.correctAnswer))earned++;
      }
    }
    return {
      teamId:team.id,name:team.name,color:team.color,units:teamUnits.length,
      correct:earned,possible,percent:possible?Math.round(earned/possible*100):0
    };
  }).sort((a,b)=>b.percent-a.percent||b.correct-a.correct||a.name.localeCompare(b.name));
  const classCorrect=questionStats.reduce((n,q)=>n+q.correct,0);
  const classPossible=counted.length*questions.length;
  return {
    mode,submittedUnits:locked.length,totalUnits:expected.length,countedUnits:counted.length,
    overallPercent:classPossible?Math.round(classCorrect/classPossible*100):0,
    classCorrect,classPossible,teamResults,questionStats
  };
}

export function nextReviewState(index,stage,total){
  const stages=['responses','answer','explanation','application'];
  const pos=Math.max(0,stages.indexOf(stage));
  if(pos<stages.length-1)return {index,stage:stages[pos+1],done:false};
  if(index+1<total)return {index:index+1,stage:'responses',done:false};
  return {index,stage:'application',done:true};
}

export function previousReviewState(index,stage){
  const stages=['responses','answer','explanation','application'];
  const pos=Math.max(0,stages.indexOf(stage));
  if(pos>0)return {index,stage:stages[pos-1]};
  if(index>0)return {index:index-1,stage:'application'};
  return {index:0,stage:'responses'};
}
