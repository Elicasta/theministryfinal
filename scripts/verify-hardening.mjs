import fs from 'node:fs';

const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const lib=readJson('lesson-library.json');
const archive=readJson('library/lesson-archive.json');
const vercel=readJson('vercel.json');

const fail=(msg)=>{throw new Error(msg)};
if(!Array.isArray(lib.lessons)||lib.lessons.length<1)fail('lesson library is empty');
const ids=new Set();
for(const lesson of lib.lessons){
  if(ids.has(lesson.id))fail('duplicate lesson id: '+lesson.id);
  ids.add(lesson.id);
  if(lesson.status!=='stable'||lesson.knownGood!==true)fail('lesson not marked stable: '+lesson.id);
  for(const key of ['presentation','manuscript']){
    if(!lesson.artifacts?.[key]?.startsWith('/'))fail('missing '+key+' route for '+lesson.id);
  }
  if(lesson.manuscriptType==='archive'&&!archive.lessons?.[lesson.id])fail('missing archive snapshot for '+lesson.id);
}
if(!ids.has(lib.latest))fail('latest lesson does not exist: '+lib.latest);

const routes=new Map((vercel.rewrites||[]).map(x=>[x.source,x.destination]));
if(routes.get('/lessons')!=='/library/index.html')fail('/lessons route missing');
if(routes.get('/lessons/manuscript')!=='/library/manuscript.html')fail('/lessons/manuscript route missing');

for(const route of ['/live','/admin','/remote','/mobile','/projector','/scriptures','/confidence','/obsslides','/obslowerthirds','/class','/presenter']){
  if(routes.get(route)!=='/engine/index.html')fail('unified engine route missing: '+route);
}
for(const lesson of lib.lessons){
  if(lesson.engine!=='ministry-unified-v2')fail('lesson not assigned to unified engine: '+lesson.id);
  if(!lesson.artifacts?.legacyPresentation)fail('legacy presentation fallback missing: '+lesson.id);
}
for(const file of ['engine/index.html','engine/lesson-loader.js','engine/engine.js','engine/engine.css']){
  if(!fs.existsSync(file))fail('unified engine file missing: '+file);
}
for(const file of ['engine/lesson-loader.js','engine/engine.js']){
  const src=fs.readFileSync(file,'utf8');
  try{new Function(src)}catch(e){fail(file+' syntax error: '+e.message)}
}

const scriptureArchive=readJson('library/scripture-archive.json');
for(const id of ['ministry-lesson-1','ministry-lesson-2','ministry-lesson-3','ministry-lesson-4']){
  const item=scriptureArchive.lessons?.[id];
  if(!item)fail('bilingual Scripture archive missing: '+id);
  if(!Array.isArray(item.scriptureMap)||!item.scriptureMap.length)fail('slide Scripture map missing: '+id);
  if(item.scriptureMap.some(x=>!x?.text_en||!x?.text_es))fail('slide Scripture map is not bilingual: '+id);
}
const unifiedEngine=fs.readFileSync('engine/engine.js','utf8');
if(!unifiedEngine.includes('scriptureOutput:null'))fail('persistent Scripture TV state missing');
if(!unifiedEngine.includes('if(autoScripture) state.scriptureOutput=autoScripture'))fail('Scripture slides do not auto-follow to side TV');
if(!unifiedEngine.includes("c.innerHTML=state.scriptureOutput"))fail('Scripture route is not bound to persistent Scripture TV state');
if(!unifiedEngine.includes('function clearScriptureOutput()'))fail('explicit Scripture TV clear missing');
if(!unifiedEngine.includes('function pushVerseTV(i)'))fail('Scripture TV-only push missing');
if(!unifiedEngine.includes("return '<div class=\"take-ref\"'"))fail('main projector Scripture takeover styling changed');
const engineHtml=fs.readFileSync('engine/index.html','utf8');
if(!engineHtml.includes('Clear Scripture TV'))fail('Scripture TV clear control missing');
if(engineHtml.includes('Output Language'))fail('global output language controls should not drive projector slides');
const engineCss=fs.readFileSync('engine/engine.css','utf8');
if(!engineCss.includes('.scripture-screen .scripture-primary'))fail('side-TV Scripture styles are not scoped');
if(!engineCss.includes('background:#000!important'))fail('side-TV black Scripture background missing');
const engine=fs.readFileSync('engine/engine.js','utf8');
if(!engine.includes("TYPE='ministry_unified_state'"))fail('unified state contract missing');
if(!engine.includes("language:'en'"))fail('language state missing');
if(!engine.includes('/api/poll-save'))fail('unified poll persistence missing');
if(!engine.includes("data-class-vote-index"))fail('canonical translated poll vote mapping missing');

const student=fs.readFileSync('kingdom-evidence-student.js','utf8');
if(!student.includes('Saving vote…')||!student.includes('Tap an answer to retry'))fail('class portal vote status hardening missing');

for(const file of ['kingdom-evidence-presenter.js','kingdom-evidence.js']){
  const src=fs.readFileSync(file,'utf8');
  if(!src.includes('/api/poll-save'))fail('poll persistence missing from '+file);
}

for(const file of ['api/poll-save.js','api/poll-vote-submit.js']){
  const src=fs.readFileSync(file,'utf8');
  if(!src.includes("res.status(503)"))fail('visible poll storage failure missing from '+file);
}

console.log('Ministry hardening checks passed');
console.log('Lessons:',lib.lessons.length,'Latest:',lib.latest);
