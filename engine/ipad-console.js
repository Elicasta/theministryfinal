/* iPad teaching console: thin UI layer over the unified Ministry engine. */
(() => {
  'use strict';
  const api=window.MinistryIpad;
  if(!api||api.view!=='presenter')return;
  const $=id=>document.getElementById(id);
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&middot;/g,'·');
  let bound=false,lastQuestionSignature='',lastPollSignature='';
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
  function mount(){
    const lesson=api.getLesson(),library=api.getLibrary();
    if(!lesson||!library)return;
    const select=$('ipad-lesson-select');
    if(select)select.innerHTML=library.lessons.map(l=>'<option value="'+esc(l.id)+'"'+(l.id===lesson.id?' selected':'')+'>'+esc(l.series+' · '+l.title)+'</option>').join('');
    const bank=$('ipad-verse-list'),verses=lesson.verses||[];
    if(bank)bank.innerHTML=verses.length?verses.map((v,i)=>'<div class="ipad-item"><strong>'+esc(v.ref||v.ref_en||'')+'</strong><p>'+esc(v.text||v.text_en||'')+'</p><div class="ipad-pair"><button class="ipad-secondary" data-ipad-verse="'+i+'">Main + TV</button><button class="ipad-secondary" data-ipad-tv="'+i+'">Side TV only</button></div></div>').join(''):'<p class="ipad-empty">No verses in the bank.</p>';
    if($('ipad-verse-count'))$('ipad-verse-count').textContent=verses.length;
    for(const [needle,target] of [['/projector','/projector'],['/class','/class'],['/scriptures','/scriptures'],['/confidence','/confidence']]){
      const a=document.querySelector('.presenter-actions a[href="'+needle+'"]');
      if(a)a.href=target+'?lesson='+encodeURIComponent(lesson.id);
    }
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
  }
  function audience(){renderQuestions();renderPolls();}
  async function refreshAudience(){
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
      if(el=hit('[data-cue]')){api.go(Number(el.dataset.cue));scrollToLive();return}
    });
  }
  window.MinistryIpadMount=mount;
  window.MinistryIpadRender=render;
  window.MinistryIpadAudience=audience;
})();