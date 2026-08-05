/**
 * @file Word.js
 * @description Defines the Word class representing a single entry (word) in the crossword grid.
 * 
 * What belongs here:
 * - Definition and methods of the Word class.
 * - Logic for parsing cell ranges and locating/indexing cells belonging to the word.
 * - Word-level correctness validation and navigation shifts (e.g. next/previous cell in word).
 */
import { isCorrect } from './utils.js';

export class Word {
  constructor(crossword, data) {
    this.id = '';
    this.dir = '';
    this.cell_ranges = [];
    this.cells = [];
    this.clue = {};
    this.refs_raw = [];
    this.fakeClueCompleted = false;
    this.crossword = crossword;
    if (data) {
      if (
        data.hasOwnProperty('id') &&
        data.hasOwnProperty('dir') &&
        data.hasOwnProperty('cell_ranges') &&
        data.hasOwnProperty('clue') &&
        data.hasOwnProperty('refs_raw')
      ) {
        this.id = data.id;
        this.dir = data.dir;
        this.cell_ranges = data.cell_ranges;
        this.clue = data.clue;
        //this.refs_raw = data.clue.refs;
        this.parseRanges();
      }
    }
  }

  isCorrect() {
    for (let i = 0; i < this.cells.length; i++) {
      const coords = this.cells[i].split('-');
      const cell = this.crossword.getCell(coords[0], coords[1]);
      if (!cell || !isCorrect(cell.letter, cell.solution)) {
        return false;
      }
    }
    return true;
  }

  isFilled() {
    for (let i = 0; i < this.cells.length; i++) {
      const coords = this.cells[i].split('-');
      const cell = this.crossword.getCell(coords[0], coords[1]);
      if (!cell || !cell.letter) {
        return false;
      }
    }
    return true;
  }

  // Parses cell ranges and stores cells coordinates as array ['x1-y1', 'x1-y2' ...]
  parseRanges() {
    let i, k, cell_range;
    this.cells = [];
    for (i = 0;
      (cell_range = this.cell_ranges[i]); i++) {
      var split_x = cell_range.x.split('-'),
        split_y = cell_range.y.split('-'),
        x,
        y,
        x_from,
        x_to,
        y_from,
        y_to;

      if (split_x.length > 1) {
        x_from = Number(split_x[0]);
        x_to = Number(split_x[1]);
        y = split_y[0];
        for (
          k = x_from; x_from < x_to ? k <= x_to : k >= x_to; x_from < x_to ? k++ : k--
        ) {
          this.cells.push(`${k}-${y}`);
        }
      } else if (split_y.length > 1) {
        x = split_x[0];
        y_from = Number(split_y[0]);
        y_to = Number(split_y[1]);
        for (
          k = y_from; y_from < y_to ? k <= y_to : k >= y_to; y_from < y_to ? k++ : k--
        ) {
          this.cells.push(`${x}-${k}`);
        }
      } else {
        x = split_x[0];
        y = split_y[0];
        this.cells.push(`${x}-${y}`);
      }
    }
  }

  hasCell(x, y) {
    return this.cells.indexOf(`${x}-${y}`) >= 0;
  }

  // get first empty cell in word
  // if x and y given - get first empty cell after cell with coordinates x,y
  // if there's no empty cell after those coordinates - search from begin
  getFirstEmptyCell(x, y) {
    // Return null if there are no cells in the word
    if (!this.cells || this.cells.length === 0) return null;

    const total = this.cells.length;
    let startIndex = 0;

    if (x != null && y != null) {
      // Find the index of the given coordinates in the word
      const idx = this.cells.indexOf(`${x}-${y}`);
      if (idx >= 0) {
        // Start searching *after* the current cell, wrapping if necessary
        startIndex = (idx + 1) % total;
      }
    }

    // Loop through every cell once, wrapping automatically using modulo
    for (let i = 0; i < total; i++) {
      // Compute index with wraparound
      const index = (startIndex + i) % total;

      // Get the cell coordinates and the corresponding cell object
      const coordinates = this.cells[index];
      const cell = this.getCellByCoordinates(coordinates);

      // Return the first cell without a letter
      if (cell && !cell.letter) {
        return cell;
      }
    }

    // If we reach here, all cells are filled — no empty cell found
    return null;
  }

  // Determine if the word is filled
  isFilled() {
    return this.getFirstEmptyCell() === null;
  }

  getFirstCell() {
    let cell = null;
    if (this.cells.length) {
      cell = this.getCellByCoordinates(this.cells[0]);
    }
    return cell;
  }

  getLastCell() {
    let cell = null;
    if (this.cells.length) {
      cell = this.getCellByCoordinates(this.cells[this.cells.length - 1]);
    }
    return cell;
  }

  getNextCell(x, y) {
    let index = this.cells.indexOf(`${x}-${y}`),
      cell = null;
    if (index < this.cells.length - 1) {
      cell = this.getCellByCoordinates(this.cells[index + 1]);
    }
    return cell;
  }

  getPreviousCell(x, y) {
    let index = this.cells.indexOf(`${x}-${y}`),
      cell = null;
    if (index > 0) {
      cell = this.getCellByCoordinates(this.cells[index - 1]);
    }

    return cell;
  }

  getCellByCoordinates(txt_coordinates) {
    let split, x, y, cell;
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
  }

  solve() {
    let i, coordinates, cell;
    for (i = 0;
      (coordinates = this.cells[i]); i++) {
      cell = this.getCellByCoordinates(coordinates);
      if (cell) {
        this.crossword.updateCell(cell, {
          letter: cell.solution
        });
      }
    }
  }
}
