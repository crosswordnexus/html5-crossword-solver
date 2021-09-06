/**
* iPUZ reading/writing functions
* copyright (c) 2021 Crossword Nexus
* MIT License https://opensource.org/licenses/MIT
**/

function xw_read_ipuz(data) {
    // If `data` is a string, convert to object
    if (typeof(data) === 'string') {
        // need to read as UTF-8 first (it's generally loaded as binary)
        data = BinaryStringToUTF8String(data);
        data = JSON.parse(data);
    }
    /*
    * `metadata` has title, author, copyright, description (notes), height, width, crossword_type
    */
    // determine the type of the crossword
    var kind = data['kind'][0];

    // determine what represents a block
    const BLOCK = data['block'] || '#';
    const EMPTY = data['empty'] || '0';

    // We only support "crossword" for now
    // TODO: add in acrostic support
    if (kind.indexOf('crossword') !== -1) {
        var crossword_type = 'crossword';
    } else {
        throw `${kind} is not supported`;
    }
    var height = data["dimensions"]["height"];
    var width = data["dimensions"]["width"];
    var metadata = {
        'title': data['title'] || '',
        'author': data['author'] || '',
        'copyright': data['copyright'] || '',
        'description': data.intro || '',
        'height': height,
        'width': width,
        'crossword_type': crossword_type
    };

    /*
    * `cells` is an array of cells with the various attributes
      - x and y (0-indexed)
      - "type" = 'block' if it's a block
      - "number" = number if it's numbered
      - "solution" = letter(s) that go in the box
      - others: background-color (RGB), background-shape (circle),
          bottom-bar, right-bar, top-bar, left-bar (= true if exist)
    */
    var cells = [];
    for (var y=0; y < height; y++) {
        for (var x=0; x < width; x++) {
            // the cell is void if the spot is NULL
            var is_void = (data['puzzle'][y][x] === null);
            // number
            var cell_attributes = data['puzzle'][y][x] || {};
            // read in the style attribute
            var style = cell_attributes.style || {};
            if (typeof(cell_attributes) !== 'object') {
                var number = cell_attributes.toString();
            }
            else {
                var number = cell_attributes['cell'];
                if (number === EMPTY) {number = null;}
            }
            if (number === EMPTY || number === BLOCK || number === 0) {
                number = null;
            }
            // solution
            var solution = '';
            try {
                solution = data['solution'][y][x];
            } catch {}
            // type
            var type = null;
            if (solution === BLOCK) {
                type = 'block';
            } else if (data['puzzle'][y][x] === null) {
                type = 'void';
            }
            // filled-in letter
            var letter = null;
            if (data['puzzle'][y][x]) {
                letter = data['puzzle'][y][x].value;
            }
            // bars
            var bars = {};
            if (style.barred) {
                bars['bottom-bar'] = style.barred.includes('B');
                bars['right-bar'] = style.barred.includes('R');
                bars['top-bar'] = style.barred.includes('T');
                bars['left-bar'] = style.barred.includes('L');
            }

            // background shape and color
            background_shape = style.shapebg;
            background_color = style.color;
            // top-right numbers
            var top_right_number = null;
            if (style.mark) {
                top_right_number = style.mark.TR;
                number = style.mark.TL;
                // TODO: we don't currently support bottom numbers
                // we just read them in as `number` or `top_right_number` for now
                if (!number) {number = style.mark.BL;}
                if (!top_right_number) {top_right_number = style.mark.BR;}
            }

            var new_cell = {
                x: x,
                y: y,
                solution: solution,
                number: number,
                type: type,
                "background-color": background_color,
                "background-shape": background_shape,
                letter: letter,
                top_right_number: top_right_number,
                is_void: is_void,
                clue: null,
                value: null,
                "bottom-bar": bars['bottom-bar'] || null,
                "right-bar": bars['right-bar'] || null,
                "top-bar": bars['top-bar'] || null,
                "left-bar": bars['left-bar'] || null
            };
            cells.push(new_cell);
        } // end for x
    } // end for y

    /*
    * `clues` is an array of (usually) two objects.
       each object within has a "title" key whose value is generally "ACROSS" or "DOWN"
       and a "clue" key, whose value is an array of clues.
       Each "clue" key has
         - a "text" value which is the actual clue
         - a "word" which is the associated word ID
         - an optional "number"
    */
    var clues = [];
    var words = [];
    word_id = 1;
    // Iterate through the titles of the clues
    var titles = Object.keys(data['clues']);
    if (titles === ['Down', 'Across']) {titles = ['Across', 'Down'];}
    titles.forEach( function(title) {
        var thisClues = [];
        data['clues'][title].forEach( function (clue) {
            var number, text;
            // a "clue" can be an array or an object
            if (Array.isArray(clue)) {
                number = clue[0];
                text = clue[1];
            } else {
                number = clue.number;
                text = clue.clue;
            }
            thisClues.push({'word': word_id, 'number': number, 'text': text});
            // Cells are coupled with clues in iPuz
            if (clue.cells) {
                var thisCells = [];
                clue.cells.forEach(function (thisCell) {
                    thisCells.push([thisCell[0]-1, thisCell[1]-1]);
                });
                words.push({'id': word_id, 'cells': thisCells});
            }
            word_id += 1;
        });
        clues.push({'title': title, 'clue': thisClues});
    });

    /*
    * `words` is an array of objects, each with an "id" and a "cells" attribute
      "id" is just a unique number to match up with the clues.
      "cells" is an array of objects giving the x and y values, in order
    */
    // We only do this if we haven't already populated `words`
    if (!words.length) {
        var thisGrid = new xwGrid(data['solution'], block=BLOCK);
        var word_id = 1;
        var acrossEntries = thisGrid.acrossEntries();
        Object.keys(acrossEntries).forEach(function(i) {
            var thisWord = {'id': word_id++, 'cells': acrossEntries[i]['cells']};
            words.push(thisWord);
        });
        var downEntries = thisGrid.downEntries();
        Object.keys(downEntries).forEach(function(i) {
            var thisWord = {'id': word_id++, 'cells': downEntries[i]['cells']};
            words.push(thisWord);
        });
    }

    return new JSCrossword(metadata, cells, words, clues);
}

function xw_write_ipuz(metadata, cells, words, clues) {
}
