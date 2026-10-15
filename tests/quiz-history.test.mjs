import test from 'node:test';
import assert from 'node:assert/strict';
import {buildQuizArchive} from '../lib/quiz-history.js';

const people=[
  {player_id:'p-solo',name:'Solo Person',team_id:'solo'},
  {player_id:'p-team-1',name:'Team Member One',team_id:'team-1'},
  {player_id:'p-team-2',name:'Team Member Two',team_id:'team-1'},
  {player_id:'p-inactive',name:'Not submitted',team_id:'solo'}
];
const row={
  id:'8f1fd5b3-9b8e-4bfc-a3cf-e0e42a687600',game_code:'ABC234',
  state:{mode:'quiz',quizMode:'mixed',quizFinishedAt:'2026-10-15T20:00:00.000Z',
    quizLocks:{'solo:p-solo':'2026-10-15T19:59:00.000Z','team:team-1':'2026-10-15T19:59:30.000Z'},
    teams:[{id:'team-1',name:'Blue Team',captainPlayerId:'p-team-1'}],
    quizRoster:[
      {key:'solo:p-solo',mode:'solo',playerId:'p-solo',playerIds:['p-solo']},
      {key:'team:team-1',mode:'team',teamId:'team-1',playerIds:['p-team-1','p-team-2']},
      {key:'solo:p-inactive',mode:'solo',playerId:'p-inactive',playerIds:['p-inactive']}
    ]
  },
  question_pack:{id:'quiz-v4',scripture:'Matthew 11',questions:[
    {id:'q1',type:'multiple_choice',prompt:'Question 1?',reference:'Matthew 11:1',choices:['A','B','C','D'],correctAnswer:'B'},
    {id:'q2',type:'fill_blank',prompt:'Question 2?',reference:'Matthew 11:28',correctAnswer:'rest',acceptedAnswers:['rest']}
  ]}
};
const saves=[
  {question_id:'q1',player_id:'p-solo',team_id:'solo',answer:'B',created_at:'2026-10-15T19:55:00Z'},
  {question_id:'q2',player_id:'p-solo',team_id:'solo',answer:'res',created_at:'2026-10-15T19:55:00Z'},
  {question_id:'q1',player_id:'p-team-1',team_id:'team-1',answer:'A',created_at:'2026-10-15T19:55:00Z'},
  {question_id:'q2',player_id:'p-team-1',team_id:'team-1',answer:'rest',created_at:'2026-10-15T19:55:00Z'}
];

test('archive creates one historical attempt for each submitted player, not only team captain',()=>{
 const rows=buildQuizArchive(row,people,saves);
 assert.equal(rows.length,3);
 assert.equal(rows.some(r=>r.player_id==='p-inactive'),false);
 assert.equal(rows.filter(r=>r.participation==='team').length,2);
 assert.equal(rows.find(r=>r.player_id==='p-team-2').team_name,'Blue Team');
 assert.equal(rows.find(r=>r.player_id==='p-team-2').answers[0].answer,'A');
 assert.equal(rows.find(r=>r.player_id==='p-team-2').answers[1].answer,'rest');
 assert.equal(rows.find(r=>r.player_id==='p-team-2').correct_count,1);
 assert.equal(rows.find(r=>r.player_id==='p-solo').correct_count,2);
 assert.equal(rows.find(r=>r.player_id==='p-solo').answers.length,2);
});
test('no made-up attempts for unanswered or active rooms',()=>{
 assert.deepEqual(buildQuizArchive({...row,state:{...row.state,quizLocks:{}}},people,saves),[]);
 assert.deepEqual(buildQuizArchive({...row,state:{...row.state,mode:'battle'}},people,saves),[]);
});
test('archived team answer is never attributed as if a non-captain submitted it',()=>{
 const rows=buildQuizArchive(row,people,saves),other=rows.find(r=>r.player_id==='p-team-2');
 assert.equal(other.answers[0].submittedBy,'p-team-1');
 assert.equal(other.captain_player_id,'p-team-1');
 assert.equal(other.participation,'team');
});
