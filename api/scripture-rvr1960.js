// A controlled, server-side adapter for a licensed RVR 1960 edition on API.Bible.
// Do not put the API key in frontend code or serve another translation as RVR 1960.
// Env: API_BIBLE_KEY and optionally API_BIBLE_RVR1960_ID.
// API.Bible provides translation-specific licensing information and attribution requirements.
const BOOKS = [["genesis","GEN"],["exodus","EXO"],["leviticus","LEV"],["numbers","NUM"],["deuteronomy","DEU"],["joshua","JOS"],["judges","JDG"],["ruth","RUT"],["1 samuel","1SA"],["2 samuel","2SA"],["1 kings","1KI"],["2 kings","2KI"],["1 chronicles","1CH"],["2 chronicles","2CH"],["ezra","EZR"],["nehemiah","NEH"],["esther","EST"],["job","JOB"],["psalms","PSA"],["proverbs","PRO"],["ecclesiastes","ECC"],["song of solomon","SNG"],["isaiah","ISA"],["jeremiah","JER"],["lamentations","LAM"],["ezekiel","EZK"],["daniel","DAN"],["hosea","HOS"],["joel","JOL"],["amos","AMO"],["obadiah","OBA"],["jonah","JON"],["micah","MIC"],["nahum","NAM"],["habakkuk","HAB"],["zephaniah","ZEP"],["haggai","HAG"],["zechariah","ZEC"],["malachi","MAL"],["matthew","MAT"],["mark","MRK"],["luke","LUK"],["john","JHN"],["acts","ACT"],["romans","ROM"],["1 corinthians","1CO"],["2 corinthians","2CO"],["galatians","GAL"],["ephesians","EPH"],["philippians","PHP"],["colossians","COL"],["1 thessalonians","1TH"],["2 thessalonians","2TH"],["1 timothy","1TI"],["2 timothy","2TI"],["titus","TIT"],["philemon","PHM"],["hebrews","HEB"],["james","JAS"],["1 peter","1PE"],["2 peter","2PE"],["1 john","1JN"],["2 john","2JN"],["3 john","3JN"],["jude","JUD"],["revelation","REV"]];
const BOOK_ID = new Map(BOOKS);
let resolvedEdition = '';

const json=(res,status,body)=>{
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(status).json(body);
};

function parseRef(input){
  const match=String(input||'').trim().match(/^(.+?)\s+(\d{1,3}):(\d{1,3})$/);
  if(!match)return null;
  const book=BOOK_ID.get(match[1].trim().toLowerCase());
  const chapter=Number(match[2]),verse=Number(match[3]);
  if(!book||chapter<1||chapter>150||verse<1||verse>176)return null;
  return {id:book+'.'+chapter+'.'+verse};
}

async function apiGet(path,key){
  const controller=new AbortController();
  const t=setTimeout(()=>controller.abort(),7000);
  try{
    const r=await fetch('https://rest.api.bible/v1'+path,{
      headers:{'api-key':key,'Accept':'application/json'},
      signal:controller.signal
    });
    if(!r.ok)throw new Error('Scripture provider returned '+r.status);
    return await r.json();
  }finally{clearTimeout(t)}
}

async function getEdition(key){
  if(process.env.API_BIBLE_RVR1960_ID)return process.env.API_BIBLE_RVR1960_ID.trim();
  if(resolvedEdition)return resolvedEdition;
  const b=await apiGet('/bibles?language=spa',key);
  const editions=Array.isArray(b.data)?b.data:[];
  const found=editions.find(item=>/reina.?valera.*1960|rvr.?1960/i.test([
    item.name,item.nameLocal,item.abbreviation,item.abbreviationLocal
  ].filter(Boolean).join(' ')));
  if(!found?.id)throw new Error('Your API.Bible plan has no licensed Reina-Valera 1960 edition.');
  resolvedEdition=found.id;
  return resolvedEdition;
}

export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{ok:false,error:'Method not allowed'});
  const requested=Array.isArray(req.query?.ref)?'':req.query?.ref;
  const ref=parseRef(requested);
  if(!ref)return json(res,400,{ok:false,error:'Use a single Bible verse reference, such as John 1:1'});
  const key=process.env.API_BIBLE_KEY||'';
  if(!key)return json(res,503,{ok:false,error:'RVR 1960 provider not connected. Set API_BIBLE_KEY in Vercel.'});
  try{
    const edition=await getEdition(key);
    const result=await apiGet('/bibles/'+encodeURIComponent(edition)+'/verses/'+encodeURIComponent(ref.id)
      +'?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false',key);
    const data=result.data||{},text=String(data.content||'').trim();
    if(!text)return json(res,502,{ok:false,error:'Verse returned without content'});
    return json(res,200,{
      ok:true,ref:String(requested).trim(),ref_es:String(data.reference||''),text_es:text,
      copyright:String(data.copyright||''),source:'API.Bible',version:'RVR 1960'
    });
  }catch(e){
    return json(res,502,{ok:false,error:'RVR 1960 lookup unavailable: '+String(e.message||e).slice(0,150)});
  }
}
