/**
 * @file diagramless.js
 * @description Handles special layout, cell navigation, and renumbering behaviors for diagramless crosswords.
 */

export function nextDiagramlessCell(fromCell, dir = this.diagramless_dir, step = 1) {
  if (!fromCell) return null;
  const {
    x,
    y
  } = fromCell;

  if (dir === 'across') {
    for (let nx = x + step; nx >= 1 && nx <= this.grid_width; nx += step) {
      const c = this.getCell(nx, y);
      if (c && c.type !== 'block') return c;
    }
  } else {
    for (let ny = y + step; ny >= 1 && ny <= this.grid_height; ny += step) {
      const c = this.getCell(x, ny);
      if (c && c.type !== 'block') return c;
    }
  }
  return null;
}

export function setDiagramlessDir(dir) {
  if (dir !== this.diagramless_dir) {
    this.diagramless_dir = dir;
    this.adjustChevron();
  }
}

export function toggleDiagramlessDir() {
  this.setDiagramlessDir((this.diagramless_dir === 'across') ? 'down' : 'across');
}

export function renumberGrid() {
  const number = 1;
  const width = this.grid_width;
  const height = this.grid_height;

  // Update the grid from the underlying jsxw object
  this.fillJsXw();
  console.log(this.jsxw);
  const grid = this.jsxw.grid();
  const numbering = grid.gridNumbering();

  // Assign new numbers
  for (let y = 1; y <= height; y++) {
    for (let x = 1; x <= width; x++) {
      const cell = this.getCell(x, y);
      this.updateCell(cell, {
        number: numbering[y - 1][x - 1] > 0 ? numbering[y - 1][x - 1] : null
      });
    }
  }
}
