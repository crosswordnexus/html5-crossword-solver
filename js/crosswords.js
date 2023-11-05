/**
Copyright (c) 2015-2021, Crossword Nexus
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/

// Settings that we can save
const CONFIGURABLE_SETTINGS = [
  "skip_filled_letters"
, "arrow_direction"
, "space_bar"
, "tab_key"
, "timer_autostart"
, "dark_mode_enabled"
];

// Since DarkReader is an external library, make sure it exists
try {DarkReader} catch {DarkReader = false;}

/**
* Helper functions
* mostly for colors
**/

// confetti code from https://gist.github.com/elrumo/3055a9163fd2d0d19f323db744b0a094
var confetti={maxCount:150,speed:2,frameInterval:15,alpha:1,gradient:!1,start:null,stop:null,toggle:null,pause:null,resume:null,togglePause:null,remove:null,isPaused:null,isRunning:null};!function(){confetti.start=s,confetti.stop=w,confetti.toggle=function(){e?w():s()},confetti.pause=u,confetti.resume=m,confetti.togglePause=function(){i?m():u()},confetti.isPaused=function(){return i},confetti.remove=function(){stop(),i=!1,a=[]},confetti.isRunning=function(){return e};var t=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame,n=["rgba(30,144,255,","rgba(107,142,35,","rgba(255,215,0,","rgba(255,192,203,","rgba(106,90,205,","rgba(173,216,230,","rgba(238,130,238,","rgba(152,251,152,","rgba(70,130,180,","rgba(244,164,96,","rgba(210,105,30,","rgba(220,20,60,"],e=!1,i=!1,o=Date.now(),a=[],r=0,l=null;function d(t,e,i){return t.color=n[Math.random()*n.length|0]+(confetti.alpha+")"),t.color2=n[Math.random()*n.length|0]+(confetti.alpha+")"),t.x=Math.random()*e,t.y=Math.random()*i-i,t.diameter=10*Math.random()+5,t.tilt=10*Math.random()-10,t.tiltAngleIncrement=.07*Math.random()+.05,t.tiltAngle=Math.random()*Math.PI,t}function u(){i=!0}function m(){i=!1,c()}function c(){if(!i)if(0===a.length)l.clearRect(0,0,window.innerWidth,window.innerHeight),null;else{var n=Date.now(),u=n-o;(!t||u>confetti.frameInterval)&&(l.clearRect(0,0,window.innerWidth,window.innerHeight),function(){var t,n=window.innerWidth,i=window.innerHeight;r+=.01;for(var o=0;o<a.length;o++)t=a[o],!e&&t.y<-15?t.y=i+100:(t.tiltAngle+=t.tiltAngleIncrement,t.x+=Math.sin(r)-.5,t.y+=.5*(Math.cos(r)+t.diameter+confetti.speed),t.tilt=15*Math.sin(t.tiltAngle)),(t.x>n+20||t.x<-20||t.y>i)&&(e&&a.length<=confetti.maxCount?d(t,n,i):(a.splice(o,1),o--))}(),function(t){for(var n,e,i,o,r=0;r<a.length;r++){if(n=a[r],t.beginPath(),t.lineWidth=n.diameter,e=(i=n.x+n.tilt)+n.diameter/2,o=n.y+n.tilt+n.diameter/2,confetti.gradient){var l=t.createLinearGradient(e,n.y,i,o);l.addColorStop("0",n.color),l.addColorStop("1.0",n.color2),t.strokeStyle=l}else t.strokeStyle=n.color;t.moveTo(e,n.y),t.lineTo(i,o),t.stroke()}}(l),o=n-u%confetti.frameInterval),requestAnimationFrame(c)}}function s(t,n,o){var r=window.innerWidth,u=window.innerHeight;window.requestAnimationFrame=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(t){return window.setTimeout(t,confetti.frameInterval)};var m=document.getElementById("confetti-canvas");null===m?((m=document.createElement("canvas")).setAttribute("id","confetti-canvas"),m.setAttribute("style","display:block;z-index:999999;pointer-events:none;position:fixed;top:0"),document.body.prepend(m),m.width=r,m.height=u,window.addEventListener("resize",(function(){m.width=window.innerWidth,m.height=window.innerHeight}),!0),l=m.getContext("2d")):null===l&&(l=m.getContext("2d"));var s=confetti.maxCount;if(n)if(o)if(n==o)s=a.length+o;else{if(n>o){var f=n;n=o,o=f}s=a.length+(Math.random()*(o-n)+n|0)}else s=a.length+n;else o&&(s=a.length+o);for(;a.length<s;)a.push(d({},r,u));e=!0,i=!1,c(),t&&window.setTimeout(w,t)}function w(){e=!1}}();

// hex string to RGB array and vice versa
// thanks https://stackoverflow.com/a/39077686
const hexToRgb = hex =>
  hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
             ,(m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16));

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}).join('');

// perceived brightness of a color on a scale of 0-255
// via wx-xword
function getBrightness(hex) {
  const rgb = hexToRgb(hex);
  //return Math.sqrt(0.299 * rgb[0]**2 + 0.587 * rgb[1]**2 + 0.114 * rgb[2]**2);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

// Helper function for a single component
function componentAvg(c1, c2, weight) {
  //return Math.floor(Math.sqrt(weight * c1**2 + (1 - weight) * c2**2));
  return Math.floor(weight * c1 + (1 - weight) * c2)
}
// helper function to take the "average" of two RGB strings
// thanks https://stackoverflow.com/a/29576746
function averageColors(c1, c2, weight=0.5) {
  var r1 = hexToRgb(c1);
  var r2 = hexToRgb(c2);
  var newColor = [componentAvg(r1[0], r2[0], weight),
    componentAvg(r1[1], r2[1], weight),
    componentAvg(r1[2], r2[2], weight)]
  return rgbToHex(newColor[0], newColor[1], newColor[2]);
}

function adjustColor(color, amount) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

// Main crossword javascript for the Crossword Nexus HTML5 Solver
(function (global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(global);
  } else {
    factory(global, true);
  }
})(
  typeof window !== 'undefined' ? window : this,
  function (window, registerGlobal) {
    'use strict';

    /* All of this is configurable via "params" when instantiating */
    var default_config = {
      hover_enabled: false, // enables or disables cell hover effect
      color_hover: '#FFFFAA', // color for hovered cell (if enabled)
      color_selected: '#FF4136', // color for selected cell
      color_word: '#FEE300', // color for selected word
      color_hilite: '#F8E473', // color for corresponding cells (in acrostics and codewords)
      color_none: '#FFFFFF', // color for "null" or "void" cells
      background_color_clue: '#666666', // color for "clue" cells
      default_background_color: '#c2ed7e', // color for shaded cells whose shade color is badly defined
      color_secondary: '#fff7b7', // color for cross-referenced cells (currently unused)
      font_color_clue: '#FFFFFF', // color for text in "clue" cells
      font_color_fill: '#000000', // color for letters typed in the grid
      color_block: '#000000', // color of "black" squares
      puzzle_file: null, // puzzle file to load
      puzzles: null, // multiple puzzles from dropdown
      bar_linewidth: 3.5, // how thick to make the bars
      /*
      * The below are user-configurable in settings.
      * Here you can specify your preferred default values.
      */
      skip_filled_letters: true, // skip over already-filled letters
      // behavior of arrow keys in a new direction:
      // you can move always or only when a cell is filled
      arrow_direction: 'arrow_move_filled', // arrow_move or arrow_move_filled
      // behavior of the space bar: delete a letter or switch directions
      space_bar: 'space_clear', // space_clear or space_switch
      timer_autostart: false, // should the timer start automatically
      dark_mode_enabled: false, // should dark mode be the default
      // behavior of the "tab" key
      // "tab_noskip" moves to the next word
      // "tab_skip" moves to the next unfilled word
      tab_key: 'tab_noskip',
      confetti_enabled: true
    };

    // constants
    var FILE_JPZ = 'jpz';
    var FILE_PUZ = 'puz';
    var CLUES_TOP = 'clues_top';
    var CLUES_BOTTOM = 'clues_bottom';
    var MIN_SIZE = 10;
    var MAX_SIZE = 100;
    var SKIP_UP = 'up';
    var SKIP_DOWN = 'down';
    var SKIP_LEFT = 'left';
    var SKIP_RIGHT = 'right';
    var STORAGE_KEY = 'crossword_nexus_savegame';
    var SETTINGS_STORAGE_KEY = 'crossword_nexus_settings';

    // messages
    var MSG_SAVED = 'Crossword saved';
    var MSG_LOADED = 'Crossword loaded';
    var MSG_SOLVED = 'Crossword solved! Congratulations!';

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
      <div class="cw-main auto normal">
        <!-- Overlay for opening puzzles -->
        <div class="cw-open-holder">
          <div class="cw-overflow"></div>
          <div class="cw-open-puzzle">
            <div class="cw-open-puzzle-instructions">
              Drag and drop a file here, or click the button to choose a file
              to open.
            </div>
            <button type="button" class="cw-button cw-button-open-puzzle">
              Open puzzle file
            </button>
            <div class="cw-open-puzzle-formats">
              <b>Accepted formats:</b> PUZ, JPZ, XML, CFP, and iPUZ (partial)
            </div>
          </div>
          <input type="file" class="cw-open-jpz" accept=".puz,.xml,.jpz,.xpz,.ipuz,.cfp">
        </div>
        <!-- End overlay -->
        <header class="cw-header"></header>
        <div class="cw-content">
          <!-- Placeholder for modal boxes -->
          <div class="cw-modal"></div>
          <div class="cw-left">
            <div class="cw-buttons-holder">
              <div class="cw-menu-container">
                <button type="button" class="cw-button">
                  <span class="cw-button-icon">🗄️</span> File
                  <span class="cw-arrow"></span>
                </button>
                <div class="cw-menu">
                  <button class="cw-menu-item cw-file-info">Info</button>
                  <button class="cw-menu-item cw-file-notepad">Notepad</button>
                  <button class="cw-menu-item cw-file-print">Print</button>
                  <hr />
                  <button class="cw-menu-item cw-file-clear">Clear</button>
                  <hr />
                  <button class="cw-menu-item cw-file-download">Export JPZ</button>
                </div>
              </div>
              <div class="cw-menu-container cw-check">
                <button type="button" class="cw-button">
                  <span class="cw-button-icon">🔍</span> Check
                  <span class="cw-arrow"></span>
                </button>
                <div class="cw-menu">
                  <button class="cw-menu-item cw-check-letter">Letter</button>
                  <button class="cw-menu-item cw-check-word">Word</button>
                  <button class="cw-menu-item cw-check-puzzle">Puzzle</button>
                </div>
              </div>
              <div class="cw-menu-container cw-reveal">
                <button type="button" class="cw-button">
                  <span class="cw-button-icon">🎱</span> Reveal
                  <span class="cw-arrow"></span>
                </button>
                <div class="cw-menu">
                  <button class="cw-menu-item cw-reveal-letter">Letter</button>
                  <button class="cw-menu-item cw-reveal-word">Word</button>
                  <button class="cw-menu-item cw-reveal-puzzle">Puzzle</button>
                </div>
              </div>
              <button type="button" class="cw-button cw-settings-button">
                <span class="cw-button-icon">⚙️</span> Settings
              </button>
              <span class="cw-flex-spacer"></span>
              <button type="button" class="cw-button cw-button-timer">00:00</button>
            </div>
            <div class="cw-top-text-wrapper">
              <div class="cw-top-text">
                <span class="cw-clue-number"></span>
                <span class="cw-clue-text"></span>
              </div>
            </div>
            <input type="text" class="cw-hidden-input">
            <div class="cw-canvas">
              <canvas></canvas>
            </div>
          </div>
          <div class="cw-clues-holder">
            <div class="cw-clues cw-clues-top">
              <div class="cw-clues-title"></div>
              <div class="cw-clues-items"></div>
            </div>
            <div class="cw-clues cw-clues-bottom">
              <div class="cw-clues-title"></div>
              <div class="cw-clues-items"></div>
            </div>
          </div>
        </div>
      </div>`;

    // returns deferred object
    function loadFileFromServer(path, type) {
      var xhr = new XMLHttpRequest(),
        deferred = $.Deferred();
      xhr.open('GET', path);
      xhr.responseType = 'blob';
      xhr.onload = function () {
        if (xhr.status == 200) {
          loadFromFile(xhr.response, type, deferred);
        } else {
          deferred.reject(ERR_FILE_LOAD);
        }
      };
      xhr.send();
      return deferred;
    }

    // Check if we can drag and drop files
    var isAdvancedUpload = (function () {
      var div = document.createElement('div');
      return (
        ('draggable' in div || ('ondragstart' in div && 'ondrop' in div)) &&
        'FormData' in window &&
        'FileReader' in window
      );
    })();

    function loadFromFile(file, type, deferred) {
      var reader = new FileReader();
      deferred = deferred || $.Deferred();
      reader.onload = function (event) {
        var string = event.target.result;
        deferred.resolve(string);
      };
      reader.readAsBinaryString(file);
      return deferred;
    }

    // Breakpoint config for the top clue, as tuples of `[max_width, max_size]`
    const maxClueSizes = [
      [1080, 15],
      [1200, 17],
      [Infinity, 19],
    ];

    /** Function to resize text **/
    function resizeText(rootElement, nodeList) {
      const minSize = 9;
      const rootWidth = rootElement.width();
      const maxSize = maxClueSizes.find(
        (breakpoint) => breakpoint[0] > rootWidth
      )[1];
      const step = 1;
      const unit = 'px';

      for (var j = 0; j < nodeList.length; j++) {
        const el = nodeList[j];
        let i = minSize;
        let overflow = false;
        const parent = el.parentNode;

        while (!overflow && i <= maxSize) {
          el.style.fontSize = `${i}${unit}`;
          // TODO: is this the best logic we can use here?
          overflow = parent.scrollHeight < el.clientHeight;
          if (!overflow) {
            i += step;
          }
        }
        // revert to last state where no overflow happened
        el.style.fontSize = `${i - step}${unit}`;
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
      createCrossword: function (parent, user_config) {
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
        this.clues_top = null;
        this.clues_bottom = null;
        this.active_clues = null;
        this.inactive_clues = null;
        this.hovered_x = null;
        this.hovered_y = null;
        this.selected_word = null;
        this.hilited_word = null;
        this.selected_cell = null;
        this.settings_open = false;
        // TIMER
        this.timer_running = false;

        // Solution message
        this.msg_solved = MSG_SOLVED;

        // whether to show the reveal button
        this.has_reveal = true;

        this.handleClickWindow = this.handleClickWindow.bind(this);
        this.windowResized = this.windowResized.bind(this);

        this.init();
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
        this.clues_top_container = this.root.find('div.cw-clues-top');
        this.clues_bottom_container = this.root.find('div.cw-clues-bottom');
        this.canvas_holder = this.root.find('div.cw-canvas');
        this.canvas = this.root.find('canvas');
        this.context = this.canvas[0].getContext('2d');

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
              parsePUZZLE_callback,
              error_callback
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
        } else {
          // shows open button
          var i, puzzle_file, el;

          this.open_button = this.root.find('.cw-button-open-puzzle');
          this.file_input = this.root.find('input[type="file"]');

          this.open_button.on('click', () => {
            this.file_input.click();
          });

          this.file_input.on('change', () => {
            var files = this.file_input[0].files.length
              ? this.file_input[0].files
              : null;
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
                function (e) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              )
              .on('dragover dragenter', function () {
                div_overflow.addClass('is-dragover');
              })
              .on('dragleave dragend drop', function () {
                div_overflow.removeClass('is-dragover');
              })
              .on('drop', function (e) {
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
        setBreakpointClasses(this.root);
      }

      error(message) {
        alert(message);
      }

      /** Parse a puzzle using JSCrossword **/
      parsePuzzle(string) {
        // if "string" is actually an object assume it's already a jsxw
        var puzzle;
        if (typeof(string) == "object") {
          puzzle = string;
        } else {
          var xw_constructor = new JSCrossword();
          puzzle = xw_constructor.fromData(string);
        }
        // we keep the original JSCrossword object as well
        this.jsxw = puzzle;
        // set the savegame_name
        const simpleHash=t=>{let e=0;for(let r=0;r<t.length;r++){e=(e<<5)-e+t.charCodeAt(r),e&=e}return new Uint32Array([e])[0].toString(36)};
        const myHash = simpleHash(JSON.stringify(this.jsxw));
        this.savegame_name = STORAGE_KEY + '_' + myHash;

        // if this savegame name exists, load it
        var jsxw2_cells = this.loadGame();
        if (jsxw2_cells) {
          console.log('Loading puzzle from localStorage');
          this.jsxw.cells = jsxw2_cells;
          puzzle.cells = jsxw2_cells;
        }

        // metadata
        this.title = puzzle.metadata.title || '';
        this.author = puzzle.metadata.author || '';
        this.copyright = puzzle.metadata.copyright || '';
        this.crossword_type = puzzle.metadata.crossword_type;
        this.fakeclues = puzzle.metadata.fakeclues || false;

        // don't show the top text if fakeclues
        if (this.fakeclues) {
          $('div.cw-top-text-wrapper').css({ display: 'none' });
        }

        // Change document title if necessary
        if (this.title) {
          document.title = this.title + ' | ' + document.title;
        }

        // determine whether we should autofill
        if (
          this.crossword_type == 'acrostic' ||
          this.crossword_type == 'coded'
        ) {
          this.is_autofill = true;
        }

        this.notepad = puzzle.metadata.description || '';
        this.grid_width = puzzle.metadata.width;
        this.grid_height = puzzle.metadata.height;
        // disable check and reveal in certain cases
        if (puzzle.metadata.has_reveal === false) {
          this.has_reveal = false;
          $('.cw-reveal').css({ display: 'none' });
        }
        if (puzzle.metadata.has_check === false) {
          this.has_check = false;
          $('.cw-check').css({ display: 'none' });
        }
        this.msg_solved = puzzle.metadata.completion_message || MSG_SOLVED;
        /* cells */
        this.cells = {};
        for (var i=0; i < puzzle.cells.length; i++) {
          var c = { ...puzzle.cells[i]}; // make a copy
          c.x = c.x + 1;
          c.y = c.y + 1;
          if (!this.cells[c.x]) {
            this.cells[c.x] = {};
          }
          c.empty = (c.type === 'block' || c.type === 'void' || c.type === 'clue');
          c.clue = (c.type === 'clue');
          c.bar = {
            top: c['top-bar'] === true,
            bottom: c['bottom-bar'] === true,
            left: c['left-bar'] === true,
            right: c['right-bar'] === true,
          };
          c.color = c['background-color'];
          // if they tried to define a color but did it badly, use the default
          if (c.color && !c.color.match('^#[A-Za-z0-9]{6}$')) {
            c.color = this.default_background_color;
            c['background-color'] = this.default_background_color;
          }
          c.shape = c['background-shape'];

          /* set a "shade_highlight" color */
          if (c.color && c.color != this.config.color_none) {
            //c.shade_highlight_color = averageColors(this.config.color_word, c.color);
            c.shade_highlight_color = averageColors(this.config.color_word, adjustColor(c.color, -50));
            //c.shade_highlight_color = adjustColor(c.color, -30);
          }

          this.cells[c.x][c.y] = c;

          // maintain the mapping of number -> cells
          if (!this.number_to_cells[c.number]) {
            this.number_to_cells[c.number] = [c];
          } else {
            this.number_to_cells[c.number].push(c);
          }
        }

        // helper function for coded and fakeclues puzzles
        this.make_fake_clues = function(puzzle) {
          // initialize the across and down groups
          var clueMapping = {};
          var across_group = new CluesGroup(this, {
            id: CLUES_TOP,
            title: 'ACROSS',
            clues: [],
            words_ids: [],
          });
          var down_group = new CluesGroup(this, {
            id: CLUES_BOTTOM,
            title: 'DOWN',
            clues: [],
            words_ids: [],
          });
          // Determine which word is an across and which is a down
          // We do this by comparing the entry to the set of across entries
          var thisGrid = new xwGrid(puzzle.cells);
          var acrossEntries = thisGrid.acrossEntries();
          var acrossSet = new Set(Object.keys(acrossEntries).map(function (x) {return acrossEntries[x].word;}))
          var entry_mapping = puzzle.get_entry_mapping();
          Object.keys(entry_mapping).forEach(function (id) {
            var thisClue = {word: id, number: id, text: '--'};
            var entry = entry_mapping[id];
            if (acrossSet.has(entry)) {
              across_group.clues.push(thisClue);
              across_group.words_ids.push(id);
              clueMapping[id] = thisClue;
            } else {
              down_group.clues.push(thisClue);
              down_group.words_ids.push(id);
              clueMapping[id] = thisClue;
            }
          });
          return {'across_group': across_group, 'down_group': down_group, 'clue_mapping': clueMapping};
        }

        /* clues */
        var clueMapping = {};
        // we handle them differently for coded crosswords
        if (this.crossword_type === 'coded') {
          var fake_clue_obj = this.make_fake_clues(puzzle);
          this.clues_top = fake_clue_obj.across_group;
          this.clues_bottom = fake_clue_obj.down_group;
          clueMapping = fake_clue_obj.clue_mapping;
          // Also, in a coded crossword, there's no reason to show the clues
          $('div.cw-clues-holder').css({ display: 'none' });
          $('div.cw-top-text-wrapper').css({ display: 'none' });
          // Add some padding to the buttons holder
          $('div.cw-buttons-holder').css({ padding: '0 10px' });

        } else { // not a coded crossword
          // we need to keep a mapping of word ID to clue
          puzzle.clues[0].clue.forEach( function (clue) {
            clueMapping[clue.word] = clue;
          });
          var words_ids_top = puzzle.clues[0].clue.map(function (key) {
            return key.word;
          });
          this.clues_top = new CluesGroup(this, {
            id: CLUES_TOP,
            title: puzzle.clues[0]['title'],
            clues: puzzle.clues[0].clue,
            words_ids: words_ids_top
          });
          // only do a second clue list if we have one
          if (puzzle.clues.length > 1) {
            puzzle.clues[1].clue.forEach( function (clue) {
              clueMapping[clue.word] = clue;
            });
            this.clues_bottom = new CluesGroup(this, {
              id: CLUES_BOTTOM,
              title: puzzle.clues[1]['title'],
              clues: puzzle.clues[1].clue,
              words_ids: puzzle.clues[1].clue.map(function (key) {
                return key.word;
              })
            });
          } else {
            // hide the bottom clues
            $('div.cw-clues-bottom').css({
              display: 'none',
            });
          }
        }

        // If "fakeclues" and the number of words and clues don't match
        // we need to make special "display" clues
        var num_words = puzzle.words.length;
        var num_clues = puzzle.clues.map(x=>x.clue).flat().length;
        if (this.fakeclues && num_words != num_clues) {
          this.display_clues_top = this.clues_top;
          this.display_clues_bottom = this.clues_bottom;
          var fake_clue_obj = this.make_fake_clues(puzzle);
          this.clues_top = fake_clue_obj.across_group;
          this.clues_bottom = fake_clue_obj.down_group;
          clueMapping = fake_clue_obj.clue_mapping;
        }

        /* words */
        this.words = {};
        for (var i=0; i<puzzle.words.length; i++) {
          var word = puzzle.words[i];
          this.words[word.id] = new Word(this, {
            id: word.id,
            dir: word.dir,
            refs_raw: null,
            cell_ranges: word.cells.map(function (c) {
              var obj = {x: (c[0] + 1).toString(), y: (c[1] + 1).toString()};
              return obj;
            }),
            clue: clueMapping[word.id]
          });
        }
        console.log(this);

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

        this.changeActiveClues();

        if (this.display_clues_top || this.clues_top) {
          this.renderClues(this.display_clues_top || this.clues_top, this.clues_top_container);
        }
        if (this.display_clues_bottom || this.clues_bottom) {
          this.renderClues(this.display_clues_bottom || this.clues_bottom, this.clues_bottom_container);
        }
        this.addListeners();

        this.root.removeClass('loading');
        this.root.addClass('loaded');

        var first_word = this.active_clues.getFirstWord();
        this.setActiveWord(first_word);
        this.setActiveCell(first_word.getFirstCell());

        // Start the timer if necessary
        if (this.config.timer_autostart) {
          this.toggleTimer();
        }

        //this.adjustPaddings();
        this.renderCells();

      }

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
        this.canvas.off('mousemove click');

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
        this.clues_holder.delegate(
          'div.cw-clues-items div.cw-clue',
          'click',
          $.proxy(this.clueClicked, this)
        );

        if (this.config.hover_enabled) {
          this.canvas.on('mousemove', $.proxy(this.mouseMoved, this));
        }
        this.canvas.on('click', $.proxy(this.mouseClicked, this));

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
        this.print_btn.on('click', $.proxy(this.printPuzzle, this));

        // CLEAR
        this.clear_btn.on(
          'click',
          $.proxy(this.check_reveal, this, 'puzzle', 'clear')
        );

        // DOWNLOAD
        this.download_btn.on('click', $.proxy(this.exportJPZ, this));

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

        // NOTEPAD
        if (this.notepad) {
          this.notepad_icon.on('click', $.proxy(this.showNotepad, this));
          this.notepad_btn.show();
        }
        this.notepad_btn.on('click', $.proxy(this.showNotepad, this));

        this.hidden_input.on(
          'input',
          $.proxy(this.hiddenInputChanged, this, null)
        );
        this.hidden_input.on('keydown', $.proxy(this.keyPressed, this));
      }

      handleClickWindow(event) {
        this.root.find('.cw-menu').hide();
      }

      handleClickOpenMenu(event) {
        const menuContainer = $(event.target).closest('.cw-menu-container');
        const menu = menuContainer.find('.cw-menu');
        if (!menu.is(':visible')) {
          // This is horrible: delay opening the menu so that
          // `handleClickWindow` can run first and close all previously-open
          // menus
          setTimeout(() => {
            menu.show();
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
        span.onclick = function () {
          modal.style.display = 'none';
          this_hidden_input.focus();
        };
        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function (event) {
          if (event.target == modal) {
            modal.style.display = 'none';
            this_hidden_input.focus();
          }
        };
        // Clicking the button should close the modal
        var modalButton = document.getElementById('modal-button');
        modalButton.onclick = function () {
          modal.style.display = 'none';
          this_hidden_input.focus();
        };
      }

      // Function to switch the clues, generally from "ACROSS" to "DOWN"
      changeActiveClues() {
        if (!this.clues_bottom) {
          // only one clue list
          this.active_clues = this.clues_top;
          this.inactive_clues = this.clues_top;
          if (this.selected_cell) {
            var new_word = this.active_clues.getMatchingWord(
              this.selected_cell.x,
              this.selected_cell.y,
              true
            );
            this.setActiveWord(new_word);
          }
        } else if (this.active_clues && this.active_clues.id === CLUES_TOP) {
          if (this.inactive_clues !== null) {
            this.active_clues = this.clues_bottom;
            this.inactive_clues = this.clues_top;
          }
        } else {
          // active is the bottom
          this.active_clues = this.clues_top;
          this.inactive_clues = this.clues_bottom;
        }
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
        var offset = this.canvas.offset(),
          input_top,
          input_left;
        if (cell && !cell.empty) {
          this.selected_cell = cell;
          this.inactive_clues.markActive(cell.x, cell.y, true, this.fakeclues);
          this.active_clues.markActive(cell.x, cell.y, false, this.fakeclues);

          input_top = offset.top + (cell.y - 1) * this.cell_size;
          input_left = offset.left + (cell.x - 1) * this.cell_size;

          this.hidden_input.css({ left: input_left, top: input_top });
          this.hidden_input.focus();
        }
      }

      renderClues(clues_group, clues_container) {
        var i,
          clue,
          clue_el,
          title = clues_container.find('div.cw-clues-title'),
          items = clues_container.find('div.cw-clues-items');
        items.find('div.cw-clue').remove();
        for (i = 0; (clue = clues_group.clues[i]); i++) {
          clue_el = $(`
            <div>
              <span class="cw-clue-number">
                ${escape(clue.number)}
              </span>
              <span class="cw-clue-text">
                ${escape(clue.text)}
              </span>
            </div>
          `);
          clue_el.data('word', clue.word);
          clue_el.data('number', clue.number);
          clue_el.data('clues', clues_group.id);
          clue_el.addClass('cw-clue');
          clue_el.addClass('word-' + clue.word);
          items.append(clue_el);
        }
        title.html(escape(clues_group.title));
        clues_group.clues_container = items;
      }

      // Clears canvas and re-renders all cells
      renderCells() {
        var x, y;
        const SIZE_OFFSET = 4;

        // Take care of the grid
        const canvasRect = $('.cw-canvas').get(0).getBoundingClientRect();
        const max_height = canvasRect.bottom - canvasRect.top;
        const max_width = canvasRect.right - canvasRect.left;
        this.cell_size = Math.min(
          Math.floor(max_height / this.grid_height),
          Math.floor(max_width / this.grid_width)
        );

        // Scale the grid so it is crisp on high-density screens.
        /* CTFYC dps below */
        var widthDps = this.grid_width * this.cell_size - 2 + SIZE_OFFSET;
        var heightDps = this.grid_height * this.cell_size - 2 + SIZE_OFFSET;
        var devicePixelRatio = window.devicePixelRatio || 1;
        this.canvas[0].width = devicePixelRatio * widthDps;
        this.canvas[0].height = devicePixelRatio * heightDps;
        this.canvas[0].style.width = widthDps + 'px';
        this.canvas[0].style.height = heightDps + 'px';
        this.context.scale(devicePixelRatio, devicePixelRatio);

        /* color in the entire canvas with the blank color */
        this.context.clearRect(
          0,
          0,
          this.canvas[0].width,
          this.canvas[0].height
        );
        this.context.fillStyle = this.config.color_none;
        this.context.fillRect(
          0,
          0,
          this.canvas[0].width,
          this.canvas[0].height
        );
        // set the fill style
        this.context.fillStyle = this.config.color_block;

        // if the word has references to any others
        var secondary_highlight_cells = [];
        /**
        if (this.selected_word.refs_raw) {
          // only support one reference per clue for now
          var search_num = this.selected_word.refs_raw[0].number;
          var search_dir = this.selected_word.refs_raw[0].direction.toLowerCase();
          for (var i in this.words) {
            if (this.words[i].clue.number == search_num && this.words[i].dir == search_dir) {
              var secondary_highlight_cells = this.words[i].cell_ranges;
            }
          }
        }
        **/

        var color;
        for (x in this.cells) {
          for (y in this.cells[x]) {
            var cell = this.cells[x][y],
              cell_x = (x - 1) * this.cell_size + 1,
              cell_y = (y - 1) * this.cell_size + 1;
            if (!cell.empty) {
              // detect cell color
              color = cell.color;
              if (
                this.hilited_word &&
                this.hilited_word.hasCell(cell.x, cell.y)
              ) {
                //color = this.config.color_hilite;
              }
              if (
                secondary_highlight_cells &&
                secondary_highlight_cells.some(c => c.x == cell.x) &&
                secondary_highlight_cells.some(c => c.y == cell.y)
              ) {
                color = this.config.color_secondary;
              }
              if (
                this.selected_word &&
                this.selected_word.hasCell(cell.x, cell.y)
              ) {
                // two cases here, depending on whether the cell is shaded
                color = cell.shade_highlight_color || this.config.color_word;
              }
              if (
                this.config.hover_enabled &&
                x == this.hovered_x &&
                y == this.hovered_y
              ) {
                color = this.config.color_hover;
              }
              if (
                this.selected_cell &&
                x == this.selected_cell.x &&
                y == this.selected_cell.y
              ) {
                color = this.config.color_selected;
              }
              //this.context.fillStyle = this.config.color_block;
              //this.context.fillRect(cell_x, cell_y, this.cell_size, this.cell_size);
              // In an autofill puzzle (coded and acrostic), highlight all other cells
              // with the same number as the selected cell
              if (
                this.is_autofill &&
                cell.number == this.selected_cell.number &&
                cell != this.selected_cell
              ) {
                color = this.config.color_hilite;
              }

              this.context.fillStyle = color;

              // Don't bother filling if there's no color
              if (color) {
                this.context.fillRect(
                  cell_x,
                  cell_y,
                  this.cell_size,
                  this.cell_size
                );
              }
              this.context.fillStyle = this.config.color_block;

              // draw bounding box
              this.context.strokeRect(
                cell_x,
                cell_y,
                this.cell_size,
                this.cell_size,
                this.config.color_block
              );
            } else {
              // cell is empty
              if (cell.is_void) {
                /* don't fill voids */
              } else if (cell.clue) {
                // fill
                this.context.fillStyle = this.config.background_color_clue;
                this.context.fillRect(
                  cell_x,
                  cell_y,
                  this.cell_size,
                  this.cell_size
                );
                // bounding box
                this.context.strokeRect(
                  cell_x,
                  cell_y,
                  this.cell_size,
                  this.cell_size,
                  this.config.color_block
                );
              } else {
                // empty + not (void or clue) == block
                // respect cell coloring, even for blocks
                // don't fill if the cell's color is the "none" color
                if (cell.color !== this.config.color_none) {
                  this.context.fillStyle =
                    cell.color || this.config.color_block;
                  this.context.fillRect(
                    cell_x,
                    cell_y,
                    this.cell_size,
                    this.cell_size
                  );
                  // we want a bounding box for blocks
                  if (cell.color != this.config.color_none) {
                    this.context.strokeRect(
                      cell_x,
                      cell_y,
                      this.cell_size,
                      this.cell_size,
                      this.config.color_block
                    );
                  }
                }
              }
              // reset fill style
              this.context.fillStyle = this.config.color_block;
            }

            if (cell.shape === 'circle') {
              var centerX = cell_x + this.cell_size / 2;
              var centerY = cell_y + this.cell_size / 2;
              var radius = this.cell_size / 2;
              this.context.beginPath();
              this.context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
              this.context.stroke();
            }

            /* letters and numbers and such */
            // select the font color
            if (cell.clue) {
              // "clue" cells get their own color
              this.context.fillStyle = this.config.font_color_clue;
            } else {
              // we determine color from the background color
              this.context.fillStyle = this.config.font_color_fill;
              // we need to invert the fill color if the brightness is wrong
              var bgBrightness = getBrightness(color || this.config.color_none);
              var fgBrightness = getBrightness(this.config.font_color_fill);
              if (Math.abs(bgBrightness - fgBrightness) < 125) {
                // invert
                var thisRGB = hexToRgb(this.config.font_color_fill);
                var invertedRGB = thisRGB.map(x => 255 - x);
                this.context.fillStyle = rgbToHex(invertedRGB[0], invertedRGB[1], invertedRGB[2]);
              }
            }

            // bars
            if (cell.bar) {
              var bar_start = {
                top: [cell_x, cell_y + this.config.bar_linewidth/2],
                left: [cell_x + this.config.bar_linewidth/2, cell_y],
                right: [cell_x + this.cell_size - this.config.bar_linewidth/2, cell_y + this.cell_size],
                bottom: [cell_x + this.cell_size, cell_y + this.cell_size - this.config.bar_linewidth/2],
              };
              var bar_end = {
                top: [cell_x + this.cell_size, cell_y + this.config.bar_linewidth/2],
                left: [cell_x + this.config.bar_linewidth/2, cell_y + this.cell_size],
                right: [cell_x - this.config.bar_linewidth/2 + this.cell_size, cell_y],
                bottom: [cell_x, cell_y + this.cell_size - this.config.bar_linewidth/2],
              };
              for (var key in cell.bar) {
                if (cell.bar.hasOwnProperty(key)) {
                  // key is top, bottom, etc.
                  // cell.bar[key] is true or false
                  if (cell.bar[key]) {
                    this.context.beginPath();
                    this.context.moveTo(bar_start[key][0], bar_start[key][1]);
                    this.context.lineTo(bar_end[key][0], bar_end[key][1]);
                    const eps = Math.random()/10000;
                    this.context.lineWidth = this.config.bar_linewidth + eps;
                    this.context.stroke();
                    this.context.lineWidth = 1 + eps;
                  }
                }
              }
            }

            const NUMBER_SIZE_DIV = 3.75;
            if (cell.number) {
              this.context.font =
                Math.ceil(this.cell_size / NUMBER_SIZE_DIV) + 'px sans-serif';
              this.context.textAlign = 'left';
              this.context.textBaseline = 'top';
              this.context.fillText(
                cell.number,
                Math.floor(cell_x + this.cell_size * 0.1),
                Math.floor(cell_y + this.cell_size * 0.1)
              );
            }

            if (cell.top_right_number) {
              this.context.font =
                Math.ceil(this.cell_size / NUMBER_SIZE_DIV) + 'px sans-serif';
              this.context.textAlign = 'right';
              this.context.textBaseline = 'top';
              this.context.fillText(
                cell.top_right_number,
                Math.floor(cell_x + this.cell_size * 0.9),
                Math.floor(cell_y + this.cell_size * 0.1)
              );
            }

            if (cell.letter) {
              var cell_letter_length = cell.letter.length;
              this.context.font =
                this.cell_size / (1.1 + 0.5 * cell_letter_length) +
                'px sans-serif';
              if (cell.revealed) {
                this.context.font = 'bold italic ' + this.context.font;
              }
              if (cell.checked) {
                this.context.beginPath();
                this.context.moveTo(cell_x, cell_y);
                this.context.lineTo(
                  cell_x + this.cell_size,
                  cell_y + this.cell_size
                );
                //this.context.lineWidth = 5;
                this.context.strokeStyle = this.context.fillStyle;
                this.context.stroke();
                this.context.strokeStyle = this.config.color_block;
              }
              this.context.textAlign = 'center';
              this.context.textBaseline = 'middle';

              // the y-offset changes if this is a "clue" block
              // normally we slide the letter down to fit with numbers
              // for "clue" blocks we can center it
              var y_offset = cell.clue
                ? this.cell_size / 1.8
                : (2 * this.cell_size) / 3;
              this.context.fillText(
                cell.letter,
                cell_x + this.cell_size / 2,
                cell_y + y_offset
              );
              // reset fill style
              this.context.fillStyle = this.config.color_block;
            }
          }
        }
      }

      mouseMoved(e) {
        if (this.config.hover_enabled) {
          var offset = this.canvas.offset(),
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

      mouseClicked(e) {
        var offset = this.canvas.offset(),
          mouse_x = e.pageX - offset.left,
          mouse_y = e.pageY - offset.top,
          index_x = Math.ceil(mouse_x / this.cell_size),
          index_y = Math.ceil(mouse_y / this.cell_size);

        if (
          this.selected_cell &&
          this.selected_cell.x == index_x &&
          this.selected_cell.y == index_y
        ) {
          this.changeActiveClues();
        }

        if (this.active_clues.getMatchingWord(index_x, index_y, true)) {
          this.setActiveWord(
            this.active_clues.getMatchingWord(index_x, index_y, true)
          );
        } else if (this.inactive_clues.getMatchingWord(index_x, index_y, true)){
          this.setActiveWord(
            this.inactive_clues.getMatchingWord(index_x, index_y, true)
          );
          this.changeActiveClues();
        }
        this.setActiveCell(this.getCell(index_x, index_y));
        this.renderCells();
      }

      keyPressed(e) {
        if (this.settings_open) {
          return;
        }

        // to prevent event propagation for specified keys
        var prevent =
          [35, 36, 37, 38, 39, 40, 32, 46, 8, 9, 13].indexOf(e.keyCode) >= 0;

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
            }
            break;
          case 32: //space
            if (this.selected_cell && this.selected_word) {
              // change the behavior based on the config
              if (this.config.space_bar === 'space_switch') {
                // check that there is a word in the other direction
                // if there's not, we just don't do anything
                var selectedCellInactiveWord =
                  this.inactive_clues.getMatchingWord(
                    this.selected_cell.x,
                    this.selected_cell.y,
                    true
                  );
                if (selectedCellInactiveWord) {
                  this.changeActiveClues();
                  this.setActiveWord(selectedCellInactiveWord);
                  this.setActiveCell(this.getCell(this.selected_cell.x, this.selected_cell.y));
                }
              } else {
                this.selected_cell.letter = '';
                this.selected_cell.checked = false;
                this.autofill();
                var next_cell = this.selected_word.getNextCell(
                  this.selected_cell.x,
                  this.selected_cell.y
                );
                this.setActiveCell(next_cell);
              }
            }
            this.renderCells();
            // Update this.isSolved
            this.checkIfSolved();
            break;
          case 27: // escape -- pulls up a rebus entry
            if (this.selected_cell && this.selected_word) {
              var rebus_entry = prompt('Rebus entry', '');
              this.hiddenInputChanged(rebus_entry);
            }
            break;
          case 45: // insert -- same as escape
            if (this.selected_cell && this.selected_word) {
              var rebus_entry = prompt('Rebus entry', '');
              this.hiddenInputChanged(rebus_entry);
            }
            break;
          case 46: // delete
            if (this.selected_cell) {
              this.selected_cell.letter = '';
              this.selected_cell.checked = false;
              this.autofill();
            }
            this.renderCells();
            // Update this.isSolved
            this.checkIfSolved();
            break;
          case 8: // backspace
            if (this.selected_cell && this.selected_word) {
              this.selected_cell.letter = '';
              this.selected_cell.checked = false;
              this.autofill();
              var prev_cell = this.selected_word.getPreviousCell(
                this.selected_cell.x,
                this.selected_cell.y
              );
              this.setActiveCell(prev_cell);
            }
            this.renderCells();
            // Update this.isSolved
            this.checkIfSolved();
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
        }
        if (prevent) {
          e.preventDefault();
          e.stopPropagation();
        }
      }

      autofill() {
        // save progress
        this.saveGame();
        if (this.is_autofill) {
          var my_number = this.selected_cell.number;
          var same_number_cells = this.number_to_cells[my_number] || [];
          for (var my_cell of same_number_cells) {
            var cell = this.cells[my_cell.x][my_cell.y];
            cell.letter = this.selected_cell.letter;
            cell.checked = this.selected_cell.checked;
          }
        }
      }

      // Detects user inputs to hidden input element
      hiddenInputChanged(rebus_string) {
        var mychar = this.hidden_input.val().slice(0, 1).toUpperCase(),
          next_cell;
        if (this.selected_word && this.selected_cell) {
          if (mychar) {
            this.selected_cell.letter = mychar;
          } else if (rebus_string) {
            this.selected_cell.letter = rebus_string.toUpperCase();
          }
          this.selected_cell.checked = false;

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
          this.renderCells();
          this.checkIfSolved();
        }
        this.hidden_input.val('');
      }

      checkIfSolved(do_reveal=true) {
        var wasSolved = this.isSolved;
        var i, j, cell;
        for (i in this.cells) {
          for (j in this.cells[i]) {
            cell = this.cells[i][j];
            // if found cell without letter or with incorrect letter - return
            if (
              !cell.empty &&
              (!cell.letter || !isCorrect(cell.letter, cell.solution))
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
          timerMessage = `<br /><br />You solved the puzzle in ${allMin} ${display_seconds} ${secDisplay}.`;

          // stop the timer
          clearTimeout(xw_timer);
          this.timer_button.removeClass('running');
          this.timer_running = false;
        }
        // reveal all (in case there were rebuses)
        if (do_reveal) {
          this.check_reveal('puzzle', 'reveal');
        }
        // show completion message if newly solved
        if (!wasSolved) {
          var solvedMessage = escape(this.msg_solved).trim().replaceAll('\n', '<br />');
          solvedMessage += timerMessage;

          this.createModalBox('🎉🎉🎉', solvedMessage);
          if (this.config.confetti_enabled) {
            confetti.start();
            setTimeout(function() {
                confetti.stop()
            }, 3000);
          }
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
              word = this.active_clues.getMatchingWord(cell.x, cell.y);
              if (word && word.id !== this.selected_word.id) {
                word_cell = word.getFirstEmptyCell() || word.getFirstCell();
                this.setActiveWord(word);
                this.setActiveCell(word_cell);
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

      moveToNextWord(to_previous, skip_filled_words=false) {
        if (!this.selected_word) {
          return;
        }
        var next_word = null;
        var this_word = this.selected_word;
        //if (to_previous) {
        while (next_word !== this.selected_word) {
          next_word = (to_previous ? this.active_clues.getPreviousWord(this_word) : this.active_clues.getNextWord(this_word));
          if (!next_word) {
            this.changeActiveClues();
            next_word = (to_previous ? this.active_clues.getLastWord() : this.active_clues.getFirstWord());
          }
          if (!skip_filled_words || !next_word.isFilled()) {
            break;
          }
          this_word = next_word;
        }

        var cell;
        if (next_word) {
          cell = next_word.getFirstEmptyCell() || next_word.getFirstCell();
          this.setActiveWord(next_word);
          this.setActiveCell(cell);
          this.renderCells();
        }
      }

      moveToNextWord_OLD(to_previous) {
        if (this.selected_word) {
          var next_word = to_previous
              ? this.active_clues.getPreviousWord(this.selected_word)
              : this.active_clues.getNextWord(this.selected_word),
            cell;
          if (next_word) {
            cell = next_word.getFirstEmptyCell() || next_word.getFirstCell();
            this.setActiveWord(next_word);
            this.setActiveCell(cell);
            this.renderCells();
          }
        }
      }

      moveToFirstCell(to_last) {
        if (this.selected_word) {
          var cell = to_last
            ? this.selected_word.getLastCell()
            : this.selected_word.getFirstCell();
          if (cell) {
            this.setActiveCell(cell);
            this.renderCells();
          }
        }
      }

      // callback for arrow keys - moves selection by one cell
      // can change direction
      moveSelectionBy(delta_x, delta_y, jumping_over_black) {
        var x, y, new_cell;
        if (this.selected_cell) {
          x = this.selected_cell.x + delta_x;
          y = this.selected_cell.y + delta_y;
          new_cell = this.getCell(x, y);

          if (!new_cell) {
            /* If we can't find a new cell, we do nothing. */
            //this.changeActiveClues();
            return;
          }

          // try to jump over empty cell
          if (new_cell.empty) {
            if (delta_x < 0) {
              delta_x--;
            } else if (delta_x > 0) {
              delta_x++;
            } else if (delta_y < 0) {
              delta_y--;
            } else if (delta_y > 0) {
              delta_y++;
            }
            this.moveSelectionBy(delta_x, delta_y, true);
            return;
          }

          // If the new cell is not in the current word
          if (!this.selected_word.hasCell(x, y)) {
            // If the selected cell and the new cell are in the same word, we switch directions
            // We make sure that there is such a word as well (i.e. both are not null)
            var selectedCellInactiveWord = this.inactive_clues.getMatchingWord(
              this.selected_cell.x,
              this.selected_cell.y,
              true
            );
            var newCellInactiveWord = this.inactive_clues.getMatchingWord(
              new_cell.x,
              new_cell.y,
              true
            );
            if (selectedCellInactiveWord) {
              if (
                selectedCellInactiveWord.hasCell(new_cell.x, new_cell.y) &&
                newCellInactiveWord !== null
              ) {
                this.changeActiveClues();
                /*
                 * when do we keep the current cell selected? in two cases:
                 * (a) this.config.arrow_direction === 'arrow_stay'
                 * (b) arrow_direction is 'arrow_move_filled' and the current cell is empty
                 */
                if (this.config.arrow_direction === 'arrow_stay') {
                  new_cell = this.selected_cell;
                } else if (
                  !this.selected_cell.letter &&
                  this.config.arrow_direction === 'arrow_move_filled'
                ) {
                  new_cell = this.selected_cell;
                }
              }
            }
            // If the new cell does not have a word in the currently active direction,
            // we change the direction
            var newCellActiveWord = this.active_clues.getMatchingWord(
              new_cell.x,
              new_cell.y,
              true
            );
            // we also check if the new cell has a word in the other direction
            var newCellInactiveWord = this.inactive_clues.getMatchingWord(
              new_cell.x,
              new_cell.y,
              true
            );
            if (!newCellActiveWord && newCellInactiveWord) {
              this.changeActiveClues();
            }
            // In any case we change the active word
            this.setActiveWord(
              this.active_clues.getMatchingWord(new_cell.x, new_cell.y)
            );
          }
          this.setActiveCell(new_cell);
          this.renderCells();
        }
      }

      windowResized() {
        setBreakpointClasses(this.root);
        resizeText(this.root, this.top_text);
        this.renderCells();
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
        if (this.fakeclues) {
          return;
        }
        var target = $(e.currentTarget),
          word = this.words[target.data('word')],
          cell = word.getFirstEmptyCell() || word.getFirstCell();
        if (cell) {
          this.setActiveWord(word);
          if (this.active_clues.id !== target.data('clues')) {
            this.changeActiveClues();
          }
          this.setActiveCell(cell);
          this.renderCells();
        }
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

          <!-- Miscellaneous -->
          <div class="settings-setting">
            <div class="settings-description">
              Miscellaneous
            </div>
            <div class="settings-option">
              <label class="settings-label">
                <input id="timer_autostart" checked="" type="checkbox" name="timer_autostart" class="settings-changer">
                  Start timer on puzzle open
                </input>
              </label>
            </div>
            <div class="settings-option">
              <label class="settings-label">
                <input id="dark_mode_enabled" checked="" type="checkbox" name="dark_mode_enabled" class="settings-changer">
                  Dark mode
                </input>
              </label>
            </div>
            <div class="settings-option">
              <label class="settings-label">
                <input id="confetti_enabled" checked="checked" type="checkbox" name="confetti_enabled" class="settings-changer">
                  Confetti on solve
                </input>
              </label>
            </div>
          </div>

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
              } else if (event.target.type === 'radio') {
                this.config[event.target.name] = event.target.id;
              }
            }
            this.saveSettings();
          });
      }

      fillJsXw() {
        // update this.jsxw with the currently filled letters
        var cells = this.cells;
        this.jsxw.cells.forEach(function(c) {
          var x = c['x']; var y = c['y'];
          c['letter'] = cells[x+1][y+1]['letter'];
        });
      }

      saveSettings() {
        // we only save settings that are configurable
        var ss1 = { ...this.config };
        var savedSettings = {};
        CONFIGURABLE_SETTINGS.forEach(function(x) {
          savedSettings[x] = ss1[x];
        })
        //console.log(savedSettings);
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
        //this.createModalBox('💾', 'Progress saved.');
      }

      /* Show "load game" menu" */
      loadGameMenu() {
        // Find all the savegames
        var innerHTML = '';
        for (var i = 0; i < localStorage.length; i++){
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

      /* Export a JPZ */
      exportJPZ() {
        // fill jsxw
        this.fillJsXw();
        const jpz_str = this.jsxw.toJPZString();
        // set filename
        var filename = this.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.jpz';
        // Initiate download
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jpz_str));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();
        document.body.removeChild(element);
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
              var i, coordinates, cell;
              for (i = 0; (coordinates = this.selected_word.cells[i]); i++) {
                cell = this.selected_word.getCellByCoordinates(coordinates);
                if (cell) {
                  my_cells.push(cell);
                }
              }
            }
            break;
          case 'puzzle':
            var i, j, cell;
            for (i in this.cells) {
              for (j in this.cells[i]) {
                cell = this.cells[i][j];
                my_cells.push(cell);
              }
            }
            break;
        }

        // check and reveal also other numbers if autofill is on
        if (this.is_autofill) {
          var my_cells_length = my_cells.length;
          for (var i = 0; i < my_cells_length; i++) {
            var my_number = my_cells[i].number;
            if (my_number === null) {
              continue;
            }
            var other_cells = this.number_to_cells[my_number] || [];
            for (var other_cell of other_cells) {
              my_cells.push(this.cells[other_cell.x][other_cell.y]);
            }
          }
        }

        for (var i = 0; i < my_cells.length; i++) {
          if (!my_cells[i].solution || my_cells[i].type === 'block') {
            continue;
          }
          if (reveal_or_check == 'clear' && !my_cells[i].type) {
            my_cells[i].letter = '';
          }
          if (
            !isCorrect(my_cells[i].letter, my_cells[i].solution)
          ) {
            if (reveal_or_check == 'reveal') {
              my_cells[i].letter = my_cells[i].solution;
              my_cells[i].revealed = true;
              my_cells[i].checked = false;
            } else if (reveal_or_check == 'check') {
              my_cells[i].checked = true;
            }
          } else if (reveal_or_check == 'reveal' && isCorrect(my_cells[i].letter, my_cells[i].solution) && my_cells[i].letter !== my_cells[i].solution) {
            // i.e. the solution is "correct" but the letter doesn't match up
            my_cells[i].letter = my_cells[i].solution;
          }
        }
        this.renderCells();

        if (reveal_or_check == 'reveal') {
          this.checkIfSolved(false);
        }
        this.hidden_input.focus();
      }

      printPuzzle(e) {
        // fill JSXW
        this.fillJsXw();
        jscrossword_to_pdf(this.jsxw);
      }

      toggleTimer() {
        var display_seconds, display_minutes;
        var timer_btn = this.timer_button;

        function add() {
          xw_timer_seconds = xw_timer_seconds + 1;
          display_seconds = xw_timer_seconds % 60;
          display_minutes = (xw_timer_seconds - display_seconds) / 60;

          var display =
            (display_minutes
              ? display_minutes > 9
                ? display_minutes
                : '0' + display_minutes
              : '00') +
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
          this.timer_running = false;
          this.hidden_input.focus();
        } else {
          // Start the timer
          this.timer_running = true;
          timer_btn.addClass('running');
          this.hidden_input.focus();
          timer();
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
        for (i = 0; (word_id = this.words_ids[i]); i++) {
          word = this.crossword.words.hasOwnProperty(word_id)
            ? this.crossword.words[word_id]
            : null;
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
              if (word.id == this.crossword.selected_word.id) {
                finding_word = true;
              } else if (finding_word) {
                return word;
              }
            } else {
              if (word.id == this.crossword.selected_word.id) {
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
      markActive(x, y, is_passive, fakeclues=false) {
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
            scrollContainer.stop().animate(
              {
                scrollTop:
                  scrollContainer.scrollTop() - (scrollRect.top - clueRect.top),
              },
              150
            );
          } else if (clueRect.bottom > scrollRect.bottom) {
            scrollContainer.stop().animate(
              {
                scrollTop:
                  scrollContainer.scrollTop() +
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
            // don't bother with references
            //this.refs_raw = data.clue.refs || [];
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
        for (i = 0; (cell_range = this.cell_ranges[i]); i++) {
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
              k = x_from;
              x_from < x_to ? k <= x_to : k >= x_to;
              x_from < x_to ? k++ : k--
            ) {
              this.cells.push(`${k}-${y}`);
            }
          } else if (split_y.length > 1) {
            x = split_x[0];
            y_from = Number(split_y[0]);
            y_to = Number(split_y[1]);
            for (
              k = y_from;
              y_from < y_to ? k <= y_to : k >= y_to;
              y_from < y_to ? k++ : k--
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
        var i,
          cell,
          coordinates,
          start = 0;
        if (x && y) {
          start = Math.max(0, this.cells.indexOf(`${x}-${y}`));
          // if currently last cell - search from beginning
          if (start == this.cells.length - 1) {
            start = 0;
          }
        }
        for (i = start; (coordinates = this.cells[i]); i++) {
          cell = this.getCellByCoordinates(coordinates);
          if (cell && !cell.letter) {
            return cell;
          }
        }

        // if coordinates given and no cell found - search from beginning
        if (start > 0) {
          for (i = 0; i < start; i++) {
            cell = this.getCellByCoordinates(this.cells[i]);

            if (cell && !cell.letter) {
              return cell;
            }
          }
        }

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
        for (i = 0; (coordinates = this.cells[i]); i++) {
          cell = this.getCellByCoordinates(coordinates);
          if (cell) {
            cell.letter = cell.solution;
          }
        }
      }
    }

    if (typeof define === 'function' && define.amd) {
      define('CrosswordNexus', [], function () {
        return CrosswordNexus;
      });
    }

    if (registerGlobal) {
      window.CrosswordNexus = CrosswordNexus;
    }

    return CrosswordNexus;
  }
);
