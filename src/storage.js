/**
 * @file storage.js
 * @description Manages game state persistence, local storage interfaces, and save quotas.
 * 
 * What belongs here:
 * - LocalStorage state saving and loading operations (like loadGame, saveGame).
 * - Cache management, savegame limit enforcement, and legacy save cleanup (like cleanupSaves).
 * - Persistence operations syncing state elements like notes and timer values.
 */

import { STORAGE_KEY } from './constants.js';

export function saveGame() {
  if (this.saveTimeout) {
    clearTimeout(this.saveTimeout);
  }
  this.saveTimeout = setTimeout(() => {
    this.saveGameImmediate();
    this.saveTimeout = null;
  }, 500); // Debounce for 500ms
}

export function saveGameImmediate() {
  // fill jsxw
  this.fillJsXw();
  // stringify
  const jsxw_str = JSON.stringify(this.jsxw.cells);
  try {
    localStorage.setItem(this.savegame_name, jsxw_str);
    localStorage.setItem(this.savegame_name + "_notes", JSON.stringify(Array.from(this.notes.entries()).map(n => {
      return {
        key: n[0],
        value: n[1]
      };
    })));
    localStorage.setItem(this.savegame_name + "_timer", (this.xw_timer_seconds || 0).toString());
    localStorage.setItem(this.savegame_name + "_lastmodified", Date.now());
  } catch (e) {
    console.error('[Crossword] localStorage save failed. Attempting cleanup...', e);
    const currentLimit = this.config.save_game_limit || 10;
    this.cleanupSaves(Math.floor(currentLimit / 2)); // Be more aggressive if we hit quota
    try {
      // try again once
      localStorage.setItem(this.savegame_name, jsxw_str);
      localStorage.setItem(this.savegame_name + "_timer", (this.xw_timer_seconds || 0).toString());
      localStorage.setItem(this.savegame_name + "_lastmodified", Date.now());
    } catch (e2) {
      console.error('[Crossword] localStorage save failed even after cleanup.', e2);
    }
  }
}

export function cleanupSaves(limit = null) {
  if (limit === null) {
    limit = this.config.save_game_limit || 10;
  }
  const saves = [];
  const keysToPurge = [];

  // Identify all potential save keys first to avoid iterator issues during deletion
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    allKeys.push(localStorage.key(i));
  }

  allKeys.forEach(key => {
    if (key.startsWith(STORAGE_KEY + '_') &&
      !key.endsWith('_notes') &&
      !key.endsWith('_version') &&
      !key.endsWith('_timer') &&
      !key.endsWith('_lastmodified')) {

      const lastModifiedStr = localStorage.getItem(key + '_lastmodified');

      if (!lastModifiedStr && key !== this.savegame_name) {
        // Legacy save without timestamp - user indicated it is safe to delete
        keysToPurge.push(key);
      } else {
        saves.push({
          key,
          lastModified: parseInt(lastModifiedStr || Date.now().toString(), 10)
        });
      }
    }
  });

  // 1. Purge legacy saves
  keysToPurge.forEach(key => {
    localStorage.removeItem(key);
    localStorage.removeItem(key + '_notes');
    localStorage.removeItem(key + '_version');
    localStorage.removeItem(key + '_timer');
    localStorage.removeItem(key + '_lastmodified');
  });

  // 2. enforce limit on remaining timestamped saves
  if (saves.length <= limit) return;

  // Sort by lastModified descending
  saves.sort((a, b) => b.lastModified - a.lastModified);

  // Delete older ones
  for (let i = limit; i < saves.length; i++) {
    const keyToDelete = saves[i].key;
    localStorage.removeItem(keyToDelete);
    localStorage.removeItem(keyToDelete + '_notes');
    localStorage.removeItem(keyToDelete + '_version');
    localStorage.removeItem(keyToDelete + '_timer');
    localStorage.removeItem(keyToDelete + '_lastmodified');
  }
}

export function loadGame() {
  const jsxw_cells = JSON.parse(localStorage.getItem(this.savegame_name));
  return jsxw_cells;
}
