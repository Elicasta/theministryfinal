import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const id='how-to-endure-to-the-end-2026-11-05';
const lesson=JSON.parse(read('content/'+id+'-slides.json'));
const source=JSON.parse(read('content/'+id+'.json'));
const library=JSON.parse(read('lesson-library.json'));
const engine=read('engine/engine.js');
const consoleJs=read('engine/ipad-console.js');
const theme=read('engine/endure-sermon.css');
const html=read('engine/index.html');
const routes=JSON.parse(read('vercel.json')).routes;

test('full sermon is the latest original iPad console lesson',()=>{
  assert.equal(library.latest,id);
  const matching=library.lessons.filter(x=>x.id===id);
  assert.equal(matching.length,1);
  assert.equal(matching[0].artifacts.presentation,'/presenter?lesson='+id);
  assert.equal(matching[0].engineSource,'/content/'+id+'-slides.json');
  assert.ok(html.includes('/engine/endure-sermon.css'));
  assert.ok(html.includes('/presenter?lesson='+id));
  assert.ok(!routes.some(x=>x.src==='/presenter/endure'));
});

test('all slides have matching iPad manuscript cue and scripture map',()=>{
  assert.equal(lesson.slides.length,48);
  assert.equal(lesson.manuscript.length,48);
  assert.equal(lesson.slideScriptures.length,48);
  assert.equal(lesson.slides.filter(x=>x.type==='verse').length,32);
  assert.equal(lesson.slides.filter(x=>x.sectionDivider).length,3);
  assert.equal(lesson.slides.filter(x=>x.closingDeclaration).length,1);
  assert.equal(lesson.slides[0].type,'cover');
  assert.equal(lesson.slides.at(-1).ref,'Matthew 24:13');
  for(let i=0;i<lesson.slides.length;i++){
    assert.equal(lesson.manuscript[i].slide,i);
    assert.ok(lesson.manuscript[i].html?.length>0,'Missing iPad notes at '+i);
    if(lesson.slides[i].type==='verse'){
      assert.equal(lesson.slideScriptures[i]?.ref_en,lesson.slides[i].ref);
      assert.equal(lesson.slideScriptures[i]?.text_en,lesson.slides[i].text);
    }
  }
});

test('source is preserved and every KJV verse appears in the slide deck',()=>{
  assert.equal(source.sections.length,12);
  assert.deepEqual(lesson.sourceSections,source.sections);
  const passages=source.sections.flatMap(x=>x.scriptures);
  assert.equal(passages.length,25);
  assert.equal(passages.flatMap(x=>x.verses).length,49);
  assert.equal(lesson.verses.length,46);
  const allSlides=lesson.slides.filter(s=>s.type==='verse').map(s=>s.text).join('\n');
  for(const p of passages)for(const v of p.verses){
    assert.ok(allSlides.includes(v.text),'Missing passage text: '+p.ref+' verse '+v.number);
    assert.ok(lesson.verses.some(x=>x.text_en===v.text),'Missing bank verse: '+p.ref+' '+v.number);
  }
  assert.equal(source.sections.at(-1).declaration,
    "I don't just want to start with Jesus. I want to finish with Jesus.");
});

test('tech team owns scripture screen; slides do not auto-push',()=>{
  assert.equal(lesson.scriptureManualOnly,true);
  assert.equal(lesson.audienceParticipation,false);
  assert.equal(lesson.hideAudienceQr,true);
  assert.equal(lesson.polls.length,0);
  assert.match(engine,/lesson\?\.scriptureManualOnly\?null:scriptureForSlide\(t\)/);
  assert.match(engine,/!lesson\?\.hideAudienceQr\?resourceQrCards/);
  assert.match(consoleJs,/lesson\.audienceParticipation===false/);
});

test('visual changes stay isolated to this one lesson',()=>{
  assert.match(theme,/#projector \.stage/);
  assert.match(theme,/\.p-verse/);
  assert.match(theme,/#presenter \.sermon-main-point/);
  const body=theme.replace(/\/\*[\s\S]*?\*\//g,'');
  for(const block of body.split('}').filter(part=>part.includes('{'))){
    assert.ok(block.split('{')[0].trim().startsWith('body[data-lesson="'+id+'"]'),
      'Unscoped selector in custom theme: '+block.slice(0,85));
  }
});
