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

define(["jquery", "zipjs"], function($) {
	"use strict";
	var config = {
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
			zipjs_path: 'js/zip'
		};

	// constants
	var FILE_JPZ = 'jpz',
		CLUES_TOP = "clues_top",
		CLUES_BOTTOM = "clues_bottom",
		MIN_SIZE = 10,
		MAX_SIZE = 100,
		SKIP_UP = 'up',
		SKIP_DOWN = 'down',
		SKIP_LEFT = 'left',
		SKIP_RIGHT = 'right',
		STORAGE_KEY = 'crossword_savegame';

	// variables for HTML elements
	var root, clues_holder, clues_top_container, clues_bottom_container,
		canvas, canvas_holder, context, open_button, file_input, top_text, bottom_text,
		hidden_input, settings_icon, settings, settings_overflow, settings_submit;

	var inited = false,
		cell_size = 40,
		top_text_height = 0,
		bottom_text_height = 0,
		grid_width, grid_height,
		cells = {},
		words = {},
		clues_top = null,
		clues_bottom = null,
		active_clues = null,
		inactive_clues = null,
		hovered_x = null,
		hovered_y = null,
		selected_word = null,
		hilited_word = null,
		selected_cell = null,
		settings_open = false,
		load_error = false;

	var template = '' +
'<div class="cw-main auto">'+
	'<div class="cw-open-holder">'+
		'<div class="cw-overflow"></div>'+
		'<div class="cw-open-puzzle">'+
			'<div class="cw-text">Select puzzle</div>'+
			'<div class="cw-puzzles-list"></div>'+
			'<div class="cw-text">or</div>'+
			'<div class="cw-button"></div>'+
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
		'<button>Ok</button>'+
	'</div>'+
	'<div class="cw-top-text"></div>'+
	'<div class="cw-full-height"></div>'+
	'<input type="text" class="cw-hidden-input">'+
	'<div class="cw-canvas">'+
		'<canvas></canvas>'+
	'</div>'+
	'<div class="cw-bottom-text"></div>'+
	'<div class="cw-buttons-holder">'+
		'<div class="cw-solve-button cw-solve-letter">Letter</div>'+
		'<div class="cw-solve-button cw-solve-word">Word</div>'+
		'<div class="cw-solve-button cw-solve-puzzle">Puzzle</div>'+
		'<div class="cw-solve-button cw-save">Save</div>'+
		'<div class="cw-solve-button cw-load">Load</div>'+
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
'</div>';

	// CluesGroup stores clues and map of words
	var CluesGroup = function(data) {
		this.id = '';
		this.title = '';
		this.clues = [];
		this.clues_container = null;
		this.words_map = {};
		this.words_ids = [];
		if (data) {
			if (data.hasOwnProperty('id') && data.hasOwnProperty('title') && data.hasOwnProperty('clues') && data.hasOwnProperty('words_ids')) {
				this.id = data.id;
				this.title = data.title;
				this.clues = data.clues;
				var i, id;
				this.words_ids = data.words_ids;
				for (i=0;id=this.words_ids[i];i++) {
					if (words[id]) {
						this.words_map[id] = words[id];
					} else {
						load_error = true;
					}
				}
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
		this.title = title_el.innerHTML;
		for(k=0; clue=clues_el[k]; k++) {
			var word_id = clue.getAttribute('word'), word = words[word_id],
				new_clue = {
					word: word_id,
					number: clue.getAttribute('number'),
					text: clue.innerHTML
				};
			this.clues.push(new_clue);
			word.clue = new_clue;
			this.words_map[word_id] = word;
			this.words_ids.push(word_id);
		}
	};

	CluesGroup.prototype.getFirstWord = function() {
		if (this.words_ids.length) {
			return this.words_map[this.words_ids[0]];
		}
		return null;
	};

	// gets word which has cell with specified coordinates
	CluesGroup.prototype.getMatchingWord = function(x, y) {
		var i;
		for (i in this.words_map) {
			if (this.words_map.hasOwnProperty(i) && this.words_map[i].cells.indexOf(x+'-'+y) >= 0) {
				return this.words_map[i];
			}
		}
		return null;
	};

	// in clues list, marks clue for word that has cell with given coordinates
	CluesGroup.prototype.markActive = function(x, y, is_passive) {
		var classname = is_passive ? 'passive' : 'active',
			word = this.getMatchingWord(x, y),
			clue_el, clue_position, clue_height;
		this.clues_container.find('span.active').removeClass('active');
		this.clues_container.find('span.passive').removeClass('passive');
		if (word) {
			clue_el = this.clues_container.find('span.word-'+word.id);
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
			next_word = this.words_map[this.words_ids[index+1]];
		}
		return next_word;
	};

	// returns word previous to given
	CluesGroup.prototype.getPreviousWord = function(word) {
		var prev_word = null,
			index = this.words_ids.indexOf(word.id);
		if (index > 0) {
			prev_word = this.words_map[this.words_ids[index-1]];
		}
		return prev_word;
	};

	// Word constructor
	var Word = function(data) {
		this.id = '';
		this.cell_ranges = [];
		this.cells = [];
		this.clue = {};
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
			cell = getCell(x, y);
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


	function changeActiveClues() {
		if (active_clues && active_clues.id === CLUES_TOP) {
			active_clues = clues_bottom;
			inactive_clues = clues_top;
		} else {
			active_clues = clues_top;
			inactive_clues = clues_bottom;
		}
	}

	function getCell(x, y) {
		return cells[x] ? cells[x][y] : null;
	}

	function setActiveWord(word) {
		if (word) {
			selected_word = word;
			top_text.html(word.clue.text);
		}
	}

	function setActiveCell(cell) {
		var offset = canvas.offset(), input_top, input_left;
		if (cell && !cell.empty) {
			selected_cell = cell;
			active_clues.markActive(cell.x, cell.y, false);
			inactive_clues.markActive(cell.x, cell.y, true);

			input_top = offset.top + ((cell.y-1)*cell_size);
			input_left = offset.left + ((cell.x-1)*cell_size);

			hidden_input.css({left: input_left, top: input_top});
			hidden_input.focus();
		}
	}

	function createStructures(parent) {
		if (!inited) {
			root = $(template);
			top_text = root.find('div.cw-top-text');
			bottom_text = root.find('div.cw-bottom-text');

			clues_holder = root.find('div.cw-clues-holder');
			clues_top_container = root.find('div.cw-clues-top');
			clues_bottom_container = root.find('div.cw-clues-bottom');
			canvas_holder = root.find('div.cw-canvas');
			canvas = root.find('canvas');
			context = canvas[0].getContext('2d');

			settings_icon = root.find('div.cw-settings-icon');
			settings = root.find('div.cw-settings');
			if (config.settings_enabled) {
				settings_overflow = root.find('div.cw-settings-overflow');
				settings_submit = root.find('div.cw-settings button');

				settings_icon.on('click', openSettings);
				settings_overflow.on('click', closeSettings);
				settings_submit.on('click', saveSettings);

				settings.delegate('div.cw-option input.cw-input-color', 'input', settingChanged);
				settings.delegate('div.cw-cell-size input[type=checkbox]', 'change', settingSizeAuto);
			} else {
				settings_icon.remove();
				settings.remove();
			}

			hidden_input = root.find('input.cw-hidden-input');

			// preload one puzzle
			if (config.puzzle_file) {
				root.addClass('loading');
				loadFileFromServer(config.puzzle_file.url, config.puzzle_file.type);
			} else { // shows open button and, optionally, list of available puzzles
				var i, puzzle_file, el,
					puzzles_holder = root.find('div.cw-open-puzzle'),
					puzzles_list = root.find('div.cw-puzzles-list'),
					puzzles_count = 0;
				// render list of puzzle files
				if (config.puzzles && config.puzzles.length) {
					for(i=0; puzzle_file = config.puzzles[i]; i++) {
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
				open_button = root.find('div.cw-button');
				file_input = root.find('input[type="file"]');

				open_button.on('click', function(e) {
					file_input.click();
				});

				file_input.on('change', function() {
					var files = file_input[0].files.length ? file_input[0].files: null;
					if (files) {
						loadFromFile(files[0], FILE_JPZ);
					}
				});
			}

			root.appendTo(parent);

			inited = true;
		}
	}

	function openPuzzle(e) {
		var target = $(e.currentTarget);
		loadFileFromServer(target.data('url'), target.data('type'));
	}

	function loadFileFromServer(path, type) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', path);
		xhr.responseType = 'blob';
		xhr.onload = function() {
			if (xhr.status == 200) {
				loadFromFile(xhr.response, type);
			} else {
				alert('Error loading puzzle file...');
			}
		};
		xhr.send();
	}

	function loadFromFile(file, type) {
		var reader = new FileReader();
		reader.onload = function(event) {
			var string = event.target.result;
			if (type === FILE_JPZ) {
				if (string.match(/^<\?xml/)) { // xml
					parseJPZString(event.target.result);
				} else { // probably, zipped xml
					unzip(new zip.TextReader(file), parseJPZString);
				}
			}
		};
		reader.readAsText(file);
	}

	function unzip(zip_reader, success_callback) {
		zip.workerScripts = {'inflater': [config.zipjs_path+'/z-worker.js', config.zipjs_path+'/inflate.js']};
		// use a BlobReader to read the zip from a Blob object
		zip.createReader(zip_reader, function(reader) {
			// get all entries from the zip
			reader.getEntries(function(entries) {
				if (entries.length) {
					// get first entry content as text
					entries[0].getData(new zip.TextWriter(), function(text) {
						// text contains the entry data as a String
						if (typeof success_callback === 'function') {
							success_callback(text);
						}
					});
				}
			});
		}, function(error) {
			alert('Unable to unzip file');
		});

	}

	// parses XML string and creates DOMParser object
	function parseJPZString(xml_string) {
		var parser, xmlDoc;
		if (window.DOMParser) {
			parser=new DOMParser();
			xmlDoc=parser.parseFromString(xml_string,"text/xml");
		} else { // Internet Explorer
			xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async=false;
			xmlDoc.loadXML(xml_string);
		}

		if (xmlDoc.getElementsByTagName('parsererror').length) {
			alert('Error parsing file... Not JPZ or zipped JPZ file.');
			return;
		}

		parseJPZPuzzle(xmlDoc);
	}

	function parseJPZPuzzle(xmlDoc) {
		var crossword, puzzle, title, creator, copyright;
		puzzle = xmlDoc.getElementsByTagName('rectangular-puzzle');
		crossword = xmlDoc.getElementsByTagName('crossword');
		if (!crossword.length) {
			alert('Error opening file. Probably not a crossword.');
			return;
		}
		if (!puzzle.length) {
			alert('Error opening file. Probably not jpz file');
			return;
		}

		title = puzzle[0].getElementsByTagName('title');
		creator = puzzle[0].getElementsByTagName('creator');
		copyright = puzzle[0].getElementsByTagName('copyright');
		if (title.length) {
			var text = title[0].innerHTML;
			if (creator.length) {
				text += "<br>"+creator[0].innerHTML;
			}
			if (copyright.length) {
				text += "<br>"+copyright[0].innerHTML;
			}
			bottom_text.html(text);
		}

		// bottom text can have from 1 to 3 lines, correct padding must be set to exclude intersection canvas with text
		top_text_height = top_text.outerHeight(true);
		bottom_text_height = bottom_text.outerHeight(true);
		canvas_holder.css({'padding-top': top_text_height, 'padding-bottom': bottom_text_height});

		parseJPZCrossWord(crossword[0]);
	}

	// parses crossword element from JPZ file and creates needed objects
	function parseJPZCrossWord(crossword) {
		var i, cell, word, clues_block, first_word,
			grid = crossword.getElementsByTagName('grid')[0],
			grid_look = grid.getElementsByTagName('grid-look')[0],
			xml_cells = grid.getElementsByTagName('cell'),
			xml_words = crossword.getElementsByTagName('word'),
			xml_clues = crossword.getElementsByTagName('clues');
		grid_width = Number(grid.getAttribute('width'));
		grid_height = Number(grid.getAttribute('height'));
		cell_size = grid_look.getAttribute('cell-size-in-pixels');

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
			if (!cells[new_cell.x]) {cells[new_cell.x] = {};}
			cells[new_cell.x][new_cell.y] = new_cell;
		}

		// parse words
		for (i=0; word=xml_words[i]; i++) {
			var new_word = new Word();
			new_word.fromJPZ(word);
			words[new_word.id] = new_word;
		}

		if (xml_clues.length !== 2) {
			alert('Wrong number of clues in jpz file');
			return;
		}
		for (i=0; clues_block=xml_clues[i]; i++) {
			var group = new CluesGroup();
			group.fromJPZ(clues_block);
			if (!clues_top) {
				group.id = CLUES_TOP;
				clues_top = group;
			} else {
				group.id = CLUES_BOTTOM;
				clues_bottom = group;
			}
		}

		changeActiveClues();

		renderClues(clues_top, clues_top_container);
		renderClues(clues_bottom, clues_bottom_container);

		addListeners();

		root.removeClass('loading');
		root.addClass('loaded');


		first_word = active_clues.getFirstWord();
		setActiveWord(first_word);
		setActiveCell(first_word.getFirstCell());

		renderCells();
	}

	function addListeners() {
		clues_holder.delegate('div.cw-clues-items span', 'mouseenter', mouseEnteredClue);
		clues_holder.delegate('div.cw-clues-items span', 'mouseleave', mouseLeftClue);
		clues_holder.delegate('div.cw-clues-items span', 'click', clueClicked);

		renderCells();

		$(window).on('resize', renderCells);
		$(document).on('keydown', keyPressed);
		if (config.hover_enabled) {
			canvas.on('mousemove', mouseMoved);
		}
		canvas.on('click', mouseClicked);

		root.find('div.cw-buttons-holder div.cw-solve-letter').on('click', solveLetter);
		root.find('div.cw-buttons-holder div.cw-solve-word').on('click', solveWord);
		root.find('div.cw-buttons-holder div.cw-solve-puzzle').on('click', solvePuzzle);
		root.find('div.cw-buttons-holder div.cw-save').on('click', savePuzzle);
		root.find('div.cw-buttons-holder div.cw-load').on('click', loadPuzzle);

		hidden_input.on('input', hiddenInputChanged);
	}

	function renderClues(clues_group, clues_container) {
		var i, clue, clue_el,
			title = clues_container.find('div.cw-clues-title'),
			items = clues_container.find('div.cw-clues-items');
		items.find('span').remove();
		for (i=0; clue = clues_group.clues[i]; i++) {
			clue_el = $('<span>'+clue.number+'. '+clue.text+'</span>');
			clue_el.data('word', clue.word);
			clue_el.data('number', clue.number);
			clue_el.data('clues', clues_group.id);
			clue_el.addClass('word-'+clue.word);
			items.append(clue_el);
		}
		title.html(clues_group.title);
		clues_group.clues_container = items;
	}

	// Clears canvas and re-renders all cells
	function renderCells() {
		var x, y;

		// determines cell size
		if (Number(config.cell_size) === 0) {
			var max_height, max_width;
			root.removeClass('fixed');
			root.addClass('auto');
			max_height = root.height() - (top_text_height+bottom_text_height);
			max_width = root.width();
			cell_size = Math.min(Math.floor(max_height / grid_height), Math.floor(max_width/grid_width));
		} else {
			root.removeClass('auto');
			root.addClass('fixed');
			cell_size = Number(config.cell_size);
		}
		canvas[0].width = grid_width * cell_size;
		canvas[0].height = grid_height * cell_size;

		context.clearRect(0, 0, canvas[0].width, canvas[0].height);
		context.fillStyle = config.color_block;

		for(x in cells) {
			for (y in cells[x]) {
				var cell = cells[x][y],
					cell_x = (x-1)*cell_size,
					cell_y = (y-1)*cell_size;

				if (!cell.empty) {
					// detect cell color
					var color = cell.color || config.color_none;
					if (hilited_word && hilited_word.hasCell(cell.x, cell.y)) {color = config.color_hilite;}
					if (selected_word && selected_word.hasCell(cell.x, cell.y)) {color = config.color_word;}
					if (config.hover_enabled && x == hovered_x && y == hovered_y) {color = config.color_hover;}
					if (selected_cell && x == selected_cell.x && y == selected_cell.y) {color = config.color_selected;}
					context.fillRect(cell_x, cell_y, cell_size, cell_size);
					context.fillStyle = color;
					context.fillRect(cell_x+1, cell_y+1, cell_size-2, cell_size-2);
					context.fillStyle = config.color_block;
				} else {
					context.fillRect(cell_x, cell_y, cell_size, cell_size);
				}

				if (cell.number) {
					context.font = cell_size/4+"px sans-serif";
					context.textAlign = "left";
					context.textBaseline = "top";
					context.fillText(cell.number, cell_x+cell_size*0.1, cell_y+cell_size*0.1);
				}

				if (cell.letter) {
					context.font = cell_size/2+"px sans-serif";
					context.textAlign = "center";
					context.textBaseline = "middle";
					context.fillText(cell.letter, cell_x+cell_size/2, cell_y+cell_size/2);
				}
			}
		}
	}

	function mouseMoved(e) {
		if (config.hover_enabled) {
			var offset = canvas.offset(),
				mouse_x = e.pageX - offset.left,
				mouse_y = e.pageY - offset.top,
				index_x = Math.ceil(mouse_x / cell_size),
				index_y = Math.ceil(mouse_y / cell_size);

			if (index_x !== hovered_x || index_y !== hovered_y) {
				hovered_x = index_x;
				hovered_y = index_y;
				renderCells();
			}
		}
	}

	function mouseClicked(e) {
		var offset = canvas.offset(),
			mouse_x = e.pageX - offset.left,
			mouse_y = e.pageY - offset.top,
			index_x = Math.ceil(mouse_x / cell_size),
			index_y = Math.ceil(mouse_y / cell_size);

		if (selected_cell && selected_cell.x == index_x && selected_cell.y == index_y) {
			changeActiveClues();
		}

		setActiveWord(active_clues.getMatchingWord(index_x, index_y));
		setActiveCell(getCell(index_x, index_y));
		renderCells();
	}

	function keyPressed(e) {
		if (settings_open) { return; }
		var prevent = [35, 36, 37, 38, 39, 40, 32, 46, 8, 9].indexOf(e.keyCode) >= 0; // to prevent event propagation for specified keys
		switch (e.keyCode) {
			case 35: // end
				moveToFirstCell(true);
				break;
			case 36: // home
				moveToFirstCell(false);
				break;
			case 37: // left
				if (e.shiftKey) {
					skipToWord(SKIP_LEFT);
				} else {
					moveSelectionBy(-1, 0);
				}
				break;
			case 38: // up
				if (e.shiftKey) {
					skipToWord(SKIP_UP);
				} else {
					moveSelectionBy(0, -1);
				}
				break;
			case 39: // right
				if (e.shiftKey) {
					skipToWord(SKIP_RIGHT);
				} else {
					moveSelectionBy(1, 0);
				}
				break;
			case 40: // down
				if (e.shiftKey) {
					skipToWord(SKIP_DOWN);
				} else {
					moveSelectionBy(0, 1);
				}
				break;
			case 32: //space
				if (selected_cell && selected_word) {
					selected_cell.letter = "";
					var next_cell = selected_word.getNextCell(selected_cell.x, selected_cell.y);
					setActiveCell(next_cell);
				}
				renderCells();
				break;
			case 46: // delete
				if (selected_cell) {
					selected_cell.letter = "";
				}
				renderCells();
				break;
			case 8:  // backspace
				if (selected_cell && selected_word) {
					selected_cell.letter = "";
					var prev_cell = selected_word.getPreviousCell(selected_cell.x, selected_cell.y);
					setActiveCell(prev_cell);
				}
				renderCells();
				break;
			case 9: // tab
				if (e.shiftKey) {
					moveToNextWord(true);
				} else {
					moveToNextWord(false);
				}
				break;
		}
		if (prevent) {
			e.preventDefault();
			e.stopPropagation();
		}
	}

	// Detects user inputs to hidden input element
	function hiddenInputChanged() {
		var char = hidden_input.val().slice(0, 1).toUpperCase(),
			next_cell;
		if (selected_word && selected_cell && char) {
			selected_cell.letter = char;
			// find empty cell, then next cell
			next_cell = selected_word.getFirstEmptyCell(selected_cell.x, selected_cell.y) || selected_word.getNextCell(selected_cell.x, selected_cell.y);
			setActiveCell(next_cell);
			renderCells();
		}
		hidden_input.val('');
	}

	// callback for shift+arrows
	// finds next cell in specified direction that does not belongs to current word
	// then selects that word and selects it's first empty || first cell
	function skipToWord(direction) {
		if (selected_cell && selected_word) {
			var i, cell, word, word_cell,
				x = selected_cell.x,
				y = selected_cell.y;

			var cellFound = function(cell) {
				if (cell && !cell.empty) {
					word = active_clues.getMatchingWord(cell.x, cell.y);
					if (word && word.id !== selected_word.id) {
						word_cell = word.getFirstEmptyCell() || word.getFirstCell();
						setActiveWord(word);
						setActiveCell(word_cell);
						renderCells();
						return true;
					}
				}
				return false;
			};

			switch (direction) {
				case SKIP_UP:
					for (i=y-1;i>=0;i--) {
						cell = getCell(x, i);
						if (cellFound(cell)) {return;}
					}
					break;
				case SKIP_DOWN:
					for (i=y+1;i<=grid_height;i++) {
						cell = getCell(x, i);
						if (cellFound(cell)) {return;}
					}
					break;
				case SKIP_LEFT:
					for (i=x-1;i>=0;i--) {
						cell = getCell(i, y);
						if (cellFound(cell)) {return;}
					}
					break;
				case SKIP_RIGHT:
					for (i=x+1;i<=grid_width;i++) {
						cell = getCell(i, y);
						if (cellFound(cell)) {return;}
					}
					break;
			}
		}
	}

	function moveToNextWord(to_previous) {
		if (selected_word) {
			var next_word = to_previous ? active_clues.getPreviousWord(selected_word) : active_clues.getNextWord(selected_word),
				cell;
			if (next_word) {
				cell = next_word.getFirstEmptyCell() || next_word.getFirstCell();
				setActiveWord(next_word);
				setActiveCell(cell);
				renderCells();
			}
		}
	}

	function moveToFirstCell(to_last) {
		if (selected_word) {
			var cell = to_last ? selected_word.getLastCell() : selected_word.getFirstCell();
			if (cell) {
				setActiveCell(cell);
				renderCells();
			}
		}
	}

	// callback for arrow keys - moves selection by one cell
	// can change direction
	function moveSelectionBy(delta_x, delta_y, keep_active_clues) {
		var x, y, new_cell;
		if (selected_cell) {
			x = selected_cell.x+delta_x;
			y = selected_cell.y+delta_y;
			new_cell = getCell(x, y);

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
				moveSelectionBy(delta_x, delta_y, true);
				return;
			}

			if (!selected_word.hasCell(x, y)) {
				if (!keep_active_clues) {
					changeActiveClues();
					// if cell empty - keep current cell selected
					if (!selected_cell.letter) {
						new_cell = selected_cell;
					}
				}
				setActiveWord(active_clues.getMatchingWord(new_cell.x, new_cell.y));
			}
			setActiveCell(new_cell);
			renderCells();
		}
	}

	function mouseEnteredClue(e) {
		var target = $(e.currentTarget);
		hilited_word = words[target.data('word')];
		renderCells();
	}

	function mouseLeftClue() {
		hilited_word = null;
		renderCells();
	}

	function clueClicked(e) {
		var target = $(e.currentTarget),
			word = words[target.data('word')],
			cell = word.getFirstEmptyCell();
		if (cell) {
			setActiveWord(word);
			if (active_clues.id !== target.data('clues')) {
				changeActiveClues();
			}
			setActiveCell(cell);
			renderCells();
		}
	}

	function openSettings() {
		settings.addClass('open');

		settings.find('div.cw-color-hover input').val(config.color_hover);
		settings.find('div.cw-color-hover span.cw-color-preview').css({background: config.color_hover});

		settings.find('div.cw-color-selected input').val(config.color_selected);
		settings.find('div.cw-color-selected span.cw-color-preview').css({background: config.color_selected});

		settings.find('div.cw-color-word input').val(config.color_word);
		settings.find('div.cw-color-word span.cw-color-preview').css({background: config.color_word});

		settings.find('div.cw-color-hilite input').val(config.color_hilite);
		settings.find('div.cw-color-hilite span.cw-color-preview').css({background: config.color_hilite});

		if (!config.cell_size) {
			settings.find('div.cw-cell-size input[type=text]').prop('disabled', true);
			settings.find('div.cw-cell-size input[type=checkbox]').prop('checked', true);
		} else {
			settings.find('div.cw-cell-size input[type=text]').removeAttr('disabled');
			settings.find('div.cw-cell-size input[type=text]').val(config.cell_size);
			settings.find('div.cw-cell-size input[type=checkbox]').prop('checked', false);
		}

		settings_open = true;
	}

	function closeSettings() {
		settings.removeClass('open');
		settings_open = false;
	}

	function settingChanged(e) {
		var target = $(e.currentTarget),
			value = target.val();
		if (value.match(/#[0-9a-fA-F]{6}/)) {
			target.siblings('span.cw-color-preview').css({background: value});
		}
	}

	function settingSizeAuto(e) {
		var target = $(e.currentTarget),
			input = target.parent().siblings('input.cw-input-size');
		if (target.prop('checked')) {
			input.prop('disabled', true);
			input.val('');
		} else {
			input.removeAttr('disabled');
		}
	}

	function saveSettings(e) {
		var value;

		value = settings.find('div.cw-color-hover input').val();
		if (value.match(/#[0-9a-fA-F]{6}/)) {
			config.color_hover = value;
		}

		value = settings.find('div.cw-color-selected input').val();
		if (value.match(/#[0-9a-fA-F]{6}/)) {
			config.color_selected = value;
		}

		value = settings.find('div.cw-color-word input').val();
		if (value.match(/#[0-9a-fA-F]{6}/)) {
			config.color_word = value;
		}

		value = settings.find('div.cw-color-hilite input').val();
		if (value.match(/#[0-9a-fA-F]{6}/)) {
			config.color_hilite = value;
		}

		value = settings.find('div.cw-cell-size input[type=checkbox]').prop('checked');
		if (value) {
			config.cell_size = null;
		} else {
			value = settings.find('div.cw-cell-size input.cw-input-size').val();
			config.cell_size = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Number(value)));
		}

		closeSettings();
		renderCells();

		e.preventDefault();
		e.stopPropagation();
	}

	function solveLetter() {
		if (selected_cell) {
			selected_cell.letter = selected_cell.solution;
			renderCells();
		}
	}

	function solveWord() {
		if (selected_word) {
			selected_word.solve();
			renderCells();
		}

	}

	function solvePuzzle() {
		var i, j, cell;
		for (i in cells) {
			for (j in cells[i]) {
				cell = cells[i][j];
				cell.letter = cell.solution;
			}
		}
		renderCells();
	}

	function savePuzzle() {
		var i, savegame = {
			cell_size: cell_size,
			top_text_height: top_text_height,
			bottom_text_height: bottom_text_height,
			grid_width: grid_width,
			grid_height: grid_height,

			bottom_text: bottom_text.html(),
			top_clues: {
				id: clues_top.id,
				title: clues_top.title,
				clues: clues_top.clues,
				words_map: clues_top.words_map,
				words_ids: clues_top.words_ids
			},
			bottom_clues: {
				id: clues_bottom.id,
				title: clues_bottom.title,
				clues: clues_bottom.clues,
				words_map: clues_bottom.words_map,
				words_ids: clues_bottom.words_ids
			},
			words: {},
			cells: cells
		};
		for(i in words) {
			if (words.hasOwnProperty(i)) {
				savegame.words[i] = {
					id: words[i].id,
					cell_ranges: words[i].cell_ranges,
					cells: words[i].cells,
					clue: words[i].clue
				}
			}
		}
		localStorage.setItem(STORAGE_KEY, JSON.stringify(savegame));
		alert('Puzzle saved');
	}

	// loads saved puzzle
	function loadPuzzle() {
		var i, savegame = JSON.parse(localStorage.getItem(STORAGE_KEY)), active_word;
		if (savegame && savegame.hasOwnProperty('bottom_text') && savegame.hasOwnProperty('top_clues') && savegame.hasOwnProperty('bottom_clues') && savegame.hasOwnProperty('words') && savegame.hasOwnProperty('cells')
			&& savegame.hasOwnProperty('cell_size') && savegame.hasOwnProperty('top_text_height') && savegame.hasOwnProperty('bottom_text_height') && savegame.hasOwnProperty('grid_width') && savegame.hasOwnProperty('grid_height')) {

			cell_size = savegame.cell_size;
			top_text_height = savegame.top_text_height;
			bottom_text_height = savegame.bottom_text_height;
			grid_width = savegame.grid_width;
			grid_height = savegame.grid_height;

			bottom_text.html(savegame.bottom_text);

			selected_cell = null;
			selected_word = null;

			// WORDS MUST BE RESTORED BEFORE CLUES !!!
			// restore words
			words = {};
			for (i in savegame.words) {
				if (savegame.words.hasOwnProperty(i)) {
					words[i] = new Word(savegame.words[i]);
				}
			}

			cells = savegame.cells;
			load_error = false;

			// restore clues
			clues_top = new CluesGroup(savegame.top_clues);
			clues_bottom = new CluesGroup(savegame.bottom_clues);

			if (load_error) {
				alert('Error loading saved puzzle. Probably corrupted savegame. ');
				return;
			}

			renderClues(clues_top, clues_top_container);
			renderClues(clues_bottom, clues_bottom_container);

			active_clues = null;
			inactive_clues = null;
			changeActiveClues();

			active_word = active_clues.getFirstWord();
			setActiveWord(active_word);
			setActiveCell(active_word.getFirstCell());

			renderCells();
			alert('Puzzle loaded');
		} else {
			alert('No saved puzzle found');
		}
	}

	return {
		init: function(parent, user_config) {
			if (user_config) {
				var i;
				for (i in user_config) {
					if (user_config.hasOwnProperty(i) && config.hasOwnProperty(i)) {
						config[i] = user_config[i];
					}
				}
			}
			createStructures(parent);
		}
	}
});