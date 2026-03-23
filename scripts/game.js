const DOM_CACHE = Object.create(null);
const STORAGE_KEYS = { run: "ashen_hollow_save_v1", best: "ashen_hollow_best_v1", discovered: "ashen_hollow_discovered_v1" };
const PERSISTED_SCREENS = new Set(["map-screen", "battle-screen", "flow-screen"]);
const REGION_INFO = [
  { id: "ashen-rise", name: "The Ashen Rise", kicker: "Region I", subtitle: "Open braziers and first devotions." },
  { id: "waxen-cloister", name: "The Waxen Cloister", kicker: "Region II", subtitle: "Wax hymns and candle smoke." },
  { id: "barrow-below", name: "The Barrow Below", kicker: "Region III", subtitle: "Roots split graves in the dark." },
];
const NODE_LABELS = {
  battle: { icon: "X", name: "Battle", copy: "A standard clash. Survive and take a card." },
  elite: { icon: "!!", name: "Elite", copy: "Harder fight. Better spoils." },
  campfire: { icon: "F", name: "Campfire", copy: "Temper one creature in the coals." },
  trader: { icon: "$", name: "Trader", copy: "A stitched merchant offers a bargain." },
  "sigil-shrine": { icon: "S", name: "Sigil Shrine", copy: "Graft a mark onto a survivor." },
  "item-cache": { icon: "I", name: "Item Cache", copy: "Old tools wait under ash." },
  boss: { icon: "B", name: "Boss", copy: "A named keeper of the region." },
};
const REGION_LAYOUTS = [
  [["battle","battle","campfire"],["battle","item-cache","trader"],["battle","sigil-shrine","elite"],["battle","campfire","item-cache"],["battle","elite"],["boss"]],
  [["battle","trader","sigil-shrine"],["battle","item-cache","elite"],["battle","campfire","trader"],["battle","sigil-shrine","elite"],["battle","campfire"],["boss"]],
  [["battle","item-cache","campfire"],["elite","battle","trader"],["battle","sigil-shrine","elite"],["battle","campfire","item-cache"],["battle","elite"],["boss"]],
];
const SIGIL_POOLS = { sky: ["airborne","bifurcated","warded"], grave: ["scavenger","bone-king","brittle"], wild: ["guardian","thorn","sentry","skitter"] };
const app = {
  run: null,
  visibleScreen: "title-screen",
  selectedStarterId: "red-rite",
  selectedMapNodeId: null,
  deckbookTab: "current",
  deckbookReturnScreen: "title-screen",
  toastTimer: null,
  drag: null,
  inspect: null,
  pauseVisible: false,
  ending: null,
  motes: [],
  lastFrameTime: 0,
  discovered: new Set(),
};

function el(id) { return DOM_CACHE[id] || (DOM_CACHE[id] = document.getElementById(id)); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function unique(values) { return [...new Set(values)]; }
function titleCase(value) { return String(value).split(/[\s-]+/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" "); }
function makeSeed() { return ((Date.now() >>> 0) ^ (Math.random() * 0xffffffff >>> 0)) >>> 0; }
function nextRandom(holder) { holder.rngState = ((holder.rngState * 1664525) + 1013904223) >>> 0; return holder.rngState / 0x100000000; }
function randomInt(holder, min, maxExclusive) { return Math.floor(nextRandom(holder) * (maxExclusive - min)) + min; }
function shuffleWithState(holder, values) { const copy = [...values]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = randomInt(holder, 0, i + 1); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function weightedPick(holder, entries) { const total = entries.reduce((sum, entry) => sum + entry.weight, 0); let roll = nextRandom(holder) * total; for (const entry of entries) { roll -= entry.weight; if (roll <= 0) return entry.value; } return entries[entries.length - 1].value; }
function uid(run, prefix) { run.uidCounter = (run.uidCounter || 0) + 1; return `${prefix}-${run.uidCounter}`; }
function sigil(id, name, description, timing, handlerKey) { return { id, name, description, timing, handlerKey }; }
function card(id, name, costBlood, costBones, attack, health, sigils, tribe, rare, artGlyph, description, extra = {}) { return { id, name, costBlood, costBones, attack, health, sigils, tribe, rare, artGlyph, description, ...extra }; }
function item(id, name, description, target, detail) { return { id, name, description, target, detail }; }
function eventDef(id, nodeType, title, description, extra = {}) { return { id, nodeType, title, description, ...extra }; }
function spawn(lane, cardId, extra = {}) { return { lane, cardId, ...extra }; }

const SIGILS = [
  sigil("airborne", "Airborne", "Strikes the scale instead of the opposing creature.", "strike", "airborne"),
  sigil("guardian", "Guardian", "Slides into an empty lane when a foe appears opposite it.", "react", "guardian"),
  sigil("brittle", "Brittle", "Perishes after striking.", "afterStrike", "brittle"),
  sigil("skitter", "Skitter", "Moves sideways after combat.", "afterCombat", "skitter"),
  sigil("sprout", "Sprout", "Transforms after surviving a turn.", "afterCombat", "sprout"),
  sigil("thorn", "Thorn", "Deals 1 damage back when struck.", "damaged", "thorn"),
  sigil("scavenger", "Scavenger", "You gain 1 extra bone whenever a creature dies.", "death", "scavenger"),
  sigil("worthy", "Worthy", "Counts as 3 blood when sacrificed.", "sacrifice", "worthy"),
  sigil("many-lives", "Many Lives", "Survives sacrifice.", "sacrifice", "manyLives"),
  sigil("bifurcated", "Bifurcated", "Strikes the lanes beside its own.", "strike", "bifurcated"),
  sigil("cleave", "Cleave", "Strikes left, forward, and right.", "strike", "cleave"),
  sigil("bone-king", "Bone King", "Drops 3 extra bones on death.", "death", "boneKing"),
  sigil("warded", "Warded", "Negates the first damage taken.", "damaged", "warded"),
  sigil("sentry", "Sentry", "Deals 1 damage to the opposing lane when played.", "play", "sentry"),
];
const SIGIL_LOOKUP = Object.fromEntries(SIGILS.map((entry) => [entry.id, entry]));

const PLAYER_CARDS = [
  card("ember-initiate","Ember Initiate",0,0,1,1,[],"rite",false,"EI","Bleeds first.",{group:"red-rite"}),
  card("altar-goat","Altar Goat",1,0,0,2,["worthy"],"rite",false,"AG","Bows to the knife.",{group:"red-rite"}),
  card("pyre-cat","Pyre Cat",1,0,0,1,["many-lives"],"beast",false,"PC","Returns through smoke.",{group:"red-rite"}),
  card("cinder-hound","Cinder Hound",1,0,2,1,["skitter"],"beast",false,"CH","Coal with teeth.",{group:"red-rite"}),
  card("soot-falcon","Soot Falcon",1,0,1,1,["airborne"],"beast",false,"SF","Dives through sparks.",{group:"red-rite"}),
  card("hearth-keeper","Hearth Keeper",1,0,1,2,["sentry"],"rite",false,"HK","Greets with a shard.",{group:"red-rite"}),
  card("flame-ward","Flame Ward",1,0,1,3,["thorn"],"rite",false,"FW","Wrapped in coals.",{group:"red-rite"}),
  card("red-maw","Red Maw",2,0,3,2,[],"beast",false,"RM","Cannot remember restraint.",{group:"red-rite"}),
  card("wick-wolf","Wick Wolf",2,0,2,3,["guardian"],"beast",false,"WW","Lunges to guard.",{group:"red-rite"}),
  card("ritual-stag","Ritual Stag",2,0,1,4,["worthy"],"beast",false,"RS","Three hearts beat.",{group:"red-rite"}),
  card("brand-vulture","Brand Vulture",2,0,1,2,["airborne","bifurcated"],"beast",true,"BV","Marks two lanes.",{group:"red-rite"}),
  card("coal-ox","Coal Ox",3,0,4,6,[],"beast",true,"CO","Pulls the rite forward.",{group:"red-rite"}),
  card("marrow-scribe","Marrow Scribe",0,1,0,1,["scavenger"],"bone",false,"MS","Counts every death.",{group:"bone-choir"}),
  card("choir-rib","Choir Rib",0,2,1,2,[],"bone",false,"CR","A ribcage taught to sing.",{group:"bone-choir"}),
  card("grave-sapper","Grave Sapper",0,3,2,1,["bone-king"],"bone",false,"GS","Steals from graves.",{group:"bone-choir"}),
  card("femur-mason","Femur Mason",0,4,1,4,["thorn"],"bone",false,"FM","Reinforces the line.",{group:"bone-choir"}),
  card("ossuary-hound","Ossuary Hound",0,4,2,2,["skitter"],"bone",false,"OH","Digs where marrow steams.",{group:"bone-choir"}),
  card("dirge-bat","Dirge Bat",0,5,1,2,["airborne"],"bone",false,"DB","Its cry lands first.",{group:"bone-choir"}),
  card("crypt-mother","Crypt Mother",0,5,1,3,["sprout"],"bone",false,"CM","Given time, worsens.",{group:"bone-choir", sproutsTo:"ash-revenant"}),
  card("reliquary-elk","Reliquary Elk",0,6,2,4,["warded"],"bone",false,"RE","A shrine on antlers.",{group:"bone-choir"}),
  card("catacomb-giant","Catacomb Giant",0,8,4,5,[],"bone",true,"CG","The floor itself rises.",{group:"bone-choir"}),
  card("grave-harrier","Grave Harrier",0,6,1,3,["airborne","scavenger"],"bone",true,"GH","Circles the dead.",{group:"bone-choir"}),
  card("bone-usher","Bone Usher",0,3,0,3,["guardian","scavenger"],"bone",false,"BU","Makes room for corpses.",{group:"bone-choir"}),
  card("ash-revenant","Ash Revenant",0,6,3,2,["warded"],"bone",true,"AR","Walks out hotter.",{group:"bone-choir"}),
  card("moss-scout","Moss Scout",0,0,1,2,[],"moss",false,"MO","Knows soft places.",{group:"moss-covenant"}),
  card("bark-guard","Bark Guard",1,0,0,4,["guardian"],"moss",false,"BG","A wall that notices.",{group:"moss-covenant"}),
  card("sapling-host","Sapling Host",1,0,0,2,["sprout"],"moss",false,"SH","Patience becomes threat.",{group:"moss-covenant", sproutsTo:"briar-elk"}),
  card("reed-stalker","Reed Stalker",1,0,1,3,["warded"],"moss",false,"RD","The first cut parts reeds.",{group:"moss-covenant"}),
  card("hollow-tender","Hollow Tender",1,0,1,2,["scavenger"],"moss",false,"HT","Gathers what fell.",{group:"moss-covenant"}),
  card("vine-cutter","Vine Cutter",1,0,2,1,["sentry"],"moss",false,"VC","The hook answers first.",{group:"moss-covenant"}),
  card("briar-elk","Briar Elk",2,0,2,4,["thorn"],"moss",false,"BE","Antlers are not the limit.",{group:"moss-covenant"}),
  card("mire-owl","Mire Owl",2,0,1,2,["airborne","warded"],"moss",true,"MO","Mist closes behind it.",{group:"moss-covenant"}),
  card("thicket-matron","Thicket Matron",2,0,2,3,["cleave"],"moss",true,"TM","Tends the whole row.",{group:"moss-covenant"}),
  card("root-hulk","Root Hulk",3,0,3,6,[],"moss",true,"RH","The board groans.",{group:"moss-covenant"}),
  card("wilted-sage","Wilted Sage",2,0,1,3,["bifurcated"],"moss",false,"WS","Counsel in two lanes.",{group:"moss-covenant"}),
  card("bloom-lantern","Bloom Lantern",2,0,0,3,["sprout","guardian"],"moss",true,"BL","Glows before it unfurls.",{group:"moss-covenant", sproutsTo:"root-hulk"}),
];

const ENEMY_CARDS = [
  card("hollow-scab","Hollow Scab",0,0,1,1,[],"enemy",false,"HS","Left too near the table."),
  card("cinder-mite","Cinder Mite",0,0,1,2,["brittle"],"enemy",false,"CM","Burns out on impact."),
  card("straw-bailiff","Straw Bailiff",0,0,1,3,["guardian"],"enemy",false,"SB","Jumps where ordered."),
  card("ember-crow","Ember Crow",0,0,1,1,["airborne"],"enemy",false,"EC","Cuts the air orange."),
  card("grave-maggot","Grave Maggot",0,0,1,1,["skitter"],"enemy",false,"GM","Never where expected."),
  card("ash-usher","Ash Usher",0,0,0,2,["thorn"],"enemy",false,"AU","Points with pain."),
  card("bone-raider","Bone Raider",0,0,2,2,[],"enemy",false,"BR","Heavy hands, simple hunger."),
  card("wax-sister","Wax Sister",0,0,1,3,["warded"],"enemy",false,"WX","The first blow only dents."),
  card("briar-wretch","Briar Wretch",0,0,2,2,["thorn"],"enemy",false,"BW","Pain both ways."),
  card("tomb-warden","Tomb Warden",0,0,1,4,["guardian"],"enemy",false,"TW","Keeps old claims."),
  card("rot-hound","Rot Hound",0,0,2,1,["skitter"],"enemy",false,"RH","A fast jaw."),
  card("mire-spitter","Mire Spitter",0,0,1,2,["sentry"],"enemy",false,"MS","Nicks the lane first."),
  card("wicker-judge","Wicker Judge",0,0,2,7,["guardian","cleave"],"boss",true,"WJ","Taxes the whole row.",{boss:true}),
  card("candle-matron","Candle Matron",0,0,1,8,["warded","scavenger"],"boss",true,"CM","Feeds on extinguished wick.",{boss:true}),
  card("buried-king","Buried King",0,0,3,8,["warded","cleave"],"boss",true,"BK","Demands tribute from graves.",{boss:true}),
];

const OFFERING_CARD = card("offering-token", "Offering", 0, 0, 0, 1, [], "rite", false, "OF", "A spare body for blood costs.");
const PLAYER_CARD_LOOKUP = Object.fromEntries(PLAYER_CARDS.map((entry) => [entry.id, entry]));
const ENEMY_CARD_LOOKUP = Object.fromEntries(ENEMY_CARDS.map((entry) => [entry.id, entry]));
const CARD_LOOKUP = { ...PLAYER_CARD_LOOKUP, ...ENEMY_CARD_LOOKUP, [OFFERING_CARD.id]: OFFERING_CARD };

const ITEM_DEFS = [
  item("amber-candle", "Amber Candle", "Draw two cards from your main deck.", "none", "A bright wick for sudden momentum."),
  item("grave-salt", "Grave Salt", "Gain 4 bones.", "none", "A handful of old debt."),
  item("ash-knife", "Ash Knife", "Deal 1 damage to an enemy creature.", "enemy", "A mean little certainty."),
  item("smoke-phial", "Smoke Phial", "Add two Offering tokens to your hand.", "none", "Useful when the table wants more bodies."),
  item("ember-oil", "Ember Oil", "A friendly creature gains +1 attack and fresh ward.", "player", "The bottle sweats heat through glass."),
  item("balance-weight", "Balance Weight", "Tip the scale 2 toward you.", "none", "Old brass still remembers how to lean."),
];
const ITEM_LOOKUP = Object.fromEntries(ITEM_DEFS.map((entry) => [entry.id, entry]));

const EVENT_DEFS = [
  eventDef("campfire-blades", "campfire", "Warm The Blades", "Choose a survivor to gain +1 attack.", { stat: "attack", amount: 1 }),
  eventDef("campfire-hide", "campfire", "Stitch The Hide", "Choose a survivor to gain +1 health.", { stat: "health", amount: 1 }),
  eventDef("trader-barter", "trader", "A Fairer Bargain", "The trader lays out three cards and waits."),
  eventDef("trader-purge", "trader", "Leave A Burden", "The trader will remove one card from your deck."),
  eventDef("shrine-sky", "sigil-shrine", "Sigil Of Wind", "Choose a sigil, then choose a bearer.", { pool: "sky" }),
  eventDef("shrine-grave", "sigil-shrine", "Sigil Of Bone", "Choose a sigil, then choose a bearer.", { pool: "grave" }),
  eventDef("cache-tools", "item-cache", "Ash Drawer", "A shallow drawer holds salvageable tools."),
  eventDef("cache-relics", "item-cache", "Velvet Relic Box", "A rarer cache waits under dust."),
];
const EVENT_LOOKUP = Object.fromEntries(EVENT_DEFS.map((entry) => [entry.id, entry]));
const STARTER_DECKS = [
  {
    id: "red-rite",
    name: "Red Rite",
    summary: "Blood aggro with explosive sacrifices and fast pressure.",
    style: "Aggressive blood deck",
    description: "Flood the board with cheap zealots, then cash them in for sudden violence.",
    chips: ["Early pressure", "Blood economy", "Air reach"],
    cards: ["ember-initiate","ember-initiate","altar-goat","altar-goat","pyre-cat","cinder-hound","cinder-hound","soot-falcon","flame-ward","red-maw"],
    preview: ["altar-goat","pyre-cat","red-maw","wick-wolf"],
  },
  {
    id: "bone-choir",
    name: "Bone Choir",
    summary: "Bone recursion that snowballs from every death.",
    style: "Bone economy deck",
    description: "Open slowly, then turn corpses into fuel until larger threats arrive for free.",
    chips: ["Bone gain", "Late scaling", "Attrition"],
    cards: ["marrow-scribe","marrow-scribe","choir-rib","choir-rib","grave-sapper","grave-sapper","bone-usher","dirge-bat","femur-mason","crypt-mother"],
    preview: ["marrow-scribe","grave-sapper","crypt-mother","catacomb-giant"],
  },
  {
    id: "moss-covenant",
    name: "Moss Covenant",
    summary: "Midrange board control with wards, guardians, and growth.",
    style: "Value and board control",
    description: "Protect the lanes, outlast the first swings, then let rooted threats take over.",
    chips: ["Durability", "Lane control", "Sprouts"],
    cards: ["moss-scout","moss-scout","bark-guard","bark-guard","sapling-host","sapling-host","reed-stalker","hollow-tender","vine-cutter","briar-elk"],
    preview: ["bark-guard","sapling-host","briar-elk","thicket-matron"],
  },
];
const STARTER_LOOKUP = Object.fromEntries(STARTER_DECKS.map((entry) => [entry.id, entry]));

const ENCOUNTERS = [
  { id: "rise-watchers", region: 0, tier: "battle", name: "Watchers In The Ash", subtitle: "Two hungry shapes wait.", rewardType: "card", waves: [[spawn(0,"hollow-scab"),spawn(3,"hollow-scab")],[spawn(1,"cinder-mite"),spawn(2,"ember-crow")],[spawn(0,"grave-maggot"),spawn(2,"straw-bailiff")],[spawn(1,"bone-raider")]] },
  { id: "rise-embers", region: 0, tier: "battle", name: "The Ember Gutter", subtitle: "The seams glow and crawl.", rewardType: "card", waves: [[spawn(1,"cinder-mite"),spawn(2,"cinder-mite")],[spawn(0,"ember-crow"),spawn(3,"grave-maggot")],[spawn(1,"ash-usher"),spawn(2,"bone-raider")],[spawn(0,"ember-crow"),spawn(3,"bone-raider")]] },
  { id: "rise-crossing", region: 0, tier: "battle", name: "Straw Crossing", subtitle: "The first tax collectors arrive.", rewardType: "card", waves: [[spawn(0,"straw-bailiff")],[spawn(2,"hollow-scab"),spawn(3,"ember-crow")],[spawn(1,"bone-raider"),spawn(2,"straw-bailiff")],[spawn(0,"grave-maggot"),spawn(3,"bone-raider")]] },
  { id: "rise-elite-tithe", region: 0, tier: "elite", name: "The Tithe Collectors", subtitle: "Straw law with heavier hands.", rewardType: "elite", waves: [[spawn(1,"straw-bailiff"),spawn(2,"straw-bailiff")],[spawn(0,"ember-crow"),spawn(3,"ember-crow")],[spawn(1,"bone-raider"),spawn(2,"bone-raider")],[spawn(0,"ash-usher"),spawn(3,"ash-usher")]] },
  { id: "boss-wicker-judge", region: 0, tier: "boss", name: "The Wicker Judge", subtitle: "He measures the row.", rewardType: "boss", waves: [[spawn(1,"straw-bailiff"),spawn(2,"straw-bailiff")],[spawn(1,"wicker-judge",{boss:true})],[spawn(0,"ember-crow"),spawn(3,"ember-crow")],[spawn(1,"bone-raider"),spawn(2,"straw-bailiff")]] },
  { id: "cloister-procession", region: 1, tier: "battle", name: "Choir Procession", subtitle: "Wax hymnals file between lanes.", rewardType: "card", waves: [[spawn(0,"wax-sister"),spawn(3,"wax-sister")],[spawn(1,"mire-spitter"),spawn(2,"cinder-mite")],[spawn(0,"bone-raider"),spawn(2,"wax-sister")],[spawn(1,"ember-crow"),spawn(3,"mire-spitter")]] },
  { id: "cloister-market", region: 1, tier: "battle", name: "Wax Market", subtitle: "The sellers kept one inventory.", rewardType: "card", waves: [[spawn(1,"mire-spitter"),spawn(2,"wax-sister")],[spawn(0,"grave-maggot"),spawn(3,"bone-raider")],[spawn(1,"wax-sister"),spawn(2,"wax-sister")],[spawn(0,"ember-crow"),spawn(3,"ember-crow")]] },
  { id: "cloister-vigil", region: 1, tier: "battle", name: "Candle Vigil", subtitle: "Every flame watches back.", rewardType: "card", waves: [[spawn(1,"wax-sister"),spawn(2,"mire-spitter")],[spawn(0,"ash-usher"),spawn(3,"wax-sister")],[spawn(1,"bone-raider"),spawn(3,"ember-crow")],[spawn(0,"bone-raider"),spawn(2,"mire-spitter")]] },
  { id: "cloister-elite-vespers", region: 1, tier: "elite", name: "Vespers Of Melted Wax", subtitle: "The hymn reaches every lane.", rewardType: "elite", waves: [[spawn(0,"wax-sister"),spawn(3,"wax-sister")],[spawn(1,"mire-spitter"),spawn(2,"mire-spitter")],[spawn(0,"bone-raider"),spawn(2,"wax-sister"),spawn(3,"ember-crow")],[spawn(1,"bone-raider"),spawn(2,"bone-raider")]] },
  { id: "boss-candle-matron", region: 1, tier: "boss", name: "The Candle Matron", subtitle: "She counts extinguished wicks.", rewardType: "boss", waves: [[spawn(0,"wax-sister"),spawn(3,"wax-sister")],[spawn(1,"candle-matron",{boss:true})],[spawn(0,"mire-spitter"),spawn(3,"mire-spitter")],[spawn(1,"ember-crow"),spawn(2,"bone-raider")]] },
  { id: "barrow-roots", region: 2, tier: "battle", name: "Rootbound Dead", subtitle: "The barrow exhales.", rewardType: "card", waves: [[spawn(1,"briar-wretch"),spawn(2,"grave-maggot")],[spawn(0,"tomb-warden"),spawn(3,"rot-hound")],[spawn(1,"bone-raider"),spawn(2,"briar-wretch")],[spawn(0,"ember-crow"),spawn(3,"tomb-warden")]] },
  { id: "barrow-court", region: 2, tier: "battle", name: "Burial Court", subtitle: "Petty nobles want a front row.", rewardType: "card", waves: [[spawn(0,"tomb-warden"),spawn(3,"tomb-warden")],[spawn(1,"briar-wretch"),spawn(2,"bone-raider")],[spawn(0,"rot-hound"),spawn(2,"mire-spitter")],[spawn(1,"ember-crow"),spawn(3,"bone-raider")]] },
  { id: "barrow-pit", region: 2, tier: "battle", name: "The Open Pit", subtitle: "Everything wants the lane.", rewardType: "card", waves: [[spawn(1,"rot-hound"),spawn(2,"rot-hound")],[spawn(0,"briar-wretch"),spawn(3,"grave-maggot")],[spawn(1,"tomb-warden"),spawn(2,"briar-wretch")],[spawn(0,"bone-raider"),spawn(3,"mire-spitter")]] },
  { id: "barrow-elite-sentinels", region: 2, tier: "elite", name: "Sentinels Of The Crown", subtitle: "The lesser vows still bite.", rewardType: "elite", waves: [[spawn(0,"tomb-warden"),spawn(3,"tomb-warden")],[spawn(1,"briar-wretch"),spawn(2,"briar-wretch")],[spawn(0,"rot-hound"),spawn(1,"bone-raider"),spawn(3,"rot-hound")],[spawn(2,"bone-raider"),spawn(3,"mire-spitter")]] },
  { id: "boss-buried-king", region: 2, tier: "boss", name: "The Buried King", subtitle: "He demands tribute from graves.", rewardType: "boss", waves: [[spawn(0,"tomb-warden"),spawn(3,"tomb-warden")],[spawn(1,"buried-king",{boss:true})],[spawn(0,"rot-hound"),spawn(3,"rot-hound")],[spawn(1,"briar-wretch"),spawn(2,"bone-raider")]] },
];
const ENCOUNTER_LOOKUP = Object.fromEntries(ENCOUNTERS.map((entry) => [entry.id, entry]));

function loadPersistedRun() {
  try { const raw = localStorage.getItem(STORAGE_KEYS.run); return raw ? hydrateRun(JSON.parse(raw)) : null; }
  catch (error) { console.warn("Failed to load run", error); return null; }
}
function savePersistedRun(run) { if (!run) return; try { localStorage.setItem(STORAGE_KEYS.run, JSON.stringify(run)); } catch (error) { console.warn("Failed to save run", error); } }
function clearPersistedRun() { localStorage.removeItem(STORAGE_KEYS.run); }
function hasPersistedRun() { return Boolean(loadPersistedRun()); }
function loadBestStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.best);
    return raw ? JSON.parse(raw) : { runsStarted: 0, victories: 0, bossesDefeated: 0, deepestRegion: 0, longestDeck: 0 };
  } catch (error) {
    console.warn("Failed to load best stats", error);
    return { runsStarted: 0, victories: 0, bossesDefeated: 0, deepestRegion: 0, longestDeck: 0 };
  }
}
function saveBestStats(stats) { localStorage.setItem(STORAGE_KEYS.best, JSON.stringify(stats)); }
function loadDiscoveredCards() { try { const raw = localStorage.getItem(STORAGE_KEYS.discovered); return raw ? JSON.parse(raw) : []; } catch (error) { console.warn("Failed to load discovered cards", error); return []; } }
function saveDiscoveredCards(cardIds) { localStorage.setItem(STORAGE_KEYS.discovered, JSON.stringify(unique(cardIds).sort())); }
function markDiscovered(cardIds) {
  let changed = false;
  for (const cardId of cardIds) {
    if (cardId && CARD_LOOKUP[cardId] && !app.discovered.has(cardId)) { app.discovered.add(cardId); changed = true; }
  }
  if (changed) saveDiscoveredCards([...app.discovered]);
}

function createDeckCard(run, cardId, overrides = {}) { return { uid: uid(run, "deck"), cardId, attackBuff: 0, healthBuff: 0, addedSigils: [], generated: false, ...overrides }; }
function getCardDefinition(cardId) { return CARD_LOOKUP[cardId] || OFFERING_CARD; }
function getDeckCardModel(deckCard) {
  const def = getCardDefinition(deckCard.cardId);
  return { ...def, uid: deckCard.uid, attack: def.attack + (deckCard.attackBuff || 0), health: Math.max(1, def.health + (deckCard.healthBuff || 0)), sigils: unique([...(def.sigils || []), ...(deckCard.addedSigils || [])]) };
}
function getUnitModel(unit) { return { id: unit.cardId, name: unit.name, costBlood: unit.costBlood || 0, costBones: unit.costBones || 0, attack: unit.attack, health: unit.maxHealth, currentHealth: unit.health, sigils: [...unit.sigils], tribe: unit.tribe, rare: unit.rare, artGlyph: unit.artGlyph, description: unit.description, owner: unit.owner }; }
function createUnitFromDeckCard(run, deckCard, side, lane) {
  const model = getDeckCardModel(deckCard);
  return { uid: uid(run, "unit"), owner: side, lane, side, deckCardUid: deckCard.uid, cardId: model.id, name: model.name, attack: model.attack, health: model.health, maxHealth: model.health, sigils: [...model.sigils], tribe: model.tribe, rare: model.rare, artGlyph: model.artGlyph, description: model.description, costBlood: model.costBlood, costBones: model.costBones, flags: { wardUsed: false, skitterDir: lane < 2 ? 1 : -1, sprouted: false }, turnsInPlay: 0 };
}
function createEnemyUnit(run, cardId, lane, extra = {}) {
  const def = getCardDefinition(cardId);
  return { uid: uid(run, "enemy"), owner: "enemy", lane, side: "enemy", deckCardUid: null, cardId: def.id, name: def.name, attack: def.attack + (extra.attackBuff || 0), health: def.health + (extra.healthBuff || 0), maxHealth: def.health + (extra.healthBuff || 0), sigils: [...def.sigils], tribe: def.tribe, rare: def.rare, artGlyph: def.artGlyph, description: def.description, costBlood: 0, costBones: 0, flags: { wardUsed: false, skitterDir: lane < 2 ? 1 : -1, sprouted: false }, turnsInPlay: 0, boss: Boolean(def.boss || extra.boss) };
}
function getEncounter(encounterId) { return ENCOUNTER_LOOKUP[encounterId]; }
function getEvent(eventId) { return EVENT_LOOKUP[eventId]; }
function getNode(run, nodeId) { return run.map.find((node) => node.id === nodeId) || null; }
function getNodeLabel(nodeType) { return NODE_LABELS[nodeType] || NODE_LABELS.battle; }
function getRegionStartNodeIds(map, regionIndex) { return map.filter((node) => node.region === regionIndex && node.depth === 0).map((node) => node.id); }
function pickPlayerCard(run, filterFn = null) { const candidates = PLAYER_CARDS.filter((entry) => (filterFn ? filterFn(entry) : true)); return weightedPick(run, candidates.map((entry) => ({ value: entry.id, weight: entry.group === run.starterDeckId ? 3 : 1 }))); }
function pickRewardCards(run, count) { const picks = []; while (picks.length < count) picks.push(pickPlayerCard(run, (entry) => !picks.includes(entry.id))); markDiscovered(picks); return picks; }
function pickItemChoices(run, count) { return shuffleWithState(run, ITEM_DEFS.map((entry) => entry.id)).slice(0, count); }
function pickEncounterId(run, regionIndex, nodeType) {
  if (nodeType === "boss") return ENCOUNTERS.find((entry) => entry.region === regionIndex && entry.tier === "boss").id;
  const tier = nodeType === "elite" ? "elite" : "battle";
  const pool = ENCOUNTERS.filter((entry) => entry.region === regionIndex && entry.tier === tier);
  return pool[randomInt(run, 0, pool.length)].id;
}
function pickEventId(run, nodeType) { const pool = EVENT_DEFS.filter((entry) => entry.nodeType === nodeType); return pool[randomInt(run, 0, pool.length)].id; }
function connectNodes(previousNodes, currentNodes, run) {
  for (const previous of previousNodes) {
    const sorted = [...currentNodes].sort((left, right) => Math.abs(left.y - previous.y) - Math.abs(right.y - previous.y));
    const desired = currentNodes.length > 2 && nextRandom(run) < 0.32 ? 2 : 1;
    previous.branchesTo = unique(sorted.slice(0, desired).map((node) => node.id));
  }
  for (const current of currentNodes) {
    if (!previousNodes.some((previous) => previous.branchesTo.includes(current.id)) && previousNodes.length) {
      const nearest = [...previousNodes].sort((left, right) => Math.abs(left.y - current.y) - Math.abs(right.y - current.y))[0];
      nearest.branchesTo = unique([...nearest.branchesTo, current.id]);
    }
  }
}
function buildMap(run) {
  const map = [];
  const tracks = [16, 33, 50, 67, 84];
  for (let regionIndex = 0; regionIndex < REGION_LAYOUTS.length; regionIndex += 1) {
    let previousNodes = [];
    for (let depth = 0; depth < REGION_LAYOUTS[regionIndex].length; depth += 1) {
      const types = REGION_LAYOUTS[regionIndex][depth];
      const x = 11 + depth * 16;
      const yChoices = shuffleWithState(run, tracks).slice(0, types.length).sort((left, right) => left - right);
      const currentNodes = types.map((type, index) => {
        const node = { id: `region-${regionIndex}-depth-${depth}-slot-${index}`, type, region: regionIndex, depth, x, y: yChoices[index], branchesTo: [], encounterId: ["battle","elite","boss"].includes(type) ? pickEncounterId(run, regionIndex, type) : null, eventId: ["campfire","trader","sigil-shrine","item-cache"].includes(type) ? pickEventId(run, type) : null, completed: false };
        map.push(node);
        return node;
      });
      if (previousNodes.length) connectNodes(previousNodes, currentNodes, run);
      previousNodes = currentNodes;
    }
  }
  return map;
}
function syncBattleMirror(run = app.run) {
  if (!run) return;
  if (run.battle) {
    run.hand = clone(run.battle.hand); run.discard = clone(run.battle.discard); run.board = clone(run.battle.board); run.queuedEnemyPlays = clone(run.battle.queuedEnemyPlays); run.bones = run.battle.bones; run.scale = run.battle.scale; run.log = clone(run.battle.log);
  } else {
    run.hand = []; run.discard = []; run.board = { player: [null, null, null, null], enemy: [null, null, null, null] }; run.queuedEnemyPlays = []; run.bones = 0; run.scale = 0; run.log = [];
  }
}
function createRun(starterId) {
  const starter = STARTER_LOOKUP[starterId];
  const seed = makeSeed();
  const run = { version: 1, seed, rngState: seed, uidCounter: 0, screen: "map-screen", starterDeckId: starterId, regionIndex: 0, nodeIndex: 0, map: [], availableNodeIds: [], selectedMapNodeId: null, deck: [], offeringDeck: Array.from({ length: 10 }, () => OFFERING_CARD.id), hand: [], discard: [], board: { player: [null, null, null, null], enemy: [null, null, null, null] }, queuedEnemyPlays: [], bones: 0, scale: 0, items: [], lives: 2, bossesDefeated: 0, bossFlags: {}, log: [], battle: null, flow: null, stats: { turns: 0, battlesWon: 0, nodesCleared: 0, cardsPlayed: 0, itemsUsed: 0, cardsAdded: 0 } };
  run.deck = starter.cards.map((cardId) => createDeckCard(run, cardId));
  run.map = buildMap(run);
  run.availableNodeIds = getRegionStartNodeIds(run.map, 0);
  run.selectedMapNodeId = run.availableNodeIds[0] || null;
  markDiscovered([...starter.cards, OFFERING_CARD.id]);
  const best = loadBestStats(); best.runsStarted += 1; best.longestDeck = Math.max(best.longestDeck, run.deck.length); saveBestStats(best);
  syncBattleMirror(run);
  return run;
}
function hydrateRun(run) {
  if (!run || run.version !== 1 || !Array.isArray(run.deck) || !Array.isArray(run.map)) return null;
  run.uidCounter = run.uidCounter || 0; run.items = Array.isArray(run.items) ? run.items : []; run.availableNodeIds = Array.isArray(run.availableNodeIds) && run.availableNodeIds.length ? run.availableNodeIds : getRegionStartNodeIds(run.map, run.regionIndex || 0); run.board = run.board || { player: [null, null, null, null], enemy: [null, null, null, null] }; run.log = Array.isArray(run.log) ? run.log : []; run.hand = Array.isArray(run.hand) ? run.hand : []; run.discard = Array.isArray(run.discard) ? run.discard : []; run.stats = run.stats || { turns: 0, battlesWon: 0, nodesCleared: 0, cardsPlayed: 0, itemsUsed: 0, cardsAdded: 0 };
  if (run.battle) {
    run.battle.board = run.battle.board || { player: [null, null, null, null], enemy: [null, null, null, null] };
    run.battle.log = Array.isArray(run.battle.log) ? run.battle.log : [];
    run.battle.hand = Array.isArray(run.battle.hand) ? run.battle.hand : [];
    run.battle.discard = Array.isArray(run.battle.discard) ? run.battle.discard : [];
    run.battle.drawPile = Array.isArray(run.battle.drawPile) ? run.battle.drawPile : [];
    run.battle.offeringPile = Array.isArray(run.battle.offeringPile) ? run.battle.offeringPile : [];
    run.battle.queuedEnemyPlays = Array.isArray(run.battle.queuedEnemyPlays) ? run.battle.queuedEnemyPlays : [];
  }
  if (run.screen === "battle-screen" && !run.battle) run.screen = "map-screen";
  if (run.screen === "flow-screen" && !run.flow) run.screen = "map-screen";
  syncBattleMirror(run);
  markDiscovered(run.deck.map((entry) => entry.cardId));
  return run;
}
function showToast(message) {
  const toast = el("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  if (app.toastTimer) clearTimeout(app.toastTimer);
  app.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}
function updateBestProgress() {
  if (!app.run) return;
  const best = loadBestStats();
  best.deepestRegion = Math.max(best.deepestRegion, (app.run.regionIndex || 0) + 1);
  best.bossesDefeated = Math.max(best.bossesDefeated, app.run.bossesDefeated || 0);
  best.longestDeck = Math.max(best.longestDeck, app.run.deck.length);
  saveBestStats(best);
}
function activeBattle() { return app.run ? app.run.battle : null; }
function hasSigil(unit, sigilId) { return Boolean(unit && unit.sigils && unit.sigils.includes(sigilId)); }
function battleBoard(side) { const battle = activeBattle(); return battle ? battle.board[side] : []; }
function findHandIndex(handUid) { const battle = activeBattle(); return battle ? battle.hand.findIndex((entry) => entry.uid === handUid) : -1; }
function countPlayerSigil(sigilId) { return battleBoard("player").filter((unit) => hasSigil(unit, sigilId)).length; }
function getAttackTargets(unit, lane) {
  if (hasSigil(unit, "cleave")) return unique([lane - 1, lane, lane + 1].filter((value) => value >= 0 && value < 4));
  if (hasSigil(unit, "bifurcated")) { const targets = [lane - 1, lane + 1].filter((value) => value >= 0 && value < 4); return targets.length ? targets : [lane]; }
  return [lane];
}
function sacrificeValue(unit) { return hasSigil(unit, "worthy") ? 3 : 1; }
function totalAvailableBlood() { return battleBoard("player").reduce((sum, unit) => sum + (unit ? sacrificeValue(unit) : 0), 0); }
function canPlayDeckCard(deckCard) { const battle = activeBattle(); if (!battle) return false; const model = getDeckCardModel(deckCard); return model.costBones <= battle.bones && model.costBlood <= totalAvailableBlood() && battle.board.player.some((slot) => !slot); }
function currentAttack(unit) { return Math.max(0, unit.attack); }
function addBattleLog(message) { const battle = activeBattle(); if (!battle) return; battle.log.push(message); battle.log = battle.log.slice(-18); syncBattleMirror(); }
function adjustScale(delta, sourceLabel = "") { const battle = activeBattle(); if (!battle) return; battle.scale = clamp(battle.scale + delta, -5, 5); if (delta !== 0 && sourceLabel) addBattleLog(`${sourceLabel} shifts the scale ${delta > 0 ? "+" : ""}${delta}.`); syncBattleMirror(); }
function killUnit(side, lane) {
  const battle = activeBattle(); if (!battle) return;
  const unit = battle.board[side][lane]; if (!unit) return;
  battle.board[side][lane] = null;
  battle.bones += 1 + countPlayerSigil("scavenger") + (hasSigil(unit, "bone-king") ? 3 : 0);
  if (side === "enemy") battle.enemyDeaths = (battle.enemyDeaths || 0) + 1; else battle.playerDeaths = (battle.playerDeaths || 0) + 1;
  addBattleLog(`${unit.name} is claimed by the table.`);
  syncBattleMirror();
}
function dealDamage(side, lane, amount) {
  const battle = activeBattle(); if (!battle) return false;
  const unit = battle.board[side][lane]; if (!unit || amount <= 0) return false;
  if (hasSigil(unit, "warded") && !unit.flags.wardUsed) { unit.flags.wardUsed = true; addBattleLog(`${unit.name} shrugs off the first blow.`); syncBattleMirror(); return false; }
  unit.health -= amount; if (unit.health <= 0) { killUnit(side, lane); return true; }
  syncBattleMirror(); return false;
}
function applyGuardianMovement(side, targetLane) {
  const battle = activeBattle(); if (!battle) return;
  const board = battle.board[side]; if (board[targetLane]) return;
  const candidates = board.map((unit, lane) => ({ unit, lane })).filter(({ unit, lane }) => unit && lane !== targetLane && hasSigil(unit, "guardian"));
  if (!candidates.length) return;
  candidates.sort((left, right) => Math.abs(left.lane - targetLane) - Math.abs(right.lane - targetLane));
  const chosen = candidates[0]; board[targetLane] = chosen.unit; board[chosen.lane] = null; chosen.unit.lane = targetLane; addBattleLog(`${chosen.unit.name} lunges to guard lane ${targetLane + 1}.`); syncBattleMirror();
}
function applyOnPlayEffects(unit) {
  if (!hasSigil(unit, "sentry")) return;
  const opposingSide = unit.owner === "player" ? "enemy" : "player";
  if (battleBoard(opposingSide)[unit.lane]) { addBattleLog(`${unit.name} peppers the opposite lane.`); dealDamage(opposingSide, unit.lane, 1); }
  else addBattleLog(`${unit.name} rattles, but finds no mark.`);
}
function resolvePlayCard(selection) {
  const battle = activeBattle(); if (!battle) return;
  const handIndex = findHandIndex(selection.handUid); if (handIndex < 0) return cancelSelections();
  const deckCard = battle.hand[handIndex]; const model = getDeckCardModel(deckCard);
  if (model.costBones > battle.bones) return showToast("Not enough bones.");
  if (battle.board.player[selection.targetLane]) return showToast("That lane is occupied.");
  battle.bones -= model.costBones;
  for (const lane of selection.lanes) {
    const unit = battle.board.player[lane]; if (!unit) continue;
    if (hasSigil(unit, "many-lives")) addBattleLog(`${unit.name} survives the sacrifice.`); else killUnit("player", lane);
  }
  battle.hand.splice(handIndex, 1);
  const unit = createUnitFromDeckCard(app.run, deckCard, "player", selection.targetLane);
  applyGuardianMovement("enemy", selection.targetLane);
  battle.board.player[selection.targetLane] = unit;
  applyOnPlayEffects(unit);
  app.run.stats.cardsPlayed += 1;
  battle.pendingHandUid = null; battle.selection = null; app.inspect = { type: "unit", side: "player", lane: selection.targetLane };
  addBattleLog(`You play ${unit.name} into lane ${selection.targetLane + 1}.`);
  syncBattleMirror(); renderApp();
}
function beginPlayCard(handUid, targetLane) {
  const battle = activeBattle(); if (!battle) return;
  const handIndex = findHandIndex(handUid); if (handIndex < 0) return;
  const model = getDeckCardModel(battle.hand[handIndex]);
  if (battle.board.player[targetLane]) return showToast("Choose an empty lane.");
  if (model.costBones > battle.bones) return showToast("Not enough bones.");
  if (model.costBlood > totalAvailableBlood()) return showToast("You need more blood on the board.");
  if (model.costBlood > 0) { battle.selection = { type: "sacrifice", handUid, targetLane, needed: model.costBlood, lanes: [] }; battle.pendingHandUid = handUid; return renderApp(); }
  resolvePlayCard({ type: "sacrifice", handUid, targetLane, needed: 0, lanes: [] });
}
function cancelSelections() { const battle = activeBattle(); if (!battle) return; battle.selection = null; battle.pendingHandUid = null; battle.itemTargeting = null; renderApp(); }
function toggleSacrificeLane(lane) {
  const battle = activeBattle(); if (!battle || !battle.selection || battle.selection.type !== "sacrifice") return;
  battle.selection.lanes = battle.selection.lanes.includes(lane) ? battle.selection.lanes.filter((value) => value !== lane) : [...battle.selection.lanes, lane];
  const total = battle.selection.lanes.reduce((sum, selectedLane) => { const unit = battle.board.player[selectedLane]; return sum + (unit ? sacrificeValue(unit) : 0); }, 0);
  renderApp();
  if (total >= battle.selection.needed) resolvePlayCard({ type: "sacrifice", handUid: battle.selection.handUid, targetLane: battle.selection.targetLane, needed: battle.selection.needed, lanes: [...battle.selection.lanes] });
}
function resetRoundFlags() { const battle = activeBattle(); if (!battle) return; for (const side of ["player", "enemy"]) for (const unit of battle.board[side]) if (unit) unit.turnsInPlay += 1; }
function resolveStrike(side, lane, targetLane) {
  const battle = activeBattle(); if (!battle) return;
  const attacker = battle.board[side][lane]; if (!attacker) return;
  const power = currentAttack(attacker); if (power <= 0) return;
  const defendingSide = side === "player" ? "enemy" : "player";
  const target = battle.board[defendingSide][targetLane];
  if (target && !hasSigil(attacker, "airborne")) {
    addBattleLog(`${attacker.name} strikes ${target.name}.`);
    const died = dealDamage(defendingSide, targetLane, power);
    if (!died && target && hasSigil(target, "thorn") && battle.board[side][lane]) { addBattleLog(`${target.name} throws pain back through the lane.`); dealDamage(side, lane, 1); }
  } else adjustScale(side === "player" ? power : -power, attacker.name);
  if (hasSigil(attacker, "brittle") && battle.board[side][lane]) killUnit(side, lane);
}
function runAttackSide(side) {
  const battle = activeBattle(); if (!battle) return false;
  for (let lane = 0; lane < 4; lane += 1) {
    const unit = battle.board[side][lane]; if (!unit) continue;
    for (const targetLane of getAttackTargets(unit, lane)) {
      if (!battle.board[side][lane]) break;
      resolveStrike(side, lane, targetLane);
      if (Math.abs(battle.scale) >= 5) return true;
    }
  }
  return false;
}
function transformSprouts() {
  const battle = activeBattle(); if (!battle) return;
  for (const side of ["player", "enemy"]) {
    for (let lane = 0; lane < 4; lane += 1) {
      const unit = battle.board[side][lane];
      if (!unit || !hasSigil(unit, "sprout") || unit.flags.sprouted || unit.turnsInPlay < 1) continue;
      const nextCardId = getCardDefinition(unit.cardId).sproutsTo; if (!nextCardId) continue;
      unit.flags.sprouted = true;
      const replacement = side === "player" ? createUnitFromDeckCard(app.run, createDeckCard(app.run, nextCardId), side, lane) : createEnemyUnit(app.run, nextCardId, lane);
      replacement.turnsInPlay = unit.turnsInPlay; battle.board[side][lane] = replacement; addBattleLog(`${unit.name} unfurls into ${replacement.name}.`); markDiscovered([replacement.cardId]);
    }
  }
  syncBattleMirror();
}
function moveSkitterUnits() {
  const battle = activeBattle(); if (!battle) return;
  for (const side of ["player", "enemy"]) {
    const board = battle.board[side];
    const movers = board.map((unit, lane) => ({ unit, lane })).filter(({ unit }) => unit && hasSigil(unit, "skitter"));
    for (const mover of movers) {
      const unit = board[mover.lane]; if (!unit) continue;
      const direction = unit.flags.skitterDir || 1; let targetLane = mover.lane + direction;
      if (targetLane < 0 || targetLane > 3 || board[targetLane]) { unit.flags.skitterDir = direction * -1; targetLane = mover.lane + unit.flags.skitterDir; }
      if (targetLane >= 0 && targetLane < 4 && !board[targetLane]) { board[targetLane] = unit; board[mover.lane] = null; unit.lane = targetLane; addBattleLog(`${unit.name} skitters into lane ${targetLane + 1}.`); }
    }
  }
  syncBattleMirror();
}
function maybeTriggerBossPhase() {
  const battle = activeBattle(); if (!battle || battle.encounterTier !== "boss" || battle.bossPhase > 1) return;
  const occupiedPlayerLanes = battle.board.player.filter(Boolean).length;
  if (battle.encounterId === "boss-wicker-judge" && occupiedPlayerLanes >= 3) { battle.bossPhase = 2; addBattleLog("The Wicker Judge demands a fuller tithe."); for (let lane = 0; lane < 4; lane += 1) if (!battle.board.enemy[lane]) battle.board.enemy[lane] = createEnemyUnit(app.run, "straw-bailiff", lane); return syncBattleMirror(); }
  if (battle.encounterId === "boss-candle-matron" && (battle.enemyDeaths || 0) >= 3) { battle.bossPhase = 2; addBattleLog("The Candle Matron draws strength from extinguished wax."); for (let lane = 0; lane < 4; lane += 1) if (!battle.board.enemy[lane]) battle.board.enemy[lane] = createEnemyUnit(app.run, "wax-sister", lane); return syncBattleMirror(); }
  if (battle.encounterId === "boss-buried-king" && (battle.scale >= 2 || occupiedPlayerLanes >= 3)) { battle.bossPhase = 2; addBattleLog("The Buried King commands the graves to open."); for (let lane = 0; lane < 4; lane += 1) if (!battle.board.enemy[lane]) battle.board.enemy[lane] = createEnemyUnit(app.run, "tomb-warden", lane); syncBattleMirror(); }
}
function deployEnemyWave() {
  const battle = activeBattle(); if (!battle) return;
  const wave = battle.waves[battle.queueIndex]; if (!wave) { battle.queuedEnemyPlays = []; return syncBattleMirror(); }
  addBattleLog("The table reveals the next enemy movement.");
  for (const placement of wave) {
    let lane = placement.lane;
    if (battle.board.enemy[lane]) { const openLane = [0,1,2,3].find((candidate) => !battle.board.enemy[candidate]); if (openLane == null) continue; lane = openLane; }
    applyGuardianMovement("player", lane);
    const unit = createEnemyUnit(app.run, placement.cardId, lane, placement); battle.board.enemy[lane] = unit; applyOnPlayEffects(unit); markDiscovered([placement.cardId]);
  }
  battle.queueIndex += 1; battle.queuedEnemyPlays = clone(battle.waves[battle.queueIndex] || []); markDiscovered(battle.queuedEnemyPlays.map((placement) => placement.cardId)); syncBattleMirror();
}
function noEnemyPressureLeft() { const battle = activeBattle(); return Boolean(battle) && battle.board.enemy.every((slot) => !slot) && battle.queueIndex >= battle.waves.length; }
function noPlayerOptionsLeft() { const battle = activeBattle(); return Boolean(battle) && battle.board.player.every((slot) => !slot) && battle.hand.length === 0 && battle.drawPile.length === 0 && battle.offeringPile.length === 0 && app.run.items.length === 0; }
function drawCards(source, count, ignoreTurnLimit = false) {
  const battle = activeBattle(); if (!battle) return;
  if (!ignoreTurnLimit && battle.drawnThisTurn) return showToast("You may only draw once each turn.");
  let drawsMade = 0;
  for (let index = 0; index < count; index += 1) {
    const pile = source === "main" ? battle.drawPile : battle.offeringPile; if (!pile.length) continue;
    const drawn = pile.shift(); battle.hand.push(drawn); drawsMade += 1; markDiscovered([drawn.cardId]);
  }
  if (!ignoreTurnLimit && drawsMade > 0) battle.drawnThisTurn = true;
  syncBattleMirror(); renderApp();
}
function buildBattleState(node, encounter) {
  return {
    nodeId: node.id, encounterId: encounter.id, encounterName: encounter.name, encounterSubtitle: encounter.subtitle, encounterTier: encounter.tier,
    turn: 1, queueIndex: 0, waves: clone(encounter.waves), queuedEnemyPlays: clone(encounter.waves[0] || []), board: { player: [null,null,null,null], enemy: [null,null,null,null] },
    hand: [], drawPile: shuffleWithState(app.run, clone(app.run.deck)), offeringPile: shuffleWithState(app.run, Array.from({ length: 10 }, () => createDeckCard(app.run, OFFERING_CARD.id, { generated: true }))), discard: [], bones: 0, scale: 0,
    log: [`${encounter.name} begins.`], drawnThisTurn: false, pendingHandUid: null, selection: null, itemTargeting: null, bossPhase: 1, enemyDeaths: 0, playerDeaths: 0,
  };
}
function buildCardRewardFlow(node, options) { return { mode: "card-reward", nodeId: node.id, kicker: options.kicker, title: options.title, description: options.description, cards: pickRewardCards(app.run, 3), next: options.next }; }
function handleBattleOutcome(result) {
  const battle = activeBattle(); if (!battle) return;
  const node = getNode(app.run, battle.nodeId); app.run.battle = null; syncBattleMirror();
  if (result === "win") {
    app.run.stats.battlesWon += 1;
    if (node.type === "boss") { app.run.bossesDefeated += 1; app.run.bossFlags[node.encounterId] = { defeated: true }; return completeNode(node.id); }
    if (node.type === "elite") { app.run.flow = buildCardRewardFlow(node, { kicker: "Elite Reward", title: "Claim A Stronger Survivor", description: "Choose a card, then take an item.", next: { type: "item-reward", nodeId: node.id } }); showScreen("flow-screen"); return renderApp(); }
    app.run.flow = buildCardRewardFlow(node, { kicker: "Battle Reward", title: "Choose A Card", description: "One survivor joins your ledger.", next: { type: "complete-node", nodeId: node.id } }); showScreen("flow-screen"); return renderApp();
  }
  app.run.lives -= 1;
  if (app.run.lives <= 0) return triggerGameOver(`The ${battle.encounterName.toLowerCase()} ends with the last candle dark.`);
  showToast("A candle gutters out. The encounter begins again.");
  startEncounter(node, true);
}
function endTurn() {
  const battle = activeBattle(); if (!battle) return;
  if (battle.selection || battle.itemTargeting) return showToast("Finish or cancel the current choice first.");
  app.run.stats.turns += 1; addBattleLog(`Turn ${battle.turn} resolves.`);
  if (runAttackSide("player") || battle.scale >= 5) return handleBattleOutcome("win");
  if (runAttackSide("enemy") || battle.scale <= -5) return handleBattleOutcome("loss");
  resetRoundFlags(); transformSprouts(); moveSkitterUnits(); maybeTriggerBossPhase(); deployEnemyWave();
  if (noEnemyPressureLeft()) { addBattleLog("No further pressure remains on the enemy side."); return handleBattleOutcome("win"); }
  if (noPlayerOptionsLeft() && battle.board.enemy.some(Boolean)) addBattleLog("Your side of the table is spent.");
  battle.pendingHandUid = null; battle.selection = null; battle.itemTargeting = null; battle.turn += 1; battle.drawnThisTurn = false; syncBattleMirror(); renderApp();
}
function startEncounter(node, retry = false) {
  const encounter = getEncounter(node.encounterId); if (!encounter) return;
  app.pauseVisible = false; app.inspect = { type: "encounter" }; app.run.battle = buildBattleState(node, encounter); drawCards("main", 3, true); drawCards("offering", 1, true); app.run.screen = "battle-screen"; markDiscovered((encounter.waves[0] || []).map((placement) => placement.cardId)); if (retry) addBattleLog(`The ${encounter.name.toLowerCase()} re-forms before you.`); showScreen("battle-screen"); renderApp();
}
function openItemRewardFlow(nodeId, title = "Choose An Item", description = "Take one tool and move on.") { app.run.flow = { mode: "item-reward", nodeId, kicker: "Spoils", title, description, items: pickItemChoices(app.run, 3), next: { type: "complete-node", nodeId } }; showScreen("flow-screen"); renderApp(); }
function addCardToDeck(cardId) { app.run.deck.push(createDeckCard(app.run, cardId)); app.run.stats.cardsAdded += 1; markDiscovered([cardId]); updateBestProgress(); }
function addItemToRun(itemId) { if (app.run.items.length >= 3) app.run.items.shift(); app.run.items.push(itemId); }
function removeDeckCardByUid(deckUid) { app.run.deck = app.run.deck.filter((entry) => entry.uid !== deckUid); }
function modifyDeckCard(deckUid, change) { const deckCard = app.run.deck.find((entry) => entry.uid === deckUid); if (!deckCard) return; if (change.attack) deckCard.attackBuff += change.attack; if (change.health) deckCard.healthBuff += change.health; if (change.sigil && !deckCard.addedSigils.includes(change.sigil)) deckCard.addedSigils.push(change.sigil); }
function completeNode(nodeId) {
  const node = getNode(app.run, nodeId); if (!node) return;
  node.completed = true; app.run.nodeIndex = node.depth; app.run.stats.nodesCleared += 1; app.run.flow = null; app.run.selectedMapNodeId = null; app.selectedMapNodeId = null;
  if (node.type === "boss") {
    if (app.run.regionIndex >= REGION_INFO.length - 1) return triggerVictory("The third seal breaks and the table finally falls quiet.");
    app.run.regionIndex += 1; app.run.availableNodeIds = getRegionStartNodeIds(app.run.map, app.run.regionIndex); showToast(`${REGION_INFO[app.run.regionIndex].name} opens ahead.`);
  } else app.run.availableNodeIds = [...node.branchesTo];
  updateBestProgress(); showScreen("map-screen"); renderApp();
}
function finalizeFlowAction(action) { if (!action) return; if (action.type === "complete-node") return completeNode(action.nodeId); if (action.type === "item-reward") openItemRewardFlow(action.nodeId); }
function resolveFlowAction(action) {
  if (!action || !app.run || !app.run.flow) return;
  switch (action.type) {
    case "take-reward-card": addCardToDeck(action.cardId); return finalizeFlowAction(app.run.flow.next);
    case "take-item": addItemToRun(action.itemId); return finalizeFlowAction(app.run.flow.next);
    case "campfire-buff": modifyDeckCard(action.deckUid, { [action.stat]: action.amount }); return completeNode(action.nodeId);
    case "purge-card": removeDeckCardByUid(action.deckUid); return completeNode(action.nodeId);
    case "shrine-select-sigil": app.run.flow = { mode: "shrine-apply", nodeId: action.nodeId, kicker: "Sigil Shrine", title: `Bearer Of ${SIGIL_LOOKUP[action.sigilId].name}`, description: "Choose a creature to carry the mark.", chosenSigil: action.sigilId, deckTargets: app.run.deck.filter((entry) => getDeckCardModel(entry).cardId !== OFFERING_CARD.id) }; showScreen("flow-screen"); return renderApp();
    case "shrine-apply": modifyDeckCard(action.deckUid, { sigil: action.sigilId }); return completeNode(action.nodeId);
    case "leave": return completeNode(action.nodeId);
    default: return;
  }
}
function openEventFlow(node) {
  const ev = getEvent(node.eventId); if (!ev) return completeNode(node.id);
  if (ev.id === "campfire-blades" || ev.id === "campfire-hide") app.run.flow = { mode: "campfire", nodeId: node.id, kicker: "Campfire", title: ev.title, description: ev.description, deckTargets: app.run.deck.filter((entry) => getDeckCardModel(entry).cardId !== OFFERING_CARD.id).slice(0, 8), stat: ev.stat, amount: ev.amount, buttons: [{ label: "Leave", action: { type: "leave", nodeId: node.id } }] };
  else if (ev.id === "trader-barter") app.run.flow = { mode: "card-reward", nodeId: node.id, kicker: "Trader", title: ev.title, description: ev.description, cards: pickRewardCards(app.run, 3), next: { type: "complete-node", nodeId: node.id } };
  else if (ev.id === "trader-purge") app.run.flow = { mode: "purge", nodeId: node.id, kicker: "Trader", title: ev.title, description: ev.description, deckTargets: app.run.deck.filter((entry) => getDeckCardModel(entry).cardId !== OFFERING_CARD.id), buttons: [{ label: "Keep Everything", action: { type: "leave", nodeId: node.id } }] };
  else if (ev.id === "shrine-sky" || ev.id === "shrine-grave") app.run.flow = { mode: "shrine-select", nodeId: node.id, kicker: "Sigil Shrine", title: ev.title, description: ev.description, sigils: shuffleWithState(app.run, SIGIL_POOLS[ev.pool]).slice(0, 3), buttons: [{ label: "Leave", action: { type: "leave", nodeId: node.id } }] };
  else if (ev.id === "cache-tools" || ev.id === "cache-relics") app.run.flow = { mode: "item-reward", nodeId: node.id, kicker: "Item Cache", title: ev.title, description: ev.description, items: pickItemChoices(app.run, 3), next: { type: "complete-node", nodeId: node.id } };
  showScreen("flow-screen"); renderApp();
}
function travelToNode(nodeId) { const node = getNode(app.run, nodeId); if (!node || !app.run.availableNodeIds.includes(nodeId)) return; app.selectedMapNodeId = nodeId; if (["battle","elite","boss"].includes(node.type)) return startEncounter(node); openEventFlow(node); }
function consumeItem(index) { app.run.items.splice(index, 1); }
function resolveItemEffect(itemId, target) {
  const battle = activeBattle(); if (!battle) return false;
  if (itemId === "amber-candle") { drawCards("main", 2, true); addBattleLog("The amber candle spills two extra draws."); return true; }
  if (itemId === "grave-salt") { battle.bones += 4; addBattleLog("Grave salt cracks across the table."); syncBattleMirror(); return true; }
  if (itemId === "ash-knife") { if (!target || target.side !== "enemy" || !battle.board.enemy[target.lane]) return showToast("Choose a living enemy."), false; addBattleLog("The ash knife finds a weak seam."); dealDamage("enemy", target.lane, 1); return true; }
  if (itemId === "smoke-phial") { battle.hand.push(createDeckCard(app.run, OFFERING_CARD.id, { generated: true })); battle.hand.push(createDeckCard(app.run, OFFERING_CARD.id, { generated: true })); addBattleLog("Smoke thickens into two more offerings."); syncBattleMirror(); return true; }
  if (itemId === "ember-oil") { if (!target || target.side !== "player" || !battle.board.player[target.lane]) return showToast("Choose one of your creatures."), false; const unit = battle.board.player[target.lane]; unit.attack += 1; if (!unit.sigils.includes("warded")) unit.sigils.push("warded"); unit.flags.wardUsed = false; addBattleLog(`${unit.name} drinks ember oil and glows hotter.`); syncBattleMirror(); return true; }
  if (itemId === "balance-weight") { adjustScale(2, "The brass weight"); return true; }
  return false;
}
function useItem(index) {
  const battle = activeBattle(); if (!battle) return;
  const itemId = app.run.items[index]; const itemDef = ITEM_LOOKUP[itemId]; if (!itemDef) return;
  if (itemDef.target === "none") { const used = resolveItemEffect(itemId, null); if (used) { consumeItem(index); app.run.stats.itemsUsed += 1; renderApp(); } return; }
  battle.itemTargeting = { index, target: itemDef.target, itemId }; renderApp();
}
function triggerGameOver(copy) {
  const run = app.run; const best = loadBestStats(); best.bossesDefeated = Math.max(best.bossesDefeated, run ? run.bossesDefeated : 0); best.longestDeck = Math.max(best.longestDeck, run ? run.deck.length : 0); saveBestStats(best);
  app.ending = { result: "gameover", copy, stats: { bossesDefeated: run ? run.bossesDefeated : 0, cardsInDeck: run ? run.deck.length : 0, battlesWon: run ? run.stats.battlesWon : 0, turns: run ? run.stats.turns : 0 } };
  app.run = null; clearPersistedRun(); showScreen("gameover-screen"); renderApp();
}
function triggerVictory(copy) {
  const run = app.run; const best = loadBestStats(); best.victories += 1; best.bossesDefeated = Math.max(best.bossesDefeated, run ? run.bossesDefeated : 0); best.deepestRegion = 3; best.longestDeck = Math.max(best.longestDeck, run ? run.deck.length : 0); saveBestStats(best);
  app.ending = { result: "victory", copy, stats: { bossesDefeated: run ? run.bossesDefeated : 0, cardsInDeck: run ? run.deck.length : 0, battlesWon: run ? run.stats.battlesWon : 0, turns: run ? run.stats.turns : 0 } };
  app.run = null; clearPersistedRun(); showScreen("victory-screen"); renderApp();
}
function showScreen(screenId) { app.visibleScreen = screenId; if (app.run && PERSISTED_SCREENS.has(screenId)) app.run.screen = screenId; if (screenId === "title-screen") app.pauseVisible = false; }
function openDeckbook(returnScreen, tab = "current") { app.deckbookReturnScreen = returnScreen; app.deckbookTab = tab; showScreen("deckbook-screen"); renderApp(); }
function closeDeckbook() { showScreen(app.deckbookReturnScreen || "title-screen"); renderApp(); }
function saveAndQuitToTitle() { if (app.run) savePersistedRun(app.run); app.pauseVisible = false; app.run = null; app.inspect = null; app.selectedMapNodeId = null; showScreen("title-screen"); renderApp(); }
function cardBonusText(model) {
  const tags = [];
  if (model.rare) tags.push("Rare");
  if (model.currentHealth != null && model.currentHealth !== model.health) tags.push(`${model.currentHealth}/${model.health}`);
  if (model.count) tags.push(`x${model.count}`);
  return tags.join("  ");
}
function createCardElement(model, options = {}) {
  const element = document.createElement(options.tagName || "div");
  element.className = ["ash-card", options.enemy ? "enemy-card" : "", options.compact ? "compact" : "", options.queue ? "queue-card" : "", options.hand ? "hand-card" : "", options.cantPlay ? "cant-play" : "", options.extraClass || ""].filter(Boolean).join(" ");
  if (options.tagName === "button") element.type = "button";
  if (options.selected) element.classList.add("is-selected");
  const sigilText = (model.sigils || []).slice(0, options.compact ? 2 : 4).map((sigilId) => `<span class="sigil-pill">${SIGIL_LOOKUP[sigilId] ? SIGIL_LOOKUP[sigilId].name : titleCase(sigilId)}</span>`).join("");
  const costBadges = [];
  if (model.costBlood) costBadges.push(`<span class="cost-badge blood">${model.costBlood} Blood</span>`);
  if (model.costBones) costBadges.push(`<span class="cost-badge bones">${model.costBones} Bones</span>`);
  element.innerHTML = `
    <div class="card-top">
      <div>
        <div class="card-name">${model.name}</div>
        <div class="card-costs">${costBadges.join("")}</div>
      </div>
      <div class="card-glyph">${model.artGlyph || "?"}</div>
    </div>
    <div class="card-text">${model.description || ""}</div>
    <div class="card-sigils">${sigilText || '<span class="sigil-pill">Plain</span>'}</div>
    <div class="card-bottom">
      <div class="card-stats">
        <span class="stat-badge">ATK ${model.attack}</span>
        <span class="stat-badge">HP ${model.currentHealth != null ? model.currentHealth : model.health}</span>
      </div>
      <div class="bonus-badge">${cardBonusText(model)}</div>
    </div>
  `;
  if (options.onClick) element.addEventListener("click", options.onClick);
  if (options.onPointerDown) element.addEventListener("pointerdown", options.onPointerDown);
  if (options.inspectData) element.addEventListener("mouseenter", () => { app.inspect = options.inspectData; if (app.visibleScreen === "battle-screen") renderInspectPanel(); });
  return element;
}
function createInfoChoice(title, description, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "item-btn flow-choice";
  button.innerHTML = `<div class="item-name">${title}</div><div class="item-copy">${description}</div>`;
  button.addEventListener("click", onClick);
  return button;
}
function renderTitle() {
  const best = loadBestStats();
  el("title-best-stats").innerHTML = `Victories: ${best.victories}<br>Deepest Region: ${best.deepestRegion}<br>Bosses Broken: ${best.bossesDefeated}`;
  el("title-discovery-stats").innerHTML = `${app.discovered.size} / ${Object.keys(CARD_LOOKUP).length} pages found<br>Longest Deck: ${best.longestDeck}<br>Runs Started: ${best.runsStarted}`;
  el("continue-run-btn").disabled = !hasPersistedRun();
}
function renderStarterScreen() {
  const starterDecks = el("starter-decks"); starterDecks.replaceChildren();
  for (const starter of STARTER_DECKS) {
    const article = document.createElement("article");
    article.className = `panel starter-card${starter.id === app.selectedStarterId ? " is-selected" : ""}`;
    article.innerHTML = `<div class="section-label">${starter.style}</div><h3>${starter.name}</h3><p class="detail-copy">${starter.summary}</p><div class="detail-list">${starter.chips.map((chip) => `<span class="detail-chip">${chip}</span>`).join("")}</div>`;
    article.addEventListener("click", () => { app.selectedStarterId = starter.id; renderStarterScreen(); });
    starterDecks.append(article);
  }
  const starter = STARTER_LOOKUP[app.selectedStarterId];
  const detail = el("starter-detail");
  detail.innerHTML = `<div class="section-label">${starter.style}</div><h3>${starter.name}</h3><p class="detail-copy">${starter.description}</p><div class="detail-list">${starter.chips.map((chip) => `<span class="detail-chip">${chip}</span>`).join("")}</div>`;
  const previewWrap = document.createElement("div"); previewWrap.className = "detail-preview"; starter.preview.forEach((cardId) => previewWrap.append(createCardElement(getCardDefinition(cardId), { compact: true }))); detail.append(previewWrap);
}
function renderMapDetail() {
  const panel = el("map-detail");
  if (!app.run) { panel.innerHTML = ""; return; }
  const selectedId = app.selectedMapNodeId || app.run.selectedMapNodeId || app.run.availableNodeIds[0];
  const node = getNode(app.run, selectedId);
  if (!node) { panel.innerHTML = `<div class="section-label">Route Detail</div><h3>Pick A Node</h3><p class="detail-copy">Study the branches, then commit to a path.</p>`; return; }
  const label = getNodeLabel(node.type);
  panel.innerHTML = `<div class="section-label">${REGION_INFO[node.region].kicker}</div><h3>${label.name}</h3><p class="detail-copy">${label.copy}</p><div class="detail-list"><span class="detail-chip">Depth ${node.depth + 1}</span><span class="detail-chip">${node.completed ? "Cleared" : app.run.availableNodeIds.includes(node.id) ? "Reachable" : "Locked"}</span></div>`;
  if (app.run.availableNodeIds.includes(node.id)) {
    const button = document.createElement("button"); button.type = "button"; button.className = "ash-btn ash-btn-primary"; button.textContent = "Travel"; button.addEventListener("click", () => travelToNode(node.id)); panel.append(button);
  }
}
function renderMapScreen() {
  if (!app.run) return;
  const region = REGION_INFO[app.run.regionIndex];
  el("map-region-kicker").textContent = region.kicker; el("map-region-title").textContent = region.name; el("map-lives").textContent = String(app.run.lives); el("map-deck-count").textContent = String(app.run.deck.length); el("map-item-count").textContent = String(app.run.items.length); el("map-boss-count").textContent = String(app.run.bossesDefeated);
  const stage = el("map-stage"); stage.replaceChildren();
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 100 100"); svg.classList.add("map-lines");
  const currentRegionNodes = app.run.map.filter((node) => node.region === app.run.regionIndex);
  for (const node of currentRegionNodes) {
    for (const branchId of node.branchesTo) {
      const target = getNode(app.run, branchId); if (!target || target.region !== app.run.regionIndex) continue;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(node.x)); line.setAttribute("y1", String(node.y)); line.setAttribute("x2", String(target.x)); line.setAttribute("y2", String(target.y)); line.setAttribute("stroke", node.completed ? "rgba(190, 219, 155, 0.48)" : "rgba(223, 191, 134, 0.22)"); line.setAttribute("stroke-width", "0.7"); svg.append(line);
    }
  }
  stage.append(svg);
  currentRegionNodes.forEach((node) => {
    const label = getNodeLabel(node.type); const button = document.createElement("button"); button.type = "button";
    button.className = ["map-node", node.completed ? "complete" : "", app.run.availableNodeIds.includes(node.id) ? "available" : "", !node.completed && !app.run.availableNodeIds.includes(node.id) ? "locked" : "", node.type === "boss" ? "boss" : "", app.selectedMapNodeId === node.id ? "is-selected" : ""].filter(Boolean).join(" ");
    button.style.left = `${node.x}%`; button.style.top = `${node.y}%`; button.innerHTML = `<div class="map-node-icon">${label.icon}</div><div class="map-node-name">${label.name}</div>`;
    button.addEventListener("click", () => { app.selectedMapNodeId = node.id; app.run.selectedMapNodeId = node.id; renderMapScreen(); });
    stage.append(button);
  });
  renderMapDetail();
}
function renderScaleTrack() {
  const track = el("scale-track"); track.replaceChildren(); const battle = activeBattle(); if (!battle) return;
  for (let index = -5; index <= 5; index += 1) { const step = document.createElement("div"); step.className = "scale-step"; if (index < 0) step.classList.add("enemy-side"); if (index > 0) step.classList.add("player-side"); if (index === 0) step.classList.add("is-center"); if (index === battle.scale) step.classList.add("is-active"); track.append(step); }
}
function createLaneSlot(side, lane, unit) {
  const slot = document.createElement("div"); slot.className = "battle-slot"; slot.dataset.side = side; slot.dataset.lane = String(lane); slot.innerHTML = `<div class="battle-slot-label">Lane ${lane + 1}</div>`;
  const battle = activeBattle();
  const selectableForSacrifice = Boolean(side === "player" && battle && battle.selection && battle.selection.type === "sacrifice" && unit);
  const isItemTarget = Boolean(battle && battle.itemTargeting && ((battle.itemTargeting.target === "enemy" && side === "enemy" && unit) || (battle.itemTargeting.target === "player" && side === "player" && unit)));
  if (selectableForSacrifice || isItemTarget || (!unit && side === "player" && battle && battle.pendingHandUid)) slot.classList.add("selectable");
  if (battle && battle.selection && battle.selection.lanes && battle.selection.lanes.includes(lane) && side === "player") slot.classList.add("is-targeted");
  slot.addEventListener("click", () => handleLaneClick(side, lane));
  if (unit) slot.append(createCardElement(getUnitModel(unit), { enemy: side === "enemy", inspectData: { type: "unit", side, lane } }));
  return slot;
}
function renderBattleRows() {
  const battle = activeBattle(); if (!battle) return;
  const enemyRow = el("enemy-row"); const playerRow = el("player-row"); enemyRow.replaceChildren(); playerRow.replaceChildren();
  for (let lane = 0; lane < 4; lane += 1) { enemyRow.append(createLaneSlot("enemy", lane, battle.board.enemy[lane])); playerRow.append(createLaneSlot("player", lane, battle.board.player[lane])); }
  const queueRow = el("enemy-queue"); queueRow.replaceChildren();
  if (!battle.queuedEnemyPlays.length) { const empty = document.createElement("div"); empty.className = "empty-state"; empty.textContent = "No further telegraphs."; queueRow.append(empty); }
  else battle.queuedEnemyPlays.forEach((placement) => queueRow.append(createCardElement(getCardDefinition(placement.cardId), { enemy: true, compact: true, queue: true, inspectData: { type: "queue", cardId: placement.cardId } })));
}
function handleHandTap(handUid) { const battle = activeBattle(); if (!battle) return; battle.pendingHandUid = battle.pendingHandUid === handUid ? null : handUid; renderApp(); }
function beginCardDrag(event, handUid) {
  if (event.button !== 0) return; const battle = activeBattle(); if (!battle) return;
  const handIndex = findHandIndex(handUid); if (handIndex < 0) return;
  const deckCard = battle.hand[handIndex]; const dragGhost = el("drag-card"); dragGhost.replaceChildren(createCardElement(getDeckCardModel(deckCard), { hand: true, tagName: "div" })); dragGhost.classList.remove("hidden"); app.drag = { handUid, startX: event.clientX, startY: event.clientY, moved: false }; moveDragCard(event);
}
function moveDragCard(event) {
  if (!app.drag) return;
  const dragGhost = el("drag-card"); app.drag.moved = app.drag.moved || Math.abs(event.clientX - app.drag.startX) > 5 || Math.abs(event.clientY - app.drag.startY) > 5; dragGhost.style.transform = `translate(${event.clientX - 70}px, ${event.clientY - 80}px)`;
}
function finishCardDrag(event) {
  if (!app.drag) return;
  const current = app.drag; el("drag-card").classList.add("hidden"); el("drag-card").style.transform = "translate(-9999px, -9999px)";
  const hovered = document.elementFromPoint(event.clientX, event.clientY); const slot = hovered ? hovered.closest(".battle-slot") : null;
  if (slot) { const side = slot.dataset.side; const lane = Number(slot.dataset.lane); if (side === "player") beginPlayCard(current.handUid, lane); }
  app.drag = null;
}
function renderHand() {
  const handRow = el("hand-row"); handRow.replaceChildren(); const battle = activeBattle(); if (!battle) return;
  battle.hand.forEach((deckCard) => handRow.append(createCardElement(getDeckCardModel(deckCard), { hand: true, tagName: "button", cantPlay: !canPlayDeckCard(deckCard), selected: battle.pendingHandUid === deckCard.uid, onClick: () => handleHandTap(deckCard.uid), onPointerDown: (event) => beginCardDrag(event, deckCard.uid) })));
  if (!battle.hand.length) { const empty = document.createElement("div"); empty.className = "empty-state"; empty.textContent = "Your hand is empty."; handRow.append(empty); }
}
function renderItems() {
  const itemBar = el("item-bar"); itemBar.replaceChildren();
  if (!app.run || !app.run.items.length) { const empty = document.createElement("div"); empty.className = "empty-state"; empty.textContent = "No items carried."; itemBar.append(empty); return; }
  const battle = activeBattle();
  app.run.items.forEach((itemId, index) => {
    const current = ITEM_LOOKUP[itemId]; const button = document.createElement("button"); button.type = "button"; button.className = `item-btn${battle && battle.itemTargeting && battle.itemTargeting.index === index ? " is-targeting" : ""}`;
    button.innerHTML = `<div class="item-name">${current.name}</div><div class="item-copy">${current.description}</div>`;
    button.addEventListener("click", () => useItem(index)); button.addEventListener("mouseenter", () => { app.inspect = { type: "item", itemId }; renderInspectPanel(); }); itemBar.append(button);
  });
}
function renderInspectPanel() {
  const panel = el("inspect-panel"); const battle = activeBattle();
  if (!battle) { panel.innerHTML = `<div class="section-label">Inspection</div><h3>No Active Battle</h3><p class="muted-copy">Cards, items, and telegraphs will describe themselves here.</p>`; return; }
  if (!app.inspect) { panel.innerHTML = `<div class="section-label">${battle.encounterName}</div><h3>Read The Table</h3><p class="muted-copy">${battle.encounterSubtitle}</p><p class="muted-copy">Hover cards, items, or telegraphs to inspect them.</p>`; return; }
  if (app.inspect.type === "item") { const current = ITEM_LOOKUP[app.inspect.itemId]; panel.innerHTML = `<div class="section-label">Item</div><h3>${current.name}</h3><p class="muted-copy">${current.description}</p><p class="muted-copy">${current.detail}</p>`; return; }
  if (app.inspect.type === "encounter") { panel.innerHTML = `<div class="section-label">${battle.encounterTier === "boss" ? "Boss" : titleCase(battle.encounterTier)}</div><h3>${battle.encounterName}</h3><p class="muted-copy">${battle.encounterSubtitle}</p><p class="muted-copy">Enemy telegraphs appear above the board before they deploy.</p>`; return; }
  const model = app.inspect.type === "unit" ? getUnitModel(battle.board[app.inspect.side][app.inspect.lane]) : getCardDefinition(app.inspect.cardId);
  if (!model) return;
  panel.innerHTML = `<div class="section-label">${model.tribe || "Card"}</div><h3>${model.name}</h3><p class="muted-copy">${model.description}</p><div class="detail-list"><span class="detail-chip">ATK ${model.attack}</span><span class="detail-chip">HP ${model.currentHealth != null ? model.currentHealth : model.health}</span>${model.sigils.map((sigilId) => `<span class="detail-chip">${SIGIL_LOOKUP[sigilId] ? SIGIL_LOOKUP[sigilId].name : titleCase(sigilId)}</span>`).join("")}</div>`;
}
function renderBattleLog() {
  const log = el("battle-log"); log.replaceChildren(); const battle = activeBattle();
  if (!battle || !battle.log.length) { const empty = document.createElement("div"); empty.className = "empty-state"; empty.textContent = "The ritual log is quiet."; log.append(empty); return; }
  battle.log.slice(-10).forEach((line) => { const row = document.createElement("div"); row.className = "log-line"; row.textContent = line; log.append(row); });
}
function renderSelectionBanner() {
  const banner = el("selection-banner"); const text = el("selection-text"); const battle = activeBattle();
  if (!battle) return banner.classList.add("hidden");
  if (battle.itemTargeting) { const current = ITEM_LOOKUP[battle.itemTargeting.itemId]; banner.classList.remove("hidden"); text.textContent = `Choose a ${battle.itemTargeting.target === "enemy" ? "foe" : "friendly creature"} for ${current.name}.`; return; }
  if (battle.selection && battle.selection.type === "sacrifice") {
    const total = battle.selection.lanes.reduce((sum, lane) => { const unit = battle.board.player[lane]; return sum + (unit ? sacrificeValue(unit) : 0); }, 0);
    const pendingIndex = findHandIndex(battle.selection.handUid); const pendingCard = pendingIndex >= 0 ? getDeckCardModel(battle.hand[pendingIndex]).name : "the chosen card";
    banner.classList.remove("hidden"); text.textContent = `Choose sacrifices for ${pendingCard}: ${total}/${battle.selection.needed} blood.`; return;
  }
  if (battle.pendingHandUid) { const handIndex = findHandIndex(battle.pendingHandUid); if (handIndex >= 0) { banner.classList.remove("hidden"); text.textContent = `${getDeckCardModel(battle.hand[handIndex]).name} is ready. Choose an empty lane or drag the card onto one.`; return; } }
  banner.classList.add("hidden");
}
function renderBattleScreen() {
  const battle = activeBattle(); if (!battle) return;
  el("scale-readout").textContent = `${battle.scale >= 0 ? "+" : ""}${battle.scale} / 5`; el("bones-readout").textContent = String(battle.bones); el("battle-lives").textContent = String(app.run.lives); el("deck-readout").textContent = String(battle.drawPile.length); el("offering-readout").textContent = String(battle.offeringPile.length); el("draw-main-btn").disabled = battle.drawnThisTurn || battle.drawPile.length === 0; el("draw-offering-btn").disabled = battle.drawnThisTurn || battle.offeringPile.length === 0;
  renderScaleTrack(); renderBattleRows(); renderHand(); renderItems(); renderInspectPanel(); renderBattleLog(); renderSelectionBanner();
}
function renderFlowScreen() {
  const flow = app.run ? app.run.flow : null; if (!flow) return;
  el("flow-kicker").textContent = flow.kicker || "Flow"; el("flow-title").textContent = flow.title || "A Choice Awaits"; el("flow-description").textContent = flow.description || "";
  const cardGrid = el("flow-card-grid"); const deckGrid = el("flow-deck-grid"); const buttonRow = el("flow-button-row"); cardGrid.replaceChildren(); deckGrid.replaceChildren(); buttonRow.replaceChildren();
  if (flow.mode === "card-reward") flow.cards.forEach((cardId) => cardGrid.append(createCardElement(getCardDefinition(cardId), { tagName: "button", onClick: () => resolveFlowAction({ type: "take-reward-card", cardId }), extraClass: "flow-choice" })));
  if (flow.mode === "item-reward") flow.items.forEach((itemId) => { const current = ITEM_LOOKUP[itemId]; cardGrid.append(createInfoChoice(current.name, current.description, () => resolveFlowAction({ type: "take-item", itemId }))); });
  if (flow.mode === "campfire") flow.deckTargets.forEach((deckCard) => deckGrid.append(createCardElement(getDeckCardModel(deckCard), { tagName: "button", onClick: () => resolveFlowAction({ type: "campfire-buff", deckUid: deckCard.uid, stat: flow.stat, amount: flow.amount, nodeId: flow.nodeId }), extraClass: "flow-choice" })));
  if (flow.mode === "purge") flow.deckTargets.forEach((deckCard) => deckGrid.append(createCardElement(getDeckCardModel(deckCard), { tagName: "button", onClick: () => resolveFlowAction({ type: "purge-card", deckUid: deckCard.uid, nodeId: flow.nodeId }), extraClass: "flow-choice" })));
  if (flow.mode === "shrine-select") flow.sigils.forEach((sigilId) => { const current = SIGIL_LOOKUP[sigilId]; cardGrid.append(createInfoChoice(current.name, current.description, () => resolveFlowAction({ type: "shrine-select-sigil", sigilId, nodeId: flow.nodeId }))); });
  if (flow.mode === "shrine-apply") flow.deckTargets.forEach((deckCard) => deckGrid.append(createCardElement(getDeckCardModel(deckCard), { tagName: "button", onClick: () => resolveFlowAction({ type: "shrine-apply", sigilId: flow.chosenSigil, deckUid: deckCard.uid, nodeId: flow.nodeId }), extraClass: "flow-choice" })));
  (flow.buttons || []).forEach((buttonDef) => { const button = document.createElement("button"); button.type = "button"; button.className = "ash-btn ash-btn-secondary"; button.textContent = buttonDef.label; button.addEventListener("click", () => resolveFlowAction(buttonDef.action)); buttonRow.append(button); });
  el("flow-close-btn").classList.add("hidden");
}
function groupedCurrentDeck() {
  if (!app.run) return [];
  const grouped = new Map();
  app.run.deck.forEach((deckCard) => { if (!grouped.has(deckCard.cardId)) grouped.set(deckCard.cardId, { deckCard, count: 0 }); grouped.get(deckCard.cardId).count += 1; });
  return [...grouped.values()].map(({ deckCard, count }) => ({ ...getDeckCardModel(deckCard), count })).sort((left, right) => left.name.localeCompare(right.name));
}
function renderDeckbook() {
  const summary = el("deckbook-summary"); const grid = el("deckbook-grid"); grid.replaceChildren(); el("deckbook-current-tab").classList.toggle("is-active", app.deckbookTab === "current"); el("deckbook-discovered-tab").classList.toggle("is-active", app.deckbookTab === "discovered");
  if (app.deckbookTab === "current") {
    if (!app.run) { summary.textContent = "No current run loaded."; const empty = document.createElement("div"); empty.className = "empty-state"; empty.textContent = "Start or continue a run to inspect the live deck."; grid.append(empty); return; }
    summary.textContent = `${app.run.deck.length} cards, ${app.run.items.length} items, ${app.run.lives} candles.`; groupedCurrentDeck().forEach((model) => grid.append(createCardElement(model, {}))); return;
  }
  const discoveredModels = [...app.discovered].map((cardId) => getCardDefinition(cardId)).sort((left, right) => left.name.localeCompare(right.name));
  summary.textContent = `${discoveredModels.length} recovered pages.`; discoveredModels.forEach((model) => grid.append(createCardElement(model, { enemy: ENEMY_CARD_LOOKUP[model.id] != null })));
}
function renderEndScreens() {
  if (!app.ending) return;
  const target = app.ending.result === "victory" ? "victory" : "gameover"; el(`${target}-copy`).textContent = app.ending.copy; const stats = el(`${target}-stats`); stats.replaceChildren(); Object.entries(app.ending.stats).forEach(([label, value]) => { const cell = document.createElement("div"); cell.className = "end-stat"; cell.innerHTML = `${titleCase(label.replace(/([A-Z])/g, " $1"))}<strong>${value}</strong>`; stats.append(cell); });
}
function renderPauseOverlay() { el("pause-overlay").classList.toggle("hidden", !app.pauseVisible); }
function renderApp() {
  renderTitle(); renderStarterScreen(); if (app.run) { renderMapScreen(); if (app.run.battle) renderBattleScreen(); if (app.run.flow) renderFlowScreen(); } renderDeckbook(); renderEndScreens(); renderPauseOverlay(); document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === app.visibleScreen)); if (app.run) savePersistedRun(app.run);
}
function handleLaneClick(side, lane) {
  const battle = activeBattle(); if (!battle) return;
  if (battle.itemTargeting) { const used = resolveItemEffect(battle.itemTargeting.itemId, { side, lane }); if (used) { consumeItem(battle.itemTargeting.index); battle.itemTargeting = null; app.run.stats.itemsUsed += 1; renderApp(); } return; }
  if (battle.selection && battle.selection.type === "sacrifice") { if (side !== "player" || !battle.board.player[lane]) return showToast("Choose your own creatures for sacrifice."); return toggleSacrificeLane(lane); }
  if (side === "player") { if (battle.board.player[lane]) { app.inspect = { type: "unit", side, lane }; return renderInspectPanel(); } if (battle.pendingHandUid) return beginPlayCard(battle.pendingHandUid, lane); }
  if (side === "enemy" && battle.board.enemy[lane]) { app.inspect = { type: "unit", side, lane }; renderInspectPanel(); }
}
function togglePause() { if (!app.run || !["map-screen","battle-screen","flow-screen"].includes(app.visibleScreen)) return; app.pauseVisible = !app.pauseVisible; renderPauseOverlay(); }
function renderAtmosphere(timestamp) {
  const canvas = el("atmosphere-canvas"); if (!canvas) return;
  const rect = canvas.getBoundingClientRect(); if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) { canvas.width = Math.floor(rect.width); canvas.height = Math.floor(rect.height); }
  const ctx = canvas.getContext("2d"); const delta = app.lastFrameTime ? Math.min(0.05, (timestamp - app.lastFrameTime) / 1000) : 0.016; app.lastFrameTime = timestamp;
  if (!app.motes.length) for (let index = 0; index < 40; index += 1) app.motes.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2.8 + 0.8, speed: Math.random() * 20 + 8, alpha: Math.random() * 0.28 + 0.08 });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const flicker = 0.5 + Math.sin(timestamp / 240) * 0.06 + Math.sin(timestamp / 130) * 0.03;
  const leftGlow = ctx.createRadialGradient(90, canvas.height - 120, 0, 90, canvas.height - 120, 180); leftGlow.addColorStop(0, `rgba(255, 214, 142, ${0.16 * flicker})`); leftGlow.addColorStop(1, "rgba(255, 214, 142, 0)"); ctx.fillStyle = leftGlow; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const rightGlow = ctx.createRadialGradient(canvas.width - 90, canvas.height - 120, 0, canvas.width - 90, canvas.height - 120, 180); rightGlow.addColorStop(0, `rgba(255, 214, 142, ${0.16 * flicker})`); rightGlow.addColorStop(1, "rgba(255, 214, 142, 0)"); ctx.fillStyle = rightGlow; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const mote of app.motes) {
    mote.y -= mote.speed * delta; mote.x += Math.sin((timestamp / 1000) + mote.y * 0.01) * 3 * delta; if (mote.y < -10) { mote.y = canvas.height + 12; mote.x = Math.random() * canvas.width; }
    ctx.fillStyle = `rgba(255, 218, 166, ${mote.alpha})`; ctx.beginPath(); ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2); ctx.fill();
  }
  requestAnimationFrame(renderAtmosphere);
}
function bindUI() {
  el("new-run-btn").addEventListener("click", () => { app.ending = null; app.selectedStarterId = STARTER_DECKS[0].id; showScreen("starter-screen"); renderApp(); });
  el("continue-run-btn").addEventListener("click", () => { const loaded = loadPersistedRun(); if (!loaded) return showToast("No saved run was found."), renderTitle(); app.run = loaded; app.pauseVisible = false; app.ending = null; app.selectedMapNodeId = app.run.selectedMapNodeId || app.run.availableNodeIds[0] || null; showScreen(app.run.screen || "map-screen"); renderApp(); });
  el("open-codex-btn").addEventListener("click", () => openDeckbook("title-screen", "discovered"));
  el("starter-back-btn").addEventListener("click", () => { showScreen("title-screen"); renderApp(); });
  el("starter-begin-btn").addEventListener("click", () => { app.ending = null; app.run = createRun(app.selectedStarterId); app.selectedMapNodeId = app.run.availableNodeIds[0] || null; showScreen("map-screen"); renderApp(); });
  el("map-codex-btn").addEventListener("click", () => openDeckbook("map-screen", "current"));
  el("map-save-btn").addEventListener("click", saveAndQuitToTitle);
  el("draw-main-btn").addEventListener("click", () => drawCards("main", 1));
  el("draw-offering-btn").addEventListener("click", () => drawCards("offering", 1));
  el("end-turn-btn").addEventListener("click", endTurn);
  el("battle-codex-btn").addEventListener("click", () => openDeckbook("battle-screen", "current"));
  el("pause-btn").addEventListener("click", togglePause);
  el("selection-cancel-btn").addEventListener("click", cancelSelections);
  el("flow-close-btn").addEventListener("click", () => { showScreen("map-screen"); renderApp(); });
  el("deckbook-close-btn").addEventListener("click", closeDeckbook);
  el("deckbook-current-tab").addEventListener("click", () => { app.deckbookTab = "current"; renderDeckbook(); });
  el("deckbook-discovered-tab").addEventListener("click", () => { app.deckbookTab = "discovered"; renderDeckbook(); });
  el("gameover-restart-btn").addEventListener("click", () => { app.ending = null; showScreen("starter-screen"); renderApp(); });
  el("gameover-codex-btn").addEventListener("click", () => openDeckbook("gameover-screen", "discovered"));
  el("victory-new-run-btn").addEventListener("click", () => { app.ending = null; showScreen("starter-screen"); renderApp(); });
  el("victory-codex-btn").addEventListener("click", () => openDeckbook("victory-screen", "discovered"));
  el("resume-btn").addEventListener("click", () => { app.pauseVisible = false; renderPauseOverlay(); });
  el("pause-codex-btn").addEventListener("click", () => { app.pauseVisible = false; openDeckbook(app.visibleScreen, "current"); });
  el("save-quit-btn").addEventListener("click", saveAndQuitToTitle);
  document.addEventListener("pointermove", moveDragCard);
  document.addEventListener("pointerup", finishCardDrag);
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space" && app.visibleScreen === "battle-screen" && !app.pauseVisible) { event.preventDefault(); endTurn(); return; }
    if (event.code === "Tab") { event.preventDefault(); if (app.visibleScreen === "deckbook-screen") closeDeckbook(); else if (app.run) openDeckbook(app.visibleScreen, "current"); else openDeckbook("title-screen", "discovered"); return; }
    if (event.code === "Escape") { event.preventDefault(); if (app.visibleScreen === "deckbook-screen") closeDeckbook(); else togglePause(); }
  });
}
function init() { app.discovered = new Set(loadDiscoveredCards()); bindUI(); renderApp(); requestAnimationFrame(renderAtmosphere); }
init();
