import { ARCADE_GAMES, clamp } from "./arcade-games.js";

const STORAGE_KEY = "arcade_vault_scores_v1";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const gameListEl = document.getElementById("game-list");
const titleEl = document.getElementById("game-title");
const taglineEl = document.getElementById("game-tagline");
const instructionsEl = document.getElementById("instructions");
const descriptionEl = document.getElementById("game-description");
const hudEl = document.getElementById("hud");
const scoreboardEl = document.getElementById("scoreboard");
const overlayEl = document.getElementById("overlay");
const restartButton = document.getElementById("restart-button");
const pauseButton = document.getElementById("pause-button");
const randomButton = document.getElementById("random-game-button");

const gameMap = Object.fromEntries(ARCADE_GAMES.map((game) => [game.id, game]));

const app = {
  activeGameId: ARCADE_GAMES[0].id,
  activeState: null,
  paused: false,
  lastTime: 0,
  scores: loadScores(),
  input: {
    keys: new Set(),
    pointer: { x: 0, y: 0, down: false },
  },
};

function loadScores() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function saveScores() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(app.scores));
  } catch (error) {
    return;
  }
}

function activeGame() {
  return gameMap[app.activeGameId];
}

function updateCanvasSize() {
  const game = activeGame();
  canvas.width = game.width;
  canvas.height = game.height;
}

function bestScore(gameId) {
  return app.scores[gameId] || 0;
}

function registerScore() {
  const game = activeGame();
  const score = Math.floor(app.activeState?.score || 0);
  if (score > bestScore(game.id)) {
    app.scores[game.id] = score;
    saveScores();
  }
}

function setOverlay() {
  const state = app.activeState;
  const game = activeGame();
  const lines = [];
  if (app.paused) {
    lines.push("<strong>Paused</strong>");
  }
  if (state?.won) {
    lines.push("<strong>Cabinet Cleared</strong>");
    lines.push("Hit Restart to run it again.");
  } else if (state?.gameOver) {
    lines.push("<strong>Run Over</strong>");
    lines.push("Hit Restart for another credit.");
  }
  overlayEl.innerHTML = lines.join("");
  overlayEl.classList.toggle("is-visible", lines.length > 0);
  pauseButton.textContent = app.paused ? "Resume" : "Pause";
}

function renderLibrary() {
  gameListEl.innerHTML = ARCADE_GAMES.map((game) => `
    <button class="game-card ${game.id === app.activeGameId ? "is-active" : ""}" type="button" data-game-id="${game.id}">
      <div>
        <p class="card-year">${game.year}</p>
        <h3>${game.title}</h3>
        <p class="card-copy">${game.tagline}</p>
      </div>
      <span class="card-score">Best ${bestScore(game.id)}</span>
    </button>
  `).join("");
}

function renderInfo() {
  const game = activeGame();
  titleEl.textContent = game.title;
  taglineEl.textContent = game.tagline;
  descriptionEl.textContent = game.description;
  instructionsEl.innerHTML = game.controls.map((line) => `<p>${line}</p>`).join("");
}

function renderHud() {
  const game = activeGame();
  const state = app.activeState;
  const hud = game.hud ? game.hud(state) : {};
  hudEl.innerHTML = Object.entries(hud)
    .map(
      ([label, value]) => `
        <div class="hud-card">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");
  scoreboardEl.innerHTML = `
    <div class="score-row"><span>Personal Best</span><strong>${bestScore(game.id)}</strong></div>
    <div class="score-row"><span>Current Score</span><strong>${Math.floor(state?.score || 0)}</strong></div>
  `;
  setOverlay();
}

function restartGame() {
  app.activeState = activeGame().create();
  app.paused = false;
  app.lastTime = 0;
  renderHud();
}

function selectGame(gameId) {
  if (!gameMap[gameId]) {
    return;
  }
  app.activeGameId = gameId;
  updateCanvasSize();
  renderLibrary();
  renderInfo();
  restartGame();
}

function randomGame() {
  const options = ARCADE_GAMES.filter((game) => game.id !== app.activeGameId);
  const pick = options[Math.floor(Math.random() * options.length)];
  selectGame(pick.id);
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: clamp((event.clientX - rect.left) * scaleX, 0, canvas.width),
    y: clamp((event.clientY - rect.top) * scaleY, 0, canvas.height),
  };
}

function step(timestamp) {
  const game = activeGame();
  const dt = Math.min(0.05, app.lastTime ? (timestamp - app.lastTime) / 1000 : 0);
  app.lastTime = timestamp;

  if (!app.paused && app.activeState && game.update) {
    game.update(app.activeState, app.input, dt);
    if (app.activeState.gameOver || app.activeState.won) {
      registerScore();
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  game.render(ctx, app.activeState, app.input);
  renderHud();
  window.requestAnimationFrame(step);
}

function bindEvents() {
  gameListEl.addEventListener("click", (event) => {
    const card = event.target.closest("[data-game-id]");
    if (!card) {
      return;
    }
    selectGame(card.dataset.gameId);
  });

  restartButton.addEventListener("click", restartGame);
  pauseButton.addEventListener("click", () => {
    app.paused = !app.paused;
    setOverlay();
  });
  randomButton.addEventListener("click", randomGame);

  window.addEventListener("keydown", (event) => {
    app.input.keys.add(event.key);
    if (app.paused) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Spacebar"].includes(event.key)) {
        event.preventDefault();
      }
      return;
    }
    const game = activeGame();
    game.onKeyDown?.(app.activeState, event.key, app.input);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Spacebar"].includes(event.key)) {
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    app.input.keys.delete(event.key);
    activeGame().onKeyUp?.(app.activeState, event.key, app.input);
  });

  canvas.addEventListener("pointermove", (event) => {
    const pointer = pointerPosition(event);
    app.input.pointer = { ...pointer, down: app.input.pointer.down };
    if (app.paused) {
      return;
    }
    activeGame().onPointerMove?.(app.activeState, pointer, app.input);
  });

  canvas.addEventListener("pointerdown", (event) => {
    const pointer = pointerPosition(event);
    app.input.pointer = { ...pointer, down: true };
    if (app.paused) {
      return;
    }
    activeGame().onPointerDown?.(app.activeState, pointer, app.input);
  });

  canvas.addEventListener("pointerup", (event) => {
    const pointer = pointerPosition(event);
    app.input.pointer = { ...pointer, down: false };
    if (app.paused) {
      return;
    }
    activeGame().onPointerUp?.(app.activeState, pointer, app.input);
  });
}

function init() {
  bindEvents();
  selectGame(app.activeGameId);
  window.requestAnimationFrame(step);
}

init();
