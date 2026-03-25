const TOTAL_VARIANTS = 8 * 16 * 16 * 8 * 64;
const CATALOG_SIZE = 2048;
const CATALOG_STEP = 137;
const PAGE_SIZE = 24;

const STORAGE_KEYS = {
  favorites: "arcade-megavault-favorites",
  scores: "arcade-megavault-scores",
  recent: "arcade-megavault-recent",
  visit: "arcade-megavault-visit"
};

const baseGames = [
  {
    key: "meteor-dodge",
    title: "Meteor Dodge",
    badge: "MD",
    genre: "Reflex",
    engine: "dodge",
    summary: "Slide between falling meteor swarms and squeeze out close saves.",
    controls: "Move with arrow keys, A and D, or drag across the stage.",
    defaults: { speed: 1.04, density: 1.08, duration: 46, lives: 3, board: 1, preview: 1, mineRatio: 0.16, mathMax: 12 }
  },
  {
    key: "target-rush",
    title: "Target Rush",
    badge: "TR",
    genre: "Arcade",
    engine: "tap",
    summary: "Smash glowing targets, chain combos, and race the clock.",
    controls: "Click or tap targets before they disappear.",
    defaults: { speed: 1.02, density: 1.1, duration: 38, lives: 3, board: 1, preview: 1, mineRatio: 0.16, mathMax: 12 }
  },
  {
    key: "snake-surge",
    title: "Snake Surge",
    badge: "SS",
    genre: "Endless",
    engine: "snake",
    summary: "Guide a speed snake through dense grids without clipping your tail.",
    controls: "Use arrow keys, WASD, or the touch pad to turn.",
    defaults: { speed: 1.01, density: 1, duration: 52, lives: 1, board: 1.04, preview: 1, mineRatio: 0.16, mathMax: 12 }
  },
  {
    key: "vault-hopper",
    title: "Vault Hopper",
    badge: "VH",
    genre: "Reflex",
    engine: "runner",
    summary: "Sprint, leap, and survive obstacle waves in a side-scrolling dash.",
    controls: "Jump with space, W, the up arrow, or a tap on the stage.",
    defaults: { speed: 1.08, density: 1.02, duration: 42, lives: 3, board: 1, preview: 1, mineRatio: 0.16, mathMax: 12 }
  },
  {
    key: "memory-matrix",
    title: "Memory Matrix",
    badge: "MM",
    genre: "Puzzle",
    engine: "memory",
    summary: "Flip coded tiles, keep the pattern in mind, and clear the board fast.",
    controls: "Tap two cards at a time to find matching pairs.",
    defaults: { speed: 0.96, density: 0.96, duration: 52, lives: 3, board: 1.04, preview: 1.04, mineRatio: 0.16, mathMax: 12 }
  },
  {
    key: "brick-burst",
    title: "Brick Burst",
    badge: "BB",
    genre: "Arcade",
    engine: "breakout",
    summary: "Carve a path through brick walls with a fast paddle and a hot ball.",
    controls: "Move with left and right, drag the paddle, or use touch buttons.",
    defaults: { speed: 1.04, density: 1.06, duration: 56, lives: 3, board: 1, preview: 1, mineRatio: 0.16, mathMax: 12 }
  },
  {
    key: "minefield-sprint",
    title: "Minefield Sprint",
    badge: "MS",
    genre: "Strategy",
    engine: "mines",
    summary: "Read the board, reveal safe pockets, and avoid a quick collapse.",
    controls: "Click to reveal and right-click to flag danger zones.",
    defaults: { speed: 0.94, density: 1, duration: 70, lives: 1, board: 1, preview: 1, mineRatio: 0.18, mathMax: 12 }
  },
  {
    key: "sum-streak",
    title: "Sum Streak",
    badge: "SU",
    genre: "Puzzle",
    engine: "sum",
    summary: "Solve rapid-fire equations, stack combos, and keep the clock alive.",
    controls: "Type answers or use the on-screen keypad, then submit.",
    defaults: { speed: 1.02, density: 1, duration: 44, lives: 3, board: 1, preview: 1, mineRatio: 0.16, mathMax: 18 }
  }
];

const biomes = [
  { name: "Sunburst", flavor: "sunlit decks and blazing rails" },
  { name: "Stormfront", flavor: "rain-lashed rooftops and voltage fog" },
  { name: "Glacier", flavor: "frozen lanes and bright glass ice" },
  { name: "Reactor", flavor: "overheated cooling towers and warning strobes" },
  { name: "Mirage", flavor: "heat haze dunes and shifting light" },
  { name: "Harbor", flavor: "container yards and floodlit cranes" },
  { name: "Circuit", flavor: "electric alleys and pulse signage" },
  { name: "Ironwood", flavor: "dense timber catwalks and deep shadows" },
  { name: "Lavafall", flavor: "molten cliffs and cracked obsidian bridges" },
  { name: "Moonbase", flavor: "low-grav halls and polished steel bays" },
  { name: "Quartz", flavor: "crystal tunnels and hard reflections" },
  { name: "Dustline", flavor: "wind-whipped highways and rust towers" },
  { name: "Nightshift", flavor: "late-hour arcades and neon alleys" },
  { name: "Tidepool", flavor: "slick decks and salt-heavy air" },
  { name: "Skyrail", flavor: "open-air transit lines above the city" },
  { name: "Forge", flavor: "hammer-lit foundries and sparks in the haze" }
];

const mutators = [
  { key: "turbo", name: "Turbo", speed: 1.26, density: 1.1, duration: 0.92, score: 1.2, board: 0.98, lives: 0, preview: 0.94, wrap: false, blurb: "Everything pushes faster and tighter." },
  { key: "ironman", name: "Ironman", speed: 1.08, density: 1.08, duration: 1, score: 1.26, board: 1, lives: -1, preview: 0.96, wrap: false, blurb: "Less room for mistakes and bigger payouts." },
  { key: "drift", name: "Drift", speed: 1.1, density: 1.02, duration: 1.02, score: 1.16, board: 1.02, lives: 0, preview: 0.98, wrap: false, blurb: "Momentum hangs longer and turns feel slippery." },
  { key: "chill", name: "Chill", speed: 0.86, density: 0.88, duration: 1.14, score: 0.96, board: 1.04, lives: 1, preview: 1.24, wrap: false, blurb: "Longer reads, softer pace, cleaner recoveries." },
  { key: "tiny", name: "Tiny", speed: 1.16, density: 1.08, duration: 0.98, score: 1.18, board: 0.84, lives: 0, preview: 0.95, wrap: false, blurb: "Tighter arenas and smaller safe zones." },
  { key: "giant", name: "Giant", speed: 0.94, density: 0.96, duration: 1.04, score: 1.08, board: 1.18, lives: 1, preview: 1.06, wrap: false, blurb: "Bigger boards open up more creative lines." },
  { key: "ghost", name: "Ghost", speed: 1.08, density: 1.02, duration: 0.98, score: 1.16, board: 1, lives: 0, preview: 0.84, wrap: false, blurb: "Visual reads go dim and memory matters more." },
  { key: "zen", name: "Zen", speed: 0.82, density: 0.86, duration: 1.18, score: 0.92, board: 1.1, lives: 1, preview: 1.28, wrap: false, blurb: "A slower, smoother route to a clean score." },
  { key: "wildcard", name: "Wildcard", speed: 1.18, density: 1.22, duration: 0.96, score: 1.22, board: 1.04, lives: 0, preview: 0.94, wrap: false, blurb: "Density spikes and timing windows change often." },
  { key: "mirror", name: "Mirror", speed: 1.02, density: 1.06, duration: 1, score: 1.16, board: 1, lives: 0, preview: 0.98, wrap: true, blurb: "Routes fold back on themselves in strange ways." },
  { key: "surge", name: "Surge", speed: 1.22, density: 1.14, duration: 0.94, score: 1.2, board: 0.96, lives: 0, preview: 0.92, wrap: false, blurb: "Constant pressure keeps every second active." },
  { key: "precision", name: "Precision", speed: 1, density: 0.92, duration: 1.02, score: 1.2, board: 1, lives: 0, preview: 1.02, wrap: false, blurb: "Lower clutter, sharper choices, higher reward." },
  { key: "gravity", name: "Gravity", speed: 1.1, density: 1.02, duration: 0.98, score: 1.12, board: 0.98, lives: 0, preview: 0.98, wrap: false, blurb: "Movement weights heavier and landings matter." },
  { key: "double", name: "Double", speed: 1.08, density: 1.12, duration: 0.98, score: 1.18, board: 1.06, lives: 0, preview: 1, wrap: false, blurb: "More targets, more clutter, more upside." },
  { key: "nightcore", name: "Nightcore", speed: 1.24, density: 1.08, duration: 0.9, score: 1.24, board: 0.96, lives: 0, preview: 0.9, wrap: false, blurb: "The whole cabinet feels sped-up and sharp." },
  { key: "overclock", name: "Overclock", speed: 1.3, density: 1.16, duration: 0.9, score: 1.28, board: 0.96, lives: -1, preview: 0.88, wrap: false, blurb: "Fast enough that every save feels impossible." }
];

const missions = [
  { key: "sprint", name: "Sprint", speed: 1.12, density: 1.02, duration: 0.82, score: 1.18, board: 1, lives: 0, preview: 0.96, wrap: false, objective: "Burn through a short run and hit the score target early." },
  { key: "marathon", name: "Marathon", speed: 0.96, density: 1.04, duration: 1.28, score: 1.12, board: 1.04, lives: 1, preview: 1.06, wrap: false, objective: "Stretch the run and hold your focus for the long haul." },
  { key: "precision", name: "Precision", speed: 0.98, density: 0.9, duration: 1.04, score: 1.22, board: 1, lives: 0, preview: 1.08, wrap: false, objective: "Keep mistakes to a minimum and cash in clean decisions." },
  { key: "gold-rush", name: "Gold Rush", speed: 1.06, density: 1.08, duration: 0.96, score: 1.28, board: 0.98, lives: 0, preview: 0.98, wrap: false, objective: "Push score over stability and chase the huge payoff." },
  { key: "endurance", name: "Endurance", speed: 1, density: 0.98, duration: 1.16, score: 1.12, board: 1.06, lives: 1, preview: 1.08, wrap: false, objective: "Stay steady, survive the pace, and finish with resources left." },
  { key: "night-shift", name: "Night Shift", speed: 1.04, density: 1.14, duration: 1.02, score: 1.18, board: 1, lives: 0, preview: 0.92, wrap: false, objective: "Handle the denser late-hour variant without dropping your rhythm." },
  { key: "clean-sweep", name: "Clean Sweep", speed: 1, density: 1.02, duration: 1.02, score: 1.16, board: 1.1, lives: 0, preview: 1.02, wrap: false, objective: "Clear the board or lane with as few wasted moves as possible." },
  { key: "frenzy", name: "Frenzy", speed: 1.18, density: 1.18, duration: 0.92, score: 1.32, board: 0.96, lives: 0, preview: 0.9, wrap: true, objective: "Accept the chaos and survive one brutal rush of pressure." }
];

const memorySymbols = ["AX", "BZ", "CQ", "DV", "EL", "FM", "GH", "IP", "JR", "KT", "LU", "NW"];

const state = {
  catalogStart: 0,
  catalog: [],
  filtered: [],
  visibleCount: PAGE_SIZE,
  query: "",
  genre: "All",
  selectedVariant: null,
  activeGame: null,
  favorites: loadStorage(STORAGE_KEYS.favorites, []),
  scores: loadStorage(STORAGE_KEYS.scores, {}),
  recent: loadStorage(STORAGE_KEYS.recent, []),
  visit: loadStorage(STORAGE_KEYS.visit, { lastDate: "", streak: 0, daysVisited: 0 })
};

const elements = {
  searchForm: document.getElementById("search-form"),
  searchInput: document.getElementById("search-input"),
  filters: document.getElementById("genre-filters"),
  catalogGrid: document.getElementById("catalog-grid"),
  catalogStatus: document.getElementById("catalog-status"),
  focusTitle: document.getElementById("focus-title"),
  focusSummary: document.getElementById("focus-summary"),
  focusMeta: document.getElementById("focus-meta"),
  launchCurrent: document.getElementById("launch-current"),
  favoriteCurrent: document.getElementById("favorite-current"),
  remixCurrent: document.getElementById("remix-current"),
  hudScore: document.getElementById("hud-score"),
  hudBest: document.getElementById("hud-best"),
  hudMode: document.getElementById("hud-mode"),
  hudStatus: document.getElementById("hud-status"),
  gameStage: document.getElementById("game-stage"),
  controlHint: document.getElementById("control-hint"),
  touchControls: document.getElementById("touch-controls"),
  statTotal: document.getElementById("stat-total"),
  statSlice: document.getElementById("stat-slice"),
  statFavorites: document.getElementById("stat-favorites"),
  statStreak: document.getElementById("stat-streak"),
  queueList: document.getElementById("queue-list"),
  favoritesList: document.getElementById("favorites-list"),
  randomLaunch: document.getElementById("random-launch"),
  dailyLaunch: document.getElementById("daily-launch"),
  rerollCatalog: document.getElementById("reroll-catalog"),
  loadMore: document.getElementById("load-more")
};

const genreOptions = ["All", ...Array.from(new Set(baseGames.map((game) => game.genre)))];

const gameFactories = {
  dodge: createDodgeGame,
  tap: createTapGame,
  snake: createSnakeGame,
  runner: createRunnerGame,
  memory: createMemoryGame,
  breakout: createBreakoutGame,
  mines: createMinesGame,
  sum: createSumGame
};

bootstrap();

function bootstrap() {
  updateVisitState();
  rebuildCatalog(false);
  renderFilters();
  attachEvents();

  const daily = getDailyVariant();
  state.selectedVariant = daily;

  renderStats();
  applyFilters();
  renderQueue();
  renderFavorites();
  renderFocus();
}

function attachEvents() {
  elements.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.query = elements.searchInput.value.trim().toLowerCase();
    state.visibleCount = PAGE_SIZE;
    applyFilters();
  });

  elements.searchInput.addEventListener("input", () => {
    state.query = elements.searchInput.value.trim().toLowerCase();
    state.visibleCount = PAGE_SIZE;
    applyFilters();
  });

  elements.filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-genre]");
    if (!button) {
      return;
    }

    state.genre = button.dataset.genre;
    state.visibleCount = PAGE_SIZE;
    renderFilters();
    applyFilters();
  });

  elements.catalogGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const index = Number(button.dataset.index);
    const variant = createVariantFromIndex(index);
    handleVariantAction(button.dataset.action, variant);
  });

  elements.queueList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-index]");
    if (!button) {
      return;
    }

    launchVariant(createVariantFromIndex(Number(button.dataset.index)));
  });

  elements.favoritesList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const variant = createVariantFromIndex(Number(button.dataset.index));
    handleVariantAction(button.dataset.action, variant);
  });

  document.querySelectorAll("[data-playlist]").forEach((button) => {
    button.addEventListener("click", () => {
      const pick = pickPlaylistVariant(button.dataset.playlist);
      if (pick) {
        launchVariant(pick);
      }
    });
  });

  elements.randomLaunch.addEventListener("click", () => {
    const pool = state.filtered;
    if (!pool.length) {
      return;
    }

    launchVariant(pool[Math.floor(Math.random() * pool.length)]);
  });

  elements.dailyLaunch.addEventListener("click", () => {
    launchVariant(getDailyVariant());
  });

  elements.launchCurrent.addEventListener("click", () => {
    if (state.selectedVariant) {
      launchVariant(state.selectedVariant);
    }
  });

  elements.favoriteCurrent.addEventListener("click", () => {
    if (state.selectedVariant) {
      toggleFavorite(state.selectedVariant);
    }
  });

  elements.remixCurrent.addEventListener("click", () => {
    if (!state.selectedVariant) {
      return;
    }

    const remix = pickRemixForBase(state.selectedVariant.baseTitle);
    if (remix) {
      state.selectedVariant = remix;
      renderFocus();
      renderCatalog();
    }
  });

  elements.rerollCatalog.addEventListener("click", () => {
    rebuildCatalog(true);
    state.visibleCount = PAGE_SIZE;
    applyFilters();
    renderQueue();
  });

  elements.loadMore.addEventListener("click", () => {
    state.visibleCount += PAGE_SIZE;
    renderCatalog();
  });
}

function rebuildCatalog(randomize) {
  if (randomize) {
    state.catalogStart = Math.floor(Math.random() * TOTAL_VARIANTS);
  }

  state.catalog = Array.from({ length: CATALOG_SIZE }, (_, offset) => {
    const index = (state.catalogStart + offset * CATALOG_STEP) % TOTAL_VARIANTS;
    return createVariantFromIndex(index);
  });
}

function applyFilters() {
  const query = state.query;

  state.filtered = state.catalog.filter((variant) => {
    const matchesGenre = state.genre === "All" || variant.genre === state.genre;

    if (!matchesGenre) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      variant.title,
      variant.baseTitle,
      variant.genre,
      variant.theme,
      variant.mutator,
      variant.mission,
      variant.summary
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  renderCatalog();
  renderStats();
}

function renderFilters() {
  elements.filters.innerHTML = genreOptions
    .map((genre) => {
      const active = state.genre === genre ? "active" : "";
      return `<button class="chip ${active}" type="button" data-genre="${genre}">${genre}</button>`;
    })
    .join("");
}

function renderCatalog() {
  const source = state.filtered;
  const visibleItems = source.slice(0, state.visibleCount);

  if (!source.length) {
    elements.catalogGrid.innerHTML = `
      <div class="catalog-card">
        <strong>No cabinets matched the current search.</strong>
        <p class="catalog-summary">Try a broader query, switch genres, or remix the current catalog wave.</p>
      </div>
    `;
    elements.catalogStatus.textContent = "0 results in this wave.";
    elements.loadMore.style.display = "none";
    return;
  }

  elements.catalogGrid.innerHTML = visibleItems
    .map((variant) => {
      const selected = state.selectedVariant && state.selectedVariant.id === variant.id ? "selected" : "";
      const favoriteLabel = isFavorite(variant) ? "Saved" : "Save";

      return `
        <article class="catalog-card ${selected}">
          <div class="catalog-head">
            <div class="catalog-badge">${variant.badge}</div>
            <div>
              <strong>${variant.title}</strong>
              <span>${variant.baseTitle} | ${variant.genre}</span>
            </div>
          </div>

          <p class="catalog-summary">${variant.summary}</p>

          <div class="catalog-tags">
            <span>${variant.theme}</span>
            <span>${variant.mutator}</span>
            <span>${variant.mission}</span>
          </div>

          <div class="catalog-buttons">
            <button class="catalog-button" type="button" data-action="select" data-index="${variant.index}">Preview</button>
            <button class="catalog-button primary" type="button" data-action="launch" data-index="${variant.index}">Launch</button>
            <button class="catalog-button" type="button" data-action="favorite" data-index="${variant.index}">${favoriteLabel}</button>
          </div>
        </article>
      `;
    })
    .join("");

  elements.catalogStatus.textContent = `Showing ${visibleItems.length.toLocaleString()} of ${source.length.toLocaleString()} cabinets in this live wave.`;
  elements.loadMore.style.display = visibleItems.length < source.length ? "inline-flex" : "none";
}

function renderFocus(options = {}) {
  const variant = state.selectedVariant || getDailyVariant();
  const best = state.scores[variant.id] || 0;
  const preserveStage = Boolean(options.preserveStage);
  const activeVariant = state.activeGame ? state.activeGame.variant : null;
  const activeMatchesSelection = activeVariant && activeVariant.id === variant.id;

  elements.focusTitle.textContent = variant.title;
  elements.focusSummary.textContent = `${variant.blurb} ${variant.objective}`;
  elements.favoriteCurrent.textContent = isFavorite(variant) ? "Saved In Vault" : "Save To Vault";

  elements.focusMeta.innerHTML = [
    `${variant.genre} cabinet`,
    `Biome: ${variant.theme}`,
    `Mutator: ${variant.mutator}`,
    `Mission: ${variant.mission}`,
    `Controls: ${variant.controls}`
  ]
    .map((label) => `<span class="meta-pill">${label}</span>`)
    .join("");

  if (!activeVariant) {
    if (preserveStage) {
      elements.hudBest.textContent = formatNumber(best);
      elements.hudMode.textContent = `${variant.theme} / ${variant.mutator}`;
      return;
    }

    setHudDisplay({
      score: 0,
      best,
      mode: `${variant.theme} / ${variant.mutator}`,
      status: "Ready to launch"
    });
    renderStagePlaceholder(variant);
    return;
  }

  if (activeMatchesSelection) {
    elements.hudBest.textContent = formatNumber(best);
    elements.hudMode.textContent = `${variant.theme} / ${variant.mutator}`;
    return;
  }

  elements.controlHint.textContent = `Live cabinet ${activeVariant.title} is still on stage. Launch this one to switch.`;
}

function renderStagePlaceholder(variant) {
  elements.gameStage.innerHTML = `
    <div class="stage-empty">
      <div>
        <p class="eyebrow">Stage Ready</p>
        <h3>${variant.baseTitle}</h3>
        <p class="control-hint">${variant.summary}</p>
        <p class="control-hint">${variant.controls}</p>
      </div>
    </div>
  `;
  clearTouchControls();
  elements.controlHint.textContent = variant.controls;
}

function renderStats() {
  elements.statTotal.textContent = TOTAL_VARIANTS.toLocaleString();
  elements.statSlice.textContent = `${state.catalog.length.toLocaleString()} live`;
  elements.statFavorites.textContent = state.favorites.length.toLocaleString();
  elements.statStreak.textContent = `${state.visit.streak || 1} days`;
}

function renderQueue() {
  const picks = [];
  const daily = getDailyVariant();
  picks.push({ label: "Daily Challenge", variant: daily });

  const reflexPool = state.catalog.filter((variant) => variant.genre === "Reflex" || variant.genre === "Arcade");
  const puzzlePool = state.catalog.filter((variant) => variant.genre === "Puzzle" || variant.genre === "Strategy");
  const chaosPool = state.catalog.filter((variant) => /Turbo|Overclock|Wildcard|Frenzy|Nightcore/.test(`${variant.mutator} ${variant.mission}`));

  if (reflexPool.length) {
    picks.push({ label: "Reflex Rush", variant: reflexPool[Math.floor(Math.random() * reflexPool.length)] });
  }
  if (puzzlePool.length) {
    picks.push({ label: "Brain Burner", variant: puzzlePool[Math.floor(Math.random() * puzzlePool.length)] });
  }
  if (chaosPool.length) {
    picks.push({ label: "Chaos Pick", variant: chaosPool[Math.floor(Math.random() * chaosPool.length)] });
  }

  state.recent.slice(0, 3).forEach((summary, index) => {
    picks.push({ label: `Recent ${index + 1}`, variant: createVariantFromIndex(summary.index) });
  });

  const unique = [];
  const seen = new Set();
  picks.forEach((item) => {
    if (!item.variant || seen.has(item.variant.id) || unique.length >= 6) {
      return;
    }
    seen.add(item.variant.id);
    unique.push(item);
  });

  elements.queueList.innerHTML = unique
    .map((item) => {
      return `
        <article class="stack-item">
          <div class="stack-badge">${item.variant.badge}</div>
          <div class="stack-copy">
            <strong>${item.label}</strong>
            <span>${item.variant.title}</span>
          </div>
          <button class="sidebar-button" type="button" data-index="${item.variant.index}">Launch</button>
        </article>
      `;
    })
    .join("");
}

function renderFavorites() {
  if (!state.favorites.length) {
    elements.favoritesList.innerHTML = `<p class="empty-note">Save a few cabinets and your vault will fill up here.</p>`;
    return;
  }

  elements.favoritesList.innerHTML = state.favorites
    .slice(0, 6)
    .map((summary) => {
      const variant = createVariantFromIndex(summary.index);
      return `
        <article class="stack-item">
          <div class="stack-badge">${variant.badge}</div>
          <div class="stack-copy">
            <strong>${variant.title}</strong>
            <span>${variant.genre} | Best ${formatNumber(state.scores[variant.id] || 0)}</span>
          </div>
          <button class="sidebar-button" type="button" data-action="launch" data-index="${variant.index}">Play</button>
        </article>
      `;
    })
    .join("");
}

function handleVariantAction(action, variant) {
  if (action === "launch") {
    launchVariant(variant);
    return;
  }

  if (action === "favorite") {
    toggleFavorite(variant);
    return;
  }

  state.selectedVariant = variant;
  renderFocus();
  renderCatalog();
}

function launchVariant(variant) {
  destroyActiveGame();
  state.selectedVariant = variant;
  recordRecent(variant);

  const hooks = {
    variant,
    setHud: (partial) => {
      setHudDisplay({
        score: partial.score ?? 0,
        best: state.scores[variant.id] || 0,
        mode: `${variant.theme} / ${variant.mutator}`,
        status: partial.status ?? "Live"
      });
    },
    setHint: (text) => {
      elements.controlHint.textContent = text;
    },
    mountTouchButtons,
    finish: (result) => finalizeGame(variant, result)
  };

  const gameFactory = gameFactories[variant.engine];
  if (!gameFactory) {
    renderStagePlaceholder(variant);
    return;
  }

  elements.gameStage.innerHTML = "";
  setHudDisplay({
    score: 0,
    best: state.scores[variant.id] || 0,
    mode: `${variant.theme} / ${variant.mutator}`,
    status: "Booting cabinet"
  });

  state.activeGame = gameFactory(variant, hooks);
  renderFocus({ preserveStage: true });
  renderCatalog();
  renderQueue();
}

function finalizeGame(variant, result) {
  const score = Math.max(0, Math.round(result.score || 0));
  const previousBest = state.scores[variant.id] || 0;

  if (score > previousBest) {
    state.scores[variant.id] = score;
    saveStorage(STORAGE_KEYS.scores, state.scores);
  }

  setHudDisplay({
    score,
    best: state.scores[variant.id] || score,
    mode: `${variant.theme} / ${variant.mutator}`,
    status: result.won ? `Cleared | ${result.message}` : `Run ended | ${result.message}`
  });

  elements.controlHint.textContent = score > previousBest
    ? `New best for ${variant.title}: ${formatNumber(score)}.`
    : `${result.message} Final score: ${formatNumber(score)}.`;

  state.activeGame = null;
  renderStats();
  renderFavorites();
  renderCatalog();
  renderFocus({ preserveStage: true });
}

function destroyActiveGame() {
  if (!state.activeGame) {
    clearTouchControls();
    return;
  }

  state.activeGame.destroy();
  state.activeGame = null;
  clearTouchControls();
}

function setHudDisplay(values) {
  if (values.score !== undefined) {
    elements.hudScore.textContent = formatNumber(values.score);
  }
  if (values.best !== undefined) {
    elements.hudBest.textContent = formatNumber(values.best);
  }
  if (values.mode !== undefined) {
    elements.hudMode.textContent = values.mode;
  }
  if (values.status !== undefined) {
    elements.hudStatus.textContent = values.status;
  }
}

function toggleFavorite(variant) {
  const exists = state.favorites.some((item) => item.id === variant.id);

  if (exists) {
    state.favorites = state.favorites.filter((item) => item.id !== variant.id);
  } else {
    state.favorites = [summarizeVariant(variant), ...state.favorites.filter((item) => item.id !== variant.id)].slice(0, 24);
  }

  saveStorage(STORAGE_KEYS.favorites, state.favorites);
  renderFavorites();
  renderStats();
  renderCatalog();
  renderFocus({ preserveStage: Boolean(state.activeGame) });
}

function isFavorite(variant) {
  return state.favorites.some((item) => item.id === variant.id);
}

function recordRecent(variant) {
  state.recent = [summarizeVariant(variant), ...state.recent.filter((item) => item.id !== variant.id)].slice(0, 12);
  saveStorage(STORAGE_KEYS.recent, state.recent);
}

function summarizeVariant(variant) {
  return {
    id: variant.id,
    index: variant.index
  };
}

function pickPlaylistVariant(kind) {
  if (kind === "favorites" && state.favorites.length) {
    const summary = state.favorites[Math.floor(Math.random() * state.favorites.length)];
    return createVariantFromIndex(summary.index);
  }

  let pool = state.catalog;
  if (kind === "chaos") {
    pool = state.catalog.filter((variant) => /Turbo|Overclock|Wildcard|Nightcore|Frenzy/.test(`${variant.mutator} ${variant.mission}`));
  } else if (kind === "brain") {
    pool = state.catalog.filter((variant) => variant.genre === "Puzzle" || variant.genre === "Strategy");
  } else if (kind === "reflex") {
    pool = state.catalog.filter((variant) => variant.genre === "Reflex" || variant.genre === "Arcade" || variant.genre === "Endless");
  }

  if (!pool.length) {
    return getDailyVariant();
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function pickRemixForBase(baseTitle) {
  const pool = state.catalog.filter((variant) => variant.baseTitle === baseTitle && (!state.selectedVariant || variant.id !== state.selectedVariant.id));
  if (!pool.length) {
    return null;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function getDailyVariant() {
  const today = getLocalDateKey(new Date());
  const index = Math.abs(hashString(today)) % TOTAL_VARIANTS;
  return createVariantFromIndex(index);
}

function updateVisitState() {
  const today = new Date();
  const todayKey = getLocalDateKey(today);

  if (state.visit.lastDate === todayKey) {
    return;
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  state.visit = {
    lastDate: todayKey,
    streak: state.visit.lastDate === yesterdayKey ? state.visit.streak + 1 : 1,
    daysVisited: (state.visit.daysVisited || 0) + 1
  };

  saveStorage(STORAGE_KEYS.visit, state.visit);
}

function createVariantFromIndex(index) {
  const game = baseGames[index % baseGames.length];
  const biome = biomes[Math.floor(index / baseGames.length) % biomes.length];
  const mutator = mutators[Math.floor(index / (baseGames.length * biomes.length)) % mutators.length];
  const mission = missions[Math.floor(index / (baseGames.length * biomes.length * mutators.length)) % missions.length];
  const seed = Math.floor(index / (baseGames.length * biomes.length * mutators.length * missions.length)) % 64;
  const rng = createSeededRandom(index + 17);
  const config = composeConfig(game.defaults, mutator, mission, rng);

  return {
    id: `cabinet-${index}`,
    index,
    seed,
    title: `${biome.name} ${game.title}: ${mutator.name}`,
    baseTitle: game.title,
    badge: game.badge,
    genre: game.genre,
    engine: game.engine,
    blurb: game.summary,
    theme: biome.name,
    themeMood: biome.flavor,
    mutator: mutator.name,
    mission: mission.name,
    summary: `${mission.name} route through ${biome.flavor}. ${mutator.blurb}`,
    objective: mission.objective,
    controls: game.controls,
    config
  };
}

function composeConfig(defaults, mutator, mission, rng) {
  const speed = roundNumber(defaults.speed * mutator.speed * mission.speed * (0.94 + rng() * 0.16), 2);
  const density = roundNumber(defaults.density * mutator.density * mission.density * (0.92 + rng() * 0.16), 2);
  const duration = Math.max(24, Math.round(defaults.duration * mutator.duration * mission.duration * (0.95 + rng() * 0.12)));
  const board = roundNumber(defaults.board * mutator.board * mission.board * (0.94 + rng() * 0.14), 2);
  const preview = roundNumber(defaults.preview * mutator.preview * mission.preview * (0.98 + rng() * 0.08), 2);
  const lives = clamp(defaults.lives + mutator.lives + mission.lives, 1, 5);

  return {
    speed,
    density,
    duration,
    board,
    preview,
    lives,
    scoreMult: roundNumber(mutator.score * mission.score * (0.96 + rng() * 0.12), 2),
    wrap: Boolean(mutator.wrap || mission.wrap),
    mineRatio: clamp(defaults.mineRatio * (0.9 + density * 0.22), 0.12, 0.24),
    mathMax: Math.max(10, Math.round(defaults.mathMax * (0.9 + speed * 0.24 + density * 0.12)))
  };
}

function createCanvasStage() {
  const canvas = document.createElement("canvas");
  canvas.className = "game-canvas";
  canvas.width = 960;
  canvas.height = 540;
  elements.gameStage.innerHTML = "";
  elements.gameStage.appendChild(canvas);
  return { canvas, ctx: canvas.getContext("2d") };
}

function mountTouchButtons(buttons) {
  clearTouchControls();

  if (!buttons || !buttons.length) {
    return () => {};
  }

  const cleanups = [];

  buttons.forEach((definition) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "touch-button";
    button.textContent = definition.label;

    const handleDown = (event) => {
      event.preventDefault();
      button.classList.add("active");
      if (definition.onDown) {
        definition.onDown(event);
      }
    };

    const handleUp = (event) => {
      event.preventDefault();
      button.classList.remove("active");
      if (definition.onUp) {
        definition.onUp(event);
      }
    };

    cleanups.push(listen(button, "pointerdown", handleDown));
    cleanups.push(listen(button, "pointerup", handleUp));
    cleanups.push(listen(button, "pointercancel", handleUp));
    cleanups.push(listen(button, "pointerleave", handleUp));

    elements.touchControls.appendChild(button);
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
    clearTouchControls();
  };
}

function clearTouchControls() {
  elements.touchControls.innerHTML = "";
}

function createDodgeGame(variant, hooks) {
  const { canvas, ctx } = createCanvasStage();
  const config = variant.config;
  const hazards = [];
  const stars = Array.from({ length: 40 }, (_, index) => ({
    x: (index * 173) % canvas.width,
    y: (index * 97) % canvas.height,
    size: 1 + (index % 3)
  }));
  const input = { left: false, right: false };
  const player = {
    x: canvas.width / 2,
    y: canvas.height - 68,
    width: 76 * clamp(1.08 - (config.board - 1) * 0.12, 0.82, 1.2),
    height: 26
  };

  let score = 0;
  let lives = config.lives;
  let timeLeft = config.duration;
  let spawnTimer = 0;
  let pointerX = null;
  let flash = 0;
  let finished = false;
  let released = false;
  const cleanups = [];

  cleanups.push(listen(window, "keydown", (event) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      event.preventDefault();
      input.left = true;
    }
    if (event.code === "ArrowRight" || event.code === "KeyD") {
      event.preventDefault();
      input.right = true;
    }
  }));

  cleanups.push(listen(window, "keyup", (event) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      event.preventDefault();
      input.left = false;
    }
    if (event.code === "ArrowRight" || event.code === "KeyD") {
      event.preventDefault();
      input.right = false;
    }
  }));

  const updatePointer = (event) => {
    const point = getCanvasPoint(event, canvas);
    pointerX = point.x;
  };

  cleanups.push(listen(canvas, "pointermove", updatePointer));
  cleanups.push(listen(canvas, "pointerdown", updatePointer));
  cleanups.push(hooks.mountTouchButtons([
    { label: "Left", onDown: () => { input.left = true; pointerX = null; }, onUp: () => { input.left = false; } },
    { label: "Right", onDown: () => { input.right = true; pointerX = null; }, onUp: () => { input.right = false; } }
  ]));

  hooks.setHint("Move with arrows, A and D, or drag the ship across the stage.");

  const stopLoop = startAnimation((dt) => {
    if (finished) {
      return;
    }

    timeLeft -= dt;
    flash = Math.max(0, flash - dt * 2.6);
    spawnTimer -= dt;

    if (pointerX !== null) {
      player.x = lerp(player.x, pointerX, 0.18);
    } else {
      let move = 0;
      if (input.left) {
        move -= 1;
      }
      if (input.right) {
        move += 1;
      }
      player.x += move * 440 * config.speed * dt;
    }

    player.x = clamp(player.x, player.width / 2 + 20, canvas.width - player.width / 2 - 20);

    if (spawnTimer <= 0) {
      const radius = 16 + Math.random() * 18 * clamp(1.08 - (config.board - 1) * 0.14, 0.84, 1.18);
      hazards.push({
        x: 48 + Math.random() * (canvas.width - 96),
        y: -40,
        radius,
        speed: (210 + Math.random() * 150) * config.speed
      });
      spawnTimer = Math.max(0.16, 0.52 / config.density);
    }

    for (let index = hazards.length - 1; index >= 0; index -= 1) {
      const hazard = hazards[index];
      hazard.y += hazard.speed * dt;

      const overlapX = Math.abs(hazard.x - player.x) < hazard.radius + player.width * 0.42;
      const overlapY = Math.abs(hazard.y - player.y) < hazard.radius + player.height * 0.55;

      if (overlapX && overlapY) {
        hazards.splice(index, 1);
        lives -= 1;
        flash = 1;
        if (lives <= 0) {
          finish(false, "Meteor impact");
          return;
        }
        continue;
      }

      if (hazard.y > canvas.height + 60) {
        if (Math.abs(hazard.x - player.x) < 110) {
          score += 30 * config.scoreMult;
        } else {
          score += 8 * config.scoreMult;
        }
        hazards.splice(index, 1);
      }
    }

    score += dt * 18 * config.scoreMult;
    hooks.setHud({
      score: Math.floor(score),
      status: `${lives} lives | ${Math.max(0, Math.ceil(timeLeft))}s`
    });

    if (timeLeft <= 0) {
      finish(true, "Storm survived");
      return;
    }

    drawDodgeScene(ctx, canvas, stars, player, hazards, flash);
  });

  cleanups.push(stopLoop);

  function release() {
    if (released) {
      return;
    }
    released = true;
    cleanups.forEach((cleanup) => cleanup());
  }

  function finish(won, message) {
    if (finished) {
      return;
    }
    finished = true;
    release();
    hooks.finish({ won, message, score: Math.floor(score) });
  }

  return {
    variant,
    destroy() {
      release();
    }
  };
}

function drawDodgeScene(ctx, canvas, stars, player, hazards, flash) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = flash > 0 ? "rgba(255, 93, 77, 0.18)" : "rgba(4, 17, 31, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach((star, index) => {
    star.y += 0.4 + star.size * 0.18;
    if (star.y > canvas.height + 10) {
      star.y = -10;
      star.x = (star.x + 173 + index * 13) % canvas.width;
    }
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });

  ctx.strokeStyle = "rgba(110, 242, 255, 0.15)";
  ctx.lineWidth = 1;
  for (let row = 0; row < canvas.height; row += 48) {
    ctx.beginPath();
    ctx.moveTo(0, row);
    ctx.lineTo(canvas.width, row);
    ctx.stroke();
  }

  hazards.forEach((hazard) => {
    ctx.fillStyle = "rgba(255, 138, 51, 0.92)";
    ctx.beginPath();
    ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 209, 102, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = flash > 0 ? "#ff9e7f" : "#6ef2ff";
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(player.width / 2, 20);
  ctx.lineTo(0, 8);
  ctx.lineTo(-player.width / 2, 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(-10, 8, 20, 10);
  ctx.restore();
}

function createTapGame(variant, hooks) {
  const config = variant.config;
  const stage = document.createElement("div");
  stage.className = "tap-arena";
  elements.gameStage.innerHTML = "";
  elements.gameStage.appendChild(stage);

  let score = 0;
  let combo = 0;
  let timeLeft = config.duration;
  let spawnTimer = 0;
  let nextId = 1;
  let finished = false;
  let released = false;
  const targets = new Map();
  const cleanups = [];

  hooks.setHint("Tap targets before they fade. Misses reset your combo.");
  cleanups.push(hooks.mountTouchButtons([]));

  cleanups.push(listen(stage, "pointerdown", (event) => {
    if (event.target === stage) {
      combo = 0;
    }
  }));

  const stopLoop = startAnimation((dt) => {
    if (finished) {
      return;
    }

    timeLeft -= dt;
    spawnTimer -= dt;

    const capacity = clamp(Math.round(config.density * 1.8), 1, 4);
    while (targets.size < capacity && spawnTimer <= 0) {
      spawnTarget();
      spawnTimer = Math.max(0.18, 0.44 / config.density);
    }

    const now = performance.now();
    targets.forEach((target, id) => {
      if (target.expiresAt <= now) {
        combo = 0;
        target.element.remove();
        targets.delete(id);
      }
    });

    hooks.setHud({
      score: Math.floor(score),
      status: `Combo ${combo} | ${Math.max(0, Math.ceil(timeLeft))}s`
    });

    if (timeLeft <= 0) {
      finish(true, "Rush complete");
    }
  });

  cleanups.push(stopLoop);

  function spawnTarget() {
    const width = stage.clientWidth || 860;
    const height = stage.clientHeight || 460;
    const size = clamp(82 - config.speed * 16, 44, 82);
    const element = document.createElement("button");
    const id = nextId;
    nextId += 1;
    element.type = "button";
    element.className = "tap-target";
    element.textContent = `${combo + 1}`;
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.left = `${Math.random() * Math.max(20, width - size - 20)}px`;
    element.style.top = `${Math.random() * Math.max(20, height - size - 20)}px`;

    const target = {
      id,
      expiresAt: performance.now() + Math.max(520, 1200 / config.speed),
      element
    };

    const handleHit = (event) => {
      event.preventDefault();
      event.stopPropagation();
      combo += 1;
      score += (22 + combo * 6) * config.scoreMult;
      element.remove();
      targets.delete(id);
    };

    cleanups.push(listen(element, "pointerdown", handleHit));
    stage.appendChild(element);
    targets.set(id, target);
  }

  function release() {
    if (released) {
      return;
    }
    released = true;
    cleanups.forEach((cleanup) => cleanup());
  }

  function finish(won, message) {
    if (finished) {
      return;
    }
    finished = true;
    release();
    hooks.finish({ won, message, score: Math.floor(score) });
  }

  return {
    variant,
    destroy() {
      release();
    }
  };
}

function createSnakeGame(variant, hooks) {
  const { canvas, ctx } = createCanvasStage();
  const config = variant.config;
  const gridSize = clamp(Math.round(14 * config.board), 12, 20);
  const cell = canvas.width / gridSize;
  const input = { direction: "right", queued: "right" };
  let snake = [
    { x: 4, y: Math.floor(gridSize / 2) },
    { x: 3, y: Math.floor(gridSize / 2) },
    { x: 2, y: Math.floor(gridSize / 2) }
  ];
  let food = createFood(snake, gridSize);
  let score = 0;
  let timeLeft = config.duration;
  let moveTimer = 0;
  let finished = false;
  let released = false;
  const cleanups = [];

  hooks.setHint("Turn with arrows or WASD. Wrap appears on some mirror remixes.");

  const setDirection = (direction) => {
    const opposites = { left: "right", right: "left", up: "down", down: "up" };
    if (opposites[direction] === input.direction) {
      return;
    }
    input.queued = direction;
  };

  cleanups.push(listen(window, "keydown", (event) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      event.preventDefault();
      setDirection("left");
    }
    if (event.code === "ArrowRight" || event.code === "KeyD") {
      event.preventDefault();
      setDirection("right");
    }
    if (event.code === "ArrowUp" || event.code === "KeyW") {
      event.preventDefault();
      setDirection("up");
    }
    if (event.code === "ArrowDown" || event.code === "KeyS") {
      event.preventDefault();
      setDirection("down");
    }
  }));

  cleanups.push(hooks.mountTouchButtons([
    { label: "Up", onDown: () => setDirection("up") },
    { label: "Left", onDown: () => setDirection("left") },
    { label: "Right", onDown: () => setDirection("right") },
    { label: "Down", onDown: () => setDirection("down") }
  ]));

  const stopLoop = startAnimation((dt) => {
    if (finished) {
      return;
    }

    timeLeft -= dt;
    moveTimer += dt;

    if (moveTimer >= Math.max(0.055, 0.16 / config.speed)) {
      moveTimer = 0;
      input.direction = input.queued;
      const head = { ...snake[0] };

      if (input.direction === "left") {
        head.x -= 1;
      } else if (input.direction === "right") {
        head.x += 1;
      } else if (input.direction === "up") {
        head.y -= 1;
      } else {
        head.y += 1;
      }

      if (config.wrap) {
        head.x = (head.x + gridSize) % gridSize;
        head.y = (head.y + gridSize) % gridSize;
      }

      const hitWall = head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
      const hitSelf = snake.some((segment) => segment.x === head.x && segment.y === head.y);

      if (hitWall || hitSelf) {
        finish(false, "Snake clipped out");
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score += 110 * config.scoreMult;
        food = createFood(snake, gridSize);
      } else {
        snake.pop();
      }
    }

    hooks.setHud({
      score: Math.floor(score),
      status: `Length ${snake.length} | ${Math.max(0, Math.ceil(timeLeft))}s`
    });

    drawSnakeScene(ctx, canvas, snake, food, gridSize, cell);

    if (timeLeft <= 0) {
      finish(true, "Shift completed");
    }
  });

  cleanups.push(stopLoop);

  function release() {
    if (released) {
      return;
    }
    released = true;
    cleanups.forEach((cleanup) => cleanup());
  }

  function finish(won, message) {
    if (finished) {
      return;
    }
    finished = true;
    release();
    hooks.finish({ won, message, score: Math.floor(score) });
  }

  return {
    variant,
    destroy() {
      release();
    }
  };
}

function drawSnakeScene(ctx, canvas, snake, food, gridSize, cell) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#061521";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  for (let line = 0; line <= gridSize; line += 1) {
    ctx.beginPath();
    ctx.moveTo(line * cell, 0);
    ctx.lineTo(line * cell, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, line * cell);
    ctx.lineTo(canvas.width, line * cell);
    ctx.stroke();
  }

  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? "#d9ff6b" : "#6ef2ff";
    ctx.fillRect(segment.x * cell + 4, segment.y * cell + 4, cell - 8, cell - 8);
  });

  ctx.fillStyle = "#ff8a33";
  ctx.fillRect(food.x * cell + 8, food.y * cell + 8, cell - 16, cell - 16);
}

function createFood(snake, gridSize) {
  let food = null;
  while (!food) {
    const candidate = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };
    const blocked = snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y);
    if (!blocked) {
      food = candidate;
    }
  }
  return food;
}

function createRunnerGame(variant, hooks) {
  const { canvas, ctx } = createCanvasStage();
  const config = variant.config;
  const ground = canvas.height - 80;
  const player = { x: 150, y: ground - 76, width: 52, height: 76, velocityY: 0, invuln: 0 };
  const obstacles = [];
  let score = 0;
  let lives = config.lives;
  let timeLeft = config.duration;
  let spawnTimer = 0;
  let finished = false;
  let released = false;
  const cleanups = [];

  hooks.setHint("Jump with space, W, the up arrow, or a stage tap.");

  const jump = () => {
    const grounded = player.y >= ground - player.height - 0.1;
    if (grounded) {
      player.velocityY = -720;
    }
  };

  cleanups.push(listen(window, "keydown", (event) => {
    if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
      event.preventDefault();
      jump();
    }
  }));

  cleanups.push(listen(canvas, "pointerdown", (event) => {
    event.preventDefault();
    jump();
  }));

  cleanups.push(hooks.mountTouchButtons([
    { label: "Jump", onDown: () => jump() }
  ]));

  const stopLoop = startAnimation((dt) => {
    if (finished) {
      return;
    }

    timeLeft -= dt;
    spawnTimer -= dt;
    player.invuln = Math.max(0, player.invuln - dt);

    if (spawnTimer <= 0) {
      obstacles.push({
        x: canvas.width + 30,
        y: ground - (40 + Math.random() * 52),
        width: 30 + Math.random() * 28,
        height: 40 + Math.random() * 52
      });
      spawnTimer = Math.max(0.46, 1.1 / config.density);
    }

    player.velocityY += 1800 * dt;
    player.y += player.velocityY * dt;
    if (player.y > ground - player.height) {
      player.y = ground - player.height;
      player.velocityY = 0;
    }

    for (let index = obstacles.length - 1; index >= 0; index -= 1) {
      const obstacle = obstacles[index];
      obstacle.x -= 360 * config.speed * dt;

      const overlap =
        obstacle.x < player.x + player.width &&
        obstacle.x + obstacle.width > player.x &&
        obstacle.y < player.y + player.height &&
        obstacle.y + obstacle.height > player.y;

      if (overlap && player.invuln <= 0) {
        lives -= 1;
        player.invuln = 1;
        if (lives <= 0) {
          finish(false, "Runner wiped out");
          return;
        }
      }

      if (obstacle.x + obstacle.width < -20) {
        obstacles.splice(index, 1);
        score += 40 * config.scoreMult;
      }
    }

    score += dt * 16 * config.scoreMult;
    hooks.setHud({
      score: Math.floor(score),
      status: `${lives} lives | ${Math.max(0, Math.ceil(timeLeft))}s`
    });

    drawRunnerScene(ctx, canvas, ground, player, obstacles);

    if (timeLeft <= 0) {
      finish(true, "District crossed");
    }
  });

  cleanups.push(stopLoop);

  function release() {
    if (released) {
      return;
    }
    released = true;
    cleanups.forEach((cleanup) => cleanup());
  }

  function finish(won, message) {
    if (finished) {
      return;
    }
    finished = true;
    release();
    hooks.finish({ won, message, score: Math.floor(score) });
  }

  return {
    variant,
    destroy() {
      release();
    }
  };
}

function drawRunnerScene(ctx, canvas, ground, player, obstacles) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#071726";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(110, 242, 255, 0.12)";
  for (let index = 0; index < 10; index += 1) {
    ctx.fillRect(index * 120, 80 + (index % 3) * 40, 36, 120);
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(0, ground, canvas.width, canvas.height - ground);

  obstacles.forEach((obstacle) => {
    ctx.fillStyle = "#ff8a33";
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });

  ctx.fillStyle = player.invuln > 0 ? "#ffd166" : "#d9ff6b";
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = "#04111f";
  ctx.fillRect(player.x + 12, player.y + 14, 12, 12);
}

function createMemoryGame(variant, hooks) {
  const config = variant.config;
  const board = document.createElement("div");
  board.className = "memory-board";
  elements.gameStage.innerHTML = "";
  elements.gameStage.appendChild(board);

  const rows = config.board > 1.08 ? 4 : 3;
  const columns = config.board > 1.08 ? 5 : 4;
  const pairCount = Math.floor((rows * columns) / 2);
  const symbols = shuffle(memorySymbols.slice(0, pairCount)).flatMap((symbol) => [symbol, symbol]);
  const deck = shuffle(symbols).map((symbol, index) => ({
    id: index,
    symbol,
    revealed: true,
    matched: false
  }));

  let firstPick = null;
  let secondPick = null;
  let score = 0;
  let matched = 0;
  let timeLeft = config.duration;
  let previewLocked = true;
  let finished = false;
  let released = false;
  const cleanups = [];
  const timers = [];

  board.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  hooks.setHint("Memorize the spread, then match pairs before the board times out.");
  cleanups.push(hooks.mountTouchButtons([]));

  renderBoard();

  timers.push(window.setTimeout(() => {
    deck.forEach((card) => {
      if (!card.matched) {
        card.revealed = false;
      }
    });
    previewLocked = false;
    renderBoard();
  }, Math.round(1800 * config.preview)));

  const timerId = window.setInterval(() => {
    if (finished || previewLocked) {
      return;
    }

    timeLeft -= 0.1;
    hooks.setHud({
      score: Math.floor(score),
      status: `${matched / 2} / ${pairCount} pairs | ${Math.max(0, Math.ceil(timeLeft))}s`
    });

    if (timeLeft <= 0) {
      finish(false, "Matrix timed out");
    }
  }, 100);

  cleanups.push(() => window.clearInterval(timerId));

  function renderBoard() {
    board.innerHTML = "";
    deck.forEach((card) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `memory-card${card.revealed ? " revealed" : ""}${card.matched ? " matched" : ""}`;
      button.textContent = card.revealed || card.matched ? card.symbol : "?";
      button.disabled = previewLocked || card.matched;

      cleanups.push(listen(button, "click", () => handleCard(card.id)));
      board.appendChild(button);
    });
  }

  function handleCard(cardId) {
    if (previewLocked || finished) {
      return;
    }

    const card = deck.find((item) => item.id === cardId);
    if (!card || card.revealed || card.matched || secondPick !== null) {
      return;
    }

    card.revealed = true;

    if (firstPick === null) {
      firstPick = card.id;
      renderBoard();
      return;
    }

    secondPick = card.id;
    renderBoard();

    const firstCard = deck.find((item) => item.id === firstPick);
    const secondCard = deck.find((item) => item.id === secondPick);

    if (firstCard.symbol === secondCard.symbol) {
      timers.push(window.setTimeout(() => {
        firstCard.matched = true;
        secondCard.matched = true;
        matched += 2;
        score += (120 + timeLeft * 3) * config.scoreMult;
        firstPick = null;
        secondPick = null;
        renderBoard();

        hooks.setHud({
          score: Math.floor(score),
          status: `${matched / 2} / ${pairCount} pairs | ${Math.max(0, Math.ceil(timeLeft))}s`
        });

        if (matched === deck.length) {
          finish(true, "Board cleared");
        }
      }, 380));
      return;
    }

    timers.push(window.setTimeout(() => {
      firstCard.revealed = false;
      secondCard.revealed = false;
      firstPick = null;
      secondPick = null;
      renderBoard();
    }, 620));
  }

  function release() {
    if (released) {
      return;
    }
    released = true;
    cleanups.forEach((cleanup) => cleanup());
    timers.forEach((timer) => window.clearTimeout(timer));
  }

  function finish(won, message) {
    if (finished) {
      return;
    }
    finished = true;
    release();
    hooks.finish({ won, message, score: Math.floor(score) });
  }

  hooks.setHud({
    score: 0,
    status: `Preview | ${pairCount} pairs`
  });

  return {
    variant,
    destroy() {
      release();
    }
  };
}

function createBreakoutGame(variant, hooks) {
  const { canvas, ctx } = createCanvasStage();
  const config = variant.config;
  const paddle = { x: canvas.width / 2, y: canvas.height - 48, width: clamp(160 - (config.board - 1) * 48, 92, 168), height: 18 };
  const ball = { x: canvas.width / 2, y: canvas.height - 82, radius: 10, vx: 300 * config.speed, vy: -320 * config.speed };
  const bricks = [];
  const input = { left: false, right: false };
  const rows = clamp(Math.round(4 * config.density), 4, 7);
  const columns = clamp(Math.round(9 * config.board), 7, 12);
  const brickWidth = (canvas.width - 110) / columns;
  let score = 0;
  let lives = config.lives;
  let timeLeft = Math.max(36, config.duration);
  let finished = false;
  let released = false;
  const cleanups = [];

  hooks.setHint("Keep the ball alive and clear the wall before the timer expires.");

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      bricks.push({
        x: 40 + column * brickWidth,
        y: 70 + row * 32,
        width: brickWidth - 8,
        height: 20,
        alive: true
      });
    }
  }

  cleanups.push(listen(window, "keydown", (event) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      event.preventDefault();
      input.left = true;
    }
    if (event.code === "ArrowRight" || event.code === "KeyD") {
      event.preventDefault();
      input.right = true;
    }
  }));

  cleanups.push(listen(window, "keyup", (event) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      event.preventDefault();
      input.left = false;
    }
    if (event.code === "ArrowRight" || event.code === "KeyD") {
      event.preventDefault();
      input.right = false;
    }
  }));

  cleanups.push(listen(canvas, "pointermove", (event) => {
    const point = getCanvasPoint(event, canvas);
    paddle.x = clamp(point.x, paddle.width / 2 + 10, canvas.width - paddle.width / 2 - 10);
  }));

  cleanups.push(hooks.mountTouchButtons([
    { label: "Left", onDown: () => { input.left = true; }, onUp: () => { input.left = false; } },
    { label: "Right", onDown: () => { input.right = true; }, onUp: () => { input.right = false; } }
  ]));

  const stopLoop = startAnimation((dt) => {
    if (finished) {
      return;
    }

    timeLeft -= dt;

    if (input.left) {
      paddle.x -= 420 * dt;
    }
    if (input.right) {
      paddle.x += 420 * dt;
    }
    paddle.x = clamp(paddle.x, paddle.width / 2 + 10, canvas.width - paddle.width / 2 - 10);

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x <= ball.radius || ball.x >= canvas.width - ball.radius) {
      ball.vx *= -1;
    }
    if (ball.y <= ball.radius) {
      ball.vy *= -1;
    }

    const paddleTop = paddle.y - paddle.height / 2;
    const onPaddle =
      ball.y + ball.radius >= paddleTop &&
      ball.y - ball.radius <= paddle.y + paddle.height / 2 &&
      ball.x >= paddle.x - paddle.width / 2 &&
      ball.x <= paddle.x + paddle.width / 2 &&
      ball.vy > 0;

    if (onPaddle) {
      const offset = (ball.x - paddle.x) / (paddle.width / 2);
      ball.vx = 360 * offset;
      ball.vy = -Math.abs(ball.vy);
    }

    for (let index = bricks.length - 1; index >= 0; index -= 1) {
      const brick = bricks[index];
      if (!brick.alive) {
        continue;
      }

      const hit =
        ball.x + ball.radius >= brick.x &&
        ball.x - ball.radius <= brick.x + brick.width &&
        ball.y + ball.radius >= brick.y &&
        ball.y - ball.radius <= brick.y + brick.height;

      if (hit) {
        brick.alive = false;
        ball.vy *= -1;
        score += 55 * config.scoreMult;
        break;
      }
    }

    if (ball.y > canvas.height + 20) {
      lives -= 1;
      if (lives <= 0) {
        finish(false, "Paddle lost the ball");
        return;
      }
      ball.x = canvas.width / 2;
      ball.y = canvas.height - 82;
      ball.vx = 300 * (Math.random() > 0.5 ? 1 : -1);
      ball.vy = -320;
    }

    drawBreakoutScene(ctx, canvas, paddle, ball, bricks);

    hooks.setHud({
      score: Math.floor(score),
      status: `${lives} lives | ${Math.max(0, Math.ceil(timeLeft))}s`
    });

    const aliveCount = bricks.filter((brick) => brick.alive).length;
    if (aliveCount === 0) {
      finish(true, "Wall shattered");
      return;
    }

    if (timeLeft <= 0) {
      finish(false, "Clock expired");
    }
  });

  cleanups.push(stopLoop);

  function release() {
    if (released) {
      return;
    }
    released = true;
    cleanups.forEach((cleanup) => cleanup());
  }

  function finish(won, message) {
    if (finished) {
      return;
    }
    finished = true;
    release();
    hooks.finish({ won, message, score: Math.floor(score) });
  }

  return {
    variant,
    destroy() {
      release();
    }
  };
}

function drawBreakoutScene(ctx, canvas, paddle, ball, bricks) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#071726";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  bricks.forEach((brick, index) => {
    if (!brick.alive) {
      return;
    }
    ctx.fillStyle = index % 2 === 0 ? "#ff8a33" : "#6ef2ff";
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
  });

  ctx.fillStyle = "#d9ff6b";
  ctx.fillRect(paddle.x - paddle.width / 2, paddle.y - paddle.height / 2, paddle.width, paddle.height);

  ctx.fillStyle = "#fff8ea";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function createMinesGame(variant, hooks) {
  const config = variant.config;
  const size = config.board > 1.1 ? 10 : config.board < 0.95 ? 7 : 8;
  const mineCount = clamp(Math.round(size * size * config.mineRatio), size + 2, size * size - 10);
  const board = document.createElement("div");
  board.className = "mines-board";
  board.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
  elements.gameStage.innerHTML = "";
  elements.gameStage.appendChild(board);

  const cells = Array.from({ length: size * size }, (_, index) => ({
    index,
    mine: false,
    revealed: false,
    flagged: false,
    count: 0
  }));
  const rng = createSeededRandom(variant.index + 91);
  let score = 0;
  let timeLeft = Math.max(40, config.duration);
  let revealedCount = 0;
  let finished = false;
  let released = false;
  const cleanups = [];

  hooks.setHint("Reveal safe cells. Right-click to flag if you want a slower, safer read.");
  cleanups.push(hooks.mountTouchButtons([]));

  while (cells.filter((cell) => cell.mine).length < mineCount) {
    const index = Math.floor(rng() * cells.length);
    cells[index].mine = true;
  }

  cells.forEach((cell) => {
    const neighbors = getNeighbors(cell.index, size);
    cell.count = neighbors.filter((neighbor) => cells[neighbor].mine).length;
  });

  renderBoard();

  const timerId = window.setInterval(() => {
    if (finished) {
      return;
    }

    timeLeft -= 0.25;
    hooks.setHud({
      score: Math.floor(score),
      status: `${revealedCount}/${cells.length - mineCount} safe | ${Math.max(0, Math.ceil(timeLeft))}s`
    });

    if (timeLeft <= 0) {
      finish(false, "Board lockout");
    }
  }, 250);

  cleanups.push(() => window.clearInterval(timerId));

  function renderBoard() {
    board.innerHTML = "";
    cells.forEach((cell) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `mines-cell${cell.revealed ? " revealed" : ""}${cell.mine && cell.revealed ? " mine" : ""}${cell.flagged ? " flagged" : ""}`;

      if (cell.revealed) {
        if (cell.mine) {
          button.textContent = "X";
        } else if (cell.count > 0) {
          button.textContent = `${cell.count}`;
        } else {
          button.textContent = "";
        }
      } else if (cell.flagged) {
        button.textContent = "!";
      } else {
        button.textContent = "";
      }

      cleanups.push(listen(button, "click", () => revealCell(cell.index)));
      cleanups.push(listen(button, "contextmenu", (event) => {
        event.preventDefault();
        if (!cell.revealed) {
          cell.flagged = !cell.flagged;
          renderBoard();
        }
      }));

      board.appendChild(button);
    });
  }

  function revealCell(index) {
    const cell = cells[index];
    if (!cell || cell.revealed || cell.flagged || finished) {
      return;
    }

    cell.revealed = true;
    if (cell.mine) {
      renderBoard();
      finish(false, "Mine detonated");
      return;
    }

    revealedCount += 1;
    score += 16 * config.scoreMult;

    if (cell.count === 0) {
      floodReveal(index);
    }

    renderBoard();

    if (revealedCount >= cells.length - mineCount) {
      finish(true, "Minefield cleared");
    }
  }

  function floodReveal(index) {
    const queue = [index];
    while (queue.length) {
      const current = queue.shift();
      getNeighbors(current, size).forEach((neighborIndex) => {
        const neighbor = cells[neighborIndex];
        if (neighbor.revealed || neighbor.mine || neighbor.flagged) {
          return;
        }
        neighbor.revealed = true;
        revealedCount += 1;
        score += 8 * config.scoreMult;
        if (neighbor.count === 0) {
          queue.push(neighborIndex);
        }
      });
    }
  }

  function release() {
    if (released) {
      return;
    }
    released = true;
    cleanups.forEach((cleanup) => cleanup());
  }

  function finish(won, message) {
    if (finished) {
      return;
    }
    finished = true;
    cells.forEach((cell) => {
      if (cell.mine) {
        cell.revealed = true;
      }
    });
    renderBoard();
    release();
    hooks.finish({ won, message, score: Math.floor(score) });
  }

  hooks.setHud({
    score: 0,
    status: `${revealedCount}/${cells.length - mineCount} safe | ${Math.max(0, Math.ceil(timeLeft))}s`
  });

  return {
    variant,
    destroy() {
      release();
    }
  };
}

function createSumGame(variant, hooks) {
  const config = variant.config;
  const stage = document.createElement("div");
  stage.className = "sum-stage";
  stage.innerHTML = `
    <div class="sum-card">
      <div class="sum-problem">
        <p class="eyebrow">Equation Queue</p>
        <strong id="sum-problem-text">0 + 0</strong>
        <p class="sum-subtext" id="sum-subtext">Answer quickly to keep your streak alive.</p>
      </div>
      <input class="sum-input" id="sum-input" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="Type answer">
      <div class="sum-actions">
        <button class="sum-submit" id="sum-submit" type="button">Submit</button>
        <button class="sum-skip" id="sum-skip" type="button">Skip</button>
      </div>
      <div class="sum-keypad" id="sum-keypad"></div>
    </div>
  `;
  elements.gameStage.innerHTML = "";
  elements.gameStage.appendChild(stage);

  const input = stage.querySelector("#sum-input");
  const problemText = stage.querySelector("#sum-problem-text");
  const subtext = stage.querySelector("#sum-subtext");
  const submitButton = stage.querySelector("#sum-submit");
  const skipButton = stage.querySelector("#sum-skip");
  const keypad = stage.querySelector("#sum-keypad");
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "C", "0", "<"];
  const operations = config.speed > 1.12 || /Frenzy|Overclock|Nightcore/.test(`${variant.mutator} ${variant.mission}`) ? ["+", "-", "x"] : ["+", "-"];
  const rng = createSeededRandom(variant.index + 211);
  const durationCap = Math.max(30, config.duration);

  let current = null;
  let score = 0;
  let combo = 0;
  let timeLeft = durationCap;
  let finished = false;
  let released = false;
  const cleanups = [];

  hooks.setHint("Answer fast. Correct streaks add time and push the score harder.");
  cleanups.push(hooks.mountTouchButtons([]));

  keys.forEach((key) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sum-key";
    button.textContent = key;
    cleanups.push(listen(button, "click", () => handleKey(key)));
    keypad.appendChild(button);
  });

  cleanups.push(listen(submitButton, "click", submitAnswer));
  cleanups.push(listen(skipButton, "click", skipQuestion));
  cleanups.push(listen(input, "keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitAnswer();
    }
  }));

  const timerId = window.setInterval(() => {
    if (finished) {
      return;
    }
    timeLeft -= 0.1;
    hooks.setHud({
      score: Math.floor(score),
      status: `Combo ${combo} | ${Math.max(0, Math.ceil(timeLeft))}s`
    });
    if (timeLeft <= 0) {
      finish(false, "Clock ran dry");
    }
  }, 100);
  cleanups.push(() => window.clearInterval(timerId));

  nextQuestion();
  input.focus();

  function handleKey(key) {
    if (key === "C") {
      input.value = "";
      return;
    }
    if (key === "<") {
      input.value = input.value.slice(0, -1);
      return;
    }
    input.value += key;
  }

  function nextQuestion() {
    const operation = operations[Math.floor(rng() * operations.length)];
    let left = 1 + Math.floor(rng() * config.mathMax);
    let right = 1 + Math.floor(rng() * config.mathMax);
    let answer = 0;

    if (operation === "-") {
      if (right > left) {
        [left, right] = [right, left];
      }
      answer = left - right;
    } else if (operation === "x") {
      left = 2 + Math.floor(rng() * 12);
      right = 2 + Math.floor(rng() * 12);
      answer = left * right;
    } else {
      answer = left + right;
    }

    current = { prompt: `${left} ${operation} ${right}`, answer };
    problemText.textContent = current.prompt;
    subtext.textContent = `Range ${config.mathMax} | ${operations.join(" ")}`;
    input.value = "";
    input.focus();
  }

  function submitAnswer() {
    if (!current || finished) {
      return;
    }

    const raw = input.value.trim();
    if (!raw) {
      return;
    }

    const guess = Number(raw);
    if (Number.isNaN(guess)) {
      return;
    }

    if (guess === current.answer) {
      combo += 1;
      score += (26 + combo * 10) * config.scoreMult;
      timeLeft = Math.min(durationCap, timeLeft + 1.2);
      nextQuestion();
      return;
    }

    combo = 0;
    timeLeft = Math.max(0, timeLeft - 2);
    input.value = "";
    input.focus();
  }

  function skipQuestion() {
    combo = 0;
    timeLeft = Math.max(0, timeLeft - 3);
    nextQuestion();
  }

  function release() {
    if (released) {
      return;
    }
    released = true;
    cleanups.forEach((cleanup) => cleanup());
  }

  function finish(won, message) {
    if (finished) {
      return;
    }
    finished = true;
    release();
    hooks.finish({ won, message, score: Math.floor(score) });
  }

  hooks.setHud({
    score: 0,
    status: `Combo 0 | ${Math.ceil(timeLeft)}s`
  });

  return {
    variant,
    destroy() {
      release();
    }
  };
}

function listen(target, eventName, handler, options) {
  target.addEventListener(eventName, handler, options);
  return () => target.removeEventListener(eventName, handler, options);
}

function startAnimation(step) {
  let frameId = 0;
  let active = true;
  let lastTime = performance.now();

  function frame(now) {
    if (!active) {
      return;
    }
    const delta = Math.min(0.04, (now - lastTime) / 1000);
    lastTime = now;
    step(delta, now);
    frameId = window.requestAnimationFrame(frame);
  }

  frameId = window.requestAnimationFrame(frame);
  return () => {
    active = false;
    window.cancelAnimationFrame(frameId);
  };
}

function getCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };
}

function getNeighbors(index, size) {
  const x = index % size;
  const y = Math.floor(index / size);
  const neighbors = [];

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      if (offsetX === 0 && offsetY === 0) {
        continue;
      }
      const nextX = x + offsetX;
      const nextY = y + offsetY;
      if (nextX >= 0 && nextX < size && nextY >= 0 && nextY < size) {
        neighbors.push(nextY * size + nextX);
      }
    }
  }

  return neighbors;
}

function loadStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    return;
  }
}

function createSeededRandom(seed) {
  let stateValue = seed >>> 0;
  return () => {
    stateValue += 0x6d2b79f5;
    let next = Math.imul(stateValue ^ (stateValue >>> 15), 1 | stateValue);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function roundNumber(value, decimals) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}
