// Parts of this code from xroz
// xroz - play crosswords within your browser
// Author: Alex Stangl  8/14/2011
// Copyright 2011, Alex Stangl. All Rights Reserved.
// Licensed under ISC license (see LICENSE file)
// https://github.com/astangl/xroz/blob/master/LICENSE

// Remainder of this code (c) 2016 Alex Boisvert
// licensed under MIT license
// https://opensource.org/licenses/MIT

//
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

    // return new child element of specified type, appended to parent
    function appendChild(parentElement, elementType) { 
        return parentElement.appendChild(document.createElement(elementType));
    }

    // append text to specified element, optionally including a <br/> before it
    function appendText(text, element, includeBreakBefore) {
        if (includeBreakBefore) {
            appendChild(element, "br");
        }
        element.appendChild(document.createTextNode(text));
    }

    // remove all children from specified DOM element
    function removeChildren(element) {
        while (element.hasChildNodes()) {
            element.removeChild(element.firstChild);
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
			alert('Not a .puz file!');
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
			alert('Not a .puz file!');
            throw {
                name: "BADMAGICNUMBER",
                message: "File did not contain expected magic number, contained '" + filemagic + "'."
            };
        }
        retval.version = bytes.substring(24, 27);
        retval.width = w;
        retval.height = h;
        retval.nbrClues = nbrClues;
        retval.solution = bytes.substring(52, 52 + wh);
        retval.strings = bytes.substring(strings_offset).split('\u0000', nbrClues + 4);
        retval.grid = bytes.substring(grid_offset, grid_offset + wh);
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
            if (chksum !== compChksum) {
                throw {
                    name: "BadExtraSectionChecksum",
                    message: "Extra section " + sectName + " had computed checksum " + compChksum + ", versus given checksum " + chksum
                };
            }
            if (sectName === "GEXT") {
                retval.gext = bytes.substring(offset + 8, offset + 8 + len);
            }
            offset += len + 9;
            //alert("Extra section " + sectName);
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
                else if (!isBlack)
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
                else if (!isBlack)
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


