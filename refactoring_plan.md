# Refactoring Plan: Modernizing Layout Loading

This document compares the current structure and index loading mechanism with the proposed modernized, modular structure.

## 1. Directory Structure Changes

- **Current (Implicit Globals):**
  - `index.html` loads `js/crossword.shared.js`
  - `index.html` loads `js/crosswords.js`
  - `index.html` loads `js/crossword.mobile.js`
  - `src/colors.js` depends on global `window.Color`

- **Proposed (Explicit Modules):**
  - `index.html` loads a single entrypoint `src/loader.js` (compiled by Vite)
  - `src/loader.js` imports `src/shared/utils.js`
  - `src/loader.js` imports `src/desktop/solver.js`
  - `src/loader.js` imports `src/mobile/solver.js`

---

## 2. HTML Loading Block Comparison

### Before (Dynamic `<script>` tag injection)
```html
<!-- Shared JS & CSS -->
<script src="js/crossword.shared.js"></script>
<link rel="stylesheet" href="./css/crossword.shared.css">

<script>
    const mobile = CrosswordShared.isMobileDevice();

    if (mobile) {
      const core = document.createElement('script');
      core.src = './js/crosswords.js';
      core.onload = () => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = './css/crossword.mobile.css';
        document.head.appendChild(link);

        const mobileScript = document.createElement('script');
        mobileScript.src = './js/crossword.mobile.js';
        document.body.appendChild(mobileScript);
      };
      window.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(core);
      });
    } else {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = './css/crosswordnexus.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = './js/crosswords.js';
      script.onload = () => {
        const params = CrosswordShared.getCrosswordParams();
        window.gCrossword = CrosswordNexus.createCrossword($('div.crossword'), params);
        // ... settimeout render logic ...
      };
      window.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(script);
      });
    }
</script>
```

### After (Static tags with body class layout)
```html
<!-- 1. All assets load in parallel -->
<link rel="stylesheet" href="./css/crossword.shared.css">
<link rel="stylesheet" href="./css/crosswordnexus.css">
<link rel="stylesheet" href="./css/crossword.mobile.css">

<!-- 2. Fast, render-blocking feature detection checks state immediately -->
<script src="js/crossword.shared.js"></script>
<script>
    const isMobile = CrosswordShared.isMobileDevice();
    document.documentElement.className += isMobile ? ' mobile-layout' : ' desktop-layout';
</script>

<!-- 3. Defer JS execution to let page load instantly -->
<script src="./js/crosswords.js" defer></script>
```

---

## 3. CSS Prefix Scoping Changes

To ensure the static stylesheets do not conflict with each other, we prefix layout-specific rules with their respective wrapper class.

```css
/* css/crosswordnexus.css */
.desktop-layout .cw-main {
    display: flex;
}
```

```css
/* css/crossword.mobile.css */
.mobile-layout .cw-main {
    display: block;
}

---

## 4. Maintenance Warning: Keep Loaders Synchronized

> [!IMPORTANT]
> The app maintains two separate HTML wrapper entrypoints:
> 1. [index.html](file:///Users/alexboisvert/GitHub/html5-crossword-solver/index.html) (Standard solver)
> 2. [tournament/solve.html](file:///Users/alexboisvert/GitHub/html5-crossword-solver/tournament/solve.html) (Tournament mode wrapper)
> 
> Because both wrappers share the exact same device detection logic and JS/CSS loading assets, **any future changes to the page layout structure, script loading order, or assets in `index.html` must be duplicated in `tournament/solve.html` (with adjusted relative paths like `../js/...` and tournament parameters).**

---

## 5. TODO: Unify Solver HTML wrappers (DRY)

- [ ] **Consolidate wrappers:** Merge `tournament/solve.html` functionality into `index.html` via query routing (e.g., `index.html?tournament_mode=true`). This will require updating tournament dashboard navigation references.

