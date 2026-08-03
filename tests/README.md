# Crossword Solver Automated Testing Suite

This testing suite uses [Playwright](https://playwright.dev/) to perform automated, end-to-end browser testing for the crossword solver. Because the solver relies heavily on browser APIs, touch inputs, and layout changes, testing in real browsers ensures that refactors do not break functionality.

---

## 1. Installation

To set up the testing environment, run the following commands in the root of the project:

```bash
# Install the Node dependencies (Playwright and Vite)
npm install

# Install the Playwright browser engines (Chromium, Firefox, WebKit)
npx playwright install
# (Optional) If you are missing system dependencies, you can run:
# npx playwright install --with-deps
```

---

## 2. Running the Tests

We have configured Playwright to automatically start a lightweight local development server (using Vite on port `5173`) before running the tests, and shut it down when done.

You can run the tests using these commands:

### Run All Tests (Headless Mode)
Runs all tests across Chromium, Firefox, and WebKit in the background.
```bash
npm test
```

### Run with Playwright UI (Recommended for Interactive Debugging)
Opens Playwright's interactive UI, where you can watch tests run step-by-step, see DOM snapshots, and debug selectors.
```bash
npm run test:ui
```

### Run in Debug Mode
Opens a browser window and pauses at execution checkpoints so you can step through line-by-line.
```bash
npm run test:debug
```

---

## 3. Adding New Tests

All test files should go into the `tests/` directory and use the `.spec.js` extension (e.g., `tests/navigation.spec.js`).

Here is a quick guide on how to write a test:

```javascript
import { test, expect } from '@playwright/test';

test('should load and allow interaction', async ({ page }) => {
  // 1. Navigate to the index.html page (Vite will serve the files)
  await page.goto('/index.html?file=sample_puzzles/DupeThereItIs.jpz');

  // 2. Locate elements (e.g., cell at x=0, y=0)
  const cell = page.locator('rect.cw-cell[data-x="0"][data-y="0"]');
  await expect(cell).toBeVisible();

  // 3. Interact with elements
  await cell.click();
  await page.keyboard.type('A');

  // 4. Assert behavior
  const letter = page.locator('text.cw-cell-letter');
  await expect(letter).toContainText(['A']);
});
```
