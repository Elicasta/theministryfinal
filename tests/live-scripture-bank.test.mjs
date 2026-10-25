import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
import {parsePassage,BOOKS} from '../lib/scripture-reference.mjs';
import scriptureApi from '../api/scripture.js';

const load=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const dom={window:{}};
runInNewContext(load('engine/scripture-tools.js'),dom);
const {parseInline,chapterOf}=dom.window.MinistryScriptureTools;
function mockResponse(){
  return {statusCode:200,data:null,headers:{},
    status(n){this.statusCode=n;return this},
    setHeader(k,v){this.headers[k]=v;return this},
    json(data){this.data=data;return this}};
}
test('canonical Scripture references cover both testaments, spans, and chapters',()=>{
  assert.equal(BOOKS.length,66);
  assert.deepEqual(parsePassage('Romans 6:16').passageId,'ROM.6.16');
  assert.deepEqual(parsePassage('Psalm 139:23–24').passageId,'PSA.139.23-PSA.139.24');
  assert.equal(parsePassage('1 Samuel 24:22').bookId,'1SA');
  assert.equal(parsePassage('Jude 1').chapterId,'JUD.1');
  assert.equal(parsePassage('Revelation 22').start,null);
  assert.equal(parsePassage('fake 19:2'),null);
  assert.equal(parsePassage('Romans 6:0'),null);
  assert.equal(parsePassage('Romans 6:1-120'),null);
});
test('tapping a manuscript verse derives an exact reference and clean KJV content',()=>{
  const scripture=parseInline('2 Corinthians 10:5 (KJV) Casting down imaginations, and every high thing that exalteth itself against the knowledge of God;');
  assert.equal(scripture.ref,'2 Corinthians 10:5');
  assert.match(scripture.text,/Casting down imaginations/);
  assert.equal(chapterOf('2 Corinthians 10:5'),'2 Corinthians 10');
  assert.equal(chapterOf('Psalm 139:23–24'),'Psalm 139');
  assert.equal(parseInline('Not a Bible quotation'),null);
});
test('KJV Bible Bank fetches each verse from a whole chapter with stable verse numbers',async()=>{
  const prev=globalThis.fetch;
  globalThis.fetch=async url=>{
    assert.match(String(url),/https:\/\/bible-api.com\/data\/kjv\/ROM\/6/);
    return {ok:true,status:200,json:async()=>({verses:[
      {verse:15,text:'What then? shall we sin, because we are not under the law, but under grace? God forbid.'},
      {verse:16,text:'Know ye not, that to whom ye yield yourselves servants to obey, his servants ye are...'}
    ]})};
  };
  try{
    const res=mockResponse();
    await scriptureApi({method:'GET',query:{mode:'chapter',ref:'Romans 6'}},res);
    assert.equal(res.statusCode,200);
    assert.equal(res.data.translation,'KJV');
    assert.equal(res.data.ref,'Romans 6');
    assert.equal(res.data.verses.length,2);
    assert.equal(res.data.verses[1].ref,'Romans 6:16');
  }finally{globalThis.fetch=prev}
});
test('bad input is rejected without calling external providers',async()=>{
  const prev=globalThis.fetch;globalThis.fetch=()=>{throw new Error('should not fetch')};
  try{
    const res=mockResponse();
    await scriptureApi({method:'GET',query:{mode:'spanish',ref:'https://evil.example/'}},res);
    assert.equal(res.statusCode,400);
    assert.equal(res.data.ok,false);
  }finally{globalThis.fetch=prev}
});
test('unlicensed RVR1960 is explicit, never invented or mislabeled',async()=>{
  const previous={key:process.env.API_BIBLE_KEY,id:process.env.API_BIBLE_RVR1960_ID};
  delete process.env.API_BIBLE_KEY;delete process.env.API_BIBLE_RVR1960_ID;
  try{
    const res=mockResponse();
    await scriptureApi({method:'GET',query:{mode:'spanish',ref:'Psalm 147:3'}},res);
    assert.equal(res.statusCode,503);
    assert.equal(res.data.code,'RVR1960_NOT_CONFIGURED');
  }finally{
    for(const [key,val] of [['API_BIBLE_KEY',previous.key],['API_BIBLE_RVR1960_ID',previous.id]])if(val===undefined)delete process.env[key];else process.env[key]=val;
  }
});
test('licensed RVR1960 uses only the allowlisted Bible provider and retains attribution',async()=>{
  const prev=globalThis.fetch,key=process.env.API_BIBLE_KEY,id=process.env.API_BIBLE_RVR1960_ID;
  process.env.API_BIBLE_KEY='test-only-key';
  process.env.API_BIBLE_RVR1960_ID='test-only-license';
  globalThis.fetch=async (url,opts)=>{
    assert.match(String(url),/^https:\/\/rest\.api\.bible\/v1\/bibles\/test-only-license\/passages\/PSA\.147\.3/);
    assert.equal(opts.headers['api-key'],'test-only-key');
    return {ok:true,status:200,json:async()=>({data:{content:'Texto de prueba',copyright:'Attribution from provider'},meta:{fumsId:'license-display-id'}})};
  };
  try{
    const res=mockResponse();
    await scriptureApi({method:'GET',query:{mode:'spanish',ref:'Psalm 147:3'}},res);
    assert.equal(res.statusCode,200);
    assert.equal(res.data.translation,'RVR1960');
    assert.equal(res.data.text_es,'Texto de prueba');
    assert.equal(res.data.copyright,'Attribution from provider');
    assert.equal(res.data.fumsId,'license-display-id');
  }finally{
    globalThis.fetch=prev;
    if(key===undefined)delete process.env.API_BIBLE_KEY;else process.env.API_BIBLE_KEY=key;
    if(id===undefined)delete process.env.API_BIBLE_RVR1960_ID;else process.env.API_BIBLE_RVR1960_ID=id;
  }
});
test('iPad and live side screens have revisioned Scripture controls',()=>{
  const engine=load('engine/engine.js'),ipad=load('engine/ipad-console.js'),html=load('engine/index.html'),css=load('engine/engine.css');
  assert.doesNotThrow(()=>new Script(engine));
  assert.doesNotThrow(()=>new Script(ipad));
  assert.match(ipad,/decorateInlineScriptures/);
  assert.match(ipad,/api\.pushScripture/);
  assert.match(ipad,/data-ipad-inline-chapter/);
  assert.match(ipad,/data-ipad-bank-main/);
  assert.match(ipad,/e\.stopPropagation\(\)/);
  assert.match(engine,/scriptureRevision/);
  assert.match(engine,/state\.scriptureRevision!==revision/);
  assert.match(engine,/queuedSyncState=msg/);
  assert.match(engine,/const key=JSON\.stringify\(\[lesson\.id,state\.scriptureRevision/);
  assert.match(css,/body\[data-lesson="inner-healing-2026-10-25"\] #scriptures \.scripture-secondary\s*\{\s*display:block!important/);
  assert.match(html,/id="ipad-bible-drawer"/);
  assert.match(html,/src="\/engine\/scripture-tools\.js"/);
});
