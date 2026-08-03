/**
 * @file rendering.js
 * @description Handles grid and cell SVG rendering, canvas sizing, and element positioning.
 * 
 * What belongs here:
 * - SVG grid/cell initialization, redrawing, and layout sizing (like renderCells, positionGrid).
 * - Component adjustments adjusting SVG rectangles, text elements, circles, borders, and chevrons.
 * - Sizing math calculating cell dimensions and text scaling dynamically.
 */

import { IS_MOBILE } from './constants.js';

export function renderCells() {
  const svg = this.svgContainer;
  svg.innerHTML = ''; // Clear SVG grid before redrawing
  this.svgElements = { cells: {} };

  const fillGroup = this.svgElements.fillGroup = document.createElementNS(this.svgNS, 'g');
  const barGroup = this.svgElements.barGroup = document.createElementNS(this.svgNS, 'g');
  svg.appendChild(fillGroup);
  svg.appendChild(barGroup);

  /**
   * Loop through the cells and write to SVG
   * Note: for fill and bars: we do all the fill first, then all the bars
   * This is so later fill doesn't overwrite later bars
   **/
  for (let xStr in this.cells) {
    this.svgElements.cells[xStr] = {};
    for (let yStr in this.cells[xStr]) {
      this.svgElements.cells[xStr][yStr] = {};
      this.adjustCell(this.cells[xStr][yStr]);
    }
  }
  this.positionGrid();
}

export function positionGrid() {
  // Responsive SVG sizing
  const canvasRect = this.canvas_holder.get(0).getBoundingClientRect();
  const svgTopMargin = getComputedStyle(this.svgContainer).marginTop;
  const maxHeight = canvasRect.height - parseInt(svgTopMargin, 10);
  const maxWidth = canvasRect.width;

  this.cell_size = Math.floor(
    Math.min(
      maxWidth / this.grid_width,
      maxHeight / this.grid_height
    )
  );

  const svgWidth = this.grid_width * this.cell_size;
  const svgHeight = this.grid_height * this.cell_size;

  this.svgContainer.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  this.svgContainer.setAttribute('width', svgWidth);
  this.svgContainer.setAttribute('height', svgHeight);

  if (this.toptext && this.toptext[0]) {
    this.toptext[0].style.width = svgWidth + 'px';
  }

  const SIZE = this.cell_size;
  const padding = 1;
  this.svgContainer.setAttribute(
    'viewBox',
    `-${padding} -${padding} ${this.grid_width * SIZE + padding * 2} ${this.grid_height * SIZE + padding * 2}`
  );

  for (const col of Object.values(this.cells)) {
    for (const cell of Object.values(col)) {
      this.adjustCellPosition(cell);
    }
  }
  this.adjustChevron();
  setTimeout(() => this.syncTopTextWidth(), 0);
}

export function adjustCell(cell) {
  if (!this.svgElements) {
    return;
  }
  const elements = this.svgElements.cells[cell.x][cell.y];
  const shouldRender = !cell.empty || cell.clue === true || cell.type === 'block' || cell.top_right_number;

  const showRect = shouldRender;
  if (showRect && !elements.rect) {
    const rect = elements.rect = document.createElementNS(this.svgNS, 'rect');
    rect.setAttribute('data-x', cell.x);
    rect.setAttribute('data-y', cell.y);
    rect.setAttribute('class', 'cw-cell');
    this.svgElements.fillGroup.appendChild(rect);
  } else if (!showRect && elements.rect) {
    elements.rect.parentNode.removeChild(elements.rect);
    delete elements.rect;
  }
  this.adjustCellRect(cell);

  const showImage = shouldRender && cell.image;
  if (showImage && !elements.image) {
    const imageLayer = elements.image = document.createElementNS(this.svgNS, 'image');
    imageLayer.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    imageLayer.setAttribute('class', 'cw-cell-image');
    imageLayer.setAttribute('href', cell.image);
    imageLayer.setAttributeNS('http://www.w3.org/1999/xlink', 'href', cell.image);
    this.svgElements.fillGroup.appendChild(imageLayer);
  } else if (!showImage && elements.image) {
    elements.image.parentNode.removeChild(elements.image);
    delete elements.image;
  }

  const showCircle = shouldRender && cell.shape === 'circle';
  if (showCircle && !elements.circle) {
    const circle = elements.circle = document.createElementNS(this.svgNS, 'circle');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'var(--grid-stroke-color)');
    circle.setAttribute('stroke-width', 1.1);
    circle.setAttribute('pointer-events', 'none');
    this.svgElements.fillGroup.appendChild(circle);
  } else if (!showCircle && elements.circle) {
    elements.circle.parentNode.removeChild(elements.circle);
    delete elements.circle;
  }

  for (const [side, show] of Object.entries(cell.bar ?? {})) {
    const showBar = shouldRender && show;
    const key = `bar-${side}`;
    if (showBar && !elements[key]) {
      const barLine = elements[key] = document.createElementNS(this.svgNS, 'line');
      barLine.setAttribute('stroke-width', this.config.bar_linewidth);
      barLine.setAttribute('stroke-linecap', 'square');
      barLine.setAttribute('pointer-events', 'none');
      this.svgElements.barGroup.appendChild(barLine);
    } else if (!showBar && elements[key]) {
      elements[key].parentNode.removeChild(elements[key]);
      delete elements[key];
    }
    this.adjustCellBar(cell, side);
  }

  const showLetter = shouldRender && cell.letter;
  if (showLetter && !elements.letter) {
    const text = elements.letter = document.createElementNS(this.svgNS, 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.classList.add('cw-cell-letter');
    this.svgContainer.appendChild(text);
  } else if (!showLetter && elements.letter) {
    elements.letter.parentNode.removeChild(elements.letter);
    delete elements.letter;
  }
  this.adjustCellLetter(cell);

  const showNumber = shouldRender && cell.number;
  if (showNumber && !elements.number) {
    const number = elements.number = document.createElementNS(this.svgNS, 'text');
    number.setAttribute('font-family', 'Arial, sans-serif');
    number.classList.add('cw-cell-number');
    this.svgContainer.appendChild(number);
  } else if (!showNumber && elements.number) {
    elements.number.parentNode.removeChild(elements.number);
    delete elements.number;
  }
  this.adjustCellNumber(cell);

  const showTopRightNumber = shouldRender && cell.top_right_number && cell.top_right_number !== cell.letter;
  if (showTopRightNumber && !elements.top_right_number) {
    const label = elements.top_right_number = document.createElementNS(this.svgNS, 'text');
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('font-family', 'Arial, sans-serif');
    label.setAttribute('pointer-events', 'none');
    label.classList.add('cw-top-right-label');
    this.svgContainer.appendChild(label);
  } else if (!showTopRightNumber && elements.top_right_number) {
    elements.top_right_number.parentNode.removeChild(elements.top_right_number);
    delete elements.top_right_number;
  }
  this.adjustCellTopRightNumber(cell);

  const showSlash = shouldRender && cell.checked;
  if (showSlash && !elements.slash) {
    const slash = elements.slash = document.createElementNS(this.svgNS, 'line');
    slash.setAttribute('stroke-linecap', 'round');
    this.svgContainer.appendChild(slash);
  } else if (!showSlash && elements.slash) {
    elements.slash.parentNode.removeChild(elements.slash);
    delete elements.slash;
  }
  this.adjustCellSlash(cell);

  this.adjustCellPosition(cell);
}

export function adjustCellPosition(cell) {
  if (!this.svgElements) {
    return;
  }
  const elements = this.svgElements.cells[cell.x][cell.y];
  const size = this.cell_size;
  const cellX = (cell.x - 1) * size;
  const cellY = (cell.y - 1) * size;
  const barCoords = {
    top: [[cellX, cellY], [cellX + size, cellY]],
    left: [[cellX, cellY], [cellX, cellY + size]],
    right: [[cellX + size, cellY + size], [cellX + size, cellY]],
    bottom: [[cellX + size, cellY + size], [cellX, cellY + size]],
  };

  if (elements.rect) {
    elements.rect.setAttribute("x", cellX);
    elements.rect.setAttribute("y", cellY);
    elements.rect.setAttribute("width", size);
    elements.rect.setAttribute("height", size);
  }
  if (elements.circle) {
    elements.circle.setAttribute('cx', cellX + size / 2);
    elements.circle.setAttribute('cy', cellY + size / 2);
    // Slightly bigger than cell, so edges are clipped
    const inset = 0.3; // lower is bigger
    const radius = size / 2 + inset;
    elements.circle.setAttribute('r', radius);
  }
  if (elements.image) {
    elements.image.setAttribute('x', cellX);
    elements.image.setAttribute('y', cellY);
    elements.image.setAttribute('width', size);
    elements.image.setAttribute('height', size);
  }
  for (const side of Object.keys(cell.bar ?? {})) {
    const key = `bar-${side}`;
    if (elements[key]) {
      const [[x1, y1], [x2, y2]] = barCoords[side];
      elements[key].setAttribute('x1', x1);
      elements[key].setAttribute('y1', y1);
      elements[key].setAttribute('x2', x2);
      elements[key].setAttribute('y2', y2);
    }
  }
  if (elements.letter) {
    const letterLength = cell.letter.length;
    const maxScale = 0.6;
    const minScale = 0.25;
    const scale = Math.max(minScale, maxScale - 0.07 * (letterLength - 1));
    elements.letter.setAttribute('x', cellX + size / 2);
    elements.letter.setAttribute('y', cellY + size * 0.77);
    elements.letter.setAttribute('font-size', `${this.cell_size * scale}px`);
  }
  if (elements.number) {
    elements.number.setAttribute('x', cellX + size * 0.1);
    elements.number.setAttribute('y', cellY + size * 0.3);
    elements.number.setAttribute('font-size', `${size / 3.75}px`);
  }
  if (elements.top_right_number) {
    elements.top_right_number.setAttribute('x', cellX + size * 0.9);
    elements.top_right_number.setAttribute('y', cellY + size * 0.3);
    elements.top_right_number.setAttribute('font-size', `${size / 3.75}px`);
  }
  if (elements.slash) {
    elements.slash.setAttribute('x1', cellX + 2);
    elements.slash.setAttribute('y1', cellY + 2);
    elements.slash.setAttribute('x2', cellX + size - 2);
    elements.slash.setAttribute('y2', cellY + size - 2);
  }
}

export function adjustCellRect(cell) {
  const rect = this.svgElements.cells[cell.x][cell.y].rect;
  if (!rect) {
    return;
  }

  // Use block color for stroke if it's a block, otherwise normal stroke color
  let rectStroke = (cell.type === 'block') ? 'var(--grid-block-color)' : 'var(--grid-stroke-color)';

  // If it's selected or in the selected word, use the specialized stroke color
  if (cell.type !== 'block' && ((this.selected_cell && cell.x === this.selected_cell.x && cell.y === this.selected_cell.y) || (this.selected_word && this.selected_word.hasCell(cell.x, cell.y)))) {
    rectStroke = 'var(--grid-selected-stroke-color)';
  }

  const isSelected = !!(this.selected_cell && cell.x === this.selected_cell.x && cell.y === this.selected_cell.y);
  const isLinked = !!(this.selected_cell && this.number_to_cells[this.selected_cell.number || this.selected_cell.top_right_number]?.includes(cell));
  rect.classList.toggle('selected', isSelected);
  rect.classList.toggle('linked', isLinked); // optional CSS hook
  rect.setAttribute('fill', this.cellFillColor(cell));
  rect.setAttribute('stroke', rectStroke);
}

export function adjustCellBar(cell, side) {
  const barLine = this.svgElements.cells[cell.x][cell.y][`bar-${side}`];
  if (!barLine) {
    return;
  }

  let barColor = 'var(--grid-stroke-color)';

  if (cell.type !== 'block' && ((this.selected_cell && cell.x === this.selected_cell.x && cell.y === this.selected_cell.y) || (this.selected_word && this.selected_word.hasCell(cell.x, cell.y)))) {
    barColor = 'var(--grid-selected-stroke-color)';
  }
  barLine.setAttribute('stroke', barColor);
}

export function adjustCellLetter(cell) {
  const letter = this.svgElements.cells[cell.x][cell.y].letter;
  if (!letter) {
    return;
  }
  letter.textContent = this.config.kelsey ? (cell.letter || "").toLowerCase() : cell.letter;
  letter.setAttribute('fill', this.cellFontColor(cell));
}

export function adjustCellNumber(cell) {
  const number = this.svgElements.cells[cell.x][cell.y].number;
  if (!number) {
    return;
  }

  number.textContent = cell.number;
  number.setAttribute('fill', this.cellFontColor(cell));
}

export function adjustCellTopRightNumber(cell) {
  const label = this.svgElements.cells[cell.x][cell.y].top_right_number;
  if (!label) {
    return;
  }

  label.setAttribute('fill', this.cellFontColor(cell));
  label.textContent = cell.top_right_number;
}

export function adjustCellSlash(cell) {
  const slash = this.svgElements.cells[cell.x][cell.y].slash;
  if (!slash) {
    return;
  }

  if (this.diagramless_mode) {
    const solutionIsBlock = (cell.solution === '#');
    const typeIsBlock = (cell.type === 'block');
    if (solutionIsBlock !== typeIsBlock) {
      slash.setAttribute('stroke', 'red');
      slash.setAttribute('stroke-width', 2.5);
    } else {
      slash.setAttribute('stroke', 'var(--grid-none-text-color)');
      slash.setAttribute('stroke-width', 2);
    }
  } else {
    slash.setAttribute('stroke', 'var(--grid-none-text-color)');
    slash.setAttribute('stroke-width', 2);
  }
}

export function adjustChevron() {
  if (!this.svgElements) {
    return;
  }
  // Tiny direction chevron for diagramless
  const showChevron = this.diagramless_mode && this.selected_cell;
  if (showChevron && !this.svgElements.chevron) {
    const path = this.svgElements.chevron = document.createElementNS(this.svgNS, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'var(--grid-none-text-color)');
    path.setAttribute('stroke-width', 1.3);
    path.setAttribute('pointer-events', 'none');
    this.svgContainer.appendChild(path);
  } else if (!showChevron && this.svgElements.chevron) {
    this.svgElements.chevron.parentNode.removeChild(this.svgElements.chevron);
    delete this.svgElements.chevron;
  }
  if (this.svgElements.chevron) {
    // slightly smaller overall
    const size = this.cell_size;
    const cellX = (this.selected_cell.x - 1) * size;
    const cellY = (this.selected_cell.y - 1) * size;
    const pad = this.cell_size * 0.15; // smaller padding than before
    const cxAcross = cellX + size - pad;
    const cyAcross = cellY + pad * 1.1;

    const cxDown = cellX + size - pad;
    const cyDown = cellY + size - pad * 1.1;

    const d = (
      this.diagramless_dir === 'across'
      ? `M ${cxAcross - pad * 0.8} ${cyAcross - pad / 2}
        L ${cxAcross} ${cyAcross}
        L ${cxAcross - pad * 0.8} ${cyAcross + pad / 2}`
        // ► chevron (upper-right corner)
      : `M ${cxDown - pad / 2} ${cyDown - pad * 0.8}
        L ${cxDown} ${cyDown}
        L ${cxDown + pad / 2} ${cyDown - pad * 0.8}`
        // ▼ chevron (lower-right corner)
    );
    this.svgElements.chevron.setAttribute('d', d);
  }
}
