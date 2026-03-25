import { buildMarketDataset } from "./market-engine.js";

const WATCHLIST_STORAGE_KEY = "signal_forge_watchlists_v1";

const elements = {
  freshnessLabel: document.getElementById("freshness-label"),
  refreshButton: document.getElementById("refresh-button"),
  marketHeadline: document.getElementById("market-headline"),
  marketNarrative: document.getElementById("market-narrative"),
  marketForecast: document.getElementById("market-forecast"),
  marketCommand: document.getElementById("market-command"),
  hedgeCommand: document.getElementById("hedge-command"),
  riskCommand: document.getElementById("risk-command"),
  overallConfidence: document.getElementById("overall-confidence"),
  snapshotTime: document.getElementById("snapshot-time"),
  topPickSymbol: document.getElementById("top-pick-symbol"),
  topPickSummary: document.getElementById("top-pick-summary"),
  topPickCall: document.getElementById("top-pick-call"),
  topPickConfidence: document.getElementById("top-pick-confidence"),
  topPickWeight: document.getElementById("top-pick-weight"),
  topPickAction: document.getElementById("top-pick-action"),
  metricStrip: document.getElementById("metric-strip"),
  bullishList: document.getElementById("bullish-list"),
  bearishList: document.getElementById("bearish-list"),
  searchInput: document.getElementById("search-input"),
  biasFilter: document.getElementById("bias-filter"),
  sectorFilter: document.getElementById("sector-filter"),
  confidenceFilter: document.getElementById("confidence-filter"),
  confidenceFilterValue: document.getElementById("confidence-filter-value"),
  screenerBody: document.getElementById("screener-body"),
  detailSymbol: document.getElementById("detail-symbol"),
  detailSummary: document.getElementById("detail-summary"),
  detailVerdict: document.getElementById("detail-verdict"),
  detailNarrative: document.getElementById("detail-narrative"),
  tradePlan: document.getElementById("trade-plan"),
  indicatorGrid: document.getElementById("indicator-grid"),
  chart: document.getElementById("detail-chart"),
  addToWatchlistButton: document.getElementById("add-to-watchlist-button"),
  watchlistForm: document.getElementById("watchlist-form"),
  watchlistName: document.getElementById("watchlist-name"),
  watchlistSelect: document.getElementById("watchlist-select"),
  watchlistNote: document.getElementById("watchlist-note"),
  watchlistsContainer: document.getElementById("watchlists-container")
};

const state = {
  dataset: null,
  selectedSymbol: null,
  filters: {
    search: "",
    bias: "all",
    sector: "all",
    minConfidence: Number(elements.confidenceFilter.value)
  },
  watchlists: loadWatchlists(),
  activeWatchlistId: null
};

function loadWatchlists() {
  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Could not read watchlists from localStorage.", error);
  }

  return [
    {
      id: crypto.randomUUID(),
      name: "Focus Board",
      items: []
    }
  ];
}

function saveWatchlists() {
  window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(state.watchlists));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 2 : 3
  }).format(value);
}

function formatPercent(value, digits = 2) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function formatCompact(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function toneClass(bias) {
  if (bias === "bullish") {
    return "up";
  }
  if (bias === "bearish") {
    return "down";
  }
  return "flat";
}

function topLongCandidate() {
  return state.dataset.signals.find((signal) => signal.bias === "bullish") ?? state.dataset.signals[0];
}

function topShortCandidate() {
  return state.dataset.signals.find((signal) => signal.bias === "bearish") ?? state.dataset.signals[1] ?? state.dataset.signals[0];
}

function convictionWeight(signal) {
  if (signal.confidence >= 88) {
    return "Maximum";
  }
  if (signal.confidence >= 80) {
    return "Heavy";
  }
  if (signal.confidence >= 70) {
    return "Standard";
  }
  return "Starter";
}

function deskCall(signal, marketBias = state.dataset?.overview.overallBias) {
  if (signal.bias === "bullish") {
    if (signal.confidence >= 84) {
      return marketBias === "bearish" ? "Best long if risk improves" : "Build the largest long here";
    }
    if (signal.confidence >= 74) {
      return "Best long candidate";
    }
    return "Long watch candidate";
  }
  if (signal.bias === "bearish") {
    if (signal.confidence >= 82) {
      return "Primary hedge / short";
    }
    return "Avoid on the long side";
  }
  return "Wait for confirmation";
}

function executionNote(signal) {
  if (signal.bias === "bullish") {
    return `Prioritize ${signal.symbol} first. In this snapshot it is the strongest long-side structure, so it deserves the most capital attention if you are buying.`;
  }
  if (signal.bias === "bearish") {
    return `${signal.symbol} is the clearest downside setup right now. Treat it as the best hedge or as a warning against adding fresh longs.`;
  }
  return `${signal.symbol} is not ready for aggressive capital yet. Keep it on watch and wait for a cleaner break.`;
}

function marketStanceCopy() {
  const bias = state.dataset.overview.overallBias;
  if (bias === "bullish") {
    return "Lean risk-on and press the strongest long.";
  }
  if (bias === "bearish") {
    return "Stay defensive and protect capital.";
  }
  return "Trade selectively and size down.";
}

function riskCommandCopy(longSignal) {
  const bias = state.dataset.overview.overallBias;
  if (bias === "bullish") {
    return `Execute near ${longSignal.tradeLevels.entryZone[0]}-${longSignal.tradeLevels.entryZone[1]} and respect ${longSignal.tradeLevels.invalidation}.`;
  }
  if (bias === "bearish") {
    return "Only buy the best long names and keep sizing smaller until breadth repairs.";
  }
  return "Wait for cleaner confirmation before concentrating capital.";
}

function syncSectorOptions() {
  const current = state.filters.sector;
  elements.sectorFilter.innerHTML = [
    '<option value="all">All sectors</option>',
    ...state.dataset.sectors.map((sector) => `<option value="${escapeHtml(sector)}">${escapeHtml(sector)}</option>`)
  ].join("");
  elements.sectorFilter.value = current;
}

function selectedDetail() {
  const symbol = state.selectedSymbol ?? state.dataset?.overview.topBullish[0]?.symbol;
  return symbol ? state.dataset.details[symbol] : null;
}

function filteredSignals() {
  const search = state.filters.search.trim().toUpperCase();
  return state.dataset.signals.filter((signal) => {
    if (state.filters.bias !== "all" && signal.bias !== state.filters.bias) {
      return false;
    }
    if (state.filters.sector !== "all" && signal.sector !== state.filters.sector) {
      return false;
    }
    if (signal.confidence < state.filters.minConfidence) {
      return false;
    }
    if (search && !signal.symbol.includes(search) && !signal.name.toUpperCase().includes(search) && !signal.sector.toUpperCase().includes(search)) {
      return false;
    }
    return true;
  });
}

function renderMetricStrip() {
  const overview = state.dataset.overview;
  const leader = overview.sectors.find((sector) => sector.leader)?.sector ?? "Technology";
  const laggard = overview.sectors.find((sector) => sector.laggard)?.sector ?? "Utilities";
  const cards = [
    {
      label: "Tracked Universe",
      value: `${state.dataset.universeSize}`,
      copy: "Curated US stocks, ETFs, and synthetic breadth names for wide screening."
    },
    {
      label: "Breadth Spread",
      value: `${overview.breadth.advancers}/${overview.breadth.decliners}`,
      copy: "Advancers vs decliners across the current market snapshot."
    },
    {
      label: "Sector Leader",
      value: leader,
      copy: "Highest average structure score on the board right now."
    },
    {
      label: "Sector Laggard",
      value: laggard,
      copy: "Weakest sector tape contributing to the current market lean."
    }
  ];

  elements.metricStrip.innerHTML = cards
    .map(
      (card) => `
        <div class="metric-card">
          <span>${card.label}</span>
          <strong>${card.value}</strong>
          <p>${card.copy}</p>
        </div>
      `
    )
    .join("");
}

function signalCardMarkup(signal) {
  return `
    <button class="signal-card" type="button" data-symbol="${signal.symbol}">
      <div class="signal-card-header">
        <div>
          <h4>${signal.symbol}</h4>
          <p class="muted">${signal.name}</p>
        </div>
        <span class="signal-badge ${signal.bias}">${signal.bias} ${signal.confidence}%</span>
      </div>
      <div class="signal-meta">
        <div>
          <span>Price</span>
          <strong>${formatCurrency(signal.price)}</strong>
        </div>
        <div>
          <span>Change</span>
          <strong class="${toneClass(signal.bias)}">${formatPercent(signal.changePct)}</strong>
        </div>
        <div>
          <span>Volume</span>
          <strong>${formatCompact(signal.volume)}</strong>
        </div>
      </div>
      <p class="signal-copy">${signal.shortThesis}</p>
      <div class="signal-tags">
        ${signal.patternTags.map((tag) => `<span>${tag}</span>`).join("")}
      </div>
    </button>
  `;
}

function renderLeaders() {
  elements.bullishList.innerHTML = state.dataset.overview.topBullish.slice(0, 4).map(signalCardMarkup).join("");
  elements.bearishList.innerHTML = state.dataset.overview.topBearish.slice(0, 4).map(signalCardMarkup).join("");
}

function renderPulse() {
  const overview = state.dataset.overview;
  const longFocus = topLongCandidate();
  const shortFocus = topShortCandidate();

  elements.freshnessLabel.textContent = `${overview.freshnessLabel} · ${state.dataset.universeSize} symbols tracked`;
  elements.marketHeadline.textContent = overview.headline;
  elements.marketNarrative.textContent = overview.narrative;
  elements.marketForecast.textContent = overview.forecast;
  elements.marketCommand.textContent = marketStanceCopy();
  elements.hedgeCommand.textContent = `${shortFocus.symbol} is the clearest hedge.`;
  elements.riskCommand.textContent = riskCommandCopy(longFocus);
  elements.overallConfidence.textContent = `${overview.overallConfidence}%`;
  elements.snapshotTime.textContent = formatDateTime(overview.timestamp);
  elements.topPickSymbol.textContent = longFocus.symbol;
  elements.topPickSummary.textContent = `${longFocus.name} is the highest-conviction long in this snapshot. ${longFocus.shortThesis}`;
  elements.topPickCall.textContent = deskCall(longFocus);
  elements.topPickConfidence.textContent = `${longFocus.confidence}%`;
  elements.topPickWeight.textContent = convictionWeight(longFocus);
  elements.topPickAction.textContent = executionNote(longFocus);
  renderMetricStrip();
}

function renderScreener() {
  const signals = filteredSignals().slice(0, 80);
  elements.screenerBody.innerHTML = signals
    .map(
      (signal) => `
        <tr class="${signal.symbol === state.selectedSymbol ? "is-active" : ""}" data-symbol="${signal.symbol}">
          <td>
            <button class="ticker-button" type="button" data-symbol="${signal.symbol}">
              <strong>${signal.symbol}</strong>
              <span>${signal.name}</span>
            </button>
          </td>
          <td>${deskCall(signal)}</td>
          <td class="${toneClass(signal.bias)}">${signal.bias}</td>
          <td>${signal.confidence}%</td>
          <td>${formatCurrency(signal.price)}</td>
          <td class="${signal.changePct >= 0 ? "up" : "down"}">${formatPercent(signal.changePct)}</td>
          <td>${signal.sector}</td>
          <td>${signal.patternTags.join(", ")}</td>
        </tr>
      `
    )
    .join("");
}

function renderTradePlan(detail) {
  const plan = [
    ["Bias", detail.snapshot.bias],
    ["Entry", `${detail.snapshot.tradeLevels.entryZone[0]} - ${detail.snapshot.tradeLevels.entryZone[1]}`],
    ["Target", `${detail.snapshot.tradeLevels.targetZone[0]} - ${detail.snapshot.tradeLevels.targetZone[1]}`],
    ["Invalidation", `${detail.snapshot.tradeLevels.invalidation}`]
  ];

  elements.tradePlan.innerHTML = plan
    .map(
      ([label, value]) => `
        <div>
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");
}

function renderIndicators(detail) {
  const indicators = [
    ["RSI 14", detail.indicators.rsi14.toFixed(1)],
    ["MACD Histogram", detail.indicators.macdHistogram.toFixed(2)],
    ["VWAP", detail.indicators.vwap.toFixed(2)],
    ["ATR 14", detail.indicators.atr14.toFixed(2)],
    ["Relative Strength", detail.indicators.relativeStrength.toFixed(2)],
    ["Volume Ratio", detail.indicators.volumeRatio.toFixed(2)]
  ];

  elements.indicatorGrid.innerHTML = indicators
    .map(
      ([label, value]) => `
        <div class="indicator-cell">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");
}

function renderDetailSummary(detail) {
  const tiles = [
    ["Desk Call", deskCall(detail.snapshot)],
    ["Bias", `${detail.snapshot.bias} · ${detail.snapshot.confidence}%`],
    ["Last Price", formatCurrency(detail.snapshot.price)],
    ["Session Change", formatPercent(detail.snapshot.changePct)],
    ["Sector", detail.snapshot.sector],
    ["Focus Weight", convictionWeight(detail.snapshot)]
  ];

  elements.detailSummary.innerHTML = tiles
    .map(
      ([label, value]) => `
        <div class="summary-tile">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");
}

function renderDetail() {
  const detail = selectedDetail();
  if (!detail) {
    return;
  }

  state.selectedSymbol = detail.snapshot.symbol;
  elements.detailSymbol.textContent = `${detail.snapshot.symbol} · ${detail.snapshot.name}`;
  elements.detailNarrative.textContent = detail.narrative;
  elements.detailVerdict.textContent = executionNote(detail.snapshot);
  renderDetailSummary(detail);
  renderTradePlan(detail);
  renderIndicators(detail);
  drawChart(detail);
}

function drawChart(detail) {
  const canvas = elements.chart;
  const context = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 900;
  const height = 340;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  const candles = detail.candles.slice(-50);
  const values = candles.flatMap((candle) => [candle.high, candle.low]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = { top: 24, right: 36, bottom: 28, left: 20 };
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  const step = usableWidth / candles.length;

  context.clearRect(0, 0, width, height);

  context.strokeStyle = "rgba(239,228,201,0.16)";
  context.lineWidth = 1;
  for (let row = 0; row < 5; row += 1) {
    const y = padding.top + ((usableHeight / 4) * row);
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
  }

  const priceToY = (price) =>
    padding.top + usableHeight - (((price - min) / Math.max(max - min, 0.001)) * usableHeight);

  const sma20 = candles.map((_, index, collection) => {
    const slice = collection.slice(Math.max(0, index - 19), index + 1);
    return slice.reduce((total, candle) => total + candle.close, 0) / slice.length;
  });

  context.beginPath();
  context.strokeStyle = "rgba(182, 133, 29, 0.95)";
  context.lineWidth = 2;
  sma20.forEach((value, index) => {
    const x = padding.left + (step * index) + (step / 2);
    const y = priceToY(value);
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.stroke();

  candles.forEach((candle, index) => {
    const x = padding.left + (step * index) + (step / 2);
    const openY = priceToY(candle.open);
    const closeY = priceToY(candle.close);
    const highY = priceToY(candle.high);
    const lowY = priceToY(candle.low);
    const rising = candle.close >= candle.open;

    context.strokeStyle = rising ? "#0f5f4b" : "#cf2c12";
    context.fillStyle = rising ? "#0f5f4b" : "#cf2c12";
    context.lineWidth = 1.4;
    context.beginPath();
    context.moveTo(x, highY);
    context.lineTo(x, lowY);
    context.stroke();

    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(Math.abs(closeY - openY), 2);
    context.fillRect(x - Math.max(step * 0.26, 2), bodyTop, Math.max(step * 0.52, 4), bodyHeight);
  });

  context.fillStyle = "rgba(239,228,201,0.6)";
  context.font = "12px Sora";
  context.textAlign = "right";
  [max, (max + min) / 2, min].forEach((value, index) => {
    context.fillText(value.toFixed(2), width - 8, padding.top + (usableHeight / 2) * index);
  });
}

function renderWatchlistSelect() {
  if (!state.watchlists.length) {
    state.watchlists.push({
      id: crypto.randomUUID(),
      name: "Focus Board",
      items: []
    });
  }

  if (!state.activeWatchlistId || !state.watchlists.some((list) => list.id === state.activeWatchlistId)) {
    state.activeWatchlistId = state.watchlists[0].id;
  }

  elements.watchlistSelect.innerHTML = state.watchlists
    .map((watchlist) => `<option value="${watchlist.id}">${escapeHtml(watchlist.name)}</option>`)
    .join("");
  elements.watchlistSelect.value = state.activeWatchlistId;
}

function renderWatchlists() {
  renderWatchlistSelect();
  elements.watchlistsContainer.innerHTML = state.watchlists
    .map((watchlist) => `
      <article class="watchlist-card" data-watchlist-id="${watchlist.id}">
        <div class="watchlist-card-header">
          <div>
            <h4>${escapeHtml(watchlist.name)}</h4>
            <p class="muted">${watchlist.items.length} saved symbols</p>
          </div>
          <button type="button" data-action="delete-list" data-watchlist-id="${watchlist.id}">Delete</button>
        </div>
        <div class="watchlist-items">
          ${
            watchlist.items.length
              ? watchlist.items
                  .map((item) => {
                    const signal = state.dataset.details[item.symbol]?.snapshot;
                    return `
                      <div class="watch-item">
                        <button type="button" data-action="select-symbol" data-symbol="${item.symbol}">
                          <strong>${item.symbol}</strong>
                          <small>${escapeHtml(item.note || "No note added.")}</small>
                        </button>
                        <div>
                          <strong class="${toneClass(signal?.bias || "neutral")}">${signal?.bias || "saved"}</strong>
                          <small>${signal ? `${signal.confidence}% confidence` : "Awaiting snapshot"}</small>
                          <button type="button" data-action="remove-item" data-watchlist-id="${watchlist.id}" data-item-symbol="${item.symbol}">Remove</button>
                        </div>
                      </div>
                    `;
                  })
                  .join("")
              : '<p class="muted">No symbols saved in this watchlist yet.</p>'
          }
        </div>
      </article>
    `)
    .join("");
}

function renderAll() {
  renderPulse();
  renderLeaders();
  renderScreener();
  renderDetail();
  renderWatchlists();
}

function refreshDataset() {
  state.dataset = buildMarketDataset(new Date());
  syncSectorOptions();
  if (!state.selectedSymbol || !state.dataset.details[state.selectedSymbol]) {
    state.selectedSymbol = state.dataset.overview.topBullish[0]?.symbol ?? state.dataset.signals[0]?.symbol ?? null;
  }
  renderAll();
}

function createWatchlist(name) {
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }

  state.watchlists.unshift({
    id: crypto.randomUUID(),
    name: trimmed,
    items: []
  });
  state.activeWatchlistId = state.watchlists[0].id;
  saveWatchlists();
  renderWatchlists();
}

function addSelectedToWatchlist() {
  const detail = selectedDetail();
  if (!detail) {
    return;
  }

  const watchlist = state.watchlists.find((list) => list.id === state.activeWatchlistId);
  if (!watchlist) {
    return;
  }

  const note = elements.watchlistNote.value.trim();
  const existing = watchlist.items.find((item) => item.symbol === detail.snapshot.symbol);
  if (existing) {
    existing.note = note || existing.note;
  } else {
    watchlist.items.unshift({
      symbol: detail.snapshot.symbol,
      note
    });
  }

  elements.watchlistNote.value = "";
  saveWatchlists();
  renderWatchlists();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function wireEvents() {
  elements.refreshButton.addEventListener("click", refreshDataset);
  elements.addToWatchlistButton.addEventListener("click", addSelectedToWatchlist);

  elements.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value;
    renderScreener();
  });

  elements.biasFilter.addEventListener("change", (event) => {
    state.filters.bias = event.target.value;
    renderScreener();
  });

  elements.sectorFilter.addEventListener("change", (event) => {
    state.filters.sector = event.target.value;
    renderScreener();
  });

  elements.confidenceFilter.addEventListener("input", (event) => {
    state.filters.minConfidence = Number(event.target.value);
    elements.confidenceFilterValue.textContent = `${state.filters.minConfidence}%`;
    renderScreener();
  });

  elements.watchlistSelect.addEventListener("change", (event) => {
    state.activeWatchlistId = event.target.value;
  });

  elements.watchlistForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createWatchlist(elements.watchlistName.value);
    elements.watchlistName.value = "";
  });

  const symbolDelegates = [elements.bullishList, elements.bearishList, elements.screenerBody, elements.watchlistsContainer];
  symbolDelegates.forEach((element) => {
    element.addEventListener("click", (event) => {
      const deleteList = event.target.closest('[data-action="delete-list"]');
      if (deleteList?.dataset.watchlistId) {
        state.watchlists = state.watchlists.filter((watchlist) => watchlist.id !== deleteList.dataset.watchlistId);
        saveWatchlists();
        renderWatchlists();
        return;
      }

      const removeItem = event.target.closest('[data-action="remove-item"]');
      if (removeItem?.dataset.watchlistId && removeItem?.dataset.itemSymbol) {
        const list = state.watchlists.find((watchlist) => watchlist.id === removeItem.dataset.watchlistId);
        if (list) {
          list.items = list.items.filter((item) => item.symbol !== removeItem.dataset.itemSymbol);
          saveWatchlists();
          renderWatchlists();
        }
        return;
      }

      const target = event.target.closest("[data-symbol]");
      if (target?.dataset.symbol) {
        state.selectedSymbol = target.dataset.symbol;
        renderScreener();
        renderDetail();
      }
    });
  });

  window.addEventListener("resize", () => {
    const detail = selectedDetail();
    if (detail) {
      drawChart(detail);
    }
  });
}

function init() {
  wireEvents();
  refreshDataset();
}

init();
