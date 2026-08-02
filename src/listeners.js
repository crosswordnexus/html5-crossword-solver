/**
 * @file listeners.js
 * @description Manages crossword event listener attachment, teardown, and menu dropdown triggers.
 * 
 * What belongs here:
 * - High-level event dispatcher registration (like addListeners, removeListeners, removeGlobalListeners).
 * - Dropdown menu selection hooks (like handleClickOpenMenu, handleClickWindow).
 */

import { clearTimer } from './timer.js';
import { IS_MOBILE } from './constants.js';

export function removeGlobalListeners() {
  if (this._boundHandleClickWindow) {
    $(window).off('click', this._boundHandleClickWindow);
  }
  $(window).off('resize', this.windowResized);
  window.removeEventListener('resize', this.updateClueLayout);
}

export function removeListeners() {
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

export function addListeners() {
  this.removeListeners();

  // Dynamically bind handlers locally
  this._boundHandleClickWindow = handleClickWindow.bind(this);
  this._boundHandleClickOpenMenu = handleClickOpenMenu.bind(this);

  $(window).on('click', this._boundHandleClickWindow);
  $(window).on('resize', this.windowResized);

  this.root.delegate(
    '.cw-menu-container > button',
    'click',
    this._boundHandleClickOpenMenu
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

export function handleClickWindow(event) {
  this.root.find('.cw-menu').removeClass('open');
}

export function handleClickOpenMenu(event) {
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
