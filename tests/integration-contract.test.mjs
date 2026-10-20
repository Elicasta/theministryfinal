import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('Quiz v2 endpoints use existing game session/player/submission tables',()=>{
  const create=read('api/game/quiz-create.js'),state=read('api/game/quiz-state.js'),action=read('api/game/quiz-action.js');
  assert.match(create,/game_sessions/);assert.match(state,/game_players/);
  assert.match(action,/game_submissions/);assert.match(action,/authenticatedPlayer/);
  assert.match(action,/verifyHost/);assert.match(action,/entryKeyForPlayer/);
});
test('The same join and projector routes are retained',()=>{
  const js=read('games/quiz.js');
  assert.match(js,/\/api\/game\/join/);assert.match(js,/\/games\/quiz\/display/);
  assert.match(js,/\/games\/quiz\/play/);
});
test('Solo and team leaders render independently',()=>{
  const js=read('games/quiz.js');assert.match(js,/soloResults/);assert.match(js,/teamResults/);
  assert.match(js,/data-participation="solo"/);assert.match(js,/data-participation="team"/);
});
test('Answer key stays out of public question payload',()=>{
  const state=read('api/game/quiz-state.js');
  assert.match(state,/questions:role==='host'\?questions:questions\.map\(q=>/);
  assert.match(state,/publicQuestion\(q\)/);
  assert.match(state,/publicReviewQuestion\(q,stage,isHost\)/);
});
test('Host starts with a frozen roster and only authorized actors can answer',()=>{
  const action=read('api/game/quiz-action.js');
  assert.match(action,/quizRoster:roster/);assert.match(action,/mayAnswer/);
  assert.match(action,/quizLocks/);
});
test('Fill-in blank Save & Next persists before navigation and completion',()=>{
  const js=read('games/quiz.js');
  assert.match(js,/async function navigateQuiz\(delta\)/);
  assert.match(js,/if\(!await saveFillAnswer\(\)\)return/);
  assert.match(js,/Save & Next/);
  assert.doesNotMatch(js,/id="save-fill-answer"/);
});
test('Projector review is stage-focused and uses a fitted QR code',()=>{
  const js=read('games/quiz.js'),css=read('games/quiz-v2-extra.css');
  assert.match(js,/reviewContent\(r,false,true\)/);
  assert.match(js,/qr\('display-qr',shareLink\(snap.gameCode\),72\)/);
  assert.match(css,/\.display-join \.small-qr\{width:80px/);
  assert.match(css,/grid-template-rows:86px minmax\(0,1fr\) 50px/);
  assert.match(css,/\.player-shell input/);
  assert.match(css,/font-size:16px!important/);
});