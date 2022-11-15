# Crossword Nexus HTML5 Solver
### An HTML5 crossword solver that can handle JPZ/PUZ/iPUZ/CFP files in a browser.

## Dependencies:
#### jQuery
#### jsPDF (optional) - https://github.com/MrRio/jsPDF
#### JSCrossword tools - https://github.com/crosswordnexus/crossword-tools

## Installation
### Using git command line (preferred)
Use the command `git clone --recurse-submodules https://github.com/crosswordnexus/html5-crossword-solver/` in whatever directory you'd like on your server. If you ever want to update you can run a simple `git pull` from the `html5-crossword-solver` directory.

### Using a zip file
Head over to https://github.com/crosswordnexus/html5-crossword-solver/releases and download the most recent `html5-crossword-solver.zip`. Unzip it and it will create a `html5-crossword-solver` directory.

## Usage:

### Basic usage
You do not need to alter any files in order to create a fullscreen solving page. Simply create a URL like

`https://YOUR.SITE/html5-crossword-solver/index.html?file=/PATH/TO/YOUR/FILE`

where your file is a puzzle in puz, ipuz, jpz, or cfp format. You can then make an iframe to embed in another page if desired:
```
<iframe allowfullscreen="true" height="550" width="100%" style="border:none;width: 100% !important;position: static;display: block !important;margin: 0 !important;"
 src="https://YOUR.SITE/html5-crossword-solver/index.html?file=/PATH/TO/YOUR/FILE">
</iframe>
```

### Advanced usage
You can change the code on any page to suit your needs.
```javascript
var CrossWord = CrosswordNexus.createCrossword(parent, parameters);
```

### Warning
CrossWord object adds listener to window. If you want to remove crossword from DOM - call remove function, that will remove all event listeners, then remove crossword;

```javascript
CrossWord.remove();
```

### Parameters

| Param     | Description |
| --------- | ----------------- |
| parent    | jquery-wrapped element, that will be parent for crossword |
| parameters| javascript object |

### Available parameters

| Name              | Default   | Description  |
| ----------------- | --------- | ------------ |
| hover_enabled     | false     | enables or disables cell hover effect |
| settings_enabled  | true      | enables or disables settings menu |
| color_hover       | #FFFFAA   | color for hovered cell |
| color_selected    | #FFA500   | color for selected cell |
| color_word        | #FFFF00   | color for selected word |
| color_hilite      | #FFFCA5   | color for hilited word (when mouse over clue) |
| cell_size         | null      | (int) cell size in px. null or anything, that converts to 0, means 'auto' |
| puzzle_file       | null      | puzzle file to preload. If file set - list of puzzles and open button will not be shown |
| puzzles           | null      | array of puzzle_files, user will be able to load |
| savegame_name     | ''        | name of saved game, blank name is global to whole site |
| skip_filled_letters | true    | enables or disables skipping filled-in letters when filling grid |

### Each puzzle file must be object with 3 parameters:
| Param  | Description     |
| ------ | --------------- |
| url    | Puzzle file url |
| type   | Type of puzzle file. Currently .JPZ/.PUZ/.IPUZ puzzles supported |
| name   | Puzzle name. Optional for puzzle_file parameter |

With cell_size == 0, crossword will never be bigger than parent.

## Example:

### Single puzzle with settings disabled and some custom colors:

```javascript
var params = {
  hover_enabled: false,
  settings_enabled: false,
  color_selected: '#FF0000',
  color_word: '#FFFF00',
  cell_size: 32,
  puzzle_file: {url: '/puzzles/puzzle1.jpz', type: 'jpz'}
};
CrosswordNexus.createCrossword($('#crossword'), params);
```
