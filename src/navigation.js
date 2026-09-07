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

export function changeActiveClues(targetIndex = null) {
  const groups = this.clueGroups || [];
  const n = groups.length;
  if (n <= 1) return;

  const curIndex = this.activeClueGroupIndex ?? 0;
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

export function getCell(x, y) {
  return this.cells[x] ? this.cells[x][y] : null;
}

export function setActiveWord(word) {
  if (word) {
    this.setSelectedWord(word);
    const group = this.clueGroups[this.activeClueGroupIndex];
    if (this.fakeclues || (group && group.isFake)) {
      this.top_text.html('');
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

export function setActiveCell(cell) {
  if (!cell || cell.empty) return;

  this.setSelectedCell(cell);

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
}

export function skipToWord(direction) {
  if (this.selected_cell && this.selected_word) {
    let i,
      cell,
      word,
      word_cell,
      x = this.selected_cell.x,
      y = this.selected_cell.y;

    const cellFound = (cell) => {
      if (cell && !cell.empty) {
        word = this.clueGroups[this.activeClueGroupIndex].getMatchingWord(cell.x, cell.y);
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
  if (!this.selected_word || !this.clueGroups?.length) return;

  let next_word = null;
  let this_word = this.selected_word;
  let groupIndex = this.activeClueGroupIndex ?? 0;
  const totalGroups = this.clueGroups.length;
  let safetyCounter = 0; // counts how many times we've wrapped between groups
  const shouldSkipFilledWords =
    skip_filled_words && this.hasUnfilledWords();

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
    if (!shouldSkipFilledWords || !next_word.isFilled()) break;

    // Otherwise, continue searching
    this_word = next_word;
  }

  // Activate new word if found
  if (next_word) {
    const cell = next_word.getFirstEmptyCell() || next_word.getFirstCell();
    this.setActiveWord(next_word);
    this.setActiveCell(cell);
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
}
