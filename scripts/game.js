import {
  CARD_BY_ID,
  CREATURES,
  CREATURE_BY_ID,
  DEFAULT_LOADOUT,
  ENEMY_TRAINERS,
  ENEMY_TRAINER_BY_ID,
  TYPE_INFO,
  TYPE_ORDER,
  getAvailableCardsForSquad,
  getCardDeckLimit,
  getDeckCardCount,
  normalizeDeckCounts,
} from "./monster-data.js";
import {
  canPlayCard,
  chooseAiAction,
  chooseReplacement,
  createBattle,
  endTurn,
  getCardPlayCost,
  playCard,
} from "./battle-engine.js";
import {
  clearLegacyStorage,
  loadLoadout,
  loadProfile,
  resetAllStorage,
  saveLoadout,
  saveProfile,
} from "./storage.js";

const appEl = document.getElementById("app");
const modalEl = document.getElementById("options-modal");
const modalContentEl = document.getElementById("options-content");
const toastEl = document.getElementById("toast");

const state = {
  screen: "title",
  profile: loadProfile(),
  loadout: loadLoadout(),
  battle: null,
  results: null,
  optionsOpen: false,
  selectedSlot: 0,
  previewCreatureId: null,
  creatureFilter: "all",
  cardTypeFilter: "all",
  cardCategoryFilter: "all",
  pendingSwitchHandIndex: null,
  aiRunning: false,
};

let toastTimer = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function delay(ms) {
  return new Promise((resolve) =>
    window.setTimeout(resolve, state.profile.options.reducedMotion ? 120 : ms)
  );
}

function persistProfile() {
  saveProfile(state.profile);
}

function persistLoadout() {
  saveLoadout(state.loadout);
}

function selectedEnemy() {
  return ENEMY_TRAINER_BY_ID[state.profile.selectedEnemyId] || ENEMY_TRAINERS[0];
}

function sanitizeLoadout() {
  state.loadout.deckCounts = normalizeDeckCounts(
    state.loadout.deckCounts,
    state.loadout.squadIds.filter(Boolean)
  );
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  toastEl.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastEl.hidden = true;
    toastEl.classList.remove("is-visible");
  }, 2200);
}

function validation() {
  const squadIds = state.loadout.squadIds.filter(Boolean);
  const errors = [];
  const deckSize = getDeckCardCount(state.loadout.deckCounts);
  const availableCards = getAvailableCardsForSquad(squadIds);
  const availableIds = new Set(availableCards.map((card) => card.id));

  if (squadIds.length !== 3) {
    errors.push("Choose exactly three creatures.");
  }
  if (new Set(squadIds).size !== squadIds.length) {
    errors.push("Each creature can only appear once.");
  }
  if (deckSize !== 24) {
    errors.push("Deck size must be exactly 24.");
  }

  Object.entries(state.loadout.deckCounts).forEach(([cardId, count]) => {
    const card = CARD_BY_ID[cardId];
    if (!card || !availableIds.has(cardId)) {
      errors.push("Deck contains illegal cards for the selected squad.");
      return;
    }
    if (count > getCardDeckLimit(card)) {
      errors.push(`${card.name} exceeds its copy limit.`);
    }
  });

  return { squadIds, deckSize, availableCards, errors, ready: errors.length === 0 };
}

function renderFatal(error) {
  appEl.innerHTML = `
    <section class="screen screen-results">
      <article class="results-card is-loss">
        <p class="eyebrow">Startup Error</p>
        <h1>Boot Failed</h1>
        <p class="results-copy">The new app hit an initialization error before it could render.</p>
        <div class="results-log">
          <p class="log-line">${String(error?.message || error || "Unknown error")}</p>
        </div>
      </article>
    </section>
  `;
}

function typeLabel(type) {
  return TYPE_INFO[type]?.label || "Neutral";
}

function typeBadge(type) {
  const info = TYPE_INFO[type];
  return `<span class="type-badge type-${type}">${info.glyph} ${info.label}</span>`;
}

function creatureCard(creatureId, opts = {}) {
  if (!creatureId) {
    return `<article class="specimen-card is-empty"><span>Empty Slot</span></article>`;
  }
  const creature = CREATURE_BY_ID[creatureId];
  return `
    <article class="specimen-card ${opts.selected ? "is-selected" : ""} ${opts.active ? "is-active" : ""} ${opts.compact ? "is-compact" : ""} ${opts.knockedOut ? "is-down" : ""} type-surface-${creature.type}">
      <header class="specimen-head">
        ${opts.slotLabel ? `<span class="slot-chip">${opts.slotLabel}</span>` : ""}
        ${typeBadge(creature.type)}
      </header>
      <div class="specimen-art"><span class="specimen-glyph">${creature.glyph}</span></div>
      <h3>${creature.name}</h3>
      <p class="specimen-blurb">${creature.blurb}</p>
      <div class="specimen-stats">
        <span>HP ${opts.hp ?? creature.maxHp}/${creature.maxHp}</span>
        <span>SPD ${creature.speed}</span>
      </div>
      ${
        opts.showPassive === false
          ? ""
          : `<p class="specimen-passive">${creature.passiveText}</p>`
      }
      <div class="status-row">
        ${opts.guard ? `<span class="status-pill guard">Guard ${opts.guard}</span>` : ""}
        ${opts.burn ? `<span class="status-pill burn">Burn</span>` : ""}
        ${opts.stun ? `<span class="status-pill stun">Stun</span>` : ""}
      </div>
    </article>
  `;
}

function deckMeter() {
  const size = getDeckCardCount(state.loadout.deckCounts);
  return `
    <div class="deck-meter">
      <div class="deck-meter-track"><span class="deck-meter-fill" style="width:${Math.min(100, Math.round((size / 24) * 100))}%"></span></div>
      <strong>${size}/24 cards</strong>
    </div>
  `;
}

function titleMarkup() {
  const check = validation();
  const enemy = selectedEnemy();
  return `
    <section class="screen screen-title">
      <div class="hero-panel">
        <p class="eyebrow">Original Retro-Weird Monster Card Battler</p>
        <h1>Night Circuit Coliseum</h1>
        <p class="hero-copy">Build a three-creature squad, assemble a 24-card deck, and duel a lab-broken rival trainer.</p>
        <div class="hero-actions">
          <button class="primary-button" type="button" data-action="open-builder">Enter Builder</button>
          <button class="secondary-button" type="button" data-action="start-battle" ${check.ready ? "" : "disabled"}>Launch Duel</button>
          <button class="ghost-button" type="button" data-action="open-options">Options</button>
        </div>
      </div>

      <div class="title-grid">
        <article class="title-card">
          <p class="eyebrow">Current Squad</p>
          <div class="mini-squad">
            ${state.loadout.squadIds
              .map(
                (creatureId, index) =>
                  `<div class="mini-squad-card">${creatureCard(creatureId, {
                    compact: true,
                    showPassive: false,
                    slotLabel: `Slot ${index + 1}`,
                  })}</div>`
              )
              .join("")}
          </div>
          ${deckMeter()}
        </article>

        <article class="title-card">
          <p class="eyebrow">Rival</p>
          <h2>${enemy.name}</h2>
          <p class="trainer-title">${enemy.title}</p>
          <p class="title-copy">${enemy.bio}</p>
          <div class="trainer-list">
            ${ENEMY_TRAINERS.map(
              (trainer) => `
                <button class="trainer-button ${trainer.id === enemy.id ? "is-selected" : ""}" type="button" data-action="select-enemy" data-enemy-id="${trainer.id}">
                  <span>${trainer.name}</span>
                  <small>${trainer.title}</small>
                </button>
              `
            ).join("")}
          </div>
        </article>

        <article class="title-card">
          <p class="eyebrow">Builder Status</p>
          <ul class="status-list">
            ${
              check.errors.length
                ? check.errors.map((error) => `<li>${error}</li>`).join("")
                : "<li>Your loadout is legal and ready.</li>"
            }
          </ul>
        </article>
      </div>
    </section>
  `;
}

function builderMarkup() {
  const check = validation();
  const previewId =
    state.previewCreatureId || state.loadout.squadIds.find(Boolean) || CREATURES[0].id;
  const filteredCreatures = CREATURES.filter(
    (creature) => state.creatureFilter === "all" || creature.type === state.creatureFilter
  );
  const filteredCards = check.availableCards.filter((card) => {
    const matchesType =
      state.cardTypeFilter === "all" ||
      (state.cardTypeFilter === "neutral" && !card.typeRequirement) ||
      card.typeRequirement === state.cardTypeFilter;
    const matchesCategory =
      state.cardCategoryFilter === "all" || card.category === state.cardCategoryFilter;
    return matchesType && matchesCategory;
  });

  return `
    <section class="screen screen-builder">
      <header class="builder-header">
        <div>
          <p class="eyebrow">Builder</p>
          <h1>Splice A Squad</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" data-action="open-title">Title</button>
          <button class="ghost-button" type="button" data-action="open-options">Options</button>
          <button class="primary-button" type="button" data-action="start-battle" ${check.ready ? "" : "disabled"}>Start Battle</button>
        </div>
      </header>

      <div class="builder-layout">
        <section class="builder-panel">
          <div class="panel-head">
            <div><p class="eyebrow">Squad</p><h2>Three Creatures</h2></div>
            <span class="pill">${check.squadIds.length}/3 locked</span>
          </div>
          <div class="squad-slots">
            ${state.loadout.squadIds
              .map(
                (creatureId, index) => `
                  <div class="squad-slot ${state.selectedSlot === index ? "is-selected" : ""}">
                    <button class="slot-select" type="button" data-action="select-slot" data-slot-index="${index}">
                      ${creatureCard(creatureId, {
                        compact: true,
                        selected: state.selectedSlot === index,
                        showPassive: false,
                        slotLabel: `Slot ${index + 1}`,
                      })}
                    </button>
                    <div class="slot-actions">
                      <button class="ghost-button" type="button" data-action="select-slot" data-slot-index="${index}">Target</button>
                      <button class="ghost-button" type="button" data-action="clear-slot" data-slot-index="${index}" ${creatureId ? "" : "disabled"}>Clear</button>
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>

          <div class="preview-panel">
            <p class="eyebrow">Preview</p>
            ${creatureCard(previewId, { selected: true })}
          </div>

          <div class="panel-head panel-head-spaced">
            <div><p class="eyebrow">Rival</p><h2>Curated Trainers</h2></div>
          </div>
          <div class="trainer-list">
            ${ENEMY_TRAINERS.map(
              (trainer) => `
                <button class="trainer-button ${trainer.id === state.profile.selectedEnemyId ? "is-selected" : ""}" type="button" data-action="select-enemy" data-enemy-id="${trainer.id}">
                  <span>${trainer.name}</span>
                  <small>${trainer.title}</small>
                </button>
              `
            ).join("")}
          </div>
        </section>

        <section class="builder-panel">
          <div class="panel-head">
            <div><p class="eyebrow">Roster</p><h2>Creature Archive</h2></div>
            <div class="filter-row">
              <button class="filter-button ${state.creatureFilter === "all" ? "is-selected" : ""}" type="button" data-action="filter-creatures" data-value="all">All</button>
              ${TYPE_ORDER.map(
                (type) => `<button class="filter-button ${state.creatureFilter === type ? "is-selected" : ""}" type="button" data-action="filter-creatures" data-value="${type}">${TYPE_INFO[type].label}</button>`
              ).join("")}
            </div>
          </div>
          <div class="creature-grid">
            ${filteredCreatures
              .map(
                (creature) => `
                  <button class="grid-tile" type="button" data-action="assign-creature" data-creature-id="${creature.id}">
                    ${creatureCard(creature.id, {
                      compact: true,
                      selected: previewId === creature.id,
                      showPassive: false,
                      slotLabel: state.loadout.squadIds.includes(creature.id) ? "Squad" : "Archive",
                    })}
                  </button>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="builder-panel">
          <div class="panel-head">
            <div><p class="eyebrow">Deck</p><h2>24 Card Braincase</h2></div>
            ${deckMeter()}
          </div>
          <div class="filter-row filter-row-wide">
            <button class="filter-button ${state.cardTypeFilter === "all" ? "is-selected" : ""}" type="button" data-action="filter-card-type" data-value="all">All Types</button>
            <button class="filter-button ${state.cardTypeFilter === "neutral" ? "is-selected" : ""}" type="button" data-action="filter-card-type" data-value="neutral">Neutral</button>
            ${TYPE_ORDER.map(
              (type) => `<button class="filter-button ${state.cardTypeFilter === type ? "is-selected" : ""}" type="button" data-action="filter-card-type" data-value="${type}">${TYPE_INFO[type].label}</button>`
            ).join("")}
          </div>
          <div class="filter-row filter-row-wide">
            ${["all", "attack", "support", "item", "switch"]
              .map(
                (category) => `<button class="filter-button ${state.cardCategoryFilter === category ? "is-selected" : ""}" type="button" data-action="filter-card-category" data-value="${category}">${category === "all" ? "All Roles" : category}</button>`
              )
              .join("")}
          </div>

          <div class="deck-contents">
            <div class="deck-list">
              <p class="eyebrow">Current Deck</p>
              ${
                Object.entries(state.loadout.deckCounts).length
                  ? Object.entries(state.loadout.deckCounts)
                      .sort((left, right) =>
                        CARD_BY_ID[left[0]].name.localeCompare(CARD_BY_ID[right[0]].name)
                      )
                      .map(
                        ([cardId, count]) => `
                          <div class="deck-row">
                            <div><strong>${CARD_BY_ID[cardId].name}</strong><small>${CARD_BY_ID[cardId].category}${CARD_BY_ID[cardId].typeRequirement ? ` • ${typeLabel(CARD_BY_ID[cardId].typeRequirement)}` : ""}</small></div>
                            <div class="deck-row-actions"><span>x${count}</span><button class="mini-button" type="button" data-action="remove-card" data-card-id="${cardId}">-</button></div>
                          </div>
                        `
                      )
                      .join("")
                  : `<p class="muted">No cards selected.</p>`
              }
            </div>

            <div class="library-list">
              <p class="eyebrow">Card Library</p>
              ${filteredCards
                .map((card) => {
                  const count = state.loadout.deckCounts[card.id] || 0;
                  return `
                    <article class="library-card ${card.rarity === "signature" ? "is-signature" : ""}">
                      <header>
                        <div><h3>${card.name}</h3><p>${card.category}${card.typeRequirement ? ` • ${typeLabel(card.typeRequirement)}` : ""}</p></div>
                        <span class="cost-chip">${card.energyCost}</span>
                      </header>
                      <p class="library-copy">${card.effectText}</p>
                      <footer>
                        <span class="copy-counter">${count}/${getCardDeckLimit(card)}</span>
                        <div class="library-actions">
                          <button class="mini-button" type="button" data-action="remove-card" data-card-id="${card.id}" ${count ? "" : "disabled"}>-</button>
                          <button class="mini-button" type="button" data-action="add-card" data-card-id="${card.id}" ${count < getCardDeckLimit(card) && check.deckSize < 24 ? "" : "disabled"}>+</button>
                        </div>
                      </footer>
                    </article>
                  `;
                })
                .join("")}
            </div>
          </div>

          <div class="validation-box ${check.ready ? "is-valid" : "is-invalid"}">
            <p class="eyebrow">${check.ready ? "Ready" : "Needs Work"}</p>
            <ul class="status-list">
              ${
                check.errors.length
                  ? check.errors.map((error) => `<li>${error}</li>`).join("")
                  : "<li>The squad and deck are battle legal.</li>"
              }
            </ul>
          </div>
        </section>
      </div>
    </section>
  `;
}

function battleCreatureShell(creature, opts = {}) {
  return `
    <button class="battle-creature-shell ${opts.clickable ? "is-clickable" : ""}" type="button" ${opts.action ? `data-action="${opts.action}"` : ""} ${typeof opts.index === "number" ? `data-bench-index="${opts.index}"` : ""} ${opts.clickable ? "" : "disabled"}>
      ${creatureCard(creature.creatureId, {
        active: opts.active,
        compact: opts.compact,
        hp: creature.hp,
        guard: creature.status.guard,
        burn: creature.status.burn,
        stun: creature.status.stun,
        knockedOut: creature.knockedOut,
        slotLabel: opts.slotLabel,
      })}
    </button>
  `;
}

function handCard(cardId, handIndex, battle) {
  const card = CARD_BY_ID[cardId];
  const playable = canPlayCard(battle, "player", handIndex);
  return `
    <button class="hand-card ${state.pendingSwitchHandIndex === handIndex ? "is-selected" : ""} ${playable ? "" : "is-disabled"} ${card.rarity === "signature" ? "is-signature" : ""}" type="button" data-action="play-hand-card" data-hand-index="${handIndex}" ${playable || card.category === "switch" ? "" : "disabled"}>
      <header><span class="pill">${card.category}</span><span class="cost-chip">${getCardPlayCost(battle, "player", card)}</span></header>
      <h3>${card.name}</h3>
      <p class="hand-card-type">${card.typeRequirement ? typeLabel(card.typeRequirement) : "Neutral"}</p>
      <p class="hand-card-copy">${card.effectText}</p>
      <div class="hand-card-foot"><strong>${card.power || "--"}</strong><span>${card.power ? "power" : "effect"}</span></div>
    </button>
  `;
}

function battleMarkup() {
  const battle = state.battle;
  const playerActive = battle.player.squad[battle.player.activeIndex];
  const enemyActive = battle.enemy.squad[battle.enemy.activeIndex];
  const switchCardId =
    state.pendingSwitchHandIndex != null
      ? battle.player.hand[state.pendingSwitchHandIndex]
      : null;
  const switchCard = switchCardId ? CARD_BY_ID[switchCardId] : null;
  const hint = battle.pendingPlayerSwitch
    ? "Your active creature fell. Pick a living bench creature."
    : switchCard
      ? `Choose a bench creature for ${switchCard.name}.`
      : battle.turn === "player"
        ? "Play cards, then end your turn."
        : `${battle.enemyTrainerName} is taking its turn.`;

  return `
    <section class="screen screen-battle">
      <header class="battle-header">
        <div><p class="eyebrow">Battle</p><h1>You vs ${battle.enemyTrainerName}</h1><p class="trainer-title">${battle.enemyTitle}</p></div>
        <div class="battle-status">
          <span class="pill ${battle.turn === "player" ? "is-hot" : ""}">Turn: ${battle.turn === "player" ? "You" : battle.enemyTrainerName}</span>
          <span class="pill">Energy ${battle.player.energy}</span>
          <span class="pill">Attack ${battle.player.attackUsed ? "Used" : "Ready"}</span>
          <button class="ghost-button" type="button" data-action="open-options">Options</button>
        </div>
      </header>

      <div class="battle-layout">
        <section class="battle-lane battle-lane-enemy">
          <div class="zone-title"><p class="eyebrow">Enemy Bench</p><span>${battle.enemy.drawPile.length} draw • ${battle.enemy.discardPile.length} discard</span></div>
          <div class="bench-line">
            ${battle.enemy.squad
              .map((creature, index) =>
                index === battle.enemy.activeIndex
                  ? ""
                  : battleCreatureShell(creature, { compact: true, slotLabel: "Bench" })
              )
              .join("")}
          </div>
          <div class="active-line">${battleCreatureShell(enemyActive, { active: true, slotLabel: "Enemy Active" })}</div>
        </section>

        <aside class="battle-log-panel">
          <p class="eyebrow">Signal Feed</p>
          <p class="battle-hint">${hint}</p>
          <div class="log-feed">${battle.log.slice(-12).map((entry) => `<p class="log-line">${entry}</p>`).join("")}</div>
        </aside>

        <section class="battle-lane battle-lane-player">
          <div class="active-line">${battleCreatureShell(playerActive, { active: true, slotLabel: "Your Active" })}</div>
          <div class="zone-title"><p class="eyebrow">Your Bench</p><span>${battle.player.drawPile.length} draw • ${battle.player.discardPile.length} discard</span></div>
          <div class="bench-line">
            ${battle.player.squad
              .map((creature, index) =>
                index === battle.player.activeIndex
                  ? ""
                  : battleCreatureShell(creature, {
                      compact: true,
                      index,
                      action: "select-player-bench",
                      clickable:
                        !creature.knockedOut &&
                        (battle.pendingPlayerSwitch || state.pendingSwitchHandIndex != null),
                      slotLabel: battle.pendingPlayerSwitch ? "Replace" : "Bench",
                    })
              )
              .join("")}
          </div>
        </section>
      </div>

      <section class="hand-panel">
        <div class="hand-header">
          <div><p class="eyebrow">Hand</p><h2>${battle.player.hand.length} cards loaded</h2></div>
          <button class="primary-button" type="button" data-action="end-turn" ${battle.turn === "player" && !battle.pendingPlayerSwitch && !state.aiRunning ? "" : "disabled"}>End Turn</button>
        </div>
        <div class="hand-grid">${battle.player.hand.map((cardId, handIndex) => handCard(cardId, handIndex, battle)).join("")}</div>
      </section>
    </section>
  `;
}

function resultsMarkup() {
  const win = state.results.winner === "player";
  const enemy = selectedEnemy();
  return `
    <section class="screen screen-results">
      <article class="results-card ${win ? "is-win" : "is-loss"}">
        <p class="eyebrow">Results</p>
        <h1>${win ? "Duel Won" : "Duel Lost"}</h1>
        <p class="results-copy">${win ? `You broke ${enemy.name}'s formation and kept ${state.results.playerAlive} creature(s) standing.` : `${enemy.name} outlasted your squad. ${state.results.enemyAlive} enemy creature(s) survived.`}</p>
        <div class="result-actions">
          <button class="primary-button" type="button" data-action="rematch">Rematch</button>
          <button class="secondary-button" type="button" data-action="open-builder">Builder</button>
          <button class="ghost-button" type="button" data-action="open-title">Title</button>
        </div>
        <div class="results-log">${state.results.logTail.map((entry) => `<p class="log-line">${entry}</p>`).join("")}</div>
      </article>
    </section>
  `;
}

function renderOptions() {
  modalEl.hidden = !state.optionsOpen;
  if (!state.optionsOpen) {
    modalContentEl.innerHTML = "";
    return;
  }

  modalContentEl.innerHTML = `
    <div class="options-stack">
      <label class="toggle-row">
        <span><strong>Reduced Motion</strong><small>Shortens pauses and calms screen effects.</small></span>
        <input id="reduced-motion-toggle" type="checkbox" ${state.profile.options.reducedMotion ? "checked" : ""} />
      </label>
      <div class="option-card">
        <strong>Reset Builder</strong>
        <p>Restore the default squad and deck without changing options.</p>
        <button class="secondary-button" type="button" data-action="reset-loadout">Reset Loadout</button>
      </div>
      <div class="option-card danger">
        <strong>Wipe V1 Data</strong>
        <p>Delete the new profile and new loadout, then return to the title screen.</p>
        <button class="primary-button danger" type="button" data-action="reset-all">Reset Everything</button>
      </div>
    </div>
  `;

  document.getElementById("reduced-motion-toggle")?.addEventListener("change", (event) => {
    state.profile.options.reducedMotion = event.target.checked;
    persistProfile();
  });
}

function render() {
  document.body.dataset.screen = state.screen;
  appEl.innerHTML =
    state.screen === "builder"
      ? builderMarkup()
      : state.screen === "battle"
        ? battleMarkup()
        : state.screen === "results"
          ? resultsMarkup()
          : titleMarkup();
  renderOptions();
}

function assignCreature(creatureId) {
  const slot = state.selectedSlot;
  const existing = state.loadout.squadIds.findIndex((id) => id === creatureId);
  if (existing === slot) {
    state.previewCreatureId = creatureId;
    render();
    return;
  }
  if (existing >= 0) {
    const temp = state.loadout.squadIds[slot] || null;
    state.loadout.squadIds[slot] = creatureId;
    state.loadout.squadIds[existing] = temp;
  } else {
    state.loadout.squadIds[slot] = creatureId;
  }
  state.previewCreatureId = creatureId;
  sanitizeLoadout();
  persistLoadout();
  render();
}

function clearSlot(slot) {
  state.loadout.squadIds[slot] = null;
  sanitizeLoadout();
  persistLoadout();
  render();
}

function changeDeckCount(cardId, delta) {
  const card = CARD_BY_ID[cardId];
  if (!card) {
    return;
  }
  const current = state.loadout.deckCounts[cardId] || 0;
  const next = current + delta;
  const size = getDeckCardCount(state.loadout.deckCounts);
  if (delta > 0 && size >= 24) {
    showToast("The deck is already full.");
    return;
  }
  if (next < 0) {
    return;
  }
  if (next > getCardDeckLimit(card)) {
    showToast("That card hit its copy limit.");
    return;
  }
  if (next === 0) {
    delete state.loadout.deckCounts[cardId];
  } else {
    state.loadout.deckCounts[cardId] = next;
  }
  persistLoadout();
  render();
}

function startBattle() {
  const check = validation();
  if (!check.ready) {
    showToast(check.errors[0]);
    return;
  }
  state.optionsOpen = false;
  state.battle = createBattle(
    { squadIds: check.squadIds, deckCounts: clone(state.loadout.deckCounts) },
    state.profile.selectedEnemyId
  );
  state.pendingSwitchHandIndex = null;
  state.aiRunning = false;
  state.results = null;
  state.screen = "battle";
  render();
}

function finishBattle() {
  if (!state.battle?.winner) {
    return;
  }
  state.results = {
    winner: state.battle.winner,
    playerAlive: state.battle.player.squad.filter((creature) => !creature.knockedOut).length,
    enemyAlive: state.battle.enemy.squad.filter((creature) => !creature.knockedOut).length,
    logTail: state.battle.log.slice(-8),
  };
  state.screen = "results";
  state.aiRunning = false;
  render();
}

async function runEnemyTurn() {
  if (!state.battle || state.aiRunning || state.battle.turn !== "enemy" || state.battle.winner) {
    return;
  }
  state.aiRunning = true;
  render();

  while (state.battle && state.battle.turn === "enemy" && !state.battle.winner) {
    if (state.battle.pendingPlayerSwitch) {
      state.battle.resumeTurnAfterSwitch = "player";
      state.aiRunning = false;
      render();
      return;
    }
    const action = chooseAiAction(state.battle, "enemy");
    if (!action) {
      await delay(700);
      endTurn(state.battle);
      break;
    }
    await delay(700);
    if (action.kind === "replace") {
      chooseReplacement(state.battle, "enemy", action.benchIndex, {
        reason: "is wired into the front line",
      });
    } else if (action.kind === "play-card") {
      playCard(state.battle, "enemy", action.handIndex, { benchIndex: action.benchIndex });
      if (state.battle.pendingPlayerSwitch) {
        state.battle.resumeTurnAfterSwitch = "player";
        state.aiRunning = false;
        render();
        return;
      }
    }
    render();
  }

  state.aiRunning = false;
  if (state.battle?.winner) {
    finishBattle();
    return;
  }
  render();
}

function playPlayerCard(handIndex) {
  const battle = state.battle;
  if (!battle || battle.turn !== "player" || state.aiRunning) {
    return;
  }
  if (battle.pendingPlayerSwitch) {
    showToast("Choose a replacement first.");
    return;
  }
  const card = CARD_BY_ID[battle.player.hand[handIndex]];
  if (!card) {
    return;
  }
  if (card.category === "switch") {
    if (!canPlayCard(battle, "player", handIndex)) {
      showToast("That switch cannot be used right now.");
      return;
    }
    state.pendingSwitchHandIndex =
      state.pendingSwitchHandIndex === handIndex ? null : handIndex;
    render();
    return;
  }
  if (!canPlayCard(battle, "player", handIndex)) {
    showToast("That card cannot be played right now.");
    return;
  }
  state.pendingSwitchHandIndex = null;
  playCard(battle, "player", handIndex);
  if (battle.winner) {
    finishBattle();
    return;
  }
  render();
}

function chooseBench(benchIndex) {
  const battle = state.battle;
  if (!battle || state.aiRunning) {
    return;
  }
  if (battle.pendingPlayerSwitch) {
    if (!chooseReplacement(battle, "player", benchIndex, { reason: "takes the active cradle" })) {
      showToast("Pick a living bench creature.");
      return;
    }
    render();
    if (battle.winner) {
      finishBattle();
      return;
    }
    if (battle.turn === "enemy") {
      runEnemyTurn();
    }
    return;
  }
  if (state.pendingSwitchHandIndex == null) {
    return;
  }
  if (!canPlayCard(battle, "player", state.pendingSwitchHandIndex, { benchIndex })) {
    showToast("Pick a living bench creature.");
    return;
  }
  playCard(battle, "player", state.pendingSwitchHandIndex, { benchIndex });
  state.pendingSwitchHandIndex = null;
  if (battle.winner) {
    finishBattle();
    return;
  }
  render();
}

function endPlayerTurn() {
  if (!state.battle || state.battle.turn !== "player" || state.aiRunning) {
    return;
  }
  if (state.battle.pendingPlayerSwitch) {
    showToast("Choose a replacement first.");
    return;
  }
  state.pendingSwitchHandIndex = null;
  endTurn(state.battle);
  if (state.battle.winner) {
    finishBattle();
    return;
  }
  render();
  if (state.battle.turn === "enemy") {
    runEnemyTurn();
  }
}

function handleAction(event) {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }
  const action = target.dataset.action;

  switch (action) {
    case "open-builder":
      state.optionsOpen = false;
      state.screen = "builder";
      render();
      break;
    case "open-title":
      state.battle = null;
      state.results = null;
      state.optionsOpen = false;
      state.pendingSwitchHandIndex = null;
      state.aiRunning = false;
      state.screen = "title";
      render();
      break;
    case "open-options":
      state.optionsOpen = true;
      renderOptions();
      break;
    case "close-options":
      state.optionsOpen = false;
      renderOptions();
      break;
    case "select-enemy":
      state.profile.selectedEnemyId = target.dataset.enemyId;
      persistProfile();
      render();
      break;
    case "select-slot":
      state.selectedSlot = Number(target.dataset.slotIndex);
      render();
      break;
    case "clear-slot":
      clearSlot(Number(target.dataset.slotIndex));
      break;
    case "assign-creature":
      assignCreature(target.dataset.creatureId);
      break;
    case "filter-creatures":
      state.creatureFilter = target.dataset.value;
      render();
      break;
    case "filter-card-type":
      state.cardTypeFilter = target.dataset.value;
      render();
      break;
    case "filter-card-category":
      state.cardCategoryFilter = target.dataset.value;
      render();
      break;
    case "add-card":
      changeDeckCount(target.dataset.cardId, 1);
      break;
    case "remove-card":
      changeDeckCount(target.dataset.cardId, -1);
      break;
    case "start-battle":
      startBattle();
      break;
    case "play-hand-card":
      playPlayerCard(Number(target.dataset.handIndex));
      break;
    case "select-player-bench":
      chooseBench(Number(target.dataset.benchIndex));
      break;
    case "end-turn":
      endPlayerTurn();
      break;
    case "rematch":
      startBattle();
      break;
    case "reset-loadout":
      state.loadout = clone(DEFAULT_LOADOUT);
      state.previewCreatureId = state.loadout.squadIds[0];
      persistLoadout();
      state.optionsOpen = false;
      render();
      showToast("Builder reset to default.");
      break;
    case "reset-all": {
      const next = resetAllStorage();
      state.profile = next.profile;
      state.loadout = next.loadout;
      state.battle = null;
      state.results = null;
      state.optionsOpen = false;
      state.pendingSwitchHandIndex = null;
      state.aiRunning = false;
      state.previewCreatureId = state.loadout.squadIds[0];
      render();
      showToast("All v1 data was reset.");
      break;
    }
    default:
      break;
  }
}

function init() {
  clearLegacyStorage();
  sanitizeLoadout();
  persistLoadout();
  state.previewCreatureId = state.loadout.squadIds.find(Boolean) || CREATURES[0].id;
  appEl.addEventListener("click", handleAction);
  modalEl.addEventListener("click", handleAction);
  render();
}

try {
  init();
} catch (error) {
  console.error(error);
  renderFatal(error);
}
