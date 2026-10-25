/* Scripture launch parsing is deliberately small and deterministic: the manuscript stays the source. */
(() => {
  'use strict';
  const normalize = input => String(input||'').trim().replace(/\s+/g,' ');
  function parseInline(input){
    const text=normalize(input);
    const match=text.match(/^((?:[1-3]\s+)?[A-Za-z][A-Za-z\s]+?\s+\d{1,3}:\d{1,3}(?:\s*[-–]\s*\d{1,3})?)\s*(?:\(KJV\))?\s+([\s\S]+)$/i);
    if(!match)return null;
    const ref=match[1].replace(/\s*–\s*/g,'-').trim(),verse=match[2].trim();
    if(!verse||verse.length<12)return null;
    return {ref,text:verse};
  }
  function chapterOf(ref){
    const match=normalize(ref).match(/^(.+?)\s+(\d{1,3})(?::\d{1,3}(?:\s*[-–]\s*\d{1,3})?)?(?:\s*\(KJV\))?$/i);
    return match?(match[1].trim()+' '+match[2]):'';
  }
  window.MinistryScriptureTools={parseInline,chapterOf};
})();
