/**
Copyright (c) 2025, Crossword Nexus & Crossweird LLC
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/

var gCrossword;
let isAltKeyboard = false;

$(document).ready(function () {
  let initialWindowHeight = window.innerHeight;
  setCSSViewportHeight();
  // Listen to visualViewport resize events
  window.visualViewport?.addEventListener('resize', () => {
    setCSSViewportHeight();
    detectKeyboardAndResize(); // you already have this function
  });

  // Listen to orientation changes
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (gCrossword?.syncTopTextWidth) {
        gCrossword.syncTopTextWidth();
      }
      setCSSViewportHeight();
    }, 300);
  });

  function isMobileDevice() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    //const screenIsSmall = Math.max(window.innerWidth, window.innerHeight) < 1024;

    const isiPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const isMobileUA = /android|iphone|ipod|ipad|mobile/i.test(ua);

    return (
      isTouchDevice && (isiPad || isMobileUA)
    );
  }

  const isMobile = isMobileDevice();
  const crosswordRoot = document.querySelector('.crossword');

  if (isMobile && crosswordRoot) {
    crosswordRoot.classList.add('mobile');
    document.body.classList.add('mobile-mode');

    // Viewport handlers
    window.visualViewport?.addEventListener('resize', detectKeyboardAndResize);
    window.addEventListener('resize', detectKeyboardAndResize);
    window.visualViewport?.addEventListener('resize', () => {
      setCSSViewportHeight();
      detectKeyboardAndResize();
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        setCSSViewportHeight();
      }, 300);
    });
  }

  function setCSSViewportHeight() {
    if (!window.visualViewport) return;

    const vh = window.visualViewport.height + window.visualViewport.offsetTop;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  function rebuildKeyboard() {
  const wrapper = document.querySelector('.keyboard-wrapper-placeholder');
  const oldKeyboard = wrapper.querySelector('#custom-keyboard');
  if (oldKeyboard) oldKeyboard.remove();

  const newKeyboard = createCustomKeyboard();

  wrapper.appendChild(newKeyboard);
  wrapper.style.height = `${newKeyboard.offsetHeight}px`;

  /* // Reattach Rebus key
  newKeyboard.querySelector('.cw-key-rebus')?.addEventListener('click', () => {
    const rebusEntry = prompt('Rebus entry', '');
    if (rebusEntry) {
      gCrossword.hiddenInputChanged(rebusEntry.toUpperCase());
    }
  });

  newKeyboard.querySelector('.cw-key-left')?.addEventListener('click', () => {
    const skipFilled = gCrossword.config?.tab_key === 'tab_skip';
    gCrossword.moveToNextWord(true, skipFilled); // ← previous word
  });

  newKeyboard.querySelector('.cw-key-right')?.addEventListener('click', () => {
    const skipFilled = gCrossword.config?.tab_key === 'tab_skip';
    gCrossword.moveToNextWord(false, skipFilled); // → next word
  });*/
  }

  function rebuildKeyboardAndPositionDrawer() {
    rebuildKeyboard();
  }

  function detectKeyboardAndResize() {
    setTimeout(() => {
      const currentHeight = window.innerHeight;
      const keyboardOpen = currentHeight < initialWindowHeight - 150;

      document.body.classList.toggle('keyboard-visible', keyboardOpen);
    }, 50);
  }

  // Load puzzle and optional config from URL
  const url = new URL(window.location.href);
  let puzzle = url.searchParams.get("puzzle") || url.searchParams.get("file");
  const b64config = url.searchParams.get("config");
  const params = {};

  if (puzzle) {
    params.puzzle_file = {
      url: puzzle,
      type: puzzle.slice(puzzle.lastIndexOf('.') + 1)
    };
  }

  if (b64config) {
    try {
      const config = JSON.parse(atob(b64config));
      Object.assign(params, config);
    } catch (e) {
      console.warn("Invalid base64 config parameter:", e);
    }
  }

  gCrossword = CrosswordNexus.createCrossword($('div.crossword'), params);
  if (gCrossword?.syncTopTextWidth) {
    window.gCrossword.syncTopTextWidth = gCrossword.syncTopTextWidth.bind(gCrossword);
  }
  if (isMobile && crosswordRoot) {
    const tryWrapLayout = () => {
        const canvas = document.querySelector('.cw-canvas');
        const buttons = document.querySelector('.cw-buttons-holder');
        if (buttons && buttons.children.length) {
          const allButtons = Array.from(buttons.children);

          // Match by text content – you can refine this to use classes if needed
          const file = allButtons.find(btn => btn.textContent.includes('File'));
          const check = allButtons.find(btn => btn.textContent.includes('Check'));
          const reveal = allButtons.find(btn => btn.textContent.includes('Reveal'));
          const theme = allButtons.find(btn => btn.textContent.includes('Theme'));
          const settings = allButtons.find(btn => btn.textContent.includes('Settings'));
          const timer = allButtons.find(btn => btn.textContent.match(/[\d:]+/)); // crude match for timer

          // Only reflow if all buttons were found
          if (file && check && reveal && theme && settings && timer) {
            const row1 = document.createElement('div');
            row1.className = 'cw-buttons-row';
            row1.append(file, check, reveal, theme);

            const row2 = document.createElement('div');
            row2.className = 'cw-buttons-row';
            row2.append(settings, timer);

            // Clear and re-append
            buttons.innerHTML = '';
            buttons.append(row1, row2);
          }
        }
        const content = document.querySelector('.cw-content');
        const clues = document.querySelector('.cw-clues-holder');
        let drawerOpen = false;
        let drawer;
        let touchStartY = null;

        if (!canvas || !buttons || !content || !clues) {
        return setTimeout(tryWrapLayout, 100);
        }

        // Safe to remove .cw-grid AFTER canvas is grabbed
        const grid = document.querySelector('.cw-grid');
        if (grid) grid.remove();

        // Build wrapper
        // Build wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'cw-grid-wrapper';

        // Append the canvas (grid)
        wrapper.appendChild(canvas);

        // NEW: Create clues container
        const mobileClues = document.createElement('div');
        mobileClues.className = 'cw-mobile-clues-holder';

        // Move top and bottom clues into this container
        const across = document.querySelector('.cw-clues-top');
        const down = document.querySelector('.cw-clues-bottom');

        if (across && down) {
          mobileClues.appendChild(across);
          mobileClues.appendChild(down);
        }

        // Create container to hold grid + clues side by side
        const gridClueWrapper = document.createElement('div');
        gridClueWrapper.className = 'cw-grid-clue-wrapper';

        // Append the canvas (grid)
        gridClueWrapper.appendChild(canvas);

        // Use the already-declared mobileClues
        mobileClues.className = 'cw-mobile-clues-side'; // update class name for styling

        // Append clues to the right of the grid
        gridClueWrapper.appendChild(mobileClues);

        // Append grid + clues layout into the main wrapper
        wrapper.appendChild(gridClueWrapper);

        // Rebind clue clicks for mobile container
        mobileClues.querySelectorAll('.cw-clue').forEach(el => {
          el.addEventListener('click', (e) => {
            const target = $(e.currentTarget);
            const wordId = target.data('word');
            const word = gCrossword.words[wordId];

            if (!word) return;

            const cell = word.getFirstEmptyCell() || word.getFirstCell();
            if (cell) {
              gCrossword.setActiveWord(word);
              if (gCrossword.active_clues.id !== target.data('clues')) {
                gCrossword.changeActiveClues();
              }
              gCrossword.setActiveCell(cell);

              // ✅ Manually trigger clue highlighting
              gCrossword.inactive_clues.markActive(cell.x, cell.y, true, gCrossword.fakeclues);
              gCrossword.active_clues.markActive(cell.x, cell.y, false, gCrossword.fakeclues);

              gCrossword.renderCells();
            }
          });
        });

        // Create drawer container
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'cw-buttons-drawer';

        // Add drawer to layout before inserting buttons
        wrapper.appendChild(buttonWrapper);

        // THEN move buttons inside the drawer
        buttonWrapper.appendChild(buttons);

        // Create the handle and append
        const handle = document.createElement('div');
        handle.className = 'cw-buttons-handle';

        // Add drawer to wrapper
        wrapper.appendChild(handle);
        wrapper.appendChild(buttonWrapper);

        // Create keyboard wrapper and append
        const keyboardWrapper = document.createElement('div');
        keyboardWrapper.className = 'keyboard-wrapper-placeholder';
        wrapper.appendChild(keyboardWrapper);

        // Insert everything before clues
        content.insertBefore(wrapper, clues);

        // Rebuild keyboard
        rebuildKeyboardAndPositionDrawer();

        // === Rebus via long-press on the grid ===
        (function enableRebusLongPressOnCell(){
          // Your grid is the canvas with id 'cw-puzzle-grid' (fallback to .cw-canvas)
          const grid = document.getElementById('cw-puzzle-grid') || document.querySelector('.cw-canvas');
          if (!grid || grid.dataset.rebusLpAttached === '1') return; // guard against double binding
          grid.dataset.rebusLpAttached = '1';

          const LP_MS = 450;        // long-press threshold
          const MAX_MOVE = 8;       // cancel if finger moves too much (px)
          let timer = null;
          let startX = 0, startY = 0;

          function openRebusEditor() {
            if (!gCrossword?.selected_cell || gCrossword.selected_cell.empty) return;
            const val = prompt('Rebus entry', gCrossword.selected_cell.letter || '');
            if (val && gCrossword?.hiddenInputChanged) {
              gCrossword.hiddenInputChanged(val.toUpperCase());
            }
          }

          function clearTimer() {
            if (timer) { clearTimeout(timer); timer = null; }
          }

          grid.addEventListener('pointerdown', (e) => {
            if (!gCrossword?.selected_cell || gCrossword.selected_cell.empty) return;
            startX = e.clientX;
            startY = e.clientY;
            clearTimer();
            timer = setTimeout(openRebusEditor, LP_MS);
          });

          grid.addEventListener('pointermove', (e) => {
            if (!timer) return;
            const dx = Math.abs(e.clientX - startX);
            const dy = Math.abs(e.clientY - startY);
            if (dx > MAX_MOVE || dy > MAX_MOVE) clearTimer(); // treat as scroll/drag, cancel LP
          });

          grid.addEventListener('pointerup', clearTimer);
          grid.addEventListener('pointerleave', clearTimer);
          grid.addEventListener('pointercancel', clearTimer);
        })();


        // Drawer toggle logic
        drawer = buttonWrapper;
        drawerOpen = false; // starts visible
        drawer.classList.remove('open'); // make sure it's closed on load
        // Immediately hide the drawer (force rendering to catch transform)
        requestAnimationFrame(() => {
          drawer.classList.remove('open');
        });

        // Click to toggle
        handle.addEventListener('click', () => {
          drawerOpen = !drawerOpen;
          drawer.classList.toggle('open', drawerOpen);
        });

        // Swipe gesture
        touchStartY = null;
        handle.addEventListener('touchstart', (e) => {
          touchStartY = e.touches[0].clientY;
        });
        handle.addEventListener('touchend', (e) => {
          if (touchStartY === null) return;
          const deltaY = touchStartY - e.changedTouches[0].clientY;
          if (deltaY > 30) {
            drawerOpen = true;
          } else if (deltaY < -30) {
            drawer.classList.remove('open');
            drawerOpen = false;
          }
          touchStartY = null;
        });
        setTimeout(() => {
          const firstWord = gCrossword.active_clues.getFirstWord();
          gCrossword.setActiveWord(firstWord);
          gCrossword.setActiveCell(firstWord.getFirstCell());
          gCrossword.renderCells();
          // Match the width of the top clue bar to the grid
          setTimeout(() => {
            const gridEl = document.getElementById('cw-puzzle-grid');
            const clueBar = document.querySelector('.cw-top-text-wrapper');
            if (gridEl && clueBar) {
              clueBar.style.width = gridEl.getBoundingClientRect().width + 'px';
            }
          }, 100);
        }, 50);
    };

    setTimeout(tryWrapLayout, 300);
    }
  console.log('Is mobile?', isMobile, 'Classes:', document.querySelector('.crossword')?.className);
});

function createCustomKeyboard() {
  const keyboard = document.createElement('div');
  keyboard.id = 'custom-keyboard';
  keyboard.className = 'custom-keyboard';

  const letterRows = [
    'QWERTYUIOP'.split(''),
    'ASDFGHJKL'.split(''),
    'ZXCVBNM'.split('')
  ];

  const symbolRows = [
    ['1','2','3','4','5','6','7','8','9','0'],
    ['!','@','#','$','%','^','&','*','(',')'],
    ['-','+','=','/','?',':',';','"',"'",'\\']
  ];

  const rows = isAltKeyboard ? symbolRows : letterRows;

  rows.forEach((row, rowIndex) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'custom-keyboard-row';

    // ── TOP ROW: ⬅️ ... letters ... ➡️
    if (rowIndex === 0) {
      const leftArrow = document.createElement('div');
      leftArrow.className = 'custom-key wide-key cw-key-left';
      leftArrow.textContent = '<';
      leftArrow.addEventListener('click', () => {
        const skipFilled = gCrossword.config?.tab_key === 'tab_skip';
        gCrossword.moveToNextWord(true, skipFilled); // ← previous word
      });
      rowDiv.appendChild(leftArrow);
    }

    // ── BOTTOM ROW: 123/ABC toggle on the far left
    if (rowIndex === 2) {
      const altKey = document.createElement('div');
      altKey.className = 'custom-key cw-key-alt-toggle';
      altKey.dataset.key = 'ALT';
      altKey.textContent = isAltKeyboard ? 'ABC' : '123';
      altKey.addEventListener('click', () => {
        isAltKeyboard = !isAltKeyboard;

        const wrapper = document.querySelector('.keyboard-wrapper-placeholder');
        const oldKeyboard = wrapper.querySelector('#custom-keyboard');
        if (oldKeyboard) oldKeyboard.remove();

        const newKeyboard = createCustomKeyboard();
        wrapper.appendChild(newKeyboard);
        wrapper.style.height = `${newKeyboard.offsetHeight}px`;
      });
      rowDiv.appendChild(altKey);
    }

    // main keys for the row
    row.forEach(letter => {
      const key = document.createElement('div');
      key.className = 'custom-key';
      key.textContent = letter;
      key.addEventListener('click', () => {
        if (gCrossword?.hidden_input) {
          gCrossword.hiddenInputChanged(letter);
        }
      });
      rowDiv.appendChild(key);
    });

    if (rowIndex === 0) {
      const rightArrow = document.createElement('div');
      rightArrow.className = 'custom-key wide-key cw-key-right';
      rightArrow.textContent = '>';
      rightArrow.addEventListener('click', () => {
        const skipFilled = gCrossword.config?.tab_key === 'tab_skip';
        gCrossword.moveToNextWord(false, skipFilled); // → next word
      });
      rowDiv.appendChild(rightArrow);
    }

    if (rowIndex === 2) {
      // Period key (bottom row)
      const periodKey = document.createElement('div');
      periodKey.className = 'custom-key period-key';
      periodKey.textContent = '.';
      periodKey.addEventListener('click', () => {
        if (gCrossword?.hidden_input) {
          gCrossword.hiddenInputChanged('.');
        }
      });
      rowDiv.appendChild(periodKey);

      // Backspace (bottom row, far right)
      const backspace = document.createElement('div');
      backspace.className = 'custom-key backspace-key';
      backspace.textContent = '⌫';

      let backspaceTimeout;
      let backspaceInterval;
      let backspaceHeld = false;
      let backspaceFired = false;

      function clearBackspaceState() {
        clearTimeout(backspaceTimeout);
        clearInterval(backspaceInterval);
        backspaceHeld = false;
        backspaceFired = false;
      }

      function performBackspace() {
        if (!gCrossword?.selected_cell) return;
        const cell = gCrossword.selected_cell;
        const direction = gCrossword.active_clues?.id === 'clues_top' ? 'across' : 'down';
        const isAcross = direction === 'across';

        if (!cell.empty && cell.letter) {
          cell.letter = '';
          gCrossword.renderCells();
          return;
        }

        let x = cell.x, y = cell.y;
        while (true) {
          if (isAcross ? x <= 1 : y <= 1) return;
          isAcross ? x-- : y--;
          const prev = gCrossword.getCell(x, y);
          if (!prev || prev.empty) continue;

          gCrossword.setActiveCell(prev);
          const matchingWord = Object.values(gCrossword.words).find(word =>
            word.dir === direction && word.cells.includes(`${prev.x}-${prev.y}`)
          );
          if (matchingWord) gCrossword.setActiveWord(matchingWord);

          prev.letter = '';
          gCrossword.renderCells();
          return;
        }
      }

      backspace.addEventListener('pointerdown', () => {
        backspaceHeld = false;
        backspaceFired = false;
        backspaceTimeout = setTimeout(() => {
          backspaceHeld = true;
          performBackspace();
          backspaceFired = true;
          backspaceInterval = setInterval(performBackspace, 120);
        }, 600);
      });
      backspace.addEventListener('pointerup', () => {
        if (!backspaceFired) performBackspace();
        clearBackspaceState();
      });
      backspace.addEventListener('pointerleave', clearBackspaceState);
      backspace.addEventListener('pointercancel', clearBackspaceState);

      rowDiv.appendChild(backspace);
    }

    keyboard.appendChild(rowDiv);
  });

  console.log('[MOBILE] crossword.mobile.js loaded');
  return keyboard;
}
