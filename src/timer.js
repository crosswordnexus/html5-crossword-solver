/**
 * @file timer.js
 * @description Manages crossword solve timer state, ticking logic, and formatting.
 * 
 * What belongs here:
 * - Play timer start, pause/stop, toggle controls (like startTimer, stopTimer, toggleTimer).
 * - Debounced/throttled autosaves triggered by timer ticking in tournament mode.
 * - Module-scoped state variables holding the active timer reference and elapsed seconds.
 */

import { IS_MOBILE } from './constants.js';

let xw_timer = null;
let xw_timer_seconds = 0;

export function getTimerSeconds() {
  return xw_timer_seconds;
}

export function setTimerSeconds(val) {
  xw_timer_seconds = val;
}

export function resetTimer() {
  xw_timer_seconds = 0;
  if (xw_timer) {
    clearTimeout(xw_timer);
    xw_timer = null;
  }
}

export function clearTimer() {
  if (xw_timer) {
    clearTimeout(xw_timer);
    xw_timer = null;
  }
}

export function startTimer() {
  if (!this.timer_running) {
    this.timer_running = true;
    this.timer_button.removeClass('paused');
    this.timer_button.addClass('running');

    const timer_btn = this.timer_button;
    const add = () => {
      xw_timer_seconds = xw_timer_seconds + 1;
      this.xw_timer_seconds = xw_timer_seconds; // Sync to instance

      const display_seconds = xw_timer_seconds % 60;
      const display_minutes = (xw_timer_seconds - display_seconds) / 60;

      const display =
        (display_minutes ?
          display_minutes > 9 ?
          display_minutes :
          '0' + display_minutes :
          '00') +
        ':' +
        (display_seconds > 9 ? display_seconds : '0' + display_seconds);

      timer_btn.html(display);

      // In tournament mode, save progress to localStorage every 5 seconds
      if (this.config.tournament_mode && xw_timer_seconds % 5 === 0) {
        this.saveGameImmediate();
      }

      xw_timer = setTimeout(add, 1000);
    };

    xw_timer = setTimeout(add, 1000);
  }
}

export function stopTimer(shouldFocus = false) {
  if (this.timer_running) {
    if (xw_timer) {
      clearTimeout(xw_timer);
      xw_timer = null;
    }
    this.timer_button.removeClass('running');
    this.timer_button.addClass('paused');
    this.timer_running = false;
    // Final sync of the time
    this.xw_timer_seconds = xw_timer_seconds;

    if (shouldFocus && !IS_MOBILE) {
      this.hidden_input.focus();
    }
  }
}

export function toggleTimer() {
  if (!this.config.allow_timer_toggle && this.timer_running) {
    console.log('Timer toggle disabled in tournament mode.');
    this.timer_button.css('cursor', 'default');
    return;
  }

  if (this.timer_running) {
    this.stopTimer(true);
  } else {
    this.startTimer();
  }
}
