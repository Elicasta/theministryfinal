
// =========================================================
// THE MINISTRY MASTER TEMPLATE
// Edit series/theme/lesson constants near the top of section 02.
// Do not edit the engine sections unless patching system behavior.
// =========================================================

// =========================================================
// 01. v12-mobile-zoom-lock
// Preserved from the stable working build. Keep order.
// =========================================================
(function(){
  document.addEventListener('gesturestart',function(e){e.preventDefault();},{passive:false});
  document.addEventListener('gesturechange',function(e){e.preventDefault();},{passive:false});
  let lastTouchEnd=0;
  document.addEventListener('touchend',function(e){
    const now=Date.now();
    if(now-lastTouchEnd<=300){e.preventDefault();}
    lastTouchEnd=now;
  },{passive:false});
})();


// =========================================================
// 02. Series config, lesson data, state, sync, renderers, routes, admin/mobile controls
// Preserved from the stable working build. Keep order.
// =========================================================
// =========================================================
// EDITABLE SECTION: SERIES CONFIG
// Change this block when duplicating the template for a new series.
// =========================================================
const SERIES_CONFIG = Object.freeze({
  title: 'THE MINISTRY',
  subtitle: 'Matthew Chapter 10 Series',
  lessonTitle: 'The Price of Being Sent',
  speaker: 'Elder Eli Castaneda',
  publicUrl: 'https://theministry.vercel.app',
  guideUrl: 'https://apostolicguide.com'
});

// =========================================================
// EDITABLE SECTION: THEME CONFIG
// Change colors/background here for a new series. CSS reads these variables.
// =========================================================
const THEME_CONFIG = Object.freeze({
  backgroundImage: 'assets/ministry-bg.jpeg',
  colors: {
    bg: '#0A0A0A',
    bgd: '#111111',
    bgc: '#1A1A1A',
    bgcc: '#1E1E1E',
    text: '#F1EDE4',
    muted: '#666666',
    line: '#202020',
    accent: '#E8180D',
    accentDark: '#C41409',
    gold: '#D4933B'
  }
});

function applyThemeConfig(theme){
  if(!theme || !theme.colors) return;
  const r=document.documentElement;
  r.style.setProperty('--bg', theme.colors.bg);
  r.style.setProperty('--bgd', theme.colors.bgd);
  r.style.setProperty('--bgc', theme.colors.bgc);
  r.style.setProperty('--bgcc', theme.colors.bgcc);
  r.style.setProperty('--w', theme.colors.text);
  r.style.setProperty('--mu', theme.colors.muted);
  r.style.setProperty('--ln', theme.colors.line);
  r.style.setProperty('--red', theme.colors.accent);
  r.style.setProperty('--redd', theme.colors.accentDark);
  r.style.setProperty('--gold', theme.colors.gold);
}
applyThemeConfig(THEME_CONFIG);

// =========================================================
// EDITABLE SECTION: PASSWORDS / SYNC CONFIG
// =========================================================
const PASSWORDS = Object.freeze({ attendee: 'ministry2026', admin: 'ministryadmin' });
const PW_ATTENDEE = PASSWORDS.attendee;
const PW_ADMIN    = PASSWORDS.admin;
const CHANNEL_ID  = 'the-ministry-2026';

// ── SUPABASE CONFIG ──
window.SB_URL = 'https://cgliqvizpcctqhsldixn.supabase.co';
window.SB_KEY = ''; // paste your anon public key here

// =========================================================
// EDITABLE SECTION: LESSON DATA
// Update slides here for a new lesson or duplicate this file for a new series.
// =========================================================
const LESSON1_SLIDES = [
  {
    t: 'cover',
    eyebrow: 'The Ministry &middot; Matthew 10',
    lesson: 'Lesson 1',
    title: 'The Price of Being Sent',
    ref: 'Matthew 10:1-10',
  },
  {
    t: 'sc',
    ref: 'Matthew 10:1',
    text: '&ldquo;And when he had called unto him his twelve disciples, he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness.&rdquo;',
    tk: 'Called first. Empowered second. Sent third. That order is everything.',
  },
  {
    t: 'te',
    n: '01',
    hl: 'The order <span class="acc">matters.</span>',
    pts: [
      'Jesus did not start with sending. He started with calling.',
      'Called unto Him &rarr; Given power &rarr; Then sent out.',
      'Ministry does not begin with going. It begins with <span class="hi">coming near.</span>',
      'Misunderstand the order, and you will chase activity and call it ministry.',
    ],
    ref: 'Matthew 10:1',
  },
  {
    t: 'big',
    sup: 'The First Price',
    text: 'Activity by itself is not <span class="acc">ministry.</span>',
    ref: null,
  },
  {
    t: 'te',
    n: '02',
    hl: '<span class="acc">Called</span> before sent.',
    pts: [
      'You can be active and not be sent.',
      'You can be useful and not be formed.',
      'You can be gifted and not be submitted.',
      '<span class="hi">You can be around the work of God and still avoid the God of the work.</span>',
    ],
    ref: 'Matthew 10:1',
  },
  {
    t: 'big',
    sup: 'Ministry Principle',
    text: 'The call inward protects the <span class="acc">work</span> outward.',
    ref: null,
  },
  {
    t: 'te',
    n: '03',
    hl: 'The first price is <span class="acc">surrender.</span>',
    pts: [
      'Being called close is not just for blessing. It is for correction.',
      'Jesus calls close enough to expose what is hiding under the work.',
      'Before anyone rejects you, Jesus has to claim you.',
      '<span class="hi">Ministry is not just doing something for God. It is being brought under the government of God.</span>',
    ],
    ref: 'Matthew 10:1',
  },
  {
    t: 'te',
    n: '04',
    hl: '<span class="acc">Disciple</span> before apostle.',
    pts: [
      'Verse 1 calls them disciples. Verse 2 calls them apostles.',
      'Learner before messenger. Formation before function.',
      'Jesus does not send strangers. He sends disciples.',
      '<span class="hi">Authority in the hands of an unformed person is dangerous.</span>',
    ],
    ref: 'Matthew 10:1-2',
  },
  {
    t: 'big',
    sup: 'Key Line',
    text: 'Authority in the hands of an unformed person is <span class="acc">dangerous.</span>',
    ref: null,
  },
  {
    t: 'te',
    n: '05',
    hl: 'Delegated authority. Not <span class="acc">owned.</span>',
    pts: [
      'Jesus gave them power. They did not generate it.',
      'They did not manufacture it. They did not earn it.',
      'The minister is never the source. The minister is a vessel.',
      '<span class="hi">The moment you act like you are the source, the work is already polluted.</span>',
    ],
    ref: 'Matthew 10:1',
  },
  {
    t: 'names',
    hl: 'Jesus sends people, <span class="acc">not ideas.</span>',
    sub: 'The names carry weight &middot; Matthew 10:2-4',
    people: [
      { name: 'Peter', note: 'Denial and restoration. Grace transforms the one who failed.' },
      { name: 'James', note: 'Closeness does not exempt from suffering.' },
      { name: 'John', note: 'Endurance and exile. Long faithfulness.' },
      { name: 'Matthew', note: 'A publican called into kingdom witness.' },
      { name: 'Thomas', note: 'Wrestling can become confession.' },
      { name: 'Judas', note: 'Proximity is not surrender.' },
    ],
  },
  {
    t: 'big',
    sup: 'Warning',
    text: 'Proximity is not <span class="acc">surrender.</span>',
    ref: 'Matthew 10:4',
  },
  {
    t: 'te',
    n: '06',
    hl: 'Sent under <span class="acc">command.</span>',
    pts: [
      'He commanded them. They did not send themselves.',
      'Ambition moves for opportunity. Calling moves under command.',
      'Ministry built only on feeling quits when feeling lowers.',
      '<span class="hi">Compassion sees need. Obedience discerns sending.</span>',
    ],
    ref: 'Matthew 10:5-6',
  },
  {
    t: 'te',
    n: '07',
    hl: 'Boundaries of <span class="acc">assignment.</span>',
    pts: [
      'Not every need is your assignment.',
      'Not every open door is obedience.',
      'Not every burden means God told you to carry it.',
      '<span class="hi">The Kingdom does not decorate life. The Kingdom governs life.</span>',
    ],
    ref: 'Matthew 10:5-10',
  },
  {
    t: 'final',
    kicker: 'The Closing Line',
    text: 'Jesus calls unto Himself those He intends to <span class="acc">send.</span>',
    sub: 'Ministry begins with nearness. The call inward is the first movement.',
    ref: 'Matthew 10:1',
  },
];

const NOTES_L1 = {
  0: 'Cover slide. Let it breathe. No rush.',
  1: 'Read slowly. Do not rush the text.',
  2: 'This is the diagnostic. Called → Empowered → Sent. The order is the whole point.',
  3: 'Big statement. Pause after. Let it land.',
  4: 'Four bullets = four ways people get it wrong.',
  5: 'Big statement. This is the core protective principle.',
  6: 'This is where ministry gets expensive. Spend time here.',
  7: 'Disciple → Apostle transition. Very important.',
  8: 'Let this one breathe. Big text. Sit in the silence.',
  9: 'Kill the possessives. Not my ministry. Not my calling.',
  10: 'Walk through the names slowly. Each one is a different story.',
  11: 'Judas lands hardest. Pause after this one.',
  12: 'Command vs. inspiration. Ministry under obedience.',
  13: 'Boundaries are not lack of compassion. They are divine sequence.',
  14: 'Final slide. Close in prayer after this.',
};

const SCRIPTURE_MAP = [{"ref_en": "Matthew 10:1-10", "text_en": "\"And when he had called unto him his twelve disciples, he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness and all manner of disease.\" — Matthew 10:1", "ref_es": "Mateo 10:1", "text_es": "\"Entonces llamando a sus doce discípulos, les dio autoridad sobre los espíritus inmundos, para que los echasen fuera, y para sanar toda enfermedad y toda dolencia.\""}, {"ref_en": "Matthew 10:1", "text_en": "\"And when he had called unto him his twelve disciples, he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness and all manner of disease.\"", "ref_es": "Mateo 10:1", "text_es": "\"Entonces llamando a sus doce discípulos, les dio autoridad sobre los espíritus inmundos, para que los echasen fuera, y para sanar toda enfermedad y toda dolencia.\""}, {"ref_en": "Matthew 10:1", "text_en": "\"And when he had called unto him his twelve disciples, he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness and all manner of disease.\"", "ref_es": "Mateo 10:1", "text_es": "\"Entonces llamando a sus doce discípulos, les dio autoridad sobre los espíritus inmundos, para que los echasen fuera, y para sanar toda enfermedad y toda dolencia.\""}, {"ref_en": "Matthew 10:1", "text_en": "\"And when he had called unto him his twelve disciples, he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness and all manner of disease.\"", "ref_es": "Mateo 10:1", "text_es": "\"Entonces llamando a sus doce discípulos, les dio autoridad sobre los espíritus inmundos, para que los echasen fuera, y para sanar toda enfermedad y toda dolencia.\""}, {"ref_en": "Matthew 10:1", "text_en": "\"And when he had called unto him his twelve disciples, he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness and all manner of disease.\"", "ref_es": "Mateo 10:1", "text_es": "\"Entonces llamando a sus doce discípulos, les dio autoridad sobre los espíritus inmundos, para que los echasen fuera, y para sanar toda enfermedad y toda dolencia.\""}, {"ref_en": "Matthew 10:1", "text_en": "\"And when he had called unto him his twelve disciples, he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness and all manner of disease.\"", "ref_es": "Mateo 10:1", "text_es": "\"Entonces llamando a sus doce discípulos, les dio autoridad sobre los espíritus inmundos, para que los echasen fuera, y para sanar toda enfermedad y toda dolencia.\""}, {"ref_en": "Matthew 10:1", "text_en": "\"And when he had called unto him his twelve disciples, he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness and all manner of disease.\"", "ref_es": "Mateo 10:1", "text_es": "\"Entonces llamando a sus doce discípulos, les dio autoridad sobre los espíritus inmundos, para que los echasen fuera, y para sanar toda enfermedad y toda dolencia.\""}, {"ref_en": "Matthew 10:1-2", "text_en": "\"And when he had called unto him his twelve disciples, he gave them power against unclean spirits… Now the names of the twelve apostles are these; The first, Simon, who is called Peter, and Andrew his brother; James the son of Zebedee, and John his brother.\"", "ref_es": "Mateo 10:1-2", "text_es": "\"Entonces llamando a sus doce discípulos, les dio autoridad… Los nombres de los doce apóstoles son estos: el primero, Simón, llamado Pedro, y Andrés su hermano; Jacobo hijo de Zebedeo, y Juan su hermano.\""}, {"ref_en": "Matthew 10:1-2", "text_en": "\"And when he had called unto him his twelve disciples, he gave them power against unclean spirits… Now the names of the twelve apostles are these; The first, Simon, who is called Peter, and Andrew his brother; James the son of Zebedee, and John his brother.\"", "ref_es": "Mateo 10:1-2", "text_es": "\"Entonces llamando a sus doce discípulos, les dio autoridad… Los nombres de los doce apóstoles son estos: el primero, Simón, llamado Pedro, y Andrés su hermano; Jacobo hijo de Zebedeo, y Juan su hermano.\""}, {"ref_en": "Matthew 10:1", "text_en": "\"And when he had called unto him his twelve disciples, he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness and all manner of disease.\"", "ref_es": "Mateo 10:1", "text_es": "\"Entonces llamando a sus doce discípulos, les dio autoridad sobre los espíritus inmundos, para que los echasen fuera, y para sanar toda enfermedad y toda dolencia.\""}, {"ref_en": "Matthew 10:2-4", "text_en": "\"Now the names of the twelve apostles are these; The first, Simon, who is called Peter, and Andrew his brother; James the son of Zebedee, and John his brother; Philip, and Bartholomew; Thomas, and Matthew the publican; James the son of Alphaeus, and Lebbaeus, whose surname was Thaddaeus; Simon the Canaanite, and Judas Iscariot, who also betrayed him.\"", "ref_es": "Mateo 10:2-4", "text_es": "\"Los nombres de los doce apóstoles son estos: el primero, Simón, llamado Pedro, y Andrés su hermano; Jacobo hijo de Zebedeo, y Juan su hermano; Felipe, Bartolomé, Tomás, Mateo el publicano, Jacobo hijo de Alfeo, Lebeo, por sobrenombre Tadeo, Simón el cananista, y Judas Iscariote, el que también le entregó.\""}, {"ref_en": "Matthew 10:4", "text_en": "\"Simon the Canaanite, and Judas Iscariot, who also betrayed him.\"", "ref_es": "Mateo 10:4", "text_es": "\"Simón el cananista, y Judas Iscariote, el que también le entregó.\""}, {"ref_en": "Matthew 10:5-6", "text_en": "\"These twelve Jesus sent forth, and commanded them, saying, Go not into the way of the Gentiles, and into any city of the Samaritans enter ye not: But go rather to the lost sheep of the house of Israel.\"", "ref_es": "Mateo 10:5-6", "text_es": "\"A estos doce envió Jesús, y les dio instrucciones, diciendo: Por camino de gentiles no vayáis, y en ciudad de samaritanos no entréis, sino id antes a las ovejas perdidas de la casa de Israel.\""}, {"ref_en": "Matthew 10:7-10", "text_en": "\"And as ye go, preach, saying, The kingdom of heaven is at hand. Heal the sick, cleanse the lepers, raise the dead, cast out devils: freely ye have received, freely give. Provide neither gold, nor silver, nor brass in your purses, Nor scrip for your journey… for the workman is worthy of his meat.\"", "ref_es": "Mateo 10:7-10", "text_es": "\"Y yendo, predicad, diciendo: El reino de los cielos se ha acercado. Sanad enfermos, limpiad leprosos, resucitad muertos, echad fuera demonios; de gracia recibisteis, dad de gracia. No os proveáis de oro, ni plata… porque el obrero es digno de su alimento.\""}, {"ref_en": "Matthew 10:1", "text_en": "\"And when he had called unto him his twelve disciples, he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness and all manner of disease.\"", "ref_es": "Mateo 10:1", "text_es": "\"Entonces llamando a sus doce discípulos, les dio autoridad sobre los espíritus inmundos, para que los echasen fuera, y para sanar toda enfermedad y toda dolencia.\""}];


const VERSE_BANK = [{"id": "v1", "ref": "Matthew 10:1", "kjv": "And when he had called unto him his twelve disciples, he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness and all manner of disease.", "slides": [0, 1, 2, 3, 4, 5, 6, 9, 14]}, {"id": "v2", "ref": "Matthew 10:2", "kjv": "Now the names of the twelve apostles are these; The first, Simon, who is called Peter, and Andrew his brother; James the son of Zebedee, and John his brother;", "slides": [7, 8]}, {"id": "v3", "ref": "Matthew 10:3", "kjv": "Philip, and Bartholomew; Thomas, and Matthew the publican; James the son of Alphaeus, and Lebbaeus, whose surname was Thaddaeus;", "slides": [10]}, {"id": "v4", "ref": "Matthew 10:4", "kjv": "Simon the Canaanite, and Judas Iscariot, who also betrayed him.", "slides": [11]}, {"id": "v5", "ref": "Matthew 10:5", "kjv": "These twelve Jesus sent forth, and commanded them, saying, Go not into the way of the Gentiles, and into any city of the Samaritans enter ye not:", "slides": [12]}, {"id": "v6", "ref": "Matthew 10:6", "kjv": "But go rather to the lost sheep of the house of Israel.", "slides": [12]}, {"id": "v7", "ref": "Matthew 10:7", "kjv": "And as ye go, preach, saying, The kingdom of heaven is at hand.", "slides": [13]}, {"id": "v8", "ref": "Matthew 10:8", "kjv": "Heal the sick, cleanse the lepers, raise the dead, cast out devils: freely ye have received, freely give.", "slides": [13]}, {"id": "v9", "ref": "Matthew 10:9", "kjv": "Provide neither gold, nor silver, nor brass in your purses,", "slides": [13]}, {"id": "v10", "ref": "Matthew 10:10", "kjv": "Nor scrip for your journey, neither two coats, neither shoes, nor yet staves: for the workman is worthy of his meat.", "slides": [13]}];

const QUESTIONS = [
  {
    section: "Personal Examination",
    questions: [
      { num: "1", text: "Where am I calling \"activity\" ministry? What am I doing for God that I have not been sent to do?" },
      { num: "2", text: "What does \"nearness\" look like for me right now? What practices keep me close enough to be corrected, not just used?" },
      { num: "3", text: "What is the \"thing under the thing\" Jesus keeps touching in me — motive, pride, insecurity, control, ambition, need to be seen?" },
      { num: "4", text: "Which is harder for me: being formed or being used? Why?" },
      { num: "5", text: "Where have I resisted surrender by keeping a backup plan, an escape route, or a hidden ownership claim?" }
    ]
  },
  {
    section: "Disciple Before Apostle",
    questions: [
      { num: "1", text: "In what area am I trying to function beyond my formation?" },
      { num: "2", text: "What correction have I been avoiding that would make me safer for the assignment?" },
      { num: "3", text: "What does being \"under authority\" look like in my current season — submission, accountability, obedience, boundaries?" }
    ]
  },
  {
    section: "Ownership and Delegated Authority",
    questions: [
      { num: "1", text: "Where do I say \"my\" too easily — my ministry, my people, my platform, my influence? What would it look like to repent of that posture?" },
      { num: "2", text: "How do I know when I am starting to act like the source instead of the vessel?" },
      { num: "3", text: "What safeguards keep holy things from being used for ego, control, or merchandise?" }
    ]
  },
  {
    section: "Sentness, Command, and Boundaries",
    questions: [
      { num: "1", text: "Am I self-appointed in any area? What is the evidence of being sent — command, clarity, fruit, confirmation?" },
      { num: "2", text: "What boundaries has Jesus given me that I keep crossing out of guilt or compassion without assignment?" },
      { num: "3", text: "Where has \"inspiration\" been carrying my ministry instead of \"obedience\"? What does faithfulness look like when it feels dry?" }
    ]
  },
  {
    section: "Lost Sheep and Kingdom Message",
    questions: [
      { num: "1", text: "Do I see people as \"lost sheep\" or as problems? What contempt do I need to lay down?" },
      { num: "2", text: "If I preach \"the kingdom of heaven is at hand,\" what area of my life is still resisting the King's rule?" }
    ]
  },
  {
    section: "Closing Commitment",
    questions: [
      { num: "1", text: "What is one concrete step of nearness I will take this week — prayer, Scripture, repentance, counsel, fasting, solitude?" },
      { num: "2", text: "What is one concrete step of obedience I will take this week — a command to follow, a boundary to honor, a burden to lay down?" }
    ]
  }
];

// ── STATE ──
let isAdmin=false, userName='', curSlide=0;
let presentationStarted=false;
let isProjector=false, isScriptureDisplay=false, isObsLower=false, isObsFull=false, isConfidence=false;
let scAuto=true, p1ScOverlayOn=false, p1ActiveVerse=null;
let qUnlocked=false;
let bc=null;
let sbChannel=null;
let _suppressSync=false, _timerStart=Date.now(), _timerInt=null;
let questions=[];
document.addEventListener('DOMContentLoaded',()=>{
  const p=new URLSearchParams(window.location.search);
  const path=window.location.pathname.replace(/^\/+|\/+$/g,'').toLowerCase();
  const cleanRoute={
    projector:'projector',
    scriptures:'scriptures',
    scripture:'scriptures',
    obslowerthirds:'obslowerthirds',
    obsslides:'obsslides',
    confidence:'confidence'
  }[path] || '';
  const raw=(p.get('projector')||p.get('screen')||'').toLowerCase();
  const obsRaw=(p.get('obs')||'').toLowerCase();
  const route=cleanRoute||raw||obsRaw;

  // Clean output routes:
  // /projector, /scriptures, /obslowerthirds, /obsslides, /confidence
  // Legacy query routes still work for safety: ?projector=1, ?projector=2, ?obs=lower, ?obs=full
  if(p.has('scripture') || route==='2' || route==='scripture' || route==='scriptures'){
    isScriptureDisplay=true;
    document.body.classList.add('scripture-mode');
    document.getElementById('sc').classList.remove('on');
    initBC(); startTimer(); return;
  }
  if(p.has('obs') || route==='3' || route==='4' || route==='lower' || route==='full' || route==='obslowerthirds' || route==='obsslides'){
    const full=(obsRaw==='full'||route==='4'||route==='full'||route==='obsslides');
    isObsLower=!full; isObsFull=full;
    document.body.classList.add('obs-mode');
    document.getElementById('sc').classList.remove('on');
    const box=document.getElementById('obs-lower');
    if(box && isObsFull) box.className='obs-full';
    initBC(); startTimer(); return;
  }
  if(route==='5' || route==='confidence'){
    isConfidence=true;
    document.body.classList.add('confidence-mode');
    document.getElementById('sc').classList.remove('on');
    updateConfidence(curSlide);
    initBC(); startTimer(); return;
  }
  if(p.has('projector') || route==='1' || route==='projector'){
    document.body.classList.add('projector-mode');
    isProjector=true;
    const ssl=document.getElementById('ssl');
    if(ssl){
      ssl.classList.remove('on');
      buildSlides(document.getElementById('ss-slides'),LESSON1_SLIDES);
      renderDots(LESSON1_SLIDES.length);
      _suppressSync=true; goTo(0); _suppressSync=false;
    }
    const wait=document.getElementById('p1-wait');
    if(wait) wait.classList.remove('hidden');
    initBC(); startTimer(); return;
  }
  const u=localStorage.getItem('tm_u'), a=localStorage.getItem('tm_a');
  if(u==='1') showHub();
  if(a==='1') activateAdmin();
  const n=localStorage.getItem('tm_name');
  if(n){userName=n;setUserName(n);}
  // Restore Q unlock state
  if(localStorage.getItem('tm_q')==='1'){unlockQ(false);}
  document.addEventListener('keydown',e=>{
    const ssl=document.getElementById('ssl');
    if(!ssl.classList.contains('on')) return;
    if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();nextSlide();}
    if(e.key==='ArrowLeft') prevSlide();
    if(e.key==='Escape') closeSlideshow();
  });
  initBC();
  buildQuestionnaire();
  startTimer();
});

// ── MODAL ──
function showModal(t){
  const isAdm=t==='admin';
  document.getElementById('mo-name').style.display=isAdm?'none':'block';
  document.getElementById('mo-sub').textContent=isAdm?'Enter the admin code.':'Enter your name and the access code.';
  document.getElementById('mo-err').classList.remove('on');
  document.getElementById('mo-pw').value='';
  if(!isAdm)document.getElementById('mo-name').value='';
  document.getElementById('modal').classList.remove('hidden');
  setTimeout(()=>document.getElementById(isAdm?'mo-pw':'mo-name').focus(),80);
}
function closeModal(){document.getElementById('modal').classList.add('hidden');}
function checkPw(){
  const pw=document.getElementById('mo-pw').value;
  const name=document.getElementById('mo-name').value.trim();
  if(pw===PW_ADMIN){localStorage.setItem('tm_a','1');localStorage.setItem('tm_u','1');activateAdmin();closeModal();return;}
  if(pw===PW_ATTENDEE){localStorage.setItem('tm_u','1');if(name){localStorage.setItem('tm_name',name);setUserName(name);}closeModal();showHub();return;}
  document.getElementById('mo-err').classList.add('on');
}
function setUserName(n){
  userName=n; document.body.classList.add('named');
  const c=document.getElementById('user-chip');if(c)c.textContent='Hey '+n;
}

// ── SCREENS ──
function showHub(){
  ['sc','ssl','admin-hub','questionnaire'].forEach(id=>document.getElementById(id).classList.remove('on'));
  document.getElementById('sh').classList.add('on');
}
function activateAdmin(){
  isAdmin=true; document.body.classList.add('am');
  const b=document.getElementById('admin-btn');if(b)b.textContent='Admin ✓';
  showAdminHub();
}
function showAdminHub(){
  ['sc','sh','ssl','questionnaire'].forEach(id=>document.getElementById(id).classList.remove('on'));
  document.getElementById('admin-hub').classList.add('on');
  buildCtrlSurface();
  buildVerseBank();
}
function adminLogout(){
  ['tm_a','tm_u','tm_name'].forEach(k=>localStorage.removeItem(k));
  isAdmin=false; document.body.classList.remove('am'); location.reload();
}
function closeSlideshow(){
  document.getElementById('ssl').classList.remove('on');
  if(isAdmin) showAdminHub(); else showHub();
}
function openQuestionnaire(){
  ['sc','sh','ssl','admin-hub'].forEach(id=>document.getElementById(id).classList.remove('on'));
  const q=document.getElementById('questionnaire');
  q.classList.add('on');
  if(qUnlocked){
    document.getElementById('q-locked-view').style.display='none';
    document.getElementById('q-open-view').style.display='block';
  } else {
    document.getElementById('q-locked-view').style.display='';
    document.getElementById('q-open-view').style.display='none';
  }
}

// ── QUESTIONNAIRE ──
function buildQuestionnaire(){
  const container=document.getElementById('q-sections');
  if(!container) return;
  container.innerHTML=QUESTIONS.map((sec,si)=>{
    const items=sec.questions.map((q,qi)=>{
      const key=`q_${si}_${qi}`;
      const saved=localStorage.getItem('tm_'+key)||'';
      return `<div class="q-item">
        <div class="q-item-num">${q.num}</div>
        <div class="q-item-text">${q.text}</div>
        <textarea class="q-ta" placeholder="Write your response..." data-key="${key}" onchange="saveQAnswer(this)">${saved}</textarea>
      </div>`;
    }).join('');
    return `<div class="q-section">
      <div class="q-section-title">${sec.section}</div>
      ${items}
    </div>`;
  }).join('');
}
function saveQAnswer(ta){
  try{localStorage.setItem('tm_'+ta.dataset.key, ta.value);}catch(e){}
}
function unlockQ(broadcast){
  qUnlocked=true;
  localStorage.setItem('tm_q','1');
  // Update hub card
  const badge=document.getElementById('q-lock-badge');
  if(badge){badge.textContent='Open';badge.style.color='var(--red)';}
  const qlbl=document.getElementById('q-status-lbl');if(qlbl)qlbl.textContent='Unlocked';
  const qbtn=document.getElementById('q-unlock-btn');if(qbtn)qbtn.textContent='Unlock ✓';
  // Broadcast to attendees
  if(broadcast){
    sbSend({type:'q_unlock'});
  }
}
function adminUnlockQ(){
  unlockQ(true);
}

// ── SLIDES ──
function openSS(){
  ['sc','sh','admin-hub','questionnaire'].forEach(id=>document.getElementById(id).classList.remove('on'));
  document.getElementById('ssl').classList.add('on');
  buildSlides(document.getElementById('ss-slides'),LESSON1_SLIDES);
  renderDots(LESSON1_SLIDES.length);
  goTo(curSlide);
}
function buildSlides(container,slides){
  container.innerHTML=slides.map((s,i)=>renderSlide(s,i)).join('');
}
function renderSlide(s,i){
  const d=`data-i="${i}"`;
  switch(s.t){
    case 'cover':return`<div class="slide sl-cover"${d}><div class="sl-cover-bg"></div><div class="sl-cover-ov"></div><div class="sl-cover-body"><div class="sl-cey">${s.eyebrow}</div><div class="sl-ct"><span class="tt">THE</span><span class="tm">MINISTRY</span></div><div class="sl-cln">${s.lesson}</div><div class="sl-cnm">${s.title}</div><div class="sl-crf">${s.ref}</div><div class="sl-cft"><div class="sl-cm"><div class="sl-cml">Presenter</div><div class="sl-cmv">Elder Eli Castaneda</div></div><div class="sl-cm"><div class="sl-cml">Date</div><div class="sl-cmv">June 18, 2026</div></div><div class="sl-cm"><div class="sl-cml">Text</div><div class="sl-cmv">Matthew 10:1-10</div></div></div></div></div>`;
    case 'sc':return`<div class="slide sl-sc"${d}><div class="sl-sc-mk"></div><div class="sl-sc-rf">&#10013; ${s.ref}</div><div class="sl-sc-tx">${s.text}</div><div class="sl-sc-tk">${s.tk}</div></div>`;
    case 'te':return`<div class="slide sl-te"${d}><div class="sl-te-n">${s.n}</div><div class="sl-te-h">${s.hl}</div><ul class="sl-pts">${s.pts.map(p=>`<li>${p}</li>`).join('')}</ul>${s.ref?`<div style="font-family:var(--fc);font-size:.58rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--mu);margin-top:18px">${s.ref}</div>`:''}</div>`;
    case 'big':return`<div class="slide sl-big"${d}>${s.sup?`<div class="sl-big-sup">${s.sup}</div>`:''}<div class="sl-big-text">${s.text}</div>${s.ref?`<div class="sl-big-ref">${s.ref}</div>`:''}</div>`;
    case 'names':return`<div class="slide sl-names"${d}><div class="sl-nhd">Matthew 10:2-4</div><div class="sl-nhl">${s.hl}</div><div class="sl-ngrid">${s.people.map(p=>`<div class="sl-nc"><div class="sl-ncn">${p.name}</div><div class="sl-nct">${p.note}</div></div>`).join('')}</div></div>`;
    case 'final':return`<div class="slide sl-final"${d}><div class="sl-fk">${s.kicker}</div><div class="sl-ft">${s.text}</div><div class="sl-fl">${s.sub}</div>${s.ref?`<div class="sl-fr">${s.ref}</div>`:''}</div>`;
    default:return'';
  }
}
function renderDots(count){
  document.getElementById('ss-dots').innerHTML=Array.from({length:count},(_,i)=>`<div class="ss-dot" onclick="event.stopPropagation();goTo(${i})"></div>`).join('');
}
function goTo(i){
  curSlide=i;
  const count=LESSON1_SLIDES.length;
  document.querySelectorAll('#ss-slides .slide').forEach((s,j)=>s.classList.toggle('on',j===i));
  document.querySelectorAll('.ss-dot').forEach((d,j)=>d.classList.toggle('on',j===i));
  const pt=document.getElementById('ss-pt');if(pt)pt.textContent=`${i+1} / ${count}`;
  const prog=document.getElementById('ss-prog');if(prog)prog.style.width=`${((i+1)/count*100).toFixed(1)}%`;
  const pi=document.getElementById('proj-info');if(pi)pi.textContent='';
  // Auto unlock Q on final slide (presenter only)
  if(i===count-1 && isAdmin && !qUnlocked) unlockQ(true);
  // Admin slide movement should always clear active scripture overlays first.
  // This prevents projector 1 / OBS from staying on a verse while the main slide advances.
  if(isAdmin && !_suppressSync){
    presentationStarted=true;
    p1ScOverlayOn=false;
    p1ActiveVerse=null;
    const ov=document.getElementById('p1-sc-overlay');
    if(ov) ov.classList.remove('show');
    // Slide changes clear only the P1 overlay. P2 should keep following the slide scripture.
    sbSend({type:'p1_overlay_hide'});
  }
  // Sync overlay if on locally only. Admin next/prev intentionally disables this.
  if(p1ScOverlayOn && p1ActiveVerse===null){
    const sc=SCRIPTURE_MAP[i];
    if(sc) setP1Overlay({ref:sc.ref_en, kjv:sc.text_en});
  }
  // Admin/controller is the only source of truth. Projectors never echo commands back.
  if(isAdmin && !_suppressSync){
    // Projector 1 moves slides. Projector 2 follows the current scripture when Auto P2 is on.
    broadcastSlide(i);
    if(scAuto) broadcastScripture(i);
  }
  updateCtrlSurface(i);
  updateMobileMode(i);
  try{localStorage.setItem('tm_resume',i);}catch(e){}
}
function nextSlide(){if(curSlide<LESSON1_SLIDES.length-1)goTo(curSlide+1);}
function prevSlide(){if(curSlide>0)goTo(curSlide-1);}
function ctrlNext(){nextSlide();}
function ctrlPrev(){prevSlide();}
let _lastStageClick=0;
function handleStageClick(e){
  if(e.target.closest('button,a,#p1-sc-overlay')) return;
  const now=Date.now(); if(now-_lastStageClick<420) return; _lastStageClick=now;
  nextSlide();
}
function toggleFS(){if(!document.fullscreenElement)document.getElementById('ssl').requestFullscreen().catch(()=>{});else document.exitFullscreen();}
function projFS(){if(!document.fullscreenElement)document.documentElement.requestFullscreen().catch(()=>{});else document.exitFullscreen();}

// ── P1 SCRIPTURE OVERLAY ──
function setP1Overlay(v){
  // v = {ref, kjv}
  document.getElementById('p1ov-ref').textContent=v.ref;
  document.getElementById('p1ov-text').textContent=v.kjv;
}
function showP1Overlay(){
  const ov=document.getElementById('p1-sc-overlay');
  if(ov) ov.classList.add('show');
  // Make sure slide stage is still clickable for nav (click outside overlay)
  p1ScOverlayOn=true;
  // Update toggle button
  const tog=document.getElementById('cmd-sc-tog');if(tog)tog.classList.add('active');
  const tog2=document.getElementById('p1ov-toggle-right');if(tog2)tog2.textContent='&#128196; Showing';
  // Broadcast to P1 projector
  sbSend({type:'p1_overlay_show',ref:document.getElementById('p1ov-ref').textContent,kjv:document.getElementById('p1ov-text').textContent});
}
function hideP1Overlay(){
  const ov=document.getElementById('p1-sc-overlay');
  if(ov) ov.classList.remove('show');
  p1ScOverlayOn=false;
  const tog=document.getElementById('cmd-sc-tog');if(tog)tog.classList.remove('active');
  const tog2=document.getElementById('p1ov-toggle-right');if(tog2)tog2.textContent='Show on Slide';
  sbSend({type:'p1_overlay_hide'});
}
function toggleP1ScOverlay(){
  if(p1ScOverlayOn) hideP1Overlay();
  else {
    // Load current slide scripture if no manual verse set
    const v=p1ActiveVerse||SCRIPTURE_MAP[curSlide];
    if(v){setP1Overlay({ref:v.ref_en||v.ref,kjv:v.text_en||v.kjv});}
    showP1Overlay();
  }
}
function clearP1Overlay(){hideP1Overlay();p1ActiveVerse=null;}
function pushVerseToP1(verse){
  // verse = {ref, kjv}
  p1ActiveVerse=verse;
  setP1Overlay(verse);
  if(!p1ScOverlayOn) showP1Overlay();
  else{
    sbSend({type:'p1_overlay_show',ref:verse.ref,kjv:verse.kjv});
  }
}

// ── VERSE BANK ──
function buildVerseBank(){
  const container=document.getElementById('verse-bank-cards');
  if(!container) return;
  container.innerHTML=VERSE_BANK.map(v=>`
    <div class="vb-card" id="vbc-${v.id}">
      <div class="vb-ref">${v.ref}</div>
      <div class="vb-text">${v.kjv}</div>
      <div class="vb-actions">
        <button class="vb-btn p1" onclick="event.stopPropagation();pushVerseToP1({ref:'${v.ref}',kjv:\`${v.kjv.replace(/`/g,"'")}\`});markVBPushed('${v.id}')">&#128196; Push to Slide (P1)</button>
        <button class="vb-btn p2" onclick="event.stopPropagation();pushRawScripture({ref_en:'${v.ref}',text_en:\`${v.kjv.replace(/`/g,"'")}\`,ref_es:'${v.ref.replace('Matthew','Mateo')}',text_es:getVBSpanish('${v.id}')});markVBPushed('${v.id}')">P2</button>
      </div>
    </div>
  `).join('');
}
const VB_SPANISH={
  v1:'Entonces llamando a sus doce discípulos, les dio autoridad sobre los espíritus inmundos, para que los echasen fuera, y para sanar toda enfermedad y toda dolencia.',
  v2:'Los nombres de los doce apóstoles son estos: el primero, Simón, llamado Pedro, y Andrés su hermano; Jacobo hijo de Zebedeo, y Juan su hermano;',
  v3:'Felipe, Bartolomé, Tomás, Mateo el publicano, Jacobo hijo de Alfeo, Lebeo, por sobrenombre Tadeo;',
  v4:'Simón el cananista, y Judas Iscariote, el que también le entregó.',
  v5:'A estos doce envió Jesús, y les dio instrucciones, diciendo: Por camino de gentiles no vayáis, y en ciudad de samaritanos no entréis;',
  v6:'sino id antes a las ovejas perdidas de la casa de Israel.',
  v7:'Y yendo, predicad, diciendo: El reino de los cielos se ha acercado.',
  v8:'Sanad enfermos, limpiad leprosos, resucitad muertos, echad fuera demonios; de gracia recibisteis, dad de gracia.',
  v9:'No os proveáis de oro, ni plata, ni cobre en vuestros cintos,',
  v10:'ni de alforja para el camino, ni de dos túnicas, ni de calzado, ni de bordón; porque el obrero es digno de su alimento.',
};
function getVBSpanish(id){return VB_SPANISH[id]||'';}
function markVBPushed(id){
  document.querySelectorAll('.vb-card').forEach(c=>c.classList.remove('pushed'));
  const card=document.getElementById('vbc-'+id);if(card)card.classList.add('pushed');
}

// ── CONTROL SURFACE ──
function buildCtrlSurface(){
  const list=document.getElementById('ctrl-slide-list');
  if(!list) return;
  const tl={cover:'Cover',sc:'Scripture',te:'Teaching',big:'Statement',names:'Names',final:'Closing'};
  list.innerHTML=LESSON1_SLIDES.map((s,i)=>{
    const type=tl[s.t]||s.t;
    const label=s.t==='big'?s.text.replace(/<[^>]+>/g,'').substring(0,38):
                s.t==='te'?s.hl.replace(/<[^>]+>/g,'').substring(0,38):
                s.t==='cover'?s.title:s.t==='sc'?s.ref:s.t==='names'?'The Twelve Named':'Final Landing';
    return`<button class="ctrl-si${i===curSlide?' on':''}" onclick="goTo(${i})"><div class="csi-n">${i+1}</div><div><div class="csi-t">${type}</div><div class="csi-l">${label}</div></div></button>`;
  }).join('');
  const ps=document.getElementById('preview-slides');if(ps)buildSlides(ps,LESSON1_SLIDES);
  updateCtrlSurface(curSlide);
}
function updateCtrlSurface(i){
  const s=LESSON1_SLIDES[i], count=LESSON1_SLIDES.length;
  const tl={cover:'Cover',sc:'Scripture',te:'Teaching',big:'Statement',names:'Names',final:'Closing'};
  const type=tl[s.t]||s.t;
  const label=s.t==='big'?s.text.replace(/<[^>]+>/g,'').substring(0,36):
              s.t==='te'?s.hl.replace(/<[^>]+>/g,'').substring(0,36):
              s.t==='cover'?s.title:s.t==='sc'?s.ref:s.t==='names'?'The Twelve Named':'Final Landing';
  // Command bar
  const cc=document.getElementById('cmd-ctr');if(cc)cc.textContent=`${i+1}/${count}`;
  const cst=document.getElementById('cmd-stype');if(cst)cst.textContent=type;
  const csl=document.getElementById('cmd-stitle');if(csl)csl.textContent=label;
  // Right panel
  const rs=document.getElementById('rp-slide');if(rs)rs.textContent=i+1;
  const rt=document.getElementById('rp-type');if(rt)rt.textContent=type;
  const sc=SCRIPTURE_MAP[i];
  const rr=document.getElementById('rp-ref');if(rr&&sc)rr.textContent=sc.ref_en;
  // Preview
  document.querySelectorAll('#preview-slides .slide').forEach((el,j)=>el.classList.toggle('on',j===i));
  const pl=document.getElementById('prev-lbl');if(pl)pl.textContent=`Slide ${i+1}`;
  const pl2=document.getElementById('prev-lbl2');if(pl2)pl2.textContent=`${i+1} of ${count}`;
  const pc=document.getElementById('pnav-ctr');if(pc)pc.textContent=`${i+1}/${count}`;
  // Pnav labels
  const ps=LESSON1_SLIDES[i-1], ns=LESSON1_SLIDES[i+1];
  const pp=document.getElementById('pnav-prev');
  if(pp)pp.textContent=ps?`← ${(ps.t==='te'?ps.hl.replace(/<[^>]+>/g,'').substring(0,20):tl[ps.t]||'Prev')}`:`← (start)`;
  const pn=document.getElementById('pnav-next');
  if(pn)pn.textContent=ns?`${(ns.t==='te'?ns.hl.replace(/<[^>]+>/g,'').substring(0,20):tl[ns.t]||'Next')} →`:`(end)`;
  // Slide list highlight
  document.querySelectorAll('.ctrl-si').forEach((el,j)=>el.classList.toggle('on',j===i));
  const active=document.querySelector('.ctrl-si.on');if(active)active.scrollIntoView({block:'nearest',behavior:'smooth'});
  // Notes
  const note=NOTES_L1[i]||'';
  const nc=document.getElementById('ctrl-notes');
  if(nc)nc.innerHTML=note?note:`<span class="ctrl-notes-empty">No notes.</span>`;
}

// ── TAB SWITCHER ──
function switchTab(name,btn){
  document.querySelectorAll('.ctrl-tab').forEach(t=>t.classList.remove('on'));
  document.querySelectorAll('.ctrl-panel').forEach(p=>p.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('tab-'+name).classList.add('on');
}

// ── SCRIPTURE AUTO ──
let _scAuto=true;
function toggleScAuto(){
  _scAuto=!_scAuto; scAuto=_scAuto;
  const b=document.getElementById('cmd-auto');
  if(b){b.innerHTML=_scAuto?'&#9679; Auto P2':'&#9675; Manual P2';b.classList.toggle('on',_scAuto);}
}

// ── P2 SCRIPTURE ──
function pushCurScripture(){broadcastScripture(curSlide);}
function clearP2(){
  sbSend({type:'scripture_clear'});
  flashP2('Cleared');
}
function broadcastScripture(idx){
  const sc=SCRIPTURE_MAP[idx];if(!sc)return;
  pushRawScripture(sc);
}
function pushRawScripture(sc){
  sbSend({type:'scripture',scripture:sc});flashP2('Pushed');
}
function flashP2(msg){
  const l=document.getElementById('cmd-p2lbl');
  if(l){const p=l.textContent;l.textContent=msg;setTimeout(()=>{l.textContent='Connected';},2000);}
}

// ── HANDLE INCOMING MESSAGE ──────────────────────────────
// Shared by BroadcastChannel (same device) and Supabase Realtime (cross-device, cross-network)
function handleMessage(msg){
  if(!msg||!msg.type) return;
  if(isProjector){
    if(msg.type==='slide'){
      presentationStarted=true;
      document.getElementById('p1-wait').classList.add('hidden');
      const ssl=document.getElementById('ssl');
      if(!ssl.classList.contains('on')){
        ssl.classList.add('on');
        buildSlides(document.getElementById('ss-slides'),LESSON1_SLIDES);
        renderDots(LESSON1_SLIDES.length);
      }
      document.getElementById('p1-status').textContent='Live';
      document.getElementById('p1-status').classList.add('live');
      _suppressSync=true;
      goTo(msg.slide);
      _suppressSync=false;
    }
    if(msg.type==='p1_overlay_show'){
      document.getElementById('p1ov-ref').textContent=msg.ref||'';
      document.getElementById('p1ov-text').textContent=msg.kjv||'';
      document.getElementById('p1-sc-overlay').classList.add('show');
    }
    if(msg.type==='p1_overlay_hide'){
      document.getElementById('p1-sc-overlay').classList.remove('show');
    }
  }
  if(isScriptureDisplay){
    if(msg.type==='scripture') showP2(msg.scripture);
    else if(msg.type==='scripture_clear') clearP2Display();
    const s=document.getElementById('sp-wait-status');
    if(s){s.textContent='Live';s.classList.add('live');}
  }
  if(isObsLower||isObsFull){
    if(msg.type==='slide') showOBSSlide(msg.slide);
    if(msg.type==='scripture' && isObsFull) showOBS(msg.scripture);
    if(msg.type==='scripture_clear' && isObsFull) clearOBS();
  }
  if(isConfidence){
    if(msg.type==='slide') updateConfidence(msg.slide);
    if(msg.type==='scripture') updateConfidenceScripture(msg.scripture);
    if(msg.type==='p1_overlay_show') updateConfidenceScripture({ref_en:msg.ref,kjv:msg.kjv});
    if(msg.type==='p1_overlay_hide' || msg.type==='scripture_clear') clearConfidenceScripture();
  }
  if(msg.type==='request_fullscreen' && (isProjector||isScriptureDisplay||isObsLower||isObsFull||isConfidence)){tryRemoteFullscreen();}
  if(msg.type==='reload_projectors' && (isProjector||isScriptureDisplay||isObsLower||isObsFull||isConfidence)){location.reload();}
  if(msg.type==='panic_clear'){
    const ov=document.getElementById('p1-sc-overlay'); if(ov) ov.classList.remove('show');
    if(isScriptureDisplay) clearP2Display(); if(isObsLower||isObsFull) clearOBS(); if(isConfidence) clearConfidenceScripture();
  }
  if(isAdmin && msg.type==='question_submit'){
    questions.unshift(msg.question); renderQuestionsMini();
  }
  if(!isAdmin && msg.type==='q_unlock') unlockQ(false);
  if(isAdmin&&(msg.type==='scripture'||msg.type==='scripture_clear')){
    const d=document.getElementById('cmd-p2dot');if(d)d.classList.add('live');
    const l=document.getElementById('cmd-p2lbl');if(l)l.textContent='Connected';
  }
}

// ── INIT: BroadcastChannel (local) + Supabase Realtime (network) ──
function initBC(){
  try{
    bc=new BroadcastChannel(CHANNEL_ID);
    bc.onmessage=(e)=>handleMessage(e.data);
  }catch(e){}
  if(window.SB_URL && window.SB_KEY){
    initRealtimeSync();
  }
}

// ── SUPABASE REALTIME (WebSocket — works across any network) ──
function initRealtimeSync(){
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  script.onload=()=>{
    const sb=window.supabase.createClient(window.SB_URL, window.SB_KEY);
    sbChannel=sb.channel('ministry-sync')
      .on('postgres_changes',{event:'*',schema:'public',table:'sync_state'},payload=>{
        try{
          const msg=JSON.parse(payload.new.payload);
          if(!isAdmin) handleMessage(msg);
        }catch(e){}
      })
      .subscribe((status)=>{
        if(status==='SUBSCRIBED'){
          const l=document.getElementById('cmd-p2lbl');if(l)l.textContent='Live ✓';
          const d=document.getElementById('cmd-p2dot');if(d)d.classList.add('live');
          const ps=document.getElementById('p1-status');if(ps&&isProjector){ps.textContent='Connected';ps.classList.add('live');}
          const sps=document.getElementById('sp-wait-status');if(sps&&isScriptureDisplay){sps.textContent='Connected';sps.classList.add('live');}
          const spd=document.getElementById('sp-live-dot');if(spd&&isScriptureDisplay)spd.classList.add('live');
        }
      });
  };
  document.head.appendChild(script);
}

// ── SEND: BroadcastChannel (instant, local) + Supabase (network) ──
async function sbSend(msg){
  try{if(!bc)bc=new BroadcastChannel(CHANNEL_ID);bc.postMessage(msg);}catch(e){}
  if(!window.SB_URL||!window.SB_KEY) return;
  try{
    await fetch(window.SB_URL+'/rest/v1/sync_state',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'apikey':window.SB_KEY,
        'Authorization':'Bearer '+window.SB_KEY,
        'Prefer':'resolution=merge-duplicates,return=minimal'
      },
      body:JSON.stringify({id:1,payload:JSON.stringify(msg),updated_at:new Date().toISOString()})
    });
  }catch(e){}
}
function broadcastSlide(i){
  sbSend({type:'slide',slide:i});
}
function showP2(sc){
  document.body.classList.add('p2-live');
  document.getElementById('sp-wait').classList.add('hidden');
  document.getElementById('sp-content').style.display='flex';
  const dot=document.getElementById('sp-live-dot'); if(dot) dot.classList.add('live');
  document.getElementById('sp-ref-en').textContent=sc.ref_en||sc.ref||'';
  document.getElementById('sp-tx-en').textContent=sc.text_en||sc.kjv||'';
  const esRef=sc.ref_es||((sc.ref_en||sc.ref||'').replace('Matthew','Mateo'));
  const esText=sc.text_es||sc.rvr||'';
  document.getElementById('sp-ref-es').textContent=esText?`${esRef} · RVR 1960`:'';
  document.getElementById('sp-tx-es').textContent=esText;
}
function clearP2Display(){
  document.body.classList.remove('p2-live');
  document.getElementById('sp-content').style.display='none';
  const w=document.getElementById('sp-wait');w.classList.remove('hidden');
  const s=document.getElementById('sp-wait-status');if(s){s.textContent='Cleared';s.classList.remove('live');}
  const dot=document.getElementById('sp-live-dot'); if(dot) dot.classList.remove('live');
}


// ── TIMER + MOBILE MODE ──
function startTimer(){
  if(_timerInt) return;
  _timerStart=Date.now();
  _timerInt=setInterval(()=>{
    const s=Math.floor((Date.now()-_timerStart)/1000), m=String(Math.floor(s/60)).padStart(2,'0'), sec=String(s%60).padStart(2,'0');
    const val=`${m}:${sec}`;
    ['cmd-timer','mm-timer','conf-timer'].forEach(id=>{const el=document.getElementById(id); if(el) el.textContent=val;});
  },500);
}


// ── MOBILE HAPTIC + PWA-SAFE TAP FEEDBACK ──────────────────────────────
// Real vibration is available on many Android browsers/PWAs. iOS Safari/PWA usually
// ignores navigator.vibrate(), so the visual pulse below confirms each tap.
function hapticFeedback(type='tap'){
  try{
    if(!('vibrate' in navigator)) return;
    const patterns={
      tap:10,
      nav:18,
      start:[28,32,28],
      verse:[14,24,14],
      clear:35,
      error:[10,35,10]
    };
    navigator.vibrate(patterns[type]||patterns.tap);
  }catch(e){}
}
function visualTapFeedback(el){
  if(!el || !el.classList) return;
  el.classList.remove('tap-pulse');
  void el.offsetWidth;
  el.classList.add('tap-pulse');
}
function pulseMobileStatus(){
  ['mm-num','mm-timer','mm-title'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.classList.remove('mm-bump');
    void el.offsetWidth;
    el.classList.add('mm-bump');
  });
  const status=document.querySelector('#mobile-mode .mm-status');
  if(status){
    status.classList.remove('mm-confirm');
    void status.offsetWidth;
    status.classList.add('mm-confirm');
  }
}
function mobileFeedback(type='tap',el=null){
  hapticFeedback(type);
  visualTapFeedback(el);
  pulseMobileStatus();
}
function mobileStart(el){mobileFeedback('start',el);startPresentation();}
function mobileNext(el){mobileFeedback('nav',el);ctrlNext();}
function mobileOverlay(el){mobileFeedback('tap',el);toggleP1ScOverlay();}
function mobileClearP1Overlay(el){mobileFeedback('clear',el);clearP1Overlay();}
function mobilePanicClear(el){mobileFeedback('clear',el);panicClear();}
function slideLabel(s){
  const tl={cover:'Cover',sc:'Scripture',te:'Teaching',big:'Statement',names:'Names',final:'Closing'};
  const title=s.t==='big'?s.text.replace(/<[^>]+>/g,'').substring(0,48):s.t==='te'?s.hl.replace(/<[^>]+>/g,'').substring(0,48):s.t==='cover'?s.title:s.t==='sc'?s.ref:s.t==='names'?'The Twelve Named':'Final Landing';
  return {type:tl[s.t]||s.t,title};
}
function openMobileMode(){
  installMobileTapFeedback();
  const mm=document.getElementById('mobile-mode'); if(!mm) return;
  buildMobileVerseList(); updateMobileMode(curSlide); mm.classList.add('on'); startTimer();
}
function closeMobileMode(){const mm=document.getElementById('mobile-mode'); if(mm) mm.classList.remove('on');}
function installMobileTapFeedback(){
  if(window.__mobileTapFeedbackInstalled) return;
  window.__mobileTapFeedbackInstalled=true;
  document.addEventListener('pointerdown',e=>{
    const btn=e.target && e.target.closest ? e.target.closest('#mobile-mode button') : null;
    if(btn) visualTapFeedback(btn);
  },{passive:true});
}
function updateMobileMode(i){
  const s=LESSON1_SLIDES[i]; if(!s) return; const l=slideLabel(s);
  const n=document.getElementById('mm-num'); if(n) n.textContent=`${i+1}/${LESSON1_SLIDES.length}`;
  const t=document.getElementById('mm-type'); if(t) t.textContent=l.type;
  const ti=document.getElementById('mm-title'); if(ti) ti.textContent=l.title;
  const pb=document.getElementById('mm-prev-start');
  if(pb){
    if(!presentationStarted || i<=0){pb.textContent='Start';pb.classList.add('start');}
    else{pb.innerHTML='&#8592; Prev';pb.classList.remove('start');}
  }
}
function buildMobileVerseList(){
  const wrap=document.getElementById('mm-verse-list'); if(!wrap) return;
  wrap.innerHTML=VERSE_BANK.map(v=>`<button class="mm-v-btn" onclick="pushVerseFromMobile('${v.id}',this)"><div class="mm-v-ref">${v.ref}</div><div class="mm-v-tx">${v.kjv}</div></button>`).join('');
}
function pushVerseFromMobile(id,el=null){
  mobileFeedback('verse',el);
  const v=VERSE_BANK.find(x=>x.id===id); if(!v){mobileFeedback('error',el);return;}
  pushVerseToP1({ref:v.ref,kjv:v.kjv});
  pushRawScripture({ref_en:v.ref,text_en:v.kjv,ref_es:v.ref.replace('Matthew','Mateo'),text_es:getVBSpanish(v.id)});
}
function reloadProjectors(){sbSend({type:'reload_projectors',ts:Date.now()});}
function panicClear(){hideP1Overlay();clearP2();sbSend({type:'panic_clear',ts:Date.now()});}
function startPresentation(){
  curSlide=0;
  presentationStarted=true;
  p1ScOverlayOn=false;
  p1ActiveVerse=null;
  const ov=document.getElementById('p1-sc-overlay'); if(ov) ov.classList.remove('show');
  if(isAdmin){
    sbSend({type:'p1_overlay_hide'});
    sbSend({type:'slide',slide:0,start:true});
    // Do not auto-push a scripture on Start. Scripture screens should stay on the series/title standby until the first actual scripture/teaching slide is advanced.
    if(isScriptureDisplay) clearP2Display();
  }
  const ssl=document.getElementById('ssl');
  if(ssl){
    ssl.classList.add('on');
    if(!document.querySelector('#ss-slides .slide')){buildSlides(document.getElementById('ss-slides'),LESSON1_SLIDES);renderDots(LESSON1_SLIDES.length);}
    _suppressSync=true; goTo(0); _suppressSync=false;
  }
}
function mobilePrevOrStart(el){
  if(!presentationStarted || curSlide<=0){mobileFeedback('start',el);startPresentation();return;}
  mobileFeedback('nav',el);
  ctrlPrev();
}
function requestAuxFullscreen(){
  sbSend({type:'request_fullscreen',ts:Date.now()});
}
function tryRemoteFullscreen(){
  const target=document.documentElement;
  if(document.fullscreenElement) return;
  try{target.requestFullscreen && target.requestFullscreen().catch(()=>{});}catch(e){}
}

// ── OBS SCRIPTURE OUTPUTS ──
function showOBS(sc){
  const ref=document.getElementById('obs-ref'), txt=document.getElementById('obs-text'), sum=document.getElementById('obs-summary');
  const en=sc.text_en||sc.kjv||'';
  if(ref) ref.textContent=sc.ref_en||sc.ref||'';
  if(txt) txt.textContent=en;
  if(sum) sum.textContent='';
}
function clearOBS(){
  if(isObsFull){
    showOBSSlide(curSlide);
    return;
  }
  const ref=document.getElementById('obs-ref'), txt=document.getElementById('obs-text'), sum=document.getElementById('obs-summary');
  if(ref) ref.textContent=''; if(txt) txt.textContent=''; if(sum) sum.textContent='';
}

function slidePlainTitle(i){
  const s=LESSON1_SLIDES[i]; if(!s) return {title:'End', type:'', ref:''};
  const l=slideLabel(s);
  const title=l.title.replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
  const ref=s.ref || (SCRIPTURE_MAP[i] && (SCRIPTURE_MAP[i].ref_en||SCRIPTURE_MAP[i].ref)) || '';
  return {title,type:l.type,ref};
}
function showOBSSlide(i){
  curSlide=i;
  const cur=slidePlainTitle(i);
  const ref=document.getElementById('obs-ref'), txt=document.getElementById('obs-text'), sum=document.getElementById('obs-summary');
  if(isObsLower){
    if(ref) ref.textContent=cur.ref || 'Matthew 10';
    if(txt) txt.innerHTML=cur.title || 'Current Slide';
    if(sum) sum.textContent='Elder Eli Castaneda';
    return;
  }
  if(isObsFull){
    if(ref) ref.textContent=cur.ref || 'Matthew 10';
    if(txt) txt.innerHTML=cur.title || 'Current Slide';
    if(sum) sum.textContent='Elder Eli Castaneda';
  }
}
function toggleObsGreen(){const s=document.getElementById('obs-screen'); if(s) s.classList.toggle('green');}
function firstNoteLine(note){
  if(!note) return 'No notes for this slide.';
  const clean=String(note).trim();
  const first=clean.split(/(?<=\.)\s+/)[0];
  return first || clean;
}
function normalizeRefKey(ref){
  return String(ref||'').toLowerCase().replace('mateo','matthew').replace(/[^a-z0-9: -]/g,'').replace(/\s+/g,' ').trim();
}
function findSpanishFor(ref, text){
  const key=normalizeRefKey(ref);
  const vb=VERSE_BANK.find(v=>normalizeRefKey(v.ref)===key);
  if(vb) return {ref_es:vb.ref.replace('Matthew','Mateo'), text_es:getVBSpanish(vb.id)};
  const exact=SCRIPTURE_MAP.find(x=>normalizeRefKey(x.ref_en)===key && x.text_es);
  if(exact) return {ref_es:exact.ref_es||'RVR 1960', text_es:exact.text_es};
  const t=String(text||'').replace(/["“”]/g,'').slice(0,80).toLowerCase();
  const byText=SCRIPTURE_MAP.find(x=> t && String(x.text_en||'').replace(/["“”]/g,'').toLowerCase().includes(t));
  return byText ? {ref_es:byText.ref_es, text_es:byText.text_es} : {ref_es:'RVR 1960', text_es:''};
}
function confidenceNextLabel(slide){
  if(!slide) return {html:'End', isScripture:false};
  if(slide.t==='sc') return {html:(slide.ref||'Scripture'), isScripture:true};
  const raw=String(slide.title||slide.ref||'Next').replace(/<[^>]*>/g,'');
  return {html:raw.replace(/\b(MINISTRY|SURRENDER|MATTERS|DANGEROUS|ASSIGNMENT|OBEDIENCE|OWNED|COMMAND)\b/gi,'<span>$1</span>'), isScripture:false};
}
function renderConfidenceScripture(sc, label='Active Scripture'){
  if(!sc) return;
  const card=document.querySelector('.conf-current');
  const ck=document.getElementById('conf-current-kicker'), ct=document.getElementById('conf-current-title'), cr=document.getElementById('conf-current-ref');
  const ref=sc.ref_en||sc.ref||'';
  const en=String(sc.text_en||sc.kjv||sc.text||'').replace(/&ldquo;|&rdquo;/g,'"').replace(/^"|"$/g,'').replace(/<[^>]*>/g,'');
  let es;
  if(sc.text_es){ es={ref_es:sc.ref_es||String(ref).replace('Matthew','Mateo'), text_es:sc.text_es}; }
  else { es=findSpanishFor(ref,en); }
  if(card) card.classList.add('scripture-active');
  if(ck) ck.textContent=label;
  if(cr) cr.textContent=`${ref} · KJV / ${es.ref_es||'RVR 1960'}`;
  if(ct) ct.innerHTML=`${en}<span class="conf-es">${(es.text_es||'').replace(/^"|"$/g,'')}</span>`;
}
function updateConfidence(i){
  curSlide=i;
  const slide=LESSON1_SLIDES[i-1] || LESSON1_SLIDES[0];
  const nextSlide=LESSON1_SLIDES[i] || null;
  const card=document.querySelector('.conf-current');
  const ck=document.getElementById('conf-current-kicker'), ct=document.getElementById('conf-current-title'), cr=document.getElementById('conf-current-ref'), nt=document.getElementById('conf-next-title'), nn=document.getElementById('conf-notes-text');
  const next=confidenceNextLabel(nextSlide);
  if(nt){ nt.innerHTML=next.html; nt.classList.toggle('next-scripture', !!next.isScripture); }
  if(nn) nn.textContent=firstNoteLine(NOTES_L1[i]);
  if(slide && slide.t==='sc'){
    renderConfidenceScripture({ref_en:slide.ref, text_en:slide.text}, 'Current Scripture');
    return;
  }
  const cur=slidePlainTitle(i);
  if(card) card.classList.remove('scripture-active');
  if(ck) ck.textContent='Current Slide';
  if(ct) ct.innerHTML=(cur.title||'The Ministry').replace(/\b(MINISTRY|SURRENDER|MATTERS|DANGEROUS|ASSIGNMENT|OBEDIENCE|OWNED|COMMAND)\b/gi,'<span>$1</span>');
  if(cr) cr.textContent=cur.ref || 'Matthew 10 Series';
}
function updateConfidenceScripture(sc){
  renderConfidenceScripture(sc, 'Active Scripture');
}
function clearConfidenceScripture(){ updateConfidence(curSlide); }


// ── SIMPLE LIVE QUESTIONS ──
function openAskDrawer(){const d=document.getElementById('ask-drawer'); if(d) d.classList.add('open');}
function closeAskDrawer(){const d=document.getElementById('ask-drawer'); if(d) d.classList.remove('open');}
function submitAskQuestion(){
  const ta=document.getElementById('ask-ta'); if(!ta||!ta.value.trim()) return;
  const q={id:'q'+Date.now(), text:ta.value.trim(), name:userName||'Anonymous', ts:new Date().toISOString()};
  try{const old=JSON.parse(localStorage.getItem('tm_questions')||'[]'); old.unshift(q); localStorage.setItem('tm_questions',JSON.stringify(old.slice(0,50)));}catch(e){}
  sbSend({type:'question_submit',question:q}); questions.unshift(q); renderQuestionsMini();
  ta.value=''; const ok=document.getElementById('ask-ok'); if(ok){ok.classList.add('on');setTimeout(()=>ok.classList.remove('on'),1800);} setTimeout(closeAskDrawer,500);
}
function renderQuestionsMini(){
  let box=document.getElementById('admin-q-mini');
  if(!box){
    const right=document.querySelector('.ctrl-right [style*="overflow-y"]');
    if(!right) return;
    const div=document.createElement('div'); div.className='ctrl-ag'; div.innerHTML='<div class="ctrl-ag-lbl">Live Questions</div><div id="admin-q-mini" style="font-family:var(--fc);font-size:.72rem;color:var(--mu);line-height:1.35">No questions yet.</div>'; right.appendChild(div); box=div.querySelector('#admin-q-mini');
  }
  const local=(()=>{try{return JSON.parse(localStorage.getItem('tm_questions')||'[]')}catch(e){return[]}})();
  const all=[...questions,...local].filter((q,i,a)=>a.findIndex(x=>x.id===q.id)===i).slice(0,6);
  box.innerHTML=all.length?all.map(q=>`<div style="border-top:1px solid var(--ln);padding:8px 0"><span style="color:var(--red)">${q.name||'Anonymous'}:</span> ${q.text}</div>`).join(''):'No questions yet.';
}


// =========================================================
// 03. v13-teaching-obs-cleanup-js
// Preserved from the stable working build. Keep order.
// =========================================================
(function(){
  function strip(html){
    const d=document.createElement('div');
    d.innerHTML=String(html||'');
    return (d.textContent||d.innerText||'').replace(/\s+/g,' ').trim();
  }
  function safe(s){return String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}

  // Teaching slides: no point number. This becomes the standard render moving forward.
  window.renderSlide=function(s,i){
    const d=`data-i="${i}"`;
    switch(s.t){
      case 'cover':return`<div class="slide sl-cover"${d}><div class="sl-cover-bg"></div><div class="sl-cover-ov"></div><div class="sl-cover-body"><div class="sl-cey">${s.eyebrow}</div><div class="sl-ct"><span class="tt">THE</span><span class="tm">MINISTRY</span></div><div class="sl-cln">${s.lesson}</div><div class="sl-cnm">${s.title}</div><div class="sl-crf">${s.ref}</div><div class="sl-cft"><div class="sl-cm"><div class="sl-cml">Presenter</div><div class="sl-cmv">Elder Eli Castaneda</div></div><div class="sl-cm"><div class="sl-cml">Date</div><div class="sl-cmv">June 18, 2026</div></div><div class="sl-cm"><div class="sl-cml">Text</div><div class="sl-cmv">Matthew 10:1-10</div></div></div></div></div>`;
      case 'sc':return`<div class="slide sl-sc"${d}><div class="sl-sc-mk"></div><div class="sl-sc-rf">&#10013; ${s.ref}</div><div class="sl-sc-tx">${s.text}</div><div class="sl-sc-tk">${s.tk}</div></div>`;
      case 'te':return`<div class="slide sl-te"${d}><div class="sl-te-h">${s.hl}</div><ul class="sl-pts">${(s.pts||[]).map(p=>`<li>${p}</li>`).join('')}</ul>${s.ref?`<div class="sl-te-ref">${s.ref}</div>`:''}</div>`;
      case 'big':return`<div class="slide sl-big"${d}>${s.sup?`<div class="sl-big-sup">${s.sup}</div>`:''}<div class="sl-big-text">${s.text}</div>${s.ref?`<div class="sl-big-ref">${s.ref}</div>`:''}</div>`;
      case 'names':return`<div class="slide sl-names"${d}><div class="sl-nhd">Matthew 10:2-4</div><div class="sl-nhl">${s.hl}</div><div class="sl-ngrid">${(s.people||[]).map(p=>`<div class="sl-nc"><div class="sl-ncn">${p.name}</div><div class="sl-nct">${p.note}</div></div>`).join('')}</div></div>`;
      case 'final':return`<div class="slide sl-final"${d}><div class="sl-fk">${s.kicker}</div><div class="sl-ft">${s.text}</div><div class="sl-fl">${s.sub}</div>${s.ref?`<div class="sl-fr">${s.ref}</div>`:''}</div>`;
      default:return'';
    }
  };

  window.slidePlainTitle=function(i){
    const s=LESSON1_SLIDES[i]; if(!s) return {title:'End', type:'', ref:'', summary:''};
    const ref=s.ref || (SCRIPTURE_MAP[i] && (SCRIPTURE_MAP[i].ref_en||SCRIPTURE_MAP[i].ref)) || '';
    if(s.t==='cover') return {title:s.title,type:'Cover',ref:s.ref||'Matthew 10:1-10',summary:'Elder Eli Castaneda'};
    if(s.t==='sc') return {title:strip(s.text),type:'Scripture',ref:s.ref,summary:strip(s.tk||'')};
    if(s.t==='te') return {title:strip(s.hl),type:'Teaching',ref,summary:(s.pts||[]).slice(-1).map(strip).join('') || 'Elder Eli Castaneda'};
    if(s.t==='big') return {title:strip(s.text),type:'Statement',ref,summary:'Elder Eli Castaneda'};
    if(s.t==='names') return {title:strip(s.hl||'The Twelve Named'),type:'Names',ref:'Matthew 10:2-4',summary:'Elder Eli Castaneda'};
    if(s.t==='final') return {title:strip(s.text),type:'Closing',ref:s.ref||'Matthew 10',summary:strip(s.sub||'')};
    return {title:'Current Slide',type:s.t,ref,summary:'Elder Eli Castaneda'};
  };

  window.showOBS=function(sc){
    const box=document.getElementById('obs-lower');
    const ref=document.getElementById('obs-ref'), txt=document.getElementById('obs-text'), sum=document.getElementById('obs-summary');
    const en=String(sc.text_en||sc.kjv||'').replace(/^"|"$/g,'');
    if(box) box.classList.add('scripture');
    if(ref) ref.textContent=sc.ref_en||sc.ref||'Matthew 10';
    if(txt) txt.textContent=en;
    if(sum) sum.textContent='KJV';
  };

  window.showOBSSlide=function(i){
    curSlide=i;
    const s=LESSON1_SLIDES[i];
    const cur=window.slidePlainTitle(i);
    const box=document.getElementById('obs-lower');
    const ref=document.getElementById('obs-ref'), txt=document.getElementById('obs-text'), sum=document.getElementById('obs-summary');
    if(box) box.classList.remove('scripture');
    if(!s){ if(ref)ref.textContent=''; if(txt)txt.textContent=''; if(sum)sum.textContent=''; return; }
    if(isObsLower){
      if(ref) ref.textContent=cur.ref || 'Matthew 10';
      if(txt) txt.textContent=cur.title || 'Current Slide';
      if(sum) sum.textContent='Elder Eli Castaneda';
      return;
    }
    if(isObsFull){
      if(s.t==='sc'){
        const sc=SCRIPTURE_MAP[i] || {ref_en:s.ref,text_en:strip(s.text)};
        window.showOBS(sc);
        return;
      }
      if(ref) ref.textContent=cur.ref || 'Matthew 10';
      if(txt) txt.textContent=cur.title || 'Current Slide';
      if(sum) sum.textContent=cur.summary || 'Elder Eli Castaneda';
    }
  };

  // OBS full should not be hijacked by every Auto P2 verse push after slide movement.
  // It shows scripture on actual scripture slides or manual scripture pushes, and otherwise shows the clean main point.
  window.__lastObsSlideAt=0;
  window.handleMessage=function(msg){
    if(!msg||!msg.type) return;
    if(isProjector){
      if(msg.type==='slide'){
        presentationStarted=true;
        document.getElementById('p1-wait').classList.add('hidden');
        const ssl=document.getElementById('ssl');
        if(!ssl.classList.contains('on')){
          ssl.classList.add('on');
          buildSlides(document.getElementById('ss-slides'),LESSON1_SLIDES);
          renderDots(LESSON1_SLIDES.length);
        }
        const p1s=document.getElementById('p1-status'); if(p1s){p1s.textContent='Live';p1s.classList.add('live');}
        _suppressSync=true; goTo(msg.slide); _suppressSync=false;
      }
      if(msg.type==='p1_overlay_show'){
        document.getElementById('p1ov-ref').textContent=msg.ref||'';
        document.getElementById('p1ov-text').textContent=msg.kjv||'';
        document.getElementById('p1-sc-overlay').classList.add('show');
      }
      if(msg.type==='p1_overlay_hide'){document.getElementById('p1-sc-overlay').classList.remove('show');}
    }
    if(isScriptureDisplay){
      if(msg.type==='scripture') showP2(msg.scripture);
      else if(msg.type==='scripture_clear') clearP2Display();
      const s=document.getElementById('sp-wait-status'); if(s){s.textContent='Live';s.classList.add('live');}
    }
    if(isObsLower||isObsFull){
      if(msg.type==='slide'){ window.__lastObsSlideAt=Date.now(); window.showOBSSlide(msg.slide); }
      if(msg.type==='scripture' && isObsFull){
        const current=LESSON1_SLIDES[curSlide];
        const autoFollow=(Date.now()-window.__lastObsSlideAt)<900;
        if((current && current.t==='sc') || !autoFollow){ window.showOBS(msg.scripture); }
      }
      if(msg.type==='scripture_clear' && isObsFull) clearOBS();
    }
    if(isConfidence){
      if(msg.type==='slide') updateConfidence(msg.slide);
      if(msg.type==='scripture') updateConfidenceScripture(msg.scripture);
      if(msg.type==='p1_overlay_show') updateConfidenceScripture({ref_en:msg.ref,kjv:msg.kjv});
      if(msg.type==='p1_overlay_hide' || msg.type==='scripture_clear') clearConfidenceScripture();
    }
    if(msg.type==='request_fullscreen' && (isProjector||isScriptureDisplay||isObsLower||isObsFull||isConfidence)){tryRemoteFullscreen();}
    if(msg.type==='reload_projectors' && (isProjector||isScriptureDisplay||isObsLower||isObsFull||isConfidence)){location.reload();}
    if(msg.type==='panic_clear'){
      const ov=document.getElementById('p1-sc-overlay'); if(ov) ov.classList.remove('show');
      if(isScriptureDisplay) clearP2Display(); if(isObsLower||isObsFull) clearOBS(); if(isConfidence) clearConfidenceScripture();
    }
    if(isAdmin&&(msg.type==='scripture'||msg.type==='scripture_clear')){
      const d=document.getElementById('cmd-p2dot');if(d)d.classList.add('live');
      const l=document.getElementById('cmd-p2lbl');if(l)l.textContent='Connected';
    }
  };
})();


// =========================================================
// 04. v16-confidence-monitor-cleanup-js
// Preserved from the stable working build. Keep order.
// =========================================================
(function(){
  const strip=(html)=>{const d=document.createElement('div');d.innerHTML=String(html||'');return (d.textContent||d.innerText||'').replace(/\s+/g,' ').trim();};
  const safe=(s)=>String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const accent=(s)=>safe(s).replace(/\b(MINISTRY|SURRENDER|MATTERS|DANGEROUS|ASSIGNMENT|OBEDIENCE|OWNED|COMMAND|WORK|SENT|CALL|PRICE)\b/gi,'<span>$1</span>');
  function getSlide(i){return LESSON1_SLIDES[Math.max(0,Math.min(LESSON1_SLIDES.length-1,Number(i)||0))];}
  function titleFor(i){
    const s=getSlide(i);
    if(!s) return {title:'Waiting',ref:'',type:'Current Slide',summary:''};
    if(s.t==='cover') return {title:s.title||'The Ministry',ref:s.ref||'Matthew 10:1-10',type:'Current Slide',summary:'Elder Eli Castaneda'};
    if(s.t==='sc') return {title:strip(s.text),ref:s.ref||'',type:'Current Scripture',summary:strip(s.tk||'')};
    if(s.t==='te') return {title:strip(s.hl),ref:s.ref||'',type:'Current Slide',summary:(s.pts||[]).map(strip)[0]||''};
    if(s.t==='big') return {title:strip(s.text),ref:s.ref||'',type:'Current Slide',summary:'Big statement'};
    if(s.t==='names') return {title:strip(s.hl||'The Twelve Named'),ref:'Matthew 10:2-4',type:'Current Slide',summary:'Names grid'};
    if(s.t==='final') return {title:strip(s.text),ref:s.ref||'Matthew 10',type:'Current Slide',summary:strip(s.sub||'')};
    return {title:strip(s.title||s.text||'Current Slide'),ref:s.ref||'',type:'Current Slide',summary:''};
  }
  function nextMainIndex(i){
    for(let n=(Number(i)||0)+1;n<LESSON1_SLIDES.length;n++){
      const s=LESSON1_SLIDES[n];
      if(s && s.t!=='sc') return n;
    }
    return -1;
  }
  function spanishFor(ref,en){
    if(typeof findSpanishFor==='function') return findSpanishFor(ref,en);
    const key=String(ref||'').toLowerCase();
    const found=(SCRIPTURE_MAP||[]).find(x=>String(x.ref_en||'').toLowerCase()===key);
    return found?{ref_es:found.ref_es,text_es:found.text_es}:{ref_es:String(ref||'').replace('Matthew','Mateo'),text_es:''};
  }
  function renderConfScripture(sc,label){
    const card=document.querySelector('.conf-current');
    const ck=document.getElementById('conf-current-kicker');
    const ct=document.getElementById('conf-current-title');
    const cr=document.getElementById('conf-current-ref');
    const ref=sc.ref_en||sc.ref||'';
    const en=strip(sc.text_en||sc.kjv||sc.text||'').replace(/^"|"$/g,'');
    const es=sc.text_es?{ref_es:sc.ref_es||String(ref).replace('Matthew','Mateo'),text_es:sc.text_es}:spanishFor(ref,en);
    if(card){card.classList.remove('slide-current');card.classList.add('scripture-active');}
    if(ck) ck.textContent=label||'Current Scripture';
    if(ct) ct.innerHTML=safe(en).replace(/^"|"$/g,'')+(es.text_es?`<span class="conf-es">${safe(es.text_es).replace(/^"|"$/g,'')}</span>`:'');
    if(cr) cr.textContent=`${ref} · KJV${es.ref_es?' / '+es.ref_es:''}`;
  }
  window.updateConfidence=function(i){
    curSlide=Number.isFinite(Number(i))?Number(i):0;
    const slide=getSlide(curSlide);
    const card=document.querySelector('.conf-current');
    const ck=document.getElementById('conf-current-kicker');
    const ct=document.getElementById('conf-current-title');
    const cr=document.getElementById('conf-current-ref');
    const nt=document.getElementById('conf-next-title');
    const nn=document.getElementById('conf-notes-text');

    const ni=nextMainIndex(curSlide);
    if(nt){
      if(ni>=0){
        const next=titleFor(ni);
        nt.innerHTML=accent(next.title||'Next Slide');
        nt.classList.remove('next-scripture');
      }else{
        nt.textContent='End';
        nt.classList.remove('next-scripture');
      }
    }
    if(nn) nn.textContent=(typeof firstNoteLine==='function'?firstNoteLine(NOTES_L1[curSlide]):(NOTES_L1[curSlide]||'')).replace(/\s+/g,' ').trim() || 'No notes.';

    if(slide && slide.t==='sc'){
      const sc=(SCRIPTURE_MAP&&SCRIPTURE_MAP[curSlide])||{ref_en:slide.ref,text_en:strip(slide.text)};
      renderConfScripture(sc,'Current Scripture');
      return;
    }

    const cur=titleFor(curSlide);
    if(card){card.classList.remove('scripture-active');card.classList.add('slide-current');}
    if(ck) ck.textContent=cur.type||'Current Slide';
    if(ct) ct.innerHTML=accent(cur.title||'The Ministry');
    if(cr) cr.textContent=cur.ref || 'Matthew 10 Series';
  };
  window.updateConfidenceScripture=function(sc){
    // Only P1 overlay/manual scripture should take over the confidence current box.
    renderConfScripture(sc,'Active Scripture');
  };
  window.clearConfidenceScripture=function(){ window.updateConfidence(curSlide||0); };

  // Auto-P2 scripture pushes should not hijack the confidence monitor.
  const previousHandle=window.handleMessage;
  window.handleMessage=function(msg){
    if(isConfidence && msg && msg.type==='scripture') return;
    return previousHandle ? previousHandle(msg) : undefined;
  };

  // Mark auto scripture sync separately so outputs can distinguish it later.
  window.broadcastScripture=function(idx){
    const sc=SCRIPTURE_MAP[idx]; if(!sc) return;
    sbSend({type:'scripture',scripture:sc,auto:true});
    if(typeof flashP2==='function') flashP2('Pushed');
  };
  window.pushRawScripture=function(sc){
    sbSend({type:'scripture',scripture:sc,manual:true});
    if(typeof flashP2==='function') flashP2('Pushed');
  };

  if(isConfidence) setTimeout(()=>window.updateConfidence(curSlide||0),0);
})();


// =========================================================
// 05. v22-polls-and-output-adjustments
// Poll system is intentionally frontend-only for this static template.
// It uses the existing sync channel and stores attendee answers anonymously in localStorage.
// =========================================================
(function(){
  const stripHtml=(html)=>{const d=document.createElement('div');d.innerHTML=String(html||'');return (d.textContent||d.innerText||'').replace(/\s+/g,' ').trim();};
  const safe=(s)=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  window.POLL_BANK = window.POLL_BANK || [
    {id:'poll-yes-no-ready',type:'yesno',question:'Do you feel called to examine the price before asking for the platform?',options:['Yes','No']},
    {id:'poll-formation',type:'choice',question:'Which part of ministry needs the most formation first?',options:['Character','Obedience','Endurance','Compassion']},
    {id:'poll-response',type:'choice',question:'What is the hardest part of being sent?',options:['Surrender','Boundaries','Rejection','Consistency']}
  ];
  window.pollState = window.pollState || {active:null,selected:null,responses:{}};

  function currentPoll(){ return window.pollState && window.pollState.active; }
  function optionKey(opt){ return String(opt||'').trim(); }
  function pollId(){ return 'poll-'+Date.now()+'-'+Math.random().toString(16).slice(2,7); }
  function normalizePoll(p){
    const opts=(p.options||[]).map(o=>String(o).trim()).filter(Boolean);
    return {id:p.id||pollId(), type:p.type||'choice', question:String(p.question||'Live poll').trim(), options:opts.length?opts:['Yes','No'], createdAt:p.createdAt||new Date().toISOString()};
  }
  function getPollResponses(id){ return (window.pollState.responses && window.pollState.responses[id]) || []; }
  function rememberPollVote(vote){
    try{const old=JSON.parse(localStorage.getItem('tm_poll_answers')||'[]'); old.unshift(vote); localStorage.setItem('tm_poll_answers',JSON.stringify(old.slice(0,250)));}catch(e){}
  }
  function setPollActiveClass(on){
    document.body.classList.toggle('poll-active', !!on);
  }

  window.renderPollBank=function(){
    const box=document.getElementById('poll-bank-list');
    if(box){
      box.innerHTML=(window.POLL_BANK||[]).map(p=>`<div class="poll-bank-card" onclick="launchPollById('${safe(p.id)}')"><div class="poll-bank-title">${safe(p.question)}</div><div class="poll-bank-meta">${safe((p.options||[]).join(' / '))}</div></div>`).join('');
    }
    const mm=document.getElementById('mm-poll-bank');
    if(mm){
      mm.innerHTML=(window.POLL_BANK||[]).map(p=>`<div class="mm-poll-card"><div>${safe(p.question)}</div><div style="color:var(--mu);font-size:.62rem;margin-top:6px">${safe((p.options||[]).join(' / '))}</div><button onclick="launchPollById('${safe(p.id)}');closeMobilePollPanel(this)">Launch</button></div>`).join('');
    }
  };
  window.launchPollById=function(id){
    const p=(window.POLL_BANK||[]).find(x=>x.id===id);
    if(p) window.launchPoll(p,true);
  };
  window.launchQuickYesNo=function(){
    const q=(document.getElementById('poll-custom-question')||{}).value || 'Yes or no?';
    window.launchPoll({type:'yesno',question:q,options:['Yes','No']},true);
  };
  window.launchCustomPoll=function(){
    const q=(document.getElementById('poll-custom-question')||{}).value || 'Live poll';
    const raw=(document.getElementById('poll-custom-options')||{}).value || 'Yes, No';
    const options=raw.split(',').map(x=>x.trim()).filter(Boolean);
    window.launchPoll({type:options.length===2&&/yes/i.test(options[0])?'yesno':'choice',question:q,options},true);
  };
  window.launchMobileCustomPoll=function(el){
    if(typeof mobileFeedback==='function') mobileFeedback('tap',el);
    const q=(document.getElementById('mm-poll-question')||{}).value || 'Live poll';
    const raw=(document.getElementById('mm-poll-options')||{}).value || 'Yes, No';
    const options=raw.split(',').map(x=>x.trim()).filter(Boolean);
    window.launchPoll({question:q,options},true);
    window.closeMobilePollPanel(el);
  };
  window.openMobilePollPanel=function(el){
    if(typeof mobileFeedback==='function') mobileFeedback('tap',el);
    const p=document.getElementById('mm-poll-panel'); if(p){p.classList.add('on'); renderPollBank();}
  };
  window.closeMobilePollPanel=function(el){
    if(typeof mobileFeedback==='function') mobileFeedback('tap',el);
    const p=document.getElementById('mm-poll-panel'); if(p)p.classList.remove('on');
  };

  window.launchPoll=function(p,broadcast=true){
    const poll=normalizePoll(p);
    window.pollState.active=poll;
    setPollActiveClass(true);
    window.pollState.selected=null;
    window.pollState.responses[poll.id]=window.pollState.responses[poll.id]||[];
    renderPollOverlay(poll);
    renderPollResults();
    if(broadcast && typeof sbSend==='function') sbSend({type:'poll_open',poll,ts:Date.now()});
  };
  window.closeActivePoll=function(broadcast=true){
    const id=currentPoll() && currentPoll().id;
    window.pollState.active=null;
    setPollActiveClass(false);
    window.pollState.selected=null;
    hidePollUI();
    if(broadcast && typeof sbSend==='function') sbSend({type:'poll_close',pollId:id,ts:Date.now()});
  };
  window.hidePollForUserOnly=function(){
    const el=document.getElementById('poll-screen'); if(el)el.classList.remove('on');
  };
  function hidePollUI(){
    const s=document.getElementById('poll-screen'); if(s)s.classList.remove('on');
    const r=document.getElementById('poll-results'); if(r)r.classList.remove('on');
  }
  function shouldShowVotingOverlay(){ return !(isProjector||isScriptureDisplay||isObsLower||isObsFull||isConfidence||isAdmin); }
  function shouldShowResultOverlay(){ return (isProjector||isScriptureDisplay||isObsLower||isObsFull); }
  function renderPollOverlay(poll){
    const screen=document.getElementById('poll-screen'); if(!screen||!poll) return;
    const q=document.getElementById('poll-question'), opts=document.getElementById('poll-options'), thanks=document.getElementById('poll-thanks'), sub=document.getElementById('poll-sub');
    if(q)q.textContent=poll.question;
    if(sub)sub.textContent='Choose one answer. Your response can be saved anonymously.';
    if(thanks)thanks.classList.remove('on');
    window.pollState.selected=null;
    const submit=document.getElementById('poll-submit'); if(submit)submit.disabled=true;
    if(opts){
      opts.innerHTML=(poll.options||[]).map((o,i)=>`<button class="poll-option" onclick="selectPollOption('${safe(o)}',this)"><span>${safe(o)}</span><span class="poll-check">Selected</span></button>`).join('');
    }
    if(shouldShowVotingOverlay()) screen.classList.add('on'); else screen.classList.remove('on');
  }
  window.selectPollOption=function(value,btn){
    window.pollState.selected=value;
    document.querySelectorAll('.poll-option').forEach(b=>b.classList.remove('selected'));
    if(btn)btn.classList.add('selected');
    const submit=document.getElementById('poll-submit'); if(submit)submit.disabled=false;
  };
  window.submitPollVote=function(){
    const poll=currentPoll(); if(!poll||!window.pollState.selected) return;
    const anon=document.getElementById('poll-anon');
    const vote={id:'vote-'+Date.now()+'-'+Math.random().toString(16).slice(2,6),pollId:poll.id,answer:optionKey(window.pollState.selected),anonymous:!anon||anon.checked,name:(!anon||anon.checked)?'Anonymous':(userName||'Anonymous'),ts:new Date().toISOString()};
    rememberPollVote(vote);
    addPollVote(vote);
    if(typeof sbSend==='function') sbSend({type:'poll_vote',vote,ts:Date.now()});
    const thanks=document.getElementById('poll-thanks'); if(thanks)thanks.classList.add('on');
    const submit=document.getElementById('poll-submit'); if(submit){submit.disabled=true;submit.textContent='Submitted';}
    setTimeout(()=>{const screen=document.getElementById('poll-screen'); if(screen)screen.classList.remove('on'); if(submit)submit.textContent='Submit';},900);
  };
  function addPollVote(vote){
    if(!vote||!vote.pollId) return;
    const arr=window.pollState.responses[vote.pollId]=window.pollState.responses[vote.pollId]||[];
    if(!arr.some(v=>v.id===vote.id)) arr.push(vote);
    renderPollResults();
    renderPollAdminSummary();
  }
  window.addPollVote=addPollVote;
  window.renderPollResults=function(){
    const poll=currentPoll(); const box=document.getElementById('poll-results');
    setPollActiveClass(!!poll);
    if(!box||!poll) return;
    const q=document.getElementById('poll-results-q'), rows=document.getElementById('poll-results-rows'), count=document.getElementById('poll-result-count');
    const votes=getPollResponses(poll.id);
    const total=votes.length;
    const tally={}; (poll.options||[]).forEach(o=>tally[optionKey(o)]=0); votes.forEach(v=>{const k=optionKey(v.answer); tally[k]=(tally[k]||0)+1;});
    if(q)q.textContent=poll.question;
    if(rows){
      rows.innerHTML=(poll.options||[]).map(o=>{const k=optionKey(o), n=tally[k]||0, pct=total?Math.round((n/total)*100):0; return `<div class="poll-result-row"><div class="poll-result-label">${safe(k)}</div><div class="poll-result-bar"><div class="poll-result-fill" style="width:${pct}%"></div></div><div class="poll-result-pct">${pct}%</div></div>`;}).join('');
    }
    if(count)count.textContent=`${total} answer${total===1?'':'s'}`;
    box.classList.toggle('green',!!isObsLower);
    if(shouldShowResultOverlay()) box.classList.add('on');
  };
  function renderPollAdminSummary(){
    let box=document.getElementById('admin-poll-summary');
    if(!box){
      const right=document.querySelector('.ctrl-right [style*="overflow-y"]');
      if(right){const div=document.createElement('div'); div.className='ctrl-ag'; div.innerHTML='<div class="ctrl-ag-lbl">Poll Results</div><div id="admin-poll-summary" style="font-family:var(--fc);font-size:.72rem;color:var(--mu);line-height:1.35">No active poll.</div>'; right.appendChild(div); box=div.querySelector('#admin-poll-summary');}
    }
    if(!box) return;
    const poll=currentPoll(); if(!poll){box.textContent='No active poll.';return;}
    const votes=getPollResponses(poll.id), total=votes.length, tally={}; poll.options.forEach(o=>tally[optionKey(o)]=0); votes.forEach(v=>{const k=optionKey(v.answer); tally[k]=(tally[k]||0)+1;});
    box.innerHTML=`<div style="color:var(--w);margin-bottom:6px">${safe(poll.question)}</div>`+poll.options.map(o=>{const k=optionKey(o),n=tally[k]||0,pct=total?Math.round(n/total*100):0;return `<div>${safe(k)}: <span style="color:var(--red)">${pct}%</span> <span style="color:var(--mu)">(${n})</span></div>`}).join('')+`<div style="margin-top:6px;color:var(--mu)">${total} answers</div>`;
  }

  // Spanish RVR becomes the main side-screen scripture. KJV moves underneath as supporting text.
  window.showP2=function(sc){
    document.body.classList.add('p2-live');
    const wait=document.getElementById('sp-wait'); if(wait) wait.classList.add('hidden');
    const content=document.getElementById('sp-content'); if(content) content.style.display='flex';
    const dot=document.getElementById('sp-live-dot'); if(dot) dot.classList.add('live');
    const enRef=sc.ref_en||sc.ref||'';
    const enText=sc.text_en||sc.kjv||'';
    const esRef=sc.ref_es||String(enRef).replace('Matthew','Mateo');
    const esText=sc.text_es||sc.rvr||'';
    const r1=document.getElementById('sp-ref-en'), t1=document.getElementById('sp-tx-en'), r2=document.getElementById('sp-ref-es'), t2=document.getElementById('sp-tx-es');
    if(r1)r1.textContent=esRef;
    if(t1)t1.textContent=esText || enText;
    if(r2)r2.textContent=enRef;
    if(t2)t2.textContent=enText;
  };

  // OBS lower thirds should start green by default for chroma key.
  function forceObsLowerGreen(){
    if(isObsLower){
      document.body.classList.add('obs-mode','lower');
      const s=document.getElementById('obs-screen'); if(s)s.classList.add('green');
    }
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(forceObsLowerGreen,0));
  const oldToggleObsGreen=window.toggleObsGreen;
  window.toggleObsGreen=function(){const s=document.getElementById('obs-screen'); if(s)s.classList.toggle('green');};

  // Wrap navigation so next/previous kills the poll overlay, like clearing verse overlays.
  const oldNext=window.nextSlide, oldPrev=window.prevSlide, oldCtrlNext=window.ctrlNext, oldCtrlPrev=window.ctrlPrev, oldGoTo=window.goTo;
  window.nextSlide=function(){ if(currentPoll()) window.closeActivePoll(true); return oldNext?oldNext():undefined; };
  window.prevSlide=function(){ if(currentPoll()) window.closeActivePoll(true); return oldPrev?oldPrev():undefined; };
  window.ctrlNext=function(){ if(currentPoll()) window.closeActivePoll(true); return oldCtrlNext?oldCtrlNext():window.nextSlide(); };
  window.ctrlPrev=function(){ if(currentPoll()) window.closeActivePoll(true); return oldCtrlPrev?oldCtrlPrev():window.prevSlide(); };

  // Final message wrapper for polls. Preserve existing stable handler first.
  const previousHandle=window.handleMessage;
  window.handleMessage=function(msg){
    if(msg&&msg.type==='poll_open'){
      window.pollState.active=normalizePoll(msg.poll);
      setPollActiveClass(true);
      window.pollState.selected=null;
      window.pollState.responses[window.pollState.active.id]=window.pollState.responses[window.pollState.active.id]||[];
      renderPollOverlay(window.pollState.active); renderPollResults(); renderPollAdminSummary(); return;
    }
    if(msg&&msg.type==='poll_close'){ window.pollState.active=null; setPollActiveClass(false); window.pollState.selected=null; hidePollUI(); renderPollAdminSummary(); return; }
    if(msg&&msg.type==='poll_vote'){ addPollVote(msg.vote); return; }
    if(msg&&msg.type==='slide'){ hidePollUI(); window.pollState.active=null; setPollActiveClass(false); }
    return previousHandle?previousHandle(msg):undefined;
  };

  // Ensure dynamically added controls exist after admin/mobile opens.
  const oldSwitchTab=window.switchTab;
  window.switchTab=function(name,btn){ const r=oldSwitchTab?oldSwitchTab(name,btn):undefined; if(name==='polls') renderPollBank(); return r; };
  const oldOpenMobile=window.openMobileMode;
  window.openMobileMode=function(){ const r=oldOpenMobile?oldOpenMobile():undefined; setTimeout(renderPollBank,0); return r; };
  setTimeout(()=>{renderPollBank(); renderPollAdminSummary();},300);
})();



// =========================================================
// v23-scripture-standby-and-poll-takeover
// Small safe patch: Start does not auto-send slide-0 scripture, and scripture screens become full-screen poll results while a poll is active.
// =========================================================
(function(){
  const oldLaunchPoll=window.launchPoll;
  window.launchPoll=function(p,broadcast){
    const r=oldLaunchPoll?oldLaunchPoll(p,broadcast):undefined;
    if(isScriptureDisplay) document.body.classList.add('poll-active');
    return r;
  };
  const oldCloseActivePoll=window.closeActivePoll;
  window.closeActivePoll=function(broadcast){
    document.body.classList.remove('poll-active');
    return oldCloseActivePoll?oldCloseActivePoll(broadcast):undefined;
  };
  const oldHidePollUI=window.hidePollUI;
  if(typeof oldHidePollUI==='function'){
    window.hidePollUI=function(){ document.body.classList.remove('poll-active'); return oldHidePollUI(); };
  }
  const oldHandle=window.handleMessage;
  window.handleMessage=function(msg){
    if(msg&&msg.type==='poll_open'&&isScriptureDisplay) document.body.classList.add('poll-active');
    if(msg&&(msg.type==='poll_close'||msg.type==='slide'||msg.type==='panic_clear')&&isScriptureDisplay) document.body.classList.remove('poll-active');
    return oldHandle?oldHandle(msg):undefined;
  };
})();


// =========================================================
// v25 live slave mode + poll persistence polish
// Small additive patch on top of stable v24. Does not change routes or core sync.
// =========================================================
(function(){
  const POLL_ARCHIVE_KEY='tm_lesson_poll_archive_v1';
  const SESSION_OPT_OUT_KEY='tm_user_exited_slave';
  const SESSION_LIVE_KEY='tm_session_live';

  function gflag(name){try{return !!eval(name);}catch(e){return !!window[name];}}
  function gnum(name,fallback=0){try{const v=eval(name);return Number.isFinite(Number(v))?Number(v):fallback;}catch(e){return fallback;}}
  function isOutputScreen(){return !!(gflag('isProjector')||gflag('isScriptureDisplay')||gflag('isObsLower')||gflag('isObsFull')||gflag('isConfidence'));}
  function isAudienceClient(){return !gflag('isAdmin') && !isOutputScreen() && !document.body.classList.contains('mobile-mode-only');}
  function getActivePoll(){return window.pollState && window.pollState.active;}
  function getResponses(id){return (window.pollState && window.pollState.responses && window.pollState.responses[id]) || [];}
  function loadArchive(){try{return JSON.parse(localStorage.getItem(POLL_ARCHIVE_KEY)||'[]')||[];}catch(e){return []}}
  function saveArchive(list){try{localStorage.setItem(POLL_ARCHIVE_KEY,JSON.stringify(list.slice(0,120)));}catch(e){}}
  function archivePoll(reason='saved'){
    const poll=getActivePoll();
    if(!poll||!poll.id) return;
    const responses=getResponses(poll.id).slice();
    const item={
      id:poll.id,
      series:(window.SERIES_CONFIG&&window.SERIES_CONFIG.title)||'THE MINISTRY',
      lesson:(window.LESSON_DATA&&window.LESSON_DATA.title)||'Lesson 1',
      question:poll.question,
      type:poll.type||'choice',
      options:poll.options||[],
      responses,
      savedAnonymous:true,
      reason,
      updatedAt:new Date().toISOString()
    };
    const old=loadArchive().filter(x=>x.id!==item.id);
    old.unshift(item);
    saveArchive(old);
    window.LESSON_POLL_ARCHIVE=old;
  }
  window.archiveActivePoll=archivePoll;

  function refreshReturnButton(){
    document.body.classList.toggle('session-live', localStorage.getItem(SESSION_LIVE_KEY)==='1' || gflag('presentationStarted'));
  }
  function ensureAudienceControls(){
    if(!document.getElementById('slave-exit')){
      const b=document.createElement('button'); b.id='slave-exit'; b.className='slave-exit'; b.textContent='×'; b.setAttribute('aria-label','Exit live session'); b.onclick=window.exitSlaveMode; document.body.appendChild(b);
    }
    const btns=document.querySelector('.hub-btns');
    if(btns && !document.getElementById('return-session-btn')){
      const b=document.createElement('button'); b.id='return-session-btn'; b.className='btn btn-outline return-session-btn'; b.textContent='Return to Session'; b.onclick=window.returnToSession; btns.prepend(b);
    }
    refreshReturnButton();
  }
  window.enterSlaveMode=function(index){
    if(!isAudienceClient()) return;
    localStorage.setItem(SESSION_LIVE_KEY,'1');
    ensureAudienceControls();
    if(localStorage.getItem(SESSION_OPT_OUT_KEY)==='1'){refreshReturnButton();return;}
    ['sc','sh','admin-hub','questionnaire'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('on');});
    const ssl=document.getElementById('ssl'); if(!ssl) return;
    if(!document.querySelector('#ss-slides .slide')){
      buildSlides(document.getElementById('ss-slides'),LESSON1_SLIDES);
      renderDots(LESSON1_SLIDES.length);
    }
    ssl.classList.add('on');
    document.body.classList.add('audience-slave');
    window._suppressSync=true; goTo(Math.max(0,Number(index)||0)); window._suppressSync=false;
  };
  window.exitSlaveMode=function(){
    localStorage.setItem(SESSION_OPT_OUT_KEY,'1');
    document.body.classList.remove('audience-slave');
    const ssl=document.getElementById('ssl'); if(ssl)ssl.classList.remove('on');
    if(typeof showHub==='function') showHub();
    refreshReturnButton();
  };
  window.returnToSession=function(){
    localStorage.removeItem(SESSION_OPT_OUT_KEY);
    window.enterSlaveMode(gnum('curSlide',0));
  };

  function renderConfidencePoll(){
    if(!gflag('isConfidence')) return;
    const poll=getActivePoll(); if(!poll) return;
    const card=document.querySelector('.conf-current');
    const ck=document.getElementById('conf-current-kicker');
    const ct=document.getElementById('conf-current-title');
    const cr=document.getElementById('conf-current-ref');
    const votes=getResponses(poll.id);
    const total=votes.length;
    const esc=s=>String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const tally={}; (poll.options||[]).forEach(o=>tally[String(o).trim()]=0);
    votes.forEach(v=>{const k=String(v.answer||'').trim();tally[k]=(tally[k]||0)+1;});
    if(card){card.classList.remove('scripture-active','slide-current');card.classList.add('poll-current');}
    if(ck) ck.textContent='Live Poll';
    if(cr) cr.textContent=`${total} answer${total===1?'':'s'} · Anonymous`;
    if(ct){
      ct.innerHTML=`<div class="conf-poll-q">${esc(poll.question)}</div><div class="conf-poll-rows">${(poll.options||[]).map(o=>{const k=String(o).trim(),n=tally[k]||0,pct=total?Math.round(n/total*100):0;return `<div class="conf-poll-row"><div class="conf-poll-label">${esc(k)}</div><div class="conf-poll-bar"><div class="conf-poll-fill" style="width:${pct}%"></div></div><div class="conf-poll-pct">${pct}%</div></div>`}).join('')}</div><div class="conf-poll-count">${total} answer${total===1?'':'s'}</div>`;
    }
  }
  window.renderConfidencePoll=renderConfidencePoll;

  function refreshPollIndicators(){
    const active=!!getActivePoll();
    const btn=document.getElementById('mm-poll-btn') || Array.from(document.querySelectorAll('#mobile-mode .mm-action')).find(b=>/^poll$/i.test((b.textContent||'').trim()));
    if(btn){btn.id='mm-poll-btn';btn.classList.toggle('poll-live',active);}
    const kill=document.getElementById('mm-kill-poll'); if(kill) kill.style.display=active?'block':'none';
    document.body.classList.toggle('poll-active',active);
    if(active) renderConfidencePoll();
    else if(gflag('isConfidence') && typeof updateConfidence==='function') updateConfidence(gnum('curSlide',0));
  }
  window.refreshPollIndicators=refreshPollIndicators;
  window.mobileKillPoll=function(el){ if(typeof mobileFeedback==='function') mobileFeedback('clear',el); archivePoll('killed'); if(typeof closeActivePoll==='function') closeActivePoll(true); refreshPollIndicators(); };

  const oldLaunchPoll=window.launchPoll;
  window.launchPoll=function(p,broadcast=true){
    const current=getActivePoll();
    if(current) archivePoll('replaced');
    const r=oldLaunchPoll?oldLaunchPoll(p,broadcast):undefined;
    archivePoll('opened');
    refreshPollIndicators();
    return r;
  };
  const oldClosePoll=window.closeActivePoll;
  window.closeActivePoll=function(broadcast=true){
    archivePoll('closed');
    const r=oldClosePoll?oldClosePoll(broadcast):undefined;
    refreshPollIndicators();
    return r;
  };
  const oldAddPollVote=window.addPollVote;
  window.addPollVote=function(vote){
    const r=oldAddPollVote?oldAddPollVote(vote):undefined;
    archivePoll('vote');
    refreshPollIndicators();
    return r;
  };
  const oldRenderPollResults=window.renderPollResults;
  window.renderPollResults=function(){
    const r=oldRenderPollResults?oldRenderPollResults():undefined;
    refreshPollIndicators();
    return r;
  };

  // Do not let keyboard shortcuts fire while editing poll/question text.
  document.addEventListener('keydown',function(e){
    const t=e.target;
    const editable=t && (t.matches && t.matches('input,textarea,select,[contenteditable="true"]'));
    const pollEditing=!!document.querySelector('#mm-poll-panel.on');
    if(editable || pollEditing){
      if([' ','Spacebar','ArrowLeft','ArrowRight','Enter'].includes(e.key)) e.stopPropagation();
    }
  },true);

  const oldHandle=window.handleMessage;
  window.handleMessage=function(msg){
    if(msg && msg.type==='slide'){
      localStorage.setItem(SESSION_LIVE_KEY,'1');
      if(isAudienceClient()) setTimeout(()=>window.enterSlaveMode(msg.slide),0);
      if(getActivePoll()) archivePoll('slide-cleared');
    }
    if(msg && msg.type==='poll_open'){
      if(getActivePoll() && getActivePoll().id !== (msg.poll&&msg.poll.id)) archivePoll('replaced');
    }
    if(msg && msg.type==='poll_close'){archivePoll('remote-closed');}
    const r=oldHandle?oldHandle(msg):undefined;
    if(msg && (msg.type==='poll_open'||msg.type==='poll_vote')) archivePoll(msg.type==='poll_vote'?'vote':'opened');
    if(msg && (msg.type==='poll_open'||msg.type==='poll_vote'||msg.type==='poll_close'||msg.type==='slide')) refreshPollIndicators();
    return r;
  };

  const oldUpdateConfidence=window.updateConfidence;
  window.updateConfidence=function(i){
    const r=oldUpdateConfidence?oldUpdateConfidence(i):undefined;
    if(getActivePoll() && gflag('isConfidence')) renderConfidencePoll();
    return r;
  };

  const oldShowHub=window.showHub;
  window.showHub=function(){const r=oldShowHub?oldShowHub():undefined; ensureAudienceControls(); return r;};
  const oldOpenMobile=window.openMobileMode;
  window.openMobileMode=function(){const r=oldOpenMobile?oldOpenMobile():undefined; setTimeout(refreshPollIndicators,0); return r;};

  document.addEventListener('DOMContentLoaded',()=>{ensureAudienceControls();refreshPollIndicators();});
  setTimeout(()=>{ensureAudienceControls();refreshPollIndicators();},500);
})();
