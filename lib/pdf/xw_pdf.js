// Load jsPDF
const { jsPDF } = window.jspdf;

const DEFAULT_FONT_TYPE = 'helvetica';

// default character to print when we don't have a number
const DEFAULT_NUM = '•'

const emojiImageCache = new Map();
const emojiRx = /\p{Extended_Pictographic}(?:\p{Emoji_Modifier})?/u;
const splitter = new GraphemeSplitter();

/** Helper function to have safe characters **/
function foldReplacing(str, fallback = '*') {
    return Array.from(str).map(c =>
        emojiRx.test(c) || c.charCodeAt(0) <= 256 ? c : fallback
    ).join('');
}

async function preloadEmojiImages(charList) {
    const twemojiBase = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/';
    const uniqueEmoji = [...new Set(charList.filter(c => emojiRx.test(c)))];

    for (const emoji of uniqueEmoji) {
        if (emojiImageCache.has(emoji)) continue;
        const codepoint = twemoji.convert.toCodePoint(emoji);
        const url = `${twemojiBase}${codepoint}.png`;
        try {
            const resp = await fetch(url);
            const blob = await resp.blob();
            const dataUrl = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
            emojiImageCache.set(emoji, dataUrl);
        } catch (err) {
            console.warn(`Could not load emoji ${emoji}:`, err);
        }
    }
}

/** Wrapper for the above function **/
async function preloadFromClueArrays(clueArrays) {
    const flatText = clueArrays.flat().join('\n');
    const splitter = new GraphemeSplitter();
    const graphemes = splitter.splitGraphemes(flatText);
    const emojiChars = [...new Set(graphemes.filter(g => emojiRx.test(g)))];
    await preloadEmojiImages(emojiChars);
}

/** Helper functions for splitting text with tags **/
// function to traverse DOM tree
function traverseTree(htmlDoc, agg = []) {
    if (htmlDoc.nodeName === '#text') {
        var thisTag = htmlDoc.parentNode.tagName;
        var is_bold = (thisTag === 'B');
        var is_italic = (thisTag === 'I');
        var graphemes = splitter.splitGraphemes(htmlDoc.textContent);

        graphemes.forEach(char => {
            agg.push({
                char: char,
                is_bold: is_bold,
                is_italic: is_italic,
                is_emoji: emojiRx.test(char)
            });
        });
    }
    for (let i = 0; i < htmlDoc.childNodes.length; i++) {
        agg = traverseTree(htmlDoc.childNodes[i], agg);
    }
    return agg;
}

// Print a line of text that may be bolded or italicized
const printCharacters = (doc, textObject, startY, startX, fontSize, font_type = DEFAULT_FONT_TYPE, emojiSize = fontSize) => {
    if (!textObject.length) return;

    if (typeof textObject === 'string') {
		const myText = foldReplacing(textObject);
        doc.text(startX, startY, myText);
        return;
    }

    textObject.forEach(row => {
        const char = foldReplacing(row.char);
        const is_bold = row.is_bold;
        const is_italic = row.is_italic;
        const is_emoji = row.is_emoji;

        if (is_emoji) {
            const emojiData = emojiImageCache.get(char);
            if (emojiData) {
                doc.addImage(emojiData, 'PNG', startX, startY - emojiSize + 2, emojiSize, emojiSize);
                startX += emojiSize;
            } else {
                doc.text('**', startX, startY);
                startX += doc.getTextWidth('**');
            }
        } else {
            doc.setFont(font_type,
                is_bold ? 'bold' :
                is_italic ? 'italic' : 'normal');

            doc.text(char, startX, startY);
            startX = startX + doc.getStringUnitWidth(row.char) * fontSize;
			doc.setFont(font_type, 'normal');
        }

        doc.setFont(font_type, 'normal');
    });
};

// helper function for bold and italic clues
function split_text_to_size_bi(clue, col_width, doc, has_header = false, font_type = DEFAULT_FONT_TYPE) {

  // get the clue with the HTML stripped out
  const el = document.createElement('html');
  el.innerHTML = clue;
  let clean_clue = el.innerText;

  // split the clue
  var lines1 = doc.splitTextToSize(clean_clue, col_width);

  // helpers
  const containsBold = clue.toUpperCase().includes('<B');
  const containsItalic = clue.toUpperCase().includes('<I');
  const containsEmoji = emojiRx.test(clean_clue);

  // Check if there's a "header"
  // if so, track the header, and separate out the clue
  let header_line = null;
  if (has_header) {
    const clue_split = clue.split('\n');
    header_line = clue_split[0];
    clue = clue_split.slice(1).join('\n');
    el.innerHTML = clue;
    clean_clue = el.innerText;
  }

  // ✅ Fast path: no emoji, no formatting
  if (!containsBold && !containsItalic && !containsEmoji) {
    return lines1;
  }

  // ✅ Emoji-only (no formatting)
  if (!containsBold && !containsItalic && containsEmoji) {
    var lines = doc.splitTextToSize(clean_clue, col_width).map(line =>
      splitter.splitGraphemes(line).map(char => ({
        char,
        is_bold: false,
        is_italic: false,
        is_emoji: emojiRx.test(char)
      }))
    );
    if (has_header) lines = [header_line].concat(lines);
    return lines;
  }

  // ✅ Formatting only (no emoji)
  if ((containsBold || containsItalic) && !containsEmoji) {
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(clue, 'text/html');
    const split_clue = traverseTree(htmlDoc);

    // Make a new "lines1" with all bold splits
    doc.setFont(font_type, 'bold');
    lines1 = doc.splitTextToSize(clean_clue, col_width);
    doc.setFont(font_type, 'normal');

    // split this like we did the "lines1"
    var lines = [];
    var ctr = 0;
    // Characters to skip
    const SPLIT_CHARS = new Set([' ', '\t', '\n']);
    lines1.forEach(line => {
      var thisLine = [];
      var myLen = line.length;
      for (var i = 0; i < myLen; i++) {
        thisLine.push(split_clue[ctr++]);
      }
      if (split_clue[ctr]) {
        if (SPLIT_CHARS.has(split_clue[ctr].char)) {
          ctr = ctr + 1;
        }
      }
      lines.push(thisLine);
    });
    if (has_header) lines = [header_line].concat(lines);
    return lines;
  }

  // ✅ Mixed emoji and formatting case
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(clue, 'text/html');
  const split_clue = traverseTree(htmlDoc);

  const measured_chunks = [];
  const chunk_map = [];
  for (let i = 0; i < split_clue.length;) {
    const c = split_clue[i];
    if (c.is_emoji) {
      measured_chunks.push(c.char);
      chunk_map.push([i]);
      i++;
    } else {
      let acc = '';
      const indices = [];
      while (i < split_clue.length && !split_clue[i].is_emoji) {
        acc += split_clue[i].char;
        indices.push(i);
        i++;
      }
      acc.split(/(\s+)/).forEach(word => {
        if (word) {
          measured_chunks.push(word);
          chunk_map.push(indices.splice(0, word.length));
        }
      });
    }
  }

  doc.setFont(font_type, 'bold');
  const wrapped_lines = [];
  const wrapped_maps = [];
  let currentLine = '';
  let currentMap = [];

  for (let j = 0; j < measured_chunks.length; j++) {
    const chunk = measured_chunks[j];
    const testLine = currentLine + chunk;
    if (doc.getTextWidth(testLine) > col_width && currentLine !== '') {
      wrapped_lines.push(currentLine);
      wrapped_maps.push(currentMap);
      currentLine = chunk;
      currentMap = chunk_map[j];
    } else {
      currentLine += chunk;
      currentMap = currentMap.concat(chunk_map[j]);
    }
  }
  if (currentLine) {
    wrapped_lines.push(currentLine);
    wrapped_maps.push(currentMap);
  }
  doc.setFont(font_type, 'normal');

  const SPLIT_CHARS = new Set([' ', '	', '']);
  var lines2 = wrapped_maps.map(map => map.map(i => split_clue[i]).filter(Boolean));
  if (has_header) lines2 = [header_line].concat(lines);
  return lines2;
}

/* function to strip HTML tags */
/* via https://stackoverflow.com/a/5002618 */
function strip_html(s) {
    var div = document.createElement("div");
    div.innerHTML = s;
    var text = div.textContent || div.innerText || "";
    return text;
}

/** Draw a crossword grid (requires jsPDF) **/
function draw_crossword_grid(doc, xw, options)
{
    /*
    *  doc is a jsPDF instance
    * xw is a JSCrossword instance
    */

    // options are as below
    var DEFAULT_OPTIONS = {
        grid_letters : true
    ,   grid_numbers : true
    ,   x0: 20
    ,   y0: 20
    ,   cell_size: 24
    ,   gray : null
    ,   line_width: 0.7
    ,   bar_width: 2
    };

    for (var key in DEFAULT_OPTIONS) {
        if (!DEFAULT_OPTIONS.hasOwnProperty(key)) continue;
        if (!options.hasOwnProperty(key))
        {
            options[key] = DEFAULT_OPTIONS[key];
        }
    }

    // If there's an image, draw it and return
    if (options.image) {
      doc.addImage(options.image, "PNG", options.x0, options.y0, xw.metadata.width * options.cell_size, xw.metadata.height * options.cell_size);
      return;
    }

    var PTS_TO_IN = 72;
    var cell_size = options.cell_size;

    /** Function to draw a square **/
    function draw_square(doc,x1,y1,cell_size,number,letter,filled,cell, barsOnly=false) {

      if (!barsOnly) {
        // thank you https://stackoverflow.com/a/5624139
        function hexToRgb(hex) {
            hex = hex || '#FFFFFF';
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });


            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        var MIN_NUMBER_SIZE = 4;

        var filled_string = (filled ? 'F' : 'S');
        var number_offset = cell_size/20;
        var number_size = cell_size/3.5 < MIN_NUMBER_SIZE ? MIN_NUMBER_SIZE : cell_size/3.5;
        //var letter_size = cell_size/1.5;
        var letter_length = letter.length;
        var letter_size = cell_size/(1.5 + 0.5 * (letter_length - 1));
        var letter_pct_down = 4/5;

        // for "clue" cells we set the background and text color
        doc.setTextColor(0, 0, 0);
        if (cell.clue) {
          //doc.setTextColor(255, 255, 255);
          cell['background-color'] = '#CCCCCC';
        }

        if (cell['background-color']) {
            var filled_string = 'F';
            var rgb = hexToRgb(cell['background-color']);
            doc.setFillColor(rgb.r, rgb.g, rgb.b);
            doc.setDrawColor(options.gray.toString());
            // Draw one filled square and then one unfilled
            doc.rect(x1, y1, cell_size, cell_size, filled_string);
            doc.rect(x1, y1, cell_size, cell_size);
        }
        else {
            doc.setFillColor(options.gray.toString());
            doc.setDrawColor(options.gray.toString());
            // draw the bounding box for all squares -- even "clue" squares
            if (true) {
                doc.rect(x1, y1, cell_size, cell_size);
                doc.rect(x1, y1, cell_size, cell_size, filled_string);
            }
        }
        //numbers
        doc.setFont(options.font_type, 'normal');
        doc.setFontSize(number_size);
        //number = ASCIIFolder.foldReplacing(number);
        doc.text(x1+number_offset,y1+number_size,number);

        // top-right numbers
        var top_right_number = cell.top_right_number ? cell.top_right_number : '';
        doc.setFontSize(number_size);
        //top_right_number = ASCIIFolder.foldReplacing(top_right_number);
        doc.text(x1 + cell_size - number_offset, y1 + number_size, top_right_number, null, null, 'right');

        // letters
        doc.setFont(options.font_type, 'normal');
        doc.setFontSize(letter_size);
        doc.text(x1+cell_size/2,y1+cell_size * letter_pct_down,letter,null,null,'center');

        // circles
        if (cell['background-shape']) {
            doc.circle(x1+cell_size/2,y1+cell_size/2,cell_size/2);
        }
      }
      // bars
      cell.bar = {
        top: cell['top-bar']
      , left: cell['left-bar']
      , right: cell['right-bar']
      , bottom: cell['bottom-bar']
      };
      if (cell.bar) {
          var bar = cell.bar;
          var bar_start = {
              top: [x1, y1],
              left: [x1, y1],
              right: [x1 + cell_size, y1 + cell_size],
              bottom: [x1 + cell_size, y1 + cell_size]
          };
          var bar_end = {
              top: [x1 + cell_size, y1],
              left: [x1, y1 + cell_size],
              right: [x1 + cell_size, y1],
              bottom: [x1, y1 + cell_size]
          };
          for (var key in bar) {
              if (bar.hasOwnProperty(key)) {
                  if (bar[key]) {
                      doc.setLineWidth(options.bar_width);
                      doc.line(bar_start[key][0], bar_start[key][1], bar_end[key][0], bar_end[key][1]);
                      doc.setLineWidth(options.line_width);
                  }
              }
          }
      }
      // Reset the text color, if necessary
      doc.setTextColor(0, 0, 0);
    } // end draw_square()

    var width = xw.metadata.width;
    var height = xw.metadata.height;
    xw.cells.forEach(function(c) {
        // don't draw a square if we have a void
        if (c.is_void || (c.type === 'block' && c['background-color'] === '#FFFFFF')) {
          return;
        }
        var x_pos = options.x0 + c.x * cell_size;
        var y_pos = options.y0 + c.y * cell_size;
        // letter
        var letter = c.solution || '';
        if (!options.grid_letters) {letter = '';}
        letter = letter || c.letter || '';
        var filled = c.type == 'block';
        // number
        var number = c['number'] || '';
        if (!options.grid_numbers) {number = '';}
        // circle
        var circle = c['background-shape'] == 'circle';
        // draw the square
        // for diagramless puzzles don't put anything but the square
        if (xw.metadata.crossword_type == 'diagramless') {
          number = ''; letter = ''; filled = false;
        }
        draw_square(doc,x_pos,y_pos,cell_size,number,letter,filled,c);
    });

    // Draw just the bars afterward
    // This is necessary because we may have overwritten bars earlier
    xw.cells.forEach(function(c) {
        var x_pos = options.x0 + c.x * cell_size;
        var y_pos = options.y0 + c.y * cell_size;
        draw_square(doc, x_pos ,y_pos, cell_size, '', '', false, c, true);
    });
}

/**
* Helper function to make a grid with clues
**/
function doc_with_clues(xw, options, doc_width, doc_height, clue_arrays, num_arrays, gridProps, columnsPreSet=false) {
  var clue_pt = options.max_clue_pt;
  var finding_font = true;

  var max_title_author_pt = options.max_title_pt;

  // extract info from gridProps
  var col_width = gridProps.col_width;
  var grid_ypos = gridProps.grid_ypos;

  // If there is no header 1 / header 2 we can save some space
  var has_top_header_row = 1;
  if (!options.header1 && !options.header2) {
    has_top_header_row = 0;
  }

  var doc = new jsPDF(options.orientation, 'pt', 'letter');
  if (!xw.clues.length) {
    return {doc: doc, clue_pt: 1};
  }

  while (finding_font)
  {
      doc = new jsPDF(options.orientation, 'pt', 'letter');
      var clue_padding = clue_pt / options.clue_padding_denominator;
      doc.setFontSize(clue_pt);

      doc.setLineWidth(options.line_width);

      // Print the clues
      // We set the margin to be the maximum length of the clue numbers
      var max_clue_num_length = xw.clues.map(x=>x.clue).flat().map(x=>x.number).map(x => x.length).reduce((a, b) => Math.max(a, b));
      var num_margin = doc.getTextWidth('9'.repeat(max_clue_num_length));
      var num_xpos = options.margin + num_margin;
      var line_margin = 1.5 * doc.getTextWidth(' ');
      var line_xpos = num_xpos + line_margin;
      var top_line_ypos = options.margin + // top margin
                  has_top_header_row * (max_title_author_pt + options.vertical_separator) + // headers 1 & 2
                  max_title_author_pt + // title + header 3
                  options.vertical_separator * 2 + // padding
                  clue_pt + clue_padding; // first clue
      var line_ypos = top_line_ypos;
      var my_column = 0;
      for (var k=0; k<clue_arrays.length; k++) {
          var clues = clue_arrays[k];
          var nums = num_arrays[k];
          for (var i=0; i<clues.length; i++) {
              var clue = clues[i];
              var num = nums[i];

              // check to see if we need to wrap
              var max_line_ypos;
              if (my_column < options.num_full_columns) {
                  max_line_ypos = doc_height - options.margin - options.max_title_pt - 2 * options.vertical_separator;
              } else {
                  max_line_ypos = grid_ypos - options.grid_padding;
              }

              // Split our clue
              var lines = split_text_to_size_bi(clue, col_width - (num_margin + line_margin), doc, i==0, font_type=options.font_type);

              if (line_ypos + (lines.length - 1) * (clue_pt + clue_padding) > max_line_ypos) {
                  // move to new column
                  my_column += 1;
                  num_xpos = options.margin + num_margin + my_column * (col_width + options.column_padding);
                  line_xpos = num_xpos + line_margin;
                  line_ypos = top_line_ypos;
                  // if we're at the top of a line we don't print a blank clue
                  if (clue == '') {
                      continue;
                  }
              }


              for (var j=0; j<lines.length; j++)
              {
                  var line = lines[j];
                  // Set the font to bold for the title
                  if (i==0 && j==0) {
                      doc.setFont(options.font_type, 'bold');
                      printCharacters(doc, line, line_ypos, line_xpos, clue_pt, font_type=options.font_type);
                      doc.setFont(options.font_type, 'normal');
                      // add a little space after the header
                      line_ypos += clue_padding;
                  } else {
                      if (j == 0 || (i==0 && j==1)) {
                        // When j == 0 we print the number
                        doc.setFont(options.font_type, 'bold');
                        doc.text(num_xpos, line_ypos, num, null, null, "right");
                        doc.setFont(options.font_type, 'normal');
                      }
                      // Print the clue
                      doc.setFont(options.font_type, 'normal');
                      // print the text
                      //doc.text(line_xpos,line_ypos,line);
                      printCharacters(doc, line, line_ypos, line_xpos, clue_pt, font_type=options.font_type);
                  }
                  // set the y position for the next line
                  line_ypos += clue_pt + clue_padding;
              }
              // Add a little extra space in between clues
              line_ypos += clue_padding;
          }
      }

      // let's not let the font get ridiculously tiny
      // ignore this option if we have two pages
      if (clue_pt < options.min_clue_pt && options.num_pages < 2 && !columnsPreSet)
      {
          finding_font = false;
          clue_pt = null;
      }
      else if (my_column > options.num_columns - 1)
      {
          clue_pt -= 0.1;
      }
      else
      {
          finding_font = false;
      }
  }

  // if we haven't made it to all the columns we don't progress
  if (my_column < options.num_columns - 1 && (options.num_columns > options.min_columns || options.num_full_columns > 0) ) {
    clue_pt = null;
  }

  return {doc: doc, clue_pt: clue_pt};

}

/**
* Helper function to return parameters of a grid
* (grid_width, grid_height, cell_size)
* given the options and the number of columns
**/
function grid_props(xw, options, doc_width, doc_height) {
  // size of columns
  var col_width = (doc_width - 2 * options.margin - (options.num_columns -1 ) * options.column_padding) / options.num_columns;

  // The grid is under all but the first few columns
  var grid_width = doc_width - 2 * options.margin - options.num_full_columns * (col_width + options.column_padding);
  var grid_height = (grid_width / xw.metadata.width) * xw.metadata.height;

  // We change the grid width and height if num_full_columns == 0
  // This is because we don't want it to take up too much space
  if (options.num_full_columns === 0 || options.num_pages == 2) {
      // set the height to be (about) half of the available area
      grid_height = doc_height * 4/9;
      // If there are very few clues we can increase the grid height
      if (xw.clues.length < 10) {
        grid_height = doc_height * 2/3;
      }
      if (options.num_pages == 2) {
        grid_height = doc_height - (2 * options.margin + 3 * options.max_title_pt + 4 * options.vertical_separator + 3 * options.notepad_max_pt);
      }
      grid_width = (grid_height / xw.metadata.height) * xw.metadata.width;
      // however! if this is bigger than allowable, re-calibrate
      if (grid_width > (doc_width - 2 * options.margin)) {
          grid_width = (doc_width - 2 * options.margin);
          grid_height = (grid_width / xw.metadata.width) * xw.metadata.height;
      }

      // we shouldn't let the squares get too big
      var cell_size = grid_width / xw.metadata.width;
      if (cell_size > options.max_cell_size) {
        cell_size = options.max_cell_size;
        grid_height = cell_size * xw.metadata.height;
        grid_width = cell_size * xw.metadata.width;
      }
  }

  // We don't show the notepad if there isn't one
  if (!xw.metadata.description) {
    options.show_notepad = false;
  }

  // x and y position of grid
  // Reserve spot for the notepad
  var notepad_ypos = doc_height - options.margin - options.max_title_pt - options.vertical_separator * 2;
  var notepad_xpos;

  var notepad_height = 0;
  // helper value for multiplying
  var show_notepad_int = options.show_notepad ? 1 : 0;

  var grid_xpos = doc_width - options.margin - grid_width;
  var grid_ypos = notepad_ypos - show_notepad_int * (options.vertical_separator + notepad_height) - grid_height;

  var notepad_xpos = doc_width - options.margin - grid_width/2;

  // we change the x position of the grid if there are no full columns
  // or if we're printing on two pages
  // specifically, we want to center it.
  if (options.num_full_columns == 0 || options.num_pages == 2) {
      grid_xpos = (doc_width - grid_width)/2;
      notepad_xpos = doc_width/2;
  }

  // if there are no clues at all, center the y-position too
  if (!xw.clues.length || options.num_pages == 2) {
      grid_ypos = (doc_height - grid_height)/2;
  }

  // Determine how much space to set aside for the notepad
  var notepad_height = 0;
  if (options.show_notepad) {
    var doc1 = new jsPDF(options.orientation, 'pt', 'letter');
    const notepad_width = grid_width - 20;
    doc1.setFontSize(options.notepad_min_pt);
    var num_notepad_lines = doc1.splitTextToSize(xw.metadata.description, notepad_width).length;

    doc1.setFont(options.font_type, 'italic');
    var notepad_pt = options.notepad_max_pt;
    doc1.setFontSize(notepad_pt);
    var notepad_lines = doc1.splitTextToSize(xw.metadata.description, notepad_width);
    while (notepad_lines.length > num_notepad_lines) {
      notepad_pt -= 0.2;
      doc1.setFontSize(notepad_pt);
      notepad_lines = doc1.splitTextToSize(xw.metadata.description, notepad_width);
    }
    var notepad_adj = (num_notepad_lines > 1 ? 1.1 : 1.2);
    notepad_height = num_notepad_lines * notepad_pt * notepad_adj;
  }
  grid_ypos -= notepad_height;

  // Set the cell size
  var cell_size = grid_width / xw.metadata.width;

  myObj = {
    grid_xpos: grid_xpos
  , grid_ypos: grid_ypos
  , grid_width: grid_width
  , grid_height: grid_height
  , col_width: col_width
  , notepad_height: notepad_height
  , notepad_pt: notepad_pt
  , cell_size: cell_size
  , notepad_lines: notepad_lines
  , notepad_xpos: notepad_xpos
  , notepad_ypos: notepad_ypos
  }
  return myObj;
}

/** Helper function to load an image and get its dimensions **/
function loadImage(base64Image) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = base64Image;
    });
}

/** Create a PDF with possibly an image **/
function jscrossword_to_pdf(xw, options={}) {
  // If there's no image, just call the original routine
  if (!options.image) {
    jscrossword_to_pdf2(xw, options=options);
  } else {
    // load the image and then call the "2" routine
    loadImage(options.image)
    .then(dimensions => {
      const minDimension = 17;
      if (dimensions.width < dimensions.height) {
        xw.metadata.width = minDimension;
        xw.metadata.height = minDimension * dimensions.height / dimensions.width;
      } else {
        xw.metadata.height = minDimension;
        xw.metadata.width = minDimension * dimensions.width / dimensions.height;
      }

      jscrossword_to_pdf2(xw, options=options);
    })
    .catch(error => {
        console.error('Failed to load image:', error);
    });
  }
}

/** Create a PDF (requires jsPDF) **/
async function jscrossword_to_pdf2(xw, options={}) {
    var DEFAULT_OPTIONS = {
        margin: 40
    ,   title_pt: null
    ,   copyright_pt: null
    ,   num_columns : null
    ,   num_full_columns: null
    ,   num_pages: 1
    ,   column_padding: 10
    ,   gray: null
    ,   under_title_spacing : 20
    ,   max_clue_pt : 14
    ,   min_clue_pt : 8
    ,   grid_padding : 5
    ,   outfile : null
    ,   vertical_separator : 10
    ,   show_notepad : false
    ,   line_width: 0.7
    ,   notepad_max_pt: 12
    ,   notepad_min_pt: 8
    ,   orientation: 'portrait'
    ,   header1: '', header2: '', header3: ''
    ,   max_cell_size: 30
    ,   min_cell_size: 15
    ,   max_title_pt: 12
    ,   max_columns: 5
    ,   min_columns: 2
    ,   min_grid_size: 240
    ,   clue_padding_denominator: 3
    ,   font_type: DEFAULT_FONT_TYPE
    };

    var clue_length = xw.clues.map(x=>x.clue).flat().map(x=>x.text).join('').length;

    for (var key in DEFAULT_OPTIONS) {
        if (!DEFAULT_OPTIONS.hasOwnProperty(key)) continue;
        if (!options.hasOwnProperty(key))
        {
            options[key] = DEFAULT_OPTIONS[key];
        }
    }

    // Sorry big titles but we need a max size here
    const MAX_TITLE_PT = options.max_title_pt;
    if (options.title_pt > MAX_TITLE_PT) {options.title_pt = MAX_TITLE_PT;}
    if (options.copyright_pt > MAX_TITLE_PT) {options.copyright_pt = MAX_TITLE_PT;}

    var PTS_PER_IN = 72;
    var DOC_WIDTH = 8.5 * PTS_PER_IN;
    var DOC_HEIGHT = 11 * PTS_PER_IN;
    // wide puzzles get printed in landscape
    if (options.orientation == 'landscape' || xw.metadata.width >= 30) {
      DOC_WIDTH = 11 * PTS_PER_IN;
      DOC_HEIGHT = 8.5 * PTS_PER_IN;
      options.orientation = 'landscape';
    } else {options.orientation = 'portrait';}


    var margin = options.margin;

    var xw_height = xw.metadata.height;
    var xw_width = xw.metadata.width;

    // If there's no filename, use the title
    if (!options.outfile) {
        var outname = xw.metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
        options.outfile = outname;
    }

    // variables used in for loops
    var i, j;

    // If options.gray is NULL, we determine it
    if (options.gray === null) {
      options.gray = 0.5; // default
      // If there are very few black squares, we can make darker
      var num_black_squares = xw.cells.map(x=>x.type).reduce(function(accum, cur) {return accum + (cur==='block' ? 1 : 0);}, 0);
      if (num_black_squares/(xw_height * xw_width) < 0.05) {
        options.gray = 0.1;
      }
    }

    // If options.num_columns is null, we determine it ourselves
    var possibleColumns = [];
    var columnsPreSet = false;
    if (options.num_columns === null || options.num_full_columns === null)
    {
      // special logic for two pages
      if (options.num_pages == 2 || !xw.clues.length) {
        var numCols = Math.min(Math.ceil(clue_length/800), 5);
        options.num_columns = numCols;
        options.num_full_columns = numCols;
        possibleColumns.push({num_columns: numCols, num_full_columns: numCols});
      } else {
        for (var nc = options.min_columns; nc <= options.max_columns; nc++) {
          for (var fc = 0; fc <= nc - 1; fc++) {
            // make the grid and check the cell size
            options.num_columns = nc;
            options.num_full_columns = fc;
            var gp = grid_props(xw, options, DOC_WIDTH, DOC_HEIGHT);
            // we ignore "min_grid_size" for now
            if (gp.cell_size >= options.min_cell_size) {
              possibleColumns.push({num_columns: nc, num_full_columns: fc});
            }
          }
        }
      }
    } else {
      columnsPreSet = true;
      possibleColumns = [{num_columns: options.num_columns, num_full_columns: options.num_full_columns}];
    }

    // The maximum font size of title and author
    var max_title_author_pt = MAX_TITLE_PT;
    var doc;

    // create the clue strings and clue arrays
    var clue_arrays = [];
    var num_arrays = [];
    for (j=0; j < xw.clues.length; j++) {
        var these_clues = [];
        var these_nums = [];
        for (i=0; i< xw.clues[j]['clue'].length; i++) {
            var e = xw.clues[j]['clue'][i];
            // if no number, default to a bullet
            var num = e.number || DEFAULT_NUM;
            var clue = e.text;
            // for acrostics, we don't print a clue without a "number"
            if (xw.metadata.crossword_type == 'acrostic' && num == DEFAULT_NUM) {
                continue;
            }

            //var this_clue_string = num + '. ' + clue;
            var this_clue_string = clue;
            if (i==0) {
                these_clues.push(xw.clues[j].title + '\n' + this_clue_string);
            }
            else {
                these_clues.push(this_clue_string);
            }
            these_nums.push(num);
        }
        // add a space between the clue lists, assuming we're not at the end
        if (j < xw.clues.length - 1) {
            these_clues.push('');
            these_nums.push('');
        }
        clue_arrays.push(these_clues);
        num_arrays.push(these_nums);
    }

	// Update the emoji mapper
	await preloadFromClueArrays(clue_arrays);

    // Loop through and write to PDF if we find a good fit
    // Find an appropriate font size
    // don't do this if there are no clues
    doc = new jsPDF(options.orientation, 'pt', 'letter');
    var possibleDocs = [];
    if (xw.clues.length) {
      possibleColumns.forEach(function(pc) {
        options.num_columns = pc.num_columns;
        options.num_full_columns = pc.num_full_columns;
        var gridProps = grid_props(xw, options, DOC_WIDTH, DOC_HEIGHT);
        docObj = doc_with_clues(xw, options, DOC_WIDTH, DOC_HEIGHT, clue_arrays, num_arrays, gridProps, columnsPreSet);
        if (docObj.clue_pt) {
          possibleDocs.push({docObj: docObj, gridProps: gridProps, columns: pc});
        }
      });
    } else {
      var gridProps = grid_props(xw, options, DOC_WIDTH, DOC_HEIGHT);
      docObj = doc_with_clues(xw, options, DOC_WIDTH, DOC_HEIGHT, clue_arrays, num_arrays, gridProps);
      possibleDocs.push({docObj: docObj, gridProps: gridProps, columns: {}});
    }

    // If there are no possibilities here go to two pages
    if (possibleDocs.length == 0) {
      var numCols = Math.min(Math.ceil(clue_length/800), 5);
      options.num_columns = numCols;
      options.num_full_columns = numCols;
      options.num_pages = 2;
      var gridProps = grid_props(xw, options, DOC_WIDTH, DOC_HEIGHT);
      docObj = doc_with_clues(xw, options, DOC_WIDTH, DOC_HEIGHT, clue_arrays, num_arrays, gridProps);
      var pc = {num_columns: numCols, num_full_columns: numCols};
      possibleDocs.push({docObj: docObj, gridProps: gridProps, columns: pc});
    }

    // How do we pick from among these options?
    // we need an objective function
    // let's say we want things as big as possible?
    var selectedDoc;
    var obj_val = 1000.;
    const ideal_clue_pt = 12.5;
    const ideal_cell_size = (options.max_cell_size + options.min_cell_size)/2.5;
    let ideal_grid_area = ideal_cell_size * ideal_cell_size * xw_height * xw_width;
    // this should be between 1/4 and 2/5 of the doc size
    if (ideal_grid_area < DOC_WIDTH * DOC_HEIGHT * 0.25) {
      ideal_grid_area = DOC_WIDTH * DOC_HEIGHT * 0.25;
    } else if (ideal_grid_area > DOC_WIDTH * DOC_HEIGHT * 0.4) {
      ideal_grid_area = DOC_WIDTH * DOC_HEIGHT * 0.4;
    }
    possibleDocs.forEach(function (pd) {
      //var thisVal = pd.gridProps.cell_size/options.max_cell_size + pd.docObj.clue_pt/options.max_clue_pt;
      //var thisVal = (pd.gridProps.cell_size - ideal_cell_size)**2 + (pd.docObj.clue_pt - ideal_clue_pt)**2;

      var thisGridArea = pd.gridProps.grid_width * pd.gridProps.grid_height;

      // we want the clue point and grid area to be mostly ideal
      // we add a slight penalty for more columns (in general, less is better if it's close)
      var thisVal = ((thisGridArea - ideal_grid_area)/ideal_grid_area)**2 + ((pd.docObj.clue_pt - ideal_clue_pt)/ideal_clue_pt)**2;
      if (pd.columns.num_columns) {
        thisVal += pd.columns.num_columns/500;
      }
      //console.log(pd); console.log(thisVal);
      if (thisVal < obj_val) {
        obj_val = thisVal;
        selectedDoc = pd;
      }
    });

    doc = selectedDoc.docObj.doc;
    var gridProps = selectedDoc.gridProps;
    var grid_xpos = gridProps.grid_xpos
    var grid_ypos = gridProps.grid_ypos;
    var grid_width = gridProps.grid_width;
    var grid_height = gridProps.grid_height;
    var notepad_height = gridProps.notepad_height;
    var notepad_pt = gridProps.notepad_pt;
    var cell_size = gridProps.cell_size;
    var notepad_lines = gridProps.notepad_lines;
    var notepad_xpos = gridProps.notepad_xpos;
    var notepad_ypos = gridProps.notepad_ypos;

    /***********************/

    // If title_pt is null, we determine it
    var DEFAULT_TITLE_PT = MAX_TITLE_PT;
    var total_width = DOC_WIDTH - 2 * margin;
    if (!options.title_pt) {
        options.title_pt = DEFAULT_TITLE_PT;
        var finding_title_pt = true;
        while (finding_title_pt)
        {
            var header1_header2 = options.header1 + 'ABCDEFGH' + options.header2;
            var title_header3 = xw.metadata.title + 'ABCDEFGH' + options.header3;
            doc.setFontSize(options.title_pt).setFont(options.font_type, 'bold');
            var lines1 = doc.splitTextToSize(header1_header2,DOC_WIDTH);
            var lines2 = doc.splitTextToSize(title_header3,DOC_WIDTH);
            if (lines1.length == 1 && lines2.length == 1) {
                finding_title_pt = false;
            }
            else {
                options.title_pt -= 1;
            }
        }
    }
    // same for copyright
    if (!options.copyright_pt) {
        options.copyright_pt = DEFAULT_TITLE_PT;
        var finding_title_pt = true;
        while (finding_title_pt)
        {
            var author_copyright = xw.metadata.author + 'ABCDEFGH' + xw.metadata.copyright;
            doc.setFontSize(options.copyright_pt).setFont(options.font_type, 'normal');
            var lines1 = doc.splitTextToSize(author_copyright,DOC_WIDTH);
            if (lines1.length == 1) {
                finding_title_pt = false;
            }
            else {
                options.title_pt -= 1;
            }
        }
    }



    /* Render headers and footers */
    function renderHeaders(page=1) {
      var title_xpos = margin;
      var author_xpos = DOC_WIDTH - margin;
      var title_author_ypos = margin + max_title_author_pt;
      var right_xpos = DOC_WIDTH - margin;

      if (options.header1 || options.header2) {
        doc.setFontSize(options.title_pt);
        doc.setFont(options.font_type, 'bold');
        doc.text(title_xpos, title_author_ypos, options.header1);
        doc.text(right_xpos, title_author_ypos, options.header2, null, null, 'right');
        title_author_ypos += max_title_author_pt + options.vertical_separator;
      }

      //title
      doc.setFontSize(options.title_pt);
      doc.setFont(options.font_type, 'bold');
      doc.text(title_xpos, title_author_ypos, xw.metadata.title);
      if (options.header3) {
        doc.text(right_xpos, title_author_ypos, options.header3, null, null, 'right');
      }

      // Draw a line under the headers
      var line_x1 = margin;
      var line_x2 = DOC_WIDTH - margin;
      var line_y = title_author_ypos + options.vertical_separator;
      doc.line(line_x1, line_y, line_x2, line_y);

      /* Render copyright */
      var copyright_xpos = DOC_WIDTH - margin;
      var copyright_ypos = DOC_HEIGHT - margin;
      doc.setFontSize(options.copyright_pt);
      doc.setFont(options.font_type, 'normal');
      doc.text(copyright_xpos,copyright_ypos,xw.metadata.copyright,null,null,'right');

      /* Render author */
      var author_xpos = margin;
      var author_ypos = copyright_ypos;
      doc.setFontSize(options.copyright_pt);
      doc.setFont(options.font_type, 'normal');
      doc.text(author_xpos,author_ypos,xw.metadata.author);

      /* Draw a line above the copyright */
      var line2_x1 = line_x1;
      var line2_x2 = line_x2;
      var line2_y = copyright_ypos - options.copyright_pt - options.vertical_separator;
      doc.line(line2_x1, line2_y, line2_x2, line2_y);

      /* Render notepad */
      if (options.show_notepad && page == 1) {
          doc.setFont(options.font_type, 'italic');
          doc.setFontSize(notepad_pt);
          // We can move notepad_ypos up a bit depending on notepad_pt
          //notepad_ypos = grid_ypos + grid_height + options.vertical_separator + (notepad.max_pt + notepad_pt)/2;
          notepad_ypos = grid_ypos + grid_height + options.vertical_separator + notepad_pt;
          notepad_lines.forEach(function(notepad1) {
            doc.text(notepad_xpos, notepad_ypos, notepad1, null, null, 'center');
            notepad_ypos += notepad_pt;
          });
          doc.setFont(options.font_type, 'normal');

          // Draw a rectangle around the notepad
          var notepad_rect_y = grid_ypos + grid_height + options.vertical_separator;
          var notepad_rect_x = grid_xpos;
          var notepad_rect_w = grid_width;
          var notepad_rect_h = notepad_height;
          var notepad_rect_radius = notepad_pt / 2.5;
          doc.roundedRect(notepad_rect_x, notepad_rect_y, notepad_rect_w, notepad_rect_h, notepad_rect_radius, notepad_rect_radius);

      }
    } // end renderHeaders()

    // Add headers to new page
    if (options.num_pages == 1) {
      renderHeaders(page=1);
    } else {
      // we do page 2 first because we switch the pages later
      renderHeaders(page=2);
      doc.addPage();
      renderHeaders(page=1);
    }

    /* Draw grid */

    var grid_options = {
        grid_letters : false
    ,   grid_numbers : true
    ,   x0: grid_xpos
    ,   y0: grid_ypos
    ,   cell_size: grid_width / xw_width
    ,   gray : options.gray
    ,   image: options.image
    };
    draw_crossword_grid(doc, xw, grid_options);

    if (options.num_pages == 2) {
        doc.movePage(2,1);
    }

    doc.save(options.outfile);
}
