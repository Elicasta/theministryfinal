// Server-side canonical Scripture parsing. No client-provided URL or translation ID reaches upstream.
export const BOOKS = [
  ['Genesis','GEN'],['Exodus','EXO'],['Leviticus','LEV'],['Numbers','NUM'],['Deuteronomy','DEU'],
  ['Joshua','JOS'],['Judges','JDG'],['Ruth','RUT'],['1 Samuel','1SA'],['2 Samuel','2SA'],
  ['1 Kings','1KI'],['2 Kings','2KI'],['1 Chronicles','1CH'],['2 Chronicles','2CH'],
  ['Ezra','EZR'],['Nehemiah','NEH'],['Esther','EST'],['Job','JOB'],['Psalm','PSA'],
  ['Proverbs','PRO'],['Ecclesiastes','ECC'],['Song of Solomon','SNG'],['Isaiah','ISA'],
  ['Jeremiah','JER'],['Lamentations','LAM'],['Ezekiel','EZK'],['Daniel','DAN'],
  ['Hosea','HOS'],['Joel','JOL'],['Amos','AMO'],['Obadiah','OBA'],['Jonah','JON'],
  ['Micah','MIC'],['Nahum','NAM'],['Habakkuk','HAB'],['Zephaniah','ZEP'],['Haggai','HAG'],
  ['Zechariah','ZEC'],['Malachi','MAL'],['Matthew','MAT'],['Mark','MRK'],
  ['Luke','LUK'],['John','JHN'],['Acts','ACT'],['Romans','ROM'],['1 Corinthians','1CO'],
  ['2 Corinthians','2CO'],['Galatians','GAL'],['Ephesians','EPH'],['Philippians','PHP'],
  ['Colossians','COL'],['1 Thessalonians','1TH'],['2 Thessalonians','2TH'],
  ['1 Timothy','1TI'],['2 Timothy','2TI'],['Titus','TIT'],['Philemon','PHM'],
  ['Hebrews','HEB'],['James','JAS'],['1 Peter','1PE'],['2 Peter','2PE'],
  ['1 John','1JN'],['2 John','2JN'],['3 John','3JN'],['Jude','JUD'],['Revelation','REV']
];
const ids = new Map(BOOKS.map(([book,id])=>[book.toLowerCase(),{book,id}]));
for(const [alias,book] of Object.entries({
 'psalms':'Psalm','ps':'Psalm','psa':'Psalm','song of songs':'Song of Solomon',
 'canticles':'Song of Solomon','revelations':'Revelation','revelation of john':'Revelation',
 'cantare':'Song of Solomon','phil':'Philippians','1 cor':'1 Corinthians','2 cor':'2 Corinthians',
 'matt':'Matthew','rom':'Romans','heb':'Hebrews','jn':'John','isa':'Isaiah'
})) ids.set(alias,ids.get(book.toLowerCase()));
export function parsePassage(input) {
  const match=String(input||'').trim().replace(/\s*\(KJV\)\s*$/i,'')
    .match(/^(.+?)\s+(\d{1,3})(?::(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?$/);
  if(!match) return null;
  const bk=ids.get(match[1].trim().replace(/\s+/g,' ').toLowerCase());
  if(!bk) return null;
  const chapter=Number(match[2]),start=match[3]?Number(match[3]):null,end=match[4]?Number(match[4]):start;
  if(!Number.isInteger(chapter)||chapter<1||chapter>150) return null;
  if(start!==null&&(!Number.isInteger(start)||start<1||start>176||end<start||end>176||end-start>49))return null;
  const base=bk.book+' '+chapter;
  return {book:bk.book,bookId:bk.id,chapter,start,end,
    reference:base+(start===null?'':':'+start+(end!==start?'-'+end:'')),
    chapterId:bk.id+'.'+chapter,
    passageId:start===null?null:bk.id+'.'+chapter+'.'+start+(end!==start?'-'+bk.id+'.'+chapter+'.'+end:'')};
}
export function textOf(input) {
  return String(input||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ')
    .replace(/\s+/g,' ').trim();
}



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
