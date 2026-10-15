import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  gradeAnswer,validateAnswer,expectedQuizUnits,expectedQuizEntries,
  entryKeyForPlayer,computeQuizResults,publicQuestion,publicReviewQuestion,
  nextReviewState,previousReviewState
} from '../lib/quiz-engine.js';

const pack=JSON.parse(fs.readFileSync(new URL('../lib/matthew-11.quiz.json',import.meta.url),'utf8'));
const question=id=>pack.questions.find(q=>q.id===id);
const teams=[{id:'solo',name:'Solo Participants'}, {id:'judah',name:'Judah',color:'#f00'}, {id:'acts',name:'Acts',color:'#00f'}];
const players=[
 {player_id:'p1',team_id:'solo',name:'Andrew'},
 {player_id:'p2',team_id:'solo',name:'Beth'},
 {player_id:'p3',team_id:'judah',name:'Captain'},
 {player_id:'p4',team_id:'judah',name:'Friend'},
 {player_id:'p5',team_id:'acts',name:'Alex'}
];
const marks=(id,answer,playerId,teamId)=>({question_id:id,answer,player_id:playerId,team_id:teamId,created_at:'2026-10-15T15:00:00Z'});

test('Matthew 11 pack is 18 sequential and balanced items',()=>{
  assert.equal(pack.questions.length,18);
  assert.equal(pack.questions.filter(q=>q.type==='multiple_choice').length,11);
  assert.equal(pack.questions.filter(q=>q.type==='fill_blank').length,7);
  assert.deepEqual(pack.questions.map(x=>x.id),Array.from({length:18},(_,i)=>`m11q${String(i+1).padStart(2,'0')}`));
});

test('typed answers accept case, punctuation and whitespace variations',()=>{
  const q=question('m11q03');
  assert.equal(gradeAnswer(q,'ANOTHER.'),true);
  assert.equal(gradeAnswer(q,'  another  '),true);
  assert.equal(gradeAnswer(q,'another person'),false);
  assert.equal(gradeAnswer(question('m11q05'),'Offended!'),true);
  assert.equal(gradeAnswer(question('m11q16'),' rested '),false);
});

test('multiple choice accepts only one of the four offered answers',()=>{
  const q=question('m11q14');
  assert.deepEqual(validateAnswer(q,'The Son'),{ok:true,answer:'The Son'});
  assert.equal(validateAnswer(q,'The Spirit').ok,false);
  assert.equal(gradeAnswer(q,'The Son'),true);
  assert.equal(gradeAnswer(q,'John the Baptist'),false);
});

test('fill answers reject empty or huge input',()=>{
  const q=question('m11q03');
  assert.equal(validateAnswer(q,'').ok,false);
  assert.equal(validateAnswer(q,'&<script>').ok,false);
  assert.equal(validateAnswer(q,'a'.repeat(121)).ok,false);
  assert.equal(validateAnswer(q,'another').ok,true);
});

test('expected entries count every solo once and each occupied team once',()=>{
  assert.deepEqual(expectedQuizUnits('mixed',players,teams),['solo:p1','solo:p2','team:judah','team:acts']);
  assert.equal(expectedQuizEntries(players,teams).find(x=>x.key==='team:judah').playerIds.length,2);
  assert.equal(entryKeyForPlayer(players[0]),'solo:p1');
  assert.equal(entryKeyForPlayer(players[2]),'team:judah');
});

test('mixed scoreboard isolates solo and team ranks and calculates per-unit room accuracy',()=>{
  const submissions=[
    marks('m11q03','ANOTHER','p1','solo'),marks('m11q05','wrong','p1','solo'),
    marks('m11q03','wrong','p2','solo'),marks('m11q05','offended','p2','solo'),
    marks('m11q03','another','p3','judah'),marks('m11q05','offended','p3','judah'),
    marks('m11q03','wrong','p5','acts'),marks('m11q05','offended','p5','acts')
  ];
  const partialPack={questions:[question('m11q03'),question('m11q05')]};
  const results=computeQuizResults({pack:partialPack,players,teams,submissions,
    locks:{'solo:p1':true,'solo:p2':true,'team:judah':true,'team:acts':true},mode:'mixed'});
  assert.equal(results.classCorrect,5);
  assert.equal(results.classPossible,8);
  assert.equal(results.overallPercent,63);
  assert.equal(results.countedUnits,4);
  assert.equal(results.representedPeople,5);
  assert.equal(results.soloResults.length,2);
  assert.equal(results.teamResults.length,2);
  assert.equal(results.teamResults.find(x=>x.teamId==='judah').percent,100);
  assert.equal(results.breakdown.soloPercent,50);
  assert.equal(results.questionStats[0].correctPercent,50);
});

test('host close excludes unsubmitted units from denominator',()=>{
  const results=computeQuizResults({
    pack:{questions:[question('m11q03')]},players,teams,
    submissions:[marks('m11q03','another','p1','solo')],
    locks:{'solo:p1':true},mode:'mixed'
  });
  assert.equal(results.countedUnits,1);
  assert.equal(results.totalUnits,4);
  assert.equal(results.overallPercent,100);
  assert.equal(results.questionStats[0].total,1);
});

test('unanswered blanks are incorrect but still count once submitted',()=>{
  const results=computeQuizResults({
    pack:{questions:[question('m11q03'),question('m11q05')]},
    players:[players[0]],teams,submissions:[marks('m11q03','another','p1','solo')],
    locks:{'solo:p1':true},mode:'mixed'
  });
  assert.equal(results.overallPercent,50);
  assert.equal(results.questionStats[1].unanswered,1);
});

test('participant payload hides answer key and explanations before reveal',()=>{
  const q=question('m11q03');
  const pub=publicQuestion(q);
  assert.equal('correctAnswer' in pub,false);
  assert.equal('acceptedAnswers' in pub,false);
  assert.equal('explanation' in pub,false);
  const initial=publicReviewQuestion(q,'responses',false);
  assert.equal('correctAnswer' in initial,false);
  assert.equal('explanation' in initial,false);
  assert.equal('application' in initial,false);
  assert.equal(publicReviewQuestion(q,'answer',false).correctAnswer,'another');
  assert.equal(publicReviewQuestion(q,'explanation',false).explanation,q.explanation);
  assert.equal(publicReviewQuestion(q,'application',false).application,q.application);
});

test('review keeps all four stages and last action closes',()=>{
  assert.deepEqual(nextReviewState(0,'responses',18),{index:0,stage:'answer',done:false});
  assert.deepEqual(nextReviewState(0,'answer',18),{index:0,stage:'explanation',done:false});
  assert.deepEqual(nextReviewState(0,'explanation',18),{index:0,stage:'application',done:false});
  assert.deepEqual(nextReviewState(0,'application',18),{index:1,stage:'responses',done:false});
  assert.deepEqual(nextReviewState(17,'application',18),{index:17,stage:'application',done:true});
  assert.deepEqual(previousReviewState(1,'responses'),{index:0,stage:'application'});
});

test('legacy all-individual and all-team modes remain supported',()=>{
  assert.deepEqual(expectedQuizUnits('individual',players,teams),['p1','p2','p3','p4','p5']);
  assert.deepEqual(expectedQuizUnits('team',players,teams),['judah','acts']);
  const results=computeQuizResults({pack:{questions:[question('m11q03')]},
    players:[players[2],players[3]],teams,submissions:[marks('m11q03','another','p3','judah')],locks:{judah:true},mode:'team'});
  assert.equal(results.overallPercent,100);
});