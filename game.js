const $ = (selector) => document.querySelector(selector);

const homeScreen = $("#homeScreen");
const roomScreen = $("#roomScreen");
const appTitle = $("#appTitle");
const appSubtitle = $("#appSubtitle");
const languageSelect = $("#languageSelect");
const languageLabel = $("#languageLabel");
const heroTitle = $(".hero h2");
const heroCopy = $(".hero p");
const createForm = $("#createForm");
const codeJoinForm = $("#codeJoinForm");
const joinForm = $("#joinForm");
const createName = $("#createName");
const joinName = $("#joinName");
const roomCodeInput = $("#roomCodeInput");
const playerCount = $("#playerCount");
const botDifficulty = $("#botDifficulty");
const botButton = $("#botButton");
const tutorialButton = $("#tutorialButton");
const tutorialHomePanel = $("#tutorialHomePanel");
const tutorialHomeTitle = $("#tutorialHomeTitle");
const tutorialHomeCopy = $("#tutorialHomeCopy");
const connection = $("#connection");
const roomCodeLabel = $("#roomCodeLabel");
const statusLabel = $("#statusLabel");
const opponents = $("#opponents");
const deckCount = $("#deckCount");
const discard = $("#discard");
const suitIndicator = $("#suitIndicator");
const message = $("#message");
const tutorialPanel = $("#tutorialPanel");
const tutorialTitle = $("#tutorialTitle");
const tutorialText = $("#tutorialText");
const tutorialNextButton = $("#tutorialNextButton");
const turnInfo = $("#turnInfo");
const hand = $("#hand");
const youLabel = $("#youLabel");
const startButton = $("#startButton");
const hostWinButton = $("#hostWinButton");
const giveCardButton = $("#giveCardButton");
const leaveButton = $("#leaveButton");
const drawButton = $("#drawButton");
const undoButton = $("#undoButton");
const finishTurnButton = $("#finishTurnButton");
const copyLinkButton = $("#copyLinkButton");
const sharePanel = $("#sharePanel");
const shareLink = $("#shareLink");
const suitDialog = $("#suitDialog");
const cardPickerDialog = $("#cardPickerDialog");
const cardPickerGrid = $("#cardPickerGrid");
const closeCardPickerButton = $("#closeCardPickerButton");
const winScreen = $("#winScreen");
const winnerTitle = $("#winnerTitle");
const winnerText = $("#winnerText");
const closeWinButton = $("#closeWinButton");
const turnOverlay = $("#turnOverlay");
const chatPanel = $("#chatPanel");
const chatMessages = $("#chatMessages");
const chatForm = $("#chatForm");
const chatInput = $("#chatInput");
const homeRulesTitle = $("#homeRulesTitle");
const homeRulesText = $("#homeRulesText");
const roomRulesTitle = $(".rules summary");
const roomRulesText = roomScreen.querySelector(".rules-body");

let sessionId = localStorage.getItem("pesten-session") || crypto.randomUUID();
localStorage.setItem("pesten-session", sessionId);

let room = getRoomFromUrl();
sessionId = getPlayerFromUrl() || sessionId;
let state = null;
let lastRenderedState = null;
let pollTimer = null;
let suppressNextDrawAnimation = false;
let handledEventId = 0;
let joinRenderedFor = "";
let turnOverlayTimer = null;
let pendingTurnOverlayTimer = null;
let dismissedWinKey = "";
let pendingJackCardId = null;
let botTurnInFlight = false;
let lastBotTurnKey = "";
let language = localStorage.getItem("crazy-eights-language") || "en";
let tutorialStep = 0;
let tutorialBotFirstTurnPending = false;

const translations = {
  en: {
    appTitle: "Crazy Eights Multiplayer",
    appSubtitle: "Local online cards with friends",
    language: "Language",
    connectedNone: "Not connected",
    notInRoom: "Not in room",
    connected: "Connected",
    homeTitle: "Create a room and share the link",
    homeCopy: "Choose how many players can join, create a room, and send the link to your friends. They only enter their name.",
    play: "Play",
    crazyEights: "Crazy Eights",
    yourName: "Your name",
    playerPlaceholder: "Player",
    maxPlayers: "Maximum players",
    players: "players",
    createRoom: "Create room",
    botLevel: "Bot level",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    playBot: "Play against bot",
    tutorialBot: "Start tutorial bot",
    tutorialEyebrow: "Tutorial",
    tutorialHomeTitle: "Learn with a bot",
    tutorialHomeCopy: "A guided game shows the board, the bot's open hand, and what to do next.",
    tutorialTitle: "Tutorial bot",
    tutorialStart: "Click 5 of spades. It matches the 5 on the table.",
    tutorialAfterPlay: "Nice. You played a card. You can undo it, or press Finish turn to let the bot play.",
    tutorialGoAgain: "This card gives another turn. Follow the highlighted card, or finish your turn.",
    tutorialBotTurn: "Watch the bot. Its hand is visible so you can see what it chooses.",
    tutorialDraw: "You cannot play. Draw a card from the deck.",
    tutorialContinue: "Follow the highlighted card, then press Finish turn when you are done.",
    tourNext: "Click to continue",
    tourStartGame: "Start tutorial game",
    tourTable: "This is the table. The card in the middle is the card you must match.",
    tourHand: "This is your hand. Play cards from here when they glow.",
    tourDeck: "This is the draw deck. Click it when you cannot play a card.",
    tourButtons: "Undo takes back cards from your current turn. Finish turn ends your turn.",
    tourBot: "This is the tutorial bot. Only in this tutorial, the bot plays open handed so you can see why it chooses a card.",
    mustDrawYou: "You cannot play. Draw a card.",
    mustDrawYouForced: "You cannot play a {card}. The game will draw {count} cards.",
    mustDrawOther: "{name} cannot play and must draw.",
    mustDrawOtherForced: "{name} cannot stack a {card} and must draw {count} cards.",
    eventDrew: "{name} drew {count} card(s).",
    eventForcedDrew: "{name} was forced to draw {count} card(s).",
    eventTen: "{name} played a 10. Everyone swapped hands.",
    eventJoker: "{name} played a Joker. The next player must stack a Joker or draw 5.",
    eventTwo: "{name} played a 2. The next player must stack a 2 or draw 2.",
    joinCodeTitle: "Join with code",
    joinCodeCopy: "Use the name above and type your friend's room code.",
    roomCode: "Room code",
    joinCode: "Join with code",
    join: "Join",
    invited: "You were invited to a Crazy Eights game.",
    room: "Room",
    status: "Status",
    waiting: "Waiting",
    back: "Back",
    shareLink: "Share this link",
    copyLink: "Copy link",
    copied: "Copied",
    selectLink: "Select link",
    waitingPlayers: "Waiting for players.",
    next: "Next",
    yourHand: "Your hand",
    you: "You",
    hostWin: "Test host wins",
    giveCard: "Give card",
    undo: "Undo",
    finishTurn: "Finish turn",
    startGame: "Start game",
    rulesTitle: "How to play",
    rulesText: `<p><strong>Goal:</strong> be the first player with no cards left.</p><p>On your turn, play a glowing card onto the discard pile. Your card must match the top card by suit or by rank, unless a special card says otherwise.</p><ul><li>If no card glows at the start of your turn, draw one card, then finish your turn.</li><li>If you played a 7 or King and cannot play a follow-up card, draw once. If you still cannot play, draw one more card, then finish your turn.</li><li>Use Undo to take back cards played during your current turn. Press Finish turn when you are done.</li><li>Hover over a card to see its effect.</li></ul>`,
    rulesRoomTitle: "How to play",
    rulesRoomText: `<p><strong>Goal:</strong> be the first player with no cards left.</p><ul><li>Match the top card by suit or rank.</li><li>Draw from the deck if you cannot play.</li><li>Jack lets you choose a suit. Joker can always be played.</li><li>2 makes the next player draw two cards. Jokers add five cards.</li><li>7 and King give you another turn. 8 skips. Ace reverses. 10 rotates hands.</li></ul>`,
    chat: "Chat",
    messages: "Messages",
    chatPlaceholder: "Type a message",
    send: "Send",
    endGame: "Game over",
    won: "Won",
    winnerKnown: "The winner is known.",
    viewTable: "View table",
    chooseSuit: "Choose a suit",
    activeSuit: "Suit",
    hearts: "Hearts",
    diamonds: "Diamonds",
    clubs: "Clubs",
    spades: "Spades",
    chooseCard: "Choose a card",
    pickerCopy: "Only cards still in the draw pile.",
    close: "Close",
    phaseWaiting: "Waiting",
    phasePlaying: "Playing",
    phaseFinished: "Finished",
    shareStart: "Share the link. You can start when at least 2 players have joined.",
    waitHost: "Waiting for the host to start the game.",
    finished: "Game over.",
    wonSuffix: " won.",
    yourTurn: "It is your turn. Play a card or draw.",
    yourStackTurn: "It is your turn. Play a {card}.",
    autoDraw: "You cannot play a {card}. The game will draw {count} cards soon.",
    cannotPlay: "You cannot play. Draw a card.",
    cannotPlayAnymore: "You cannot play anymore. Finish your turn.",
    currentTurn: "{name}'s turn.",
    overlayTurn: "{name}'s turn",
    invitedRoom: "You were invited to room {room}.",
    joinTitle: "Join a room",
    joinCopy: "Enter your name to join this room. The host starts the game when everyone is in.",
    waitingStatus: "{count}/{max} waiting",
    nextLine: "Now: {current} | Next: {next}{swap}",
    waitingNext: "Next: waiting for start",
    finishedLine: "Game over",
    swapText: " | You got cards from {name}",
    swapNotice: "You got cards from {name}.",
    youWon: "You won!",
    winnerTitle: "{name} won!",
    youWonText: "Nice game. You got rid of all your cards.",
    winnerText: "The game is over.",
    disconnectedWinText: "The other players disconnected.",
    cardCount: "{count} cards",
    youSuffix: " (you)",
    bot: "bot",
    connectedWord: "connected",
    offline: "offline",
    watchingBots: "Watching two bots play.",
    defaultPlayer: "Player",
    easyBotName: "Easy Bot",
    mediumBotName: "Medium Bot",
    hardBotName: "Hard Bot",
    tutorialBotName: "Tutorial Bot",
    helpJoker: "Joker: can always be played. The next player must draw 5 unless they stack a Joker.",
    helpTwo: "2: the next player must draw 2 unless they stack another 2.",
    helpSeven: "7: play again before finishing your turn.",
    helpKing: "King: play again before finishing your turn.",
    helpEight: "8: skips the next player. In 2-player mode, you must continue like a 7.",
    helpAce: "Ace: reverses direction. In 2-player mode, you must continue like a 7.",
    helpTen: "10: rotates everyone's hands.",
    helpJack: "Jack: choose the suit for the next player.",
    helpNormal: "No special ability. Match by suit or rank, then finish your turn.",
  },
};

translations.nl = {
  ...translations.en,
  appTitle: "Pesten Multiplayer",
  appSubtitle: "Lokaal online kaarten met vrienden",
  language: "Taal",
  connectedNone: "Niet verbonden",
  notInRoom: "Niet in kamer",
  connected: "Verbonden",
  homeTitle: "Maak een kamer en deel de link",
  homeCopy: "Kies hoeveel spelers mee mogen doen, maak een kamer en stuur de link naar je vrienden. Zij vullen alleen hun naam in.",
  play: "Spelen",
  yourName: "Jouw naam",
  playerPlaceholder: "Speler",
  maxPlayers: "Maximaal aantal spelers",
  players: "spelers",
  createRoom: "Maak kamer",
  botLevel: "Bot niveau",
  easy: "Makkelijk",
  medium: "Gemiddeld",
  hard: "Moeilijk",
  playBot: "Speel tegen bot",
  tutorialBot: "Start tutorial bot",
  tutorialHomeTitle: "Leer met een bot",
  tutorialHomeCopy: "Een begeleid spel laat de tafel, de open hand van de bot en je volgende stap zien.",
  tutorialTitle: "Tutorial bot",
  tutorialStart: "Klik op schoppen 5. Die past op de 5 op tafel.",
  tutorialAfterPlay: "Goed. Je hebt een kaart gelegd. Je kunt ongedaan maken of op Beurt klaar drukken.",
  tutorialGoAgain: "Deze kaart geeft nog een beurt. Volg de gemarkeerde kaart of maak je beurt af.",
  tutorialBotTurn: "Kijk naar de bot. Zijn hand is zichtbaar zodat je ziet wat hij kiest.",
  tutorialDraw: "Je kunt niet spelen. Pak een kaart van de stapel.",
  tutorialContinue: "Volg de gemarkeerde kaart en druk op Beurt klaar als je klaar bent.",
  tourNext: "Klik om verder te gaan",
  tourStartGame: "Start tutorial spel",
  tourTable: "Dit is de tafel. De kaart in het midden is de kaart die je moet matchen.",
  tourHand: "Dit is jouw hand. Speel kaarten vanaf hier als ze oplichten.",
  tourDeck: "Dit is de trekstapel. Klik hier als je geen kaart kunt spelen.",
  tourButtons: "Ongedaan haalt kaarten uit je huidige beurt terug. Beurt klaar eindigt je beurt.",
  tourBot: "Dit is de tutorial bot. Alleen in deze tutorial speelt de bot open zodat je ziet waarom hij een kaart kiest.",
  mustDrawYou: "Je kan niet. Pak een kaart.",
  mustDrawYouForced: "Je kan geen {card} leggen. Het spel pakt {count} kaarten.",
  mustDrawOther: "{name} kan niet en moet pakken.",
  mustDrawOtherForced: "{name} kan geen {card} stapelen en moet {count} kaarten pakken.",
  eventDrew: "{name} pakte {count} kaart(en).",
  eventForcedDrew: "{name} moest {count} kaart(en) pakken.",
  eventTen: "{name} speelde een 10. Iedereen wisselde handen.",
  eventJoker: "{name} speelde een Joker. De volgende speler moet een Joker stapelen of 5 pakken.",
  eventTwo: "{name} speelde een 2. De volgende speler moet een 2 stapelen of 2 pakken.",
  joinCodeTitle: "Meedoen met code",
  joinCodeCopy: "Gebruik de naam hierboven en typ de kamercode van je vriend.",
  roomCode: "Kamercode",
  joinCode: "Doe mee met code",
  join: "Doe mee",
  invited: "Je bent uitgenodigd voor een potje Pesten.",
  room: "Kamer",
  status: "Status",
  waiting: "Wachten",
  back: "Terug",
  shareLink: "Deel deze link",
  copyLink: "Kopieer link",
  copied: "Gekopieerd",
  selectLink: "Selecteer link",
  waitingPlayers: "Wachten op spelers.",
  next: "Volgende",
  yourHand: "Jouw hand",
  you: "Jij",
  hostWin: "Test host wint",
  giveCard: "Geef kaart",
  undo: "Ongedaan",
  finishTurn: "Beurt klaar",
  startGame: "Start spel",
  rulesTitle: "Zo speel je",
  rulesText: `<p><strong>Doel:</strong> raak als eerste al je kaarten kwijt.</p><p>Als je aan de beurt bent, leg je een oplichtende kaart op de aflegstapel. Je kaart moet dezelfde soort of waarde hebben als de bovenste kaart, behalve als een speciale kaart iets anders doet.</p><ul><li>Licht er aan het begin van je beurt niets op, pak dan een kaart en maak daarna je beurt af.</li><li>Heb je een 7 of Heer gelegd en kun je geen vervolgkaart leggen, pak dan een kaart. Kun je daarna nog steeds niet spelen, pak nog een kaart en maak je beurt af.</li><li>Met Ongedaan haal je kaarten uit je huidige beurt terug. Druk op Beurt klaar als je klaar bent.</li><li>Hover over een kaart om te zien wat die doet.</li></ul>`,
  rulesRoomTitle: "Zo speel je",
  rulesRoomText: `<p><strong>Doel:</strong> raak als eerste al je kaarten kwijt.</p><ul><li>Leg dezelfde soort of waarde op de bovenste kaart.</li><li>Pak een kaart als je niet kunt spelen.</li><li>Boer laat je een soort kiezen. Joker mag altijd.</li><li>2 laat de volgende speler twee kaarten pakken. Jokers tellen vijf kaarten erbij.</li><li>7 en Heer geven nog een beurt. 8 slaat over. Aas draait om. 10 wisselt handen.</li></ul>`,
  messages: "Berichten",
  chatPlaceholder: "Typ een bericht",
  send: "Stuur",
  endGame: "Einde spel",
  winnerKnown: "De winnaar is bekend.",
  viewTable: "Bekijk tafel",
  chooseSuit: "Kies een soort",
  activeSuit: "Soort",
  hearts: "Harten",
  diamonds: "Ruiten",
  clubs: "Klaveren",
  spades: "Schoppen",
  chooseCard: "Kies een kaart",
  pickerCopy: "Alleen kaarten die nog in de trekstapel zitten.",
  close: "Sluiten",
  phasePlaying: "Bezig",
  phaseFinished: "Afgelopen",
  shareStart: "Deel de link. Je kunt starten zodra er minstens 2 spelers zijn.",
  waitHost: "Wachten tot de host het spel start.",
  finished: "Spel afgelopen.",
  wonSuffix: " heeft gewonnen.",
  yourTurn: "Jij bent aan de beurt. Leg een kaart of pak.",
  yourStackTurn: "Jij bent aan de beurt. Leg een {card}.",
  autoDraw: "Je kan geen {card} leggen. Het spel pakt zo {count} kaarten.",
  cannotPlay: "Je kan niet. Pak een kaart.",
  cannotPlayAnymore: "Je kan niet meer spelen. Maak je beurt af.",
  currentTurn: "{name} is aan de beurt.",
  overlayTurn: "{name} is aan de beurt",
  invitedRoom: "Je bent uitgenodigd voor kamer {room}.",
  joinTitle: "Meedoen met een kamer",
  joinCopy: "Vul je naam in om met deze kamer mee te doen. De host start het spel zodra iedereen binnen is.",
  waitingStatus: "{count}/{max} wachten",
  nextLine: "Nu: {current} | Volgende: {next}{swap}",
  waitingNext: "Volgende: wacht op start",
  finishedLine: "Spel afgelopen",
  swapText: " | Jij kreeg kaarten van {name}",
  swapNotice: "Jij kreeg kaarten van {name}.",
  youWon: "Jij hebt gewonnen!",
  winnerTitle: "{name} heeft gewonnen!",
  youWonText: "Lekker gespeeld. Je bent al je kaarten kwijt.",
  winnerText: "Het spel is afgelopen.",
  disconnectedWinText: "De andere spelers zijn weg.",
  cardCount: "{count} kaarten",
  youSuffix: " (jij)",
  bot: "bot",
  connectedWord: "verbonden",
  offline: "offline",
};

translations.fr = {
  ...translations.en,
  appTitle: "Crazy Eights multijoueur",
  appSubtitle: "Cartes en ligne local avec des amis",
  language: "Langue",
  connectedNone: "Non connecte",
  connected: "Connecte",
  homeTitle: "Creez une partie et partagez le lien",
  homeCopy: "Choisissez combien de joueurs peuvent rejoindre, creez une partie, puis envoyez le lien a vos amis.",
  play: "Jouer",
  yourName: "Votre nom",
  maxPlayers: "Nombre maximum de joueurs",
  createRoom: "Creer une partie",
  botLevel: "Niveau du bot",
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
  playBot: "Jouer contre le bot",
  tutorialHomeTitle: "Apprendre avec un bot",
  tutorialHomeCopy: "Une partie guidee montre la table, la main ouverte du bot et la prochaine action.",
  joinCodeTitle: "Rejoindre avec un code",
  joinCode: "Rejoindre avec le code",
  back: "Retour",
  copyLink: "Copier le lien",
  rulesTitle: "Regles pour debutants",
  rulesRoomTitle: "Regles de cette version",
  rulesText: `<p><strong>But :</strong> etre le premier joueur sans cartes.</p><ul><li>A votre tour, posez une carte sur la pile.</li><li>La carte doit avoir la meme couleur ou la meme valeur que la carte du dessus.</li><li>Si vous ne pouvez pas jouer, piochez une carte.</li><li>Les cartes speciales peuvent passer un tour, inverser le sens ou faire piocher.</li></ul>`,
  rulesRoomText: `<p><strong>But :</strong> etre le premier joueur sans cartes.</p><ul><li>Posez une carte de meme couleur ou de meme valeur.</li><li>Piochez si vous ne pouvez pas jouer.</li><li>Le valet choisit une couleur. Le joker peut toujours etre joue.</li><li>2 fait piocher deux cartes. Joker ajoute cinq cartes.</li><li>7 et Roi rejouent. 8 passe. As inverse. 10 fait tourner les mains.</li></ul>`,
  chat: "Chat",
  messages: "Messages",
  send: "Envoyer",
  cardCount: "{count} cartes",
  youSuffix: " (vous)",
  connectedWord: "connecte",
  offline: "hors ligne",
};

translations.de = {
  ...translations.en,
  appTitle: "Crazy Eights Mehrspieler",
  appSubtitle: "Lokales Online-Kartenspiel mit Freunden",
  language: "Sprache",
  connectedNone: "Nicht verbunden",
  connected: "Verbunden",
  homeTitle: "Raum erstellen und Link teilen",
  homeCopy: "Wahle, wie viele Spieler beitreten koennen, erstelle einen Raum und sende den Link an deine Freunde.",
  play: "Spielen",
  yourName: "Dein Name",
  maxPlayers: "Maximale Spielerzahl",
  createRoom: "Raum erstellen",
  botLevel: "Bot-Stufe",
  easy: "Leicht",
  medium: "Mittel",
  hard: "Schwer",
  playBot: "Gegen Bot spielen",
  tutorialHomeTitle: "Mit Bot lernen",
  tutorialHomeCopy: "Ein gefuhrtes Spiel zeigt den Tisch, die offene Bot-Hand und den nachsten Schritt.",
  joinCodeTitle: "Mit Code beitreten",
  joinCode: "Mit Code beitreten",
  back: "Zuruck",
  copyLink: "Link kopieren",
  rulesTitle: "Regeln fur neue Spieler",
  rulesRoomTitle: "Regeln in dieser Version",
  rulesText: `<p><strong>Ziel:</strong> werde als Erste/r alle Karten los.</p><ul><li>Wenn du dran bist, legst du eine Karte auf den Ablagestapel.</li><li>Die Karte muss Farbe oder Wert der obersten Karte treffen.</li><li>Wenn du nicht spielen kannst, ziehst du eine Karte.</li><li>Sonderkarten koennen uberspringen, Richtung wechseln oder Karten ziehen lassen.</li></ul>`,
  rulesRoomText: `<p><strong>Ziel:</strong> werde als Erste/r alle Karten los.</p><ul><li>Lege gleiche Farbe oder gleichen Wert.</li><li>Ziehe eine Karte, wenn du nicht spielen kannst.</li><li>Bube wahlt eine Farbe. Joker geht immer.</li><li>2 laesst zwei Karten ziehen. Joker addiert funf Karten.</li><li>7 und Koenig geben noch einen Zug. 8 uberspringt. Ass dreht um. 10 rotiert Haende.</li></ul>`,
  chat: "Chat",
  messages: "Nachrichten",
  send: "Senden",
  cardCount: "{count} Karten",
  youSuffix: " (du)",
  connectedWord: "verbunden",
  offline: "offline",
};

translations.zh = {
  ...translations.en,
  appTitle: "疯狂八点多人版",
  appSubtitle: "和朋友一起本地联机打牌",
  language: "语言",
  connectedNone: "未连接",
  notInRoom: "未进入房间",
  connected: "已连接",
  homeTitle: "创建房间并分享链接",
  homeCopy: "选择最多可加入的玩家人数，创建房间，然后把链接发给朋友。他们只需要输入名字。",
  play: "开始",
  yourName: "你的名字",
  playerPlaceholder: "玩家",
  maxPlayers: "最多玩家",
  players: "名玩家",
  createRoom: "创建房间",
  botLevel: "机器人难度",
  easy: "简单",
  medium: "普通",
  hard: "困难",
  playBot: "对战机器人",
  tutorialBot: "开始教程机器人",
  tutorialEyebrow: "教程",
  tutorialHomeTitle: "和机器人学习",
  tutorialHomeCopy: "教程会介绍牌桌、机器人的明牌手牌，以及下一步该做什么。",
  tutorialTitle: "教程机器人",
  tutorialStart: "点击黑桃 5。它和桌上的 5 点数相同。",
  tutorialAfterPlay: "很好。你出了一张牌。你可以撤销，或点击结束回合让机器人行动。",
  tutorialGoAgain: "这张牌让你继续行动。打出高亮的牌，或完成必要动作后结束回合。",
  tutorialBotTurn: "观察机器人。教程里机器人会明牌，所以你能看到它为什么这样出牌。",
  tutorialDraw: "你不能出牌。请从牌堆摸一张牌。",
  tutorialContinue: "打出高亮的牌，完成后点击结束回合。",
  tourNext: "点击继续",
  tourStartGame: "开始教程游戏",
  tourTable: "这是牌桌。中间的牌就是你要匹配的牌。",
  tourHand: "这是你的手牌。能出的牌会发亮。",
  tourDeck: "这是摸牌堆。没有牌可出时点击这里摸牌。",
  tourButtons: "撤销会收回你本回合出的牌。结束回合会结束你的回合。",
  tourBot: "这是教程机器人。只有在教程里，机器人会明牌，方便你学习它的选择。",
  mustDrawYou: "你不能出牌。请摸一张牌。",
  mustDrawYouForced: "你不能叠 {card}。游戏会帮你摸 {count} 张牌。",
  mustDrawOther: "{name} 不能出牌，必须摸牌。",
  mustDrawOtherForced: "{name} 不能叠 {card}，必须摸 {count} 张牌。",
  eventDrew: "{name} 摸了 {count} 张牌。",
  eventForcedDrew: "{name} 被迫摸了 {count} 张牌。",
  eventTen: "{name} 出了 10。所有人交换手牌。",
  eventJoker: "{name} 出了 Joker。下一位必须叠 Joker 或摸 5 张。",
  eventTwo: "{name} 出了 2。下一位必须叠 2 或摸 2 张。",
  joinCodeTitle: "用代码加入",
  joinCodeCopy: "使用上面的名字，然后输入朋友的房间代码。",
  roomCode: "房间代码",
  joinCode: "加入房间",
  join: "加入",
  invited: "你被邀请加入一局疯狂八点。",
  room: "房间",
  status: "状态",
  waiting: "等待中",
  back: "返回",
  shareLink: "分享这个链接",
  copyLink: "复制链接",
  copied: "已复制",
  selectLink: "选择链接",
  waitingPlayers: "等待玩家加入。",
  next: "下一位",
  yourHand: "你的手牌",
  you: "你",
  hostWin: "测试：房主获胜",
  giveCard: "给一张牌",
  undo: "撤销",
  finishTurn: "结束回合",
  startGame: "开始游戏",
  rulesTitle: "新手规则",
  rulesRoomTitle: "本版本规则",
  rulesText: `<p><strong>目标：</strong>最先出完所有手牌。</p><p>轮到你时，把发亮的牌放到弃牌堆上。你的牌必须和最上面的牌同花色或同点数，除非特殊牌有其他效果。</p><ul><li>如果回合开始时没有牌发亮，摸一张牌，然后结束回合。</li><li>如果你出了 7、K，或在双人模式出了 A、8，却不能继续出牌，先摸一张。如果还是不能出，再摸一张，然后结束回合。</li><li>撤销可以收回本回合出的牌。完成动作后点击结束回合。</li><li>把鼠标放在牌上可以查看它的效果。</li></ul>`,
  rulesRoomText: `<p><strong>目标：</strong>最先出完所有手牌。</p><ul><li>出同花色或同点数的牌。</li><li>不能出牌时就摸牌。</li><li>J 可以选择花色。Joker 随时可以出。</li><li>2 让下一位摸两张。Joker 增加五张。</li><li>7 和 K 必须继续行动。双人模式里 A 和 8 也一样。10 会轮换手牌。</li></ul>`,
  chat: "聊天",
  messages: "消息",
  chatPlaceholder: "输入消息",
  send: "发送",
  endGame: "游戏结束",
  won: "获胜",
  winnerKnown: "胜者已确定。",
  viewTable: "查看牌桌",
  chooseSuit: "选择花色",
  activeSuit: "花色",
  hearts: "红心",
  diamonds: "方块",
  clubs: "梅花",
  spades: "黑桃",
  chooseCard: "选择一张牌",
  pickerCopy: "只显示还在摸牌堆里的牌。",
  close: "关闭",
  phaseWaiting: "等待中",
  phasePlaying: "游戏中",
  phaseFinished: "已结束",
  shareStart: "分享链接。至少 2 名玩家加入后即可开始。",
  waitHost: "等待房主开始游戏。",
  finished: "游戏结束。",
  wonSuffix: " 获胜。",
  yourTurn: "轮到你了。出牌或摸牌。",
  yourStackTurn: "轮到你了。请出一张 {card}。",
  autoDraw: "你不能出 {card}。游戏马上会帮你摸 {count} 张牌。",
  cannotPlay: "你不能出牌。请摸一张牌。",
  cannotPlayAnymore: "你不能继续出牌了。请结束回合。",
  currentTurn: "轮到 {name}。",
  overlayTurn: "轮到 {name}",
  invitedRoom: "你被邀请加入房间 {room}。",
  joinTitle: "加入房间",
  joinCopy: "输入你的名字加入这个房间。所有人进入后，由房主开始游戏。",
  waitingStatus: "{count}/{max} 等待中",
  nextLine: "现在：{current} | 下一位：{next}{swap}",
  waitingNext: "下一位：等待开始",
  finishedLine: "游戏结束",
  swapText: " | 你从 {name} 得到了手牌",
  swapNotice: "你从 {name} 得到了手牌。",
  youWon: "你赢了！",
  winnerTitle: "{name} 赢了！",
  youWonText: "打得好。你已经出完所有手牌。",
  winnerText: "游戏结束了。",
  disconnectedWinText: "其他玩家已断开连接。",
  cardCount: "{count} 张牌",
  youSuffix: "（你）",
  bot: "机器人",
  connectedWord: "已连接",
  offline: "离线",
  watchingBots: "正在观看两个机器人对战。",
  defaultPlayer: "玩家",
  easyBotName: "简单机器人",
  mediumBotName: "普通机器人",
  hardBotName: "困难机器人",
  tutorialBotName: "教程机器人",
  helpJoker: "Joker：随时可以出。下一位必须叠 Joker，否则摸 5 张。",
  helpTwo: "2：下一位必须摸 2 张，除非再叠一张 2。",
  helpSeven: "7：结束回合前必须继续行动。",
  helpKing: "K：结束回合前必须继续行动。",
  helpEight: "8：跳过下一位。双人模式里必须像 7 一样继续行动。",
  helpAce: "A：反转方向。双人模式里必须像 7 一样继续行动。",
  helpTen: "10：所有人轮换手牌。",
  helpJack: "J：为下一位选择花色。",
  helpNormal: "没有特殊能力。匹配花色或点数后结束回合。",
};

const suitSymbols = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const suitNames = {
  hearts: "Harten",
  diamonds: "Ruiten",
  clubs: "Klaveren",
  spades: "Schoppen",
};

suitSymbols.joker = "*";
suitNames.joker = "Joker";
const goAgainRanksClient = new Set(["7", "K", "8"]);
const tutorialTourSteps = [
  { key: "tourTable", point: "table" },
  { key: "tourHand", point: "hand" },
  { key: "tourDeck", point: "deck" },
  { key: "tourButtons", point: "finish" },
  { key: "tourBot", point: "bot" },
];

languageSelect.value = translations[language] ? language : "en";
language = languageSelect.value;
applyLanguage();

languageSelect.addEventListener("change", () => {
  language = languageSelect.value;
  localStorage.setItem("crazy-eights-language", language);
  applyLanguage();
  render();
});

createName.value = localStorage.getItem("pesten-name") || "";
joinName.value = localStorage.getItem("pesten-name") || "";

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = cleanName(createName.value);
  localStorage.setItem("pesten-name", name);
  const result = await api("/api/create", {
    name,
    maxPlayers: Number(playerCount.value),
    sessionId,
  });
  setRoomUrl(result.code, sessionId);
  enterRoom(result.code);
});

botButton.addEventListener("click", async () => {
  const name = cleanName(createName.value);
  localStorage.setItem("pesten-name", name);
  sessionId = crypto.randomUUID();
  const result = await api("/api/create-bot", {
    name,
    difficulty: botDifficulty.value,
    sessionId,
  });
  setRoomUrl(result.code, sessionId);
  enterRoom(result.code);
});

tutorialButton.addEventListener("click", async () => {
  const name = cleanName(createName.value);
  localStorage.setItem("pesten-name", name);
  sessionId = crypto.randomUUID();
  const result = await api("/api/create-tutorial", { name, sessionId });
  setRoomUrl(result.code, sessionId);
  enterRoom(result.code);
});

tutorialNextButton.addEventListener("click", async () => {
  if (!state?.tutorialMode) return;
  if (state.phase === "tutorial" && tutorialStep >= tutorialTourSteps.length - 1) {
    tutorialStep = tutorialTourSteps.length;
    tutorialBotFirstTurnPending = true;
    await sendAction("startTutorial");
    return;
  }
  tutorialStep = Math.min(tutorialStep + 1, tutorialTourSteps.length - 1);
  renderTutorial(state);
});

codeJoinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = cleanName(createName.value);
  const code = cleanRoomCode(roomCodeInput.value);
  if (!code) return;
  localStorage.setItem("pesten-name", name);
  sessionId = crypto.randomUUID();
  try {
    if (code === "BXB2") {
      const result = await api("/api/create-bot-watch", {
        name,
        difficulty: botDifficulty.value,
        sessionId,
      });
      setRoomUrl(result.code, sessionId);
      enterRoom(result.code);
      return;
    }
    setRoomUrl(code, sessionId);
    await api("/api/join", { name, code, sessionId });
    enterRoom(code);
  } catch (error) {
    codeJoinForm.querySelector(".panel-copy").textContent = error.message;
    room = "";
    history.pushState({}, "", "/");
  }
});

roomCodeInput.addEventListener("input", () => {
  roomCodeInput.value = cleanRoomCode(roomCodeInput.value);
});

joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = cleanName(joinName.value);
  localStorage.setItem("pesten-name", name);
  sessionId = crypto.randomUUID();
  setRoomUrl(room, sessionId);
  await api("/api/join", { name, code: room, sessionId });
  poll();
});

startButton.addEventListener("click", () => sendAction("start"));
hostWinButton.addEventListener("click", () => sendAction("hostWin"));
giveCardButton.addEventListener("click", openCardPicker);
drawButton.addEventListener("click", () => sendAction("draw"));
undoButton.addEventListener("click", () => sendAction("undo"));
finishTurnButton.addEventListener("click", () => sendAction("finishTurn"));
closeWinButton.addEventListener("click", () => {
  dismissedWinKey = winKey(state);
  winScreen.classList.add("hidden");
});
closeCardPickerButton.addEventListener("click", () => cardPickerDialog.close());

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  await sendAction("chat", { text });
});

suitDialog.addEventListener("close", () => {
  if (!pendingJackCardId || !suitDialog.returnValue) {
    pendingJackCardId = null;
    return;
  }
  sendAction("play", { cardId: pendingJackCardId, chosenSuit: suitDialog.returnValue });
  pendingJackCardId = null;
});

leaveButton.addEventListener("click", () => {
  room = "";
  state = null;
  history.pushState({}, "", "/");
  render();
});

copyLinkButton.addEventListener("click", async () => {
  const link = roomLink();
  try {
    await navigator.clipboard.writeText(link);
    copyLinkButton.textContent = t("copied");
  } catch {
    copyLinkButton.textContent = t("selectLink");
  }
  setTimeout(() => {
    copyLinkButton.textContent = t("copyLink");
  }, 1400);
});

window.addEventListener("popstate", () => {
  room = getRoomFromUrl();
  state = null;
  poll();
});

function enterRoom(code) {
  room = code;
  state = null;
  lastRenderedState = null;
  handledEventId = 0;
  dismissedWinKey = "";
  tutorialStep = 0;
  tutorialBotFirstTurnPending = false;
  poll();
}

async function poll() {
  clearTimeout(pollTimer);
  if (!room) {
    connection.textContent = t("connectedNone");
    render();
    return;
  }
  if (!getPlayerFromUrl()) {
    connection.textContent = t("notInRoom");
    renderJoin();
    pollTimer = setTimeout(poll, 900);
    return;
  }

  try {
    state = await api(`/api/state?code=${encodeURIComponent(room)}&sessionId=${encodeURIComponent(sessionId)}`);
    connection.textContent = t("connected");
    render();
  } catch (error) {
    connection.textContent = t("notInRoom");
    state = null;
    renderJoin(error.message);
  } finally {
    pollTimer = setTimeout(poll, 900);
  }
}

async function sendAction(type, payload = {}) {
  if (!room) return;
  try {
    state = await api("/api/action", { code: room, sessionId, type, ...payload });
    render();
  } catch (error) {
    message.textContent = error.message;
  }
}

async function api(path, body) {
  const options = body
    ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    : {};
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Er ging iets mis.");
  return data;
}

function t(key, replacements = {}) {
  const text = translations[language]?.[key] ?? translations.en[key] ?? key;
  return Object.entries(replacements).reduce(
    (value, [name, replacement]) => value.replaceAll(`{${name}}`, replacement),
    text
  );
}

function applyLanguage() {
  document.documentElement.lang = language;
  document.title = t("appTitle");
  appTitle.textContent = t("appTitle");
  appSubtitle.textContent = t("appSubtitle");
  languageLabel.textContent = t("language");
  heroTitle.textContent = t("homeTitle");
  heroCopy.textContent = t("homeCopy");

  createForm.querySelector("h3").textContent = t("play");
  setLabelText(createName, t("yourName"));
  createName.placeholder = t("playerPlaceholder");
  setLabelText(playerCount, t("maxPlayers"));
  [...playerCount.options].forEach((option) => {
    option.textContent = `${option.value} ${t("players")}`;
  });
  createForm.querySelector('button[type="submit"]').textContent = t("createRoom");
  setLabelText(botDifficulty, t("botLevel"));
  botDifficulty.options[0].textContent = t("easy");
  botDifficulty.options[1].textContent = t("medium");
  botDifficulty.options[2].textContent = t("hard");
  botButton.textContent = t("playBot");

  codeJoinForm.querySelector("h3").textContent = t("joinCodeTitle");
  codeJoinForm.querySelector(".panel-copy").textContent = t("joinCodeCopy");
  setLabelText(roomCodeInput, t("roomCode"));
  codeJoinForm.querySelector("button").textContent = t("joinCode");

  joinForm.querySelector("h3").textContent = t("join");
  setLabelText(joinName, t("yourName"));
  joinName.placeholder = t("playerPlaceholder");
  joinForm.querySelector("button").textContent = t("join");

  roomScreen.querySelector(".room-head .eyebrow").textContent = t("room");
  roomScreen.querySelectorAll(".room-head .eyebrow")[1].textContent = t("status");
  leaveButton.textContent = t("back");
  sharePanel.querySelector(".eyebrow").textContent = t("shareLink");
  copyLinkButton.textContent = t("copyLink");
  drawButton.title = t("chooseCard");
  message.textContent = t("waitingPlayers");
  document.querySelector(".hand-head .eyebrow").textContent = t("yourHand");
  youLabel.textContent = t("you");
  hostWinButton.textContent = t("hostWin");
  giveCardButton.textContent = t("giveCard");
  undoButton.textContent = t("undo");
  finishTurnButton.textContent = t("finishTurn");
  startButton.textContent = t("startGame");
  homeRulesTitle.textContent = t("rulesTitle");
  homeRulesText.innerHTML = t("rulesText");
  tutorialHomePanel.querySelector(".eyebrow").textContent = t("tutorialEyebrow");
  tutorialHomeTitle.textContent = t("tutorialHomeTitle");
  tutorialHomeCopy.textContent = t("tutorialHomeCopy");
  tutorialButton.textContent = t("tutorialBot");
  roomRulesTitle.textContent = t("rulesRoomTitle");
  roomRulesText.innerHTML = t("rulesRoomText");
  chatPanel.querySelector(".eyebrow").textContent = t("chat");
  chatPanel.querySelector("strong").textContent = t("messages");
  chatInput.placeholder = t("chatPlaceholder");
  chatForm.querySelector("button").textContent = t("send");
  document.querySelector(".win-card .eyebrow").textContent = t("endGame");
  winnerTitle.textContent = t("won");
  winnerText.textContent = t("winnerKnown");
  closeWinButton.textContent = t("viewTable");
  suitDialog.querySelector("h3").textContent = t("chooseSuit");
  suitDialog.querySelectorAll("button")[0].textContent = `${suitSymbols.hearts} ${t("hearts")}`;
  suitDialog.querySelectorAll("button")[1].textContent = `${suitSymbols.diamonds} ${t("diamonds")}`;
  suitDialog.querySelectorAll("button")[2].textContent = `${suitSymbols.clubs} ${t("clubs")}`;
  suitDialog.querySelectorAll("button")[3].textContent = `${suitSymbols.spades} ${t("spades")}`;
  cardPickerDialog.querySelector("h3").textContent = t("chooseCard");
  cardPickerDialog.querySelector(".dialog-copy").textContent = t("pickerCopy");
  closeCardPickerButton.textContent = t("close");
}

function setLabelText(control, text) {
  const label = control.closest("label");
  if (!label) return;
  const node = [...label.childNodes].find((child) => child.nodeType === Node.TEXT_NODE);
  if (node) node.textContent = `\n              ${text}\n              `;
}

function render() {
  const inRoom = Boolean(room && state);
  homeScreen.classList.toggle("hidden", inRoom);
  roomScreen.classList.toggle("hidden", !inRoom);
  joinForm.classList.add("hidden");
  createForm.classList.remove("hidden");
  codeJoinForm.classList.remove("hidden");
  if (!inRoom && !room) renderCreateHome();
  if (!inRoom) return;

  const me = state.players.find((player) => player.isYou);
  const current = state.players.find((player) => player.id === state.currentPlayerId);
  const isMyTurn = me && state.currentPlayerId === me.id && state.phase === "playing";
  const isTutorialTour = state.tutorialMode && state.phase === "tutorial";
  const cannotPlay = isMyTurn && state.playableCardIds.length === 0;
  const mustDraw = isMyTurn && state.mustDrawPlayerId === me?.id;

  roomScreen.classList.toggle("bot-room", Boolean(state.botMode));
  roomScreen.classList.toggle("tutorial-room", Boolean(state.tutorialMode));
  roomCodeLabel.textContent = state.code;
  statusLabel.textContent = state.phase === "waiting" ? t("waitingStatus", { count: state.players.length, max: state.maxPlayers }) : phaseLabel(state.phase);
  youLabel.textContent = me ? displayName(me) : t("you");
  roomCodeLabel.closest("div").hidden = Boolean(state.botMode);
  sharePanel.hidden = Boolean(state.botMode) || !state.isHost || state.phase !== "waiting";
  shareLink.textContent = roomLink();
  startButton.hidden = Boolean(state.botMode) || !state.isHost || state.phase !== "waiting";
  startButton.disabled = state.players.length < 2;
  hostWinButton.hidden = !state.canUseHostTools || state.phase === "finished";
  giveCardButton.hidden = !state.canUseHostTools || state.phase !== "playing";
  chatPanel.hidden = Boolean(state.botMode);
  drawButton.title = t("chooseCard");
  finishTurnButton.textContent = t("finishTurn");
  drawButton.disabled = isTutorialTour || !state.canDraw;
  undoButton.disabled = isTutorialTour || !state.canUndo;
  finishTurnButton.disabled = isTutorialTour || !state.canFinishTurn;
  deckCount.textContent = state.deckCount;
  turnInfo.textContent = turnLine(state, current);

  opponents.innerHTML = state.players
    .map((player) => {
      const active = player.id === state.currentPlayerId ? " active" : "";
      const offline = player.connected ? "" : " offline";
      const you = player.isYou ? t("youSuffix") : "";
      const presence = player.isBot ? t("bot") : player.connected ? t("connectedWord") : t("offline");
      const visibleHand = renderPlayerHandPreview(player);
      return `<article class="player${active}${offline}" data-player-id="${escapeHtml(player.id)}">
        <strong>${escapeHtml(displayName(player))}${you}</strong>
        <span>${t("cardCount", { count: player.handCount })}</span>
        <span class="presence">${presence}</span>
        ${visibleHand}
      </article>`;
    })
    .join("");

  discard.innerHTML = state.topCard ? cardHtml(state.topCard, "small") : "";
  renderSuitIndicator(state);
  hand.innerHTML = (state.hand || [])
    .map((card) => cardHtml(card, state.playableCardIds.includes(card.id) ? "playable" : ""))
    .join("");

  for (const cardEl of hand.querySelectorAll(".card")) {
    cardEl.addEventListener("click", () => {
      if (isTutorialTour) return;
      const cardId = cardEl.dataset.id;
      const card = state.hand.find((item) => item.id === cardId);
      if (!state.playableCardIds.includes(cardId)) return;
      if (card?.rank === "J") {
        pendingJackCardId = cardId;
        suitDialog.showModal();
        return;
      }
      animatePlay(cardEl);
      setTimeout(() => sendAction("play", { cardId }), 180);
    });
  }

  if (state.phase === "waiting") {
    message.textContent = state.isHost
      ? t("shareStart")
      : t("waitHost");
  } else if (state.phase === "finished") {
    message.textContent = state.winner ? `${displayName(state.winner)}${t("wonSuffix")}` : t("finished");
  } else if (state.spectatorMode) {
    message.textContent = t("watchingBots");
  } else if (isTutorialTour) {
    message.textContent = t("tourNext");
  } else if (isMyTurn) {
    const stackCard = state.pendingDrawRank === "Joker" ? "joker" : "2";
    if (state.pendingDraw > 0) {
      message.textContent = mustDraw
        ? t("autoDraw", { card: stackCard, count: state.pendingDraw })
        : t("yourStackTurn", { card: stackCard });
    } else if (mustDraw || (cannotPlay && state.canDraw)) {
      message.textContent = t("cannotPlay");
    } else if (cannotPlay && state.canFinishTurn && state.canUndo) {
      message.textContent = t("cannotPlayAnymore");
    } else {
      message.textContent = t("yourTurn");
    }
  } else {
    message.textContent = current ? t("currentTurn", { name: displayName(current) }) : t("waiting");
  }

  const noticeText = state.notice ? noticeMessage(state.notice, me) : "";
  const eventText = eventMessage(state, me);
  if (noticeText) message.textContent = noticeText;
  else if (eventText) message.textContent = eventText;
  renderTutorial(state);
  if (!state.botMode) renderChat(state);
  renderWinScreen(state);
  animateStateChanges(lastRenderedState, state);
  lastRenderedState = snapshotState(state);
  scheduleBotTurn(state);
}

function renderJoin(errorText = "") {
  homeScreen.classList.remove("hidden");
  roomScreen.classList.add("hidden");
  heroTitle.textContent = t("joinTitle");
  heroCopy.textContent = t("joinCopy");
  createForm.classList.add("hidden");
  codeJoinForm.classList.add("hidden");
  tutorialHomePanel.classList.add("hidden");
  joinForm.classList.remove("hidden");
  if (joinRenderedFor !== room) {
    joinName.value = "";
    joinRenderedFor = room;
  }
  joinForm.querySelector(".panel-copy").textContent = errorText && errorText !== "Kamer niet gevonden."
    ? errorText
    : t("invitedRoom", { room });
}

function renderCreateHome() {
  heroTitle.textContent = t("homeTitle");
  heroCopy.textContent = t("homeCopy");
  createForm.classList.remove("hidden");
  codeJoinForm.classList.remove("hidden");
  tutorialHomePanel.classList.remove("hidden");
}

function renderChat(nextState) {
  const messages = nextState.chat || [];
  const wasNearBottom = chatMessages.scrollTop + chatMessages.clientHeight >= chatMessages.scrollHeight - 24;
  chatMessages.innerHTML = messages
    .map((item) => `<article class="chat-message">
      <strong style="color: ${playerColor(item.playerId)}">${escapeHtml(item.name)}</strong>
      <span>${escapeHtml(item.text)}</span>
    </article>`)
    .join("");
  if (wasNearBottom) chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderSuitIndicator(nextState) {
  if (!nextState.topCard) {
    suitIndicator.textContent = `${t("activeSuit")}: -`;
    suitIndicator.className = "suit-indicator";
    return;
  }
  const suit = nextState.chosenSuit || nextState.topCard.suit;
  const symbol = suitSymbols[suit] || "";
  const label = t(suit) || suit;
  suitIndicator.textContent = `${t("activeSuit")}: ${symbol} ${label}`;
  suitIndicator.className = `suit-indicator suit-${suit}`;
}

function renderPlayerHandPreview(player) {
  const cards = player.hand
    ? player.hand.map((card) => cardHtml(card, "tiny"))
    : Array.from({ length: player.handCount }, (_, index) => cardBackHtml(index));
  return `<div class="visible-bot-hand">${cards.join("")}</div>`;
}

function displayName(playerOrName) {
  const name = typeof playerOrName === "string" ? playerOrName : playerOrName?.name;
  if (name === "Player" || name === "Speler" || name === "Host") return t("defaultPlayer");
  if (name === "Easy Bot") return t("easyBotName");
  if (name === "Medium Bot") return t("mediumBotName");
  if (name === "Hard Bot") return t("hardBotName");
  if (/^Easy Bot \d+$/.test(name)) return `${t("easyBotName")} ${name.split(" ").at(-1)}`;
  if (/^Medium Bot \d+$/.test(name)) return `${t("mediumBotName")} ${name.split(" ").at(-1)}`;
  if (/^Hard Bot \d+$/.test(name)) return `${t("hardBotName")} ${name.split(" ").at(-1)}`;
  if (name === "Tutorial Bot") return t("tutorialBotName");
  return name || t("defaultPlayer");
}

function cardBackHtml(index = 0) {
  return `<span class="card-back tiny" style="--tilt: ${((index % 5) - 2) * 0.8}deg" aria-hidden="true"></span>`;
}

function noticeMessage(notice, me) {
  const card = notice.pendingDrawRank === "Joker" ? "Joker" : "2";
  const isYou = notice.playerId === me?.id;
  if (notice.count > 1) {
    return isYou
      ? t("mustDrawYouForced", { card, count: notice.count })
      : t("mustDrawOtherForced", { name: displayName(notice.playerName), card, count: notice.count });
  }
  return isYou ? t("mustDrawYou") : t("mustDrawOther", { name: displayName(notice.playerName) });
}

function eventMessage(nextState, me) {
  const event = nextState.lastEvent;
  if (!event) return "";
  const player = nextState.players.find((item) => item.id === (event.from || event.to || event.by));
  const name = player?.isYou ? t("you") : displayName(player || "Player");
  if (event.type === "draw") {
    return event.forced
      ? t("eventForcedDrew", { name, count: event.count })
      : t("eventDrew", { name, count: event.count });
  }
  if (event.type === "play" && event.card?.rank === "10") return t("eventTen", { name });
  if (event.type === "play" && event.card?.rank === "Joker") return t("eventJoker", { name });
  if (event.type === "play" && event.card?.rank === "2") return t("eventTwo", { name });
  return "";
}

function renderTutorial(nextState) {
  const showTutorial = Boolean(nextState.tutorialMode);
  tutorialPanel.hidden = !showTutorial;
  tutorialPanel.classList.toggle("hidden", !showTutorial);
  roomScreen.classList.remove(
    "tutorial-tour",
    "tutorial-point-table",
    "tutorial-point-hand",
    "tutorial-point-deck",
    "tutorial-point-finish",
    "tutorial-point-bot"
  );
  if (!showTutorial) {
    tutorialText.textContent = "";
    return;
  }

  const me = nextState.players.find((player) => player.isYou);
  const isMyTurn = me && nextState.currentPlayerId === me.id && nextState.phase === "playing";
  tutorialTitle.textContent = t("tutorialTitle");
  tutorialNextButton.hidden = nextState.phase !== "tutorial";

  if (nextState.phase === "tutorial") {
    const step = tutorialTourSteps[tutorialStep] || tutorialTourSteps[0];
    tutorialText.textContent = t(step.key);
    tutorialNextButton.textContent = tutorialStep >= tutorialTourSteps.length - 1 ? t("tourStartGame") : t("tourNext");
    roomScreen.classList.add("tutorial-tour", `tutorial-point-${step.point}`);
    return;
  }

  if (!isMyTurn) {
    tutorialText.textContent = t("tutorialBotTurn");
    roomScreen.classList.add("tutorial-point-bot");
    return;
  }

  if (nextState.canUndo) {
    const topRank = nextState.topCard?.rank;
    tutorialText.textContent = goAgainRanksClient.has(topRank)
      ? t("tutorialGoAgain")
      : t("tutorialAfterPlay");
    roomScreen.classList.add("tutorial-point-finish");
    return;
  }

  if (nextState.playableCardIds.includes("5-spades")) {
    tutorialText.textContent = t("tutorialStart");
    roomScreen.classList.add("tutorial-point-hand");
    return;
  }

  if (nextState.playableCardIds.length === 0) {
    tutorialText.textContent = t("tutorialDraw");
    roomScreen.classList.add("tutorial-point-deck");
    return;
  }

  tutorialText.textContent = t("tutorialContinue");
  roomScreen.classList.add("tutorial-point-hand");
}

function playerColor(playerId) {
  const colors = ["#4ade80", "#60a5fa", "#f7c948", "#fb7185", "#c084fc", "#2dd4bf"];
  let hash = 0;
  for (const char of String(playerId || "")) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return colors[hash % colors.length];
}

function scheduleBotTurn(nextState) {
  if (!nextState.botMode || nextState.phase !== "playing" || botTurnInFlight) return;
  const current = nextState.players.find((player) => player.id === nextState.currentPlayerId);
  if (!current?.isBot) return;
  const key = [
    nextState.code,
    nextState.currentPlayerId,
    nextState.topCard?.id || "none",
    nextState.deckCount,
    current.handCount,
    nextState.pendingDraw,
  ].join(":");
  if (key === lastBotTurnKey) return;
  lastBotTurnKey = key;
  botTurnInFlight = true;
  const delay = nextState.tutorialMode && tutorialBotFirstTurnPending
    ? Math.max(5000, botThinkDelay())
    : botThinkDelay();
  tutorialBotFirstTurnPending = false;
  setTimeout(async () => {
    try {
      await sendAction("botTurn");
    } finally {
      botTurnInFlight = false;
    }
  }, delay);
}

function botThinkDelay() {
  return 3000 + Math.floor(Math.random() * 3001);
}

function openCardPicker() {
  if (!state?.canUseHostTools || state.phase !== "playing") return;
  renderCardPicker();
  cardPickerDialog.showModal();
}

function renderCardPicker() {
  const cards = state.availableCards || [];
  if (cards.length === 0) {
    cardPickerGrid.innerHTML = `<p class="empty-picker">Geen kaarten beschikbaar.</p>`;
    return;
  }

  cardPickerGrid.innerHTML = cards.map((card) => cardHtml(card, "picker-card")).join("");
  for (const cardEl of cardPickerGrid.querySelectorAll(".card")) {
    cardEl.addEventListener("click", async () => {
      const cardId = cardEl.dataset.id;
      cardPickerDialog.close();
      await sendAction("giveCard", { cardId });
    });
  }
}

function cardHtml(card, extraClass) {
  const red = card.suit === "hearts" || card.suit === "diamonds" || card.color === "red" ? " red" : "";
  const symbol = suitSymbols[card.suit];
  const label = card.rank === "Joker" ? "Joker" : `${card.rank}${symbol}`;
  return `<button class="card ${extraClass}${red}" data-id="${card.id}" data-tip="${escapeHtml(cardHelp(card))}" type="button">
    <span>${label}</span>
    <span class="middle">${symbol}</span>
    <span class="bottom">${label}</span>
  </button>`;
}

function cardHelp(card) {
  if (card.rank === "Joker") return t("helpJoker");
  if (card.rank === "2") return t("helpTwo");
  if (card.rank === "7") return t("helpSeven");
  if (card.rank === "K") return t("helpKing");
  if (card.rank === "8") return t("helpEight");
  if (card.rank === "A") return t("helpAce");
  if (card.rank === "10") return t("helpTen");
  if (card.rank === "J") return t("helpJack");
  return t("helpNormal");
}

function animateStateChanges(previous, next) {
  if (!previous || previous.code !== next.code) return;

  if (previous.phase !== "playing" && next.phase === "playing") {
    const current = next.players.find((player) => player.id === next.currentPlayerId);
    if (current) scheduleTurnOverlay(t("overlayTurn", { name: displayName(current) }), 500);
  }

  if (previous.phase !== "playing" || next.phase !== "playing") return;
  handleRoomEvent(next);

  if (previous.topCard?.id !== next.topCard?.id) {
    discard.classList.remove("pile-pop");
    void discard.offsetWidth;
    discard.classList.add("pile-pop");
  }

  if (previous.currentPlayerId !== next.currentPlayerId) {
    const current = next.players.find((player) => player.id === next.currentPlayerId);
    if (current) scheduleTurnOverlay(t("overlayTurn", { name: displayName(current) }), turnOverlayDelay(next));
  }
}

function handleRoomEvent(next) {
  const event = next.lastEvent;
  const me = next.players.find((player) => player.isYou);
  if (!event || !me || event.id <= handledEventId) return;
  handledEventId = event.id;

  if (event.type === "draw" && event.to === me.id) {
    if (suppressNextDrawAnimation) {
      suppressNextDrawAnimation = false;
      return;
    }
    animateDraw(event.count, { force: event.forced, cardIds: event.cardIds || [] });
  }

  if (event.type === "play" && event.from !== me.id) {
    animatePlayFromPlayer(event.from, event.card);
  }

  const swapMapping = event.type === "swap" ? event.mapping : event.swapMapping;
  if (swapMapping) {
    const swap = swapMapping.find((item) => item.to === me.id);
    if (!swap) return;
    const source = next.players.find((player) => player.id === swap.from);
    if (source) showSwapSource(source.name);
    animateSwapFromPlayer(swap.from, swap.count);
  }
}

function animatePlay(cardEl) {
  const from = safeRect(cardEl, hand.getBoundingClientRect());
  const to = safeRect(discard, document.querySelector(".center-table")?.getBoundingClientRect() || from);
  flyCard(from, to, cardEl.cloneNode(true), "card-flight");
}

function animatePlayFromPlayer(playerId, card) {
  const playerEl = document.querySelector(`[data-player-id="${CSS.escape(playerId)}"]`);
  const from = safeRect(playerEl, opponents.getBoundingClientRect());
  const to = safeRect(discard, document.querySelector(".center-table")?.getBoundingClientRect() || from);
  flyCard(from, to, cardElement(card), "card-flight", 520);
}

function cardElement(card) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = cardHtml(card, "small");
  return wrapper.firstElementChild;
}

function animateDraw(count = 1, options = {}) {
  if (options.force) {
    animateForcedDraw(count, options.cardIds || []);
    return;
  }
  const from = safeRect(drawButton, document.querySelector(".center-table")?.getBoundingClientRect());
  const cardIds = options.cardIds || [];
  const duration = 560;
  const pause = 120;
  const incomingCards = cardIds
    .map((id) => hand.querySelector(`.card[data-id="${CSS.escape(id)}"]`))
    .filter(Boolean);
  for (const card of incomingCards) card.classList.add("pending-arrival");

  for (let i = 0; i < count; i += 1) {
    setTimeout(() => {
      const incomingCard = incomingCards[i] || null;
      const target = visibleHandTargetRect(i);
      const clone = document.createElement("div");
      clone.className = "card-back flight-back";
      const destination = target;
      flyCard(from, destination, clone, "draw-flight", duration);
      setTimeout(() => {
        if (incomingCard) {
          incomingCard.classList.remove("pending-arrival");
          incomingCard.classList.add("card-arrive");
          setTimeout(() => incomingCard.classList.remove("card-arrive"), 420);
        } else {
          revealHandCards(i);
        }
      }, duration - 80);
      scrollHandToEnd();
    }, i * (duration + pause));
  }
}

function animateForcedDraw(count = 1, cardIds = []) {
  const from = safeRect(drawButton, document.querySelector(".center-table")?.getBoundingClientRect());
  const target = safeRect(hand, handTargetRect());
  const total = Math.max(1, count);
  const incomingCards = cardIds
    .map((id) => hand.querySelector(`.card[data-id="${CSS.escape(id)}"]`))
    .filter(Boolean);
  for (const card of incomingCards) card.classList.add("pending-arrival");

  hand.classList.add("receiving-swap");
  for (let i = 0; i < total; i += 1) {
    setTimeout(() => {
      const clone = document.createElement("div");
      clone.className = "card swap-card-back";
      flyCard(from, targetForIndex(target, i), clone, "swap-flight", 500);
      setTimeout(() => {
        const incomingCard = incomingCards[i] || null;
        if (incomingCard) {
          incomingCard.classList.remove("pending-arrival");
          incomingCard.classList.add("card-arrive");
          setTimeout(() => incomingCard.classList.remove("card-arrive"), 420);
        } else {
          revealHandCards(i);
        }
      }, 420);
      scrollHandToEnd();
    }, i * 120);
  }
  setTimeout(() => hand.classList.remove("receiving-swap"), total * 120 + 560);
}

function animateSwapFromPlayer(playerId, count = 1) {
  const playerCard = document.querySelector(`[data-player-id="${CSS.escape(playerId)}"]`);
  const from = safeRect(playerCard, opponents.getBoundingClientRect());
  const target = safeRect(hand, handTargetRect());
  hand.classList.add("receiving-swap");
  for (let i = 0; i < Math.max(1, count); i += 1) {
    setTimeout(() => {
      const clone = document.createElement("div");
      clone.className = "card swap-card-back";
      flyCard(from, targetForIndex(target, i), clone, "swap-flight");
      revealHandCards(i);
    }, i * 85);
  }
  setTimeout(() => hand.classList.remove("receiving-swap"), Math.max(1, count) * 85 + 500);
}

function targetForIndex(rect, index) {
  const safe = normalizeRect(rect, hand.getBoundingClientRect());
  return {
    left: safe.left + Math.min(index, 6) * 14,
    top: safe.top + (index % 2) * 4,
    width: Math.min(92, safe.width || 92),
    height: Math.min(128, safe.height || 128),
  };
}

function handTargetRect() {
  const handRect = safeRect(hand, { left: 24, top: window.innerHeight - 160, width: 92, height: 128 });
  const lastCard = hand.lastElementChild ? safeRect(hand.lastElementChild, handRect) : null;
  if (!lastCard) return handRect;
  return {
    left: Math.min(lastCard.left + 16, handRect.right - lastCard.width),
    top: lastCard.top,
    width: lastCard.width,
    height: lastCard.height,
  };
}

function visibleHandTargetRect(index = 0) {
  const handRect = safeRect(hand, { left: 24, top: window.innerHeight - 160, width: 92, height: 128 });
  const cardWidth = Math.min(92, Math.max(76, handRect.width * 0.12));
  const cardHeight = Math.round(cardWidth * 1.39);
  const left = Math.max(handRect.left + 8, handRect.right - cardWidth - 16 - Math.min(index, 2) * 10);
  const top = handRect.top + 10 + (index % 2) * 4;
  return normalizeRect({ left, top, width: cardWidth, height: cardHeight }, handRect);
}

function scrollHandToEnd() {
  hand.scrollTo({ left: hand.scrollWidth, behavior: "smooth" });
}

function revealHandCards(index) {
  const cards = [...hand.querySelectorAll(".card")];
  const card = cards[Math.max(0, cards.length - 1 - index)];
  if (!card) return;
  card.classList.add("card-arrive");
  setTimeout(() => card.classList.remove("card-arrive"), 420);
}

function flyCard(from, to, element, className, duration = 430) {
  const start = normalizeRect(from, { left: window.innerWidth / 2 - 46, top: window.innerHeight / 2 - 64, width: 92, height: 128 });
  const end = normalizeRect(to, start);
  const clone = element;
  clone.classList.add("flying-card", className);
  clone.style.left = `${start.left}px`;
  clone.style.top = `${start.top}px`;
  clone.style.width = `${start.width}px`;
  clone.style.height = `${start.height}px`;
  clone.style.transitionDuration = `${duration}ms`;
  document.body.append(clone);
  requestAnimationFrame(() => {
    clone.style.transform = `translate(${end.left - start.left}px, ${end.top - start.top}px) scale(${end.width / start.width || 1}, ${end.height / start.height || 1}) rotate(4deg)`;
    clone.style.opacity = "0.7";
  });
  setTimeout(() => clone.remove(), duration);
}

function safeRect(element, fallback) {
  if (!element?.getBoundingClientRect) return normalizeRect(fallback);
  return normalizeRect(element.getBoundingClientRect(), fallback);
}

function normalizeRect(rect, fallback = {}) {
  const fallbackRect = {
    left: Number.isFinite(fallback.left) ? fallback.left : 24,
    top: Number.isFinite(fallback.top) ? fallback.top : 24,
    width: Number.isFinite(fallback.width) && fallback.width > 0 ? fallback.width : 92,
    height: Number.isFinite(fallback.height) && fallback.height > 0 ? fallback.height : 128,
  };
  const left = Number.isFinite(rect?.left) ? rect.left : fallbackRect.left;
  const top = Number.isFinite(rect?.top) ? rect.top : fallbackRect.top;
  const width = Number.isFinite(rect?.width) && rect.width > 0 ? rect.width : fallbackRect.width;
  const height = Number.isFinite(rect?.height) && rect.height > 0 ? rect.height : fallbackRect.height;
  return { left, top, width, height, right: left + width, bottom: top + height };
}

function renderWinScreen(nextState) {
  if (nextState.phase !== "finished" || !nextState.winner) {
    winScreen.classList.add("hidden");
    return;
  }
  if (dismissedWinKey === winKey(nextState)) {
    winScreen.classList.add("hidden");
    return;
  }
  const you = nextState.players.find((player) => player.isYou);
  const isYou = you?.id === nextState.winner.id;
  winnerTitle.textContent = isYou ? t("youWon") : t("winnerTitle", { name: displayName(nextState.winner) });
  winnerText.textContent = nextState.winnerReason === "disconnected"
    ? t("disconnectedWinText")
    : isYou
      ? t("youWonText")
      : t("winnerText");
  winScreen.classList.remove("hidden");
}

function winKey(nextState) {
  if (!nextState?.winner) return "";
  return `${nextState.code}:${nextState.winner.id}`;
}

function snapshotState(value) {
  return {
    code: value.code,
    phase: value.phase,
    deckCount: value.deckCount,
    topCard: value.topCard,
    currentPlayerId: value.currentPlayerId,
    hand: value.hand || [],
  };
}

function turnLine(nextState, current) {
  if (nextState.phase === "waiting") return t("waitingNext");
  if (nextState.phase === "finished") return t("finishedLine");
  const currentName = current ? displayName(current) : "-";
  const nextPlayer = nextState.players.find((player) => player.id === nextState.nextPlayerId);
  const nextName = nextPlayer ? displayName(nextPlayer) : displayName(nextState.nextPlayerName || "-");
  const swapText = nextState.viewerSwapFrom ? t("swapText", { name: displayName(nextState.viewerSwapFrom) }) : "";
  return t("nextLine", { current: currentName, next: nextName, swap: swapText });
}

function showSwapSource(name) {
  message.textContent = t("swapNotice", { name });
}

function showTurnOverlay(text) {
  clearTimeout(pendingTurnOverlayTimer);
  clearTimeout(turnOverlayTimer);
  turnOverlay.textContent = text;
  turnOverlay.classList.remove("hidden", "turn-overlay-show");
  void turnOverlay.offsetWidth;
  turnOverlay.classList.add("turn-overlay-show");
  turnOverlayTimer = setTimeout(() => {
    turnOverlay.classList.remove("turn-overlay-show");
    turnOverlay.classList.add("hidden");
  }, 1700);
}

function scheduleTurnOverlay(text, delay = 500) {
  clearTimeout(pendingTurnOverlayTimer);
  pendingTurnOverlayTimer = setTimeout(() => showTurnOverlay(text), Math.max(0, delay));
}

function turnOverlayDelay(nextState) {
  const event = nextState.lastEvent;
  const afterAnimations = 500;
  if (!event) return afterAnimations;
  if (event.type === "draw") return event.count * 680 + afterAnimations;
  if (event.type === "swap") return Math.max(1, event.count || 1) * 85 + 500 + afterAnimations;
  if (nextState.topCard) return 430 + afterAnimations;
  return afterAnimations;
}

function setRoomUrl(code, playerId = getPlayerFromUrl()) {
  const url = new URL(`/kamers/${code}/`, location.origin);
  if (playerId) url.searchParams.set("player", playerId);
  history.pushState({}, "", url);
}

function getRoomFromUrl() {
  const pathRoom = location.pathname.match(/^\/kamers\/([^/]+)(?:\/join)?\/?$/i)?.[1];
  return (pathRoom || new URLSearchParams(location.search).get("room") || "").trim().toUpperCase();
}

function getPlayerFromUrl() {
  return new URLSearchParams(location.search).get("player") || "";
}

function roomLink() {
  const origin = shareOrigin();
  const url = new URL("/", origin);
  url.searchParams.set("room", room);
  return url.href;
}

function shareOrigin() {
  const localNames = new Set(["localhost", "127.0.0.1", "::1"]);
  if (localNames.has(location.hostname) && state?.localOrigin) return state.localOrigin;
  return location.origin;
}

function phaseLabel(phase) {
  if (phase === "tutorial") return t("tutorialTitle");
  if (phase === "waiting") return t("phaseWaiting");
  if (phase === "playing") return t("phasePlaying");
  if (phase === "finished") return t("phaseFinished");
  return phase;
}

function cleanName(value) {
  return value.trim().slice(0, 18) || t("playerPlaceholder");
}

function cleanRoomCode(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

poll();
