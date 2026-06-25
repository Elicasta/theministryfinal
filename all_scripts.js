
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
window.SB_KEY = ''; // loaded from /api/config when deployed
let sbClient = null;
let sbConfigPromise = null;
let sbRealtimeStarted = false;
let sbLastRemoteAt = 0;

async function loadSupabasePublicConfig(){
  if(window.SB_URL && window.SB_KEY) return {supabaseUrl:window.SB_URL,supabaseAnonKey:window.SB_KEY};
  if(sbConfigPromise) return sbConfigPromise;
  sbConfigPromise = fetch('/api/config',{cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject(new Error('config fetch failed')))
    .then(cfg=>{
      if(cfg && cfg.supabaseUrl) window.SB_URL = cfg.supabaseUrl;
      if(cfg && cfg.supabaseAnonKey) window.SB_KEY = cfg.supabaseAnonKey;
      return cfg || {};
    })
    .catch(err=>{console.warn('Supabase public config unavailable',err); return {};});
  return sbConfigPromise;
}

function markRealtimeStatus(text,live=false){
  const l=document.getElementById('cmd-p2lbl'); if(l) l.textContent=text;
  const d=document.getElementById('cmd-p2dot'); if(d) d.classList.toggle('live',!!live);
  const ps=document.getElementById('p1-status'); if(ps&&isProjector){ps.textContent=text;ps.classList.toggle('live',!!live);}
  const sps=document.getElementById('sp-wait-status'); if(sps&&isScriptureDisplay){sps.textContent=text;sps.classList.toggle('live',!!live);}
  const spd=document.getElementById('sp-live-dot'); if(spd&&isScriptureDisplay) spd.classList.toggle('live',!!live);
}

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


// =========================================================
// EDITABLE SECTION: LESSON 2 DATA
// Added as an alternate lesson. Use ?lesson=lesson-2 on any route.
// =========================================================
const LESSON2_SLIDES = [
  {
    "t": "cover",
    "eyebrow": "The Ministry &middot; Matthew 10",
    "lesson": "Lesson 2",
    "title": "The Discipline of the Sent",
    "ref": "Matthew 10:11-16"
  },
  {
    "t": "big",
    "sup": "Big Idea",
    "text": "Jesus does not only <span class=\"acc\">send</span> disciples. He instructs them how to <span class=\"acc\">move.</span>",
    "ref": "Matthew 10:11-16"
  },
  {
    "t": "te",
    "n": "01",
    "hl": "Burden is not the same as <span class=\"acc\">instruction.</span>",
    "pts": [
      "There is a difference between being burdened and being instructed.",
      "There is a difference between compassion and moving under command.",
      "There is a difference between seeing need and knowing assignment.",
      "<span class=\"hi\">Ministry without instruction can cause damage.</span>"
    ],
    "ref": "Matthew 10:11-16"
  },
  {
    "t": "te",
    "n": "02",
    "hl": "The discipline of the <span class=\"acc\">sent.</span>",
    "pts": [
      "How do sent people enter?",
      "How do sent people discern?",
      "How do sent people stay?",
      "How do sent people carry peace, leave clean, and face danger without becoming dangerous?"
    ],
    "ref": "Matthew 10:11-16"
  },
  {
    "t": "sc",
    "ref": "Matthew 10:11",
    "text": "&ldquo;And into whatsoever city or town ye shall enter, enquire who in it is worthy; and there abide till ye go thence.&rdquo;",
    "tk": "The first instruction is not preach louder. The first instruction is enquire."
  },
  {
    "t": "te",
    "n": "03",
    "hl": "Discern before you <span class=\"acc\">invest.</span>",
    "pts": [
      "Jesus does not tell them to attach to the first interested person.",
      "He does not let need alone decide where they stay.",
      "Worthy does not mean perfect. It means receptive.",
      "<span class=\"hi\">Mature ministry sees posture, not only pain.</span>"
    ],
    "ref": "Matthew 10:11"
  },
  {
    "t": "big",
    "sup": "Preach Line",
    "text": "Compassion sees need. Obedience discerns <span class=\"acc\">assignment.</span>",
    "ref": "Matthew 10:11"
  },
  {
    "t": "te",
    "n": "04",
    "hl": "A worthy house is <span class=\"acc\">receptive.</span>",
    "pts": [
      "Not every person who needs help wants truth.",
      "Not every open door is obedience.",
      "Not every invitation is assignment.",
      "<span class=\"hi\">Can the Word, peace, instruction, and truth rest here?</span>"
    ],
    "ref": "Matthew 10:11"
  },
  {
    "t": "te",
    "n": "05",
    "hl": "Sent people must know how to <span class=\"acc\">stay.</span>",
    "pts": [
      "Jesus says, &ldquo;There abide till ye go thence.&rdquo;",
      "Restlessness is not discernment.",
      "Faithfulness can look ordinary.",
      "<span class=\"hi\">Stay where God placed you until God releases you.</span>"
    ],
    "ref": "Matthew 10:11"
  },
  {
    "t": "sc",
    "ref": "Matthew 10:12-13",
    "text": "&ldquo;And when ye come into an house, salute it. And if the house be worthy, let your peace come upon it: but if it be not worthy, let your peace return to you.&rdquo;",
    "tk": "The disciple is careful, but not cold."
  },
  {
    "t": "te",
    "n": "06",
    "hl": "Carry peace, but do not <span class=\"acc\">force</span> it.",
    "pts": [
      "The disciple enters with peace.",
      "Peace rests where there is receptivity.",
      "Peace returns where it is resisted.",
      "<span class=\"hi\">You can love and still let peace return.</span>"
    ],
    "ref": "Matthew 10:12-13"
  },
  {
    "t": "big",
    "sup": "Preach Line",
    "text": "Do not lose peace trying to <span class=\"acc\">force</span> peace.",
    "ref": "Matthew 10:12-13"
  },
  {
    "t": "sc",
    "ref": "Matthew 10:14-15",
    "text": "&ldquo;And whosoever shall not receive you, nor hear your words, when ye depart out of that house or city, shake off the dust of your feet.&rdquo;",
    "tk": "Leaving can be obedience when the Word is refused."
  },
  {
    "t": "te",
    "n": "07",
    "hl": "Leave without <span class=\"acc\">bitterness.</span>",
    "pts": [
      "There are places where staying is no longer patience.",
      "Dust is the residue of rejection.",
      "Do not carry the last place into the next assignment.",
      "<span class=\"hi\">Judgment belongs to God. Obedience belongs to the disciple.</span>"
    ],
    "ref": "Matthew 10:14-15"
  },
  {
    "t": "big",
    "sup": "Preach Line",
    "text": "Do not carry the dust of a place Jesus told you to <span class=\"acc\">leave.</span>",
    "ref": "Matthew 10:14-15"
  },
  {
    "t": "sc",
    "ref": "Matthew 10:16",
    "text": "&ldquo;Behold, I send you forth as sheep in the midst of wolves: be ye therefore wise as serpents, and harmless as doves.&rdquo;",
    "tk": "Do not become a wolf. Do not pretend wolves are not real."
  },
  {
    "t": "te",
    "n": "08",
    "hl": "Sheep among <span class=\"acc\">wolves.</span>",
    "pts": [
      "Jesus does not romanticize the work.",
      "Danger is real, but danger does not redefine the disciple.",
      "The presence of wolves does not give sheep permission to become wolves.",
      "<span class=\"hi\">Stay sheep. See wolves. Belong to the Shepherd.</span>"
    ],
    "ref": "Matthew 10:16"
  },
  {
    "t": "te",
    "n": "09",
    "hl": "Wise and <span class=\"acc\">harmless.</span>",
    "pts": [
      "Harmlessness without wisdom can still damage the work.",
      "Wisdom without harmlessness becomes corruption with good vocabulary.",
      "Jesus corrects foolish innocence and corrupt intelligence.",
      "<span class=\"hi\">Clear eyes. Clean hands.</span>"
    ],
    "ref": "Matthew 10:16"
  },
  {
    "t": "big",
    "sup": "Preach Line",
    "text": "Jesus does not ask for blind innocence or corrupt intelligence. He asks for wisdom with <span class=\"acc\">clean hands.</span>",
    "ref": "Matthew 10:16"
  },
  {
    "t": "final",
    "kicker": "Closing Line",
    "text": "Sent people do not only carry power. They move under <span class=\"acc\">instruction.</span>",
    "sub": "Ministry is compassion under command. The sending is His, and the discipline is His too.",
    "ref": "Matthew 10:11-16"
  }
];

const NOTES_L2 = {
  "0": "Opening title. Start Lesson 2 here.",
  "1": "Big idea. Use after “Jesus does not only send His disciples into the work.”",
  "2": "Opening diagnostic. Burden, compassion, need, and assignment.",
  "3": "Transition into the lesson frame: enter, discern, stay, peace, leave, danger.",
  "4": "Read Matthew 10:11. Begin Point I: discern before you invest.",
  "5": "Point I. Slow down on “enquire” and “worthy.”",
  "6": "Preach line after Point I: Compassion sees need, obedience discerns assignment.",
  "7": "Explain worthy as receptive, not perfect or impressive.",
  "8": "Point II. Shift from discerning to abiding. Restlessness is not discernment.",
  "9": "Read Matthew 10:12-13. Begin Point III: peace.",
  "10": "Point III. Peace can rest, or peace can return.",
  "11": "Preach line after peace section. Let it land.",
  "12": "Read Matthew 10:14-15. Begin Point IV: leaving clean.",
  "13": "Point IV. Dust is residue. Warn against carrying rejection forward.",
  "14": "Preach line after dust section. Pause.",
  "15": "Read Matthew 10:16. Begin wolves section.",
  "16": "Point V. Sheep among wolves. Do not become what wounded you.",
  "17": "Point VI. Wise and harmless. Correct both imbalance errors.",
  "18": "Preach line after wisdom section. Clear eyes, clean hands.",
  "19": "Closing. Ministry remains under instruction. End with final line."
};

const SCRIPTURE_MAP_L2 = [
  {
    "ref_en": "Matthew 10:11-16",
    "text_en": "\"And into whatsoever city or town ye shall enter, enquire who in it is worthy... Behold, I send you forth as sheep in the midst of wolves: be ye therefore wise as serpents, and harmless as doves.\"",
    "ref_es": "Mateo 10:11-16",
    "text_es": "\"Mas en cualquier ciudad o aldea donde entréis, informaos quién en ella sea digno... He aquí, yo os envío como a ovejas en medio de lobos; sed, pues, prudentes como serpientes, y sencillos como palomas.\""
  },
  {
    "ref_en": "Matthew 10:11-16",
    "text_en": "\"And into whatsoever city or town ye shall enter, enquire who in it is worthy... Behold, I send you forth as sheep in the midst of wolves: be ye therefore wise as serpents, and harmless as doves.\"",
    "ref_es": "Mateo 10:11-16",
    "text_es": "\"Mas en cualquier ciudad o aldea donde entréis, informaos quién en ella sea digno... He aquí, yo os envío como a ovejas en medio de lobos; sed, pues, prudentes como serpientes, y sencillos como palomas.\""
  },
  {
    "ref_en": "Matthew 10:11-16",
    "text_en": "\"And into whatsoever city or town ye shall enter, enquire who in it is worthy... Behold, I send you forth as sheep in the midst of wolves: be ye therefore wise as serpents, and harmless as doves.\"",
    "ref_es": "Mateo 10:11-16",
    "text_es": "\"Mas en cualquier ciudad o aldea donde entréis, informaos quién en ella sea digno... He aquí, yo os envío como a ovejas en medio de lobos; sed, pues, prudentes como serpientes, y sencillos como palomas.\""
  },
  {
    "ref_en": "Matthew 10:11-16",
    "text_en": "\"And into whatsoever city or town ye shall enter, enquire who in it is worthy... Behold, I send you forth as sheep in the midst of wolves: be ye therefore wise as serpents, and harmless as doves.\"",
    "ref_es": "Mateo 10:11-16",
    "text_es": "\"Mas en cualquier ciudad o aldea donde entréis, informaos quién en ella sea digno... He aquí, yo os envío como a ovejas en medio de lobos; sed, pues, prudentes como serpientes, y sencillos como palomas.\""
  },
  {
    "ref_en": "Matthew 10:11",
    "text_en": "\"And into whatsoever city or town ye shall enter, enquire who in it is worthy; and there abide till ye go thence.\"",
    "ref_es": "Mateo 10:11",
    "text_es": "\"Mas en cualquier ciudad o aldea donde entréis, informaos quién en ella sea digno, y posad allí hasta que salgáis.\""
  },
  {
    "ref_en": "Matthew 10:11",
    "text_en": "\"And into whatsoever city or town ye shall enter, enquire who in it is worthy; and there abide till ye go thence.\"",
    "ref_es": "Mateo 10:11",
    "text_es": "\"Mas en cualquier ciudad o aldea donde entréis, informaos quién en ella sea digno, y posad allí hasta que salgáis.\""
  },
  {
    "ref_en": "Matthew 10:11",
    "text_en": "\"And into whatsoever city or town ye shall enter, enquire who in it is worthy; and there abide till ye go thence.\"",
    "ref_es": "Mateo 10:11",
    "text_es": "\"Mas en cualquier ciudad o aldea donde entréis, informaos quién en ella sea digno, y posad allí hasta que salgáis.\""
  },
  {
    "ref_en": "Matthew 10:11",
    "text_en": "\"And into whatsoever city or town ye shall enter, enquire who in it is worthy; and there abide till ye go thence.\"",
    "ref_es": "Mateo 10:11",
    "text_es": "\"Mas en cualquier ciudad o aldea donde entréis, informaos quién en ella sea digno, y posad allí hasta que salgáis.\""
  },
  {
    "ref_en": "Matthew 10:11",
    "text_en": "\"And into whatsoever city or town ye shall enter, enquire who in it is worthy; and there abide till ye go thence.\"",
    "ref_es": "Mateo 10:11",
    "text_es": "\"Mas en cualquier ciudad o aldea donde entréis, informaos quién en ella sea digno, y posad allí hasta que salgáis.\""
  },
  {
    "ref_en": "Matthew 10:12-13",
    "text_en": "\"And when ye come into an house, salute it. And if the house be worthy, let your peace come upon it: but if it be not worthy, let your peace return to you.\"",
    "ref_es": "Mateo 10:12-13",
    "text_es": "\"Y al entrar en la casa, saludadla. Y si la casa fuere digna, vuestra paz vendrá sobre ella; mas si no fuere digna, vuestra paz se volverá a vosotros.\""
  },
  {
    "ref_en": "Matthew 10:12-13",
    "text_en": "\"And when ye come into an house, salute it. And if the house be worthy, let your peace come upon it: but if it be not worthy, let your peace return to you.\"",
    "ref_es": "Mateo 10:12-13",
    "text_es": "\"Y al entrar en la casa, saludadla. Y si la casa fuere digna, vuestra paz vendrá sobre ella; mas si no fuere digna, vuestra paz se volverá a vosotros.\""
  },
  {
    "ref_en": "Matthew 10:12-13",
    "text_en": "\"And when ye come into an house, salute it. And if the house be worthy, let your peace come upon it: but if it be not worthy, let your peace return to you.\"",
    "ref_es": "Mateo 10:12-13",
    "text_es": "\"Y al entrar en la casa, saludadla. Y si la casa fuere digna, vuestra paz vendrá sobre ella; mas si no fuere digna, vuestra paz se volverá a vosotros.\""
  },
  {
    "ref_en": "Matthew 10:14-15",
    "text_en": "\"And whosoever shall not receive you, nor hear your words, when ye depart out of that house or city, shake off the dust of your feet. Verily I say unto you, It shall be more tolerable for the land of Sodom and Gomorrha in the day of judgment, than for that city.\"",
    "ref_es": "Mateo 10:14-15",
    "text_es": "\"Y si alguno no os recibiere, ni oyere vuestras palabras, salid de aquella casa o ciudad, y sacudid el polvo de vuestros pies. De cierto os digo que en el día del juicio, será más tolerable el castigo para la tierra de Sodoma y de Gomorra, que para aquella ciudad.\""
  },
  {
    "ref_en": "Matthew 10:14-15",
    "text_en": "\"And whosoever shall not receive you, nor hear your words, when ye depart out of that house or city, shake off the dust of your feet. Verily I say unto you, It shall be more tolerable for the land of Sodom and Gomorrha in the day of judgment, than for that city.\"",
    "ref_es": "Mateo 10:14-15",
    "text_es": "\"Y si alguno no os recibiere, ni oyere vuestras palabras, salid de aquella casa o ciudad, y sacudid el polvo de vuestros pies. De cierto os digo que en el día del juicio, será más tolerable el castigo para la tierra de Sodoma y de Gomorra, que para aquella ciudad.\""
  },
  {
    "ref_en": "Matthew 10:14-15",
    "text_en": "\"And whosoever shall not receive you, nor hear your words, when ye depart out of that house or city, shake off the dust of your feet. Verily I say unto you, It shall be more tolerable for the land of Sodom and Gomorrha in the day of judgment, than for that city.\"",
    "ref_es": "Mateo 10:14-15",
    "text_es": "\"Y si alguno no os recibiere, ni oyere vuestras palabras, salid de aquella casa o ciudad, y sacudid el polvo de vuestros pies. De cierto os digo que en el día del juicio, será más tolerable el castigo para la tierra de Sodoma y de Gomorra, que para aquella ciudad.\""
  },
  {
    "ref_en": "Matthew 10:16",
    "text_en": "\"Behold, I send you forth as sheep in the midst of wolves: be ye therefore wise as serpents, and harmless as doves.\"",
    "ref_es": "Mateo 10:16",
    "text_es": "\"He aquí, yo os envío como a ovejas en medio de lobos; sed, pues, prudentes como serpientes, y sencillos como palomas.\""
  },
  {
    "ref_en": "Matthew 10:16",
    "text_en": "\"Behold, I send you forth as sheep in the midst of wolves: be ye therefore wise as serpents, and harmless as doves.\"",
    "ref_es": "Mateo 10:16",
    "text_es": "\"He aquí, yo os envío como a ovejas en medio de lobos; sed, pues, prudentes como serpientes, y sencillos como palomas.\""
  },
  {
    "ref_en": "Matthew 10:16",
    "text_en": "\"Behold, I send you forth as sheep in the midst of wolves: be ye therefore wise as serpents, and harmless as doves.\"",
    "ref_es": "Mateo 10:16",
    "text_es": "\"He aquí, yo os envío como a ovejas en medio de lobos; sed, pues, prudentes como serpientes, y sencillos como palomas.\""
  },
  {
    "ref_en": "Matthew 10:16",
    "text_en": "\"Behold, I send you forth as sheep in the midst of wolves: be ye therefore wise as serpents, and harmless as doves.\"",
    "ref_es": "Mateo 10:16",
    "text_es": "\"He aquí, yo os envío como a ovejas en medio de lobos; sed, pues, prudentes como serpientes, y sencillos como palomas.\""
  },
  {
    "ref_en": "Matthew 10:11-16",
    "text_en": "\"And into whatsoever city or town ye shall enter, enquire who in it is worthy... Behold, I send you forth as sheep in the midst of wolves: be ye therefore wise as serpents, and harmless as doves.\"",
    "ref_es": "Mateo 10:11-16",
    "text_es": "\"Mas en cualquier ciudad o aldea donde entréis, informaos quién en ella sea digno... He aquí, yo os envío como a ovejas en medio de lobos; sed, pues, prudentes como serpientes, y sencillos como palomas.\""
  }
];

const VERSE_BANK_L2 = [
  {
    "id": "l2v11",
    "ref": "Matthew 10:11",
    "kjv": "And into whatsoever city or town ye shall enter, enquire who in it is worthy; and there abide till ye go thence.",
    "slides": [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8
    ]
  },
  {
    "id": "l2v12_13",
    "ref": "Matthew 10:12-13",
    "kjv": "And when ye come into an house, salute it. And if the house be worthy, let your peace come upon it: but if it be not worthy, let your peace return to you.",
    "slides": [
      9,
      10,
      11
    ]
  },
  {
    "id": "l2v14_15",
    "ref": "Matthew 10:14-15",
    "kjv": "And whosoever shall not receive you, nor hear your words, when ye depart out of that house or city, shake off the dust of your feet. Verily I say unto you, It shall be more tolerable for the land of Sodom and Gomorrha in the day of judgment, than for that city.",
    "slides": [
      12,
      13,
      14
    ]
  },
  {
    "id": "l2v16",
    "ref": "Matthew 10:16",
    "kjv": "Behold, I send you forth as sheep in the midst of wolves: be ye therefore wise as serpents, and harmless as doves.",
    "slides": [
      15,
      16,
      17,
      18,
      19
    ]
  }
];

const QUESTIONS_L2 = [
  {
    "section": "Reflection Questions",
    "questions": [
      {
        "num": "1",
        "text": "Where have I confused a burden with an assignment?"
      },
      {
        "num": "2",
        "text": "What does “enquire” look like before I invest time, counsel, access, or energy?"
      },
      {
        "num": "3",
        "text": "What are the signs of a worthy, receptive house in my current ministry context?"
      },
      {
        "num": "4",
        "text": "Where is Jesus calling me to abide, not chase something new?"
      },
      {
        "num": "5",
        "text": "Where have I called restlessness discernment?"
      },
      {
        "num": "6",
        "text": "Do I enter spaces with peace, or do I enter guarded and harsh?"
      },
      {
        "num": "7",
        "text": "Where do I need to let my peace return instead of forcing a conversation to go my way?"
      },
      {
        "num": "8",
        "text": "What dust am I still carrying from a place Jesus told me to leave?"
      },
      {
        "num": "9",
        "text": "In what ways have wolves, pressure, resistance, or manipulation tempted me to stop being a sheep?"
      },
      {
        "num": "10",
        "text": "What would it look like this week to be wise as a serpent and harmless as a dove at the same time?"
      }
    ]
  }
];

const POLL_BANK_L2 = [
  {
    "id": "l2-poll-1",
    "question": "Do you feel called to examine where you have confused burden with assignment?",
    "options": [
      "Yes",
      "No"
    ],
    "anonymous": false
  },
  {
    "id": "l2-poll-2",
    "question": "Which discipline is hardest for you right now?",
    "options": [
      "Discern before investing",
      "Stay where placed",
      "Let peace return",
      "Leave clean"
    ],
    "anonymous": false
  },
  {
    "id": "l2-poll-3",
    "question": "Where do you most need Jesus to govern your movement?",
    "options": [
      "Access",
      "Investment",
      "Peace",
      "Staying",
      "Leaving"
    ],
    "anonymous": false
  },
  {
    "id": "l2-poll-4",
    "question": "Which phrase hits your current season most?",
    "options": [
      "Not every need is assignment",
      "Do not force peace",
      "Shake off the dust",
      "Wise and harmless"
    ],
    "anonymous": false
  }
];


const LESSON_LIBRARY = Object.freeze({
  'lesson-1': {
    slug: 'lesson-1',
    label: 'Lesson 1',
    title: 'The Price of Being Sent',
    text: 'Matthew 10:1-10',
    slides: LESSON1_SLIDES,
    notes: NOTES_L1,
    scriptureMap: SCRIPTURE_MAP,
    verseBank: VERSE_BANK,
    questions: QUESTIONS,
    pollBank: null
  },
  'lesson-2': {
    slug: 'lesson-2',
    label: 'Lesson 2',
    title: 'The Discipline of the Sent',
    text: 'Matthew 10:11-16',
    slides: LESSON2_SLIDES,
    notes: NOTES_L2,
    scriptureMap: SCRIPTURE_MAP_L2,
    verseBank: VERSE_BANK_L2,
    questions: QUESTIONS_L2,
    pollBank: POLL_BANK_L2
  }
});
function normalizeLessonSlug(raw){
  raw=String(raw||'').toLowerCase().trim();
  if(raw==='2') return 'lesson-2';
  if(raw==='1') return 'lesson-1';
  return LESSON_LIBRARY[raw] ? raw : 'lesson-1';
}
function requestedLessonSlug(){
  const p=new URLSearchParams(window.location.search);
  const fromUrl=p.get('lesson')||p.get('l');
  if(fromUrl) return normalizeLessonSlug(fromUrl);
  try{
    const saved=localStorage.getItem('tm_selected_lesson');
    if(saved) return normalizeLessonSlug(saved);
  }catch(e){}
  return 'lesson-1';
}
function replaceEditableArray(target, source){
  target.splice(0, target.length, ...source);
}
function replaceEditableObject(target, source){
  Object.keys(target).forEach(k=>delete target[k]);
  Object.assign(target, source);
}
const LESSON1_BASE = (()=>{
  try{
    return {
      slug:'lesson-1',
      label:'Lesson 1',
      title:'The Price of Being Sent',
      text:'Matthew 10:1-10',
      slides: JSON.parse(JSON.stringify(LESSON1_SLIDES)),
      notes: JSON.parse(JSON.stringify(NOTES_L1)),
      scriptureMap: JSON.parse(JSON.stringify(SCRIPTURE_MAP)),
      verseBank: JSON.parse(JSON.stringify(VERSE_BANK)),
      questions: JSON.parse(JSON.stringify(QUESTIONS)),
      pollBank: window.POLL_BANK ? JSON.parse(JSON.stringify(window.POLL_BANK)) : null
    };
  }catch(e){
    return LESSON_LIBRARY['lesson-1'];
  }
})();

function lessonPayload(slug){
  const key=normalizeLessonSlug(slug);
  if(key==='lesson-1') return LESSON1_BASE;
  return LESSON_LIBRARY[key] || LESSON1_BASE;
}
function applySelectedLesson(slug){
  const lesson=lessonPayload(slug || requestedLessonSlug());
  replaceEditableArray(LESSON1_SLIDES, lesson.slides || []);
  replaceEditableObject(NOTES_L1, lesson.notes || {});
  replaceEditableArray(SCRIPTURE_MAP, lesson.scriptureMap || []);
  replaceEditableArray(VERSE_BANK, lesson.verseBank || []);
  replaceEditableArray(QUESTIONS, lesson.questions || []);
  if(lesson.pollBank) window.POLL_BANK = JSON.parse(JSON.stringify(lesson.pollBank));
  window.LESSON_SLUG = lesson.slug;
  window.LESSON_DATA = { slug: lesson.slug, label: lesson.label, title: lesson.title, text: lesson.text };
  try{localStorage.setItem('tm_selected_lesson', lesson.slug);}catch(e){}
  try{setTimeout(()=>updateLandingLessonState(lesson.slug),0);}catch(e){}
  return lesson;
}

const HOME_LESSON_META = {
  'lesson-1': {num:'01', label:'Lesson 1', dateShort:'June 18', dateLong:'June 18, 2026', title:'The Price of Being Sent', text:'Matthew 10:1-10', slides:'15 Slides', tagline:'Ministry does not begin with a platform. It begins with a call.', reflectionTitle:'Personal Examination', reflectionMeta:'6 sections · 17 questions', open:true},
  'lesson-2': {num:'02', label:'Lesson 2', dateShort:'June 25', dateLong:'June 25, 2026', title:'The Discipline of the Sent', text:'Matthew 10:11-16', slides:'20 Slides', tagline:'Jesus does not only send disciples. He instructs disciples in how to move.', reflectionTitle:'The Discipline of the Sent', reflectionMeta:'10 reflection questions', open:true},
  'lesson-3': {num:'03', label:'Lesson 3', dateShort:'July 2', dateLong:'July 2, 2026', title:'How to Do Ministry', text:'Matthew 10:24-33 · 1 & 2 Timothy', slides:'Coming Soon', tagline:'Coming soon.', open:false},
  'lesson-4': {num:'04', label:'Lesson 4', dateShort:'July 9', dateLong:'July 9, 2026', title:'The Reward of the Work', text:'Matthew 10:34-42', slides:'Coming Soon', tagline:'Coming soon.', open:false}
};
function updateLandingLessonState(slug){
  const active=normalizeLessonSlug(slug || window.LESSON_SLUG || requestedLessonSlug());
  const meta=HOME_LESSON_META[active] || HOME_LESSON_META['lesson-1'];
  const series=document.querySelector('.sc-series');
  if(series){
    series.innerHTML=Object.entries(HOME_LESSON_META).map(([key,item])=>{
      const cls=[key===active?'active':'', item.open?'':'locked'].filter(Boolean).join(' ');
      const action=item.open ? ` onclick=\"selectLesson('${key}',true)\"` : '';
      return `<div class=\"sc-si ${cls}\"${action}>${item.label} · ${item.dateShort}</div>`;
    }).join('');
  }
  const tag=document.querySelector('.sc-tag'); if(tag) tag.textContent=meta.tagline;
  const hubRef=document.querySelector('.hub-ref'); if(hubRef) hubRef.textContent=meta.tagline;
  const row=document.querySelector('.series-row');
  if(row){
    row.innerHTML=Object.entries(HOME_LESSON_META).map(([key,item])=>{
      const cls=[key===active?'active':'', item.open?'':'locked'].filter(Boolean).join(' ');
      const action=item.open ? ` onclick=\"selectLesson('${key}',true);openSS()\"` : '';
      return `<div class=\"s-cell ${cls}\"${action}><div class=\"cd\">${item.dateShort}</div><div><span class=\"cn\">${item.num} ·</span> ${item.title}</div>${item.open?'':'<span class=\"cl\">🔒</span>'}</div>`;
    }).join('');
  }
  const current=document.querySelector('.hub-body > .lcard:not(.locked)');
  if(current){
    current.onclick=()=>openSS();
    current.innerHTML=`<div><div class=\"lc-wk\">${meta.label} · ${meta.dateLong}</div><div class=\"lc-ti\">${meta.title}</div><div class=\"lc-rf\">${meta.text} · ${meta.slides}</div></div><div style=\"display:flex;align-items:center;gap:12px\"><div class=\"lc-bg live\">Live</div><div style=\"color:var(--mu)\">→</div></div>`;
  }
  const qHeroEy=document.querySelector('.q-hero-ey'); if(qHeroEy) qHeroEy.textContent=`${meta.label} · End of Session`;
  const qHeroTitle=document.querySelector('.q-hero-title'); if(qHeroTitle) qHeroTitle.textContent=meta.reflectionTitle || 'Personal Examination';
  const qHeroSub=document.querySelector('.q-hero-sub'); if(qHeroSub) qHeroSub.textContent=`${meta.title} · ${meta.text}`;
  const qCard=document.getElementById('q-hub-card');
  if(qCard){
    const title=qCard.querySelector('.lc-ti'); if(title) title.textContent=meta.reflectionTitle || 'Personal Examination';
    const sub=qCard.querySelector('.lc-rf'); if(sub) sub.textContent=meta.reflectionMeta || 'Reflection questions';
    const wk=qCard.querySelector('.lc-wk'); if(wk) wk.textContent=`End of ${meta.label}`;
  }
}
applySelectedLesson();

// Admin-driven lesson routing. Keep the permanent routes (/projector, /scriptures,
// /confidence, /mobile, /obslowerthirds, /obsslides). Admin selects the lesson once,
// then every output follows that selected lesson through the sync channel. Query params
// still work as a testing override, but are not required for live use.
function resetForLessonChange(){
  curSlide=0;
  presentationStarted=false;
  p1ScOverlayOn=false;
  p1ActiveVerse=null;
  try{closeActivePoll && closeActivePoll(false);}catch(e){}
  const ov=document.getElementById('p1-sc-overlay'); if(ov) ov.classList.remove('show');
  const ssl=document.getElementById('ssl'); if(ssl) ssl.classList.remove('on');
  const wait=document.getElementById('p1-wait');
  // Lesson changes should only show standby on the actual projector output.
  // Keep /admin, /mobile, and the audience hub on their current interface.
  if(wait){
    if(isProjector) wait.classList.remove('hidden');
    else wait.classList.add('hidden');
  }
  const p1s=document.getElementById('p1-status'); if(p1s){p1s.textContent='Standby';p1s.classList.remove('live');}
  const pws=document.querySelector('.pw-sb'); if(pws && window.LESSON_DATA){pws.textContent=`${window.LESSON_DATA.label} · ${window.LESSON_DATA.title} · Main Projector`;}
  const spws=document.querySelector('.sp-ws'); if(spws && window.LESSON_DATA){spws.textContent=`${window.LESSON_DATA.label} · ${window.LESSON_DATA.text} · RVR 1960 / KJV`;}
  if(typeof clearP2Display==='function' && isScriptureDisplay) clearP2Display();
  try{buildSlides(document.getElementById('ss-slides'),LESSON1_SLIDES);renderDots(LESSON1_SLIDES.length);}catch(e){}
  try{buildCtrlSurface();buildVerseBank();buildMobileVerseList();renderPollBank&&renderPollBank();}catch(e){}
  try{updateCtrlSurface(0);updateMobileMode(0);updateConfidence&&updateConfidence(0);}catch(e){}
  try{document.querySelectorAll('.lesson-pill').forEach(btn=>btn.classList.toggle('on',btn.dataset.lesson===window.LESSON_SLUG));}catch(e){}
  try{updateLandingLessonState(window.LESSON_SLUG);}catch(e){}
}
function rebuildLessonSurfaces(targetSlide=0){
  try{buildSlides(document.getElementById('ss-slides'),LESSON1_SLIDES);renderDots(LESSON1_SLIDES.length);}catch(e){}
  try{buildCtrlSurface();buildVerseBank();buildMobileVerseList();renderPollBank&&renderPollBank();}catch(e){}
  try{updateCtrlSurface(targetSlide);updateMobileMode(targetSlide);updateConfidence&&updateConfidence(targetSlide);}catch(e){}
  try{document.querySelectorAll('.lesson-pill').forEach(btn=>btn.classList.toggle('on',btn.dataset.lesson===window.LESSON_SLUG));}catch(e){}
  try{updateLandingLessonState(window.LESSON_SLUG);}catch(e){}
}
function applyIncomingLesson(slug,targetSlide=0){
  const next=normalizeLessonSlug(slug);
  if(next && next!==window.LESSON_SLUG){
    applySelectedLesson(next);
    curSlide=Math.max(0,Math.min(targetSlide||0,LESSON1_SLIDES.length-1));
    rebuildLessonSurfaces(curSlide);
  }
}
function selectLesson(slug,broadcast=true){
  const lesson=applySelectedLesson(slug);
  resetForLessonChange();
  if(broadcast && typeof sbSend==='function') sbSend({type:'lesson_select',lesson:lesson.slug,slide:0,started:false,ts:Date.now()});
  return lesson;
}
function adminSelectLesson(slug){
  selectLesson(slug,true);
  const msg=document.getElementById('cmd-stitle'); if(msg) msg.textContent=`${window.LESSON_DATA.label}: ${window.LESSON_DATA.title}`;
}

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
  sbSend({type:'scripture',scripture:sc,lesson:(window.LESSON_SLUG||'lesson-1')});flashP2('Pushed');
}
function flashP2(msg){
  const l=document.getElementById('cmd-p2lbl');
  if(l){const p=l.textContent;l.textContent=msg;setTimeout(()=>{l.textContent='Connected';},2000);}
}

// ── HANDLE INCOMING MESSAGE ──────────────────────────────
// Shared by BroadcastChannel (same device) and Supabase Realtime (cross-device, cross-network)
function handleMessage(msg){
  if(!msg||!msg.type) return;
  if(msg.lesson && msg.lesson!==window.LESSON_SLUG && msg.type!=='lesson_select'){
    applyIncomingLesson(msg.lesson, Number.isFinite(+msg.slide)?+msg.slide:curSlide);
  }
  if(msg.type==='lesson_select'){
    selectLesson(msg.lesson||'lesson-1',false);
    return;
  }
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
    if(!bc) bc=new BroadcastChannel(CHANNEL_ID);
    bc.onmessage=(e)=>handleMessage(e.data);
  }catch(e){}
  // Realtime is loaded asynchronously so static Vercel HTML does not need hardcoded keys.
  loadSupabasePublicConfig().then(()=>{
    if(window.SB_URL && window.SB_KEY) initRealtimeSync();
    else markRealtimeStatus('Local only',false);
  });
}

// ── SUPABASE REALTIME (WebSocket — works across any network) ──
function initRealtimeSync(){
  if(sbRealtimeStarted || !window.SB_URL || !window.SB_KEY) return;
  sbRealtimeStarted = true;
  const start=()=>{
    try{
      sbClient = window.supabase.createClient(window.SB_URL, window.SB_KEY);
      sbChannel = sbClient.channel('ministry-sync')
        .on('postgres_changes',{event:'*',schema:'public',table:'sync_state'},payload=>{
          try{
            const row=payload.new||{};
            const msg=typeof row.payload==='string'?JSON.parse(row.payload):row.payload;
            if(!msg || !msg.type) return;
            sbLastRemoteAt = Date.now();
            if(!isAdmin) handleMessage(msg);
          }catch(e){console.warn('Realtime payload parse failed',e);}
        })
        .subscribe((status)=>{
          if(status==='SUBSCRIBED') markRealtimeStatus('Live ✓',true);
          if(status==='CHANNEL_ERROR' || status==='TIMED_OUT') markRealtimeStatus('Realtime error',false);
        });
    }catch(e){
      sbRealtimeStarted=false;
      markRealtimeStatus('Realtime error',false);
      console.warn('Realtime init failed',e);
    }
  };
  if(window.supabase) start();
  else{
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.onload=start;
    script.onerror=()=>{sbRealtimeStarted=false;markRealtimeStatus('Realtime lib failed',false);};
    document.head.appendChild(script);
  }
}

// ── SEND: BroadcastChannel (instant, local) + Supabase (network) ──
async function sbSend(msg){
  // Always fire local BroadcastChannel first. This keeps same-machine ProPresenter/Chrome outputs snappy.
  try{if(!bc)bc=new BroadcastChannel(CHANNEL_ID);bc.postMessage(msg);}catch(e){}

  // Network sync is fire-and-forget. Never let Supabase latency block the controller tap.
  (async()=>{
    await loadSupabasePublicConfig();
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
    }catch(e){console.warn('Supabase sync write failed',e);}
  })();
}
function broadcastSlide(i){
  sbSend({type:'slide',slide:i,lesson:(window.LESSON_SLUG||'lesson-1')});
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
    sbSend({type:'slide',slide:0,start:true,lesson:(window.LESSON_SLUG||'lesson-1')});
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
  try{fetch('/api/question-submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:q.id,name:q.name,text:q.text,series_slug:'the-ministry',lesson_slug:(window.LESSON_SLUG||'lesson-1'),anonymous:true})}).catch(()=>{});}catch(e){}
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
    if(card){card.classList.remove('slide-current','poll-current');card.classList.add('scripture-active');}
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
    if(card){card.classList.remove('scripture-active','poll-current');card.classList.add('slide-current');}
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

;

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
      savedAnonymous:false,
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
      const b=document.createElement('button'); b.id='slave-exit'; b.className='slave-exit'; b.textContent='Exit Live ×'; b.setAttribute('aria-label','Exit live session'); b.onclick=window.exitSlaveMode; document.body.appendChild(b);
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

;

(function(){
  const originalHandleStageClick = window.handleStageClick;
  window.handleStageClick = function(e){
    // Audience slave mode is view-only. User can only interact with active polls.
    if(document.body.classList.contains('audience-slave')){
      if(e && e.target && e.target.closest && e.target.closest('.poll-screen')) return;
      if(e){ e.preventDefault(); e.stopPropagation(); }
      return false;
    }
    return originalHandleStageClick ? originalHandleStageClick(e) : undefined;
  };

  // Stop keyboard and pointer navigation from audience/slave screens.
  document.addEventListener('keydown',function(e){
    if(!document.body.classList.contains('audience-slave')) return;
    const t=e.target;
    const inPoll=t && t.closest && t.closest('.poll-screen');
    const editable=t && t.matches && t.matches('input,textarea,select,[contenteditable="true"]');
    if(inPoll || editable) return;
    if([' ','Spacebar','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','Home','End','Enter'].includes(e.key)){
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },true);

  document.addEventListener('click',function(e){
    if(!document.body.classList.contains('audience-slave')) return;
    if(e.target.closest('.poll-screen,.slave-exit')) return;
    // Block slide click zones, dots, arrows, and any leftover controls in the live audience view.
    if(e.target.closest('#ssl')){
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },true);

  function loadQuestions(){
    let local=[];
    try{ local=JSON.parse(localStorage.getItem('tm_questions')||'[]')||[]; }catch(e){ local=[]; }
    const mem=Array.isArray(window.questions)?window.questions:[];
    return [...mem,...local]
      .filter(Boolean)
      .filter((q,i,a)=>a.findIndex(x=>(x.id||x.ts||x.text)===(q.id||q.ts||q.text))===i)
      .sort((a,b)=>String(b.ts||'').localeCompare(String(a.ts||'')));
  }

  function ensureAdminQuestionsPanel(){
    if(!document.getElementById('admin-hub')) return null;
    let panel=document.getElementById('admin-questions-panel');
    if(panel) return panel;
    const rightScroll=document.querySelector('#admin-hub .ctrl-right [style*="overflow-y"]') || document.querySelector('#admin-hub .ctrl-right');
    if(!rightScroll) return null;
    panel=document.createElement('div');
    panel.id='admin-questions-panel';
    panel.className='admin-questions-panel';
    panel.innerHTML=`
      <div class="admin-questions-head">
        <div class="admin-questions-title">Live Questions</div>
        <div class="admin-questions-count" id="admin-questions-count">0</div>
      </div>
      <div id="admin-questions-list"><div class="admin-question-empty">No questions yet.</div></div>`;
    rightScroll.appendChild(panel);
    return panel;
  }

  window.renderQuestionsMini=function(){
    const panel=ensureAdminQuestionsPanel();
    if(!panel) return;
    const all=loadQuestions();
    const count=document.getElementById('admin-questions-count');
    const list=document.getElementById('admin-questions-list');
    if(count) count.textContent=String(all.length);
    if(!list) return;
    if(!all.length){
      list.innerHTML='<div class="admin-question-empty">No questions yet.</div>';
      return;
    }
    list.innerHTML=all.slice(0,12).map(q=>{
      const name=(q.name||'Anonymous').toString().replace(/[<>&]/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[m]));
      const text=(q.text||'').toString().replace(/[<>&]/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[m]));
      return `<div class="admin-question-item"><div class="admin-question-meta">${name}</div><div class="admin-question-text">${text}</div></div>`;
    }).join('');
  };

  const oldHandleMessage=window.handleMessage;
  window.handleMessage=function(msg){
    const r=oldHandleMessage?oldHandleMessage(msg):undefined;
    if(msg && msg.type==='question_submit') setTimeout(window.renderQuestionsMini,0);
    return r;
  };

  const oldOpenAdmin=window.openAdmin;
  if(oldOpenAdmin){
    window.openAdmin=function(){ const r=oldOpenAdmin.apply(this,arguments); setTimeout(window.renderQuestionsMini,0); return r; };
  }
  const oldShowAdmin=window.showAdmin;
  if(oldShowAdmin){
    window.showAdmin=function(){ const r=oldShowAdmin.apply(this,arguments); setTimeout(window.renderQuestionsMini,0); return r; };
  }

  document.addEventListener('DOMContentLoaded',()=>setTimeout(window.renderQuestionsMini,300));
  setTimeout(window.renderQuestionsMini,900);
})();

;

(function(){
  const SERIES_SLUG='the-ministry';
  const LESSON_SLUG=(window.LESSON_DATA&&window.LESSON_DATA.slug)||'lesson-1';
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getQs=()=>{ try{return questions;}catch(e){window.questions=window.questions||[];return window.questions;} };
  const setQs=(items)=>{ const q=getQs(); q.length=0; items.forEach(x=>q.push(x)); };
  const sortByDate=(a,b)=>String(b.ts||b.created_at||'').localeCompare(String(a.ts||a.created_at||''));

  async function getJSON(url,opts){
    const r=await fetch(url,opts);
    if(!r.ok) throw new Error(await r.text().catch(()=>r.statusText));
    return r.json();
  }
  function normalizeQuestion(row){
    return {
      id:row.question_id||row.id||('q_'+Date.now()),
      dbId:row.id||'',
      name:row.anonymous?'Anonymous':(row.name||'Anonymous'),
      text:row.text||row.question||'',
      status:row.status||'new',
      anonymous:row.anonymous!==false,
      ts:row.created_at||row.ts||new Date().toISOString()
    };
  }
  function loadLocalQuestions(){
    try{return JSON.parse(localStorage.getItem('tm_questions')||'[]')||[];}catch(e){return[];}
  }
  function mergeQuestionRows(rows){
    const local=loadLocalQuestions().map(normalizeQuestion);
    const mem=getQs().map(normalizeQuestion);
    const incoming=(rows||[]).map(normalizeQuestion);
    const all=[...incoming,...mem,...local]
      .filter(q=>q.text)
      .filter((q,i,a)=>a.findIndex(x=>(x.dbId||x.id||x.text)===(q.dbId||q.id||q.text))===i)
      .sort(sortByDate);
    setQs(all);
    try{localStorage.setItem('tm_questions',JSON.stringify(all.slice(0,80)));}catch(e){}
    return all;
  }
  window.fetchLiveQuestions=async function(){
    try{
      const data=await getJSON(`/api/questions-list?series_slug=${SERIES_SLUG}&lesson_slug=${LESSON_SLUG}`);
      return mergeQuestionRows(data.questions||[]);
    }catch(e){
      console.warn('Question fetch failed',e);
      return mergeQuestionRows([]);
    }
  };
  window.updateLiveQuestionStatus=async function(id,status='answered'){
    try{await getJSON('/api/question-update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})});}catch(e){console.warn('Question update failed',e);}
    const all=getQs();
    all.forEach(q=>{if(q.id===id||q.dbId===id) q.status=status;});
    window.renderQuestionsMini&&window.renderQuestionsMini();
    renderQuestionsDashboard(false);
  };

  function questionItemHTML(q,compact=false){
    const status=q.status||'new';
    return `<div class="${compact?'admin-question-item':'data-item'}">
      <div class="${compact?'admin-question-meta':'data-meta'}"><span>${esc(q.name||'Anonymous')}</span><span>${esc(status)}</span><span>${esc(new Date(q.ts||Date.now()).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}))}</span></div>
      <div class="${compact?'admin-question-text':'data-text'}">${esc(q.text)}</div>
      <div class="${compact?'admin-question-actions':'data-row-actions'}">
        <button class="data-mini-btn" onclick="updateLiveQuestionStatus('${esc(q.dbId||q.id)}','answered')">Answered</button>
        <button class="data-mini-btn" onclick="updateLiveQuestionStatus('${esc(q.dbId||q.id)}','hidden')">Hide</button>
        <button class="data-mini-btn" onclick="updateLiveQuestionStatus('${esc(q.dbId||q.id)}','new')">New</button>
      </div>
    </div>`;
  }

  function ensureAdminQuestionsPanel(){
    if(!document.getElementById('admin-hub')) return null;
    let panel=document.getElementById('admin-questions-panel');
    if(panel) return panel;
    const rightScroll=document.querySelector('#admin-hub .ctrl-right [style*="overflow-y"]') || document.querySelector('#admin-hub .ctrl-right');
    if(!rightScroll) return null;
    panel=document.createElement('div');
    panel.id='admin-questions-panel';
    panel.className='admin-questions-panel';
    panel.innerHTML=`<div class="admin-questions-head"><div class="admin-questions-title">Live Questions</div><div class="admin-questions-count" id="admin-questions-count">0</div></div><div id="admin-questions-list"><div class="admin-question-empty">Loading questions...</div></div><div style="padding:0 12px 12px"><a class="data-mini-btn" href="/questions" target="_blank">Open Questions Page</a></div>`;
    rightScroll.appendChild(panel);
    return panel;
  }

  const previousRenderQuestionsMini=window.renderQuestionsMini;
  window.renderQuestionsMini=function(){
    const panel=ensureAdminQuestionsPanel();
    if(!panel){ if(previousRenderQuestionsMini) previousRenderQuestionsMini(); return; }
    const all=getQs().filter(q=>q.status!=='hidden').sort(sortByDate);
    const count=document.getElementById('admin-questions-count');
    const list=document.getElementById('admin-questions-list');
    if(count) count.textContent=String(all.length);
    if(list) list.innerHTML=all.length?all.slice(0,12).map(q=>questionItemHTML(q,true)).join(''):'<div class="admin-question-empty">No questions yet.</div>';
  };

  window.refreshQuestionsNow=async function(){
    await window.fetchLiveQuestions();
    window.renderQuestionsMini&&window.renderQuestionsMini();
    renderQuestionsDashboard(false);
  };

  function normalizePoll(row){
    return {
      id:row.poll_id||row.id,
      question:row.question||'Poll',
      type:row.poll_type||row.type||'choice',
      options:Array.isArray(row.options)?row.options:[],
      status:row.status||'archived',
      updatedAt:row.updated_at||row.created_at||row.updatedAt||new Date().toISOString()
    };
  }
  function groupVotes(votes){
    const map={};
    (votes||[]).forEach(v=>{const id=v.poll_id||v.pollId;if(!id)return;(map[id]=map[id]||[]).push(v);});
    return map;
  }
  function pollRowsHTML(poll,votes){
    const opts=poll.options||[];
    const total=(votes||[]).length;
    const tally={}; opts.forEach(o=>tally[String(o).trim()]=0);
    (votes||[]).forEach(v=>{const k=String(v.answer||'').trim();tally[k]=(tally[k]||0)+1;});
    return `<div class="data-poll-rows">${opts.map(o=>{const k=String(o).trim(),n=tally[k]||0,pct=total?Math.round(n/total*100):0;return `<div class="data-poll-row"><div>${esc(k)}</div><div class="data-poll-bar"><div class="data-poll-fill" style="width:${pct}%"></div></div><div>${pct}% (${n})</div></div>`;}).join('')}</div><div class="data-count" style="margin-top:8px">${total} answer${total===1?'':'s'}</div>`;
  }
  async function fetchPollArchive(){
    try{ return await getJSON(`/api/polls-list?series_slug=${SERIES_SLUG}&lesson_slug=${LESSON_SLUG}`); }
    catch(e){ console.warn('Poll fetch failed',e); return {polls:[],votes:[]}; }
  }
  window.savePollToServer=async function(poll,status='live'){
    if(!poll||!poll.id) return;
    try{ await getJSON('/api/poll-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({poll,status,series_slug:SERIES_SLUG,lesson_slug:LESSON_SLUG})}); }
    catch(e){ console.warn('Poll save failed',e); }
  };
  window.savePollVoteToServer=async function(vote){
    if(!vote||!vote.pollId) return;
    const poll=window.pollState&&window.pollState.active;
    if(poll && poll.id===vote.pollId) await window.savePollToServer(poll,'live');
    try{ await getJSON('/api/poll-vote-submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vote,series_slug:SERIES_SLUG,lesson_slug:LESSON_SLUG})}); }
    catch(e){ console.warn('Poll vote save failed',e); }
  };

  const previousLaunchPoll=window.launchPoll;
  window.launchPoll=function(p,broadcast=true){
    const existing=window.pollState&&window.pollState.active;
    if(existing) window.savePollToServer(existing,'replaced');
    const r=previousLaunchPoll?previousLaunchPoll(p,broadcast):undefined;
    const active=window.pollState&&window.pollState.active;
    if(active) window.savePollToServer(active,'live');
    setTimeout(renderAnsweredPollsPanel,500);
    return r;
  };
  const previousCloseActivePoll=window.closeActivePoll;
  window.closeActivePoll=function(broadcast=true){
    const active=window.pollState&&window.pollState.active;
    if(active) window.savePollToServer(active,'closed');
    const r=previousCloseActivePoll?previousCloseActivePoll(broadcast):undefined;
    setTimeout(renderAnsweredPollsPanel,500);
    return r;
  };
  const previousAddPollVote=window.addPollVote;
  window.addPollVote=function(vote){
    const r=previousAddPollVote?previousAddPollVote(vote):undefined;
    window.savePollVoteToServer(vote);
    setTimeout(renderAnsweredPollsPanel,700);
    return r;
  };

  async function renderAnsweredPollsPanel(){
    if(!document.getElementById('admin-hub')) return;
    const rightScroll=document.querySelector('#admin-hub .ctrl-right [style*="overflow-y"]') || document.querySelector('#admin-hub .ctrl-right');
    if(!rightScroll) return;
    let panel=document.getElementById('admin-answered-polls');
    if(!panel){
      panel=document.createElement('div');
      panel.id='admin-answered-polls';
      panel.className='admin-answered-polls';
      panel.innerHTML=`<div class="data-card-head"><div class="data-card-title">Answered Polls</div><a class="data-mini-btn" href="/polls" target="_blank">Open Poll Page</a></div><div class="admin-answered-polls-list" id="admin-answered-polls-list"><div class="data-empty">No saved polls yet.</div></div>`;
      rightScroll.appendChild(panel);
    }
    const list=document.getElementById('admin-answered-polls-list');
    if(!list) return;
    const data=await fetchPollArchive();
    const votes=groupVotes(data.votes||[]);
    const polls=(data.polls||[]).map(normalizePoll).filter(p=>p.status!=='live').slice(0,5);
    list.innerHTML=polls.length?polls.map(p=>`<div class="data-item"><div class="data-meta"><span>${esc(p.status)}</span><span>${esc(new Date(p.updatedAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}))}</span></div><div class="data-text">${esc(p.question)}</div>${pollRowsHTML(p,votes[p.id]||[])}</div>`).join(''):'<div class="data-empty">No saved polls yet.</div>';
  }

  async function renderQuestionsDashboard(fetchFirst=true){
    if(location.pathname!=='/questions') return;
    if(fetchFirst) await window.fetchLiveQuestions();
    const all=getQs().sort(sortByDate);
    document.body.className='admin-data-page';
    document.body.innerHTML=`<div class="data-shell"><div class="data-top"><div><div class="data-kicker">The Ministry Admin</div><div class="data-title">Live Questions</div><div class="data-sub">Questions submitted by users</div></div><div class="data-actions"><button class="data-btn red" onclick="refreshQuestionsNow()">Refresh</button><a class="data-btn" href="/admin">Admin</a><a class="data-btn" href="/polls">Polls</a></div></div><div class="data-grid"><div class="data-card"><div class="data-card-head"><div class="data-card-title">New Questions</div><div class="data-count">${all.filter(q=>q.status==='new').length}</div></div>${all.filter(q=>q.status==='new').map(q=>questionItemHTML(q,false)).join('')||'<div class="data-empty">No new questions.</div>'}</div><div class="data-card"><div class="data-card-head"><div class="data-card-title">Answered / Hidden</div><div class="data-count">${all.filter(q=>q.status!=='new').length}</div></div>${all.filter(q=>q.status!=='new').map(q=>questionItemHTML(q,false)).join('')||'<div class="data-empty">No answered questions yet.</div>'}</div></div></div>`;
  }
  async function renderPollsDashboard(){
    if(location.pathname!=='/polls') return;
    const data=await fetchPollArchive();
    const votes=groupVotes(data.votes||[]);
    const polls=(data.polls||[]).map(normalizePoll);
    const live=polls.filter(p=>p.status==='live');
    const answered=polls.filter(p=>p.status!=='live');
    document.body.className='admin-data-page';
    const pollItem=p=>`<div class="data-item"><div class="data-meta"><span>${esc(p.status)}</span><span>${esc(new Date(p.updatedAt).toLocaleString())}</span></div><div class="data-text">${esc(p.question)}</div>${pollRowsHTML(p,votes[p.id]||[])}</div>`;
    document.body.innerHTML=`<div class="data-shell"><div class="data-top"><div><div class="data-kicker">The Ministry Admin</div><div class="data-title">Polls</div><div class="data-sub">Live and answered poll archive</div></div><div class="data-actions"><button class="data-btn red" onclick="location.reload()">Refresh</button><a class="data-btn" href="/admin">Admin</a><a class="data-btn" href="/questions">Questions</a></div></div><div class="data-grid"><div class="data-card"><div class="data-card-head"><div class="data-card-title">Live Polls</div><div class="data-count">${live.length}</div></div>${live.map(pollItem).join('')||'<div class="data-empty">No live polls.</div>'}</div><div class="data-card"><div class="data-card-head"><div class="data-card-title">Answered Polls</div><div class="data-count">${answered.length}</div></div>${answered.map(pollItem).join('')||'<div class="data-empty">No answered polls yet.</div>'}</div></div></div>`;
  }

  const oldOpenAdmin=window.openAdmin;
  if(oldOpenAdmin){window.openAdmin=function(){const r=oldOpenAdmin.apply(this,arguments);setTimeout(()=>{window.refreshQuestionsNow();renderAnsweredPollsPanel();},250);return r;};}
  const oldShowAdmin=window.showAdmin;
  if(oldShowAdmin){window.showAdmin=function(){const r=oldShowAdmin.apply(this,arguments);setTimeout(()=>{window.refreshQuestionsNow();renderAnsweredPollsPanel();},250);return r;};}
  const oldHandle=window.handleMessage;
  window.handleMessage=function(msg){
    const r=oldHandle?oldHandle(msg):undefined;
    if(msg&&msg.type==='question_submit'){mergeQuestionRows([msg.question]);window.renderQuestionsMini();renderQuestionsDashboard(false);}
    if(msg&&(msg.type==='poll_open'||msg.type==='poll_close'||msg.type==='poll_vote')) setTimeout(renderAnsweredPollsPanel,500);
    return r;
  };

  document.addEventListener('DOMContentLoaded',()=>{
    renderQuestionsDashboard(true);
    renderPollsDashboard();
    if(location.pathname!=='/questions'&&location.pathname!=='/polls'){
      setTimeout(()=>{window.refreshQuestionsNow();renderAnsweredPollsPanel();},600);
      setInterval(()=>{ if(document.getElementById('admin-hub')&&document.getElementById('admin-hub').classList.contains('on')){window.refreshQuestionsNow();renderAnsweredPollsPanel();} },5000);
    }
  });
  setTimeout(()=>{ if(location.pathname!=='/questions'&&location.pathname!=='/polls'){window.refreshQuestionsNow();renderAnsweredPollsPanel();} },1200);
})();

;

(function(){
  const SERIES_SLUG_V31='the-ministry';
  const LESSON_SLUG_V31=(window.LESSON_DATA&&window.LESSON_DATA.slug)||'lesson-1';
  const escV31=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getJsonV31=async(url,opts)=>{const r=await fetch(url,opts); if(!r.ok) throw new Error(await r.text().catch(()=>r.statusText)); return await r.json();};

  function normalizeQuestionV31(row){
    return {
      id:row.question_id||row.id||('q_'+Date.now()),
      dbId:row.id||row.dbId||row.question_id,
      name:row.name||'Anonymous',
      text:row.text||row.question||'',
      status:row.status||'new',
      ts:row.created_at||row.updated_at||row.ts||new Date().toISOString()
    };
  }
  function getQuestionStoreV31(){
    try{return Array.isArray(window.questions)?window.questions:(window.questions=[]);}catch(e){window.questions=[];return window.questions;}
  }
  function mergeQuestionsV31(rows){
    const store=getQuestionStoreV31();
    const map=new Map(store.map(q=>[String(q.dbId||q.id),q]));
    (rows||[]).map(normalizeQuestionV31).forEach(q=>map.set(String(q.dbId||q.id),q));
    const all=Array.from(map.values()).sort((a,b)=>new Date(b.ts||0)-new Date(a.ts||0));
    window.questions=all;
    try{localStorage.setItem('tm_questions',JSON.stringify(all.slice(0,120)));}catch(e){}
    return all;
  }
  async function fetchQuestionsV31(){
    try{
      const data=await getJsonV31(`/api/questions-list?series_slug=${SERIES_SLUG_V31}&lesson_slug=${LESSON_SLUG_V31}`);
      return mergeQuestionsV31(data.questions||[]);
    }catch(e){
      console.warn('v31 question fetch failed',e);
      try{return mergeQuestionsV31(JSON.parse(localStorage.getItem('tm_questions')||'[]'));}catch(_){return getQuestionStoreV31();}
    }
  }
  async function updateQuestionV31(id,status){
    try{await getJsonV31('/api/question-update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})});}catch(e){console.warn('v31 question update failed',e);}
    getQuestionStoreV31().forEach(q=>{if(String(q.dbId||q.id)===String(id)) q.status=status;});
    renderQuestionsTabV31(false);
    if(window.renderQuestionsMini) window.renderQuestionsMini();
  }
  window.updateQuestionV31=updateQuestionV31;

  function questionCardV31(q){
    const status=String(q.status||'new');
    return `<div class="admin-q-card">
      <div class="admin-q-meta"><span>${escV31(q.name||'Anonymous')}</span><span class="${status==='new'?'is-new':''}">${escV31(status)}</span><span>${escV31(new Date(q.ts||Date.now()).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}))}</span></div>
      <div class="admin-q-text">${escV31(q.text)}</div>
      <div class="admin-q-actions">
        <button onclick="updateQuestionV31('${escV31(q.dbId||q.id)}','answered')">Answered</button>
        <button onclick="updateQuestionV31('${escV31(q.dbId||q.id)}','hidden')">Hide</button>
        <button onclick="updateQuestionV31('${escV31(q.dbId||q.id)}','new')">New</button>
      </div>
    </div>`;
  }
  async function renderQuestionsTabV31(fetchFirst=true){
    const list=document.getElementById('admin-questions-tab-list');
    const count=document.getElementById('admin-questions-tab-count');
    if(!list) return;
    if(fetchFirst) list.innerHTML='<div class="admin-empty">Loading questions...</div>';
    const all=fetchFirst?await fetchQuestionsV31():getQuestionStoreV31();
    const sorted=[...all].sort((a,b)=>new Date(b.ts||0)-new Date(a.ts||0));
    const newCount=sorted.filter(q=>(q.status||'new')==='new').length;
    if(count) count.textContent=`${newCount} new / ${sorted.length} total`;
    list.innerHTML=sorted.length?sorted.map(questionCardV31).join(''):'<div class="admin-empty">No questions yet.</div>';
  }
  window.renderQuestionsTabV31=renderQuestionsTabV31;

  function normalizePollV31(row){
    let opts=row.options||[];
    if(typeof opts==='string'){try{opts=JSON.parse(opts)}catch(e){opts=opts.split(',').map(x=>x.trim()).filter(Boolean)}}
    return {id:row.poll_id||row.id, question:row.question||'Poll', options:Array.isArray(opts)?opts:[], status:row.status||'closed', updatedAt:row.updated_at||row.created_at||new Date().toISOString()};
  }
  function groupVotesV31(votes){
    const out={};
    (votes||[]).forEach(v=>{const id=v.poll_id||v.pollId;if(id)(out[id]=out[id]||[]).push(v);});
    return out;
  }
  function pollRowsV31(p,votes){
    const total=(votes||[]).length;
    const tally={};(p.options||[]).forEach(o=>tally[String(o).trim()]=0);
    (votes||[]).forEach(v=>{const k=String(v.answer||'').trim();tally[k]=(tally[k]||0)+1;});
    return `<div class="admin-poll-rows">${(p.options||[]).map(o=>{const k=String(o).trim(),n=tally[k]||0,pct=total?Math.round(n/total*100):0;return `<div class="admin-poll-row"><div>${escV31(k)}</div><div class="admin-poll-bar"><div class="admin-poll-fill" style="width:${pct}%"></div></div><div>${pct}% (${n})</div></div>`}).join('')}</div><div class="admin-q-meta" style="margin-top:8px"><span>${total} answer${total===1?'':'s'}</span></div>`;
  }
  async function renderPollArchiveInTabV31(){
    const box=document.getElementById('admin-polls-tab-archive');
    const count=document.getElementById('admin-polls-tab-count');
    if(!box) return;
    box.innerHTML='<div class="admin-empty">Loading answered polls...</div>';
    try{
      const data=await getJsonV31(`/api/polls-list?series_slug=${SERIES_SLUG_V31}&lesson_slug=${LESSON_SLUG_V31}`);
      const votes=groupVotesV31(data.votes||[]);
      const polls=(data.polls||[]).map(normalizePollV31).filter(p=>p.status!=='live');
      if(count) count.textContent=`${polls.length} saved`;
      box.innerHTML=polls.length?polls.map(p=>`<div class="admin-poll-card"><div class="admin-poll-meta"><span>${escV31(p.status)}</span><span>${escV31(new Date(p.updatedAt).toLocaleString())}</span></div><div class="admin-poll-text">${escV31(p.question)}</div>${pollRowsV31(p,votes[p.id]||[])}</div>`).join(''):'<div class="admin-empty">No answered polls yet. Launch and kill/replace a poll to archive it here.</div>';
    }catch(e){
      box.innerHTML='<div class="admin-empty">Could not load poll archive. Check Supabase env vars and API logs.</div>';
      console.warn('v31 poll archive failed',e);
    }
  }
  window.renderPollArchiveInTabV31=renderPollArchiveInTabV31;

  function installAdminTabsV31(){
    const tabs=document.querySelector('#admin-hub .ctrl-tabs');
    const polls=document.getElementById('tab-polls');
    if(!tabs||!polls||document.getElementById('tab-questions')) return;
    const qBtn=document.createElement('button');
    qBtn.className='ctrl-tab'; qBtn.textContent='Questions'; qBtn.onclick=function(){switchTab('questions',this); renderQuestionsTabV31(true);};
    tabs.appendChild(qBtn);
    const panel=document.createElement('div');
    panel.className='ctrl-panel'; panel.id='tab-questions';
    panel.innerHTML=`<div class="admin-q-toolbar"><b>Live Questions</b><span id="admin-questions-tab-count">0 new / 0 total</span><button class="admin-inline-btn" onclick="renderQuestionsTabV31(true)">Refresh</button></div><div class="admin-q-list" id="admin-questions-tab-list"><div class="admin-empty">No questions yet.</div></div>`;
    polls.parentNode.insertBefore(panel,polls.nextSibling);
    if(!document.getElementById('admin-polls-tab-archive')){
      const archive=document.createElement('div');
      archive.innerHTML=`<div class="admin-poll-archive-toolbar"><b>Answered Polls</b><span id="admin-polls-tab-count">0 saved</span><button class="admin-inline-btn" onclick="renderPollArchiveInTabV31()">Refresh</button></div><div class="admin-poll-archive-list" id="admin-polls-tab-archive"><div class="admin-empty">No answered polls yet.</div></div>`;
      polls.appendChild(archive);
    }
  }
  const oldSwitchTabV31=window.switchTab;
  window.switchTab=function(name,btn){
    const r=oldSwitchTabV31?oldSwitchTabV31(name,btn):undefined;
    if(name==='questions') setTimeout(()=>renderQuestionsTabV31(true),0);
    if(name==='polls') setTimeout(()=>renderPollArchiveInTabV31(),0);
    return r;
  };
  const oldBuildCtrlSurfaceV31=window.buildCtrlSurface;
  if(oldBuildCtrlSurfaceV31){window.buildCtrlSurface=function(){const r=oldBuildCtrlSurfaceV31.apply(this,arguments);setTimeout(()=>{installAdminTabsV31(); renderPollArchiveInTabV31(); renderQuestionsTabV31(false);},0);return r;};}
  const oldShowAdminHubV31=window.showAdminHub;
  if(oldShowAdminHubV31){window.showAdminHub=function(){const r=oldShowAdminHubV31.apply(this,arguments);setTimeout(()=>{installAdminTabsV31(); renderQuestionsTabV31(true); renderPollArchiveInTabV31();},200);return r;};}

  async function registerAttendeeV31(name){
    const clean=(name||localStorage.getItem('tm_name')||'Anonymous').trim()||'Anonymous';
    const key='tm_attendee_saved_'+clean.toLowerCase().replace(/\W+/g,'_');
    if(localStorage.getItem(key)) return;
    try{
      await getJsonV31('/api/waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:clean,source:'session_access',series_slug:SERIES_SLUG_V31,lesson_slug:LESSON_SLUG_V31})});
      localStorage.setItem(key,new Date().toISOString());
    }catch(e){console.warn('v31 attendee save failed',e);}
  }
  const oldCheckPwV31=window.checkPw;
  window.checkPw=function(){
    const pw=(document.getElementById('mo-pw')||{}).value;
    const name=((document.getElementById('mo-name')||{}).value||'').trim();
    if(pw===window.PW_ATTENDEE || pw==='ministry2026') setTimeout(()=>registerAttendeeV31(name),0);
    return oldCheckPwV31?oldCheckPwV31.apply(this,arguments):undefined;
  };

  const oldHandleV31=window.handleMessage;
  window.handleMessage=function(msg){
    const r=oldHandleV31?oldHandleV31(msg):undefined;
    if(msg&&msg.type==='question_submit') setTimeout(()=>{mergeQuestionsV31([msg.question]); renderQuestionsTabV31(false);},0);
    if(msg&&(msg.type==='poll_open'||msg.type==='poll_close'||msg.type==='poll_vote')) setTimeout(renderPollArchiveInTabV31,400);
    return r;
  };
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{installAdminTabsV31(); fetchQuestionsV31().then(()=>renderQuestionsTabV31(false)); renderPollArchiveInTabV31();},800));
})();

;

/* =========================================================
   v33 Attendee Identity Patch
   - Requires name + email + access code for audience entry.
   - Stores attendee/session identity locally.
   - Sends attendee/session identity with questions and poll votes.
   - Does not change projector/admin sync behavior.
========================================================= */
(function(){
  const SERIES_SLUG='the-ministry';
  const LESSON_SLUG=(window.LESSON_DATA&&window.LESSON_DATA.slug)||'lesson-1';
  const SESSION_ID_KEY='tm_session_id';
  const ATTENDEE_ID_KEY='tm_attendee_id';
  const EMAIL_KEY='tm_email';
  const EMAIL_HASH_KEY='tm_email_hash';
  function $(id){return document.getElementById(id);}
  function clean(v){return String(v||'').trim();}
  function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(v).toLowerCase());}
  function sessionId(){
    let id=localStorage.getItem(SESSION_ID_KEY);
    if(!id){ id='sess_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10); localStorage.setItem(SESSION_ID_KEY,id); }
    return id;
  }
  function attendeeContext(){
    return {
      name: clean(localStorage.getItem('tm_name')||window.userName||'Anonymous') || 'Anonymous',
      email: clean(localStorage.getItem(EMAIL_KEY)||''),
      email_hash: clean(localStorage.getItem(EMAIL_HASH_KEY)||''),
      attendee_id: clean(localStorage.getItem(ATTENDEE_ID_KEY)||''),
      session_id: sessionId(),
      series_slug: SERIES_SLUG,
      lesson_slug: LESSON_SLUG
    };
  }
  window.getAttendeeContext=attendeeContext;

  async function saveAttendee(name,email){
    const payload={name,email,session_id:sessionId(),source:'session_access',series_slug:SERIES_SLUG,lesson_slug:LESSON_SLUG};
    const r=await fetch('/api/waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    let data={}; try{data=await r.json();}catch(e){}
    if(!r.ok) throw new Error(data.error||'Could not enter session');
    if(data.attendee){
      if(data.attendee.id) localStorage.setItem(ATTENDEE_ID_KEY,data.attendee.id);
      if(data.attendee.email_hash) localStorage.setItem(EMAIL_HASH_KEY,data.attendee.email_hash);
      if(data.attendee.session_id) localStorage.setItem(SESSION_ID_KEY,data.attendee.session_id);
    }
    localStorage.setItem('tm_attendee_saved_'+email.toLowerCase().replace(/\W+/g,'_'),new Date().toISOString());
    return data;
  }

  const oldShowModal=window.showModal;
  window.showModal=function(t){
    if(oldShowModal) oldShowModal(t);
    const isAdm=t==='admin';
    const email=$('mo-email');
    const name=$('mo-name');
    const sub=$('mo-sub');
    if(email){
      email.style.display=isAdm?'none':'block';
      if(!isAdm) email.value=localStorage.getItem(EMAIL_KEY)||'';
    }
    if(name && !isAdm) name.value=localStorage.getItem('tm_name')||name.value||'';
    if(sub) sub.textContent=isAdm?'Enter the admin code.':'Enter your name, email, and the access code.';
  };

  window.checkPw=async function(){
    const err=$('mo-err'); if(err) err.classList.remove('on');
    const pw=($('mo-pw')||{}).value||'';
    const name=clean(($('mo-name')||{}).value);
    const email=clean(($('mo-email')||{}).value).toLowerCase();
    if(pw===window.PW_ADMIN || pw==='ministryadmin'){
      localStorage.setItem('tm_a','1'); localStorage.setItem('tm_u','1');
      if(typeof activateAdmin==='function') activateAdmin();
      if(typeof closeModal==='function') closeModal();
      return;
    }
    if(pw===window.PW_ATTENDEE || pw==='ministry2026'){
      if(!name){ if(err){err.textContent='Enter your name.';err.classList.add('on');} return; }
      if(!validEmail(email)){ if(err){err.textContent='Enter a valid email.';err.classList.add('on');} return; }
      localStorage.setItem('tm_u','1');
      localStorage.setItem('tm_name',name);
      localStorage.setItem(EMAIL_KEY,email);
      if(typeof setUserName==='function') setUserName(name);
      const btn=document.querySelector('#modal .btn-red'); const oldText=btn&&btn.textContent;
      try{
        if(btn){btn.textContent='Entering...';btn.disabled=true;}
        await saveAttendee(name,email);
        if(typeof closeModal==='function') closeModal();
        if(typeof showHub==='function') showHub();
      }catch(e){
        console.warn('attendee save failed',e);
        if(err){err.textContent='Could not save your session. Check email and try again.';err.classList.add('on');}
      }finally{
        if(btn){btn.textContent=oldText||'Enter';btn.disabled=false;}
      }
      return;
    }
    if(err){err.textContent='Incorrect code. Try again.';err.classList.add('on');}
  };

  window.submitAskQuestion=function(){
    const ta=$('ask-ta'); if(!ta||!ta.value.trim()) return;
    const ctx=attendeeContext();
    const q={id:'q'+Date.now(), text:ta.value.trim(), name:ctx.name||'Anonymous', ts:new Date().toISOString(), session_id:ctx.session_id, attendee_id:ctx.attendee_id, email_hash:ctx.email_hash};
    try{const old=JSON.parse(localStorage.getItem('tm_questions')||'[]'); old.unshift(q); localStorage.setItem('tm_questions',JSON.stringify(old.slice(0,50)));}catch(e){}
    try{fetch('/api/question-submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:q.id,name:q.name,text:q.text,series_slug:SERIES_SLUG,lesson_slug:LESSON_SLUG,anonymous:true,email:ctx.email,email_hash:ctx.email_hash,session_id:ctx.session_id,attendee_id:ctx.attendee_id})}).catch(()=>{});}catch(e){}
    if(typeof sbSend==='function') sbSend({type:'question_submit',question:q});
    try{window.questions=window.questions||[]; window.questions.unshift(q); if(typeof renderQuestionsMini==='function') renderQuestionsMini();}catch(e){}
    ta.value=''; const ok=$('ask-ok'); if(ok){ok.classList.add('on');setTimeout(()=>ok.classList.remove('on'),1800);} if(typeof closeAskDrawer==='function') setTimeout(closeAskDrawer,500);
  };

  window.submitPollVote=function(){
    const poll=window.pollState&&window.pollState.active;
    const selected=window.pollState&&window.pollState.selected;
    if(!poll||!selected) return;
    const anon=$('poll-anon');
    const ctx=attendeeContext();
    const answer=String(selected||'').trim();
    const vote={
      id:'vote-'+Date.now()+'-'+Math.random().toString(16).slice(2,6),
      pollId:poll.id,
      answer,
      anonymous:!anon||anon.checked,
      name:(!anon||anon.checked)?'Anonymous':(ctx.name||'Anonymous'),
      attendee_id:ctx.attendee_id,
      session_id:ctx.session_id,
      email_hash:ctx.email_hash,
      email:ctx.email,
      ts:new Date().toISOString()
    };
    try{ if(typeof rememberPollVote==='function') rememberPollVote(vote); }catch(e){}
    if(typeof window.addPollVote==='function') window.addPollVote(vote);
    if(typeof sbSend==='function') sbSend({type:'poll_vote',vote,ts:Date.now()});
    const thanks=$('poll-thanks'); if(thanks)thanks.classList.add('on');
    const submit=$('poll-submit'); if(submit){submit.disabled=true;submit.textContent='Submitted';}
    setTimeout(()=>{const screen=$('poll-screen'); if(screen)screen.classList.remove('on'); if(submit)submit.textContent='Submit';},900);
  };

  document.addEventListener('DOMContentLoaded',()=>{
    const email=$('mo-email');
    if(email && localStorage.getItem(EMAIL_KEY)) email.value=localStorage.getItem(EMAIL_KEY);
  });
})();

;

// =========================================================
// v35 admin live data polish
// Keeps the stable v34 behavior. Only fixes admin display wiring.
// =========================================================
(function(){
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const SERIES=(window.SERIES_CONFIG&&window.SERIES_CONFIG.slug)||window.SERIES_SLUG||'the-ministry';
  const LESSON=(window.LESSON_DATA&&window.LESSON_DATA.slug)||window.LESSON_SLUG||'lesson-1';
  const getJSON=(url,opts)=>fetch(url,opts).then(async r=>{ if(!r.ok) throw new Error(await r.text()); return r.json(); });

  function displayName(row){
    const raw=row?.display_name||row?.name||row?.attendee_name||row?.user_name||'';
    const clean=String(raw||'').trim();
    if(!clean || clean.toLowerCase()==='anonymousnew' || clean.toLowerCase()==='anonymousanswered') return 'Anonymous';
    return clean;
  }
  function normalizeQuestion(row){
    return {
      id:String(row.dbId||row.id||row.question_id||('q-'+Math.random().toString(16).slice(2))),
      dbId:String(row.dbId||row.id||row.question_id||''),
      name:displayName(row),
      text:row.text||row.question||row.message||'',
      status:row.status || (row.is_hidden?'hidden':row.is_answered?'answered':'new'),
      ts:row.ts||row.created_at||row.updated_at||new Date().toISOString()
    };
  }
  function questionStore(){
    try{ return Array.isArray(window.questions)?window.questions:(window.questions=[]); }
    catch(e){ window.questions=[]; return window.questions; }
  }
  function mergeQuestions(rows){
    const map=new Map(questionStore().map(q=>[String(q.dbId||q.id), normalizeQuestion(q)]));
    (rows||[]).map(normalizeQuestion).forEach(q=>map.set(String(q.dbId||q.id),q));
    const all=Array.from(map.values()).filter(q=>q.text).sort((a,b)=>new Date(b.ts)-new Date(a.ts));
    window.questions=all;
    try{localStorage.setItem('tm_questions',JSON.stringify(all.slice(0,150)));}catch(e){}
    return all;
  }
  async function fetchQuestions(){
    try{
      const data=await getJSON(`/api/questions-list?series_slug=${encodeURIComponent(SERIES)}&lesson_slug=${encodeURIComponent(LESSON)}`);
      return mergeQuestions(data.questions||[]);
    }catch(e){
      console.warn('v35 questions fetch failed',e);
      try{return mergeQuestions(JSON.parse(localStorage.getItem('tm_questions')||'[]'));}catch(_){return questionStore();}
    }
  }
  function questionCard(q,compact=false){
    q=normalizeQuestion(q);
    return `<div class="admin-q-card">
      <div class="admin-q-meta"><span>${esc(q.name)}</span><span style="color:${q.status==='new'?'var(--red)':'var(--mu)'}">${esc(q.status)}</span><span>${esc(new Date(q.ts||Date.now()).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}))}</span></div>
      <div class="admin-q-text">${esc(q.text)}</div>
      <div class="admin-q-actions">
        <button onclick="updateQuestionV35('${esc(q.dbId||q.id)}','answered')">Answered</button>
        <button onclick="updateQuestionV35('${esc(q.dbId||q.id)}','hidden')">Hide</button>
        <button onclick="updateQuestionV35('${esc(q.dbId||q.id)}','new')">New</button>
      </div>
    </div>`;
  }
  window.updateQuestionV35=async function(id,status){
    try{await getJSON('/api/question-update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})});}catch(e){console.warn('v35 question update failed',e);}
    questionStore().forEach(q=>{if(String(q.dbId||q.id)===String(id)) q.status=status;});
    window.renderQuestionsMini&&window.renderQuestionsMini(false);
    window.renderQuestionsTabV35&&window.renderQuestionsTabV35(false);
  };
  window.renderQuestionsMini=async function(fetchFirst=true){
    if(fetchFirst) await fetchQuestions();
    const right=document.querySelector('#admin-hub .ctrl-right [style*="overflow-y"]') || document.querySelector('#admin-hub .ctrl-right');
    if(!right) return;
    let panel=document.getElementById('admin-questions-panel');
    if(!panel){
      panel=document.createElement('div');
      panel.id='admin-questions-panel';
      panel.className='admin-questions-panel';
      right.appendChild(panel);
    }
    const all=questionStore().filter(q=>(q.status||'new')!=='hidden');
    panel.innerHTML=`<div class="admin-questions-head"><div class="admin-questions-title">Live Questions</div><div class="admin-questions-count">${all.length}</div></div><div id="admin-questions-list">${all.length?all.slice(0,8).map(q=>questionCard(q,true)).join(''):'<div class="admin-question-empty">No questions yet.</div>'}</div>`;
  };
  window.renderQuestionsTabV35=async function(fetchFirst=true){
    const list=document.getElementById('admin-questions-tab-list');
    const count=document.getElementById('admin-questions-tab-count');
    if(!list) return;
    if(fetchFirst){list.innerHTML='<div class="admin-empty">Loading questions...</div>'; await fetchQuestions();}
    const all=questionStore();
    const newCount=all.filter(q=>(q.status||'new')==='new').length;
    if(count) count.textContent=`${newCount} new / ${all.length} total`;
    list.innerHTML=all.length?all.map(q=>questionCard(q,false)).join(''):'<div class="admin-empty">No questions yet.</div>';
  };

  function normalizePoll(row){
    let opts=row?.options||[];
    if(typeof opts==='string'){try{opts=JSON.parse(opts)}catch(e){opts=opts.split(',').map(x=>x.trim()).filter(Boolean)}}
    const id=row?.poll_id||row?.id||row?.pollId||'';
    return {id:String(id), question:row?.question||'Poll', options:Array.isArray(opts)?opts:[], status:row?.status||(row?.active?'live':row?.answered?'answered':'closed'), updatedAt:row?.updated_at||row?.closed_at||row?.created_at||new Date().toISOString()};
  }
  function groupVotes(votes){
    const out={};
    (votes||[]).forEach(v=>{const id=String(v.poll_id||v.pollId||''); if(!id)return; (out[id]||(out[id]=[])).push(v);});
    return out;
  }
  function currentActivePoll(){
    const p=window.pollState&&window.pollState.active;
    if(!p) return null;
    return normalizePoll({poll_id:p.id,question:p.question,options:p.options,status:'live',active:true,updated_at:new Date().toISOString()});
  }
  function localVotesFor(pollId){
    try{return ((window.pollState&&window.pollState.responses&&window.pollState.responses[pollId])||[]).map(v=>({poll_id:pollId,answer:v.answer||v}));}catch(e){return[];}
  }
  function pollRows(p,votes){
    const total=(votes||[]).length;
    const tally={}; (p.options||[]).forEach(o=>tally[String(o).trim()]=0);
    (votes||[]).forEach(v=>{const k=String(v.answer||'').trim(); tally[k]=(tally[k]||0)+1;});
    return `<div class="admin-poll-rows">${(p.options||[]).map(o=>{const k=String(o).trim(); const n=tally[k]||0; const pct=total?Math.round(n/total*100):0; return `<div class="admin-poll-row"><div>${esc(k)}</div><div class="admin-poll-bar"><div class="admin-poll-fill" style="width:${pct}%"></div></div><div>${pct}% (${n})</div></div>`;}).join('')}</div><div class="admin-q-meta" style="margin-top:8px"><span>${total} answer${total===1?'':'s'}</span></div>`;
  }
  async function fetchPolls(){
    try{return await getJSON(`/api/polls-list?series_slug=${encodeURIComponent(SERIES)}&lesson_slug=${encodeURIComponent(LESSON)}`);}catch(e){console.warn('v35 polls fetch failed',e);return {polls:[],votes:[]};}
  }
  window.renderPollsTabV35=async function(){
    const tab=document.getElementById('tab-polls');
    if(!tab) return;
    let liveBox=document.getElementById('admin-live-poll-box');
    if(!liveBox){
      liveBox=document.createElement('div');
      liveBox.id='admin-live-poll-box';
      liveBox.className='admin-live-poll-panel';
      const bank=document.getElementById('poll-bank-list');
      if(bank && bank.nextSibling) tab.insertBefore(liveBox,bank.nextSibling); else tab.appendChild(liveBox);
    }
    let archive=document.getElementById('admin-polls-tab-archive');
    if(!archive){
      const wrap=document.createElement('div');
      wrap.className='admin-poll-archive-wrap';
      wrap.innerHTML=`<div class="admin-poll-archive-toolbar"><b>Answered Polls</b><span id="admin-polls-tab-count">0 saved</span><button class="admin-inline-btn" onclick="renderPollsTabV35()">Refresh</button></div><div class="admin-poll-archive-list" id="admin-polls-tab-archive"><div class="admin-empty">No answered polls yet.</div></div>`;
      tab.appendChild(wrap); archive=document.getElementById('admin-polls-tab-archive');
    }
    const data=await fetchPolls();
    const voteGroups=groupVotes(data.votes||[]);
    const polls=(data.polls||[]).map(normalizePoll);
    const active=currentActivePoll();
    const livePolls=[];
    if(active) livePolls.push(active);
    polls.filter(p=>p.status==='live' && (!active || p.id!==active.id)).forEach(p=>livePolls.push(p));
    liveBox.innerHTML=`<div class="admin-poll-archive-toolbar"><b>Live Poll Results</b><span>${livePolls.length} live</span><button class="admin-inline-btn" onclick="renderPollsTabV35()">Refresh</button></div>${livePolls.length?livePolls.map(p=>{const votes=[...(voteGroups[p.id]||[]),...localVotesFor(p.id)];return `<div class="admin-live-poll-card"><div class="admin-live-poll-meta"><span class="admin-live-tag">Live</span><span>${esc(p.id)}</span></div><div class="admin-live-poll-title">${esc(p.question)}</div>${pollRows(p,votes)}<div class="admin-live-poll-actions"><button onclick="closeActivePoll(true);setTimeout(renderPollsTabV35,300)">Kill Poll</button></div></div>`}).join(''):'<div class="admin-empty">No active poll.</div>'}`;
    const answered=polls.filter(p=>p.status!=='live');
    const count=document.getElementById('admin-polls-tab-count'); if(count) count.textContent=`${answered.length} saved`;
    archive.innerHTML=answered.length?answered.map(p=>`<div class="admin-poll-card"><div class="admin-poll-meta"><span>${esc(p.status)}</span><span>${esc(new Date(p.updatedAt).toLocaleString())}</span></div><div class="admin-poll-text">${esc(p.question)}</div>${pollRows(p,voteGroups[p.id]||[])}</div>`).join(''):'<div class="admin-empty">No answered polls yet. Launch and kill/replace a poll to archive it here.</div>';
  };

  function ensureQuestionTab(){
    const tabs=document.querySelector('#admin-hub .ctrl-tabs');
    const polls=document.getElementById('tab-polls');
    if(!tabs||!polls) return;
    if(!document.getElementById('tab-questions')){
      const qBtn=document.createElement('button'); qBtn.className='ctrl-tab'; qBtn.textContent='Questions'; qBtn.onclick=function(){switchTab('questions',this); window.renderQuestionsTabV35(true);}; tabs.appendChild(qBtn);
      const panel=document.createElement('div'); panel.className='ctrl-panel'; panel.id='tab-questions'; panel.innerHTML=`<div class="admin-q-toolbar"><b>Live Questions</b><span id="admin-questions-tab-count">0 new / 0 total</span><button class="admin-inline-btn" onclick="renderQuestionsTabV35(true)">Refresh</button></div><div class="admin-q-list" id="admin-questions-tab-list"><div class="admin-empty">No questions yet.</div></div>`; polls.parentNode.insertBefore(panel,polls.nextSibling);
    }
  }
  const prevSwitch=window.switchTab;
  window.switchTab=function(name,btn){
    const r=prevSwitch?prevSwitch(name,btn):undefined;
    if(name==='questions') setTimeout(()=>window.renderQuestionsTabV35(true),0);
    if(name==='polls') setTimeout(()=>window.renderPollsTabV35(),0);
    return r;
  };
  const prevBuild=window.buildCtrlSurface;
  if(prevBuild){window.buildCtrlSurface=function(){const r=prevBuild.apply(this,arguments);setTimeout(()=>{ensureQuestionTab();window.renderQuestionsMini(true);window.renderQuestionsTabV35(false);window.renderPollsTabV35();},400);return r;};}
  const prevShow=window.showAdminHub;
  if(prevShow){window.showAdminHub=function(){const r=prevShow.apply(this,arguments);setTimeout(()=>{ensureQuestionTab();window.renderQuestionsMini(true);window.renderQuestionsTabV35(false);window.renderPollsTabV35();},500);return r;};}
  const prevAddVote=window.addPollVote;
  if(prevAddVote){window.addPollVote=function(vote){const r=prevAddVote.apply(this,arguments);setTimeout(()=>window.renderPollsTabV35(),200);return r;};}
  const prevOpenPoll=window.openPoll;
  if(prevOpenPoll){window.openPoll=function(poll){const r=prevOpenPoll.apply(this,arguments);setTimeout(()=>window.renderPollsTabV35(),250);return r;};}
  const prevClosePoll=window.closeActivePoll;
  if(prevClosePoll){window.closeActivePoll=function(){const r=prevClosePoll.apply(this,arguments);setTimeout(()=>window.renderPollsTabV35(),500);return r;};}
  try{
    const bc=new BroadcastChannel('tm-sync');
    bc.onmessage=(ev)=>{const m=ev.data||{}; if(m.type==='question_submit'){mergeQuestions([m.question]);setTimeout(()=>{window.renderQuestionsMini(false);window.renderQuestionsTabV35(false);},0);} if(m.type==='poll_open'||m.type==='poll_close'||m.type==='poll_vote') setTimeout(()=>window.renderPollsTabV35(),250);};
  }catch(e){}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{ensureQuestionTab();window.renderQuestionsMini(true);window.renderPollsTabV35();},1000));
})();
