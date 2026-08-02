/**
 * @file validation.js
 * @description Manages crossword solve checks, answer reveals, clearing cells, and success prompts.
 * 
 * What belongs here:
 * - Orchestrators checking/revealing/clearing cells (like check_reveal).
 * - Puzzle completion validations verifying every letter against the solution (like checkIfSolved).
 * - Modal builders triggering solve messages and completion hooks.
 */

import { isCorrect, escape } from './utils.js';
import { getTimerSeconds, setTimerSeconds } from './timer.js';
import { IS_MOBILE } from './constants.js';



export function check_reveal(to_solve, reveal_or_check, e) {
  // Security: Block all checks and reveals in tournament mode
  if (this.config.tournament_mode && reveal_or_check !== 'clear') {
    console.warn('Checks and Reveals are disabled in tournament mode.');
    return;
  }
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
      this.updateCell(c, {
        letter: '',
        checked: false,
        revealed: false
      });
      if (this.diagramless_mode) {
        this.updateCell(c, {
          type: null, // clear black squares too
          empty: false
        });
      }
    } else if (reveal_or_check === 'reveal') {
      if (this.diagramless_mode) {
        if (c.solution === '#') {
          this.updateCell(c, {
            type: 'block',
            empty: true,
            letter: ''
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
        // ✅ SAFEGUARD for normal puzzles: don't show "#" as a letter
        if (c.solution === '#') {
          this.updateCell(c, {
            letter: '',
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
    } else if (reveal_or_check === 'check') {
      if (this.diagramless_mode) {
        if (c.type === 'block') {
          // If the user placed a black square
          this.updateCell(c, {
            checked: c.solution != '#' // Mark wrong if not supposed to be a black square
          });
        } else if (c.letter) {
          // User typed something — check the letter
          this.updateCell(c, {
            checked: !isCorrect(c.letter, c.solution)
          });
        } else {
          // Empty white square — leave unchecked
          this.updateCell(c, {
            checked: false
          });
        }
      } else {
        // Regular crossword
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

  // After mass-reveal or clear, renumber
  if (reveal_or_check === 'reveal' && this.diagramless_mode) {
    this.renumberGrid();
  }
  if (reveal_or_check === 'clear' && this.diagramless_mode) {
    this.renumberGrid();
  }

  if (reveal_or_check === 'reveal') {
    this.checkIfSolved(false);
  }

  this.saveGame();

  if (!IS_MOBILE) {
    this.hidden_input.focus();
  }
}

export function checkIfSolved(do_reveal = true) {
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

  // In tournament mode, we don't stop the timer or reveal anything automatically
  if (this.config.tournament_mode) {
    this.xw_timer_seconds = getTimerSeconds();
  } else {
    // stop the timer
    var timerMessage = '';
    if (this.timer_running) {
      // prepare message based on time
      var display_seconds = getTimerSeconds() % 60;
      var display_minutes = (getTimerSeconds() - display_seconds) / 60;
      var minDisplay = display_minutes == 1 ? 'minute' : 'minutes';
      var secDisplay = display_seconds == 1 ? 'second' : 'seconds';
      var allMin = display_minutes > 0 ? `${display_minutes} ${minDisplay} ` : '';
      timerMessage = `<br /><br /><center>You finished in ${allMin} ${display_seconds} ${secDisplay}.</center>`;

      // stop the timer
      this.stopTimer();
    }
    this.xw_timer_seconds = getTimerSeconds();
    // reveal all (in case there were rebuses)
    if (do_reveal) {
      this.check_reveal('puzzle', 'reveal');
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
    let solvedMessage = escape(rawMessage).trim().replaceAll('\n', '<br />');
    if (typeof timerMessage !== 'undefined') {
      solvedMessage += timerMessage;
    }
    here.createModalBox('🎉🎉🎉', solvedMessage);
  }

  // show completion message if newly solved
  if (!wasSolved) {
    if (!this.config.tournament_mode) {
      showSuccessMsg(this.completion_message);
    }
    if (typeof this.config.onSolved === 'function') {
      this.config.onSolved(this);
    }
  }
}
