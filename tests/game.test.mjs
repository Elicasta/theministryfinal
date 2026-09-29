import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'bible-battle-test-'));
process.env.MINISTRY_LOCAL_DB=path.join(folder,'games.json');
after(()=>fs.rmSync(folder,{recursive:true,force:true}));
const {default:create}=await import('../api/game/create.js');
const {default:action}=await import('../api/game/action.js');
const {default:join}=await import('../api/game/join.js');
const {default:state}=await import('../api/game/state.js');
const {getGameByCode,saveGameState,publicGameState}=await import('../lib/game-db.js');
const {advanceClock}=await import('../lib/game-clock.js');
const {BUILTIN_GAME_PACK}=await import('../lib/game-pack.js');
async function call(handler,body={},method='POST'){
  const out={status:200};const res={setHeader(){},status(n){out.status=n;return this},json(value){out.body=value;return this}};
  await handler({method,body,query:body},res);return out;
}
async function game(settings={}){const r=await call(create,{teamCount:4,settings});assert.equal(r.status,200);return {code:r.body.gameCode,hostToken:r.body.hostToken}}
async function player(g,teamId,name='Player'){const r=await call(join,{code:g.code,teamId,name});assert.equal(r.status,200);return {code:g.code,playerId:r.body.player.playerId,playerToken:r.body.playerToken}}
const act=(g,name,extra={})=>call(action,{...g,action:name,...extra});

test('complete host, player, steal and final-round game',async t=>{
  const g=await game(),red=await player(g,'team-1','Red captain'),blue=await player(g,'team-2','Blue captain');
  await t.test('ready pack has six complete categories and references',()=>{
    assert.equal(BUILTIN_GAME_PACK.questions.length,30);assert.equal(new Set(BUILTIN_GAME_PACK.questions.map(q=>q.id)).size,30);
    for(const c of BUILTIN_GAME_PACK.categories)assert.deepEqual(BUILTIN_GAME_PACK.questions.filter(q=>q.category===c.id).map(q=>q.points),[100,200,300,400,500]);
    assert.ok(BUILTIN_GAME_PACK.questions.every(q=>q.reference&&q.correctAnswer));
  });
  await t.test('host credentials required; player cannot award points',async()=>{
    assert.equal((await act({...g,hostToken:'bad'},'START')).status,401);
    assert.equal((await act(red,'JUDGE',{correct:true})).status,403);
    assert.equal((await call(state,{code:g.code,hostToken:'bad'})).status,401);
  });
  await t.test('host can select, pause and resume; public answer key stays hidden',async()=>{
    assert.equal((await act(g,'START')).status,200);assert.equal((await act(g,'START')).status,409);
    let r=await act(g,'OPEN_QUESTION',{questionId:'pentateuch200'});assert.equal(r.body.state.phase,'captain');
    const publicView=(await call(state,{code:g.code},'GET')).body;
    assert.equal(publicView.state.activeQuestion.correctAnswer,'');assert.ok(publicView.pack.board.every(q=>!q.correctAnswer&&!q.prompt));
    await act(g,'PAUSE');assert.equal((await act(red,'ANSWER',{answer:'Joseph'})).status,409);
    r=await act(g,'RESUME');assert.equal(r.body.state.timerPausedAt,null);
    assert.equal((await act(g,'RESET_TIMER')).status,200);
  });
  await t.test('captain locks answer; host scores once and reveal remains',async()=>{
    let r=await act(red,'ANSWER',{answer:'Joseph'});assert.equal(r.body.state.phase,'locked');
    const outcomes=await Promise.all([act(g,'JUDGE',{correct:true}),act(g,'JUDGE',{correct:true})]);
    assert.equal(outcomes.filter(r=>r.status===200).length,1);
    r=await call(state,g);assert.equal(r.body.teams[0].score,200);
    const row=(await getGameByCode(g.code)).row;await advanceClock(row,Date.now()+3000);
    r=await call(state,{code:g.code},'GET');assert.equal(r.body.state.phase,'reveal');assert.equal(r.body.state.activeQuestion.correctAnswer,'Joseph');
    assert.equal((await act(g,'OPEN_STEAL')).status,409);
  });
  await t.test('wrong answer stays secret before steal; other team can buzz and earn 60%',async()=>{
    await act(g,'NEXT');await act(g,'OPEN_QUESTION',{questionId:'pentateuch100'});await act(red,'ANSWER',{answer:'Moses'});await act(g,'JUDGE',{correct:false});
    let r=await call(state,{code:g.code},'GET');assert.equal(r.body.state.lastResult.correctAnswer,undefined);
    await advanceClock((await getGameByCode(g.code)).row,Date.now()+3000);
    assert.equal((await act(red,'BUZZ')).status,403);r=await act(blue,'BUZZ');assert.equal(r.body.state.phase,'steal_captain');
    await act(blue,'ANSWER',{answer:'Noah'});r=await act(g,'JUDGE',{correct:true});assert.equal(r.body.teams[1].score,60);assert.equal(r.body.state.controlTeamId,'team-2');
    await act(g,'REVEAL');await act(g,'NEXT');assert.equal((await act(g,'OPEN_QUESTION',{questionId:'pentateuch100'})).status,409);
  });
  await t.test('final wagers and answers lock; duplicate judging cannot change score',async()=>{
    await act(g,'START_FINAL');assert.equal((await act(red,'FINAL_WAGER',{wager:100})).status,200);
    assert.equal((await act(red,'FINAL_WAGER',{wager:200})).status,409);
    await act(blue,'FINAL_WAGER',{wager:60});await act(g,'OPEN_FINAL');await act(red,'FINAL_ANSWER',{answer:'Antioch'});
    assert.equal((await act(red,'FINAL_ANSWER',{answer:'Rome'})).status,409);
    assert.equal((await call(state,blue)).body.state.finalAnswers['team-1'],undefined);
    let r=await act(g,'FINAL_JUDGE',{teamId:'team-1',correct:true});assert.equal(r.body.teams[0].score,300);
    assert.equal((await act(g,'FINAL_JUDGE',{teamId:'team-1',correct:true})).status,409);
    for(const teamId of ['team-2','team-3','team-4'])r=await act(g,'FINAL_JUDGE',{teamId,correct:false});
    assert.equal(r.body.state.phase,'winner');assert.deepEqual(r.body.state.winnerTeamIds,['team-1']);
    assert.equal((await act(g,'OPEN_FINAL')).status,409);
  });
});

test('simultaneous joins retain round state and produce one authoritative captain',async()=>{
  const g=await game();const results=await Promise.all(Array.from({length:8},(_,i)=>player(g,'team-1','Player '+i)));
  const view=(await call(state,g)).body;assert.equal(view.players.length,8);assert.equal(view.players.filter(p=>p.isCaptain).length,1);
  await act(g,'START');await act(g,'OPEN_QUESTION',{questionId:'gospels100'});
  await Promise.all([player(g,'team-2','Late join'),act(g,'PAUSE')]);
  const row=(await getGameByCode(g.code)).row;assert.equal(row.state.activeQuestionId,'gospels100');assert.ok(row.state.timerPausedAt);
  assert.equal(results.length,8);
});

test('expired answer windows reject late answers even without a host ticking',async()=>{
  const g=await game({autoSteal:false}),p=await player(g,'team-1');await act(g,'START');await act(g,'OPEN_QUESTION',{questionId:'letters100'});
  const row=(await getGameByCode(g.code)).row;row.state.captainDeadline=Date.now()-10000;row.state.teamDeadline=Date.now()-5000;await saveGameState(row,row.state);
  const r=await act(p,'ANSWER',{answer:'Love'});assert.equal(r.status,409);
  assert.equal((await call(state,{code:g.code},'GET')).body.state.phase,'reveal');
});

test('team answer suggestions cannot cross team boundary',()=>{
  const row={state:{phase:'captain',teams:[]},question_pack:BUILTIN_GAME_PACK};
  const submissions=[{team_id:'red',answer:'secret'},{team_id:'blue',answer:'own'}];
  assert.deepEqual(publicGameState(row,[],'player',submissions,'blue').submissions.map(x=>x.answer),['own']);
  assert.deepEqual(publicGameState(row,[],'public',submissions).submissions,[]);
});

test('host can judge a spoken steal without crediting the original locked team',async()=>{
  const g=await game(),red=await player(g,'team-1'),blue=await player(g,'team-2');
  await act(g,'START');await act(g,'OPEN_QUESTION',{questionId:'pentateuch200'});await act(red,'ANSWER',{answer:'Moses'});await act(g,'JUDGE',{correct:false});
  await advanceClock((await getGameByCode(g.code)).row,Date.now()+3000);await act(blue,'BUZZ');
  const r=await act(g,'JUDGE',{correct:true});assert.equal(r.body.teams[0].score,0);assert.equal(r.body.teams[1].score,120);
});

test('permanent projector waits, activates, ends, and never revives an old room',async()=>{
  const {default:current}=await import('../api/game/current.js');
  const g=await game();
  let r=await call(current,{},'GET');assert.equal(r.body.status,'standby');assert.equal(r.body.gameCode,null);
  await act(g,'START');r=await call(current,{},'GET');assert.equal(r.body.gameCode,g.code);assert.equal(r.body.status,'live');
  assert.deepEqual(Object.keys(r.body).sort(),['gameCode','ok','serverTime','status']);
  await act(g,'END');r=await call(current,{},'GET');assert.equal(r.body.status,'standby');assert.equal(r.body.gameCode,null);
  const next=await game();assert.equal((await call(current,{},'GET')).body.status,'standby');
  await act(next,'START');assert.equal((await call(current,{},'GET')).body.gameCode,next.code);
});
