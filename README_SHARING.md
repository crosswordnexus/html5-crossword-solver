# Crossword Sharing (`share.html`)

`share.html` is a standalone client-side tool for converting crossword puzzle files into shareable links or embeddable `<iframe>` codes for the Crossword Nexus HTML5 Solver.

Everything happens locally in the user's browser—no files or puzzle data are ever uploaded to or stored on a server.

---

## Features

- **Multi-Format Support**: Reads `.puz`, `.jpz`, `.ipuz`, and `.cfp` files locally via file picker or drag-and-drop.
- **URL Fragment Loading**: Automatically decodes and loads base64-encoded, gzipped `.ipuz` puzzles provided in the URL hash (see below).
- **Appearance Customization**:
  - Primary color (active word highlight).
  - Secondary color (selected cell highlight).
  - Convert circled cells to gray shading.
  - Per-cell customization (custom cell background colors and compressed image overlays).
- **Export Options**:
  - Instant shareable link pointing to `index.html` with puzzle data and configuration embedded in the URL.
  - Ready-to-use responsive `<iframe>` embed code.
  - One-click link shortening via `da.gd`.

---

## Loading via URL Fragment (`#<base64_gzipped_ipuz>`)

You can link directly to `share.html` with a puzzle preloaded by placing base64-encoded, gzipped `.ipuz` data in the URL fragment identifier:

```text
https://YOUR.SITE/html5-crossword-solver/share.html#<base64_gzipped_ipuz>
```

### How It Works:
1. When `share.html` loads, it inspects `window.location.hash`.
2. If a fragment exists, it decodes the base64 string and decompresses the gzip stream using the browser's native `DecompressionStream('gzip')` API.
3. The decompressed JSON is parsed as an iPuz puzzle using `JSCrossword.fromData()`.
4. If successful, the puzzle is immediately loaded, the "Choose puzzle file" section is collapsed, and the customization controls are displayed.
5. If the fragment is missing, corrupted, or not a valid gzipped iPuz puzzle, the page fails silently and remains in the default state prompting the user to upload a file as usual.
6. The page also listens for `hashchange` events, allowing dynamic updates without reloading.

---

## Python Helper Script (`scripts/ipuz_to_base64_gzip.py`)

A helper script is provided in [`scripts/ipuz_to_base64_gzip.py`](scripts/ipuz_to_base64_gzip.py) to convert any `.ipuz` file into the base64 gzipped format.

### Usage

```bash
# 1. Print base64 string to stdout:
python3 scripts/ipuz_to_base64_gzip.py puzzle.ipuz

# 2. Generate a complete share.html URL directly:
python3 scripts/ipuz_to_base64_gzip.py puzzle.ipuz --url https://YOUR.SITE/share.html

# 3. Read from standard input (stdin):
cat puzzle.ipuz | python3 scripts/ipuz_to_base64_gzip.py

# 4. Save base64 string to a file:
python3 scripts/ipuz_to_base64_gzip.py puzzle.ipuz -o puzzle_b64.txt
```
