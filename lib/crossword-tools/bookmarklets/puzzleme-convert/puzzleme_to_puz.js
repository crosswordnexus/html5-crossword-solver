/**
 * PuzzleMe to PUZ version 0.2.3

 * Changelog:
   * 0.2.3:
     * default to srcFileName for the filename if the title is blank
     * Create default values for title / author / copyright
   * 0.2.2:
     * Remove HTML tags from clues
   * 0.2.1:
     * Quick fix for rebus puzzles
   * 0.2:
     * Remove unnecessary code
     * Fix character encoding in meta-fields
     * Create filename from title
**/

/**
 * This section of the code from
 * https://github.com/rjkat/anagrind/blob/master/client/js/puz.js
 * Released under MIT License
 * https://opensource.org/licenses/MIT
**/

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

const PUZ_STRING_FIELDS = ['title', 'author', 'copyright'];

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
    return windows1252_encode(s);
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


        header.set(encoder.encode("ACROSS&DOWN"), i.MAGIC);
        header.set(encoder.encode("1.3"), i.VERSION);

        header[i.WIDTH] = this.width;
        header[i.HEIGHT] = this.height;
        writeUInt16LE(header, i.NUM_CLUES, this.clues.length);

        header[i.UNKNOWN_BITMASK] = 0x01;

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

/******************/

/* Function to convert utf-8 to iso-8859-1 */
function utf8_decode ( str_data ) {
    var tmp_arr = [], i = ac = c1 = c2 = c3 = 0;

    str_data += '';

    while ( i < str_data.length ) {
        c1 = str_data.charCodeAt(i);
        if (c1 < 128) {
            tmp_arr[ac++] = String.fromCharCode(c1);
            i++;
        } else if ((c1 > 191) && (c1 < 224)) {
            c2 = str_data.charCodeAt(i+1);
            tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
            i += 2;
        } else {
            c2 = str_data.charCodeAt(i+1);
            c3 = str_data.charCodeAt(i+2);
            tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }
    }

    return tmp_arr.join('');
}

/* Grab the data from amuselabs */
var puzdata = JSON.parse(atob(window.rawc));
var meta = {
    title: utf8_decode(puzdata.title) || 'Untitled',
    author: utf8_decode(puzdata.author) || 'No author given',
    copyright: utf8_decode(puzdata.copyright) || '(c)',
    note: puzdata.description,
    width: puzdata.w,
    height: puzdata.h,
};

/* Solution and grid */
var soln = '';
var grid = '';
for (var j=0; j < puzdata.h; j++) {
  for (var i=0; i < puzdata.w; i++) {
    var letter = puzdata.box[i][j];
    if (letter == '\u0000') {
      soln += '.';
      grid += '.';
    }
    else {
      soln += letter.charAt(0); /* temporary fix for rebus puzzles */
      grid += '-';
    }
  }
}

/* Grab and sort the clues */
var all_entries = puzdata.placedWords;
all_entries.sort(function(x, y) {
   if (x.clueNum < y.clueNum) {
       return -1;
   } else if (x.clueNum > y.clueNum) {
       return 1;
   }
   else {
       if (x.acrossNotDown > y.acrossNotDown) {
           return -1;
       } else if (x.acrossNotDown < y.acrossNotDown) {
           return 1;
       }
   }
   return 0;
});

/* Function to fix some characters we couldn't do before */
function puzzleme_character_replace(s) {
  s = s.replaceAll('â\u0080\u009c', '"');
  s = s.replaceAll('â\u0080\u009d', '"');
  s = s.replaceAll('â\u0080\u0098', "'");
  s = s.replaceAll('â\u0080\u0099', "'");
  s = s.replaceAll('â\u0080\u0094', "--");
  return s;
}

/* function to strip HTML tags */
/* via https://stackoverflow.com/a/5002618 */
function strip_html(s) {
    var div = document.createElement("div");
    div.innerHTML = s;
    var text = div.textContent || div.innerText || "";
    return text;
}

/* Fix the clues */
var clues = [];
for (var i=0; i<all_entries.length; i++) {
  var clue = all_entries[i]['clue']['clue'];
  clue = utf8_decode(strip_html(puzzleme_character_replace(clue)));
  clues.push(clue);
}

/* Create the object */
var puz_payload = new PuzPayload(meta, clues, soln, grid);

/* We base the filename on the puzzle title */
var outname = puzdata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.puz';
// if there's no title, base it on the srcFileName
if (!puzdata.title) {
    outname = puzdata.srcFileName;
    outname = outname.split('.')[0] + '.puz';
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

/** Download puzdata as a .puz file **/
function puz_download(puz_payload, outname) {
    file_download(puz_payload.toBytes(), outname, 'application/octet-stream');
}

puz_download(puz_payload, outname);
