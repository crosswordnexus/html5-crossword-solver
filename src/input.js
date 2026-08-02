/**
 * @file input.js
 * @description Manages keyboard event handling and grid navigation inputs.
 * 
 * What belongs here:
 * - Keyboard listeners and hooks (like keyPressed).
 * - Action mapping for specific keys (Arrow keys, Space, Backspace, Tab, Enter, Delete, Escape).
 * - Diagramless grid adjustments triggered by keyboard controls.
 */
import { IS_MOBILE, SKIP_UP, SKIP_DOWN, SKIP_LEFT, SKIP_RIGHT } from './constants.js';

export function keyPressed(e) {
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
      if (this.diagramless_mode) this.setDiagramlessDir('across'); // set BEFORE moving
      if (e.shiftKey) {
        this.skipToWord(SKIP_LEFT);
      } else {
        this.moveSelectionBy(-1, 0);
      }
      break;
    case 38: // up
      if (this.diagramless_mode) this.setDiagramlessDir('down'); // vertical mode (set BEFORE)
      if (e.shiftKey) {
        this.skipToWord(SKIP_UP);
      } else {
        this.moveSelectionBy(0, -1);
      }
      break;
    case 39: // right
      if (this.diagramless_mode) this.setDiagramlessDir('across'); // set BEFORE moving
      if (e.shiftKey) {
        this.skipToWord(SKIP_RIGHT);
      } else {
        this.moveSelectionBy(1, 0);
      }
      break;
    case 40: // down
      if (this.diagramless_mode) this.setDiagramlessDir('down'); // vertical mode (set BEFORE)
      if (e.shiftKey) {
        this.skipToWord(SKIP_DOWN);
      } else {
        this.moveSelectionBy(0, 1);
      }
      break;

    case 32: // space

      if (this.diagramless_mode) {
        // Toggle direction in diagramless on Space
        if (this.selected_cell) {
          this.toggleDiagramlessDir();
        }
        break; // prevent falling into normal space behavior
      }

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
          this.updateCell(this.selected_cell, {
            letter: '',
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

      this.checkIfSolved(); // update solved status
      break;

    case 27: // escape -- pulls up a rebus entry
      if (e.shiftKey) {
        e.preventDefault();
        this.toggleTimer();
      } else {
        if (this.selected_cell && (this.selected_word || this.diagramless_mode)) {
          e.preventDefault();
          e.stopPropagation();
          this.hidden_input.val('');
          this.openRebusModal();
        }
        prevent = true;
      }
      break;
    case 45: // insert -- same as escape
      if (this.selected_cell && (this.selected_word || this.diagramless_mode)) {
        e.preventDefault();
        e.stopPropagation();
        this.openRebusModal();
      }
      prevent = true;
      break;
    case 46: // delete
      if (this.selected_cell && !this.selected_cell.fixed) {
        this.updateCell(this.selected_cell, {
          letter: '',
          checked: false
        });
        this.autofill();
      }
      // Update this.isSolved
      this.checkIfSolved();
      break;
    case 8: // backspace
      this.backspace();
      break;
    case 9: // tab
    case 13: // enter key -- same as tab
      var skip_filled_words = this.config.tab_key === 'tab_skip';
      if (e.shiftKey) {
        this.moveToNextWord(true, skip_filled_words);
      } else {
        this.moveToNextWord(false, skip_filled_words);
      }
      break;
    case 190: // "." key pressed
      if (this.selected_cell && (e.ctrlKey || e.metaKey)) {
        // ctrl + "." toggles circle
        const cell = this.selected_cell;
        this.updateCell(cell, {
          shape: cell.shape === 'circle' ? null : 'circle'
        });
        if (!IS_MOBILE) {
          this.hidden_input.focus();
        }
        prevent = true;
        break;
      }

      if (this.diagramless_mode && this.selected_cell) {
        const cell = this.selected_cell;

        // Toggle block / white
        if (cell.type === 'block') {
          // It is currently a block: make it white again
          this.updateCell(cell, {
            type: null,
            empty: false,
            letter: ''
          });
        } else {
          // It is currently white: make it a block
          this.updateCell(cell, {
            type: 'block',
            empty: true,
            letter: ''
          });
        }

        // Renumber immediately
        this.renumberGrid();

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
          // Move in the current diagramless direction (across or down)
          next_cell = this.nextDiagramlessCell(this.selected_cell, this.diagramless_dir, +1);
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

/**
 * Deletes the letter value of the currently selected cell and moves cursor backwards.
 */
export function backspace() {
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


/**
 * Handle mouse clicks on the crossword grid.
 * Works with any number of clue groups.
 * @param {Event} e - Mouse click event.
 */
export function mouseClicked(e) {
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

/**
 * Handle mouse clicks on the clues sidebar list items.
 * @param {Event} e - Sidebar click event.
 */
export function clueClicked(e) {
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

