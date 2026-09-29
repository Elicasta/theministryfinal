import {randomInt} from 'node:crypto';
import {db,getGameByCode} from './game-db.js';
import {BUILTIN_GAME_PACK,LEGACY_GAME_PACK} from './game-pack.js';

export const builtins=[{...BUILTIN_GAME_PACK,theme:'classic'},{...LEGACY_GAME_PACK,title:'Bible Battle · Apostolic & Trivia',theme:'apostolic'}];
export function packLibrary(active){
  const {savedPacks,...current}=active;
  return [...new Map([...builtins,...(savedPacks||[]),current].filter(p=>p.id).map(p=>[p.sourcePackId||p.id,{...p,id:p.sourcePackId||p.id}])).values()];
}
export async function updateRoom(code,mutate){
  for(let i=0;i<5;i++){
    const {row}=await getGameByCode(code);if(!row)throw Object.assign(new Error('Game not found'),{status:404});
    const patch=mutate(row);if(!patch)return row;
    const query=new URLSearchParams({game_code:'eq.'+code,version:'eq.'+row.version,select:'*'});
    const r=await db('game_sessions?'+query,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(patch)});
    if(!r.ok)throw new Error('Could not save the game. Please retry.');
    if(r.json?.[0])return r.json[0];
  }
  throw Object.assign(new Error('Game changed. Please retry.'),{status:409});
}
function shuffled(choices=[]){const out=[...choices];for(let i=out.length-1;i>0;i--){const j=randomInt(i+1);[out[i],out[j]]=[out[j],out[i]]}return out}
export function selectRound(row,packId){
  if(!['lobby','board'].includes(row.state.phase))throw Object.assign(new Error('Finish this question and return to the board before changing rounds.'),{status:409});
  const library=packLibrary(row.question_pack),selected=library.find(p=>p.id===packId);
  if(!selected)throw Object.assign(new Error('Pack not found'),{status:400});
  const round=row.state.phase==='lobby'?(row.state.roundNumber||1):(row.state.roundNumber||1)+1;
  const namespace='r'+round+'-'+Date.now().toString(36)+'-';
  const active={...selected,sourcePackId:selected.id,questions:selected.questions.map((q,i)=>({...q,id:namespace+i,choices:shuffled(q.choices)})),final:{...selected.final,id:namespace+'final'},savedPacks:library.filter(p=>!builtins.some(b=>b.id===p.id)).slice(-8)};
  const state={...row.state,roundNumber:round,usedQuestionIds:[],activeQuestionId:null,questionOpenedAt:null,lockedAnswer:null,lockedBy:null,lockedTeamId:null,stealTeamId:null,lastResult:null,resultNextPhase:null,resultDeadline:null,timerPausedAt:null,final:null,finalAnswers:{},finalWagers:{},finalJudged:{}};
  for(const key of ['captainDeadline','teamDeadline','stealDeadline','stealCaptainDeadline','stealBuzzDeadline'])state[key]=null;
  return {state,question_pack:active,status:state.phase};
}
