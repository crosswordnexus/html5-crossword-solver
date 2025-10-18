/**
* Submission checker
* (c) 2021 Crossword Nexus
* https://mit-license.org/
**/

/* count the black squares in the puzzle */
function countBlackSquares(xw) {
    var ct = 0;
    xw.cells.forEach(function (c) {
        if (c.type == 'block') {
            ct += 1;
        }
    });
    return ct;
}

/* word count */
function wordCount(xw) {
    return xw.words.length;
}

/* three-letter word count */
function threeLetterWordCount(xw) {
    var ct = 0;
    xw.words.forEach(function(w) {
        if (w.cells.length == 3) {
            ct += 1;
        }
    });
    return ct;
}

/* clue character count */
function clueCharacterCount(xw) {
    var ct = 0;
    xw.clues.forEach(function(clueList) {
        clueList.clue.forEach(function (c) {
            var clue_text = c.text || '';
            ct += clue_text.length;
        });
    });
    return ct;
}

/* check for dupes */
function xwDupes(xw, minDupeLength=4) {
    var dupes = [];
    // get the entries in the grid
    var entry_map = xw.get_entry_mapping();
    // make a set of the entries
    var entries = new Set();
    Object.keys(entry_map).forEach(x => entries.add(entry_map[x]))

    xw.clues.forEach(function(clueList) {
        var thisCluesDirection = clueList.title;
        clueList.clue.forEach(function (c) {
            var clue = c.text || '';
            var num = c.number;
            // Loop through words in "clue"
            var words = clue.split(/[ -]/);
            words.forEach(function (word) {
                word = word.toUpperCase();
                // Keep only alpha characters
                word = word.replace(/[^A-Za-z]+/g, "");
                // Only do this for words of length minDupeLength or more
                if (word.length >= minDupeLength) {
                    entries.forEach(function (entry) {
                        if (entry.match(word)) {
                            dupes.push({'entry': entry, 'clue': clue, 'clueDirection': thisCluesDirection, 'clueNumber': num});
                        }
                    }); // end for entry
                } // end if word length
            }); // end for words in clue
        }); // end for clues in clue list
    }); // end for cluelist in xw
    return dupes;
}

function submissionChecker(xw, minDupeLength=4) {
    var check_results = [];
    // black squares: 1/6 of the total squares
    var blackSquareMax = Math.ceil(xw.cells.length / 6);
    var blackSquares = countBlackSquares(xw);
    check_results.push({'name': 'Black squares', 'value': blackSquares, 'max_value': blackSquareMax, 'is_ok': (blackSquares <= blackSquareMax)});
    // Three-letter words: 1/4 of total words
    var threeLetterMax = Math.ceil(0.25 * Object.keys(xw.get_entry_mapping()).length);
    var threeLetterWords = threeLetterWordCount(xw);
    check_results.push({'name': '3-letter words', 'value': threeLetterWords, 'max_value': threeLetterMax, 'is_ok': (threeLetterWords <= threeLetterMax)});
    // Word count: 0.3*w*h+12 (this is an approximate)
    var maxWordCount = Math.ceil(0.3 * xw.metadata.width * xw.metadata.height + 12);
    var word_count = wordCount(xw);
    check_results.push({'name': 'Word count', 'value': word_count, 'max_value': maxWordCount, 'is_ok': (word_count <= maxWordCount)});
    // Clue character count
    var maxClueCharacterCount = Math.ceil((50/9) * xw.metadata.width * xw.metadata.height + 350);
    var clueChars = clueCharacterCount(xw);
    check_results.push({'name': 'Clue characters', 'value': clueChars, 'max_value': maxClueCharacterCount, 'is_ok': (clueChars <= maxClueCharacterCount)});
    // Dupes
    var dupes = xwDupes(xw, minDupeLength);
    check_results.push({'name': 'Dupes', 'value': dupes, 'max_value': null, 'is_ok': (dupes.length == 0)});
    return check_results;
}

function submission_check_html(xw, minDupeLength=4) {
    var check_results = submissionChecker(xw, minDupeLength);
    //console.log(check_results);
    html = '';
    check_results.forEach(function (x) {
        var color = x.is_ok ? 'green' : 'red';
        var emoji = x.is_ok ? '✅' : '❌';
        html += `<h3>${x.name}</h3>`;
        html += `<p style="color:${color};">`;
        if (x.name == 'Dupes') {
            x.value.forEach(function (d) {
                html += `${d.entry} / ${d.clue} [${d.clueNumber}-${d.clueDirection}]<br />\n`;
            });
            if (!x.value.length) {
                html += 'No dupes found.';
            }
        } else {
            html += `${x.value} ${emoji}</p>`;
            if (!x.is_ok) {
                html += `<p>Typical limit: ${x.max_value}</p>`;
            }
        }
    });
    return html;
}
