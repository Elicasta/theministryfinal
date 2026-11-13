import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const id='how-to-endure-to-the-end-2026-11-05';
const lesson=JSON.parse(read('content/'+id+'-slides.json'));
const source=JSON.parse(read('content/'+id+'.json'));
const rvr=JSON.parse(read('content/'+id+'-rvr1960-supplied.json'));

const library=JSON.parse(read('lesson-library.json'));
const engine=read('engine/engine.js');
const consoleJs=read('engine/ipad-console.js');
const theme=read('engine/endure-sermon.css');
const html=read('engine/index.html');
const routes=JSON.parse(read('vercel.json')).routes;

test('archived Endure sermon remains available in the original iPad console',()=>{
  assert.notEqual(library.latest,id);
  const matching=library.lessons.filter(x=>x.id===id);
  assert.equal(matching.length,1);
  assert.equal(matching[0].artifacts.presentation,'/presenter?lesson='+id);
  assert.equal(matching[0].engineSource,'/content/'+id+'-slides.json');
  assert.ok(html.includes('/engine/endure-sermon.css'));
  assert.ok(html.includes('/presenter?lesson='+library.latest));
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

test('RVR1960 contains every user-supplied verse exactly, without network dependency',()=>{
  assert.equal(rvr.passages.length,25);
  assert.equal(rvr.passages.flatMap(p=>p.verses).length,49);
  assert.equal(lesson.verses.length,46);
  assert.equal(lesson.localRvr1960,true);
  assert.equal(lesson.spanishSource,'RVR1960');
  assert.equal(lesson.spanishCopyrightNotice,rvr.copyright);
  assert.equal(lesson.suppliedSpanishPassages.length,25);
  assert.equal(lesson.slides.filter(s=>s.type==='verse'&&s.es?.text).length,32);
  assert.equal(lesson.slideScriptures.filter(s=>s?.spanishStatus==='ready').length,32);
  const parseRef=raw=>{
    const s=raw.replace(/–/g,'-').replace(/^Jude (\d+)$/,'Jude 1:$1');
    const m=s.match(/^(.+?) (\d+):(\d+)(?:-(\d+))?$/);
    assert.ok(m,'Malformed reference '+raw);
    return {book:m[1],chapter:Number(m[2]),start:Number(m[3]),end:Number(m[4]||m[3])};
  };
  const englishPassages=source.sections.flatMap(section=>section.scriptures);
  for(let i=0;i<25;i++){
    const english=englishPassages[i],spanish=rvr.passages[i],
      enRef=parseRef(english.ref),esRef=parseRef(spanish.ref);
    assert.equal(enRef.start,esRef.start);
    assert.equal(enRef.end,esRef.end);
    assert.equal(enRef.chapter,esRef.chapter);
    assert.equal(spanish.verses.length,english.verses.length);
    const samePassageSlides=lesson.slides.filter(s=>s.type==='verse'&&s.sourceRef===english.ref);
    assert.ok(samePassageSlides.length,'Missing projected passage: '+english.ref);
    for(const [j,v] of spanish.verses.entries()){
      assert.equal(v.number,english.verses[j].number);
      const englishRef=enRef.book+' '+enRef.chapter+':'+v.number;
      const spanishRef=esRef.book+' '+esRef.chapter+':'+v.number;
      const pair=lesson.verses.find(row=>row.ref_en===englishRef);
      assert.ok(pair,'Missing Spanish pairing: '+englishRef);
      assert.equal(pair.ref_es,spanishRef);
      assert.equal(pair.text_es,v.text);
      assert.equal(pair.spanishSource,'RVR1960');
      assert.equal(pair.spanishStatus,'ready');
      assert.ok(samePassageSlides.some(s=>s.es.text.includes(v.text)),
        'Scripture cue missing user-provided RVR1960: '+englishRef);
    }
  }
  assert.ok(lesson.verses.some(v=>v.ref_en==='Jude 1:24'&&v.ref_es==='Judas 1:24'));
});

test('Spanish is available for all scripture slides while KJV stays on the main deck',()=>{
  for(const [index,s] of lesson.slides.entries()){
    if(s.type!=='verse')continue;
    const sv=lesson.slideScriptures[index],note=lesson.manuscript[index];
    assert.equal(s.es.type,'verse');
    assert.equal(s.es.ref,sv.ref_es);
    assert.equal(s.es.text,sv.text_es);
    assert.equal(s.text,sv.text_en);
    assert.match(note.html,/<details class="sermon-rvr">/);
    assert.ok(note.html.includes(s.es.ref));
    assert.ok(note.html.includes('KJV'));
  }
  assert.equal(lesson.sideTvSpanishMirror,false);
  assert.equal(lesson.scriptureManualOnly,true);
  assert.match(engine,/lesson\?\.localRvr1960===true/);
  assert.match(engine,/!isMirroredSermon\(\)&&!sc\.text_es\)resolveSpanish\(sc,revision\)/);
  assert.match(theme,/\.sermon-rvr summary/);
});

test('Spanish side screens match the main projector color palette',()=>{
  const main=theme.match(/body\[data-lesson="how-to-endure-to-the-end-2026-11-05"\] #projector \.stage,[\s\S]*?background:([^;]+);/);
  const side=theme.match(/body\[data-lesson="how-to-endure-to-the-end-2026-11-05"\] #scriptures\.scripture-screen\{[\s\S]*?background:([^;]+);/);
  assert.ok(main,'Main projector background missing');
  assert.ok(side,'Side-screen background missing');
  assert.equal(side[1].trim(),main[1].trim(),'Side-screen gradient must match main');
  for(const fragment of [
    '#scriptures .scripture-primary',
    'border-left-color:#b8443b',
    '#scriptures .scripture-ref',
    'color:#ce8575',
    '#scriptures .scripture-text',
    'color:#f2eade',
    '#scriptures .scripture-copyright',
    '#scriptures .scripture-wait-title'
  ])assert.ok(theme.includes(fragment),'Side-screen color rule missing: '+fragment);
  assert.equal(lesson.scriptureManualOnly,true);
  assert.equal(lesson.sideTvSpanishMirror,false);
});
