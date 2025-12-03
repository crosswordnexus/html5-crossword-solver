(() => {
  'use strict';

  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");
  const customization = document.getElementById("customization");
  const gridCustomization = document.getElementById("gridCustomization");
  const gridPreview = document.getElementById("gridPreview");
  const cellActions = document.getElementById("cellActions");
  const selectedCellLabel = document.getElementById("selectedCellLabel");
  const cellColorPicker = document.getElementById("cellColorPicker");
  const colorHistoryEl = document.getElementById("colorHistory");
  const cellImageInput = document.getElementById("cellImageInput");
  const clearCellOverrides = document.getElementById("clearCellOverrides");
  const clearCellColor = document.getElementById("clearCellColor");
  const chooseCellColorButton = document.getElementById("chooseCellColor");
  const replaceCirclesCheckbox = document.getElementById("replaceCircles");
  const results = document.getElementById("results");
  const shareLink = document.getElementById("shareLink");
  const embedCode = document.getElementById("embedCode");
  const submitCustomization = document.getElementById("submitCustomization");
  const dropZone = document.getElementById("dropZone");

  const LS_KEY = "xwSharerPrefs";
  const COLOR_HISTORY_KEY = "xwSharerColorHistory";

  const DEFAULT_PREFS = {
    primaryColor: "#FEE300",
    secondaryColor: "#FF4136",
    replaceCircles: false
  };

  let originalPuzzle = null;
  let workingPuzzle = null;
  let colorHistory = [];
  let cellCustomizations = {};
  let selectedCellKey = null;

  // Convert a hex or rgba color string into an RGB object for brightness calculations.
  function hexToRgb(hex) {
    if (!hex || typeof hex !== "string") return null;
    let value = hex.trim();
    if (value.startsWith("rgba")) {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (match) {
        return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
      }
    }
    if (value.startsWith("#")) {
      value = value.slice(1);
    }
    if (value.length === 3) {
      value = value
        .split("")
        .map(char => char + char)
        .join("");
    }
    if (value.length !== 6) return null;
    const intVal = parseInt(value, 16);
    return {
      r: (intVal >> 16) & 255,
      g: (intVal >> 8) & 255,
      b: intVal & 255
    };
  }

  // Choose either black or white depending on perceived brightness to keep letters legible.
  function getContrastColor(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) {
      return "#111";
    }
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 150 ? "#111" : "#fff";
  }

  // Load saved customization defaults (colors & circle shading) into the controls.
  function loadPrefs() {
    let prefs = { ...DEFAULT_PREFS };
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY));
      if (saved && typeof saved === "object") {
        prefs = { ...prefs, ...saved };
      }
    } catch (err) {
      console.warn("Could not load prefs:", err);
    }
    document.getElementById("primaryColor").value = prefs.primaryColor;
    document.getElementById("secondaryColor").value = prefs.secondaryColor;
    replaceCirclesCheckbox.checked = prefs.replaceCircles;
  }

  // Persist control state so the user’s next visit sees the same defaults.
  function savePrefs() {
    const prefs = {
      primaryColor: document.getElementById("primaryColor").value || DEFAULT_PREFS.primaryColor,
      secondaryColor: document.getElementById("secondaryColor").value || DEFAULT_PREFS.secondaryColor,
      replaceCircles: replaceCirclesCheckbox.checked
    };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(prefs));
    } catch (err) {
      console.warn("Could not save prefs:", err);
    }
  }

  // Pull the recent-color list from storage (fallback to an empty array).
  function loadColorHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(COLOR_HISTORY_KEY));
      if (Array.isArray(saved)) {
        return saved;
      }
    } catch (err) {
      console.warn("Could not load color history:", err);
    }
    return [];
  }

  // Persist the recent-color list so it survives reloads.
  function saveColorHistory() {
    try {
      localStorage.setItem(COLOR_HISTORY_KEY, JSON.stringify(colorHistory));
    } catch (err) {
      console.warn("Could not persist color history:", err);
    }
  }

  // Render the recent-color pills into the UI and hook their click actions.
  function renderColorHistory() {
    colorHistoryEl.innerHTML = "";
    colorHistory.forEach(color => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.style.backgroundColor = color;
      btn.title = color;
      btn.dataset.color = color;
      btn.addEventListener("click", () => applyColorToActiveCell(color, false));
      colorHistoryEl.appendChild(btn);
    });
  }

  // Keep the recent-color list de-duplicated and sized within an eleven entry cap.
  function updateColorHistory(color) {
    const normalized = color.toLowerCase();
    colorHistory = colorHistory.filter(c => c.toLowerCase() !== normalized);
    colorHistory.unshift(color);
    if (colorHistory.length > 10) {
      colorHistory = colorHistory.slice(0, 10);
    }
    saveColorHistory();
    renderColorHistory();
  }

  // Promise wrapper around FileReader to get raw puzzle bytes.
  async function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Helper used by the image uploader to turn files into embeddable data URIs.
  async function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Deep-copy a JSCrossword instance so we can mutate a working copy safely.
  function clonePuzzle(xw) {
    const data = JSON.parse(JSON.stringify({
      metadata: xw.metadata,
      cells: xw.cells,
      words: xw.words,
      clues: xw.clues
    }));
    return new JSCrossword(data.metadata, data.cells, data.words, data.clues);
  }

  // Keep the label near the cell editor in sync with the selected coordinates/image state.
  function updateSelectedCellLabel() {
    if (!selectedCellKey) return;
    const [x, y] = selectedCellKey.split("-").map(Number);
    const customization = cellCustomizations[selectedCellKey];
    let label = `Cell (${x}, ${y})`;
    if (customization && customization.image) {
      label += " • image added";
    }
    selectedCellLabel.textContent = label;
  }

  // Apply the currently picked color to the active cell and optionally refresh history.
  function applyColorToActiveCell(color, updateHistory = true) {
    if (!selectedCellKey) return;
    const customization = cellCustomizations[selectedCellKey] || {};
    customization.color = color;
    cellCustomizations[selectedCellKey] = customization;
    cellColorPicker.value = color;
    rebuildWorkingPuzzle();
    if (updateHistory) {
      updateColorHistory(color);
    }
  }

  // Attach an uploaded image to the selected cell for sharing.
  function applyImageToActiveCell(dataUrl) {
    if (!selectedCellKey) return;
    const customization = cellCustomizations[selectedCellKey] || {};
    customization.image = dataUrl;
    cellCustomizations[selectedCellKey] = customization;
    rebuildWorkingPuzzle();
    updateSelectedCellLabel();
  }

  // Flood the UI with info for the selected grid cell.
  function selectCell(cellKey) {
    selectedCellKey = cellKey;
    const customization = cellCustomizations[cellKey];
    cellColorPicker.value = (customization && customization.color) || "#ffffff";
    cellActions.classList.remove("hidden");
    updateSelectedCellLabel();
    renderGridPreview();
  }

  // Rebuild workingPuzzle (used for serialization) and respect any per-cell overrides.
  function rebuildWorkingPuzzle() {
    if (!originalPuzzle) return;
    workingPuzzle = clonePuzzle(originalPuzzle);
    const shade = replaceCirclesCheckbox.checked;
    if (shade) {
      for (const cell of workingPuzzle.cells) {
        const key = `${cell.x}-${cell.y}`;
        const customization = cellCustomizations[key];
        if (cell["background-shape"] === "circle" && (!customization || (!customization.color && !customization.image))) {
          delete cell["background-shape"];
          cell["background-color"] = "#c9c9ca";
        }
      }
    }
    const cellMap = new Map();
    workingPuzzle.cells.forEach(cell => cellMap.set(`${cell.x}-${cell.y}`, cell));
    Object.entries(cellCustomizations).forEach(([key, customization]) => {
      const targetCell = cellMap.get(key);
      if (!targetCell) return;
      if (customization.color) {
        targetCell["background-color"] = customization.color;
      } else {
        delete targetCell["background-color"];
      }
      if (customization.image) {
        targetCell.image = customization.image;
      } else {
        delete targetCell.image;
      }
    });
    renderGridPreview();
  }

  // Redraw the grid preview so it reflects the current workingPuzzle and selection.
  function renderGridPreview() {
    if (!workingPuzzle) {
      gridPreview.innerHTML = "";
      return;
    }
    const { width, height } = workingPuzzle.metadata;
    gridPreview.style.gridTemplateColumns = `repeat(${width}, minmax(0, 1fr))`;
    gridPreview.style.gridTemplateRows = `repeat(${height}, minmax(0, 1fr))`;
    gridPreview.innerHTML = "";
    const cellMap = new Map();
    workingPuzzle.cells.forEach(cell => cellMap.set(`${cell.x}-${cell.y}`, cell));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x}-${y}`;
        const cell = cellMap.get(key);
        const cellEl = document.createElement("button");
        cellEl.type = "button";
        cellEl.className = "grid-cell";
        cellEl.dataset.cellKey = key;
        if (!cell) {
          cellEl.classList.add("block");
          cellEl.disabled = true;
        } else if (cell.type === "block") {
          cellEl.classList.add("block");
        }

        const baseFill = cell && cell["background-color"] ? cell["background-color"] : (cell && cell.type === "block" ? "#111" : "#ffffff");
        cellEl.style.backgroundColor = baseFill;
        if (cell && cell.image) {
          cellEl.style.backgroundImage = `url(${cell.image})`;
          cellEl.style.backgroundSize = "cover";
          cellEl.style.backgroundPosition = "center";
        } else {
          cellEl.style.backgroundImage = "";
        }

        if (selectedCellKey === key) {
          cellEl.classList.add("selected");
        }

        const letterColor = getContrastColor(baseFill);

        if (cell && cell.number) {
          const numberSpan = document.createElement("span");
          numberSpan.className = "grid-letter";
          numberSpan.textContent = cell.number;
          numberSpan.style.color = letterColor;
          cellEl.appendChild(numberSpan);
        }

        const solutionLetter =
          cell && cell.type !== "block"
            ? (cell.solution || cell.letter || "").trim()
            : "";
        if (solutionLetter && !cell.image) {
          const letterSpan = document.createElement("span");
          letterSpan.className = "grid-letter-solution";
          letterSpan.textContent = solutionLetter[0].toUpperCase();
          letterSpan.style.color = letterColor;
          cellEl.appendChild(letterSpan);
        }

        if (cell) {
          cellEl.addEventListener("click", () => selectCell(key));
        }
        gridPreview.appendChild(cellEl);
      }
    }
  }

  async function loadPuzzleFile(file) {
    status.textContent = `Reading ${file.name}...`;
    results.classList.add("hidden");
    customization.classList.add("hidden");
    submitCustomization.classList.add("hidden");
    try {
      const buf = await readFileAsArrayBuffer(file);
      const xw = JSCrossword.fromData(new Uint8Array(buf));
      originalPuzzle = xw;
      cellCustomizations = {};
      selectedCellKey = null;
      cellActions.classList.add("hidden");
      gridCustomization.classList.remove("hidden");
      status.textContent = `✅ "${xw.metadata.title}" by ${xw.metadata.author}`;
      customization.classList.remove("hidden");
      submitCustomization.classList.remove("hidden");
      rebuildWorkingPuzzle();
    } catch (err) {
      console.error(err);
      status.textContent = "ƒ?O Could not parse puzzle: " + err.message;
    }
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (file) {
      await loadPuzzleFile(file);
    }
  });

  chooseCellColorButton.addEventListener("click", () => {
    applyColorToActiveCell(cellColorPicker.value);
  });

  cellImageInput.addEventListener("change", async () => {
    const file = cellImageInput.files[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      applyImageToActiveCell(dataUrl);
    } finally {
      cellImageInput.value = "";
    }
  });

  clearCellOverrides.addEventListener("click", () => {
    if (!selectedCellKey) return;
    delete cellCustomizations[selectedCellKey];
    cellColorPicker.value = "#ffffff";
    rebuildWorkingPuzzle();
    updateSelectedCellLabel();
  });

  clearCellColor.addEventListener("click", () => {
    if (!selectedCellKey) return;
    const customization = cellCustomizations[selectedCellKey];
    if (customization) {
      delete customization.color;
      if (!customization.image) {
        delete cellCustomizations[selectedCellKey];
      }
    }
    cellColorPicker.value = "#ffffff";
    rebuildWorkingPuzzle();
    updateSelectedCellLabel();
  });

  replaceCirclesCheckbox.addEventListener("change", rebuildWorkingPuzzle);

  submitCustomization.addEventListener("click", () => {
    if (!originalPuzzle) return;
    const primary = document.getElementById("primaryColor").value;
    const secondary = document.getElementById("secondaryColor").value;
    const shade = replaceCirclesCheckbox.checked;
    savePrefs();
    rebuildWorkingPuzzle();
    const config = {
      color_selected: secondary,
      color_word: primary,
      replace_circles: shade
    };
    const configB64 = btoa(JSON.stringify(config));
    console.log(workingPuzzle);
    const encoded = workingPuzzle.serialize();
    const basePath = window.location.pathname.replace(/[^/]+$/, "");
    const baseUrl = `${window.location.origin}${basePath}`;
    const playUrl = `${baseUrl}?config=${configB64}#${encoded}`;
    shareLink.value = playUrl;
    embedCode.value = `<iframe allowfullscreen="true" height="600" width="100%" style="border:none;width: 100% !important;position: static;display: block !important;margin: 0 !important;" src="${playUrl}"></iframe>`;
    results.classList.remove("hidden");
  });

  async function copyText(el, btn) {
    try {
      await navigator.clipboard.writeText(el.value);
      showCopiedMessage(btn);
    } catch (err) {
      console.error("Clipboard failed:", err);
    }
  }

  function showCopiedMessage(btn) {
    let msg = btn.nextElementSibling;
    if (!msg || !msg.classList.contains("copy-status")) {
      msg = document.createElement("span");
      msg.className = "copy-status";
      msg.style.margin = "0.5rem";
      msg.style.color = "green";
      btn.insertAdjacentElement("afterend", msg);
    }
    msg.textContent = "Copied!";
    msg.style.opacity = 1;
    setTimeout(() => {
      msg.style.transition = "opacity 0.5s";
      msg.style.opacity = 0;
    }, 1500);
  }

  document.getElementById("copyLink").onclick = e => copyText(shareLink, e.target);
  document.getElementById("copyEmbed").onclick = e => copyText(embedCode, e.target);

  const openShortBtn = document.createElement("button");
  openShortBtn.textContent = "Open in Shortener (da.gd)";
  document.getElementById("copyLink").insertAdjacentElement("afterend", openShortBtn);

  openShortBtn.onclick = () => {
    const longUrl = shareLink.value.trim();
    if (!longUrl) {
      status.textContent = "Please generate a link first.";
      return;
    }
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://da.gd/shorten";
    form.target = "_blank";
    form.style.display = "none";
    const input = document.createElement("input");
    input.name = "url";
    input.value = longUrl;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    form.remove();
  };

  ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, e => e.preventDefault());
    document.body.addEventListener(eventName, e => e.preventDefault());
  });

  ["dragenter", "dragover"].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add("dragover"));
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove("dragover"));
  });

  dropZone.addEventListener("drop", async e => {
    const file = e.dataTransfer.files[0];
    if (!file) return;
    fileInput.files = e.dataTransfer.files;
    await loadPuzzleFile(file);
  });

  loadPrefs();
  colorHistory = loadColorHistory();
  if (colorHistory.length === 0) {
    colorHistory = [DEFAULT_PREFS.primaryColor, DEFAULT_PREFS.secondaryColor];
  }
  renderColorHistory();
})();
