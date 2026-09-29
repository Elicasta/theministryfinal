import { clean, verifyHost, getGameByCode, db, broadcastGame, corsNoStore } from '../../lib/game-db.js';

const CATEGORY_IDS=['apostolic-doctrine','bible-trivia','where-in-the-bible','finish-the-verse','bible-people','who-said-it'];
const CATEGORY_LABELS={
  'apostolic-doctrine':'Apostolic Doctrine','bible-trivia':'Bible Trivia','where-in-the-bible':'Where in the Bible?',
  'finish-the-verse':'Finish the Verse','bible-people':'Bible People','who-said-it':'Who Said It?'
};
const schema={
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
function extractOutput(data){
  if(typeof data?.output_text==='string')return data.output_text;
  const out=[];
  for(const item of data?.output||[])for(const c of item?.content||[])if(c?.type==='output_text'&&c?.text)out.push(c.text);
  return out.join('');
}
function validatePack(raw){
  const qs=Array.isArray(raw?.questions)?raw.questions:[];
  if(qs.length<24)throw new Error('Generator returned too few questions');
  const seen=new Set();
  const questions=[];
  for(const q of qs){
    if(!CATEGORY_IDS.includes(q.category)||seen.has(q.id))continue;
    const pts=[100,200,300,400,500].includes(Number(q.points))?Number(q.points):null;
    if(!pts||!q.prompt||!q.correctAnswer||!q.reference)continue;
    seen.add(q.id);
    questions.push({...q,points:pts,choices:Array.isArray(q.choices)?q.choices.slice(0,4):[],acceptedAnswers:Array.isArray(q.acceptedAnswers)?q.acceptedAnswers:[],stealAllowed:q.stealAllowed!==false});
  }
  const board=[];
  for(const id of CATEGORY_IDS){
    for(const points of [100,200,300,400,500]){
      const q=questions.find(x=>x.category===id&&x.points===points);
      if(!q)throw new Error('Generator missed '+CATEGORY_LABELS[id]+' for '+points+' points');
      board.push(q);
    }
  }
  return {
    id:'ai-'+Date.now().toString(36),
    title:clean(String(raw.title||'Bible Battle').replace(/Bible Showdown/gi,'Bible Battle'),80),
    version:1,
    generatedBy:'OpenAI',
    generatedAt:new Date().toISOString(),
    categories:CATEGORY_IDS.map(id=>({id,label:CATEGORY_LABELS[id]})),
    questions:board,
    final:raw.final
  };
}

export default async function handler(req,res){
  corsNoStore(res);
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.OPENAI_API_KEY;
  if(!key)return res.status(503).json({error:'OpenAI question generation is not configured'});
  const body=req.body||{},code=clean(body.code,12).toUpperCase();
  if(!code||!body.hostToken||!(await verifyHost(code,body.hostToken)))return res.status(401).json({error:'Host authorization required'});
  const {row}=await getGameByCode(code);if(!row)return res.status(404).json({error:'Game not found'});
  if(row.state?.phase!=='lobby')return res.status(409).json({error:'Generate the pack before starting the game'});

  const difficulty=['easy','medium','hard','expert','mixed'].includes(body.difficulty)?body.difficulty:'mixed';
  const prompt=`Create a fast-paced Bible Battle game-show pack for a church audience.
The title must begin with "Bible Battle" and must never use the old name "Bible Showdown".
Use KJV wording for verse-fill questions.
Difficulty: ${difficulty}.
Create exactly 30 main questions: 5 per category, using point values 100, 200, 300, 400, 500 once per category.
Categories: Apostolic Doctrine, Bible Trivia, Where in the Bible?, Finish the Verse, Bible People, Who Said It?
Apostolic Doctrine should reflect classical Oneness Pentecostal/Apostolic teaching: one indivisible God, full deity of Jesus Christ, Jesus-name baptism, repentance, Holy Ghost reception, Acts 2:38 new-birth emphasis. Anchor doctrinal answers in explicit Scripture references. Avoid speculative theology and ambiguous trick questions.
For multiple choice, provide exactly 4 plausible choices. For fill_blank, choices must be [].
acceptedAnswers must include reasonable exact variants but not broad paraphrases.
Explanations should be one concise sentence.
Also create one Final Showdown question from the Book of Acts with a clear, verifiable answer.`;

  try{
    const r=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({
        model:process.env.OPENAI_GAME_MODEL||'gpt-5.6-terra',
        reasoning:{effort:'low'},
        input:[
          {role:'system',content:'You create accurate, energetic Bible game-show question packs. Return only schema-compliant structured output.'},
          {role:'user',content:prompt}
        ],
        text:{format:{type:'json_schema',name:'bible_battle_pack',strict:true,schema}}
      })
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data?.error?.message||'OpenAI request failed');
    const rawText=extractOutput(data);if(!rawText)throw new Error('OpenAI returned no question pack');
    const pack=validatePack(JSON.parse(rawText));
    const patch=await db('game_sessions?game_code=eq.'+encodeURIComponent(code),{
      method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({question_pack:pack})
    });
    if(!patch.ok)throw new Error('Generated pack could not be saved');
    broadcastGame(code,'state',{reason:'PACK_GENERATED'}).catch(()=>{});
    return res.status(200).json({ok:true,pack:{id:pack.id,title:pack.title,categories:pack.categories,questionCount:pack.questions.length,generatedBy:pack.generatedBy}});
  }catch(e){
    return res.status(502).json({error:e?.message||'Question generation failed'});
  }
}
