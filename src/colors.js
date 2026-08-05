/**
 * @file colors.js
 * @description Manages crossword UI colors, themes, and CSS custom properties.
 *
 * What belongs here:
 * - Theme update functions (like updateCSS) that sync JavaScript state to CSS variables.
 * - Dynamic color computation (like getShadeHighlightColor) based on user selections.
 * - HSV, RGB, and Hex color utility helper wrappers specifically for styling the UI.
 */
const Color = {
  // "Simple" to adjust a color
  rgbToHsv([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return [h, s, v];
  },

  hsvToRgb([h, s, v]) {
    h = ((h % 360) + 360) % 360;
    const c = v * s;
    const x = c * (1 - Math.abs(((h/60)%2) - 1));
    const m = v - c;
    let rp=0,gp=0,bp=0;
    if (0<=h && h<60){rp=c;gp=x;bp=0;}
    else if (60<=h && h<120){rp=x;gp=c;bp=0;}
    else if (120<=h && h<180){rp=0;gp=c;bp=x;}
    else if (180<=h && h<240){rp=0;gp=x;bp=c;}
    else if (240<=h && h<300){rp=x;gp=0;bp=c;}
    else {rp=c;gp=0;bp=x;}
    return [
      Math.round((rp+m)*255),
      Math.round((gp+m)*255),
      Math.round((bp+m)*255)
    ];
  },

  applyHsvTransform(rgbHex, {dh = 0, ks = 1, kv = 1}) {
    let rgb = this.hexToRgb(rgbHex);
    let [h,s,v] = this.rgbToHsv(rgb);
    h = h + dh;
    s = Math.min(1, Math.max(0, s*ks));
    v = Math.min(1, Math.max(0, v*kv));
    let outRgb = this.hsvToRgb([h,s,v]);
    return this.rgbToHex(outRgb[0], outRgb[1], outRgb[2]);
  },

  // hex string to RGB array and vice versa
  // thanks https://stackoverflow.com/a/39077686
  hexToRgb(hex) {
    return hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16));
  },

  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  // perceived brightness of a color on a scale of 0-255
  getBrightness(hex) {
    if (!hex || (typeof hex === 'string' && hex.startsWith('var('))) {
      return 255; // Default to bright (white) if we can't tell
    }
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 255;
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  },

  // Helper for a single component
  componentAvg(c1, c2, weight) {
    return Math.floor(weight * c1 + (1 - weight) * c2);
  },

  // helper to take the "average" of two RGB strings
  // thanks https://stackoverflow.com/a/29576746
  averageColors(c1, c2, weight = 0.5) {
    // if there's no c2, just return c1
    if (!c2) {
      return c1;
    }
    var r1 = this.hexToRgb(c1);
    var r2 = this.hexToRgb(c2);
    var newColor = [this.componentAvg(r1[0], r2[0], weight),
      this.componentAvg(r1[1], r2[1], weight),
      this.componentAvg(r1[2], r2[2], weight)
    ];
    return this.rgbToHex(newColor[0], newColor[1], newColor[2]);
  },

  adjustColor(color, amount) {
    if (!color) {
      return null;
    }
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
  }
};

export function getShadeHighlightColor(cellColor, colorWord, colorNone) {
  if (cellColor && cellColor !== colorNone) {
    return Color.averageColors(colorWord, Color.adjustColor(cellColor, -50));
  } else {
    return colorWord;
  }
}

export function updateCSS(word, selected) {
  const root = document.documentElement;
  const isDark = document.body.classList.contains('dark-mode');

  // If dark mode is on, darken the colors a bit (reduce Value by 15%)
  let wordColor = word;
  let selectedColor = selected;

  if (isDark) {
    wordColor = Color.applyHsvTransform(word, { kv: 0.85 });
    selectedColor = Color.applyHsvTransform(selected, { kv: 0.85 });
  }

  root.style.setProperty("--grid-selected-square-color", selectedColor);
  root.style.setProperty("--grid-selected-word-color", wordColor);
  root.style.setProperty("--grid-hilite-color", Color.applyHsvTransform(wordColor, { dh: -2.64, ks: 0.536, kv: 0.976 }));

  // For grid lines inside selected areas in dark mode
  if (isDark) {
    root.style.setProperty("--grid-selected-stroke-color", "rgba(0,0,0,0.2)");
  } else {
    root.style.setProperty("--grid-selected-stroke-color", "var(--grid-stroke-color)");
  }

  // Helper for setting dynamic contrast text
  const setContrastText = (varName, bgColor) => {
    const brightness = Color.getBrightness(bgColor);
    root.style.setProperty(varName, brightness < 128 ? "#ffffff" : "#000000");
  };

  // Buttons
  const buttonBgColor = Color.applyHsvTransform(wordColor, { dh: 0.13, ks: 0.753, kv: 1.004 });
  root.style.setProperty("--button-bg-color", buttonBgColor);
  setContrastText("--button-text-color", buttonBgColor);

  const buttonHoverColor = Color.applyHsvTransform(wordColor, { dh: 0.28, ks: 0.502, kv: 1.004 });
  root.style.setProperty("--button-hover-color", buttonHoverColor);
  setContrastText("--button-hover-text-color", buttonHoverColor);

  // Note & Timer Buttons
  const noteBgColor = isDark ? "#333333" : "#EEEEEE";
  const noteHoverBgColor = isDark ? "#444444" : "#999999";
  root.style.setProperty("--button-note-timer-bg-color", noteBgColor);
  root.style.setProperty("--button-note-timer-hover-bg-color", noteHoverBgColor);
  root.style.setProperty("--button-note-timer-border", isDark ? "#555555" : "#888888");
  setContrastText("--button-note-timer-text-color", noteBgColor);
  setContrastText("--button-note-timer-hover-text-color", noteHoverBgColor);

  // Active Timer State
  const runBg = "#90ee90"; // Always green
  const pauseBg = "#ffc107"; // Always amber
  root.style.setProperty("--timer-running-bgcolor", runBg);
  root.style.setProperty("--timer-paused-bgcolor", pauseBg);
  setContrastText("--timer-running-text-color", runBg);
  setContrastText("--timer-paused-text-color", pauseBg);

  // Clues
  let clueActiveColor = Color.applyHsvTransform(wordColor, { dh: 0.13, ks: 0.753, kv: 1.004 });
  if (isDark) {
    clueActiveColor = Color.averageColors(clueActiveColor, '#808080', 0.75); // 75% original, 25% gray
  }
  root.style.setProperty("--clue-active-color", clueActiveColor);
  setContrastText("--clue-active-text-color", clueActiveColor);

  // Passive clues (gray)
  const isWordColorDark = Color.getBrightness(wordColor) < 128;
  const cluePassiveColor = Color.applyHsvTransform(wordColor, { ks: 0, kv: isWordColorDark ? 1.05 : 0.8 });
  root.style.setProperty("--clue-passive-color", cluePassiveColor);
  setContrastText("--clue-passive-text-color", cluePassiveColor);

  const topTextBgColor = Color.applyHsvTransform(wordColor, { dh: -8.62, ks: 0.157, kv: 1.004 });
  root.style.setProperty("--top-text-wrapper-bg-color", topTextBgColor);
  setContrastText("--top-text-wrapper-text-color", topTextBgColor);

  // Scrollbars
  root.style.setProperty("--clue-scrollbar-color-thumb", Color.averageColors(selectedColor, '#333333', 0.5));
}

/**
 * Determines the fill color for a grid cell based on its state (selection, shading, blocks).
 * @param {Object} cell - The cell model to color.
 * @returns {string} Color hex or CSS variable representation.
 */
export function cellFillColor(cell) {
  if (cell.type === 'block') {
    return cell.color || 'var(--grid-block-color)';
  } else if (this.selected_cell && cell.x === this.selected_cell.x && cell.y === this.selected_cell.y) {
    return 'var(--grid-selected-square-color)';
  } else if (this.selected_word && this.selected_word.hasCell(cell.x, cell.y)) {
    return cell.shade_highlight_color || 'var(--grid-selected-word-color)';
  } else if (this.selected_cell && this.number_to_cells[this.selected_cell.number || this.selected_cell.top_right_number]?.includes(cell)) {
    // highlight partners
    return cell.shade_highlight_color || 'var(--grid-selected-word-color)';
  } else if (cell.color) {
    return cell.color;
  } else {
    return 'var(--grid-none-color)';
  }
}

/**
 * Determines the text/font color of a grid cell to maintain readable contrast.
 * @param {Object} cell - The cell model.
 * @returns {string} Contrast color (hex or CSS var).
 */
export function cellFontColor(cell) {
  const fillColor = this.cellFillColor(cell);
  if (cell.image) {
    // Images should show text in black regardless of background brightness
    return '#000000';
  } else if (typeof fillColor === 'string' && fillColor.startsWith('var(--grid-selected-square-color)')) {
    return 'var(--grid-selected-square-text-color)';
  } else if (typeof fillColor === 'string' && fillColor.startsWith('var(--grid-selected-word-color)')) {
    return 'var(--grid-selected-word-text-color)';
  } else if (typeof fillColor === 'string' && (fillColor.startsWith('var(--grid-none-color)') || fillColor.startsWith('var(--grid-block-color)'))) {
    return fillColor.includes('block') ? 'white' : 'var(--grid-none-text-color)';
  } else {
    // Brightness of the background and foreground
    const bgBrightness = Color.getBrightness(fillColor || this.config.color_none);
    const fgBrightness = Color.getBrightness(this.config.font_color_fill);

    // If we fail to meet some threshold, invert
    if (Math.abs(bgBrightness - fgBrightness) < 125) {
      const thisRGB = Color.hexToRgb(this.config.font_color_fill);
      const invertedRGB = thisRGB.map(x => 255 - x);
      return Color.rgbToHex(invertedRGB[0], invertedRGB[1], invertedRGB[2]);
    } else {
      return this.config.font_color_fill;
    }
  }
}
