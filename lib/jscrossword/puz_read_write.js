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
