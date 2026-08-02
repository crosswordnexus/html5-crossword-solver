/**
 * @file colors.js
 * @description Manages crossword UI colors, themes, and CSS custom properties.
 * 
 * What belongs here:
 * - Theme update functions (like updateCSS) that sync JavaScript state to CSS variables.
 * - Dynamic color computation (like getShadeHighlightColor) based on user selections.
 * - HSV, RGB, and Hex color utility helper wrappers specifically for styling the UI.
 */
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
  const cluePassiveColor = Color.applyHsvTransform(wordColor, { ks: 0, kv: 0.8 });
  root.style.setProperty("--clue-passive-color", cluePassiveColor);
  setContrastText("--clue-passive-text-color", cluePassiveColor);

  const topTextBgColor = Color.applyHsvTransform(wordColor, { dh: -8.62, ks: 0.157, kv: 1.004 });
  root.style.setProperty("--top-text-wrapper-bg-color", topTextBgColor);
  setContrastText("--top-text-wrapper-text-color", topTextBgColor);

  // Scrollbars
  root.style.setProperty("--clue-scrollbar-color-thumb", Color.averageColors(selectedColor, '#333333', 0.5));
}
