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
/**
* JPZ reading/writing functions
* copyright (c) 2021 Crossword Nexus
* MIT License https://opensource.org/licenses/MIT
**/

// helper function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

function XMLElementToString(element) {
    var i,
     node,
     nodename,
     nodes = element.childNodes,
     result = '';
    for (i = 0; (node = nodes[i]); i++) {
        if (node.nodeType === 3) {
            result += node.textContent;
        }
        if (node.nodeType === 1) {
             nodename = node.nodeName;
             result +=
               '<' +
               nodename +
               '>' +
               XMLElementToString(node) +
               '</' +
               nodename +
               '>';
        }
    }
 return result;
}

function xw_read_jpz(data1) {
    var ERR_PARSE_JPZ = 'Error parsing JPZ file.';
    // check if it's zipped
    var data;
    if (data1.match(/^<\?xml/)) {
        data = data1;
    }
    else {
        var unzip = new JSUnzip();
        var result = unzip.open(data1);
        // there should only be one file in here
        for (var n in unzip.files) {
            var result2 = unzip.read(n);
            data = result2.data;
            break;
        }
    }
    data = BinaryStringToUTF8String(data);
    // create a DOMParser object
    var xml_string = data.replace('&nbsp;', ' ');
    var parser, xmlDoc;
    if (window.DOMParser) {
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(xml_string, 'text/xml');
    } else {
        // Internet Explorer
        xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
        xmlDoc.async = false;
        xmlDoc.loadXML(xml_string);
    }
    var crossword, puzzle, jpz_metadata;
    puzzle = xmlDoc.getElementsByTagName('rectangular-puzzle');
    if (!puzzle.length) {
        console.log(ERR_PARSE_JPZ);
        return;
    }

    // determine the type of the crossword
    var CROSSWORD_TYPES = ['crossword', 'coded', 'acrostic'];
    var crossword_type;
    for (var _i = 0; _i < CROSSWORD_TYPES.length; _i++) {
        crossword_type = CROSSWORD_TYPES[_i];
        crossword = xmlDoc.getElementsByTagName(crossword_type);
        if (crossword.length > 0) {
            break;
        }
    }
    crossword = crossword[0];

    // metadata
    jpz_metadata = puzzle[0].getElementsByTagName('metadata');
    if (!jpz_metadata.length) {
        console.log('could not find metadata');
        return;
    }

    var metadata = {'title': '', 'author': '', 'copyright': '', 'description': ''};

    var title = jpz_metadata[0].getElementsByTagName('title');
    var creator = jpz_metadata[0].getElementsByTagName('creator');
    var copyright = jpz_metadata[0].getElementsByTagName('copyright');
    var description = jpz_metadata[0].getElementsByTagName('description');

    if (title.length) {
        metadata['title'] = XMLElementToString(title[0]);
    }
    if (creator.length) {
        metadata['author'] = XMLElementToString(creator[0]);
    }
    if (copyright.length) {
        metadata['copyright'] = XMLElementToString(copyright[0]);
    }
    if (description.length) {
        description = XMLElementToString(description[0]);
    }

    metadata['crossword_type'] = crossword_type;

    // logic for check/reveal buttons
    var applet_settings = xmlDoc.getElementsByTagName('applet-settings');
    if (applet_settings.length) {
        var elt = applet_settings[0].getElementsByTagName('solution');
        if (!elt.length) {
            metadata['has_reveal'] = false;
        }
    }

    // solved message
    var completion = xmlDoc.getElementsByTagName('completion');
    if (completion.length) {
        metadata['completion_message'] = XMLElementToString(completion[0]);
    }

    // cells
    var cells = [];
    var i,
        cell,
        word,
        clues_block,
        grid = crossword.getElementsByTagName('grid')[0],
        grid_look = grid.getElementsByTagName('grid-look')[0],
        xml_cells = grid.getElementsByTagName('cell'),
        xml_words = crossword.getElementsByTagName('word'),
        xml_clues = crossword.getElementsByTagName('clues');

    metadata.width = Number(grid.getAttribute('width'));
    metadata.height = Number(grid.getAttribute('height'));

    for (i=0; (cell = xml_cells[i]); i++) {
        var new_cell = {
            x: Number(cell.getAttribute('x')) - 1,
            y: Number(cell.getAttribute('y')) - 1,
            solution: cell.getAttribute('solution'),
            number: cell.getAttribute('number'),
            type: cell.getAttribute('type'),
            "background-color": cell.getAttribute('background-color'),
            "background-shape": cell.getAttribute('background-shape'),
            letter: cell.getAttribute('solve-state'),
            top_right_number: cell.getAttribute('top-right-number'),
            is_void: cell.getAttribute('type') === 'void',
            clue: cell.getAttribute('type') === 'clue',
            value: cell.textContent
        };

        // for barred puzzles
        if (
          cell.getAttribute('top-bar') ||
          cell.getAttribute('bottom-bar') ||
          cell.getAttribute('left-bar') ||
          cell.getAttribute('right-bar')
        ) {
            new_cell.bar = {
              top: cell.getAttribute('top-bar') === 'true',
              bottom: cell.getAttribute('bottom-bar') === 'true',
              left: cell.getAttribute('left-bar') === 'true',
              right: cell.getAttribute('right-bar') === 'true',
            };
        }
        cells.push(new_cell);
    }

    // WORDS
    var words = [];
    for (i = 0; (word = xml_words[i]); i++) {
        var id = word.getAttribute('id');
        var x = word.getAttribute('x');
        var y = word.getAttribute('y');
        var word_cells = [];
        if (x && y) {
            var split_x = x.split('-');
            var split_y = y.split('-');
            if (split_x.length > 1) {
                var x_from = Number(split_x[0]); var x_to = Number(split_x[1]);
                var y1 = Number(split_y[0]);
                for (var k=x_from;
                    (x_from < x_to ? k <= x_to : k >= x_to);
                    (x_from < x_to ? k++ : k--)) {
                    word_cells.push([k-1, y1-1]);
                }
            } else if (split_y.length > 1) {
                var y_from = Number(split_y[0]); var y_to = Number(split_y[1]);
                var x1 = Number(split_x[0]);
                for (var k=y_from;
                    (y_from < y_to ? k <= y_to : k >= y_to);
                    (y_from < y_to ? k++ : k--)) {
                    word_cells.push([x1-1, k-1]);
                }
            } else {
                word_cells.push([split_x[0], split_y[0]]);
            }
        } else {
            // the word must have "cells" attributes
            var wc = word.getElementsByTagName('cells');
            for (var j=0; j<wc.length; j++) {
                cell = wc[j];
                x = cell.getAttribute('x');
                y = cell.getAttribute('y');
                word_cells.push([x-1, y-1]);
            }
        }
        words.push({'id': id, 'cells': word_cells});
    }

    // CLUES
    var clues = [];
    if (crossword_type == 'coded') {
        // pass: no clues
    } else {
        for (i = 0; (clues_block = xml_clues[i]); i++) {
            var title_el = clues_block.getElementsByTagName('title')[0];
            var clues_el = clues_block.getElementsByTagName('clue');
            var title = title_el.textContent.trim();
            var this_clue = [];
            var k, clue;
            for (k=0; clue = clues_el[k]; k++) {
                var word_id = clue.getAttribute('word');
                var clue_number = clue.getAttribute('number');
                var text = clue.innerHTML.trim();
                this_clue.push({'text': text, 'word': word_id, 'number': clue_number});
            }
            clues.push({'title': title, 'clue': this_clue});
        }
    }

    return new JSCrossword(metadata, cells, words, clues);
}

function xw_write_jpz(metadata, cells, words, clues) {
    var i, j;
    var title = escapeHtml(metadata.title);
    var author = escapeHtml(metadata.author);
    var copyright = escapeHtml(metadata.copyright);
    var description = escapeHtml(metadata.description);
    var jpz_string = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler-applet xmlns="http://crossword.info/xml/crossword-compiler">
<applet-settings width="720" height="600" cursor-color="#00FF00" selected-cells-color="#80FF80">
<completion friendly-submit="false" only-if-correct="true">Congratulations!  The puzzle is solved correctly</completion>
<actions graphical-buttons="false" wide-buttons="false" buttons-layout="left"><reveal-word label="Reveal Word"></reveal-word><reveal-letter label="Reveal"></reveal-letter><check label="Check"></check><solution label="Solution"></solution><pencil label="Pencil"></pencil></actions>
</applet-settings>
<rectangular-puzzle xmlns="http://crossword.info/xml/rectangular-puzzle" alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ">
<metadata>
<title>${title}</title>
<creator>${author}</creator>
<copyright>${copyright}</copyright>
<description>${description}</description>
</metadata>
<crossword>
<grid width="${metadata.width}" height="${metadata.height}">
<grid-look hide-lines="true" cell-size-in-pixels="25" />\n`;
    /* take care of cells in the grid */
    for (i=0; i<cells.length; i++) {
        var cell = cells[i];
        var clue_attrs = '';
        var cell_arr = Object.keys(cell);
        for (var j=0; j < cell_arr.length; j++) {
            var my_key = cell_arr[j];
            var my_val = cell[my_key];
            if (my_key == 'x' || my_key == 'y') {
                my_val = Number(my_val) + 1;
            }
            clue_attrs += `${my_key}="${my_val}" `;
        }
        jpz_string += `        <cell ${clue_attrs} />\n`;
    }
    jpz_string += "    </grid>\n";
    /* take care of the words */
    for (i=0; i<words.length; i++) {
        var word = words[i];
        jpz_string += `    <word id="${word.id}">\n`;
        for (j=0; j<word.cells.length; j++) {
            var word_cell = word.cells[j];
            var this_x = Number(word_cell[0]) + 1;
            var this_y = Number(word_cell[1]) + 1;
            jpz_string += `        <cells x="${this_x}" y="${this_y}" />\n`;
        }
        jpz_string += `    </word>\n`;
    }

    /* clues */
    for (i=0; i < clues.length; i++) {
        jpz_string += `    <clues ordering="normal">\n`;
        jpz_string += `        <title>${clues[i].title}</title>\n`;
        for (j=0; j < clues[i].clue.length; j++) {
            var my_clue = clues[i].clue[j];
            var my_clue_text = escapeHtml(my_clue.text);
            jpz_string += `        <clue word="${my_clue.word}" number="${my_clue.number}">${my_clue_text}</clue>\n`;
        }
        jpz_string += `    </clues>\n`;
    }
    jpz_string += `</crossword>
</rectangular-puzzle>
</crossword-compiler-applet>\n`;
    return jpz_string;
}
/**
* Class for a crossword grid
**/
class xwGrid {
    constructor(soln_arr, block='.') {
        this.solution = soln_arr;
        this.block = block;
        // width and height
        this.height = soln_arr.length;
        this.width = soln_arr[0].length;
        // Grid numbering
        this.numbers = this.gridNumbering();
    }
    isBlack(x, y) {
        return this.solution[y][x] === this.block;
    }
    startAcrossWord(x, y) {
        return (x === 0 || this.isBlack(x - 1, y)) && x < this.width - 1 && !this.isBlack(x, y) && !this.isBlack(x + 1, y);
    }
    startDownWord(x, y) {
        return (y === 0 || this.isBlack(x, y - 1)) && y < this.height - 1 && !this.isBlack(x, y) && !this.isBlack(x, y + 1);
    }
    letterAt(x, y) {
        return this.solution[y][x];
    }
    gridNumbering() {
        var numbers = [];
        var thisNumber = 1;
        for (var y=0; y < this.height; y++) {
            var thisNumbers = [];
            for (var x=0; x < this.width; x++) {
                if (this.startAcrossWord(x, y) || this.startDownWord(x, y)) {
                    thisNumbers.push(thisNumber);
                    thisNumber += 1;
                }
                else {
                    thisNumbers.push(0);
                }
            }
            numbers.push(thisNumbers);
        }
        return numbers;
    }

    acrossEntries() {
        var acrossEntries = {}, x, y, thisNum;
        for (y = 0; y < this.height; y++) {
            for (x = 0; x < this.width; x++) {
                if (this.startAcrossWord(x, y)) {
                    thisNum = this.numbers[y][x];
                    if (!acrossEntries[thisNum] && thisNum) {
                        acrossEntries[thisNum] = {'word': '', 'cells': []};
                    }
                }
                if (!this.isBlack(x, y) && thisNum) {
                    var letter = this.letterAt(x, y);
                    acrossEntries[thisNum]['word'] += letter;
                    acrossEntries[thisNum]['cells'].push([x, y]);
                }
            }
        }
        return acrossEntries;
    }

    downEntries() {
        var downEntries = {}, x, y, thisNum;
        for (x = 0; x < this.width; x++) {
            for (y = 0; y < this.height; y++) {
                if (this.startDownWord(x, y)) {
                    thisNum = this.numbers[y][x];
                    if (!downEntries[thisNum] && thisNum) {
                        downEntries[thisNum] = {'word': '', 'cells': []};
                    }
                }
                if (!this.isBlack(x, y) && thisNum) {
                    var letter = this.letterAt(x, y);
                    downEntries[thisNum]['word'] += letter;
                    downEntries[thisNum]['cells'].push([x, y]);
                }
            }
        }
        return downEntries;
    }
}

/**
* Since we're reading everything in as a binary string
* we need a function to convert to a UTF-8 string
* Note that if .readAsBinaryString() goes away,
* we will have to change both this and the reading method.
**/
function BinaryStringToUTF8String(x) {
    // convert to bytes array
    var bytes = [];
    for (var i = 0; i < x.length; ++i) {
      var code = x.charCodeAt(i);
      bytes.push([code]);
    }
    var bytes1 = new Uint8Array(bytes);
    return new TextDecoder("utf-8").decode(bytes1);
}

// function to get an index from an i, j, and width
function xw_ij_to_index(i, j, w) {
    return j * w + i;
}

// function to convert an index to i, j
function xw_index_to_ij(ix, w) {
    var j = Math.floor(ix/w);
    var i = ix - j*w;
    return [i, j];
}

/** Generic file download function **/
function file_download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

class JSCrossword {
    /*
    * `metadata` has
      - title, author, copyright, description (notes)
      - height, width
      - crossword_type (crossword, coded, acrostic)
      OPTIONAL:
      - has_reveal (default: true)
      - completion_message
    * `cells` is an array of cells with the various attributes
      - x and y (0-indexed)
      - "type" = 'block' if it's a block
      - "number" = number if it's numbered
      - "solution" = letter(s) that go in the box
      - others: background-color (RGB), background-shape (circle),
          bottom-bar, right-bar, top-bar, left-bar (= true if exist)
          top_right_number
          value (a filled-in letter, if any)

    * `words` is an array of objects, each with an "id" and a "cells" attribute
      "id" is just a unique number to match up with the clues.
      "cells" is an array of objects giving the x and y values, in order
    * `clues` is an array of (usually) two objects.
       each object within has a "title" key whose value is generally "ACROSS" or "DOWN"
       and a "clue" key, whose value is an array of clues.
       Each "clue" key has
         - a "text" value which is the actual clue
         - a "word" which is the associated word ID
         - an optional "number"
    */
    constructor(metadata, cells, words, clues) {
        this.metadata = metadata;
        this.cells = cells;
        this.words = words;
        this.clues = clues;
    }

    //CROSSWORD_TYPES = ['crossword', 'coded', 'acrostic'];

    /**
    * useful functions
    **/

    /** Create a solution array **/
    create_solution_array() {
        // initialize an empty array given the width and height
        var h = this.metadata.height;
        var w = this.metadata.width;
        var solutionArray = Array.from({ length: h }, () =>
            Array.from({ length: w }, () => false)
        );
        // Loop through the "cells" array and populate
        this.cells.forEach(function(c) {
            solutionArray[c.y][c.x] = c.solution;
        });
        this.solution_array = solutionArray;
    }

    /** Get the solution array **/
    get_solution_array() {
        if (!this.solution_array) {
            this.create_solution_array();
        }
        return this.solution_array;
    }

    /** Create a mapping of word ID to entry **/
    create_entry_mapping() {
        var soln_arr = this.get_solution_array();
        var entryMapping = {};
        this.words.forEach(function(w) {
            var _id = w.id;
            var entry = '';
            w.cells.forEach(function(arr) {
                entry += soln_arr[arr[1]][arr[0]];
            });
            entryMapping[_id] = entry;
        });
        this.entry_mapping = entryMapping;
    }

    /** Get the entry mapping **/
    get_entry_mapping() {
        if (!this.entry_mapping) {
            this.create_entry_mapping();
        }
        return this.entry_mapping;
    }

    /**
    * Read in data from various file formats
    **/

    /** puz **/
    // requires puz_read_write.js
    fromPuz(contents) {
        // Read data into a puzapp
        var puzdata = PUZAPP.parsepuz(contents);
        return jscrossword_from_puz(puzdata);
    }

    /** JPZ **/
    // requires jpz_read_write.js (and JSZip??)
    fromJPZ(data) {
        return xw_read_jpz(data);
    }

    /** iPUZ **/
    // requires ipuz_read_write.js
    fromIpuz(data) {
        return xw_read_ipuz(data);
    }

    /* try to determine the puzzle type */
    fromData(data) {
        try {
            var puzdata = PUZAPP.parsepuz(data);
            return jscrossword_from_puz(puzdata);
        } catch (error) {
            try {
                return xw_read_jpz(data);
            } catch (error2) {
                return xw_read_ipuz(data);
            }
        }
    }

    /**
    * Write data for downloads
    **/

    /**
    * write JPZ
    **/
    toJPZString() {
        return xw_write_jpz(this.metadata, this.cells, this.words, this.clues);
    }
}

/**
* Secure Hash Algorithm (SHA1)
* http://www.webtoolkit.info/
**/
// This is helpful for checking if IPUZ-locked files are correctly solved
function SHA1(r){function o(r,o){return r<<o|r>>>32-o}function e(r){var o,e="";for(o=7;o>=0;o--)e+=(r>>>4*o&15).toString(16);return e}var t,a,h,n,C,c,f,d,A,u=new Array(80),g=1732584193,i=4023233417,s=2562383102,S=271733878,m=3285377520,p=(r=function(r){r=r.replace(/\r\n/g,"\n");for(var o="",e=0;e<r.length;e++){var t=r.charCodeAt(e);t<128?o+=String.fromCharCode(t):t>127&&t<2048?(o+=String.fromCharCode(t>>6|192),o+=String.fromCharCode(63&t|128)):(o+=String.fromCharCode(t>>12|224),o+=String.fromCharCode(t>>6&63|128),o+=String.fromCharCode(63&t|128))}return o}(r)).length,l=new Array;for(a=0;a<p-3;a+=4)h=r.charCodeAt(a)<<24|r.charCodeAt(a+1)<<16|r.charCodeAt(a+2)<<8|r.charCodeAt(a+3),l.push(h);switch(p%4){case 0:a=2147483648;break;case 1:a=r.charCodeAt(p-1)<<24|8388608;break;case 2:a=r.charCodeAt(p-2)<<24|r.charCodeAt(p-1)<<16|32768;break;case 3:a=r.charCodeAt(p-3)<<24|r.charCodeAt(p-2)<<16|r.charCodeAt(p-1)<<8|128}for(l.push(a);l.length%16!=14;)l.push(0);for(l.push(p>>>29),l.push(p<<3&4294967295),t=0;t<l.length;t+=16){for(a=0;a<16;a++)u[a]=l[t+a];for(a=16;a<=79;a++)u[a]=o(u[a-3]^u[a-8]^u[a-14]^u[a-16],1);for(n=g,C=i,c=s,f=S,d=m,a=0;a<=19;a++)A=o(n,5)+(C&c|~C&f)+d+u[a]+1518500249&4294967295,d=f,f=c,c=o(C,30),C=n,n=A;for(a=20;a<=39;a++)A=o(n,5)+(C^c^f)+d+u[a]+1859775393&4294967295,d=f,f=c,c=o(C,30),C=n,n=A;for(a=40;a<=59;a++)A=o(n,5)+(C&c|C&f|c&f)+d+u[a]+2400959708&4294967295,d=f,f=c,c=o(C,30),C=n,n=A;for(a=60;a<=79;a++)A=o(n,5)+(C^c^f)+d+u[a]+3395469782&4294967295,d=f,f=c,c=o(C,30),C=n,n=A;g=g+n&4294967295,i=i+C&4294967295,s=s+c&4294967295,S=S+f&4294967295,m=m+d&4294967295}return(A=e(g)+e(i)+e(s)+e(S)+e(m)).toLowerCase()}
/*
 * JSUnzip
 *
 * Copyright (c) 2011 by Erik Moller
 * All Rights Reserved
 *
 * This software is provided 'as-is', without any express
 * or implied warranty.  In no event will the authors be
 * held liable for any damages arising from the use of
 * this software.
 *
 * Permission is granted to anyone to use this software
 * for any purpose, including commercial applications,
 * and to alter it and redistribute it freely, subject to
 * the following restrictions:
 *
 * 1. The origin of this software must not be
 *    misrepresented; you must not claim that you
 *    wrote the original software. If you use this
 *    software in a product, an acknowledgment in
 *    the product documentation would be appreciated
 *    but is not required.
 *
 * 2. Altered source versions must be plainly marked
 *    as such, and must not be misrepresented as
 *    being the original software.
 *
 * 3. This notice may not be removed or altered from
 *    any source distribution.
 */

 /* Minified code -- the original is at https://github.com/operasoftware/jsunzip/blob/master/source/jsunzip.js */

var tinf;function JSUnzip(){"use strict";this.getInt=function(t,e){switch(e){case 4:return this.data[t+3]<<24|this.data[t+2]<<16|this.data[t+1]<<8|this.data[t+0];case 2:return this.data[t+1]<<8|this.data[t+0];default:return this.data[t]}},this.getDOSDate=function(t,e){return new Date(1980+(t>>>9&127),(t>>>5&15)-1,31&t,e>>>11&31,e>>>5&63,2*(31&e))},this.stringOf=function(t){for(var e="",s=0;s<t.length;++s)e+=String.fromCharCode(t[s]);return e},this.open=function(t){var e;if("string"==typeof t)for(this.data=new Uint8Array(t.length),e=0;e<t.length;++e)this.data[e]=255&t.charCodeAt(e);else this.data=t;if(this.files=[],this.data.length<22)return{status:!1,error:"Invalid data"};for(var s=this.data.length-22;s>=0&&101010256!=this.getInt(s,4);)--s;if(s<0)return{status:!1,error:"Invalid data"};if(0!==this.getInt(s+4,2)||0!==this.getInt(s+6,2))return{status:!1,error:"No multidisk support"};var i=this.getInt(s+8,2),r=this.getInt(s+16,4),n=this.getInt(s+20,2);this.comment=this.stringOf(this.data.subarray(s+22,s+22+n));var a=r;for(e=0;e<i;++e){if(33639248!=this.getInt(a+0,4))return{status:!1,error:"Invalid data"};if(this.getInt(a+6,2)>20)return{status:!1,error:"Unsupported version"};if(1&this.getInt(a+8,2))return{status:!1,error:"Encryption not implemented"};var h=this.getInt(a+10,2);if(0!==h&&8!==h)return{status:!1,error:"Unsupported compression method"};var o=this.getInt(a+12,2),d=this.getInt(a+14,2),u=this.getDOSDate(d,o),c=(this.getInt(a+16,4),this.getInt(a+20,4)),l=this.getInt(a+24,4),f=this.getInt(a+28,2),b=this.getInt(a+30,2),g=this.getInt(a+32,2),_=this.getInt(a+42,4),I=this.stringOf(this.data.subarray(a+46,a+46+f)),v=this.stringOf(this.data.subarray(a+46+f+b,a+46+f+b+g));if(67324752!=this.getInt(_+0,4))return{status:!1,error:"Invalid data"};var m=_+30+this.getInt(_+26,2)+this.getInt(_+28,2);this.files[I]={fileComment:v,compressionMethod:h,compressedSize:c,uncompressedSize:l,localFileContent:m,lastModifiedDate:u},a+=46+f+b+g}return{status:!0}},this.readBinary=function(t){var e=this.files[t];if(e){if(8==e.compressionMethod){tinf||(tinf=new TINF).init();var s=tinf.uncompress(this.data,e.localFileContent,e.uncompressedSize);return s.status==tinf.OK?{status:!0,data:s.data}:{status:!1,error:s.error}}return{status:!0,data:this.data.subarray(e.localFileContent,e.localFileContent+e.uncompressedSize)}}return{status:!1,error:"File '"+t+"' doesn't exist in zip"}},this.read=function(t){var e=this.readBinary(t);return e.data&&(e.data=this.stringOf(e.data)),e}}function TINF(){this.OK=0,this.DATA_ERROR=-3,this.TREE=function(){this.table=new Array(16),this.trans=new Array(288)},this.DATA=function(t){this.source="",this.sourceIndex=0,this.tag=0,this.bitcount=0,this.dest=[],this.ltree=new t.TREE,this.dtree=new t.TREE},this.sltree=new this.TREE,this.sdtree=new this.TREE,this.length_bits=new Array(30),this.length_base=new Array(30),this.dist_bits=new Array(30),this.dist_base=new Array(30),this.clcidx=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],this.build_bits_base=function(t,e,s,i){var r,n;for(r=0;r<s;++r)t[r]=0;for(r=0;r<30-s;++r)t[r+s]=Math.floor(r/s);for(n=i,r=0;r<30;++r)e[r]=n,n+=1<<t[r]},this.build_fixed_trees=function(t,e){var s;for(s=0;s<7;++s)t.table[s]=0;for(t.table[7]=24,t.table[8]=152,t.table[9]=112,s=0;s<24;++s)t.trans[s]=256+s;for(s=0;s<144;++s)t.trans[24+s]=s;for(s=0;s<8;++s)t.trans[168+s]=280+s;for(s=0;s<112;++s)t.trans[176+s]=144+s;for(s=0;s<5;++s)e.table[s]=0;for(e.table[5]=32,s=0;s<32;++s)e.trans[s]=s},this.build_tree=function(t,e,s,i){var r,n,a=new Array(16);for(r=0;r<16;++r)t.table[r]=0;for(r=0;r<i;++r)t.table[e[s+r]]++;for(t.table[0]=0,n=0,r=0;r<16;++r)a[r]=n,n+=t.table[r];for(r=0;r<i;++r)e[s+r]&&(t.trans[a[e[s+r]]++]=r)},this.getbit=function(t){var e;return t.bitcount--||(t.tag=t.source[t.sourceIndex++],t.bitcount=7),e=1&t.tag,t.tag>>>=1,e},this.read_bits=function(t,e,s){if(!e)return s;for(var i;t.bitcount<24;)t.tag=t.tag|t.source[t.sourceIndex++]<<t.bitcount,t.bitcount+=8;return i=t.tag&65535>>>16-e,t.tag>>>=e,t.bitcount-=e,i+s},this.decode_symbol=function(t,e){for(;t.bitcount<24;)t.tag=t.tag|t.source[t.sourceIndex++]<<t.bitcount,t.bitcount+=8;var s=0,i=0,r=0;do{i=2*i+((t.tag&1<<r)>>>r),++r,s+=e.table[r],i-=e.table[r]}while(i>=0);return t.tag>>>=r,t.bitcount-=r,e.trans[s+i]},this.decode_trees=function(t,e,s){var i,r,n,a,h,o,d=new this.TREE;for(lengths=new Array(320),i=this.read_bits(t,5,257),r=this.read_bits(t,5,1),n=this.read_bits(t,4,4),a=0;a<19;++a)lengths[a]=0;for(a=0;a<n;++a){var u=this.read_bits(t,3,0);lengths[this.clcidx[a]]=u}for(this.build_tree(d,lengths,0,19),h=0;h<i+r;){var c=this.decode_symbol(t,d);switch(c){case 16:var l=lengths[h-1];for(o=this.read_bits(t,2,3);o;--o)lengths[h++]=l;break;case 17:for(o=this.read_bits(t,3,3);o;--o)lengths[h++]=0;break;case 18:for(o=this.read_bits(t,7,11);o;--o)lengths[h++]=0;break;default:lengths[h++]=c}}this.build_tree(e,lengths,0,i),this.build_tree(s,lengths,i,r)},this.inflate_block_data=function(t,e,s){for(var i=t.dest,r=t.destIndex;;){var n,a,h,o,d=this.decode_symbol(t,e);if(256==d)return t.destIndex=r,this.OK;if(d<256)i[r++]=d;else for(d-=257,n=this.read_bits(t,this.length_bits[d],this.length_base[d]),a=this.decode_symbol(t,s),o=h=r-this.read_bits(t,this.dist_bits[a],this.dist_base[a]);o<h+n;++o)i[r++]=i[o]}},this.inflate_uncompressed_block=function(t){var e,s;if((e=256*(e=t.source[t.sourceIndex+1])+t.source[t.sourceIndex])!=(65535&~(256*t.source[t.sourceIndex+3]+t.source[t.sourceIndex+2])))return this.DATA_ERROR;for(t.sourceIndex+=4,s=e;s;--s)t.dest[t.destIndex]=t.source[t.sourceIndex++];return t.bitcount=0,this.OK},this.inflate_fixed_block=function(t){return this.inflate_block_data(t,this.sltree,this.sdtree)},this.inflate_dynamic_block=function(t){return this.decode_trees(t,t.ltree,t.dtree),this.inflate_block_data(t,t.ltree,t.dtree)},this.init=function(){this.build_fixed_trees(this.sltree,this.sdtree),this.build_bits_base(this.length_bits,this.length_base,4,3),this.build_bits_base(this.dist_bits,this.dist_base,2,1),this.length_bits[28]=0,this.length_base[28]=258},this.uncompress=function(t,e,s){var i,r=new this.DATA(this);r.source=t,r.sourceIndex=e,r.bitcount=0,r.dest=new Uint8Array(s),r.destIndex=0;do{var n;switch(i=this.getbit(r),this.read_bits(r,2,0)){case 0:n=this.inflate_uncompressed_block(r);break;case 1:n=this.inflate_fixed_block(r);break;case 2:n=this.inflate_dynamic_block(r);break;default:return{status:this.DATA_ERROR}}if(n!=this.OK)return{status:this.DATA_ERROR}}while(!i);return{status:this.OK,data:r.dest}}}
/**
* PUZ reading/writing functions

* Parts of this code from xroz
* xroz - play crosswords within your browser
* Author: Alex Stangl  8/14/2011
* Copyright 2011, Alex Stangl. All Rights Reserved.
* Licensed under ISC license (see LICENSE file)
* https://github.com/astangl/xroz/blob/master/LICENSE

* Other parts from Confuzzle
* Copyright (c) 2020 Rowan Katekar
* https://github.com/rjkat/confuzzle
* MIT license

* Remainder of this code (c) 2016-2021 Alex Boisvert
* licensed under MIT license
* https://opensource.org/licenses/MIT
**/

/*jslint browser: true, bitwise: true, plusplus: true */
var ActiveXObject, parsedPuz, filecontents, PUZAPP = {};
(function () {
    "use strict";

    // return whether browser supports local storage
    function supportsLocalStorage() {
        try {
            return window.localStorage !== undefined && window.localStorage !== null;
        } catch (e) {
            return false;
        }
    }

    // Conditionally convert to UTF-8 (based on .puz version)
    function StringConverter(version) {
        if (version.startsWith('1.')) { // iso-8859-1
            return function(x) {return x;}
        }
        else {
            return function(x) { return BinaryStringToUTF8String(x);}
        }
    }

    // get a binary byte from a string (bytes) at position offset
    function getByte(bytes, offset) {
        return bytes.charCodeAt(offset) % 256;
    }

    // pop items from end of array adding them to accumulator until either
    // array exhausted or next element from array would cause accumulator to exceed threshold
    // returns accumulator. arr is destructively modified, reflecting all the pops.
    function popWhileLessThanOrEqual(threshold, arr) {
        var acc = 0, l;
        for (l = arr.length - 1; l >= 0 && arr[l] + acc <= threshold; --l) {
            acc += arr.pop();
        }
        return acc;
    }

    // return sum of all numbers in array
    function sumArray(arr) {
        var acc = 0, i;
        for (i = 0; i < arr.length; ++i) {
            acc += arr[i];
        }
        return acc;
    }

    // return index of first occurrence of specified element in array, or -1 if not found
    function findInArray(arr, element) {
        var i;
        for (i = 0; i < arr.length; ++i) {
            if (arr[i] === element) {
                return i;
            }
        }
        return -1;
    }

    function Puz() {
        // define symbolic constants
        this.DIRECTION_ACROSS = 1;
        this.DIRECTION_DOWN = -1;
        this.DIRECTION_UNKNOWN = 0;

        // immutable fields (unchanged after initialization): CONSTANTS, solution, url,
        //      supportsLocalStorage, width, height, gext, acrossWordNbrs, downWordNbrs,
        //      padding (for now), sqNbrs, strings, canv, minPixmult
        //      version, nbrClues, acrossClues, downClues, leftContainer, rightContainer
        //      acrossSqNbrs, downSqNbrs
        // mutable fields: cursorX, cursorY, grid, pixmult, direction, revealSolution,
        //      highlightWordNbr, showingHelp,
        //      direction, highlightWordExtent, highlightClueId, lastClickX, lastClickY

        // return key for putting state into local storage
        this.storageKey = function () {
            return "xroz." + this.url + ".state";
        };

        this.innerHeight = function () {
            return document.getElementsByTagName("html")[0].clientHeight - this.BODY_MARGIN * 2;
        };
        this.innerWidth = function () {
            return document.getElementsByTagName("html")[0].clientWidth - this.BODY_MARGIN * 2;
        };
        this.toIndex = function (x, y) {
            return y * this.width + x;
        };
        this.fromIndex = function (index) {
            return [index % this.width, Math.floor(index / this.width)];
        };
        this.isBlack = function (x, y) {
            return this.solution.charAt(this.toIndex(x, y)) === '.';
        };
        this.cursorBlack = function () {
            return this.isBlack(this.cursorX, this.cursorY);
        };
        this.circled = function (index) {
            return this.gext !== undefined && (getByte(this.gext, index) & 0x80) !== 0;
        };
        this.startDownWord = function (x, y) {
            return (y === 0 || this.isBlack(x, y - 1)) && y < this.height - 1 && !this.isBlack(x, y) && !this.isBlack(x, y + 1);
        };
        this.startAcrossWord = function (x, y) {
            return (x === 0 || this.isBlack(x - 1, y)) && x < this.width - 1 && !this.isBlack(x, y) && !this.isBlack(x + 1, y);
        };

        // return word associated with (x,y) based upon current direction, or 0 if N/A
        this.getWordNbr = function (x, y) {
            var direction = this.direction,
            index = this.toIndex(x, y);
            if (direction === this.DIRECTION_UNKNOWN) {
                return 0;
            }
            return direction === this.DIRECTION_ACROSS ? this.acrossWordNbrs[index] : this.downWordNbrs[index];
        };

        // store flag indicating whether browser supports local storage.
        //TODO this may be a premature optimization; figure out whether caching this is really worthwhile
        this.supportsLocalStorage = supportsLocalStorage();
    }

    function getShort(bytes, offset) {
        return getByte(bytes, offset) + getByte(bytes, offset + 1) * 256;
    }

    function cksum_region(bytes, base, len, cksum) {
        var i;
        for (i = 0; i < len; ++i) {
            if (cksum % 2) {
                cksum = (cksum - 1) / 2 + 0x8000;
            } else {
                cksum /= 2;
            }
            cksum += getByte(bytes, base + i);
        }

        return cksum;
    }

    // return offset of nth occurrence of myChar
    function findOffsetOfNth(bytes, startOffset, myChar, n) {
        var offset = startOffset;
        while (n > 0) {
            if (bytes[offset++] === myChar) {
                n--;
            }
        }
        return offset;
    }

    function parsePuz(bytes) {
        //TODO check checksums
		var sanity_check = bytes.match('ACROSS&DOWN');
		if (!sanity_check)
		{
			console.log('Not a .puz file!');
			throw {
                name: "BADMAGICNUMBER",
                message: "File did not contain expected magic number, contained '" + filemagic + "'."
            };
		}
        var retval = new Puz(),
        filemagic = bytes.substring(2, 14),
            //filechecksum = getShort(bytes, 0),
            c_cib = cksum_region(bytes, 44, 8, 0),
            w = getByte(bytes, 44),
                h = getByte(bytes, 45),
                wh = w * h,
				grid_offset = 52 + wh,
				strings_offset = grid_offset + wh,
				cksum = cksum_region(bytes, 52, wh, c_cib),
				nbrClues = getShort(bytes, 46),
				extra_offset = findOffsetOfNth(bytes, strings_offset, '\u0000', nbrClues + 4),
				offset = extra_offset,
				sqNbr = 1,
				sqNbrString,
				clueNum = 0,
				index = 0,
				acrossClues = [],
				downClues = [],
				sqNbrs = [],
				downWordNbrs = [],
				acrossWordNbrs = [],
				acrossSqNbrs = [],
				downSqNbrs = [],
				sectName,
				len,
				chksum,
				compChksum,
				x,
				y,
				saw,
				sdw,
				isBlack;
        if (filemagic !== "ACROSS&DOWN\u0000") {
			console.log('Not a .puz file!');
            throw {
                name: "BADMAGICNUMBER",
                message: "File did not contain expected magic number, contained '" + filemagic + "'."
            };
        }
        retval.version = bytes.substring(24, 27);
        var string_convert = StringConverter(retval.version);

        retval.width = w;
        retval.height = h;
        retval.nbrClues = nbrClues;
        retval.solution = string_convert(bytes.substring(52, 52 + wh));
        retval.strings = string_convert(bytes.substring(strings_offset).split('\u0000', nbrClues + 4));
        retval.grid = string_convert(bytes.substring(grid_offset, grid_offset + wh));
        // Replace "solution" with "grid" if the puzzle is filled
        if (retval.grid.indexOf('-') == -1)
		{
			retval.solution = retval.grid;
		}
        cksum = cksum_region(bytes, grid_offset, wh, cksum);
        var acrossWords = {}, downWords = {};
        for (y = 0; y < h; y++) {
            for (x = 0; x < w; x++, index++) {
                sdw = retval.startDownWord(x, y);
                saw = retval.startAcrossWord(x, y);
                sqNbrString = sqNbr.toString();
                sqNbrs.push(sdw || saw ? sqNbrString : "");
                isBlack = retval.isBlack(x, y);
                downWordNbrs.push(sdw ? sqNbr : isBlack || y === 0 ? 0 : downWordNbrs[index - w]);
                acrossWordNbrs.push(saw ? sqNbr : isBlack || x === 0 ? 0 : acrossWordNbrs[index - 1]);
                if (sdw || saw) {
                    if (saw) {
                        acrossClues.push(sqNbr);
                        acrossClues.push(clueNum++);
                        acrossSqNbrs.push(sqNbr);
                    }
                    if (sdw) {
                        downClues.push(sqNbr);
                        downClues.push(clueNum++);
                        downSqNbrs.push(sqNbr);
                    }
                    sqNbr++;
                }
            }
        }
        retval.acrossClues = acrossClues;
        retval.downClues = downClues;
        retval.sqNbrs = sqNbrs;
        retval.acrossWordNbrs = acrossWordNbrs;
        retval.downWordNbrs = downWordNbrs;
        retval.acrossSqNbrs = acrossSqNbrs;
        retval.downSqNbrs = downSqNbrs;
        while (offset < bytes.length) {
            sectName = bytes.substring(offset, offset + 4);
            len = getShort(bytes, offset + 4);
            chksum = getShort(bytes, offset + 6);
            compChksum = cksum_region(bytes, offset + 8, len, 0);
            /*
            if (chksum !== compChksum) {
                throw {
                    name: "BadExtraSectionChecksum",
                    message: "Extra section " + sectName + " had computed checksum " + compChksum + ", versus given checksum " + chksum
                };
            }
            */
            if (sectName === "GEXT") {
                retval.gext = bytes.substring(offset + 8, offset + 8 + len);
            }
            offset += len + 9;
            //console.log("Extra section " + sectName);
        }
        // Now I'm going to add in some more info, explicitly
        // pulling the clues and entries
        retval.title = retval.strings[0];
        retval.author = retval.strings[1];
        retval.copyright = retval.strings[2];
        var all_clues = retval.strings.slice(3,3+retval.nbrClues);
        var across_entries = {}; var down_entries = {};
        var across_clues = {}; var down_clues = {};
        var clues_remaining = retval.nbrClues;
        var across_clue_number = 0; var down_clue_number = 0;
        for (y = 0; y < h; y++) {
            for (x = 0; x < w; x++, index++) {
                sdw = retval.startDownWord(x, y);
                saw = retval.startAcrossWord(x, y);
                isBlack = retval.isBlack(x, y);
                var this_index = retval.toIndex(x,y);
                if (saw)
                {
                    // Start of an across entry
                    // Grab the number
                    across_clue_number = acrossWordNbrs[this_index];
                    // Add the clue
                    across_clues[across_clue_number] = all_clues[0];
                    clues_remaining--;
                    all_clues = all_clues.slice(1,1+clues_remaining);
                    // Start the entry
                    across_entries[across_clue_number] = retval.solution[this_index];
                }
                else if (!isBlack && acrossWordNbrs[this_index] !== 0)
                {
                    across_entries[across_clue_number] += retval.solution[this_index];
                }
                if (sdw)
                {
                    // Start of a down entry
                    // Grab the number
                    down_clue_number = downWordNbrs[this_index];
                    // Add the clue
                    down_clues[down_clue_number] = all_clues[0];
                    clues_remaining--;
                    all_clues = all_clues.slice(1,1+clues_remaining);
                }
            }
        }
        // Check for a notepad
        var additional_clues = retval.strings.slice(3+retval.nbrClues,4+retval.nbrClues);
        retval.notes = '';
        if (additional_clues[0])
        {
            retval.notes = additional_clues[0];
        }
        retval.circles = [];
        // Down entries.  Also circles
        for (x = 0; x < w; x++) {
            for (y = 0; y < h; y++) {
                sdw = retval.startDownWord(x, y);
                isBlack = retval.isBlack(x, y);
                var this_index = retval.toIndex(x,y);
                if (sdw)
                {
                    down_clue_number = downWordNbrs[this_index];
                    // Start the entry
                    down_entries[down_clue_number] = retval.solution[this_index];
                }
                else if (!isBlack && downWordNbrs[this_index] !== 0)
                {
                    down_entries[down_clue_number] += retval.solution[this_index];
                }
                retval.circles[this_index] = retval.circled(this_index);
            }
        }
        retval.across_entries = across_entries;
        retval.across_clues = across_clues;
        retval.down_clues = down_clues;
        retval.down_entries = down_entries;

        // All entries
		var all_entries = [];
		var obj, mynum;
		for (x=0; x<w; x++) {
			for (y=0; y<h; y++) {
				var myindex = retval.toIndex(x, y);
				if (retval.startAcrossWord(x,y)) {
					mynum = retval.acrossWordNbrs[myindex];
					obj = {};
					obj['Number'] = mynum;
					obj['Direction'] = 'Across';
					obj['Clue'] = across_clues[mynum];
					obj['Entry'] = across_entries[mynum];
					obj['x'] = x;
					obj['y'] = y;
					obj['Grid_Order'] = retval.toIndex(x, y);
					all_entries.push(obj);
				}
				if (retval.startDownWord(x,y)) {
					mynum = retval.downWordNbrs[myindex];
					obj = {};
					obj['Number'] = mynum;
					obj['Direction'] = 'Down';
					obj['Clue'] = down_clues[mynum];
					obj['Entry'] = down_entries[mynum];
					obj['x'] = x;
					obj['y'] = y;
					obj['Grid_Order'] = retval.toIndex(x, y);
					all_entries.push(obj);
				}
			}
		}
		retval.all_entries = all_entries;

		PUZAPP.puzdata = retval;

        return retval;
    }

    function is_in_array(arr,obj)
    {
        return (arr.indexOf(obj) != -1);
    }

	function puzdata(filecontents)
	{
		var parsedPuz = parsePuz(filecontents);
		// Add in any additional data we may want
		return parsedPuz;
	}

    PUZAPP.parsepuz = parsePuz;

}());

/**
 * For writing PUZ files
 * https://github.com/rjkat/anagrind/blob/master/client/js/puz.js
 * Released under MIT License
 * https://opensource.org/licenses/MIT
**/

// Strings in puz files are ISO-8859-1.

// From https://www.i18nqa.com/debug/table-iso8859-1-vs-windows-1252.html:
// ISO-8859-1 (also called Latin-1) is identical to Windows-1252 (also called CP1252)
// except for the code points 128-159 (0x80-0x9F). ISO-8859-1 assigns several control
// codes in this range. Windows-1252 has several characters, punctuation, arithmetic
// and business symbols assigned to these code points.
const PUZ_ENCODING = "windows-1252";

const PUZ_HEADER_CONSTANTS = {
    offsets: {
        FILE_CHECKSUM: 0x00,
        MAGIC: 0x02,
        HEADER_CHECKSUM: 0x0E,
        ICHEATED_CHECKSUM: 0x10,
        VERSION: 0x18,
        RES1: 0x1C,
        SCRAMBLED_CHECKSUM: 0x1E,
        RES2: 0x20,
        WIDTH: 0x2C,
        HEIGHT: 0x2D,
        NUM_CLUES: 0x2E,
        UNKNOWN_BITMASK: 0x30,
        SCRAMBLED_TAG: 0x32,
    },
    lengths: {
        MAGIC: 0x0B,
        VERSION: 0x04,
        ICHEATED_CHECKSUM: 0x08,
        RES2: 0x0C,
        HEADER: 0x34
    },
};

// names of string fields
const PUZ_STRING_FIELDS = ['title', 'author', 'copyright'];

// http://code.google.com/p/puz/wiki/FileFormat
// https://github.com/tedtate/puzzler/blob/master/lib/crossword.js
function readHeader(buf) {
    const i = PUZ_HEADER_CONSTANTS.offsets;
    const n = PUZ_HEADER_CONSTANTS.lengths;
    return {
        FILE_CHECKSUM: buf.readUInt16LE(i.FILE_CHECKSUM),
        MAGIC: buf.toString('utf8', i.MAGIC, i.MAGIC + n.MAGIC),
        HEADER_CHECKSUM: buf.readUInt16LE(i.HEADER_CHECKSUM),
        ICHEATED_CHECKSUM: buf.toString('hex', i.ICHEATED_CHECKSUM, i.ICHEATED_CHECKSUM + n.ICHEATED_CHECKSUM),
        VERSION: buf.toString('utf8', i.VERSION, i.VERSION + n.VERSION),
        RES1: buf.readUInt16LE(i.RES1),
        SCRAMBLED_CHECKSUM: buf.readUInt16LE(i.SCRAMBLED_CHECKSUM),
        RES2: buf.toString('hex', i.RES2, i.RES2 + n.RES2),
        WIDTH: buf.readUInt8(i.WIDTH),
        HEIGHT: buf.readUInt8(i.HEIGHT),
        NUM_CLUES: buf.readUInt16LE(i.NUM_CLUES),
        UNKNOWN_BITMASK: buf.readUInt16LE(i.UNKNOWN_BITMASK),
        SCRAMBLED_TAG: buf.readUInt16LE(i.SCRAMBLED_TAG)
    }
}

// My windows-1252 encoding function which probably doesn't work?
function windows1252_encode(s) {
    var ret = new Uint8Array(s.length);
    for (var i=0; i<s.length; i++) {
        ret[i] = s.charCodeAt(i);
    }
    return ret;
}

function puzEncode(s, encoding) {
    if (!encoding) {
        encoding = PUZ_ENCODING;
    }
    //const encoder = new TextEncoder();
    //return encoder.encode(s);
    return windows1252_encode(s);
    //return iconv.encode(s);
}

// http://blog.tatedavies.com/2012/08/28/replace-microsoft-chars-in-javascript/
/**
 * Replace Word characters with Ascii equivalent
 **/
function replaceWordChars(text) {
    var s = text;
    // smart single quotes and apostrophe
    s = s.replace(/[\u2018|\u2019|\u201A]/g, "\'");
    // smart double quotes
    s = s.replace(/[\u201C|\u201D|\u201E]/g, "\"");
    // ellipsis
    s = s.replace(/\u2026/g, "...");
    // dashes
    s = s.replace(/[\u2013|\u2014]/g, "-");
    // circumflex
    s = s.replace(/\u02C6/g, "^");
    // open angle bracket
    s = s.replace(/\u2039/g, "");
    // spaces
    s = s.replace(/[\u02DC|\u00A0]/g, " ");
    return s;
}


function puzDecode(buf, start, end, encoding) {
    if (!encoding) {
        encoding = PUZ_ENCODING;
    }
    // TODO: this is also UTF-8
    const decoder = new TextDecoder();
    const s = decoder.decode(buf.slice(start, end));
    //const s = iconv.decode(buf.slice(start, end), encoding);
    return replaceWordChars(s);
}

function splitNulls(buf, encoding) {
    let i = 0;
    let prev = 0;
    let parts = [];
    while (i < buf.length) {
        if (buf[i] === 0x0) {
            parts.push(puzDecode(buf, prev, i, encoding));
            prev = i + 1;
        }
        i++;
    }
    if (i > prev)
        parts.push(puzDecode(buf, prev, i, encoding));
    return parts;
}

function checksum(base, c, len) {
  if (c === undefined)
    c = 0x0000;

  if (base === undefined)
    return c;

  if (len === undefined)
    len = base.length;

  for (let i = 0; i < len; i++) {
    if (c & 0x0001)
      c = ((c >>> 1) + 0x8000) & 0xFFFF;
    else
      c = (c >>> 1);
    c = (c + base[i]) & 0xFFFF;
  }
  return c;
}

function concatBytes(a, b) {
    let c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
}

function writeCheatChecksum(buf, offset, key, checksums) {
    const n = checksums.length;
    for (let shift = 0; shift < 2; shift++) {
        for (let i = 0; i < checksums.length; i++) {
            const c = (checksums[i] & (0xFF << 8*shift)) >>> 8*shift;
            buf[offset + i + n*shift] = key.charCodeAt(i + n*shift) ^ c;
        }
    }
}

function writeUInt16LE(buf, offset, val) {
    buf[offset + 0] =  val & 0x00FF;
    buf[offset + 1] = (val & 0xFF00) >> 8;
}

class PuzPayload {
    static from(x, encoding) {
        const buf = Buffer.from(x);
        let header = readHeader(buf);
        const ncells = header.WIDTH * header.HEIGHT;
        let pos = PUZ_HEADER_CONSTANTS.lengths.HEADER;
        const solution = puzDecode(buf, pos, pos + ncells, encoding);
        pos += ncells;
        const state = puzDecode(buf, pos, pos + ncells, encoding);
        pos += ncells;
        const strings = splitNulls(buf.slice(pos), encoding);
        const fields = PUZ_STRING_FIELDS;
        const meta = {};
        fields.forEach(function(f, i) {
            meta[f] = strings[i];
        });
        meta.note = strings[fields.length + header.NUM_CLUES];
        meta.width = header.WIDTH;
        meta.height = header.HEIGHT;
        const clues = strings.slice(fields.length, fields.length + header.NUM_CLUES);
        return new PuzPayload(meta, clues, solution, state);
    }

    buildStrings() {
        let strings = '';
        const fields = PUZ_STRING_FIELDS;
        for (let i = 0; i < fields.length; i++)
            strings += this[fields[i]] + '\x00';

        for (let i = 0; i < this.clues.length; i++)
            strings += this.clues[i] + '\x00';

        if (this.note) {
            strings += this.note + '\x00';
        } else {
            strings += '\x00';
        }


        return puzEncode(strings);
    }

    stringsChecksum(c) {
        c = checksum(puzEncode(this.title + '\x00'), c);
        c = checksum(puzEncode(this.author + '\x00'), c);
        c = checksum(puzEncode(this.copyright + '\x00'), c);
        for (let i = 0; i < this.clues.length; i++)
            c = checksum(puzEncode(this.clues[i]), c);

        if (this.note)
            c = checksum(puzEncode(this.note + '\x00'), c);
        return c;
    }

    buildBody() {
        let body = puzEncode(this.solution);
        body = concatBytes(body, puzEncode(this.state));
        return concatBytes(body, this.buildStrings());
    }

    computeChecksums(header) {
        const p = PUZ_HEADER_CONSTANTS;
        const h = checksum(header.slice(p.offsets.WIDTH, p.lengths.HEADER));
        let c = checksum(puzEncode(this.solution), h);
        c = checksum(puzEncode(this.state), c);
        return {
            header: h,
            solution: checksum(puzEncode(this.solution)),
            state: checksum(puzEncode(this.state)),
            strings: this.stringsChecksum(),
            file: this.stringsChecksum(c)
        }
    }

    buildHeader() {
        const i = PUZ_HEADER_CONSTANTS.offsets;
        const header = new Uint8Array(PUZ_HEADER_CONSTANTS.lengths.HEADER);

        const encoder = new TextEncoder();

        // metadata
        header.set(encoder.encode("ACROSS&DOWN"), i.MAGIC);
        header.set(encoder.encode("1.3"), i.VERSION);
        //header.set(iconv.encode("ACROSS&DOWN", "utf-8"), i.MAGIC);
        //header.set(iconv.encode("1.3", "utf-8"), i.VERSION);

        // dimensions
        header[i.WIDTH] = this.width;
        header[i.HEIGHT] = this.height;
        writeUInt16LE(header, i.NUM_CLUES, this.clues.length);

        // magical random bitmask, causes across lite to crash if not set :S
        header[i.UNKNOWN_BITMASK] = 0x01;

        // checksums
        const c = this.computeChecksums(header);
        writeUInt16LE(header, i.FILE_CHECKSUM, c.file);
        writeUInt16LE(header, i.HEADER_CHECKSUM, c.header);
        writeCheatChecksum(header, i.ICHEATED_CHECKSUM, "ICHEATED", [
            c.header, c.solution, c.state, c.strings
        ]);
        return header;
    }

    toBytes() {
        return concatBytes(this.buildHeader(), this.buildBody());
    }

    toBuffer() {
        return Buffer.from(this.toBytes());
    }

    /* state is optional */
    constructor(metadata, clues, solution, state) {
        for (let [field, value] of Object.entries(metadata)) {
            this[field] = value;
        }
        this.clues = clues;
        this.solution = solution;
        this.state = state;
        if (!this.state)
            this.state = this.solution.replace(/[^\.]/g, '-');
    }
}


/** Function to create a PuzPayload from a PUZAPP **/
function puzapp_to_puzpayload(puzdata) {
    var meta = {
        title: puzdata.title,
        author: puzdata.author,
        copyright: puzdata.copyright,
        note: puzdata.notes,
        width: puzdata.width,
        height: puzdata.height,
    }
    var pp_clues = [];
    // Sort the entries by number then direction
    puzdata.all_entries.sort(function(x, y) {
       if (x.Number < y.Number) {
           return -1;
       } else if (x.Number > y.Number) {
           return 1;
       }
       else {
           if (x.Direction < y.Direction) {
               return -1;
           } else if (x.Direction > y.Direction) {
               return 1;
           }
       }
       return 0;
    });
    for (var i=0; i<puzdata.all_entries.length; i++) {
        pp_clues.push(puzdata.all_entries[i].Clue);
    }
    return new PuzPayload(meta, pp_clues, puzdata.solution, puzdata.grid);
}

/** Download puzdata as a .puz file **/
//function puz_download(puzdata, outname) {
//    const puzpayload = puzapp_to_puzpayload(puzdata);
//    file_download(puzpayload.toBytes(), outname, 'application/octet-stream');
//}

/** Create a JSCrossword from a PUZAPP **/
function jscrossword_from_puz(puzdata) {
    /* metadata */
    var metadata = {
      "title": puzdata.title.trim()
    , "author": puzdata.author.trim()
    , "copyright": puzdata.copyright.trim()
    , "description": puzdata.notes.trim()
    , "height": puzdata.height
    , "width": puzdata.width
    , "crossword_type": "crossword"
    }
    /* cells */
    var cells = [];
    var i, j;
    for (j=0; j < puzdata.height; j++) {
        for (i=0; i < puzdata.width; i++) {
            var cell = {"x": i, "y": j};
            var ix = xw_ij_to_index(i, j, puzdata.width);
            var this_letter = puzdata.solution.charAt(ix);
            if (this_letter == ".") {
                cell['type'] = 'block';
            }
            else {
                cell['solution'] = this_letter;
            }
            if (puzdata.sqNbrs[ix]) {
                cell['number'] = puzdata.sqNbrs[ix];
            }
            if (puzdata.gext) {
                if (puzdata.gext[ix] != "\u0000") {
                  cell['background-shape'] = 'circle';
                }
            }
            cells.push(cell);
        }
    }
    /* words and clues */
    var word_id = 1;
    var words = [];
    var clues = [];
    // across words
    var across_clues = [];
    Object.keys(puzdata.across_entries).forEach(clue_number => {
        var this_word = puzdata.across_entries[clue_number];
        var word = {"id": word_id};
        var word_indexes = puzdata.acrossWordNbrs.reduce(function(a, e, i) {
            if (e == clue_number) {
                a.push(i);
            }
            return a;
        }, []);
        var word_cells = word_indexes.map(e => xw_index_to_ij(e, puzdata.width));
        word['cells'] = word_cells;
        words.push(word);
        across_clues.push({"text": puzdata.across_clues[clue_number], "word": word_id, "number": clue_number});
        word_id = word_id + 1;
    });
    clues.push({"title": "ACROSS", "clue": across_clues});
    // down words
    var down_clues = [];
    Object.keys(puzdata.down_entries).forEach(clue_number => {
        var this_word = puzdata.down_entries[clue_number];
        var word = {"id": word_id};
        var word_indexes = puzdata.downWordNbrs.reduce(function(a, e, i) {
            if (e == clue_number) {
                a.push(i);
            }
            return a;
        }, []);
        var word_cells = word_indexes.map(e => xw_index_to_ij(e, puzdata.width));
        word['cells'] = word_cells;
        words.push(word);
        down_clues.push({"text": puzdata.down_clues[clue_number], "word": word_id, "number": clue_number});
        word_id = word_id + 1;
    });
    clues.push({"title": "DOWN", "clue": down_clues});

    return new JSCrossword(metadata, cells, words, clues);
}
