# ESLint Configuration & Usage

This project uses **ESLint** (v9+) to enforce JavaScript code quality and styling standards.

## How to Run ESLint

To lint files in this project:

```bash
# Lint the main crossword logic file
npx eslint src/crosswords.js

# Lint all JavaScript files in the src directory
npx eslint src/
```

## Automatically Fixing Issues

ESLint can automatically fix many formatting issues, missing semicolons, and styling errors:

```bash
npx eslint src/crosswords.js --fix
```

## Configuration

The configuration is defined in [`eslint.config.js`](file:///Users/alexboisvert/GitHub/html5-crossword-solver/eslint.config.js). 

It is set up with standard configurations and includes predefined globals for:
- Browser APIs (`window`, `document`, etc.)
- Node APIs (`process`, etc.)
- Global libraries used in this project:
  - `$` (jQuery)
  - `jQuery`
  - `CrosswordShared`
  - `define` (AMD loading)
