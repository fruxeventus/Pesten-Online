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
const connection = $("#connection");
const roomCodeLabel = $("#roomCodeLabel");
const statusLabel = $("#statusLabel");
const opponents = $("#opponents");
const deckCount = $("#deckCount");
const discard = $("#discard");
const message = $("#message");
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
    rulesText: `<p><strong>Goal:</strong> be the first player with no cards left.</p><ul><li>On your turn, play one card on the discard pile.</li><li>Your card must match the top card by suit or by rank.</li><li>If you cannot play, draw a card from the deck.</li><li>Special cards can skip, reverse, give extra turns, swap hands, or make someone draw cards.</li></ul>`,
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
  rulesText: `<p><strong>Doel:</strong> raak als eerste al je kaarten kwijt.</p><ul><li>Als je aan de beurt bent, leg je een kaart op de aflegstapel.</li><li>Je kaart moet dezelfde soort of waarde hebben als de bovenste kaart.</li><li>Kun je niet spelen, dan pak je een kaart van de stapel.</li><li>Speciale kaarten kunnen overslaan, omdraaien, extra beurten geven, handen wisselen of iemand kaarten laten pakken.</li></ul>`,
  rulesRoomTitle: "Zo speel je",
  rulesRoomText: `<p><strong>Doel:</strong> raak als eerste al je kaarten kwijt.</p><ul><li>Leg dezelfde soort of waarde op de bovenste kaart.</li><li>Pak een kaart als je niet kunt spelen.</li><li>Boer laat je een soort kiezen. Joker mag altijd.</li><li>2 laat de volgende speler twee kaarten pakken. Jokers tellen vijf kaarten erbij.</li><li>7 en Heer geven nog een beurt. 8 slaat over. Aas draait om. 10 wisselt handen.</li></ul>`,
  messages: "Berichten",
  chatPlaceholder: "Typ een bericht",
  send: "Stuur",
  endGame: "Einde spel",
  winnerKnown: "De winnaar is bekend.",
  viewTable: "Bekijk tafel",
  chooseSuit: "Kies een soort",
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
};

translations.fr = {
  ...translations.en,
  appTitle: "Crazy Eights multijoueur",
  appSubtitle: "Cartes en ligne local avec des amis",
  language: "Langue",
  connectedNone: "Non connecte",
  connected: "Connecte",
  homeTitle: "Creez une partie et partagez le lien",
  play: "Jouer",
  yourName: "Votre nom",
  maxPlayers: "Nombre maximum de joueurs",
  createRoom: "Creer une partie",
  botLevel: "Niveau du bot",
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
  playBot: "Jouer contre le bot",
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
};

translations.de = {
  ...translations.en,
  appTitle: "Crazy Eights Mehrspieler",
  appSubtitle: "Lokales Online-Kartenspiel mit Freunden",
  language: "Sprache",
  connectedNone: "Nicht verbunden",
  connected: "Verbunden",
  homeTitle: "Raum erstellen und Link teilen",
  play: "Spielen",
  yourName: "Dein Name",
  maxPlayers: "Maximale Spielerzahl",
  createRoom: "Raum erstellen",
  botLevel: "Bot-Stufe",
  easy: "Leicht",
  medium: "Mittel",
  hard: "Schwer",
  playBot: "Gegen Bot spielen",
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
};

translations.zh = {
  ...translations.en,
  appTitle: "疯狂八点多人版",
  appSubtitle: "和朋友一起本地联机打牌",
  language: "语言",
  connectedNone: "未连接",
  connected: "已连接",
  homeTitle: "创建房间并分享链接",
  play: "开始",
  yourName: "你的名字",
  maxPlayers: "最多玩家",
  createRoom: "创建房间",
  botLevel: "机器人难度",
  easy: "简单",
  medium: "普通",
  hard: "困难",
  playBot: "对战机器人",
  joinCodeTitle: "用代码加入",
  joinCode: "加入房间",
  back: "返回",
  copyLink: "复制链接",
  rulesTitle: "新手规则",
  rulesRoomTitle: "本版本规则",
  rulesText: `<p><strong>目标：</strong>最先出完所有手牌。</p><ul><li>轮到你时，把一张牌放到弃牌堆上。</li><li>你的牌必须和最上面的牌同花色或同点数。</li><li>如果不能出牌，就从牌堆摸一张。</li><li>特殊牌可以跳过、反转、再来一回合、换手牌或让别人摸牌。</li></ul>`,
  rulesRoomText: `<p><strong>目标：</strong>最先出完所有手牌。</p><ul><li>出同花色或同点数的牌。</li><li>不能出牌就摸一张。</li><li>J 可以选择花色。 Joker 随时可以出。</li><li>2 让下家摸两张。 Joker 增加五张。</li><li>7 和 K 再来一回合。8 跳过。A 反转。10 轮换手牌。</li></ul>`,
  chat: "聊天",
  messages: "消息",
  send: "发送",
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

codeJoinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = cleanName(createName.value);
  const code = cleanRoomCode(roomCodeInput.value);
  if (!code) return;
  localStorage.setItem("pesten-name", name);
  sessionId = crypto.randomUUID();
  setRoomUrl(code, sessionId);
  try {
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
  const cannotPlay = isMyTurn && state.playableCardIds.length === 0;
  const mustDraw = isMyTurn && state.mustDrawPlayerId === me?.id;

  roomScreen.classList.toggle("bot-room", Boolean(state.botMode));
  roomCodeLabel.textContent = state.code;
  statusLabel.textContent = state.phase === "waiting" ? t("waitingStatus", { count: state.players.length, max: state.maxPlayers }) : phaseLabel(state.phase);
  youLabel.textContent = me ? me.name : t("you");
  roomCodeLabel.closest("div").hidden = Boolean(state.botMode);
  sharePanel.hidden = Boolean(state.botMode) || !state.isHost || state.phase !== "waiting";
  shareLink.textContent = roomLink();
  startButton.hidden = Boolean(state.botMode) || !state.isHost || state.phase !== "waiting";
  startButton.disabled = state.players.length < 2;
  hostWinButton.hidden = !state.canUseHostTools || state.phase === "finished";
  giveCardButton.hidden = !state.canUseHostTools || state.phase !== "playing";
  chatPanel.hidden = Boolean(state.botMode);
  drawButton.disabled = !isMyTurn || (state.pendingDraw > 0 && mustDraw);
  undoButton.disabled = !state.canUndo;
  finishTurnButton.disabled = !state.canFinishTurn;
  deckCount.textContent = state.deckCount;
  turnInfo.textContent = turnLine(state, current);

  opponents.innerHTML = state.players
    .map((player) => {
      const active = player.id === state.currentPlayerId ? " active" : "";
      const offline = player.connected ? "" : " offline";
      const you = player.isYou ? " (jij)" : "";
      const presence = player.isBot ? "bot" : player.connected ? "verbonden" : "offline";
      return `<article class="player${active}${offline}" data-player-id="${escapeHtml(player.id)}">
        <strong>${escapeHtml(player.name)}${you}</strong>
        <span>${player.handCount} kaarten</span>
        <span class="presence">${presence}</span>
      </article>`;
    })
    .join("");

  discard.innerHTML = state.topCard ? cardHtml(state.topCard, "small") : "";
  hand.innerHTML = (state.hand || [])
    .map((card) => cardHtml(card, state.playableCardIds.includes(card.id) ? "playable" : ""))
    .join("");

  for (const cardEl of hand.querySelectorAll(".card")) {
    cardEl.addEventListener("click", () => {
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
    message.textContent = state.winner ? `${state.winner.name}${t("wonSuffix")}` : t("finished");
  } else if (isMyTurn) {
    const stackCard = state.pendingDrawRank === "Joker" ? "joker" : "2";
    message.textContent = state.pendingDraw > 0
      ? mustDraw
        ? t("autoDraw", { card: stackCard, count: state.pendingDraw })
        : t("yourStackTurn", { card: stackCard })
      : mustDraw || cannotPlay
        ? t("cannotPlay")
        : state.canUndo
          ? t("yourTurn")
          : t("yourTurn");
  } else {
    message.textContent = current ? t("currentTurn", { name: current.name }) : t("waiting");
  }

  if (state.notice) message.textContent = state.notice.text;
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
  setTimeout(async () => {
    try {
      await sendAction("botTurn");
    } finally {
      botTurnInFlight = false;
    }
  }, botThinkDelay());
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
  return `<button class="card ${extraClass}${red}" data-id="${card.id}" type="button">
    <span>${label}</span>
    <span class="middle">${symbol}</span>
    <span class="bottom">${label}</span>
  </button>`;
}

function animateStateChanges(previous, next) {
  if (!previous || previous.code !== next.code) return;

  if (previous.phase !== "playing" && next.phase === "playing") {
    const current = next.players.find((player) => player.id === next.currentPlayerId);
    if (current) scheduleTurnOverlay(t("overlayTurn", { name: current.name }), 500);
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
    if (current) scheduleTurnOverlay(t("overlayTurn", { name: current.name }), turnOverlayDelay(next));
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
  winnerTitle.textContent = isYou ? t("youWon") : t("winnerTitle", { name: nextState.winner.name });
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
  const currentName = current?.name || "-";
  const nextName = nextState.nextPlayerName || "-";
  const swapText = nextState.viewerSwapFrom ? t("swapText", { name: nextState.viewerSwapFrom }) : "";
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
