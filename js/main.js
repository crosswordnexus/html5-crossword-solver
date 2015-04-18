/**
Copyright (c) 2015, Crossword Nexus
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/
// Sample .js file for running html5-crossword-solver

require.config({
	"paths" : {
		"jquery" : "lib/jquery",
		"zipjs": "zip/zip"
	},
	"shim" : {
		"zipjs": {}
	}
});

require(
	["jquery", "crosswords"],
	function($, CrossWords) {
		var puzzle_file, puzzles, cell_size, params = {};
		if(window.location.hash.match(/#puzzle[0-9]+/)) {
			puzzle_file = window.location.hash.replace(/#(puzzle[0-9]+)/, '/puzzles/$1.jpz');
		}
		if(window.location.hash.match(/#[0-9]+/)) {
			cell_size = window.location.hash.replace(/#([0-9]+)/, '$1');
		}
		// If you want to specify puzzles for the user to choose from, 
		// add them here
		puzzles = [
			//{name: 'PUZZLE1_NAME', url: '/path/to/puzzle1', type: 'jpz'},
			//{name: 'PUZZLE2_NAME', url: '/path/to/puzzle2', 'type': 'jpz'}
		];
		// If you want this to preload a puzzle, specify it here
		// puzzle_file = '/path/to/puzzle';
		if (puzzle_file) {
			params.puzzle_file = {url: puzzle_file, type: 'jpz'};
		}
		if (puzzles) {
			params.puzzles = puzzles;
		}
		if (cell_size) {
			params.cell_size = cell_size;
		}
		CrossWords.init($('.crosswords'), params);
	}
);
