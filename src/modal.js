/**
 * @file modal.js
 * @description Manages crossword dialog overlays, user settings modals, and rebus entry inputs.
 * 
 * What belongs here:
 * - Generic modal container constructor (like createModalBox) handling sizing, placement, and keyboard closing.
 * - Rebus text inputs and key event traps (like openRebusModal).
 * - Settings panels rendering configuration forms, updating DOM themes, and saving settings (like openSettings).
 */

import { IS_MOBILE } from './constants.js';
import { escape } from './utils.js';

export function createModalBox(title, content, button_text = 'Close') {
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

export function openRebusModal() {
  const content = `<input type="text" id="rebus_input" style="font-size: 1.2em; width: 100%; box-sizing: border-box; padding: 5px; margin-top: 10px; text-transform: uppercase;" autocomplete="off" spellcheck="false" maxlength="10">`;
  this.createModalBox('Rebus entry', content, 'Enter');
  const inputEl = document.getElementById('rebus_input');
  const modalEl = this.root.find('.cw-modal').get(0);

  const submitRebus = () => {
    modalEl.style.display = 'none';
    this.hiddenInputChanged(inputEl.value);
    if (!IS_MOBILE) this.hidden_input.focus();
  };

  document.getElementById('modal-button').onclick = submitRebus;

  inputEl.onkeydown = (e) => {
    e.stopPropagation(); // Prevent bubbling up to document and triggering grid keystrokes
    if (e.key === 'Enter') {
      e.preventDefault();
      submitRebus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      modalEl.style.display = 'none';
      if (!IS_MOBILE) this.hidden_input.focus();
    }
  };

  setTimeout(() => inputEl.focus(), 10);
}

export function openSettings() {
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
    ` : ''}
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

          // Toggle dark mode via CSS class
          if (event.target.name == 'dark_mode_enabled') {
            document.body.classList.toggle('dark-mode', event.target.checked);
            this.updateCSS(this.config.color_word, this.config.color_selected);
            this.renderCells();
          }

          // If the toggled setting is gray_completed_clues, re-render clues immediately
          if (event.target.name === 'gray_completed_clues') {
            this.styleClues();
            this.syncTopTextWidth();
          }

        } else if (event.target.type === 'radio') {
          this.config[event.target.name] = event.target.id;
        }
      }
      this.saveSettings();
    });
}



export function showInfo() {
  this.createModalBox(
    'Info',
    `
      <p><b>${escape(this.title)}</b></p>
      <p>${escape(this.author)}</p>
      <p><i>${escape(this.copyright)}</i></p>
    `
  );
}

export function showHelp() {
  this.createModalBox(
    'How to Solve',
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

export function showNotepad() {
  this.createModalBox(this.config.notepad_name, escape(this.notepad));
}
