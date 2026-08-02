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

// Main HTML Template
export const TEMPLATE = `
  <div class = "cw-main auto normal">
    <!-- Overlay for opening puzzles -->
    <div class = "cw-open-holder">
    <div class="cw-overflow"></div>
      <div class="cw-open-puzzle">
        <div class="cw-open-puzzle-instructions">
          Drag and drop a file here, or click the button to choose a file
          to open.
        </div>
        <button type = "button" class = "cw-button cw-button-open-puzzle">
          Open puzzle file
        </button>
        <div class = "cw-open-puzzle-formats">
          <b>Accepted formats: </b> PUZ, JPZ, XML, CFP, and iPUZ (partial)
        </div>
        <button id="installAppBtn" style="display: none; margin-top: 1.5rem;">
          📥 Install this app for offline solving
        </button>
      </div>
      <input type = "file" class = "cw-open-jpz">

    </div>
    <!-- End overlay -->
    <header class = "cw-header"></header>
    <div class = "cw-content">
      <!-- Placeholder for modal boxes -->
      <div    class = "cw-modal"></div>
      <div    class = "cw-grid">
      <div    class = "cw-buttons-holder">
      <div    class = "cw-menu-container cw-file-menu">
      <button type  = "button" class = "cw-button">
        <span class="cw-button-icon">🗄️</span>
               File
              <span class = "cw-arrow"></span>
            </button>
            <div    class = "cw-menu">
            <button class = "cw-menu-item cw-file-info">Info</button>
            <button class = "cw-menu-item cw-file-notepad">Notepad</button>
            <button class = "cw-menu-item cw-file-help">How to Solve</button>
            <button class = "cw-menu-item cw-file-load">Open ...</button>
            <button class = "cw-menu-item cw-file-print">Print</button>
            <button class = "cw-menu-item cw-file-save">Save as iPuz</button>
            <button class = "cw-menu-item cw-file-clear">Clear</button>
            </div>
          </div>
          <div    class = "cw-menu-container cw-check">
          <button type  = "button" class = "cw-button">
            <span class="cw-button-icon">🔍</span>
               Check
              <span class = "cw-arrow"></span>
            </button>
            <div    class = "cw-menu">
            <button class = "cw-menu-item cw-check-letter">Letter</button>
            <button class = "cw-menu-item cw-check-word">Word</button>
            <button class = "cw-menu-item cw-check-puzzle">Puzzle</button>
            </div>
          </div>
          <div    class = "cw-menu-container cw-reveal">
          <button type  = "button" class = "cw-button">
            <span class="cw-button-icon">🎱</span>
               Reveal
              <span class = "cw-arrow"></span>
            </button>
            <div    class = "cw-menu">
            <button class = "cw-menu-item cw-reveal-letter">Letter</button>
            <button class = "cw-menu-item cw-reveal-word">Word</button>
            <button class = "cw-menu-item cw-reveal-puzzle">Puzzle</button>
            </div>
          </div>

          <button type = "button" class = "cw-button cw-settings-button">
            <span class="cw-button-icon">⚙️</span>
             Settings
          </button>
          <span   class = "cw-flex-spacer"></span>
          <button type  = "button" class = "cw-button cw-button-timer">00:00</button>
          <button type = "button" class = "cw-button cw-tournament-submit" style="display:none">
             I'm&nbsp;done!
          </button>
        </div>
        <input type  = "text" class = "cw-hidden-input">
        <div   class = "cw-canvas">
        <div   class = "cw-puzzle-container">
        <div   class = "cw-top-text-wrapper">
        <div   class = "cw-top-text">
        <span  class = "cw-clue-number"></span>
        <span  class = "cw-clue-text"></span>
                </div>
              </div>
              <svg id = "cw-puzzle-grid"></svg>
            </div>
          </div>
          <div class="cw-extra-clues-button-holder"></div>
        </div>
      <div class = "cw-clues-holder"></div>
    </div>
  </div>`;
