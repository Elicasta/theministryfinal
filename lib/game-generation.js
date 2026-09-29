import {clean} from './game-db.js';
import {BUILTIN_GAME_PACK,LEGACY_GAME_PACK} from './game-pack.js';
export const themes={classic:BUILTIN_GAME_PACK.categories,apostolic:LEGACY_GAME_PACK.categories};
const CATEGORY_IDS=themes.apostolic.map(c=>c.id);
const baseSchema={
  type:'object',additionalProperties:false,
  properties:{
    title:{type:'string'},
    questions:{type:'array',items:{
      type:'object',additionalProperties:false,
      properties:{
        id:{type:'string'},
        category:{type:'string',enum:CATEGORY_IDS},
        points:{type:'integer'},
        type:{type:'string',enum:['multiple_choice','fill_blank']},
        prompt:{type:'string'},
        choices:{type:'array',items:{type:'string'}},
        correctAnswer:{type:'string'},
        acceptedAnswers:{type:'array',items:{type:'string'}},
        reference:{type:'string'},
        explanation:{type:'string'},
        stealAllowed:{type:'boolean'}
      },
      required:['id','category','points','type','prompt','choices','correctAnswer','acceptedAnswers','reference','explanation','stealAllowed']
    }},
    final:{
      type:'object',additionalProperties:false,
      properties:{
        id:{type:'string'},category:{type:'string'},type:{type:'string',enum:['multiple_choice','fill_blank']},
        prompt:{type:'string'},choices:{type:'array',items:{type:'string'}},correctAnswer:{type:'string'},
        acceptedAnswers:{type:'array',items:{type:'string'}},reference:{type:'string'},explanation:{type:'string'}
      },
      required:['id','category','type','prompt','choices','correctAnswer','acceptedAnswers','reference','explanation']
    }
  },
  required:['title','questions','final']
};

export function generationRequest(theme,difficulty,previous=[]){
  const categories=themes[theme];
  const schema=structuredClone(baseSchema);
  schema.properties.questions.items.properties.category.enum=categories.map(c=>c.id);
  return {
    model:process.env.OPENAI_GAME_MODEL||'gpt-5.6-terra',background:true,store:true,reasoning:{effort:'low'},
    input:[{role:'system',content:'Create accurate Bible quiz packs. Return only schema-compliant output.'},{role:'user',content:`Create a Bible Battle pack for a church audience. Difficulty: ${difficulty}.
Exactly 30 main questions: one each worth 100, 200, 300, 400, 500 for each of these category IDs and labels: ${JSON.stringify(categories)}.
Title starts with Bible Battle. Use KJV wording for verse completion. Include a mix of multiple choice and fill_blank.
For multiple_choice, exactly four distinct choices, with correctAnswer matching one choice verbatim. For fill_blank, choices is [].
Keep prompts below 200 characters, choices below 80, explanations below 180. Use unique IDs. Cite verifiable Scripture references. Accepted answers are exact reasonable variants.
Apostolic Doctrine reflects Oneness Pentecostal teaching: one indivisible God, deity of Jesus, Jesus-name baptism, repentance, Holy Ghost reception and Acts 2:38. Ground answers in explicit passages.
Also create one Final Round question with a clear answer from Acts. Avoid repeating these previous prompts: ${JSON.stringify(previous.slice(-60))}`}],
    text:{format:{type:'json_schema',name:'bible_battle_pack',strict:true,schema}}
  };
}
function validateQuestion(q,final=false){
  if(!q||!['multiple_choice','fill_blank'].includes(q.type))throw new Error('Invalid question format');
  for(const [key,max] of [['prompt',300],['correctAnswer',150],['reference',100],['explanation',300]]){
    if(typeof q[key]!=='string'||!q[key].trim()||q[key].length>max)throw new Error('Invalid '+key+' in generated question');
  }
  if(!Array.isArray(q.choices)||!Array.isArray(q.acceptedAnswers)||q.acceptedAnswers.some(x=>typeof x!=='string'||x.length>150))throw new Error('Invalid answer choices');
  if(q.type==='multiple_choice'&&(q.choices.length!==4||new Set(q.choices).size!==4||!q.choices.includes(q.correctAnswer)||q.choices.some(x=>typeof x!=='string'||!x.trim()||x.length>100)))throw new Error('Multiple-choice answer does not match four valid choices');
  if(q.type==='fill_blank'&&q.choices.length)throw new Error('Fill-in questions cannot have choices');
  return {...q,id:clean(q.id,80),stealAllowed:!final&&q.stealAllowed!==false};
}
export function validatePack(raw,theme,id){
  const cats=themes[theme];if(!cats)throw new Error('Unknown category set');
  if(raw?.questions?.length!==30)throw new Error('A complete board needs 30 questions');
  const seen=new Set();
  const questions=raw.questions.map(q=>{
    const checked=validateQuestion(q);
    if(!checked.id||seen.has(checked.id))throw new Error('Question IDs must be unique');
    seen.add(checked.id);return checked;
  });
  const board=cats.flatMap(c=>[100,200,300,400,500].map(points=>{
    const matches=questions.filter(q=>q.category===c.id&&q.points===points);
    if(matches.length!==1)throw new Error('Missing or duplicate '+c.label+' '+points+' question');
    return matches[0];
  }));
  return {id,title:clean(raw.title||'Bible Battle · AI',80),version:3,generatedBy:'OpenAI',generatedAt:new Date().toISOString(),theme,categories:cats,questions:board,final:validateQuestion(raw.final,true)};
}
export function extractOutput(data){return data.output_text||(data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('')}
