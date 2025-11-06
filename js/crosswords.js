/**
Copyright (c) 2025, Crossword Nexus & Crossweird LLC
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/

// Settings that we can save
const CONFIGURABLE_SETTINGS = [
  "skip_filled_letters", "arrow_direction", "space_bar", "tab_key", "timer_autostart", "dark_mode_enabled", "gray_completed_clues"
];

// Since DarkReader is an external library, make sure it exists
try {
  DarkReader
} catch {
  DarkReader = false;
}

// one-time check for mobile device status
const IS_MOBILE = CrosswordShared.isMobileDevice();

// Helper function to draw an arrow in a square
function drawArrow(context, top_x, top_y, square_size, direction = "right") {
  const headlen = square_size / 5; // length of the arrowhead
  const centerX = top_x + square_size / 2;
  const centerY = top_y + square_size / 2;
  let fromX, fromY, toX, toY;

  switch (direction) {
    case "right":
      fromX = top_x + square_size / 4;
      fromY = centerY;
      toX = top_x + (3 * square_size) / 4;
      toY = centerY;
      break;
    case "left":
      fromX = top_x + (3 * square_size) / 4;
      fromY = centerY;
      toX = top_x + square_size / 4;
      toY = centerY;
      break;
    case "up":
      fromX = centerX;
      fromY = top_y + (3 * square_size) / 4;
      toX = centerX;
      toY = top_y + square_size / 4;
      break;
    case "down":
      fromX = centerX;
      fromY = top_y + square_size / 4;
      toX = centerX;
      toY = top_y + (3 * square_size) / 4;
      break;
  }

  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  context.beginPath();
  context.moveTo(fromX, fromY);
  context.lineTo(toX, toY);
  context.stroke();

  context.beginPath();
  context.moveTo(toX, toY);
  context.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  context.moveTo(toX, toY);
  context.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  context.stroke();
}

// Main crossword javascript for the Crossword Nexus HTML5 Solver
(function(global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(global);
  } else {
    factory(global, true);
  }
})(
  typeof window !== 'undefined' ? window : this,
  function(window, registerGlobal) {
    'use strict';

    var default_config = {
      hover_enabled: false,
      color_hover: '#FFFFAA',
      color_selected: '#FF4136',
      color_word: '#FEE300',
      color_hilite: '#F8E473',
      color_word_shade: '#BAAB56',
      color_none: '#FFFFFF',
      background_color_clue: '#666666',
      default_background_color: '#c2ed7e',
      color_secondary: '#fff7b7',
      font_color_clue: '#FFFFFF',
      font_color_fill: '#000000',
      color_block: '#212121',
      puzzle_file: null,
      puzzle_object: null, // jsxw to load, if available
      puzzles: null,
      skip_filled_letters: true,
      arrow_direction: 'arrow_move_filled',
      space_bar: 'space_clear',
      filled_clue_color: '#999999',
      timer_autostart: false,
      dark_mode_enabled: false,
      tab_key: 'tab_noskip',
      bar_linewidth: 3.2,
      gray_completed_clues: false,
      forced_theme: null,
      lock_theme: false,
      min_sidebar_clue_width: 220
    };

    // constants
    var FILE_JPZ = 'jpz';
    var FILE_PUZ = 'puz';
    var MIN_SIZE = 10;
    var MAX_SIZE = 100;
    var SKIP_UP = 'up';
    var SKIP_DOWN = 'down';
    var SKIP_LEFT = 'left';
    var SKIP_RIGHT = 'right';
    var STORAGE_KEY = 'crossword_nexus_savegame';
    var SETTINGS_STORAGE_KEY = 'crossword_nexus_settings';

    /*const PUZZLE_STORAGE_VERSION = 'v3';  // bump this anytime you change the structure*/

    // messages
    var MSG_SAVED = 'Crossword saved';
    var MSG_LOADED = 'Crossword loaded';

    var MAX_CLUES_LENGTH = 2;

    var TYPE_UNDEFINED = typeof undefined;
    var XMLDOM_ELEMENT = 1;
    var XMLDOM_TEXT = 3;
    var ZIPJS_CONFIG_OPTION = 'zipjs_path';
    var ZIPJS_PATH = 'lib/zip';

    // errors
    var ERR_FILE_LOAD = 'Error loading file';
    var ERR_PARSE_JPZ = 'Error parsing JPZ file... Not JPZ or zipped JPZ file.';
    var ERR_NOT_CROSSWORD = 'Error opening file. Probably not a crossword.';
    var ERR_NO_JQUERY = 'jQuery not found';
    var ERR_CLUES_GROUPS = 'Wrong number of clues in jpz file';
    var ERR_NO_PUZJS = 'Puz js not found';
    var ERR_LOAD = 'Error loading savegame - probably corrupted';
    var ERR_NO_SAVEGAME = 'No saved game found';

    var load_error = false;

    var CROSSWORD_TYPES = ['crossword', 'coded', 'acrostic'];
    var xw_timer,
      xw_timer_seconds = 0;

    /** Template will have to change along with CSS **/
    var template = `
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
          </div>
          <input type = "file" class = "cw-open-jpz" accept = ".puz,.xml,.jpz,.xpz,.ipuz,.cfp">
        </div>
        <!-- End overlay -->
        <header class = "cw-header"></header>
        <div class = "cw-content">
          <!-- Placeholder for modal boxes -->
          <div    class = "cw-modal"></div>
          <div    class = "cw-grid">
          <div    class = "cw-buttons-holder">
          <div    class = "cw-menu-container">
          <button type  = "button" class = "cw-button">
            <span class="cw-button-icon">🗄️</span>
                   File
                  <span class = "cw-arrow"></span>
                </button>
                <div    class = "cw-menu">
                <button class = "cw-menu-item cw-file-info">Info</button>
                <button class = "cw-menu-item cw-file-notepad">Notepad</button>
                <button class = "cw-menu-item cw-file-print">Print</button>
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
            </div>
          <div class = "cw-clues-holder"></div>
        </div>
      </div>`;

    // Returns a jQuery Deferred object that resolves to a Uint8Array
    function loadFileFromServer(path, type) {
      const deferred = $.Deferred();
      const xhr = new XMLHttpRequest();

      xhr.open('GET', path);
      xhr.responseType = 'arraybuffer'; // binary-safe for .puz, .jpz, etc.

      xhr.onload = function() {
        if (xhr.status === 200) {
          const data = new Uint8Array(xhr.response);
          deferred.resolve(data);
        } else {
          deferred.reject(ERR_FILE_LOAD);
        }
      };

      xhr.onerror = function() {
        deferred.reject(ERR_FILE_LOAD);
      };

      xhr.send();
      return deferred;
    }

    // Check if we can drag and drop files
    var isAdvancedUpload = (function() {
      var div = document.createElement('div');
      return (
        ('draggable' in div || ('ondragstart' in div && 'ondrop' in div)) &&
        'FormData' in window &&
        'FileReader' in window
      );
    })();

    function loadFromFile(file, type, deferred) {
      const reader = new FileReader();
      deferred = deferred || $.Deferred();

      reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        deferred.resolve(data);
      };

      reader.readAsArrayBuffer(file);
      return deferred;
    }

    // Breakpoint config for the top clue, as tuples of `[max_width, max_size]`
    const maxClueSizes = [
      [1080, 15],
      [1200, 17],
      [Infinity, 21],
    ];

    /** Function to resize text **/
    function resizeText(rootElement, nodeList) {
      const minSize = 7;
      const rootWidth = rootElement.width();
      const maxSize = maxClueSizes.find(bp => bp[0] > rootWidth)?.[1] ?? 24;
      const unit = 'px';

      for (var j = 0; j < nodeList.length; j++) {
        const el = nodeList[j];
        const parent = el.parentNode;
        let low = minSize;
        let high = maxSize;
        let best = minSize;

        // binary search for largest size that fits
        while (low <= high) {
          const mid = Math.ceil((low + high) / 2);
          el.style.fontSize = `${mid}${unit}`;

          const overflow = el.scrollHeight > parent.clientHeight ||
            el.scrollWidth > parent.clientWidth;

          if (overflow) {
            high = mid - 1;
          } else {
            best = mid;
            low = mid + 1;
          }
        }
        el.style.fontSize = `${best}${unit}`;
      }
    }


    // Breakpoint widths used by the stylesheet.
    const breakpoints = [420, 600, 850, 1080, 1200];

    function setBreakpointClasses(rootElement) {
      const rootWidth = rootElement.width();

      for (const breakpoint of breakpoints) {
        const className = `cw-max-width-${breakpoint}`;

        if (rootWidth <= breakpoint) {
          rootElement.addClass(className);
        } else {
          rootElement.removeClass(className);
        }
      }
    }

    // Function to check if a cell is solved correctly
    function isCorrect(entry, solution) {
      // if we have a rebus or non-alpha solution or no solution, accept anything
      if (entry && (!solution || solution.length > 1 || /[^A-Za-z]/.test(solution))) {
        return true;
      }
      // otherwise, only mark as okay if we have an exact match
      else {
        return entry == solution;
      }
    }

    /**
     * Sanitize HTML in the given string, except the simplest no-attribute
     * formatting tags.
     */
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;',
    };
    const escapeRegex = new RegExp(
      `</?(i|b|em|strong|span|br|p)>|[&<>"'\`=\\/]`,
      'g'
    );

    function escape(string) {
      //return String(string).replace(escapeRegex, (s) =>
      //  s.length > 1 ? s : entityMap[s]
      //);
      return string;
    }

    var CrosswordNexus = {
      createCrossword: function(parent, user_config) {
        var crossword;
        try {
          if (typeof jQuery === TYPE_UNDEFINED) {
            throw new Error(ERR_NO_JQUERY);
          }
          crossword = new CrossWord(parent, user_config);
        } catch (e) {
          alert(e.message);
          console.log(e);
        }
        return crossword;
      },
    };

    class CrossWord {
      constructor(parent, user_config) {
        this.parent = parent;
        this.config = {};
        // Load solver config
        var saved_settings = {};
        try {
          saved_settings = JSON.parse(
            localStorage.getItem(SETTINGS_STORAGE_KEY)
          );
        } catch (error) {
          console.log(error);
        }
        var i;
        var configurable_settings_set = new Set(CONFIGURABLE_SETTINGS);
        for (i in default_config) {
          if (default_config.hasOwnProperty(i)) {
            // Check saved settings before "user" settings
            // only configurable settings can be loaded
            if (saved_settings && saved_settings.hasOwnProperty(i) && configurable_settings_set.has(i)) {
              this.config[i] = saved_settings[i];
            } else if (user_config && user_config.hasOwnProperty(i)) {
              this.config[i] = user_config[i];
            } else {
              this.config[i] = default_config[i];
            }
          }
        }


        /* Update config values based on `color_word` */
        const COLOR_WORD = this.config.color_word;
        const COLOR_SELECTED = this.config.color_selected;
        // color for hovered cell (if enabled)
        this.config.color_hover = Color.applyHsvTransform(COLOR_WORD, {
          dh: 6.38,
          ks: 0.333,
          kv: 1.004
        });
        // color for corresponding cells (in acrostics and codewords)
        this.config.color_hilite = Color.applyHsvTransform(COLOR_WORD, {
          dh: -2.64,
          ks: 0.536,
          kv: 0.976
        });
        // color for cross-referenced cells (currently unused)
        this.config.color_secondary = Color.applyHsvTransform(COLOR_WORD, {
          dh: -0.29,
          ks: 0.282,
          kv: 1.004
        });

        /* Update CSS values based on `color_word` and `color_selected`*/
        // Buttons
        document.documentElement.style.setProperty("--button-bg-color",
          Color.applyHsvTransform(COLOR_WORD, {
            dh: 0.13,
            ks: 0.753,
            kv: 1.004
          }));
        document.documentElement.style.setProperty("--button-hover-color",
          Color.applyHsvTransform(COLOR_WORD, {
            dh: 0.28,
            ks: 0.502,
            kv: 1.004
          }));

        // Clues
        document.documentElement.style.setProperty("--clue-active-color",
          Color.applyHsvTransform(COLOR_WORD, {
            dh: 0.13,
            ks: 0.753,
            kv: 1.004
          }));
        document.documentElement.style.setProperty("--top-text-wrapper-bg-color",
          Color.applyHsvTransform(COLOR_WORD, {
            dh: -8.62,
            ks: 0.157,
            kv: 1.004
          }));

        // Scrollbars
        document.documentElement.style.setProperty("--clue-scrollbar-color-thumb",
          Color.averageColors(COLOR_SELECTED, '#333333', 0.5));

        /** enable dark mode if available **/
        if (this.config.dark_mode_enabled && DarkReader) {
          DarkReader.enable({
            brightness: 100,
            contrast: 90,
            sepia: 10
          });
          this.config.color_none = '#404040';
          this.config.font_color_fill = '#ddd4c5';
        }

        this.cell_size = 40;
        //this.top_text_height = 0;
        //this.bottom_text_height = 0;
        this.grid_width = 0;
        this.grid_height = 0;
        this.cells = {};
        this.words = {};

        this.clueGroups = []; // array of clue groups
        this.displayClueGroups = null; // for "fakeclues" puzzles
        this.activeClueGroupIndex = 0;

        this.hovered_x = null;
        this.hovered_y = null;
        this.selected_word = null;
        this.hilited_word = null;
        this.selected_cell = null;
        this.settings_open = false;
        // TIMER
        this.timer_running = false;

        // whether to show the reveal button
        this.has_reveal = true;

        this.handleClickWindow = this.handleClickWindow.bind(this);
        this.windowResized = this.windowResized.bind(this);

        this.init();
      }

      make_fake_clues(puzzle, clue_mapping = {}) {

        let across_group = new CluesGroup(this, {
          id: "clues_0",
          title: 'Across',
          clues: [],
          words_ids: [],
        });

        let down_group = new CluesGroup(this, {
          id: "clues_1",
          title: 'Down',
          clues: [],
          words_ids: [],
        });

        const clueMapping = {};

        var clueGroups;

        if (!this.realwords) {
          const entry_mapping = puzzle.get_entry_mapping();
          const thisGrid = JSCrossword.xwGrid(puzzle.cells);
          const acrossSet = new Set(
            Object.values(thisGrid.acrossEntries()).map(entry => entry.word)
          );

          Object.keys(entry_mapping).forEach((id) => {
            const entry = entry_mapping[id];
            const clue = {
              word: id,
              number: id,
              text: '--'
            };
            clueMapping[id] = clue;
            if (acrossSet.has(entry)) {
              across_group.clues.push(clue);
              across_group.words_ids.push(id);
            } else {
              down_group.clues.push(clue);
              down_group.words_ids.push(id);
            }
          });
          clueGroups = [across_group, down_group];
        } else {
          clueGroups = this.clueGroups;
        }

        return {
          clueGroups: clueGroups,
          clue_mapping: clueMapping
        };
      }

      init() {
        var parsePUZZLE_callback = $.proxy(this.parsePuzzle, this);
        var error_callback = $.proxy(this.error, this);

        if (this.root) {
          this.remove();
        }

        // build structures
        this.root = $(template);
        this.top_text = this.root.find('div.cw-top-text');
        //this.bottom_text = this.root.find('div.cw-bottom-text');
        this.clues_holder = this.root.find('div.cw-clues-holder');

        this.toptext = this.root.find('.cw-top-text-wrapper');
        this.notes = new Map();

        this.settings_btn = this.root.find('.cw-settings-button');

        this.hidden_input = this.root.find('input.cw-hidden-input');
        this.reveal_letter = this.root.find('.cw-reveal-letter');
        this.reveal_word = this.root.find('.cw-reveal-word');
        this.reveal_puzzle = this.root.find('.cw-reveal-puzzle');

        this.check_letter = this.root.find('.cw-check-letter');
        this.check_word = this.root.find('.cw-check-word');
        this.check_puzzle = this.root.find('.cw-check-puzzle');

        this.info_btn = this.root.find('.cw-file-info');
        this.load_btn = this.root.find('.cw-file-load');
        this.print_btn = this.root.find('.cw-file-print');
        this.clear_btn = this.root.find('.cw-file-clear');
        this.save_btn = this.root.find('.cw-file-save');
        this.download_btn = this.root.find('.cw-file-download');

        // Notepad button is hidden by default
        this.notepad_btn = this.root.find('.cw-file-notepad');
        this.notepad_btn.hide();

        this.timer_button = this.root.find('.cw-button-timer');
        this.xw_timer_seconds = 0;

        // function to process uploaded files
        function processFiles(files) {
          loadFromFile(files[0], FILE_PUZ).then(
            function(data) {
              parsePUZZLE_callback(data);
            },
            function(err) {
              error_callback(err);
            }
          );
        }

        // preload one puzzle
        if (
          this.config.puzzle_file &&
          this.config.puzzle_file.hasOwnProperty('url') &&
          this.config.puzzle_file.hasOwnProperty('type')
        ) {
          this.root.addClass('loading');
          var loaded_callback = parsePUZZLE_callback;
          loadFileFromServer(
            this.config.puzzle_file.url,
            this.config.puzzle_file.type
          ).then(loaded_callback, error_callback);
        } else if (this.config.puzzle_object) {
          // Case 2: load from serialized (LZ) puzzle
          console.log("[startup] Loading puzzle from lzpuz param");
          const xw = this.config.puzzle_object;
          Promise.resolve(xw).then(parsePUZZLE_callback, error_callback);
        } else {
          // shows open button
          var i, puzzle_file, el;

          this.open_button = this.root.find('.cw-button-open-puzzle');
          this.file_input = this.root.find('input[type="file"]');

          this.open_button.on('click', () => {
            this.file_input.click();
          });

          this.file_input.on('change', () => {
            var files = this.file_input[0].files.length ?
              this.file_input[0].files :
              null;
            if (files) {
              processFiles(files);
            }
          });

          // drag-and-drop
          if (isAdvancedUpload) {
            const div_open_holder = this.root.find('div.cw-open-holder');
            const div_overflow = this.root.find('div.cw-overflow');
            div_overflow.addClass('has-advanced-upload');

            var droppedFiles = false;

            div_open_holder
              .on(
                'drag dragstart dragend dragover dragenter dragleave drop',
                function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              )
              .on('dragover dragenter', function() {
                div_overflow.addClass('is-dragover');
              })
              .on('dragleave dragend drop', function() {
                div_overflow.removeClass('is-dragover');
              })
              .on('drop', function(e) {
                droppedFiles = e.originalEvent.dataTransfer.files;
                processFiles(droppedFiles);
              });
          }
        }

        // mapping of number to cells
        this.number_to_cells = {};
        // the crossword type
        this.crossword_type = 'crossword';
        // whether the puzzle is autofill
        this.is_autofill = false;

        this.root.appendTo(this.parent);
        this.canvas_holder = this.root.find('div.cw-canvas');
        // SVG setup (new)
        this.svgNS = 'http://www.w3.org/2000/svg';
        this.svgContainer = document.createElementNS(this.svgNS, 'svg');
        this.svgContainer.setAttribute('id', 'cw-puzzle-grid');
        // Preserve existing top text wrapper while replacing only the canvas
        this.canvas_holder.find('#cw-puzzle-grid').remove(); // Remove old canvas only

        this.canvas_holder.append(this.svgContainer); // Add new SVG crossword
        this.svg = $('#cw-puzzle-grid');

        setBreakpointClasses(this.root);
        // Place this at the END of the init() method:
        const svg = document.getElementById('cw-puzzle-grid');
      }

      error(message) {
        alert(message);
      }

      normalizeClueTitle(rawTitle) {
        if (!rawTitle) return '';
        const title = rawTitle.trim().toUpperCase();

        if (title === 'ACROSS') return 'Across';
        if (title === 'DOWN') return 'Down';

        return rawTitle; // Preserve original if it's custom
      }

      /**
       * Parse puzzle data into Crossord structure.
       *
       * - Accepts either a JSCrossword object or raw string data.
       * - Normalizes coordinates (shift +1 to be 1-indexed).
       * - Detects puzzle type (crossword, acrostic, coded).
       * - Initializes cells, words, and clues (real or fake).
       * - Enables autofill for acrostic/coded puzzles.
       */
      parsePuzzle(data) {
        // if it's already a JSCrossword, return it as-is
        var puzzle;
        if (data instanceof JSCrossword) {
          puzzle = data;
        } else {
          // otherwise, parse it directly -- JSCrossword handles the format detection
          puzzle = JSCrossword.fromData(new Uint8Array(data), {
            lockedHandling: "mask"
          });
        }

        puzzle.kind = puzzle.metadata.kind;

        this.jsxw = puzzle;

        this.diagramless_mode = false;

        // 1. Trust metadata if available
        if (puzzle.metadata && puzzle.metadata.crossword_type) {
          if (puzzle.metadata.crossword_type.toLowerCase() === 'diagramless') {
            this.diagramless_mode = true;
            console.log('Diagramless detected: from metadata.crossword_type');
          }
        }

        // 3. If diagramless, wipe all types BEFORE building cells
        if (this.diagramless_mode) {
          for (let i = 0; i < puzzle.cells.length; i++) {
            const cell = puzzle.cells[i];
            cell['top-bar'] = false;
            cell['bottom-bar'] = false;
            cell['left-bar'] = false;
            cell['right-bar'] = false;

            // Detect blocks manually
            const sol = cell.solution?.trim().toUpperCase();
            if (!sol || sol === '#' || sol === '.' || sol === '-') {
              cell.solution = '#'; // treat it as a block
            }

            if (cell.solution === '#') {
              cell.type = 'block';
              cell.letter = '';
            } else {
              cell.type = null;
              cell.letter = '';
            }
            cell.number = null;
          }
        }

        // Savegame
        const simpleHash = t => {
          let e = 0;
          for (let r = 0; r < t.length; r++) {
            e = (e << 5) - e + t.charCodeAt(r), e &= e
          }
          return new Uint32Array([e])[0].toString(36)
        };
        const myHash = simpleHash(JSON.stringify(puzzle));
        this.savegame_name = STORAGE_KEY + '_' + myHash;

        const versionKey = this.savegame_name + '_version';
        const savedVersion = localStorage.getItem(versionKey);

        /*
        if (savedVersion !== PUZZLE_STORAGE_VERSION) {
          console.log('[Crossword] Savegame version mismatch. Clearing old localStorage.');
          localStorage.removeItem(this.savegame_name);
          localStorage.removeItem(this.savegame_name + "_notes");
          localStorage.setItem(versionKey, PUZZLE_STORAGE_VERSION);
        }
        */

        const jsxw2_cells = this.loadGame();
        if (jsxw2_cells) {
          console.log('Loading puzzle from localStorage');
          var noteObj = JSON.parse(localStorage.getItem(this.savegame_name + "_notes"));
          if (noteObj && noteObj.length > 0) {
            for (var entry of noteObj) {
              this.notes.set(entry.key, entry.value);
            }
          }
          puzzle.cells = jsxw2_cells;
        }

        const loadedFromStorage = Boolean(jsxw2_cells);

        puzzle.cells.forEach(c => {
          if (!c.top_right_number && c['top_right_number']) {
            c.top_right_number = c['top_right_number']; // Ensure key is present consistently
          }
        });

        // Metadata
        this.title = puzzle.metadata.title || '';
        this.author = puzzle.metadata.author || '';
        this.copyright = puzzle.metadata.copyright || '';
        this.crossword_type = puzzle.metadata.crossword_type;
        this.fakeclues = puzzle.metadata.fakeclues || false;
        this.notepad = puzzle.metadata.description || '';
        this.grid_width = puzzle.metadata.width;
        this.grid_height = puzzle.metadata.height;
        this.completion_message = puzzle.metadata.completion_message || "Puzzle solved!";

        if (this.title) {
          document.title = this.title + ' | ' + document.title;
        }
        if (this.crossword_type == 'acrostic' || this.crossword_type == 'coded') {
          this.is_autofill = true;
        }

        if (this.fakeclues) {
          // top-text is meaningless for fakeclues puzzles
          $('div.cw-top-text-wrapper').css({
            display: 'none'
          });

          // No need to leave room for the top-text
          $('#cw-puzzle-grid').css('margin-top', '3px');
        }

        // disable check and reveal in certain cases
        if (puzzle.metadata.has_reveal === false) {
          this.has_reveal = false;
          $('.cw-reveal').css({
            display: 'none'
          });
        }
        if (puzzle.metadata.has_check === false) {
          this.has_check = false;
          $('.cw-check').css({
            display: 'none'
          });
        }

        // === Build cells ===
        this.cells = {};
        this.number_to_cells = {};

        for (var i = 0; i < puzzle.cells.length; i++) {
          const rawCell = puzzle.cells[i];
          const c = {
            x: rawCell.x + 1,
            y: rawCell.y + 1,
            solution: rawCell.solution,
            letter: rawCell.letter || '',
            type: rawCell.type || null,
            number: rawCell.number || null,
            bar: {
              top: rawCell['top-bar'] === true,
              bottom: rawCell['bottom-bar'] === true,
              left: rawCell['left-bar'] === true,
              right: rawCell['right-bar'] === true,
            },
            color: rawCell['background-color'] || null,
            shape: rawCell['background-shape'] || null,
            top_right_number: rawCell.top_right_number,
            fixed: rawCell.fixed === true // Preserve fixed flag from saved data
          };

          /* set a "shade_highlight" color */
          if (c.color && c.color != this.config.color_none) {
            c.shade_highlight_color = Color.averageColors(this.config.color_word, Color.adjustColor(c.color, -50));
          } else {
            c.shade_highlight_color = this.config.color_word;
          }

          /* set the background color for "clue" cells */
          if (rawCell.clue) {
            c.color = this.config.background_color_clue;
          }

          // ✔ DO NOT reset `c.fixed` to false here!

          // Apply rules only if this is a fresh load
          if (!loadedFromStorage && !c.fixed) {
            // Rule 1: Fix punctuation like ‘–’, ‘,’ etc
            if (c.letter && !/[A-Za-z]/.test(c.letter)) {
              c.fixed = true;
            }

            // Rule 2: Fix cells that only have top_right_number (A-Z clue label)
            if (
              /^[A-Z]$/.test(c.letter) &&
              c.top_right_number &&
              c.top_right_number === c.letter
            ) {
              c.fixed = true;
            }

            // Rule 3: Clue label cell in quote rows
            if (
              /^[A-Z]$/.test(c.letter) &&
              !c.top_right_number &&
              c.solution === c.letter
            ) {
              c.fixed = true;
            }
          }

          if (this.diagramless_mode) {
            c.type = null;
            c.empty = false;
            c.clue = false;
            c.color = null;
            c.letter = '';
            c.number = null;
          } else {
            c.empty = (c.type === 'block' || c.type === 'void' || c.type === 'clue');
            c.clue = (c.type === 'clue');
          }

          if (!this.cells[c.x]) {
            this.cells[c.x] = {};
          }
          this.cells[c.x][c.y] = c;

          const key = c.number || c.top_right_number;
          if (key) {
            if (!this.number_to_cells[key]) {
              this.number_to_cells[key] = [];
            }
            this.number_to_cells[key].push(c);
          }
        }

        // If diagramless, renumber
        if (this.diagramless_mode) {
          this.renumberGrid();
        }

        // === Build clues ===
        let clueMapping = {};

        if (this.crossword_type === 'coded') {
          var fake_clue_obj = this.make_fake_clues(puzzle);
          this.clueGroups = fake_clue_obj.clueGroups;
          clueMapping = fake_clue_obj.clue_mapping;

          $('div.cw-clues-holder').css({
            display: 'none'
          });
          $('div.cw-top-text-wrapper').css({
            display: 'none'
          });
          $('div.cw-buttons-holder').css({
            padding: '0 10px'
          });

        } else {
          // Initialize clue mapping and groups dynamically
          this.clueGroups = [];

          // Defensive: if no clues array exists
          const clueSets = puzzle.clues || [];

          // Create one CluesGroup per clue set
          clueSets.forEach((clueSet, index) => {
            // Normalize title and word IDs
            const title = this.normalizeClueTitle(clueSet.title || `Clue Set ${index + 1}`);
            const clues = clueSet.clue || [];

            // Populate global mapping for quick lookup
            clues.forEach(clue => {
              if (clue.word) clueMapping[clue.word] = clue;
            });

            const words_ids = clues.map(c => c.word);

            // Create and store CluesGroup instance
            const group = new CluesGroup(this, {
              id: `clues_${index}`,
              title,
              clues,
              words_ids,
            });

            this.clueGroups.push(group);
          });

        }

        // Handle fake clues override
        var num_words = puzzle.words.length;
        var num_clues = puzzle.clues.map(x => x.clue).flat().length;
        if (this.fakeclues && num_words != num_clues) {
          // make a copy of the clue groups for display
          this.displayClueGroups = [...this.clueGroups];
          var fake_clue_obj = this.make_fake_clues(puzzle);
          this.clueGroups = fake_clue_obj.clueGroups;
          clueMapping = fake_clue_obj.clue_mapping;
        }

        // Update DOM with clue info
        const holder = document.querySelector('.cw-clues-holder');
        if (!holder) return;

        holder.innerHTML = ''; // clear old ones

        (this.displayClueGroups || this.clueGroups).forEach(group => {
          const div = document.createElement('div');
          div.classList.add('cw-clues');
          div.dataset.groupId = group.id;

          div.innerHTML = `
            <div class="cw-clues-title">${group.title}</div>
            <div class="cw-clues-items"></div>
          `;

          holder.appendChild(div);

          // Optionally attach scroll or resize logic
          //group.bindElement(div.querySelector('.cw-clues-items'));
        });

        // === Build words ===
        this.words = {};
        for (var i = 0; i < puzzle.words.length; i++) {
          const word = puzzle.words[i];
          this.words[word.id] = new Word(this, {
            id: word.id,
            dir: word.dir,
            refs_raw: null,
            cell_ranges: word.cells.map(function(c) {
              return {
                x: (c[0] + 1).toString(),
                y: (c[1] + 1).toString()
              };
            }),
            clue: clueMapping[word.id]
          });
        }

        console.log(this);

        // Hide the "loading" overlay
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.visibility = 'hidden';
        }

        this.completeLoad();
      }

      completeLoad() {
        $('.cw-header').html(`
          <span class="cw-title">${escape(this.title)}</span>
          <span class="cw-header-separator">&nbsp;•&nbsp;</span>
          <span class="cw-author">${escape(this.author)}</span>
          ${
            this.notepad
              ? `<button class="cw-button cw-button-notepad">
                   <span class="cw-button-icon">📝</span> Notes
                 </button>`
              : ''
          }
          <span class="cw-flex-spacer"></span>
          <span class="cw-copyright">${escape(this.copyright)}</span>
        `);

        this.notepad_icon = this.root.find('.cw-button-notepad');

        // === Initial cell selection (diagramless or fakeclues) ===
        if (this.diagramless_mode) {
          const firstCell = this.getCell(1, 1);
          if (firstCell) {
            this.selected_cell = firstCell;
            this.selected_word = null;
            this.top_text.html(''); // Clear top clue text
            console.log('[Diagramless Init]', {
              selected_cell: this.selected_cell,
              selected_word: this.selected_word,
              top_text: this.top_text.html()
            });
          }
        } else if (this.fakeclues) {
          const fallback = this.getCell(1, 1);
          if (fallback) {
            this.selected_cell = fallback;
            this.selected_word = null;
            this.top_text.html('');
            console.log('[Fakeclues Init]', {
              selected_cell: this.selected_cell,
              selected_word: this.selected_word,
              top_text: this.top_text.html()
            });
          }
        }

        //this.changeActiveClues();
        (this.displayClueGroups || this.clueGroups || []).forEach(group => {
          // Find the container that matches this group’s ID
          const container = document.querySelector(`.cw-clues[data-group-id="${group.id}"] .cw-clues-items`);
          if (container) {
            const displayGroup = group; // preserve old logic
            this.renderClues(displayGroup, container);
          }
        });
        this.addListeners();

        this.root.removeClass('loading');
        this.root.addClass('loaded');

        this.waitUntilSVGWidthStabilizes(() => {
          if (this.selected_word && this.top_text?.length) {
            resizeText(this.root, this.top_text);
          }
        });

        // === Post-render selection fallback ===
        if (this.diagramless_mode) {
          const firstCell = this.getCell(1, 1);
          if (firstCell) {
            this.selected_cell = firstCell;
            this.selected_word = null;
            this.top_text.html('');
            this.renderCells();
          }
        } else {
          const first_word = this.clueGroups[this.activeClueGroupIndex].getFirstWord?.();
          if (first_word) {
            this.setActiveWord(first_word);
            const firstCell = first_word.getFirstCell?.();
            if (firstCell) {
              this.setActiveCell(firstCell);
            }
          }
        }

        // Start the timer if necessary
        if (this.config.timer_autostart) {
          this.toggleTimer();
        }

        /** Some JS magic to deal with weird numbers of clue lists **/
        const holder = document.querySelector('.cw-clues-holder');
        if (!holder) return; // nothing to do if it doesn't exist

        const clues = holder.querySelectorAll('.cw-clues');
        if (!clues.length) return;

        const MIN_AVG_WIDTH = this.config.min_sidebar_clue_width; // tweak this breakpoint

        function updateClueLayout() {
          // available width per clue list
          const avgWidth = holder.offsetWidth / clues.length;
          const useColumn = avgWidth < MIN_AVG_WIDTH;

          // apply layout
          holder.style.flexDirection = useColumn ? 'column' : 'row';
          clues.forEach(clue => {
            clue.style.width = useColumn ? 'auto' : '';
          });

          // optional debug log
          // console.log(`→ avgWidth=${avgWidth.toFixed(1)}, layout=${useColumn ? 'column' : 'row'}`);
        }

        // run once on load
        updateClueLayout();

        // and whenever window resizes
        window.addEventListener('resize', updateClueLayout);

      } // end completeLoad

      remove() {
        this.removeListeners();
        this.root.remove();
      }

      removeGlobalListeners() {
        $(window).off('click', this.handleClickWindow);
        $(window).off('resize', this.windowResized);
      }

      removeListeners() {
        this.removeGlobalListeners();
        this.root.undelegate();
        this.clues_holder.undelegate('div.cw-clues-items span');
        this.svg.off('mousemove click');

        this.reveal_letter.off('click');
        this.reveal_word.off('click');
        this.reveal_puzzle.off('click');

        this.check_letter.off('click');
        this.check_word.off('click');
        this.check_puzzle.off('click');

        this.print_btn.off('click');
        this.clear_btn.off('click');
        this.load_btn.off('click');
        this.save_btn.off('click');
        this.download_btn.off('click');
        this.timer_button.off('click');

        this.settings_btn.off('click');

        this.info_btn.off('click');
        this.notepad_btn.off('click');
        this.notepad_icon.off('click');

        this.hidden_input.off('input');
        this.hidden_input.off('keydown');
      }

      addListeners() {
        $(window).on('click', this.handleClickWindow);
        $(window).on('resize', this.windowResized);

        this.root.delegate(
          '.cw-menu-container > button',
          'click',
          $.proxy(this.handleClickOpenMenu, this)
        );

        this.clues_holder.delegate(
          'div.cw-clues-items div.cw-clue',
          'mouseenter',
          $.proxy(this.mouseEnteredClue, this)
        );
        this.clues_holder.delegate(
          'div.cw-clues-items div.cw-clue',
          'mouseleave',
          $.proxy(this.mouseLeftClue, this)
        );
        // Click to jump to clue, but DON'T if user just selected text (avoid nuking selection)
        this.clues_holder.delegate(
          'div.cw-clues-items div.cw-clue',
          'click',
          (e) => {
            const sel = window.getSelection && window.getSelection();
            if (sel && sel.toString().trim().length > 0) {
              // User highlighted text; ignore this click so selection stays.
              e.preventDefault();
              e.stopImmediatePropagation();
              return;
            }
            // No selection: proceed with the usual behavior
            this.clueClicked(e);
          }
        );

        // Right-click in the clue list → Ducktiles
        if (!IS_MOBILE) {
          this.clues_holder.delegate(
            'div.cw-clues-items div.cw-clue .cw-clue-text',
            'contextmenu',
            (e) => {
              e.preventDefault();
              const sel = window.getSelection && window.getSelection();
              const selectedText = (sel && sel.toString()) || '';
              this.openDucktilesOverlayWithClipboard(selectedText);
            }
          );
        }

        if (this.config.hover_enabled) {
          this.svg.on('mousemove', $.proxy(this.mouseMoved, this));
        }
        this.svg.on('click', $.proxy(this.mouseClicked, this));

        // REVEAL
        this.reveal_letter.on(
          'click',
          $.proxy(this.check_reveal, this, 'letter', 'reveal')
        );
        this.reveal_word.on(
          'click',
          $.proxy(this.check_reveal, this, 'word', 'reveal')
        );
        this.reveal_puzzle.on(
          'click',
          $.proxy(this.check_reveal, this, 'puzzle', 'reveal')
        );

        // CHECK
        this.check_letter.on(
          'click',
          $.proxy(this.check_reveal, this, 'letter', 'check')
        );
        this.check_word.on(
          'click',
          $.proxy(this.check_reveal, this, 'word', 'check')
        );
        this.check_puzzle.on(
          'click',
          $.proxy(this.check_reveal, this, 'puzzle', 'check')
        );

        // PRINTER
        this.print_btn.on('click', (e) => this.printPuzzle(e));

        // CLEAR
        this.clear_btn.on(
          'click',
          $.proxy(this.check_reveal, this, 'puzzle', 'clear')
        );

        // DOWNLOAD
        //this.download_btn.on('click', $.proxy(this.exportJPZ, this));

        /** We're disabling save and load buttons **/
        // SAVE
        //this.save_btn.on('click', $.proxy(this.saveGame, this));
        // LOAD
        //this.load_btn.on('click', $.proxy(this.loadGame, this));

        // TIMER
        this.timer_button.on('click', $.proxy(this.toggleTimer, this));

        // SETTINGS
        this.settings_btn.on('click', $.proxy(this.openSettings, this));

        // INFO
        this.info_btn.on('click', $.proxy(this.showInfo, this));

        // PREV/NEXT BUTTONS FOR MOBILE
        this.root.find('.cw-button-prev-clue').on('click', () => {
          this.moveToNextWord(true, this.config.tab_key === 'tab_skip');
          this.hidden_input.focus();
        });
        this.root.find('.cw-button-next-clue').on('click', () => {
          this.moveToNextWord(false, this.config.tab_key === 'tab_skip');
          this.hidden_input.focus();
        });

        // NOTEPAD
        if (this.notepad) {
          this.notepad_icon.on('click', $.proxy(this.showNotepad, this));
          this.notepad_btn.show();
        } else {
          this.notepad_icon.hide();
        }

        // Automatically show intro on load if it exists
        if (this.jsxw.metadata.intro) {
          setTimeout(() => this.showNotepad(), 300);
        }

        this.notepad_btn.on('click', $.proxy(this.showNotepad, this));

        $(document).on('keydown', $.proxy(this.keyPressed, this));

        this.svgContainer.addEventListener('click', (e) => {
          if (e.target.tagName === 'rect') {
            const x = parseInt(e.target.getAttribute('data-x'));
            const y = parseInt(e.target.getAttribute('data-y'));
            const clickedCell = this.getCell(x, y);

            if (this.diagramless_mode) {
              // Diagramless: only select square
              if (clickedCell) {
                this.selected_cell = clickedCell;
                this.selected_word = null;
                this.top_text.html('');
                this.renderCells();
              }
            } else {
              // Normal puzzles
              if (!clickedCell.empty) {
                const groups = this.clueGroups || [];
                const n = groups.length;
                if (!n) return;

                let newActiveWord = null;
                let newGroupIndex = this.activeClueGroupIndex;

                // Try current group first
                const currentGroup = groups[this.activeClueGroupIndex];
                newActiveWord = currentGroup.getMatchingWord(x, y, true);

                // If not found, cycle through remaining groups (2, 3, ..., N, 0, 1, ...)
                if (!newActiveWord) {
                  for (let offset = 1; offset < n; offset++) {
                    const i = (this.activeClueGroupIndex + offset) % n;
                    const group = groups[i];
                    const match = group.getMatchingWord(x, y, true);
                    if (match) {
                      newActiveWord = match;
                      newGroupIndex = i;
                      break;
                    }
                  }
                }

                if (newActiveWord) {
                  this.activeClueGroupIndex = newGroupIndex;
                  this.setActiveWord(newActiveWord);
                  this.setActiveCell(clickedCell);
                  this.renderCells();
                }
              }
            }
          }
        });

        this.svgContainer.addEventListener('dblclick', (e) => {
          if (e.target.tagName === 'rect') {
            const x = parseInt(e.target.getAttribute('data-x'));
            const y = parseInt(e.target.getAttribute('data-y'));
            const clickedCell = this.getCell(x, y);

            if (
              !clickedCell.empty &&
              this.selected_cell &&
              this.selected_cell.x === x &&
              this.selected_cell.y === y
            ) {
              this.changeActiveClues(); // toggle direction
              this.renderCells(); // optionally re-render after direction switch
            }
          }
        });

        // Right-click on the top clue bar → Ducktiles
        if (!IS_MOBILE) {
          this.top_text.on('contextmenu', (e) => {
            e.preventDefault();
            let selectedText = '';
            const sel = window.getSelection && window.getSelection();
            if (sel && sel.rangeCount > 0) selectedText = sel.toString();
            if (!selectedText.trim()) {
              const topClone = this.top_text.clone()[0];
              const onlyText = topClone.querySelector?.('.cw-clue-text');
              const source = onlyText || topClone;
              selectedText = (source.textContent || '').trim();
            }
            if (/[A-Za-z]/.test(selectedText)) {
              this.openDucktilesOverlayWithClipboard(selectedText);
            }
          });
        }
      }

      handleClickWindow(event) {
        this.root.find('.cw-menu').removeClass('open');
      }

      handleClickOpenMenu(event) {
        const menuContainer = $(event.target).closest('.cw-menu-container');
        const menu = menuContainer.find('.cw-menu');
        const isAlreadyOpen = menu.hasClass('open');

        // Close all dropdowns first
        this.root.find('.cw-menu').removeClass('open');

        // If it wasn't already open, open this one
        if (!isAlreadyOpen) {
          setTimeout(() => {
            menu.addClass('open');
          });
        }
      }


      // Create a generic modal box with content
      createModalBox(title, content, button_text = 'Close') {
        // Set the contents of the modal box
        const modalContent = `
        <div class="modal-content">
          <div class="modal-header">
            <span class="modal-close">&times;</span>
            <span class="modal-title">${title}</span>
          </div>
          <div class="modal-body">
            ${content}
          </div>
          <div class="modal-footer">
            <button class="cw-button" id="modal-button">${button_text}</button>
          </div>
        </div>`;
        // Set this to be the contents of the container modal div
        this.root.find('.cw-modal').html(modalContent);

        // Show the div
        var modal = this.root.find('.cw-modal').get(0);
        modal.style.display = 'block';

        // Allow user to close the div
        const this_hidden_input = this.hidden_input;
        var span = this.root.find('.modal-close').get(0);
        // When the user clicks on <span> (x), close the modal
        span.onclick = function() {
          modal.style.display = 'none';
          if (!IS_MOBILE) {
            this_hidden_input.focus();
          }
        };
        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function(event) {
          if (event.target == modal) {
            modal.style.display = 'none';
            if (!IS_MOBILE) {
              this_hidden_input.focus();
            }
          }
        };
        // Clicking the button should close the modal
        var modalButton = document.getElementById('modal-button');
        modalButton.onclick = function() {
          modal.style.display = 'none';
          if (!IS_MOBILE) {
            this_hidden_input.focus();
          }
        };
      }

      setConfig(name, value) {
        this.config[name] = value;
      }

      /**
       * Switch active clue group.
       * - If targetIndex is provided, jump there (always).
       * - Otherwise, cycle to the next group that contains the selected cell (if any).
       * - If none match, just stay on the next group.
       */
      changeActiveClues(targetIndex = null) {
        const groups = this.clueGroups || [];
        const n = groups.length;
        if (n <= 1) return;

        let curIndex = this.activeClueGroupIndex ?? 0;
        let newIndex = curIndex;

        if (targetIndex !== null && targetIndex >= 0 && targetIndex < n) {
          // Explicit jump — always allow
          newIndex = targetIndex;
        } else {
          // Cycle forward until we find a group that matches the selected cell
          for (let i = 1; i <= n; i++) {
            const idx = (curIndex + i) % n;
            if (!this.selected_cell) {
              newIndex = idx;
              break;
            }
            const g = groups[idx];
            if (g?.getMatchingWord(this.selected_cell.x, this.selected_cell.y, true)) {
              newIndex = idx;
              break;
            }
            // If we went through all and none matched, default to next anyway
            if (i === n) newIndex = (curIndex + 1) % n;
          }
        }

        // --- Apply the new index ---
        this.activeClueGroupIndex = newIndex;
        const activeGroup = groups[newIndex];

        // --- Update selected word if we have a cell ---
        if (this.selected_cell && activeGroup) {
          const {
            x,
            y
          } = this.selected_cell;
          const word = activeGroup.getMatchingWord(x, y, true);
          if (word) this.setActiveWord(word);
        }

        // --- Refresh sidebar highlighting (optional but recommended) ---
        this.refreshSidebarHighlighting?.();
      }

      getCell(x, y) {
        return this.cells[x] ? this.cells[x][y] : null;
      }

      setActiveWord(word) {
        if (word) {
          this.selected_word = word;
          if (this.fakeclues) {
            return;
          }
          this.top_text.html(`
            <span class="cw-clue-number">
              ${escape(word.clue.number)}
            </span>
            <span class="cw-clue-text">
              ${escape(word.clue.text)}
            </span>
          `);
          resizeText(this.root, this.top_text);
        }
      }

      setActiveCell(cell) {
        if (!cell || cell.empty) return;

        this.selected_cell = cell;

        // Mark active/inactive state for all clue groups
        const groups = this.clueGroups || [];

        groups.forEach(group => {
          // The first param (`isInactive`) is true for all groups except the active one
          const isInactive = group !== this.clueGroups[this.activeClueGroupIndex];
          if (typeof group.markActive === 'function') {
            group.markActive(cell.x, cell.y, isInactive, this.fakeclues);
          }
        });

        // --- Move and focus hidden input ---
        const offset = this.svg.offset();
        const input_top = offset.top + (cell.y - 1) * this.cell_size;
        const input_left = offset.left + (cell.x - 1) * this.cell_size;

        this.hidden_input.css({
          left: input_left,
          top: input_top,
        });

        if (!IS_MOBILE) {
          this.hidden_input.focus();
        }

        this.renderCells();
      }

      renderClues(clues_group, clues_container) {
        const $container = $(clues_container);

        // Locate title and items within the container
        const $title = $container.find('div.cw-clues-title').length ?
          $container.find('div.cw-clues-title') :
          $container.closest('.cw-clues').find('div.cw-clues-title');

        const $items = $container.find('div.cw-clues-items').length ?
          $container.find('div.cw-clues-items') :
          $container;

        const notes = this.notes;
        $items.find('div.cw-clue').remove();

        // --- render each clue ---
        for (const clue of clues_group.clues) {
          const clue_el = $(`
            <div style="position: relative">
              <span class="cw-clue-number">${escape(clue.number)}</span>
              <span class="cw-clue-text">
                ${escape(clue.text)}
                <div class="cw-edit-container" style="display: none;">
                  <input class="cw-input note-style" type="text">
                </div>
                <span class="cw-cluenote-button" style="display: none;"></span>
              </span>
            </div>
          `);

          // attach metadata
          clue_el.data({
            word: clue.word,
            number: clue.number,
            clues: clues_group.id,
          }).addClass(`cw-clue word-${clue.word}`);

          // restore any saved note
          const clueNote = notes.get(clue.word);
          if (clueNote !== undefined) {
            clue_el.find('.cw-input').val(clueNote);
            clue_el.find('.cw-edit-container').show();
          }

          $items.append(clue_el);
        }

        // Set the group title
        if ($title.length) $title.text(escape(clues_group.title));
        clues_group.clues_container = $items;

        // --- event listeners ---
        const save = () => this.saveGame();

        $items
          .on('mouseenter', '.cw-clue', function() {
            const $el = $(this);
            if ($el.find('.cw-input').val().trim().length === 0) {
              $el.find('.cw-cluenote-button').show();
            }
          })
          .on('mouseleave', '.cw-clue', function(event) {
            const $el = $(this);
            const relatedTarget = event.relatedTarget;
            const isInsideNote = $(relatedTarget).closest('.cw-edit-container').length > 0;
            if (!isInsideNote) $el.find('.cw-cluenote-button').hide();
          })
          .on('click', '.cw-cluenote-button', function(event) {
            event.stopPropagation();
            const $clue = $(this).closest('.cw-clue');
            $clue.find('.cw-edit-container').show().find('.cw-input').focus();
            $(this).hide();
          })
          .on('blur', '.cw-input', function() {
            const $input = $(this);
            const $clue = $input.closest('.cw-clue');
            const wordId = $clue.data('word');
            const newText = $input.val().trim();

            setTimeout(() => {
              const newlyFocused = document.activeElement;
              if (newlyFocused?.classList.contains('cw-hidden-input')) return;

              if (newText.length > 0) {
                notes.set(wordId, newText);
              } else {
                $clue.find('.cw-edit-container').hide();
                notes.delete(wordId);
              }
              save();
            }, 10);
          })
          .on('keydown', '.cw-input', function(event) {
            if (event.key === 'Enter') $(this).blur();
          });
      }


      // Clears canvas and re-renders all cells
      renderCells() {
        // Responsive SVG sizing
        const canvasRect = this.canvas_holder.get(0).getBoundingClientRect();
        const svgTopMargin = getComputedStyle(this.svgContainer).marginTop;
        const maxHeight = canvasRect.height - parseInt(svgTopMargin, 10);
        const maxWidth = canvasRect.width;

        this.cell_size = Math.floor(
          Math.min(
            maxWidth / this.grid_width,
            maxHeight / this.grid_height
          )
        );

        const svgWidth = this.grid_width * this.cell_size;
        const svgHeight = this.grid_height * this.cell_size;

        this.svgContainer.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
        this.svgContainer.setAttribute('width', svgWidth);
        this.svgContainer.setAttribute('height', svgHeight);

        if (this.toptext && this.toptext[0]) {
          this.toptext[0].style.width = svgWidth + 'px';
        }

        const SIZE = this.cell_size;
        const svg = this.svgContainer;
        svg.innerHTML = ''; // Clear SVG grid before redrawing

        let linkedSet = null;
        if (this.is_autofill && this.selected_cell) {
          const key = this.selected_cell.number || this.selected_cell.top_right_number;
          if (key != null) {
            linkedSet = new Set(
              (this.number_to_cells[key] || []).map(c => `${c.x}-${c.y}`)
            );
          }
        }

        const padding = 1;
        svg.setAttribute(
          'viewBox',
          `-${padding} -${padding} ${this.grid_width * SIZE + padding * 2} ${this.grid_height * SIZE + padding * 2}`
        );

        /**
         * Loop through the cells and write to SVG
         * Note: for fill and bars: we do all the fill first, then all the bars
         * This is so later fill doesn't overwrite later bars
         **/

        const fillGroup = document.createElementNS(this.svgNS, 'g');
        const barGroup = document.createElementNS(this.svgNS, 'g');
        svg.appendChild(fillGroup);
        svg.appendChild(barGroup);

        for (let xStr in this.cells) {
          const x = parseInt(xStr, 10);
          for (let yStr in this.cells[x]) {
            const y = parseInt(yStr, 10);
            const cell = this.cells[x][y];
            const shouldRender = !cell.empty || cell.clue === true || cell.type === 'block' || cell.top_right_number;
            if (!shouldRender) continue;

            const cellX = (x - 1) * SIZE;
            const cellY = (y - 1) * SIZE;

            /*
            // We don't use this
            const isLabelOnly = (
              this.crossword_type === 'acrostic' &&
              cell.fixed === true &&
              /^[A-Z]$/.test(cell.letter) &&
              cell.letter === cell.solution &&
              !cell.top_right_number
            );
            */

            const isPunctuationOnly = (
              cell.letter &&
              /^[^A-Za-z0-9]$/.test(cell.letter) &&
              !cell.solution
            );

            let fillColor;
            // Previously this was done for !isLabelOnly
            if (true) {
              const rect = document.createElementNS(this.svgNS, 'rect');
              rect.setAttribute('x', cellX);
              rect.setAttribute('y', cellY);
              rect.setAttribute('width', SIZE);
              rect.setAttribute('height', SIZE);
              rect.setAttribute('stroke', '#212121');
              rect.setAttribute('data-x', cell.x);
              rect.setAttribute('data-y', cell.y);
              rect.setAttribute('class', 'cw-cell');

              // Set the cell color
              if (cell.type === 'block') {
                fillColor = cell.color || this.config.color_block;
              } else if (this.selected_cell && cell.x === this.selected_cell.x && cell.y === this.selected_cell.y) {
                fillColor = this.config.color_selected;
                rect.classList.add('selected');
              } else if (this.selected_word && this.selected_word.hasCell(cell.x, cell.y)) {
                fillColor = cell.shade_highlight_color;
              } else if (linkedSet && linkedSet.has(`${cell.x}-${cell.y}`)) {
                // highlight partners
                fillColor = cell.shade_highlight_color;
                rect.classList.add('linked'); // optional CSS hook
              } else if (cell.color) {
                fillColor = cell.color;
              } else {
                fillColor = this.config.color_none;
              }

              rect.setAttribute('fill', fillColor);
              fillGroup.appendChild(rect);
            }

            if (cell.shape === 'circle') {
              const circle = document.createElementNS(this.svgNS, 'circle');
              circle.setAttribute('cx', cellX + SIZE / 2);
              circle.setAttribute('cy', cellY + SIZE / 2);

              // Slightly bigger than cell, so edges are clipped
              const inset = 0.3; // lower is bigger
              const radius = SIZE / 2 + inset;

              circle.setAttribute('r', radius);
              circle.setAttribute('fill', 'none');
              circle.setAttribute('stroke', this.config.color_block || '#212121');
              circle.setAttribute('stroke-width', 1.1);
              circle.setAttribute('pointer-events', 'none');
              fillGroup.appendChild(circle);
            }

            if (cell.bar) {
              const barWidth = this.config.bar_linewidth;
              const barColor = '#212121';

              const barStart = {
                top: [cellX, cellY],
                left: [cellX, cellY],
                right: [cellX + SIZE, cellY + SIZE],
                bottom: [cellX + SIZE, cellY + SIZE],
              };

              const barEnd = {
                top: [cellX + SIZE, cellY],
                left: [cellX, cellY + SIZE],
                right: [cellX + SIZE, cellY],
                bottom: [cellX, cellY + SIZE],
              };

              for (const side in cell.bar) {
                if (cell.bar[side]) {
                  const [x1, y1] = barStart[side];
                  const [x2, y2] = barEnd[side];
                  const barLine = document.createElementNS(this.svgNS, 'line');
                  barLine.setAttribute('x1', x1);
                  barLine.setAttribute('y1', y1);
                  barLine.setAttribute('x2', x2);
                  barLine.setAttribute('y2', y2);
                  barLine.setAttribute('stroke', barColor);
                  barLine.setAttribute('stroke-width', barWidth);
                  barLine.setAttribute('stroke-linecap', 'square');
                  barLine.setAttribute('pointer-events', 'none');
                  barGroup.appendChild(barLine);
                }
              }
            }

            /* Determine the color of letters/numbers in the cell */
            // Default fill color
            let fontColorFill = this.config.font_color_fill;
            // Brightness of the background and foreground
            const bgBrightness = Color.getBrightness(fillColor || this.config.color_none);
            const fgBrightness = Color.getBrightness(this.config.font_color_fill);

            // If we fail to meet some threshold, invert
            if (Math.abs(bgBrightness - fgBrightness) < 125) {
              var thisRGB = Color.hexToRgb(this.config.font_color_fill);
              var invertedRGB = thisRGB.map(x => 255 - x);
              fontColorFill = Color.rgbToHex(invertedRGB[0], invertedRGB[1], invertedRGB[2]);
            }

            if (cell.letter) {
              const text = document.createElementNS(this.svgNS, 'text');
              text.setAttribute('x', cellX + SIZE / 2);
              text.setAttribute('y', cellY + SIZE * 0.77);
              text.setAttribute('text-anchor', 'middle');

              const letterLength = cell.letter.length;
              const maxScale = 0.6;
              const minScale = 0.25;
              const scale = Math.max(minScale, maxScale - 0.07 * (letterLength - 1));
              text.setAttribute('font-size', `${SIZE * scale}px`);

              text.setAttribute('font-family', 'Arial, sans-serif');
              //text.setAttribute('font-weight', 'bold');
              text.textContent = cell.letter;
              text.classList.add('cw-cell-letter');
              text.setAttribute('fill', fontColorFill);
              svg.appendChild(text);
            }

            if (cell.number) {
              const number = document.createElementNS(this.svgNS, 'text');
              number.setAttribute('x', cellX + SIZE * 0.1);
              number.setAttribute('y', cellY + SIZE * 0.3);
              number.setAttribute('font-size', `${SIZE / 3.75}px`);
              number.setAttribute('font-family', 'Arial, sans-serif');
              number.textContent = cell.number;
              number.setAttribute('fill', fontColorFill);
              number.classList.add('cw-cell-number');
              svg.appendChild(number);
            }

            if (
              cell.top_right_number &&
              cell.top_right_number !== cell.letter
            ) {
              const label = document.createElementNS(this.svgNS, 'text');
              label.setAttribute('x', cellX + SIZE * 0.9);
              label.setAttribute('y', cellY + SIZE * 0.3);
              label.setAttribute('text-anchor', 'end');
              label.setAttribute('font-size', `${SIZE / 3.75}px`);
              label.setAttribute('font-family', 'Arial, sans-serif');
              label.setAttribute('fill', fontColorFill);
              label.setAttribute('pointer-events', 'none');
              label.textContent = cell.top_right_number;
              label.classList.add('cw-top-right-label');
              svg.appendChild(label);
            }

            if (cell.checked) {
              const slash = document.createElementNS(this.svgNS, 'line');
              slash.setAttribute('x1', (cell.x - 1) * SIZE + 2);
              slash.setAttribute('y1', (cell.y - 1) * SIZE + 2);
              slash.setAttribute('x2', (cell.x - 1) * SIZE + SIZE - 2);
              slash.setAttribute('y2', (cell.y - 1) * SIZE + SIZE - 2);

              if (this.diagramless_mode) {
                const solutionIsBlock = (cell.solution === '#');
                const typeIsBlock = (cell.type === 'block');
                if (solutionIsBlock !== typeIsBlock) {
                  slash.setAttribute('stroke', 'red');
                  slash.setAttribute('stroke-width', 2.5);
                } else {
                  slash.setAttribute('stroke', '#000');
                  slash.setAttribute('stroke-width', 2);
                }
              } else {
                slash.setAttribute('stroke', '#000');
                slash.setAttribute('stroke-width', 2);
              }

              slash.setAttribute('stroke-linecap', 'round');
              svg.appendChild(slash);
            }
          }
        }

        if (!this.diagramless_mode && this.selected_word) {
          this.drawSelectedWordBorder(svg, this.selected_word);
        }
        setTimeout(() => this.syncTopTextWidth(), 0);

        for (const wordId in this.words) {
          this.updateClueAppearance(this.words[wordId]);
        }
      }

      drawSelectedWordBorder(svg, word) {
        // this doesn't play well with irregularly shaped words
        return;
        /*
        if (!word || !word.cells.length) return;

        const SIZE = this.cell_size;

        let minX = Infinity,
          minY = Infinity,
          maxX = -1,
          maxY = -1;

        for (const coord of word.cells) {
          const [x, y] = coord.split('-').map(Number);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }

        const rect = document.createElementNS(this.svgNS, 'rect');
        rect.setAttribute('x', (minX - 1) * SIZE);
        rect.setAttribute('y', (minY - 1) * SIZE);
        rect.setAttribute('width', (maxX - minX + 1) * SIZE);
        rect.setAttribute('height', (maxY - minY + 1) * SIZE);
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', this.config.color_selected);
        rect.setAttribute('stroke-width', 1.5);
        rect.setAttribute('pointer-events', 'none');
        rect.setAttribute('class', 'selected-word-border');
        svg.appendChild(rect);
        */
      }

      renumberGrid() {
        let number = 1;
        const width = this.grid_width;
        const height = this.grid_height;

        // First clear all numbers
        for (let x = 1; x <= width; x++) {
          for (let y = 1; y <= height; y++) {
            const cell = this.getCell(x, y);
            if (cell) {
              cell.number = null;
            }
          }
        }

        // Assign new numbers
        for (let y = 1; y <= height; y++) {
          for (let x = 1; x <= width; x++) {
            const cell = this.getCell(x, y);
            if (!cell || cell.type === 'block') continue;

            const left = this.getCell(x - 1, y);
            const above = this.getCell(x, y - 1);
            const right = this.getCell(x + 1, y);
            const below = this.getCell(x, y + 1);

            const startsAcross = (!left || left.type === 'block') && right && right.type !== 'block';
            const startsDown = (!above || above.type === 'block') && below && below.type !== 'block';

            if (startsAcross || startsDown) {
              cell.number = number++;
            }
          }
        }
      }

      mouseMoved(e) {
        if (this.config.hover_enabled) {
          var offset = this.svg.offset(),
            mouse_x = e.pageX - offset.left,
            mouse_y = e.pageY - offset.top,
            index_x = Math.ceil(mouse_x / this.cell_size),
            index_y = Math.ceil(mouse_y / this.cell_size);

          if (index_x !== this.hovered_x || index_y !== this.hovered_y) {
            this.hovered_x = index_x;
            this.hovered_y = index_y;
            this.renderCells();
          }
        }
      }

      /**
       * Handle mouse clicks on the crossword grid.
       * Works with any number of clue groups (not just Across/Down).
       */
      mouseClicked(e) {
        const offset = this.svg.offset();
        const mouse_x = e.pageX - offset.left;
        const mouse_y = e.pageY - offset.top;
        const index_x = Math.ceil(mouse_x / this.cell_size);
        const index_y = Math.ceil(mouse_y / this.cell_size);
        const clickedCell = this.getCell(index_x, index_y);

        if (!clickedCell) return;

        if (this.diagramless_mode) {
          // Diagramless: select cell only, no active word
          this.selected_cell = clickedCell;
          this.selected_word = null;
          this.top_text.html('');
          this.renderCells();
          if (!IS_MOBILE) this.hidden_input.focus();
          return;
        }

        // --- Normal puzzle mode ---
        const sameCellClicked =
          this.selected_cell &&
          this.selected_cell.x === index_x &&
          this.selected_cell.y === index_y;

        if (sameCellClicked) {
          // Cycle to the next clue group if clicking same square again
          this.changeActiveClues();
        }

        // Try to find a matching word in the current group
        let currentGroup = this.clueGroups[this.activeClueGroupIndex];
        let matchingWord = currentGroup.getMatchingWord(index_x, index_y, true);

        // If not found, try other groups in order
        if (!matchingWord) {
          for (let i = 0; i < this.clueGroups.length; i++) {
            if (i === this.activeClueGroupIndex) continue;
            const testGroup = this.clueGroups[i];
            const testWord = testGroup.getMatchingWord(index_x, index_y, true);
            if (testWord) {
              matchingWord = testWord;
              this.activeClueGroupIndex = i; // switch to that group
              break;
            }
          }
        }

        // If still nothing found, just stay on current group
        if (matchingWord) {
          this.setActiveWord(matchingWord);
        }

        // Update cell selection and redraw
        this.setActiveCell(clickedCell);
        this.renderCells();

        if (!IS_MOBILE) {
          this.hidden_input.focus();
        }
      }

      keyPressed(e) {
        if (this.settings_open) {
          return;
        }

        // Prevent typing letters into the grid if an editable clue note is focused
        if (document.activeElement.classList.contains('cw-input')) {
          return;
        }

        // to prevent event propagation for specified keys
        var prevent = [35, 36, 37, 38, 39, 40, 32, 46, 8, 9, 13].indexOf(e.keyCode) >= 0;

        switch (e.keyCode) {
          case 35: // end
            this.moveToFirstCell(true);
            break;
          case 36: // home
            this.moveToFirstCell(false);
            break;
          case 37: // left
            if (e.shiftKey) {
              this.skipToWord(SKIP_LEFT);
            } else {
              this.moveSelectionBy(-1, 0);
            }
            break;
          case 38: // up
            if (e.shiftKey) {
              this.skipToWord(SKIP_UP);
            } else {
              this.moveSelectionBy(0, -1);
            }
            break;
          case 39: // right
            if (e.shiftKey) {
              this.skipToWord(SKIP_RIGHT);
            } else {
              this.moveSelectionBy(1, 0);
            }
            break;
          case 40: // down
            if (e.shiftKey) {
              this.skipToWord(SKIP_DOWN);
            } else {
              this.moveSelectionBy(0, 1);
              this.renderCells();
            }
            break;

          case 32: // space
            if (this.selected_cell && this.selected_word) {
              // check config
              if (this.config.space_bar === 'space_switch') {
                const {
                  x,
                  y
                } = this.selected_cell;
                const groups = this.clueGroups || [];
                const n = groups.length;

                if (n > 1) {
                  this.changeActiveClues();
                  this.setActiveCell(this.selected_cell);
                }
              } else {
                // --- normal space behavior: clear and move to next cell
                this.selected_cell.letter = '';
                this.selected_cell.checked = false;
                this.autofill();
                const next_cell = this.selected_word.getNextCell(
                  this.selected_cell.x,
                  this.selected_cell.y
                );
                this.setActiveCell(next_cell);
              }
            }

            this.renderCells();
            this.checkIfSolved(); // update solved status
            break;

          case 27: // escape -- pulls up a rebus entry
            if (e.shiftKey) {
              e.preventDefault();
              this.toggleTimer();
            } else {
              if (this.selected_cell && (this.selected_word || this.diagramless_mode)) {
                this.hidden_input.val('');
                var rebus_entry = prompt('Rebus entry', '');
                this.hiddenInputChanged(rebus_entry);
              }
            }
            break;
          case 45: // insert -- same as escape
            if (this.selected_cell && (this.selected_word || this.diagramless_mode)) {
              var rebus_entry = prompt('Rebus entry', '');
              this.hiddenInputChanged(rebus_entry);
            }
            break;
          case 46: // delete
            if (this.selected_cell && !this.selected_cell.fixed) {
              this.selected_cell.letter = '';
              this.selected_cell.checked = false;
              this.autofill();
            }
            this.renderCells();
            // Update this.isSolved
            this.checkIfSolved();
            break;
          case 8: // backspace
            if (this.selected_cell && !this.selected_cell.fixed) {
              this.selected_cell.letter = '';
              this.selected_cell.checked = false;
              this.autofill();

              if (this.diagramless_mode) {
                // move left to previous non-block square
                const cx = this.selected_cell.x;
                const cy = this.selected_cell.y;
                for (let nx = cx - 1; nx >= 1; nx--) {
                  const prev = this.getCell(nx, cy);
                  if (prev && prev.type !== 'block') {
                    this.setActiveCell(prev);
                    break;
                  }
                }
              } else if (this.selected_word) {
                const prev_cell = this.selected_word.getPreviousCell(
                  this.selected_cell.x,
                  this.selected_cell.y
                );
                this.setActiveCell(prev_cell);
              }

              this.renderCells();
              this.checkIfSolved();
            }
            break;
          case 9: // tab
            var skip_filled_words = this.config.tab_key === 'tab_skip';
            if (e.shiftKey) {
              this.moveToNextWord(true, skip_filled_words);
            } else {
              this.moveToNextWord(false, skip_filled_words);
            }
            break;
          case 13: // enter key -- same as tab
            var skip_filled_words = this.config.tab_key === 'tab_skip';
            if (e.shiftKey) {
              this.moveToNextWord(true, skip_filled_words);
            } else {
              this.moveToNextWord(false, skip_filled_words);
            }
            break;
          case 190: // "." key pressed
            if (this.diagramless_mode && this.selected_cell) {
              const cell = this.selected_cell;

              // Toggle block / white
              if (cell.type === 'block') {
                // It is currently a block: make it white again
                cell.type = null;
                cell.empty = false;
              } else {
                // It is currently white: make it a block
                cell.type = 'block';
                cell.empty = true;
              }

              // Always clear any letter inside
              cell.letter = '';

              // Renumber immediately
              this.renumberGrid();
              this.renderCells(); // redraw right away

              if (!IS_MOBILE) {
                this.hidden_input.focus();
              }
            }
            prevent = true;
            break;
          default: {
            // Allow any single printable character except space (space has special meaning)
            const isPrintableChar =
              e.key.length === 1 &&
              e.key !== ' ' &&
              !e.ctrlKey && !e.metaKey && !e.altKey;

            if (this.selected_cell && isPrintableChar && !this.selected_cell.fixed) {
              // Uppercase only letters, leave numbers/punctuation unchanged
              const ch = /[a-z]/i.test(e.key) ? e.key.toUpperCase() : e.key;
              this.selected_cell.letter = ch;
              this.selected_cell.checked = false;
              this.autofill();
              this.checkIfSolved();
              this.renderCells();
              if (!IS_MOBILE) {
                this.hidden_input.focus();
              }

              let next_cell = null;

              if (this.diagramless_mode) {
                // Diagramless: move to next non-block cell to the right
                const cx = this.selected_cell.x;
                const cy = this.selected_cell.y;
                for (let nx = cx + 1; nx <= this.grid_width; nx++) {
                  const next = this.getCell(nx, cy);
                  if (next && next.type !== 'block') {
                    next_cell = next;
                    break;
                  }
                }
              } else if (this.selected_word) {
                // Regular crossword logic
                if (this.config.skip_filled_letters && !this.selected_word.isFilled()) {
                  next_cell = this.selected_word.getFirstEmptyCell(
                    this.selected_cell.x,
                    this.selected_cell.y
                  ) || this.selected_word.getNextCell(
                    this.selected_cell.x,
                    this.selected_cell.y
                  );
                } else {
                  next_cell = this.selected_word.getNextCell(
                    this.selected_cell.x,
                    this.selected_cell.y
                  );
                }
              }

              if (next_cell) {
                this.setActiveCell(next_cell);
              }
            }
            break;
          }
        }
        if (prevent) {
          e.preventDefault();
          e.stopPropagation();
        }
      }

      autofill() {
        this.saveGame(); // keep saving

        if (this.is_autofill && this.selected_cell) {
          const key = this.selected_cell.number || this.selected_cell.top_right_number;
          const same_number_cells = this.number_to_cells[key] || [];

          for (const cell of same_number_cells) {
            if (cell !== this.selected_cell) {
              cell.letter = this.selected_cell.letter;
              cell.checked = this.selected_cell.checked;
            }
          }
        }
      }

      // Detects user inputs to hidden input element
      hiddenInputChanged(rebus_string) {
        var next_cell;
        if (this.selected_cell) {
          if (rebus_string && rebus_string.trim()) {
            this.selected_cell.letter = rebus_string.toUpperCase(); // ✅ Use rebus string if available
          } else {
            const mychar = this.hidden_input.val().slice(0, 1).toUpperCase();
            if (mychar) {
              this.selected_cell.letter = mychar;
            }
          }
          this.selected_cell.checked = false;

          // If this is a coded or acrostic
          // find all cells with this number
          // and fill them with the same letter
          this.autofill();

          // Within hiddenInputChanged():
          this.renderCells(); // Re-render SVG grid immediately after user input

          // find empty cell, then next cell
          // Change this depending on config
          if (this.config.skip_filled_letters) {
            next_cell =
              this.selected_word.getFirstEmptyCell(
                this.selected_cell.x,
                this.selected_cell.y
              ) ||
              this.selected_word.getNextCell(
                this.selected_cell.x,
                this.selected_cell.y
              );
          } else {
            next_cell = this.selected_word.getNextCell(
              this.selected_cell.x,
              this.selected_cell.y
            );
          }

          this.setActiveCell(next_cell);
          this.renderCells();
          this.checkIfSolved()
        }
        this.hidden_input.val('');
      }

      checkIfSolved(do_reveal = false) {
        var wasSolved = this.isSolved;
        var i, j, cell;
        for (i in this.cells) {
          for (j in this.cells[i]) {
            cell = this.cells[i][j];
            // if found cell without letter or with incorrect letter - return
            if (
              (!cell.empty && (!cell.letter || !isCorrect(cell.letter, cell.solution))) ||
              (this.diagramless_mode && ((cell.type === 'block') !== (cell.solution === '#')))
            ) {
              this.isSolved = false;
              return;
            }
          }
        }
        // Puzzle is solved!
        this.isSolved = true;
        // stop the timer
        var timerMessage = '';
        if (this.timer_running) {
          // prepare message based on time
          var display_seconds = xw_timer_seconds % 60;
          var display_minutes = (xw_timer_seconds - display_seconds) / 60;
          var minDisplay = display_minutes == 1 ? 'minute' : 'minutes';
          var secDisplay = display_seconds == 1 ? 'second' : 'seconds';
          var allMin = display_minutes > 0 ? `${display_minutes} ${minDisplay} ` : '';
          timerMessage = `<br /><br /><center>You finished in ${allMin} ${display_seconds} ${secDisplay}.</center>`;

          // stop the timer
          clearTimeout(xw_timer);
          this.timer_button.removeClass('running');
          this.timer_running = false;
        }
        // reveal all (in case there were rebuses)
        if (do_reveal) {
          this.check_reveal('puzzle', 'reveal');
        }

        confetti({
          particleCount: 280,
          spread: 190,
          origin: {
            y: 0.4
          }
        });

        /* const winSound = new Audio('./sounds/hny.mp3');
           winSound.play();*/
        const here = this

        function showSuccessMsg(rawMessage) {

          let solvedMessage = escape(rawMessage).trim().replaceAll('\n', '<br />');
          solvedMessage += timerMessage;
          here.createModalBox('🎉🎉🎉', solvedMessage);
        }

        // show completion message if newly solved
        if (!wasSolved) {
          showSuccessMsg(this.completion_message);
        }
      }

      // callback for shift+arrows
      // finds next cell in specified direction that does not belongs to current word
      // then selects that word and selects its first empty || first cell
      skipToWord(direction) {
        if (this.selected_cell && this.selected_word) {
          var i,
            cell,
            word,
            word_cell,
            x = this.selected_cell.x,
            y = this.selected_cell.y;

          var cellFound = (cell) => {
            if (cell && !cell.empty) {
              word = this.clueGroups[this.activeClueGroupIndex].getMatchingWord(cell.x, cell.y);
              if (word && word.id !== this.selected_word.id) {
                word_cell = word.getFirstEmptyCell() || word.getFirstCell();
                this.setActiveWord(word);
                this.setActiveCell(word_cell);
                this.renderCells();
                this.renderCells();

                return true;
              }
            }
            return false;
          };

          switch (direction) {
            case SKIP_UP:
              for (i = y - 1; i >= 0; i--) {
                cell = this.getCell(x, i);
                if (cellFound(cell)) {
                  return;
                }
              }
              break;
            case SKIP_DOWN:
              for (i = y + 1; i <= this.grid_height; i++) {
                cell = this.getCell(x, i);
                if (cellFound(cell)) {
                  return;
                }
              }
              break;
            case SKIP_LEFT:
              for (i = x - 1; i >= 0; i--) {
                cell = this.getCell(i, y);
                if (cellFound(cell)) {
                  return;
                }
              }
              break;
            case SKIP_RIGHT:
              for (i = x + 1; i <= this.grid_width; i++) {
                cell = this.getCell(i, y);
                if (cellFound(cell)) {
                  return;
                }
              }
              break;
          }
        }
      }

      /**
       * Move to the next or previous word, cycling through all clue groups.
       */
      moveToNextWord(to_previous, skip_filled_words = false) {
        if (!this.selected_word || !this.clueGroups?.length) return;

        let next_word = null;
        let this_word = this.selected_word;
        let groupIndex = this.activeClueGroupIndex ?? 0;
        const totalGroups = this.clueGroups.length;
        let safetyCounter = 0; // counts how many times we've wrapped between groups

        while (safetyCounter < totalGroups * 2) {
          const currentGroup = this.clueGroups[groupIndex];

          // Try to get next/prev word within the current group
          next_word = to_previous ?
            currentGroup.getPreviousWord(this_word) :
            currentGroup.getNextWord(this_word);

          if (!next_word) {
            // Reached end/start of group — wrap to next/previous group
            groupIndex = (groupIndex + 1) % totalGroups;
            this.activeClueGroupIndex = groupIndex;
            safetyCounter++; // only increment when we move between groups

            const nextGroup = this.clueGroups[groupIndex];
            next_word = to_previous ?
              nextGroup.getLastWord() :
              nextGroup.getFirstWord();
          }

          // Stop if this word is acceptable (either not filled or skipping disabled)
          if (!skip_filled_words || !next_word.isFilled()) break;

          // Otherwise, continue searching
          this_word = next_word;
        }

        // Activate new word if found
        if (next_word) {
          const cell = next_word.getFirstEmptyCell() || next_word.getFirstCell();
          this.setActiveWord(next_word);
          this.setActiveCell(cell);
          this.renderCells();
        }
      }

      moveToFirstCell(to_last) {
        if (this.selected_word) {
          var cell = to_last ?
            this.selected_word.getLastCell() :
            this.selected_word.getFirstCell();
          if (cell) {
            this.setActiveCell(cell);
            this.renderCells();
          }
        }
      }

      /**
       * Callback for arrow keys
       * Moves selection by one cell, possibly switching clue groups.
       * Works with any number of clue lists.
       */
      moveSelectionBy(delta_x, delta_y, jumping_over_black) {

        // Diagramless mode
        if (this.diagramless_mode && this.selected_cell) {
          const x = this.selected_cell.x + delta_x;
          const y = this.selected_cell.y + delta_y;
          const new_cell = this.getCell(x, y);
          if (new_cell) { // skip normal crossword movement logic
            this.selected_cell = new_cell;
            this.renderCells();
          }
          return;
        }

        // Don't do anything if there's no selected cell
        if (!this.selected_cell) return;

        // Find the new cell in the specified direction
        let x = this.selected_cell.x + delta_x;
        let y = this.selected_cell.y + delta_y;
        let new_cell = this.getCell(x, y);

        if (!new_cell) return; // out of bounds

        // Try to jump over black (empty) cells
        if (new_cell.empty) {
          if (delta_x < 0) delta_x--;
          else if (delta_x > 0) delta_x++;
          else if (delta_y < 0) delta_y--;
          else if (delta_y > 0) delta_y++;
          this.moveSelectionBy(delta_x, delta_y, true);
          return;
        }

        // All clue groups
        const groups = this.clueGroups || [];
        const n = groups.length;
        if (!n) return;

        // Active clue group
        let activeGroup = groups[this.activeClueGroupIndex];

        // If new cell is outside current word
        if (!this.selected_word.hasCell(x, y)) {
          let selectedCellAltWord = null;
          let newCellAltWord = null;
          let altGroupIndex = this.activeClueGroupIndex;

          // Try to find an alternate word (perhaps in an inactive clue list) that includes current + next cell
          for (let offset = 1; offset < n; offset++) {
            const i = (this.activeClueGroupIndex + offset) % n;
            const group = groups[i];
            const match1 = group.getMatchingWord(this.selected_cell.x, this.selected_cell.y, true);
            const match2 = group.getMatchingWord(new_cell.x, new_cell.y, true);
            if (match1 && match2 && match1.id === match2.id) {
              selectedCellAltWord = match1;
              newCellAltWord = match2;
              altGroupIndex = i;
              break;
            }
          }

          // Case 1: Found a matching word in another group (switch direction)
          if (selectedCellAltWord && newCellAltWord) {
            this.activeClueGroupIndex = altGroupIndex;
            this.changeActiveClues(altGroupIndex);
            activeGroup = groups[altGroupIndex];

            // arrow-stay / arrow-move_filled config logic
            if (
              this.config.arrow_direction === 'arrow_stay' ||
              (!this.selected_cell.letter && this.config.arrow_direction === 'arrow_move_filled')
            ) {
              new_cell = this.selected_cell;
            }
          }

          // Case 2: If the new cell has no word in the current group, switch groups
          let newCellActiveWord = activeGroup.getMatchingWord(new_cell.x, new_cell.y, true);
          if (!newCellActiveWord) {
            // find the first group that *does* have a word here
            for (let offset = 1; offset < n; offset++) {
              const i = (this.activeClueGroupIndex + offset) % n;
              const group = groups[i];
              const candidate = group.getMatchingWord(x, y, true);
              if (candidate) {
                newCellActiveWord = candidate;
                this.activeClueGroupIndex = i;
                break;
              }
            }
          }

          // Always update active word
          if (newCellActiveWord) {
            this.setActiveWord(newCellActiveWord);
          }
        }

        this.setActiveCell(new_cell);
        this.renderCells();
      } // END moveSelectionBy()


      windowResized() {
        setBreakpointClasses(this.root);
        resizeText(this.root, this.top_text);
        this.renderCells();
        this.syncTopTextWidth();
      }

      syncTopTextWidth() {
        const svgEl = this.svgContainer;
        const wrapper = this.toptext?.get(0);

        if (!svgEl || !wrapper) return;

        const bbox = svgEl.getBoundingClientRect();
        const containerBox = svgEl.parentNode.getBoundingClientRect();

        const leftOffset = bbox.left - containerBox.left;
        const width = Math.round(bbox.width);

        wrapper.style.position = 'absolute';
        wrapper.style.left = `${leftOffset}px`;
        wrapper.style.width = `${width}px`;

        // Optional debug log
        requestAnimationFrame(() => {
          const actual = wrapper.getBoundingClientRect();
        });
      }

      waitUntilSVGWidthStabilizes(finalCallback) {
        let lastWidth = null;
        let stableCount = 0;
        let tick = 0;

        const check = () => {
          const svg = this.svgContainer;
          const width = svg?.getBoundingClientRect().width || 0;

          if (lastWidth !== null && width === lastWidth) {
            stableCount++;
          } else {
            stableCount = 0;
          }

          if (stableCount >= 3) {
            finalCallback();
          } else if (tick < 30) {
            lastWidth = width;
            tick++;
            setTimeout(check, 100);
          } else {
            finalCallback();
          }
        };

        check();
      }

      mouseEnteredClue(e) {
        var target = $(e.currentTarget);
        this.hilited_word = this.words[target.data('word')];
        this.renderCells();
      }

      mouseLeftClue() {
        this.hilited_word = null;
        this.renderCells();
      }

      // callback for clicking a clue in the sidebar
      clueClicked(e) {
        if (this.fakeclues || this.diagramless_mode) return;

        const target = $(e.currentTarget);
        const word = this.words[target.data('word')];
        if (!word) return;

        const cell = word.getFirstEmptyCell() || word.getFirstCell();
        if (!cell) return;

        // Find which clue group this clue belongs to
        const clickedGroupId = target.data('clues');
        const groupIndex = this.clueGroups.findIndex(g => g.id === clickedGroupId);

        // Switch directly to that group if needed
        if (groupIndex !== -1 && groupIndex !== this.activeClueGroupIndex) {
          this.changeActiveClues(groupIndex);
        }

        this.setActiveWord(word);
        this.setActiveCell(cell);
        this.renderCells();
      }

      showInfo() {
        this.createModalBox(
          'Info',
          `
            <p><b>${escape(this.title)}</b></p>
            <p>${escape(this.author)}</p>
            <p><i>${escape(this.copyright)}</i></p>
          `
        );
      }

      showNotepad() {
        this.createModalBox('Notes', escape(this.notepad));
      }

      /**
       * Normalize selected text to letters only (A–Z).
       */
      lettersOnly(text) {
        return (text || "")
          .toUpperCase()
          .replace(/[^A-Z]/g, "");
      }

      /**
       * Open an overlay with Ducktiles embedded via <iframe>.
       * Falls back to "open in new tab" if the iframe is blocked by browser policy.
       */
      async openDucktilesOverlayWithClipboard(rawText) {
        // Hard-disable Ducktiles overlay on mobile
        if (IS_MOBILE) {
          // Optional: show a polite message instead of silently doing nothing
          // this.createModalBox('Ducktiles', 'This helper is disabled on mobile.', 'OK');
          return;
        }
        // Normalize the selected letters & upper-case them
        const letters = (rawText || "").replace(/[^A-Za-z]/g, "").toUpperCase();
        const isMac = navigator.platform?.toLowerCase().includes("mac");
        const pasteKeys = isMac ? "⌘+V" : "Ctrl+V";

        const content = `
          <div class="dt-wrapper">
            <div class="dt-toolbar">
              <div class="dt-field" style="flex:1 1 420px;">
                <label class="dt-label">Letters (auto-copied)</label>
                <input id="dt-letters" class="cw-input" value="${letters}" />
                <div style="opacity:.7;font-size:.85em;margin-top:.25em">
                  If paste doesn’t work, select and copy the letters above manually.
                </div>
              </div>
              <div class="dt-actions" style="align-self:flex-end;">
                <button class="cw-button" id="dt-open-tab">Open in new tab</button>
              </div>
            </div>

            <div class="dt-howto">
              <b>How to use:</b>
              Click <b>Add tiles</b> in Ducktiles, then press <b>${pasteKeys}</b> to paste your letters.
            </div>

            <div class="dt-iframe-wrapper">
              <iframe
                id="ducktiles-frame"
                class="dt-iframe"
                src="https://www.ducktiles.com/"
                title="Ducktiles Anagram Helper"
                allow="clipboard-read; clipboard-write"
                sandbox="allow-scripts allow-same-origin allow-forms"
                referrerpolicy="no-referrer"
              ></iframe>
              <div class="dt-iframe-help" id="dt-help" style="display:none">
                If the area above is blank, your browser prevented embedding Ducktiles
                (site disallows iframes). Use <b>Open in new tab</b> instead.
              </div>
            </div>
          </div>
        `;

        // Open modal and make it wide like before
        this.createModalBox("Ducktiles", content, "Close");
        const modalContent = this.root.find(".cw-modal .modal-content").get(0);
        modalContent?.classList?.add("modal-large");

        // Make the modal movable without changing size
        (() => {
          const modalEl = this.root.find(".cw-modal").get(0);
          const box = modalContent;
          if (!modalEl || !box) return;

          // mark as draggable and use fixed positioning
          box.classList.add("modal-draggable");
          box.style.position = "fixed";

          // initial center (one-time) if not previously positioned
          if (!box.dataset.positioned) {
            const vw = window.innerWidth,
              vh = window.innerHeight;
            const bw = box.offsetWidth,
              bh = box.offsetHeight;
            const left = Math.max(8, Math.round((vw - bw) / 2));
            const top = Math.max(8, Math.round((vh - bh) / 10)); // slightly high
            box.style.left = left + "px";
            box.style.top = top + "px";
            box.style.margin = "0"; // cancel auto-centering
            box.dataset.positioned = "1";
          }

          // drag by header only (so iframe doesn't swallow events)
          const header = box.querySelector(".modal-header");
          if (!header) return;

          let startX = 0,
            startY = 0,
            startLeft = 0,
            startTop = 0,
            dragging = false;

          const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

          const onMouseMove = (e) => {
            if (!dragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            // Allow dragging off-screen but keep a small "grab" area visible
            const GUARD_X = 28; // px that must remain visible horizontally
            const GUARD_Y = 28; // px that must remain visible vertically

            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const bw = box.offsetWidth;
            const bh = box.offsetHeight;

            // New bounds: you can push the box so that only GUARD_* px remain visible
            const minLeft = -(bw - GUARD_X);
            const maxLeft = vw - GUARD_X;
            const minTop = -(bh - GUARD_Y);
            const maxTop = vh - GUARD_Y;

            const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

            const newLeft = clamp(startLeft + dx, minLeft, maxLeft);
            const newTop = clamp(startTop + dy, minTop, maxTop);

            box.style.left = newLeft + "px";
            box.style.top = newTop + "px";
          };

          const endDrag = () => {
            if (!dragging) return;
            dragging = false;
            window.removeEventListener("mousemove", onMouseMove, true);
            window.removeEventListener("mouseup", endDrag, true);
          };

          const onMouseDown = (e) => {
            // only left button
            if (e.button !== 0) return;
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            // get numeric left/top (fallback to computed)
            const rect = box.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            // capture so we beat the grid handlers
            window.addEventListener("mousemove", onMouseMove, true);
            window.addEventListener("mouseup", endDrag, true);

            e.preventDefault();
            e.stopPropagation();
          };

          header.addEventListener("mousedown", onMouseDown, true);

          // If the modal closes, ensure drag listeners are gone (belt & suspenders)
          const observer = new MutationObserver(() => {
            if (modalEl.style.display === "none") {
              endDrag();
              observer.disconnect();
            }
          });
          observer.observe(modalEl, {
            attributes: true,
            attributeFilter: ["style"]
          });
        })();

        // Fallback button: open in new tab
        document.getElementById("dt-open-tab")?.addEventListener("click", () => {
          window.open("https://www.ducktiles.com/", "_blank", "noopener");
        });

        // Auto-copy immediately (will often succeed thanks to user gesture)
        const input = document.getElementById("dt-letters");
        const copyToClipboard = async () => {
          try {
            if (letters) await navigator.clipboard.writeText(letters);
          } catch {}
        };
        copyToClipboard();

        // If user edits the letters, try to keep clipboard in sync (best effort)
        input?.addEventListener("input", async () => {
          try {
            const val = (input.value || "").replace(/[^A-Za-z]/g, "").toUpperCase();
            await navigator.clipboard.writeText(val);
          } catch {}
        });

        // Hint if the iframe is blocked by X-Frame-Options/CSP (blank in many browsers)
        const iframe = document.getElementById("ducktiles-frame");
        const help = document.getElementById("dt-help");
        let hinted = false;
        const showHelpIfBlank = () => {
          if (!hinted) {
            help.style.display = "block";
            hinted = true;
          }
        };
        setTimeout(showHelpIfBlank, 1500);
        iframe?.addEventListener("load", () => {
          help.style.display = "none";
          hinted = true;
        });

        // Allow Escape key to close the modal
        const modalEl = this.root.find('.cw-modal').get(0);
        const escHandler = (evt) => {
          if (evt.key === 'Escape') {
            modalEl.style.display = 'none';
            window.removeEventListener('keydown', escHandler);
            if (!IS_MOBILE) {
              this.hidden_input.focus();
            }
          }
        };
        window.addEventListener('keydown', escHandler);
      }

      openSettings() {
        // Create a modal box
        var settingsHTML = `
        <div class="settings-wrapper">
          <!-- Skip filled letters -->
          <div class="settings-setting">
            <div class="settings-description">
              While filling a word
            </div>
            <div class="settings-option">
              <label class="settings-label">
                <input id="skip_filled_letters" checked="checked" type="checkbox" name="skip_filled_letters" class="settings-changer">
                  Skip over filled letters
                </input>
              </label>
            </div>
            <div class="settings-option">
              <label class="settings-label">
                <input id="gray_completed_clues" type="checkbox" name="gray_completed_clues" class="settings-changer">
                  Gray out clues for completed words
                </input>
              </label>
            </div>
          </div>

          <!-- When changing direction with arrow keys -->
          <div class="settings-setting">
            <div class="settings-description">
              When changing direction with arrow keys
            </div>
            <div class="settings-option">
              <label class="settings-label">
                <input id="arrow_stay" checked="" type="radio" name="arrow_direction" class="settings-changer">
                  Stay in the same square
                </input>
              </label class="settings-label">
              <label class="settings-label">
                <input id="arrow_move" checked="" type="radio" name="arrow_direction" class="settings-changer">
                  Move in the direction of the arrow
                </input>
              </label>
              <label class="settings-label">
                <input id="arrow_move_filled" checked="" type="radio" name="arrow_direction" class="settings-changer">
                  Move in the direction of the arrow if the square is filled
                </input>
              </label>
            </div>
          </div>

          <!-- Space bar -->
          <div class="settings-setting">
            <div class="settings-description">
              When pressing space bar
            </div>
            <div class="settings-option">
              <label class="settings-label">
                <input id="space_clear" checked="" type="radio" name="space_bar" class="settings-changer">
                  Clear the current square and move forward
                </input>
              </label class="settings-label">
              <label class="settings-label">
                <input id="space_switch" checked="" type="radio" name="space_bar" class="settings-changer">
                  Switch directions
                </input>
              </label>
            </div>
          </div>

          <!-- Tab key -->
          <div class="settings-setting">
            <div class="settings-description">
              When tabbing
            </div>
            <div class="settings-option">
              <label class="settings-label">
                <input id="tab_noskip" checked="" type="radio" name="tab_key" class="settings-changer">
                  Move to the next word
                </input>
              </label class="settings-label">
              <label class="settings-label">
                <input id="tab_skip" checked="" type="radio" name="tab_key" class="settings-changer">
                  Move to the next unfilled word
                </input>
              </label>
            </div>
          </div>

          <!-- Miscellaneous (only timer for now) -->
          <div class="settings-setting">
            <div class="settings-description">
              Timer
            </div>
            <div class="settings-option">
              <label class="settings-label">
                <input id="timer_autostart" checked="" type="checkbox" name="timer_autostart" class="settings-changer">
                  Start timer on puzzle open
                </input>
              </label>
            </div>
            <!--
            <div class="settings-option">
              <label class="settings-label">
                <input id="dark_mode_enabled" checked="" type="checkbox" name="dark_mode_enabled" class="settings-changer">
                  Dark mode
                </input>
              </label>
            </div>
            -->
          </div>
        `;

        this.createModalBox('Settings', settingsHTML);
        // Show the proper value for each of these fields
        var classChangers = document.getElementsByClassName('settings-changer');
        for (var cc of classChangers) {
          if (cc.type === 'radio') {
            document.getElementById(cc.id)['checked'] =
              this.config[cc.name] === cc.id;
          } else {
            // checkbox
            document.getElementById(cc.id)['checked'] = this.config[cc.name];
          }
        }
        // Add a listener for these events
        this.root
          .find('.settings-wrapper')
          .get(0)
          .addEventListener('click', (event) => {
            if (event.target.className === 'settings-changer') {
              if (event.target.type === 'checkbox') {
                this.config[event.target.name] = event.target.checked;

                // need to add a special bit for dark mode
                if (event.target.name == 'dark_mode_enabled' && DarkReader) {
                  if (event.target.checked) {
                    DarkReader.enable({
                      brightness: 100,
                      contrast: 90,
                      sepia: 10
                    });
                    this.config.color_none = '#252624';
                    this.config.font_color_fill = '#ddd4c5';
                    this.renderCells();
                  } else {
                    DarkReader.disable();
                    this.config.color_none = default_config.color_none;
                    this.config.font_color_fill = default_config.font_color_fill;
                    this.renderCells();
                  }
                }

                // If the toggled setting is gray_completed_clues, re-render clues immediately
                if (event.target.name === 'gray_completed_clues') {
                  for (const wordId in this.words) {
                    this.updateClueAppearance(this.words[wordId]);
                  }
                  this.syncTopTextWidth();
                }

              } else if (event.target.type === 'radio') {
                this.config[event.target.name] = event.target.id;
              }
            }
            this.saveSettings();
          });
      }

      fillJsXw() {
        const cells = this.cells;
        this.jsxw.cells.forEach((c) => {
          const x = c.x;
          const y = c.y;
          const cellData = cells[x + 1][y + 1];

          c.letter = cellData.letter;
          c.top_right_number = cellData.top_right_number;

          if (cellData.fixed === true) {
            c.fixed = true;
          } else {
            delete c.fixed; // Ensure normal cells are not accidentally flagged
          }
        });
      }

      saveSettings() {
        // we only save settings that are configurable
        var ss1 = {
          ...this.config
        };
        var savedSettings = {};
        CONFIGURABLE_SETTINGS.forEach(function(x) {
          savedSettings[x] = ss1[x];
        })
        localStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify(savedSettings)
        );
      }

      /* Save the game to local storage */
      saveGame() {
        // fill jsxw
        this.fillJsXw();
        // stringify
        const jsxw_str = JSON.stringify(this.jsxw.cells);
        localStorage.setItem(this.savegame_name, jsxw_str);
        localStorage.setItem(this.savegame_name + "_notes", JSON.stringify(Array.from(this.notes.entries()).map(n => {
          return {
            key: n[0],
            value: n[1]
          }
        })));
        /*localStorage.setItem(this.savegame_name + '_version', PUZZLE_STORAGE_VERSION);*/
      }

      /* Show "load game" menu" */
      loadGameMenu() {
        // Find all the savegames
        var innerHTML = '';
        for (var i = 0; i < localStorage.length; i++) {
          var thisKey = localStorage.key(i);
          if (thisKey.startsWith(STORAGE_KEY)) {
            var thisJsXw = JSON.parse(localStorage.getItem(localStorage.key(i)));
            var thisDisplay = thisKey.substr(STORAGE_KEY.length);
            innerHTML += `
            <label class="settings-label">
              <input id="${thisKey}" checked="" type="radio" class="loadgame-changer">
                ${thisDisplay}
              </input>
            </label>
            `;
          }
        }
        if (!innerHTML) {
          innerHTML = 'No save games found.';
        }

        // Create a modal box
        var loadgameHTML = `
        <div class="loadgame-wrapper">
          ${innerHTML}
        </div>
        `;
        this.createModalBox('Load Game', loadgameHTML);
      }

      /* Load a game from local storage */
      loadGame() {
        var jsxw_cells = JSON.parse(localStorage.getItem(this.savegame_name));
        // don't actually *load* it, just return the jsxw
        return jsxw_cells;
        //if (jsxw) {
        //  this.removeListeners();
        //  this.parsePuzzle(jsxw);
        //}
      }

      check_reveal(to_solve, reveal_or_check, e) {
        var my_cells = [],
          cell;

        switch (to_solve) {
          case 'letter':
            if (this.selected_cell) {
              my_cells = [this.selected_cell];
            }
            break;
          case 'word':
            if (this.selected_word) {
              for (let coord of this.selected_word.cells) {
                const c = this.selected_word.getCellByCoordinates(coord);
                if (c) {
                  my_cells.push(c);
                }
              }
            }
            break;
          case 'puzzle':
            for (let x in this.cells) {
              for (let y in this.cells[x]) {
                my_cells.push(this.cells[x][y]);
              }
            }
            break;
        }

        // Expand autofill cells (if needed)
        if (this.is_autofill) {
          const extra_cells = [];
          for (let c of my_cells) {
            const num = c.number;
            if (num != null) {
              const others = this.number_to_cells[num] || [];
              for (let oc of others) {
                const linkedCell = this.cells[oc.x][oc.y];
                if (linkedCell && !my_cells.includes(linkedCell)) {
                  extra_cells.push(linkedCell);
                }
              }
            }
          }
          my_cells = my_cells.concat(extra_cells);
        }

        for (let c of my_cells) {
          if (reveal_or_check !== 'clear' && !c.solution) {
            continue;
          }

          if (reveal_or_check === 'clear') {
            if (c.fixed) continue;
            // CLEAR
            c.letter = '';
            c.checked = false;
            c.revealed = false;
            if (this.diagramless_mode) {
              c.type = null; // clear black squares too
              c.empty = false;
            }
          } else if (reveal_or_check === 'reveal') {
            if (this.diagramless_mode) {
              if (c.solution === '#') {
                c.type = 'block';
                c.empty = true;
                c.letter = '';
              } else {
                c.type = null;
                c.empty = false;
                c.letter = c.solution;
              }
              c.checked = false;
              c.revealed = false;
            } else {
              // ✅ SAFEGUARD for normal puzzles: don't show "#" as a letter
              if (c.solution === '#') {
                c.letter = '';
                c.revealed = false;
                c.checked = false;
              } else {
                c.letter = c.solution;
                c.revealed = true;
                c.checked = false;
              }
            }
          } else if (reveal_or_check === 'check') {
            if (this.diagramless_mode) {
              if (c.type === 'block') {
                // If the user placed a black square
                c.checked = (c.solution !== '#'); // Mark wrong if not supposed to be a black square
              } else if (c.letter) {
                // User typed something — check the letter
                c.checked = !isCorrect(c.letter, c.solution);
              } else {
                // Empty white square — leave unchecked
                c.checked = false;
              }
            } else {
              // Regular crossword
              if (c.letter) {
                c.checked = !isCorrect(c.letter, c.solution);
              } else {
                c.checked = false;
              }
            }
          }
        }

        // After mass-reveal or clear, renumber
        if (reveal_or_check === 'reveal' && this.diagramless_mode) {
          this.renumberGrid();
        }
        if (reveal_or_check === 'clear' && this.diagramless_mode) {
          this.renumberGrid();
        }

        this.renderCells();

        if (reveal_or_check === 'reveal') {
          this.checkIfSolved(false);
        }

        if (reveal_or_check === 'clear') {
          this.saveGame();
        }

        if (!IS_MOBILE) {
          this.hidden_input.focus();
        }
      }

      async printPuzzle(e) {
        // fill JSXW
        this.fillJsXw();
        try {
          let doc = await this.jsxw.toPDF();
          doc.autoPrint();
          // open in a new tab and trigger print dialog
          const blobUrl = doc.output("bloburl");
          window.open(blobUrl, "_blank");
        } catch (err) {
          console.error("PDF generation failed:", err);
        }
      }

      toggleTimer() {
        var display_seconds, display_minutes;
        var timer_btn = this.timer_button;

        function add() {
          xw_timer_seconds = xw_timer_seconds + 1;
          display_seconds = xw_timer_seconds % 60;
          display_minutes = (xw_timer_seconds - display_seconds) / 60;

          var display =
            (display_minutes ?
              display_minutes > 9 ?
              display_minutes :
              '0' + display_minutes :
              '00') +
            ':' +
            (display_seconds > 9 ? display_seconds : '0' + display_seconds);

          timer_btn.html(display);
          timer();
        }

        function timer() {
          xw_timer = setTimeout(add, 1000);
        }

        if (this.timer_running) {
          // Stop the timer
          clearTimeout(xw_timer);
          timer_btn.removeClass('running');
          timer_btn.addClass('blink'); // Add blinking effect
          this.timer_running = false;
          if (!IS_MOBILE) {
            this.hidden_input.focus();
          }
        } else {
          // Start the timer
          timer_btn.removeClass('blink'); // Remove blinking effect
          this.timer_running = true;
          timer_btn.addClass('running');
          if (!IS_MOBILE) {
            this.hidden_input.focus();
          }
          timer();
        }
      }

      updateClueAppearance(word) {
        const clueEl = this.clues_holder.find(`.cw-clue.word-${word.id} .cw-clue-text`);

        if (this.fakeclues) return;

        if (!this.config.gray_completed_clues) {
          // Reset clue styling if the setting is turned off
          clueEl.css({
            "text-decoration": "",
            "color": ""
          });
          return;
        }

        if (word.isFilled()) {
          clueEl.css({
            "text-decoration": "",
            "color": "#aaa"
          });
        } else {
          clueEl.css({
            "text-decoration": "",
            "color": ""
          });
        }
      }
    }

    // CluesGroup stores clues and map of words
    class CluesGroup {
      constructor(crossword, data) {
        this.id = '';
        this.title = '';
        this.clues = [];
        this.clues_container = null;
        this.words_ids = [];
        this.crossword = crossword;
        if (data) {
          if (
            data.hasOwnProperty('id') &&
            data.hasOwnProperty('title') &&
            data.hasOwnProperty('clues') &&
            data.hasOwnProperty('words_ids')
          ) {
            this.id = data.id;
            this.title = data.title;
            this.clues = data.clues;
            this.words_ids = data.words_ids;
          } else {
            load_error = true;
          }
        }
      }

      getFirstWord() {
        if (this.words_ids.length) {
          return this.crossword.words[this.words_ids[0]];
        }
        return null;
      }

      getLastWord() {
        if (this.words_ids.length) {
          return this.crossword.words[
            this.words_ids[this.words_ids.length - 1]
          ];
        }
        return null;
      }

      // gets word which has cell with specified coordinates
      getMatchingWord(x, y, change_word = false) {
        var i,
          word_id,
          word,
          words = [];
        for (i = 0;
          (word_id = this.words_ids[i]); i++) {
          word = this.crossword.words.hasOwnProperty(word_id) ?
            this.crossword.words[word_id] :
            null;
          if (word && word.cells.indexOf(`${x}-${y}`) >= 0) {
            words.push(word);
          }
        }
        if (words.length == 1) {
          return words[0];
        } else if (words.length == 0) {
          return null;
        } else {
          // with more than one word we look for one
          // that's either current or not
          var finding_word = false;
          for (i = 0; i < words.length; i++) {
            word = words[i];
            if (change_word) {
              if (
                this.crossword.selected_word &&
                word.id == this.crossword.selected_word.id
              ) {
                finding_word = true;
              } else if (finding_word) {
                return word;
              }
            } else {
              if (
                this.crossword.selected_word &&
                word.id == this.crossword.selected_word.id
              ) {
                return word;
              }
            }
          }

          // if we didn't match a word in the above
          // just return the first one
          return words[0];
        }
        return null;
      }

      // in clues list, marks clue for word that has cell with given coordinates
      markActive(x, y, is_passive, fakeclues = false) {
        // don't mark anything as active if fake clues
        if (fakeclues) {
          return;
        }
        var classname = is_passive ? 'passive' : 'active',
          word = this.getMatchingWord(x, y),
          clue_el,
          clue_position,
          clue_height;
        this.clues_container.find('div.cw-clue.active').removeClass('active');
        this.clues_container.find('div.cw-clue.passive').removeClass('passive');
        if (word) {
          const clue_el = this.clues_container.find(
            'div.cw-clue.word-' + word.id
          );
          clue_el.addClass(classname);
          const clueRect = clue_el.get(0).getBoundingClientRect();

          const scrollContainer = clue_el.closest('.cw-clues-items');
          const scrollRect = scrollContainer.get(0).getBoundingClientRect();

          if (clueRect.top < scrollRect.top) {
            scrollContainer.stop().animate({
                scrollTop: scrollContainer.scrollTop() - (scrollRect.top - clueRect.top),
              },
              150
            );
          } else if (clueRect.bottom > scrollRect.bottom) {
            scrollContainer.stop().animate({
                scrollTop: scrollContainer.scrollTop() +
                  (clueRect.bottom - scrollRect.bottom),
              },
              150
            );
          }
        }
      }

      // returns word next to given
      getNextWord(word) {
        var next_word = null,
          index = this.words_ids.indexOf(word.id);
        if (index < this.words_ids.length - 1) {
          next_word = this.crossword.words[this.words_ids[index + 1]];
        }
        return next_word;
      }

      // returns word previous to given
      getPreviousWord(word) {
        var prev_word = null,
          index = this.words_ids.indexOf(word.id);
        if (index > 0) {
          prev_word = this.crossword.words[this.words_ids[index - 1]];
        }
        return prev_word;
      }
    }

    // Word constructor
    class Word {
      constructor(crossword, data) {
        this.id = '';
        this.dir = '';
        this.cell_ranges = [];
        this.cells = [];
        this.clue = {};
        this.refs_raw = [];
        this.crossword = crossword;
        if (data) {
          if (
            data.hasOwnProperty('id') &&
            data.hasOwnProperty('dir') &&
            data.hasOwnProperty('cell_ranges') &&
            data.hasOwnProperty('clue') &&
            data.hasOwnProperty('refs_raw')
          ) {
            this.id = data.id;
            this.dir = data.dir;
            this.cell_ranges = data.cell_ranges;
            this.clue = data.clue;
            //this.refs_raw = data.clue.refs;
            this.parseRanges();
          } else {
            load_error = true;
          }
        }
      }

      // Parses cell ranges and stores cells coordinates as array ['x1-y1', 'x1-y2' ...]
      parseRanges() {
        var i, k, cell_range;
        this.cells = [];
        for (i = 0;
          (cell_range = this.cell_ranges[i]); i++) {
          var split_x = cell_range.x.split('-'),
            split_y = cell_range.y.split('-'),
            x,
            y,
            x_from,
            x_to,
            y_from,
            y_to;

          if (split_x.length > 1) {
            x_from = Number(split_x[0]);
            x_to = Number(split_x[1]);
            y = split_y[0];
            for (
              k = x_from; x_from < x_to ? k <= x_to : k >= x_to; x_from < x_to ? k++ : k--
            ) {
              this.cells.push(`${k}-${y}`);
            }
          } else if (split_y.length > 1) {
            x = split_x[0];
            y_from = Number(split_y[0]);
            y_to = Number(split_y[1]);
            for (
              k = y_from; y_from < y_to ? k <= y_to : k >= y_to; y_from < y_to ? k++ : k--
            ) {
              this.cells.push(`${x}-${k}`);
            }
          } else {
            x = split_x[0];
            y = split_y[0];
            this.cells.push(`${x}-${y}`);
          }
        }
      }

      hasCell(x, y) {
        return this.cells.indexOf(`${x}-${y}`) >= 0;
      }

      // get first empty cell in word
      // if x and y given - get first empty cell after cell with coordinates x,y
      // if there's no empty cell after those coordinates - search from begin
      getFirstEmptyCell(x, y) {
        // Return null if there are no cells in the word
        if (!this.cells || this.cells.length === 0) return null;

        const total = this.cells.length;
        let startIndex = 0;

        if (x != null && y != null) {
          // Find the index of the given coordinates in the word
          const idx = this.cells.indexOf(`${x}-${y}`);
          if (idx >= 0) {
            // Start searching *after* the current cell, wrapping if necessary
            startIndex = (idx + 1) % total;
          }
        }

        // Loop through every cell once, wrapping automatically using modulo
        for (let i = 0; i < total; i++) {
          // Compute index with wraparound
          const index = (startIndex + i) % total;

          // Get the cell coordinates and the corresponding cell object
          const coordinates = this.cells[index];
          const cell = this.getCellByCoordinates(coordinates);

          // Return the first cell without a letter
          if (cell && !cell.letter) {
            return cell;
          }
        }

        // If we reach here, all cells are filled — no empty cell found
        return null;
      }

      // Determine if the word is filled
      isFilled() {
        return this.getFirstEmptyCell() === null;
      }

      getFirstCell() {
        var cell = null;
        if (this.cells.length) {
          cell = this.getCellByCoordinates(this.cells[0]);
        }
        return cell;
      }

      getLastCell() {
        var cell = null;
        if (this.cells.length) {
          cell = this.getCellByCoordinates(this.cells[this.cells.length - 1]);
        }
        return cell;
      }

      getNextCell(x, y) {
        var index = this.cells.indexOf(`${x}-${y}`),
          cell = null;
        if (index < this.cells.length - 1) {
          cell = this.getCellByCoordinates(this.cells[index + 1]);
        }
        return cell;
      }

      getPreviousCell(x, y) {
        var index = this.cells.indexOf(`${x}-${y}`),
          cell = null;
        if (index > 0) {
          cell = this.getCellByCoordinates(this.cells[index - 1]);
        }

        return cell;
      }

      getCellByCoordinates(txt_coordinates) {
        var split, x, y, cell;
        split = txt_coordinates.split('-');
        if (split.length === 2) {
          x = split[0];
          y = split[1];
          cell = this.crossword.getCell(x, y);
          if (cell) {
            return cell;
          }
        }
        return null;
      }

      solve() {
        var i, coordinates, cell;
        for (i = 0;
          (coordinates = this.cells[i]); i++) {
          cell = this.getCellByCoordinates(coordinates);
          if (cell) {
            cell.letter = cell.solution;
          }
        }
      }
    }

    if (typeof define === 'function' && define.amd) {
      define('CrosswordNexus', [], function() {
        return CrosswordNexus;
      });
    }

    if (registerGlobal) {
      window.CrosswordNexus = CrosswordNexus;
    }

    return CrosswordNexus;
  }
);
