/**
Copyright (c) 2025, Crossword Nexus & Crossweird LLC
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/

import { updateCSS, getShadeHighlightColor } from './colors.js';
import { isCorrect, escape, resizeText } from './utils.js';
import { CluesGroup } from './CluesGroup.js';
import { Word } from './Word.js';
import { keyPressed } from './input.js';
import {
  saveGame,
  saveGameImmediate,
  cleanupSaves,
  loadGame
} from './storage.js';
import {
  renderCells,
  positionGrid,
  adjustCell,
  adjustCellPosition,
  adjustCellRect,
  adjustCellBar,
  adjustCellLetter,
  adjustCellNumber,
  adjustCellTopRightNumber,
  adjustCellSlash,
  adjustChevron
} from './rendering.js';
import {
  loadFileFromServer,
  loadFromFile,
  make_fake_clues,
  normalizeClueTitle,
  parsePuzzle
} from './loader.js';
import {
  createModalBox,
  openRebusModal,
  openSettings,
  showInfo,
  showHelp,
  showNotepad
} from './modal.js';
import {
  startTimer,
  stopTimer,
  toggleTimer,
  resetTimer,
  clearTimer,
  getTimerSeconds,
  setTimerSeconds
} from './timer.js';
import {
  check_reveal,
  checkIfSolved
} from './validation.js';
import {
  changeActiveClues,
  getCell,
  setActiveWord,
  setActiveCell,
  skipToWord,
  moveToNextWord,
  hasUnfilledWords,
  moveToFirstCell,
  moveSelectionBy
} from './navigation.js';
import {
  IS_MOBILE,
  CONFIGURABLE_SETTINGS,
  STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  SKIP_UP,
  SKIP_DOWN,
  SKIP_LEFT,
  SKIP_RIGHT,
  FILE_JPZ,
  FILE_PUZ,
  MIN_SIZE,
  MAX_SIZE,
  TEMPLATE
} from './constants.js';

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
      color_selected: '#FF4136',
      color_word: '#FEE300',
      color_none: '#FFFFFF',
      background_color_clue: '#666666',
      font_color_fill: '#000000',
      puzzle_file: null,

      puzzle_object: null, // jsxw to load, if available
      puzzles: null,
      skip_filled_letters: true,
      arrow_direction: 'arrow_move_filled',
      space_bar: 'space_clear',
      timer_autostart: false,
      show_timer_option: true,
      allow_timer_toggle: true,
      has_reveal: true,
      has_check: true,
      tournament_mode: false,
      confetti_enabled: true,
      dark_mode_enabled: false,
      tab_key: 'tab_noskip',
      bar_linewidth: 3.2,
      gray_completed_clues: false,
      min_sidebar_clue_width: 220,
      save_game_limit: 10,
      notepad_name: 'Notes',
      downsOnly: false,
      kelsey: false,
    };



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
    const FILE_ACCEPT_EXTENSIONS = '.puz,.xml,.jpz,.xpz,.ipuz,.cfp';
    const IS_IPAD_SAFARI_OR_FIREFOX = (function() {
      if (typeof navigator === 'undefined') {
        return false;
      }
      const ua = navigator.userAgent || '';
      const platform = navigator.platform || '';
      const isIpad =
        ua.includes('iPad') ||
        (platform === 'MacIntel' && navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
      if (!isIpad) {
        return false;
      }
      const isSafari =
        /\bSafari\b/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
      const isFirefox = /FxiOS|Firefox/i.test(ua);
      return isSafari || isFirefox;
    })();


    /** Template will have to change along with CSS **/
    var template = TEMPLATE;

    // Check if we can drag and drop files
    var isAdvancedUpload = (function() {
      var div = document.createElement('div');
      return (
        ('draggable' in div || ('ondragstart' in div && 'ondrop' in div)) &&
        'FormData' in window &&
        'FileReader' in window
      );
    })();






    // Breakpoint widths used by the stylesheet.
    const breakpoints = [420, 600, 650, 850, 1080, 1200];

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
        this.saveTimeout = null;
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

        // Copy any other properties from user_config that aren't in default_config
        // This is important for custom callbacks like onSolved
        if (user_config) {
          for (i in user_config) {
            if (user_config.hasOwnProperty(i) && !this.config.hasOwnProperty(i)) {
              this.config[i] = user_config[i];
            }
          }
        }

        // Tournament Mode overrides
        if (this.config.tournament_mode) {
          this.config.has_reveal = false;
          this.config.has_check = false;
          this.config.timer_autostart = true;
          if (this.config.is_warmup && this.config.puzzle_id) {
            try {
              const completed = JSON.parse(localStorage.getItem('completed_warmups') || '[]');
              if (completed.includes(this.config.puzzle_id)) {
                this.config.timer_autostart = false;
              }
            } catch (e) {}
          }
          this.config.show_timer_option = false;
          this.config.allow_timer_toggle = false;
          this.config.confetti_enabled = false;
        }


        /* Update config values based on `color_word` */
        const COLOR_WORD = this.config.color_word;
        const COLOR_SELECTED = this.config.color_selected;

        /* Update CSS values based on `color_word` and `color_selected`*/
        this.updateCSS = updateCSS;

        this.updateCSS(COLOR_WORD, COLOR_SELECTED);

        /** enable dark mode if requested **/
        if (this.config.dark_mode_enabled) {
          document.body.classList.add('dark-mode');
          this.updateCSS(COLOR_WORD, COLOR_SELECTED);
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

        this.selected_word = null;
        this.selected_cell = null;
        this.settings_open = false;
        // TIMER
        this.timer_running = false;

        this.diagramless_dir = 'across';

        // whether to show the reveal button
        this.has_reveal = true;

        this.handleClickWindow = this.handleClickWindow.bind(this);
        this.windowResized = this.windowResized.bind(this);
        this.updateClueLayout = this.updateClueLayout.bind(this);

        this.init();
      }

      make_fake_clues(puzzle, clue_mapping = {}) {
        return make_fake_clues.call(this, puzzle, clue_mapping);
      }

      init() {
        var parsePUZZLE_callback = $.proxy(this.parsePuzzle, this);
        var error_callback = $.proxy(this.error, this);

        if (this.root) {
          this.remove();
        }

        // Reset state
        this.activeClueGroupIndex = 0;
        this.selected_word = null;
        this.selected_cell = null;
        this.isSolved = false;
        this.diagramless_mode = false;
        this.savegame_name = null;
        this.timer_running = false;
        this.xw_timer_seconds = 0;
        resetTimer(); // Reset global timer variable

        this.cells = {};
        this.words = {};
        this.clueGroups = [];
        this.displayClueGroups = null;

        this.has_reveal = this.config.has_reveal;
        this.has_check = this.config.has_check;
        this.is_autofill = false;
        this.completion_message = "Puzzle solved!";
        this.notes = new Map();

        // build structures
        this.root = $(template);
        const fileInput = this.root.find('input.cw-open-jpz');
        if (IS_IPAD_SAFARI_OR_FIREFOX) {
          fileInput.removeAttr('accept');
        } else {
          fileInput.attr('accept', FILE_ACCEPT_EXTENSIONS);
        }
        this.top_text = this.root.find('div.cw-top-text');
        //this.bottom_text = this.root.find('div.cw-bottom-text');
        this.clues_holder = this.root.find('div.cw-clues-holder');
        this.extra_clues_holder = this.root.find('div.cw-extra-clues-button-holder');
        this.toptext = this.root.find('.cw-top-text-wrapper');

        this.settings_btn = this.root.find('.cw-settings-button');
        this.file_menu = this.root.find('.cw-file-menu');
        this.tournament_submit_btn = this.root.find('.cw-tournament-submit');
        if (this.config.tournament_mode) {
          this.tournament_submit_btn.show();
          this.file_menu.hide();
        }        this.hidden_input = this.root.find('input.cw-hidden-input');
        this.reveal_letter = this.root.find('.cw-reveal-letter');
        this.reveal_word = this.root.find('.cw-reveal-word');
        this.reveal_puzzle = this.root.find('.cw-reveal-puzzle');

        this.check_letter = this.root.find('.cw-check-letter');
        this.check_word = this.root.find('.cw-check-word');
        this.check_puzzle = this.root.find('.cw-check-puzzle');

        this.info_btn = this.root.find('.cw-file-info');
        this.help_btn = this.root.find('.cw-file-help');
        this.load_btn = this.root.find('.cw-file-load');
        // hide the load button by default
        this.load_btn.hide();

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

          // show the load button
          this.load_btn.show();

          this.open_button.on('click', () => {
            this.file_input.val('');
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

          // Show PWA install button
          const btn = this.root.find('#installAppBtn');
          CrosswordShared.setupPWAInstallButton(btn);

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
        return normalizeClueTitle.call(this, rawTitle);
      }

      parsePuzzle(data) {
        parsePuzzle.call(this, data);
        setTimerSeconds(this.xw_timer_seconds || 0);
      }

      // Return the next non-block, in-bounds cell from a start cell in a given direction.
      // dir: 'across' (x+) or 'down' (y+). step = +1 (forward) or -1 (backward)
      nextDiagramlessCell(fromCell, dir = this.diagramless_dir, step = 1) {
        if (!fromCell) return null;
        let {
          x,
          y
        } = fromCell;

        if (dir === 'across') {
          for (let nx = x + step; nx >= 1 && nx <= this.grid_width; nx += step) {
            const c = this.getCell(nx, y);
            if (c && c.type !== 'block') return c;
          }
        } else {
          for (let ny = y + step; ny >= 1 && ny <= this.grid_height; ny += step) {
            const c = this.getCell(x, ny);
            if (c && c.type !== 'block') return c;
          }
        }
        return null;
      }

      setDiagramlessDir(dir) {
        if (dir !== this.diagramless_dir) {
          this.diagramless_dir = dir;
          this.adjustChevron();
        }
      }

      toggleDiagramlessDir() {
        this.setDiagramlessDir((this.diagramless_dir === 'across') ? 'down' : 'across');
      }

      completeLoad() {
        $('.cw-header').html(`
          <span class="cw-title">${escape(this.title)}</span>
          <span class="cw-header-separator">&nbsp;•&nbsp;</span>
          <span class="cw-author">${escape(this.author)}</span>
          ${
            this.notepad
              ? `<button class="cw-button cw-button-notepad">
                   <span class="cw-button-icon">📝</span> ${this.config.notepad_name}
                 </button>`
              : ''
          }
          <span class="cw-flex-spacer"></span>
          <span class="cw-copyright">${escape(this.copyright)}</span>
        `);

        this.notepad_icon = this.root.find('.cw-button-notepad');

        // === Initial cell selection (diagramless or fakeclues) ===
        if (this.diagramless_mode || this.fakeclues) {
          const firstCell = this.getCell(1, 1);
          if (firstCell) {
            this.setSelectedCell(firstCell);
            this.setSelectedWord(null);
            this.top_text.html(''); // Clear top clue text
            const initMessage = (this.diagramless_mode ? '[Diagramless Init]' : '[Fakeclues Init]');
            console.log(initMessage, {
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

        // Add "Extra Clues" button if there are fake clue groups
        if (this.clueGroups && this.clueGroups.some(g => g.isFake)) {
          const extraCluesBtn = document.createElement('button');
          extraCluesBtn.className = 'cw-button cw-button-extra-clues';
          extraCluesBtn.innerHTML = '<span class="cw-button-icon">➕</span> Show unmatched clues';
          extraCluesBtn.style.margin = '10px auto';
          extraCluesBtn.style.maxWidth = '200px';
          // Initial visibility state handled by CSS via breakpoints

          extraCluesBtn.onclick = () => {
            let cluesHtml = '<div class="unmatched-clues-modal-wrapper">';
            // Use displayClueGroups if available, otherwise fallback to clueGroups
            const groupsToShow = (this.displayClueGroups || this.clueGroups).filter(g => g.isFake);
            groupsToShow.forEach(group => {
              cluesHtml += `<div class="unmatched-clue-group-title">${group.title}</div><div class="unmatched-clues-list">`;
              group.clues.forEach(clue => {
                const isCompleted = clue.fakeClueCompleted ? 'completed' : '';
                cluesHtml += `<div class="unmatched-clue-item ${isCompleted}" data-word="${clue.wordId}" data-clues="${group.id}">
                  <span class="unmatched-clue-number">${clue.number}</span>
                  <span class="unmatched-clue-text">${clue.text}</span>
                </div>`;
              });
              cluesHtml += '</div>';
            });
            cluesHtml += '</div>';

            this.createModalBox('Unmatched Clues', cluesHtml);

            // Add click handlers for clues in the modal
            $('.unmatched-clues-modal-wrapper').off('click').on('click', '.unmatched-clue-item', (e) => {
              const target = $(e.currentTarget);
              const groupId = target.attr('data-clues');
              const wordId = target.attr('data-word');

              // Find group in either collection
              const clueGroup = (this.displayClueGroups || this.clueGroups).find(g => g.id === groupId);
              if (!clueGroup) return;

              const clue = clueGroup.clues.find(c => String(c.wordId) === String(wordId));

              if (clue) {
                clue.fakeClueCompleted = !Boolean(clue.fakeClueCompleted);
                target.toggleClass('completed', clue.fakeClueCompleted);
                // Also update the hidden clue in the main holder if it exists
                const mainClue = $(`.cw-clues-holder [data-word="${wordId}"][data-clues="${groupId}"]`);
                if (mainClue.length) {
                  mainClue.toggleClass('completed', clue.fakeClueCompleted);
                }
              }
            });
          };

          if (this.extra_clues_holder) {
            this.extra_clues_holder.empty().append(extraCluesBtn);
          }
        }

        this.root.removeClass('loading');

        this.root.addClass('loaded');

        this.waitUntilSVGWidthStabilizes(() => {
          if (this.selected_word && this.top_text?.length) {
            resizeText(this.root, this.top_text);
          }
        });
        this.renderCells();
        this.styleClues();

        // === Post-render selection fallback ===
        if (this.diagramless_mode) {
          const firstCell = this.getCell(1, 1);
          if (firstCell) {
            this.setSelectedCell(firstCell);
            this.setSelectedWord(null);
            this.top_text.html('');
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

        // and whenever window resizes
        window.removeEventListener('resize', this.updateClueLayout);
        window.addEventListener('resize', this.updateClueLayout);

        // Initial layout pass
        setTimeout(() => {
          this.updateClueLayout();
          this.windowResized();
        }, 100);

      } // end completeLoad

      updateClueLayout() {
        /** Some JS magic to deal with weird numbers of clue lists **/
        const holder = this.clues_holder ? this.clues_holder.get(0) : null;
        if (!holder) return; // nothing to do if it doesn't exist

        const clues = holder.querySelectorAll('.cw-clues');
        if (!clues.length) return;

        const MIN_AVG_WIDTH = this.config.min_sidebar_clue_width || 220; // tweak this breakpoint

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

      remove() {
        this.removeListeners();
        this.root.remove();
      }

      removeGlobalListeners() {
        $(window).off('click', this.handleClickWindow);
        $(window).off('resize', this.windowResized);
        window.removeEventListener('resize', this.updateClueLayout);
      }

      removeListeners() {
        this.removeGlobalListeners();
        this.root.undelegate();
        this.clues_holder.undelegate('div.cw-clues-items div.cw-clue', 'click');
        this.clues_holder.undelegate('div.cw-clues-items span', 'click');
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
        this.tournament_submit_btn.off('click');
        this.info_btn.off('click');
        this.help_btn.off('click');
        this.notepad_btn.off('click');
        this.notepad_icon.off('click');

        this.hidden_input.off('input');
        this.hidden_input.off('keydown');
        $(document).off('keydown');

        // Clear pending saves
        if (this.saveTimeout) {
          clearTimeout(this.saveTimeout);
          this.saveTimeout = null;
        }

        // Stop timer
        clearTimer();
      }

      addListeners() {
        this.removeListeners();

        $(window).on('click', this.handleClickWindow);
        $(window).on('resize', this.windowResized);

        this.root.delegate(
          '.cw-menu-container > button',
          'click',
          $.proxy(this.handleClickOpenMenu, this)
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

        // SAVE
        this.save_btn.on('click', $.proxy(this.saveAsIpuz, this));

        // Disable specific buttons in tournament mode
        if (this.config.tournament_mode) {
          this.print_btn.hide();
          this.clear_btn.hide();
          this.save_btn.hide();
        }

        // LOAD
        this.load_btn.on('click', () => {
          // Re-initialize to a clean state
          this.init();
          // Reset file input value to allow opening the same file again
          this.file_input.val('');
          this.file_input.click();
        });

        // TIMER
        this.timer_button.on('click', $.proxy(this.toggleTimer, this));

        // SETTINGS
        this.settings_btn.on('click', $.proxy(this.openSettings, this));

        // TOURNAMENT SUBMIT
        this.tournament_submit_btn.on('click', () => {
          if (this.config.tournament_mode && this.config.onSubmitted) {
            this.config.onSubmitted(this);
          }
        });
        // INFO
        this.info_btn.on('click', $.proxy(this.showInfo, this));

        // HELP
        this.help_btn.on('click', $.proxy(this.showHelp, this));

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

        $(document).off('keydown').on('keydown', $.proxy(this.keyPressed, this));

        this.svg.on('click', (e) => {
          if (e.target.tagName === 'rect') {
            const x = parseInt(e.target.getAttribute('data-x'));
            const y = parseInt(e.target.getAttribute('data-y'));
            const clickedCell = this.getCell(x, y);

            if (this.diagramless_mode) {
              return; // prevent the normal puzzle branch below
            }

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
              }
            }
          }
        });


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
        createModalBox.call(this, title, content, button_text);
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
        changeActiveClues.call(this, targetIndex);
      }

      getCell(x, y) {
        return getCell.call(this, x, y);
      }

      setActiveWord(word) {
        setActiveWord.call(this, word);
      }

      setActiveCell(cell) {
        setActiveCell.call(this, cell);
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
            clue: clue,
            word: clue.word,
            number: clue.number,
            clues: clues_group.id,
          }).addClass(`cw-clue word-${clue.word} group-${clues_group.id}`);

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
          .on('click', '.cw-input', function(event) {
            event.stopPropagation();
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
        renderCells.call(this);
      }

      positionGrid() {
        positionGrid.call(this);
      }

      adjustCell(cell) {
        adjustCell.call(this, cell);
      }

      adjustCellPosition(cell) {
        adjustCellPosition.call(this, cell);
      }

      adjustCellRect(cell) {
        adjustCellRect.call(this, cell);
      }

      adjustCellBar(cell, side) {
        adjustCellBar.call(this, cell, side);
      }

      adjustCellLetter(cell) {
        adjustCellLetter.call(this, cell);
      }

      adjustCellNumber(cell) {
        adjustCellNumber.call(this, cell);
      }

      adjustCellTopRightNumber(cell) {
        adjustCellTopRightNumber.call(this, cell);
      }

      adjustCellSlash(cell) {
        adjustCellSlash.call(this, cell);
      }

      adjustChevron() {
        adjustChevron.call(this);
      }

      cellFillColor(cell) {
        if (cell.type === 'block') {
          return cell.color || 'var(--grid-block-color)';
        } else if (this.selected_cell && cell.x === this.selected_cell.x && cell.y === this.selected_cell.y) {
          return 'var(--grid-selected-square-color)';
        } else if (this.selected_word && this.selected_word.hasCell(cell.x, cell.y)) {
          return cell.shade_highlight_color || 'var(--grid-selected-word-color)';
        } else if (this.selected_cell && this.number_to_cells[this.selected_cell.number || this.selected_cell.top_right_number]?.includes(cell)) {
          // highlight partners
          return cell.shade_highlight_color || 'var(--grid-selected-word-color)';
        } else if (cell.color) {
          return cell.color;
        } else {
          return 'var(--grid-none-color)';
        }
      }

      cellFontColor(cell) {
        const fillColor = this.cellFillColor(cell);
        if (cell.image) {
          // Images should show text in black regardless of background brightness
          return '#000000';
        } else if (typeof fillColor === 'string' && fillColor.startsWith('var(--grid-selected-square-color)')) {
          return 'var(--grid-selected-square-text-color)';
        } else if (typeof fillColor === 'string' && fillColor.startsWith('var(--grid-selected-word-color)')) {
          return 'var(--grid-selected-word-text-color)';
        } else if (typeof fillColor === 'string' && (fillColor.startsWith('var(--grid-none-color)') || fillColor.startsWith('var(--grid-block-color)'))) {
          return fillColor.includes('block') ? 'white' : 'var(--grid-none-text-color)';
        } else {
          // Brightness of the background and foreground
          const bgBrightness = Color.getBrightness(fillColor || this.config.color_none);
          const fgBrightness = Color.getBrightness(this.config.font_color_fill);

          // If we fail to meet some threshold, invert
          if (Math.abs(bgBrightness - fgBrightness) < 125) {
            var thisRGB = Color.hexToRgb(this.config.font_color_fill);
            var invertedRGB = thisRGB.map(x => 255 - x);
            return Color.rgbToHex(invertedRGB[0], invertedRGB[1], invertedRGB[2]);
          } else {
            return this.config.font_color_fill;
          }
        }
      }

      renumberGrid() {
        let number = 1;
        const width = this.grid_width;
        const height = this.grid_height;

        // Update the grid from the underlying jsxw object
        this.fillJsXw();
        console.log(this.jsxw);
        const grid = this.jsxw.grid();
        const numbering = grid.gridNumbering();

        // Assign new numbers
        for (let y = 1; y <= height; y++) {
          for (let x = 1; x <= width; x++) {
            const cell = this.getCell(x, y);
            this.updateCell(cell, {
              number: numbering[y - 1][x - 1] > 0 ? numbering[y - 1][x - 1] : null
            });
          }
        }



      } /* END renumbergrid() */

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
          if (!clickedCell) return;

          // If user clicks the same cell again, toggle direction (just like normal puzzles)
          if (
            this.selected_cell &&
            this.selected_cell.x === index_x &&
            this.selected_cell.y === index_y &&
            clickedCell.type !== 'block'
          ) {
            this.toggleDiagramlessDir(); // <-- Step 2 helper
            if (!IS_MOBILE) this.hidden_input.focus();
            return;
          }

          // Otherwise, select the clicked cell without tying to any word
          this.setSelectedCell(clickedCell);
          this.setSelectedWord(null);
          this.top_text.html('');
          if (!IS_MOBILE) this.hidden_input.focus();
          return; // prevent falling through to normal-puzzle logic
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
        } else {
          // If no matching word found and current group is fake, clear top text
          const currentGroup = this.clueGroups[this.activeClueGroupIndex];
          if (this.fakeclues || (currentGroup && currentGroup.isFake)) {
            this.top_text.html('');
          }
        }

        // Update cell selection and redraw
        this.setActiveCell(clickedCell);

        if (!IS_MOBILE) {
          this.hidden_input.focus();
        }
      }

      openRebusModal() {
        openRebusModal.call(this);
      }

      keyPressed(e) {
        keyPressed.call(this, e);
      }

      backspace() {
        if (this.selected_cell && !this.selected_cell.fixed) {
          this.updateCell(this.selected_cell, {
            letter: '',
            checked: false
          });
          this.autofill();

          if (this.diagramless_mode) {
            // Move to the previous editable cell based on current diagramless direction
            const prev = this.nextDiagramlessCell(this.selected_cell, this.diagramless_dir, -1);
            if (prev) this.setActiveCell(prev);
          } else if (this.selected_word) {
            const prev_cell = this.selected_word.getPreviousCell(
              this.selected_cell.x,
              this.selected_cell.y
            );
            this.setActiveCell(prev_cell);
          }

          this.checkIfSolved();
        }
      }

      autofill() {
        this.saveGame(); // keep saving

        if (this.is_autofill && this.selected_cell) {
          const key = this.selected_cell.number || this.selected_cell.top_right_number;
          const same_number_cells = this.number_to_cells[key] || [];

          for (const cell of same_number_cells) {
            if (cell !== this.selected_cell) {
              this.updateCell(cell, {
                letter: this.selected_cell.letter,
                checked: this.selected_cell.checked
              });
            }
          }
        }
      }

      // Detects user inputs to hidden input element
      hiddenInputChanged(rebus_string) {
        var next_cell;
        if (this.selected_cell) {
          if (rebus_string && rebus_string.trim()) {
            this.updateCell(this.selected_cell, {
              letter: rebus_string.toUpperCase() // ✅ Use rebus string if available
            });
          } else {
            const mychar = this.hidden_input.val().slice(0, 1).toUpperCase();
            if (mychar) {
              this.updateCell(this.selected_cell, {
                letter: mychar
              });
            }
          }
          this.updateCell(this.selected_cell, {
            checked: false
          });

          // If this is a coded or acrostic
          // find all cells with this number
          // and fill them with the same letter
          this.autofill();

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
          this.checkIfSolved()
        }
        this.hidden_input.val('');
      }

      checkIfSolved(do_reveal = true) {
        checkIfSolved.call(this, do_reveal);
      }

      // callback for shift+arrows
      // finds next cell in specified direction that does not belongs to current word
      // then selects that word and selects its first empty || first cell
      skipToWord(direction) {
        skipToWord.call(this, direction);
      }

      moveToNextWord(to_previous, skip_filled_words = false) {
        moveToNextWord.call(this, to_previous, skip_filled_words);
      }

      hasUnfilledWords() {
        return hasUnfilledWords.call(this);
      }

      moveToFirstCell(to_last) {
        moveToFirstCell.call(this, to_last);
      }

      moveSelectionBy(delta_x, delta_y, jumping_over_black) {
        moveSelectionBy.call(this, delta_x, delta_y, jumping_over_black);
      } // END moveSelectionBy()


      windowResized() {
        setBreakpointClasses(this.root);
        resizeText(this.root, this.top_text);
        this.positionGrid();
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

      // callback for clicking a clue in the sidebar
      clueClicked(e) {
        const target = $(e.currentTarget);
        const clue = target.data('clue');
        const wordId = target.data('word');
        const word = this.words[wordId];

        // Find which clue group this clue belongs to
        const clickedGroupId = target.data('clues');
        const groupIndex = this.clueGroups.findIndex(g => g.id === clickedGroupId);
        const group = this.clueGroups[groupIndex];

        if (this.fakeclues || (group && group.isFake)) {
          // Toggle "completed" state on the clue itself
          clue.fakeClueCompleted = !Boolean(clue.fakeClueCompleted);

          // Update this specific clue element immediately
          this.updateClueAppearance(clue, target);
          return;
        }

        if (!word) return;

        if (this.diagramless_mode) return;

        const cell = word.getFirstEmptyCell() || word.getFirstCell();
        if (!cell) return;

        // Switch directly to that group if needed
        if (groupIndex !== -1 && groupIndex !== this.activeClueGroupIndex) {
          this.changeActiveClues(groupIndex);
        }

        this.setActiveWord(word);
        this.setActiveCell(cell);
      }

      showInfo() {
        showInfo.call(this);
      }

      showHelp() {
        showHelp.call(this);
      }

      showNotepad() {
        showNotepad.call(this);
      }

      /**
       * Normalize selected text to letters only (A–Z).
       */
      lettersOnly(text) {
        return (text || "")
          .toUpperCase()
          .replace(/[^A-Z]/g, "");
      }

      openSettings() {
        openSettings.call(this);
      }

      fillJsXw() {
        const cells = this.cells;
        this.jsxw.cells.forEach((c) => {
          const x = c.x;
          const y = c.y;
          const cellData = cells[x + 1][y + 1];

          c.letter = cellData.letter;
          c.top_right_number = cellData.top_right_number;

          // for diagramless purposes
          c.type = cellData.type;

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
        saveGame.call(this);
      }

      saveGameImmediate() {
        saveGameImmediate.call(this);
      }

      /* Keep only the most recent saves */
      cleanupSaves(limit = null) {
        cleanupSaves.call(this, limit);
      }

      /* Load a game from local storage */
      loadGame() {
        return loadGame.call(this);
      }

      check_reveal(to_solve, reveal_or_check, e) {
        check_reveal.call(this, to_solve, reveal_or_check, e);
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

      saveAsIpuz(e) {
        console.log(e);
        const json = window.ipuz; // this should be a JSON *string*

        // Create a Blob from the text
        const blob = new Blob([json], { type: "application/json" });

        // Create a temporary <a> element
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        // Try to sanitize the title for a filename
        let filename1 = this.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        if (!filename1) {
          // if this didn't work, revert to just "puzzle"
          filename1 = 'puzzle';
        }
        const filename = filename1 + '.ipuz';
        a.download = filename; // filename for the dialog

        // Trigger a click
        a.click();

        // Cleanup
        URL.revokeObjectURL(url);
      }

      startTimer() {
        startTimer.call(this);
      }

      stopTimer(shouldFocus = false) {
        stopTimer.call(this, shouldFocus);
      }

      toggleTimer() {
        toggleTimer.call(this);
      }

      styleClues() {
       // Update all clues in the sidebar
        this.clues_holder.find('.cw-clue').each((i, el) => {
          const $el = $(el);
          const clue = $el.data('clue');
          this.updateClueAppearance(clue, $el);
        });
      }

      updateClueAppearance(clue, $el) {
        if (!clue) return;

        // Use provided $el or look it up in the DOM using unique identifying info
        const clueEl = $el || $(document).find(`.cw-clue.word-${clue.word}[data-number="${clue.number}"]`);

        // We specifically target the clue-text span to avoid graying out the clue number
        const textEl = clueEl.hasClass('cw-clue-text') ? clueEl : clueEl.find('.cw-clue-text');

        const groupId = clueEl.data('clues');
        const group = this.clueGroups.find(g => g.id === groupId);

        if (!this.config.gray_completed_clues && (!group || !group.isFake) && !this.fakeclues) {
          // Reset clue styling if the setting is turned off and this is not a fake clue context
          textEl.css({
            "text-decoration": "",
            "color": ""
          });
          return;
        }

        // Determine if it should be gray based on fakeclues context or word fill state
        let shouldGray = false;
        if (this.fakeclues || (group && group.isFake)) {
          shouldGray = Boolean(clue.fakeClueCompleted);
        } else if (clue.word && this.words[clue.word]) {
          shouldGray = this.words[clue.word].isFilled();
        }

        textEl.css({
          "text-decoration": "",
          "color": shouldGray ? "#aaa" : ""
        });
      }

      updateCell(cell, properties) {
        Object.assign(cell, properties);
        this.adjustCell(cell);
        this.styleClues();
      }

      setSelectedCell(new_cell) {
        const prev_cell = this.selected_cell;
        if (prev_cell === new_cell) {
          return;
        }
        this.selected_cell = new_cell;
        for (const cell of [prev_cell, new_cell]) {
          if (!cell) {
            continue;
          }
          const number = cell.number || cell.top_right_number;
          const linked_cells = this.number_to_cells[number] ?? [cell];
          for (const linked_cell of linked_cells) {
            this.adjustCell(linked_cell);
          }
        }
        this.adjustChevron();
      }

      setSelectedWord(new_word) {
        const prev_word = this.selected_word;
        if (prev_word === new_word) {
          return;
        }
        this.selected_word = new_word;
        for (const word of [prev_word, new_word]) {
          if (!word) {
            continue;
          }
          for (const coord of word.cells) {
            this.adjustCell(word.getCellByCoordinates(coord));
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
