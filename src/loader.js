/**
 * @file loader.js
 * @description Manages crossword fetching, file parsing, and puzzle model initialization.
 * 
 * What belongs here:
 * - Puzzle file loaders reading data from servers or local uploads (like loadFileFromServer, loadFromFile).
 * - Parser orchestrator (parsePuzzle) transforming raw iPuz/JPZ bytes into grid cells and word objects.
 * - Fake clue generators and title normalization helpers.
 */

import { CluesGroup } from './CluesGroup.js';
import { Word } from './Word.js';
import { STORAGE_KEY } from './constants.js';
import { getShadeHighlightColor } from './colors.js';

const ERR_FILE_LOAD = 'Error loading file';

export function loadFileFromServer(path, type) {
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

export function loadFromFile(file, type, deferred) {
  const reader = new FileReader();
  deferred = deferred || $.Deferred();

  reader.onload = function(event) {
    const data = new Uint8Array(event.target.result);
    deferred.resolve(data);
  };

  reader.readAsArrayBuffer(file);
  return deferred;
}

export function make_fake_clues(puzzle, clue_mapping = {}) {
  let across_group = new CluesGroup(this, {
    id: "clues_0",
    title: 'Across',
    clues: [],
    words_ids: [],
    fake: true,
  });

  let down_group = new CluesGroup(this, {
    id: "clues_1",
    title: 'Down',
    clues: [],
    words_ids: [],
    fake: true,
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

export function normalizeClueTitle(rawTitle) {
  if (!rawTitle) return '';
  const title = rawTitle.trim().toUpperCase();

  if (title === 'ACROSS') return 'Across';
  if (title === 'DOWN') return 'Down';

  return rawTitle; // Preserve original if it's custom
}

export function parsePuzzle(data) {
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

  // Expose ipuz string
  window.ipuz = this.jsxw.toIpuzString();

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
  localStorage.setItem(this.savegame_name + "_lastmodified", Date.now());
  this.cleanupSaves();

  const jsxw2_cells = this.loadGame();
  if (jsxw2_cells) {
    console.log('Loading puzzle from localStorage');
    var noteObj = JSON.parse(localStorage.getItem(this.savegame_name + "_notes"));
    if (noteObj && noteObj.length > 0) {
      for (var entry of noteObj) {
        this.notes.set(entry.key, entry.value);
      }
    }

    // Restore timer
    const savedTimer = localStorage.getItem(this.savegame_name + "_timer");
    if (savedTimer !== null) {
      this.xw_timer_seconds = parseInt(savedTimer, 10) || 0;
      console.log('Restored timer from localStorage:', this.xw_timer_seconds);
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
  this.realwords = puzzle.metadata.realwords || false;
  this.is_autofill = puzzle.metadata.autofill || false;
  this.notepad = puzzle.metadata.description || '';
  this.grid_width = puzzle.metadata.width;
  this.grid_height = puzzle.metadata.height;
  this.completion_message = puzzle.metadata.completion_message || "Puzzle solved!";

  if (this.title) {
    document.title = this.title + ' | Crossword Nexus Solver';
  }
  // Override default autofill setting for certain puzzle types
  if (this.crossword_type == 'acrostic' || this.crossword_type == 'coded') {
    this.is_autofill = true;
  }

  const allGroupsFake = this.fakeclues || (puzzle.clues || []).every(g => g.fake);
  if (allGroupsFake || this.crossword_type === 'diagramless' || this.crossword_type === 'coded') {
    // top-text is meaningless if all groups are fake, or for diagramless/coded puzzles
    $('div.cw-top-text-wrapper').css({
      display: 'none'
    });

    // No need to leave room for the top-text
    $('#cw-puzzle-grid').css('margin-top', '3px');
  }

  // disable check and reveal in certain cases
  if (this.has_reveal === false || puzzle.metadata.has_reveal === false) {
    this.has_reveal = false;
    $('.cw-reveal').css({
      display: 'none'
    });
  }
  if (this.has_check === false || puzzle.metadata.has_check === false) {
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
      image: rawCell['image'] || null,
      top_right_number: rawCell.top_right_number,
      fixed: rawCell.fixed === true // Preserve fixed flag from saved data
    };

    /* set a "shade_highlight" color */
    c.shade_highlight_color = getShadeHighlightColor(c.color, this.config.color_word, this.config.color_none);

    /* set the background color for "clue" cells */
    if (rawCell.clue) {
      c.color = this.config.background_color_clue;
    }

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
        fake: Boolean(clueSet.fake),
      });

      this.clueGroups.push(group);
    });

  }

  if (this.config.downsOnly && this.clueGroups.length > 0) {
    this.clueGroups[0].clues.forEach(clue => {
      clue.text = '---';
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

  (this.displayClueGroups || this.clueGroups).forEach((group, index) => {
    const div = document.createElement('div');
    div.classList.add('cw-clues');
    if (this.config.downsOnly && index === 0) {
      div.style.display = 'none';
    }
    div.dataset.groupId = group.id;

    div.innerHTML = `
      <div class="cw-clues-title">${group.title}</div>
      <div class="cw-clues-items"></div>
    `;

    holder.appendChild(div);
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

  this.completeLoad();
}
