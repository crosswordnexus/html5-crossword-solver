/**
 * Shared functions (desktop and mobile)
 * Namespace: CrosswordShared
 */
window.CrosswordShared = {
  getCrosswordParams() {
    const url = new URL(window.location.href);
    const puzzle = url.searchParams.get("puzzle") || url.searchParams.get("file");
    const b64config = url.searchParams.get("config");
    const params = {};
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
  }
};
