# Crossword Nexus HTML5 Solver
An HTML5 crossword solver that can handle multiple puzzle formats (JPZ, PUZ, iPuz, etc.) in a browser. This solver is designed to be easily embedded into any website.

## Dependencies
- **jQuery**: Required for DOM manipulation and events.
- **jsPDF** (bundled in `jscrossword_combined.js`): Used for the "Print" functionality.
- **JSCrossword tools**: A submodule providing core puzzle parsing logic.
- **lscache**: For saving game progress to local storage.

## Installation

### Using git (recommended)
To get the latest version and all necessary submodules, clone the repository recursively:
```bash
git clone --recurse-submodules https://github.com/crosswordnexus/html5-crossword-solver/
```
To update your installation, navigate to the directory and run `git pull`.

### Using a zip file
Download the latest release from the [Releases page](https://github.com/crosswordnexus/html5-crossword-solver/releases), unzip it, and place the `html5-crossword-solver` directory on your server.

## Basic Usage
You can create a fullscreen solving page by pointing `index.html` to a puzzle file via a URL parameter.

**URL Structure:**
`https://YOUR.SITE/html5-crossword-solver/index.html?file=/PATH/TO/YOUR/FILE.jpz`

This supports `.puz`, `.ipuz`, `.jpz`, and `.cfp` files. You can embed this URL in an `<iframe>` on your site:

```html
<iframe 
  allowfullscreen="true" 
  height="550" 
  width="100%" 
  style="border:none;"
  src="https://YOUR.SITE/html5-crossword-solver/index.html?file=/PATH/TO/YOUR/FILE.jpz">
</iframe>
```

## Advanced Usage
To integrate the solver directly into your page, you can initialize it with a JavaScript call.

```javascript
// The parent element where the crossword will be rendered
var parentElement = $('#crossword-container');

// Configuration options
var params = {
  puzzle_file: { url: '/puzzles/puzzle1.jpz' }
};

// Create the crossword instance
var crossword = CrosswordNexus.createCrossword(parentElement, params);
```

### Removing the Crossword
The solver adds listeners to the `window` object. To prevent memory leaks when removing the crossword from your page, you must call the `remove()` method.

```javascript
crossword.remove();
```

---

## Configuration Parameters
You can customize the solver's behavior by passing a parameters object. Here are the available options:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `puzzle_file` | `object` | `null` | An object with `{ url: '...' }` to load a puzzle from a URL. |
| `puzzle_object`| `object`| `null` | A pre-parsed `jsxw` puzzle object to load directly. |
| `hover_enabled`| `boolean`| `false` | Enables cell highlighting on mouse hover. |
| `skip_filled_letters` | `boolean` | `true` | If true, the cursor skips over already-filled cells. |
| `arrow_direction`| `string` | `'arrow_move_filled'` | Controls how arrow keys behave (e.g., `'arrow_move_filled'` skips filled cells, `'arrow_always_move'` does not). |
| `space_bar` | `string` | `'space_clear'` | Defines the action of the spacebar (e.g., `'space_clear'` clears a cell, `'space_toggles_direction'` switches between Across/Down). |
| `tab_key` | `string` | `'tab_noskip'` | Defines the behavior of the Tab key for navigating clues. |
| `gray_completed_clues` | `boolean`| `false` | If true, clues are automatically grayed out when the corresponding word is filled. |
| `timer_autostart`| `boolean`| `false` | If true, the puzzle timer starts automatically on load. |
| `confetti_enabled` | `boolean`| `true` | Enables a confetti animation when the puzzle is successfully solved. |
| `dark_mode_enabled` | `boolean`| `false` | Enables dark mode by default. |
| `notepad_name` | `string` | `'Notes'` | Customizes the title of the notepad feature. |
| `forced_theme` | `string`| `null` | Forces a specific color theme (e.g., `'classic'`). |
| `lock_theme` | `boolean`| `false` | If true, prevents the user from changing the color theme. |
| `min_sidebar_clue_width` | `number`| `220` | Minimum width of the sidebar containing the clues. |
| `save_game_limit` | `number`| `10` | Maximum number of saved games to keep in local storage. |


### "Fake Clues" Feature
The solver supports "fake clues," where clues can be manually grayed out by clicking on them. This is useful for puzzles where not all clues correspond to entries in the grid.

This mode can be enabled in two ways:
1.  **Globally:** Set `fakeclues: true` in the puzzle file's metadata. This makes *all* clues in the puzzle "fake."
2.  **Per Group:** In the puzzle data, mark a specific clue group with `fake: true`. This enables the manual graying behavior only for that group.

When this mode is active for a clue, the top clue bar will be blank when that clue's word is selected.

### Print Functionality
The solver includes a "Print" option in the File menu, which utilizes `jsPDF` (bundled within `jscrossword_combined.js`) to generate a printable PDF version of the crossword. This feature allows users to print the current state of the puzzle directly from their browser.

### Color Customization
The following parameters allow you to change the solver's color scheme.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `color_hover` | `string` | `'#FFFFAA'` | Color of a cell on hover. |
| `color_selected`| `string` | `'#FF4136'` | Background color of the currently selected cell. |
| `color_word` | `string` | `'#FEE300'` | Background color for all other cells in the active word. |
| `color_hilite` | `string` | `'#F8E473'` | Color for related or cross-referenced cells. |
| `color_word_shade` | `string`| `'#BAAB56'` | Shade color for words. |
| `color_none` | `string` | `'#FFFFFF'` | Default background color for empty cells. |
| `background_color_clue` | `string`| `'#666666'` | Background color for clues in the sidebar. |
| `default_background_color` | `string`| `'#c2ed7e'` | Default background color for the puzzle container. |
| `color_secondary` | `string`| `'#fff7b7'` | Secondary highlight color. |
| `font_color_clue` | `string`| `'#FFFFFF'` | Font color for clues. |
| `font_color_fill`| `string` | `'#000000'` | Font color for filled letters. |
| `color_block` | `string` | `'#212121'` | Color of the black squares (blocked cells). |
| `bar_linewidth` | `number`| `3.2` | Line width for cell borders (bars). |
