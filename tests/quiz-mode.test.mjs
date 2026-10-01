import test from 'node:test';
import assert from 'node:assert/strict';
import {answerMatches,computeQuizResults,expectedQuizUnits,nextReviewState,previousReviewState} from '../lib/quiz-engine.js';

const pack={questions:[
  {id:'q1',choices:['A','B','C','D'],correctAnswer:'A'},
  {id:'q2',choices:['A','B','C','D'],correctAnswer:'B'}
]};
const teams=[
  {id:'t1',name:'One',color:'#111111'},
  {id:'t2',name:'Two',color:'#222222'}
];
const players=[
  {player_id:'p1',team_id:'t1'},
  {player_id:'p2',team_id:'t1'},
  {player_id:'p3',team_id:'t2'}
];

test('answer matching ignores punctuation and case but not meaning',()=>{
  assert.equal(answerMatches('Come, take, learn','come take learn'),true);
  assert.equal(answerMatches('The Son','the son'),true);
  assert.equal(answerMatches('The Father','the son'),false);
});

test('individual mode scores every locked participant across every question',()=>{
  const submissions=[
    {question_id:'q1',player_id:'p1',team_id:'t1',answer:'A'},
    {question_id:'q2',player_id:'p1',team_id:'t1',answer:'B'},
    {question_id:'q1',player_id:'p2',team_id:'t1',answer:'C'},
    {question_id:'q2',player_id:'p2',team_id:'t1',answer:'B'},
    {question_id:'q1',player_id:'p3',team_id:'t2',answer:'A'}
  ];
  const results=computeQuizResults({pack,players,teams,submissions,locks:{p1:true,p2:true,p3:true},mode:'individual'});
  assert.equal(results.overallPercent,67);
  assert.equal(results.classCorrect,4);
  assert.equal(results.classPossible,6);
  assert.equal(results.teamResults.find(x=>x.teamId==='t1').percent,75);
  assert.equal(results.teamResults.find(x=>x.teamId==='t2').percent,50);
  assert.equal(results.questionStats[1].unanswered,1);
  assert.equal(results.questionStats[1].correctPercent,67);
});

test('team mode counts one submitted unit per occupied team',()=>{
  const submissions=[
    {question_id:'q1',player_id:'p1',team_id:'t1',answer:'A'},
    {question_id:'q2',player_id:'p1',team_id:'t1',answer:'B'},
    {question_id:'q1',player_id:'p3',team_id:'t2',answer:'D'},
    {question_id:'q2',player_id:'p3',team_id:'t2',answer:'B'}
  ];
  assert.deepEqual(expectedQuizUnits('team',players,teams),['t1','t2']);
  const results=computeQuizResults({pack,players,teams,submissions,locks:{t1:true,t2:true},mode:'team'});
  assert.equal(results.overallPercent,75);
  assert.equal(results.teamResults.find(x=>x.teamId==='t1').percent,100);
  assert.equal(results.teamResults.find(x=>x.teamId==='t2').percent,50);
});

test('unanswered questions count against the percentage',()=>{
  const results=computeQuizResults({
    pack,players:[players[0]],teams,submissions:[{question_id:'q1',player_id:'p1',team_id:'t1',answer:'A'}],
    locks:{p1:true},mode:'individual'
  });
  assert.equal(results.overallPercent,50);
  assert.equal(results.questionStats[1].unanswered,1);
});

test('review advances response to answer to explanation to application then next question',()=>{
  assert.deepEqual(nextReviewState(0,'responses',2),{index:0,stage:'answer',done:false});
  assert.deepEqual(nextReviewState(0,'answer',2),{index:0,stage:'explanation',done:false});
  assert.deepEqual(nextReviewState(0,'explanation',2),{index:0,stage:'application',done:false});
  assert.deepEqual(nextReviewState(0,'application',2),{index:1,stage:'responses',done:false});
  assert.deepEqual(nextReviewState(1,'application',2),{index:1,stage:'application',done:true});
  assert.deepEqual(previousReviewState(1,'responses'),{index:0,stage:'application'});
});
