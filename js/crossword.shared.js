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

  isMobileDevice() {
    const ua = navigator.userAgent || '';
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 1;
    const isiPad = ua.includes("iPad") || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
    const isMobileUA = /android|iphone|ipod|mobile/i.test(ua);
    return isTouch && (isMobileUA || isiPad);
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

