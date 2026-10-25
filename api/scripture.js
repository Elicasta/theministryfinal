import {parsePassage, textOf} from '../lib/scripture-reference.mjs';

const BASE='https://rest.api.bible/v1';
const KJV='https://bible-api.com';
let licensedBibleCache=null;
async function getJson(url, options={}, timeout=6000){
  const ac=new AbortController();
  const timer=setTimeout(()=>ac.abort(),timeout);
  try{
    const r=await fetch(url,{...options,signal:ac.signal,headers:{Accept:'application/json',...(options.headers||{})}});
    const json=await r.json().catch(()=>({}));
    if(!r.ok)throw Object.assign(new Error('Scripture provider returned '+r.status),{status:r.status});
    return json;
  }finally{clearTimeout(timer)}
}
function reply(res,status,body){
  return res.status(status).setHeader('Cache-Control','no-store').json(body);
}
async function kjvChapter(parsed){
  // The open Bible API exposes chapter data verse by verse in public-domain KJV.
  const url=KJV+'/data/kjv/'+parsed.bookId+'/'+parsed.chapter;
  let data=await getJson(url);
  let raw=Array.isArray(data)?data:(data.verses||data.data?.verses||data.data?.chapter?.verses||[]);
  if(!raw.length){
    data=await getJson(KJV+'/'+encodeURIComponent(parsed.book+' '+parsed.chapter)+'?translation=kjv&single_chapter_book_matching=indifferent');
    raw=data.verses||[];
  }
  const verses=raw.map((v,i)=>{
    const num=Number(v.verse||v.verse_number||v.number||i+1);
    return {verse:num,ref:parsed.book+' '+parsed.chapter+':'+num,text:textOf(v.text||v.content||v.verseText||'')};
  }).filter(v=>Number.isInteger(v.verse)&&v.verse>0&&v.text);
  if(!verses.length)throw new Error('KJV chapter was empty or could not be parsed');
  return {ok:true,translation:'KJV',book:parsed.book,chapter:parsed.chapter,ref:parsed.book+' '+parsed.chapter,verses};
}
async function rvrBible(key){
  const chosen=process.env.API_BIBLE_RVR1960_ID||process.env.SCRIPTURE_RVR1960_ID||'';
  if(chosen) return chosen;
  if(licensedBibleCache)return licensedBibleCache;
  const bibles=await getJson(BASE+'/bibles?language=spa&limit=100',{headers:{'api-key':key}});
  const match=(bibles.data||[]).find(b=>{
    const label=String(b.name||'')+' '+String(b.abbreviation||'');
    return /(?:RVR\s*1960|RVR\s*60|Reina.Valera\s*1960)/i.test(label) && !/1909|1995|2015/i.test(label);
  });
  if(!match?.id)return null;
  licensedBibleCache=match.id;
  return match.id;
}
async function spanishPassage(parsed){
  const key=process.env.API_BIBLE_KEY||process.env.SCRIPTURE_API_BIBLE_KEY||'';
  if(!key)return {ok:false,code:'RVR1960_NOT_CONFIGURED',message:'RVR1960 requires a licensed API.Bible key in Vercel.'};
  const id=await rvrBible(key);
  if(!id)return {ok:false,code:'RVR1960_NOT_LICENSED',message:'This API.Bible account does not have access to RVR1960.'};
  const endpoint=parsed.start===null?'chapters/'+parsed.chapterId:'passages/'+parsed.passageId;
  const args='?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false';
  const response=await getJson(BASE+'/bibles/'+encodeURIComponent(id)+'/'+endpoint+args,{headers:{'api-key':key}});
  const data=response.data||{};
  const text=textOf(data.content);
  if(!text)throw new Error('RVR1960 returned an empty passage');
  return {ok:true,translation:'RVR1960',ref:parsed.reference,text_es:text,
    copyright:textOf(data.copyright||''),fumsId:String(response.meta?.fumsId||'')};
}
export default async function handler(req,res){
  if(req.method!=='GET')return reply(res,405,{ok:false,error:'GET only'});
  const mode=req.query.mode==='chapter'?'chapter':'spanish';
  const input=req.query.ref||'';
  if(typeof input!=='string'||input.length>90)return reply(res,400,{ok:false,error:'Invalid Scripture reference'});
  const parsed=parsePassage(input);
  if(!parsed)return reply(res,400,{ok:false,error:'Enter a valid book, chapter and optional verse, e.g. Romans 6 or Romans 6:16'});
  if(mode==='chapter'&&parsed.start!==null)return reply(res,400,{ok:false,error:'Chapter bank requests require a whole chapter'});
  if(mode==='spanish'&&parsed.start===null)return reply(res,400,{ok:false,error:'Choose a verse or a verse range for projection'});
  try{
    const result=mode==='chapter'?await kjvChapter(parsed):await spanishPassage(parsed);
    return reply(res,result.ok?200:503,result);
  }catch(e){
    const error=e.name==='AbortError'?'Scripture source timed out. Try again.':e.message||'Scripture source unavailable';
    return reply(res,502,{ok:false,code:'SCRIPTURE_SOURCE_UNAVAILABLE',error});
  }
}
