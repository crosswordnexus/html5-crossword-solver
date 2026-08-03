# Manual Testing Checklist

Use this checklist during and after your refactor to verify visual, layout, and device-specific interactions that are difficult to cover in automated browser tests.

---

## 1. Responsiveness & Device Modes

### Desktop Layout
- [ ] Load a puzzle and verify that the sidebar clue list is visible and has a minimum width of `220px` (or whatever `min_sidebar_clue_width` is set to).
- [ ] Verify that resizing the browser window automatically triggers a re-render of the SVG grid cells without distorting them.

### Mobile Layout
- [ ] Open developer tools, emulate a mobile device (e.g., iPhone), and refresh the page.
- [ ] Verify that the bottom clue "drawer" is displayed.
- [ ] Verify that the custom HTML/CSS keyboard renders correctly at the bottom of the screen.
- [ ] Try typing using the custom keyboard and verify that it does not cause the page viewport to jump or zoom strangely.

---

## 2. Keyboard & Grid Navigation

Test the following key actions in standard desktop mode:
- [ ] **Arrow Keys**: Move the cursor around the grid. Verify that it respects the settings (`skip_filled_letters` and `arrow_direction`).
- [ ] **Spacebar**: Verify spacebar action clears the current cell or toggles the clue direction (Across/Down) depending on the configuration.
- [ ] **Tab / Shift+Tab**: Navigation skips to the next/previous clue.
- [ ] **Backspace**: Deletes the character in the active cell and moves the cursor backward.

---

## 3. Core Puzzle Features

- [ ] **Rebus Mode**: Verify you can enter multiple letters in a single cell (often triggered by pressing `Esc` or clicking a Rebus button, if supported).
- [ ] **Check / Reveal Options**:
  - [ ] Click **Check -> Letter / Word / Puzzle** and ensure incorrect letters are marked (usually with a red slash or background color).
  - [ ] Click **Reveal -> Letter / Word / Puzzle** and verify the correct letters are filled.
- [ ] **Timer**:
  - [ ] Verify the timer starts, pauses when clicked, and resumes.
- [ ] **Notepad / Info**:
  - [ ] Click the **File -> Info** and **File -> Notepad** buttons and verify the modal dialogs display correctly.

---

## 4. Theming (Dark Mode)
- [ ] Open the **Settings** menu (gear icon).
- [ ] Toggle **Dark Mode** on/off.
- [ ] Verify that all grid cells, text elements, background colors, and menu panels switch styling smoothly and remain legible.

---

## 5. State Persistence (Save/Load)
- [ ] Type a few letters into a puzzle.
- [ ] Refresh the page.
- [ ] Verify that the letters you typed are restored on reload.
- [ ] Clear the puzzle (**File -> Clear**) and verify that the local storage is cleared and the grid becomes blank.

---

## 6. Puzzle Formats
Verify loading at least one file of each supported format:
- [ ] **JPZ**: `index.html?file=sample_puzzles/FM.jpz`
- [ ] **iPuz**: `index.html?file=sample_puzzles/BB8.ipuz`
- [ ] **CFP**: `index.html?file=sample_puzzles/3x.cfp`
