const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const rooms = new Map();

const suits = ["hearts", "diamonds", "clubs", "spades"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const goAgainRanks = new Set(["7", "K"]);
const disconnectedAfterMs = 5000;
const forcedDrawDelayMs = 1200;
const testHostName = "Frux 24/03/2000";
const blockedWords = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "nigger",
  "faggot",
  "kanker",
  "tering",
  "kut",
  "tyfus",
  "hoer",
];
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }
    serveFile(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error." });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  const addresses = getLocalAddresses();
  console.log(`Pesten Kamers draait:`);
  console.log(`  Deze computer: http://localhost:${PORT}`);
  for (const address of addresses) console.log(`  Vrienden op wifi: http://${address}:${PORT}`);
});

async function handleApi(req, res) {
  if (req.method === "GET" && req.url.startsWith("/api/state")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const code = cleanCode(url.searchParams.get("code"));
    const sessionId = url.searchParams.get("sessionId");
    const room = getRoom(code);
    const player = touchPlayer(room, sessionId);
    if (!player) throw new PublicError("Vul je naam in om mee te doen.");
    sendJson(res, 200, publicState(room, sessionId));
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Methode niet toegestaan." });
    return;
  }

  const body = await readBody(req);
  if (req.url === "/api/create") {
    const code = makeCode();
    const maxPlayers = clamp(Number(body.maxPlayers) || 4, 2, 5);
    const player = makePlayer(body.sessionId, body.name, true);
    rooms.set(code, {
      code,
      maxPlayers,
      hostId: player.id,
      players: [player],
      phase: "waiting",
      deck: [],
      discard: [],
      current: 0,
      direction: 1,
      chosenSuit: null,
      pendingDraw: 0,
      pendingDrawRank: null,
      freePlayPlayerId: null,
      winnerId: null,
      botMode: false,
      botDifficulty: null,
      notice: null,
      mustDrawPlayerId: null,
      mustDrawSince: null,
      resolvingForcedDraw: false,
      turnHistory: [],
      normalDrawPlayerId: null,
      winnerReason: null,
      chat: [],
      lastEvent: null,
      eventId: 0,
      createdAt: Date.now(),
    });
    sendJson(res, 200, { code });
    return;
  }

  if (req.url === "/api/create-bot") {
    const code = makeCode();
    const difficulty = cleanBotDifficulty(body.difficulty);
    const player = makePlayer(body.sessionId, body.name, true);
    const bot = makePlayer(`bot-${code}`, botName(difficulty), false, true);
    const room = {
      code,
      maxPlayers: 2,
      hostId: player.id,
      players: [player, bot],
      phase: "waiting",
      deck: [],
      discard: [],
      current: 0,
      direction: 1,
      chosenSuit: null,
      pendingDraw: 0,
      pendingDrawRank: null,
      freePlayPlayerId: null,
      winnerId: null,
      botMode: true,
      botDifficulty: difficulty,
      notice: null,
      mustDrawPlayerId: null,
      mustDrawSince: null,
      resolvingForcedDraw: false,
      turnHistory: [],
      normalDrawPlayerId: null,
      winnerReason: null,
      chat: [],
      lastEvent: null,
      eventId: 0,
      createdAt: Date.now(),
    };
    rooms.set(code, room);
    startGame(room);
    sendJson(res, 200, { code });
    return;
  }

  if (req.url === "/api/create-tutorial") {
    const code = makeCode();
    const player = makePlayer(body.sessionId, body.name, true);
    const bot = makePlayer(`bot-${code}`, "Tutorial Bot", false, true);
    const room = {
      code,
      maxPlayers: 2,
      hostId: player.id,
      players: [player, bot],
      phase: "tutorial",
      deck: [],
      discard: [],
      current: 0,
      direction: 1,
      chosenSuit: null,
      pendingDraw: 0,
      pendingDrawRank: null,
      freePlayPlayerId: null,
      winnerId: null,
      botMode: true,
      tutorialMode: true,
      botDifficulty: "easy",
      notice: null,
      mustDrawPlayerId: null,
      mustDrawSince: null,
      resolvingForcedDraw: false,
      turnHistory: [],
      winnerReason: null,
      chat: [],
      lastEvent: null,
      eventId: 0,
      createdAt: Date.now(),
    };
    setupTutorialGame(room);
    room.phase = "tutorial";
    rooms.set(code, room);
    sendJson(res, 200, { code });
    return;
  }

  if (req.url === "/api/join") {
    const code = cleanCode(body.code);
    const room = getRoom(code);
    if (room.phase !== "waiting") throw new PublicError("Dit spel is al begonnen.");
    if (room.players.length >= room.maxPlayers) throw new PublicError("Deze kamer is vol.");

    const existing = room.players.find((player) => player.id === body.sessionId);
    if (existing) {
      existing.name = cleanName(body.name);
      existing.connectedAt = Date.now();
    } else {
      room.players.push(makePlayer(body.sessionId, body.name, false));
    }
    sendJson(res, 200, { code });
    return;
  }

  if (req.url === "/api/action") {
    const code = cleanCode(body.code);
    const room = getRoom(code);
    const player = room.players.find((item) => item.id === body.sessionId);
    if (!player) throw new PublicError("Je zit niet in deze kamer.");
    player.connectedAt = Date.now();
    handleAction(room, player, body);
    validateCards(room);
    sendJson(res, 200, publicState(room, player.id));
    return;
  }

  sendJson(res, 404, { error: "Onbekende route." });
}

function handleAction(room, player, body) {
  if (body.type === "start") {
    if (player.id !== room.hostId) throw new PublicError("Alleen de host kan starten.");
    if (room.players.length < 2) throw new PublicError("Je hebt minstens twee spelers nodig.");
    startGame(room);
    return;
  }

  if (body.type === "hostWin") {
    if (!canUseHostTools(room, player)) throw new PublicError("Alleen de test-host kan dit gebruiken.");
    room.phase = "finished";
    room.winnerId = player.id;
    return;
  }

  if (body.type === "giveCard") {
    if (!canUseHostTools(room, player)) throw new PublicError("Alleen de test-host kan dit gebruiken.");
    const cardIndex = room.deck.findIndex((card) => card.id === body.cardId);
    if (cardIndex < 0) throw new PublicError("Die kaart is niet beschikbaar.");
    const [card] = room.deck.splice(cardIndex, 1);
    player.hand.push(card);
    setEvent(room, { type: "draw", to: player.id, count: 1, cardIds: [card.id], forced: false, test: true });
    updateMustDraw(room);
    return;
  }

  if (body.type === "chat") {
    if (room.botMode) throw new PublicError("Chat staat uit tegen de bot.");
    addChatMessage(room, player, body.text);
    return;
  }

  if (body.type === "botTurn") {
    playBotTurn(room);
    return;
  }

  if (body.type === "startTutorial") {
    if (!room.tutorialMode || player.id !== room.hostId) throw new PublicError("Alleen de tutorial speler kan starten.");
    room.phase = "playing";
    room.current = 0;
    room.turnHistory = [];
    updateMustDraw(room);
    return;
  }

  if (room.phase !== "playing") throw new PublicError("Het spel is niet bezig.");
  const current = room.players[room.current];
  if (!current || current.id !== player.id) throw new PublicError("Je bent niet aan de beurt.");

  if (body.type === "draw") {
    updateMustDraw(room);
    if (room.pendingDraw > 0 && room.mustDrawPlayerId === player.id) {
      throw new PublicError("Het spel pakt deze kaarten automatisch.");
    }
    if (!canDrawNow(room, player)) throw new PublicError("Je kunt alleen pakken als je niet kunt spelen.");
    drawForTurn(room, player, false);
    return;
  }

  if (body.type === "undo") {
    undoLastPlay(room, player);
    return;
  }

  if (body.type === "finishTurn") {
    finishTurn(room, player);
    return;
  }

  if (body.type === "play") {
    if (room.mustDrawPlayerId === player.id) throw new PublicError("Je moet eerst een kaart pakken.");
    if (!canPlayAnotherCard(room, player)) throw new PublicError("Maak eerst je beurt af.");
    const cardIndex = player.hand.findIndex((card) => card.id === body.cardId);
    if (cardIndex < 0) throw new PublicError("Je hebt die kaart niet.");
    const card = player.hand[cardIndex];
    if (!isPlayable(room, card, player)) throw new PublicError("Die kaart mag je nu niet leggen.");
    if (card.rank === "J" && !suits.includes(body.chosenSuit)) throw new PublicError("Kies een soort voor de boer.");

    room.turnHistory.push({ playerId: player.id, state: snapshotTurnState(room) });
    player.hand.splice(cardIndex, 1);
    room.discard.push(card);
    room.chosenSuit = card.rank === "J" ? body.chosenSuit : null;
    if (room.freePlayPlayerId === player.id) room.freePlayPlayerId = null;
    applyCardEffect(room, card);
    const swapEvent = room.lastEvent?.type === "swap" ? room.lastEvent : null;
    setEvent(room, { type: "play", from: player.id, card, swapMapping: swapEvent?.mapping || null });

    if (player.hand.length === 0) {
      room.phase = "finished";
      room.winnerId = player.id;
      return;
    }

    updateMustDraw(room);
    return;
  }

  throw new PublicError("Onbekende actie.");
}

function playBotTurn(room) {
  if (!room.botMode) throw new PublicError("Deze kamer heeft geen bot.");
  if (room.phase !== "playing") return;
  const bot = room.players[room.current];
  if (!bot?.isBot) return;

  updateMustDraw(room);
  if (!canPlayAnotherCard(room, bot)) {
    finishTurn(room, bot);
    return;
  }
  const playable = bot.hand.filter((card) => isPlayable(room, card, bot));
  if (playable.length === 0) {
    const hadPendingDraw = room.pendingDraw > 0;
    drawForTurn(room, bot, false);
    if (!hadPendingDraw && room.phase === "playing" && room.players[room.current]?.id === bot.id) {
      finishTurn(room, bot);
    }
    return;
  }

  const card = chooseBotCard(room, bot, playable);
  const cardIndex = bot.hand.findIndex((item) => item.id === card.id);
  if (cardIndex < 0) return;
  room.turnHistory.push({ playerId: bot.id, state: snapshotTurnState(room) });
  bot.hand.splice(cardIndex, 1);
  room.discard.push(card);
  room.chosenSuit = card.rank === "J" ? chooseBotSuit(bot, room.botDifficulty) : null;
  if (room.freePlayPlayerId === bot.id) room.freePlayPlayerId = null;
  applyCardEffect(room, card);
  const swapEvent = room.lastEvent?.type === "swap" ? room.lastEvent : null;
  setEvent(room, { type: "play", from: bot.id, card, swapMapping: swapEvent?.mapping || null });

  if (bot.hand.length === 0) {
    room.phase = "finished";
    room.winnerId = bot.id;
    return;
  }

  finishTurn(room, bot);
  updateMustDraw(room);
}

function chooseBotCard(room, bot, playable) {
  if (room.tutorialMode) return playable[0];
  if (room.botDifficulty === "easy") return playable[Math.floor(Math.random() * playable.length)];

  const scored = playable.map((card) => ({ card, score: botCardScore(card, bot, room) }));
  scored.sort((a, b) => b.score - a.score);
  if (room.botDifficulty === "medium" && Math.random() < 0.25) {
    return scored[Math.floor(Math.random() * scored.length)].card;
  }
  return scored[0].card;
}

function botCardScore(card, bot, room) {
  let score = 0;
  if (bot.hand.length === 1) score += 100;
  if (card.rank === "2") score += 22;
  if (card.rank === "Joker") score += 34;
  if (card.rank === "7" || card.rank === "K") score += 18;
  if (card.rank === "8") score += room.players.length === 2 ? 16 : 10;
  if (card.rank === "A") score += 10;
  if (card.rank === "10") score += bot.hand.length > room.players[nextIndex(room, room.current)].hand.length ? 20 : -8;
  if (card.rank === "J") score += 8;
  score += ranks.indexOf(card.rank) / 10;
  return score;
}

function chooseBotSuit(bot, difficulty) {
  if (difficulty === "easy") return suits[Math.floor(Math.random() * suits.length)];
  const counts = Object.fromEntries(suits.map((suit) => [suit, 0]));
  for (const card of bot.hand) {
    if (suits.includes(card.suit)) counts[card.suit] += 1;
  }
  return [...suits].sort((a, b) => counts[b] - counts[a])[0];
}

function startGame(room) {
  room.deck = shuffle(makeDeck());
  room.discard = [];
  room.current = 0;
  room.direction = 1;
  room.chosenSuit = null;
  room.pendingDraw = 0;
  room.pendingDrawRank = null;
  room.freePlayPlayerId = null;
  room.winnerId = null;
  room.winnerReason = null;
  room.notice = null;
  room.mustDrawPlayerId = null;
  room.mustDrawSince = null;
  room.resolvingForcedDraw = false;
  room.turnHistory = [];
  room.normalDrawPlayerId = null;
  room.phase = "playing";

  for (const player of room.players) {
    player.hand = [];
    for (let i = 0; i < 7; i += 1) player.hand.push(drawCard(room));
  }

  let first = drawCard(room);
  while (["2", "7", "8", "10", "J", "K", "A", "Joker"].includes(first.rank)) {
    room.deck.unshift(first);
    room.deck = shuffle(room.deck);
    first = drawCard(room);
  }
  room.discard.push(first);
  validateCards(room);
  updateMustDraw(room);
}

function setupTutorialGame(room) {
  const used = new Set();
  const take = (id) => {
    used.add(id);
    return cardById(id);
  };
  room.players[0].hand = [
    take("5-spades"),
    take("7-spades"),
    take("K-hearts"),
    take("J-clubs"),
    take("2-diamonds"),
    take("Joker-red"),
    take("9-clubs"),
  ];
  room.players[1].hand = [
    take("3-spades"),
    take("8-spades"),
    take("A-hearts"),
    take("10-clubs"),
    take("4-diamonds"),
    take("Q-hearts"),
    take("6-clubs"),
  ];
  room.discard = [take("5-hearts")];
  room.deck = shuffle(makeDeck().filter((card) => !used.has(card.id)));
  room.current = 0;
  room.direction = 1;
  room.chosenSuit = null;
  room.pendingDraw = 0;
  room.pendingDrawRank = null;
  room.freePlayPlayerId = null;
  room.turnHistory = [];
  room.normalDrawPlayerId = null;
  room.lastEvent = null;
  room.eventId = 0;
  validateCards(room);
}

function cardById(id) {
  const card = makeDeck().find((item) => item.id === id);
  if (!card) throw new PublicError(`Tutorial kaart ontbreekt: ${id}`);
  return { ...card };
}

function drawForTurn(room, player, endTurn) {
  if (room.pendingDraw > 0) {
    const count = room.pendingDraw;
    const drawRank = room.pendingDrawRank;
    const drawnCards = drawCards(room, player, count);
    setEvent(room, { type: "draw", to: player.id, count, cardIds: drawnCards.map((card) => card.id), forced: true });
    room.pendingDraw = 0;
    room.pendingDrawRank = null;
    room.mustDrawPlayerId = null;
    room.mustDrawSince = null;
    if (drawRank === "Joker") {
      room.freePlayPlayerId = player.id;
    } else {
      advanceTurn(room);
    }
    updateMustDraw(room);
    return;
  }

  const drawnCards = drawCards(room, player, 1);
  setEvent(room, { type: "draw", to: player.id, count: 1, cardIds: drawnCards.map((card) => card.id), forced: false });
  room.normalDrawPlayerId = player.id;
  room.mustDrawPlayerId = null;
  room.mustDrawSince = null;
  if (endTurn) finishTurn(room, player);
  updateMustDraw(room);
}

function applyCardEffect(room, card) {
  if (card.rank === "2") {
    room.pendingDraw += 2;
    room.pendingDrawRank = "2";
  }
  if (card.rank === "10") rotateHands(room);
  if (card.rank === "Joker") {
    room.pendingDraw += 5;
    room.pendingDrawRank = "Joker";
    room.freePlayPlayerId = null;
  }
  if (card.rank === "A") room.direction *= -1;
}

function advanceTurn(room) {
  room.current = nextIndex(room, room.current);
  room.turnHistory = [];
  room.normalDrawPlayerId = null;
  room.freePlayPlayerId = null;
}

function finishTurn(room, player) {
  if (room.mustDrawPlayerId === player.id) throw new PublicError("Je moet eerst een kaart pakken.");
  const current = room.players[room.current];
  if (!current || current.id !== player.id) throw new PublicError("Je bent niet aan de beurt.");
  const top = room.discard[room.discard.length - 1];
  advanceTurn(room);
  if (top?.rank === "8" && room.phase === "playing") advanceTurn(room);
  updateMustDraw(room);
}

function undoLastPlay(room, player) {
  const last = room.turnHistory[room.turnHistory.length - 1];
  if (!last || last.playerId !== player.id) throw new PublicError("Je kunt nu niets ongedaan maken.");
  const currentEventId = room.eventId;
  room.turnHistory.pop();
  restoreTurnState(room, last.state);
  room.eventId = Math.max(room.eventId, currentEventId);
  setEvent(room, { type: "undo", by: player.id });
  updateMustDraw(room);
}

function canPlayAnotherCard(room, player) {
  if (!room.turnHistory?.some((entry) => entry.playerId === player.id)) return true;
  if (room.freePlayPlayerId === player.id) return true;
  const top = room.discard[room.discard.length - 1];
  if (!top) return true;
  if (goAgainRanks.has(top.rank)) return true;
  return (top.rank === "8" || top.rank === "A") && room.players.length === 2;
}

function canDrawNow(room, player) {
  if (room.phase !== "playing") return false;
  if (room.players[room.current]?.id !== player.id) return false;
  if (room.pendingDraw > 0) return false;
  if (room.normalDrawPlayerId === player.id) return false;
  if (!canPlayAnotherCard(room, player)) return false;
  return !player.hand.some((card) => isPlayable(room, card, player));
}

function snapshotTurnState(room) {
  return {
    deck: cloneCards(room.deck),
    discard: cloneCards(room.discard),
    current: room.current,
    direction: room.direction,
    chosenSuit: room.chosenSuit,
    pendingDraw: room.pendingDraw,
    pendingDrawRank: room.pendingDrawRank,
    freePlayPlayerId: room.freePlayPlayerId,
    normalDrawPlayerId: room.normalDrawPlayerId,
    mustDrawPlayerId: room.mustDrawPlayerId,
    mustDrawSince: room.mustDrawSince,
    notice: room.notice ? { ...room.notice } : null,
    lastEvent: room.lastEvent ? structuredClone(room.lastEvent) : null,
    eventId: room.eventId,
    players: room.players.map((player) => ({ id: player.id, hand: cloneCards(player.hand) })),
  };
}

function restoreTurnState(room, state) {
  room.deck = cloneCards(state.deck);
  room.discard = cloneCards(state.discard);
  room.current = state.current;
  room.direction = state.direction;
  room.chosenSuit = state.chosenSuit;
  room.pendingDraw = state.pendingDraw;
  room.pendingDrawRank = state.pendingDrawRank;
  room.freePlayPlayerId = state.freePlayPlayerId;
  room.normalDrawPlayerId = state.normalDrawPlayerId;
  room.mustDrawPlayerId = state.mustDrawPlayerId;
  room.mustDrawSince = state.mustDrawSince;
  room.notice = state.notice ? { ...state.notice } : null;
  room.lastEvent = state.lastEvent ? structuredClone(state.lastEvent) : null;
  room.eventId = state.eventId;
  for (const savedPlayer of state.players) {
    const player = room.players.find((item) => item.id === savedPlayer.id);
    if (player) player.hand = cloneCards(savedPlayer.hand);
  }
}

function cloneCards(cards) {
  return cards.map((card) => ({ ...card }));
}

function updateMustDraw(room) {
  if (room.phase !== "playing") {
    room.mustDrawPlayerId = null;
    room.mustDrawSince = null;
    return;
  }
  const player = room.players[room.current];
  if (player && room.turnHistory?.some((entry) => entry.playerId === player.id)) {
    room.mustDrawPlayerId = null;
    room.mustDrawSince = null;
    return;
  }
  if (!player || player.hand.some((card) => isPlayable(room, card, player))) {
    room.mustDrawPlayerId = null;
    room.mustDrawSince = null;
    return;
  }
  if (room.mustDrawPlayerId !== player.id) room.mustDrawSince = Date.now();
  room.mustDrawPlayerId = player.id;
  room.notice = { playerId: player.id, text: "moet pakken", until: Date.now() + 3000 };
}

function autoResolveForcedDraw(room) {
  if (room.phase !== "playing" || room.pendingDraw <= 0 || !room.mustDrawPlayerId) return;
  if (room.resolvingForcedDraw) return;
  if (!room.mustDrawSince || Date.now() - room.mustDrawSince < forcedDrawDelayMs) return;
  const player = room.players[room.current];
  if (!player || player.id !== room.mustDrawPlayerId) return;
  room.resolvingForcedDraw = true;
  try {
    drawForTurn(room, player, false);
  } finally {
    room.resolvingForcedDraw = false;
  }
}

function nextIndex(room, from) {
  const total = room.players.length;
  return (from + room.direction + total) % total;
}

function isPlayable(room, card, player) {
  const top = room.discard[room.discard.length - 1];
  if (!top) return true;
  if (room.freePlayPlayerId === player?.id) return true;
  if (room.pendingDraw > 0) return card.rank === room.pendingDrawRank;
  if (card.rank === "Joker") return true;
  const activeSuit = room.chosenSuit || top.suit;
  return card.suit === activeSuit || card.rank === top.rank;
}

function publicState(room, sessionId) {
  passDisconnectedTurn(room);
  updateMustDraw(room);
  autoResolveForcedDraw(room);
  updateMustDraw(room);
  checkDisconnectWinner(room);
  validateCards(room);
  const now = Date.now();
  const me = room.players.find((player) => player.id === sessionId);
  const hand = me ? [...me.hand].sort(sortCards) : [];
  const notice = room.notice && room.notice.until > Date.now()
    ? {
        reason: "mustDraw",
        playerId: room.notice.playerId,
        playerName: room.players.find((player) => player.id === room.notice.playerId)?.name || "Player",
        count: room.pendingDraw || 1,
        pendingDrawRank: room.pendingDrawRank,
        until: room.notice.until,
      }
    : null;
  const nextPlayer = room.phase === "playing" ? room.players[nextIndex(room, room.current)] : null;
  const isCurrentViewer = room.phase === "playing" && room.players[room.current]?.id === sessionId;
  const canViewerPlayAnother = Boolean(isCurrentViewer && me && canPlayAnotherCard(room, me));
  const swapMapping = room.lastEvent?.type === "swap" ? room.lastEvent.mapping : room.lastEvent?.swapMapping;
  const viewerSwap = swapMapping
    ? swapMapping.find((item) => item.to === sessionId)
    : null;
  const viewerSwapFrom = viewerSwap
    ? room.players.find((player) => player.id === viewerSwap.from)?.name || "Speler"
    : null;

  return {
    code: room.code,
    localOrigin: getPreferredLocalOrigin(),
    maxPlayers: room.maxPlayers,
    phase: room.phase,
    botMode: Boolean(room.botMode),
    tutorialMode: Boolean(room.tutorialMode),
    botDifficulty: room.botDifficulty,
    isHost: room.hostId === sessionId,
    canUseHostTools: canUseHostTools(room, me),
    currentPlayerId: room.phase === "tutorial" ? null : room.players[room.current]?.id || null,
    deckCount: room.deck.length,
    topCard: room.discard[room.discard.length - 1] || null,
    chosenSuit: room.chosenSuit,
    pendingDraw: room.pendingDraw,
    pendingDrawRank: room.pendingDrawRank,
    freePlayPlayerId: room.freePlayPlayerId,
    mustDrawPlayerId: room.mustDrawPlayerId,
    nextPlayerId: nextPlayer?.id || null,
    nextPlayerName: nextPlayer?.name || null,
    notice,
    lastEvent: room.lastEvent,
    chat: room.botMode ? [] : room.chat.slice(-80),
    viewerSwapFrom,
    winnerReason: room.winnerReason || null,
    winner: room.winnerId ? room.players.find((player) => player.id === room.winnerId) : null,
    availableCards: canUseHostTools(room, me) ? [...room.deck].sort(sortCards) : [],
    canUndo: Boolean(isCurrentViewer && room.turnHistory.some((entry) => entry.playerId === sessionId)),
    canFinishTurn: Boolean(isCurrentViewer && room.mustDrawPlayerId !== sessionId),
    canDraw: Boolean(me && canDrawNow(room, me)),
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      handCount: player.hand.length,
      isYou: player.id === sessionId,
      isBot: Boolean(player.isBot),
      connected: player.isBot || now - player.connectedAt < disconnectedAfterMs,
      hand: room.tutorialMode && player.isBot ? [...player.hand].sort(sortCards) : undefined,
    })),
    hand,
    playableCardIds: hand.filter((card) => canViewerPlayAnother && isPlayable(room, card, me)).map((card) => card.id),
  };
}

function makeDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) deck.push({ id: `${rank}-${suit}`, suit, rank });
  }
  deck.push({ id: "Joker-red", suit: "joker", rank: "Joker", color: "red" });
  deck.push({ id: "Joker-black", suit: "joker", rank: "Joker", color: "black" });
  return deck;
}

function canUseHostTools(room, player) {
  return Boolean(player && player.id === room.hostId && player.name === testHostName);
}

function addChatMessage(room, player, text) {
  const cleanText = moderateText(String(text || "").trim().slice(0, 160));
  if (!cleanText) throw new PublicError("Typ eerst een bericht.");
  room.chat.push({
    id: `${Date.now()}-${room.chat.length}`,
    playerId: player.id,
    name: player.name,
    text: cleanText,
    at: Date.now(),
  });
  if (room.chat.length > 100) room.chat = room.chat.slice(-100);
}

function moderateText(text) {
  let result = text.replace(/\s+/g, " ");
  for (const word of blockedWords) {
    const pattern = new RegExp(`\\b${escapeRegex(word)}\\b`, "gi");
    result = result.replace(pattern, "*".repeat(Math.min(word.length, 8)));
  }
  return result;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function checkDisconnectWinner(room) {
  if (room.botMode) return;
  if (room.phase !== "playing" || room.players.length < 2) return;
  const now = Date.now();
  const connectedPlayers = room.players.filter((player) => now - player.connectedAt < disconnectedAfterMs);
  if (connectedPlayers.length !== 1) return;
  room.phase = "finished";
  room.winnerId = connectedPlayers[0].id;
  room.winnerReason = "disconnected";
}

function passDisconnectedTurn(room) {
  if (room.botMode || room.phase !== "playing" || room.players.length < 2) return;
  const now = Date.now();
  const connectedPlayers = room.players.filter((player) => now - player.connectedAt < disconnectedAfterMs);
  if (connectedPlayers.length <= 1) return;
  let current = room.players[room.current];
  let guard = 0;
  while (current && now - current.connectedAt >= disconnectedAfterMs && guard < room.players.length) {
    advanceTurn(room);
    room.mustDrawPlayerId = null;
    room.mustDrawSince = null;
    current = room.players[room.current];
    guard += 1;
  }
}

function drawCards(room, player, count) {
  const drawnCards = [];
  for (let i = 0; i < count; i += 1) {
    const card = drawCard(room);
    player.hand.push(card);
    drawnCards.push(card);
  }
  return drawnCards;
}

function drawCard(room) {
  if (room.deck.length === 0) recycleDiscard(room);
  const card = room.deck.pop();
  if (!card) throw new PublicError("Er zijn geen kaarten meer om te pakken.");
  return card;
}

function recycleDiscard(room) {
  if (room.discard.length <= 1) return;
  const top = room.discard.pop();
  room.deck = shuffle(room.discard);
  room.discard = [top];
}

function rotateHands(room) {
  const oldHands = room.players.map((player) => player.hand);
  const mapping = [];
  for (let i = 0; i < room.players.length; i += 1) {
    const previous = (i - 1 + room.players.length) % room.players.length;
    room.players[i].hand = oldHands[previous];
    mapping.push({ to: room.players[i].id, from: room.players[previous].id, count: room.players[i].hand.length });
  }
  setEvent(room, { type: "swap", mapping });
}

function setEvent(room, event) {
  room.eventId += 1;
  room.lastEvent = { ...event, id: room.eventId, at: Date.now() };
}

function validateCards(room) {
  if (room.phase === "waiting") return;
  const seen = new Set();
  const allCards = [
    ...room.deck,
    ...room.discard,
    ...room.players.flatMap((player) => player.hand),
  ];
  for (const card of allCards) {
    const key = card.id;
    if (seen.has(key)) throw new PublicError("Kaartfout: dubbele kaart gevonden.");
    seen.add(key);
  }
  if (seen.size > 54) throw new PublicError("Kaartfout: te veel kaarten in het spel.");
}

function makePlayer(sessionId, name, host, isBot = false) {
  return {
    id: sessionId || cryptoId(),
    name: cleanName(name || (host ? "Host" : "Speler")),
    hand: [],
    connectedAt: Date.now(),
    isBot,
  };
}

function getRoom(code) {
  const room = rooms.get(code);
  if (!room) throw new PublicError("Kamer niet gevonden.");
  return room;
}

function touchPlayer(room, sessionId) {
  const player = room.players.find((item) => item.id === sessionId);
  if (player) player.connectedAt = Date.now();
  return player;
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function cleanCode(code) {
  return String(code || "").trim().toUpperCase();
}

function cleanName(name) {
  return String(name || "Speler").trim().slice(0, 18) || "Speler";
}

function cleanBotDifficulty(difficulty) {
  return ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "medium";
}

function botName(difficulty) {
  if (difficulty === "easy") return "Easy Bot";
  if (difficulty === "hard") return "Hard Bot";
  return "Medium Bot";
}

function sortCards(a, b) {
  if (a.suit === "joker" || b.suit === "joker") return a.suit === b.suit ? 0 : a.suit === "joker" ? 1 : -1;
  const suitOrder = suits.indexOf(a.suit) - suits.indexOf(b.suit);
  if (suitOrder !== 0) return suitOrder;
  return ranks.indexOf(a.rank) - ranks.indexOf(b.rank);
}

function shuffle(cards) {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cryptoId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function serveFile(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = url.pathname === "/" || /^\/kamers\/[A-Z0-9]+(?:\/join)?\/?$/i.test(url.pathname)
    ? "/index.html"
    : url.pathname;
  const filePath = path.normalize(path.join(ROOT, requested));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100_000) reject(new PublicError("Verzoek is te groot."));
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new PublicError("Ongeldige JSON."));
      }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function getLocalAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => item.address);
}

function getPreferredLocalOrigin() {
  const [address] = getLocalAddresses();
  return address ? `http://${address}:${PORT}` : "";
}

class PublicError extends Error {}
