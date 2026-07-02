
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
  slug: 'the-ministry',
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
window.SB_KEY = 'sb_publishable_C0O6QwRy2nJIJLJHCGuXWA_nZfrqTyi'; // loaded from /api/config when deployed
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
    "slides": [0, 1, 2, 3, 4, 5, 6, 7, 8]
  },
  {
    "id": "l2v12",
    "ref": "Matthew 10:12",
    "kjv": "And when ye come into an house, salute it.",
    "slides": [9, 10, 11]
  },
  {
    "id": "l2v13",
    "ref": "Matthew 10:13",
    "kjv": "And if the house be worthy, let your peace come upon it: but if it be not worthy, let your peace return to you.",
    "slides": [9, 10, 11]
  },
  {
    "id": "l2v14",
    "ref": "Matthew 10:14",
    "kjv": "And whosoever shall not receive you, nor hear your words, when ye depart out of that house or city, shake off the dust of your feet.",
    "slides": [12, 13, 14]
  },
  {
    "id": "l2v15",
    "ref": "Matthew 10:15",
    "kjv": "Verily I say unto you, It shall be more tolerable for the land of Sodom and Gomorrha in the day of judgment, than for that city.",
    "slides": [12, 13, 14]
  },
  {
    "id": "l2v16",
    "ref": "Matthew 10:16",
    "kjv": "Behold, I send you forth as sheep in the midst of wolves: be ye therefore wise as serpents, and harmless as doves.",
    "slides": [15, 16, 17, 18, 19]
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




// =========================================================
// LESSON 3: THE MAKING OF A MINISTER
// Companion lesson added v46. Lesson 1 and Lesson 2 remain unchanged.
// =========================================================
const LESSON3_SLIDES = [
  { t:'cover', eyebrow:'The Ministry &middot; Companion Lesson', lesson:'Lesson 3', title:'The Making of a Minister', ref:'1 Timothy 4:12-16 · 2 Timothy' },
  { t:'big', sup:'Big Idea', text:'Paul does not tell Timothy to build a <span class="acc">brand.</span>', ref:'1 Timothy 4:16' },
  { t:'sc', ref:'1 Timothy 4:16', text:'&ldquo;Take heed unto thyself, and unto the doctrine; continue in them: for in doing this thou shalt both save thyself, and them that hear thee.&rdquo;', tk:'Paul does not separate the man from the message.' },
  { t:'te', n:'01', hl:'Watch the life that carries the <span class="acc">doctrine.</span>', pts:['Take heed unto thyself.','Take heed unto the doctrine.','The man and the message have to be watched together.','<span class="hi">Truth can be mishandled by a vessel that is out of order.</span>'], ref:'1 Timothy 4:16' },
  { t:'big', sup:'Preach Line', text:'Paul does not separate the man from the message because the people receive <span class="acc">both.</span>', ref:'1 Timothy 4:16' },
  { t:'sc', ref:'1 Timothy 4:12', text:'&ldquo;Let no man despise thy youth; but be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.&rdquo;', tk:'The minister must become an example before he becomes only a voice.' },
  { t:'big', sup:'Preach Line', text:'A minister is not proven by <span class="acc">volume.</span> He is proven by pattern.', ref:'1 Timothy 4:12' },
  { t:'te', n:'02', hl:'Stir the gift, but keep the vessel <span class="acc">governed.</span>', pts:['A real gift can still be neglected.','A true calling can still be underdeveloped.','The gift being from God does not remove responsibility.','<span class="hi">The gift is entrusted. The vessel must be governed.</span>'], ref:'1 Timothy 4:14-15 · 2 Timothy 1:6' },
  { t:'sc', ref:'2 Timothy 1:7', text:'&ldquo;For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.&rdquo;', tk:'Power. Love. A sound mind. That is the shape of a safe vessel.' },
  { t:'sc', ref:'2 Timothy 2:3', text:'&ldquo;Thou therefore endure hardness, as a good soldier of Jesus Christ.&rdquo;', tk:'Hardship must deepen obedience without deforming the spirit.' },
  { t:'big', sup:'Preach Line', text:'A minister must learn discomfort without letting discomfort <span class="acc">deform</span> him.', ref:'2 Timothy 2:3' },
  { t:'sc', ref:'2 Timothy 2:15', text:'&ldquo;Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.&rdquo;', tk:'The Word is not material for clever thoughts. It is truth to be handled rightly.' },
  { t:'sc', ref:'2 Timothy 4:2', text:'&ldquo;Preach the word; be instant in season, out of season; reprove, rebuke, exhort with all longsuffering and doctrine.&rdquo;', tk:'Preach the Word when it is received and when it is resisted.' },
  { t:'sc', ref:'2 Timothy 4:7', text:'&ldquo;I have fought a good fight, I have finished my course, I have kept the faith.&rdquo;', tk:'Paul is not only showing Timothy how to start. He is showing him how to finish.' },
  { t:'final', kicker:'Closing Line', text:'The making of a minister is the making of a <span class="acc">safe vessel</span> for holy work.', sub:'Life. Doctrine. Gift. Endurance. Study. Preaching. Finish.', ref:'2 Timothy 4:5-7' }
];

const NOTES_L3 = {
  0:'Opening title. Start the companion lesson here.',
  1:'Opening big idea. Use after: Paul does not tell Timothy to build a brand.',
  2:'Read 1 Timothy 4:16. Slow down on “thyself” and “doctrine.”',
  3:'Point I. The minister must watch the life that carries the doctrine.',
  4:'Preach line for Point I. Pause after this.',
  5:'Point II. Use when you read 1 Timothy 4:12 and move from voice to example.',
  6:'Preach line for example/pattern.',
  7:'Point III. Gift and discipline. Connect 1 Timothy 4:14-15 and 2 Timothy 1:6.',
  8:'Read 2 Timothy 1:7. Explain power, love, and sound mind.',
  9:'Point IV. Read 2 Timothy 2:3. Hardship and soldier language.',
  10:'Preach line for hardship. Let it land.',
  11:'Point V. Read 2 Timothy 2:15. Study and rightly divide the Word.',
  12:'Point VI. Read 2 Timothy 4:2. Preach the Word.',
  13:'Finish section. Read 2 Timothy 4:7.',
  14:'Final close. The making of a minister is the making of a safe vessel.'
};

const SCRIPTURE_MAP_L3 = [
  {ref_en:'1 Timothy 4:12-16; 2 Timothy 1:6-7; 2 Timothy 2:3-15; 2 Timothy 4:1-7', text_en:'Paul does not tell Timothy to build a brand. He tells him to become faithful.', ref_es:'1 Timoteo 4; 2 Timoteo 1, 2, 4', text_es:'Pablo no le dice a Timoteo que construya una imagen. Le enseña a ser fiel.'},
  {ref_en:'1 Timothy 4:16', text_en:'Take heed unto thyself, and unto the doctrine; continue in them...', ref_es:'1 Timoteo 4:16', text_es:'Ten cuidado de ti mismo y de la doctrina; persiste en ello...'},
  {ref_en:'1 Timothy 4:16', text_en:'Take heed unto thyself, and unto the doctrine; continue in them: for in doing this thou shalt both save thyself, and them that hear thee.', ref_es:'1 Timoteo 4:16', text_es:'Ten cuidado de ti mismo y de la doctrina; persiste en ello, pues haciendo esto, te salvarás a ti mismo y a los que te oyeren.'},
  {ref_en:'1 Timothy 4:16', text_en:'Take heed unto thyself, and unto the doctrine; continue in them...', ref_es:'1 Timoteo 4:16', text_es:'Ten cuidado de ti mismo y de la doctrina; persiste en ello...'},
  {ref_en:'1 Timothy 4:16', text_en:'Take heed unto thyself, and unto the doctrine; continue in them...', ref_es:'1 Timoteo 4:16', text_es:'Ten cuidado de ti mismo y de la doctrina; persiste en ello...'},
  {ref_en:'1 Timothy 4:12', text_en:'Let no man despise thy youth; but be thou an example of the believers...', ref_es:'1 Timoteo 4:12', text_es:'Ninguno tenga en poco tu juventud, sino sé ejemplo de los creyentes...'},
  {ref_en:'1 Timothy 4:12', text_en:'...be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.', ref_es:'1 Timoteo 4:12', text_es:'...sé ejemplo de los creyentes en palabra, conducta, amor, espíritu, fe y pureza.'},
  {ref_en:'1 Timothy 4:14-15; 2 Timothy 1:6', text_en:'Neglect not the gift that is in thee... Meditate upon these things; give thyself wholly to them...', ref_es:'1 Timoteo 4:14-15; 2 Timoteo 1:6', text_es:'No descuides el don que hay en ti... Ocúpate en estas cosas; permanece en ellas...'},
  {ref_en:'2 Timothy 1:7', text_en:'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.', ref_es:'2 Timoteo 1:7', text_es:'Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.'},
  {ref_en:'2 Timothy 2:3', text_en:'Thou therefore endure hardness, as a good soldier of Jesus Christ.', ref_es:'2 Timoteo 2:3', text_es:'Tú, pues, sufre penalidades como buen soldado de Jesucristo.'},
  {ref_en:'2 Timothy 2:3', text_en:'Thou therefore endure hardness, as a good soldier of Jesus Christ.', ref_es:'2 Timoteo 2:3', text_es:'Tú, pues, sufre penalidades como buen soldado de Jesucristo.'},
  {ref_en:'2 Timothy 2:15', text_en:'Study to shew thyself approved unto God... rightly dividing the word of truth.', ref_es:'2 Timoteo 2:15', text_es:'Procura con diligencia presentarte a Dios aprobado... que usa bien la palabra de verdad.'},
  {ref_en:'2 Timothy 4:2', text_en:'Preach the word; be instant in season, out of season; reprove, rebuke, exhort with all longsuffering and doctrine.', ref_es:'2 Timoteo 4:2', text_es:'Que prediques la palabra; que instes a tiempo y fuera de tiempo; redarguye, reprende, exhorta con toda paciencia y doctrina.'},
  {ref_en:'2 Timothy 4:7', text_en:'I have fought a good fight, I have finished my course, I have kept the faith.', ref_es:'2 Timoteo 4:7', text_es:'He peleado la buena batalla, he acabado la carrera, he guardado la fe.'},
  {ref_en:'2 Timothy 4:5-7', text_en:'...do the work... make full proof of thy ministry... I have finished my course, I have kept the faith.', ref_es:'2 Timoteo 4:5-7', text_es:'...haz obra... cumple tu ministerio... he acabado la carrera, he guardado la fe.'}
];

const VERSE_BANK_L3 = [
  {id:'l3-1tim4-12', ref:'1 Timothy 4:12', kjv:'Let no man despise thy youth; but be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.', rvr:'Ninguno tenga en poco tu juventud, sino sé ejemplo de los creyentes en palabra, conducta, amor, espíritu, fe y pureza.', slides:[5,6]},
  {id:'l3-1tim4-13', ref:'1 Timothy 4:13', kjv:'Till I come, give attendance to reading, to exhortation, to doctrine.', rvr:'Entre tanto que voy, ocúpate en la lectura, la exhortación y la enseñanza.', slides:[5,6]},
  {id:'l3-1tim4-14', ref:'1 Timothy 4:14', kjv:'Neglect not the gift that is in thee, which was given thee by prophecy, with the laying on of the hands of the presbytery.', rvr:'No descuides el don que hay en ti, que te fue dado mediante profecía con la imposición de las manos del presbiterio.', slides:[7]},
  {id:'l3-1tim4-15', ref:'1 Timothy 4:15', kjv:'Meditate upon these things; give thyself wholly to them; that thy profiting may appear to all.', rvr:'Ocúpate en estas cosas; permanece en ellas, para que tu aprovechamiento sea manifiesto a todos.', slides:[7]},
  {id:'l3-1tim4-16', ref:'1 Timothy 4:16', kjv:'Take heed unto thyself, and unto the doctrine; continue in them: for in doing this thou shalt both save thyself, and them that hear thee.', rvr:'Ten cuidado de ti mismo y de la doctrina; persiste en ello, pues haciendo esto, te salvarás a ti mismo y a los que te oyeren.', slides:[2,3,4]},
  {id:'l3-2tim1-6', ref:'2 Timothy 1:6', kjv:'Wherefore I put thee in remembrance that thou stir up the gift of God, which is in thee by the putting on of my hands.', rvr:'Por lo cual te aconsejo que avives el fuego del don de Dios que está en ti por la imposición de mis manos.', slides:[7]},
  {id:'l3-2tim1-7', ref:'2 Timothy 1:7', kjv:'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.', rvr:'Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.', slides:[8]},
  {id:'l3-2tim2-3', ref:'2 Timothy 2:3', kjv:'Thou therefore endure hardness, as a good soldier of Jesus Christ.', rvr:'Tú, pues, sufre penalidades como buen soldado de Jesucristo.', slides:[9,10]},
  {id:'l3-2tim2-15', ref:'2 Timothy 2:15', kjv:'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.', rvr:'Procura con diligencia presentarte a Dios aprobado, como obrero que no tiene de qué avergonzarse, que usa bien la palabra de verdad.', slides:[11]},
  {id:'l3-2tim4-1', ref:'2 Timothy 4:1', kjv:'I charge thee therefore before God, and the Lord Jesus Christ, who shall judge the quick and the dead at his appearing and his kingdom;', rvr:'Te encarezco delante de Dios y del Señor Jesucristo, que juzgará a los vivos y a los muertos en su manifestación y en su reino;', slides:[12]},
  {id:'l3-2tim4-2', ref:'2 Timothy 4:2', kjv:'Preach the word; be instant in season, out of season; reprove, rebuke, exhort with all longsuffering and doctrine.', rvr:'Que prediques la palabra; que instes a tiempo y fuera de tiempo; redarguye, reprende, exhorta con toda paciencia y doctrina.', slides:[12]},
  {id:'l3-2tim4-3', ref:'2 Timothy 4:3', kjv:'For the time will come when they will not endure sound doctrine; but after their own lusts shall they heap to themselves teachers, having itching ears;', rvr:'Porque vendrá tiempo cuando no sufrirán la sana doctrina, sino que teniendo comezón de oír, se amontonarán maestros conforme a sus propias concupiscencias;', slides:[12]},
  {id:'l3-2tim4-4', ref:'2 Timothy 4:4', kjv:'And they shall turn away their ears from the truth, and shall be turned unto fables.', rvr:'Y apartarán de la verdad el oído y se volverán a las fábulas.', slides:[12]},
  {id:'l3-2tim4-5', ref:'2 Timothy 4:5', kjv:'But watch thou in all things, endure afflictions, do the work of an evangelist, make full proof of thy ministry.', rvr:'Pero tú sé sobrio en todo, soporta las aflicciones, haz obra de evangelista, cumple tu ministerio.', slides:[14]},
  {id:'l3-2tim4-6', ref:'2 Timothy 4:6', kjv:'For I am now ready to be offered, and the time of my departure is at hand.', rvr:'Porque yo ya estoy para ser sacrificado, y el tiempo de mi partida está cercano.', slides:[13]},
  {id:'l3-2tim4-7', ref:'2 Timothy 4:7', kjv:'I have fought a good fight, I have finished my course, I have kept the faith.', rvr:'He peleado la buena batalla, he acabado la carrera, he guardado la fe.', slides:[13,14]}
];

const QUESTIONS_L3 = [
  {section:'Personal Examination', questions:[
    {num:'1', text:'Where am I trying to be known instead of trying to be faithful?'},
    {num:'2', text:'Which is more guarded in my life right now: my doctrine, or my spirit?'},
    {num:'3', text:'What has ministry pressure exposed in me: pride, fear, anger, insecurity, or ambition?'},
    {num:'4', text:'Where have I been tempted to handle truth as a weapon instead of a stewardship?'},
    {num:'5', text:'What does it look like for me to take heed unto thyself this week in practical terms?'}
  ]},
  {section:'Doctrine and Example', questions:[
    {num:'6', text:'Where do my patterns contradict what I say I believe?'},
    {num:'7', text:'What part of be thou an example is most lacking in me right now: word, conversation, charity, spirit, faith, or purity?'},
    {num:'8', text:'What would give attendance to reading, exhortation, and doctrine look like in my weekly rhythm?'}
  ]},
  {section:'Gift, Hardness, and Finishing', questions:[
    {num:'9', text:'Am I neglecting the gift, or am I worshiping the gift?'},
    {num:'10', text:'Where has fear been trying to make me shrink back from obedience?'},
    {num:'11', text:'What hardship am I enduring right now, and how am I being tempted to become hard in spirit?'},
    {num:'12', text:'Where do I need to recommit to rightly dividing the word of truth?'},
    {num:'13', text:'If I measured ministry by finish, what would need to change today?'}
  ]}
];

const POLL_BANK_L3 = [
  {id:'l3-poll-1', question:'Which part of ministry needs the most attention in you right now?', options:['Life','Doctrine','Gift','Endurance','Study'], anonymous:false},
  {id:'l3-poll-2', question:'What has ministry pressure exposed the most?', options:['Pride','Fear','Anger','Insecurity','Ambition'], anonymous:false},
  {id:'l3-poll-3', question:'Which phrase hits your current season most?', options:['Watch the life','Stir the gift','Endure hardness','Rightly divide','Finish the course'], anonymous:false}
];

const BIBLE_BANK_L3 = {
  books: {
    '1 Timothy': {
      '4': [
        ['1 Timothy 4:1','Now the Spirit speaketh expressly, that in the latter times some shall depart from the faith, giving heed to seducing spirits, and doctrines of devils;'],
        ['1 Timothy 4:2','Speaking lies in hypocrisy; having their conscience seared with a hot iron;'],
        ['1 Timothy 4:3','Forbidding to marry, and commanding to abstain from meats, which God hath created to be received with thanksgiving of them which believe and know the truth.'],
        ['1 Timothy 4:4','For every creature of God is good, and nothing to be refused, if it be received with thanksgiving:'],
        ['1 Timothy 4:5','For it is sanctified by the word of God and prayer.'],
        ['1 Timothy 4:6','If thou put the brethren in remembrance of these things, thou shalt be a good minister of Jesus Christ, nourished up in the words of faith and of good doctrine, whereunto thou hast attained.'],
        ['1 Timothy 4:7','But refuse profane and old wives\' fables, and exercise thyself rather unto godliness.'],
        ['1 Timothy 4:8','For bodily exercise profiteth little: but godliness is profitable unto all things, having promise of the life that now is, and of that which is to come.'],
        ['1 Timothy 4:9','This is a faithful saying and worthy of all acceptation.'],
        ['1 Timothy 4:10','For therefore we both labour and suffer reproach, because we trust in the living God, who is the Saviour of all men, specially of those that believe.'],
        ['1 Timothy 4:11','These things command and teach.'],
        ['1 Timothy 4:12','Let no man despise thy youth; but be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.'],
        ['1 Timothy 4:13','Till I come, give attendance to reading, to exhortation, to doctrine.'],
        ['1 Timothy 4:14','Neglect not the gift that is in thee, which was given thee by prophecy, with the laying on of the hands of the presbytery.'],
        ['1 Timothy 4:15','Meditate upon these things; give thyself wholly to them; that thy profiting may appear to all.'],
        ['1 Timothy 4:16','Take heed unto thyself, and unto the doctrine; continue in them: for in doing this thou shalt both save thyself, and them that hear thee.']
      ]
    },
    '2 Timothy': {
      '1': [
        ['2 Timothy 1:1','Paul, an apostle of Jesus Christ by the will of God, according to the promise of life which is in Christ Jesus,'],
        ['2 Timothy 1:2','To Timothy, my dearly beloved son: Grace, mercy, and peace, from God the Father and Christ Jesus our Lord.'],
        ['2 Timothy 1:3','I thank God, whom I serve from my forefathers with pure conscience, that without ceasing I have remembrance of thee in my prayers night and day;'],
        ['2 Timothy 1:4','Greatly desiring to see thee, being mindful of thy tears, that I may be filled with joy;'],
        ['2 Timothy 1:5','When I call to remembrance the unfeigned faith that is in thee, which dwelt first in thy grandmother Lois, and thy mother Eunice; and I am persuaded that in thee also.'],
        ['2 Timothy 1:6','Wherefore I put thee in remembrance that thou stir up the gift of God, which is in thee by the putting on of my hands.'],
        ['2 Timothy 1:7','For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.'],
        ['2 Timothy 1:8','Be not thou therefore ashamed of the testimony of our Lord, nor of me his prisoner: but be thou partaker of the afflictions of the gospel according to the power of God;'],
        ['2 Timothy 1:9','Who hath saved us, and called us with an holy calling, not according to our works, but according to his own purpose and grace, which was given us in Christ Jesus before the world began,'],
        ['2 Timothy 1:10','But is now made manifest by the appearing of our Saviour Jesus Christ, who hath abolished death, and hath brought life and immortality to light through the gospel:'],
        ['2 Timothy 1:11','Whereunto I am appointed a preacher, and an apostle, and a teacher of the Gentiles.'],
        ['2 Timothy 1:12','For the which cause I also suffer these things: nevertheless I am not ashamed: for I know whom I have believed, and am persuaded that he is able to keep that which I have committed unto him against that day.'],
        ['2 Timothy 1:13','Hold fast the form of sound words, which thou hast heard of me, in faith and love which is in Christ Jesus.'],
        ['2 Timothy 1:14','That good thing which was committed unto thee keep by the Holy Ghost which dwelleth in us.'],
        ['2 Timothy 1:15','This thou knowest, that all they which are in Asia be turned away from me; of whom are Phygellus and Hermogenes.'],
        ['2 Timothy 1:16','The Lord give mercy unto the house of Onesiphorus; for he oft refreshed me, and was not ashamed of my chain:'],
        ['2 Timothy 1:17','But, when he was in Rome, he sought me out very diligently, and found me.'],
        ['2 Timothy 1:18','The Lord grant unto him that he may find mercy of the Lord in that day: and in how many things he ministered unto me at Ephesus, thou knowest very well.']
      ],
      '2': [
        ['2 Timothy 2:1','Thou therefore, my son, be strong in the grace that is in Christ Jesus.'],
        ['2 Timothy 2:2','And the things that thou hast heard of me among many witnesses, the same commit thou to faithful men, who shall be able to teach others also.'],
        ['2 Timothy 2:3','Thou therefore endure hardness, as a good soldier of Jesus Christ.'],
        ['2 Timothy 2:4','No man that warreth entangleth himself with the affairs of this life; that he may please him who hath chosen him to be a soldier.'],
        ['2 Timothy 2:5','And if a man also strive for masteries, yet is he not crowned, except he strive lawfully.'],
        ['2 Timothy 2:6','The husbandman that laboureth must be first partaker of the fruits.'],
        ['2 Timothy 2:7','Consider what I say; and the Lord give thee understanding in all things.'],
        ['2 Timothy 2:8','Remember that Jesus Christ of the seed of David was raised from the dead according to my gospel:'],
        ['2 Timothy 2:9','Wherein I suffer trouble, as an evil doer, even unto bonds; but the word of God is not bound.'],
        ['2 Timothy 2:10','Therefore I endure all things for the elect\'s sakes, that they may also obtain the salvation which is in Christ Jesus with eternal glory.'],
        ['2 Timothy 2:11','It is a faithful saying: For if we be dead with him, we shall also live with him:'],
        ['2 Timothy 2:12','If we suffer, we shall also reign with him: if we deny him, he also will deny us:'],
        ['2 Timothy 2:13','If we believe not, yet he abideth faithful: he cannot deny himself.'],
        ['2 Timothy 2:14','Of these things put them in remembrance, charging them before the Lord that they strive not about words to no profit, but to the subverting of the hearers.'],
        ['2 Timothy 2:15','Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.'],
        ['2 Timothy 2:16','But shun profane and vain babblings: for they will increase unto more ungodliness.'],
        ['2 Timothy 2:17','And their word will eat as doth a canker: of whom is Hymenaeus and Philetus;'],
        ['2 Timothy 2:18','Who concerning the truth have erred, saying that the resurrection is past already; and overthrow the faith of some.'],
        ['2 Timothy 2:19','Nevertheless the foundation of God standeth sure, having this seal, The Lord knoweth them that are his. And, Let every one that nameth the name of Christ depart from iniquity.'],
        ['2 Timothy 2:20','But in a great house there are not only vessels of gold and of silver, but also of wood and of earth; and some to honour, and some to dishonour.'],
        ['2 Timothy 2:21','If a man therefore purge himself from these, he shall be a vessel unto honour, sanctified, and meet for the master\'s use, and prepared unto every good work.'],
        ['2 Timothy 2:22','Flee also youthful lusts: but follow righteousness, faith, charity, peace, with them that call on the Lord out of a pure heart.'],
        ['2 Timothy 2:23','But foolish and unlearned questions avoid, knowing that they do gender strifes.'],
        ['2 Timothy 2:24','And the servant of the Lord must not strive; but be gentle unto all men, apt to teach, patient,'],
        ['2 Timothy 2:25','In meekness instructing those that oppose themselves; if God peradventure will give them repentance to the acknowledging of the truth;'],
        ['2 Timothy 2:26','And that they may recover themselves out of the snare of the devil, who are taken captive by him at his will.']
      ],
      '4': [
        ['2 Timothy 4:1','I charge thee therefore before God, and the Lord Jesus Christ, who shall judge the quick and the dead at his appearing and his kingdom;'],
        ['2 Timothy 4:2','Preach the word; be instant in season, out of season; reprove, rebuke, exhort with all longsuffering and doctrine.'],
        ['2 Timothy 4:3','For the time will come when they will not endure sound doctrine; but after their own lusts shall they heap to themselves teachers, having itching ears;'],
        ['2 Timothy 4:4','And they shall turn away their ears from the truth, and shall be turned unto fables.'],
        ['2 Timothy 4:5','But watch thou in all things, endure afflictions, do the work of an evangelist, make full proof of thy ministry.'],
        ['2 Timothy 4:6','For I am now ready to be offered, and the time of my departure is at hand.'],
        ['2 Timothy 4:7','I have fought a good fight, I have finished my course, I have kept the faith.'],
        ['2 Timothy 4:8','Henceforth there is laid up for me a crown of righteousness, which the Lord, the righteous judge, shall give me at that day.'],
        ['2 Timothy 4:9','Do thy diligence to come shortly unto me:'],
        ['2 Timothy 4:10','For Demas hath forsaken me, having loved this present world, and is departed unto Thessalonica; Crescens to Galatia, Titus unto Dalmatia.'],
        ['2 Timothy 4:11','Only Luke is with me. Take Mark, and bring him with thee: for he is profitable to me for the ministry.'],
        ['2 Timothy 4:12','And Tychicus have I sent to Ephesus.'],
        ['2 Timothy 4:13','The cloke that I left at Troas with Carpus, when thou comest, bring with thee, and the books, but especially the parchments.'],
        ['2 Timothy 4:14','Alexander the coppersmith did me much evil: the Lord reward him according to his works:'],
        ['2 Timothy 4:15','Of whom be thou ware also; for he hath greatly withstood our words.'],
        ['2 Timothy 4:16','At my first answer no man stood with me, but all men forsook me: I pray God that it may not be laid to their charge.'],
        ['2 Timothy 4:17','Notwithstanding the Lord stood with me, and strengthened me; that by me the preaching might be fully known...'],
        ['2 Timothy 4:18','And the Lord shall deliver me from every evil work, and will preserve me unto his heavenly kingdom...'],
        ['2 Timothy 4:19','Salute Prisca and Aquila, and the household of Onesiphorus.'],
        ['2 Timothy 4:20','Erastus abode at Corinth: but Trophimus have I left at Miletum sick.'],
        ['2 Timothy 4:21','Do thy diligence to come before winter. Eubulus greeteth thee, and Pudens, and Linus, and Claudia, and all the brethren.'],
        ['2 Timothy 4:22','The Lord Jesus Christ be with thy spirit. Grace be with you. Amen.']
      ]
    }
  }
};
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
  },
  'lesson-3': {
    slug: 'lesson-3',
    label: 'Lesson 3',
    title: 'The Making of a Minister',
    text: '1 Timothy 4:12-16 · 2 Timothy 1, 2, 4',
    slides: LESSON3_SLIDES,
    notes: NOTES_L3,
    scriptureMap: SCRIPTURE_MAP_L3,
    verseBank: VERSE_BANK_L3,
    questions: QUESTIONS_L3,
    pollBank: POLL_BANK_L3,
    bibleBank: BIBLE_BANK_L3
  }
});
function normalizeLessonSlug(raw){
  raw=String(raw||'').toLowerCase().trim();
  if(raw==='3') return 'lesson-3';
  if(raw==='2') return 'lesson-2';
  if(raw==='1') return 'lesson-1';
  return LESSON_LIBRARY[raw] ? raw : 'lesson-1';
}
const LESSON_DATE_RULES = Object.freeze([
  {slug:'lesson-1', date:'2026-06-18', open:true},
  {slug:'lesson-2', date:'2026-06-25', open:true},
  {slug:'lesson-3', date:'2026-07-02', open:true},
  {slug:'lesson-4', date:'2026-07-09', open:false}
]);
function isoLocalDate(d=new Date()){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function dateBasedLessonSlug(dateValue){
  const today=String(dateValue||isoLocalDate());
  const eligible=LESSON_DATE_RULES
    .filter(x=>x.open && LESSON_LIBRARY[x.slug] && x.date<=today)
    .sort((a,b)=>a.date.localeCompare(b.date));
  if(eligible.length) return eligible[eligible.length-1].slug;
  const first=LESSON_DATE_RULES.find(x=>x.open && LESSON_LIBRARY[x.slug]);
  return first ? first.slug : 'lesson-1';
}
function requestedLessonSlug(){
  const p=new URLSearchParams(window.location.search);
  const fromUrl=p.get('lesson')||p.get('l');
  if(fromUrl) return normalizeLessonSlug(fromUrl);
  // Default lesson is date-driven so the highlighted/open lesson follows the calendar,
  // not whatever older sequence was saved in localStorage. Use ?lesson=lesson-1 for testing old lessons.
  return normalizeLessonSlug(dateBasedLessonSlug());
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
  window.BIBLE_BANK_CURRENT = lesson.bibleBank || null;
  window.LESSON_SLUG = lesson.slug;
  window.LESSON_DATA = { slug: lesson.slug, label: lesson.label, title: lesson.title, text: lesson.text };
  try{localStorage.setItem('tm_selected_lesson', lesson.slug);}catch(e){}
  try{setTimeout(()=>updateLandingLessonState(lesson.slug),0);}catch(e){}
  return lesson;
}

const HOME_LESSON_META = {
  'lesson-1': {num:'01', label:'Lesson 1', dateShort:'June 18', dateLong:'June 18, 2026', title:'The Price of Being Sent', text:'Matthew 10:1-10', slides:'15 Slides', tagline:'Ministry does not begin with a platform. It begins with a call.', reflectionTitle:'Personal Examination', reflectionMeta:'6 sections · 17 questions', open:true},
  'lesson-2': {num:'02', label:'Lesson 2', dateShort:'June 25', dateLong:'June 25, 2026', title:'The Discipline of the Sent', text:'Matthew 10:11-16', slides:'20 Slides', tagline:'Jesus does not only send disciples. He instructs disciples in how to move.', reflectionTitle:'The Discipline of the Sent', reflectionMeta:'10 reflection questions', open:true},
  'lesson-3': {num:'03', label:'Lesson 3', dateShort:'July 2', dateLong:'July 2, 2026', title:'The Making of a Minister', text:'1 Timothy 4:12-16 · 2 Timothy 1, 2, 4', slides:'15 Slides', tagline:'The making of a minister is the making of a safe vessel for holy work.', reflectionTitle:'The Making of a Minister', reflectionMeta:'13 reflection questions', open:true},
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
  const ac=document.getElementById('mo-access-code'); if(ac) ac.classList.toggle('on', !isAdm);
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
  const hdr=document.getElementById('lesson-verse-bank-title'); if(hdr&&window.LESSON_DATA) hdr.textContent=`${window.LESSON_DATA.label} Verse Bank · KJV/RVR · Tap to push`;
  try{buildBibleBank();}catch(e){}
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
  l2v11:'Mas en cualquier ciudad o aldea donde entréis, informaos quién en ella sea digno, y posad allí hasta que salgáis.',
  l2v12:'Y al entrar en la casa, saludadla.',
  l2v13:'Y si la casa fuere digna, vuestra paz vendrá sobre ella; mas si no fuere digna, vuestra paz se volverá a vosotros.',
  l2v14:'Y si alguno no os recibiere, ni oyere vuestras palabras, salid de aquella casa o ciudad, y sacudid el polvo de vuestros pies.',
  l2v15:'De cierto os digo que en el día del juicio, será más tolerable el castigo para la tierra de Sodoma y de Gomorra, que para aquella ciudad.',
  l2v16:'He aquí, yo os envío como a ovejas en medio de lobos; sed, pues, prudentes como serpientes, y sencillos como palomas.',
};
function getVBSpanish(id){
  if(VB_SPANISH[id]) return VB_SPANISH[id];
  const v=(Array.isArray(VERSE_BANK)?VERSE_BANK:[]).find(x=>x.id===id);
  if(!v) return '';
  if(v.rvr) return v.rvr;
  const map=(Array.isArray(SCRIPTURE_MAP)?SCRIPTURE_MAP:[]).find(x=>(x.ref_en||x.ref)===v.ref || (x.ref_es||'').replace('Mateo','Matthew')===v.ref);
  return map ? (map.text_es||map.rvr||'') : '';
}
function markVBPushed(id){
  document.querySelectorAll('.vb-card').forEach(c=>c.classList.remove('pushed'));
  const card=document.getElementById('vbc-'+id);if(card)card.classList.add('pushed');
}


// ── BIBLE BANK ──
function buildBibleBank(){
  const bookSel=document.getElementById('bb-book');
  const chapSel=document.getElementById('bb-chapter');
  if(!bookSel||!chapSel) return;
  const bank=window.BIBLE_BANK_CURRENT || null;
  const books=bank&&bank.books?Object.keys(bank.books):[];
  bookSel.innerHTML=books.length?books.map(b=>`<option value="${b}">${b}</option>`).join(''):'<option>No Bible bank</option>';
  if(books.length){
    const current=bookSel.dataset.current && books.includes(bookSel.dataset.current) ? bookSel.dataset.current : books[0];
    bookSel.value=current;
    buildBibleBankChapters();
  }else{
    chapSel.innerHTML='<option>—</option>';
    const cards=document.getElementById('bible-bank-cards'); if(cards) cards.innerHTML='<div class="bb-card"><div class="bb-text">No chapter bank for this lesson yet.</div></div>';
  }
}
function buildBibleBankChapters(){
  const bookSel=document.getElementById('bb-book');
  const chapSel=document.getElementById('bb-chapter');
  const bank=window.BIBLE_BANK_CURRENT || null;
  if(!bookSel||!chapSel||!bank||!bank.books) return;
  const book=bookSel.value;
  bookSel.dataset.current=book;
  const chapters=bank.books[book]?Object.keys(bank.books[book]):[];
  chapSel.innerHTML=chapters.map(c=>`<option value="${c}">${c}</option>`).join('');
  renderBibleBankChapter();
}
function renderBibleBankChapter(){
  const bookSel=document.getElementById('bb-book');
  const chapSel=document.getElementById('bb-chapter');
  const cards=document.getElementById('bible-bank-cards');
  const bank=window.BIBLE_BANK_CURRENT || null;
  if(!bookSel||!chapSel||!cards||!bank||!bank.books){return;}
  if(!bank.books[bookSel.value] || !bank.books[bookSel.value][chapSel.value]){
    buildBibleBankChapters();
    return;
  }
  const verses=bank.books[bookSel.value][chapSel.value] || [];
  cards.innerHTML=verses.map((row,idx)=>{
    const ref=row[0], kjv=row[1];
    const safeRef=String(ref).replace(/'/g,"&#39;");
    const safeText=String(kjv).replace(/`/g,"'");
    return `<div class="bb-card"><div class="bb-ref">${safeRef}</div><div class="bb-text">${safeText}</div><div class="bb-actions"><button onclick="event.stopPropagation();pushVerseToP1({ref:'${safeRef}',kjv:\`${safeText}\`})">P1</button><button onclick="event.stopPropagation();pushRawScripture({ref_en:'${safeRef}',text_en:\`${safeText}\`,ref_es:'${safeRef.replace('1 Timothy','1 Timoteo').replace('2 Timothy','2 Timoteo')}',text_es:getRvrForRef('${safeRef}')||\`${safeText}\`})">P2</button></div></div>`;
  }).join('');
}
function getRvrForRef(ref){
  const v=(Array.isArray(VERSE_BANK)?VERSE_BANK:[]).find(x=>x.ref===ref);
  if(v && v.rvr) return v.rvr;
  const m=(Array.isArray(SCRIPTURE_MAP)?SCRIPTURE_MAP:[]).find(x=>(x.ref_en||'')===ref || (x.ref_en||'').includes(ref));
  return m ? (m.text_es||'') : '';
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
  if(name==='verses'){try{buildBibleBank();}catch(e){}}
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
  // Projector 2 / scriptures screen is Spanish-primary: RVR main, KJV secondary.
  // Keep this here, not only in later patch blocks, because scripture commands call this lexical function directly.
  document.body.classList.add('p2-live');
  const wait=document.getElementById('sp-wait'); if(wait) wait.classList.add('hidden');
  const content=document.getElementById('sp-content'); if(content) content.style.display='flex';
  const dot=document.getElementById('sp-live-dot'); if(dot) dot.classList.add('live');

  const enRef=sc.ref_en||sc.ref||'';
  const enText=sc.text_en||sc.kjv||'';
  const esRef=sc.ref_es||String(enRef).replace('Matthew','Mateo');
  const esText=sc.text_es||sc.rvr||'';

  const mainRef=document.getElementById('sp-ref-en');
  const mainText=document.getElementById('sp-tx-en');
  const subRef=document.getElementById('sp-ref-es');
  const subText=document.getElementById('sp-tx-es');

  if(mainRef) mainRef.textContent=esText ? esRef : enRef;
  if(mainText) mainText.textContent=esText || enText;
  if(subRef) subRef.textContent=enText ? `${enRef} · KJV` : '';
  if(subText) subText.textContent=enText;
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
    const ac=$('mo-access-code'); if(ac) ac.classList.toggle('on', !isAdm);
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


/* =========================================================
   v47 Online Viewer + Espanol + Date Lesson + Speed Patch
   - Adds /online and /Espanol without touching projector, scriptures, OBS, confidence, mobile, or admin core.
   - Stream source saves globally and per lesson through /api/stream-config.
   - Online current slide renders the same main slide the audience sees.
========================================================= */
(function(){
  const ONLINE_ROUTES=['online','espanol'];
  const STREAM_KEY='tm_online_stream_config_v47';
  const DEFAULT_STREAM={
    status:'starting-soon',
    provider:'youtube',
    embedUrl:'',
    title:'The Ministry Live',
    serviceLabel:'Prayer 7:00 PM · Worship 7:30 PM · Preaching 8:00 PM',
    syncDelaySeconds:0,
    updatedAt:null
  };
  const online={active:false,lang:'en',config:{...DEFAULT_STREAM},slide:(typeof curSlide==='number'?curSlide:0),scripture:null,poll:null,votes:{},selected:{},lastSlideAt:0,lastMsgAt:0};
  window.onlineViewerState=online;

  function $(id){return document.getElementById(id);} 
  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function stripHtml(html){const d=document.createElement('div');d.innerHTML=String(html||'');return (d.textContent||d.innerText||'').replace(/\s+/g,' ').trim();}
  function routeName(){return window.location.pathname.replace(/^\/+|\/+$/g,'').toLowerCase();}
  function isOnlinePath(){return ONLINE_ROUTES.includes(routeName());}
  function isSpanish(){return routeName()==='espanol' || online.lang==='es';}
  function saveLocalConfig(cfg){try{localStorage.setItem(STREAM_KEY,JSON.stringify(cfg));}catch(e){}}
  function loadLocalConfig(){try{return {...DEFAULT_STREAM,...(JSON.parse(localStorage.getItem(STREAM_KEY)||'{}')||{})};}catch(e){return {...DEFAULT_STREAM};}}
  function currentSeriesSlug(){return ((window.SERIES_CONFIG&&window.SERIES_CONFIG.slug)||window.SERIES_SLUG||'the-ministry').toString().trim()||'the-ministry';}
  function currentLessonSlug(){try{return normalizeLessonSlug(window.LESSON_SLUG || requestedLessonSlug() || 'lesson-1');}catch(e){return (window.LESSON_SLUG||'lesson-1').toString().trim()||'lesson-1';}}
  function streamConfigApiUrl(){return `/api/stream-config?series_slug=${encodeURIComponent(currentSeriesSlug())}&lesson_slug=${encodeURIComponent(currentLessonSlug())}`;}
  function localized(en,es){return isSpanish()?es:en;}

  // Cover slide fix. Older lessons used a hardcoded June 18 cover renderer. This keeps the same slide design but uses current lesson metadata.
  const previousRenderSlide=window.renderSlide;
  window.renderSlide=function(s,i){
    if(s && s.t==='cover'){
      const meta=(typeof HOME_LESSON_META!=='undefined' && HOME_LESSON_META[window.LESSON_SLUG]) || {};
      const title=s.title || (window.LESSON_DATA&&window.LESSON_DATA.title) || 'The Ministry';
      const ref=s.ref || (window.LESSON_DATA&&window.LESSON_DATA.text) || 'Matthew 10 Series';
      const date=meta.dateLong || '';
      const d=`data-i="${i}"`;
      return `<div class="slide sl-cover"${d}><div class="sl-cover-bg"></div><div class="sl-cover-ov"></div><div class="sl-cover-body"><div class="sl-cey">${s.eyebrow||'The Ministry'}</div><div class="sl-ct"><span class="tt">THE</span><span class="tm">MINISTRY</span></div><div class="sl-cln">${s.lesson||((window.LESSON_DATA&&window.LESSON_DATA.label)||'Lesson')}</div><div class="sl-cnm">${title}</div><div class="sl-crf">${ref}</div><div class="sl-cft"><div class="sl-cm"><div class="sl-cml">Presenter</div><div class="sl-cmv">Elder Eli Castaneda</div></div>${date?`<div class="sl-cm"><div class="sl-cml">Date</div><div class="sl-cmv">${date}</div></div>`:''}<div class="sl-cm"><div class="sl-cml">Text</div><div class="sl-cmv">${ref}</div></div></div></div></div>`;
    }
    return previousRenderSlide?previousRenderSlide(s,i):'';
  };

  function normalizeEmbed(input){
    let raw=String(input||'').trim();
    if(!raw) return '';
    const iframeSrc=raw.match(/src=["']([^"']+)["']/i); if(iframeSrc) raw=iframeSrc[1];
    raw=raw.replace(/&amp;/g,'&');
    try{
      const u=new URL(raw, window.location.origin);
      const host=u.hostname.replace(/^www\./,'').toLowerCase();
      if(host==='youtu.be'){
        const id=u.pathname.split('/').filter(Boolean)[0];
        return id?`https://www.youtube.com/embed/${id}`:'';
      }
      if(host.includes('youtube.com')){
        if(u.pathname.startsWith('/embed/')) return `https://www.youtube.com${u.pathname}${u.search}`;
        if(u.pathname.startsWith('/live/')){
          const id=u.pathname.split('/').filter(Boolean)[1];
          return id?`https://www.youtube.com/embed/${id}`:'';
        }
        const id=u.searchParams.get('v');
        if(id) return `https://www.youtube.com/embed/${id}`;
      }
      if(u.protocol==='https:') return u.href;
    }catch(e){}
    return raw;
  }
  window.normalizeStreamEmbedUrl=normalizeEmbed;

  function statusLabel(status){
    const en={offline:'Offline',starting:'Starting Soon','starting-soon':'Starting Soon',live:'Live Now',ended:'Ended'};
    const es={offline:'Desconectado',starting:'Comenzando Pronto','starting-soon':'Comenzando Pronto',live:'En Vivo',ended:'Finalizado'};
    const v=String(status||'').toLowerCase();
    return (isSpanish()?es:en)[v] || localized('Starting Soon','Comenzando Pronto');
  }
  function applyOnlineLanguage(){
    const es=isSpanish();
    const set=(id,val)=>{const el=$(id); if(el) el.textContent=val;};
    set('online-brand-main', es?'EL MINISTERIO':'THE MINISTRY');
    const brand=$('online-brand-main'); if(brand && !es) brand.innerHTML='THE <span>MINISTRY</span>'; if(brand && es) brand.innerHTML='EL <span>MINISTERIO</span>';
    set('online-brand-sub', es?'Una serie de Mateo capítulo 10':'A Matthew Chapter 10 Series');
    set('online-home-btn', es?'Inicio':'Home');
    set('online-scripture-label', es?'Escritura Actual':'Current Scripture');
    set('online-poll-label', es?'Encuesta en Vivo':'Live Poll');
    set('online-slide-label', es?'Diapositiva Actual':'Current Slide');
    set('online-respond-label', es?'Responder':'Respond');
    set('online-ask-btn', es?'Pregunta':'Ask Question');
    set('online-prayer-btn', es?'Oración':'Prayer');
    set('online-study-btn', es?'Estudio Bíblico':'Bible Study');
    set('online-notes-btn', es?'Notas':'Notes');
    set('online-flow-label', es?'Orden del Servicio':'Service Flow');
    set('online-flow-prayer', es?'Oración':'Prayer');
    set('online-flow-worship', es?'Alabanza':'Worship');
    set('online-flow-preaching', es?'Predicación':'Preaching');
    set('online-flow-response', es?'Oración / Respuesta':'Prayer / Response');
    set('online-full-btn', es?'Pantalla Completa':'Fullscreen');
    set('online-placeholder-sub', es?'La transmisión aparecerá aquí.':'The video source will appear here.');
    const ph=$('online-placeholder-title'); if(ph) ph.innerHTML=es?'Comenzando <span>Pronto</span>':'Starting <span>Soon</span>';
    const footer=$('online-footer-note'); if(footer) footer.textContent=es?'theministry.vercel.app/Espanol':'theministry.vercel.app/online';
    const enBtn=$('online-lang-en'), esBtn=$('online-lang-es');
    if(enBtn) enBtn.classList.toggle('active',!es);
    if(esBtn) esBtn.classList.toggle('active',es);
  }
  function applyOnlineConfig(cfg){
    online.config={...DEFAULT_STREAM,...loadLocalConfig(),...(cfg||{})};
    if(cfg) saveLocalConfig(online.config);
    renderOnlineConfig();
  }
  function renderOnlineConfig(){
    applyOnlineLanguage();
    const c=online.config||DEFAULT_STREAM;
    const status=statusLabel(c.status);
    const st=$('online-status-label'); if(st) st.textContent=status;
    const title=$('online-title'); if(title) title.textContent=isSpanish()?(c.title||'El Ministerio En Vivo'):(c.title||'The Ministry Live');
    const meta=$('online-service-meta'); if(meta) meta.textContent=c.serviceLabel||DEFAULT_STREAM.serviceLabel;
    const provider=$('online-provider-label'); if(provider) provider.textContent=(c.provider||'youtube').toUpperCase();
    const tag=$('online-video-tag'); if(tag) tag.textContent=String(c.status).toLowerCase()==='live'?localized('Live Stream','Transmisión en Vivo'):status;
    const frame=$('online-video-frame'); if(!frame) return;
    const src=normalizeEmbed(c.embedUrl);
    const old=$('online-stream-iframe'); if(old && old.dataset.src!==src) old.remove();
    const ph=$('online-video-placeholder');
    if(src){
      if(ph) ph.style.display='none';
      if(!$('online-stream-iframe')){
        const iframe=document.createElement('iframe');
        iframe.id='online-stream-iframe';
        iframe.dataset.src=src;
        iframe.src=src;
        iframe.title='The Ministry live stream';
        iframe.loading='eager';
        iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen=true;
        frame.appendChild(iframe);
      }
    }else if(ph){
      ph.style.display='flex';
    }
  }
  function slideLabel(s){
    if(!s) return {type:'Waiting',title:'The Ministry',ref:'Matthew 10 Series'};
    if(s.t==='cover') return {type:'Cover',title:s.title||'The Ministry',ref:s.ref||'Matthew 10 Series'};
    if(s.t==='sc') return {type:'Scripture',title:s.ref||'Scripture',ref:stripHtml(s.text||'')};
    if(s.t==='te') return {type:'Teaching',title:stripHtml(s.hl||'Teaching'),ref:s.ref||''};
    if(s.t==='big') return {type:'Statement',title:stripHtml(s.text||'Statement'),ref:s.ref||''};
    if(s.t==='names') return {type:'Names',title:stripHtml(s.hl||'Names'),ref:s.sub||''};
    if(s.t==='final') return {type:'Closing',title:stripHtml(s.text||'Closing'),ref:s.ref||''};
    return {type:s.t||'Slide',title:'The Ministry',ref:''};
  }
  function renderOnlineSlide(){
    const box=$('online-current-slide'); if(!box) return;
    const slides=(typeof LESSON1_SLIDES!=='undefined'?LESSON1_SLIDES:(window.LESSON1_SLIDES||[]));
    const max=Math.max(0,slides.length-1);
    const i=Math.max(0,Math.min(Number(online.slide)||0,max));
    const s=slides[i];
    try{
      if(typeof window.renderSlide==='function' && s){
        box.innerHTML=window.renderSlide(s,i);
        const sl=box.querySelector('.slide'); if(sl) sl.classList.add('on');
        return;
      }
    }catch(e){console.warn('online slide render failed',e);}
    const lbl=slideLabel(s);
    box.innerHTML=`<div class="online-slide-fallback">${esc(lbl.title).replace(/MINISTRY/gi,'<span>MINISTRY</span>')}</div>`;
  }
  function normalizeScripture(sc){
    if(!sc) return null;
    if(isSpanish()){
      return {ref:sc.ref_es||String(sc.ref_en||sc.ref||'').replace(/Matthew/g,'Mateo').replace(/Timothy/g,'Timoteo'), text:sc.text_es||sc.rvr||sc.text_en||sc.kjv||sc.text||''};
    }
    return {ref:sc.ref_en||sc.ref||sc.ref_es||'', text:sc.text_en||sc.kjv||sc.text||sc.text_es||sc.rvr||''};
  }
  function renderOnlineScripture(){
    const maps=(typeof SCRIPTURE_MAP!=='undefined'?SCRIPTURE_MAP:(window.SCRIPTURE_MAP||[]));
    const slideSc=maps[online.slide];
    const sc=normalizeScripture(online.scripture)||normalizeScripture(slideSc);
    const ref=$('online-scripture-ref');
    const tx=$('online-scripture-text');
    if(ref) ref.textContent=(sc&&sc.ref)||localized('Matthew 10:1','Mateo 10:1');
    if(tx) tx.textContent=(sc&&stripHtml(sc.text))||localized('Waiting for the next scripture cue.','Esperando la próxima escritura.');
  }
  function pollVotes(id){return (online.votes&&online.votes[id]) || ((window.pollState&&window.pollState.responses&&window.pollState.responses[id])||[]);}
  function renderOnlinePoll(){
    const box=$('online-poll-content'); if(!box) return;
    const poll=online.poll || (window.pollState&&window.pollState.active);
    if(!poll){ box.innerHTML=`<div class="online-empty">${localized('No active poll yet.','No hay encuesta activa.')}</div>`; return; }
    const votes=pollVotes(poll.id);
    const total=votes.length;
    const tally={}; (poll.options||[]).forEach(o=>tally[String(o).trim()]=0);
    votes.forEach(v=>{const k=String(v.answer||'').trim(); tally[k]=(tally[k]||0)+1;});
    const selected=online.selected[poll.id] || '';
    box.innerHTML=`<div class="online-poll-question">${esc(poll.question)}</div><div class="online-poll-options">${(poll.options||[]).map(o=>{
      const k=String(o).trim(); const n=tally[k]||0; const pct=total?Math.round((n/total)*100):0;
      return `<button class="online-poll-option ${selected===k?'selected':''}" onclick="onlineVote('${esc(k)}')"><span>${esc(k)}</span><span>${selected===k?'✓':(total?pct+'%':'')}</span></button><div class="online-poll-result-row"><div>${esc(k)}</div><div>${pct}%</div><div class="online-poll-bar"><div class="online-poll-fill" style="width:${pct}%"></div></div></div>`;
    }).join('')}</div><div class="online-poll-meta">${total} ${localized(total===1?'vote':'votes',total===1?'voto':'votos')}${selected?localized(' · Your answer is saved.',' · Tu respuesta fue guardada.'):''}</div>`;
  }
  window.onlineVote=function(answer){
    const poll=online.poll || (window.pollState&&window.pollState.active); if(!poll||!answer) return;
    online.selected[poll.id]=String(answer).trim();
    const ctx=(typeof window.getAttendeeContext==='function')?window.getAttendeeContext():{name:localStorage.getItem('tm_name')||'Online Viewer',session_id:localStorage.getItem('tm_session_id')||''};
    const vote={id:'vote-'+Date.now()+'-'+Math.random().toString(16).slice(2,6),pollId:poll.id,answer:String(answer).trim(),anonymous:true,name:'Anonymous',attendee_id:ctx.attendee_id,session_id:ctx.session_id,email_hash:ctx.email_hash,ts:new Date().toISOString()};
    online.votes[poll.id]=online.votes[poll.id]||[];
    const existing=online.votes[poll.id].findIndex(v=>(ctx.session_id && v.session_id===ctx.session_id) || v.id===vote.id);
    if(existing>=0) online.votes[poll.id][existing]=vote; else online.votes[poll.id].push(vote);
    try{ if(typeof window.addPollVote==='function') window.addPollVote(vote); }catch(e){}
    try{fetch('/api/poll-vote-submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vote,question:poll.question,series_slug:'the-ministry',lesson_slug:(window.LESSON_SLUG||'lesson-1')})}).catch(()=>{});}catch(e){}
    try{ if(typeof window.sbSend==='function') window.sbSend({type:'poll_vote',vote,ts:Date.now(),sent_at:Date.now()}); }catch(e){}
    renderOnlinePoll();
  };
  function renderOnlineAll(){renderOnlineConfig();renderOnlineSlide();renderOnlineScripture();renderOnlinePoll();}

  async function fetchOnlineConfig(){
    applyOnlineConfig(loadLocalConfig());
    try{
      const r=await fetch(streamConfigApiUrl(),{cache:'no-store'});
      if(!r.ok) return;
      const data=await r.json();
      if(data&&data.config) applyOnlineConfig({
        status:data.config.status,
        provider:data.config.provider,
        embedUrl:data.config.embed_url || data.config.embedUrl || '',
        title:data.config.title,
        serviceLabel:data.config.service_label || data.config.serviceLabel,
        syncDelaySeconds:data.config.sync_delay_seconds ?? data.config.syncDelaySeconds,
        updatedAt:data.config.updated_at || data.config.updatedAt
      });
    }catch(e){console.warn('online stream config fetch failed',e);}
  }
  async function hydrateCurrentSyncState(){
    try{
      await loadSupabasePublicConfig();
      if(!window.SB_URL||!window.SB_KEY) return;
      const r=await fetch(window.SB_URL+'/rest/v1/sync_state?id=eq.1&select=payload,updated_at&limit=1',{headers:{apikey:window.SB_KEY,Authorization:'Bearer '+window.SB_KEY},cache:'no-store'});
      if(!r.ok) return;
      const rows=await r.json();
      const row=Array.isArray(rows)?rows[0]:null;
      if(!row||!row.payload) return;
      const msg=typeof row.payload==='string'?JSON.parse(row.payload):row.payload;
      if(msg&&msg.type) handleOnlineMessage(msg,true);
    }catch(e){console.warn('online state hydrate failed',e);}
  }
  async function saveStreamConfigFromAdmin(){
    const embed=normalizeEmbed(($('stream-embed-url')||{}).value||'');
    const status=(($('stream-status')||{}).value||'starting-soon');
    const delay=Math.max(0,Number((($('stream-sync-delay')||{}).value||0))||0);
    const title=(($('stream-title')||{}).value||'The Ministry Live').trim();
    const serviceLabel=(($('stream-service-label')||{}).value||DEFAULT_STREAM.serviceLabel).trim();
    const provider=(embed.includes('youtube')?'youtube':'custom');
    const cfg={series_slug:currentSeriesSlug(),lesson_slug:currentLessonSlug(),status,provider,embedUrl:embed,title,serviceLabel,syncDelaySeconds:delay,updatedAt:new Date().toISOString()};
    applyOnlineConfig(cfg);
    const msg=$('stream-admin-status'); if(msg) msg.textContent='Saving stream source...';
    try{
      const r=await fetch(streamConfigApiUrl(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cfg)}).catch(()=>null);
      if(typeof window.sbSend==='function') window.sbSend({type:'stream_config',config:cfg,ts:Date.now(),sent_at:Date.now()});
      if(msg) msg.textContent=(r&&r.ok)?'Saved everywhere: global fallback + current lesson.':'Saved locally. API save did not confirm.';
    }catch(e){ if(msg) msg.textContent='Saved locally. API save failed.'; console.warn(e); }
  }
  window.saveStreamConfigFromAdmin=saveStreamConfigFromAdmin;

  function ensureStreamAdminPanel(){
    const right=document.querySelector('#admin-hub .ctrl-right [style*="overflow-y"]') || document.querySelector('#admin-hub .ctrl-right');
    if(!right || $('stream-admin-panel')) return;
    const cfg=loadLocalConfig();
    const panel=document.createElement('div');
    panel.id='stream-admin-panel';
    panel.className='stream-admin-panel';
    panel.innerHTML=`<div class="ctrl-ag-lbl">Online Stream</div>
      <textarea id="stream-embed-url" placeholder="Paste YouTube scheduled live URL, embed URL, or iframe code">${esc(cfg.embedUrl||'')}</textarea>
      <div class="stream-admin-row">
        <select id="stream-status"><option value="offline">Offline</option><option value="starting-soon">Starting Soon</option><option value="live">Live</option><option value="ended">Ended</option></select>
        <input id="stream-sync-delay" type="number" min="0" step="1" value="${Number(cfg.syncDelaySeconds)||0}" placeholder="Delay seconds" />
      </div>
      <input id="stream-title" value="${esc(cfg.title||'The Ministry Live')}" placeholder="Stream title" />
      <input id="stream-service-label" value="${esc(cfg.serviceLabel||DEFAULT_STREAM.serviceLabel)}" placeholder="Service label" />
      <div class="stream-admin-actions"><button class="ctrl-ab red-btn" onclick="saveStreamConfigFromAdmin()">Save Stream</button><button class="ctrl-ab" onclick="window.open('/online?lesson='+encodeURIComponent((window.LESSON_SLUG||'lesson-1')),'_blank')">Open /online</button><button class="ctrl-ab" onclick="window.open('/Espanol?lesson='+encodeURIComponent((window.LESSON_SLUG||'lesson-1')),'_blank')">Open /Espanol</button></div>
      <div class="stream-admin-status" id="stream-admin-status">Scheduled YouTube live source saves globally and to this lesson. Set delay to 0 for fastest sync.</div>`;
    right.insertBefore(panel,right.firstChild);
    const st=$('stream-status'); if(st) st.value=cfg.status||'starting-soon';
    fetchOnlineConfig().then(()=>{
      const fresh=loadLocalConfig();
      if($('stream-embed-url')) $('stream-embed-url').value=fresh.embedUrl||'';
      if($('stream-status')) $('stream-status').value=fresh.status||'starting-soon';
      if($('stream-sync-delay')) $('stream-sync-delay').value=Number(fresh.syncDelaySeconds)||0;
      if($('stream-title')) $('stream-title').value=fresh.title||'The Ministry Live';
      if($('stream-service-label')) $('stream-service-label').value=fresh.serviceLabel||DEFAULT_STREAM.serviceLabel;
    });
  }

  function ensureOnlineLoginOptions(){
    const modalBox=document.querySelector('#modal .mo-box'); if(!modalBox) return;
    if(!$('mo-online-row')){
      const row=document.createElement('label'); row.id='mo-online-row'; row.className='mo-online-row';
      row.innerHTML='<input id="mo-online" type="checkbox" /> Watching online';
      const err=$('mo-err'); if(err) err.parentNode.insertBefore(row,err); else modalBox.appendChild(row);
    }
    if(!$('mo-espanol-row')){
      const row=document.createElement('label'); row.id='mo-espanol-row'; row.className='mo-online-row';
      row.innerHTML='<input id="mo-espanol" type="checkbox" /> Español';
      const err=$('mo-err'); if(err) err.parentNode.insertBefore(row,err); else modalBox.appendChild(row);
    }
  }
  const oldShowModal=window.showModal;
  window.showModal=function(t){
    if(oldShowModal) oldShowModal(t);
    ensureOnlineLoginOptions();
    const show=t!=='admin';
    const onlineRow=$('mo-online-row'), esRow=$('mo-espanol-row');
    if(onlineRow) onlineRow.classList.toggle('on',show);
    if(esRow) esRow.classList.toggle('on',show);
  };
  const oldCheckPw=window.checkPw;
  window.checkPw=async function(){
    const wantsOnline=!!(($('mo-online')||{}).checked);
    const wantsSpanish=!!(($('mo-espanol')||{}).checked);
    const r=oldCheckPw?await oldCheckPw():undefined;
    const err=$('mo-err');
    const ok=localStorage.getItem('tm_u')==='1' && !(err&&err.classList.contains('on'));
    if(ok && (wantsOnline || wantsSpanish)){
      localStorage.setItem('tm_online_viewer','1');
      let path='/online';
      let extra='';
      if(wantsSpanish && wantsOnline){ path='/Espanol'; extra='&online=1'; }
      else if(wantsSpanish){ path='/Espanol'; }
      window.location.href=path+'?lesson='+encodeURIComponent((window.LESSON_SLUG||'lesson-1'))+extra;
      return;
    }
    return r;
  };

  function enterOnline(){
    online.active=true;
    online.lang=routeName()==='espanol'?'es':'en';
    online.slide=(typeof curSlide==='number'?curSlide:0);
    document.body.classList.add('online-viewer-mode');
    document.body.classList.remove('audience-slave');
    ['sc','sh','ssl','admin-hub','questionnaire'].forEach(id=>{const el=$(id); if(el) el.classList.remove('on');});
    const el=$('online-viewer'); if(el) el.classList.add('on');
    try{ if(typeof window.initBC==='function') window.initBC(); }catch(e){}
    fetchOnlineConfig().then(()=>hydrateCurrentSyncState());
    renderOnlineAll();
  }
  window.enterOnlineViewer=enterOnline;

  function messageTime(msg){return Number(msg.sent_at||msg.ts||0)||Date.now();}
  function applyLessonFromMessage(msg){
    if(msg&&msg.lesson && msg.lesson!==window.LESSON_SLUG){
      try{applyIncomingLesson(msg.lesson,Number.isFinite(+msg.slide)?+msg.slide:online.slide);}catch(e){}
    }
  }
  function delayFor(msg,hydrating){
    if(hydrating) return 0;
    if(msg && msg.fast) return 0;
    return Math.max(0,Number((online.config||{}).syncDelaySeconds)||0)*1000;
  }
  function handleOnlineMessage(msg,hydrating=false){
    if(!msg||!msg.type) return false;
    applyLessonFromMessage(msg);
    if(msg.type==='lesson_select'){
      try{selectLesson(msg.lesson||'lesson-1',false);}catch(e){}
      online.slide=Math.max(0,Number(msg.slide)||0);
      online.scripture=null; renderOnlineSlide(); renderOnlineScripture(); return true;
    }
    if(msg.type==='stream_config'){
      applyOnlineConfig(msg.config||{}); return true;
    }
    if(msg.type==='slide'){
      const t=messageTime(msg);
      if(t<online.lastSlideAt) return true;
      online.lastSlideAt=t;
      const wait=delayFor(msg,hydrating);
      setTimeout(()=>{online.slide=Math.max(0,Number(msg.slide)||0); online.scripture=null; renderOnlineSlide(); renderOnlineScripture();},wait);
      return true;
    }
    if(msg.type==='scripture'){
      const wait=delayFor(msg,hydrating);
      setTimeout(()=>{online.scripture=msg.scripture||null; renderOnlineScripture();},wait);
      return true;
    }
    if(msg.type==='scripture_clear'){
      online.scripture=null; renderOnlineScripture(); return true;
    }
    if(msg.type==='poll_open'){
      online.poll={...(msg.poll||{}),options:Array.isArray((msg.poll||{}).options)?msg.poll.options:[]};
      if(online.poll.id) online.votes[online.poll.id]=online.votes[online.poll.id]||[];
      renderOnlinePoll();
      const ps=$('poll-screen'); if(ps) ps.classList.remove('on');
      return true;
    }
    if(msg.type==='poll_close'){
      online.poll=null; renderOnlinePoll();
      const ps=$('poll-screen'); if(ps) ps.classList.remove('on');
      return true;
    }
    if(msg.type==='poll_vote'){
      const v=msg.vote||{}; if(v.pollId){ online.votes[v.pollId]=online.votes[v.pollId]||[]; if(!online.votes[v.pollId].some(x=>x.id===v.id)) online.votes[v.pollId].push(v); }
      renderOnlinePoll(); return true;
    }
    if(msg.type==='panic_clear'){
      online.scripture=null; online.poll=null; renderOnlineScripture(); renderOnlinePoll(); return true;
    }
    return false;
  }
  window.handleOnlineMessage=handleOnlineMessage;

  const oldHandleMessage=window.handleMessage;
  window.handleMessage=function(msg){
    if(online.active || document.body.classList.contains('online-viewer-mode')){
      if(handleOnlineMessage(msg)) return;
    }
    return oldHandleMessage?oldHandleMessage(msg):undefined;
  };

  window.onlineRequestFullscreen=function(){
    const el=$('online-video-card') || $('online-video-frame');
    try{ if(el && el.requestFullscreen) el.requestFullscreen(); }catch(e){}
  };
  window.onlineResponse=function(type){
    const label=type==='prayer'?localized('Prayer request','Petición de oración'):type==='bible-study'?localized('Bible study request','Solicitud de estudio bíblico'):localized('Response','Respuesta');
    const ta=$('ask-ta'); if(ta) ta.value=`${label}: `;
    if(typeof window.openAskDrawer==='function') window.openAskDrawer();
  };
  window.onlineOpenNotes=function(){
    try{ location.href='/#notes'; }catch(e){}
  };

  const oldBuildCtrl=window.buildCtrlSurface;
  if(oldBuildCtrl){window.buildCtrlSurface=function(){const r=oldBuildCtrl.apply(this,arguments);setTimeout(ensureStreamAdminPanel,0);return r;};}
  const oldShowAdmin=window.showAdminHub;
  if(oldShowAdmin){window.showAdminHub=function(){const r=oldShowAdmin.apply(this,arguments);setTimeout(ensureStreamAdminPanel,0);return r;};}

  document.addEventListener('DOMContentLoaded',()=>{
    ensureOnlineLoginOptions();
    if(isOnlinePath()) setTimeout(enterOnline,0);
    setTimeout(ensureStreamAdminPanel,700);
  });
})();


(function(){
  const route=()=>window.location.pathname.replace(/^\/+|\/+$/g,'').toLowerCase();
  const qs=()=>new URLSearchParams(window.location.search);
  const isSpanishRoute=()=>route()==='espanol';
  const wantsOnlineRoute=()=>route()==='online' || (isSpanishRoute() && /^(1|true|online)$/i.test(qs().get('online')||qs().get('view')||''));
  const setText=(sel,val)=>{const el=document.querySelector(sel); if(el) el.textContent=val;};
  const strip=(html)=>{const d=document.createElement('div');d.innerHTML=String(html||'');return (d.textContent||'').replace(/\s+/g,' ').trim();};
  const clone=o=>JSON.parse(JSON.stringify(o||{}));

  const L3_ES=[
    {t:'cover',eyebrow:'El Ministerio · Lección Complementaria',lesson:'Lección 3',title:'La Formación de un Ministro',ref:'1 Timoteo 4:12-16 · 2 Timoteo'},
    {t:'big',sup:'Idea Principal',text:'Pablo no le dice a Timoteo que construya una <span class="acc">marca.</span>',ref:'1 Timoteo 4:16'},
    {t:'sc',ref:'1 Timoteo 4:16',text:'&ldquo;Ten cuidado de ti mismo y de la doctrina; persiste en ello, pues haciendo esto, te salvarás a ti mismo y a los que te oyeren.&rdquo;',tk:'Pablo no separa al hombre del mensaje.'},
    {t:'te',n:'01',hl:'Cuida la vida que lleva la <span class="acc">doctrina.</span>',pts:['Ten cuidado de ti mismo.','Ten cuidado de la doctrina.','El hombre y el mensaje deben ser vigilados juntos.','<span class="hi">La verdad puede ser mal manejada por un vaso fuera de orden.</span>'],ref:'1 Timoteo 4:16'},
    {t:'big',sup:'Línea de Predicación',text:'Pablo no separa al hombre del mensaje porque el pueblo recibe <span class="acc">ambos.</span>',ref:'1 Timoteo 4:16'},
    {t:'sc',ref:'1 Timoteo 4:12',text:'&ldquo;Ninguno tenga en poco tu juventud, sino sé ejemplo de los creyentes en palabra, conducta, amor, espíritu, fe y pureza.&rdquo;',tk:'El ministro debe llegar a ser ejemplo antes de ser solamente una voz.'},
    {t:'big',sup:'Línea de Predicación',text:'Un ministro no se prueba por <span class="acc">volumen.</span> Se prueba por patrón.',ref:'1 Timoteo 4:12'},
    {t:'te',n:'02',hl:'Aviva el don, pero mantén el vaso <span class="acc">gobernado.</span>',pts:['Un don verdadero todavía puede ser descuidado.','Un llamado verdadero todavía puede estar subdesarrollado.','Que el don venga de Dios no quita la responsabilidad.','<span class="hi">El don es confiado. El vaso debe ser gobernado.</span>'],ref:'1 Timoteo 4:14-15 · 2 Timoteo 1:6'},
    {t:'sc',ref:'2 Timoteo 1:7',text:'&ldquo;Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.&rdquo;',tk:'Poder. Amor. Dominio propio. Esa es la forma de un vaso seguro.'},
    {t:'sc',ref:'2 Timoteo 2:3',text:'&ldquo;Tú, pues, sufre penalidades como buen soldado de Jesucristo.&rdquo;',tk:'La dificultad debe profundizar la obediencia sin deformar el espíritu.'},
    {t:'big',sup:'Línea de Predicación',text:'Un ministro debe aprender incomodidad sin permitir que la incomodidad lo <span class="acc">deforme</span>.',ref:'2 Timoteo 2:3'},
    {t:'sc',ref:'2 Timoteo 2:15',text:'&ldquo;Procura con diligencia presentarte a Dios aprobado, como obrero que no tiene de qué avergonzarse, que usa bien la palabra de verdad.&rdquo;',tk:'La Palabra no es material para pensamientos ingeniosos. Es verdad que debe ser manejada correctamente.'},
    {t:'sc',ref:'2 Timoteo 4:2',text:'&ldquo;Que prediques la palabra; que instes a tiempo y fuera de tiempo; redarguye, reprende, exhorta con toda paciencia y doctrina.&rdquo;',tk:'Predica la Palabra cuando es recibida y cuando es resistida.'},
    {t:'sc',ref:'2 Timoteo 4:7',text:'&ldquo;He peleado la buena batalla, he acabado la carrera, he guardado la fe.&rdquo;',tk:'Pablo no solo le muestra a Timoteo cómo comenzar. Le muestra cómo terminar.'},
    {t:'final',kicker:'Línea de Cierre',text:'La formación de un ministro es la formación de un <span class="acc">vaso seguro</span> para una obra santa.',sub:'Vida. Doctrina. Don. Resistencia. Estudio. Predicación. Terminar.',ref:'2 Timoteo 4:5-7'}
  ];

  function spanishSlide(s,i){
    if(!window.TM_LANG_ES) return s;
    if((window.LESSON_SLUG||'')==='lesson-3' && L3_ES[i]) return L3_ES[i];
    const out=clone(s);
    if(out.lesson) out.lesson=String(out.lesson).replace('Lesson','Lección');
    if(out.eyebrow) out.eyebrow=String(out.eyebrow).replace('The Ministry','El Ministerio').replace('Companion Lesson','Lección Complementaria');
    if(out.ref) out.ref=String(out.ref).replace(/Matthew/g,'Mateo').replace(/Timothy/g,'Timoteo');
    return out;
  }
  window.tmSpanishSlide=spanishSlide;

  const prevRender=window.renderSlide;
  if(prevRender){
    window.renderSlide=function(s,i){ return prevRender.call(this, spanishSlide(s,i), i); };
  }

  function setSpanishMode(on){
    window.TM_LANG_ES=!!on;
    document.body.classList.toggle('tm-spanish-mode',!!on);
    document.documentElement.lang=on?'es':'en';
    if(on){
      if(window.LESSON_DATA){
        if(window.LESSON_SLUG==='lesson-3'){window.LESSON_DATA={...window.LESSON_DATA,label:'Lección 3',title:'La Formación de un Ministro',text:'1 Timoteo 4:12-16 · 2 Timoteo 1, 2, 4'};}
      }
      setText('.sc-over','LLAMADOS CERCA. ENVIADOS LEJOS.');
      const tt=document.querySelector('.sc-title'); if(tt) tt.innerHTML='<span class="tt">EL</span><span class="tm">MINISTERIO</span>';
      setText('.sc-sub','UNA SERIE DE MATEO CAPÍTULO 10');
      setText('.sc-enter','ENTRAR A LA SESIÓN');
      setText('.sc-presenter','PRESENTADOR');
      setText('.hub-nav a[href="#slides"]','DIAPOSITIVAS');
      setText('.hub-nav a[href="#reflect"]','REFLEXIONAR');
      setText('.hub-nav a[href="#ask"]','PREGUNTAR');
    }
    try{if(typeof buildSlides==='function'){buildSlides(document.getElementById('ss-slides'),LESSON1_SLIDES);renderDots(LESSON1_SLIDES.length);goTo(Math.max(0,Math.min(curSlide||0,LESSON1_SLIDES.length-1)));}}catch(e){}
  }
  window.setSpanishUserMode=setSpanishMode;

  function enterSpanishUser(){
    setSpanishMode(true);
    document.body.classList.remove('online-viewer-mode');
    const ov=document.getElementById('online-viewer'); if(ov) ov.classList.remove('on');
    ['ssl','admin-hub','questionnaire'].forEach(id=>{const el=document.getElementById(id); if(el) el.classList.remove('on');});
    try{localStorage.setItem('tm_u','1');}catch(e){}
    if(typeof showHub==='function') showHub(); else {const sc=document.getElementById('sc'); if(sc) sc.classList.add('on');}
  }

  function patchLogin(){
    const access=document.getElementById('mo-access-code');
    if(access && !document.getElementById('access-case-note')){
      const note=document.createElement('div'); note.id='access-case-note'; note.className='access-case-note'; note.innerHTML='* access code is <b>all lowercase</b>';
      access.appendChild(note);
    }
    const old=window.checkPw;
    if(old && !old.__v48){
      const wrapped=async function(){
        const wantsOnline=!!((document.getElementById('mo-online')||{}).checked);
        const wantsSpanish=!!((document.getElementById('mo-espanol')||{}).checked);
        const r=await old.apply(this,arguments);
        const err=document.getElementById('mo-err');
        const ok=localStorage.getItem('tm_u')==='1' && !(err&&err.classList.contains('on'));
        if(ok && wantsSpanish && !wantsOnline){
          window.location.href='/Espanol?lesson='+encodeURIComponent(window.LESSON_SLUG||'lesson-1');
          return r;
        }
        if(ok && wantsSpanish && wantsOnline){
          window.location.href='/Espanol?online=1&lesson='+encodeURIComponent(window.LESSON_SLUG||'lesson-1');
          return r;
        }
        return r;
      };
      wrapped.__v48=true; window.checkPw=wrapped;
    }
  }

  function moveOnlineCards(){
    const main=document.querySelector('.online-main-column'); const side=document.querySelector('.online-side-column');
    if(!main||!side) return;
    let lower=document.getElementById('online-lower-card');
    if(!lower){
      lower=document.createElement('section'); lower.id='online-lower-card'; lower.className='online-lower-card';
      lower.innerHTML='<div class="online-lower-kicker" id="online-lower-kicker">Lower Third</div><div class="online-lower-title" id="online-lower-title">Waiting for slide cue.</div><div class="online-lower-ref" id="online-lower-ref">The live presentation details will appear here.</div><a class="online-watch-again" id="online-watch-again" target="_blank" rel="noopener">Watch Again</a>';
    }
    const video=document.getElementById('online-video-card'); if(video && video.parentNode===main && lower.parentNode!==main) video.insertAdjacentElement('afterend',lower);
    const slideCard=Array.from(document.querySelectorAll('.online-card')).find(c=>c.querySelector('#online-current-slide'));
    if(slideCard){slideCard.dataset.movedSlide='1'; if(slideCard.parentNode!==main) main.insertBefore(slideCard, lower.nextSibling);}
    const response=Array.from(document.querySelectorAll('.online-card')).find(c=>c.querySelector('#online-respond-label'));
    if(response) response.dataset.responseCard='1';
  }

  function renderLowerThird(){
    const slides=window.LESSON1_SLIDES||LESSON1_SLIDES||[]; const i=Math.max(0,Math.min(Number((window.onlineViewerState&&window.onlineViewerState.slide)||window.curSlide||0),slides.length-1));
    const s=spanishSlide(slides[i],i)||{};
    const type=s.sup||s.kicker||s.eyebrow||s.t||'Slide';
    const title=strip(s.hl||s.title||s.text||s.ref||'The Ministry');
    const ref=strip(s.ref||s.tk||((window.LESSON_DATA||{}).text)||'');
    setText('#online-lower-kicker', window.TM_LANG_ES?'En Pantalla':'On Screen');
    setText('#online-lower-title', title||'The Ministry');
    setText('#online-lower-ref', ref||'');
    const wa=document.getElementById('online-watch-again');
    const cfg=(window.onlineViewerState&&window.onlineViewerState.config)||{};
    if(wa && cfg.embedUrl && /ended|replay/i.test(String(cfg.status||''))){wa.href=String(cfg.embedUrl).replace('/embed/','/watch?v='); wa.classList.add('on'); wa.textContent=window.TM_LANG_ES?'Ver Otra Vez':'Watch Again';}
    else if(wa){wa.classList.remove('on');}
  }

  const oldEnter=window.enterOnlineViewer;
  if(oldEnter){
    window.enterOnlineViewer=function(){
      if(isSpanishRoute() && !wantsOnlineRoute()){enterSpanishUser(); return;}
      if(isSpanishRoute()) setSpanishMode(true);
      const r=oldEnter.apply(this,arguments);
      setTimeout(()=>{moveOnlineCards(); renderLowerThird(); if(window.TM_LANG_ES && window.onlineViewerState) window.onlineViewerState.lang='es'; if(window.renderOnlineAll) window.renderOnlineAll();},80);
      return r;
    };
  }

  const oldHandleOnline=window.handleOnlineMessage;
  if(oldHandleOnline){
    window.handleOnlineMessage=function(msg,hydrating){
      const r=oldHandleOnline.apply(this,arguments);
      setTimeout(()=>{renderLowerThird();},20);
      return r;
    };
  }

  // If a user goes directly to /Espanol, make it a Spanish participant surface unless online=1/view=online is present.
  document.addEventListener('DOMContentLoaded',()=>{
    patchLogin();
    setTimeout(patchLogin,300);
    if(isSpanishRoute() && !wantsOnlineRoute()){
      setTimeout(enterSpanishUser,30);
    }
    if(wantsOnlineRoute()){
      setTimeout(()=>{if(isSpanishRoute()) setSpanishMode(true); moveOnlineCards(); renderLowerThird();},220);
    }
  });

  // Expose a safe manual function for replay sync later. Real timecode logging should be a v49 feature, not rushed.
  window.tmReplaySyncPlan={ready:false,note:'Next step: record slide cues with video seconds while live, then replay /online with a timed cue track.'};
})();
