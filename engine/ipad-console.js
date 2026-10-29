/* iPad teaching console: thin UI layer over the unified Ministry engine. */
(() => {
  'use strict';
  const api=window.MinistryIpad;
  if(!api||api.view!=='presenter')return;
  const $=id=>document.getElementById(id);
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&middot;/g,'·');
  let bound=false,lastQuestionSignature='',lastPollSignature='';
  let bankChapter='',bankRows=[],bankLoadId=0;
  const chapterCache=new Map();
  function status(message,kind='info'){
    const el=$('ipad-feedback');if(el){el.textContent=message;el.dataset.kind=kind}
  }
  window.MinistryIpadStatus=status;
  function renderPolls(force=false){
    const lesson=api.getLesson(),st=api.getState(),all=lesson?.polls||[];
    if($('ipad-poll-count'))$('ipad-poll-count').textContent=all.length;
    const signature=JSON.stringify([lesson?.id,st.activePoll?.id,st.activePoll?.mode,st.activePoll?.total]);
    if(!force&&signature===lastPollSignature)return;
    lastPollSignature=signature;
    const host=$('ipad-poll-list');if(!host)return;
    host.innerHTML=all.length?all.map(p=>{
      const live=st.activePoll?.id===p.id;
      const meta=live?(st.activePoll.mode==='results'?'Results · '+(st.activePoll.total||0)+' votes':'LIVE QUESTION'):'Ready';
      const jump=Number.isInteger(p.cueSlide)?'<button class="ipad-secondary" data-ipad-jump="'+p.cueSlide+'">Go to Cue</button>':'';
      return '<div class="ipad-item '+(live?'ipad-item-live':'')+'"><div class="ipad-item-top"><span>'+esc(p.cue||'Audience Poll')+'</span><span>'+esc(meta)+'</span></div><strong>'+esc(p.question)+'</strong><div class="ipad-pair">'+jump+'<button class="ipad-secondary '+(live?'ipad-active':'')+'" data-ipad-poll-launch="'+esc(p.id)+'">Launch</button><button class="ipad-secondary" data-ipad-poll-results="'+esc(p.id)+'">Results</button><button class="ipad-secondary" data-ipad-poll-close="'+esc(p.id)+'">Close</button></div></div>'
    }).join(''):'<p class="ipad-empty">No poll questions attached to this lesson.</p>';
  }
  function renderQuestions(force=false){
    const questions=api.getQuestions()||[];
    if($('ipad-question-count'))$('ipad-question-count').textContent=questions.length;
    const signature=JSON.stringify(questions.map(q=>[q.id||q.question_id,q.text]));
    if(!force&&signature===lastQuestionSignature)return;
    lastQuestionSignature=signature;
    const host=$('ipad-q-list');if(!host)return;
    host.innerHTML=questions.length?questions.map((q,i)=>'<div class="ipad-item"><strong>'+esc(q.text)+'</strong><div class="ipad-pair"><button class="ipad-secondary" data-ipad-question="'+i+'">Show Question</button></div></div>').join(''):'<p class="ipad-empty">Anonymous questions will appear here when students submit them.</p>';
  }
  function decorateInlineScriptures(){
    const parser=window.MinistryScriptureTools;
    if(!parser)return;
    document.querySelectorAll('#manuscript .note-body .ih-scripture').forEach(p=>{
      if(p.dataset.ipadInlineScripture)return;
      const parsed=parser.parseInline(p.textContent);
      if(!parsed)return;
      p.dataset.ipadInlineScripture='true';
      p.dataset.ipadScriptureRef=parsed.ref;
      p.dataset.ipadScriptureText=parsed.text;
      p.classList.add('ipad-clickable-scripture');
      const verseButton=document.createElement('button');
      verseButton.type='button';
      verseButton.className='ipad-scripture-tap';
      verseButton.dataset.ipadInlineMain='';
      verseButton.setAttribute('aria-label','Project '+parsed.ref+' to main and side screens');
      verseButton.setAttribute('aria-pressed','false');
      while(p.firstChild)verseButton.appendChild(p.firstChild);
      p.appendChild(verseButton);
      const clear=document.createElement('button');
      clear.type='button';
      clear.className='ipad-scripture-x';
      clear.dataset.ipadInlineClear='';
      clear.setAttribute('aria-label','Clear '+parsed.ref+' from main and side screens');
      clear.setAttribute('title','Clear projected scripture');
      clear.textContent='×';
      clear.hidden=true;
      p.appendChild(clear);
    });
  }
  function refreshActiveScriptures(){
    const st=api.getState(),active=String(st?.scriptureOutput?.ref_en||'').trim().replaceAll('–','-');
    document.querySelectorAll('#manuscript .ipad-clickable-scripture').forEach(p=>{
      const selected=!!active&&p.dataset.ipadScriptureRef===active;
      p.classList.toggle('ipad-scripture-active',selected);
      const clear=p.querySelector('[data-ipad-inline-clear]');
      if(clear)clear.hidden=!selected;
      const btn=p.querySelector('[data-ipad-inline-main]');
      if(btn)btn.setAttribute('aria-pressed',selected?'true':'false');
    });
  }
  function bibleStatus(text,isError=false){
    const el=$('ipad-bible-status');
    if(el){el.textContent=text;el.dataset.kind=isError?'error':'info'}
  }
  function renderBibleChapter(data,{partial=false}={}){
    bankRows=Array.isArray(data.verses)?data.verses:[];
    const el=$('ipad-bible-results');
    if(!el)return;
    const header='<div class="ipad-bank-heading"><strong>'+esc(data.ref||bankChapter)+'</strong><small>'+esc(partial?'Saved lesson references only':'KJV · complete chapter')+'</small></div>';
    el.innerHTML=header+bankRows.map((v,i)=>'<article class="ipad-bank-verse" data-bank-verse="'+esc(v.verse)+'">'+
      '<div class="ipad-bank-verse-text"><span>'+esc(v.verse)+'</span>'+esc(v.text)+'</div>'+
      '<div class="ipad-pair"><button class="ipad-secondary" type="button" data-ipad-bank-main="'+i+'">Project</button></div></article>').join('');
  }
  function lessonChapterFallback(chapter){
    const getChapter=window.MinistryScriptureTools?.chapterOf;
    const verses=api.getLesson()?.verses||[];
    const matching=verses.filter(v=>getChapter?.(v.ref_en||v.ref)===chapter);
    return matching.map(v=>{
      const m=String(v.ref_en||v.ref).match(/:(\d+)/);
      return {verse:Number(m?.[1]||0),ref:v.ref_en||v.ref,text:v.text_en||v.text||''};
    }).filter(v=>v.verse&&v.text);
  }
  async function openChapter(input){
    const parser=window.MinistryScriptureTools;
    const raw=String(input||'').trim(),chapter=parser?.chapterOf(raw);
    if(!chapter){bibleStatus('Enter a book and chapter, such as Romans 6.',true);return}
    const id=++bankLoadId;
    bankChapter=chapter;
    if($('ipad-bible-chapter'))$('ipad-bible-chapter').value=chapter;
    const drawer=$('ipad-bible-drawer');if(drawer)drawer.open=true;
    const cached=chapterCache.get(chapter);
    if(cached){renderBibleChapter(cached);bibleStatus(cached.verses.length+' verses in '+chapter+'.');return}
    bibleStatus('Loading '+chapter+' (KJV)…');
    try{
      const response=await fetch('/api/scripture?mode=chapter&ref='+encodeURIComponent(chapter),{cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(id!==bankLoadId)return;
      if(!response.ok||!data.ok)throw new Error(data.error||'Chapter lookup unavailable');
      chapterCache.set(chapter,data);
      renderBibleChapter(data);
      bibleStatus(data.verses.length+' KJV verses. Tap any verse to send it. '+((api.getLesson()?.id==='inner-healing-2026-10-25'||api.getLesson()?.sideTvSpanishMirror===true)?'Los versículos RVR1960 de esta lección están guardados en el manuscrito.':'RVR1960 loads on projection when licensed.'));
    }catch(error){
      if(id!==bankLoadId)return;
      const fallback=lessonChapterFallback(chapter);
      if(fallback.length){
        renderBibleChapter({ref:chapter,verses:fallback},{partial:true});
        bibleStatus('Full chapter unavailable: '+(error.message||'network error')+'. Showing '+fallback.length+' saved lesson references only.',true);
      }else{
        bankRows=[];
        if($('ipad-bible-results'))$('ipad-bible-results').innerHTML='';
        bibleStatus('Could not load '+chapter+': '+(error.message||'network error'),true);
      }
    }
  }
  function advanceChapter(delta){
    const match=bankChapter.match(/^(.+?)\s+(\d{1,3})$/);
    if(!match)return;
    const next=Number(match[2])+delta;
    if(next<1){bibleStatus('This is the first chapter.',true);return}
    openChapter(match[1]+' '+next);
  }
  function sendScriptureFromElement(el,target){
    const p=el.closest('[data-ipad-inline-scripture]');
    if(!p)return;
    const ok=api.pushScripture({ref_en:p.dataset.ipadScriptureRef,
      text_en:p.dataset.ipadScriptureText},target);
    if(ok)status(p.dataset.ipadScriptureRef+((api.getLesson()?.id==='inner-healing-2026-10-25'||api.getLesson()?.sideTvSpanishMirror===true)?' · RVR1960 lista.':' sent. Checking corresponding RVR1960 text.'),'ok');
  }
  function sendBankVerse(index,target){
    const v=bankRows[index];
    if(!v)return;
    const ok=api.pushScripture({ref_en:v.ref,text_en:v.text},target);
    if(ok)status(v.ref+((api.getLesson()?.id==='inner-healing-2026-10-25'||api.getLesson()?.sideTvSpanishMirror===true)?' · RVR1960 guardada para los versículos de esta lección.':' sent. Checking corresponding RVR1960 text.'),'ok');
  }
  function mount(){
    const lesson=api.getLesson(),library=api.getLibrary();
    if(!lesson||!library)return;
    const select=$('ipad-lesson-select');
    if(select)select.innerHTML=library.lessons.map(l=>'<option value="'+esc(l.id)+'"'+(l.id===lesson.id?' selected':'')+'>'+esc(l.series+' · '+l.title)+'</option>').join('');
    const bank=$('ipad-verse-list'),verses=lesson.verses||[];
    if(bank)bank.innerHTML=verses.length?verses.map((v,i)=>'<div class="ipad-item"><strong>'+esc(v.ref||v.ref_en||'')+'</strong><p>'+esc(v.text||v.text_en||'')+'</p><div class="ipad-pair"><button class="ipad-secondary" data-ipad-verse="'+i+'">Project</button></div></div>').join(''):'<p class="ipad-empty">No verses in the bank.</p>';
    if($('ipad-verse-count'))$('ipad-verse-count').textContent=verses.length;
    for(const [needle,target] of [['/projector','/projector'],['/class','/class'],['/scriptures','/scriptures'],['/confidence','/confidence']]){
      const a=document.querySelector('.presenter-actions a[href="'+needle+'"]');
      if(a)a.href=target+'?lesson='+encodeURIComponent(lesson.id);
    }
    const isSermon=lesson.id==='inner-healing-2026-10-25'||lesson.sideTvSpanishMirror===true;
    const bibleVersionLabel=document.querySelector('#ipad-bible-drawer>summary span');
    if(bibleVersionLabel)bibleVersionLabel.textContent='KJV + RVR1960';
    const classLink=document.querySelector('.presenter-actions a[href^="/class"]');
    if(classLink)classLink.style.display=isSermon?'none':'';
    if($('ipad-feedback'))$('ipad-feedback').textContent=isSermon
      ?'Sermon mode · Full manuscript and manual projector cues. Audience participation is off.'
      :'Open the audience link on a second device to test interaction before class.';
    decorateInlineScriptures();
    const defaultChapter=window.MinistryScriptureTools?.chapterOf(lesson.verses?.[0]?.ref||lesson.scripture||'')||'Psalm 147';
    if(!bankChapter)bankChapter=defaultChapter;
    if($('ipad-bible-chapter'))$('ipad-bible-chapter').value=bankChapter;
    lastPollSignature='';lastQuestionSignature='';
    renderPolls(true);renderQuestions(true);render();
    if(!bound){bound=true;bind();setInterval(refreshAudience,5000);}
  }
  function render(){
    const lesson=api.getLesson(),st=api.getState();if(!lesson||!st)return;
    const current=lesson.slides?.[st.slide],next=lesson.slides?.[st.started?st.slide+1:0];
    if($('ipad-cue-num'))$('ipad-cue-num').textContent=st.started?String(st.slide+1).padStart(2,'0'):'00';
    if($('ipad-cue-title'))$('ipad-cue-title').textContent=st.started?clean(current?.title||'Current cue'):'Standby';
    if($('ipad-cue-next'))$('ipad-cue-next').textContent='Next: '+clean(next?.title||'End');
    if($('ipad-next'))$('ipad-next').textContent=!st.started?'Start Lesson →':st.overlay||st.activePoll||st.activeQuestion?'Clear Overlay →':st.slide>=lesson.slides.length-1?'End Lesson →':'Next Slide →';
    if($('ipad-black'))$('ipad-black').textContent=st.black?'Restore Projector':'Black Projector';
    const cuePolls=(lesson.polls||[]).filter(p=>p.cueSlide===st.slide);
    const liveCuePoll=cuePolls.find(p=>p.id===st.activePoll?.id);
    const cuePoll=liveCuePoll||cuePolls[0];
    const quick=$('ipad-current-poll');
    if(quick){
      quick.hidden=!st.started||!cuePoll;
      quick.dataset.pollId=cuePoll?.id||'';
      quick.dataset.pollAction=liveCuePoll?(st.activePoll.mode==='question'?'results':'close'):'launch';
      quick.textContent=!st.started||!cuePoll?'Launch Poll':liveCuePoll?(st.activePoll.mode==='question'?'Show Poll Results':'Close Poll'):'Launch Poll';
      quick.classList.toggle('ipad-poll-is-live',!!liveCuePoll);
    }
    renderPolls();
    refreshActiveScriptures();
  }
  function audience(){renderQuestions();renderPolls();}
  async function refreshAudience(){
    if((api.getLesson()?.id==='inner-healing-2026-10-25'||api.getLesson()?.sideTvSpanishMirror===true))return;
    const ok=await api.loadAudienceData();
    if(!ok)status('Audience data is unavailable. Check the connection before showing results.','error');
  }
  function scrollToLive(){
    const st=api.getState();
    if(!st?.started)return;
    const el=document.querySelector('.note-section[data-note="'+st.slide+'"]');
    if(el)requestAnimationFrame(()=>el.scrollIntoView({behavior:'smooth',block:'start'}));
  }
  function bind(){
    $('ipad-lesson-select')?.addEventListener('change',async e=>{
      try{await api.loadLesson(e.target.value,{broadcast:true,reset:true});status('Lesson changed. Projector state reset.','ok');window.scrollTo({top:0,behavior:'smooth'})}
      catch(err){status('Could not load lesson: '+(err.message||'unknown error'),'error')}
    });
    $('ipad-bible-open')?.addEventListener('click',()=>openChapter($('ipad-bible-chapter')?.value));
    $('ipad-bible-chapter')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();openChapter(e.currentTarget.value)}});
    $('ipad-bible-prev')?.addEventListener('click',()=>advanceChapter(-1));
    $('ipad-bible-next')?.addEventListener('click',()=>advanceChapter(1));
    $('ipad-prev')?.addEventListener('click',()=>{api.prev();scrollToLive()});
    $('ipad-next')?.addEventListener('click',()=>{api.next();scrollToLive()});
    $('ipad-current-poll')?.addEventListener('click',()=>{
      const button=$('ipad-current-poll'),id=button?.dataset.pollId;
      if(!id)return;
      if(button.dataset.pollAction==='results'){api.showPollResults(id);return}
      if(button.dataset.pollAction==='close'){api.closePoll(id);return}
      api.launchPoll(id);
    });
    $('ipad-clear')?.addEventListener('click',()=>api.clearTakeover());
    $('ipad-black')?.addEventListener('click',()=>api.toggleBlack());
    $('ipad-clear-scripture')?.addEventListener('click',()=>api.clearScriptureOutput());
    $('ipad-refresh')?.addEventListener('click',async()=>{const ok=await api.loadAudienceData();status(ok?'Audience questions and votes refreshed.':'Audience refresh failed.',ok?'ok':'error')});
    $('ipad-end')?.addEventListener('click',()=>{if(window.confirm('End and reset the live session?')){api.reset();status('Session reset.','ok')}});
    $('presenter')?.addEventListener('click',e=>{
      const hit=(selector)=>e.target.closest(selector);
      let el;
      if(el=hit('[data-ipad-bank-main]')){sendBankVerse(Number(el.dataset.ipadBankMain),'both');return}
      if(el=hit('[data-ipad-bank-tv]')){sendBankVerse(Number(el.dataset.ipadBankTv),'tv');return}
      if(el=hit('[data-ipad-inline-clear]')){api.clearPresentedScripture();status('Scripture cleared from main and side screens.','ok');return}
      if(el=hit('[data-ipad-inline-main]')){sendScriptureFromElement(el,'both');return}
      if(el=hit('[data-ipad-jump]')){api.go(Number(el.dataset.ipadJump));scrollToLive();return}
      if(el=hit('[data-ipad-verse]')){api.pushVerse(Number(el.dataset.ipadVerse));return}
      if(el=hit('[data-ipad-tv]')){api.pushVerseTV(Number(el.dataset.ipadTv));return}
      if(el=hit('[data-ipad-poll-cue-launch]')){
        const cueSlide=Number(el.dataset.ipadPollCueSlide),st=api.getState();
        if(!st.started||st.slide!==cueSlide){api.go(cueSlide);scrollToLive()}
        api.launchPoll(el.dataset.ipadPollCueLaunch);return
      }
      if(el=hit('[data-ipad-poll-launch]')){api.launchPoll(el.dataset.ipadPollLaunch);return}
      if(el=hit('[data-ipad-poll-results]')){api.showPollResults(el.dataset.ipadPollResults);return}
      if(el=hit('[data-ipad-poll-close]')){api.closePoll(el.dataset.ipadPollClose);return}
      if(el=hit('[data-ipad-question]')){api.showQuestion(Number(el.dataset.ipadQuestion));return}
      if(el=hit('[data-cue]')){api.go(Number(el.dataset.cue));scrollToLive();e.stopPropagation();return}
    });
  }
  window.MinistryIpadMount=mount;
  window.MinistryIpadRender=render;
  window.MinistryIpadAudience=audience;
})();