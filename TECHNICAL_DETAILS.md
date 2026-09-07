# Technical Details

This document provides a deep dive into the architecture, state management, and specialized features of the Crossword Nexus HTML5 Solver.

## 1. Core Engine & State Management

The solver is built around the `CrossWord` class in `src/crosswords.js` (compiled to `js/crosswords.js` by Vite). It manages the lifecycle of a crossword puzzle, from parsing and rendering to user interaction and saving.

- **Data Model:** It relies on `lib/jscrossword_combined.js` (JSCrossword) for the underlying puzzle logic, such as determining word boundaries, numbering, and solution checking.
- **UI Architecture:** The solver uses a template-based approach (defined as a string in `src/constants.js`) that is injected into a parent container.
- **Event Handling:** Interaction is handled via a mix of direct DOM listeners and a hidden `<input>` element used to capture mobile keyboard events and ensure consistent input behavior across platforms.

## 2. Platform-Specific Implementations

The solver dynamically adapts to the user's device.

### Desktop Mode
- **Layout:** Uses `css/crosswordnexus.css` for a sidebar-based layout.
- **Input:** Relies on physical keyboard events captured on the document level.

### Mobile Mode
- **Detection:** `index.html` detects mobile devices and loads `js/crossword.mobile.js`.
- **Custom Keyboard:** To avoid issues with OS-level virtual keyboards obscuring the grid, the solver implements a custom HTML/CSS keyboard (`createCustomKeyboard`) with a dedicated `REBUS`/`DONE` toggle key and word navigation arrows.
- **Drawer System:** Clues are often placed in a bottom "drawer" that can be swiped or toggled, maximizing grid visibility.
- **Viewport Management:** Uses `visualViewport` API and a custom `--vh` CSS variable to handle the complex resizing behavior on mobile browsers when address bars or keyboards appear.

## 3. Persistent State (Save/Load)

Game progress is automatically saved to the browser's `localStorage`.

- **Hashing:** A simple hash of the puzzle JSON structure is used to generate a unique `savegame_name`. This ensures that progress is tied to the specific puzzle even if the filename changes.
- **lscache:** The solver uses the `lscache` library to manage these saves, allowing for expiration and simple cleanup of old puzzle data.
- **What's Saved:** The user's filled letters, marks (checks/reveals), notes, and the current timer state.

## 4. Specialized Puzzle Modes

### In-Place Rebus System
- **Desktop Interaction:**
  - Pressing `Esc` or `Insert` on an active cell toggles Rebus mode directly in place (no popup modal).
  - While active, an overlay frame (`.cw-rebus-frame`) and a blinking caret (`.cw-rebus-cursor`) are rendered on top of the cell.
  - Typing appends letters (auto-scaled by `src/rendering.js`), and Backspace deletes character-by-character within the cell.
  - Pressing `Enter` or `Space` commits the entry and advances to the next cell.
  - Pressing `Esc` commits the current input and exits rebus mode without clearing or advancing.
- **Mobile Interaction:**
  - Tapping the **`REBUS`** key on the custom keyboard activates in-place rebus mode. The key dynamically flips to **`DONE`** with an `.active` accent highlight.
  - Long-pressing any grid cell (450ms) also activates in-place rebus mode directly on that cell without browser prompts; subsequent touch-release `click` events are intercepted in the capture phase to prevent accidental clue direction flips.
  - Tapping **`DONE`** commits the rebus and advances to the next square.

### Downs-Only Mode
- **Trigger:** URL parameter `?downs-only` or `?downsonly`.
- **Implementation:**
  - Automatically replaces the text of the first clue group (Across) with `---`.
  - Hides the corresponding clue container in the UI.
  - This prevents the user from accidentally seeing across clues while focusing on the "Downs Only" challenge.

### Diagramless Mode
- Triggered by `crossword_type: 'diagramless'` in metadata.
- **Behavior:** The grid is rendered without blocks initially (or as a plain field), and the "Top Clue" bar is hidden. Users must deduce the grid structure.

### Fake Clues
- Allows clues to be manually "checked off" by clicking them.
- Used when clues don't have a 1:1 mapping to grid entries.

## 5. Development & Extension

### CSS & Theming
The solver uses CSS variables for all major colors (e.g., `--grid-selected-word-color`). These are dynamically updated by the `updateCSS` method in `src/colors.js`, allowing for seamless Dark Mode and custom user color schemes.

### Printing
The "Print" feature generates a PDF client-side using a bundled version of `jsPDF`. The layout logic for the PDF is contained within the `jscrossword_combined.js` library.

### Cache Management (Service Worker)
The solver uses a Service Worker (`sw.js`) to provide offline capabilities and faster load times.
- **Cache-First Strategy:** Most assets are served from the cache if available.
- **Cache Invalidation:** Because of the cache-first strategy, the `CACHE_NAME` constant in `sw.js` is automatically updated with a timestamp-based cache name on every build by the Vite build plugin (`closeBundle` hook). This ensures clients receive the latest code updates automatically.

### Modal Boxes
The UI relies heavily on a generic modal system for displaying info, settings, and help text.
- **`createModalBox(title, content, button_text)`:** This method in `src/modal.js` is the standard way to display pop-ups. It injects HTML into the `.cw-modal` container and handles the display toggling.
- **Adding new Modals:** If you need a new pop-up, follow the pattern of `showInfo()` or `showHelp()`: define the content as an HTML string, escape any dynamic user content (like `this.title`), and call `createModalBox`.

### Build Process
- The source code resides in the `src/` directory as ES modules (`src/crosswords.js`, `src/rendering.js`, `src/navigation.js`, etc.).
- Running `npm run build` compiles `src/crosswords.js` and all imported modules into the bundled IIFE script at `js/crosswords.js` using Vite.
- **Do not edit `js/crosswords.js` directly**—all development and core engine modifications should be made in `src/` and compiled with `npm run build`.

### Adding New Features
When extending the solver:
1.  **Check `js/crossword.shared.js`** for utility functions that should be consistent across platforms.
2.  **Verify `src/` modules** (e.g. `src/crosswords.js`, `src/rendering.js`, `src/navigation.js`, etc.) for core logic changes and recompile with `npm run build`.
3.  **Test on mobile** to ensure the custom keyboard and drawer system correctly handle any new UI elements.

## 6. Architecture Map & Key Modules

| File | Purpose |
|---|---|
| `src/crosswords.js` | Main orchestrator & entry point; binds lifecycle methods and handles viewport resizing. |
| `src/rendering.js` | SVG grid layout math (`positionGrid`), cell rendering, bars, circles, letters, and chevrons. |
| `src/navigation.js` | Keyboard/cell selection handling, word advancement, spacebar/tab navigation, `setActiveWord`. |
| `src/loader.js` | Puzzle parsing, cell initialization, clue mapping, and `CluesGroup` creation. |
| `src/cluesUI.js` | Sidebar clue list rendering, styling, and clue-note editing. |
| `src/modal.js` | Generic modal box system (Info, Settings, Rebus input, Unmatched Clues). |
| `src/colors.js` | HSV color transforms, theme calculation, and dynamic CSS variable injection. |
| `src/storage.js` | `localStorage` state serialization and save cleanup routines. |
| `src/utils.js` | Pure helpers: string escaping, correctness checks, and dynamic clue font binary search (`resizeText`). |
| `src/constants.js` | Base HTML template strings and default configuration constants. |

### DOM & Layout Hierarchy

```text
.cw-content (flex container)
├── .cw-grid (left column)
│   ├── .cw-buttons-holder (toolbar: File, Check, Reveal, Settings, Timer)
│   └── .cw-canvas (puzzle area container)
│       └── .cw-puzzle-container (flex column, width: 100%)
│           ├── .cw-top-text-wrapper (current clue bar, spans canvas width)
│           └── <svg id="cw-puzzle-grid"> (SVG crossword grid)
└── .cw-clues-holder (right column: Across & Down clue lists on desktop)
```

## 7. Developer & LLM Quick Reference (Gotchas)

1. **Source vs. Standalone Scripts**:
   - `src/` compiles to `js/crosswords.js` via `npm run build`. Never edit `js/crosswords.js` directly.
   - `js/crossword.mobile.js` and `js/crossword.shared.js` are **standalone scripts** in `js/` that are loaded directly by `index.html` (not bundled by Vite).
2. **Container-Based Breakpoints**:
   - Breakpoints are NOT CSS `@media` queries; they are container classes (`.cw-max-width-1200`, `.cw-max-width-1080`, `.cw-max-width-650`, etc.) added dynamically by `setBreakpointClasses(this.root)` in JS based on the root element's width.
3. **1-Indexed Grid Coordinates**:
   - `this.cells[x][y]` uses **1-indexed** coordinates (`1..grid_width`, `1..grid_height`), while raw `JSCrossword` and cell ranges from puzzle formats are 0-indexed.

## 8. Tournament Extension

For technical details regarding the Firebase-backed tournament system (Admin Dashboard, Leaderboards, and Scoring), see [tournament/TECHNICAL_DETAILS.md](tournament/TECHNICAL_DETAILS.md).


