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
  const stable=lesson.status==='stable'&&lesson.knownGood===true;
  const ready=lesson.status==='ready'&&lesson.knownGood===false;
  if(!stable&&!ready)fail('lesson has invalid lifecycle state: '+lesson.id);
  if(ready){
    if(!lesson.engineSource?.startsWith('/content/'))fail('ready lesson needs a native source: '+lesson.id);
    const file=lesson.engineSource.slice(1);
    if(!fs.existsSync(file))fail('ready lesson source missing: '+file);
    const draft=readJson(file);
    if(draft.id!==lesson.id||!Array.isArray(draft.slides)||!draft.slides.length)fail('ready lesson data invalid: '+lesson.id);
  }
  for(const key of ['presentation','manuscript']){
    if(!lesson.artifacts?.[key]?.startsWith('/'))fail('missing '+key+' route for '+lesson.id);
  }
  if(lesson.manuscriptType==='archive'&&!archive.lessons?.[lesson.id])fail('missing archive snapshot for '+lesson.id);
}
if(!ids.has(lib.latest))fail('latest lesson does not exist: '+lib.latest);

const routes=new Map((vercel.routes||vercel.rewrites||[]).map(x=>[x.src||x.source,x.dest||x.destination]));
if(routes.get('/lessons')!=='/library/index.html')fail('/lessons route missing');
if(routes.get('/lessons/manuscript')!=='/library/manuscript.html')fail('/lessons/manuscript route missing');

for(const route of ['/live','/admin','/remote','/mobile','/projector','/scriptures','/confidence','/obsslides','/obslowerthirds','/class','/presenter']){
  if(routes.get(route)!=='/engine/index.html')fail('unified engine route missing: '+route);
}
for(const lesson of lib.lessons){
  if(lesson.engine!=='ministry-unified-v2')fail('lesson not assigned to unified engine: '+lesson.id);
  if(lesson.status==='stable'&&!lesson.artifacts?.legacyPresentation)fail('legacy presentation fallback missing: '+lesson.id);
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
if(!unifiedEngine.includes('const autoScripture=scriptureForSlide(t)')||!unifiedEngine.includes('state.scriptureOutput={...autoScripture,revision')||!unifiedEngine.includes("if(autoScripture&&lesson?.id!=='inner-healing-2026-10-25')resolveSpanish(autoScripture,revision)"))fail('Scripture slides do not auto-follow to side TV');
if(!unifiedEngine.includes("const current=state.scriptureOutput")||!unifiedEngine.includes("scriptureHtml(current)"))fail('Scripture route is not bound to persistent Scripture TV state');
if(!unifiedEngine.includes('function clearScriptureOutput()'))fail('explicit Scripture TV clear missing');
if(!unifiedEngine.includes('function pushVerseTV(i)'))fail('Scripture TV-only push missing');
if(!unifiedEngine.includes('class="take-ref">')||!unifiedEngine.includes('class="take-text">'))fail('main projector Scripture takeover styling changed');
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


// Ministry Games stays isolated from the teaching engine.
for(const route of ['/games','/games/host','/games/display','/games/play','/games/join']){
  if(routes.get(route)!=='/games/index.html')fail('game route missing: '+route);
}
for(const route of ['/games/quiz','/games/quiz/host','/games/quiz/display','/games/quiz/play']){
  if(routes.get(route)!=='/games/quiz.html')fail('quiz route missing: '+route);
}
for(const file of [
  'games/index.html','games/game.css','games/game.js','games/questions.js',
  'lib/game-db.js','lib/game-pack.js',
  'api/game/create.js','api/game/join.js','api/game/state.js','api/game/action.js',
  'api/game/generate.js','api/game/voice.js','api/game/live-session.js','api/game/health.js',
  'supabase/game-engine.sql',
  'games/quiz.html','games/quiz.css','games/quiz.js',
  'lib/quiz-pack.js','lib/quiz-engine.js','lib/quiz-history.js','lib/quiz-es.js',
  'games/quiz-language-qr.css','supabase/quiz-player-language.sql',
  'api/game/quiz-history.js','games/quiz-review-experience.css','supabase/quiz-history.sql',
  'api/game/quiz-create.js','api/game/quiz-state.js','api/game/quiz-action.js'
]){
  if(!fs.existsSync(file))fail('game engine file missing: '+file);
}
try{new Function(fs.readFileSync('games/game.js','utf8'))}catch(e){fail('games/game.js syntax error: '+e.message)}
try{new Function(fs.readFileSync('games/quiz.js','utf8'))}catch(e){fail('games/quiz.js syntax error: '+e.message)}
if(fs.readFileSync('games/questions.js','utf8').includes('correctAnswer'))fail('answer key leaked into browser question metadata');
const gameAction=fs.readFileSync('api/game/action.js','utf8');
if(!gameAction.includes('verifyHost')||!gameAction.includes('verifyPlayer'))fail('game action authorization missing');
if(!gameAction.includes('game_submissions'))fail('concurrency-safe game submissions missing');
if(!fs.readFileSync('lib/game-db.js','utf8').includes("version:'eq.'+String(row.version)"))fail('optimistic game-state concurrency guard missing');
const gameSchema=fs.readFileSync('supabase/game-engine.sql','utf8');
if(!gameSchema.includes('game_sessions')||!gameSchema.includes('game_players')||!gameSchema.includes('game_submissions'))fail('game database schema incomplete');
if(!gameSchema.includes('enable row level security'))fail('game tables must use RLS');
const liveApi=fs.readFileSync('api/game/live-session.js','utf8');
const gameBrowser=fs.readFileSync('games/game.js','utf8');
if(!liveApi.includes("'gpt-live-1'"))fail('GPT-Live model is not configured');
if(!liveApi.includes("'meridian'"))fail('Meridian must be the default Live voice');
if(!liveApi.includes('verifyDisplay'))fail('Live session endpoint must require display authorization');
if(!gameBrowser.includes('RTCPeerConnection'))fail('Game display must use WebRTC for GPT-Live');
if(!gameBrowser.includes("fetch('/api/game/voice'"))fail('Audible TTS fallback is missing');
if(!gameBrowser.includes("'session.commentary.append'"))fail('Meridian announcements must use GPT-Live commentary events');
if(gameBrowser.includes("'conversation.item.create'"))fail('Legacy Realtime conversation events must not drive GPT-Live');
if(!gameBrowser.includes('Bible Battle'))fail('Game UI must use Bible Battle branding');
const gameCss=fs.readFileSync('games/game.css','utf8');
if(!gameCss.includes('Bible Battle broadcast skin'))fail('Broadcast game skin is missing');
if(!gameBrowser.includes("renderQr('host-qr'"))fail('Host lobby join QR is missing');
if(!gameBrowser.includes("renderQr('display-qr'"))fail('Display join QR is missing');
if(gameBrowser.includes("state.phase!=='lobby'||players.length>0"))fail('Joined players must not lock team-count controls');
if(!gameBrowser.includes('NEW PACK READY'))fail('AI pack generation needs explicit success confirmation');
if(!gameCss.includes('Bible Battle Broadcast System v3'))fail('Broadcast graphics system v3 is missing');

const {spawnSync}=await import('node:child_process');
for(const file of ['lib/game-db.js','lib/game-pack.js','lib/quiz-pack.js','lib/quiz-engine.js','api/game/create.js','api/game/join.js','api/game/state.js','api/game/action.js','api/game/generate.js','api/game/voice.js','api/game/live-session.js','api/game/health.js','api/game/quiz-create.js','api/game/quiz-state.js','api/game/quiz-action.js','lib/quiz-history.js','api/game/quiz-history.js','lib/quiz-es.js']){
  const parsed=spawnSync(process.execPath,['--check','--input-type=module'],{input:fs.readFileSync(file,'utf8'),encoding:'utf8'});
  if(parsed.status!==0)fail(file+' syntax error: '+String(parsed.stderr||parsed.stdout).trim());
}

console.log('Ministry hardening checks passed');
console.log('Lessons:',lib.lessons.length,'Latest:',lib.latest);

if(!gameBrowser.includes("captain-board-select"))fail('Control captain board picker is missing');
if(!gameBrowser.includes("playerDo('OPEN_QUESTION'"))fail('Captain board selection is not wired to the game engine');
if(!gameBrowser.includes('createSilentInput'))fail('GPT-Live needs an active silent WebRTC input track for announcer mode');
if(!gameBrowser.includes('waitForIceComplete'))fail('GPT-Live WebRTC must wait for ICE gathering');
if(!gameBrowser.includes("evt.type==='session.started'"))fail('GPT-Live must wait for session.started before speaking');
if(!gameBrowser.includes("state.phase==='steal_buzz'"))fail('Player steal-buzz state is missing');
if(!gameCss.includes('Projector: fixed 16:9 broadcast composition'))fail('Fixed 16:9 broadcast composition is missing');

if(!gameAction.includes('answerMatches'))fail('deterministic automatic answer grading is missing');
if(!gameAction.includes("resultNextPhase"))fail('automatic result-to-board/steal transition is missing');
if(!gameAction.includes("Only the captain of the team in control"))fail('captain board-selection authorization is missing');
if(!gameBrowser.includes('steal-takeover'))fail('eligible-player steal takeover is missing');
if(!gameBrowser.includes('renderQuestionLibrary'))fail('host question library is missing');
if(!gameBrowser.includes('initBattleFx'))fail('canvas broadcast graphics runtime is missing');
const gameDb=fs.readFileSync('lib/game-db.js','utf8');
if(!gameDb.includes("state.resultNextPhase!=='steal_buzz'"))fail('pre-steal answer hiding is missing');

if(gameBrowser.includes("data-question-id=\"'+esc(q?.id"))fail('host board must be monitor-only; captains choose questions');
if(!gameBrowser.includes("lastTeamOccupied"))fail('lobby team reduction must protect populated teams');
if(!gameAction.includes("Move them before removing that team"))fail('server must reject removing populated teams');
if(!gameAction.includes("captained=state.teams.find"))fail('game start must prefer a team with a captain');

const quizPack=JSON.parse(fs.readFileSync('lib/matthew-11.quiz.json','utf8'));
if(quizPack.questions.length!==22)fail('Matthew 11 Quiz & Review must contain 22 questions');
if(quizPack.questions.filter(q=>q.type==='multiple_choice').length!==15)fail('Matthew 11 must include 15 multiple-choice questions');
if(quizPack.questions.filter(q=>q.type==='fill_blank').length!==7)fail('Matthew 11 must include 7 fill-in-the-blank questions');
if(quizPack.questions.some(q=>!q.explanation||!q.application))fail('quiz explanation/application missing');
const quizAction=fs.readFileSync('api/game/quiz-action.js','utf8');
if(!quizAction.includes("action==='SUBMIT_QUIZ'"))fail('quiz submission lock is missing');
if(!quizAction.includes("action==='START_REVIEW'"))fail('quiz review flow is missing');

// Long-lived Lumaneer history is stored separately from session-scoped state.
const archiveSchema=fs.readFileSync('supabase/quiz-history.sql','utf8');
if(!archiveSchema.includes('create table if not exists public.quiz_history')||!archiveSchema.includes('enable row level security'))fail('private quiz history schema missing');
const archiveAction=fs.readFileSync('api/game/quiz-action.js','utf8');
if(!archiveAction.includes('archiveQuizHistory')||!archiveAction.includes("action==='ARCHIVE_HISTORY'"))fail('idempotent historical quiz persistence missing');
const archiveRead=fs.readFileSync('api/game/quiz-history.js','utf8');
if(!archiveRead.includes('authenticatedPlayer')||!archiveRead.includes("player_id:'eq.'+auth.playerId"))fail('participant history read must be personally authenticated');
const theater=fs.readFileSync('games/quiz-review-experience.css','utf8');
for(const phase of ['quiz-theater-responses','quiz-theater-answer','quiz-theater-explanation','quiz-theater-application']){
  if(!theater.includes(phase))fail('classroom review stage missing: '+phase);
}

// Bilingual quiz must remain a per-player display choice with canonical scoring.
const esSource=fs.readFileSync('lib/quiz-es.js','utf8');
if(!esSource.includes('translatePublicQuestion')||!esSource.includes('SPANISH_QUESTIONS'))fail('RVR1960 quiz translation missing');
const gameJoin=fs.readFileSync('api/game/join.js','utf8');
if(!gameJoin.includes("game.state?.mode==='quiz'?{preferred_language"))fail('quiz language selection must not modify Bible Battle login');
const stageHtml=fs.readFileSync('games/quiz.html','utf8');
if(!stageHtml.includes('quiz-spanish')||!stageHtml.includes('quiz-language-qr.css'))fail('player Spanish opt-in or QR styles missing');
const quizDisplay=fs.readFileSync('games/quiz.js','utf8');
if(!quizDisplay.includes('display-guide-big')||!quizDisplay.includes('display-join-big')||!quizDisplay.includes('apostolicguide.com'))fail('large centered distinct lobby QRs missing');
