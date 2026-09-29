export const BUILTIN_GAME_PACK = {
  id: "bible-showdown-starter",
  title: "Bible Showdown",
  version: 1,
  categories: [
    { id:"apostolic-doctrine", label:"Apostolic Doctrine" },
    { id:"bible-trivia", label:"Bible Trivia" },
    { id:"where-in-the-bible", label:"Where in the Bible?" },
    { id:"finish-the-verse", label:"Finish the Verse" },
    { id:"bible-people", label:"Bible People" },
    { id:"who-said-it", label:"Who Said It?" }
  ],
  questions: [
    {id:"ad100",category:"apostolic-doctrine",points:100,type:"multiple_choice",prompt:"According to Acts 2:38, what name is connected to baptism?",choices:["Jesus Christ","Abraham","Moses","Peter"],correctAnswer:"Jesus Christ",acceptedAnswers:["Jesus Christ","Jesus"],reference:"Acts 2:38",explanation:"Peter commanded baptism in the name of Jesus Christ."},
    {id:"ad200",category:"apostolic-doctrine",points:200,type:"multiple_choice",prompt:"Which verse says that all the fulness of the Godhead dwells bodily in Christ?",choices:["Colossians 2:9","Romans 8:28","Hebrews 11:1","Acts 1:8"],correctAnswer:"Colossians 2:9",acceptedAnswers:["Colossians 2:9","Col 2:9"],reference:"Colossians 2:9",explanation:"Colossians 2:9 states that all the fulness of the Godhead dwells bodily in Christ."},
    {id:"ad300",category:"apostolic-doctrine",points:300,type:"fill_blank",prompt:"Fill in the blank: “I and my Father are ____.”",choices:[],correctAnswer:"one",acceptedAnswers:["one"],reference:"John 10:30",explanation:"Jesus said, “I and my Father are one.”"},
    {id:"ad400",category:"apostolic-doctrine",points:400,type:"multiple_choice",prompt:"Which passage says there is no other name under heaven given among men whereby we must be saved?",choices:["Acts 4:12","Matthew 5:16","Romans 12:2","Psalm 23:1"],correctAnswer:"Acts 4:12",acceptedAnswers:["Acts 4:12"],reference:"Acts 4:12",explanation:"Acts 4:12 centers salvation in the name of Jesus Christ."},
    {id:"ad500",category:"apostolic-doctrine",points:500,type:"fill_blank",prompt:"KJV: “God was manifest in the ____.”",choices:[],correctAnswer:"flesh",acceptedAnswers:["flesh"],reference:"1 Timothy 3:16",explanation:"1 Timothy 3:16 says, “God was manifest in the flesh.”"},

    {id:"bt100",category:"bible-trivia",points:100,type:"multiple_choice",prompt:"What was Jesus’ first recorded miracle in John’s Gospel?",choices:["Water into wine","Feeding 5,000","Walking on water","Healing Bartimaeus"],correctAnswer:"Water into wine",acceptedAnswers:["Water into wine","Turning water into wine"],reference:"John 2:1–11",explanation:"At Cana, Jesus turned water into wine."},
    {id:"bt200",category:"bible-trivia",points:200,type:"multiple_choice",prompt:"Who was chosen to replace Judas among the twelve?",choices:["Matthias","Barnabas","Silas","Stephen"],correctAnswer:"Matthias",acceptedAnswers:["Matthias"],reference:"Acts 1:26",explanation:"The lot fell upon Matthias, and he was numbered with the eleven apostles."},
    {id:"bt300",category:"bible-trivia",points:300,type:"multiple_choice",prompt:"What is the longest chapter in the Bible by verse count?",choices:["Psalm 119","Genesis 1","Matthew 5","Isaiah 53"],correctAnswer:"Psalm 119",acceptedAnswers:["Psalm 119","Psalms 119"],reference:"Psalm 119",explanation:"Psalm 119 contains 176 verses."},
    {id:"bt400",category:"bible-trivia",points:400,type:"multiple_choice",prompt:"Which five books are commonly called the books of Moses?",choices:["Genesis through Deuteronomy","Joshua through 1 Samuel","Matthew through Acts","Job through Song of Solomon"],correctAnswer:"Genesis through Deuteronomy",acceptedAnswers:["Genesis through Deuteronomy","Genesis Exodus Leviticus Numbers Deuteronomy"],reference:"Genesis–Deuteronomy",explanation:"The Pentateuch consists of Genesis, Exodus, Leviticus, Numbers, and Deuteronomy."},
    {id:"bt500",category:"bible-trivia",points:500,type:"fill_blank",prompt:"What is the shortest verse in the KJV?",choices:[],correctAnswer:"Jesus wept.",acceptedAnswers:["Jesus wept","Jesus wept."],reference:"John 11:35",explanation:"John 11:35 reads, “Jesus wept.”"},

    {id:"wb100",category:"where-in-the-bible",points:100,type:"multiple_choice",prompt:"Where do you find the armor of God?",choices:["Ephesians 6","Romans 3","Acts 10","Revelation 2"],correctAnswer:"Ephesians 6",acceptedAnswers:["Ephesians 6","Eph 6"],reference:"Ephesians 6:10–18",explanation:"Paul describes the whole armor of God in Ephesians 6."},
    {id:"wb200",category:"where-in-the-bible",points:200,type:"multiple_choice",prompt:"Where do you find the fruit of the Spirit?",choices:["Galatians 5","Genesis 3","Hebrews 4","James 1"],correctAnswer:"Galatians 5",acceptedAnswers:["Galatians 5","Gal 5"],reference:"Galatians 5:22–23",explanation:"The fruit of the Spirit appears in Galatians 5:22–23."},
    {id:"wb300",category:"where-in-the-bible",points:300,type:"multiple_choice",prompt:"Where is the vision of the valley of dry bones?",choices:["Ezekiel 37","Daniel 6","Isaiah 6","Jeremiah 18"],correctAnswer:"Ezekiel 37",acceptedAnswers:["Ezekiel 37","Eze 37"],reference:"Ezekiel 37",explanation:"Ezekiel 37 records the valley of dry bones."},
    {id:"wb400",category:"where-in-the-bible",points:400,type:"multiple_choice",prompt:"Which chapter is often called the love chapter?",choices:["1 Corinthians 13","Romans 13","John 17","Psalm 51"],correctAnswer:"1 Corinthians 13",acceptedAnswers:["1 Corinthians 13","1 Cor 13"],reference:"1 Corinthians 13",explanation:"1 Corinthians 13 gives Paul’s extended teaching on charity."},
    {id:"wb500",category:"where-in-the-bible",points:500,type:"multiple_choice",prompt:"Which chapter begins with the definition, “Now faith is the substance of things hoped for”?",choices:["Hebrews 11","James 2","Romans 4","Acts 11"],correctAnswer:"Hebrews 11",acceptedAnswers:["Hebrews 11","Heb 11"],reference:"Hebrews 11:1",explanation:"Hebrews 11 opens with this statement about faith."},

    {id:"fv100",category:"finish-the-verse",points:100,type:"fill_blank",prompt:"“I can do all things through Christ which ____ me.”",choices:[],correctAnswer:"strengtheneth",acceptedAnswers:["strengtheneth","strengthens"],reference:"Philippians 4:13",explanation:"KJV: “I can do all things through Christ which strengtheneth me.”"},
    {id:"fv200",category:"finish-the-verse",points:200,type:"multiple_choice",prompt:"“Thy word is a lamp unto my feet, and a ____ unto my path.”",choices:["light","fire","guide","voice"],correctAnswer:"light",acceptedAnswers:["light"],reference:"Psalm 119:105",explanation:"Psalm 119:105 pairs a lamp for the feet with a light for the path."},
    {id:"fv300",category:"finish-the-verse",points:300,type:"fill_blank",prompt:"“Trust in the LORD with all thine heart; and lean not unto thine own ____.”",choices:[],correctAnswer:"understanding",acceptedAnswers:["understanding"],reference:"Proverbs 3:5",explanation:"Proverbs 3:5 warns against leaning on our own understanding."},
    {id:"fv400",category:"finish-the-verse",points:400,type:"multiple_choice",prompt:"Romans 8:28 says all things work together for ____ to them that love God.",choices:["good","success","wealth","comfort"],correctAnswer:"good",acceptedAnswers:["good"],reference:"Romans 8:28",explanation:"The verse says all things work together for good to them that love God."},
    {id:"fv500",category:"finish-the-verse",points:500,type:"fill_blank",prompt:"Isaiah 40:31: “they shall mount up with wings as ____.”",choices:[],correctAnswer:"eagles",acceptedAnswers:["eagles","an eagle"],reference:"Isaiah 40:31",explanation:"Those who wait upon the LORD shall mount up with wings as eagles."},

    {id:"bp100",category:"bible-people",points:100,type:"multiple_choice",prompt:"Who was swallowed by a great fish?",choices:["Jonah","Elijah","Samson","Philip"],correctAnswer:"Jonah",acceptedAnswers:["Jonah"],reference:"Jonah 1:17",explanation:"The LORD prepared a great fish to swallow Jonah."},
    {id:"bp200",category:"bible-people",points:200,type:"multiple_choice",prompt:"Who became king after Saul?",choices:["David","Solomon","Samuel","Jonathan"],correctAnswer:"David",acceptedAnswers:["David"],reference:"2 Samuel 5",explanation:"David became king over Israel after the house of Saul."},
    {id:"bp300",category:"bible-people",points:300,type:"multiple_choice",prompt:"Who was Samuel’s mother?",choices:["Hannah","Ruth","Elizabeth","Miriam"],correctAnswer:"Hannah",acceptedAnswers:["Hannah"],reference:"1 Samuel 1",explanation:"Hannah prayed for a son and dedicated Samuel to the LORD."},
    {id:"bp400",category:"bible-people",points:400,type:"multiple_choice",prompt:"Which apostle explicitly called himself the apostle of the Gentiles?",choices:["Paul","Peter","John","Thomas"],correctAnswer:"Paul",acceptedAnswers:["Paul"],reference:"Romans 11:13",explanation:"Paul writes, “I am the apostle of the Gentiles.”"},
    {id:"bp500",category:"bible-people",points:500,type:"multiple_choice",prompt:"Who interpreted Pharaoh’s dreams about seven years of plenty and seven years of famine?",choices:["Joseph","Daniel","Moses","Aaron"],correctAnswer:"Joseph",acceptedAnswers:["Joseph"],reference:"Genesis 41",explanation:"Joseph interpreted Pharaoh’s dreams and was elevated in Egypt."},

    {id:"ws100",category:"who-said-it",points:100,type:"multiple_choice",prompt:"Who said, “Am I my brother’s keeper?”",choices:["Cain","Abel","Esau","Lamech"],correctAnswer:"Cain",acceptedAnswers:["Cain"],reference:"Genesis 4:9",explanation:"Cain answered God with this question after Abel’s death."},
    {id:"ws200",category:"who-said-it",points:200,type:"multiple_choice",prompt:"Who said, “Here am I; send me”?",choices:["Isaiah","Jeremiah","Ezekiel","Samuel"],correctAnswer:"Isaiah",acceptedAnswers:["Isaiah"],reference:"Isaiah 6:8",explanation:"Isaiah responded to the LORD’s call in Isaiah 6."},
    {id:"ws300",category:"who-said-it",points:300,type:"multiple_choice",prompt:"Who said, “Thou art the Christ, the Son of the living God”?",choices:["Peter","John","Thomas","Andrew"],correctAnswer:"Peter",acceptedAnswers:["Peter","Simon Peter"],reference:"Matthew 16:16",explanation:"Simon Peter made this confession at Caesarea Philippi."},
    {id:"ws400",category:"who-said-it",points:400,type:"multiple_choice",prompt:"Who said, “My Lord and my God” to Jesus?",choices:["Thomas","Philip","Nathanael","James"],correctAnswer:"Thomas",acceptedAnswers:["Thomas"],reference:"John 20:28",explanation:"Thomas answered Jesus, “My Lord and my God.”"},
    {id:"ws500",category:"who-said-it",points:500,type:"multiple_choice",prompt:"Who said, “For me to live is Christ, and to die is gain”?",choices:["Paul","Peter","Stephen","James"],correctAnswer:"Paul",acceptedAnswers:["Paul"],reference:"Philippians 1:21",explanation:"Paul wrote this statement to the Philippians."}
  ],
  final: {
    id:"final-acts",
    category:"The Book of Acts",
    type:"fill_blank",
    prompt:"Name the city where believers were first called Christians.",
    choices:[],
    correctAnswer:"Antioch",
    acceptedAnswers:["Antioch"],
    reference:"Acts 11:26",
    explanation:"The disciples were called Christians first in Antioch."
  }
};