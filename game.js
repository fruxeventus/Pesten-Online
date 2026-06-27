const $ = (selector) => document.querySelector(selector);

const homeScreen = $("#homeScreen");
const roomScreen = $("#roomScreen");
const heroTitle = $(".hero h2");
const heroCopy = $(".hero p");
const createForm = $("#createForm");
const joinForm = $("#joinForm");
const createName = $("#createName");
const joinName = $("#joinName");
const playerCount = $("#playerCount");
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
const copyLinkButton = $("#copyLinkButton");
const sharePanel = $("#sharePanel");
const shareLink = $("#shareLink");
const cardPickerDialog = $("#cardPickerDialog");
const cardPickerGrid = $("#cardPickerGrid");
const closeCardPickerButton = $("#closeCardPickerButton");
const winScreen = $("#winScreen");
const winnerTitle = $("#winnerTitle");
const winnerText = $("#winnerText");
const closeWinButton = $("#closeWinButton");
const turnOverlay = $("#turnOverlay");

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
let dismissedWinKey = "";

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
closeWinButton.addEventListener("click", () => {
  dismissedWinKey = winKey(state);
  winScreen.classList.add("hidden");
});
closeCardPickerButton.addEventListener("click", () => cardPickerDialog.close());

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
    copyLinkButton.textContent = "Gekopieerd";
  } catch {
    copyLinkButton.textContent = "Selecteer link";
  }
  setTimeout(() => {
    copyLinkButton.textContent = "Kopieer link";
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
    connection.textContent = "Niet verbonden";
    render();
    return;
  }
  if (!getPlayerFromUrl()) {
    connection.textContent = "Niet in kamer";
    renderJoin();
    pollTimer = setTimeout(poll, 900);
    return;
  }

  try {
    state = await api(`/api/state?code=${encodeURIComponent(room)}&sessionId=${encodeURIComponent(sessionId)}`);
    connection.textContent = "Verbonden";
    render();
  } catch (error) {
    connection.textContent = "Niet in kamer";
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

function render() {
  const inRoom = Boolean(room && state);
  homeScreen.classList.toggle("hidden", inRoom);
  roomScreen.classList.toggle("hidden", !inRoom);
  joinForm.classList.add("hidden");
  createForm.classList.remove("hidden");
  if (!inRoom && !room) renderCreateHome();
  if (!inRoom) return;

  const me = state.players.find((player) => player.isYou);
  const current = state.players.find((player) => player.id === state.currentPlayerId);
  const isMyTurn = me && state.currentPlayerId === me.id && state.phase === "playing";
  const cannotPlay = isMyTurn && state.playableCardIds.length === 0;
  const mustDraw = isMyTurn && state.mustDrawPlayerId === me?.id;

  roomCodeLabel.textContent = state.code;
  statusLabel.textContent = state.phase === "waiting" ? `${state.players.length}/${state.maxPlayers} wachten` : phaseLabel(state.phase);
  youLabel.textContent = me ? me.name : "Toeschouwer";
  sharePanel.hidden = !state.isHost || state.phase !== "waiting";
  shareLink.textContent = roomLink();
  startButton.hidden = !state.isHost || state.phase !== "waiting";
  startButton.disabled = state.players.length < 2;
  hostWinButton.hidden = !state.isHost || state.phase === "finished";
  giveCardButton.hidden = !state.isHost || state.phase !== "playing";
  drawButton.disabled = !isMyTurn || (state.pendingDraw > 0 && mustDraw);
  deckCount.textContent = state.deckCount;
  turnInfo.textContent = turnLine(state, current);

  opponents.innerHTML = state.players
    .map((player) => {
      const active = player.id === state.currentPlayerId ? " active" : "";
      const offline = player.connected ? "" : " offline";
      const you = player.isYou ? " (jij)" : "";
      const presence = player.connected ? "verbonden" : "offline";
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
      if (!state.playableCardIds.includes(cardId)) return;
      animatePlay(cardEl);
      setTimeout(() => sendAction("play", { cardId }), 180);
    });
  }

  if (state.phase === "waiting") {
    message.textContent = state.isHost
      ? "Deel de link. Je kunt starten zodra er minstens 2 spelers zijn."
      : "Wachten tot de host het spel start.";
  } else if (state.phase === "finished") {
    message.textContent = state.winner ? `${state.winner.name} heeft gewonnen.` : "Spel afgelopen.";
  } else if (isMyTurn) {
    const stackCard = state.pendingDrawRank === "Joker" ? "joker" : "2";
    message.textContent = state.pendingDraw > 0
      ? mustDraw
        ? `Je kan geen ${stackCard} leggen. Het spel pakt zo ${state.pendingDraw} kaarten.`
        : `Jij bent aan de beurt. Leg een ${stackCard}.`
      : mustDraw || cannotPlay
        ? "Je kan niet. Pak een kaart."
        : "Jij bent aan de beurt. Leg een kaart of pak.";
  } else {
    message.textContent = current ? `${current.name} is aan de beurt.` : "Wachten.";
  }

  if (state.notice) message.textContent = state.notice.text;
  renderWinScreen(state);
  animateStateChanges(lastRenderedState, state);
  lastRenderedState = snapshotState(state);
}

function renderJoin(errorText = "") {
  homeScreen.classList.remove("hidden");
  roomScreen.classList.add("hidden");
  heroTitle.textContent = "Meedoen met een kamer";
  heroCopy.textContent = "Vul je naam in om met deze kamer mee te doen. De host start het spel zodra iedereen binnen is.";
  createForm.classList.add("hidden");
  joinForm.classList.remove("hidden");
  if (joinRenderedFor !== room) {
    joinName.value = "";
    joinRenderedFor = room;
  }
  joinForm.querySelector(".panel-copy").textContent = errorText && errorText !== "Kamer niet gevonden."
    ? errorText
    : `Je bent uitgenodigd voor kamer ${room}.`;
}

function renderCreateHome() {
  heroTitle.textContent = "Maak een kamer en deel de link";
  heroCopy.textContent = "Kies hoeveel spelers mee mogen doen, maak een kamer en stuur de link naar je vrienden. Zij vullen alleen hun naam in.";
}

function openCardPicker() {
  if (!state?.isHost || state.phase !== "playing") return;
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
    if (current) showTurnOverlay(`${current.name} is aan de beurt`);
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
    if (current) showTurnOverlay(`${current.name} is aan de beurt`);
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

  if (event.type === "swap") {
    const swap = event.mapping.find((item) => item.to === me.id);
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

function animateDraw(count = 1, options = {}) {
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
      const target = incomingCard ? safeRect(incomingCard, handTargetRect()) : handTargetRect();
      const clone = document.createElement("div");
      clone.className = "card-back flight-back";
      const destination = incomingCard ? target : targetForIndex(target, i);
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
  winnerTitle.textContent = isYou ? "Jij hebt gewonnen!" : `${nextState.winner.name} heeft gewonnen!`;
  winnerText.textContent = isYou ? "Lekker gespeeld. Je bent al je kaarten kwijt." : "Het spel is afgelopen.";
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
  if (nextState.phase === "waiting") return "Volgende: wacht op start";
  if (nextState.phase === "finished") return "Spel afgelopen";
  const currentName = current?.name || "-";
  const nextName = nextState.nextPlayerName || "-";
  const swapText = nextState.viewerSwapFrom ? ` | Jij kreeg kaarten van ${nextState.viewerSwapFrom}` : "";
  return `Nu: ${currentName} | Volgende: ${nextName}${swapText}`;
}

function showSwapSource(name) {
  message.textContent = `Jij kreeg kaarten van ${name}.`;
}

function showTurnOverlay(text) {
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

function setRoomUrl(code, playerId = getPlayerFromUrl()) {
  const url = new URL(`/kamers/${code}/`, location.origin);
  if (playerId) url.searchParams.set("player", playerId);
  history.pushState({}, "", url);
}

function getRoomFromUrl() {
  const pathRoom = location.pathname.match(/^\/kamers\/([^/]+)\/?$/i)?.[1];
  return (pathRoom || new URLSearchParams(location.search).get("room") || "").trim().toUpperCase();
}

function getPlayerFromUrl() {
  return new URLSearchParams(location.search).get("player") || "";
}

function roomLink() {
  const origin = shareOrigin();
  return `${origin}/kamers/${encodeURIComponent(room)}/`;
}

function shareOrigin() {
  const localNames = new Set(["localhost", "127.0.0.1", "::1"]);
  if (localNames.has(location.hostname) && state?.localOrigin) return state.localOrigin;
  return location.origin;
}

function phaseLabel(phase) {
  if (phase === "playing") return "bezig";
  if (phase === "finished") return "afgelopen";
  return phase;
}

function cleanName(value) {
  return value.trim().slice(0, 18) || "Speler";
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
