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
    ,   gray : 0.4
    };

    for (var key in DEFAULT_OPTIONS) {
        if (!DEFAULT_OPTIONS.hasOwnProperty(key)) continue;
        if (!options.hasOwnProperty(key))
        {
            options[key] = DEFAULT_OPTIONS[key];
        }
    }

    var PTS_TO_IN = 72;
    var cell_size = options.cell_size;

    /** Function to draw a square **/
    function draw_square(doc,x1,y1,cell_size,number,letter,filled,cell) {

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

        var MIN_NUMBER_SIZE = 5.5;

        var filled_string = (filled ? 'F' : '');
        var number_offset = cell_size/20;
        var number_size = cell_size/3.5 < MIN_NUMBER_SIZE ? MIN_NUMBER_SIZE : cell_size/3.5;
        //var letter_size = cell_size/1.5;
        var letter_length = letter.length;
        var letter_size = cell_size/(1.5 + 0.5 * (letter_length - 1));
        var letter_pct_down = 4/5;

        if (cell['background-color']) {
            var filled_string = 'F';
            var rgb = hexToRgb(cell['background-color']);
            doc.setFillColor(rgb.r, rgb.g, rgb.b);
            doc.setDrawColor(options.gray.toString());
            // Draw one filled square and then one unfilled
            doc.rect(x1, y1, cell_size, cell_size, filled_string);
            doc.rect(x1, y1, cell_size, cell_size, '');
        }
        else {
            doc.setFillColor(options.gray.toString());
            doc.setDrawColor(options.gray.toString());
            // draw the bounding box for all squares except "clue" squares
            if (!cell.clue) {
                doc.rect(x1, y1, cell_size, cell_size, '');
                doc.rect(x1, y1, cell_size, cell_size, filled_string);
            }
        }
        //numbers
        doc.setFontType('normal');
        doc.setFontSize(number_size);
        doc.text(x1+number_offset,y1+number_size,number);

        // top-right numbers
        var top_right_number = cell.top_right_number ? cell.top_right_number : '';
        doc.setFontSize(number_size);
        doc.text(x1 + cell_size - number_offset, y1 + number_size, top_right_number, null, null, 'right');

        // letters
        doc.setFontType('normal');
        doc.setFontSize(letter_size);
        doc.text(x1+cell_size/2,y1+cell_size * letter_pct_down,letter,null,null,'center');

        // circles
        if (cell['background-shape']) {
            doc.circle(x1+cell_size/2,y1+cell_size/2,cell_size/2);
        }
        // bars
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
    }

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
        // draw the square unless it's a void
        // or a block with a white background
        draw_square(doc,x_pos,y_pos,cell_size,number,letter,filled,c);
    });
}

/** Create a PDF (requires jsPDF) **/

function jscrossword_to_pdf(xw, options={}) {
    var DEFAULT_OPTIONS = {
        margin: 40
    ,   title_pt: 12
    ,   author_pt: 12
    ,   copyright_pt: 12
    ,   num_columns : null
    ,   num_full_columns: null
    ,   column_padding: 10
    ,   gray: 0.5
    ,   under_title_spacing : 20
    ,   max_clue_pt : 14
    ,   min_clue_pt : 5
    ,   grid_padding : 5
    ,   outfile : null
    ,   vertical_separator : 10
    ,   show_notepad : false
    };

    for (var key in DEFAULT_OPTIONS) {
        if (!DEFAULT_OPTIONS.hasOwnProperty(key)) continue;
        if (!options.hasOwnProperty(key))
        {
            options[key] = DEFAULT_OPTIONS[key];
        }
    }

    var xw_height = xw.metadata.height;
    var xw_width = xw.metadata.width;

    // If there's no filename, use the title
    if (!options.outfile) {
        var outname = xw.metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
        options.outfile = outname;
    }

    // variables used in for loops
    var i, j;

    // If options.num_columns is null, we determine it ourselves
    if (options.num_columns === null || options.num_full_columns === null)
    {
        var word_count = xw.words.length;
        if (xw_height > 2 * xw_width) {
            options.num_columns = 5;
            options.num_full_columns = 3;
        }
        // handle puzzles with very few words
        else if (word_count <= 30) {
            options.num_columns = Math.ceil(word_count/10);
            options.num_full_columns = 0;
        }
        else if (xw_height >= 17) {
            options.num_columns = 5;
            options.num_full_columns = 2;
        }
        else if (xw_width > 17) {
            options.num_columns = 4;
            options.num_full_columns = 1;
        }
        else if (xw_height <= 11) {
            options.num_columns = 3;
            options.num_full_columns = 0;
        }
        else {
            options.num_columns = 3;
            options.num_full_columns = 1;
        }
    }

    // The maximum font size of title and author
    var max_title_author_pt = Math.max(options.title_pt,options.author_pt);

    var PTS_PER_IN = 72;
    var DOC_WIDTH = 8.5 * PTS_PER_IN;
    var DOC_HEIGHT = 11 * PTS_PER_IN;

    var margin = options.margin;

    var doc;

    // create the clue strings and clue arrays
    var clue_arrays = [];
    for (j=0; j < xw.clues.length; j++) {
        var these_clues = [];
        for (i=0; i< xw.clues[j]['clue'].length; i++) {
            var e = xw.clues[j]['clue'][i];
            var num = e.number;
            var clue = e.text;
            var this_clue_string = num + '. ' + clue;
            if (i==0) {
                these_clues.push(xw.clues[j].title + '\n' + this_clue_string);
            }
            else {
                these_clues.push(this_clue_string);
            }
        }
        // add a space between the clue lists, assuming we're not at the end
        if (j < xw.clues.length - 1) {
            these_clues.push('');
        }
        clue_arrays.push(these_clues);
    }

    // size of columns
    var col_width = (DOC_WIDTH - 2 * margin - (options.num_columns -1 ) * options.column_padding) / options.num_columns;

    // The grid is under all but the first few columns
    var grid_width = DOC_WIDTH - 2 * margin - options.num_full_columns * (col_width + options.column_padding);
    var grid_height = (grid_width / xw_width) * xw_height;

    // We change the grid width and height if num_full_columns == 0
    // This is because we don't want it to take up too much space
    if (options.num_full_columns === 0) {
        // set the height to be (about) half of the available area
        grid_height = DOC_HEIGHT * 4/9;
        grid_width = (grid_height / xw_height) * xw_width;
        // however! if this is bigger than allowable, re-calibrate
        if (grid_width > (DOC_WIDTH - 2 * margin)) {
            grid_width = (DOC_WIDTH - 2 * margin);
            grid_height = (grid_width / xw_width) * xw_height;
        }
    }

    // Notepad space
    var notepad = {'max_pt': 12, 'max_lines': 1};
    var MAX_NOTEPAD_LINE_LENGTH = 0.23 * grid_width;

    // We change the notepad height for especially long notepads
    if (xw.metadata.description.length > MAX_NOTEPAD_LINE_LENGTH) {
        notepad = {'max_pt': 20, 'max_lines': 2};
    }

    if (!options.show_notepad) {
        notepad = {'max_pt': 0, 'max_lines': 0};
    }

    // helper value for multiplying
    var show_notepad_int = options.show_notepad ? 1 : 0;

    // Reserve spot for the notepad
    var notepad_ypos = DOC_HEIGHT - margin - options.copyright_pt - options.vertical_separator * 2;
    var notepad_xpos = DOC_WIDTH - margin - grid_width/2;

    // x and y position of grid
    var grid_xpos = DOC_WIDTH - margin - grid_width;
    var grid_ypos = notepad_ypos - show_notepad_int * (options.vertical_separator + notepad.max_pt) - grid_height;

    // we change the x position of the grid if there are no full columns
    // specifically, we want to center it.
    if (options.num_full_columns == 0) {
        grid_xpos = (DOC_WIDTH - grid_width)/2;
        notepad_xpos = DOC_WIDTH/2;
    }

    // function to traverse DOM tree
    function traverseTree(htmlDoc, agg=[]) {
        if (htmlDoc.nodeName == '#text') {
            // if we have a text element we can add it
            var thisTag = htmlDoc.parentNode.tagName;
            var is_bold = (thisTag == 'B');
            var is_italic = (thisTag == 'I');
            htmlDoc.textContent.split('').forEach(char => {
                agg.push({'char': char, 'is_bold': is_bold, 'is_italic': is_italic});
            });
        }
        for (var i=0; i<htmlDoc.childNodes.length; i++) {
            agg = traverseTree(htmlDoc.childNodes[i], agg=agg);
        }
        return agg;
    }

    // helper function for bold and italic clues
    function split_text_to_size_bi(clue, col_width, doc) {
        // get the clue with HTML stripped out
        var el = document.createElement( 'html' );
        el.innerHTML = clue;
        var clean_clue = el.innerText;
        // split the clue
        var lines1 = doc.splitTextToSize(clean_clue, col_width);

        // if there's no <B> or <I> in the clue just return lines1
        if (clue.toUpperCase().indexOf('<B') == -1 && clue.toUpperCase().indexOf('<I') == -1) {
            return lines1;
        }

        // parse the clue into a tree
        var myClueArr = [];
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(clue, 'text/html');
        var split_clue = traverseTree(htmlDoc);

        // Make a new "lines1" with all bold splits
        doc.setFontType('bold');
        lines1 = doc.splitTextToSize(clean_clue, col_width);
        doc.setFontType('normal');

        // split this like we did the "lines1"
        var lines = [];
        var ctr = 0;
        lines1.forEach(line => {
            var thisLine = [];
            var myLen = line.length;
            for (var i=0; i < myLen; i++) {
                thisLine.push(split_clue[ctr++]);
            }
            // skip the next char if it's a space
            if (split_clue[ctr]) {
                if (split_clue[ctr].char == ' ' || split_clue[ctr].char == '\n') {
                    ctr = ctr + 1;
                }
            }
            lines.push(thisLine);
        });
        return lines;
    }

    // Print a line of text that may be bolded or italicized
    const printCharacters = (doc, textObject, startY, startX, fontSize) => {
        if (!textObject.length) {
            return;
        }

        //console.log(textObject);
        if (typeof(textObject) == 'string') {
            doc.text(startX, startY, line);
        }
        else {
            textObject.map(row => {
                if (row.is_bold) {
                    doc.setFontType('bold');
                }
                else if (row.is_italic) {
                    doc.setFontType('italic');
                }
                else {
                    doc.setFontType('normal');
                }

                doc.text(row.char, startX, startY);
                startX = startX + doc.getStringUnitWidth(row.char) * fontSize;
                doc.setFontType('normal');
            });
        }
    };

    // Loop through and write to PDF if we find a good fit
    // Find an appropriate font size
    var clue_pt = options.max_clue_pt;
    var finding_font = true;
    while (finding_font)
    {
        doc = new jsPDF('portrait','pt','letter');
        var clue_padding = clue_pt / 3;
        doc.setFontSize(clue_pt);

        doc.setLineWidth(options.line_width);

        // Print the clues
        var line_xpos = margin;
        var top_line_ypos = margin + // top margin
                    max_title_author_pt + // title
                    options.vertical_separator * 2 + // padding
                    clue_pt + clue_padding; // first clue
        var line_ypos = top_line_ypos;
        var my_column = 0;
        for (var k=0; k<clue_arrays.length; k++) {
            var clues = clue_arrays[k];
            for (var i=0; i<clues.length; i++) {
                var clue = clues[i];
                // check to see if we need to wrap
                var max_line_ypos;
                if (my_column < options.num_full_columns) {
                    max_line_ypos = DOC_HEIGHT - margin - options.copyright_pt - 2 * options.vertical_separator;
                } else {
                    max_line_ypos = grid_ypos - options.grid_padding;
                }

                // Split our clue
                var lines = split_text_to_size_bi(clue, col_width, doc);

                if (line_ypos + (lines.length - 1) * (clue_pt + clue_padding) > max_line_ypos) {
                    // move to new column
                    my_column += 1;
                    line_xpos = margin + my_column * (col_width + options.column_padding);
                    line_ypos = top_line_ypos;
                    // if we're at the top of a line we don't print a blank clue
                    if (clue == '') {
                        continue;
                    }
                }

                for (var j=0; j<lines.length; j++)
                {
                    // Set the font to bold for the title
                    if (i==0 && j==0) {
                        doc.setFontType('bold');
                    } else {
                        doc.setFontType('normal');
                    }
                    var line = lines[j];
                    // print the text
                    //doc.text(line_xpos,line_ypos,line);
                    printCharacters(doc, line, line_ypos, line_xpos, clue_pt);

                    // set the y position for the next line
                    line_ypos += clue_pt + clue_padding;
                }
            }
        }

        // let's not let the font get ridiculously tiny
        if (clue_pt == options.min_clue_pt)
        {
            finding_font = false;
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


    /***********************/

    // If title_pt or author_pt are null, we determine them
    var DEFAULT_TITLE_PT = 12;
    var total_width = DOC_WIDTH - 2 * margin;
    if (!options.author_pt) options.author_pt = options.title_pt;
    if (!options.title_pt) {
        options.title_pt = DEFAULT_TITLE_PT;
        var finding_title_pt = true;
        while (finding_title_pt)
        {
            var title_author = xw.metadata.title;
            doc.setFontSize(options.title_pt)
                .setFontType('bold');
            var lines = doc.splitTextToSize(title_author,DOC_WIDTH);
            if (lines.length == 1) {
                finding_title_pt = false;
            }
            else {
                options.title_pt -= 1;
            }
        }
        options.author_pt = options.title_pt;
    }



    /* Render title and author */

    var title_xpos = margin;
    var author_xpos = DOC_WIDTH - margin;
    var title_author_ypos = margin + max_title_author_pt;
    //title
    doc.setFontSize(options.title_pt);
    doc.setFontType('bold');
    doc.text(title_xpos,title_author_ypos,xw.metadata.title);

    // Draw a line under the headers
    var line_x1 = margin;
    var line_x2 = DOC_WIDTH - margin;
    var line_y = title_author_ypos + options.vertical_separator;
    doc.line(line_x1, line_y, line_x2, line_y);

    /* Render copyright */
    var copyright_xpos = DOC_WIDTH - margin;
    var copyright_ypos = DOC_HEIGHT - margin;
    doc.setFontSize(options.copyright_pt);
    doc.setFontType('normal');
    doc.text(copyright_xpos,copyright_ypos,xw.metadata.copyright,null,null,'right');

    /* Render author */
    var author_xpos = margin;
    var author_ypos = copyright_ypos;
    doc.setFontSize(options.copyright_pt);
    doc.setFontType('normal');
    doc.text(author_xpos,author_ypos,xw.metadata.author);

    /* Draw a line above the copyright */
    var line2_x1 = line_x1;
    var line2_x2 = line_x2;
    var line2_y = copyright_ypos - options.copyright_pt - options.vertical_separator;
    doc.line(line2_x1, line2_y, line2_x2, line2_y);

    /* Render notepad */
    if (options.show_notepad) {
        doc.setFontType('italic');
        var notepad_pt = (notepad.max_pt - 2)/notepad.max_lines;
        doc.setFontSize(notepad_pt);
        var notepad_lines = doc.splitTextToSize(xw.metadata.description,grid_width - 20);
        while (notepad_lines.length > notepad.max_lines) {
            notepad_pt -= 0.2;
            doc.setFontSize(notepad_pt);
            notepad_lines = doc.splitTextToSize(xw.metadata.description,grid_width - 20);
        }
        // We can move notepad_ypos up a bit depending on notepad_pt
        //notepad_ypos = grid_ypos + grid_height + options.vertical_separator + (notepad.max_pt + notepad_pt)/2;
        notepad_ypos = grid_ypos + grid_height + options.vertical_separator + notepad_pt;
        var notepad_options = {'align': 'center', 'lineHeightFactor': 1};
        notepad1 = xw.metadata.description; notepad2 = '';
        if (notepad1.length > MAX_NOTEPAD_LINE_LENGTH) {
            var cutoff_index = puzdata.notes.indexOf(' ', notepad1.length/2);
            notepad1 = xw.metadata.description.substr(0,cutoff_index);
            notepad2 = xw.metadata.description.substr(cutoff_index+1);
        }

        doc.text(notepad_xpos,notepad_ypos,notepad1,null,null,'center');
        if (notepad2) {
            doc.text(notepad_xpos, notepad_ypos + notepad_pt, notepad2, null, null, 'center');
        }
        doc.setFontType('normal');

        // Draw a rectangle around the notepad
        var notepad_rect_y = grid_ypos + grid_height + options.vertical_separator;
        var notepad_rect_x = grid_xpos;
        var notepad_rect_w = grid_width;
        var notepad_adj = (notepad.max_lines == 2 ? 1.2 : 1.4);
        var notepad_rect_h = notepad_pt * notepad.max_lines * notepad_adj;
        var notepad_rect_radius = notepad_pt / 2.5;
        doc.roundedRect(notepad_rect_x, notepad_rect_y, notepad_rect_w, notepad_rect_h, notepad_rect_radius, notepad_rect_radius);

    }

    /* Draw grid */

    var grid_options = {
        grid_letters : false
    ,   grid_numbers : true
    ,   x0: grid_xpos
    ,   y0: grid_ypos
    ,   cell_size: grid_width / xw_width
    ,   gray : options.gray
    };
    draw_crossword_grid(doc, xw, grid_options);

    doc.save(options.outfile);
}

/** Create a NYT submission (requires jsPDF) **/
function jscrossword_to_nyt(xw, options={})
{
    var DEFAULT_OPTIONS = {
        margin: 20
    ,   grid_size : 360
    ,   email : ''
    ,   address : ''
    ,   header_pt : 10
    ,   grid_padding: 20
    ,   footer_pt: 8
    ,   clue_width : 250
    ,   entry_left_padding: 150
    ,   clue_entry_pt : 10
    ,   outfile: null
    ,   gray: 0.6
    };

    for (var key in DEFAULT_OPTIONS) {
        if (!DEFAULT_OPTIONS.hasOwnProperty(key)) continue;
        if (!options.hasOwnProperty(key))
        {
            options[key] = DEFAULT_OPTIONS[key];
        }
    }

    var xw_height = xw.metadata.height;
    var xw_width = xw.metadata.width;

    // If there's no filename, use the title
    if (!options.outfile) {
        var outname = xw.metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_nyt.pdf';
        options.outfile = outname;
    }

    var PTS_PER_IN = 72;
    var DOC_WIDTH = 8.5 * PTS_PER_IN;
    var DOC_HEIGHT = 11 * PTS_PER_IN;

    var margin = options.margin;
    var usable_height = DOC_HEIGHT - 2 * margin - options.footer_pt;

    var doc = new jsPDF('portrait','pt','letter');

    function print_headers(doc,headers,pt,margin) {
        // print headers; return where the next line would be
        var x0 = margin;
        var y0 = margin;
        var header_padding = pt/3;
        doc.setFontSize(pt);
        for (var i=0;i<headers.length;i++) {
            doc.text(x0,y0,headers[i]);
            y0 += pt + header_padding;
        }
        return y0;
    }

    function print_page_num(doc,pt,margin,doc_height,num) {
        var x0 = margin;
        var y0 = doc_height - margin;
        doc.setFontSize(pt)
            .text(x0,y0,'Page ' + num.toString());
    }

    /** First page: filled grid **/
    // Print the headers
    var headers = [];
    // only include the title if it's a Sunday
    if (xw_width >= 17)
    {
        headers.push(xw.metadata.title);
    }
    headers.push(xw.metadata.author);
    var address_arr = options.address.split('\n');
    headers = headers.concat(address_arr);
    headers.push(options.email);
    headers.push('');
    headers.push('Word count: ' + xw.words.length.toString());
    var y0 = print_headers(doc,headers,options.header_pt,margin);

    // Print the filled grid
    var grid_ypos = y0 + options.grid_padding;
    // adjust the the grid size if we don't have enough space
    var grid_size = options.grid_size;
    if (grid_size > DOC_HEIGHT - grid_ypos - margin - options.footer_pt) {
        grid_size = DOC_HEIGHT - grid_ypos - margin - options.footer_pt;
    }
    // position x so that the grid is centered
    var grid_xpos = (DOC_WIDTH - grid_size)/2;
    var first_page_options = {
        grid_letters : true
    ,   grid_numbers : true
    ,   x0: grid_xpos
    ,   y0: grid_ypos
    //,   grid_size: grid_size
    ,   cell_size: grid_size / xw_width
    ,   gray : options['gray']
    };
    draw_crossword_grid(doc, xw, first_page_options);
    print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,1);

    /** Second page: empty grid **/
    doc.addPage();
    print_headers(doc,headers,options.header_pt,margin);
    var second_page_options = {
        grid_letters : false
    ,   grid_numbers : true
    ,   x0: grid_xpos
    ,   y0: grid_ypos
    //,   grid_size: grid_size
    ,   cell_size: grid_size / xw_width
    ,   gray : options['gray']
    };
    draw_crossword_grid(doc, xw, second_page_options);
    print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,2);

    /** Remaining pages: clues and entries **/
    // Set up two arrays: one of clues and one of entries
    var clues = [];
    var entries = [];

    xw.clues.forEach(function(clue_list) {
        clues.push(clue_list.title); entries.push('');
        clue_list.clue.forEach(function(my_clue) {
            var num = my_clue['number'];
            var clue = my_clue['text'];
            var entry = xw.wordid_to_word(my_clue['word']);
            clues.push(num + ' ' + clue); entries.push(entry);
        });
    });

    var page_num = 3;
    doc.setFontSize(options.clue_entry_pt);
    headers = [xw.metadata.author];

    // new page
    doc.addPage();
    print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,page_num);
    var clue_ypos = print_headers(doc,headers,options.header_pt,margin);
    clue_ypos += options.clue_entry_pt;
    var clue_xpos = margin;
    var entry_xpos = margin + options.clue_width + options.entry_left_padding;
    var entry_ypos = clue_ypos;

    for (var i=0;i<clues.length;i++) {
        var clue = clues[i];
        var entry = entries[i];
        var lines = doc.splitTextToSize(clue,options.clue_width);
        // check that the clue fits; if not, make a new page
        if (clue_ypos + lines.length * options.clue_entry_pt + options.footer_pt + margin > DOC_HEIGHT) {
            doc.addPage();
            page_num += 1;
            print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,page_num);
            clue_ypos = print_headers(doc,headers,options.header_pt,margin);
            clue_ypos += options.clue_entry_pt;
            entry_ypos = clue_ypos;
        }
        // print the clue
        for (var j=0; j<lines.length;j++) {
            doc.setFontSize(options.clue_entry_pt).text(clue_xpos,clue_ypos,lines[j]);
            clue_ypos += options.clue_entry_pt;
        }
        // print the entry
        doc.setFontSize(options.clue_entry_pt).text(entry_xpos,entry_ypos,entry);

        // adjust the coordinates (double-spacing)
        clue_ypos += options.clue_entry_pt;
        entry_ypos = clue_ypos;
    }
    console.log('done');

    doc.save(options.outfile);
}
