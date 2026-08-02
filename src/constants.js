/**
 * @file constants.js
 * @description Central registry of configuration constants, shared settings, and environment detection.
 * 
 * What belongs here:
 * - Shared configuration arrays (like CONFIGURABLE_SETTINGS).
 * - Key/Value storage namespaces and localStorage suffixes.
 * - Direction constants (e.g. SKIP_UP, SKIP_DOWN).
 * - Immutable puzzle constants (e.g. file formats, size boundaries).
 */
// Device detection
export const IS_MOBILE = CrosswordShared.isMobileDevice();

// Settings
export const CONFIGURABLE_SETTINGS = [
  "skip_filled_letters", "arrow_direction", "space_bar", "tab_key",
  "timer_autostart", "dark_mode_enabled", "gray_completed_clues",
  "confetti_enabled", "notepad_name",
];

// Key/Value Storage Keys
export const STORAGE_KEY = 'crossword_nexus_savegame';
export const SETTINGS_STORAGE_KEY = 'crossword_nexus_settings';

// Crossword Navigation Directions
export const SKIP_UP = 'up';
export const SKIP_DOWN = 'down';
export const SKIP_LEFT = 'left';
export const SKIP_RIGHT = 'right';

// File Formats
export const FILE_JPZ = 'jpz';
export const FILE_PUZ = 'puz';
export const MIN_SIZE = 10;
export const MAX_SIZE = 100;
