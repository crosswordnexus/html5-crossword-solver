/**
 * PuzzleMe to JPZ version 0.1.1

 * Changelog:
   * 0.1.1:
     * default to srcFileName for the title
     * Fix a bug if cellInfos does not exist
**/

function xml_sanitize(s) {
    /* replace a few characters, as per spec */
    s = s.replaceAll('&', '&amp;');
    s = s.replaceAll('<', '&lt;');
    /* this last one is not strictly necessary */
    s = s.replaceAll('>', '&gt;');
    return s;
}

class JSCrossword {
    /*
    * `metadata` has title, author, copyright, description (notes), height, width
    * `cells` is an array of cells with the various attributes
    * `words` is an array of objects, each with an "id" and a "cells" attribute
      "id" is just a unique number to match up with the clues.
      "cells" is an array of objects giving the x and y values, in order
    * `clues` is an array of two objects.
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

    /* Is this a dumb way to write the XML?  ... probably */
    toJPZString() {
        var i, j;
        var title = xml_sanitize(this.metadata.title);
        var author = xml_sanitize(this.metadata.author);
        var copyright = xml_sanitize(this.metadata.copyright);
        var description = xml_sanitize(this.metadata.description);
        var jpz_string = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler-applet xmlns="http://crossword.info/xml/crossword-compiler">
<applet-settings width="720" height="600" cursor-color="#00FF00" selected-cells-color="#80FF80">
<completion friendly-submit="false" only-if-correct="true">Way to go!</completion>
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
    <grid width="${this.metadata.width}" height="${this.metadata.height}">
    <grid-look hide-lines="true" cell-size-in-pixels="25" />\n`;
        /* take care of cells in the grid */
        for (i=0; i<this.cells.length; i++) {
            var cell = this.cells[i];
            var clue_attrs = '';
            var cell_arr = Object.keys(cell);
            for (var j=0; j < cell_arr.length; j++) {
                var my_key = cell_arr[j];
                var my_val = cell[my_key];
                clue_attrs += `${my_key}="${my_val}" `;
            }
            jpz_string += `        <cell ${clue_attrs} />\n`;
        }
        jpz_string += "    </grid>\n";
        /* take care of the words */
        for (i=0; i<this.words.length; i++) {
            var word = this.words[i];
            jpz_string += `    <word id="${word.id}">\n`;
            for (j=0; j<word.cells.length; j++) {
                var word_cell = word.cells[j];
                jpz_string += `        <cells x="${word_cell.x}" y="${word_cell.y}" />\n`;
            }
            jpz_string += `    </word>\n`;
        }

        /* clues */
        for (i=0; i < this.clues.length; i++) {
            jpz_string += `    <clues ordering="normal">\n`;
            jpz_string += `        <title>${this.clues[i].title}</title>\n`;
            for (j=0; j < this.clues[i].clue.length; j++) {
                var my_clue = this.clues[i].clue[j];
                var my_clue_text = xml_sanitize(my_clue.text);
                jpz_string += `        <clue word="${my_clue.word}" number="${my_clue.number}">${my_clue_text}</clue>\n`;
            }
            jpz_string += `    </clues>\n`;
        }
        jpz_string += `</crossword>
</rectangular-puzzle>
</crossword-compiler-applet>\n`;
        return jpz_string;
    }
}

/** Generic file download function **/
function file_download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob)
        window.navigator.msSaveOrOpenBlob(file, filename);
    else {
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

/*
* function to decode base64 as utf-8
* thank you https://stackoverflow.com/a/30106551
*/
function b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

/* Grab the data from amuselabs */
function amuse_data_to_js_crossword() {
    var puzdata = JSON.parse(b64DecodeUnicode(window.rawc));
    var metadata = {
        title: puzdata.title || puzdata.srcFileName,
        author: puzdata.author,
        copyright: puzdata.copyright,
        description: puzdata.description,
        width: puzdata.w,
        height: puzdata.h,
    };

    /* Solution and grid */
    var cells = [];
    for (var j=0; j < puzdata.h; j++) {
      for (var i=0; i < puzdata.w; i++) {
        var letter = puzdata.box[i][j];
        var number = puzdata.clueNums[i][j];
        /* start our cell */
        var cell = {"x": i+1, "y": j+1};
        /* if there's a letter, mark it as the solution */
        if (letter == '\u0000') {
          cell["type"] = "block";
        }
        else {
          cell["solution"] = letter;
        }
        /* if there's a number, add it */
        if (number !== 0) {
            cell["number"] = number;
        }
        /* if there's a cellInfo with information about this cell, add that info */
        var cellInfos = puzdata.cellInfos || [];
        var ix = cellInfos.findIndex(e => (e.x === i && e.y === j))
        if (ix !== -1) {
            var cellInfoObj = cellInfos[ix];
            if (cellInfoObj.bgColor) {
                cell['background-color'] = cellInfoObj.bgColor;
            }
            if (cellInfoObj.isCircled) {
                cell['background-shape'] = 'circle';
            }
            if (cellInfoObj.bottomWall) {
                cell['bottom-bar'] = 'true';
            }
            if (cellInfoObj.rightWall) {
                cell['right-bar'] = 'true';
            }
            if (cellInfoObj.topWall) {
                cell['top-bar'] = 'true';
            }
            if (cellInfoObj.leftWall) {
                cell['left-bar'] = 'true';
            }
        }
        cells.push(cell);
      }
    }

    /* Words and clues */
    var words = [];
    var clues = [{"title": "ACROSS", "clue": []}, {"title": "DOWN", "clue": []}]
    for (var word_id in Object.keys(puzdata.placedWords)) {
        var my_obj = puzdata.placedWords[word_id];
        if (my_obj['nBoxes']) {
            var word = {"id": word_id};
            var clue = {"word": word_id};
            var word_cells = [];
            var x1 = my_obj.x + 1; var y1 = my_obj.y + 1;
            /* determine if this is an across or down clue */
            var isAcross = my_obj.acrossNotDown;
            /* take care of the cells in the word */
            for (var word_ctr = 0; word_ctr < my_obj.nBoxes; word_ctr++) {
                word_cells.push({"x": x1, "y": y1});
                if (isAcross) {
                    x1 += 1;
                }
                else {
                    y1 += 1;
                }
            }
            word["cells"] = word_cells;
            words.push(word);

            /* take care of the remaining information for the clue now */
            clue["number"] = my_obj.clueNum;
            clue["text"] = my_obj['clue']['clue'];
            if (isAcross) {
                clues[0]['clue'].push(clue);
            }
            else {
                clues[1]['clue'].push(clue);
            }
        }
    }
    var new_crossword = new JSCrossword(metadata, cells, words, clues);
    return new_crossword;
}

/** Download puzdata as a .jpz file **/
function jpz_download(jpz_payload, outname) {
    file_download(jpz_payload, outname, 'text/xml');
}

function amuse_jpz_download() {
    var amuse_crossword = amuse_data_to_js_crossword();
    var jpz_string = amuse_crossword.toJPZString();
    var title = amuse_crossword.metadata.title;
    var outname = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.jpz';
    jpz_download(jpz_string, outname);
}

amuse_jpz_download();
