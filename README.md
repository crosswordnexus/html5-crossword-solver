# Crossword Nexus HTML5 Solver
###An HTML5 crossword solver that can handle JPZ files in a browser.

## Dependencies:
####jQuery
####zipjs - http://gildas-lormeau.github.io/zip.js/

## Usage:
###Basic usage example

```javascript
var CrossWord = CrosswordNexus.createCrossword(parent, parameters);
```

###Warning
CrossWord object adds listener to window. If you want to remove crossword from DOM - call remove function, that will remove all event listeners, then remove crossword;

```javascript
CrossWord.remove();
```

###Parameters

| Param     | Description |
| --------- | ----------------- |
| parent    | jquery-wrapped element, that will be parent for crossword |
| parameters| javascript object |

###Available parameters

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
| zipjs_path        | 'js/zip'  | path to zip.js files (this option is GLOBAL to all puzzles on same page) |
| skip_filled_letters | true    | enables or disables skipping filled-in letters when filling grid |

###Each puzzle file must be object with 3 parameters:
| Param  | Description     |
| ------ | --------------- |
| url    | Puzzle file url |
| type   | Type of puzzle file. Currently only .JPZ puzzles supported |
| name   | Puzzle name. Optional for puzzle_file parameter |

With cell_size == 0, crossword will never be bigger than parent.

##Example:

###Multiple puzzles with settings enabled:

```javascript
var params = {
  hover_enabled: true,
  settings_enabled: true,
  puzzles: [
        {name: 'Spring Fever Meets Spring Training', url: '/puzzles/puzzle1.jpz', type: 'jpz'},
        {name: 'American Values Club Crossword', url: '/puzzles/puzzle2.jpz', type: 'jpz'},
        {name: 'Crossword', url: '/puzzles/crossword_0415.jpz', 'type': 'jpz'},
        {name: 'Mini Crossword', url: '/puzzles/mini_0415.jpz', 'type': 'jpz'},
        {name: 'Mystery Crossword', url: '/puzzles/mystery_0415.jpz', 'type': 'jpz'},
        {name: 'Quick and Easy Crossword', url: '/puzzles/quick_0415.jpz', 'type': 'jpz'}
  ],
};
CrosswordNexus.createCrossword($('#crossword'), params);
```
###Single puzzle with settings disabled and some custom colors:

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


