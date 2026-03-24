const STORAGE_KEYS = {
  profile: "inscryption_profile_v2",
  run: "inscryption_run_v2",
};

const MAX_LANES = 4;
const SCALE_LIMIT = 5;
const DOM_CACHE = Object.create(null);

const ASSETS = Object.freeze({
  menu: {
    startscreen: "game assets/Menu/menucard_startscreen.png",
    newGame: "game assets/Menu/menucard_newgame.png",
    continue: "game assets/Menu/menucard_continue.png",
    options: "game assets/Menu/menucard_options.png",
    concede: "game assets/Menu/menucard_concede.png",
    cursor: "game assets/Menu/p03_face_arrow.png",
  },
  frames: {
    normal: "game assets/Base Card/card_empty.png",
    rare: "game assets/Base Card/card_empty_rare.png",
    noStats: "game assets/Base Card/card_empty_nostats.png",
  },
  backs: {
    normal: "game assets/Base Card/card_back.png",
    rare: "game assets/Base Card/card_back_rare.png",
    squirrel: "game assets/Base Card/card_back_squirrel.png",
    bee: "game assets/Base Card/card_back_bee.png",
  },
  slots: {
    normal: "game assets/card_slot.png",
    host: "game assets/Misc/card_slot_host.png",
    sacrifice: "game assets/Misc/card_slot_sacrifice.png",
  },
  costs: {
    "blood-1": "game assets/Costs/cost_1blood.png",
    "blood-2": "game assets/Costs/cost_2blood.png",
    "blood-3": "game assets/Costs/cost_3blood.png",
    "blood-4": "game assets/Costs/cost_4blood.png",
    "bone-1": "game assets/Costs/cost_1bone.png",
    "bone-2": "game assets/Costs/cost_2bone.png",
    "bone-3": "game assets/Costs/cost_3bone.png",
    "bone-4": "game assets/Costs/cost_4bone.png",
    "bone-5": "game assets/Costs/cost_5bone.png",
    "bone-6": "game assets/Costs/cost_6bone.png",
    "bone-7": "game assets/Costs/cost_7bone.png",
    "bone-8": "game assets/Costs/cost_8bone.png",
    "bone-9": "game assets/Costs/cost_9bone.png",
    "bone-10": "game assets/Costs/cost_10bone.png",
  },
  misc: {
    addedSigil: "game assets/Misc/card_added_ability.png",
    sacrificeMark: "game assets/Misc/sacrifice_mark.png",
    sacrificeSplatter: "game assets/Misc/sacrifice_splatter.png",
    attackMark: "game assets/Misc/attack_mark.png",
    fishhookMark: "game assets/Misc/fishhook_mark.png",
    stampFrame: "game assets/Misc/ability_stamp_frame.png",
    stampShadow: "game assets/Misc/ability_stamp_shadow.png",
  },
  decals: {
    smoke: "game assets/Decals/decal_smoke.png",
    blood1: "game assets/Decals/decal_blood_1.png",
    blood2: "game assets/Decals/decal_blood_2.png",
    paint1: "game assets/Decals/decal_paint_1.png",
    paint2: "game assets/Decals/decal_paint_2.png",
  },
  trials: {
    blood: "game assets/Trials and Boons/trial_blood.png",
    bones: "game assets/Trials and Boons/trial_bones.png",
    power: "game assets/Trials and Boons/trial_power.png",
    health: "game assets/Trials and Boons/trial_toughness.png",
    wisdom: "game assets/Trials and Boons/trial_abilities.png",
    kin: "game assets/Trials and Boons/trial_tribes.png",
  },
  sigils: {
    airborne: "game assets/Sigils/ability_flying.png",
    "mighty-leap": "game assets/Sigils/ability_reach.png",
    "omni-strike": "game assets/Sigils/ability_allstrike.png",
    waterborne: "game assets/Sigils/ability_submerge.png",
    guardian: "game assets/Sigils/ability_guarddog.png",
    burrower: "game assets/Sigils/ability_whackamole.png",
    sprinter: "game assets/Sigils/ability_strafe.png",
    bifurcated: "game assets/Sigils/ability_splitstrike.png",
    trifurcated: "game assets/Sigils/ability_tristrike.png",
    "touch-of-death": "game assets/Sigils/ability_deathtouch.png",
    "sharp-quills": "game assets/Sigils/ability_sharp.png",
    stinky: "game assets/Sigils/ability_debuffenemy.png",
    leader: "game assets/Sigils/ability_buffneighbours.png",
    "worthy-sacrifice": "game assets/Sigils/ability_tripleblood.png",
    "many-lives": "game assets/Sigils/ability_sacrificial.png",
    "bone-king": "game assets/Sigils/ability_quadruplebones.png",
    scavenger: "game assets/Sigils/ability_opponentbones.png",
    fledgling: "game assets/Sigils/ability_evolve.png",
    "bees-within": "game assets/Sigils/ability_beesonhit.png",
    "rabbit-hole": "game assets/Sigils/ability_drawrabbits.png",
    fecundity: "game assets/Sigils/ability_drawcopy.png",
    "corpse-eater": "game assets/Sigils/ability_corpseeater.png",
    unkillable: "game assets/Sigils/ability_apparition.png",
    "dam-builder": "game assets/Sigils/ability_createdams.png",
    "loose-tail": "game assets/Sigils/ability_tailonhit.png",
    hoarder: "game assets/Sigils/ability_tutor.png",
    "ant-spawner": "game assets/Sigils/ability_drawant.png",
    "ant-power": "game assets/Sigils/ability_drawant.png",
    hefty: "game assets/Sigils/ability_strafepush.png",
    brittle: "game assets/Sigils/ability_brittle.png",
    sentry: "game assets/Sigils/ability_sentry.png",
    "steel-trap": "game assets/Sigils/ability_steeltrap.png",
  },
});

const EMISSION_PORTRAITS = new Set([
  "portrait_adder",
  "portrait_amalgam",
  "portrait_ant",
  "portrait_antflying",
  "portrait_antqueen",
  "portrait_beaver",
  "portrait_bee",
  "portrait_beehive",
  "portrait_bloodhound",
  "portrait_bullfrog",
  "portrait_cat",
  "portrait_cockroach",
  "portrait_coyote",
  "portrait_fieldmice",
  "portrait_geck",
  "portrait_goat",
  "portrait_goldnugget",
  "portrait_grizzly",
  "portrait_kingfisher",
  "portrait_mantis",
  "portrait_mantisgod",
  "portrait_mole",
  "portrait_moleman",
  "portrait_moose",
  "portrait_opossum",
  "portrait_packrat",
  "portrait_pelt_golden",
  "portrait_porcupine",
  "portrait_pronghorn",
  "portrait_rabbit",
  "portrait_ratking",
  "portrait_raven",
  "portrait_ravenegg",
  "portrait_ringworm",
  "portrait_shark",
  "portrait_skink",
  "portrait_skink_tailless",
  "portrait_skunk",
  "portrait_sparrow",
  "portrait_squirrel",
  "portrait_stoat",
  "portrait_stoat_bloated",
  "portrait_tadpole",
  "portrait_urayuli",
  "portrait_vulture",
  "portrait_warren",
  "portrait_wolf",
  "portrait_wolfcub",
]);

const MENU_CARDS = [
  { id: "new-game", title: "New Game", copy: "Open a fresh Kaycee run.", asset: ASSETS.menu.newGame },
  { id: "continue", title: "Continue", copy: "Resume the current candle.", asset: ASSETS.menu.continue },
  { id: "options", title: "Options", copy: "Tune motion, scaling, and profile data.", asset: ASSETS.menu.options },
];

const REGION_INFO = [
  { title: "The Woodland Trail", kicker: "Map I", copy: "A soot-marked route through campfires, traps, and stitched sacks." },
  { title: "The Marsh Crossing", kicker: "Map II", copy: "Waterlogged paths where the telegraphs hide beneath the reeds." },
  { title: "The Snow Line", kicker: "Map III", copy: "The last hunt climbs toward frost and hungrier silhouettes." },
  { title: "The Cabin Door", kicker: "Final Map", copy: "Only Leshy remains beyond the lantern and the moon." },
];

const NODE_TYPE_META = {
  battle: { label: "Fight", copy: "A standard encounter and a card reward." },
  campfire: { label: "Fire", copy: "Warm one creature beside the survivors." },
  backpack: { label: "Pack", copy: "Choose a fresh tool for the run." },
  "sacrificial-stones": { label: "Stones", copy: "Transfer sigils from one creature to another." },
  trapper: { label: "Trapper", copy: "Trade teeth for pelts." },
  trader: { label: "Trader", copy: "Swap pelts for fresh creatures." },
  "deck-trial": { label: "Trial", copy: "Reveal cards to test the deck." },
  boss: { label: "Boss", copy: "A mask-bearing boss blocks the trail." },
};

const MAP_NODE_ASSETS = Object.freeze({
  battle: ASSETS.misc.attackMark,
  backpack: "game assets/Portraits/portrait_packrat.png",
  "sacrificial-stones": "game assets/Portraits/portrait_stones.png",
  trapper: "game assets/Portraits/portrait_trap_closed.png",
  trader: "game assets/Portraits/portrait_pelt_hare.png",
  "deck-trial": ASSETS.trials.wisdom,
});

const MAP_NODE_GLYPHS = Object.freeze({
  prospector: "P",
  angler: "A",
  "trapper-trader": "T",
  leshy: "L",
});

const MAP_BLUEPRINTS = [
  [
    ["battle", "campfire", "backpack"],
    ["battle", "trapper", "battle"],
    ["battle", "sacrificial-stones", "deck-trial"],
    ["battle", "trader", "campfire"],
    ["battle", "battle"],
    ["boss"],
  ],
  [
    ["battle", "backpack", "battle"],
    ["battle", "campfire", "trapper"],
    ["battle", "deck-trial", "sacrificial-stones"],
    ["battle", "trader", "battle"],
    ["battle", "campfire"],
    ["boss"],
  ],
  [
    ["battle", "campfire", "battle"],
    ["battle", "trapper", "backpack"],
    ["battle", "sacrificial-stones", "deck-trial"],
    ["battle", "trader", "campfire"],
    ["battle", "battle"],
    ["boss"],
  ],
  [["boss"]],
];

const MAP_ROUTE_LINKS = Object.freeze({
  "1-1": [[0, [0]]],
  "1-2": [[0, [0, 1]]],
  "1-3": [[0, [0, 1, 2]]],
  "2-1": [[0, [0]], [1, [0]]],
  "2-2": [[0, [0]], [1, [1]]],
  "2-3": [[0, [0, 1]], [1, [1, 2]]],
  "3-1": [[0, [0]], [1, [0]], [2, [0]]],
  "3-2": [[0, [0]], [1, [0, 1]], [2, [1]]],
  "3-3": [[0, [0, 1]], [1, [1]], [2, [1, 2]]],
});

const SIGIL_DEFS = Object.freeze({
  airborne: { name: "Airborne", text: "Strikes past creatures unless blocked by Mighty Leap." },
  "mighty-leap": { name: "Mighty Leap", text: "Blocks Airborne strikes." },
  "omni-strike": { name: "Omni Strike", text: "Strikes every opposing lane." },
  waterborne: { name: "Waterborne", text: "Submerges during the opposing attack step." },
  guardian: { name: "Guardian", text: "Moves to oppose a creature played across from it." },
  burrower: { name: "Burrower", text: "Moves to defend an open lane before damage lands." },
  sprinter: { name: "Sprinter", text: "Moves sideways after combat." },
  bifurcated: { name: "Bifurcated Strike", text: "Strikes the lanes beside its own." },
  trifurcated: { name: "Trifurcated Strike", text: "Strikes left, center, and right." },
  "touch-of-death": { name: "Touch of Death", text: "Any amount of combat damage is lethal." },
  "sharp-quills": { name: "Sharp Quills", text: "Deals 1 damage back when struck." },
  stinky: { name: "Stinky", text: "Creatures opposing it lose 1 power." },
  leader: { name: "Leader", text: "Adjacent allies gain 1 power." },
  "worthy-sacrifice": { name: "Worthy Sacrifice", text: "Counts as three blood when sacrificed." },
  "many-lives": { name: "Many Lives", text: "Survives being sacrificed." },
  "bone-king": { name: "Bone King", text: "Drops three extra bones when it dies." },
  scavenger: { name: "Scavenger", text: "Enemy deaths grant you extra bones." },
  fledgling: { name: "Fledgling", text: "Transforms after surviving a full round." },
  "bees-within": { name: "Bees Within", text: "When struck, a Bee enters your hand." },
  "rabbit-hole": { name: "Rabbit Hole", text: "Adds a Rabbit to your hand when played." },
  fecundity: { name: "Fecundity", text: "Adds a copy to your hand. The copy loses Fecundity." },
  "corpse-eater": { name: "Corpse Eater", text: "Jumps from your hand into a freshly emptied lane." },
  unkillable: { name: "Unkillable", text: "Returns to your hand when it dies." },
  "dam-builder": { name: "Dam Builder", text: "Creates Dams in adjacent empty lanes." },
  "loose-tail": { name: "Loose Tail", text: "Slips away on hit and leaves a tail behind." },
  hoarder: { name: "Hoarder", text: "Draws one card from your main deck when played." },
  "ant-spawner": { name: "Ant Spawner", text: "Creates a Worker Ant each round." },
  "ant-power": { name: "Ant Power", text: "Power equals your live ants on the board." },
  hefty: { name: "Hefty", text: "Pushes sideways after combat." },
  brittle: { name: "Brittle", text: "Dies after striking." },
  sentry: { name: "Sentry", text: "Pings the opposing lane for 1 damage on play." },
  "steel-trap": { name: "Steel Trap", text: "Kills the creature that strikes it and leaves a pelt." },
});

const TABLE_CHATTER = Object.freeze({
  stoat: {
    draw: "Stoat sizes up the opening hand with visible contempt.",
    play: "Stoat mutters that the lane had better be worth it.",
    sacrifice: "Stoat does not appreciate becoming blood again.",
  },
  bossPhases: {
    "prospector-0": "The Prospector taps his pan against the table and grins.",
    "prospector-1": "Gold glitters across the table as the Prospector laughs.",
    "angler-0": "The Angler watches the last card you trust the most.",
    "angler-1": "Buckets slam down across the board. Something thrashes beneath them.",
    "trapper-trader-0": "Steel jaws snap open in the dark.",
    "trapper-trader-1": "Pelts are spread across the table for a cruel bargain.",
    "leshy-0": "Leshy leans forward. The masks are close at hand.",
    "leshy-1": "Leshy opens his ledger of the dead.",
    "leshy-2": "The moon rises over the cabin and stares back at you.",
  },
  moon: "The moon drags the smallest creatures beneath the tide.",
});

function el(id) {
  return DOM_CACHE[id] || (DOM_CACHE[id] = document.getElementById(id));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function titleCase(value) {
  return String(value)
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function unique(values) {
  return [...new Set(values)];
}

function portraitPath(name) {
  return `game assets/Portraits/${name}.png`;
}

function maybeEmission(name) {
  return EMISSION_PORTRAITS.has(name) ? `game assets/Portraits/${name}_emission.png` : "";
}

function sigilSummary(sigils) {
  if (!sigils || !sigils.length) return "No sigils.";
  return sigils.map((sigil) => SIGIL_DEFS[sigil]?.name || titleCase(sigil)).join(" / ");
}

function createCard(id, name, portraitName, costBlood, costBones, attack, health, sigils = [], extra = {}) {
  const portrait = extra.portraitPath || portraitPath(portraitName);
  const emission = extra.emissionPath || (extra.disableEmission ? "" : maybeEmission(portraitName));
  return {
    id,
    name,
    portrait,
    emission,
    costBlood,
    costBones,
    attack,
    health,
    sigils,
    tribe: extra.tribe || "none",
    rare: Boolean(extra.rare),
    frame: extra.frame || (extra.rare ? "rare" : "normal"),
    text: extra.text || sigilSummary(sigils),
    evolvesTo: extra.evolvesTo || null,
    tags: extra.tags || [],
    canSacrifice: extra.canSacrifice !== false,
    playable: extra.playable !== false,
    special: extra.special || null,
  };
}

const CARD_LIST = [
  createCard("squirrel", "Squirrel", "portrait_squirrel", 0, 0, 0, 1, [], { tribe: "none", text: "A side-deck body for blood costs." }),
  createCard("bee", "Bee", "portrait_bee", 0, 0, 1, 1, ["airborne"], { tribe: "insect", text: "Airborne and eager to sting." }),
  createCard("rabbit", "Rabbit", "portrait_rabbit", 0, 0, 0, 1, [], { text: "A free body from the Warren." }),
  createCard("dam", "Dam", "portrait_dam", 0, 0, 0, 2, [], { text: "Built by beavers to block a lane.", tags: ["terrain"], canSacrifice: false }),
  createCard("skink-tail", "Skink Tail", "portrait_skink_tail", 0, 0, 0, 1, [], { text: "Left behind when a skink slips free.", tags: ["terrain"], canSacrifice: false, disableEmission: true }),
  createCard("gold-nugget", "Gold Nugget", "portrait_goldnugget", 0, 0, 0, 2, [], { text: "Dead weight from the Prospector.", tags: ["terrain"], canSacrifice: false }),
  createCard("starvation", "Starvation", "portrait_starvingman", 0, 0, 1, 1, [], { text: "It comes when the main deck fails you.", special: "starvation", disableEmission: true }),
  createCard("rabbit-pelt", "Rabbit Pelt", "portrait_pelt_hare", 0, 0, 0, 1, [], { text: "Traded away for new cards.", tags: ["pelt"], canSacrifice: false }),
  createCard("wolf-pelt", "Wolf Pelt", "portrait_pelt_wolf", 0, 0, 0, 2, [], { text: "Traded for stronger offers.", tags: ["pelt"], canSacrifice: false }),
  createCard("golden-pelt", "Golden Pelt", "portrait_pelt_golden", 0, 0, 0, 3, [], { text: "A gilded pelt fit for rare cards.", tags: ["pelt"], canSacrifice: false, rare: true }),
  createCard("stoat", "Stoat", "portrait_stoat", 1, 0, 1, 2, [], { tribe: "canine", text: "A stubborn one-blood opener." }),
  createCard("bullfrog", "Bullfrog", "portrait_bullfrog", 1, 0, 1, 2, ["mighty-leap"], { tribe: "reptile" }),
  createCard("wolf", "Wolf", "portrait_wolf", 2, 0, 3, 2, [], { tribe: "canine", text: "Three power for two blood." }),
  createCard("black-goat", "Black Goat", "portrait_goat", 1, 0, 0, 1, ["worthy-sacrifice"], { tribe: "hooved" }),
  createCard("mole", "Mole", "portrait_mole", 1, 0, 0, 4, ["burrower"], { tribe: "none" }),
  createCard("ant-queen", "Ant Queen", "portrait_antqueen", 2, 0, 0, 3, ["ant-spawner", "ant-power"], { tribe: "insect", text: "Its power rises with your ants." }),
  createCard("flying-ant", "Flying Ant", "portrait_antflying", 1, 0, 0, 1, ["airborne", "ant-power"], { tribe: "insect" }),
  createCard("skunk", "Skunk", "portrait_skunk", 1, 0, 0, 3, ["stinky"], { tribe: "none" }),
  createCard("mantis-god", "Mantis God", "portrait_mantisgod", 1, 0, 1, 1, ["trifurcated"], { tribe: "insect", rare: true }),
  createCard("ring-worm", "Ring Worm", "portrait_ringworm", 1, 0, 0, 1, [], { tribe: "insect", text: "Plain, but strangely important." }),
  createCard("opossum", "Opossum", "portrait_opossum", 0, 2, 1, 1, [], { tribe: "canine", text: "A cheap bones creature." }),
  createCard("rat-king", "Rat King", "portrait_ratking", 2, 0, 2, 1, ["bone-king"], { tribe: "none" }),
  createCard("cockroach", "Cockroach", "portrait_cockroach", 0, 4, 1, 1, ["unkillable"], { tribe: "insect" }),
  createCard("coyote", "Coyote", "portrait_coyote", 0, 4, 2, 1, [], { tribe: "canine" }),
  createCard("tadpole", "Tadpole", "portrait_tadpole", 0, 0, 0, 1, ["waterborne", "fledgling"], { tribe: "reptile", evolvesTo: "bullfrog" }),
  createCard("geck", "Geck", "portrait_geck", 0, 0, 1, 1, [], { tribe: "reptile", rare: true, text: "Free to play and surprisingly potent." }),
  createCard("cat", "Cat", "portrait_cat", 1, 0, 0, 1, ["many-lives"], { tribe: "none" }),
  createCard("sparrow", "Sparrow", "portrait_sparrow", 1, 0, 1, 2, ["airborne"], { tribe: "bird" }),
  createCard("beaver", "Beaver", "portrait_beaver", 2, 0, 1, 4, ["dam-builder"], { tribe: "none" }),
  createCard("wolf-cub", "Wolf Cub", "portrait_wolfcub", 1, 0, 1, 1, ["fledgling"], { tribe: "canine", evolvesTo: "wolf" }),
  createCard("bloodhound", "Bloodhound", "portrait_bloodhound", 2, 0, 2, 3, ["guardian"], { tribe: "canine" }),
  createCard("porcupine", "Porcupine", "portrait_porcupine", 1, 0, 1, 2, ["sharp-quills"], { tribe: "none" }),
  createCard("pronghorn", "Pronghorn", "portrait_pronghorn", 2, 0, 1, 3, ["bifurcated"], { tribe: "hooved" }),
  createCard("worker-ant", "Worker Ant", "portrait_ant", 1, 0, 0, 2, ["ant-power"], { tribe: "insect" }),
  createCard("mantis", "Mantis", "portrait_mantis", 1, 0, 1, 1, ["bifurcated"], { tribe: "insect" }),
  createCard("warren", "Warren", "portrait_warren", 1, 0, 0, 2, ["rabbit-hole"], { tribe: "none" }),
  createCard("beehive", "Beehive", "portrait_beehive", 1, 0, 0, 2, ["bees-within"], { tribe: "insect" }),
  createCard("kingfisher", "Kingfisher", "portrait_kingfisher", 1, 0, 1, 1, ["airborne", "waterborne"], { tribe: "bird" }),
  createCard("river-otter", "River Otter", "portrait_otter", 1, 0, 1, 1, ["waterborne"], { tribe: "none" }),
  createCard("skink", "Skink", "portrait_skink", 1, 0, 1, 2, ["loose-tail"], { tribe: "reptile" }),
  createCard("adder", "Adder", "portrait_adder", 2, 0, 1, 1, ["touch-of-death"], { tribe: "reptile" }),
  createCard("corpse-maggots", "Corpse Maggots", "portrait_maggots", 0, 5, 1, 2, ["corpse-eater"], { tribe: "insect", portraitPath: "game assets/Portraits/portrait_maggots.png", emissionPath: "" }),
  createCard("rattler", "Rattler", "portrait_adder", 0, 6, 3, 1, [], { tribe: "reptile", text: "A brutal bones finisher." }),
  createCard("turkey-vulture", "Turkey Vulture", "portrait_vulture", 0, 8, 3, 3, ["airborne"], { tribe: "bird" }),
  createCard("moose-buck", "Moose Buck", "portrait_moose", 3, 0, 3, 7, ["hefty"], { tribe: "hooved" }),
  createCard("raven-egg", "Raven Egg", "portrait_ravenegg", 1, 0, 0, 2, ["fledgling"], { tribe: "bird", evolvesTo: "raven" }),
  createCard("raven", "Raven", "portrait_raven", 2, 0, 2, 3, ["airborne"], { tribe: "bird" }),
  createCard("pack-rat", "Pack Rat", "portrait_packrat", 2, 0, 2, 2, ["hoarder"], { tribe: "none" }),
  createCard("field-mice", "Field Mice", "portrait_fieldmice", 2, 0, 2, 2, ["fecundity"], { tribe: "none" }),
  createCard("amalgam", "Amalgam", "portrait_amalgam", 2, 0, 3, 3, [], { rare: true, tribe: "none", text: "A stitched rare with reliable stats." }),
  createCard("mole-man", "Mole Man", "portrait_moleman", 1, 0, 0, 6, ["burrower", "mighty-leap"], { rare: true, tribe: "none" }),
  createCard("ouroboros", "Ouroboros", "portrait_ouroboros", 0, 2, 1, 1, ["unkillable"], { rare: true, text: "Returns stronger each time it dies.", disableEmission: true }),
  createCard("grizzly", "Grizzly", "portrait_grizzly", 3, 0, 4, 6, [], { tribe: "none", rare: true }),
  createCard("urayuli", "Urayuli", "portrait_urayuli", 4, 0, 7, 7, [], { tribe: "none", rare: true }),
  createCard("pack-mule", "Pack Mule", "portrait_mule", 0, 0, 0, 5, [], { text: "On death, it spills more items onto the trail.", special: "pack-mule", tags: ["terrain"], canSacrifice: false, disableEmission: true }),
  createCard("bait-bucket", "Bait Bucket", "portrait_baitbucket", 0, 0, 0, 1, [], { text: "Break it, and the water answers.", special: "bait-bucket", tags: ["terrain"], canSacrifice: false, disableEmission: true }),
  createCard("great-white", "Great White", "portrait_shark", 0, 0, 4, 2, ["waterborne"], { text: "It waits under the waterline.", disableEmission: true }),
  createCard("strange-frog", "Strange Frog", "portrait_trapfrog", 1, 0, 0, 2, [], { text: "It leaves a trap when it dies.", special: "strange-frog", disableEmission: true }),
  createCard("leaping-trap", "Leaping Trap", "portrait_trap", 0, 0, 0, 1, ["mighty-leap", "steel-trap"], { text: "A trap that kills what strikes it.", tags: ["terrain"], canSacrifice: false, disableEmission: true }),
  createCard("deathcard-louis", "Louis", "portrait_stoat_bloated", 1, 0, 1, 1, ["sprinter", "waterborne"], { rare: true, text: "One of Leshy's premade deathcards." }),
  createCard("deathcard-kaycee", "Kaycee", "portrait_stoat_bloated", 1, 0, 1, 2, ["bifurcated", "sharp-quills"], { rare: true, text: "One of Leshy's premade deathcards." }),
  createCard("deathcard-kaminski", "Kaminski", "portrait_stoat_bloated", 0, 1, 0, 1, ["guardian", "sharp-quills"], { rare: true, text: "One of Leshy's premade deathcards." }),
  createCard("deathcard-reginald", "Reginald", "portrait_stoat_bloated", 0, 3, 1, 3, ["touch-of-death"], { rare: true, text: "One of Leshy's premade deathcards." }),
  createCard("moon", "The Moon", "moon_portrait", 0, 0, 1, 40, ["mighty-leap", "omni-strike"], { rare: true, text: "It strikes every lane and drowns your squirrels and rabbits.", portraitPath: "game assets/Portraits/moon_portrait.png", emissionPath: "", special: "moon", canSacrifice: false }),
];

const CARD_DEFS = Object.freeze(Object.fromEntries(CARD_LIST.map((card) => [card.id, card])));

const STARTER_DECKS = [
  { id: "vanilla", name: "Vanilla", summary: "Stoat, Bullfrog, and Wolf. Balanced and honest.", cards: ["stoat", "bullfrog", "wolf"], preview: ["stoat", "bullfrog", "wolf"] },
  { id: "high-cost", name: "High Cost", summary: "Black Goat, Moose Buck, and Mole. Built for Fair Hand abuse.", cards: ["black-goat", "moose-buck", "mole"], preview: ["black-goat", "moose-buck", "mole"] },
  { id: "ants", name: "Ants", summary: "Ant Queen, Flying Ant, and Skunk. Lean into swarm synergies.", cards: ["ant-queen", "flying-ant", "skunk"], preview: ["ant-queen", "flying-ant", "skunk"] },
  { id: "one-true-god", name: "Mantis God", summary: "Mantis God and two Ring Worms. Brutal if the opener lines up.", cards: ["mantis-god", "ring-worm", "ring-worm"], preview: ["mantis-god", "ring-worm", "ring-worm"] },
  { id: "no-cost", name: "No Cost", summary: "Rabbit, Tadpole, and Geck. Free bodies and flexible turns.", cards: ["rabbit", "tadpole", "geck"], preview: ["rabbit", "tadpole", "geck"] },
  { id: "bones", name: "Bones", summary: "Opossum, Rat King, and Coyote. Start the run with a bone plan.", cards: ["opossum", "rat-king", "coyote"], preview: ["opossum", "rat-king", "coyote"] },
];

const DECK_BY_ID = Object.freeze(Object.fromEntries(STARTER_DECKS.map((deck) => [deck.id, deck])));

const CHALLENGES = [
  { id: "tipped-scales", name: "Tipped Scales", description: "Each battle starts one point against you." },
  { id: "single-candle", name: "Single Candle", description: "The run begins with one candle instead of two." },
  { id: "stronger-foes", name: "Stronger Foes", description: "Enemy creatures gain extra health." },
  { id: "pricey-pelts", name: "Pricey Pelts", description: "Pelts cost one extra tooth at the Trapper." },
  { id: "small-backpack", name: "Small Backpack", description: "Carry only two items." },
  { id: "scarce-campfires", name: "Scarce Campfires", description: "Only one campfire works in a run." },
  { id: "boss-buffs", name: "Boss Buffs", description: "Boss creatures gain extra stats." },
];

const CHALLENGE_BY_ID = Object.freeze(Object.fromEntries(CHALLENGES.map((challenge) => [challenge.id, challenge])));

const UNLOCK_TABLE = [
  { clearCp: 0, deck: "high-cost", challenge: "single-candle" },
  { clearCp: 1, deck: "ants", challenge: "stronger-foes" },
  { clearCp: 2, deck: "one-true-god", challenge: "pricey-pelts" },
  { clearCp: 3, deck: "no-cost", challenge: "small-backpack" },
  { clearCp: 4, deck: "bones", challenge: "scarce-campfires" },
  { clearCp: 5, deck: null, challenge: "boss-buffs" },
];

const ITEM_DEFS = [
  { id: "pliers", name: "Pliers", description: "Tip the scale 1 point in your favor.", target: "none" },
  { id: "fish-hook", name: "Fish Hook", description: "Steal an enemy creature into an open lane.", target: "enemy" },
  { id: "squirrel-bottle", name: "Squirrel Bottle", description: "Add a Squirrel to your hand.", target: "none" },
  { id: "black-goat-bottle", name: "Black Goat Bottle", description: "Add a Black Goat to your hand.", target: "none" },
  { id: "scissors", name: "Scissors", description: "Cut down an enemy creature.", target: "enemy" },
  { id: "hourglass", name: "Hourglass", description: "Skip the next enemy attack step.", target: "none" },
  { id: "skinning-knife", name: "Skinning Knife", description: "Kill an enemy creature and keep a Rabbit Pelt.", target: "enemy" },
];

const ITEM_BY_ID = Object.freeze(Object.fromEntries(ITEM_DEFS.map((item) => [item.id, item])));

const BONUS_SIGIL_POOL = ["airborne", "mighty-leap", "guardian", "sprinter", "sharp-quills", "stinky", "fledgling", "rabbit-hole", "bees-within", "bifurcated"];

const TRIAL_DEFS = [
  { id: "blood", name: "Trial Of Blood", asset: ASSETS.trials.blood, description: "Reveal three cards with at least 4 blood total." },
  { id: "bones", name: "Trial Of Bones", asset: ASSETS.trials.bones, description: "Reveal three cards with at least 5 bones total." },
  { id: "power", name: "Trial Of Power", asset: ASSETS.trials.power, description: "Reveal three cards with at least 4 power total." },
  { id: "health", name: "Trial Of Health", asset: ASSETS.trials.health, description: "Reveal three cards with at least 6 health total." },
  { id: "wisdom", name: "Trial Of Wisdom", asset: ASSETS.trials.wisdom, description: "Reveal three cards with at least 3 sigils total." },
  { id: "kin", name: "Trial Of Kin", asset: ASSETS.trials.kin, description: "Reveal two matching tribes or identical cards." },
];

const TRIAL_BY_ID = Object.freeze(Object.fromEntries(TRIAL_DEFS.map((trial) => [trial.id, trial])));

const REWARD_POOLS = {
  map1: ["stoat", "bullfrog", "cat", "black-goat", "wolf-cub", "sparrow", "porcupine", "beaver", "skunk", "opossum", "coyote", "ring-worm", "worker-ant", "mantis", "warren", "beehive"],
  map2: ["wolf", "raven-egg", "raven", "mole", "bloodhound", "kingfisher", "skink", "adder", "pronghorn", "flying-ant", "ant-queen", "rattler", "rat-king", "corpse-maggots", "cockroach", "field-mice", "pack-rat"],
  map3: ["mole-man", "moose-buck", "turkey-vulture", "grizzly", "mantis-god", "geck", "urayuli", "amalgam", "ouroboros", "river-otter"],
  rare: ["grizzly", "mantis-god", "geck", "urayuli", "amalgam", "ouroboros", "mole-man"],
};

const STANDARD_ENCOUNTERS = [
  [
    { id: "forest-watch", title: "Woodland Watch", copy: "The first telegraphs stir at the edge of the board.", waves: [[null, "stoat", null, "sparrow"], [null, "bullfrog", "wolf-cub", null], ["coyote", null, null, null]] },
    { id: "frog-crossing", title: "Frog Crossing", copy: "Frogs and birds wait behind the queue.", waves: [["bullfrog", null, null, null], [null, "sparrow", null, "sparrow"], [null, null, "wolf", null]] },
    { id: "low-ant-trail", title: "Ant Trail", copy: "The line crawls with insects.", waves: [[null, "worker-ant", null, null], ["stoat", null, null, "worker-ant"], [null, "ant-queen", null, null]] },
  ],
  [
    { id: "marsh-eggs", title: "Marsh Eggs", copy: "Birdsong and shells crack in the reeds.", waves: [[null, "raven-egg", null, "kingfisher"], [null, "skink", "raven-egg", null], ["bloodhound", null, null, null]] },
    { id: "otter-water", title: "Otter Water", copy: "Everything here ducks below the surface.", waves: [[null, "river-otter", null, "kingfisher"], ["skink", null, null, "adder"], [null, "rattler", null, null]] },
    { id: "bone-choir", title: "Bone Choir", copy: "The bones pile up in the queue.", waves: [["opossum", null, null, "coyote"], [null, "rat-king", null, null], [null, null, "corpse-maggots", null]] },
  ],
  [
    { id: "snow-breach", title: "Snow Breach", copy: "The last stretch is heavier and meaner.", waves: [[null, "cockroach", null, "adder"], [null, "moose-buck", null, null], ["turkey-vulture", null, null, null]] },
    { id: "grave-surge", title: "Grave Surge", copy: "The dead arrive faster than the cards do.", waves: [["corpse-maggots", null, null, "cockroach"], [null, "grizzly", null, null], [null, null, "turkey-vulture", null]] },
    { id: "moonless-run", title: "Moonless Run", copy: "Even the common fights are oversized now.", waves: [["skink", null, "pronghorn", null], [null, "mantis", null, "adder"], ["grizzly", null, null, null]] },
  ],
];

const BOSS_ENCOUNTERS = {
  prospector: {
    id: "prospector",
    title: "The Prospector",
    copy: "He grins and reaches for the pan.",
    phases: [
      { name: "The Prospector", copy: "A Pack Mule waits somewhere in the queue.", waves: [[null, "wolf-cub", "pack-mule", null], ["coyote", null, null, "sparrow"], [null, "wolf", null, null]] },
      { name: "Strike Gold", copy: "Your board turns to gold as the second phase begins.", waves: [["gold-nugget", null, null, null], [null, "bloodhound", null, "porcupine"], [null, "grizzly", null, null]] },
    ],
  },
  angler: {
    id: "angler",
    title: "The Angler",
    copy: "He hooks what you love most.",
    phases: [
      { name: "The Angler", copy: "The river telegraphs through bait and eggs.", waves: [["kingfisher", null, null, "raven-egg"], [null, "adder", null, null], [null, "raven", null, null]] },
      { name: "Go Fish", copy: "Buckets line the board, and sharks lurk beneath them.", waves: [["bait-bucket", null, "bait-bucket", null], [null, "bait-bucket", null, "bait-bucket"], [null, "great-white", null, null]] },
    ],
  },
  "trapper-trader": {
    id: "trapper-trader",
    title: "The Trapper / Trader",
    copy: "Traps first. Pelts later.",
    phases: [
      { name: "The Trapper", copy: "Steel traps guard the first phase.", waves: [["leaping-trap", null, "strange-frog", null], [null, "leaping-trap", null, "wolf"], ["bloodhound", null, null, null]] },
      { name: "The Trader", copy: "Pelts clog the lanes before the final reveal.", waves: [["wolf-pelt", "wolf-pelt", "wolf-pelt", "wolf-pelt"], [null, "grizzly", null, null], [null, null, "mole-man", null]] },
    ],
  },
  leshy: {
    id: "leshy",
    title: "Leshy",
    copy: "No boons. No mercy. Only the moon after the masks.",
    phases: [
      { name: "Leshy", copy: "The rare cards arrive first.", waves: [["mole-man", null, "pack-rat", null], [null, "grizzly", null, "urayuli"], [null, "amalgam", null, null]] },
      { name: "Deathcards", copy: "He carves fresh dead into the next hand.", waves: [["deathcard-louis", null, "deathcard-kaycee", null], [null, "deathcard-kaminski", null, "deathcard-reginald"], [null, "grizzly", null, null]] },
      { name: "The Moon", copy: "The last phase rises all at once.", waves: [[null, "moon", null, null]] },
    ],
  },
};

const app = {
  profile: null,
  run: null,
  setupDeckId: "vanilla",
  setupChallenges: new Set(),
  selectedMapNodeId: null,
  selection: null,
  inspect: null,
  menuSelection: "new-game",
  codexTab: "current",
  codexReturn: "title-screen",
  endingState: null,
  toastTimer: null,
  battleFxTimer: null,
  battleAnimating: false,
  dragState: null,
  dragSuppressUid: null,
  dragSuppressUntil: 0,
  resetArmed: false,
  concedeArmed: false,
  atmosphere: {
    motes: [],
    frameId: 0,
    width: 0,
    height: 0,
  },
};

function defaultProfile() {
  return {
    version: 2,
    ascensionLevel: 0,
    highestClearedCP: -1,
    unlockedDeckIds: ["vanilla"],
    unlockedChallengeIds: ["tipped-scales"],
    winsByDeck: {},
    discoveredCardIds: ["stoat", "bullfrog", "wolf", "rabbit-pelt", "squirrel"],
    deathcards: [],
    deathcardCounter: 0,
    options: {
      reducedMotion: false,
      pixelScaling: true,
      confirmConcede: true,
    },
    stats: {
      runsStarted: 0,
      victories: 0,
      bossesDefeated: 0,
    },
  };
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.profile);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw);
    return {
      ...defaultProfile(),
      ...parsed,
      options: { ...defaultProfile().options, ...(parsed.options || {}) },
      stats: { ...defaultProfile().stats, ...(parsed.stats || {}) },
      unlockedDeckIds: unique([...(parsed.unlockedDeckIds || ["vanilla"])]),
      unlockedChallengeIds: unique([...(parsed.unlockedChallengeIds || ["tipped-scales"])]),
      discoveredCardIds: unique([...(parsed.discoveredCardIds || [])]),
      deathcards: [...(parsed.deathcards || [])].filter((card) => card && card.id),
      deathcardCounter: Number(parsed.deathcardCounter) || 0,
      winsByDeck: { ...(parsed.winsByDeck || {}) },
    };
  } catch (error) {
    console.warn("Failed to load profile", error);
    return defaultProfile();
  }
}

function saveProfile() {
  try {
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(app.profile));
  } catch (error) {
    console.warn("Failed to save profile", error);
  }
}

function loadRun() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.run);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== 2) return null;
    return parsed;
  } catch (error) {
    console.warn("Failed to load run", error);
    return null;
  }
}

function saveRun() {
  if (!app.run) return;
  try {
    localStorage.setItem(STORAGE_KEYS.run, JSON.stringify(app.run));
  } catch (error) {
    console.warn("Failed to save run", error);
  }
}

function clearRun() {
  app.run = null;
  localStorage.removeItem(STORAGE_KEYS.run);
}

function nextUid(run, prefix) {
  run.uidCounter = (run.uidCounter || 0) + 1;
  return `${prefix}-${run.uidCounter}`;
}

function randomSeed() {
  return ((Date.now() >>> 0) ^ (Math.random() * 0xffffffff >>> 0)) >>> 0;
}

function rand(run) {
  run.rngState = ((run.rngState * 1664525) + 1013904223) >>> 0;
  return run.rngState / 0x100000000;
}

function randInt(run, min, maxExclusive) {
  return Math.floor(rand(run) * (maxExclusive - min)) + min;
}

function shuffle(run, values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randInt(run, 0, i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sample(run, values) {
  return values[randInt(run, 0, values.length)];
}

function takeRandomDistinct(run, values, count) {
  return shuffle(run, values).slice(0, Math.min(count, values.length));
}

function getProfileDeathcards() {
  return Array.isArray(app.profile?.deathcards) ? app.profile.deathcards.filter((card) => card && card.id) : [];
}

function isFairHandCandidate(entry) {
  const model = entry?.cardId ? getEntryModel(entry) : getCardDef(entry?.id);
  if (!model || model.playable === false) return false;
  if ((model.tags || []).includes("pelt") || (model.tags || []).includes("terrain")) return false;
  return model.costBlood === 1 && model.costBones === 0;
}

function buildBattleMainDeck(run) {
  const deck = shuffle(run, run.deck.map((entry) => cloneEntryForBattle(entry)));
  const candidateIndexes = deck
    .map((entry, index) => isFairHandCandidate(entry) ? index : -1)
    .filter((index) => index >= 0);
  if (!candidateIndexes.length) return deck;
  const candidateIndex = sample(run, candidateIndexes);
  const [candidate] = deck.splice(candidateIndex, 1);
  const insertAt = randInt(run, 0, Math.min(2, deck.length + 1));
  deck.splice(insertAt, 0, candidate);
  return deck;
}

function noteUniqueBattleLine(battle, key, message) {
  if (!battle || !message) return;
  battle.chatterSeen = battle.chatterSeen || [];
  if (battle.chatterSeen.includes(key)) return;
  battle.chatterSeen.push(key);
  logBattle(battle, message);
}

function maybeNoteCardChatter(battle, source, eventType) {
  const cardId = source?.cardId || source?.id;
  if (cardId !== "stoat") return;
  const line = TABLE_CHATTER.stoat[eventType];
  if (!line) return;
  noteUniqueBattleLine(battle, `stoat-${eventType}`, line);
}

function maybeNoteBossPhaseChatter(battle) {
  if (!battle?.bossId) return;
  const key = `${battle.bossId}-${battle.phaseIndex}`;
  noteUniqueBattleLine(battle, `boss-${key}`, TABLE_CHATTER.bossPhases[key]);
}

function getDeathcardFallbackIds() {
  return ["deathcard-louis", "deathcard-kaycee", "deathcard-kaminski", "deathcard-reginald"];
}

function getDeathcardRewardPool() {
  return unique([...getProfileDeathcards().map((card) => card.id), ...getDeathcardFallbackIds()]).filter((cardId) => getCardDef(cardId));
}

function buildLeshyDeathcardWaves(run) {
  const pool = getDeathcardRewardPool();
  const chosen = takeRandomDistinct(run, pool, Math.min(3, pool.length));
  while (chosen.length < 3 && pool.length) chosen.push(pool[chosen.length % pool.length]);
  return [
    [chosen[0], null, chosen[1], null],
    [null, chosen[2], null, chosen[0]],
    [null, "grizzly", null, null],
  ];
}

function buildDeathcardName(run, model) {
  const prefixes = ["Ashen", "Stitched", "Gnarled", "Hollow", "Grim"];
  const baseName = String(model.name || "Remnant").split(/\s+/)[0];
  return `${sample(run, prefixes)} ${baseName}`;
}

function createDeathcardFromRun(run) {
  const entries = (run.deck || []).filter((entry) => {
    const model = getEntryModel(entry);
    return model && model.playable !== false && !(model.tags || []).includes("pelt") && !(model.tags || []).includes("terrain");
  });
  if (!entries.length) return null;

  const nameSource = sample(run, entries);
  const costPool = entries.filter((entry) => {
    const model = getEntryModel(entry);
    return model.costBlood > 0 || model.costBones > 0;
  });
  const costSource = costPool.length ? sample(run, costPool) : nameSource;
  const statSource = [...entries].sort((left, right) => {
    const leftModel = getEntryModel(left);
    const rightModel = getEntryModel(right);
    return (rightModel.attack + rightModel.health) - (leftModel.attack + leftModel.health);
  })[0] || nameSource;
  const sigilPool = entries.filter((entry) => getEntryModel(entry).sigils.length);
  const sigilSource = sigilPool.length
    ? [...sigilPool].sort((left, right) => getEntryModel(right).sigils.length - getEntryModel(left).sigils.length)[0]
    : nameSource;

  const nameModel = getEntryModel(nameSource);
  const costModel = getEntryModel(costSource);
  const statModel = getEntryModel(statSource);
  const sigilModel = getEntryModel(sigilSource);
  const nextId = `deathcard-player-${(app.profile?.deathcardCounter || 0) + 1}`;

  return createCard(nextId, buildDeathcardName(run, nameModel), "portrait_stoat_bloated", costModel.costBlood, costModel.costBones, statModel.attack, statModel.health, unique([...(sigilModel.sigils || [])]).slice(0, 2), {
    portraitPath: nameModel.portrait || portraitPath("portrait_stoat_bloated"),
    emissionPath: nameModel.emission || "",
    rare: true,
    frame: "rare",
    text: `Carved from ${nameModel.name}, ${costModel.name}, and ${sigilModel.name}.`,
    special: "deathcard",
  });
}

function recordDeathcardFromRun(run) {
  const deathcard = createDeathcardFromRun(run);
  if (!deathcard) return null;
  app.profile.deathcardCounter = (app.profile.deathcardCounter || 0) + 1;
  app.profile.deathcards = [deathcard, ...getProfileDeathcards()].slice(0, 8);
  app.profile.discoveredCardIds = unique([...(app.profile.discoveredCardIds || []), deathcard.id]).filter((cardId) => getCardDef(cardId));
  saveProfile();
  return deathcard;
}

function mapRowXPositions(count) {
  if (count <= 1) return [50];
  if (count === 2) return [38, 62];
  if (count === 3) return [28, 50, 72];
  if (count === 4) return [20, 40, 60, 80];
  const step = 64 / Math.max(1, count - 1);
  return Array.from({ length: count }, (_, index) => 18 + (index * step));
}

function mapRowYPosition(rowCount, rowIndex) {
  if (rowCount <= 1) return 52;
  const top = 14;
  const bottom = 84;
  const step = (bottom - top) / Math.max(1, rowCount - 1);
  return bottom - (rowIndex * step);
}

function mapAnchorJitter(mapIndex, rowIndex, laneIndex) {
  const xSeed = ((mapIndex + 1) * 17) + ((rowIndex + 1) * 13) + ((laneIndex + 1) * 9);
  const ySeed = ((mapIndex + 1) * 11) + ((rowIndex + 1) * 19) + ((laneIndex + 1) * 7);
  return {
    x: (((xSeed % 5) - 2) * 0.8),
    y: (((ySeed % 5) - 2) * 0.45),
  };
}

function getMapRouteLinks(previousCount, nextCount) {
  const template = MAP_ROUTE_LINKS[`${previousCount}-${nextCount}`];
  if (template) return template.map(([fromIndex, targets]) => [fromIndex, [...targets]]);
  if (previousCount === nextCount) {
    return Array.from({ length: previousCount }, (_, index) => [index, [index]]);
  }
  if (previousCount > nextCount) {
    return Array.from({ length: previousCount }, (_, index) => {
      const target = Math.round((index / Math.max(1, previousCount - 1)) * Math.max(0, nextCount - 1));
      return [index, [target]];
    });
  }
  return Array.from({ length: previousCount }, (_, index) => {
    const primary = Math.round((index / Math.max(1, previousCount - 1)) * Math.max(0, nextCount - 1));
    const secondary = clamp(primary + 1, 0, Math.max(0, nextCount - 1));
    return [index, unique([primary, secondary])];
  });
}

function getMapNodeVisual(node) {
  if (node.type === "boss") {
    return {
      glyph: MAP_NODE_GLYPHS[node.bossId] || "B",
      label: titleCase(node.bossId),
      copy: `Face ${titleCase(node.bossId)}.`,
    };
  }
  const meta = getNodeMeta(node);
  return {
    asset: MAP_NODE_ASSETS[node.type] || "",
    glyph: node.type === "campfire" ? "fire" : "",
    label: meta.label,
    copy: meta.copy,
  };
}

function hasChallenge(run, challengeId) {
  return Boolean(run.challengeIds?.includes(challengeId));
}

function isDeckUnlocked(deckId) {
  return app.profile.unlockedDeckIds.includes(deckId);
}

function isChallengeUnlocked(challengeId) {
  return app.profile.unlockedChallengeIds.includes(challengeId);
}

function getRequiredCp() {
  return clamp((app.profile.highestClearedCP ?? -1) + 1, 0, 6);
}

function markDiscovered(cardIds) {
  const merged = unique([...(app.profile.discoveredCardIds || []), ...cardIds.filter(Boolean)]);
  app.profile.discoveredCardIds = merged.filter((cardId) => getCardDef(cardId));
  saveProfile();
}

function createDeckEntry(run, cardId, extra = {}) {
  const uid = nextUid(run, "deck");
  return {
    uid,
    sourceUid: uid,
    cardId,
    attackBuff: 0,
    healthBuff: 0,
    addedSigils: [],
    removedSigils: [],
    temporary: false,
    ...extra,
  };
}

function createRuntimeEntry(run, cardId, extra = {}) {
  return {
    uid: nextUid(run, "hand"),
    sourceUid: extra.sourceUid || null,
    cardId,
    attackBuff: extra.attackBuff || 0,
    healthBuff: extra.healthBuff || 0,
    addedSigils: [...(extra.addedSigils || [])],
    removedSigils: [...(extra.removedSigils || [])],
    temporary: true,
  };
}

function cloneEntryForBattle(entry) {
  return {
    uid: entry.uid,
    sourceUid: entry.sourceUid,
    cardId: entry.cardId,
    attackBuff: entry.attackBuff || 0,
    healthBuff: entry.healthBuff || 0,
    addedSigils: [...(entry.addedSigils || [])],
    removedSigils: [...(entry.removedSigils || [])],
    temporary: Boolean(entry.temporary),
  };
}

function getCardDef(cardId) {
  return CARD_DEFS[cardId] || getProfileDeathcards().find((card) => card.id === cardId) || null;
}

function getEntryModel(entry) {
  const base = getCardDef(entry.cardId);
  const sigils = unique([...(base.sigils || []), ...(entry.addedSigils || [])]).filter((sigil) => !(entry.removedSigils || []).includes(sigil));
  return {
    ...base,
    attack: base.attack + (entry.attackBuff || 0),
    health: base.health + (entry.healthBuff || 0),
    sigils,
    addedSigils: [...(entry.addedSigils || [])],
  };
}

function getPersistentEntry(sourceUid) {
  return app.run?.deck.find((entry) => entry.sourceUid === sourceUid) || null;
}

function createUnitFromEntry(run, entry, side, lane, modifiers = {}) {
  const model = getEntryModel(entry);
  return {
    uid: nextUid(run, "unit"),
    sourceUid: entry.sourceUid || null,
    cardId: model.id,
    name: model.name,
    side,
    lane,
    baseAttack: model.attack + (modifiers.attackBonus || 0),
    health: model.health + (modifiers.healthBonus || 0),
    maxHealth: model.health + (modifiers.healthBonus || 0),
    sigils: [...model.sigils],
    addedSigils: [...(entry.addedSigils || [])],
    removedSigils: [...(entry.removedSigils || [])],
    rare: model.rare,
    frame: model.frame,
    text: model.text,
    tribe: model.tribe,
    special: model.special,
    flags: {
      direction: modifiers.direction || (lane >= MAX_LANES - 1 ? -1 : 1),
      tailUsed: false,
      evolved: false,
    },
    turnsInPlay: 0,
  };
}

function createEnemyUnit(run, battle, cardId, lane) {
  const def = getCardDef(cardId);
  let attackBonus = battle.mapIndex >= 2 ? 1 : 0;
  let healthBonus = battle.mapIndex >= 1 ? 1 : 0;
  if (hasChallenge(run, "stronger-foes")) healthBonus += 1;
  if (battle.bossId && hasChallenge(run, "boss-buffs")) {
    attackBonus += 1;
    healthBonus += 1;
  }
  if (def.tags.includes("terrain") || def.id === "moon") attackBonus = 0;
  const entry = createRuntimeEntry(run, cardId);
  return createUnitFromEntry(run, entry, "enemy", lane, { attackBonus, healthBonus });
}

function getItemCapacity(run) {
  return hasChallenge(run, "small-backpack") ? 2 : 3;
}

function createNewRun(deckId, challengeIds) {
  const run = {
    version: 2,
    seed: randomSeed(),
    rngState: randomSeed(),
    uidCounter: 0,
    scene: "map",
    starterDeckId: deckId,
    challengeIds: [...challengeIds],
    cp: challengeIds.length,
    mapIndex: 0,
    teeth: 0,
    candles: challengeIds.includes("single-candle") ? 1 : 2,
    items: [],
    deck: [],
    bossOrder: [],
    maps: [],
    battle: null,
    event: null,
    lastBattleNodeId: null,
    currentNodeId: null,
    flags: {
      freeTrapperPelt: false,
      campfiresUsed: 0,
    },
    stats: {
      bossesDefeated: 0,
      battlesWon: 0,
      cardsAdded: 0,
    },
  };
  run.rngState = run.seed;
  run.items = takeRandomDistinct(run, ITEM_DEFS.map((item) => item.id), Math.min(2, getItemCapacity(run)));
  for (const cardId of DECK_BY_ID[deckId].cards) {
    run.deck.push(createDeckEntry(run, cardId));
  }
  run.bossOrder = [...shuffle(run, ["prospector", "angler", "trapper-trader"]), "leshy"];
  run.maps = generateMaps(run);
  unlockAvailableNodes(run.maps[0], []);
  markDiscovered(run.deck.map((entry) => entry.cardId));
  return run;
}

function generateMaps(run) {
  return MAP_BLUEPRINTS.map((rows, mapIndex) => {
    const map = [];
    let previousRow = [];
    rows.forEach((rowTypes, rowIndex) => {
      const xPositions = mapRowXPositions(rowTypes.length);
      const yBase = mapRowYPosition(rows.length, rowIndex);
      const row = rowTypes.map((type, laneIndex) => {
        const xBase = xPositions[laneIndex] ?? 50;
        const jitter = mapAnchorJitter(mapIndex, rowIndex, laneIndex);
        const node = {
          id: `map-${mapIndex}-node-${rowIndex}-${laneIndex}`,
          mapIndex,
          depth: rowIndex,
          rowIndex,
          laneIndex,
          anchorX: xBase,
          anchorY: yBase,
          type,
          x: clamp(xBase + jitter.x, 16, 84),
          y: clamp(yBase + jitter.y, 12, 86),
          parentIds: [],
          childIds: [],
          state: "future",
          bossId: type === "boss" ? run.bossOrder[mapIndex] : null,
        };
        map.push(node);
        return node;
      });
      if (previousRow.length) {
        getMapRouteLinks(previousRow.length, row.length).forEach(([prevIndex, targetIndexes]) => {
          const prevNode = previousRow[prevIndex];
          if (!prevNode) return;
          targetIndexes.forEach((targetIndex) => {
            const nextNode = row[targetIndex];
            if (!nextNode) return;
            if (!nextNode.parentIds.includes(prevNode.id)) nextNode.parentIds.push(prevNode.id);
            if (!prevNode.childIds.includes(nextNode.id)) prevNode.childIds.push(nextNode.id);
          });
        });
      }
      previousRow = row;
    });
    return map;
  });
}

function unlockAvailableNodes(map, clearedNodeIds) {
  map.forEach((node) => {
    if (node.state === "cleared") return;
    if (!node.parentIds.length) {
      node.state = "available";
      return;
    }
    node.state = node.parentIds.some((parentId) => clearedNodeIds.includes(parentId)) ? "available" : "future";
  });
}

function getCurrentMap() {
  return app.run?.maps[app.run.mapIndex] || [];
}

function getNodeById(nodeId) {
  return getCurrentMap().find((node) => node.id === nodeId) || null;
}

function getNodeMeta(node) {
  return NODE_TYPE_META[node.type] || NODE_TYPE_META.battle;
}

function applyOptions() {
  document.body.classList.toggle("reduced-motion", Boolean(app.profile.options.reducedMotion));
  document.body.classList.toggle("pixel-soft", !app.profile.options.pixelScaling);
}

function showToast(message) {
  const toast = el("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(app.toastTimer);
  app.toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function suppressHandClick(handUid) {
  app.dragSuppressUid = handUid;
  app.dragSuppressUntil = Date.now() + 180;
}

function shouldSuppressHandClick(handUid) {
  return app.dragSuppressUid === handUid && Date.now() < app.dragSuppressUntil;
}

function triggerBattleFx(fxId) {
  const battleScreen = el("battle-screen");
  if (!battleScreen) return;
  battleScreen.dataset.fx = fxId;
  clearTimeout(app.battleFxTimer);
  app.battleFxTimer = setTimeout(() => {
    if (battleScreen.dataset.fx === fxId) battleScreen.dataset.fx = "";
  }, 260);
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isBattleAnimating() {
  return Boolean(app.run?.battle && app.battleAnimating);
}

function guardBattleInteraction(showMessage = true) {
  if (!isBattleAnimating()) return false;
  if (showMessage) showToast("Wait for the strike to finish.");
  return true;
}

function getLaneSlotElement(side, lane) {
  return el("battle-screen")?.querySelector(`.lane-slot[data-side="${side}"][data-lane="${lane}"]`) || null;
}

async function animateAttackLunge(side, lane) {
  if (app.profile?.options?.reducedMotion) return;
  const slot = getLaneSlotElement(side, lane);
  const card = slot?.querySelector(".card");
  if (!slot || !card) return;
  const lungeClass = side === "player" ? "is-lunging-player" : "is-lunging-enemy";
  slot.classList.remove("is-lunging-player", "is-lunging-enemy");
  void card.offsetWidth;
  slot.classList.add(lungeClass);
  await sleep(190);
  slot.classList.remove(lungeClass);
  await sleep(40);
}

function resetDragGhost() {
  const dragCard = el("drag-card");
  clearElement(dragCard);
  dragCard.classList.add("hidden");
  dragCard.style.left = "";
  dragCard.style.top = "";
}

function clearDropLaneHighlight() {
  if (app.dragState?.hoverSlotEl?.classList) app.dragState.hoverSlotEl.classList.remove("is-drop-target");
}

function resetHandCardDrag(cancelled = true) {
  if (!app.dragState) return;
  clearDropLaneHighlight();
  if (app.dragState.sourceEl?.classList) app.dragState.sourceEl.classList.remove("is-drag-source");
  document.body.classList.remove("is-dragging-card");
  resetDragGhost();
  const handUid = app.dragState.handUid;
  const wasActive = app.dragState.active;
  const hoverLane = app.dragState.hoverLane;
  app.dragState = null;
  if (!cancelled && wasActive && typeof hoverLane === "number") {
    suppressHandClick(handUid);
    attemptHandCardDrop(handUid, hoverLane);
  }
}

function updateDragGhostPosition(clientX, clientY) {
  const dragCard = el("drag-card");
  dragCard.style.left = `${clientX}px`;
  dragCard.style.top = `${clientY}px`;
}

function getBattleHandEntry(handUid) {
  return app.run?.battle?.hand.find((entry) => entry.uid === handUid) || null;
}

function getPlayerLaneSlotFromPoint(clientX, clientY) {
  if (typeof document.elementFromPoint !== "function") return null;
  const target = document.elementFromPoint(clientX, clientY);
  const slot = target?.closest?.("#player-row .lane-slot");
  if (!slot) return null;
  const lane = Number(slot.dataset.lane);
  if (Number.isNaN(lane)) return null;
  return { lane, slot };
}

function canDropHandCardOnLane(handUid, lane) {
  const battle = app.run?.battle;
  if (!battle || battle.mustDraw) return false;
  if (lane < 0 || lane >= MAX_LANES || battle.playerBoard[lane]) return false;
  const selection = app.selection;
  if (selection?.handUid === handUid) return selection.type === "play-card" || selection.type === "sacrifice";
  const entry = getBattleHandEntry(handUid);
  if (!entry) return false;
  const model = getEntryModel(entry);
  if (model.costBones > battle.playerBones) return false;
  if (model.costBlood > countAvailableBlood(battle)) return false;
  return true;
}

function selectHandCardForPlay(handUid, pendingLane = null) {
  const battle = app.run.battle;
  if (battle.mustDraw) {
    showToast("Draw first.");
    return false;
  }
  const entry = getBattleHandEntry(handUid);
  if (!entry) return false;
  app.inspect = entry;
  const model = getEntryModel(entry);
  if (model.costBones > battle.playerBones) {
    showToast("Not enough bones.");
    renderBattle();
    return false;
  }
  if (model.costBlood > countAvailableBlood(battle)) {
    showToast("Not enough blood on the board.");
    renderBattle();
    return false;
  }
  if (model.costBlood > 0) {
    app.selection = {
      type: "sacrifice",
      handUid,
      requiredBlood: model.costBlood,
      currentBlood: 0,
      chosenLanes: [],
      pendingLane,
    };
  } else {
    app.selection = {
      type: "play-card",
      handUid,
      chosenLanes: [],
      pendingLane,
    };
  }
  return true;
}

function attemptHandCardDrop(handUid, lane) {
  const battle = app.run?.battle;
  if (!battle || lane < 0 || lane >= MAX_LANES || battle.playerBoard[lane]) return false;
  if (battle.mustDraw) {
    showToast("Draw first.");
    renderBattle();
    return false;
  }
  const selection = app.selection;
  if (selection?.type === "play-card" && selection.handUid === handUid) {
    playSelectedCardToLane(lane);
    return true;
  }
  if (selection?.type === "sacrifice" && selection.handUid === handUid) {
    app.selection = { ...selection, pendingLane: lane };
    renderBattle();
    return true;
  }
  if (!selectHandCardForPlay(handUid, lane)) return false;
  if (app.selection?.type === "sacrifice") {
    showToast("Choose sacrifices.");
    renderBattle();
    return true;
  }
  playSelectedCardToLane(lane);
  return true;
}

function beginHandCardDrag(event, handUid) {
  if (event.button !== undefined && event.button !== 0) return;
  if (!app.run?.battle) return;
  if (guardBattleInteraction(false)) return;
  const sourceEl = event.currentTarget;
  app.dragState = {
    handUid,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
    hoverLane: null,
    hoverSlotEl: null,
    sourceEl,
  };
  event.preventDefault();
}

function handleGlobalPointerMove(event) {
  const drag = app.dragState;
  if (!drag || drag.pointerId !== event.pointerId) return;
  const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
  if (!drag.active && distance < 10) return;
  const entry = getBattleHandEntry(drag.handUid);
  if (!entry) {
    resetHandCardDrag(true);
    return;
  }
  if (!drag.active) {
    drag.active = true;
    drag.sourceEl?.classList?.add("is-drag-source");
    document.body.classList.add("is-dragging-card");
    const dragCard = el("drag-card");
    clearElement(dragCard);
    dragCard.appendChild(createCardElement(entry, { compact: true, disabled: true }));
    dragCard.classList.remove("hidden");
  }
  updateDragGhostPosition(event.clientX, event.clientY);
  clearDropLaneHighlight();
  drag.hoverLane = null;
  drag.hoverSlotEl = null;
  const target = getPlayerLaneSlotFromPoint(event.clientX, event.clientY);
  if (!target || !canDropHandCardOnLane(drag.handUid, target.lane)) return;
  drag.hoverLane = target.lane;
  drag.hoverSlotEl = target.slot;
  target.slot.classList.add("is-drop-target");
}

function handleGlobalPointerUp(event) {
  const drag = app.dragState;
  if (!drag || drag.pointerId !== event.pointerId) return;
  if (!drag.active) {
    const handUid = drag.handUid;
    app.dragState = null;
    handleHandCardClick(handUid);
    return;
  }
  resetHandCardDrag(false);
}

function button(text, className, onClick) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = text;
  element.addEventListener("click", onClick);
  return element;
}

function clearElement(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function preloadAssets() {
  const urls = [
    ...Object.values(ASSETS.menu),
    ...Object.values(ASSETS.frames),
    ...Object.values(ASSETS.backs),
    ...Object.values(ASSETS.slots),
    ...Object.values(ASSETS.costs),
    ...Object.values(ASSETS.sigils),
    ...Object.values(ASSETS.trials),
    ...Object.values(ASSETS.misc),
    ...CARD_LIST.flatMap((card) => [card.portrait, card.emission].filter(Boolean)),
  ];
  urls.forEach((url) => {
    const image = new Image();
    image.src = url;
  });
}

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === screenId);
  });
  document.body.dataset.screen = screenId;
  el("app-shell").dataset.screen = screenId;
}

function getSourceModel(source, battle) {
  if (!source) return null;
  if (source.side) {
    const def = getCardDef(source.cardId);
    return {
      ...def,
      attack: getUnitBaseAttack(battle, source),
      health: source.health,
      sigils: [...source.sigils],
      addedSigils: [...(source.addedSigils || [])],
    };
  }
  if (source.cardId) return getEntryModel(source);
  return source;
}

function createCardElement(source, options = {}) {
  const model = source.cardId || source.side ? getSourceModel(source, options.battle || null) : source;
  const card = document.createElement("button");
  card.type = "button";
  card.className = `card pixel-image${options.compact ? " compact" : ""}${options.tiny ? " tiny" : ""}${options.selected ? " is-selected" : ""}${options.disabled ? " is-disabled" : ""}`;
  card.disabled = Boolean(options.disabled);
  const face = document.createElement("div");
  face.className = "card-face";
  const frame = document.createElement("div");
  frame.className = `card-frame ${model.frame || (model.rare ? "rare" : "normal")}`;
  const name = document.createElement("div");
  name.className = "card-name";
  name.textContent = model.name;
  const portrait = document.createElement("div");
  portrait.className = "card-portrait";
  portrait.style.backgroundImage = `url("${model.portrait}")`;
  face.append(frame, name, portrait);

  if (model.emission) {
    const emission = document.createElement("div");
    emission.className = "card-emission";
    emission.style.backgroundImage = `url("${model.emission}")`;
    face.appendChild(emission);
  }

  const costAsset = model.costBlood > 0
    ? ASSETS.costs[`blood-${model.costBlood}`]
    : model.costBones > 0
      ? ASSETS.costs[`bone-${model.costBones}`]
      : "";
  if (costAsset) {
    const cost = document.createElement("img");
    cost.className = "card-cost pixel-image";
    cost.src = costAsset;
    cost.alt = model.costBlood > 0
      ? `${model.costBlood} blood cost`
      : `${model.costBones} bone cost`;
    cost.draggable = false;
    face.appendChild(cost);
  }

  const attack = document.createElement("div");
  attack.className = "card-stat attack";
  attack.textContent = String(model.attack);
  const health = document.createElement("div");
  health.className = "card-stat health";
  health.textContent = String(model.health);
  face.append(attack, health);

  if (model.sigils.length) {
    const sigils = document.createElement("div");
    sigils.className = "card-sigils";
    model.sigils.slice(0, 3).forEach((sigilId) => {
      const sigil = document.createElement("div");
      sigil.className = "card-sigil";
      sigil.style.backgroundImage = `url("${ASSETS.sigils[sigilId] || ASSETS.sigils.airborne}")`;
      if ((model.addedSigils || []).includes(sigilId)) {
        const added = document.createElement("div");
        added.className = "card-added-sigil";
        sigil.appendChild(added);
      }
      sigils.appendChild(sigil);
    });
    face.appendChild(sigils);
  }

  const text = document.createElement("div");
  text.className = "card-text";
  text.textContent = model.text;
  face.appendChild(text);
  card.appendChild(face);
  return card;
}

function renderTitle() {
  showScreen("title-screen");
  el("title-screen").dataset.hasRun = app.run ? "true" : "false";
  const titleMenu = el("title-menu-cards");
  clearElement(titleMenu);
  MENU_CARDS.forEach((menuCard) => {
    const buttonEl = document.createElement("button");
    buttonEl.type = "button";
    buttonEl.className = `menu-card-button${app.menuSelection === menuCard.id ? " is-selected" : ""}`;
    buttonEl.dataset.card = menuCard.id;
    buttonEl.setAttribute("aria-label", menuCard.title);
    buttonEl.title = menuCard.id === "continue" && !app.run ? "No saved run exists yet." : menuCard.title;
    if (menuCard.id === "continue" && !app.run) buttonEl.disabled = true;
    buttonEl.addEventListener("mouseenter", () => {
      app.menuSelection = menuCard.id;
      renderTitle();
    });
    buttonEl.addEventListener("click", () => handleTitleAction(menuCard.id));
    const art = document.createElement("div");
    art.className = "menu-card-art pixel-image";
    art.style.backgroundImage = `url("${menuCard.asset}")`;
    buttonEl.appendChild(art);
    titleMenu.appendChild(buttonEl);
  });

  const meta = el("title-meta-plaque");
  clearElement(meta);
  [
    ["Ascension", String(app.profile.ascensionLevel)],
    ["Highest CP", app.profile.highestClearedCP >= 0 ? String(app.profile.highestClearedCP) : "-"],
    ["Deathcards", String(getProfileDeathcards().length)],
    ["Run", app.run ? "Continue" : "Empty"],
  ].forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "title-meta-row";
    row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    meta.appendChild(row);
  });
}

function renderSetup() {
  showScreen("setup-screen");
  el("setup-screen").dataset.deck = app.setupDeckId;
  const deckList = el("setup-deck-list");
  clearElement(deckList);
  STARTER_DECKS.forEach((deck) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = `selection-option${app.setupDeckId === deck.id ? " is-selected" : ""}${isDeckUnlocked(deck.id) ? "" : " is-locked"}`;
    option.disabled = !isDeckUnlocked(deck.id);
    option.addEventListener("click", () => {
      app.setupDeckId = deck.id;
      renderSetup();
    });
    option.innerHTML = `<strong>${deck.name}</strong><small>${deck.summary}</small>`;
    deckList.appendChild(option);
  });

  const selectedDeck = DECK_BY_ID[app.setupDeckId];
  const detail = el("setup-deck-detail");
  clearElement(detail);
  detail.innerHTML = `
    <div class="panel-kicker text-dark">Deck Detail</div>
    <h3 class="text-dark" style="margin:6px 0 0;">${selectedDeck.name}</h3>
    <p class="detail-copy text-dark">${selectedDeck.summary}</p>
    <p class="detail-copy text-dark">Wins with deck: ${app.profile.winsByDeck[selectedDeck.id] || 0}</p>
  `;
  const preview = el("setup-deck-preview");
  clearElement(preview);
  selectedDeck.preview.forEach((cardId) => preview.appendChild(createCardElement(getCardDef(cardId), { compact: true, disabled: true })));

  const challengeList = el("setup-challenge-list");
  clearElement(challengeList);
  CHALLENGES.forEach((challenge) => {
    const unlocked = isChallengeUnlocked(challenge.id);
    const selected = app.setupChallenges.has(challenge.id);
    const option = document.createElement("button");
    option.type = "button";
    option.className = `challenge-option${selected ? " is-selected" : ""}${unlocked ? "" : " is-locked"}`;
    option.disabled = !unlocked;
    option.addEventListener("click", () => {
      if (app.setupChallenges.has(challenge.id)) app.setupChallenges.delete(challenge.id);
      else app.setupChallenges.add(challenge.id);
      renderSetup();
    });
    option.innerHTML = `<strong>${challenge.name}</strong><small>${challenge.description}</small>`;
    challengeList.appendChild(option);
  });

  el("setup-requirements").innerHTML = `
    <div class="panel-kicker">Run Requirement</div>
    <p class="detail-copy">Required challenge points: <strong>${getRequiredCp()}</strong></p>
    <p class="detail-copy">Selected challenge points: <strong>${app.setupChallenges.size}</strong></p>
  `;
  const canStart = isDeckUnlocked(app.setupDeckId) && app.setupChallenges.size >= getRequiredCp();
  el("setup-start-btn").disabled = !canStart;
  el("setup-start-btn").textContent = canStart ? "Begin Run" : "Need More Challenge Points";
}

function renderMap() {
  showScreen("map-screen");
  const run = app.run;
  el("map-screen").dataset.map = String(run.mapIndex);
  const currentMap = getCurrentMap();
  const region = REGION_INFO[run.mapIndex];
  el("map-region-kicker").textContent = region.kicker;
  el("map-region-title").textContent = region.title;
  el("map-region-copy").textContent = region.copy;

  const summary = el("map-run-summary");
  clearElement(summary);
  [
    ["candles", "Candles", String(run.candles)],
    ["teeth", "Teeth", String(run.teeth)],
    ["deck", "Deck", String(run.deck.length)],
    ["items", "Items", `${run.items.length}/${getItemCapacity(run)}`],
  ].forEach(([prop, label, value]) => {
    const token = document.createElement("div");
    token.className = "map-prop-token";
    token.dataset.prop = prop;
    token.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    summary.appendChild(token);
  });

  const bossOrder = el("map-boss-order");
  clearElement(bossOrder);
  run.bossOrder.forEach((bossId, index) => {
    const chip = document.createElement("div");
    chip.className = `boss-chip${index === run.mapIndex ? " is-next" : ""}`;
    chip.textContent = MAP_NODE_GLYPHS[bossId] || titleCase(bossId).charAt(0);
    chip.setAttribute("aria-label", titleCase(bossId));
    chip.title = titleCase(bossId);
    bossOrder.appendChild(chip);
  });

  const nodeLayer = el("map-node-layer");
  clearElement(nodeLayer);
  const selectedNode = getNodeById(app.selectedMapNodeId) || currentMap.find((node) => node.state === "available") || currentMap[0] || null;
  app.selectedMapNodeId = selectedNode?.id || null;
  currentMap.forEach((node) => {
    const buttonEl = document.createElement("button");
    buttonEl.type = "button";
    buttonEl.className = `map-node${node.state === "available" ? " is-available" : ""}${node.id === app.selectedMapNodeId ? " is-selected" : ""}${node.state === "cleared" ? " is-cleared" : ""}`;
    buttonEl.dataset.type = node.type;
    buttonEl.dataset.nodeId = node.id;
    if (node.bossId) buttonEl.dataset.boss = node.bossId;
    buttonEl.style.left = `${node.x}%`;
    buttonEl.style.top = `${node.y}%`;
    buttonEl.disabled = node.state !== "available";
    buttonEl.addEventListener("click", () => {
      app.selectedMapNodeId = node.id;
      renderMap();
    });
    const visual = getMapNodeVisual(node);
    buttonEl.setAttribute("aria-label", visual.label);
    const icon = document.createElement("div");
    icon.className = "map-node-icon pixel-image";
    if (visual.asset) icon.style.backgroundImage = `url("${visual.asset}")`;
    if (visual.glyph) {
      icon.classList.add(`is-${visual.glyph}`);
      if (node.type === "boss") icon.textContent = visual.glyph;
    }
    const ribbon = document.createElement("div");
    ribbon.className = "map-node-ribbon";
    ribbon.textContent = visual.label;
    buttonEl.append(icon, ribbon);
    nodeLayer.appendChild(buttonEl);
  });

  const lineSvg = el("map-lines");
  clearElement(lineSvg);
  currentMap.forEach((node) => {
    node.childIds.forEach((childId) => {
      const child = currentMap.find((candidate) => candidate.id === childId);
      if (!child) return;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const midX = (node.x + child.x) / 2;
      const midY = ((node.y + child.y) / 2) + (node.laneIndex <= child.laneIndex ? -2.2 : 2.2);
      const controlOffset = ((node.rowIndex + child.laneIndex + 1) % 2 === 0 ? -1 : 1) * 1.4;
      path.setAttribute(
        "d",
        `M ${node.x} ${node.y} Q ${midX + controlOffset} ${midY}, ${child.x} ${child.y}`,
      );
      if (node.state === "cleared") path.classList.add("is-cleared");
      lineSvg.appendChild(path);
    });
  });
  renderMapDetail(selectedNode);
}

function renderMapDetail(node) {
  const detail = el("map-detail");
  clearElement(detail);
  if (!node) {
    detail.innerHTML = "<div class='panel-kicker'>Trail Note</div><p class='detail-copy'>Choose a marked stop.</p>";
    detail.style.left = "";
    detail.style.top = "";
    detail.style.right = "";
    detail.style.bottom = "";
    return;
  }
  const meta = getNodeMeta(node);
  detail.innerHTML = `
    <div class="panel-kicker">${node.type === "boss" ? "Boss" : "Trail Stop"}</div>
    <h3>${node.type === "boss" ? titleCase(node.bossId) : meta.label}</h3>
    <p class="detail-copy">${node.type === "boss" ? `Face ${titleCase(node.bossId)}.` : meta.copy}</p>
    <div class="map-detail-meta">
      <span>${node.state === "available" ? "Open" : titleCase(node.state)}</span>
      <span>Stop ${node.depth + 1}</span>
    </div>
  `;
  const actions = document.createElement("div");
  actions.className = "map-detail-actions";
  const travel = button(node.state === "available" ? "Travel" : "Blocked", "inscry-btn", () => enterNode(node.id));
  travel.disabled = node.state !== "available";
  actions.appendChild(travel);
  detail.appendChild(actions);
  positionMapDetail(node.id);
}

function positionMapDetail(nodeId) {
  const detail = el("map-detail");
  if (!detail || typeof document.querySelector !== "function") return;
  const selectedNode = document.querySelector(`.map-node[data-node-id="${nodeId}"]`);
  const stage = document.querySelector("#map-screen #map-parchment");
  if (!selectedNode || !stage) return;
  if (typeof selectedNode.getBoundingClientRect !== "function" || typeof stage.getBoundingClientRect !== "function") return;
  const stageRect = stage.getBoundingClientRect();
  const nodeRect = selectedNode.getBoundingClientRect();
  const detailRect = detail.getBoundingClientRect();
  let left = nodeRect.right - stageRect.left + 18;
  if (left + detailRect.width > stageRect.width - 18) {
    left = nodeRect.left - stageRect.left - detailRect.width - 18;
  }
  let top = nodeRect.top - stageRect.top - 26;
  left = clamp(left, 18, Math.max(18, stageRect.width - detailRect.width - 18));
  top = clamp(top, 28, Math.max(28, stageRect.height - detailRect.height - 18));
  detail.style.left = `${left}px`;
  detail.style.top = `${top}px`;
  detail.style.right = "auto";
  detail.style.bottom = "auto";
}

function startNewGameFromSetup() {
  const chosenDeck = DECK_BY_ID[app.setupDeckId];
  if (!chosenDeck) return;
  if (!isDeckUnlocked(chosenDeck.id)) {
    showToast("That starter deck has not been unlocked yet.");
    return;
  }
  const selectedChallenges = [...app.setupChallenges];
  if (selectedChallenges.length < getRequiredCp()) {
    showToast(`You need at least ${getRequiredCp()} challenge points for this run.`);
    return;
  }
  app.profile.stats.runsStarted += 1;
  saveProfile();
  app.run = createNewRun(chosenDeck.id, selectedChallenges);
  app.selectedMapNodeId = getCurrentMap().find((node) => node.state === "available")?.id || null;
  app.selection = null;
  app.inspect = null;
  app.endingState = null;
  saveRun();
  renderMap();
}

function enterNode(nodeId) {
  const node = getNodeById(nodeId);
  if (!node || node.state !== "available") return;
  app.run.currentNodeId = node.id;
  if (node.type === "battle" || node.type === "boss") {
    startBattle(node);
    return;
  }
  startEventForNode(node);
}

function getRewardPoolForMap(mapIndex) {
  if (mapIndex <= 0) return REWARD_POOLS.map1;
  if (mapIndex === 1) return [...REWARD_POOLS.map1, ...REWARD_POOLS.map2];
  return [...REWARD_POOLS.map1, ...REWARD_POOLS.map2, ...REWARD_POOLS.map3];
}

function pickRewardCards(run, pool, count, extra = {}) {
  const candidates = pool.filter((cardId) => getCardDef(cardId));
  return takeRandomDistinct(run, candidates, count).map((cardId) => ({
    cardId,
    attackBuff: extra.attackBuff || 0,
    healthBuff: extra.healthBuff || 0,
    addedSigils: [...(extra.addedSigils || [])],
  }));
}

function buildStandardEncounter() {
  const run = app.run;
  const template = clone(sample(run, STANDARD_ENCOUNTERS[Math.min(app.run.mapIndex, STANDARD_ENCOUNTERS.length - 1)]));
  return {
    id: template.id,
    title: template.title,
    copy: template.copy,
    bossId: null,
    rewardKind: "reward",
    phases: [{ name: template.title, copy: template.copy, waves: template.waves }],
  };
}

function buildBossEncounter(node) {
  const bossId = node.bossId || app.run.bossOrder[app.run.mapIndex];
  const template = clone(BOSS_ENCOUNTERS[bossId]);
  if (bossId === "leshy" && template.phases[1]) template.phases[1].waves = buildLeshyDeathcardWaves(app.run);
  return {
    id: template.id,
    title: template.title,
    copy: template.copy,
    bossId,
    rewardKind: bossId === "leshy" ? "victory" : "rare-reward",
    phases: template.phases,
  };
}

function createBattleState(node, encounter) {
  const run = app.run;
  const battle = {
    nodeId: node.id,
    encounterId: encounter.id,
    title: encounter.title,
    copy: encounter.copy,
    rewardKind: encounter.rewardKind,
    bossId: encounter.bossId,
    mapIndex: run.mapIndex,
    phaseIndex: 0,
    phases: encounter.phases,
    queue: Array(MAX_LANES).fill(null),
    upcomingWaves: [],
    playerBoard: Array(MAX_LANES).fill(null),
    enemyBoard: Array(MAX_LANES).fill(null),
    hand: [],
    mainDeck: buildBattleMainDeck(run),
    sideDeck: Array.from({ length: 10 }, () => createRuntimeEntry(run, "squirrel")),
    playerBones: 0,
    scale: hasChallenge(run, "tipped-scales") ? -1 : 0,
    turn: 1,
    mustDraw: true,
    skipEnemyAttack: 0,
    logs: [],
    chatterSeen: [],
    lastPlayedLane: null,
    starvations: 0,
  };
  beginBattlePhase(battle, 0);
  drawFromSideDeck(battle, true);
  drawFromMainDeck(battle, true);
  drawFromMainDeck(battle, true);
  logBattle(battle, `${battle.title} waits behind facedown telegraphs.`);
  return battle;
}

function beginBattlePhase(battle, phaseIndex) {
  battle.phaseIndex = phaseIndex;
  battle.queue = [...(battle.phases[phaseIndex].waves[0] || Array(MAX_LANES).fill(null))];
  battle.upcomingWaves = (battle.phases[phaseIndex].waves.slice(1) || []).map((wave) => [...wave]);
  clearBoardSide(battle, "enemy");
  logBattle(battle, battle.phases[phaseIndex].copy);
  maybeNoteBossPhaseChatter(battle);
}

function clearBoardSide(battle, side) {
  if (side === "player") battle.playerBoard = Array(MAX_LANES).fill(null);
  else battle.enemyBoard = Array(MAX_LANES).fill(null);
}

function startBattle(node) {
  const encounter = node.type === "boss" ? buildBossEncounter(node) : buildStandardEncounter(node);
  app.run.battle = createBattleState(node, encounter);
  app.run.scene = "battle";
  app.run.lastBattleNodeId = node.id;
  app.selection = null;
  app.inspect = null;
  saveRun();
  renderBattle();
}

function logBattle(battle, message) {
  battle.logs.unshift(message);
  battle.logs = battle.logs.slice(0, 14);
}

function getBoard(battle, side) {
  return side === "player" ? battle.playerBoard : battle.enemyBoard;
}

function renderBattle() {
  if (app.dragState) resetHandCardDrag(true);
  showScreen("battle-screen");
  const battle = app.run.battle;
  const battleBusy = app.battleAnimating;
  const battleScreen = el("battle-screen");
  const scaleLean = clamp(battle.scale, -SCALE_LIMIT, SCALE_LIMIT);
  battleScreen.dataset.boss = battle.bossId || "encounter";
  battleScreen.dataset.phase = String(battle.phaseIndex);
  battleScreen.dataset.mustDraw = battle.mustDraw ? "true" : "false";
  battleScreen.dataset.busy = battleBusy ? "true" : "false";
  battleScreen.dataset.selection = app.selection?.type || "";
  battleScreen.style.setProperty("--scale-tilt", `${scaleLean * 4.5}deg`);
  battleScreen.style.setProperty("--enemy-pan-shift", `${-scaleLean * 4}px`);
  battleScreen.style.setProperty("--player-pan-shift", `${scaleLean * 4}px`);
  el("battle-candles").textContent = String(app.run.candles);
  el("battle-teeth").textContent = String(app.run.teeth);
  el("battle-bones").textContent = String(battle.playerBones);
  el("battle-encounter-kicker").textContent = battle.bossId ? "Boss Battle" : "Encounter";
  el("battle-encounter-title").textContent = battle.bossId ? `${battle.title} - ${battle.phases[battle.phaseIndex].name}` : battle.title;
  el("draw-main-btn").textContent = "Deck";
  el("draw-side-btn").textContent = "Squirrel";
  el("ring-bell-btn").textContent = "Bell";
  el("draw-main-btn").dataset.count = String(battle.mainDeck.length);
  el("draw-side-btn").dataset.count = String(battle.sideDeck.length);
  el("draw-main-btn").disabled = !battle.mustDraw || battleBusy;
  el("draw-side-btn").disabled = !battle.mustDraw || battleBusy;
  el("ring-bell-btn").disabled = battle.mustDraw || Boolean(app.selection) || battleBusy;
  el("selection-cancel-btn").disabled = !app.selection || battleBusy;
  renderItemBar();
  renderQueue();
  renderLaneRow("enemy-row", "enemy");
  renderScale();
  renderLaneRow("player-row", "player");
  renderHand();
  renderSelectionBanner();
  renderInspectPanel();
  renderBattleLog();
}

function renderItemBar() {
  const itemBar = el("item-bar");
  clearElement(itemBar);
  const items = app.run.items.slice(0, getItemCapacity(app.run));
  for (let index = 0; index < getItemCapacity(app.run); index += 1) {
    const itemId = items[index];
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = `item-slot${itemId ? "" : " is-empty"}`;
    slot.dataset.item = itemId || "empty";
    slot.disabled = !itemId || Boolean(app.selection) || app.battleAnimating;
    if (itemId) {
      const item = ITEM_BY_ID[itemId];
      const abbreviation = item.name
        .split(/\s+/)
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();
      slot.dataset.sig = abbreviation || item.name.slice(0, 2).toUpperCase();
      slot.setAttribute("aria-label", item.name);
      slot.title = item.description;
      slot.innerHTML = `<strong>${item.name}</strong>`;
      slot.addEventListener("click", () => handleItemUse(itemId));
    } else {
      slot.dataset.sig = "";
      slot.setAttribute("aria-label", "Empty item slot");
      slot.innerHTML = "<strong>Empty</strong>";
    }
    itemBar.appendChild(slot);
  }
}

function renderQueue() {
  const queue = el("enemy-queue");
  clearElement(queue);
  app.run.battle.queue.forEach((cardId) => {
    const slot = document.createElement("div");
    slot.className = `queue-slot${app.run.battle.bossId ? " is-boss" : ""}`;
    if (cardId) {
      const back = document.createElement("div");
      back.className = "queue-cardback pixel-image";
      slot.appendChild(back);
    }
    queue.appendChild(slot);
  });
}

function renderLaneRow(containerId, side) {
  const battle = app.run.battle;
  const row = el(containerId);
  clearElement(row);
  const board = getBoard(battle, side);
  board.forEach((unit, lane) => {
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "lane-slot";
    slot.dataset.side = side;
    slot.dataset.lane = String(lane);
    slot.disabled = app.battleAnimating;
    if (side === "player" && app.selection?.type === "play-card" && !unit) slot.classList.add("can-host");
    if (side === "player" && !unit && app.selection?.pendingLane === lane) slot.classList.add("is-reserved-target");
    if (side === "player" && app.selection?.type === "sacrifice" && unit && canSacrificeUnit(unit)) slot.classList.add("sacrifice-target");
    if (side === "enemy" && app.selection?.type === "item-target-enemy" && unit) slot.classList.add("attack-target");
    if (side === "enemy" && app.selection?.type === "hook-target" && unit) slot.classList.add("hook-target");
    slot.addEventListener("click", () => handleLaneClick(side, lane));
    if (unit) slot.appendChild(createCardElement(unit, { compact: true, battle, selected: app.inspect?.uid === unit.uid }));
    row.appendChild(slot);
  });
}

function renderScale() {
  const track = el("scale-track");
  clearElement(track);
  for (let value = -5; value <= 5; value += 1) {
    const notch = document.createElement("div");
    notch.className = "scale-notch";
    if (value === 0) notch.classList.add("is-center");
    if (value > 0 && value <= app.run.battle.scale) notch.classList.add("is-player");
    if (value < 0 && value >= app.run.battle.scale) notch.classList.add("is-enemy");
    track.appendChild(notch);
  }
}

function renderHand() {
  const hand = el("hand-row");
  clearElement(hand);
  app.run.battle.hand.forEach((entry) => {
    const card = createCardElement(entry, {
      compact: true,
      selected: app.selection?.handUid === entry.uid,
      disabled: app.run.battle.mustDraw || app.battleAnimating,
    });
    card.dataset.handUid = entry.uid;
    card.addEventListener("pointerdown", (event) => beginHandCardDrag(event, entry.uid));
    card.addEventListener("click", () => handleHandCardClick(entry.uid));
    hand.appendChild(card);
  });
}

function renderSelectionBanner() {
  const battle = app.run.battle;
  const banner = el("selection-banner");
  const text = el("selection-text");
  if (battle.mustDraw) {
    banner.classList.remove("hidden");
    text.textContent = "Draw from the deck or the squirrel pile.";
    return;
  }
  if (!app.selection) {
    banner.classList.add("hidden");
    return;
  }
  banner.classList.remove("hidden");
  if (app.selection.type === "sacrifice") {
    text.textContent = `Choose sacrifices (${app.selection.currentBlood}/${app.selection.requiredBlood} blood).`;
  } else if (app.selection.type === "play-card") {
    text.textContent = "Choose an open lane for the selected card.";
  } else if (app.selection.type === "item-target-enemy") {
    text.textContent = "Choose an enemy creature for the selected item.";
  } else if (app.selection.type === "hook-target") {
    text.textContent = "Choose an enemy creature to pull across the board.";
  }
}

function renderInspectPanel() {
  const panel = el("inspect-panel");
  clearElement(panel);
  const title = document.createElement("div");
  title.className = "panel-kicker";
  title.textContent = "Inspect";
  panel.appendChild(title);
  if (!app.inspect) {
    const copy = document.createElement("p");
    copy.className = "detail-copy";
    copy.textContent = "Touch a creature to read it.";
    panel.appendChild(copy);
    return;
  }
  const model = getSourceModel(app.inspect, app.run.battle);
  panel.appendChild(createCardElement(app.inspect.side ? app.inspect : model, { compact: true, disabled: true, battle: app.run.battle }));
  const meta = document.createElement("div");
  meta.className = "inspect-meta";
  meta.innerHTML = `<strong>${model.name}</strong><span>${model.attack}/${app.inspect.side ? app.inspect.health : model.health}</span>`;
  panel.appendChild(meta);
  const copy = document.createElement("p");
  copy.className = "detail-copy";
  copy.textContent = model.text;
  panel.appendChild(copy);
}

function renderBattleLog() {
  const logEl = el("battle-log");
  clearElement(logEl);
  app.run.battle.logs.forEach((entry) => {
    const div = document.createElement("div");
    div.className = "battle-log-entry";
    div.textContent = entry;
    logEl.appendChild(div);
  });
}

function countAvailableBlood(battle) {
  return battle.playerBoard.reduce((sum, unit) => {
    if (!unit || !canSacrificeUnit(unit)) return sum;
    return sum + sacrificeValue(unit);
  }, 0);
}

function canSacrificeUnit(unit) {
  const def = getCardDef(unit.cardId);
  return def.canSacrifice !== false && !def.tags.includes("pelt") && !def.tags.includes("terrain");
}

function sacrificeValue(unit) {
  return unit.sigils.includes("worthy-sacrifice") ? 3 : 1;
}

function handleHandCardClick(handUid) {
  if (guardBattleInteraction()) return;
  if (shouldSuppressHandClick(handUid)) return;
  if (!selectHandCardForPlay(handUid)) return;
  renderBattle();
}

function handleLaneClick(side, lane) {
  if (guardBattleInteraction()) return;
  const battle = app.run.battle;
  const board = getBoard(battle, side);
  const unit = board[lane];
  if (unit) app.inspect = unit;
  if (side === "player" && app.selection?.type === "sacrifice") {
    if (!unit || !canSacrificeUnit(unit)) {
      renderBattle();
      return;
    }
    const selectedIndex = app.selection.chosenLanes.indexOf(lane);
    if (selectedIndex >= 0) app.selection.chosenLanes.splice(selectedIndex, 1);
    else app.selection.chosenLanes.push(lane);
    app.selection.currentBlood = app.selection.chosenLanes.reduce((sum, selectedLane) => sum + sacrificeValue(battle.playerBoard[selectedLane]), 0);
    if (app.selection.currentBlood >= app.selection.requiredBlood) {
      const completed = {
        type: "play-card",
        handUid: app.selection.handUid,
        chosenLanes: [...app.selection.chosenLanes],
        pendingLane: app.selection.pendingLane,
      };
      app.selection = completed;
      if (typeof completed.pendingLane === "number" && !battle.playerBoard[completed.pendingLane]) {
        playSelectedCardToLane(completed.pendingLane);
        return;
      }
      showToast("Enough blood. Choose an open lane.");
    }
    renderBattle();
    return;
  }
  if (side === "player" && app.selection?.type === "play-card") {
    if (unit) return;
    playSelectedCardToLane(lane);
    return;
  }
  if (side === "enemy" && app.selection?.type === "item-target-enemy") {
    if (!unit) return;
    useTargetedItem(unit, lane);
    return;
  }
  if (side === "enemy" && app.selection?.type === "hook-target") {
    if (!unit) return;
    useFishHook(unit, lane);
    return;
  }
  renderBattle();
}

function cancelSelection() {
  if (guardBattleInteraction()) return;
  app.selection = null;
  renderBattle();
}

function reactGuardian(side, targetLane) {
  const battle = app.run.battle;
  const board = getBoard(battle, side);
  if (board[targetLane]) return;
  const sourceLane = board.findIndex((unit, index) => unit && index !== targetLane && unit.sigils.includes("guardian"));
  if (sourceLane < 0) return;
  const unit = board[sourceLane];
  board[sourceLane] = null;
  unit.lane = targetLane;
  board[targetLane] = unit;
  logBattle(battle, `${unit.name} leaps to guard lane ${targetLane + 1}.`);
}

function resolveSacrifices(lanes) {
  const battle = app.run.battle;
  if (lanes.length) triggerBattleFx("sacrifice");
  lanes.forEach((lane) => {
    const unit = battle.playerBoard[lane];
    if (!unit) return;
    if (unit.sigils.includes("many-lives")) {
      logBattle(battle, `${unit.name} endures the sacrifice.`);
      return;
    }
    maybeNoteCardChatter(battle, unit, "sacrifice");
    killUnit("player", lane, { reason: "sacrifice" });
  });
}

function playSelectedCardToLane(lane) {
  const battle = app.run.battle;
  const selection = app.selection;
  if (!selection || selection.type !== "play-card") return;
  const handIndex = battle.hand.findIndex((entry) => entry.uid === selection.handUid);
  if (handIndex < 0) {
    cancelSelection();
    return;
  }
  const entry = battle.hand.splice(handIndex, 1)[0];
  const model = getEntryModel(entry);
  if (model.costBlood > 0) resolveSacrifices(selection.chosenLanes || []);
  battle.playerBones = Math.max(0, battle.playerBones - model.costBones);
  const unit = createUnitFromEntry(app.run, entry, "player", lane);
  battle.playerBoard[lane] = unit;
  battle.lastPlayedLane = lane;
  reactGuardian("enemy", lane);
  handleOnPlayEffects(unit, entry, lane);
  logBattle(battle, `${model.name} enters lane ${lane + 1}.`);
  maybeNoteCardChatter(battle, unit, "play");
  app.selection = null;
  app.inspect = unit;
  saveRun();
  renderBattle();
}

function handleOnPlayEffects(unit, entry, lane) {
  const battle = app.run.battle;
  if (unit.sigils.includes("rabbit-hole")) battle.hand.push(createRuntimeEntry(app.run, "rabbit"));
  if (unit.sigils.includes("fecundity")) {
    const copy = cloneEntryForBattle(entry);
    copy.uid = nextUid(app.run, "hand");
    copy.removedSigils = unique([...(copy.removedSigils || []), "fecundity"]);
    battle.hand.push(copy);
  }
  if (unit.sigils.includes("dam-builder")) {
    [lane - 1, lane + 1].forEach((targetLane) => {
      if (targetLane < 0 || targetLane >= MAX_LANES || battle.playerBoard[targetLane]) return;
      battle.playerBoard[targetLane] = createUnitFromEntry(app.run, createRuntimeEntry(app.run, "dam"), "player", targetLane);
    });
  }
  if (unit.sigils.includes("hoarder") && battle.mainDeck.length) battle.hand.push(battle.mainDeck.shift());
  if (unit.sigils.includes("ant-spawner")) battle.hand.push(createRuntimeEntry(app.run, "worker-ant"));
  if (unit.sigils.includes("sentry")) damageUnit("enemy", lane, 1, { reason: "sentry", attacker: unit });
}

function consumeItem(itemId) {
  const index = app.run.items.indexOf(itemId);
  if (index >= 0) app.run.items.splice(index, 1);
}

function handleItemUse(itemId) {
  if (guardBattleInteraction()) return;
  const item = ITEM_BY_ID[itemId];
  if (!item) return;
  if (item.target === "none") {
    useImmediateItem(itemId);
    return;
  }
  app.selection = { type: itemId === "fish-hook" ? "hook-target" : "item-target-enemy", itemId };
  renderBattle();
}

function useImmediateItem(itemId) {
  const battle = app.run.battle;
  switch (itemId) {
    case "pliers":
      battle.scale += 1;
      logBattle(battle, "The pliers tip the scale in your favor.");
      break;
    case "squirrel-bottle":
      battle.hand.push(createRuntimeEntry(app.run, "squirrel"));
      logBattle(battle, "A bottled squirrel joins your hand.");
      break;
    case "black-goat-bottle":
      battle.hand.push(createRuntimeEntry(app.run, "black-goat"));
      logBattle(battle, "A bottled Black Goat joins your hand.");
      break;
    case "hourglass":
      battle.skipEnemyAttack += 1;
      logBattle(battle, "The hourglass stalls the next enemy attack.");
      break;
    default:
      return;
  }
  triggerBattleFx(itemId);
  consumeItem(itemId);
  app.selection = null;
  saveRun();
  if (checkBattleOutcome()) return;
  renderBattle();
}

function useTargetedItem(unit, lane) {
  const itemId = app.selection?.itemId;
  if (!itemId) return;
  if (itemId === "scissors") {
    logBattle(app.run.battle, `The scissors cut down ${unit.name}.`);
    killUnit("enemy", lane, { reason: "item" });
  } else if (itemId === "skinning-knife") {
    logBattle(app.run.battle, `The skinning knife claims ${unit.name} and a fresh pelt.`);
    killUnit("enemy", lane, { reason: "item" });
    app.run.battle.hand.push(createRuntimeEntry(app.run, "rabbit-pelt"));
  }
  triggerBattleFx(itemId);
  consumeItem(itemId);
  app.selection = null;
  saveRun();
  if (checkBattleOutcome()) return;
  renderBattle();
}

function useFishHook(unit, lane) {
  const battle = app.run.battle;
  const openLane = battle.playerBoard.findIndex((entry) => !entry);
  if (openLane < 0) {
    showToast("No open lane can receive the hooked creature.");
    return;
  }
  battle.enemyBoard[lane] = null;
  unit.side = "player";
  unit.lane = openLane;
  battle.playerBoard[openLane] = unit;
  consumeItem("fish-hook");
  app.selection = null;
  logBattle(battle, `${unit.name} is hooked into your board.`);
  triggerBattleFx("fish-hook");
  saveRun();
  renderBattle();
}

function drawFromMainDeck(battle, silent = false) {
  if (!battle.mainDeck.length) {
    if (!silent) showToast("The main deck is empty. Starvation approaches.");
    battle.starvations += 1;
    const lane = randInt(app.run, 0, MAX_LANES);
    if (!battle.queue[lane]) battle.queue[lane] = "starvation";
    battle.mustDraw = false;
    return;
  }
  const drawn = battle.mainDeck.shift();
  battle.hand.push(drawn);
  battle.mustDraw = false;
  maybeNoteCardChatter(battle, drawn, "draw");
}

function drawFromSideDeck(battle, silent = false) {
  if (!battle.sideDeck.length) {
    if (!silent) showToast("The squirrel deck is empty.");
    return;
  }
  battle.hand.push(battle.sideDeck.shift());
  battle.mustDraw = false;
}

function handleDrawMain() {
  if (guardBattleInteraction()) return;
  drawFromMainDeck(app.run.battle);
  saveRun();
  renderBattle();
}

function handleDrawSide() {
  if (guardBattleInteraction()) return;
  drawFromSideDeck(app.run.battle);
  saveRun();
  renderBattle();
}

function getUnitBaseAttack(battle, unit) {
  let attack = unit.baseAttack;
  if (unit.sigils.includes("ant-power")) {
    attack = getBoard(battle, unit.side).filter((candidate) => candidate && ["worker-ant", "flying-ant", "ant-queen"].includes(candidate.cardId)).length;
  }
  const board = getBoard(battle, unit.side);
  [unit.lane - 1, unit.lane + 1].forEach((lane) => {
    const ally = board[lane];
    if (ally && ally.sigils.includes("leader")) attack += 1;
  });
  return Math.max(0, attack);
}

function getAttackAgainstTarget(battle, attacker, target) {
  let attack = getUnitBaseAttack(battle, attacker);
  if (target && target.sigils.includes("stinky")) attack -= 1;
  return Math.max(0, attack);
}

function prepareDefender(attacker, targetLane) {
  const battle = app.run.battle;
  const defenderSide = attacker.side === "player" ? "enemy" : "player";
  const board = getBoard(battle, defenderSide);
  if (!board[targetLane]) {
    const burrowerLane = board.findIndex((unit, lane) => {
      if (!unit || lane === targetLane || !unit.sigils.includes("burrower")) return false;
      if (attacker.sigils.includes("airborne") && !unit.sigils.includes("mighty-leap")) return false;
      return true;
    });
    if (burrowerLane >= 0) {
      const unit = board[burrowerLane];
      board[burrowerLane] = null;
      unit.lane = targetLane;
      board[targetLane] = unit;
      logBattle(battle, `${unit.name} burrows into lane ${targetLane + 1}.`);
    }
  }
  let defender = board[targetLane];
  if (defender && defender.sigils.includes("waterborne")) defender = null;
  return defender;
}

function strikeLanes(unit) {
  if (unit.sigils.includes("omni-strike")) return [0, 1, 2, 3];
  if (unit.sigils.includes("trifurcated")) return [unit.lane - 1, unit.lane, unit.lane + 1];
  if (unit.sigils.includes("bifurcated")) return [unit.lane - 1, unit.lane + 1];
  return [unit.lane];
}

function applyMoonTidalLock() {
  const battle = app.run.battle;
  const moonIsAwake = battle.enemyBoard.some((unit) => unit && unit.cardId === "moon");
  if (!moonIsAwake) return;
  const removableLanes = battle.playerBoard
    .map((unit, lane) => unit && ["squirrel", "rabbit"].includes(unit.cardId) ? lane : -1)
    .filter((lane) => lane >= 0);
  if (!removableLanes.length) return;
  removableLanes.forEach((lane) => killUnit("player", lane, { reason: "moon-tide" }));
  noteUniqueBattleLine(battle, "moon-tidal-lock", TABLE_CHATTER.moon);
}

function resolveStrike(attacker, targetLane) {
  const battle = app.run.battle;
  if (targetLane < 0 || targetLane >= MAX_LANES) return;
  const defender = prepareDefender(attacker, targetLane);
  const attack = getAttackAgainstTarget(battle, attacker, defender);
  if (attack <= 0) return;
  if (!defender || (attacker.sigils.includes("airborne") && !defender.sigils.includes("mighty-leap"))) {
    battle.scale += attacker.side === "player" ? attack : -attack;
    logBattle(battle, `${attacker.name} strikes the scale for ${attack}.`);
    triggerBattleFx(attacker.side === "player" ? "scale-player" : "scale-enemy");
    return;
  }
  damageUnit(defender.side, defender.lane, attack, { reason: "combat", attacker, lethalTouch: attacker.sigils.includes("touch-of-death") });
}

function tryLooseTail(side, lane) {
  const battle = app.run.battle;
  const board = getBoard(battle, side);
  const unit = board[lane];
  if (!unit || !unit.sigils.includes("loose-tail") || unit.flags.tailUsed) return;
  const preferred = unit.flags.direction >= 0 ? [lane + 1, lane - 1] : [lane - 1, lane + 1];
  const escapeLane = preferred.find((targetLane) => targetLane >= 0 && targetLane < MAX_LANES && !board[targetLane]);
  if (escapeLane == null) return;
  board[lane] = createUnitFromEntry(app.run, createRuntimeEntry(app.run, "skink-tail"), side, lane);
  unit.flags.tailUsed = true;
  unit.lane = escapeLane;
  board[escapeLane] = unit;
  logBattle(battle, `${unit.name} slips away and leaves a tail behind.`);
}

function damageUnit(side, lane, amount, context = {}) {
  const battle = app.run.battle;
  if (amount <= 0) return;
  tryLooseTail(side, lane);
  const board = getBoard(battle, side);
  const unit = board[lane];
  if (!unit) return;
  triggerBattleFx(side === "player" ? "hit-player" : "hit-enemy");
  if (unit.sigils.includes("bees-within") && side === "player") battle.hand.push(createRuntimeEntry(app.run, "bee"));
  if (context.lethalTouch) unit.health = 0;
  else unit.health -= amount;
  if (unit.health <= 0) {
    killUnit(side, lane, context);
    return;
  }
  if (unit.sigils.includes("sharp-quills") && context.attacker) damageUnit(context.attacker.side, context.attacker.lane, 1, { reason: "sharp-quills" });
}

function handleDeathFollowups(deadUnit, context) {
  const battle = app.run.battle;
  if (deadUnit.side === "player") {
    battle.playerBones += 1;
    if (deadUnit.sigils.includes("bone-king")) battle.playerBones += 3;
  } else {
    const scavengers = battle.playerBoard.filter((unit) => unit && unit.sigils.includes("scavenger")).length;
    if (scavengers) battle.playerBones += scavengers;
  }
  if (deadUnit.cardId === "ouroboros" && deadUnit.sourceUid) {
    const persistent = getPersistentEntry(deadUnit.sourceUid);
    if (persistent) {
      persistent.attackBuff += 1;
      persistent.healthBuff += 1;
    }
  }
  if (deadUnit.sigils.includes("unkillable")) {
    if (deadUnit.sourceUid) {
      const persistent = getPersistentEntry(deadUnit.sourceUid);
      if (persistent) battle.hand.push(cloneEntryForBattle(persistent));
    } else {
      battle.hand.push(createRuntimeEntry(app.run, deadUnit.cardId));
    }
  }
  if (deadUnit.special === "pack-mule") {
    const room = getItemCapacity(app.run) - app.run.items.length;
    const gained = takeRandomDistinct(app.run, ITEM_DEFS.map((item) => item.id), Math.max(0, room));
    app.run.items.push(...gained);
    logBattle(battle, `The Pack Mule spills ${gained.length ? gained.join(", ") : "nothing useful"}.`);
  }
  if (deadUnit.special === "bait-bucket") {
    const board = getBoard(battle, deadUnit.side);
    if (!board[deadUnit.lane]) board[deadUnit.lane] = createEnemyUnit(app.run, battle, "great-white", deadUnit.lane);
  }
  if (deadUnit.special === "strange-frog") {
    const board = getBoard(battle, deadUnit.side);
    if (!board[deadUnit.lane]) board[deadUnit.lane] = createUnitFromEntry(app.run, createRuntimeEntry(app.run, "leaping-trap"), deadUnit.side, deadUnit.lane);
  }
  if (deadUnit.sigils.includes("steel-trap") && context.attacker) {
    killUnit(context.attacker.side, context.attacker.lane, { reason: "trap" });
    if (context.attacker.side === "player") battle.hand.push(createRuntimeEntry(app.run, "wolf-pelt"));
  }
}

function killUnit(side, lane, context = {}) {
  const battle = app.run.battle;
  const board = getBoard(battle, side);
  const unit = board[lane];
  if (!unit) return;
  board[lane] = null;
  triggerBattleFx(side === "player" ? "death-player" : "death-enemy");
  logBattle(battle, `${unit.name} is removed from lane ${lane + 1}.`);
  handleDeathFollowups(unit, context);
}

function pushChain(board, lane, direction) {
  if (lane < 0 || lane >= MAX_LANES) return false;
  if (!board[lane]) return true;
  if (!pushChain(board, lane + direction, direction)) return false;
  const unit = board[lane];
  board[lane + direction] = unit;
  unit.lane = lane + direction;
  board[lane] = null;
  return true;
}

function handleMovementForSide(side) {
  const battle = app.run.battle;
  const board = getBoard(battle, side);
  board.forEach((unit, lane) => {
    if (!unit || unit.lane !== lane) return;
    if (!unit.sigils.includes("sprinter") && !unit.sigils.includes("hefty")) return;
    let direction = unit.flags.direction || 1;
    let targetLane = lane + direction;
    const wantsPush = unit.sigils.includes("hefty");
    let canMove = wantsPush ? pushChain(board, targetLane, direction) : targetLane >= 0 && targetLane < MAX_LANES && !board[targetLane];
    if (!canMove) {
      direction *= -1;
      unit.flags.direction = direction;
      targetLane = lane + direction;
      canMove = wantsPush ? pushChain(board, targetLane, direction) : targetLane >= 0 && targetLane < MAX_LANES && !board[targetLane];
    }
    if (targetLane < 0 || targetLane >= MAX_LANES || !canMove) return;
    board[lane] = null;
    unit.lane = targetLane;
    unit.flags.direction = direction;
    board[targetLane] = unit;
  });
}

function deployQueue() {
  const battle = app.run.battle;
  battle.queue.forEach((cardId, lane) => {
    if (!cardId || battle.enemyBoard[lane]) return;
    battle.enemyBoard[lane] = createEnemyUnit(app.run, battle, cardId, lane);
    battle.queue[lane] = null;
    reactGuardian("player", lane);
  });
}

function queueNextWaveIfNeeded() {
  const battle = app.run.battle;
  if (battle.queue.some(Boolean)) return;
  if (!battle.upcomingWaves.length) return;
  battle.queue = battle.upcomingWaves.shift();
}

function evolveUnits() {
  const battle = app.run.battle;
  ["player", "enemy"].forEach((side) => {
    getBoard(battle, side).forEach((unit, lane) => {
      if (!unit) return;
      unit.turnsInPlay += 1;
      if (side === "player" && unit.sigils.includes("ant-spawner")) battle.hand.push(createRuntimeEntry(app.run, "worker-ant"));
      if (!unit.sigils.includes("fledgling") || unit.flags.evolved || unit.turnsInPlay < 1) return;
      const targetId = getCardDef(unit.cardId).evolvesTo;
      if (!targetId) return;
      const replacement = createUnitFromEntry(app.run, createRuntimeEntry(app.run, targetId), side, lane);
      replacement.turnsInPlay = unit.turnsInPlay;
      replacement.flags.direction = unit.flags.direction;
      replacement.flags.evolved = true;
      getBoard(battle, side)[lane] = replacement;
      logBattle(battle, `${unit.name} evolves into ${replacement.name}.`);
    });
  });
}

async function runAttackStep(side) {
  const battle = app.run.battle;
  for (let lane = 0; lane < MAX_LANES; lane += 1) {
    const unit = getBoard(battle, side)[lane];
    if (!unit || unit.lane !== lane) continue;
    const hasStrikeLane = strikeLanes(unit).some((targetLane) => targetLane >= 0 && targetLane < MAX_LANES);
    if (hasStrikeLane && getUnitBaseAttack(battle, unit) > 0) await animateAttackLunge(side, lane);
    strikeLanes(unit).forEach((targetLane) => resolveStrike(unit, targetLane));
    const stillHere = getBoard(battle, side)[lane];
    if (stillHere && stillHere.uid === unit.uid && unit.sigils.includes("brittle")) killUnit(side, lane, { reason: "brittle" });
    if (checkBattleOutcome()) return true;
  }
  handleMovementForSide(side);
  return false;
}

function handleBossPhaseAdvance() {
  const battle = app.run.battle;
  if (!battle.bossId || battle.phaseIndex >= battle.phases.length - 1) return false;
  const nextPhase = battle.phaseIndex + 1;
  if (battle.bossId === "prospector") {
    battle.playerBoard = battle.playerBoard.map((unit, lane) => unit ? createUnitFromEntry(app.run, createRuntimeEntry(app.run, "gold-nugget"), "player", lane) : null);
  }
  if (battle.bossId === "angler") {
    const lane = battle.lastPlayedLane;
    if (lane != null && battle.playerBoard[lane]) {
      const openEnemyLane = battle.enemyBoard[lane] ? battle.enemyBoard.findIndex((entry) => !entry) : lane;
      if (openEnemyLane >= 0) {
        const stolen = battle.playerBoard[lane];
        battle.playerBoard[lane] = null;
        stolen.side = "enemy";
        stolen.lane = openEnemyLane;
        battle.enemyBoard[openEnemyLane] = stolen;
      }
    }
  }
  battle.scale = 0;
  beginBattlePhase(battle, nextPhase);
  return true;
}

function loseCandle() {
  app.run.candles -= 1;
  if (app.run.candles <= 0) {
    const deathcard = recordDeathcardFromRun(app.run);
    const copy = deathcard
      ? `The last candle has gone out. Leshy carves ${deathcard.name} into his book.`
      : "The last candle has gone out.";
    endRun(false, copy, "The Candle Fails");
    return;
  }
  showToast("A candle has gone out. The battle begins again.");
  const node = getNodeById(app.run.lastBattleNodeId);
  if (node) startBattle(node);
}

function checkBattleOutcome() {
  const battle = app.run.battle;
  if (battle.scale >= SCALE_LIMIT) {
    const overflow = Math.max(0, battle.scale - SCALE_LIMIT);
    if (handleBossPhaseAdvance()) {
      saveRun();
      renderBattle();
      return true;
    }
    app.run.teeth += overflow;
    handleBattleVictory();
    return true;
  }
  if (battle.scale <= -SCALE_LIMIT) {
    loseCandle();
    return true;
  }
  return false;
}

function applyRunVictoryUnlocks(run) {
  app.profile.highestClearedCP = Math.max(app.profile.highestClearedCP, run.cp);
  app.profile.ascensionLevel = Math.max(app.profile.ascensionLevel, run.cp + 1);
  app.profile.winsByDeck[run.starterDeckId] = (app.profile.winsByDeck[run.starterDeckId] || 0) + 1;
  app.profile.stats.victories += 1;
  UNLOCK_TABLE.forEach((unlock) => {
    if (run.cp < unlock.clearCp) return;
    if (unlock.deck) app.profile.unlockedDeckIds = unique([...app.profile.unlockedDeckIds, unlock.deck]);
    if (unlock.challenge) app.profile.unlockedChallengeIds = unique([...app.profile.unlockedChallengeIds, unlock.challenge]);
  });
}

function handleBattleVictory() {
  const battle = app.run.battle;
  const nodeId = battle.nodeId;
  app.run.battle = null;
  app.run.stats.battlesWon += 1;
  if (battle.bossId) {
    app.run.stats.bossesDefeated += 1;
    app.profile.stats.bossesDefeated += 1;
    saveProfile();
  }
  if (battle.rewardKind === "victory") {
    applyRunVictoryUnlocks(app.run);
    saveProfile();
    endRun(true, "Leshy is beaten and the run is complete.", "Victory");
    return;
  }
  const rewardCards = battle.rewardKind === "rare-reward"
    ? pickRewardCards(app.run, REWARD_POOLS.rare, 3)
    : pickRewardCards(app.run, getRewardPoolForMap(app.run.mapIndex), 3);
  app.run.event = {
    kind: "reward",
    nodeId,
    title: battle.rewardKind === "rare-reward" ? "Boss Reward" : "Choose A Card",
    copy: battle.rewardKind === "rare-reward" ? "Take one rare card and continue." : "Take one card and return to the trail.",
    rewards: rewardCards,
    rare: battle.rewardKind === "rare-reward",
  };
  app.run.scene = "event";
  saveRun();
  renderEvent();
}

async function handleBell() {
  const battle = app.run.battle;
  if (guardBattleInteraction(false)) return;
  if (battle.mustDraw) {
    showToast("Draw first.");
    return;
  }
  if (app.selection) {
    showToast("Finish the current selection first.");
    return;
  }
  app.battleAnimating = true;
  renderBattle();
  try {
    if (await runAttackStep("player")) return;
    deployQueue();
    if (app.run?.scene === "battle" && app.run.battle === battle) renderBattle();
    if (battle.skipEnemyAttack > 0) {
      battle.skipEnemyAttack -= 1;
      logBattle(battle, "The enemy attack step is skipped.");
    } else if (await runAttackStep("enemy")) {
      return;
    }
    evolveUnits();
    queueNextWaveIfNeeded();
    applyMoonTidalLock();
    battle.mustDraw = true;
    battle.turn += 1;
    app.inspect = null;
    saveRun();
  } finally {
    app.battleAnimating = false;
    if (app.run?.scene === "battle" && app.run.battle) renderBattle();
  }
}

function startEventForNode(node) {
  const run = app.run;
  let event = null;
  switch (node.type) {
    case "campfire":
      event = {
        kind: "campfire",
        nodeId: node.id,
        title: "Campfire",
        copy: hasChallenge(run, "scarce-campfires") && run.flags.campfiresUsed >= 1
          ? "The survivors have already gone. Only cinders remain."
          : "Choose one creature to gain a small permanent boost.",
        stat: sample(run, ["attack", "health"]),
      };
      break;
    case "backpack":
      event = {
        kind: "backpack",
        nodeId: node.id,
        title: "Backpack",
        copy: "Three items wait inside the old pack.",
        items: takeRandomDistinct(run, ITEM_DEFS.map((item) => item.id), 3),
      };
      break;
    case "sacrificial-stones":
      event = {
        kind: "sacrificial-stones",
        nodeId: node.id,
        title: "Sacrificial Stones",
        copy: "One creature gives its sigils. Another keeps them.",
        stage: "choose-donor",
        donorUid: null,
      };
      break;
    case "trapper":
      if (!run.flags.freeTrapperPelt) {
        run.flags.freeTrapperPelt = true;
        run.deck.push(createDeckEntry(run, "rabbit-pelt"));
        markDiscovered(["rabbit-pelt"]);
      }
      event = { kind: "trapper", nodeId: node.id, title: "The Trapper", copy: "Pelts are always useful. The first rabbit pelt is already yours." };
      break;
    case "trader":
      event = { kind: "trader", nodeId: node.id, title: "The Trader", copy: "Pelts can become something better. Choose what to trade first.", tradeType: null, offers: [] };
      break;
    case "deck-trial":
      event = { kind: "deck-trial", nodeId: node.id, title: "Deck Trial", copy: "Reveal three cards to see whether the deck passes.", stage: "pick-trial", trials: takeRandomDistinct(run, TRIAL_DEFS.map((trial) => trial.id), 3) };
      break;
    default:
      return;
  }
  run.scene = "event";
  run.event = event;
  saveRun();
  renderEvent();
}

function markNodeCleared(nodeId) {
  const map = getCurrentMap();
  const node = map.find((entry) => entry.id === nodeId);
  if (!node) return;
  node.state = "cleared";
  const clearedIds = map.filter((entry) => entry.state === "cleared").map((entry) => entry.id);
  unlockAvailableNodes(map, clearedIds);
}

function completeNodeAndReturnToMap(nodeId) {
  const node = getNodeById(nodeId);
  if (!node) return;
  markNodeCleared(nodeId);
  if (node.type === "boss" && app.run.mapIndex < app.run.maps.length - 1) {
    app.run.mapIndex += 1;
    unlockAvailableNodes(getCurrentMap(), []);
  }
  app.run.scene = "map";
  app.run.event = null;
  app.selectedMapNodeId = getCurrentMap().find((entry) => entry.state === "available")?.id || null;
  saveRun();
  renderMap();
}

function countPeltsInDeck() {
  return app.run.deck.reduce((counts, entry) => {
    const def = getCardDef(entry.cardId);
    if (!def.tags.includes("pelt")) return counts;
    counts[entry.cardId] = (counts[entry.cardId] || 0) + 1;
    return counts;
  }, {});
}

function buildTraderOffers(tradeType) {
  const isRare = tradeType === "golden-pelt";
  const pool = isRare ? REWARD_POOLS.rare : getRewardPoolForMap(app.run.mapIndex);
  const offerCount = tradeType === "golden-pelt" ? 4 : 8;
  return takeRandomDistinct(app.run, pool, offerCount).map((cardId) => ({
    cardId,
    addedSigils: tradeType === "wolf-pelt" ? [sample(app.run, BONUS_SIGIL_POOL)] : [],
  }));
}

function renderEvent() {
  showScreen("event-screen");
  const event = app.run.event;
  const panel = el("event-panel");
  panel.className = `event-panel event-panel--${event.kind}${event.rare ? " is-rare" : ""}`;
  clearElement(panel);
  const header = document.createElement("div");
  header.className = "event-header";
  header.innerHTML = `<div class="panel-kicker">${event.rare ? "Rare Reward" : titleCase(event.kind)}</div><h2>${event.title}</h2><p class="detail-copy">${event.copy}</p>`;
  const body = document.createElement("div");
  body.className = "event-body";
  const actions = document.createElement("div");
  actions.className = "event-actions";

  if (event.kind === "reward") {
    const grid = document.createElement("div");
    grid.className = "reward-grid";
    event.rewards.forEach((reward) => {
      const card = createCardElement({ cardId: reward.cardId, attackBuff: reward.attackBuff || 0, healthBuff: reward.healthBuff || 0, addedSigils: reward.addedSigils || [], removedSigils: [] }, {});
      card.addEventListener("click", () => {
        app.run.deck.push(createDeckEntry(app.run, reward.cardId, { addedSigils: reward.addedSigils || [] }));
        app.run.stats.cardsAdded += 1;
        markDiscovered([reward.cardId]);
        completeNodeAndReturnToMap(event.nodeId);
      });
      grid.appendChild(card);
    });
    body.appendChild(grid);
  } else if (event.kind === "campfire") {
    const note = document.createElement("div");
    note.className = "event-note";
    note.textContent = hasChallenge(app.run, "scarce-campfires") && app.run.flags.campfiresUsed >= 1 ? "The campfire is cold. Nothing remains to claim here." : `This fire will grant ${event.stat === "attack" ? "+1 power" : "+1 health"} to one card in your deck.`;
    body.appendChild(note);
    if (!(hasChallenge(app.run, "scarce-campfires") && app.run.flags.campfiresUsed >= 1)) {
      const grid = document.createElement("div");
      grid.className = "reward-grid";
      app.run.deck.forEach((entry) => {
        const card = createCardElement(entry, {});
        card.addEventListener("click", () => {
          if (event.stat === "attack") entry.attackBuff += 1;
          else entry.healthBuff += 1;
          app.run.flags.campfiresUsed += 1;
          completeNodeAndReturnToMap(event.nodeId);
        });
        grid.appendChild(card);
      });
      body.appendChild(grid);
    }
    actions.appendChild(button("Leave", "inscry-btn", () => completeNodeAndReturnToMap(event.nodeId)));
  } else if (event.kind === "backpack") {
    if (app.run.items.length >= getItemCapacity(app.run)) {
      const note = document.createElement("div");
      note.className = "event-note";
      note.textContent = "Your pack is full. Instead of a tool, a Pack Rat scurries into your deck.";
      body.appendChild(note);
      const reward = document.createElement("div");
      reward.className = "reward-grid";
      const card = createCardElement(getCardDef("pack-rat"), {});
      card.addEventListener("click", () => {
        app.run.deck.push(createDeckEntry(app.run, "pack-rat"));
        app.run.stats.cardsAdded += 1;
        markDiscovered(["pack-rat"]);
        completeNodeAndReturnToMap(event.nodeId);
      });
      reward.appendChild(card);
      body.appendChild(reward);
    } else {
      const grid = document.createElement("div");
      grid.className = "event-choices";
      event.items.forEach((itemId) => {
        const item = ITEM_BY_ID[itemId];
        const choice = document.createElement("button");
        choice.type = "button";
        choice.className = "item-choice";
        choice.innerHTML = `<strong>${item.name}</strong><small>${item.description}</small>`;
        choice.addEventListener("click", () => {
          app.run.items.push(itemId);
          completeNodeAndReturnToMap(event.nodeId);
        });
        grid.appendChild(choice);
      });
      body.appendChild(grid);
    }
  } else if (event.kind === "sacrificial-stones") {
    const grid = document.createElement("div");
    grid.className = "reward-grid";
    if (event.stage === "choose-donor") {
      app.run.deck.filter((entry) => getEntryModel(entry).sigils.length).forEach((entry) => {
        const card = createCardElement(entry, {});
        card.addEventListener("click", () => {
          event.stage = "choose-recipient";
          event.donorUid = entry.uid;
          saveRun();
          renderEvent();
        });
        grid.appendChild(card);
      });
    } else {
      const donor = app.run.deck.find((entry) => entry.uid === event.donorUid);
      app.run.deck.filter((entry) => entry.uid !== donor.uid).forEach((entry) => {
        const card = createCardElement(entry, {});
        card.addEventListener("click", () => {
          entry.addedSigils = unique([...(entry.addedSigils || []), ...getEntryModel(donor).sigils]);
          app.run.deck = app.run.deck.filter((cardEntry) => cardEntry.uid !== donor.uid);
          completeNodeAndReturnToMap(event.nodeId);
        });
        grid.appendChild(card);
      });
    }
    body.appendChild(grid);
    actions.appendChild(button("Leave", "stone-btn", () => completeNodeAndReturnToMap(event.nodeId)));
  } else if (event.kind === "trapper") {
    const grid = document.createElement("div");
    grid.className = "reward-grid";
    [["rabbit-pelt", 2], ["wolf-pelt", 4], ["golden-pelt", 7]].forEach(([cardId, base]) => {
      const price = base + (app.run.mapIndex === 0 ? 0 : app.run.mapIndex === 1 ? 1 : 2) + (hasChallenge(app.run, "pricey-pelts") ? 1 : 0);
      const wrapper = document.createElement("div");
      wrapper.className = "codex-card";
      wrapper.appendChild(createCardElement(getCardDef(cardId), { compact: true, disabled: true }));
      wrapper.appendChild(button(`Buy (${price} teeth)`, "inscry-btn", () => {
        if (app.run.teeth < price) {
          showToast("Not enough teeth.");
          return;
        }
        app.run.teeth -= price;
        app.run.deck.push(createDeckEntry(app.run, cardId));
        markDiscovered([cardId]);
        saveRun();
        renderEvent();
      }));
      grid.appendChild(wrapper);
    });
    body.appendChild(grid);
    actions.appendChild(button("Leave", "stone-btn", () => completeNodeAndReturnToMap(event.nodeId)));
  } else if (event.kind === "trader") {
    const pelts = countPeltsInDeck();
    const types = ["rabbit-pelt", "wolf-pelt", "golden-pelt"].filter((cardId) => pelts[cardId] > 0);
    if (!types.length) {
      body.innerHTML = "<div class='event-note'>You have no pelts to trade.</div>";
    } else {
      const chips = document.createElement("div");
      chips.className = "chip-row";
      types.forEach((type) => chips.appendChild(button(titleCase(type.replace("-pelt", " pelt")), `stone-btn${event.tradeType === type ? " is-active" : ""}`, () => {
        event.tradeType = type;
        event.offers = buildTraderOffers(type);
        saveRun();
        renderEvent();
      })));
      body.appendChild(chips);
      if (!event.tradeType) {
        event.tradeType = types[0];
        event.offers = buildTraderOffers(event.tradeType);
      }
      const grid = document.createElement("div");
      grid.className = "trader-grid";
      event.offers.forEach((offer) => {
        const card = createCardElement({ cardId: offer.cardId, attackBuff: 0, healthBuff: 0, addedSigils: offer.addedSigils || [], removedSigils: [] }, {});
        card.addEventListener("click", () => {
          const peltIndex = app.run.deck.findIndex((entry) => entry.cardId === event.tradeType);
          if (peltIndex < 0) return;
          app.run.deck.splice(peltIndex, 1);
          app.run.deck.push(createDeckEntry(app.run, offer.cardId, { addedSigils: offer.addedSigils || [] }));
          markDiscovered([offer.cardId]);
          event.offers = buildTraderOffers(event.tradeType);
          saveRun();
          renderEvent();
        });
        grid.appendChild(card);
      });
      body.appendChild(grid);
    }
    actions.appendChild(button("Leave", "inscry-btn", () => completeNodeAndReturnToMap(event.nodeId)));
  } else if (event.kind === "deck-trial") {
    if (event.stage === "pick-trial") {
      const grid = document.createElement("div");
      grid.className = "event-choices";
      event.trials.forEach((trialId) => {
        const trial = TRIAL_BY_ID[trialId];
        const buttonEl = document.createElement("button");
        buttonEl.type = "button";
        buttonEl.className = "trial-choice";
        buttonEl.innerHTML = `<strong>${trial.name}</strong><small>${trial.description}</small>`;
        buttonEl.addEventListener("click", () => {
          event.stage = "resolved";
          event.trialId = trialId;
          event.success = evaluateTrial(trialId);
          if (event.success) event.rewards = pickRewardCards(app.run, getRewardPoolForMap(app.run.mapIndex), 3).map((reward) => ({ ...reward, addedSigils: takeRandomDistinct(app.run, BONUS_SIGIL_POOL, 2) }));
          saveRun();
          renderEvent();
        });
        grid.appendChild(buttonEl);
      });
      body.appendChild(grid);
      actions.appendChild(button("Leave", "stone-btn", () => completeNodeAndReturnToMap(event.nodeId)));
    } else if (!event.success) {
      body.innerHTML = `<div class="event-note">${TRIAL_BY_ID[event.trialId].name} failed. The deck turns away in silence.</div>`;
      actions.appendChild(button("Leave", "inscry-btn", () => completeNodeAndReturnToMap(event.nodeId)));
    } else {
      const grid = document.createElement("div");
      grid.className = "reward-grid";
      event.rewards.forEach((reward) => {
        const card = createCardElement({ cardId: reward.cardId, attackBuff: reward.attackBuff || 0, healthBuff: reward.healthBuff || 0, addedSigils: reward.addedSigils || [], removedSigils: [] }, {});
        card.addEventListener("click", () => {
          app.run.deck.push(createDeckEntry(app.run, reward.cardId, { addedSigils: reward.addedSigils || [] }));
          markDiscovered([reward.cardId]);
          completeNodeAndReturnToMap(event.nodeId);
        });
        grid.appendChild(card);
      });
      body.appendChild(grid);
    }
  }
  panel.append(header, body, actions);
}

function evaluateTrial(trialId) {
  const sampleCards = takeRandomDistinct(app.run, app.run.deck, Math.min(3, app.run.deck.length)).map((entry) => getEntryModel(entry));
  switch (trialId) {
    case "blood": return sampleCards.reduce((sum, card) => sum + card.costBlood, 0) >= 4;
    case "bones": return sampleCards.reduce((sum, card) => sum + card.costBones, 0) >= 5;
    case "power": return sampleCards.reduce((sum, card) => sum + card.attack, 0) >= 4;
    case "health": return sampleCards.reduce((sum, card) => sum + card.health, 0) >= 6;
    case "wisdom": return sampleCards.reduce((sum, card) => sum + card.sigils.length, 0) >= 3;
    case "kin": {
      const tribes = sampleCards.map((card) => card.tribe).filter((tribe) => tribe && tribe !== "none");
      const ids = sampleCards.map((card) => card.id);
      return tribes.some((tribe) => tribes.filter((candidate) => candidate === tribe).length >= 2) || ids.some((id) => ids.filter((candidate) => candidate === id).length >= 2);
    }
    default: return false;
  }
}

function renderCodex() {
  showScreen("codex-screen");
  el("codex-screen").dataset.tab = app.codexTab;
  el("codex-current-tab").classList.toggle("is-active", app.codexTab === "current");
  el("codex-discovered-tab").classList.toggle("is-active", app.codexTab === "discovered");
  const summary = el("codex-summary");
  if (app.codexTab === "current" && app.run) {
    summary.innerHTML = `<div class="panel-kicker">Current Run</div><p class="detail-copy">Deck size: ${app.run.deck.length}. Teeth: ${app.run.teeth}. Candles: ${app.run.candles}. Items: ${app.run.items.length}/${getItemCapacity(app.run)}.</p>`;
  } else {
    summary.innerHTML = `<div class="panel-kicker">Collection</div><p class="detail-copy">Discovered cards: ${app.profile.discoveredCardIds.length}. Deathcards carved: ${getProfileDeathcards().length}. Unlocked decks: ${app.profile.unlockedDeckIds.length}. Unlocked challenges: ${app.profile.unlockedChallengeIds.length}.</p>`;
  }
  const grid = el("codex-grid");
  clearElement(grid);
  const cards = app.codexTab === "current" && app.run
    ? app.run.deck
    : unique([...(app.profile.discoveredCardIds || []), ...getProfileDeathcards().map((card) => card.id)])
      .map((cardId) => getCardDef(cardId))
      .filter(Boolean)
      .sort((left, right) => left.name.localeCompare(right.name));
  cards.forEach((cardLike) => {
    const model = cardLike.cardId ? getEntryModel(cardLike) : cardLike;
    const wrapper = document.createElement("div");
    wrapper.className = "codex-card";
    wrapper.appendChild(createCardElement(cardLike.cardId ? cardLike : model, { compact: true, disabled: true }));
    const title = document.createElement("h4");
    title.textContent = model.name;
    const description = document.createElement("p");
    description.textContent = model.text;
    wrapper.append(title, description);
    grid.appendChild(wrapper);
  });
}

function renderEnding() {
  showScreen("ending-screen");
  if (!app.endingState) return;
  el("ending-screen").dataset.outcome = app.endingState.kicker === "The Table Breaks" ? "victory" : "defeat";
  el("ending-kicker").textContent = app.endingState.kicker;
  el("ending-title").textContent = app.endingState.title;
  el("ending-copy").textContent = app.endingState.copy;
  const stats = el("ending-stats");
  clearElement(stats);
  app.endingState.stats.forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "ending-stat";
    card.innerHTML = `<strong>${label}</strong><span>${value}</span>`;
    stats.appendChild(card);
  });
}

function endRun(victory, copy, title) {
  const finishedRun = app.run;
  app.endingState = {
    kicker: victory ? "The Table Breaks" : "The Candle Fails",
    title,
    copy,
    stats: [
      ["Deck", finishedRun.deck.length],
      ["Teeth", finishedRun.teeth],
      ["Bosses", finishedRun.stats.bossesDefeated],
      ["Cards Added", finishedRun.stats.cardsAdded],
    ],
  };
  clearRun();
  renderEnding();
}

function openCodex(returnScreen) {
  app.codexReturn = returnScreen;
  app.codexTab = "current";
  renderCodex();
}

function closeCodex() {
  if (app.codexReturn === "battle-screen" && app.run?.scene === "battle") renderBattle();
  else if (app.codexReturn === "map-screen" && app.run?.scene === "map") renderMap();
  else if (app.codexReturn === "ending-screen") renderEnding();
  else renderTitle();
}

function renderOptions() {
  const optionsList = el("options-list");
  clearElement(optionsList);
  [
    ["Reduced Motion", "reducedMotion", "Lower ambient motion and transitions."],
    ["Pixel Scaling", "pixelScaling", "Keep pixel-art rendering crisp."],
    ["Confirm Concede", "confirmConcede", "Require a second click before conceding."],
  ].forEach(([label, key, description]) => {
    const row = document.createElement("div");
    row.className = "option-row";
    const meta = document.createElement("div");
    meta.className = "option-meta";
    meta.innerHTML = `<strong>${label}</strong><span>${description}</span>`;
    const toggle = button(app.profile.options[key] ? "On" : "Off", "stone-btn", () => {
      app.profile.options[key] = !app.profile.options[key];
      saveProfile();
      applyOptions();
      renderOptions();
    });
    row.append(meta, toggle);
    optionsList.appendChild(row);
  });
  el("reset-profile-btn").textContent = app.resetArmed ? "Confirm Reset" : "Reset Profile";
}

function openOptions() {
  renderOptions();
  el("options-overlay").classList.remove("hidden");
}

function closeOptions() {
  app.resetArmed = false;
  el("options-overlay").classList.add("hidden");
  renderOptions();
}

function openPause() {
  app.concedeArmed = false;
  el("pause-overlay").classList.remove("hidden");
  el("concede-btn").textContent = "Concede Run";
}

function closePause() {
  app.concedeArmed = false;
  el("pause-overlay").classList.add("hidden");
}

function concedeRun() {
  if (!app.run) return;
  if (app.profile.options.confirmConcede && !app.concedeArmed) {
    app.concedeArmed = true;
    el("concede-btn").textContent = "Confirm Concede";
    return;
  }
  closePause();
  endRun(false, "You abandoned the table before the candle died.", "Run Conceded");
}

function resetProfile() {
  if (!app.resetArmed) {
    app.resetArmed = true;
    renderOptions();
    return;
  }
  app.profile = defaultProfile();
  clearRun();
  saveProfile();
  applyOptions();
  closeOptions();
  renderTitle();
}

function handleTitleAction(action) {
  if (action === "new-game") renderSetup();
  else if (action === "continue") {
    if (!app.run) {
      showToast("No saved run exists.");
      return;
    }
    renderActiveRunScene();
  } else if (action === "options") openOptions();
}

function renderActiveRunScene() {
  if (!app.run) {
    renderTitle();
    return;
  }
  if (app.run.scene === "battle") renderBattle();
  else if (app.run.scene === "event") renderEvent();
  else renderMap();
}

function bindEvents() {
  el("setup-back-btn").addEventListener("click", renderTitle);
  el("setup-options-btn").addEventListener("click", openOptions);
  el("setup-start-btn").addEventListener("click", startNewGameFromSetup);
  el("map-codex-btn").addEventListener("click", () => openCodex("map-screen"));
  el("map-pause-btn").addEventListener("click", openPause);
  el("draw-main-btn").addEventListener("click", handleDrawMain);
  el("draw-side-btn").addEventListener("click", handleDrawSide);
  el("ring-bell-btn").addEventListener("click", handleBell);
  el("battle-codex-btn").addEventListener("click", () => openCodex("battle-screen"));
  el("pause-btn").addEventListener("click", openPause);
  el("selection-cancel-btn").addEventListener("click", cancelSelection);
  el("codex-current-tab").addEventListener("click", () => { app.codexTab = "current"; renderCodex(); });
  el("codex-discovered-tab").addEventListener("click", () => { app.codexTab = "discovered"; renderCodex(); });
  el("codex-close-btn").addEventListener("click", closeCodex);
  el("ending-new-run-btn").addEventListener("click", renderTitle);
  el("ending-codex-btn").addEventListener("click", () => openCodex("ending-screen"));
  el("options-close-btn").addEventListener("click", closeOptions);
  el("reset-profile-btn").addEventListener("click", resetProfile);
  el("resume-btn").addEventListener("click", closePause);
  el("pause-codex-btn").addEventListener("click", () => {
    closePause();
    openCodex(app.run?.scene === "battle" ? "battle-screen" : "map-screen");
  });
  el("pause-options-btn").addEventListener("click", openOptions);
  el("concede-btn").addEventListener("click", concedeRun);
  document.addEventListener("pointermove", handleGlobalPointerMove);
  document.addEventListener("pointerup", handleGlobalPointerUp);
  document.addEventListener("pointercancel", () => resetHandCardDrag(true));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") resetHandCardDrag(true);
  });
}

function initAtmosphere() {
  const canvas = el("atmosphere-canvas");
  const context = canvas.getContext("2d");
  if (!context) return;
  const state = app.atmosphere;

  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    state.width = canvas.width;
    state.height = canvas.height;
    state.motes = Array.from({ length: 34 }, () => ({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      radius: 1 + Math.random() * 3,
      speed: 0.2 + Math.random() * 0.5,
      drift: -0.12 + Math.random() * 0.24,
      alpha: 0.08 + Math.random() * 0.12,
    }));
  }

  function tick() {
    context.clearRect(0, 0, state.width, state.height);
    if (!app.profile.options.reducedMotion) {
      state.motes.forEach((mote) => {
        mote.y -= mote.speed;
        mote.x += mote.drift;
        if (mote.y < -10) mote.y = state.height + 10;
        if (mote.x < -10) mote.x = state.width + 10;
        if (mote.x > state.width + 10) mote.x = -10;
      });
    }
    const gradient = context.createRadialGradient(state.width / 2, 120, 20, state.width / 2, 120, state.width * 0.5);
    gradient.addColorStop(0, "rgba(255, 220, 160, 0.06)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, state.width, state.height);
    state.motes.forEach((mote) => {
      context.beginPath();
      context.fillStyle = `rgba(255, 218, 168, ${mote.alpha})`;
      context.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
      context.fill();
    });
    state.frameId = requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener("resize", resize);
  cancelAnimationFrame(state.frameId);
  tick();
}

function initialize() {
  app.profile = loadProfile();
  app.run = loadRun();
  if (app.run?.starterDeckId && DECK_BY_ID[app.run.starterDeckId]) app.setupDeckId = app.run.starterDeckId;
  applyOptions();
  preloadAssets();
  bindEvents();
  initAtmosphere();
  el("menu-startscreen").style.backgroundImage = `url("${ASSETS.menu.startscreen}")`;
  renderTitle();
  renderOptions();
}

document.addEventListener("DOMContentLoaded", initialize);
