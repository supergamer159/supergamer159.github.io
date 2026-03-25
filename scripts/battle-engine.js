import {
  CARD_BY_ID,
  CREATURE_BY_ID,
  ENEMY_TRAINER_BY_ID,
  TYPE_INFO,
} from "./monster-data.js";

const ATTACK_ADVANTAGE_MULTIPLIER = 1.25;
const ATTACK_DISADVANTAGE_MULTIPLIER = 0.8;
const BURN_DAMAGE = 7;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function shuffle(list) {
  const next = list.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = temp;
  }
  return next;
}

function expandDeck(deckCounts) {
  return Object.entries(deckCounts).flatMap(([cardId, count]) =>
    Array.from({ length: count }, () => cardId)
  );
}

function createCreatureInstance(creatureId, sideKey, slotIndex) {
  const source = CREATURE_BY_ID[creatureId];
  return {
    instanceId: `${sideKey}-${slotIndex}-${creatureId}`,
    creatureId: source.id,
    name: source.name,
    type: source.type,
    maxHp: source.maxHp,
    hp: source.maxHp,
    speed: source.speed,
    artKey: source.artKey,
    glyph: source.glyph,
    passive: clone(source.passive),
    passiveText: source.passiveText,
    blurb: source.blurb,
    status: {
      burn: false,
      stun: 0,
      guard: 0,
    },
    knockedOut: false,
  };
}

function createSide(sideKey, label, squadIds, deckCounts) {
  return {
    key: sideKey,
    label,
    squad: squadIds.map((creatureId, slotIndex) => createCreatureInstance(creatureId, sideKey, slotIndex)),
    activeIndex: 0,
    drawPile: shuffle(expandDeck(deckCounts)),
    hand: [],
    discardPile: [],
    energy: 0,
    attackUsed: false,
    turnsTaken: 0,
  };
}

function getSide(state, sideKey) {
  return state[sideKey];
}

function getOpponentSideKey(sideKey) {
  return sideKey === "player" ? "enemy" : "player";
}

function getActiveCreature(state, sideKey) {
  const side = getSide(state, sideKey);
  return side.squad[side.activeIndex] || null;
}

function getBenchIndices(state, sideKey) {
  const side = getSide(state, sideKey);
  return side.squad
    .map((creature, index) => ({ creature, index }))
    .filter(({ creature, index }) => index !== side.activeIndex && creature && !creature.knockedOut)
    .map(({ index }) => index);
}

function addLog(state, text) {
  state.log.push(text);
  if (state.log.length > 40) {
    state.log.splice(0, state.log.length - 40);
  }
}

function drawCards(state, sideKey, amount, reason = "draws") {
  const side = getSide(state, sideKey);
  let drawn = 0;

  while (drawn < amount) {
    if (!side.drawPile.length) {
      if (!side.discardPile.length) {
        break;
      }
      side.drawPile = shuffle(side.discardPile);
      side.discardPile = [];
      addLog(state, `${side.label} shuffles the discard pile back into the deck.`);
    }

    const nextCardId = side.drawPile.shift();
    if (!nextCardId) {
      break;
    }
    side.hand.push(nextCardId);
    drawn += 1;
  }

  if (drawn > 0) {
    addLog(state, `${side.label} ${reason} ${drawn} card${drawn === 1 ? "" : "s"}.`);
  }
}

function getTypeMultiplier(attackerType, defenderType) {
  if (!attackerType || !defenderType) {
    return 1;
  }
  if (TYPE_INFO[attackerType]?.strongAgainst === defenderType) {
    return ATTACK_ADVANTAGE_MULTIPLIER;
  }
  if (TYPE_INFO[attackerType]?.weakAgainst === defenderType) {
    return ATTACK_DISADVANTAGE_MULTIPLIER;
  }
  return 1;
}

function clearExpiringEffects(state, sideKey) {
  const side = getSide(state, sideKey);
  side.squad.forEach((creature) => {
    if (!creature.knockedOut) {
      creature.status.guard = 0;
    }
  });
}

function healCreature(creature, amount) {
  if (creature.knockedOut) {
    return 0;
  }
  const before = creature.hp;
  creature.hp = Math.min(creature.maxHp, creature.hp + amount);
  return creature.hp - before;
}

function cleanseCreature(creature, statuses) {
  if (creature.knockedOut) {
    return false;
  }
  let changed = false;
  statuses.forEach((status) => {
    if (status === "burn" && creature.status.burn) {
      creature.status.burn = false;
      changed = true;
    }
    if (status === "stun" && creature.status.stun > 0) {
      creature.status.stun = 0;
      changed = true;
    }
  });
  return changed;
}

function applyStatus(creature, status) {
  if (creature.knockedOut) {
    return false;
  }
  if (status === "burn") {
    const changed = !creature.status.burn;
    creature.status.burn = true;
    return changed;
  }
  if (status === "stun") {
    creature.status.stun = 1;
    return true;
  }
  return false;
}

function getPassiveBonusDamage(attacker, defender, card) {
  if (!attacker?.passive || attacker.knockedOut) {
    return 0;
  }

  switch (attacker.passive.kind) {
    case "type-damage-bonus":
      return card.typeRequirement === attacker.type ? attacker.passive.amount : 0;
    case "faster-damage-bonus":
      return attacker.speed > defender.speed ? attacker.passive.amount : 0;
    case "bloodied-damage-bonus":
      return attacker.hp <= Math.ceil(attacker.maxHp / 2) ? attacker.passive.amount : 0;
    default:
      return 0;
  }
}

function getFlatShield(defender) {
  return defender?.passive?.kind === "flat-shield" ? defender.passive.amount : 0;
}

function sideHasLivingCreatures(state, sideKey) {
  return getSide(state, sideKey).squad.some((creature) => !creature.knockedOut);
}

function triggerEnterActivePassive(state, sideKey, reason = "enters the active slot") {
  const active = getActiveCreature(state, sideKey);
  const side = getSide(state, sideKey);

  if (!active || !active.passive) {
    return;
  }

  switch (active.passive.kind) {
    case "enter-guard":
      active.status.guard += active.passive.amount;
      addLog(state, `${active.name} ${reason} and gains ${active.passive.amount} guard.`);
      break;
    case "cleanse-on-enter":
      if (cleanseCreature(active, ["burn", "stun"])) {
        addLog(state, `${active.name} ${reason} and sheds its status effects.`);
      }
      break;
    case "switch-draw":
      drawCards(state, sideKey, active.passive.amount, "pulls");
      addLog(state, `${active.name} ${reason} and reads the room.`);
      break;
    default:
      break;
  }

  if (side.key === "enemy" && state.pendingPlayerSwitch) {
    return;
  }
}

function startTurn(state, sideKey, options = {}) {
  state.turn = sideKey;
  const side = getSide(state, sideKey);
  side.turnsTaken += 1;
  side.energy = 3;
  side.attackUsed = false;
  clearExpiringEffects(state, sideKey);

  const active = getActiveCreature(state, sideKey);
  if (active?.passive?.kind === "turn-start-guard") {
    active.status.guard += active.passive.amount;
    addLog(state, `${active.name} braces for impact and gains ${active.passive.amount} guard.`);
  }

  if (!options.skipDraw) {
    drawCards(state, sideKey, 1, "draws");
  }
  addLog(state, `${side.label}'s turn begins with ${side.energy} energy.`);
}

function chooseBestBenchIndex(state, sideKey) {
  const opponent = getActiveCreature(state, getOpponentSideKey(sideKey));
  let best = null;

  getBenchIndices(state, sideKey).forEach((index) => {
    const creature = getSide(state, sideKey).squad[index];
    const matchup = getTypeMultiplier(creature.type, opponent?.type);
    const score = matchup * 100 + creature.hp + creature.speed;
    if (!best || score > best.score) {
      best = { index, score };
    }
  });

  return best ? best.index : -1;
}

function handleKnockout(state, sideKey, creatureIndex) {
  const side = getSide(state, sideKey);
  const creature = side.squad[creatureIndex];
  if (!creature || creature.knockedOut) {
    return;
  }

  creature.hp = 0;
  creature.knockedOut = true;
  creature.status.guard = 0;
  creature.status.stun = 0;
  addLog(state, `${creature.name} collapses.`);

  if (!sideHasLivingCreatures(state, sideKey)) {
    state.winner = getOpponentSideKey(sideKey);
    addLog(state, `${getSide(state, state.winner).label} wins the duel.`);
    return;
  }

  if (side.activeIndex !== creatureIndex) {
    return;
  }

  if (sideKey === "enemy") {
    const replacement = chooseBestBenchIndex(state, sideKey);
    if (replacement >= 0) {
      chooseReplacement(state, sideKey, replacement, { reason: "is thrown into the spotlight" });
    }
    return;
  }

  state.pendingPlayerSwitch = true;
  addLog(state, `Pick a replacement for ${side.label}.`);
}

function applyDamage(state, sourceSideKey, targetSideKey, targetIndex, amount, context = {}) {
  const target = getSide(state, targetSideKey).squad[targetIndex];
  if (!target || target.knockedOut) {
    return 0;
  }

  const reducedByPassive = Math.max(0, amount - getFlatShield(target));
  const finalAmount = Math.max(0, reducedByPassive - target.status.guard);
  target.hp = Math.max(0, target.hp - finalAmount);

  if (finalAmount > 0) {
    addLog(state, `${target.name} takes ${finalAmount} damage.`);
  } else {
    addLog(state, `${target.name} absorbs the hit.`);
  }

  if (target.hp <= 0) {
    handleKnockout(state, targetSideKey, targetIndex);
  }

  if (
    finalAmount > 0 &&
    !state.winner &&
    context.fromAttack &&
    context.attacker?.passive?.kind === "attack-inflicts-burn"
  ) {
    if (applyStatus(target, "burn")) {
      addLog(state, `${target.name} is set ablaze.`);
    }
  }

  if (
    finalAmount > 0 &&
    !state.winner &&
    context.fromAttack &&
    context.attacker?.passive?.kind === "attack-inflicts-stun"
  ) {
    if (applyStatus(target, "stun")) {
      addLog(state, `${target.name} starts to flicker with stun.`);
    }
  }

  return finalAmount;
}

function resolveEffect(state, sideKey, effect, options = {}) {
  const actor = getActiveCreature(state, sideKey);
  const opponentSideKey = getOpponentSideKey(sideKey);
  const allyActive = getActiveCreature(state, sideKey);
  const enemyActive = getActiveCreature(state, opponentSideKey);

  const pickCreature = (targetKey) => {
    if (targetKey === "ally-active") {
      return allyActive;
    }
    if (targetKey === "enemy-active") {
      return enemyActive;
    }
    if (targetKey === "ally-bench") {
      const benchIndex = options.benchIndex;
      return getSide(state, sideKey).squad[benchIndex] || null;
    }
    return null;
  };

  switch (effect.kind) {
    case "heal": {
      const target = pickCreature(effect.target);
      if (!target) {
        return;
      }
      const healed = healCreature(target, effect.amount);
      if (healed > 0) {
        addLog(state, `${target.name} recovers ${healed} health.`);
      }
      break;
    }
    case "guard": {
      const target = pickCreature(effect.target);
      if (!target) {
        return;
      }
      target.status.guard += effect.amount;
      addLog(state, `${target.name} gains ${effect.amount} guard.`);
      break;
    }
    case "draw":
      drawCards(state, sideKey, effect.amount);
      break;
    case "cleanse": {
      const target = pickCreature(effect.target);
      if (!target) {
        return;
      }
      if (cleanseCreature(target, effect.statuses || ["burn", "stun"])) {
        addLog(state, `${target.name} is cleaned up and stable.`);
      }
      break;
    }
    case "apply-status": {
      const target = pickCreature(effect.target);
      if (!target) {
        return;
      }
      if (applyStatus(target, effect.status)) {
        const label = effect.status === "burn" ? "burning" : "stunned";
        addLog(state, `${target.name} is now ${label}.`);
      }
      break;
    }
    case "damage": {
      const target = pickCreature(effect.target);
      if (!target) {
        return;
      }
      const targetIndex = getSide(state, opponentSideKey).squad.findIndex(
        (creature) => creature.instanceId === target.instanceId
      );
      applyDamage(state, sideKey, opponentSideKey, targetIndex, effect.amount, {
        fromAttack: !!effect.typed,
        attacker: actor,
      });
      break;
    }
    case "switch":
      if (typeof options.benchIndex === "number") {
        chooseReplacement(state, sideKey, options.benchIndex, {
          reason: "slides into the active slot",
          voluntary: true,
        });
      }
      break;
    default:
      break;
  }
}

export function getCardPlayCost(state, sideKey, card) {
  const active = getActiveCreature(state, sideKey);
  if (!card) {
    return Infinity;
  }
  if (card.category !== "attack") {
    return card.energyCost;
  }
  return card.energyCost + (active?.status?.stun ? 1 : 0);
}

export function canPlayCard(state, sideKey, handIndex, options = {}) {
  if (state.winner) {
    return false;
  }

  const side = getSide(state, sideKey);
  if (state.turn !== sideKey) {
    return false;
  }
  if (sideKey === "player" && state.pendingPlayerSwitch) {
    return false;
  }

  const cardId = side.hand[handIndex];
  const card = CARD_BY_ID[cardId];
  const active = getActiveCreature(state, sideKey);

  if (!card || !active || active.knockedOut) {
    return false;
  }
  if (card.category === "attack" && side.attackUsed) {
    return false;
  }
  if (card.typeRequirement && active.type !== card.typeRequirement) {
    return false;
  }
  if (card.category === "switch" && getBenchIndices(state, sideKey).length === 0) {
    return false;
  }
  if (card.category === "switch" && typeof options.benchIndex === "number") {
    if (!getBenchIndices(state, sideKey).includes(options.benchIndex)) {
      return false;
    }
  }
  if (getCardPlayCost(state, sideKey, card) > side.energy) {
    return false;
  }
  return true;
}

function buildAttackDamage(state, sideKey, card) {
  const attacker = getActiveCreature(state, sideKey);
  const defender = getActiveCreature(state, getOpponentSideKey(sideKey));
  const basePower = (card.power || 0) + getPassiveBonusDamage(attacker, defender, card);
  const multiplier = getTypeMultiplier(card.typeRequirement || attacker.type, defender.type);
  return Math.max(0, Math.round(basePower * multiplier));
}

export function playCard(state, sideKey, handIndex, options = {}) {
  if (!canPlayCard(state, sideKey, handIndex, options)) {
    return false;
  }

  const side = getSide(state, sideKey);
  const cardId = side.hand[handIndex];
  const card = CARD_BY_ID[cardId];
  const active = getActiveCreature(state, sideKey);
  const opponentSideKey = getOpponentSideKey(sideKey);
  const target = getActiveCreature(state, opponentSideKey);
  const cost = getCardPlayCost(state, sideKey, card);

  side.energy -= cost;
  side.hand.splice(handIndex, 1);
  side.discardPile.push(cardId);

  addLog(state, `${active.name} uses ${card.name}.`);

  if (card.category === "attack") {
    const damage = buildAttackDamage(state, sideKey, card);
    const targetIndex = getSide(state, opponentSideKey).activeIndex;
    applyDamage(state, sideKey, opponentSideKey, targetIndex, damage, {
      fromAttack: true,
      attacker: active,
      defender: target,
    });
    side.attackUsed = true;
    active.status.stun = 0;

    if (!state.winner) {
      card.effects.forEach((effect) => resolveEffect(state, sideKey, effect, options));
    }

    if (!state.winner && active.passive?.kind === "attack-grants-guard") {
      active.status.guard += active.passive.amount;
      addLog(state, `${active.name} gathers ${active.passive.amount} guard after striking.`);
    }
    return true;
  }

  if (card.category === "switch") {
    card.effects.forEach((effect) => resolveEffect(state, sideKey, effect, options));
    return true;
  }

  card.effects.forEach((effect) => resolveEffect(state, sideKey, effect, options));
  return true;
}

export function chooseReplacement(state, sideKey, nextIndex, options = {}) {
  const side = getSide(state, sideKey);
  const nextCreature = side.squad[nextIndex];
  if (!nextCreature || nextCreature.knockedOut || side.activeIndex === nextIndex) {
    return false;
  }

  side.activeIndex = nextIndex;
  if (sideKey === "player") {
    state.pendingPlayerSwitch = false;
  }
  addLog(
    state,
    `${nextCreature.name} ${options.reason || "steps forward to continue the duel"}.`
  );
  triggerEnterActivePassive(state, sideKey, options.reason || "steps in");

  if (sideKey === "player" && state.resumeTurnAfterSwitch) {
    const pendingTurn = state.resumeTurnAfterSwitch;
    state.resumeTurnAfterSwitch = null;
    startTurn(state, pendingTurn);
  }

  return true;
}

export function endTurn(state) {
  if (state.winner) {
    return;
  }

  const endingSideKey = state.turn;
  const endingSide = getSide(state, endingSideKey);
  endingSide.squad.forEach((creature, index) => {
    if (!creature.knockedOut && creature.status.burn) {
      creature.hp = Math.max(0, creature.hp - BURN_DAMAGE);
      addLog(state, `${creature.name} burns for ${BURN_DAMAGE} damage.`);
      if (creature.hp <= 0) {
        handleKnockout(state, endingSideKey, index);
      }
    }
  });

  endingSide.squad.forEach((creature, index) => {
    if (
      !creature.knockedOut &&
      index !== endingSide.activeIndex &&
      creature.passive?.kind === "bench-heal"
    ) {
      const healed = healCreature(creature, creature.passive.amount);
      if (healed > 0) {
        addLog(state, `${creature.name} stitches itself back together for ${healed}.`);
      }
    }
  });

  if (state.winner) {
    return;
  }

  const nextTurn = getOpponentSideKey(endingSideKey);
  if (state.pendingPlayerSwitch) {
    state.resumeTurnAfterSwitch = nextTurn;
    return;
  }

  startTurn(state, nextTurn);
}

function evaluateAttackPriority(state, sideKey, handIndex, card) {
  const defender = getActiveCreature(state, getOpponentSideKey(sideKey));
  const damage = buildAttackDamage(state, sideKey, card);
  const multiplier = getTypeMultiplier(card.typeRequirement, defender.type);
  let score = 100 + damage;

  if (damage >= defender.hp) {
    score += 1000;
  }
  if (multiplier > 1) {
    score += 250;
  }
  if (card.effects.some((effect) => effect.kind === "apply-status" && effect.status === "stun")) {
    score += 45;
  }
  if (card.effects.some((effect) => effect.kind === "apply-status" && effect.status === "burn")) {
    score += 35;
  }

  return { kind: "play-card", handIndex, score };
}

function evaluateSupportPriority(state, sideKey, handIndex, card) {
  const active = getActiveCreature(state, sideKey);
  const opponent = getActiveCreature(state, getOpponentSideKey(sideKey));
  let score = 0;

  if (card.effects.some((effect) => effect.kind === "heal")) {
    const missingHp = active.maxHp - active.hp;
    score += Math.min(missingHp, 40);
  }
  if (card.effects.some((effect) => effect.kind === "guard")) {
    score += active.hp <= Math.ceil(active.maxHp * 0.55) ? 55 : 18;
    if (getTypeMultiplier(opponent.type, active.type) > 1) {
      score += 25;
    }
  }
  if (
    card.effects.some((effect) => effect.kind === "cleanse") &&
    (active.status.burn || active.status.stun)
  ) {
    score += 70;
  }
  if (card.effects.some((effect) => effect.kind === "draw")) {
    score += state[sideKey].hand.length <= 3 ? 32 : 12;
  }

  return score > 0 ? { kind: "play-card", handIndex, score } : null;
}

function evaluateSwitchPriority(state, sideKey, handIndex) {
  const active = getActiveCreature(state, sideKey);
  const opponent = getActiveCreature(state, getOpponentSideKey(sideKey));
  const currentMatchup = getTypeMultiplier(active.type, opponent.type);
  const benchIndex = chooseBestBenchIndex(state, sideKey);
  if (benchIndex < 0) {
    return null;
  }
  const candidate = getSide(state, sideKey).squad[benchIndex];
  const nextMatchup = getTypeMultiplier(candidate.type, opponent.type);

  if (currentMatchup >= nextMatchup && active.hp > Math.ceil(active.maxHp * 0.45)) {
    return null;
  }

  const score = 90 + candidate.hp + candidate.speed;
  return { kind: "play-card", handIndex, score, benchIndex };
}

export function chooseAiAction(state, sideKey = "enemy") {
  if (state.winner) {
    return null;
  }

  if (sideKey === "player" && state.pendingPlayerSwitch) {
    return null;
  }

  const side = getSide(state, sideKey);
  if (state.turn !== sideKey) {
    return null;
  }

  if (sideKey === "enemy" && getActiveCreature(state, sideKey)?.knockedOut) {
    const replacement = chooseBestBenchIndex(state, sideKey);
    return replacement >= 0 ? { kind: "replace", benchIndex: replacement } : null;
  }

  const priorities = [];

  side.hand.forEach((cardId, handIndex) => {
    const card = CARD_BY_ID[cardId];
    if (!card) {
      return;
    }
    if (!canPlayCard(state, sideKey, handIndex, { benchIndex: chooseBestBenchIndex(state, sideKey) })) {
      return;
    }

    if (card.category === "attack") {
      priorities.push(evaluateAttackPriority(state, sideKey, handIndex, card));
      return;
    }

    if (card.category === "support" || card.category === "item") {
      const result = evaluateSupportPriority(state, sideKey, handIndex, card);
      if (result) {
        priorities.push(result);
      }
      return;
    }

    if (card.category === "switch") {
      const result = evaluateSwitchPriority(state, sideKey, handIndex, card);
      if (result) {
        priorities.push(result);
      }
    }
  });

  priorities.sort((left, right) => right.score - left.score || left.handIndex - right.handIndex);
  return priorities[0] || null;
}

export function createBattle(playerLoadout, enemyTrainerId) {
  const enemyTrainer = ENEMY_TRAINER_BY_ID[enemyTrainerId];
  const state = {
    enemyTrainerId,
    enemyTrainerName: enemyTrainer.name,
    enemyTitle: enemyTrainer.title,
    log: [],
    winner: null,
    turn: "player",
    pendingPlayerSwitch: false,
    resumeTurnAfterSwitch: null,
    player: createSide("player", "You", playerLoadout.squadIds, playerLoadout.deckCounts),
    enemy: createSide("enemy", enemyTrainer.name, enemyTrainer.squadIds, enemyTrainer.deckCounts),
  };

  drawCards(state, "player", 5, "draws an opening hand of");
  drawCards(state, "enemy", 5, "draws an opening hand of");
  triggerEnterActivePassive(state, "player", "takes point");
  triggerEnterActivePassive(state, "enemy", "takes point");
  startTurn(state, "player", { skipDraw: true });

  return state;
}
