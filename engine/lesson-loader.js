(() => {
  const cache = new Map();
  let libraryCache = null;
  let archiveCache = null;

  const loadScript = src => new Promise((resolve,reject)=>{
    if(document.querySelector('script[data-engine-src="'+src+'"]')) return resolve();
    const s=document.createElement('script');
    s.src=src; s.dataset.engineSrc=src; s.onload=resolve; s.onerror=()=>reject(new Error('Could not load '+src));
    document.head.appendChild(s);
  });

  const strip = value => String(value ?? '').replace(/<[^>]*>/g,'').replace(/&middot;/g,'·').replace(/&rarr;/g,'→').replace(/&ldquo;|&rdquo;/g,'"').replace(/&rsquo;/g,"'").trim();
  const lessonSlug = id => String(id||'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();

  function normalizeSlide(raw,index=0){
    const s={...raw};
    if(s.type) return {
      ...s,
      title: strip(s.title || s.text || s.ref || s.kicker || 'Teaching Point'),
      notes: s.speakerNote || s.notes || '',
      _index:index
    };
    if(s.t==='cover') return {type:'cover',kicker:strip(s.eyebrow||s.lesson||''),title:strip(s.title),ref:strip(s.ref),notes:s.speakerNote||'',_index:index};
    if(s.t==='sc') return {type:'verse',kicker:'Scripture',title:strip(s.ref),ref:strip(s.ref),text:strip(s.text),sub:strip(s.tk),notes:s.speakerNote||'',_index:index};
    if(s.t==='te') return {type:'points',kicker:s.n?'Point '+strip(s.n):'Teaching',title:strip(s.hl),points:(s.pts||[]).map(strip),ref:strip(s.ref),notes:s.speakerNote||'',_index:index};
    if(s.t==='big') return {type:'statement',kicker:strip(s.sup||'Big Idea'),title:strip(s.text),ref:strip(s.ref),notes:s.speakerNote||'',_index:index};
    if(s.t==='names') {
      const pts=(s.names||s.items||s.cards||[]).map(x=>strip(typeof x==='string'?x:(x.name||x.title||x.text||JSON.stringify(x))));
      return {type:'points',kicker:strip(s.sup||'Names'),title:strip(s.hl||s.title||'The Twelve'),points:pts,ref:strip(s.ref),notes:s.speakerNote||'',_index:index};
    }
    if(s.t==='final') return {type:'statement',kicker:strip(s.kicker||'Closing'),title:strip(s.text||s.title),sub:strip(s.sub),ref:strip(s.ref),notes:s.speakerNote||'',_index:index};
    return {type:'statement',kicker:'Teaching',title:strip(s.title||s.text||s.hl||s.ref||'Teaching Point'),sub:strip(s.sub||s.tk||''),ref:strip(s.ref),notes:s.speakerNote||'',_index:index};
  }

  async function library(){
    if(libraryCache) return libraryCache;
    libraryCache=await fetch('/lesson-library.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Lesson library unavailable');return r.json()});
    return libraryCache;
  }

  async function archive(){
    if(archiveCache) return archiveCache;
    archiveCache=await fetch('/library/lesson-archive.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Lesson archive unavailable');return r.json()});
    return archiveCache;
  }

  async function loadChapter11(id,meta){
    await Promise.all([
      loadScript('/kingdom-evidence-data.js'),
      loadScript('/kingdom-evidence-week2-data.js'),
      loadScript('/kingdom-evidence-manuscript.js'),
      loadScript('/kingdom-evidence-week2-manuscript.js')
    ]);
    const part2=id.endsWith('part-2');
    const deck=part2?window.KE11_WEEK2:window.KE11_EVIDENCE;
    const manuscript=part2?(window.KE11_WEEK2_MANUSCRIPT||[]):(window.KE11_MANUSCRIPT||[]);
    return {
      id,
      slug: part2?'chapter-11-part-2':'chapter-11-part-1',
      seriesSlug:'kingdom-evidence',
      series:meta.series,
      sequence:meta.sequence,
      title:meta.title,
      scripture:meta.scripture,
      taughtAt:meta.taughtAt,
      theme:'evidence',
      native:true,
      slides:(deck.SLIDES||[]).map(normalizeSlide),
      verses:(deck.VERSES||[]).map(v=>({ref:v.ref,text:v.text,text_en:v.text,ref_en:v.ref,text_es:v.text_es||'',ref_es:v.ref_es||''})),
      polls:(deck.POLLS||[]).map(p=>({...p,id:String(p.id)})),
      prompts:deck.PROMPTS||[],
      manuscript,
      translations:{es:deck.TRANSLATIONS?.es||null}
    };
  }

  async function loadArchive(id,meta){
    const a=await archive(), entry=a.lessons?.[id];
    if(!entry) throw new Error('Archived lesson data unavailable');
    const theme=meta.series==='The Ministry'?'ministry':meta.series==='Kingdom Principles'?'principles':meta.series==='Living With Purpose'?'purpose':'default';
    const slides=(entry.slides||[]).map(normalizeSlide);
    const verses=slides.filter(s=>s.type==='verse'&&s.ref&&s.text).map(s=>({ref:s.ref,text:s.text,text_en:s.text,ref_en:s.ref,text_es:s.text_es||'',ref_es:s.ref_es||''}));
    return {
      id,slug:lessonSlug(id),seriesSlug:lessonSlug(meta.series),series:meta.series,sequence:meta.sequence,title:meta.title,
      scripture:meta.scripture,taughtAt:meta.taughtAt,theme,native:false,slides,verses,polls:[],prompts:[],
      manuscript:slides.map(s=>({title:s.title,html:s.sub?'<p>'+s.sub+'</p>':'',refs:s.ref?[s.ref]:[],notes:s.notes||''})),
      translations:{es:null}
    };
  }

  async function get(id){
    const lib=await library();
    const chosen=id||lib.latest;
    if(cache.has(chosen)) return cache.get(chosen);
    const meta=lib.lessons.find(x=>x.id===chosen);
    if(!meta) throw new Error('Lesson not found: '+chosen);
    const lesson=meta.manuscriptType==='chapter11'?await loadChapter11(chosen,meta):await loadArchive(chosen,meta);
    cache.set(chosen,lesson);
    return lesson;
  }

  window.MinistryLessonLoader={library,get,normalizeSlide,lessonSlug};
})();