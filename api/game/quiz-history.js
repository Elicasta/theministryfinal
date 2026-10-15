import {translatePublicQuestion} from '../../lib/quiz-es.js';
import {authenticatedPlayer} from '../../lib/game-player-session.js';
import {clean,db,getGameByCode,corsNoStore} from '../../lib/game-db.js';

// Read a participant's OWN archived quiz record after scoring.
// A quiz player cookie/token authorizes only that game+player row. Future
// verified Lumaneer account history must use a separate signed identity flow.
export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const body=req.body||{},code=clean(body.code,12).toUpperCase();
  if(!code)return res.status(400).json({error:'Quiz code required'});
  const {row}=await getGameByCode(code);
  if(!row||row.state?.mode!=='quiz')return res.status(404).json({error:'Quiz not found'});
  const auth=await authenticatedPlayer(req,body,code);
  if(!auth)return res.status(401).json({error:'Rejoin on the original device to view your work'});
  const pq=new URLSearchParams({select:'preferred_language',game_id:'eq.'+row.id,player_id:'eq.'+auth.playerId,limit:'1'});
  const langResult=await db('game_players?'+pq.toString());
  const playerLanguage=langResult.ok&&Array.isArray(langResult.json)&&langResult.json[0]?.preferred_language==='es'?'es':'en';
  if(!['quiz_results','quiz_review','quiz_complete'].includes(row.state.phase))
    return res.status(409).json({error:'History is available after answers are closed'});
  const query=new URLSearchParams({
    select:'game_code,display_name,participation,team_name,pack_id,scripture,correct_count,question_count,percent,answers,submitted_at,finalized_at',
    game_id:'eq.'+row.id,player_id:'eq.'+auth.playerId,limit:'1'
  });
  const result=await db('quiz_history?'+query.toString());
  if(!result.ok)return res.status(503).json({error:'History temporarily unavailable'});
  const record=Array.isArray(result.json)?result.json[0]:null;
  if(!record)return res.status(404).json({error:'This quiz record has not been archived yet'});
  return res.status(200).json({ok:true,history:{
    gameCode:record.game_code,name:record.display_name,participation:record.participation,language:playerLanguage,
    teamName:record.team_name,packId:record.pack_id,scripture:record.scripture,
    correct:record.correct_count,total:record.question_count,percent:record.percent,
    submittedAt:record.submitted_at,completedAt:record.finalized_at,
    answers:(record.answers||[]).map(q=>{
      const original=row.question_pack?.questions?.find(item=>item.id===q.questionId);
      if(playerLanguage!=='es'||!original)return {
        questionId:q.questionId,order:q.order,type:q.type,reference:q.reference,
        prompt:q.prompt,answer:q.answer,correctAnswer:q.correctAnswer,correct:q.correct
      };
      const translated=translatePublicQuestion(original);
      const choiceIndex=original.choices?.indexOf(q.answer)??-1;
      return {
        questionId:q.questionId,order:q.order,type:q.type,reference:translated.reference,
        prompt:translated.prompt,
        answer:choiceIndex>=0?translated.choices[choiceIndex]:q.answer,
        correctAnswer:translated.correctAnswer,correct:q.correct
      };
    })
  }});
}
