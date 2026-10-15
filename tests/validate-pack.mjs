import fs from 'node:fs';
import assert from 'node:assert/strict';
const pack=JSON.parse(fs.readFileSync(new URL('../lib/matthew-11.quiz.json',import.meta.url),'utf8'));
assert.equal(pack.questions.length,22);
const ids=new Set();
for(const [i,q] of pack.questions.entries()){
 assert.ok(q.id&&!ids.has(q.id),`unique id: ${i}`);ids.add(q.id);
 for(const k of ['prompt','correctAnswer','reference','explanation','application','section','category'])assert.ok(q[k]?.trim(),`${q.id}: ${k}`);
 if(q.type==='multiple_choice'){
  assert.equal(q.choices?.length,4,`${q.id}: four choices`);
  assert.ok(q.choices.includes(q.correctAnswer),`${q.id}: answer is a choice`);
  assert.equal(new Set(q.choices).size,4,`${q.id}: distinct options`);
 }else if(q.type==='fill_blank'){
  assert.ok(q.prompt.includes('□□□□'),`${q.id}: contains visible blank`);
  assert.ok(q.acceptedAnswers.includes(q.correctAnswer),`${q.id}: accepted spelling`);
  assert.ok(q.prompt.includes('(one word)'),`${q.id}: required answer length is clear`);
 }else throw new Error(`${q.id}: bad type`);
}
console.log('Matthew 11 validated: 22 distinct questions, references and teaching layers.');