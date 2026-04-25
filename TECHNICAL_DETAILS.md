# Technical Details

This document provides a deep dive into the architecture, state management, and specialized features of the Crossword Nexus HTML5 Solver.

## 1. Core Engine & State Management

The solver is built around the `CrossWord` class in `js/crosswords.js`. It manages the lifecycle of a crossword puzzle, from parsing and rendering to user interaction and saving.

- **Data Model:** It relies on `lib/jscrossword_combined.js` (JSCrossword) for the underlying puzzle logic, such as determining word boundaries, numbering, and solution checking.
- **UI Architecture:** The solver uses a template-based approach (defined as a string in `js/crosswords.js`) that is injected into a parent container.
- **Event Handling:** Interaction is handled via a mix of direct DOM listeners and a hidden `<input>` element used to capture mobile keyboard events and ensure consistent input behavior across platforms.

## 2. Platform-Specific Implementations

The solver dynamically adapts to the user's device.

### Desktop Mode
- **Layout:** Uses `css/crosswordnexus.css` for a sidebar-based layout.
- **Input:** Relies on physical keyboard events captured on the document level.

### Mobile Mode
- **Detection:** `index.html` detects mobile devices and loads `js/crossword.mobile.js`.
- **Custom Keyboard:** To avoid issues with OS-level virtual keyboards obscuring the grid, the solver implements a custom HTML/CSS keyboard (`createCustomKeyboard`) with specialized keys for Rebus entries and navigation.
- **Drawer System:** Clues are often placed in a bottom "drawer" that can be swiped or toggled, maximizing grid visibility.
- **Viewport Management:** Uses `visualViewport` API and a custom `--vh` CSS variable to handle the complex resizing behavior on mobile browsers when address bars or keyboards appear.

## 3. Persistent State (Save/Load)

Game progress is automatically saved to the browser's `localStorage`.

- **Hashing:** A simple hash of the puzzle JSON structure is used to generate a unique `savegame_name`. This ensures that progress is tied to the specific puzzle even if the filename changes.
- **lscache:** The solver uses the `lscache` library to manage these saves, allowing for expiration and simple cleanup of old puzzle data.
- **What's Saved:** The user's filled letters, marks (checks/reveals), notes, and the current timer state.

## 4. Specialized Puzzle Modes

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
The solver uses CSS variables for all major colors (e.g., `--grid-selected-word-color`). These are dynamically updated by the `updateCSS` method in the `CrossWord` class, allowing for seamless Dark Mode and custom user color schemes.

### Printing
The "Print" feature generates a PDF client-side using a bundled version of `jsPDF`. The layout logic for the PDF is contained within the `jscrossword_combined.js` library.

### Cache Management (Service Worker)
The solver uses a Service Worker (`sw.js`) to provide offline capabilities and faster load times.
- **Cache-First Strategy:** Most assets are served from the cache if available.
- **Cache Invalidation:** Because of the cache-first strategy, the `CACHE_NAME` constant in `sw.js` **must be updated manually** with every deployment. This is the only way to ensure clients receive the latest code updates.

### Adding New Features
When extending the solver:
1.  **Check `js/crossword.shared.js`** for utility functions that should be consistent across platforms.
2.  **Verify `js/crosswords.js`** for core logic changes.
3.  **Test on mobile** to ensure the custom keyboard and drawer system correctly handle any new UI elements.
