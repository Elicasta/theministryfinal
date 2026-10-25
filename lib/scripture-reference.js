// Server-side canonical Scripture parsing. No client-provided URL or translation ID reaches upstream.
export const BOOKS = [
  ['Genesis','GEN'],['Exodus','EXO'],['Leviticus','LEV'],['Numbers','NUM'],['Deuteronomy','DEU'],
  ['Joshua','JOS'],['Judges','JDG'],['Ruth','RUT'],['1 Samuel','1SA'],['2 Samuel','2SA'],
  ['1 Kings','1KI'],['2 Kings','2KI'],['1 Chronicles','1CH'],['2 Chronicles','2CH'],
  ['Ezra','EZR'],['Nehemiah','NEH'],['Esther','EST'],['Job','JOB'],['Psalm','PSA'],
  ['Proverbs','PRO'],['Ecclesiastes','ECC'],['Song of Solomon','SNG'],['Isaiah','ISA'],
  ['Jeremiah','JER'],['Lamentations','LAM'],['Ezekiel','EZK'],['Daniel','DAN'],
  ['Hosea','HOS'],['Joel','JOL'],['Amos','AMO'],['Obadiah','OBA'],['Jonah','JON'],
  ['Micah','MIC'],['Nahum','NAM'],['Habakkuk','HAB'],['Zephaniah','ZEP'],['Haggai','HAG'],
  ['Zechariah','ZEC'],['Malachi','MAL'],['Matthew','MAT'],['Mark','MRK'],
  ['Luke','LUK'],['John','JHN'],['Acts','ACT'],['Romans','ROM'],['1 Corinthians','1CO'],
  ['2 Corinthians','2CO'],['Galatians','GAL'],['Ephesians','EPH'],['Philippians','PHP'],
  ['Colossians','COL'],['1 Thessalonians','1TH'],['2 Thessalonians','2TH'],
  ['1 Timothy','1TI'],['2 Timothy','2TI'],['Titus','TIT'],['Philemon','PHM'],
  ['Hebrews','HEB'],['James','JAS'],['1 Peter','1PE'],['2 Peter','2PE'],
  ['1 John','1JN'],['2 John','2JN'],['3 John','3JN'],['Jude','JUD'],['Revelation','REV']
];
const ids = new Map(BOOKS.map(([book,id])=>[book.toLowerCase(),{book,id}]));
for(const [alias,book] of Object.entries({
 'psalms':'Psalm','ps':'Psalm','psa':'Psalm','song of songs':'Song of Solomon',
 'canticles':'Song of Solomon','revelations':'Revelation','revelation of john':'Revelation',
 'cantare':'Song of Solomon','phil':'Philippians','1 cor':'1 Corinthians','2 cor':'2 Corinthians',
 'matt':'Matthew','rom':'Romans','heb':'Hebrews','jn':'John','isa':'Isaiah'
})) ids.set(alias,ids.get(book.toLowerCase()));
export function parsePassage(input) {
  const match=String(input||'').trim().replace(/\s*\(KJV\)\s*$/i,'')
    .match(/^(.+?)\s+(\d{1,3})(?::(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?$/);
  if(!match) return null;
  const bk=ids.get(match[1].trim().replace(/\s+/g,' ').toLowerCase());
  if(!bk) return null;
  const chapter=Number(match[2]),start=match[3]?Number(match[3]):null,end=match[4]?Number(match[4]):start;
  if(!Number.isInteger(chapter)||chapter<1||chapter>150) return null;
  if(start!==null&&(!Number.isInteger(start)||start<1||start>176||end<start||end>176||end-start>49))return null;
  const base=bk.book+' '+chapter;
  return {book:bk.book,bookId:bk.id,chapter,start,end,
    reference:base+(start===null?'':':'+start+(end!==start?'-'+end:'')),
    chapterId:bk.id+'.'+chapter,
    passageId:start===null?null:bk.id+'.'+chapter+'.'+start+(end!==start?'-'+bk.id+'.'+chapter+'.'+end:'')};
}
export function textOf(input) {
  return String(input||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ')
    .replace(/\s+/g,' ').trim();
}
