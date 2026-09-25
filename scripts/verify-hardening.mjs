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
