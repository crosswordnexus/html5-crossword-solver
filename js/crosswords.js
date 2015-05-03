/**
Copyright (c) 2015, Crossword Nexus
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/
// Main crossword javascript for the Crossword Nexus HTML5 Solver

(function(global, factory) {
	if ( typeof module === "object" && typeof module.exports === "object" ) {
		module.exports = factory(global);
	} else {
		factory(global, true);
	}
}(typeof window !== "undefined" ? window : this, function(window, registerGlobal) {
	"use strict";

	var default_config = {
		hover_enabled: false,
		settings_enabled: true,
		color_hover: "#FFFFAA",
		color_selected: "#FFA500",
		color_word: "#FFFF00",
		color_hilite: "#FFFCA5",
		color_none: "#FFFFFF",
		color_block: "#000000",
		cell_size: null, // null or anything converts to 0 means 'auto'
		puzzle_file: null,
		puzzles: null,
		skip_filled_letters: true,
		savegame_name: ''
	};

	// constants
	var FILE_JPZ = 'jpz';
	var CLUES_TOP = "clues_top";
	var CLUES_BOTTOM = "clues_bottom";
	var MIN_SIZE = 10;
	var MAX_SIZE = 100;
	var SKIP_UP = 'up';
	var SKIP_DOWN = 'down';
	var SKIP_LEFT = 'left';
	var SKIP_RIGHT = 'right';
	var STORAGE_KEY = 'crossword_nexus_savegame';

	// messages
	var MSG_SAVED = 'Crossword saved';
	var MSG_LOADED = 'Crossword loaded';
	var MSG_SOLVED = 'Crossword solved! Congratulations!';

	var SIZE_BIG = 'big';
	var SIZE_NORMAL = 'normal';
	var SIZE_SMALL = 'small';
	var SIZE_TINY = 'tiny';

	var BIG_THRESHOLD = 700;
	var NORMAL_THRESHOLD = 580;
	var SMALL_THRESHOLD = 450;

	var TYPE_UNDEFINED = typeof undefined;
	var XMLDOM_ELEMENT = 1;
	var XMLDOM_TEXT = 3;
	var ZIPJS_CONFIG_OPTION = 'zipjs_path';
	var ZIPJS_PATH = 'lib/zip';

	// errors
	var ERR_FILE_LOAD     = 'Error loading file';
	var ERR_UNZIP         = 'Failed to unzip file';
	var ERR_PARSE_JPZ     = 'Error parsing JPZ file... Not JPZ or zipped JPZ file.';
	var ERR_NOT_CROSSWORD = 'Error opening file. Probably not a crossword.';
	var ERR_NO_JQUERY     = 'jQuery not found';
	var ERR_CLUES_GROUPS  = 'Wrong number of clues in jpz file';
	var ERR_NO_ZIPJS      = 'Zip js not found';
	var ERR_LOAD          = 'Error loading savegame - probably corrupted';
	var ERR_NO_SAVEGAME   = 'No saved game found';

	var load_error = false;

	var template = '' +
'<div class="cw-main auto normal">'+
	'<div class="cw-open-holder">'+
		'<div class="cw-overflow"></div>'+
		'<div class="cw-open-puzzle">'+
			'<div class="cw-text">Select puzzle</div>'+
			'<div class="cw-puzzles-list"></div>'+
			'<div class="cw-text">or</div>'+
			'<div class="cw-open-button"></div>'+
		'</div>'+
		'<input type="file" class="cw-open-jpz" accept="application/jpz">'+
	'</div>'+
	'<div class="cw-settings-icon"></div>'+
	'<div class="cw-settings">'+
		'<div class="cw-settings-overflow"></div>'+
		'<div class="cw-settings-background"></div>'+
		'<div class="cw-option cw-color-hover"><span class="cw-option-text">Hovered</span><input class="cw-input-color" type="text"><span class="cw-color-preview"></span></div>'+
		'<div class="cw-option cw-color-selected"><span class="cw-option-text">Selected</span><input class="cw-input-color" type="text"><span class="cw-color-preview"></span></div>'+
		'<div class="cw-option cw-color-word"><span class="cw-option-text">Word</span><input class="cw-input-color" type="text"><span class="cw-color-preview"></span></div>'+
		'<div class="cw-option cw-color-hilite"><span class="cw-option-text">Hilite</span><input class="cw-input-color" type="text"><span class="cw-color-preview"></span></div>'+
		'<div class="cw-option cw-cell-size"><span class="cw-option-text">Size</span><input class="cw-input-size" type="text"><label><input type="checkbox">Auto</label></div>'+
		'<div class="cw-option cw-skip-filled"><label><input type="checkbox">Skip filled letters</label></div>'+
		'<button>Ok</button>'+
	'</div>'+
	'<div class="cw-top-text"></div>'+
	'<div class="cw-full-height"></div>'+
	'<input type="text" class="cw-hidden-input">'+
	'<div class="cw-canvas">'+
		'<canvas></canvas>'+
	'</div>'+
	'<div class="cw-bottom-text"></div>'+
	'<div class="cw-right">'+
		'<div class="cw-buttons-holder">'+
			'<div class="cw-button cw-reveal">Reveal'+
				'<div class="cw-reveal-buttons">'+
					'<div class="cw-button cw-reveal-letter">Letter</div>'+
					'<div class="cw-button cw-reveal-word">Word</div>'+
					'<div class="cw-button cw-reveal-puzzle">Puzzle</div>'+
				'</div>'+
			'</div>'+
			'<div class="cw-button cw-save">Save</div>'+
			'<div class="cw-button cw-load">Load</div>'+
		'</div>'+
		'<div class="cw-clues-holder">'+
			'<div class="cw-clues cw-clues-top">'+
				'<div class="cw-clues-title"></div>'+
				'<div class="cw-clues-items"></div>'+
			'</div>'+
			'<div class="cw-clues cw-clues-bottom">'+
				'<div class="cw-clues-title"></div>'+
				'<div class="cw-clues-items"></div>'+
			'</div>'+
		'</div>'+
	'</div>'+
'</div>';


	function openPuzzle(e) {
		var target = $(e.currentTarget);
		return loadFileFromServer(target.data('url'), target.data('type'));
	}


	// returns deferred object
	function loadFileFromServer(path, type) {
		var xhr = new XMLHttpRequest(),
			deferred = $.Deferred();
		xhr.open('GET', path);
		xhr.responseType = 'blob';
		xhr.onload = function() {
			if (xhr.status == 200) {
				loadFromFile(xhr.response, type, deferred);
			} else {
				deferred.reject(ERR_FILE_LOAD);
			}
		};
		xhr.send();
		return deferred;
	}

	function loadFromFile(file, type, deferred) {
		var reader = new FileReader();
		deferred = deferred || $.Deferred();
		reader.onload = function(event) {
			var string = event.target.result;
			if (type === FILE_JPZ) {
				if (string.match(/^<\?xml/)) { // xml
					parseJPZString(event.target.result, deferred);
				} else { // probably, zipped xml
					unzip(new zip.TextReader(file), parseJPZString, deferred);
				}
			}
		};
		reader.readAsText(file);
		return deferred;
	}

	function unzip(zip_reader, success_callback, deferred) {
		zip.workerScripts = {'inflater': [ZIPJS_PATH+'/z-worker.js', ZIPJS_PATH+'/inflate.js']};
		// use a BlobReader to read the zip from a Blob object
		zip.createReader(zip_reader, function(reader) {
			// get all entries from the zip
			reader.getEntries(function(entries) {
				if (entries.length) {
					// get first entry content as text
					entries[0].getData(new zip.TextWriter(), function(text) {
						// text contains the entry data as a String
						if (typeof success_callback === 'function') {
							success_callback(text, deferred);
						}
					});
				}
			});
		}, function(error) {
			deferred.reject(ERR_UNZIP);
		});
	}

	// parses XML string and creates DOMParser object
	function parseJPZString(xml_string, deferred) {
		var parser, xmlDoc;
		// Some CS JPZs have &nbsp; in them.  Replace with a space.
		xml_string = xml_string.replace('&nbsp;', ' ');
		if (window.DOMParser) {
			parser=new DOMParser();
			xmlDoc=parser.parseFromString(xml_string,"text/xml");
		} else { // Internet Explorer
			xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async=false;
			xmlDoc.loadXML(xml_string);
		}

		if (xmlDoc.getElementsByTagName('parsererror').length) {
			deferred.reject(ERR_PARSE_JPZ);
			return;
		}

		deferred.resolve(xmlDoc);
	}

	function XMLElementToString(element) {
		var i, node, nodename,
			nodes = element.childNodes,
			result = '';
		for (i=0;node=nodes[i];i++) {
			if (node.nodeType === XMLDOM_TEXT) {
				result += node.textContent;
			}
			if (node.nodeType === XMLDOM_ELEMENT) {
				nodename = node.nodeName;
				result += '<'+nodename+'>'+XMLElementToString(node)+'</'+nodename+'>';
			}

		}
		return result;
	}

	var CrosswordNexus = {
		createCrossword: function(parent, user_config) {
			var crossword;
			try {
				if (typeof jQuery === TYPE_UNDEFINED) {
					throw new Error(ERR_NO_JQUERY);
				}
				if (typeof zip === TYPE_UNDEFINED) {
					throw new Error(ERR_NO_ZIPJS);
				}
				if (user_config && user_config.hasOwnProperty(ZIPJS_CONFIG_OPTION)) {
					ZIPJS_PATH = user_config[ZIPJS_CONFIG_OPTION];
				}
				crossword = new CrossWord(parent, user_config);
			} catch (e) {
				alert(e.message);
			}
			return crossword;
		}
	};

	var CrossWord = function(parent, user_config) {
		this.parent = parent;
		this.config = {};
		var i;
		for (i in default_config) {
			if (default_config.hasOwnProperty(i)) {
				if (user_config && user_config.hasOwnProperty(i)) {
					this.config[i] = user_config[i];
				} else {
					this.config[i] = default_config[i];
				}
			}
		}
		this.cell_size = 40;
		this.top_text_height = 0;
		this.bottom_text_height = 0;
		this.grid_width = 0;
		this.grid_height = 0;
		this.cells = {};
		this.words = {};
		this.clues_top = null;
		this.clues_bottom = null;
		this.active_clues = null;
		this.inactive_clues = null;
		this.hovered_x = null;
		this.hovered_y = null;
		this.selected_word = null;
		this.hilited_word = null;
		this.selected_cell = null;
		this.settings_open = false;

		this.render_cells_callback = $.proxy(this.renderCells, this);

		this.init();
	};

	CrossWord.prototype.init = function() {
		var parseJPZ_callback = $.proxy(this.parseJPZPuzzle, this);
		var error_callback = $.proxy(this.error, this);

		if (this.root) {
			this.remove();
		}

		// build structures
		this.root = $(template);
		this.top_text = this.root.find('div.cw-top-text');
		this.bottom_text = this.root.find('div.cw-bottom-text');

		this.clues_holder = this.root.find('div.cw-clues-holder');
		this.clues_top_container = this.root.find('div.cw-clues-top');
		this.clues_bottom_container = this.root.find('div.cw-clues-bottom');
		this.canvas_holder = this.root.find('div.cw-canvas');
		this.canvas = this.root.find('canvas');
		this.context = this.canvas[0].getContext('2d');

		this.settings_icon = this.root.find('div.cw-settings-icon');
		this.settings = this.root.find('div.cw-settings');
		if (this.config.settings_enabled) {
			this.settings_overflow = this.root.find('div.cw-settings-overflow');
			this.settings_submit = this.root.find('div.cw-settings button');
		} else {
			this.settings_icon.remove();
			this.settings.remove();
		}

		this.hidden_input = this.root.find('input.cw-hidden-input');

		this.reveal_button = this.root.find('div.cw-buttons-holder div.cw-reveal');
		this.reveal_letter = this.root.find('div.cw-buttons-holder div.cw-reveal-letter');
		this.reveal_word = this.root.find('div.cw-buttons-holder div.cw-reveal-word');
		this.reveal_puzzle = this.root.find('div.cw-buttons-holder div.cw-reveal-puzzle');
		this.save_btn = this.root.find('div.cw-buttons-holder div.cw-save');
		this.load_btn = this.root.find('div.cw-buttons-holder div.cw-load');

		// preload one puzzle
		if (this.config.puzzle_file && this.config.puzzle_file.hasOwnProperty('url') && this.config.puzzle_file.hasOwnProperty('type')) {
			this.root.addClass('loading');
			var loaded_callback;
			switch (this.config.puzzle_file.type) {
				case FILE_JPZ:
					loaded_callback = parseJPZ_callback;
			}
			loadFileFromServer(this.config.puzzle_file.url, this.config.puzzle_file.type).then(loaded_callback, error_callback);
		} else { // shows open button and, optionally, list of available puzzles
			var i, puzzle_file, el,
				puzzles_holder = this.root.find('div.cw-open-puzzle'),
				puzzles_list = this.root.find('div.cw-puzzles-list'),
				puzzles_count = 0;
			// render list of puzzle files
			if (this.config.puzzles && this.config.puzzles.length) {
				for(i=0; puzzle_file = this.config.puzzles[i]; i++) {
					el = $('<span>'+puzzle_file.name+'</span>');
					el.data('url', puzzle_file.url);
					el.data('type', puzzle_file.type);
					puzzles_list.append(el);
					puzzles_count++;
				}
			}
			if (!puzzles_count) {
				puzzles_holder.addClass('empty');
			} else {
				puzzles_holder.delegate('div.cw-puzzles-list span', 'click', openPuzzle);
			}
			this.open_button = this.root.find('div.cw-open-button');
			this.file_input = this.root.find('input[type="file"]');

			this.open_button.on('click', function(e) {
				this.file_input.click();
			}.bind(this));

			this.file_input.on('change', function() {
				var files = this.file_input[0].files.length ? this.file_input[0].files: null;
				if (files) {
					loadFromFile(files[0], FILE_JPZ).then(parseJPZ_callback, error_callback);
				}
			}.bind(this));
		}

		this.root.appendTo(this.parent);
	};

	CrossWord.prototype.error = function(message) {
		alert(message);
	};

	CrossWord.prototype.parseJPZPuzzle = function(xmlDoc) {
		var crossword, puzzle, metadata, title, creator, copyright;
		puzzle = xmlDoc.getElementsByTagName('rectangular-puzzle');
		crossword = xmlDoc.getElementsByTagName('crossword');
		if (!puzzle.length) {
			this.error(ERR_PARSE_JPZ);
			return;
		}
		if (!crossword.length) {
			this.error(ERR_NOT_CROSSWORD);
			return;
		}
		metadata = puzzle[0].getElementsByTagName('metadata');
		if (!metadata.length) {
			this.error(ERR_PARSE_JPZ);
			return;
		}

		title = metadata[0].getElementsByTagName('title');
		creator = metadata[0].getElementsByTagName('creator');
		copyright = metadata[0].getElementsByTagName('copyright');
		if (title.length) {
			var text = XMLElementToString(title[0]);
			if (creator.length) {
				text += "<br>"+XMLElementToString(creator[0]);
			}
			if (copyright.length) {
				text += "<br>"+XMLElementToString(copyright[0]);
			}
			this.bottom_text.html(text);
		}

		this.parseJPZCrossWord(crossword[0]);
	};

	// parses crossword element from JPZ file and creates needed objects
	CrossWord.prototype.parseJPZCrossWord = function(crossword) {
		var i, cell, word, clues_block, first_word,
			grid = crossword.getElementsByTagName('grid')[0],
			grid_look = grid.getElementsByTagName('grid-look')[0],
			xml_cells = grid.getElementsByTagName('cell'),
			xml_words = crossword.getElementsByTagName('word'),
			xml_clues = crossword.getElementsByTagName('clues');
		this.grid_width = Number(grid.getAttribute('width'));
		this.grid_height = Number(grid.getAttribute('height'));
		this.cell_size = grid_look.getAttribute('cell-size-in-pixels');

		// parse cells
		for (i=0; cell=xml_cells[i]; i++) {
			var new_cell = {
				x: Number(cell.getAttribute('x')),
				y: Number(cell.getAttribute('y')),
				solution: cell.getAttribute('solution'),
				number: cell.getAttribute('number'),
				color: cell.getAttribute('background-color'),
				empty: cell.getAttribute('type') === 'block',
				letter: ""
			};
			if (!this.cells[new_cell.x]) {this.cells[new_cell.x] = {};}
			this.cells[new_cell.x][new_cell.y] = new_cell;
		}

		// parse words
		for (i=0; word=xml_words[i]; i++) {
			var new_word = new Word(this);
			new_word.fromJPZ(word);
			this.words[new_word.id] = new_word;
		}

		if (xml_clues.length !== 2) {
			this.error(ERR_CLUES_GROUPS);
			return;
		}
		for (i=0; clues_block=xml_clues[i]; i++) {
			var group = new CluesGroup(this);
			group.fromJPZ(clues_block);
			if (!this.clues_top) {
				group.id = CLUES_TOP;
				this.clues_top = group;
			} else {
				group.id = CLUES_BOTTOM;
				this.clues_bottom = group;
			}
		}

		this.changeActiveClues();

		this.renderClues(this.clues_top, this.clues_top_container);
		this.renderClues(this.clues_bottom, this.clues_bottom_container);

		this.addListeners();

		this.root.removeClass('loading');
		this.root.addClass('loaded');

		first_word = this.active_clues.getFirstWord();
		this.setActiveWord(first_word);
		this.setActiveCell(first_word.getFirstCell());

		this.adjustPaddings();
		this.renderCells();
	};

	CrossWord.prototype.remove = function() {
		this.removeListeners();
		this.root.remove();
	};

	CrossWord.prototype.removeGlobalListeners = function() {
		$(window).off('resize', this.render_cells_callback);
	};

	CrossWord.prototype.removeListeners = function() {
		this.removeGlobalListeners();
		this.clues_holder.undelegate('div.cw-clues-items span');
		this.canvas.off('mousemove click');

		this.reveal_button.off('click mouseenter mouseleave');
		this.reveal_letter.off('click');
		this.reveal_word.off('click');
		this.reveal_puzzle.off('click');
		this.save_btn.off('click');
		this.load_btn.off('click');

		if (this.config.settings_enabled) {
			this.settings_icon.off('click');
			this.settings_overflow.off('click');
			this.settings_submit.off('click');

			this.settings.undelegate('div.cw-option input.cw-input-color');
			this.settings.undelegate('div.cw-cell-size input[type=checkbox]');
		}

		this.hidden_input.off('input');
		this.hidden_input.off('keydown');
	};

	CrossWord.prototype.addListeners = function() {
		$(window).on('resize', this.render_cells_callback);

		this.clues_holder.delegate('div.cw-clues-items div.cw-clue', 'mouseenter', $.proxy(this.mouseEnteredClue, this));
		this.clues_holder.delegate('div.cw-clues-items div.cw-clue', 'mouseleave', $.proxy(this.mouseLeftClue, this));
		this.clues_holder.delegate('div.cw-clues-items div.cw-clue', 'click', $.proxy(this.clueClicked, this));

		if (this.config.hover_enabled) {
			this.canvas.on('mousemove', $.proxy(this.mouseMoved, this));
		}
		this.canvas.on('click', $.proxy(this.mouseClicked, this));

		this.reveal_button.on('click', $.proxy(this.toggleReveal, this));
		this.reveal_button.on('mouseenter', $.proxy(this.openReveal, this));
		this.reveal_button.on('mouseleave', $.proxy(this.closeReveal, this));
		this.reveal_letter.on('click', $.proxy(this.solveLetter, this));
		this.reveal_word.on('click', $.proxy(this.solveWord, this));
		this.reveal_puzzle.on('click', $.proxy(this.solvePuzzle, this));
		this.save_btn.on('click', $.proxy(this.savePuzzle, this));
		this.load_btn.on('click', $.proxy(this.loadPuzzle, this));

		if (this.config.settings_enabled) {
			this.settings_icon.on('click', $.proxy(this.openSettings, this));
			this.settings_overflow.on('click', $.proxy(this.closeSettings, this));
			this.settings_submit.on('click', $.proxy(this.saveSettings, this));

			this.settings.delegate('div.cw-option input.cw-input-color', 'input', $.proxy(this.settingChanged, this));
			this.settings.delegate('div.cw-cell-size input[type=checkbox]', 'change', $.proxy(this.settingSizeAuto, this));
		}

		this.hidden_input.on('input', $.proxy(this.hiddenInputChanged, this));
		this.hidden_input.on('keydown', $.proxy(this.keyPressed, this));
	};

	CrossWord.prototype.changeActiveClues = function() {
		if (this.active_clues && this.active_clues.id === CLUES_TOP) {
			this.active_clues = this.clues_bottom;
			this.inactive_clues = this.clues_top;
		} else {
			this.active_clues = this.clues_top;
			this.inactive_clues = this.clues_bottom;
		}
	};

	CrossWord.prototype.getCell = function(x, y) {
		return this.cells[x] ? this.cells[x][y] : null;
	};

	CrossWord.prototype.setActiveWord = function(word) {
		if (word) {
			this.selected_word = word;
			this.top_text.html(word.clue.text);
		}
	};

	CrossWord.prototype.setActiveCell = function(cell) {
		var offset = this.canvas.offset(), input_top, input_left;
		if (cell && !cell.empty) {
			this.selected_cell = cell;
			this.active_clues.markActive(cell.x, cell.y, false);
			this.inactive_clues.markActive(cell.x, cell.y, true);

			input_top = offset.top + ((cell.y-1)*this.cell_size);
			input_left = offset.left + ((cell.x-1)*this.cell_size);

			this.hidden_input.css({left: input_left, top: input_top});
			this.hidden_input.focus();
		}
	};

	CrossWord.prototype.renderClues = function(clues_group, clues_container) {
		var i, clue, clue_el,
			title = clues_container.find('div.cw-clues-title'),
			items = clues_container.find('div.cw-clues-items');
		items.find('div.cw-clue').remove();
		for (i=0; clue = clues_group.clues[i]; i++) {
			clue_el = $('<div>'+clue.number+'. '+clue.text+'</div>');
			clue_el.data('word', clue.word);
			clue_el.data('number', clue.number);
			clue_el.data('clues', clues_group.id);
			clue_el.addClass('cw-clue');
			clue_el.addClass('word-'+clue.word);
			items.append(clue_el);
		}
		title.html(clues_group.title);
		clues_group.clues_container = items;
	};

	// Clears canvas and re-renders all cells
	CrossWord.prototype.renderCells = function() {
		var x, y;

		this.adjustSize();

		if (Number(this.config.cell_size) === 0) {
			var max_height, max_width;
			this.root.removeClass('fixed');
			this.root.addClass('auto');
			max_height = this.root.height() - (this.top_text_height+this.bottom_text_height);
			max_width = this.root.width();
			this.cell_size = Math.min(Math.floor(max_height/this.grid_height) - 1, Math.floor(max_width/this.grid_width) - 1);
		} else {
			this.root.removeClass('auto');
			this.root.addClass('fixed');
			this.cell_size = Number(this.config.cell_size);
		}
		this.canvas[0].width = this.grid_width * this.cell_size;
		this.canvas[0].height = this.grid_height * this.cell_size;

		this.context.clearRect(0, 0, this.canvas[0].width, this.canvas[0].height);
		this.context.fillStyle = this.config.color_block;

		for(x in this.cells) {
			for (y in this.cells[x]) {
				var cell = this.cells[x][y],
					cell_x = (x-1)*this.cell_size,
					cell_y = (y-1)*this.cell_size;

				if (!cell.empty) {
					// detect cell color
					var color = cell.color || this.config.color_none;
					if (this.hilited_word && this.hilited_word.hasCell(cell.x, cell.y)) {color = this.config.color_hilite;}
					if (this.selected_word && this.selected_word.hasCell(cell.x, cell.y)) {color = this.config.color_word;}
					if (this.config.hover_enabled && x == this.hovered_x && y == this.hovered_y) {color = this.config.color_hover;}
					if (this.selected_cell && x == this.selected_cell.x && y == this.selected_cell.y) {color = this.config.color_selected;}
					this.context.fillRect(cell_x, cell_y, this.cell_size, this.cell_size);
					this.context.fillStyle = color;
					this.context.fillRect(cell_x+1, cell_y+1, this.cell_size-2, this.cell_size-2);
					this.context.fillStyle = this.config.color_block;
				} else {
					this.context.fillRect(cell_x, cell_y, this.cell_size, this.cell_size);
				}

				if (cell.number) {
					this.context.font = this.cell_size/4+"px sans-serif";
					this.context.textAlign = "left";
					this.context.textBaseline = "top";
					this.context.fillText(cell.number, cell_x+this.cell_size*0.1, cell_y+this.cell_size*0.1);
				}

				if (cell.letter) {
					this.context.font = this.cell_size/2+"px sans-serif";
					this.context.textAlign = "center";
					this.context.textBaseline = "middle";
					this.context.fillText(cell.letter, cell_x+this.cell_size/2, cell_y+this.cell_size/2);
				}
			}
		}
	};

	CrossWord.prototype.adjustSize = function() {
		var size = Math.min(this.root.outerWidth(true), 1.5 * this.root.outerHeight(true));
		if (size >= BIG_THRESHOLD && !this.root.hasClass(SIZE_BIG)) {
			this.root.addClass(SIZE_BIG);
			this.root.removeClass(SIZE_NORMAL+' '+SIZE_SMALL+' '+SIZE_TINY);
			this.adjustPaddings();
		} else if (size < BIG_THRESHOLD && size >= NORMAL_THRESHOLD && !this.root.hasClass(SIZE_NORMAL)) {
			this.root.addClass(SIZE_NORMAL);
			this.root.removeClass(SIZE_BIG+' '+SIZE_SMALL+' '+SIZE_TINY);
			this.adjustPaddings();
		} else if (size < NORMAL_THRESHOLD && size >= SMALL_THRESHOLD && !this.root.hasClass(SIZE_SMALL)) {
			this.root.addClass(SIZE_SMALL);
			this.root.removeClass(SIZE_BIG+' '+SIZE_NORMAL+' '+SIZE_TINY);
			this.adjustPaddings();
		} else if (size < SMALL_THRESHOLD && size < SMALL_THRESHOLD && !this.root.hasClass(SIZE_TINY)) {
			this.root.addClass(SIZE_TINY);
			this.root.removeClass(SIZE_BIG+' '+SIZE_NORMAL+' '+SIZE_SMALL);
			this.adjustPaddings();
		}
	};

	CrossWord.prototype.adjustPaddings = function() {
		this.top_text_height = this.top_text.outerHeight(true);
		this.bottom_text_height = this.bottom_text.outerHeight(true);
		this.canvas_holder.css({'padding-top': this.top_text_height, 'padding-bottom': this.bottom_text_height});
	};

	CrossWord.prototype.mouseMoved = function(e) {
		if (this.config.hover_enabled) {
			var offset = this.canvas.offset(),
				mouse_x = e.pageX - offset.left,
				mouse_y = e.pageY - offset.top,
				index_x = Math.ceil(mouse_x / this.cell_size),
				index_y = Math.ceil(mouse_y / this.cell_size);

			if (index_x !== this.hovered_x || index_y !== this.hovered_y) {
				this.hovered_x = index_x;
				this.hovered_y = index_y;
				this.renderCells();
			}
		}
	};

	CrossWord.prototype.mouseClicked = function(e) {
		var offset = this.canvas.offset(),
			mouse_x = e.pageX - offset.left,
			mouse_y = e.pageY - offset.top,
			index_x = Math.ceil(mouse_x / this.cell_size),
			index_y = Math.ceil(mouse_y / this.cell_size);

		if (this.selected_cell && this.selected_cell.x == index_x && this.selected_cell.y == index_y) {
			this.changeActiveClues();
		}

		this.setActiveWord(this.active_clues.getMatchingWord(index_x, index_y));
		this.setActiveCell(this.getCell(index_x, index_y));
		this.renderCells();
	};

	CrossWord.prototype.keyPressed = function(e) {
		if (this.settings_open) { return; }
		var prevent = [35, 36, 37, 38, 39, 40, 32, 46, 8, 9].indexOf(e.keyCode) >= 0; // to prevent event propagation for specified keys
		switch (e.keyCode) {
			case 35: // end
				this.moveToFirstCell(true);
				break;
			case 36: // home
				this.moveToFirstCell(false);
				break;
			case 37: // left
				if (e.shiftKey) {
					this.skipToWord(SKIP_LEFT);
				} else {
					this.moveSelectionBy(-1, 0);
				}
				break;
			case 38: // up
				if (e.shiftKey) {
					this.skipToWord(SKIP_UP);
				} else {
					this.moveSelectionBy(0, -1);
				}
				break;
			case 39: // right
				if (e.shiftKey) {
					this.skipToWord(SKIP_RIGHT);
				} else {
					this.moveSelectionBy(1, 0);
				}
				break;
			case 40: // down
				if (e.shiftKey) {
					this.skipToWord(SKIP_DOWN);
				} else {
					this.moveSelectionBy(0, 1);
				}
				break;
			case 32: //space
				if (this.selected_cell && this.selected_word) {
					this.selected_cell.letter = "";
					var next_cell = this.selected_word.getNextCell(this.selected_cell.x, this.selected_cell.y);
					this.setActiveCell(next_cell);
				}
				this.renderCells();
				break;
			case 46: // delete
				if (this.selected_cell) {
					this.selected_cell.letter = "";
				}
				this.renderCells();
				break;
			case 8:  // backspace
				if (this.selected_cell && this.selected_word) {
					this.selected_cell.letter = "";
					var prev_cell = this.selected_word.getPreviousCell(this.selected_cell.x, this.selected_cell.y);
					this.setActiveCell(prev_cell);
				}
				this.renderCells();
				break;
			case 9: // tab
				if (e.shiftKey) {
					this.moveToNextWord(true);
				} else {
					this.moveToNextWord(false);
				}
				break;
			case 13: // enter key -- same as tab
				if (e.shiftKey) {
					this.moveToNextWord(true);
				} else {
					this.moveToNextWord(false);
				}
				break;
		}
		if (prevent) {
			e.preventDefault();
			e.stopPropagation();
		}
	};

	// Detects user inputs to hidden input element
	CrossWord.prototype.hiddenInputChanged = function() {
		var char = this.hidden_input.val().slice(0, 1).toUpperCase(),
			next_cell;
		if (this.selected_word && this.selected_cell && char) {
			this.selected_cell.letter = char;
			// find empty cell, then next cell
			// Change this depending on config
			if (this.config.skip_filled_letters) {
			    next_cell = this.selected_word.getFirstEmptyCell(this.selected_cell.x, this.selected_cell.y) || this.selected_word.getNextCell(this.selected_cell.x, this.selected_cell.y);
			}
			else {
			    next_cell = this.selected_word.getNextCell(this.selected_cell.x, this.selected_cell.y);
			}
			
			this.setActiveCell(next_cell);
			this.renderCells();
			this.checkIfSolved();
		}
		this.hidden_input.val('');
	};

	CrossWord.prototype.checkIfSolved = function() {
		var i, j, cell;
		for(i in this.cells) {
			for(j in this.cells[i]) {
				cell = this.cells[i][j];
				// if found cell without letter or with incorrect letter - return
				if (!cell.empty && (!cell.letter || cell.letter != cell.solution)) {
					return;
				}
			}
		}
		alert(MSG_SOLVED);
	};

	// callback for shift+arrows
	// finds next cell in specified direction that does not belongs to current word
	// then selects that word and selects it's first empty || first cell
	CrossWord.prototype.skipToWord = function(direction) {
		if (this.selected_cell && this.selected_word) {
			var i, cell, word, word_cell,
				x = this.selected_cell.x,
				y = this.selected_cell.y;

			var cellFound = function(cell) {
				if (cell && !cell.empty) {
					word = this.active_clues.getMatchingWord(cell.x, cell.y);
					if (word && word.id !== this.selected_word.id) {
						word_cell = word.getFirstEmptyCell() || word.getFirstCell();
						this.setActiveWord(word);
						this.setActiveCell(word_cell);
						this.renderCells();
						return true;
					}
				}
				return false;
			}.bind(this);

			switch (direction) {
				case SKIP_UP:
					for (i=y-1;i>=0;i--) {
						cell = this.getCell(x, i);
						if (cellFound(cell)) {return;}
					}
					break;
				case SKIP_DOWN:
					for (i=y+1;i<=this.grid_height;i++) {
						cell = this.getCell(x, i);
						if (cellFound(cell)) {return;}
					}
					break;
				case SKIP_LEFT:
					for (i=x-1;i>=0;i--) {
						cell = this.getCell(i, y);
						if (cellFound(cell)) {return;}
					}
					break;
				case SKIP_RIGHT:
					for (i=x+1;i<=this.grid_width;i++) {
						cell = this.getCell(i, y);
						if (cellFound(cell)) {return;}
					}
					break;
			}
		}
	};

	CrossWord.prototype.moveToNextWord = function(to_previous) {
		if (this.selected_word) {
			var next_word = to_previous ? this.active_clues.getPreviousWord(this.selected_word) : this.active_clues.getNextWord(this.selected_word),
				cell;
			if (next_word) {
				cell = next_word.getFirstEmptyCell() || next_word.getFirstCell();
				this.setActiveWord(next_word);
				this.setActiveCell(cell);
				this.renderCells();
			}
		}
	};

	CrossWord.prototype.moveToFirstCell = function(to_last) {
		if (this.selected_word) {
			var cell = to_last ? this.selected_word.getLastCell() : this.selected_word.getFirstCell();
			if (cell) {
				this.setActiveCell(cell);
				this.renderCells();
			}
		}
	};

	// callback for arrow keys - moves selection by one cell
	// can change direction
	CrossWord.prototype.moveSelectionBy = function(delta_x, delta_y, keep_active_clues) {
		var x, y, new_cell;
		if (this.selected_cell) {
			x = this.selected_cell.x+delta_x;
			y = this.selected_cell.y+delta_y;
			new_cell = this.getCell(x, y);

			if (!new_cell) {
				return;
			}

			// try to jump over empty cell
			if (new_cell.empty) {
				if (delta_x < 0) {
					delta_x--;
				} else if (delta_x > 0) {
					delta_x++;
				} else if (delta_y < 0) {
					delta_y--;
				} else if (delta_y > 0) {
					delta_y++;
				}
				this.moveSelectionBy(delta_x, delta_y, true);
				return;
			}

			if (!this.selected_word.hasCell(x, y)) {
				if (!keep_active_clues) {
					this.changeActiveClues();
					// if cell empty - keep current cell selected
					if (!this.selected_cell.letter) {
						new_cell = this.selected_cell;
					}
				}
				this.setActiveWord(this.active_clues.getMatchingWord(new_cell.x, new_cell.y));
			}
			this.setActiveCell(new_cell);
			this.renderCells();
		}
	};

	CrossWord.prototype.mouseEnteredClue = function(e) {
		var target = $(e.currentTarget);
		this.hilited_word = this.words[target.data('word')];
		this.renderCells();
	};

	CrossWord.prototype.mouseLeftClue = function() {
		this.hilited_word = null;
		this.renderCells();
	};

	CrossWord.prototype.clueClicked = function(e) {
		var target = $(e.currentTarget),
			word = this.words[target.data('word')],
			cell = word.getFirstEmptyCell() || word.getFirstCell();
		if (cell) {
			this.setActiveWord(word);
			if (this.active_clues.id !== target.data('clues')) {
				this.changeActiveClues();
			}
			this.setActiveCell(cell);
			this.renderCells();
		}
	};

	CrossWord.prototype.openSettings = function() {
		this.settings.addClass('open');

		this.settings.find('div.cw-color-hover input').val(this.config.color_hover);
		this.settings.find('div.cw-color-hover span.cw-color-preview').css({background: this.config.color_hover});

		this.settings.find('div.cw-color-selected input').val(this.config.color_selected);
		this.settings.find('div.cw-color-selected span.cw-color-preview').css({background: this.config.color_selected});

		this.settings.find('div.cw-color-word input').val(this.config.color_word);
		this.settings.find('div.cw-color-word span.cw-color-preview').css({background: this.config.color_word});

		this.settings.find('div.cw-color-hilite input').val(this.config.color_hilite);
		this.settings.find('div.cw-color-hilite span.cw-color-preview').css({background: this.config.color_hilite});

		if (!this.config.cell_size) {
			this.settings.find('div.cw-cell-size input[type=text]').prop('disabled', true);
			this.settings.find('div.cw-cell-size input[type=checkbox]').prop('checked', true);
		} else {
			this.settings.find('div.cw-cell-size input[type=text]').removeAttr('disabled');
			this.settings.find('div.cw-cell-size input[type=text]').val(this.config.cell_size);
			this.settings.find('div.cw-cell-size input[type=checkbox]').prop('checked', false);
		}
		
		this.settings.find('div.cw-skip-filled input[type=checkbox]').prop('checked',this.config.skip_filled_letters);

		this.settings_open = true;
	};

	CrossWord.prototype.closeSettings = function() {
		this.settings.removeClass('open');
		this.settings_open = false;
	};

	CrossWord.prototype.settingChanged = function(e) {
		var target = $(e.currentTarget),
			value = target.val();
		if (value.match(/#[0-9a-fA-F]{6}/)) {
			target.siblings('span.cw-color-preview').css({background: value});
		}
	};

	CrossWord.prototype.settingSizeAuto = function(e) {
		var target = $(e.currentTarget),
			input = target.parent().siblings('input.cw-input-size');
		if (target.prop('checked')) {
			input.prop('disabled', true);
			input.val('');
		} else {
			input.removeAttr('disabled');
		}
	};

	CrossWord.prototype.saveSettings = function(e) {
		var value;

		value = this.settings.find('div.cw-color-hover input').val();
		if (value.match(/#[0-9a-fA-F]{6}/)) {
			this.config.color_hover = value;
		}

		value = this.settings.find('div.cw-color-selected input').val();
		if (value.match(/#[0-9a-fA-F]{6}/)) {
			this.config.color_selected = value;
		}

		value = this.settings.find('div.cw-color-word input').val();
		if (value.match(/#[0-9a-fA-F]{6}/)) {
			this.config.color_word = value;
		}

		value = this.settings.find('div.cw-color-hilite input').val();
		if (value.match(/#[0-9a-fA-F]{6}/)) {
			this.config.color_hilite = value;
		}

		value = this.settings.find('div.cw-cell-size input[type=checkbox]').prop('checked');
		if (value) {
			this.config.cell_size = null;
		} else {
			value = this.settings.find('div.cw-cell-size input.cw-input-size').val();
			this.config.cell_size = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Number(value)));
		}
		
		this.config.skip_filled_letters = this.settings.find('div.cw-skip-filled input[type=checkbox]').prop('checked');

		this.closeSettings();
		this.renderCells();

		e.preventDefault();
		e.stopPropagation();
	};

	CrossWord.prototype.openReveal = function() {
		this.reveal_button.addClass('open');
	};

	CrossWord.prototype.closeReveal = function() {
		this.reveal_button.removeClass('open');
	};

	CrossWord.prototype.toggleReveal = function() {
		this.reveal_button.toggleClass('open');
	};

	CrossWord.prototype.solveLetter = function(e) {
		if (this.selected_cell) {
			this.selected_cell.letter = this.selected_cell.solution;
			this.renderCells();
			this.checkIfSolved();
		}
		this.closeReveal();
		this.hidden_input.focus();
		e.preventDefault();
		e.stopPropagation();
	};

	CrossWord.prototype.solveWord = function(e) {
		if (this.selected_word) {
			this.selected_word.solve();
			this.renderCells();
			this.checkIfSolved();
		}
		this.closeReveal();
		this.hidden_input.focus();
		e.preventDefault();
		e.stopPropagation();
	};

	CrossWord.prototype.solvePuzzle = function(e) {
		var i, j, cell;
		for (i in this.cells) {
			for (j in this.cells[i]) {
				cell = this.cells[i][j];
				cell.letter = cell.solution;
			}
		}
		this.renderCells();
		this.checkIfSolved();
		this.closeReveal();
		this.hidden_input.focus();
		e.preventDefault();
		e.stopPropagation();
	};

	CrossWord.prototype.savePuzzle = function() {
		var i, savegame_name, savegame = {
			cell_size: this.cell_size,
			top_text_height: this.top_text_height,
			bottom_text_height: this.bottom_text_height,
			grid_width: this.grid_width,
			grid_height: this.grid_height,

			bottom_text: this.bottom_text.html(),
			top_clues: {
				id: this.clues_top.id,
				title: this.clues_top.title,
				clues: this.clues_top.clues,
				words_ids: this.clues_top.words_ids
			},
			bottom_clues: {
				id: this.clues_bottom.id,
				title: this.clues_bottom.title,
				clues: this.clues_bottom.clues,
				words_ids: this.clues_bottom.words_ids
			},
			words: {},
			cells: this.cells
		};
		for(i in this.words) {
			if (this.words.hasOwnProperty(i)) {
				savegame.words[i] = {
					id: this.words[i].id,
					cell_ranges: this.words[i].cell_ranges,
					cells: this.words[i].cells,
					clue: this.words[i].clue
				};
			}
		}

		savegame_name = STORAGE_KEY + (this.config.savegame_name || '');
		localStorage.setItem(savegame_name, JSON.stringify(savegame));
		alert(MSG_SAVED);
	};

	// loads saved puzzle
	CrossWord.prototype.loadPuzzle = function() {
		var i, savegame_name, savegame, active_word;
		savegame_name = STORAGE_KEY + (this.config.savegame_name || '');
		savegame = JSON.parse(localStorage.getItem(savegame_name));
		if (savegame && savegame.hasOwnProperty('bottom_text') && savegame.hasOwnProperty('top_clues') && savegame.hasOwnProperty('bottom_clues') && savegame.hasOwnProperty('words') && savegame.hasOwnProperty('cells')
			&& savegame.hasOwnProperty('cell_size') && savegame.hasOwnProperty('top_text_height') && savegame.hasOwnProperty('bottom_text_height') && savegame.hasOwnProperty('grid_width') && savegame.hasOwnProperty('grid_height')) {

			this.cell_size = savegame.cell_size;
			this.top_text_height = savegame.top_text_height;
			this.bottom_text_height = savegame.bottom_text_height;
			this.grid_width = savegame.grid_width;
			this.grid_height = savegame.grid_height;

			this.bottom_text.html(savegame.bottom_text);

			this.selected_cell = null;
			this.selected_word = null;

			// restore words
			this.words = {};
			for (i in savegame.words) {
				if (savegame.words.hasOwnProperty(i)) {
					this.words[i] = new Word(this, savegame.words[i]);
				}
			}

			this.cells = savegame.cells;
			load_error = false;

			// restore clues
			this.clues_top = new CluesGroup(this, savegame.top_clues);
			this.clues_bottom = new CluesGroup(this, savegame.bottom_clues);

			if (load_error) {
				this.error(ERR_LOAD);
				return;
			}

			this.renderClues(this.clues_top, this.clues_top_container);
			this.renderClues(this.clues_bottom, this.clues_bottom_container);

			this.active_clues = null;
			this.inactive_clues = null;
			this.changeActiveClues();

			active_word = this.active_clues.getFirstWord();
			this.setActiveWord(active_word);
			this.setActiveCell(active_word.getFirstCell());

			this.renderCells();
			alert(MSG_LOADED);
		} else {
			alert(ERR_NO_SAVEGAME);
		}
	};

	// CluesGroup stores clues and map of words
	var CluesGroup = function(crossword, data) {
		this.id = '';
		this.title = '';
		this.clues = [];
		this.clues_container = null;
		this.words_ids = [];
		this.crossword = crossword;
		if (data) {
			if (data.hasOwnProperty('id') && data.hasOwnProperty('title') && data.hasOwnProperty('clues') && data.hasOwnProperty('words_ids')) {
				this.id = data.id;
				this.title = data.title;
				this.clues = data.clues;
				this.words_ids = data.words_ids;
			} else {
				load_error = true;
			}
		}
	};

	// parses xml and fills properties
	CluesGroup.prototype.fromJPZ = function(xml_data) {
		var k, clue,
			title_el = xml_data.getElementsByTagName('title')[0],
			clues_el = xml_data.getElementsByTagName('clue');
		this.title = XMLElementToString(title_el);
		for(k=0; clue=clues_el[k]; k++) {
			var word_id = clue.getAttribute('word'), word = this.crossword.words[word_id],
				new_clue = {
					word: word_id,
					number: clue.getAttribute('number'),
					text: XMLElementToString(clue)
				};
			this.clues.push(new_clue);
			word.clue = new_clue;
			this.words_ids.push(word_id);
		}
	};

	CluesGroup.prototype.getFirstWord = function() {
		if (this.words_ids.length) {
			return this.crossword.words[this.words_ids[0]];
		}
		return null;
	};

	// gets word which has cell with specified coordinates
	CluesGroup.prototype.getMatchingWord = function(x, y) {
		var i, word_id, word;
		for (i=0; word_id=this.words_ids[i];i++) {
			word = this.crossword.words.hasOwnProperty(word_id) ? this.crossword.words[word_id] : null;
			if (word && word.cells.indexOf(x+'-'+y) >= 0) {
				return word;
			}
		}
		return null;
	};

	// in clues list, marks clue for word that has cell with given coordinates
	CluesGroup.prototype.markActive = function(x, y, is_passive) {
		var classname = is_passive ? 'passive' : 'active',
			word = this.getMatchingWord(x, y),
			clue_el, clue_position, clue_height;
		this.clues_container.find('div.cw-clue.active').removeClass('active');
		this.clues_container.find('div.cw-clue.passive').removeClass('passive');
		if (word) {
			clue_el = this.clues_container.find('div.cw-clue.word-'+word.id);
			clue_el.addClass(classname);
			clue_position = clue_el.position().top;
			clue_height = clue_el.outerHeight(true);
			if (clue_position < 0 || clue_position+clue_height > this.clues_container.height()) {
				this.clues_container.animate({scrollTop: this.clues_container.scrollTop()+clue_position}, 150);
			}
		}
	};

	// returns word next to given
	CluesGroup.prototype.getNextWord = function(word) {
		var next_word = null,
			index = this.words_ids.indexOf(word.id);
		if (index < this.words_ids.length - 1) {
			next_word = this.crossword.words[this.words_ids[index+1]];
		}
		return next_word;
	};

	// returns word previous to given
	CluesGroup.prototype.getPreviousWord = function(word) {
		var prev_word = null,
			index = this.words_ids.indexOf(word.id);
		if (index > 0) {
			prev_word = this.crossword.words[this.words_ids[index-1]];
		}
		return prev_word;
	};

	// Word constructor
	var Word = function(crossword, data) {
		this.id = '';
		this.cell_ranges = [];
		this.cells = [];
		this.clue = {};
		this.crossword = crossword;
		if (data) {
			if (data.hasOwnProperty('id') && data.hasOwnProperty('cell_ranges') && data.hasOwnProperty('cells') && data.hasOwnProperty('clue')) {
				this.id = data.id;
				this.cell_ranges = data.cell_ranges;
				this.cells = data.cells;
				this.clue = data.clue;
			} else {
				load_error = true;
			}
		}
	};

	// parses XML
	Word.prototype.fromJPZ = function(xml_data) {
		if (xml_data) {
			var i, cell,
				id = xml_data.getAttribute('id'),
				x = xml_data.getAttribute('x'),
				y = xml_data.getAttribute('y');

			this.id = id;

			if (x && y) {
				this.cell_ranges.push({x: x, y: y});
			} else {
				var word_cells = xml_data.getElementsByTagName('cells');
				for (i = 0; cell = word_cells[i]; i++) {
					x = cell.getAttribute('x');
					y = cell.getAttribute('y');
					this.cell_ranges.push({x: x, y: y});
				}
			}
			this.parseRanges();
		}
	};

	// Parses cell ranges and stores cells coordinates as array ['x1-y1', 'x1-y2' ...]
	Word.prototype.parseRanges = function() {
		var i, k,cell_range;
		this.cells = [];
		for (i = 0; cell_range = this.cell_ranges[i]; i++) {
			var split_x = cell_range.x.split('-'),
				split_y = cell_range.y.split('-'),
				x, y,
				x_from, x_to, y_from, y_to;

			if (split_x.length > 1) {
				x_from = Number(split_x[0]);
				x_to = Number(split_x[1]);
				y = split_y[0];
				for (k = x_from;(x_from<x_to?k<=x_to:k>=x_to);(x_from<x_to?k++:k--)) {
					this.cells.push(k+'-'+y);
				}
			} else if (split_y.length > 1) {
				x = split_x[0];
				y_from = Number(split_y[0]);
				y_to = Number(split_y[1]);
				for (k = y_from;(y_from<y_to?k<=y_to:k>=y_to);(y_from<y_to?k++:k--)) {
					this.cells.push(x+'-'+k);
				}
			} else {
				x = split_x[0];
				y = split_y[0];
				this.cells.push(x+'-'+y);
			}
		}
	};

	Word.prototype.hasCell = function(x, y) {
		return this.cells.indexOf(x+'-'+y) >= 0;
	};

	// get first empty cell in word
	// if x and y given - get first empty cell after cell with coordinates x,y
	// if there's no empty cell after those coordinates - search from begin
	Word.prototype.getFirstEmptyCell = function(x, y) {
		var i, cell, coordinates, start = 0;
		if (x && y) {
			start = Math.max(0, this.cells.indexOf(x+'-'+y));
			// if currently last cell - search from beginning
			if (start == this.cells.length-1) {
				start = 0;
			}
		}
		for (i = start; coordinates = this.cells[i]; i++) {
			cell = this.getCellByCoordinates(coordinates);
			if (cell && !cell.letter) {
				return cell;
			}
		}

		// if coordinates given and no cell found - search from beginning
		if (start > 0) {
			for (i = 0; i < start; i++) {
				cell = this.getCellByCoordinates(this.cells[i]);
				if (cell && !cell.letter) {
					return cell;
				}
			}
		}

		return null;
	};

	Word.prototype.getFirstCell = function() {
		var cell = null;
		if (this.cells.length) {
			cell = this.getCellByCoordinates(this.cells[0]);
		}
		return cell;
	};

	Word.prototype.getLastCell = function() {
		var cell = null;
		if (this.cells.length) {
			cell = this.getCellByCoordinates(this.cells[this.cells.length-1]);
		}
		return cell;
	};

	Word.prototype.getNextCell = function(x, y) {
		var index = this.cells.indexOf(x+'-'+y),
			cell = null;
		if (index < this.cells.length-1) {
			cell = this.getCellByCoordinates(this.cells[index+1]);
		}
		return cell;
	};

	Word.prototype.getPreviousCell = function(x, y) {
		var index = this.cells.indexOf(x+'-'+y),
			cell = null;
		if (index > 0) {
			cell = this.getCellByCoordinates(this.cells[index-1]);
		}
		return cell;
	};

	Word.prototype.getCellByCoordinates = function(txt_coordinates) {
		var split, x, y, cell;
		split = txt_coordinates.split('-');
		if (split.length === 2) {
			x = split[0];
			y = split[1];
			cell = this.crossword.getCell(x, y);
			if (cell) {
				return cell;
			}
		}
		return null;
	};

	Word.prototype.solve = function() {
		var i, coordinates, cell;
		for (i=0; coordinates = this.cells[i]; i++) {
			cell = this.getCellByCoordinates(coordinates);
			if (cell) {
				cell.letter = cell.solution;
			}
		}
	};

	if ( typeof define === "function" && define.amd ) {
		define( "CrosswordNexus", [], function() {
			return CrosswordNexus;
		});
	}

	if (registerGlobal) {
		window.CrosswordNexus = CrosswordNexus;
	}

	return CrosswordNexus;
}));
