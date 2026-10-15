import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SPANISH_QUESTIONS,spanishQuestion,translatePublicQuestion,translateResponseStats,englishChoiceFromSpanish} from '../lib/quiz-es.js';
import {gradeAnswer,publicQuestion,publicReviewQuestion} from '../lib/quiz-engine.js';

const pack=JSON.parse(fs.readFileSync(new URL('../lib/matthew-11.quiz.json',import.meta.url),'utf8'));
const q=id=>pack.questions.find(item=>item.id===id);
test('every Matthew 11 question has an exact-position Spanish translation',()=>{
 assert.equal(pack.questions.length,22);
 assert.deepEqual(Object.keys(SPANISH_QUESTIONS).sort(),pack.questions.map(q=>q.id).sort());
 for(const item of pack.questions){
  const locale=spanishQuestion(item.id);
  assert.ok(locale.prompt&&locale.explanation&&locale.application,item.id);
  if(item.type==='multiple_choice'){
    assert.equal(locale.choices.length,item.choices.length);
    for(let n=0;n<item.choices.length;n++)
      assert.equal(englishChoiceFromSpanish(item,locale.choices[n]),item.choices[n],item.id);
  }else assert.ok(locale.answer,item.id);
 }
});
test('Spanish RVR1960 blanks grade correctly alongside their original KJV answers',()=>{
 for(const question of pack.questions.filter(q=>q.type==='fill_blank')){
   assert.equal(gradeAnswer(question,question.correctAnswer),true,question.id);
   assert.equal(gradeAnswer(question,spanishQuestion(question.id).answer),true,question.id);
   const plain=spanishQuestion(question.id).answer.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
   assert.equal(gradeAnswer(question,plain),true,question.id);
 }
 assert.equal(gradeAnswer(q('m11q05'),'tropiezo'),true);
 assert.equal(gradeAnswer(q('m11q13'),'ninos'),true);
 assert.equal(gradeAnswer(q('m11q16'),'descansar'),true);
 assert.equal(gradeAnswer(q('m11q05'),'tropiezos'),true);
 assert.equal(gradeAnswer(q('m11q05'),'equivocado'),false);
});
test('Spanish preview hides answers until server-controlled reveal stage',()=>{
 const mc=q('m11q01');
 const hidden=translatePublicQuestion(publicQuestion(mc));
 assert.equal(hidden.correctAnswer,undefined);
 assert.equal(hidden.explanation,undefined);
 assert.equal(hidden.application,undefined);
 assert.match(hidden.prompt,/Jesús/);
 assert.equal(hidden.reference,'Mateo 11:1');
 const hiddenReview=translatePublicQuestion(publicReviewQuestion(mc,'responses'));
 assert.equal(hiddenReview.correctAnswer,undefined);
 assert.equal(hiddenReview.explanation,undefined);
 const reveal=translatePublicQuestion(publicReviewQuestion(mc,'answer'));
 assert.equal(reveal.correctAnswer,spanishQuestion(mc.id).choices[mc.choices.indexOf(mc.correctAnswer)]);
 assert.equal(reveal.application,undefined);
 const application=translatePublicQuestion(publicReviewQuestion(mc,'application'));
 assert.equal(application.application,spanishQuestion(mc.id).application);
});
test('Spanish response percentages translate labels, never alter counts or grading',()=>{
 const question=q('m11q01');
 const english={responses:question.choices.map((answer,i)=>({answer,count:i,percent:i*10})),answered:6,correctPercent:37};
 const spanish=translateResponseStats(question,english);
 assert.deepEqual(spanish.responses.map(item=>item.percent),english.responses.map(item=>item.percent));
 assert.deepEqual(spanish.responses.map(item=>item.answer),spanishQuestion(question.id).choices);
 assert.equal(spanish.correctPercent,37);
});
test('Quiz UI has opt-in checkbox, centered distinct QRs, and keeps same login flow',()=>{
 const html=fs.readFileSync(new URL('../games/quiz.html',import.meta.url),'utf8');
 const js=fs.readFileSync(new URL('../games/quiz.js',import.meta.url),'utf8');
 const api=fs.readFileSync(new URL('../api/game/join.js',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../games/quiz-language-qr.css',import.meta.url),'utf8');
 assert.match(html,/id="quiz-spanish"/);
 assert.match(js,/language:\$\('quiz-spanish'\)/);
 assert.match(js,/display-join-big/);
 assert.match(js,/display-guide-big/);
 assert.match(js,/https:\/\/apostolicguide\.com\//);
 assert.match(api,/game\.state\?\.mode==='quiz'/);
 assert.match(css,/\.quiz-lobby-qr-grid/);
 assert.match(js,/\/api\/game\/join/);
});
