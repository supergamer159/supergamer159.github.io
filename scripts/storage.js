import {
  DEFAULT_LOADOUT,
  DEFAULT_PROFILE,
  ENEMY_TRAINER_BY_ID,
  ENEMY_TRAINERS,
  getDeckCardCount,
  normalizeDeckCounts,
} from "./monster-data.js";

export const STORAGE_KEYS = Object.freeze({
  profile: "monstercard_profile_v1",
  loadout: "monstercard_loadout_v1",
});

const LEGACY_KEYS = Object.freeze([
  "inscryption_profile_v2",
  "inscryption_run_v3",
  "inscryption_profile_v3",
  "inscryption_run_v4",
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function canUseStorage() {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    const probeKey = "__monstercard_storage_probe__";
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    return true;
  } catch (error) {
    return false;
  }
}

function readJson(key, fallback) {
  if (!canUseStorage()) {
    return clone(fallback);
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : clone(fallback);
  } catch (error) {
    return clone(fallback);
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    return;
  }
}

function sanitizeProfile(rawProfile) {
  const fallbackEnemyId = ENEMY_TRAINERS[0].id;
  const selectedEnemyId = ENEMY_TRAINER_BY_ID[rawProfile?.selectedEnemyId]
    ? rawProfile.selectedEnemyId
    : fallbackEnemyId;

  return {
    options: {
      reducedMotion: !!rawProfile?.options?.reducedMotion,
    },
    selectedEnemyId,
  };
}

function sanitizeLoadout(rawLoadout) {
  const next = clone(DEFAULT_LOADOUT);
  const squadIds = Array.isArray(rawLoadout?.squadIds)
    ? rawLoadout.squadIds.filter((value) => typeof value === "string").slice(0, 3)
    : next.squadIds.slice();

  while (squadIds.length < 3) {
    squadIds.push(null);
  }

  const deckCounts = normalizeDeckCounts(rawLoadout?.deckCounts || next.deckCounts, squadIds.filter(Boolean));

  return {
    squadIds,
    deckCounts,
  };
}

export function clearLegacyStorage() {
  if (!canUseStorage()) {
    return;
  }

  LEGACY_KEYS.forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      return;
    }
  });
}

export function loadProfile() {
  return sanitizeProfile(readJson(STORAGE_KEYS.profile, DEFAULT_PROFILE));
}

export function saveProfile(profile) {
  writeJson(STORAGE_KEYS.profile, sanitizeProfile(profile));
}

export function loadLoadout() {
  const loadout = sanitizeLoadout(readJson(STORAGE_KEYS.loadout, DEFAULT_LOADOUT));
  if (getDeckCardCount(loadout.deckCounts) === 0) {
    return clone(DEFAULT_LOADOUT);
  }
  return loadout;
}

export function saveLoadout(loadout) {
  writeJson(STORAGE_KEYS.loadout, sanitizeLoadout(loadout));
}

export function resetAllStorage() {
  const profile = clone(DEFAULT_PROFILE);
  const loadout = clone(DEFAULT_LOADOUT);
  saveProfile(profile);
  saveLoadout(loadout);
  clearLegacyStorage();
  return { profile, loadout };
}
