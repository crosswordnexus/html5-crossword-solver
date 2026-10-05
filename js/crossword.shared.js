/**
 * Shared functions (desktop and mobile)
 * Namespace: CrosswordShared
 */
window.CrosswordShared = {
  getCrosswordParams() {
    const url = new URL(window.location.href);
    const puzzle = url.searchParams.get("puzzle") || url.searchParams.get("file");
    const downsOnly = url.searchParams.has("downsonly") && url.searchParams.get("downsonly") !== "false";
    const kelsey = url.searchParams.has("kelsey") && url.searchParams.get("kelsey") !== "false";
    const b64config = url.searchParams.get("config");
    const params = {
      downsOnly: downsOnly,
      kelsey: kelsey
    };
    const lzpuz = window.location.hash.slice(1);

    if (puzzle) {
      params.puzzle_file = {
        url: puzzle,
        type: puzzle.slice(puzzle.lastIndexOf('.') + 1)
      };
    } else if (lzpuz) {
      try {
        console.log("[startup] Found lzpuz param — decompressing...");
        const xw = JSCrossword.deserialize(lzpuz);
        console.log("[startup] Loaded LZ puzzle:", xw.metadata.title, "by", xw.metadata.author);

        // Historical compatibility patch:
        // Puzzles serialized from .puz files before a jscrossword fix had words ordered
        // numerically (interleaved Across & Down) instead of all Across then Down.
        // If detected (directions are Across & Down, and word[1] intersects word[0]),
        // rebuild the word entries and clue associations using xwGrid().
        const isAcrossDown = xw.clues?.length === 2 &&
          xw.clues.some(g => /across/i.test(g.title)) &&
          xw.clues.some(g => /down/i.test(g.title));

        if (isAcrossDown && xw.words?.length >= 2) {
          const w0 = xw.words[0]?.cells || [];
          const w1 = xw.words[1]?.cells || [];
          const intersects = w0.some(([x0, y0]) =>
            w1.some(([x1, y1]) => x0 === x1 && y0 === y1)
          );

          if (intersects) {
            console.log("[startup] Detected out-of-order words from historical puz lz-string; rebuilding with xwGrid()");
            const grid = typeof xw.grid === 'function' ? xw.grid() : JSCrossword.xwGrid(xw.cells);
            const acrossMap = grid.acrossEntries();
            const downMap = grid.downEntries();

            const acrossClues = xw.clues.find(g => /across/i.test(g.title));
            const downClues = xw.clues.find(g => /down/i.test(g.title));

            const acrossNums = Object.keys(acrossMap).map(Number).sort((a, b) => a - b);
            const downNums = Object.keys(downMap).map(Number).sort((a, b) => a - b);

            const newWords = [];
            let wordId = 1;

            for (const num of acrossNums) {
              const id = String(wordId++);
              newWords.push({
                id,
                cells: acrossMap[num].cells
              });
              const clue = acrossClues?.clue?.find(c => Number(c.number) === num);
              if (clue) clue.word = id;
            }

            for (const num of downNums) {
              const id = String(wordId++);
              newWords.push({
                id,
                cells: downMap[num].cells
              });
              const clue = downClues?.clue?.find(c => Number(c.number) === num);
              if (clue) clue.word = id;
            }

            xw.words = newWords;
            xw.clues = [acrossClues, downClues];
          }
        }

        params.puzzle_object = xw;
      } catch (err) {
        console.error("[startup] Failed to load lzpuz:", err);
      }
    }

    if (b64config) {
      try {
        Object.assign(params, JSON.parse(atob(b64config)));
      } catch (e) {
        console.warn("Invalid config:", e);
      }
    }

    return params;
  },

  isiPad() {
    const ua = navigator.userAgent || '';
    return ua.includes("iPad") || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
  },

  isMobileDevice() {
    const ua = navigator.userAgent || '';
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 1;
    const isiPad = this.isiPad();
    const isMobileUA = /android|iphone|ipod|mobile/i.test(ua);
    return isTouch && (isMobileUA || isiPad);
  },

  isTabletDevice() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 1;
    if (!isTouch) return false;
    if (this.isiPad()) return true;
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    const maxDim = Math.max(window.innerWidth, window.innerHeight);
    return minDim >= 600 && maxDim >= 768;
  },

  setupPWAInstallButton(btn) {
    if (!btn) {
      console.warn("Install button not found.");
      return; // Safe early exit
    }

    let deferredPrompt = null;  // <-- persist between handlers

    // Listen only if button exists
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;  // <-- now correctly stored

      btn.show();

      btn.off('click').on('click', async () => {
        if (!deferredPrompt) return; // extra safety

        deferredPrompt.prompt();
        await deferredPrompt.userChoice;

        btn.hide();
        deferredPrompt = null;  // prevents reuse
      });
    });

    window.addEventListener('appinstalled', () => {
      btn.hide();
    });
  }
};
