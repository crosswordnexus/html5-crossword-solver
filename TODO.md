# TODO

This file tracks planned improvements, refactoring ideas, and future features for the HTML5 Crossword Solver.

## High Priority
- [ ] **Build System Migration:** Move from manual script management to a modern build tool like **Vite**.
    - Implement automatic cache busting (hashing filenames).
    - Transition from global variables to ES Modules (`import`/`export`).
    - Automate Service Worker asset listing using Workbox.
    - Move `lib/` dependencies to `npm`.

## Features
- [ ] **Downs-Only Enhancements:**
    - [ ] Add an option to automatically set the starting direction to "Down" when `downs-only` mode is active.
    - [ ] Add a visual indicator or toggle for Downs-Only mode in the UI.
- [ ] **Improved Rebus Support:** Streamline the Rebus entry process on mobile (e.g., a dedicated Rebus toggle).
- [ ] **Multi-Puzzle Support:** Better UI for selecting from a list of puzzles (if `puzzles` param is provided).

## Refactoring & Maintenance
- [ ] **Modularize `js/crosswords.js`:** Break down the 4000+ line file into smaller, functional modules (e.g., `Grid.js`, `InputHandler.js`, `Timer.js`).
- [ ] **CSS Cleanup:** Consolidate redundant styles between `crosswordnexus.css` and `crossword.shared.css`.
- [ ] **Type Safety:** Consider adding JSDoc or transitioning to TypeScript to improve maintainability and catch errors earlier.

## Deployment & DevOps
- [ ] **GitHub Actions:** Set up an action to automatically build and deploy the solver (to GitHub Pages or a server) on every push to `main`.
