import { test, expect } from '@playwright/test';

test.describe('HTML5 Crossword Solver', () => {
  test('should load the index page and render the puzzle grid', async ({ page }) => {
    // Load a sample puzzle from the sample_puzzles folder
    await page.goto('/index.html?file=sample_puzzles/DupeThereItIs.jpz');

    // Wait for the SVG puzzle grid to load
    const grid = page.locator('#cw-puzzle-grid');
    await expect(grid).toBeVisible();

    // Check if cell rects are rendered
    const cells = page.locator('.cw-cell');
    await expect(cells.first()).toBeVisible();
    
    // Ensure there is more than 0 cells
    const count = await cells.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should allow user to select a cell and type letters', async ({ page }) => {
    await page.goto('/index.html?file=sample_puzzles/DupeThereItIs.jpz');

    // Wait for the SVG puzzle grid to load
    const grid = page.locator('#cw-puzzle-grid');
    await expect(grid).toBeVisible();

    // Find first active (non-block) cell. Let's find one by coordinate, e.g. x=0, y=0
    const cell = page.locator('rect.cw-cell[data-x="0"][data-y="0"]');
    await expect(cell).toBeVisible();

    // Click to select the cell
    await cell.click();

    // Type a letter using page.keyboard
    await page.keyboard.type('X');

    // In crosswords.js, the text element with class 'cw-cell-letter' is rendered.
    // Let's verify that the cell has the letter 'X' drawn or in the DOM.
    // The text element's content can be queried. Since multiple elements can exist,
    // we should find the one near the cell or check the SVG text elements.
    const letters = page.locator('text.cw-cell-letter');
    await expect(letters).toContainText(['X']);
  });

  test('should respect URL parameters like downs-only', async ({ page }) => {
    // Navigate with downs-only mode
    await page.goto('/index.html?file=sample_puzzles/DupeThereItIs.jpz&downs-only=true');

    // Wait for the grid
    const grid = page.locator('#cw-puzzle-grid');
    await expect(grid).toBeVisible();

    // In downs-only mode, the Across clues list should be empty or hidden, or the first clue group header/clue should show "---" or similar.
    // Let's check how the across clues are rendered.
    // Let's inspect the elements of the clue container.
    const clues = page.locator('.cw-clues-holder');
    await expect(clues).toBeVisible();

    // Let's assert that across clues are hidden or marked
    // In TECHNICAL_DETAILS.md: "Automatically replaces the text of the first clue group (Across) with '---'."
    // "Hides the corresponding clue container in the UI."
    // Let's see if we can find text containing "---" or check the visibility of across clue container
    const acrossClues = page.locator('.cw-clues-across, .cw-clue-group-across, [class*="across"]');
    // We can also search for "---" on the page
    await expect(page.locator('body')).toContainText('---');
  });
});
