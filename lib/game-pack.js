export const LEGACY_GAME_PACK = {
  id: "bible-battle-starter",
  title: "Bible Battle",
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

export const BUILTIN_GAME_PACK = {
  "id": "bible-battle-classic",
  "title": "Bible Battle · Classic",
  "version": 2,
  "categories": [
    {
      "id": "pentateuch",
      "label": "Pentateuch"
    },
    {
      "id": "kings",
      "label": "Kings"
    },
    {
      "id": "prophets",
      "label": "Prophets"
    },
    {
      "id": "gospels",
      "label": "Gospels"
    },
    {
      "id": "acts",
      "label": "Acts"
    },
    {
      "id": "letters",
      "label": "Letters"
    }
  ],
  "questions": [
    {
      "id": "pentateuch100",
      "category": "pentateuch",
      "points": 100,
      "type": "fill_blank",
      "prompt": "Who built an ark to survive the great flood?",
      "correctAnswer": "Noah",
      "acceptedAnswers": [
        "Noah"
      ],
      "reference": "Genesis 6:13–22",
      "explanation": "God instructed Noah to build the ark.",
      "choices": []
    },
    {
      "id": "pentateuch200",
      "category": "pentateuch",
      "points": 200,
      "type": "fill_blank",
      "prompt": "Who interpreted Pharaoh’s dreams in Egypt?",
      "correctAnswer": "Joseph",
      "acceptedAnswers": [
        "Joseph"
      ],
      "reference": "Genesis 41:15–32",
      "explanation": "Joseph explained that the dreams foretold seven years of plenty followed by seven years of famine.",
      "choices": []
    },
    {
      "id": "pentateuch300",
      "category": "pentateuch",
      "points": 300,
      "type": "fill_blank",
      "prompt": "What animal spoke to Balaam?",
      "correctAnswer": "A donkey",
      "acceptedAnswers": [
        "A donkey",
        "donkey",
        "ass"
      ],
      "reference": "Numbers 22:28",
      "explanation": "The LORD opened the donkey’s mouth. Accept donkey or ass.",
      "choices": []
    },
    {
      "id": "pentateuch400",
      "category": "pentateuch",
      "points": 400,
      "type": "fill_blank",
      "prompt": "What did the Israelites put on their doorposts at the first Passover?",
      "correctAnswer": "Lamb’s blood",
      "acceptedAnswers": [
        "Lamb’s blood",
        "blood",
        "lamb blood",
        "blood of the lamb"
      ],
      "reference": "Exodus 12:7",
      "explanation": "The blood was placed on the two side posts and upper doorpost. Accept blood of the lamb.",
      "choices": []
    },
    {
      "id": "pentateuch500",
      "category": "pentateuch",
      "points": 500,
      "type": "fill_blank",
      "prompt": "Who was chosen to lead Israel after Moses?",
      "correctAnswer": "Joshua",
      "acceptedAnswers": [
        "Joshua"
      ],
      "reference": "Deuteronomy 31:7–8",
      "explanation": "Moses commissioned Joshua to lead the people into the promised land.",
      "choices": []
    },
    {
      "id": "kings100",
      "category": "kings",
      "points": 100,
      "type": "fill_blank",
      "prompt": "Who was the first king of Israel?",
      "correctAnswer": "Saul",
      "acceptedAnswers": [
        "Saul"
      ],
      "reference": "1 Samuel 10:24",
      "explanation": "Samuel presented Saul to the people as their king.",
      "choices": []
    },
    {
      "id": "kings200",
      "category": "kings",
      "points": 200,
      "type": "fill_blank",
      "prompt": "Which king built the first temple in Jerusalem?",
      "correctAnswer": "Solomon",
      "acceptedAnswers": [
        "Solomon"
      ],
      "reference": "1 Kings 6:1",
      "explanation": "Solomon began building the temple in the fourth year of his reign.",
      "choices": []
    },
    {
      "id": "kings300",
      "category": "kings",
      "points": 300,
      "type": "fill_blank",
      "prompt": "Who confronted David with the parable of the ewe lamb?",
      "correctAnswer": "Nathan",
      "acceptedAnswers": [
        "Nathan"
      ],
      "reference": "2 Samuel 12:1–7",
      "explanation": "The prophet Nathan used this parable to confront David.",
      "choices": []
    },
    {
      "id": "kings400",
      "category": "kings",
      "points": 400,
      "type": "fill_blank",
      "prompt": "Which king found the Book of the Law during temple repairs?",
      "correctAnswer": "Josiah",
      "acceptedAnswers": [
        "Josiah"
      ],
      "reference": "2 Kings 22:1–13",
      "explanation": "Hilkiah found the book during Josiah’s reign; it was read to the king.",
      "choices": []
    },
    {
      "id": "kings500",
      "category": "kings",
      "points": 500,
      "type": "fill_blank",
      "prompt": "Who succeeded Solomon as king in Jerusalem?",
      "correctAnswer": "Rehoboam",
      "acceptedAnswers": [
        "Rehoboam"
      ],
      "reference": "1 Kings 11:43",
      "explanation": "Solomon’s son Rehoboam succeeded him.",
      "choices": []
    },
    {
      "id": "prophets100",
      "category": "prophets",
      "points": 100,
      "type": "fill_blank",
      "prompt": "Which prophet was swallowed by a great fish?",
      "correctAnswer": "Jonah",
      "acceptedAnswers": [
        "Jonah"
      ],
      "reference": "Jonah 1:17",
      "explanation": "The LORD prepared a great fish to swallow Jonah.",
      "choices": []
    },
    {
      "id": "prophets200",
      "category": "prophets",
      "points": 200,
      "type": "fill_blank",
      "prompt": "Which prophet called down fire on Mount Carmel?",
      "correctAnswer": "Elijah",
      "acceptedAnswers": [
        "Elijah"
      ],
      "reference": "1 Kings 18:36–39",
      "explanation": "God answered Elijah’s prayer with fire.",
      "choices": []
    },
    {
      "id": "prophets300",
      "category": "prophets",
      "points": 300,
      "type": "fill_blank",
      "prompt": "Which prophet saw a valley of dry bones?",
      "correctAnswer": "Ezekiel",
      "acceptedAnswers": [
        "Ezekiel"
      ],
      "reference": "Ezekiel 37:1–10",
      "explanation": "The dry bones came together in Ezekiel’s vision.",
      "choices": []
    },
    {
      "id": "prophets400",
      "category": "prophets",
      "points": 400,
      "type": "fill_blank",
      "prompt": "Which prophet interpreted the writing on the wall?",
      "correctAnswer": "Daniel",
      "acceptedAnswers": [
        "Daniel"
      ],
      "reference": "Daniel 5:25–28",
      "explanation": "Daniel interpreted the message to King Belshazzar.",
      "choices": []
    },
    {
      "id": "prophets500",
      "category": "prophets",
      "points": 500,
      "type": "fill_blank",
      "prompt": "Which prophet married Gomer?",
      "correctAnswer": "Hosea",
      "acceptedAnswers": [
        "Hosea"
      ],
      "reference": "Hosea 1:2–3",
      "explanation": "Hosea married Gomer, the daughter of Diblaim.",
      "choices": []
    },
    {
      "id": "gospels100",
      "category": "gospels",
      "points": 100,
      "type": "fill_blank",
      "prompt": "In which town was Jesus born?",
      "correctAnswer": "Bethlehem",
      "acceptedAnswers": [
        "Bethlehem"
      ],
      "reference": "Matthew 2:1",
      "explanation": "Jesus was born in Bethlehem of Judaea.",
      "choices": []
    },
    {
      "id": "gospels200",
      "category": "gospels",
      "points": 200,
      "type": "fill_blank",
      "prompt": "Who baptized Jesus in the Jordan River?",
      "correctAnswer": "John the Baptist",
      "acceptedAnswers": [
        "John the Baptist",
        "John"
      ],
      "reference": "Matthew 3:13–17",
      "explanation": "Jesus came to John to be baptized.",
      "choices": []
    },
    {
      "id": "gospels300",
      "category": "gospels",
      "points": 300,
      "type": "fill_blank",
      "prompt": "What was Jesus’ first recorded miracle in John’s Gospel?",
      "correctAnswer": "Turning water into wine",
      "acceptedAnswers": [
        "Turning water into wine",
        "water into wine"
      ],
      "reference": "John 2:1–11",
      "explanation": "Jesus turned water into wine at a wedding in Cana.",
      "choices": []
    },
    {
      "id": "gospels400",
      "category": "gospels",
      "points": 400,
      "type": "fill_blank",
      "prompt": "Who climbed a sycamore tree to see Jesus?",
      "correctAnswer": "Zacchaeus",
      "acceptedAnswers": [
        "Zacchaeus"
      ],
      "reference": "Luke 19:1–5",
      "explanation": "Zacchaeus climbed the tree because he could not see over the crowd.",
      "choices": []
    },
    {
      "id": "gospels500",
      "category": "gospels",
      "points": 500,
      "type": "fill_blank",
      "prompt": "Who asked Pilate for Jesus’ body?",
      "correctAnswer": "Joseph of Arimathea",
      "acceptedAnswers": [
        "Joseph of Arimathea",
        "Joseph"
      ],
      "reference": "Mark 15:43",
      "explanation": "Joseph of Arimathea asked for the body and laid it in a tomb.",
      "choices": []
    },
    {
      "id": "acts100",
      "category": "acts",
      "points": 100,
      "type": "fill_blank",
      "prompt": "Who preached on the day of Pentecost?",
      "correctAnswer": "Peter",
      "acceptedAnswers": [
        "Peter"
      ],
      "reference": "Acts 2:14",
      "explanation": "Peter stood with the eleven and addressed the crowd.",
      "choices": []
    },
    {
      "id": "acts200",
      "category": "acts",
      "points": 200,
      "type": "fill_blank",
      "prompt": "Who was chosen to replace Judas among the twelve?",
      "correctAnswer": "Matthias",
      "acceptedAnswers": [
        "Matthias"
      ],
      "reference": "Acts 1:26",
      "explanation": "The lot fell upon Matthias.",
      "choices": []
    },
    {
      "id": "acts300",
      "category": "acts",
      "points": 300,
      "type": "fill_blank",
      "prompt": "Who explained Isaiah to the Ethiopian official?",
      "correctAnswer": "Philip",
      "acceptedAnswers": [
        "Philip"
      ],
      "reference": "Acts 8:30–35",
      "explanation": "Philip began at that scripture and preached Jesus.",
      "choices": []
    },
    {
      "id": "acts400",
      "category": "acts",
      "points": 400,
      "type": "fill_blank",
      "prompt": "In which city were Paul and Silas imprisoned when an earthquake opened the doors?",
      "correctAnswer": "Philippi",
      "acceptedAnswers": [
        "Philippi"
      ],
      "reference": "Acts 16:12–26",
      "explanation": "The earthquake shook the prison in Philippi.",
      "choices": []
    },
    {
      "id": "acts500",
      "category": "acts",
      "points": 500,
      "type": "fill_blank",
      "prompt": "Who was the Roman centurion visited by Peter?",
      "correctAnswer": "Cornelius",
      "acceptedAnswers": [
        "Cornelius"
      ],
      "reference": "Acts 10:1–5",
      "explanation": "Cornelius lived in Caesarea and sent for Peter.",
      "choices": []
    },
    {
      "id": "letters100",
      "category": "letters",
      "points": 100,
      "type": "fill_blank",
      "prompt": "According to 1 John, “God is” what?",
      "correctAnswer": "Love",
      "acceptedAnswers": [
        "Love"
      ],
      "reference": "1 John 4:8",
      "explanation": "“God is love.”",
      "choices": []
    },
    {
      "id": "letters200",
      "category": "letters",
      "points": 200,
      "type": "fill_blank",
      "prompt": "Which chapter describes the whole armor of God?",
      "correctAnswer": "Ephesians 6",
      "acceptedAnswers": [
        "Ephesians 6"
      ],
      "reference": "Ephesians 6:10–18",
      "explanation": "Paul describes the armor of God in this passage.",
      "choices": []
    },
    {
      "id": "letters300",
      "category": "letters",
      "points": 300,
      "type": "fill_blank",
      "prompt": "Complete the verse: “I can do all things through Christ which ____ me.”",
      "correctAnswer": "Strengtheneth",
      "acceptedAnswers": [
        "Strengtheneth",
        "strengthens"
      ],
      "reference": "Philippians 4:13",
      "explanation": "Accept strengtheneth or strengthens.",
      "choices": []
    },
    {
      "id": "letters400",
      "category": "letters",
      "points": 400,
      "type": "fill_blank",
      "prompt": "Which letter says that faith without works is dead?",
      "correctAnswer": "James",
      "acceptedAnswers": [
        "James"
      ],
      "reference": "James 2:26",
      "explanation": "James compares faith without works to a body without the spirit.",
      "choices": []
    },
    {
      "id": "letters500",
      "category": "letters",
      "points": 500,
      "type": "fill_blank",
      "prompt": "Who is named as the father of Onesimus in the faith?",
      "correctAnswer": "Paul",
      "acceptedAnswers": [
        "Paul"
      ],
      "reference": "Philemon 1:10",
      "explanation": "Paul calls Onesimus his son, whom he begot in his bonds.",
      "choices": []
    }
  ],
  "final": {
    "id": "final-antioch",
    "category": "The Early Church",
    "type": "fill_blank",
    "prompt": "In which city were the disciples first called Christians?",
    "correctAnswer": "Antioch",
    "acceptedAnswers": [
      "Antioch"
    ],
    "reference": "Acts 11:26",
    "explanation": "The disciples were first called Christians in Antioch.",
    "choices": []
  }
};
