(function() {
  "use strict";
  function getShadeHighlightColor(cellColor, colorWord, colorNone) {
    if (cellColor && cellColor !== colorNone) {
      return Color.averageColors(colorWord, Color.adjustColor(cellColor, -50));
    } else {
      return colorWord;
    }
  }
  function updateCSS(word, selected) {
    const root = document.documentElement;
    const isDark = document.body.classList.contains("dark-mode");
    let wordColor = word;
    let selectedColor = selected;
    if (isDark) {
      wordColor = Color.applyHsvTransform(word, { kv: 0.85 });
      selectedColor = Color.applyHsvTransform(selected, { kv: 0.85 });
    }
    root.style.setProperty("--grid-selected-square-color", selectedColor);
    root.style.setProperty("--grid-selected-word-color", wordColor);
    root.style.setProperty("--grid-hilite-color", Color.applyHsvTransform(wordColor, { dh: -2.64, ks: 0.536, kv: 0.976 }));
    if (isDark) {
      root.style.setProperty("--grid-selected-stroke-color", "rgba(0,0,0,0.2)");
    } else {
      root.style.setProperty("--grid-selected-stroke-color", "var(--grid-stroke-color)");
    }
    const setContrastText = (varName, bgColor) => {
      const brightness = Color.getBrightness(bgColor);
      root.style.setProperty(varName, brightness < 128 ? "#ffffff" : "#000000");
    };
    const buttonBgColor = Color.applyHsvTransform(wordColor, { dh: 0.13, ks: 0.753, kv: 1.004 });
    root.style.setProperty("--button-bg-color", buttonBgColor);
    setContrastText("--button-text-color", buttonBgColor);
    const buttonHoverColor = Color.applyHsvTransform(wordColor, { dh: 0.28, ks: 0.502, kv: 1.004 });
    root.style.setProperty("--button-hover-color", buttonHoverColor);
    setContrastText("--button-hover-text-color", buttonHoverColor);
    const noteBgColor = isDark ? "#333333" : "#EEEEEE";
    const noteHoverBgColor = isDark ? "#444444" : "#999999";
    root.style.setProperty("--button-note-timer-bg-color", noteBgColor);
    root.style.setProperty("--button-note-timer-hover-bg-color", noteHoverBgColor);
    root.style.setProperty("--button-note-timer-border", isDark ? "#555555" : "#888888");
    setContrastText("--button-note-timer-text-color", noteBgColor);
    setContrastText("--button-note-timer-hover-text-color", noteHoverBgColor);
    const runBg = "#90ee90";
    const pauseBg = "#ffc107";
    root.style.setProperty("--timer-running-bgcolor", runBg);
    root.style.setProperty("--timer-paused-bgcolor", pauseBg);
    setContrastText("--timer-running-text-color", runBg);
    setContrastText("--timer-paused-text-color", pauseBg);
    let clueActiveColor = Color.applyHsvTransform(wordColor, { dh: 0.13, ks: 0.753, kv: 1.004 });
    if (isDark) {
      clueActiveColor = Color.averageColors(clueActiveColor, "#808080", 0.75);
    }
    root.style.setProperty("--clue-active-color", clueActiveColor);
    setContrastText("--clue-active-text-color", clueActiveColor);
    const cluePassiveColor = Color.applyHsvTransform(wordColor, { ks: 0, kv: 0.8 });
    root.style.setProperty("--clue-passive-color", cluePassiveColor);
    setContrastText("--clue-passive-text-color", cluePassiveColor);
    const topTextBgColor = Color.applyHsvTransform(wordColor, { dh: -8.62, ks: 0.157, kv: 1.004 });
    root.style.setProperty("--top-text-wrapper-bg-color", topTextBgColor);
    setContrastText("--top-text-wrapper-text-color", topTextBgColor);
    root.style.setProperty("--clue-scrollbar-color-thumb", Color.averageColors(selectedColor, "#333333", 0.5));
  }
  function cellFillColor(cell) {
    var _a;
    if (cell.type === "block") {
      return cell.color || "var(--grid-block-color)";
    } else if (this.selected_cell && cell.x === this.selected_cell.x && cell.y === this.selected_cell.y) {
      return "var(--grid-selected-square-color)";
    } else if (this.selected_word && this.selected_word.hasCell(cell.x, cell.y)) {
      return cell.shade_highlight_color || "var(--grid-selected-word-color)";
    } else if (this.selected_cell && ((_a = this.number_to_cells[this.selected_cell.number || this.selected_cell.top_right_number]) == null ? void 0 : _a.includes(cell))) {
      return cell.shade_highlight_color || "var(--grid-selected-word-color)";
    } else if (cell.color) {
      return cell.color;
    } else {
      return "var(--grid-none-color)";
    }
  }
  function cellFontColor(cell) {
    const fillColor = this.cellFillColor(cell);
    if (cell.image) {
      return "#000000";
    } else if (typeof fillColor === "string" && fillColor.startsWith("var(--grid-selected-square-color)")) {
      return "var(--grid-selected-square-text-color)";
    } else if (typeof fillColor === "string" && fillColor.startsWith("var(--grid-selected-word-color)")) {
      return "var(--grid-selected-word-text-color)";
    } else if (typeof fillColor === "string" && (fillColor.startsWith("var(--grid-none-color)") || fillColor.startsWith("var(--grid-block-color)"))) {
      return fillColor.includes("block") ? "white" : "var(--grid-none-text-color)";
    } else {
      const bgBrightness = Color.getBrightness(fillColor || this.config.color_none);
      const fgBrightness = Color.getBrightness(this.config.font_color_fill);
      if (Math.abs(bgBrightness - fgBrightness) < 125) {
        var thisRGB = Color.hexToRgb(this.config.font_color_fill);
        var invertedRGB = thisRGB.map((x) => 255 - x);
        return Color.rgbToHex(invertedRGB[0], invertedRGB[1], invertedRGB[2]);
      } else {
        return this.config.font_color_fill;
      }
    }
  }
  function isCorrect(entry, solution) {
    if (entry && (!solution || solution.length > 1 || /[^A-Za-z]/.test(solution))) {
      return true;
    } else {
      return entry == solution;
    }
  }
  function escape(string) {
    return string || "";
  }
  const maxClueSizes = [
    [1080, 15],
    [1200, 17],
    [Infinity, 21]
  ];
  function resizeText(rootElement, nodeList) {
    var _a;
    const minSize = 7;
    const rootWidth = rootElement.width();
    const maxSize = ((_a = maxClueSizes.find((bp) => bp[0] > rootWidth)) == null ? void 0 : _a[1]) ?? 24;
    const unit = "px";
    for (var j = 0; j < nodeList.length; j++) {
      const el = nodeList[j];
      const parent = el.parentNode;
      let low = minSize;
      let high = maxSize;
      let best = minSize;
      while (low <= high) {
        const mid = Math.ceil((low + high) / 2);
        el.style.fontSize = `${mid}${unit}`;
        const overflow = el.scrollHeight > parent.clientHeight || el.scrollWidth > parent.clientWidth;
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
  class CluesGroup {
    constructor(crossword, data) {
      this.id = "";
      this.title = "";
      this.clues = [];
      this.clues_container = null;
      this.words_ids = [];
      this.crossword = crossword;
      this.isFake = data.fake || this.crossword.fakeclues || false;
      if (data) {
        if (data.hasOwnProperty("id") && data.hasOwnProperty("title") && data.hasOwnProperty("clues") && data.hasOwnProperty("words_ids")) {
          this.id = data.id;
          this.title = data.title;
          this.clues = data.clues;
          this.words_ids = data.words_ids;
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
        return this.crossword.words[this.words_ids[this.words_ids.length - 1]];
      }
      return null;
    }
    // gets word which has cell with specified coordinates
    getMatchingWord(x, y, change_word = false) {
      var i, word_id, word, words = [];
      for (i = 0; word_id = this.words_ids[i]; i++) {
        word = this.crossword.words.hasOwnProperty(word_id) ? this.crossword.words[word_id] : null;
        if (word && word.cells.indexOf(`${x}-${y}`) >= 0) {
          words.push(word);
        }
      }
      if (words.length == 1) {
        return words[0];
      } else if (words.length == 0) {
        return null;
      } else {
        var finding_word = false;
        for (i = 0; i < words.length; i++) {
          word = words[i];
          if (change_word) {
            if (this.crossword.selected_word && word.id == this.crossword.selected_word.id) {
              finding_word = true;
            } else if (finding_word) {
              return word;
            }
          } else {
            if (this.crossword.selected_word && word.id == this.crossword.selected_word.id) {
              return word;
            }
          }
        }
        return words[0];
      }
    }
    // in clues list, marks clue for word that has cell with given coordinates
    markActive(x, y, is_passive, fakeclues = false) {
      if (this.isFake || this.crossword.diagramless_mode) {
        return;
      }
      var classname = is_passive ? "passive" : "active", word = this.getMatchingWord(x, y);
      this.clues_container.find("div.cw-clue.active").removeClass("active");
      this.clues_container.find("div.cw-clue.passive").removeClass("passive");
      if (word) {
        const clue_el = this.clues_container.find(
          "div.cw-clue.word-" + word.id
        );
        clue_el.addClass(classname);
        const clueRect = clue_el.get(0).getBoundingClientRect();
        const scrollContainer = clue_el.closest(".cw-clues-items");
        const scrollRect = scrollContainer.get(0).getBoundingClientRect();
        if (clueRect.top < scrollRect.top) {
          scrollContainer.stop().animate(
            {
              scrollTop: scrollContainer.scrollTop() - (scrollRect.top - clueRect.top)
            },
            150
          );
        } else if (clueRect.bottom > scrollRect.bottom) {
          scrollContainer.stop().animate(
            {
              scrollTop: scrollContainer.scrollTop() + (clueRect.bottom - scrollRect.bottom)
            },
            150
          );
        }
      }
    }
    // returns word next to given
    getNextWord(word) {
      var next_word = null, index = this.words_ids.indexOf(word.id);
      if (index < this.words_ids.length - 1) {
        next_word = this.crossword.words[this.words_ids[index + 1]];
      }
      return next_word;
    }
    // returns word previous to given
    getPreviousWord(word) {
      var prev_word = null, index = this.words_ids.indexOf(word.id);
      if (index > 0) {
        prev_word = this.crossword.words[this.words_ids[index - 1]];
      }
      return prev_word;
    }
  }
  class Word {
    constructor(crossword, data) {
      this.id = "";
      this.dir = "";
      this.cell_ranges = [];
      this.cells = [];
      this.clue = {};
      this.refs_raw = [];
      this.fakeClueCompleted = false;
      this.crossword = crossword;
      if (data) {
        if (data.hasOwnProperty("id") && data.hasOwnProperty("dir") && data.hasOwnProperty("cell_ranges") && data.hasOwnProperty("clue") && data.hasOwnProperty("refs_raw")) {
          this.id = data.id;
          this.dir = data.dir;
          this.cell_ranges = data.cell_ranges;
          this.clue = data.clue;
          this.parseRanges();
        }
      }
    }
    isCorrect() {
      for (let i = 0; i < this.cells.length; i++) {
        const coords = this.cells[i].split("-");
        const cell = this.crossword.getCell(coords[0], coords[1]);
        if (!cell || !isCorrect(cell.letter, cell.solution)) {
          return false;
        }
      }
      return true;
    }
    isFilled() {
      for (let i = 0; i < this.cells.length; i++) {
        const coords = this.cells[i].split("-");
        const cell = this.crossword.getCell(coords[0], coords[1]);
        if (!cell || !cell.letter) {
          return false;
        }
      }
      return true;
    }
    // Parses cell ranges and stores cells coordinates as array ['x1-y1', 'x1-y2' ...]
    parseRanges() {
      var i, k, cell_range;
      this.cells = [];
      for (i = 0; cell_range = this.cell_ranges[i]; i++) {
        var split_x = cell_range.x.split("-"), split_y = cell_range.y.split("-"), x, y, x_from, x_to, y_from, y_to;
        if (split_x.length > 1) {
          x_from = Number(split_x[0]);
          x_to = Number(split_x[1]);
          y = split_y[0];
          for (k = x_from; x_from < x_to ? k <= x_to : k >= x_to; x_from < x_to ? k++ : k--) {
            this.cells.push(`${k}-${y}`);
          }
        } else if (split_y.length > 1) {
          x = split_x[0];
          y_from = Number(split_y[0]);
          y_to = Number(split_y[1]);
          for (k = y_from; y_from < y_to ? k <= y_to : k >= y_to; y_from < y_to ? k++ : k--) {
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
      if (!this.cells || this.cells.length === 0) return null;
      const total = this.cells.length;
      let startIndex = 0;
      if (x != null && y != null) {
        const idx = this.cells.indexOf(`${x}-${y}`);
        if (idx >= 0) {
          startIndex = (idx + 1) % total;
        }
      }
      for (let i = 0; i < total; i++) {
        const index = (startIndex + i) % total;
        const coordinates = this.cells[index];
        const cell = this.getCellByCoordinates(coordinates);
        if (cell && !cell.letter) {
          return cell;
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
      var index = this.cells.indexOf(`${x}-${y}`), cell = null;
      if (index < this.cells.length - 1) {
        cell = this.getCellByCoordinates(this.cells[index + 1]);
      }
      return cell;
    }
    getPreviousCell(x, y) {
      var index = this.cells.indexOf(`${x}-${y}`), cell = null;
      if (index > 0) {
        cell = this.getCellByCoordinates(this.cells[index - 1]);
      }
      return cell;
    }
    getCellByCoordinates(txt_coordinates) {
      var split, x, y, cell;
      split = txt_coordinates.split("-");
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
      for (i = 0; coordinates = this.cells[i]; i++) {
        cell = this.getCellByCoordinates(coordinates);
        if (cell) {
          this.crossword.updateCell(cell, {
            letter: cell.solution
          });
        }
      }
    }
  }
  const IS_MOBILE = CrosswordShared.isMobileDevice();
  const CONFIGURABLE_SETTINGS = [
    "skip_filled_letters",
    "arrow_direction",
    "space_bar",
    "tab_key",
    "timer_autostart",
    "dark_mode_enabled",
    "gray_completed_clues",
    "confetti_enabled",
    "notepad_name"
  ];
  const STORAGE_KEY = "crossword_nexus_savegame";
  const SETTINGS_STORAGE_KEY = "crossword_nexus_settings";
  const SKIP_UP = "up";
  const SKIP_DOWN = "down";
  const SKIP_LEFT = "left";
  const SKIP_RIGHT = "right";
  const TEMPLATE = `
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
  function keyPressed(e) {
    if (this.settings_open) {
      return;
    }
    if (document.activeElement.classList.contains("cw-input")) {
      return;
    }
    var prevent = [35, 36, 37, 38, 39, 40, 32, 46, 8, 9, 13].indexOf(e.keyCode) >= 0;
    switch (e.keyCode) {
      case 35:
        this.moveToFirstCell(true);
        break;
      case 36:
        this.moveToFirstCell(false);
        break;
      case 37:
        if (this.diagramless_mode) this.setDiagramlessDir("across");
        if (e.shiftKey) {
          this.skipToWord(SKIP_LEFT);
        } else {
          this.moveSelectionBy(-1, 0);
        }
        break;
      case 38:
        if (this.diagramless_mode) this.setDiagramlessDir("down");
        if (e.shiftKey) {
          this.skipToWord(SKIP_UP);
        } else {
          this.moveSelectionBy(0, -1);
        }
        break;
      case 39:
        if (this.diagramless_mode) this.setDiagramlessDir("across");
        if (e.shiftKey) {
          this.skipToWord(SKIP_RIGHT);
        } else {
          this.moveSelectionBy(1, 0);
        }
        break;
      case 40:
        if (this.diagramless_mode) this.setDiagramlessDir("down");
        if (e.shiftKey) {
          this.skipToWord(SKIP_DOWN);
        } else {
          this.moveSelectionBy(0, 1);
        }
        break;
      case 32:
        if (this.diagramless_mode) {
          if (this.selected_cell) {
            this.toggleDiagramlessDir();
          }
          break;
        }
        if (this.selected_cell && this.selected_word) {
          if (this.config.space_bar === "space_switch") {
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
            this.updateCell(this.selected_cell, {
              letter: "",
              checked: false
            });
            this.autofill();
            const next_cell = this.selected_word.getNextCell(
              this.selected_cell.x,
              this.selected_cell.y
            );
            this.setActiveCell(next_cell);
          }
        }
        this.checkIfSolved();
        break;
      case 27:
        if (e.shiftKey) {
          e.preventDefault();
          this.toggleTimer();
        } else {
          if (this.selected_cell && (this.selected_word || this.diagramless_mode)) {
            e.preventDefault();
            e.stopPropagation();
            this.hidden_input.val("");
            this.openRebusModal();
          }
          prevent = true;
        }
        break;
      case 45:
        if (this.selected_cell && (this.selected_word || this.diagramless_mode)) {
          e.preventDefault();
          e.stopPropagation();
          this.openRebusModal();
        }
        prevent = true;
        break;
      case 46:
        if (this.selected_cell && !this.selected_cell.fixed) {
          this.updateCell(this.selected_cell, {
            letter: "",
            checked: false
          });
          this.autofill();
        }
        this.checkIfSolved();
        break;
      case 8:
        this.backspace();
        break;
      case 9:
      // tab
      case 13:
        var skip_filled_words = this.config.tab_key === "tab_skip";
        if (e.shiftKey) {
          this.moveToNextWord(true, skip_filled_words);
        } else {
          this.moveToNextWord(false, skip_filled_words);
        }
        break;
      case 190:
        if (this.selected_cell && (e.ctrlKey || e.metaKey)) {
          const cell = this.selected_cell;
          this.updateCell(cell, {
            shape: cell.shape === "circle" ? null : "circle"
          });
          if (!IS_MOBILE) {
            this.hidden_input.focus();
          }
          prevent = true;
          break;
        }
        if (this.diagramless_mode && this.selected_cell) {
          const cell = this.selected_cell;
          if (cell.type === "block") {
            this.updateCell(cell, {
              type: null,
              empty: false,
              letter: ""
            });
          } else {
            this.updateCell(cell, {
              type: "block",
              empty: true,
              letter: ""
            });
          }
          this.renumberGrid();
          if (!IS_MOBILE) {
            this.hidden_input.focus();
          }
        }
        prevent = true;
        break;
      default: {
        const isPrintableChar = e.key.length === 1 && e.key !== " " && !e.ctrlKey && !e.metaKey && !e.altKey;
        if (this.selected_cell && isPrintableChar && !this.selected_cell.fixed) {
          const ch = /[a-z]/i.test(e.key) ? e.key.toUpperCase() : e.key;
          this.updateCell(this.selected_cell, {
            letter: ch,
            checked: false
          });
          this.autofill();
          this.checkIfSolved();
          if (!IS_MOBILE) {
            this.hidden_input.focus();
          }
          let next_cell = null;
          if (this.diagramless_mode) {
            next_cell = this.nextDiagramlessCell(this.selected_cell, this.diagramless_dir, 1);
          } else if (this.selected_word) {
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
  function backspace() {
    if (this.selected_cell && !this.selected_cell.fixed) {
      this.updateCell(this.selected_cell, {
        letter: "",
        checked: false
      });
      this.autofill();
      if (this.diagramless_mode) {
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
  function mouseClicked(e) {
    const offset = this.svg.offset();
    const mouse_x = e.pageX - offset.left;
    const mouse_y = e.pageY - offset.top;
    const index_x = Math.ceil(mouse_x / this.cell_size);
    const index_y = Math.ceil(mouse_y / this.cell_size);
    const clickedCell = this.getCell(index_x, index_y);
    if (!clickedCell) return;
    if (this.diagramless_mode) {
      if (!clickedCell) return;
      if (this.selected_cell && this.selected_cell.x === index_x && this.selected_cell.y === index_y && clickedCell.type !== "block") {
        this.toggleDiagramlessDir();
        if (!IS_MOBILE) this.hidden_input.focus();
        return;
      }
      this.setSelectedCell(clickedCell);
      this.setSelectedWord(null);
      this.top_text.html("");
      if (!IS_MOBILE) this.hidden_input.focus();
      return;
    }
    const sameCellClicked = this.selected_cell && this.selected_cell.x === index_x && this.selected_cell.y === index_y;
    if (sameCellClicked) {
      this.changeActiveClues();
    }
    let currentGroup = this.clueGroups[this.activeClueGroupIndex];
    let matchingWord = currentGroup.getMatchingWord(index_x, index_y, true);
    if (!matchingWord) {
      for (let i = 0; i < this.clueGroups.length; i++) {
        if (i === this.activeClueGroupIndex) continue;
        const testGroup = this.clueGroups[i];
        const testWord = testGroup.getMatchingWord(index_x, index_y, true);
        if (testWord) {
          matchingWord = testWord;
          this.activeClueGroupIndex = i;
          break;
        }
      }
    }
    if (matchingWord) {
      this.setActiveWord(matchingWord);
    } else {
      const currentGroup2 = this.clueGroups[this.activeClueGroupIndex];
      if (this.fakeclues || currentGroup2 && currentGroup2.isFake) {
        this.top_text.html("");
      }
    }
    this.setActiveCell(clickedCell);
    if (!IS_MOBILE) {
      this.hidden_input.focus();
    }
  }
  function clueClicked(e) {
    const target = $(e.currentTarget);
    const clue = target.data("clue");
    const wordId = target.data("word");
    const word = this.words[wordId];
    const clickedGroupId = target.data("clues");
    const groupIndex = this.clueGroups.findIndex((g) => g.id === clickedGroupId);
    const group = this.clueGroups[groupIndex];
    if (this.fakeclues || group && group.isFake) {
      clue.fakeClueCompleted = !Boolean(clue.fakeClueCompleted);
      this.updateClueAppearance(clue, target);
      return;
    }
    if (!word) return;
    if (this.diagramless_mode) return;
    const cell = word.getFirstEmptyCell() || word.getFirstCell();
    if (!cell) return;
    if (groupIndex !== -1 && groupIndex !== this.activeClueGroupIndex) {
      this.changeActiveClues(groupIndex);
    }
    this.setActiveWord(word);
    this.setActiveCell(cell);
  }
  function saveGame() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveGameImmediate();
      this.saveTimeout = null;
    }, 500);
  }
  function saveGameImmediate() {
    this.fillJsXw();
    const jsxw_str = JSON.stringify(this.jsxw.cells);
    try {
      localStorage.setItem(this.savegame_name, jsxw_str);
      localStorage.setItem(this.savegame_name + "_notes", JSON.stringify(Array.from(this.notes.entries()).map((n) => {
        return {
          key: n[0],
          value: n[1]
        };
      })));
      localStorage.setItem(this.savegame_name + "_timer", (this.xw_timer_seconds || 0).toString());
      localStorage.setItem(this.savegame_name + "_lastmodified", Date.now());
    } catch (e) {
      console.error("[Crossword] localStorage save failed. Attempting cleanup...", e);
      const currentLimit = this.config.save_game_limit || 10;
      this.cleanupSaves(Math.floor(currentLimit / 2));
      try {
        localStorage.setItem(this.savegame_name, jsxw_str);
        localStorage.setItem(this.savegame_name + "_timer", (this.xw_timer_seconds || 0).toString());
        localStorage.setItem(this.savegame_name + "_lastmodified", Date.now());
      } catch (e2) {
        console.error("[Crossword] localStorage save failed even after cleanup.", e2);
      }
    }
  }
  function cleanupSaves(limit = null) {
    if (limit === null) {
      limit = this.config.save_game_limit || 10;
    }
    const saves = [];
    const keysToPurge = [];
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      allKeys.push(localStorage.key(i));
    }
    allKeys.forEach((key) => {
      if (key.startsWith(STORAGE_KEY + "_") && !key.endsWith("_notes") && !key.endsWith("_version") && !key.endsWith("_timer") && !key.endsWith("_lastmodified")) {
        const lastModifiedStr = localStorage.getItem(key + "_lastmodified");
        if (!lastModifiedStr && key !== this.savegame_name) {
          keysToPurge.push(key);
        } else {
          saves.push({
            key,
            lastModified: parseInt(lastModifiedStr || Date.now().toString(), 10)
          });
        }
      }
    });
    keysToPurge.forEach((key) => {
      localStorage.removeItem(key);
      localStorage.removeItem(key + "_notes");
      localStorage.removeItem(key + "_version");
      localStorage.removeItem(key + "_timer");
      localStorage.removeItem(key + "_lastmodified");
    });
    if (saves.length <= limit) return;
    saves.sort((a, b) => b.lastModified - a.lastModified);
    for (let i = limit; i < saves.length; i++) {
      const keyToDelete = saves[i].key;
      localStorage.removeItem(keyToDelete);
      localStorage.removeItem(keyToDelete + "_notes");
      localStorage.removeItem(keyToDelete + "_version");
      localStorage.removeItem(keyToDelete + "_timer");
      localStorage.removeItem(keyToDelete + "_lastmodified");
    }
  }
  function loadGame() {
    var jsxw_cells = JSON.parse(localStorage.getItem(this.savegame_name));
    return jsxw_cells;
  }
  function renderCells() {
    const svg = this.svgContainer;
    svg.innerHTML = "";
    this.svgElements = { cells: {} };
    const fillGroup = this.svgElements.fillGroup = document.createElementNS(this.svgNS, "g");
    const barGroup = this.svgElements.barGroup = document.createElementNS(this.svgNS, "g");
    svg.appendChild(fillGroup);
    svg.appendChild(barGroup);
    for (let xStr in this.cells) {
      this.svgElements.cells[xStr] = {};
      for (let yStr in this.cells[xStr]) {
        this.svgElements.cells[xStr][yStr] = {};
        this.adjustCell(this.cells[xStr][yStr]);
      }
    }
    this.positionGrid();
  }
  function positionGrid() {
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
    this.svgContainer.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    this.svgContainer.setAttribute("width", svgWidth);
    this.svgContainer.setAttribute("height", svgHeight);
    if (this.toptext && this.toptext[0]) {
      this.toptext[0].style.width = svgWidth + "px";
    }
    const SIZE = this.cell_size;
    const padding = 1;
    this.svgContainer.setAttribute(
      "viewBox",
      `-${padding} -${padding} ${this.grid_width * SIZE + padding * 2} ${this.grid_height * SIZE + padding * 2}`
    );
    for (const col of Object.values(this.cells)) {
      for (const cell of Object.values(col)) {
        this.adjustCellPosition(cell);
      }
    }
    this.adjustChevron();
    setTimeout(() => this.syncTopTextWidth(), 0);
  }
  function adjustCell(cell) {
    if (!this.svgElements) {
      return;
    }
    const elements = this.svgElements.cells[cell.x][cell.y];
    const shouldRender = !cell.empty || cell.clue === true || cell.type === "block" || cell.top_right_number;
    const showRect = shouldRender;
    if (showRect && !elements.rect) {
      const rect = elements.rect = document.createElementNS(this.svgNS, "rect");
      rect.setAttribute("data-x", cell.x);
      rect.setAttribute("data-y", cell.y);
      rect.setAttribute("class", "cw-cell");
      this.svgElements.fillGroup.appendChild(rect);
    } else if (!showRect && elements.rect) {
      elements.rect.parentNode.removeChild(elements.rect);
      delete elements.rect;
    }
    this.adjustCellRect(cell);
    const showImage = shouldRender && cell.image;
    if (showImage && !elements.image) {
      const imageLayer = elements.image = document.createElementNS(this.svgNS, "image");
      imageLayer.setAttribute("preserveAspectRatio", "xMidYMid slice");
      imageLayer.setAttribute("class", "cw-cell-image");
      imageLayer.setAttribute("href", cell.image);
      imageLayer.setAttributeNS("http://www.w3.org/1999/xlink", "href", cell.image);
      this.svgElements.fillGroup.appendChild(imageLayer);
    } else if (!showImage && elements.image) {
      elements.image.parentNode.removeChild(elements.image);
      delete elements.image;
    }
    const showCircle = shouldRender && cell.shape === "circle";
    if (showCircle && !elements.circle) {
      const circle = elements.circle = document.createElementNS(this.svgNS, "circle");
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke", "var(--grid-stroke-color)");
      circle.setAttribute("stroke-width", 1.1);
      circle.setAttribute("pointer-events", "none");
      this.svgElements.fillGroup.appendChild(circle);
    } else if (!showCircle && elements.circle) {
      elements.circle.parentNode.removeChild(elements.circle);
      delete elements.circle;
    }
    for (const [side, show] of Object.entries(cell.bar ?? {})) {
      const showBar = shouldRender && show;
      const key = `bar-${side}`;
      if (showBar && !elements[key]) {
        const barLine = elements[key] = document.createElementNS(this.svgNS, "line");
        barLine.setAttribute("stroke-width", this.config.bar_linewidth);
        barLine.setAttribute("stroke-linecap", "square");
        barLine.setAttribute("pointer-events", "none");
        this.svgElements.barGroup.appendChild(barLine);
      } else if (!showBar && elements[key]) {
        elements[key].parentNode.removeChild(elements[key]);
        delete elements[key];
      }
      this.adjustCellBar(cell, side);
    }
    const showLetter = shouldRender && cell.letter;
    if (showLetter && !elements.letter) {
      const text = elements.letter = document.createElementNS(this.svgNS, "text");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-family", "Arial, sans-serif");
      text.classList.add("cw-cell-letter");
      this.svgContainer.appendChild(text);
    } else if (!showLetter && elements.letter) {
      elements.letter.parentNode.removeChild(elements.letter);
      delete elements.letter;
    }
    this.adjustCellLetter(cell);
    const showNumber = shouldRender && cell.number;
    if (showNumber && !elements.number) {
      const number = elements.number = document.createElementNS(this.svgNS, "text");
      number.setAttribute("font-family", "Arial, sans-serif");
      number.classList.add("cw-cell-number");
      this.svgContainer.appendChild(number);
    } else if (!showNumber && elements.number) {
      elements.number.parentNode.removeChild(elements.number);
      delete elements.number;
    }
    this.adjustCellNumber(cell);
    const showTopRightNumber = shouldRender && cell.top_right_number && cell.top_right_number !== cell.letter;
    if (showTopRightNumber && !elements.top_right_number) {
      const label = elements.top_right_number = document.createElementNS(this.svgNS, "text");
      label.setAttribute("text-anchor", "end");
      label.setAttribute("font-family", "Arial, sans-serif");
      label.setAttribute("pointer-events", "none");
      label.classList.add("cw-top-right-label");
      this.svgContainer.appendChild(label);
    } else if (!showTopRightNumber && elements.top_right_number) {
      elements.top_right_number.parentNode.removeChild(elements.top_right_number);
      delete elements.top_right_number;
    }
    this.adjustCellTopRightNumber(cell);
    const showSlash = shouldRender && cell.checked;
    if (showSlash && !elements.slash) {
      const slash = elements.slash = document.createElementNS(this.svgNS, "line");
      slash.setAttribute("stroke-linecap", "round");
      this.svgContainer.appendChild(slash);
    } else if (!showSlash && elements.slash) {
      elements.slash.parentNode.removeChild(elements.slash);
      delete elements.slash;
    }
    this.adjustCellSlash(cell);
    this.adjustCellPosition(cell);
  }
  function adjustCellPosition(cell) {
    if (!this.svgElements) {
      return;
    }
    const elements = this.svgElements.cells[cell.x][cell.y];
    const size = this.cell_size;
    const cellX = (cell.x - 1) * size;
    const cellY = (cell.y - 1) * size;
    const barCoords = {
      top: [[cellX, cellY], [cellX + size, cellY]],
      left: [[cellX, cellY], [cellX, cellY + size]],
      right: [[cellX + size, cellY + size], [cellX + size, cellY]],
      bottom: [[cellX + size, cellY + size], [cellX, cellY + size]]
    };
    if (elements.rect) {
      elements.rect.setAttribute("x", cellX);
      elements.rect.setAttribute("y", cellY);
      elements.rect.setAttribute("width", size);
      elements.rect.setAttribute("height", size);
    }
    if (elements.circle) {
      elements.circle.setAttribute("cx", cellX + size / 2);
      elements.circle.setAttribute("cy", cellY + size / 2);
      const inset = 0.3;
      const radius = size / 2 + inset;
      elements.circle.setAttribute("r", radius);
    }
    if (elements.image) {
      elements.image.setAttribute("x", cellX);
      elements.image.setAttribute("y", cellY);
      elements.image.setAttribute("width", size);
      elements.image.setAttribute("height", size);
    }
    for (const side of Object.keys(cell.bar ?? {})) {
      const key = `bar-${side}`;
      if (elements[key]) {
        const [[x1, y1], [x2, y2]] = barCoords[side];
        elements[key].setAttribute("x1", x1);
        elements[key].setAttribute("y1", y1);
        elements[key].setAttribute("x2", x2);
        elements[key].setAttribute("y2", y2);
      }
    }
    if (elements.letter) {
      const letterLength = cell.letter.length;
      const maxScale = 0.6;
      const minScale = 0.25;
      const scale = Math.max(minScale, maxScale - 0.07 * (letterLength - 1));
      elements.letter.setAttribute("x", cellX + size / 2);
      elements.letter.setAttribute("y", cellY + size * 0.77);
      elements.letter.setAttribute("font-size", `${this.cell_size * scale}px`);
    }
    if (elements.number) {
      elements.number.setAttribute("x", cellX + size * 0.1);
      elements.number.setAttribute("y", cellY + size * 0.3);
      elements.number.setAttribute("font-size", `${size / 3.75}px`);
    }
    if (elements.top_right_number) {
      elements.top_right_number.setAttribute("x", cellX + size * 0.9);
      elements.top_right_number.setAttribute("y", cellY + size * 0.3);
      elements.top_right_number.setAttribute("font-size", `${size / 3.75}px`);
    }
    if (elements.slash) {
      elements.slash.setAttribute("x1", cellX + 2);
      elements.slash.setAttribute("y1", cellY + 2);
      elements.slash.setAttribute("x2", cellX + size - 2);
      elements.slash.setAttribute("y2", cellY + size - 2);
    }
  }
  function adjustCellRect(cell) {
    var _a;
    const rect = this.svgElements.cells[cell.x][cell.y].rect;
    if (!rect) {
      return;
    }
    let rectStroke = cell.type === "block" ? "var(--grid-block-color)" : "var(--grid-stroke-color)";
    if (cell.type !== "block" && (this.selected_cell && cell.x === this.selected_cell.x && cell.y === this.selected_cell.y || this.selected_word && this.selected_word.hasCell(cell.x, cell.y))) {
      rectStroke = "var(--grid-selected-stroke-color)";
    }
    const isSelected = !!(this.selected_cell && cell.x === this.selected_cell.x && cell.y === this.selected_cell.y);
    const isLinked = !!(this.selected_cell && ((_a = this.number_to_cells[this.selected_cell.number || this.selected_cell.top_right_number]) == null ? void 0 : _a.includes(cell)));
    rect.classList.toggle("selected", isSelected);
    rect.classList.toggle("linked", isLinked);
    rect.setAttribute("fill", this.cellFillColor(cell));
    rect.setAttribute("stroke", rectStroke);
  }
  function adjustCellBar(cell, side) {
    const barLine = this.svgElements.cells[cell.x][cell.y][`bar-${side}`];
    if (!barLine) {
      return;
    }
    let barColor = "var(--grid-stroke-color)";
    if (cell.type !== "block" && (this.selected_cell && cell.x === this.selected_cell.x && cell.y === this.selected_cell.y || this.selected_word && this.selected_word.hasCell(cell.x, cell.y))) {
      barColor = "var(--grid-selected-stroke-color)";
    }
    barLine.setAttribute("stroke", barColor);
  }
  function adjustCellLetter(cell) {
    const letter = this.svgElements.cells[cell.x][cell.y].letter;
    if (!letter) {
      return;
    }
    letter.textContent = this.config.kelsey ? (cell.letter || "").toLowerCase() : cell.letter;
    letter.setAttribute("fill", this.cellFontColor(cell));
  }
  function adjustCellNumber(cell) {
    const number = this.svgElements.cells[cell.x][cell.y].number;
    if (!number) {
      return;
    }
    number.textContent = cell.number;
    number.setAttribute("fill", this.cellFontColor(cell));
  }
  function adjustCellTopRightNumber(cell) {
    const label = this.svgElements.cells[cell.x][cell.y].top_right_number;
    if (!label) {
      return;
    }
    label.setAttribute("fill", this.cellFontColor(cell));
    label.textContent = cell.top_right_number;
  }
  function adjustCellSlash(cell) {
    const slash = this.svgElements.cells[cell.x][cell.y].slash;
    if (!slash) {
      return;
    }
    if (this.diagramless_mode) {
      const solutionIsBlock = cell.solution === "#";
      const typeIsBlock = cell.type === "block";
      if (solutionIsBlock !== typeIsBlock) {
        slash.setAttribute("stroke", "red");
        slash.setAttribute("stroke-width", 2.5);
      } else {
        slash.setAttribute("stroke", "var(--grid-none-text-color)");
        slash.setAttribute("stroke-width", 2);
      }
    } else {
      slash.setAttribute("stroke", "var(--grid-none-text-color)");
      slash.setAttribute("stroke-width", 2);
    }
  }
  function adjustChevron() {
    if (!this.svgElements) {
      return;
    }
    const showChevron = this.diagramless_mode && this.selected_cell;
    if (showChevron && !this.svgElements.chevron) {
      const path = this.svgElements.chevron = document.createElementNS(this.svgNS, "path");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "var(--grid-none-text-color)");
      path.setAttribute("stroke-width", 1.3);
      path.setAttribute("pointer-events", "none");
      this.svgContainer.appendChild(path);
    } else if (!showChevron && this.svgElements.chevron) {
      this.svgElements.chevron.parentNode.removeChild(this.svgElements.chevron);
      delete this.svgElements.chevron;
    }
    if (this.svgElements.chevron) {
      const size = this.cell_size;
      const cellX = (this.selected_cell.x - 1) * size;
      const cellY = (this.selected_cell.y - 1) * size;
      const pad = this.cell_size * 0.15;
      const cxAcross = cellX + size - pad;
      const cyAcross = cellY + pad * 1.1;
      const cxDown = cellX + size - pad;
      const cyDown = cellY + size - pad * 1.1;
      const d = this.diagramless_dir === "across" ? `M ${cxAcross - pad * 0.8} ${cyAcross - pad / 2}
        L ${cxAcross} ${cyAcross}
        L ${cxAcross - pad * 0.8} ${cyAcross + pad / 2}` : `M ${cxDown - pad / 2} ${cyDown - pad * 0.8}
        L ${cxDown} ${cyDown}
        L ${cxDown + pad / 2} ${cyDown - pad * 0.8}`;
      this.svgElements.chevron.setAttribute("d", d);
    }
  }
  const ERR_FILE_LOAD = "Error loading file";
  function loadFileFromServer(path, type) {
    const deferred = $.Deferred();
    const xhr = new XMLHttpRequest();
    xhr.open("GET", path);
    xhr.responseType = "arraybuffer";
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
  function make_fake_clues(puzzle, clue_mapping = {}) {
    let across_group = new CluesGroup(this, {
      id: "clues_0",
      title: "Across",
      clues: [],
      words_ids: [],
      fake: true
    });
    let down_group = new CluesGroup(this, {
      id: "clues_1",
      title: "Down",
      clues: [],
      words_ids: [],
      fake: true
    });
    const clueMapping = {};
    var clueGroups;
    if (!this.realwords) {
      const entry_mapping = puzzle.get_entry_mapping();
      const thisGrid = JSCrossword.xwGrid(puzzle.cells);
      const acrossSet = new Set(
        Object.values(thisGrid.acrossEntries()).map((entry) => entry.word)
      );
      Object.keys(entry_mapping).forEach((id) => {
        const entry = entry_mapping[id];
        const clue = {
          word: id,
          number: id,
          text: "--"
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
      clueGroups,
      clue_mapping: clueMapping
    };
  }
  function normalizeClueTitle(rawTitle) {
    if (!rawTitle) return "";
    const title = rawTitle.trim().toUpperCase();
    if (title === "ACROSS") return "Across";
    if (title === "DOWN") return "Down";
    return rawTitle;
  }
  function parsePuzzle(data) {
    var _a;
    var puzzle;
    if (data instanceof JSCrossword) {
      puzzle = data;
    } else {
      puzzle = JSCrossword.fromData(new Uint8Array(data), {
        lockedHandling: "mask"
      });
    }
    puzzle.kind = puzzle.metadata.kind;
    this.jsxw = puzzle;
    window.ipuz = this.jsxw.toIpuzString();
    this.diagramless_mode = false;
    if (puzzle.metadata && puzzle.metadata.crossword_type) {
      if (puzzle.metadata.crossword_type.toLowerCase() === "diagramless") {
        this.diagramless_mode = true;
        console.log("Diagramless detected: from metadata.crossword_type");
      }
    }
    if (this.diagramless_mode) {
      for (let i2 = 0; i2 < puzzle.cells.length; i2++) {
        const cell = puzzle.cells[i2];
        cell["top-bar"] = false;
        cell["bottom-bar"] = false;
        cell["left-bar"] = false;
        cell["right-bar"] = false;
        const sol = (_a = cell.solution) == null ? void 0 : _a.trim().toUpperCase();
        if (!sol || sol === "#" || sol === "." || sol === "-") {
          cell.solution = "#";
        }
        if (cell.solution === "#") {
          cell.type = "block";
          cell.letter = "";
        } else {
          cell.type = null;
          cell.letter = "";
        }
        cell.number = null;
      }
    }
    const simpleHash = (t) => {
      let e = 0;
      for (let r = 0; r < t.length; r++) {
        e = (e << 5) - e + t.charCodeAt(r), e &= e;
      }
      return new Uint32Array([e])[0].toString(36);
    };
    const myHash = simpleHash(JSON.stringify(puzzle));
    this.savegame_name = STORAGE_KEY + "_" + myHash;
    localStorage.setItem(this.savegame_name + "_lastmodified", Date.now());
    this.cleanupSaves();
    const jsxw2_cells = this.loadGame();
    if (jsxw2_cells) {
      console.log("Loading puzzle from localStorage");
      var noteObj = JSON.parse(localStorage.getItem(this.savegame_name + "_notes"));
      if (noteObj && noteObj.length > 0) {
        for (var entry of noteObj) {
          this.notes.set(entry.key, entry.value);
        }
      }
      const savedTimer = localStorage.getItem(this.savegame_name + "_timer");
      if (savedTimer !== null) {
        this.xw_timer_seconds = parseInt(savedTimer, 10) || 0;
        console.log("Restored timer from localStorage:", this.xw_timer_seconds);
      }
      puzzle.cells = jsxw2_cells;
    }
    const loadedFromStorage = Boolean(jsxw2_cells);
    puzzle.cells.forEach((c) => {
      if (!c.top_right_number && c["top_right_number"]) {
        c.top_right_number = c["top_right_number"];
      }
    });
    this.title = puzzle.metadata.title || "";
    this.author = puzzle.metadata.author || "";
    this.copyright = puzzle.metadata.copyright || "";
    this.crossword_type = puzzle.metadata.crossword_type;
    this.fakeclues = puzzle.metadata.fakeclues || false;
    this.realwords = puzzle.metadata.realwords || false;
    this.is_autofill = puzzle.metadata.autofill || false;
    this.notepad = puzzle.metadata.description || "";
    this.grid_width = puzzle.metadata.width;
    this.grid_height = puzzle.metadata.height;
    this.completion_message = puzzle.metadata.completion_message || "Puzzle solved!";
    if (this.title) {
      document.title = this.title + " | Crossword Nexus Solver";
    }
    if (this.crossword_type == "acrostic" || this.crossword_type == "coded") {
      this.is_autofill = true;
    }
    const allGroupsFake = this.fakeclues || (puzzle.clues || []).every((g) => g.fake);
    if (allGroupsFake || this.crossword_type === "diagramless" || this.crossword_type === "coded") {
      $("div.cw-top-text-wrapper").css({
        display: "none"
      });
      $("#cw-puzzle-grid").css("margin-top", "3px");
    }
    if (this.has_reveal === false || puzzle.metadata.has_reveal === false) {
      this.has_reveal = false;
      $(".cw-reveal").css({
        display: "none"
      });
    }
    if (this.has_check === false || puzzle.metadata.has_check === false) {
      this.has_check = false;
      $(".cw-check").css({
        display: "none"
      });
    }
    this.cells = {};
    this.number_to_cells = {};
    for (var i = 0; i < puzzle.cells.length; i++) {
      const rawCell = puzzle.cells[i];
      const c = {
        x: rawCell.x + 1,
        y: rawCell.y + 1,
        solution: rawCell.solution,
        letter: rawCell.letter || "",
        type: rawCell.type || null,
        number: rawCell.number || null,
        bar: {
          top: rawCell["top-bar"] === true,
          bottom: rawCell["bottom-bar"] === true,
          left: rawCell["left-bar"] === true,
          right: rawCell["right-bar"] === true
        },
        color: rawCell["background-color"] || null,
        shape: rawCell["background-shape"] || null,
        image: rawCell["image"] || null,
        top_right_number: rawCell.top_right_number,
        fixed: rawCell.fixed === true
        // Preserve fixed flag from saved data
      };
      c.shade_highlight_color = getShadeHighlightColor(c.color, this.config.color_word, this.config.color_none);
      if (rawCell.clue) {
        c.color = this.config.background_color_clue;
      }
      if (!loadedFromStorage && !c.fixed) {
        if (c.letter && !/[A-Za-z]/.test(c.letter)) {
          c.fixed = true;
        }
        if (/^[A-Z]$/.test(c.letter) && c.top_right_number && c.top_right_number === c.letter) {
          c.fixed = true;
        }
        if (/^[A-Z]$/.test(c.letter) && !c.top_right_number && c.solution === c.letter) {
          c.fixed = true;
        }
      }
      if (this.diagramless_mode) {
        c.type = null;
        c.empty = false;
        c.clue = false;
        c.color = null;
        c.letter = "";
        c.number = null;
      } else {
        c.empty = c.type === "block" || c.type === "void" || c.type === "clue";
        c.clue = c.type === "clue";
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
    if (this.diagramless_mode) {
      this.renumberGrid();
    }
    let clueMapping = {};
    if (this.crossword_type === "coded") {
      var fake_clue_obj = this.make_fake_clues(puzzle);
      this.clueGroups = fake_clue_obj.clueGroups;
      clueMapping = fake_clue_obj.clue_mapping;
      $("div.cw-clues-holder").css({
        display: "none"
      });
      $("div.cw-top-text-wrapper").css({
        display: "none"
      });
      $("div.cw-buttons-holder").css({
        padding: "0 10px"
      });
    } else {
      this.clueGroups = [];
      const clueSets = puzzle.clues || [];
      clueSets.forEach((clueSet, index) => {
        const title = this.normalizeClueTitle(clueSet.title || `Clue Set ${index + 1}`);
        const clues = clueSet.clue || [];
        clues.forEach((clue) => {
          if (clue.word) clueMapping[clue.word] = clue;
        });
        const words_ids = clues.map((c) => c.word);
        const group = new CluesGroup(this, {
          id: `clues_${index}`,
          title,
          clues,
          words_ids,
          fake: Boolean(clueSet.fake)
        });
        this.clueGroups.push(group);
      });
    }
    if (this.config.downsOnly && this.clueGroups.length > 0) {
      this.clueGroups[0].clues.forEach((clue) => {
        clue.text = "---";
      });
    }
    var num_words = puzzle.words.length;
    var num_clues = puzzle.clues.map((x) => x.clue).flat().length;
    if (this.fakeclues && num_words != num_clues) {
      this.displayClueGroups = [...this.clueGroups];
      var fake_clue_obj = this.make_fake_clues(puzzle);
      this.clueGroups = fake_clue_obj.clueGroups;
      clueMapping = fake_clue_obj.clue_mapping;
    }
    const holder = document.querySelector(".cw-clues-holder");
    if (!holder) return;
    holder.innerHTML = "";
    (this.displayClueGroups || this.clueGroups).forEach((group, index) => {
      const div = document.createElement("div");
      div.classList.add("cw-clues");
      if (this.config.downsOnly && index === 0) {
        div.style.display = "none";
      }
      div.dataset.groupId = group.id;
      div.innerHTML = `
      <div class="cw-clues-title">${group.title}</div>
      <div class="cw-clues-items"></div>
    `;
      holder.appendChild(div);
    });
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
    this.completeLoad();
  }
  function createModalBox(title, content, button_text = "Close") {
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
    this.root.find(".cw-modal").html(modalContent);
    var modal = this.root.find(".cw-modal").get(0);
    modal.style.display = "block";
    const this_hidden_input = this.hidden_input;
    var span = this.root.find(".modal-close").get(0);
    span.onclick = function() {
      modal.style.display = "none";
      if (!IS_MOBILE) {
        this_hidden_input.focus();
      }
    };
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
        if (!IS_MOBILE) {
          this_hidden_input.focus();
        }
      }
    };
    var modalButton = document.getElementById("modal-button");
    modalButton.onclick = function() {
      modal.style.display = "none";
      if (!IS_MOBILE) {
        this_hidden_input.focus();
      }
    };
  }
  function openRebusModal() {
    const content = `<input type="text" id="rebus_input" style="font-size: 1.2em; width: 100%; box-sizing: border-box; padding: 5px; margin-top: 10px; text-transform: uppercase;" autocomplete="off" spellcheck="false" maxlength="10">`;
    this.createModalBox("Rebus entry", content, "Enter");
    const inputEl = document.getElementById("rebus_input");
    const modalEl = this.root.find(".cw-modal").get(0);
    const submitRebus = () => {
      modalEl.style.display = "none";
      this.hiddenInputChanged(inputEl.value);
      if (!IS_MOBILE) this.hidden_input.focus();
    };
    document.getElementById("modal-button").onclick = submitRebus;
    inputEl.onkeydown = (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        submitRebus();
      } else if (e.key === "Escape") {
        e.preventDefault();
        modalEl.style.display = "none";
        if (!IS_MOBILE) this.hidden_input.focus();
      }
    };
    setTimeout(() => inputEl.focus(), 10);
  }
  function openSettings() {
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

    ${!this.config.tournament_mode ? `
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
          <input id="confetti_enabled" checked="" type="checkbox" name="confetti_enabled" class="settings-changer">
            Confetti on solve
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
    </div>
    ` : ""}
  </div>
  `;
    this.createModalBox("Settings", settingsHTML);
    var classChangers = document.getElementsByClassName("settings-changer");
    for (var cc of classChangers) {
      if (cc.type === "radio") {
        document.getElementById(cc.id)["checked"] = this.config[cc.name] === cc.id;
      } else {
        document.getElementById(cc.id)["checked"] = this.config[cc.name];
      }
    }
    this.root.find(".settings-wrapper").get(0).addEventListener("click", (event) => {
      if (event.target.className === "settings-changer") {
        if (event.target.type === "checkbox") {
          this.config[event.target.name] = event.target.checked;
          if (event.target.name == "dark_mode_enabled") {
            document.body.classList.toggle("dark-mode", event.target.checked);
            this.updateCSS(this.config.color_word, this.config.color_selected);
            this.renderCells();
          }
          if (event.target.name === "gray_completed_clues") {
            this.styleClues();
            this.syncTopTextWidth();
          }
        } else if (event.target.type === "radio") {
          this.config[event.target.name] = event.target.id;
        }
      }
      this.saveSettings();
    });
  }
  function showInfo() {
    this.createModalBox(
      "Info",
      `
      <p><b>${escape(this.title)}</b></p>
      <p>${escape(this.author)}</p>
      <p><i>${escape(this.copyright)}</i></p>
    `
    );
  }
  function showHelp() {
    this.createModalBox(
      "How to Solve",
      `
      <div class="cw-help-content" style="text-align: left;">
        <h3 style="margin-top: 0;">Mouse Controls</h3>
        <ul style="padding-left: 1.2rem; margin-bottom: 1rem;">
          <li><b>Select a Cell:</b> Click any square on the grid to highlight it.</li>
          <li><b>Toggle Direction:</b> Click the currently selected square again to toggle between Across and Down.</li>
          <li><b>Jump to Clue:</b> Click any clue in the sidebar list to jump directly to its starting square.</li>
        </ul>
        <h3>Keyboard Navigation</h3>
        <ul style="padding-left: 1.2rem; margin-bottom: 1rem;">
          <li><b>Move Around:</b> Use the <b>Arrow Keys</b> to move the cursor cell-by-cell. Use <b>Shift + Arrow Keys</b> to jump to the start of the next/previous word.</li>
          <li><b>Next/Previous Clue:</b> Press <b>Tab</b> to advance to the next clue, or <b>Shift + Tab</b> to go back.</li>
          <li><b>Erase Letters:</b> Press <b>Backspace</b> or <b>Delete</b> to clear the letter in the current cell.</li>
        </ul>
        <h3>Rebus Entry</h3>
        <ul style="padding-left: 1.2rem; margin-bottom: 1rem;">
          <li><b>Enter Multiple Letters:</b> Press the <b>Escape (Esc)</b> or <b>Insert</b> key to pull up the rebus prompt, type your letters, and press <b>Enter</b>.</li>
        </ul>
        <h3>Settings</h3>
        <p style="padding-left: 1.2rem; margin-bottom: 0;">Customize your experience (including keyboard behavior) by clicking the <b>Settings</b> button.</p>
      </div>
    `
    );
  }
  function showNotepad() {
    this.createModalBox(this.config.notepad_name, escape(this.notepad));
  }
  let xw_timer = null;
  let xw_timer_seconds = 0;
  function getTimerSeconds() {
    return xw_timer_seconds;
  }
  function setTimerSeconds(val) {
    xw_timer_seconds = val;
  }
  function resetTimer() {
    xw_timer_seconds = 0;
    if (xw_timer) {
      clearTimeout(xw_timer);
      xw_timer = null;
    }
  }
  function clearTimer() {
    if (xw_timer) {
      clearTimeout(xw_timer);
      xw_timer = null;
    }
  }
  function startTimer() {
    if (!this.timer_running) {
      this.timer_running = true;
      this.timer_button.removeClass("paused");
      this.timer_button.addClass("running");
      const timer_btn = this.timer_button;
      const add = () => {
        xw_timer_seconds = xw_timer_seconds + 1;
        this.xw_timer_seconds = xw_timer_seconds;
        const display_seconds = xw_timer_seconds % 60;
        const display_minutes = (xw_timer_seconds - display_seconds) / 60;
        const display = (display_minutes ? display_minutes > 9 ? display_minutes : "0" + display_minutes : "00") + ":" + (display_seconds > 9 ? display_seconds : "0" + display_seconds);
        timer_btn.html(display);
        if (this.config.tournament_mode && xw_timer_seconds % 5 === 0) {
          this.saveGameImmediate();
        }
        xw_timer = setTimeout(add, 1e3);
      };
      xw_timer = setTimeout(add, 1e3);
    }
  }
  function stopTimer(shouldFocus = false) {
    if (this.timer_running) {
      if (xw_timer) {
        clearTimeout(xw_timer);
        xw_timer = null;
      }
      this.timer_button.removeClass("running");
      this.timer_button.addClass("paused");
      this.timer_running = false;
      this.xw_timer_seconds = xw_timer_seconds;
      if (shouldFocus && !IS_MOBILE) {
        this.hidden_input.focus();
      }
    }
  }
  function toggleTimer() {
    if (!this.config.allow_timer_toggle && this.timer_running) {
      console.log("Timer toggle disabled in tournament mode.");
      this.timer_button.css("cursor", "default");
      return;
    }
    if (this.timer_running) {
      this.stopTimer(true);
    } else {
      this.startTimer();
    }
  }
  function check_reveal(to_solve, reveal_or_check, e) {
    if (this.config.tournament_mode && reveal_or_check !== "clear") {
      console.warn("Checks and Reveals are disabled in tournament mode.");
      return;
    }
    var my_cells = [];
    switch (to_solve) {
      case "letter":
        if (this.selected_cell) {
          my_cells = [this.selected_cell];
        }
        break;
      case "word":
        if (this.selected_word) {
          for (let coord of this.selected_word.cells) {
            const c = this.selected_word.getCellByCoordinates(coord);
            if (c) {
              my_cells.push(c);
            }
          }
        }
        break;
      case "puzzle":
        for (let x in this.cells) {
          for (let y in this.cells[x]) {
            my_cells.push(this.cells[x][y]);
          }
        }
        break;
    }
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
      if (reveal_or_check !== "clear" && !c.solution) {
        continue;
      }
      if (reveal_or_check === "clear") {
        if (c.fixed) continue;
        this.updateCell(c, {
          letter: "",
          checked: false,
          revealed: false
        });
        if (this.diagramless_mode) {
          this.updateCell(c, {
            type: null,
            // clear black squares too
            empty: false
          });
        }
      } else if (reveal_or_check === "reveal") {
        if (this.diagramless_mode) {
          if (c.solution === "#") {
            this.updateCell(c, {
              type: "block",
              empty: true,
              letter: ""
            });
          } else {
            this.updateCell(c, {
              type: null,
              empty: false,
              letter: c.solution
            });
          }
          this.updateCell(c, {
            checked: false,
            revealed: false
          });
        } else {
          if (c.solution === "#") {
            this.updateCell(c, {
              letter: "",
              revealed: false,
              checked: false
            });
          } else {
            this.updateCell(c, {
              letter: c.solution,
              revealed: true,
              checked: false
            });
          }
        }
      } else if (reveal_or_check === "check") {
        if (this.diagramless_mode) {
          if (c.type === "block") {
            this.updateCell(c, {
              checked: c.solution != "#"
              // Mark wrong if not supposed to be a black square
            });
          } else if (c.letter) {
            this.updateCell(c, {
              checked: !isCorrect(c.letter, c.solution)
            });
          } else {
            this.updateCell(c, {
              checked: false
            });
          }
        } else {
          if (c.letter) {
            this.updateCell(c, {
              checked: !isCorrect(c.letter, c.solution)
            });
          } else {
            this.updateCell(c, {
              checked: false
            });
          }
        }
      }
    }
    if (reveal_or_check === "reveal" && this.diagramless_mode) {
      this.renumberGrid();
    }
    if (reveal_or_check === "clear" && this.diagramless_mode) {
      this.renumberGrid();
    }
    if (reveal_or_check === "reveal") {
      this.checkIfSolved(false);
    }
    this.saveGame();
    if (!IS_MOBILE) {
      this.hidden_input.focus();
    }
  }
  function checkIfSolved(do_reveal = true) {
    var wasSolved = this.isSolved;
    var i, j, cell;
    for (i in this.cells) {
      for (j in this.cells[i]) {
        cell = this.cells[i][j];
        if (!cell.empty && (!cell.letter || !isCorrect(cell.letter, cell.solution)) || this.diagramless_mode && cell.type === "block" !== (cell.solution === "#")) {
          this.isSolved = false;
          return;
        }
      }
    }
    this.isSolved = true;
    if (this.config.tournament_mode) {
      this.xw_timer_seconds = getTimerSeconds();
    } else {
      var timerMessage = "";
      if (this.timer_running) {
        var display_seconds = getTimerSeconds() % 60;
        var display_minutes = (getTimerSeconds() - display_seconds) / 60;
        var minDisplay = display_minutes == 1 ? "minute" : "minutes";
        var secDisplay = display_seconds == 1 ? "second" : "seconds";
        var allMin = display_minutes > 0 ? `${display_minutes} ${minDisplay} ` : "";
        timerMessage = `<br /><br /><center>You finished in ${allMin} ${display_seconds} ${secDisplay}.</center>`;
        this.stopTimer();
      }
      this.xw_timer_seconds = getTimerSeconds();
      if (do_reveal) {
        this.check_reveal("puzzle", "reveal");
      }
      if (this.config.confetti_enabled) {
        confetti({
          particleCount: 280,
          spread: 190,
          origin: {
            y: 0.4
          }
        });
      }
    }
    const here = this;
    function showSuccessMsg(rawMessage) {
      if (here.config.tournament_mode) return;
      let solvedMessage = escape(rawMessage).trim().replaceAll("\n", "<br />");
      if (typeof timerMessage !== "undefined") {
        solvedMessage += timerMessage;
      }
      here.createModalBox("🎉🎉🎉", solvedMessage);
    }
    if (!wasSolved) {
      if (!this.config.tournament_mode) {
        showSuccessMsg(this.completion_message);
      }
      if (typeof this.config.onSolved === "function") {
        this.config.onSolved(this);
      }
    }
  }
  function changeActiveClues(targetIndex = null) {
    var _a;
    const groups = this.clueGroups || [];
    const n = groups.length;
    if (n <= 1) return;
    let curIndex = this.activeClueGroupIndex ?? 0;
    let newIndex = curIndex;
    if (targetIndex !== null && targetIndex >= 0 && targetIndex < n) {
      newIndex = targetIndex;
    } else {
      for (let i = 1; i <= n; i++) {
        const idx = (curIndex + i) % n;
        if (!this.selected_cell) {
          newIndex = idx;
          break;
        }
        const g = groups[idx];
        if (g == null ? void 0 : g.getMatchingWord(this.selected_cell.x, this.selected_cell.y, true)) {
          newIndex = idx;
          break;
        }
        if (i === n) newIndex = (curIndex + 1) % n;
      }
    }
    this.activeClueGroupIndex = newIndex;
    const activeGroup = groups[newIndex];
    if (this.selected_cell && activeGroup) {
      const {
        x,
        y
      } = this.selected_cell;
      const word = activeGroup.getMatchingWord(x, y, true);
      if (word) this.setActiveWord(word);
    }
    (_a = this.refreshSidebarHighlighting) == null ? void 0 : _a.call(this);
  }
  function getCell(x, y) {
    return this.cells[x] ? this.cells[x][y] : null;
  }
  function setActiveWord(word) {
    if (word) {
      this.setSelectedWord(word);
      const group = this.clueGroups[this.activeClueGroupIndex];
      if (this.fakeclues || group && group.isFake) {
        this.top_text.html("");
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
  function setActiveCell(cell) {
    if (!cell || cell.empty) return;
    this.setSelectedCell(cell);
    const groups = this.clueGroups || [];
    groups.forEach((group) => {
      const isInactive = group !== this.clueGroups[this.activeClueGroupIndex];
      if (typeof group.markActive === "function") {
        group.markActive(cell.x, cell.y, isInactive, this.fakeclues);
      }
    });
    const offset = this.svg.offset();
    const input_top = offset.top + (cell.y - 1) * this.cell_size;
    const input_left = offset.left + (cell.x - 1) * this.cell_size;
    this.hidden_input.css({
      left: input_left,
      top: input_top
    });
    if (!IS_MOBILE) {
      this.hidden_input.focus();
    }
  }
  function skipToWord(direction) {
    if (this.selected_cell && this.selected_word) {
      var i, cell, word, word_cell, x = this.selected_cell.x, y = this.selected_cell.y;
      var cellFound = (cell2) => {
        if (cell2 && !cell2.empty) {
          word = this.clueGroups[this.activeClueGroupIndex].getMatchingWord(cell2.x, cell2.y);
          if (word && word.id !== this.selected_word.id) {
            word_cell = word.getFirstEmptyCell() || word.getFirstCell();
            this.setActiveWord(word);
            this.setActiveCell(word_cell);
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
  function moveToNextWord(to_previous, skip_filled_words = false) {
    var _a;
    if (!this.selected_word || !((_a = this.clueGroups) == null ? void 0 : _a.length)) return;
    let next_word = null;
    let this_word = this.selected_word;
    let groupIndex = this.activeClueGroupIndex ?? 0;
    const totalGroups = this.clueGroups.length;
    let safetyCounter = 0;
    const shouldSkipFilledWords = skip_filled_words && this.hasUnfilledWords();
    while (safetyCounter < totalGroups * 2) {
      const currentGroup = this.clueGroups[groupIndex];
      next_word = to_previous ? currentGroup.getPreviousWord(this_word) : currentGroup.getNextWord(this_word);
      if (!next_word) {
        groupIndex = (groupIndex + 1) % totalGroups;
        this.activeClueGroupIndex = groupIndex;
        safetyCounter++;
        const nextGroup = this.clueGroups[groupIndex];
        next_word = to_previous ? nextGroup.getLastWord() : nextGroup.getFirstWord();
      }
      if (!shouldSkipFilledWords || !next_word.isFilled()) break;
      this_word = next_word;
    }
    if (next_word) {
      const cell = next_word.getFirstEmptyCell() || next_word.getFirstCell();
      this.setActiveWord(next_word);
      this.setActiveCell(cell);
    }
  }
  function hasUnfilledWords() {
    return Object.values(this.words || {}).some(
      (word) => word && !word.isFilled()
    );
  }
  function moveToFirstCell(to_last) {
    if (this.selected_word) {
      var cell = to_last ? this.selected_word.getLastCell() : this.selected_word.getFirstCell();
      if (cell) {
        this.setActiveCell(cell);
      }
    }
  }
  function moveSelectionBy(delta_x, delta_y, jumping_over_black) {
    if (this.diagramless_mode && this.selected_cell) {
      const x2 = this.selected_cell.x + delta_x;
      const y2 = this.selected_cell.y + delta_y;
      const new_cell2 = this.getCell(x2, y2);
      if (new_cell2) {
        this.setSelectedCell(new_cell2);
      }
      return;
    }
    if (!this.selected_cell) return;
    let x = this.selected_cell.x + delta_x;
    let y = this.selected_cell.y + delta_y;
    let new_cell = this.getCell(x, y);
    if (!new_cell) return;
    if (new_cell.empty) {
      if (delta_x < 0) delta_x--;
      else if (delta_x > 0) delta_x++;
      else if (delta_y < 0) delta_y--;
      else if (delta_y > 0) delta_y++;
      this.moveSelectionBy(delta_x, delta_y, true);
      return;
    }
    const groups = this.clueGroups || [];
    const n = groups.length;
    if (!n) return;
    let activeGroup = groups[this.activeClueGroupIndex];
    if (!this.selected_word.hasCell(x, y)) {
      let selectedCellAltWord = null;
      let newCellAltWord = null;
      let altGroupIndex = this.activeClueGroupIndex;
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
      if (selectedCellAltWord && newCellAltWord) {
        this.activeClueGroupIndex = altGroupIndex;
        this.changeActiveClues(altGroupIndex);
        activeGroup = groups[altGroupIndex];
        if (this.config.arrow_direction === "arrow_stay" || !this.selected_cell.letter && this.config.arrow_direction === "arrow_move_filled") {
          new_cell = this.selected_cell;
        }
      }
      let newCellActiveWord = activeGroup.getMatchingWord(new_cell.x, new_cell.y, true);
      if (!newCellActiveWord) {
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
      if (newCellActiveWord) {
        this.setActiveWord(newCellActiveWord);
      }
    }
    this.setActiveCell(new_cell);
  }
  function removeGlobalListeners() {
    if (this._boundHandleClickWindow) {
      $(window).off("click", this._boundHandleClickWindow);
    }
    $(window).off("resize", this.windowResized);
    window.removeEventListener("resize", this.updateClueLayout);
  }
  function removeListeners() {
    this.removeGlobalListeners();
    this.root.undelegate();
    this.clues_holder.undelegate("div.cw-clues-items div.cw-clue", "click");
    this.clues_holder.undelegate("div.cw-clues-items span", "click");
    this.svg.off("mousemove click");
    this.reveal_letter.off("click");
    this.reveal_word.off("click");
    this.reveal_puzzle.off("click");
    this.check_letter.off("click");
    this.check_word.off("click");
    this.check_puzzle.off("click");
    this.print_btn.off("click");
    this.clear_btn.off("click");
    this.load_btn.off("click");
    this.save_btn.off("click");
    this.download_btn.off("click");
    this.timer_button.off("click");
    this.settings_btn.off("click");
    this.tournament_submit_btn.off("click");
    this.info_btn.off("click");
    this.help_btn.off("click");
    this.notepad_btn.off("click");
    this.notepad_icon.off("click");
    this.hidden_input.off("input");
    this.hidden_input.off("keydown");
    $(document).off("keydown");
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    clearTimer();
  }
  function addListeners() {
    this.removeListeners();
    this._boundHandleClickWindow = handleClickWindow.bind(this);
    this._boundHandleClickOpenMenu = handleClickOpenMenu.bind(this);
    $(window).on("click", this._boundHandleClickWindow);
    $(window).on("resize", this.windowResized);
    this.root.delegate(
      ".cw-menu-container > button",
      "click",
      this._boundHandleClickOpenMenu
    );
    this.clues_holder.delegate(
      "div.cw-clues-items div.cw-clue",
      "click",
      (e) => {
        const sel = window.getSelection && window.getSelection();
        if (sel && sel.toString().trim().length > 0) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
        this.clueClicked(e);
      }
    );
    this.svg.on("click", $.proxy(this.mouseClicked, this));
    this.reveal_letter.on(
      "click",
      $.proxy(this.check_reveal, this, "letter", "reveal")
    );
    this.reveal_word.on(
      "click",
      $.proxy(this.check_reveal, this, "word", "reveal")
    );
    this.reveal_puzzle.on(
      "click",
      $.proxy(this.check_reveal, this, "puzzle", "reveal")
    );
    this.check_letter.on(
      "click",
      $.proxy(this.check_reveal, this, "letter", "check")
    );
    this.check_word.on(
      "click",
      $.proxy(this.check_reveal, this, "word", "check")
    );
    this.check_puzzle.on(
      "click",
      $.proxy(this.check_reveal, this, "puzzle", "check")
    );
    this.print_btn.on("click", (e) => this.printPuzzle(e));
    this.clear_btn.on(
      "click",
      $.proxy(this.check_reveal, this, "puzzle", "clear")
    );
    this.save_btn.on("click", $.proxy(this.saveAsIpuz, this));
    if (this.config.tournament_mode) {
      this.print_btn.hide();
      this.clear_btn.hide();
      this.save_btn.hide();
    }
    this.load_btn.on("click", () => {
      this.init();
      this.file_input.val("");
      this.file_input.click();
    });
    this.timer_button.on("click", $.proxy(this.toggleTimer, this));
    this.settings_btn.on("click", $.proxy(this.openSettings, this));
    this.tournament_submit_btn.on("click", () => {
      if (this.config.tournament_mode && this.config.onSubmitted) {
        this.config.onSubmitted(this);
      }
    });
    this.info_btn.on("click", $.proxy(this.showInfo, this));
    this.help_btn.on("click", $.proxy(this.showHelp, this));
    this.root.find(".cw-button-prev-clue").on("click", () => {
      this.moveToNextWord(true, this.config.tab_key === "tab_skip");
      this.hidden_input.focus();
    });
    this.root.find(".cw-button-next-clue").on("click", () => {
      this.moveToNextWord(false, this.config.tab_key === "tab_skip");
      this.hidden_input.focus();
    });
    if (this.notepad) {
      this.notepad_icon.on("click", $.proxy(this.showNotepad, this));
      this.notepad_btn.show();
    } else {
      this.notepad_icon.hide();
    }
    if (this.jsxw.metadata.intro) {
      setTimeout(() => this.showNotepad(), 300);
    }
    this.notepad_btn.on("click", $.proxy(this.showNotepad, this));
    $(document).off("keydown").on("keydown", $.proxy(this.keyPressed, this));
    this.svg.on("click", (e) => {
      if (e.target.tagName === "rect") {
        const x = parseInt(e.target.getAttribute("data-x"));
        const y = parseInt(e.target.getAttribute("data-y"));
        const clickedCell = this.getCell(x, y);
        if (this.diagramless_mode) {
          return;
        }
        if (!clickedCell.empty) {
          const groups = this.clueGroups || [];
          const n = groups.length;
          if (!n) return;
          let newActiveWord = null;
          let newGroupIndex = this.activeClueGroupIndex;
          const currentGroup = groups[this.activeClueGroupIndex];
          newActiveWord = currentGroup.getMatchingWord(x, y, true);
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
  function handleClickWindow(event) {
    this.root.find(".cw-menu").removeClass("open");
  }
  function handleClickOpenMenu(event) {
    const menuContainer = $(event.target).closest(".cw-menu-container");
    const menu = menuContainer.find(".cw-menu");
    const isAlreadyOpen = menu.hasClass("open");
    this.root.find(".cw-menu").removeClass("open");
    if (!isAlreadyOpen) {
      setTimeout(() => {
        menu.addClass("open");
      });
    }
  }
  (function(global, factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
      module.exports = factory(global);
    } else {
      factory(global, true);
    }
  })(
    typeof window !== "undefined" ? window : void 0,
    function(window2, registerGlobal) {
      var default_config = {
        color_selected: "#FF4136",
        color_word: "#FEE300",
        color_none: "#FFFFFF",
        background_color_clue: "#666666",
        font_color_fill: "#000000",
        puzzle_file: null,
        puzzle_object: null,
        // jsxw to load, if available
        puzzles: null,
        skip_filled_letters: true,
        arrow_direction: "arrow_move_filled",
        space_bar: "space_clear",
        timer_autostart: false,
        show_timer_option: true,
        allow_timer_toggle: true,
        has_reveal: true,
        has_check: true,
        tournament_mode: false,
        confetti_enabled: true,
        dark_mode_enabled: false,
        tab_key: "tab_noskip",
        bar_linewidth: 3.2,
        gray_completed_clues: false,
        min_sidebar_clue_width: 220,
        save_game_limit: 10,
        notepad_name: "Notes",
        downsOnly: false,
        kelsey: false
      };
      var TYPE_UNDEFINED = "undefined";
      var ERR_NO_JQUERY = "jQuery not found";
      const FILE_ACCEPT_EXTENSIONS = ".puz,.xml,.jpz,.xpz,.ipuz,.cfp";
      const IS_IPAD_SAFARI_OR_FIREFOX = (function() {
        if (typeof navigator === "undefined") {
          return false;
        }
        const ua = navigator.userAgent || "";
        const platform = navigator.platform || "";
        const isIpad = ua.includes("iPad") || platform === "MacIntel" && navigator.maxTouchPoints && navigator.maxTouchPoints > 1;
        if (!isIpad) {
          return false;
        }
        const isSafari = /\bSafari\b/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
        const isFirefox = /FxiOS|Firefox/i.test(ua);
        return isSafari || isFirefox;
      })();
      var template = TEMPLATE;
      var isAdvancedUpload = (function() {
        var div = document.createElement("div");
        return ("draggable" in div || "ondragstart" in div && "ondrop" in div) && "FormData" in window2 && "FileReader" in window2;
      })();
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
        }
      };
      class CrossWord {
        /**
         * Creates an instance of the CrossWord solver.
         * @param {HTMLElement|string} parent - The DOM element or selector to append the solver to.
         * @param {Object} [user_config] - User customization settings overriding default configuration.
         */
        // =========================================================================
        // 1. CORE SOLVER LIFECYCLE & CONFIG
        // =========================================================================
        constructor(parent, user_config) {
          this.parent = parent;
          this.config = {};
          this.saveTimeout = null;
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
              if (saved_settings && saved_settings.hasOwnProperty(i) && configurable_settings_set.has(i)) {
                this.config[i] = saved_settings[i];
              } else if (user_config && user_config.hasOwnProperty(i)) {
                this.config[i] = user_config[i];
              } else {
                this.config[i] = default_config[i];
              }
            }
          }
          if (user_config) {
            for (i in user_config) {
              if (user_config.hasOwnProperty(i) && !this.config.hasOwnProperty(i)) {
                this.config[i] = user_config[i];
              }
            }
          }
          if (this.config.tournament_mode) {
            this.config.has_reveal = false;
            this.config.has_check = false;
            this.config.timer_autostart = true;
            if (this.config.is_warmup && this.config.puzzle_id) {
              try {
                const completed = JSON.parse(localStorage.getItem("completed_warmups") || "[]");
                if (completed.includes(this.config.puzzle_id)) {
                  this.config.timer_autostart = false;
                }
              } catch (e) {
              }
            }
            this.config.show_timer_option = false;
            this.config.allow_timer_toggle = false;
            this.config.confetti_enabled = false;
          }
          const COLOR_WORD = this.config.color_word;
          const COLOR_SELECTED = this.config.color_selected;
          this.updateCSS = updateCSS;
          this.updateCSS(COLOR_WORD, COLOR_SELECTED);
          if (this.config.dark_mode_enabled) {
            document.body.classList.add("dark-mode");
            this.updateCSS(COLOR_WORD, COLOR_SELECTED);
          }
          this.cell_size = 40;
          this.grid_width = 0;
          this.grid_height = 0;
          this.cells = {};
          this.words = {};
          this.clueGroups = [];
          this.displayClueGroups = null;
          this.activeClueGroupIndex = 0;
          this.selected_word = null;
          this.selected_cell = null;
          this.settings_open = false;
          this.timer_running = false;
          this.diagramless_dir = "across";
          this.has_reveal = true;
          this.windowResized = this.windowResized.bind(this);
          this.updateClueLayout = this.updateClueLayout.bind(this);
          this.init();
        }
        // =========================================================================
        // 2. PUZZLE DATA PARSING & LOADER DELEGATES
        // =========================================================================
        /**
         * Generates alternative clue lists when clues are stored in non-standard mappings.
         * @param {Object} puzzle - The raw puzzle JSON structure.
         * @param {Object} [clue_mapping] - Configured clue mapping properties.
         * @returns {Array} List of processed clue groups.
         */
        make_fake_clues(puzzle, clue_mapping = {}) {
          return make_fake_clues.call(this, puzzle, clue_mapping);
        }
        /**
         * Initializes or resets the solver variables, visual grids, and structures.
         */
        init() {
          var parsePUZZLE_callback = $.proxy(this.parsePuzzle, this);
          var error_callback = $.proxy(this.error, this);
          if (this.root) {
            this.remove();
          }
          this.activeClueGroupIndex = 0;
          this.selected_word = null;
          this.selected_cell = null;
          this.isSolved = false;
          this.diagramless_mode = false;
          this.savegame_name = null;
          this.timer_running = false;
          this.xw_timer_seconds = 0;
          resetTimer();
          this.cells = {};
          this.words = {};
          this.clueGroups = [];
          this.displayClueGroups = null;
          this.has_reveal = this.config.has_reveal;
          this.has_check = this.config.has_check;
          this.is_autofill = false;
          this.completion_message = "Puzzle solved!";
          this.notes = /* @__PURE__ */ new Map();
          this.root = $(template);
          const fileInput = this.root.find("input.cw-open-jpz");
          if (IS_IPAD_SAFARI_OR_FIREFOX) {
            fileInput.removeAttr("accept");
          } else {
            fileInput.attr("accept", FILE_ACCEPT_EXTENSIONS);
          }
          this.top_text = this.root.find("div.cw-top-text");
          this.clues_holder = this.root.find("div.cw-clues-holder");
          this.extra_clues_holder = this.root.find("div.cw-extra-clues-button-holder");
          this.toptext = this.root.find(".cw-top-text-wrapper");
          this.settings_btn = this.root.find(".cw-settings-button");
          this.file_menu = this.root.find(".cw-file-menu");
          this.tournament_submit_btn = this.root.find(".cw-tournament-submit");
          if (this.config.tournament_mode) {
            this.tournament_submit_btn.show();
            this.file_menu.hide();
          }
          this.hidden_input = this.root.find("input.cw-hidden-input");
          this.reveal_letter = this.root.find(".cw-reveal-letter");
          this.reveal_word = this.root.find(".cw-reveal-word");
          this.reveal_puzzle = this.root.find(".cw-reveal-puzzle");
          this.check_letter = this.root.find(".cw-check-letter");
          this.check_word = this.root.find(".cw-check-word");
          this.check_puzzle = this.root.find(".cw-check-puzzle");
          this.info_btn = this.root.find(".cw-file-info");
          this.help_btn = this.root.find(".cw-file-help");
          this.load_btn = this.root.find(".cw-file-load");
          this.load_btn.hide();
          this.print_btn = this.root.find(".cw-file-print");
          this.clear_btn = this.root.find(".cw-file-clear");
          this.save_btn = this.root.find(".cw-file-save");
          this.download_btn = this.root.find(".cw-file-download");
          this.notepad_btn = this.root.find(".cw-file-notepad");
          this.notepad_btn.hide();
          this.timer_button = this.root.find(".cw-button-timer");
          this.xw_timer_seconds = 0;
          function processFiles(files) {
            loadFromFile(files[0]).then(
              function(data) {
                parsePUZZLE_callback(data);
              },
              function(err) {
                error_callback(err);
              }
            );
          }
          if (this.config.puzzle_file && this.config.puzzle_file.hasOwnProperty("url") && this.config.puzzle_file.hasOwnProperty("type")) {
            this.root.addClass("loading");
            var loaded_callback = parsePUZZLE_callback;
            loadFileFromServer(
              this.config.puzzle_file.url,
              this.config.puzzle_file.type
            ).then(loaded_callback, error_callback);
          } else if (this.config.puzzle_object) {
            console.log("[startup] Loading puzzle from lzpuz param");
            const xw = this.config.puzzle_object;
            Promise.resolve(xw).then(parsePUZZLE_callback, error_callback);
          } else {
            this.open_button = this.root.find(".cw-button-open-puzzle");
            this.file_input = this.root.find('input[type="file"]');
            this.load_btn.show();
            this.open_button.on("click", () => {
              this.file_input.val("");
              this.file_input.click();
            });
            this.file_input.on("change", () => {
              var files = this.file_input[0].files.length ? this.file_input[0].files : null;
              if (files) {
                processFiles(files);
              }
            });
            const btn = this.root.find("#installAppBtn");
            CrosswordShared.setupPWAInstallButton(btn);
            if (isAdvancedUpload) {
              const div_open_holder = this.root.find("div.cw-open-holder");
              const div_overflow = this.root.find("div.cw-overflow");
              div_overflow.addClass("has-advanced-upload");
              var droppedFiles = false;
              div_open_holder.on(
                "drag dragstart dragend dragover dragenter dragleave drop",
                function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              ).on("dragover dragenter", function() {
                div_overflow.addClass("is-dragover");
              }).on("dragleave dragend drop", function() {
                div_overflow.removeClass("is-dragover");
              }).on("drop", function(e) {
                droppedFiles = e.originalEvent.dataTransfer.files;
                processFiles(droppedFiles);
              });
            }
          }
          this.number_to_cells = {};
          this.crossword_type = "crossword";
          this.is_autofill = false;
          this.root.appendTo(this.parent);
          this.canvas_holder = this.root.find("div.cw-canvas");
          this.svgNS = "http://www.w3.org/2000/svg";
          this.svgContainer = document.createElementNS(this.svgNS, "svg");
          this.svgContainer.setAttribute("id", "cw-puzzle-grid");
          this.canvas_holder.find("#cw-puzzle-grid").remove();
          this.canvas_holder.append(this.svgContainer);
          this.svg = $("#cw-puzzle-grid");
          setBreakpointClasses(this.root);
          document.getElementById("cw-puzzle-grid");
        }
        /**
         * Triggers a fallback alert dialog for solver error messages.
         * @param {string} message - The error description to show.
         */
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
        // =========================================================================
        // 3. DIAGRAMLESS SOLVE ALGORITHMS
        // =========================================================================
        /**
         * Return the next non-block, in-bounds cell from a start cell in a given direction.
         * @param {Object} fromCell - Starting grid cell model.
         * @param {string} [dir] - Direction ('across' or 'down').
         * @param {number} [step] - Offset stepping factor (+1 or -1).
         * @returns {Object|null}
         */
        nextDiagramlessCell(fromCell, dir = this.diagramless_dir, step = 1) {
          if (!fromCell) return null;
          let {
            x,
            y
          } = fromCell;
          if (dir === "across") {
            for (let nx = x + step; nx >= 1 && nx <= this.grid_width; nx += step) {
              const c = this.getCell(nx, y);
              if (c && c.type !== "block") return c;
            }
          } else {
            for (let ny = y + step; ny >= 1 && ny <= this.grid_height; ny += step) {
              const c = this.getCell(x, ny);
              if (c && c.type !== "block") return c;
            }
          }
          return null;
        }
        /**
         * Sets the active editing direction for diagramless solves.
         * @param {string} dir - The target direction ('across' or 'down').
         */
        setDiagramlessDir(dir) {
          if (dir !== this.diagramless_dir) {
            this.diagramless_dir = dir;
            this.adjustChevron();
          }
        }
        /**
         * Toggles the diagramless editing direction between 'across' and 'down'.
         */
        toggleDiagramlessDir() {
          this.setDiagramlessDir(this.diagramless_dir === "across" ? "down" : "across");
        }
        // =========================================================================
        // 4. UI INITIALIZATION & ORCHESTRATION
        // =========================================================================
        /**
         * Orchestrates post-load UI initialization, linking elements, fallback selections, and layout passes.
         */
        completeLoad() {
          var _a, _b, _c;
          $(".cw-header").html(`
          <span class="cw-title">${escape(this.title)}</span>
          <span class="cw-header-separator">&nbsp;•&nbsp;</span>
          <span class="cw-author">${escape(this.author)}</span>
          ${this.notepad ? `<button class="cw-button cw-button-notepad">
                   <span class="cw-button-icon">📝</span> ${this.config.notepad_name}
                 </button>` : ""}
          <span class="cw-flex-spacer"></span>
          <span class="cw-copyright">${escape(this.copyright)}</span>
        `);
          this.notepad_icon = this.root.find(".cw-button-notepad");
          if (this.diagramless_mode || this.fakeclues) {
            const firstCell = this.getCell(1, 1);
            if (firstCell) {
              this.setSelectedCell(firstCell);
              this.setSelectedWord(null);
              this.top_text.html("");
              const initMessage = this.diagramless_mode ? "[Diagramless Init]" : "[Fakeclues Init]";
              console.log(initMessage, {
                selected_cell: this.selected_cell,
                selected_word: this.selected_word,
                top_text: this.top_text.html()
              });
            }
          }
          (this.displayClueGroups || this.clueGroups || []).forEach((group) => {
            const container = document.querySelector(`.cw-clues[data-group-id="${group.id}"] .cw-clues-items`);
            if (container) {
              const displayGroup = group;
              this.renderClues(displayGroup, container);
            }
          });
          this.addListeners();
          if (this.clueGroups && this.clueGroups.some((g) => g.isFake)) {
            const extraCluesBtn = document.createElement("button");
            extraCluesBtn.className = "cw-button cw-button-extra-clues";
            extraCluesBtn.innerHTML = '<span class="cw-button-icon">➕</span> Show unmatched clues';
            extraCluesBtn.style.margin = "10px auto";
            extraCluesBtn.style.maxWidth = "200px";
            extraCluesBtn.onclick = () => {
              let cluesHtml = '<div class="unmatched-clues-modal-wrapper">';
              const groupsToShow = (this.displayClueGroups || this.clueGroups).filter((g) => g.isFake);
              groupsToShow.forEach((group) => {
                cluesHtml += `<div class="unmatched-clue-group-title">${group.title}</div><div class="unmatched-clues-list">`;
                group.clues.forEach((clue) => {
                  const isCompleted = clue.fakeClueCompleted ? "completed" : "";
                  cluesHtml += `<div class="unmatched-clue-item ${isCompleted}" data-word="${clue.wordId}" data-clues="${group.id}">
                  <span class="unmatched-clue-number">${clue.number}</span>
                  <span class="unmatched-clue-text">${clue.text}</span>
                </div>`;
                });
                cluesHtml += "</div>";
              });
              cluesHtml += "</div>";
              this.createModalBox("Unmatched Clues", cluesHtml);
              $(".unmatched-clues-modal-wrapper").off("click").on("click", ".unmatched-clue-item", (e) => {
                const target = $(e.currentTarget);
                const groupId = target.attr("data-clues");
                const wordId = target.attr("data-word");
                const clueGroup = (this.displayClueGroups || this.clueGroups).find((g) => g.id === groupId);
                if (!clueGroup) return;
                const clue = clueGroup.clues.find((c) => String(c.wordId) === String(wordId));
                if (clue) {
                  clue.fakeClueCompleted = !Boolean(clue.fakeClueCompleted);
                  target.toggleClass("completed", clue.fakeClueCompleted);
                  const mainClue = $(`.cw-clues-holder [data-word="${wordId}"][data-clues="${groupId}"]`);
                  if (mainClue.length) {
                    mainClue.toggleClass("completed", clue.fakeClueCompleted);
                  }
                }
              });
            };
            if (this.extra_clues_holder) {
              this.extra_clues_holder.empty().append(extraCluesBtn);
            }
          }
          this.root.removeClass("loading");
          this.root.addClass("loaded");
          this.waitUntilSVGWidthStabilizes(() => {
            var _a2;
            if (this.selected_word && ((_a2 = this.top_text) == null ? void 0 : _a2.length)) {
              resizeText(this.root, this.top_text);
            }
          });
          this.renderCells();
          this.styleClues();
          if (this.diagramless_mode) {
            const firstCell = this.getCell(1, 1);
            if (firstCell) {
              this.setSelectedCell(firstCell);
              this.setSelectedWord(null);
              this.top_text.html("");
            }
          } else {
            const first_word = (_b = (_a = this.clueGroups[this.activeClueGroupIndex]).getFirstWord) == null ? void 0 : _b.call(_a);
            if (first_word) {
              this.setActiveWord(first_word);
              const firstCell = (_c = first_word.getFirstCell) == null ? void 0 : _c.call(first_word);
              if (firstCell) {
                this.setActiveCell(firstCell);
              }
            }
          }
          if (this.config.timer_autostart) {
            this.toggleTimer();
          }
          window2.removeEventListener("resize", this.updateClueLayout);
          window2.addEventListener("resize", this.updateClueLayout);
          setTimeout(() => {
            this.updateClueLayout();
            this.windowResized();
          }, 100);
        }
        // end completeLoad
        // =========================================================================
        // 5. VIEWPORT LAYOUT & RESIZING
        // =========================================================================
        /**
         * Adjusts clue sidebar flex properties depending on available column width.
         */
        updateClueLayout() {
          const holder = this.clues_holder ? this.clues_holder.get(0) : null;
          if (!holder) return;
          const clues = holder.querySelectorAll(".cw-clues");
          if (!clues.length) return;
          const MIN_AVG_WIDTH = this.config.min_sidebar_clue_width || 220;
          const avgWidth = holder.offsetWidth / clues.length;
          const useColumn = avgWidth < MIN_AVG_WIDTH;
          holder.style.flexDirection = useColumn ? "column" : "row";
          clues.forEach((clue) => {
            clue.style.width = useColumn ? "auto" : "";
          });
        }
        // =========================================================================
        // 6. EVENT LISTENERS & DOM EVENT HOOKS
        // =========================================================================
        /**
         * Tears down DOM structures and removes all associated event listeners.
         */
        remove() {
          this.removeListeners();
          this.root.remove();
        }
        /**
         * Detaches global window resize and click listener hooks.
         */
        removeGlobalListeners() {
          removeGlobalListeners.call(this);
        }
        removeListeners() {
          removeListeners.call(this);
        }
        addListeners() {
          addListeners.call(this);
        }
        // Create a generic modal box with content
        createModalBox(title, content, button_text = "Close") {
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
          const $title = $container.find("div.cw-clues-title").length ? $container.find("div.cw-clues-title") : $container.closest(".cw-clues").find("div.cw-clues-title");
          const $items = $container.find("div.cw-clues-items").length ? $container.find("div.cw-clues-items") : $container;
          const notes = this.notes;
          $items.find("div.cw-clue").remove();
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
            clue_el.data({
              clue,
              word: clue.word,
              number: clue.number,
              clues: clues_group.id
            }).addClass(`cw-clue word-${clue.word} group-${clues_group.id}`);
            const clueNote = notes.get(clue.word);
            if (clueNote !== void 0) {
              clue_el.find(".cw-input").val(clueNote);
              clue_el.find(".cw-edit-container").show();
            }
            $items.append(clue_el);
          }
          if ($title.length) $title.text(escape(clues_group.title));
          clues_group.clues_container = $items;
          const save = () => this.saveGame();
          $items.on("mouseenter", ".cw-clue", function() {
            const $el = $(this);
            if ($el.find(".cw-input").val().trim().length === 0) {
              $el.find(".cw-cluenote-button").show();
            }
          }).on("mouseleave", ".cw-clue", function(event) {
            const $el = $(this);
            const relatedTarget = event.relatedTarget;
            const isInsideNote = $(relatedTarget).closest(".cw-edit-container").length > 0;
            if (!isInsideNote) $el.find(".cw-cluenote-button").hide();
          }).on("click", ".cw-cluenote-button", function(event) {
            event.stopPropagation();
            const $clue = $(this).closest(".cw-clue");
            $clue.find(".cw-edit-container").show().find(".cw-input").focus();
            $(this).hide();
          }).on("click", ".cw-input", function(event) {
            event.stopPropagation();
          }).on("blur", ".cw-input", function() {
            const $input = $(this);
            const $clue = $input.closest(".cw-clue");
            const wordId = $clue.data("word");
            const newText = $input.val().trim();
            setTimeout(() => {
              const newlyFocused = document.activeElement;
              if (newlyFocused == null ? void 0 : newlyFocused.classList.contains("cw-hidden-input")) return;
              if (newText.length > 0) {
                notes.set(wordId, newText);
              } else {
                $clue.find(".cw-edit-container").hide();
                notes.delete(wordId);
              }
              save();
            }, 10);
          }).on("keydown", ".cw-input", function(event) {
            if (event.key === "Enter") $(this).blur();
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
        // =========================================================================
        // 7. GRID CELL STYLING & COLOR CONTRAST (delegates)
        // =========================================================================
        cellFillColor(cell) {
          return cellFillColor.call(this, cell);
        }
        cellFontColor(cell) {
          return cellFontColor.call(this, cell);
        }
        /**
         * Performs recalculation of grid numbers when blocks are dynamically altered (diagramless mode).
         */
        renumberGrid() {
          const width = this.grid_width;
          const height = this.grid_height;
          this.fillJsXw();
          console.log(this.jsxw);
          const grid = this.jsxw.grid();
          const numbering = grid.gridNumbering();
          for (let y = 1; y <= height; y++) {
            for (let x = 1; x <= width; x++) {
              const cell = this.getCell(x, y);
              this.updateCell(cell, {
                number: numbering[y - 1][x - 1] > 0 ? numbering[y - 1][x - 1] : null
              });
            }
          }
        }
        /* END renumbergrid() */
        // =========================================================================
        // 8. USER INTERACTION EVENT HANDLERS (delegates)
        // =========================================================================
        mouseClicked(e) {
          mouseClicked.call(this, e);
        }
        openRebusModal() {
          openRebusModal.call(this);
        }
        keyPressed(e) {
          keyPressed.call(this, e);
        }
        backspace() {
          backspace.call(this);
        }
        // =========================================================================
        // 9. AUTOFILL & INPUT FIELD SYNCHRONIZATION
        // =========================================================================
        /**
         * Replicates inputted letter across other cells bound by identical numbers (if autofill config is enabled).
         */
        autofill() {
          this.saveGame();
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
                letter: rebus_string.toUpperCase()
                // ✅ Use rebus string if available
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
            this.autofill();
            if (this.config.skip_filled_letters) {
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
            this.setActiveCell(next_cell);
            this.checkIfSolved();
          }
          this.hidden_input.val("");
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
        }
        // END moveSelectionBy()
        windowResized() {
          setBreakpointClasses(this.root);
          resizeText(this.root, this.top_text);
          this.positionGrid();
          this.syncTopTextWidth();
        }
        syncTopTextWidth() {
          var _a;
          const svgEl = this.svgContainer;
          const wrapper = (_a = this.toptext) == null ? void 0 : _a.get(0);
          if (!svgEl || !wrapper) return;
          const bbox = svgEl.getBoundingClientRect();
          const containerBox = svgEl.parentNode.getBoundingClientRect();
          const leftOffset = bbox.left - containerBox.left;
          const width = Math.round(bbox.width);
          wrapper.style.position = "absolute";
          wrapper.style.left = `${leftOffset}px`;
          wrapper.style.width = `${width}px`;
          requestAnimationFrame(() => {
            wrapper.getBoundingClientRect();
          });
        }
        waitUntilSVGWidthStabilizes(finalCallback) {
          let lastWidth = null;
          let stableCount = 0;
          let tick = 0;
          const check = () => {
            const svg = this.svgContainer;
            const width = (svg == null ? void 0 : svg.getBoundingClientRect().width) || 0;
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
          clueClicked.call(this, e);
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
          return (text || "").toUpperCase().replace(/[^A-Z]/g, "");
        }
        openSettings() {
          openSettings.call(this);
        }
        // =========================================================================
        // 10. FILE EXPORTS, PRINT & SAVES
        // =========================================================================
        fillJsXw() {
          const cells = this.cells;
          this.jsxw.cells.forEach((c) => {
            const x = c.x;
            const y = c.y;
            const cellData = cells[x + 1][y + 1];
            c.letter = cellData.letter;
            c.top_right_number = cellData.top_right_number;
            c.type = cellData.type;
            if (cellData.fixed === true) {
              c.fixed = true;
            } else {
              delete c.fixed;
            }
          });
        }
        saveSettings() {
          var ss1 = {
            ...this.config
          };
          var savedSettings = {};
          CONFIGURABLE_SETTINGS.forEach(function(x) {
            savedSettings[x] = ss1[x];
          });
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
          this.fillJsXw();
          try {
            let doc = await this.jsxw.toPDF();
            doc.autoPrint();
            const blobUrl = doc.output("bloburl");
            window2.open(blobUrl, "_blank");
          } catch (err) {
            console.error("PDF generation failed:", err);
          }
        }
        saveAsIpuz(e) {
          console.log(e);
          const json = window2.ipuz;
          const blob = new Blob([json], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          let filename1 = this.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
          if (!filename1) {
            filename1 = "puzzle";
          }
          const filename = filename1 + ".ipuz";
          a.download = filename;
          a.click();
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
          this.clues_holder.find(".cw-clue").each((i, el) => {
            const $el = $(el);
            const clue = $el.data("clue");
            this.updateClueAppearance(clue, $el);
          });
        }
        updateClueAppearance(clue, $el) {
          if (!clue) return;
          const clueEl = $el || $(document).find(`.cw-clue.word-${clue.word}[data-number="${clue.number}"]`);
          const textEl = clueEl.hasClass("cw-clue-text") ? clueEl : clueEl.find(".cw-clue-text");
          const groupId = clueEl.data("clues");
          const group = this.clueGroups.find((g) => g.id === groupId);
          if (!this.config.gray_completed_clues && (!group || !group.isFake) && !this.fakeclues) {
            textEl.css({
              "text-decoration": "",
              "color": ""
            });
            return;
          }
          let shouldGray = false;
          if (this.fakeclues || group && group.isFake) {
            shouldGray = Boolean(clue.fakeClueCompleted);
          } else if (clue.word && this.words[clue.word]) {
            shouldGray = this.words[clue.word].isFilled();
          }
          textEl.css({
            "text-decoration": "",
            "color": shouldGray ? "#aaa" : ""
          });
        }
        // =========================================================================
        // 11. GRID SELECTORS & MUTATORS
        // =========================================================================
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
      if (typeof define === "function" && define.amd) {
        define("CrosswordNexus", [], function() {
          return CrosswordNexus;
        });
      }
      if (registerGlobal) {
        window2.CrosswordNexus = CrosswordNexus;
      }
      return CrosswordNexus;
    }
  );
})();
