/**
 * @file navigation.js
 * @description Manages grid navigation, active cell/word tracking, and keyboard directional traversal.
 * 
 * What belongs here:
 * - Active state toggles (like setActiveCell, setActiveWord, changeActiveClues).
 * - Multi-directional word skipping (like skipToWord, moveToNextWord).
 * - Grid selection offsets (like moveSelectionBy, moveToFirstCell).
 */

import { IS_MOBILE, SKIP_UP, SKIP_DOWN, SKIP_LEFT, SKIP_RIGHT } from './constants.js';
import { escape, resizeText } from './utils.js';

/**
 * Cycle to the next word in words_list containing the selected cell.
 * If targetIndex is provided, switches to that clue group instead.
 * @param {number|null} targetIndex - Explicit clue group index to jump to, or null to cycle words at cell.
 */
export function cycleWordsAtCell(targetIndex = null) {
  const groups = this.clueGroups || [];
  const n = groups.length;

  if (targetIndex !== null && targetIndex >= 0 && targetIndex < n) {
    // Explicit jump to a specific clue group (e.g. from clue click in sidebar)
    this.activeClueGroupIndex = targetIndex;
    const activeGroup = groups[targetIndex];
    if (this.selected_cell && activeGroup) {
      const { x, y } = this.selected_cell;
      const word = activeGroup.getMatchingWord(x, y, true);
      if (word) this.setActiveWord(word);
    }
    this.refreshSidebarHighlighting();
    return;
  }

  // Double-click / space switch: always move to the next word in words_list containing this square
  if (this.selected_cell && this.words_list?.length) {
    const { x, y } = this.selected_cell;
    const matchingWords = this.words_list.filter(w => w.hasCell(x, y));

    if (matchingWords.length > 0) {
      let nextWord = matchingWords[0];
      if (this.selected_word) {
        const curIdx = matchingWords.findIndex(w => w.id === this.selected_word.id);
        if (curIdx !== -1) {
          nextWord = matchingWords[(curIdx + 1) % matchingWords.length];
        }
      }
      this.setActiveWord(nextWord);
    }
  }

  this.refreshSidebarHighlighting();
}

/**
 * Backwards-compatible alias for cycleWordsAtCell.
 * @param {number|null} targetIndex
 */
export function changeActiveClues(targetIndex = null) {
  return cycleWordsAtCell.call(this, targetIndex);
}

export function getCell(x, y) {
  return this.cells[x] ? this.cells[x][y] : null;
}

export function setActiveWord(word) {
  if (word) {
    this.setSelectedWord(word);

    // Keep activeClueGroupIndex in sync:
    // 1. Check if word ID is listed in group's words_ids
    let groupIdx = this.clueGroups?.findIndex(g =>
      (g.words_ids || []).includes(word.id)
    );
    // 2. Fallback: match word direction to group title (e.g. unplaced "Down" clue group in BB8)
    if (groupIdx === -1 || groupIdx === undefined) {
      if (word.dir) {
        groupIdx = this.clueGroups?.findIndex(g =>
          g.title?.trim().toLowerCase() === word.dir.trim().toLowerCase()
        );
      }
    }
    if (groupIdx !== -1 && groupIdx !== undefined) {
      this.activeClueGroupIndex = groupIdx;
    }

    // If the entry has no associated clue (e.g. unclued words or variety puzzles), keep top bar blank
    if (!word.clue || (!word.clue.number && !word.clue.text)) {
      this.top_text.html('');
    } else {
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

    this.refreshSidebarHighlighting?.();
  }
}

export function refreshSidebarHighlighting() {
  if (!this.selected_cell) return;
  const { x, y } = this.selected_cell;
  const groups = this.clueGroups || [];

  groups.forEach(group => {
    if (typeof group.markActive === 'function') {
      const matchingWord = group.getMatchingWord?.(x, y);
      // The clue is passive if the group's matching word is NOT the currently selected word
      const isPassive = !matchingWord || !this.selected_word || (matchingWord.id !== this.selected_word.id);
      group.markActive(x, y, isPassive);
    }
  });
}

export function setActiveCell(cell) {
  if (!cell || cell.empty) return;

  this.setSelectedCell(cell);

  // Mark active/passive state for all clue groups
  this.refreshSidebarHighlighting();

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
}

export function skipToWord(direction) {
  if (!this.diagramless_mode && this.selected_cell && this.selected_word) {
    let i,
      cell,
      word,
      word_cell,
      x = this.selected_cell.x,
      y = this.selected_cell.y;

    const targetDir = this.selected_word.dir;

    const cellFound = (cell) => {
      if (cell && !cell.empty) {
        const wordsAtCell = (this.words_list || []).filter(w => w.hasCell(cell.x, cell.y));
        word = targetDir
          ? wordsAtCell.find(w => w.dir === targetDir)
          : wordsAtCell.find(w => w.id !== this.selected_word.id);
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

export function moveToNextWord(to_previous, skip_filled_words = false) {
  if (this.diagramless_mode || !this.words_list?.length) return;

  const wordsList = this.words_list;
  const total = wordsList.length;
  const shouldSkipFilledWords = skip_filled_words && this.hasUnfilledWords();
  const step = to_previous ? -1 : 1;

  // Find the index of the currently selected word in canonical words_list order
  let curIdx = -1;
  if (this.selected_word) {
    curIdx = wordsList.findIndex(w => w.id === this.selected_word.id);
  }
  if (curIdx === -1) {
    curIdx = to_previous ? 0 : total - 1;
  }

  // Iterate forward or backward through words_list in order
  let next_word = null;
  for (let i = 1; i <= total; i++) {
    // Add + total to handle negative indices when traversing backward (Shift+Tab)
    const idx = (curIdx + i * step + total) % total;
    const candidate = wordsList[idx];
    if (!shouldSkipFilledWords || !candidate.isFilled()) {
      next_word = candidate;
      break;
    }
  }

  if (next_word) {
    this.setActiveWord(next_word);
    const cell = next_word.getFirstEmptyCell() || next_word.getFirstCell();
    this.setActiveCell(cell);
  }
}

/**
 * Advances the active cell selection following a character entry or rebus commit.
 * Handles diagramless stepping, word completion jumping, and filled letter skipping.
 */
export function advanceCursor() {
  if (!this.selected_cell) return;

  if (this.diagramless_mode) {
    const next_cell = this.nextDiagramlessCell(this.selected_cell, this.diagramless_dir, +1);
    if (next_cell) {
      this.setActiveCell(next_cell);
    }
    return;
  }

  if (!this.selected_word) return;

  if (this.config.after_completing_word === 'jump_to_next_word' && this.selected_word.isFilled()) {
    const skip_filled_words = this.config.tab_key === 'tab_skip';
    this.moveToNextWord(false, skip_filled_words);
    return;
  }

  let next_cell = null;
  if (this.config.skip_filled_letters && !this.selected_word.isFilled()) {
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

  if (next_cell) {
    this.setActiveCell(next_cell);
  }
}

export function hasUnfilledWords() {
  return Object.values(this.words || {}).some(
    (word) => word && !word.isFilled()
  );
}

export function moveToFirstCell(to_last) {
  if (this.selected_word) {
    const cell = to_last ?
      this.selected_word.getLastCell() :
      this.selected_word.getFirstCell();
    if (cell) {
      this.setActiveCell(cell);
    }
  }
}

export function moveSelectionBy(delta_x, delta_y, jumping_over_black) {
  // Diagramless mode
  if (this.diagramless_mode && this.selected_cell) {
    const x = this.selected_cell.x + delta_x;
    const y = this.selected_cell.y + delta_y;
    const new_cell = this.getCell(x, y);
    if (new_cell) { // skip normal crossword movement logic
      this.setSelectedCell(new_cell);
    }
    return;
  }

  // Don't do anything if there's no selected cell
  if (!this.selected_cell) return;

  // Find the new cell in the specified direction
  const x = this.selected_cell.x + delta_x;
  const y = this.selected_cell.y + delta_y;
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

  // If new cell is outside current word
  if (this.selected_word && !this.selected_word.hasCell(x, y)) {
    // Try to find an alternate word in words_list that includes both current cell and next cell
    const altWord = (this.words_list || []).find(w =>
      w.hasCell(this.selected_cell.x, this.selected_cell.y) && w.hasCell(new_cell.x, new_cell.y)
    );

    if (altWord) {
      this.setActiveWord(altWord);

      // arrow-stay / arrow-move_filled config logic
      if (
        this.config.arrow_direction === 'arrow_stay' ||
        (!this.selected_cell.letter && this.config.arrow_direction === 'arrow_move_filled')
      ) {
        new_cell = this.selected_cell;
      }
    } else {
      // Find a word at new_cell (prefer matching current direction)
      const wordsAtNewCell = (this.words_list || []).filter(w => w.hasCell(new_cell.x, new_cell.y));
      let newWord = wordsAtNewCell.find(w => w.dir === this.selected_word.dir) || wordsAtNewCell[0];
      if (newWord) {
        this.setActiveWord(newWord);
      }
    }
  }

  this.setActiveCell(new_cell);
}
