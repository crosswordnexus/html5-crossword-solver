import { test, expect } from '@playwright/test';

test.describe('HTML5 Crossword Solver', () => {
  test('should load a JPZ puzzle successfully', async ({ page }) => {
    // Load FM.jpz
    await page.goto('/index.html?file=sample_puzzles/FM.jpz');

    // Wait for the SVG puzzle grid to load
    const grid = page.locator('#cw-puzzle-grid');
    await expect(grid).toBeVisible();

    // Check if cell rects are rendered
    const cells = page.locator('.cw-cell');
    await expect(cells.first()).toBeVisible();
    
    const count = await cells.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should load an iPuz puzzle successfully', async ({ page }) => {
    // Load BB8.ipuz
    await page.goto('/index.html?file=sample_puzzles/BB8.ipuz');

    // Wait for the SVG puzzle grid to load
    const grid = page.locator('#cw-puzzle-grid');
    await expect(grid).toBeVisible();

    // Check if cell rects are rendered
    const cells = page.locator('.cw-cell');
    await expect(cells.first()).toBeVisible();
    
    const count = await cells.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should allow user to select a cell and type letters', async ({ page }) => {
    // Load BB8.ipuz for interaction test
    await page.goto('/index.html?file=sample_puzzles/BB8.ipuz');

    // Wait for the SVG puzzle grid to load
    const grid = page.locator('#cw-puzzle-grid');
    await expect(grid).toBeVisible();

    // Close the automatically opened notepad modal if it appears
    const modalButton = page.locator('#modal-button');
    try {
      await modalButton.waitFor({ state: 'visible', timeout: 1000 });
      await modalButton.click();
    } catch (e) {
      // Modal did not appear within 1s, proceed
    }

    // Find the first active cell in the grid
    const cell = page.locator('rect.cw-cell').first();
    await expect(cell).toBeVisible();

    // Click to select the cell
    await cell.click();

    // Type a letter using page.keyboard
    await page.keyboard.type('X');

    // Verify that the cell has the letter 'X' drawn
    const letters = page.locator('text.cw-cell-letter');
    await expect(letters).toContainText(['X']);
  });
});
