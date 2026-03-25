import {
  ASSET_PATHS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DISTRICTS,
  META_UPGRADES,
  RELICS,
  ROOM_BOUNDS,
  ROOM_TEMPLATES,
  RITES,
  RUN_STRUCTURE,
  VESSELS,
  WEAPONS,
} from "./data.js";

const META_KEY = "ashen-reliquary-meta-v1";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angleBetween = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const normalize = (x, y) => {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
};
const capitalise = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const loadTree = async (tree) => {
  if (typeof tree === "string") {
    return loadImage(tree);
  }

  if (Array.isArray(tree)) {
    return Promise.all(tree.map(loadTree));
  }

  const loaded = {};
  for (const [key, value] of Object.entries(tree)) {
    loaded[key] = await loadTree(value);
  }
  return loaded;
};

const collectUi = () => ({
  canvas: document.getElementById("gameCanvas"),
  banner: document.getElementById("banner"),
  menuOverlay: document.getElementById("menuOverlay"),
  rewardOverlay: document.getElementById("rewardOverlay"),
  sanctuaryOverlay: document.getElementById("sanctuaryOverlay"),
  summaryOverlay: document.getElementById("summaryOverlay"),
  rewardChoices: document.getElementById("rewardChoices"),
  sanctuaryChoices: document.getElementById("sanctuaryChoices"),
  metaUpgradeGrid: document.getElementById("metaUpgradeGrid"),
  startRunButton: document.getElementById("startRunButton"),
  restartButton: document.getElementById("restartButton"),
  metaAshValue: document.getElementById("metaAshValue"),
  activeVesselName: document.getElementById("activeVesselName"),
  districtName: document.getElementById("districtName"),
  roomCounter: document.getElementById("roomCounter"),
  roomType: document.getElementById("roomType"),
  roomModifier: document.getElementById("roomModifier"),
  hpFill: document.getElementById("hpFill"),
  resolveFill: document.getElementById("resolveFill"),
  heatFill: document.getElementById("heatFill"),
  hpLabel: document.getElementById("hpLabel"),
  resolveLabel: document.getElementById("resolveLabel"),
  heatLabel: document.getElementById("heatLabel"),
  weaponName: document.getElementById("weaponName"),
  riteName: document.getElementById("riteName"),
  coinCount: document.getElementById("coinCount"),
  keyCount: document.getElementById("keyCount"),
  runAshCount: document.getElementById("runAshCount"),
  relicList: document.getElementById("relicList"),
  objectiveText: document.getElementById("objectiveText"),
  summaryKicker: document.getElementById("summaryKicker"),
  summaryTitle: document.getElementById("summaryTitle"),
  summaryText: document.getElementById("summaryText"),
  summaryRooms: document.getElementById("summaryRooms"),
  summaryBosses: document.getElementById("summaryBosses"),
  summaryAsh: document.getElementById("summaryAsh"),
  vesselButtons: Array.from(document.querySelectorAll("[data-vessel]")),
});

class AshenReliquary {
  constructor(ui, assets) {
    this.ui = ui;
    this.assets = assets;
    this.ctx = ui.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.floorPattern = this.ctx.createPattern(this.assets.tileset, "repeat");

    this.state = "menu";
    this.selectedVessel = "warden";
    this.meta = this.loadMeta();
    this.run = null;
    this.room = null;
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.obstacles = [];
    this.traps = [];
    this.zones = [];
    this.effects = [];
    this.pointer = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, down: false };
    this.keys = new Set();
    this.bannerTimer = 0;
    this.bannerText = "";
    this.lastTime = 0;
    this.enemyId = 0;
    this.selectedRewards = [];

    this.bindUi();
    this.refreshMetaUi();
    this.showMenu();

    requestAnimationFrame((time) => this.loop(time));
  }

  bindUi() {
    this.ui.startRunButton.addEventListener("click", () => this.startRun());
    this.ui.restartButton.addEventListener("click", () => this.showMenu());

    this.ui.vesselButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.selectedVessel = button.dataset.vessel;
        this.ui.activeVesselName.textContent = VESSELS[this.selectedVessel].name;
        this.ui.vesselButtons.forEach((entry) => entry.classList.toggle("is-selected", entry === button));
      });
    });

    this.ui.metaUpgradeGrid.addEventListener("click", (event) => {
      const card = event.target.closest("[data-meta-upgrade]");
      if (!card) {
        return;
      }

      this.purchaseMetaUpgrade(card.dataset.metaUpgrade);
    });

    this.ui.rewardChoices.addEventListener("click", (event) => {
      const card = event.target.closest("[data-reward-id]");
      if (!card || this.state !== "reward") {
        return;
      }

      const reward = this.selectedRewards.find((entry) => entry.id === card.dataset.rewardId);
      if (reward) {
        this.applyReward(reward);
      }
    });

    this.ui.sanctuaryChoices.addEventListener("click", (event) => {
      const card = event.target.closest("[data-sanctuary-id]");
      if (!card || this.state !== "sanctuary") {
        return;
      }

      this.applySanctuaryChoice(card.dataset.sanctuaryId);
    });

    window.addEventListener("keydown", (event) => {
      if (["Space", "ShiftLeft", "ShiftRight", "KeyQ", "KeyE"].includes(event.code)) {
        event.preventDefault();
      }

      this.keys.add(event.code);

      if (this.state !== "playing" || event.repeat) {
        return;
      }

      if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
        this.tryDash();
      } else if (event.code === "KeyQ") {
        this.useRite();
      } else if (event.code === "KeyE") {
        this.tryConsecrate();
      } else if (event.code === "Space") {
        this.attackPrimary();
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });

    this.ui.canvas.addEventListener("mousemove", (event) => {
      const rect = this.ui.canvas.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
      this.pointer.y = ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    });

    this.ui.canvas.addEventListener("mousedown", (event) => {
      if (this.state !== "playing") {
        return;
      }

      if (event.button === 0) {
        this.pointer.down = true;
        this.attackPrimary();
      } else if (event.button === 2) {
        this.tryParry();
      }
    });

    this.ui.canvas.addEventListener("mouseup", (event) => {
      if (event.button === 0) {
        this.pointer.down = false;
      }
    });

    this.ui.canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    window.addEventListener("blur", () => {
      this.pointer.down = false;
      this.keys.clear();
    });
  }

  loadMeta() {
    try {
      const parsed = JSON.parse(localStorage.getItem(META_KEY));
      if (parsed && typeof parsed.ash === "number" && parsed.upgrades) {
        return parsed;
      }
    } catch (error) {
      console.warn("Failed to load meta progression", error);
    }

    return {
      ash: 0,
      upgrades: {
        calve: 0,
        nhal: 0,
        rusk: 0,
      },
    };
  }

  saveMeta() {
    localStorage.setItem(META_KEY, JSON.stringify(this.meta));
  }

  getUpgradeCost(upgradeId) {
    const definition = META_UPGRADES.find((entry) => entry.id === upgradeId);
    const rank = this.meta.upgrades[upgradeId] || 0;
    return definition.costBase + rank * definition.costStep;
  }

  purchaseMetaUpgrade(upgradeId) {
    const definition = META_UPGRADES.find((entry) => entry.id === upgradeId);
    const rank = this.meta.upgrades[upgradeId] || 0;
    const cost = this.getUpgradeCost(upgradeId);

    if (rank >= definition.maxRank || this.meta.ash < cost) {
      return;
    }

    this.meta.ash -= cost;
    this.meta.upgrades[upgradeId] += 1;
    this.saveMeta();
    this.refreshMetaUi();
  }

  refreshMetaUi() {
    this.ui.metaAshValue.textContent = `${this.meta.ash}`;
    this.ui.activeVesselName.textContent = VESSELS[this.selectedVessel].name;
    this.ui.metaUpgradeGrid.innerHTML = "";

    META_UPGRADES.forEach((upgrade) => {
      const rank = this.meta.upgrades[upgrade.id] || 0;
      const cost = this.getUpgradeCost(upgrade.id);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "meta-card";
      card.dataset.metaUpgrade = upgrade.id;
      card.disabled = rank >= upgrade.maxRank || this.meta.ash < cost;

      const icon = document.createElement("img");
      icon.src = ASSET_PATHS.priests[upgrade.sprite];
      icon.alt = upgrade.name;

      const title = document.createElement("strong");
      title.textContent = upgrade.name;

      const desc = document.createElement("span");
      desc.textContent = `${upgrade.label} rank ${rank}/${upgrade.maxRank}`;

      const costLabel = document.createElement("small");
      costLabel.textContent = rank >= upgrade.maxRank ? "Maxed" : `Spend ${cost} Ash`;

      card.append(icon, title, desc, costLabel);
      this.ui.metaUpgradeGrid.appendChild(card);
    });
  }

  showMenu() {
    this.state = "menu";
    this.run = null;
    this.room = null;
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.traps = [];
    this.obstacles = [];
    this.zones = [];
    this.effects = [];
    this.refreshMetaUi();
    this.hideAllOverlays();
    this.ui.menuOverlay.classList.remove("hidden");
  }

  hideAllOverlays() {
    this.ui.menuOverlay.classList.add("hidden");
    this.ui.rewardOverlay.classList.add("hidden");
    this.ui.sanctuaryOverlay.classList.add("hidden");
    this.ui.summaryOverlay.classList.add("hidden");
  }

  startRun() {
    this.hideAllOverlays();
    this.run = {
      roomsCleared: 0,
      bossesCleared: 0,
      roomIndex: 0,
      ashEarned: 0,
      score: 0,
      descriptors: RUN_STRUCTURE.map((entry, index) => ({
        ...entry,
        index,
        modifier: pick(DISTRICTS[entry.district].modifiers),
      })),
    };

    this.player = this.createPlayer(this.selectedVessel);
    this.state = "playing";
    this.spawnRoom(0);
    this.showBanner(`${DISTRICTS[0].name}`, 2.2);
    this.syncHud();
  }

  createPlayer(vesselId) {
    const vessel = VESSELS[vesselId];
    const healthBonus = this.meta.upgrades.calve || 0;
    const resolveBonus = (this.meta.upgrades.nhal || 0) * 10;
    const heatBonus = (this.meta.upgrades.rusk || 0) * 10;
    const maxHeat = vessel.maxHeat + heatBonus + (vesselId === "warden" ? 15 : 0);

    return {
      vesselId,
      name: vessel.name,
      sprite: vessel.sprite,
      x: ROOM_BOUNDS.x + 72,
      y: ROOM_BOUNDS.y + ROOM_BOUNDS.h / 2,
      radius: 16,
      speed: vessel.speed,
      weaponId: vessel.weapon,
      riteId: vessel.rite,
      hp: vessel.maxHp + healthBonus,
      maxHp: vessel.maxHp + healthBonus,
      resolve: vessel.maxResolve + resolveBonus,
      maxResolve: vessel.maxResolve + resolveBonus,
      heat: 0,
      maxHeat,
      coins: 0,
      keys: 0,
      ash: 0,
      relics: [],
      damageBonus: 0,
      burnMultiplier: 1,
      trapBonus: 1,
      cooldownBonus: 0,
      dashBoost: vesselId === "courier" ? 1.2 : 1,
      attackCooldown: 0,
      dashCooldown: 0,
      dashTimer: 0,
      dashVx: 0,
      dashVy: 0,
      invulnerable: 0,
      parryTimer: 0,
      burnout: 0,
      facing: { x: 1, y: 0 },
      swing: null,
      markStacks: 0,
      killCounter: 0,
      pendingDamageFlash: 0,
    };
  }

  spawnRoom(index) {
    const descriptor = this.run.descriptors[index];
    const district = DISTRICTS[descriptor.district];
    const roomSet = descriptor.bossId ? ROOM_TEMPLATES.bosses[descriptor.bossId] : pick(ROOM_TEMPLATES[district.id]);

    this.room = {
      ...descriptor,
      districtName: district.name,
      accent: district.accent,
      templateId: roomSet.id,
      roomClear: false,
      exitReady: false,
      treasury: descriptor.tag === "treasury",
      trapRate: descriptor.tag === "hazard" ? district.trapScale * 1.15 : district.trapScale,
      enemyScale: descriptor.tag === "elite" ? district.enemyScale * 1.18 : district.enemyScale,
      reversalTimer: descriptor.district === 2 ? 7 : 999,
      modifierText: descriptor.modifier,
      bossId: descriptor.bossId || null,
    };

    this.player.x = ROOM_BOUNDS.x + 72;
    this.player.y = ROOM_BOUNDS.y + ROOM_BOUNDS.h / 2;
    this.player.swing = null;
    this.player.parryTimer = 0;
    this.projectiles = [];
    this.pickups = [];
    this.zones = [];
    this.effects = [];
    this.obstacles = roomSet.obstacles.map((entry) => this.createObstacle(entry));
    this.traps = roomSet.traps.map((entry) => this.createTrap(entry, descriptor));
    this.enemies = this.createRoomEnemies(roomSet.spawns, descriptor);

    this.ui.objectiveText.textContent = descriptor.bossId
      ? `Defeat ${capitalise(descriptor.bossId)} and survive the room's hazards.`
      : "Defeat every enemy in the room. Use E to consecrate a trap or light source and turn the room against them.";

    this.syncHud();
  }

  createObstacle(entry) {
    const durable = entry.kind === "box2";
    return {
      x: entry.x,
      y: entry.y,
      w: 32,
      h: 32,
      kind: entry.kind,
      hp: durable ? 42 : 28,
      maxHp: durable ? 42 : 28,
    };
  }

  createTrap(entry, descriptor) {
    let defaultState = "neutral";
    if (descriptor.tag === "hazard" && (entry.kind === "arrow" || entry.kind === "flame" || entry.kind === "spikes")) {
      defaultState = "enemy";
    }
    if (descriptor.bossId === "warden" && entry.kind === "arrow") {
      defaultState = "enemy";
    }
    if (descriptor.bossId === "prior" && (entry.kind === "flame" || entry.kind === "sideTorch")) {
      defaultState = "enemy";
    }

    return {
      ...entry,
      state: defaultState,
      defaultState,
      timer: rand(0, 1.4),
      pulse: 0,
      consecrated: 0,
      reversed: 0,
      hitTimer: 0,
    };
  }

  createRoomEnemies(spawnPoints, descriptor) {
    if (descriptor.bossId === "warden") {
      return [this.createEnemy("wardenBoss", spawnPoints[0].x, spawnPoints[0].y)];
    }
    if (descriptor.bossId === "choir") {
      return spawnPoints.map((point, index) => this.createEnemy("choirSkull", point.x, point.y, { elite: true, choirIndex: index }));
    }
    if (descriptor.bossId === "prior") {
      return [this.createEnemy("priorBoss", spawnPoints[0].x, spawnPoints[0].y)];
    }

    const enemies = [];
    const pool = [];
    if (descriptor.district === 0) {
      pool.push("skeleton1", "skeleton1", "skeleton2", "skull");
    } else if (descriptor.district === 1) {
      pool.push("skeleton1", "skeleton2", "skull", "skeleton2", "skull");
    } else {
      pool.push("skeleton2", "skull", "vampire", "vampire", "skeleton1");
    }

    let count = descriptor.tag === "elite" ? 4 : descriptor.tag === "treasury" ? 3 : descriptor.tag === "hazard" ? 5 : 4;
    if (descriptor.district === 2) {
      count += 1;
    }

    for (let index = 0; index < count; index += 1) {
      const type = descriptor.tag === "elite" && index === 0
        ? descriptor.district === 2
          ? "vampire"
          : "skeleton2"
        : pick(pool);
      const point = spawnPoints[index % spawnPoints.length];
      enemies.push(
        this.createEnemy(type, point.x + rand(-18, 18), point.y + rand(-18, 18), {
          elite: descriptor.tag === "elite" && index === 0,
          treasuryGuard: descriptor.tag === "treasury",
        })
      );
    }

    return enemies;
  }

  createEnemy(type, x, y, options = {}) {
    const elite = Boolean(options.elite);
    const scale = (this.room?.enemyScale || 1) * (elite ? 1.35 : 1);
    const base = {
      id: ++this.enemyId,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      attackCooldown: rand(0.4, 1.1),
      windup: 0,
      stunned: 0,
      invulnerable: 0,
      burn: 0,
      fracture: 0,
      mark: 0,
      phase: 0,
      summonedFlags: {},
      elite,
      choirIndex: options.choirIndex ?? 0,
      home: { x, y },
      facing: { x: -1, y: 0 },
      floatOffset: rand(0, Math.PI * 2),
      projectileCooldown: rand(1, 1.8),
    };

    if (type === "skeleton1") {
      return { ...base, name: elite ? "Rattlebone Veteran" : "Rattlebone", hp: 42 * scale, maxHp: 42 * scale, damage: 1, speed: 84 * scale, radius: 15 };
    }
    if (type === "skeleton2") {
      return { ...base, name: elite ? "Bone Captain" : "Ossuary Warder", hp: 76 * scale, maxHp: 76 * scale, damage: 1, speed: 66 * scale, radius: 17, shielded: true };
    }
    if (type === "skull" || type === "choirSkull") {
      return { ...base, name: elite ? "Bellringer Skull" : "Reliquary Skull", hp: (type === "choirSkull" ? 90 : 34) * scale, maxHp: (type === "choirSkull" ? 90 : 34) * scale, damage: 1, speed: 40, radius: 15 };
    }
    if (type === "vampire") {
      return { ...base, name: elite ? "Blood Acolyte" : "Crimson Kin", hp: 68 * scale, maxHp: 68 * scale, damage: 1, speed: 98 * scale, radius: 16, blinkCooldown: rand(1.8, 2.8) };
    }
    if (type === "wardenBoss") {
      return { ...base, name: "Warden of the Gate", hp: 310, maxHp: 310, damage: 1, speed: 72, radius: 22, boss: true, chargeTimer: 0, arrowBurstCooldown: 3.4 };
    }
    if (type === "priorBoss") {
      return { ...base, name: "The Crimson Prior", hp: 340, maxHp: 340, damage: 1, speed: 112, radius: 20, boss: true, blinkCooldown: 1.6, reversalCooldown: 5.5 };
    }

    return base;
  }

  showBanner(text, duration = 2) {
    this.bannerText = text;
    this.bannerTimer = duration;
    this.ui.banner.textContent = text;
    this.ui.banner.classList.remove("hidden");
  }

  clearBanner() {
    this.bannerTimer = 0;
    this.ui.banner.classList.add("hidden");
  }

  openRewardSelection() {
    this.selectedRewards = this.generateRewardChoices();
    this.ui.rewardChoices.innerHTML = "";

    this.selectedRewards.forEach((reward) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "choice-card";
      card.dataset.rewardId = reward.id;

      const icon = document.createElement("img");
      icon.src = reward.icon;
      icon.alt = reward.title;
      const title = document.createElement("strong");
      title.textContent = reward.title;
      const desc = document.createElement("span");
      desc.textContent = reward.description;
      const kicker = document.createElement("small");
      kicker.textContent = reward.category;

      card.append(icon, title, desc, kicker);
      this.ui.rewardChoices.appendChild(card);
    });

    this.state = "reward";
    this.ui.rewardOverlay.classList.remove("hidden");
  }

  openSanctuary() {
    this.state = "sanctuary";
    this.ui.sanctuaryChoices.innerHTML = "";
    const choices = [
      {
        id: "calve",
        title: "Sister Calve",
        description: "Restore 2 Health and gain +1 max Health for the next district.",
        icon: ASSET_PATHS.priests.calve,
      },
      {
        id: "nhal",
        title: "Archivist Nhal",
        description: "Gain +20 Resolve, +1 key, and 12 Ash for this run.",
        icon: ASSET_PATHS.priests.nhal,
      },
      {
        id: "rusk",
        title: "Father Rusk",
        description: "Upgrade your weapon damage by 6 and switch to a new rite if available.",
        icon: ASSET_PATHS.priests.rusk,
      },
    ];

    choices.forEach((choice) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "choice-card";
      card.dataset.sanctuaryId = choice.id;

      const icon = document.createElement("img");
      icon.src = choice.icon;
      icon.alt = choice.title;
      const title = document.createElement("strong");
      title.textContent = choice.title;
      const desc = document.createElement("span");
      desc.textContent = choice.description;

      card.append(icon, title, desc);
      this.ui.sanctuaryChoices.appendChild(card);
    });

    this.ui.sanctuaryOverlay.classList.remove("hidden");
  }

  generateRewardChoices() {
    const relicChoices = RELICS.filter((entry) => !this.player.relics.includes(entry.id));
    const pool = [
      {
        id: "hp-boon",
        title: "Amber Recovery",
        description: "Gain +1 max Health and restore 1 Health immediately.",
        icon: ASSET_PATHS.props.flasks[0],
        category: "Vitality",
      },
      {
        id: "resolve-boon",
        title: "Grey Discipline",
        description: "Gain +20 max Resolve and refill 30 Resolve instantly.",
        icon: ASSET_PATHS.props.flasks[1],
        category: "Resolve",
      },
      {
        id: "heat-boon",
        title: "Brass Draft",
        description: "Gain +15 max Heat and cool down slightly faster.",
        icon: ASSET_PATHS.props.key[0],
        category: "Heat",
      },
      {
        id: "coins",
        title: "Tithe Cache",
        description: "Gain 20 coins and 1 key.",
        icon: ASSET_PATHS.props.coin[0],
        category: "Economy",
      },
      {
        id: "weapon-chainFlail",
        title: "Chain Flail",
        description: "Swap your primary weapon for the Chain Flail.",
        icon: ASSET_PATHS.props.box2[0],
        category: "Weapon",
      },
      {
        id: "weapon-censerLash",
        title: "Censer Lash",
        description: "Swap your primary weapon for the Censer Lash.",
        icon: ASSET_PATHS.props.box1[0],
        category: "Weapon",
      },
      {
        id: "weapon-crossbow",
        title: "Hand Crossbow",
        description: "Swap your primary weapon for the Hand Crossbow.",
        icon: ASSET_PATHS.props.arrow[0],
        category: "Weapon",
      },
      {
        id: "rite-lanternBurst",
        title: "Lantern Burst",
        description: "Equip Lantern Burst in your rite slot.",
        icon: ASSET_PATHS.props.torch[0],
        category: "Rite",
      },
      {
        id: "rite-chainPull",
        title: "Chain Pull",
        description: "Equip Chain Pull in your rite slot.",
        icon: ASSET_PATHS.props.key[1],
        category: "Rite",
      },
      {
        id: "rite-wardCircle",
        title: "Ward Circle",
        description: "Equip Ward Circle in your rite slot.",
        icon: ASSET_PATHS.props.candlestick[0],
        category: "Rite",
      },
    ];

    if (relicChoices.length > 0) {
      const relic = pick(relicChoices);
      pool.push({
        id: `relic-${relic.id}`,
        title: relic.name,
        description: relic.description,
        icon: ASSET_PATHS.props.chest[0],
        category: "Relic",
      });
    }

    const picks = [];
    while (picks.length < 3 && pool.length > 0) {
      const choice = pick(pool);
      pool.splice(pool.indexOf(choice), 1);
      picks.push(choice);
    }
    return picks;
  }

  applyReward(reward) {
    this.ui.rewardOverlay.classList.add("hidden");
    this.state = "playing";

    if (reward.id === "hp-boon") {
      this.player.maxHp += 1;
      this.player.hp = clamp(this.player.hp + 1, 0, this.player.maxHp);
    } else if (reward.id === "resolve-boon") {
      this.player.maxResolve += 20;
      this.player.resolve = clamp(this.player.resolve + 30, 0, this.player.maxResolve);
    } else if (reward.id === "heat-boon") {
      this.player.maxHeat += 15;
      this.player.cooldownBonus += 0.1;
    } else if (reward.id === "coins") {
      this.player.coins += 20;
      this.player.keys += 1;
    } else if (reward.id.startsWith("weapon-")) {
      this.player.weaponId = reward.id.replace("weapon-", "");
    } else if (reward.id.startsWith("rite-")) {
      this.player.riteId = reward.id.replace("rite-", "");
    } else if (reward.id.startsWith("relic-")) {
      const relicId = reward.id.replace("relic-", "");
      if (!this.player.relics.includes(relicId)) {
        this.player.relics.push(relicId);
        this.applyRelic(relicId);
      }
    }

    this.syncHud();
    this.advanceRun();
  }

  applySanctuaryChoice(choiceId) {
    this.ui.sanctuaryOverlay.classList.add("hidden");
    this.state = "playing";

    if (choiceId === "calve") {
      this.player.maxHp += 1;
      this.player.hp = clamp(this.player.hp + 2, 0, this.player.maxHp);
    } else if (choiceId === "nhal") {
      this.player.maxResolve += 20;
      this.player.resolve = clamp(this.player.resolve + 20, 0, this.player.maxResolve);
      this.player.keys += 1;
      this.player.ash += 12;
      this.run.ashEarned += 12;
    } else if (choiceId === "rusk") {
      this.player.damageBonus += 6;
      const riteIds = Object.keys(RITES).filter((entry) => entry !== this.player.riteId);
      this.player.riteId = pick(riteIds);
    }

    this.syncHud();
    this.advanceRun();
  }

  applyRelic(relicId) {
    if (relicId === "furnaceLink") {
      this.player.burnMultiplier += 0.4;
    } else if (relicId === "graveHook") {
      this.player.trapBonus += 0.3;
    } else if (relicId === "brassLung") {
      this.player.maxHeat += 20;
    } else if (relicId === "ossuaryRounds") {
      this.player.pierceShots = 1;
    } else if (relicId === "cinderTax") {
      this.player.ash += 10;
      this.run.ashEarned += 10;
      this.player.coins += 12;
    }
  }

  advanceRun() {
    this.run.roomIndex += 1;
    if (this.run.roomIndex >= this.run.descriptors.length) {
      this.finishRun(true);
      return;
    }

    this.spawnRoom(this.run.roomIndex);
  }

  finishRun(victory) {
    const payout = this.run.ashEarned + (victory ? 15 : 0);
    this.meta.ash += payout;
    this.saveMeta();
    this.refreshMetaUi();
    this.state = victory ? "victory" : "gameover";

    this.ui.summaryKicker.textContent = victory ? "Reliquary Purged" : "Run Lost";
    this.ui.summaryTitle.textContent = victory ? "The Crimson Prior Falls" : "The Reliquary Claims Another";
    this.ui.summaryText.textContent = victory
      ? "You conquered all three districts and banked a victory bonus into the Ash Vault."
      : "The run ends here, but every cleared room still feeds the priory's long war.";
    this.ui.summaryRooms.textContent = `${this.run.roomsCleared}`;
    this.ui.summaryBosses.textContent = `${this.run.bossesCleared}`;
    this.ui.summaryAsh.textContent = `${payout}`;

    this.hideAllOverlays();
    this.ui.summaryOverlay.classList.remove("hidden");
  }

  syncHud() {
    if (!this.player || !this.run || !this.room) {
      return;
    }

    this.ui.districtName.textContent = this.room.districtName;
    this.ui.roomCounter.textContent = `${this.run.roomIndex + 1} / ${this.run.descriptors.length}`;
    this.ui.roomType.textContent = capitalise(this.room.tag);
    this.ui.roomModifier.textContent = this.room.modifierText;
    this.ui.hpFill.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
    this.ui.resolveFill.style.width = `${(this.player.resolve / this.player.maxResolve) * 100}%`;
    this.ui.heatFill.style.width = `${(this.player.heat / this.player.maxHeat) * 100}%`;
    this.ui.hpLabel.textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
    this.ui.resolveLabel.textContent = `${Math.ceil(this.player.resolve)} / ${this.player.maxResolve}`;
    this.ui.heatLabel.textContent = `${Math.ceil(this.player.heat)} / ${this.player.maxHeat}`;
    this.ui.weaponName.textContent = WEAPONS[this.player.weaponId].name;
    this.ui.riteName.textContent = RITES[this.player.riteId].name;
    this.ui.coinCount.textContent = `${this.player.coins}`;
    this.ui.keyCount.textContent = `${this.player.keys}`;
    this.ui.runAshCount.textContent = `${this.player.ash}`;
    this.ui.relicList.innerHTML = "";

    if (this.player.relics.length === 0) {
      const empty = document.createElement("li");
      empty.textContent = "No relics yet. Clear rooms to build your run.";
      this.ui.relicList.appendChild(empty);
    } else {
      this.player.relics.forEach((relicId) => {
        const relic = RELICS.find((entry) => entry.id === relicId);
        const li = document.createElement("li");
        li.textContent = `${relic.name}: ${relic.description}`;
        this.ui.relicList.appendChild(li);
      });
    }
  }

  getMovementVector() {
    let x = 0;
    let y = 0;

    if (this.keys.has("KeyA")) x -= 1;
    if (this.keys.has("KeyD")) x += 1;
    if (this.keys.has("KeyW")) y -= 1;
    if (this.keys.has("KeyS")) y += 1;

    if (x === 0 && y === 0) {
      return { x: 0, y: 0 };
    }

    return normalize(x, y);
  }

  attackPrimary() {
    if (this.state !== "playing" || !this.player || this.player.attackCooldown > 0 || this.player.burnout > 0) {
      return;
    }

    const weapon = WEAPONS[this.player.weaponId];
    const aim = normalize(this.pointer.x - this.player.x, this.pointer.y - this.player.y);
    this.player.facing = aim;
    this.player.attackCooldown = Math.max(0.12, weapon.cooldown - this.player.cooldownBonus * 0.05);
    this.player.heat = clamp(this.player.heat + weapon.heatGain, 0, this.player.maxHeat + 20);

    if (this.player.heat >= this.player.maxHeat) {
      this.player.burnout = 3.5;
      this.showBanner("Burnout", 1.1);
    }

    if (weapon.type === "ranged") {
      this.spawnProjectile({
        team: "player",
        x: this.player.x + aim.x * 20,
        y: this.player.y + aim.y * 20,
        vx: aim.x * weapon.projectileSpeed,
        vy: aim.y * weapon.projectileSpeed,
        damage: weapon.damage + this.player.damageBonus * 0.65,
        radius: 6,
        burn: weapon.id === "handCrossbow" ? 0.6 : 0,
        pierce: this.player.pierceShots || 0,
      });
    } else {
      this.player.swing = {
        timer: 0.16,
        angle: Math.atan2(aim.y, aim.x),
        hit: false,
        weaponId: weapon.id,
      };
    }
  }

  tryDash() {
    if (this.state !== "playing" || !this.player || this.player.dashCooldown > 0 || this.player.resolve < 25) {
      return;
    }

    const move = this.getMovementVector();
    const direction = move.x !== 0 || move.y !== 0 ? move : this.player.facing;
    this.player.resolve -= 25;
    this.player.dashCooldown = 0.45;
    this.player.dashTimer = 0.18;
    this.player.invulnerable = 0.18;
    this.player.dashVx = direction.x * 440 * this.player.dashBoost;
    this.player.dashVy = direction.y * 440 * this.player.dashBoost;
  }

  tryParry() {
    if (this.state !== "playing" || !this.player || this.player.resolve < 20) {
      return;
    }

    this.player.resolve -= 20;
    this.player.parryTimer = 0.18;
    this.showBanner("Parry", 0.45);
  }

  nearestTrap() {
    if (!this.player) {
      return null;
    }

    let best = null;
    let bestDistance = 9999;

    this.traps.forEach((trap) => {
      const d = distance(this.player, trap);
      if (d < 92 && d < bestDistance) {
        best = trap;
        bestDistance = d;
      }
    });

    return best;
  }

  tryConsecrate() {
    if (this.state !== "playing" || !this.player || this.player.burnout > 0 || this.player.heat < 20) {
      return;
    }

    const trap = this.nearestTrap();
    if (!trap) {
      this.showBanner("No consecratable fixture nearby", 0.9);
      return;
    }

    this.player.heat -= 20;
    trap.state = "ally";
    trap.consecrated = 9;
    trap.reversed = 0;
    this.showBanner(`${capitalise(trap.kind)} Consecrated`, 0.9);
  }

  useRite() {
    if (this.state !== "playing" || !this.player || this.player.burnout > 0) {
      return;
    }

    const rite = RITES[this.player.riteId];
    if (this.player.heat < rite.heatCost) {
      this.showBanner("Not enough Heat", 0.7);
      return;
    }

    this.player.heat -= rite.heatCost;

    if (rite.id === "wardCircle") {
      this.zones.push({
        kind: "ward",
        x: this.player.x,
        y: this.player.y,
        radius: 84,
        timer: 3.4,
        pulse: 0,
      });
      this.showBanner("Ward Circle", 0.8);
    } else if (rite.id === "chainPull") {
      const candidates = this.enemies
        .filter((enemy) => !enemy.dead)
        .sort((a, b) => distance(this.player, a) - distance(this.player, b));
      const target = candidates[0];
      if (target && distance(this.player, target) < 260) {
        const nearestTrap = this.traps
          .filter((trap) => trap.state === "ally")
          .sort((a, b) => distance(target, a) - distance(target, b))[0];
        const destination = nearestTrap || this.player;
        const dir = normalize(destination.x - target.x, destination.y - target.y);
        target.vx += dir.x * 260;
        target.vy += dir.y * 260;
        target.fracture = Math.max(target.fracture, 2.8);
        target.stunned = Math.max(target.stunned, 0.45);
        this.showBanner("Chain Pull", 0.7);
      }
    } else if (rite.id === "lanternBurst") {
      this.zones.push({
        kind: "burst",
        x: this.player.x,
        y: this.player.y,
        radius: 96,
        timer: 0.35,
        pulse: 0,
      });
      this.enemies.forEach((enemy) => {
        if (!enemy.dead && distance(this.player, enemy) < 96) {
          this.damageEnemy(enemy, 20 + this.player.damageBonus * 0.7, "burst", { burn: 2.4 });
        }
      });
      this.showBanner("Lantern Burst", 0.7);
    }
  }

  spawnProjectile(config) {
    this.projectiles.push({
      x: config.x,
      y: config.y,
      vx: config.vx,
      vy: config.vy,
      team: config.team,
      damage: config.damage,
      radius: config.radius || 6,
      life: config.life || 2.2,
      burn: config.burn || 0,
      pierce: config.pierce || 0,
    });
  }

  damageEnemy(enemy, amount, source, extra = {}) {
    if (enemy.dead || enemy.invulnerable > 0) {
      return;
    }

    let damage = amount;
    if (enemy.fracture > 0 && source === "trap") {
      damage *= 1.25 + (this.player.trapBonus - 1);
    }

    if ((enemy.type === "skeleton2" || enemy.type === "wardenBoss") && enemy.shielded && enemy.stunned <= 0) {
      const toSource = normalize(enemy.x - this.player.x, enemy.y - this.player.y);
      const facingDot = toSource.x * enemy.facing.x + toSource.y * enemy.facing.y;
      if (facingDot < -0.15) {
        damage *= 0.4;
      }
    }

    enemy.hp -= damage;
    enemy.invulnerable = 0.06;
    if (extra.burn) {
      enemy.burn = Math.max(enemy.burn, extra.burn * this.player.burnMultiplier);
    }
    if (extra.fracture) {
      enemy.fracture = Math.max(enemy.fracture, extra.fracture);
    }
    if (extra.mark) {
      enemy.mark = Math.max(enemy.mark, extra.mark);
    }

    if (enemy.hp <= 0) {
      enemy.dead = true;
      const ashGain = enemy.boss ? 20 : enemy.elite ? 8 : 3;
      this.player.ash += ashGain;
      this.run.ashEarned += ashGain;
      this.dropLoot(enemy);
      if (enemy.boss) {
        this.run.bossesCleared += 1;
      }
    }
  }

  damagePlayer(amount, source = "enemy") {
    if (!this.player || this.player.invulnerable > 0) {
      return;
    }

    this.player.hp -= amount;
    this.player.resolve = Math.max(0, this.player.resolve - 15);
    this.player.invulnerable = 0.65;
    this.player.pendingDamageFlash = 0.18;

    if (source === "vampire") {
      this.player.markStacks = 2.8;
    }

    if (this.player.hp <= 0) {
      this.finishRun(false);
    }
  }

  dropLoot(enemy) {
    const drops = [{ type: "coin", amount: enemy.elite ? 5 : 3 }];
    if (enemy.elite || enemy.boss || Math.random() < 0.16) {
      drops.push({ type: "key", amount: 1 });
    }
    if (enemy.boss || Math.random() < 0.14) {
      drops.push({ type: "flask", amount: 1 });
    }

    drops.forEach((drop, index) => {
      this.pickups.push({
        type: drop.type,
        amount: drop.amount,
        x: enemy.x + rand(-12, 12),
        y: enemy.y + rand(-12, 12) + index * 4,
        vy: rand(-10, 10),
        vx: rand(-10, 10),
      });
    });
  }

  circleIntersectsRect(circle, rect) {
    const nearestX = clamp(circle.x, rect.x, rect.x + rect.w);
    const nearestY = clamp(circle.y, rect.y, rect.y + rect.h);
    const dx = circle.x - nearestX;
    const dy = circle.y - nearestY;
    return dx * dx + dy * dy < circle.radius * circle.radius;
  }

  resolveObstacleCollision(actor) {
    this.obstacles.forEach((obstacle) => {
      const closestX = clamp(actor.x, obstacle.x, obstacle.x + obstacle.w);
      const closestY = clamp(actor.y, obstacle.y, obstacle.y + obstacle.h);
      const dx = actor.x - closestX;
      const dy = actor.y - closestY;
      const distSq = dx * dx + dy * dy;
      if (distSq >= actor.radius * actor.radius || distSq === 0) {
        return;
      }

      const dist = Math.sqrt(distSq);
      const overlap = actor.radius - dist;
      actor.x += (dx / dist) * overlap;
      actor.y += (dy / dist) * overlap;
    });
  }

  moveActor(actor, dt) {
    actor.x += actor.vx * dt;
    actor.y += actor.vy * dt;
    actor.x = clamp(actor.x, ROOM_BOUNDS.x + actor.radius, ROOM_BOUNDS.x + ROOM_BOUNDS.w - actor.radius);
    actor.y = clamp(actor.y, ROOM_BOUNDS.y + actor.radius, ROOM_BOUNDS.y + ROOM_BOUNDS.h - actor.radius);
    this.resolveObstacleCollision(actor);
  }

  update(dt) {
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.clearBanner();
      }
    }

    if (this.state !== "playing" || !this.player || !this.room) {
      return;
    }

    this.updatePlayer(dt);
    this.updateTraps(dt);
    this.updateZones(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);

    this.enemies = this.enemies.filter((enemy) => !enemy.gone);
    this.projectiles = this.projectiles.filter((projectile) => projectile.life > 0);
    this.pickups = this.pickups.filter((pickup) => !pickup.collected);
    this.zones = this.zones.filter((zone) => zone.timer > 0);

    if (!this.room.roomClear && this.enemies.every((enemy) => enemy.dead)) {
      this.room.roomClear = true;
      this.room.clearDelay = 1.1;
      this.run.roomsCleared += 1;
      const roomAsh = this.room.tag === "elite" ? 8 : this.room.bossId ? 16 : 3;
      this.run.ashEarned += roomAsh;
      this.player.ash += roomAsh;
      if (this.room.treasury) {
        this.player.coins += 18;
        this.player.keys += 1;
      }
      this.showBanner(this.room.bossId ? "Boss Vanquished" : "Room Cleared", 1.1);
      this.pickups.push({
        type: this.room.bossId ? "chest" : "flag",
        x: ROOM_BOUNDS.x + ROOM_BOUNDS.w / 2,
        y: ROOM_BOUNDS.y + ROOM_BOUNDS.h / 2,
        vx: 0,
        vy: 0,
      });
    }

    if (this.room.roomClear) {
      this.room.clearDelay -= dt;
      if (this.room.clearDelay <= 0) {
        if (this.room.bossId) {
          if (this.run.roomIndex >= this.run.descriptors.length - 1) {
            this.finishRun(true);
          } else {
            this.openSanctuary();
          }
        } else {
          this.openRewardSelection();
        }
      }
    }

    this.syncHud();
  }

  updatePlayer(dt) {
    const player = this.player;
    const weapon = WEAPONS[player.weaponId];
    player.attackCooldown = Math.max(0, player.attackCooldown - dt);
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.parryTimer = Math.max(0, player.parryTimer - dt);
    player.burnout = Math.max(0, player.burnout - dt);
    player.pendingDamageFlash = Math.max(0, player.pendingDamageFlash - dt);
    player.markStacks = Math.max(0, player.markStacks - dt);

    const input = this.getMovementVector();
    if (player.dashTimer > 0) {
      player.dashTimer = Math.max(0, player.dashTimer - dt);
      player.vx = player.dashVx;
      player.vy = player.dashVy;
    } else {
      player.vx = input.x * player.speed;
      player.vy = input.y * player.speed;
    }

    if (input.x !== 0 || input.y !== 0) {
      player.facing = input;
    } else {
      const aim = normalize(this.pointer.x - player.x, this.pointer.y - player.y);
      player.facing = aim;
    }

    this.moveActor(player, dt);

    if (this.pointer.down && player.attackCooldown <= 0) {
      this.attackPrimary();
    }

    if (player.swing) {
      player.swing.timer -= dt;
      if (!player.swing.hit && player.swing.timer <= 0.1) {
        player.swing.hit = true;
        this.enemies.forEach((enemy) => {
          if (enemy.dead) {
            return;
          }
          const dist = distance(player, enemy);
          const angle = angleBetween(player, enemy);
          const diff = Math.atan2(Math.sin(angle - player.swing.angle), Math.cos(angle - player.swing.angle));
          if (dist <= weapon.range + enemy.radius && Math.abs(diff) <= weapon.arc / 2) {
            this.damageEnemy(enemy, weapon.damage + player.damageBonus, "weapon", {
              burn: weapon.burn,
              fracture: weapon.fracture,
            });
          }
        });
      }

      if (player.swing.timer <= 0) {
        player.swing = null;
      }
    }

    const resolveRegen = player.dashTimer > 0 ? 0 : 18;
    player.resolve = clamp(player.resolve + resolveRegen * dt, 0, player.maxResolve);
    const cooling = player.burnout > 0 ? 28 : 8 + player.cooldownBonus * 8;
    player.heat = clamp(player.heat - cooling * dt, 0, player.maxHeat);
  }

  updateTraps(dt) {
    if (this.room.reversalTimer < 900) {
      this.room.reversalTimer -= dt;
      if (this.room.reversalTimer <= 0) {
        const allyTrap = pick(this.traps.filter((trap) => trap.state === "ally"));
        if (allyTrap) {
          allyTrap.state = "enemy";
          allyTrap.reversed = 3.2;
          this.showBanner("Trap Reversal", 0.7);
        }
        this.room.reversalTimer = this.room.bossId === "prior" ? 5.2 : 7.2;
      }
    }

    this.traps.forEach((trap) => {
      trap.timer += dt * this.room.trapRate;
      trap.hitTimer = Math.max(0, trap.hitTimer - dt);
      if (trap.consecrated > 0) {
        trap.consecrated -= dt;
        if (trap.consecrated <= 0 && trap.reversed <= 0) {
          trap.state = trap.defaultState;
        }
      }
      if (trap.reversed > 0) {
        trap.reversed -= dt;
        if (trap.reversed <= 0) {
          trap.state = trap.consecrated > 0 ? "ally" : trap.defaultState;
        }
      }

      const nearbySkull = this.enemies.some((enemy) => !enemy.dead && (enemy.type === "skull" || enemy.type === "choirSkull") && distance(enemy, trap) < 130);
      const rateMultiplier = nearbySkull ? 1.35 : 1;
      const state = trap.state;

      if (trap.kind === "arrow" && state !== "neutral") {
        const interval = 1.35 / rateMultiplier;
        if (trap.timer >= interval) {
          trap.timer = 0;
          const directionMap = {
            right: { x: 1, y: 0 },
            left: { x: -1, y: 0 },
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
          };
          const dir = directionMap[trap.dir] || directionMap.right;
          this.spawnProjectile({
            team: state === "ally" ? "player" : "enemy",
            x: trap.x + dir.x * 12,
            y: trap.y + dir.y * 12,
            vx: dir.x * 290,
            vy: dir.y * 290,
            damage: 14,
            radius: 5,
            burn: 0,
          });
        }
      }

      if ((trap.kind === "torch" || trap.kind === "candlestick" || trap.kind === "sideTorch") && state !== "neutral") {
        if (trap.timer >= 0.42 / rateMultiplier) {
          trap.timer = 0;
          const targets = state === "ally" ? this.enemies.filter((enemy) => !enemy.dead) : [this.player];
          targets.forEach((target) => {
            if (distance(target, trap) <= 54) {
              if (state === "ally") {
                this.damageEnemy(target, 8 * this.player.burnMultiplier, "trap", { burn: 1.2 });
              } else {
                this.damagePlayer(1, "fire");
              }
            }
          });
        }
      }

      if (trap.kind === "spikes" && state !== "neutral") {
        const active = trap.timer % (1.8 / rateMultiplier) > 1.1 / rateMultiplier;
        if (active && trap.hitTimer <= 0) {
          trap.hitTimer = 0.45;
          const targets = state === "ally" ? this.enemies.filter((enemy) => !enemy.dead) : [this.player];
          targets.forEach((target) => {
            if (Math.abs(target.x - trap.x) < 26 && Math.abs(target.y - trap.y) < 26) {
              if (state === "ally") {
                this.damageEnemy(target, 16, "trap", { fracture: 2.2 });
              } else {
                this.damagePlayer(1, "spikes");
              }
            }
          });
        }
      }

      if (trap.kind === "flame" && state !== "neutral") {
        const active = trap.timer % (2.1 / rateMultiplier) > 1.25 / rateMultiplier;
        if (active && trap.hitTimer <= 0) {
          trap.hitTimer = 0.32;
          const horizontal = trap.dir === "left" || trap.dir === "right";
          const targets = state === "ally" ? this.enemies.filter((enemy) => !enemy.dead) : [this.player];
          targets.forEach((target) => {
            const withinLane = horizontal
              ? Math.abs(target.y - trap.y) < 26 && ((trap.dir === "right" && target.x > trap.x) || (trap.dir === "left" && target.x < trap.x)) && Math.abs(target.x - trap.x) < 200
              : Math.abs(target.x - trap.x) < 26 && ((trap.dir === "down" && target.y > trap.y) || (trap.dir === "up" && target.y < trap.y)) && Math.abs(target.y - trap.y) < 200;
            if (withinLane) {
              if (state === "ally") {
                this.damageEnemy(target, 14 * this.player.burnMultiplier, "trap", { burn: 2.2 });
              } else {
                this.damagePlayer(1, "fire");
              }
            }
          });
        }
      }
    });
  }

  updateZones(dt) {
    this.zones.forEach((zone) => {
      zone.timer -= dt;
      zone.pulse += dt;

      if (zone.kind === "ward" && zone.pulse >= 0.18) {
        zone.pulse = 0;
        this.projectiles.forEach((projectile) => {
          if (projectile.team === "enemy" && Math.hypot(projectile.x - zone.x, projectile.y - zone.y) < zone.radius) {
            projectile.life = 0;
          }
        });
        this.enemies.forEach((enemy) => {
          if (!enemy.dead && distance(zone, enemy) < zone.radius) {
            enemy.vx *= 0.8;
            enemy.vy *= 0.8;
            this.damageEnemy(enemy, 4, "ward");
          }
        });
      }
    });
  }

  updateEnemies(dt) {
    const player = this.player;
    this.enemies.forEach((enemy) => {
      if (enemy.dead) {
        enemy.gone = enemy.gone || false;
        enemy.vx *= 0.9;
        enemy.vy *= 0.9;
        if (!enemy.gone) {
          enemy.gone = true;
        }
        return;
      }

      enemy.invulnerable = Math.max(0, enemy.invulnerable - dt);
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      enemy.projectileCooldown = Math.max(0, enemy.projectileCooldown - dt);
      enemy.stunned = Math.max(0, enemy.stunned - dt);
      enemy.burn = Math.max(0, enemy.burn - dt);
      enemy.fracture = Math.max(0, enemy.fracture - dt);
      enemy.mark = Math.max(0, enemy.mark - dt);

      if (enemy.burn > 0) {
        enemy.hp -= dt * 4.2 * this.player.burnMultiplier;
        if (enemy.hp <= 0) {
          enemy.dead = true;
          const ashGain = enemy.boss ? 20 : enemy.elite ? 8 : 3;
          this.player.ash += ashGain;
          this.run.ashEarned += ashGain;
          this.dropLoot(enemy);
          if (enemy.boss) {
            this.run.bossesCleared += 1;
          }
          return;
        }
      }

      const toPlayer = normalize(player.x - enemy.x, player.y - enemy.y);
      enemy.facing = toPlayer;

      if (enemy.stunned > 0) {
        enemy.vx *= 0.84;
        enemy.vy *= 0.84;
        this.moveActor(enemy, dt);
        return;
      }

      if (enemy.type === "skeleton1") {
        this.updateSkeleton(enemy, dt, 54, 1.15);
      } else if (enemy.type === "skeleton2") {
        this.updateSkeleton(enemy, dt, 64, 1.4, true);
      } else if (enemy.type === "skull" || enemy.type === "choirSkull") {
        this.updateSkull(enemy, dt);
      } else if (enemy.type === "vampire") {
        this.updateVampire(enemy, dt);
      } else if (enemy.type === "wardenBoss") {
        this.updateWarden(enemy, dt);
      } else if (enemy.type === "priorBoss") {
        this.updatePrior(enemy, dt);
      }
    });
  }

  updateSkeleton(enemy, dt, attackRange, recovery, shielded = false) {
    const player = this.player;
    const dist = distance(enemy, player);
    if (enemy.windup > 0) {
      enemy.windup -= dt;
      enemy.vx *= 0.8;
      enemy.vy *= 0.8;
      if (enemy.windup <= 0) {
        if (dist < attackRange + player.radius + 4) {
          if (this.player.parryTimer > 0) {
            enemy.stunned = shielded ? 1.4 : 1;
            if (this.room.bossId === "warden") {
              this.traps.forEach((trap) => {
                if (trap.kind === "arrow") {
                  trap.state = "ally";
                  trap.consecrated = 4;
                }
              });
            }
          } else {
            this.damagePlayer(1, "skeleton");
          }
        }
        enemy.attackCooldown = recovery;
      }
    } else if (dist < attackRange && enemy.attackCooldown <= 0) {
      enemy.windup = shielded ? 0.58 : 0.42;
      enemy.vx = 0;
      enemy.vy = 0;
    } else {
      enemy.vx = enemy.facing.x * enemy.speed;
      enemy.vy = enemy.facing.y * enemy.speed;
    }

    this.moveActor(enemy, dt);
  }

  updateSkull(enemy, dt) {
    const angle = performance.now() / 1000 + enemy.floatOffset;
    enemy.x = lerp(enemy.x, enemy.home.x + Math.cos(angle) * 18, 0.05);
    enemy.y = lerp(enemy.y, enemy.home.y + Math.sin(angle * 1.2) * 18, 0.05);
    if (enemy.projectileCooldown <= 0) {
      enemy.projectileCooldown = enemy.type === "choirSkull" ? 0.9 : 1.6;
      const dir = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
      this.spawnProjectile({
        team: "enemy",
        x: enemy.x,
        y: enemy.y,
        vx: dir.x * (enemy.type === "choirSkull" ? 240 : 190),
        vy: dir.y * (enemy.type === "choirSkull" ? 240 : 190),
        damage: 1,
        radius: 6,
      });
    }
  }

  updateVampire(enemy, dt) {
    const player = this.player;
    const dist = distance(enemy, player);
    enemy.blinkCooldown = Math.max(0, (enemy.blinkCooldown || 0) - dt);

    if (enemy.windup > 0) {
      enemy.windup -= dt;
      enemy.vx *= 0.78;
      enemy.vy *= 0.78;
      if (enemy.windup <= 0) {
        if (dist < 74) {
          if (player.parryTimer > 0) {
            enemy.stunned = 1.1;
          } else {
            this.damagePlayer(1, "vampire");
          }
        }
        enemy.attackCooldown = 1.1;
      }
    } else if (enemy.blinkCooldown <= 0 && dist > 82) {
      enemy.blinkCooldown = enemy.boss ? 1.3 : 2.2;
      const angle = angleBetween(player, enemy) + rand(-0.8, 0.8);
      enemy.x = clamp(player.x + Math.cos(angle) * 70, ROOM_BOUNDS.x + enemy.radius, ROOM_BOUNDS.x + ROOM_BOUNDS.w - enemy.radius);
      enemy.y = clamp(player.y + Math.sin(angle) * 70, ROOM_BOUNDS.y + enemy.radius, ROOM_BOUNDS.y + ROOM_BOUNDS.h - enemy.radius);
    } else if (dist < 74 && enemy.attackCooldown <= 0) {
      enemy.windup = 0.34;
    } else {
      const offset = normalize(player.y - enemy.y, -(player.x - enemy.x));
      enemy.vx = (enemy.facing.x * 80 + offset.x * 30) * (enemy.boss ? 1.15 : 1);
      enemy.vy = (enemy.facing.y * 80 + offset.y * 30) * (enemy.boss ? 1.15 : 1);
    }

    this.moveActor(enemy, dt);
  }

  updateWarden(enemy, dt) {
    if (!enemy.summonedFlags.first && enemy.hp < enemy.maxHp * 0.72) {
      enemy.summonedFlags.first = true;
      this.enemies.push(this.createEnemy("skeleton1", enemy.x - 110, enemy.y - 40));
      this.enemies.push(this.createEnemy("skeleton1", enemy.x - 110, enemy.y + 40));
    }
    if (!enemy.summonedFlags.second && enemy.hp < enemy.maxHp * 0.42) {
      enemy.summonedFlags.second = true;
      this.enemies.push(this.createEnemy("skeleton2", enemy.x - 90, enemy.y));
    }

    enemy.arrowBurstCooldown -= dt;
    if (enemy.arrowBurstCooldown <= 0) {
      enemy.arrowBurstCooldown = 4.2;
      this.traps.forEach((trap) => {
        if (trap.kind === "arrow") {
          trap.state = "enemy";
          trap.timer = 999;
        }
      });
      this.showBanner("Arrow Barrage", 0.8);
    }

    this.updateSkeleton(enemy, dt, 76, 1.7, true);
  }

  updatePrior(enemy, dt) {
    if (!enemy.summonedFlags.first && enemy.hp < enemy.maxHp * 0.66) {
      enemy.summonedFlags.first = true;
      this.enemies.push(this.createEnemy("skull", enemy.x - 120, enemy.y - 80));
      this.enemies.push(this.createEnemy("skeleton2", enemy.x - 120, enemy.y + 80));
      this.showBanner("Phase Shift", 0.9);
    }
    if (!enemy.summonedFlags.second && enemy.hp < enemy.maxHp * 0.33) {
      enemy.summonedFlags.second = true;
      this.enemies.push(this.createEnemy("vampire", enemy.x - 100, enemy.y));
      this.showBanner("Crimson Night", 0.9);
    }

    enemy.reversalCooldown -= dt;
    if (enemy.reversalCooldown <= 0) {
      enemy.reversalCooldown = 5.4;
      const trap = pick(this.traps.filter((entry) => entry.state === "ally"));
      if (trap) {
        trap.state = "enemy";
        trap.reversed = 3.4;
      }
    }

    this.updateVampire(enemy, dt);
  }

  updateProjectiles(dt) {
    this.projectiles.forEach((projectile) => {
      projectile.life -= dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;

      if (
        projectile.x < ROOM_BOUNDS.x ||
        projectile.x > ROOM_BOUNDS.x + ROOM_BOUNDS.w ||
        projectile.y < ROOM_BOUNDS.y ||
        projectile.y > ROOM_BOUNDS.y + ROOM_BOUNDS.h
      ) {
        projectile.life = 0;
      }

      this.obstacles.forEach((obstacle) => {
        if (projectile.life > 0 && this.circleIntersectsRect(projectile, obstacle)) {
          obstacle.hp -= projectile.team === "player" ? projectile.damage : 0;
          projectile.life = 0;
          if (obstacle.hp <= 0) {
            obstacle.destroyed = true;
            if (Math.random() < 0.55) {
              this.pickups.push({ type: "coin", amount: randInt(2, 5), x: obstacle.x + 12, y: obstacle.y + 12, vx: rand(-8, 8), vy: rand(-8, 8) });
            }
          }
        }
      });
      this.obstacles = this.obstacles.filter((obstacle) => !obstacle.destroyed);

      if (projectile.team === "player") {
        this.enemies.forEach((enemy) => {
          if (!enemy.dead && projectile.life > 0 && distance(projectile, enemy) < projectile.radius + enemy.radius) {
            this.damageEnemy(enemy, projectile.damage, "projectile", { burn: projectile.burn, mark: 1.6 });
            if (projectile.pierce > 0) {
              projectile.pierce -= 1;
            } else {
              projectile.life = 0;
            }
          }
        });
      } else if (projectile.team === "enemy") {
        if (this.player.parryTimer > 0 && distance(projectile, this.player) < 28) {
          projectile.team = "player";
          projectile.vx *= -1.2;
          projectile.vy *= -1.2;
          this.showBanner("Reflected", 0.45);
        } else if (distance(projectile, this.player) < projectile.radius + this.player.radius) {
          this.damagePlayer(1, "projectile");
          projectile.life = 0;
        }
      }
    });
  }

  updatePickups(dt) {
    this.pickups.forEach((pickup) => {
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;
      pickup.vx *= 0.92;
      pickup.vy *= 0.92;

      if (distance(pickup, this.player) < 28 && !["flag", "chest"].includes(pickup.type)) {
        pickup.collected = true;
        if (pickup.type === "coin") {
          this.player.coins += pickup.amount || 1;
        } else if (pickup.type === "key") {
          this.player.keys += pickup.amount || 1;
        } else if (pickup.type === "flask") {
          this.player.hp = clamp(this.player.hp + 1, 0, this.player.maxHp);
          this.player.heat = clamp(this.player.heat - 18, 0, this.player.maxHeat);
        }
      }
    });
  }

  drawAnimatedSheet(image, frameWidth, frameHeight, frameCount, time, x, y, width, height, flip = false) {
    const frame = Math.floor(time * 10) % frameCount;
    this.ctx.save();
    this.ctx.translate(x, y);
    if (flip) {
      this.ctx.scale(-1, 1);
    }
    this.ctx.drawImage(
      image,
      frame * frameWidth,
      0,
      frameWidth,
      frameHeight,
      flip ? -width / 2 : -width / 2,
      -height / 2,
      width,
      height
    );
    this.ctx.restore();
  }

  drawRoomFrame() {
    this.ctx.save();
    this.ctx.fillStyle = this.floorPattern;
    this.ctx.globalAlpha = 0.13;
    this.ctx.fillRect(ROOM_BOUNDS.x, ROOM_BOUNDS.y, ROOM_BOUNDS.w, ROOM_BOUNDS.h);
    this.ctx.globalAlpha = 1;

    this.ctx.strokeStyle = this.room?.accent || "#f5ead1";
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(ROOM_BOUNDS.x, ROOM_BOUNDS.y, ROOM_BOUNDS.w, ROOM_BOUNDS.h);

    this.ctx.fillStyle = "rgba(4, 3, 3, 0.82)";
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, ROOM_BOUNDS.y - 10);
    this.ctx.fillRect(0, ROOM_BOUNDS.y + ROOM_BOUNDS.h + 10, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx.fillRect(0, 0, ROOM_BOUNDS.x - 10, CANVAS_HEIGHT);
    this.ctx.fillRect(ROOM_BOUNDS.x + ROOM_BOUNDS.w + 10, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx.restore();
  }

  drawObstacles(time) {
    this.obstacles.forEach((obstacle) => {
      const source = obstacle.kind === "box2" ? this.assets.props.box2 : this.assets.props.box1;
      const stage = Math.min(source.length - 1, Math.floor(((obstacle.maxHp - obstacle.hp) / obstacle.maxHp) * source.length));
      this.ctx.drawImage(source[stage], obstacle.x, obstacle.y, obstacle.w, obstacle.h);
    });
  }

  drawTraps(time) {
    this.traps.forEach((trap) => {
      const isAlly = trap.state === "ally";
      const isEnemy = trap.state === "enemy";
      const glow = isAlly ? "rgba(242, 196, 113, 0.18)" : isEnemy ? "rgba(154, 61, 66, 0.2)" : "rgba(255,255,255,0.04)";

      this.ctx.save();
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(trap.x, trap.y, 22, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      if (trap.kind === "arrow") {
        const frame = Math.floor(time * 10) % this.assets.props.arrow.length;
        const img = this.assets.props.arrow[frame];
        this.ctx.save();
        this.ctx.translate(trap.x, trap.y);
        if (trap.dir === "left") this.ctx.rotate(Math.PI);
        if (trap.dir === "up") this.ctx.rotate(-Math.PI / 2);
        if (trap.dir === "down") this.ctx.rotate(Math.PI / 2);
        this.ctx.drawImage(img, -16, -8, 32, 16);
        this.ctx.restore();
      } else if (trap.kind === "flame") {
        const frames = trap.dir === "left" || trap.dir === "right" ? this.assets.props.flameHorizontal : this.assets.props.flameVertical;
        const frame = Math.floor(time * 12) % frames.length;
        const img = frames[frame];
        this.ctx.save();
        this.ctx.translate(trap.x, trap.y);
        if (trap.dir === "left") this.ctx.rotate(Math.PI);
        if (trap.dir === "up") this.ctx.rotate(-Math.PI / 2);
        if (trap.dir === "down") this.ctx.rotate(Math.PI / 2);
        this.ctx.drawImage(img, -20, -20, trap.dir === "left" || trap.dir === "right" ? 64 : 32, trap.dir === "left" || trap.dir === "right" ? 32 : 64);
        this.ctx.restore();
      } else if (trap.kind === "spikes") {
        const frame = Math.floor(time * 8) % this.assets.props.spikes.length;
        this.ctx.drawImage(this.assets.props.spikes[frame], trap.x - 16, trap.y - 16, 32, 32);
      } else if (trap.kind === "torch") {
        const frame = Math.floor(time * 8) % this.assets.props.torch.length;
        this.ctx.drawImage(this.assets.props.torch[frame], trap.x - 16, trap.y - 16, 32, 32);
      } else if (trap.kind === "sideTorch") {
        const frame = Math.floor(time * 8) % this.assets.props.sideTorch.length;
        this.ctx.drawImage(this.assets.props.sideTorch[frame], trap.x - 16, trap.y - 16, 32, 32);
      } else if (trap.kind === "candlestick") {
        const frame = Math.floor(time * 8) % this.assets.props.candlestick.length;
        this.ctx.drawImage(this.assets.props.candlestick[frame], trap.x - 16, trap.y - 16, 32, 32);
      }
    });
  }

  drawZones(time) {
    this.zones.forEach((zone) => {
      this.ctx.save();
      if (zone.kind === "ward") {
        this.ctx.strokeStyle = "rgba(239, 217, 175, 0.85)";
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        this.ctx.stroke();
      } else if (zone.kind === "burst") {
        this.ctx.fillStyle = "rgba(242, 196, 113, 0.24)";
        this.ctx.beginPath();
        this.ctx.arc(zone.x, zone.y, zone.radius * (1 - zone.timer / 0.35), 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    });
  }

  drawPickups(time) {
    this.pickups.forEach((pickup) => {
      let image = this.assets.props.coin[0];
      if (pickup.type === "coin") {
        image = this.assets.props.coin[Math.floor(time * 10) % this.assets.props.coin.length];
      } else if (pickup.type === "key") {
        image = this.assets.props.key[Math.floor(time * 10) % this.assets.props.key.length];
      } else if (pickup.type === "flask") {
        image = pick(this.assets.props.flasks);
      } else if (pickup.type === "flag") {
        image = this.assets.props.flag[Math.floor(time * 10) % this.assets.props.flag.length];
      } else if (pickup.type === "chest") {
        image = this.assets.props.chestOpen[Math.floor(time * 10) % this.assets.props.chestOpen.length];
      }
      this.ctx.drawImage(image, pickup.x - 14, pickup.y - 14, 28, 28);
    });
  }

  drawEnemies(time) {
    this.enemies.forEach((enemy) => {
      if (enemy.dead) {
        return;
      }

      const flip = enemy.facing.x < 0;
      this.ctx.save();
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      this.ctx.beginPath();
      this.ctx.ellipse(enemy.x, enemy.y + enemy.radius + 6, enemy.radius, 8, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      if (enemy.type === "skeleton1") {
        const image = enemy.windup > 0 ? this.assets.enemies.skeleton1Attack : this.assets.enemies.skeleton1Move;
        this.drawAnimatedSheet(image, 32, 32, enemy.windup > 0 ? 9 : 10, time, enemy.x, enemy.y, 64, 64, flip);
      } else if (enemy.type === "skeleton2" || enemy.type === "wardenBoss") {
        const image = enemy.windup > 0 ? this.assets.enemies.skeleton2Attack : this.assets.enemies.skeleton2Move;
        this.drawAnimatedSheet(image, 32, 32, enemy.windup > 0 ? 15 : 10, time, enemy.x, enemy.y, enemy.boss ? 84 : 72, enemy.boss ? 84 : 72, flip);
      } else if (enemy.type === "vampire" || enemy.type === "priorBoss") {
        const image = enemy.windup > 0 ? this.assets.enemies.vampireAttack : this.assets.enemies.vampireMove;
        this.drawAnimatedSheet(image, 32, 32, enemy.windup > 0 ? 16 : 8, time, enemy.x, enemy.y, enemy.boss ? 82 : 72, enemy.boss ? 82 : 72, flip);
      } else if (enemy.type === "skull" || enemy.type === "choirSkull") {
        const frame = Math.floor(time * 8 + enemy.choirIndex) % this.assets.enemies.skull.length;
        this.ctx.drawImage(this.assets.enemies.skull[frame], enemy.x - 18, enemy.y - 18, 36, 36);
      }

      const hpRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      this.ctx.fillRect(enemy.x - 24, enemy.y - enemy.radius - 18, 48, 6);
      this.ctx.fillStyle = enemy.boss ? "#efc471" : enemy.elite ? "#d58f54" : "#d56c58";
      this.ctx.fillRect(enemy.x - 24, enemy.y - enemy.radius - 18, 48 * hpRatio, 6);
    });
  }

  drawPlayer(time) {
    if (!this.player) {
      return;
    }

    const player = this.player;
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.ctx.beginPath();
    this.ctx.ellipse(player.x, player.y + player.radius + 7, player.radius, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    if (player.pendingDamageFlash > 0) {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(255,255,255,0.08)";
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, 26, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    const image = this.assets.players[player.sprite];
    const frame = Math.floor(time * 10) % 7;
    const flip = player.facing.x < 0;
    this.ctx.save();
    this.ctx.translate(player.x, player.y);
    if (flip) {
      this.ctx.scale(-1, 1);
    }
    this.ctx.drawImage(image, frame * 16, 0, 16, 16, -24, -24, 48, 48);
    this.ctx.restore();

    if (player.parryTimer > 0) {
      this.ctx.save();
      this.ctx.strokeStyle = "rgba(239, 217, 175, 0.85)";
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, 26, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    if (player.swing) {
      const weapon = WEAPONS[player.weaponId];
      this.ctx.save();
      this.ctx.strokeStyle = "rgba(242, 142, 70, 0.9)";
      this.ctx.lineWidth = 5;
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, weapon.range * 0.8, player.swing.angle - weapon.arc / 2, player.swing.angle + weapon.arc / 2);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  drawProjectiles() {
    this.projectiles.forEach((projectile) => {
      if (projectile.team === "player") {
        this.ctx.drawImage(this.assets.props.arrowProjectile, projectile.x - 10, projectile.y - 5, 20, 10);
      } else {
        this.ctx.save();
        this.ctx.fillStyle = "#b44649";
        this.ctx.beginPath();
        this.ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    });
  }

  render(time) {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx.fillStyle = "#0b0909";
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (!this.room) {
      this.ctx.drawImage(this.assets.demo, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      return;
    }

    this.drawRoomFrame();
    this.drawZones(time);
    this.drawTraps(time);
    this.drawObstacles(time);
    this.drawPickups(time);
    this.drawProjectiles();
    this.drawEnemies(time);
    this.drawPlayer(time);

    const nearestTrap = this.state === "playing" ? this.nearestTrap() : null;
    if (nearestTrap && this.player) {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(18, 13, 14, 0.88)";
      this.ctx.fillRect(nearestTrap.x - 18, nearestTrap.y - 42, 36, 20);
      this.ctx.fillStyle = "#efc471";
      this.ctx.font = "12px Consolas";
      this.ctx.textAlign = "center";
      this.ctx.fillText("E", nearestTrap.x, nearestTrap.y - 28);
      this.ctx.restore();
    }

    if (this.player?.markStacks > 0) {
      this.ctx.save();
      this.ctx.strokeStyle = "rgba(180, 70, 73, 0.55)";
      this.ctx.lineWidth = 6;
      this.ctx.strokeRect(8, 8, CANVAS_WIDTH - 16, CANVAS_HEIGHT - 16);
      this.ctx.restore();
    }
  }

  loop(time) {
    const dt = clamp((time - this.lastTime) / 1000 || 0.016, 0.001, 0.033);
    this.lastTime = time;

    this.update(dt);
    this.render(time / 1000);
    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }
}

const boot = async () => {
  const assets = await loadTree(ASSET_PATHS);
  const ui = collectUi();
  const game = new AshenReliquary(ui, assets);
  window.ashenReliquary = game;
};

boot();
