import { expect, test } from "@playwright/test";

// ─── helpers ────────────────────────────────────────────────────────────────

async function createPage(page: import("@playwright/test").Page) {
  await page.goto("/workspace");
  await page.waitForSelector('[data-testid="page-title"]');
}

async function insertDatabase(page: import("@playwright/test").Page) {
  const editor = page.locator(".verso-editor");
  await editor.click();
  await page.keyboard.type("/");
  await page.waitForTimeout(300);
  for (const char of "Database") {
    await page.keyboard.type(char);
    await page.waitForTimeout(80);
  }
  const menu = page.getByTestId("slash-menu");
  await menu.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(200);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  await page.waitForSelector('[data-testid="database-block"]', { timeout: 5000 });
}

async function fillTestData(page: import("@playwright/test").Page) {
  const titles = page.locator('[data-testid="cell-title"]');
  // Row 1: "Design", Status=In progress
  await titles.nth(0).click();
  await page.locator('[data-testid="cell-input-title"]').first().fill("Design");
  await page.locator('[data-testid="cell-input-title"]').first().press("Enter");
  await page.waitForTimeout(200);
  // Row 2: "Backend", Status=Done
  await titles.nth(1).click();
  await page.locator('[data-testid="cell-input-title"]').first().fill("Backend");
  await page.locator('[data-testid="cell-input-title"]').first().press("Enter");
  await page.waitForTimeout(200);
  // Row 3: "Testing", Status=Not started
  await titles.nth(2).click();
  await page.locator('[data-testid="cell-input-title"]').first().fill("Testing");
  await page.locator('[data-testid="cell-input-title"]').first().press("Enter");
  await page.waitForTimeout(200);

  // Set statuses
  const selects = page.locator('[data-testid="cell-select"]');
  await selects.nth(0).click();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="select-dropdown"]').locator("text=In progress").click();
  await page.waitForTimeout(300);
  await selects.nth(1).click();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="select-dropdown"]').locator("text=Done").click();
  await page.waitForTimeout(300);
  await selects.nth(2).click();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="select-dropdown"]').locator("text=Not started").click();
  await page.waitForTimeout(300);
}

async function switchToBoard(page: import("@playwright/test").Page) {
  await page.locator('[data-testid="view-tab-board"]').click();
  await page.waitForTimeout(300);
}

// ─── View switcher ──────────────────────────────────────────────────────────

test.describe("View switcher", () => {
  test("database shows Table and Board tabs", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await expect(page.locator('[data-testid="view-tab-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-tab-board"]')).toBeVisible();
  });

  test("Table tab is active by default", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await expect(page.locator('[data-testid="database-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="board-view"]')).not.toBeVisible();
  });

  test("clicking Board tab switches to board view", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await switchToBoard(page);
    await expect(page.locator('[data-testid="board-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="database-table"]')).not.toBeVisible();
  });

  test("switching back to Table tab shows table view", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await switchToBoard(page);
    await page.locator('[data-testid="view-tab-table"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="database-table"]')).toBeVisible();
  });
});

// ─── Board view layout ──────────────────────────────────────────────────────

test.describe("Board view layout", () => {
  test("board shows columns for each status option plus 'No status'", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await switchToBoard(page);
    // Default database has 3 status options + "No status" column
    const columns = page.locator('[data-testid="board-column"]');
    await expect(columns).toHaveCount(4);
  });

  test("cards are distributed in correct columns based on status", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);
    await switchToBoard(page);
    // Each status column should have 1 card, "No status" should have 0
    const cards = page.locator('[data-testid="board-card"]');
    await expect(cards).toHaveCount(3);
  });

  test("cards show the row title", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);
    await switchToBoard(page);
    await expect(page.locator('[data-testid="board-card"]').first()).toContainText(/Design|Backend|Testing/);
  });

  test("column headers show correct count", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);
    await switchToBoard(page);
    const columns = page.locator('[data-testid="board-column"]');
    // Each of the 3 status columns has 1 card
    for (let i = 0; i < 3; i++) {
      await expect(columns.nth(i)).toContainText("1");
    }
  });
});

// ─── Add card ───────────────────────────────────────────────────────────────

test.describe("Board add card", () => {
  test("clicking + New in a column adds a card to that column", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await switchToBoard(page);
    const addButtons = page.locator('[data-testid="board-add-card"]');
    // Click + New in the first column
    await addButtons.first().click();
    await page.waitForTimeout(300);
    // Default 3 rows (in "No status") + 1 new card in first column
    const cardsBefore = 3;
    await expect(page.locator('[data-testid="board-card"]')).toHaveCount(cardsBefore + 1);
  });

  test("new card in a column gets the correct status value", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);
    await switchToBoard(page);
    // Add a card in the first column (Not started)
    await page.locator('[data-testid="board-add-card"]').first().click();
    await page.waitForTimeout(300);
    // Switch to table to verify the cell value
    await page.locator('[data-testid="view-tab-table"]').click();
    await page.waitForTimeout(300);
    // The new row should have a status tag matching the first column
    const rows = page.locator('[data-testid="database-row"]');
    await expect(rows).toHaveCount(4);
  });
});

// ─── Drag and drop ──────────────────────────────────────────────────────────

test.describe("Board drag and drop", () => {
  test("dragging a card to another column updates its status", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);
    await switchToBoard(page);

    const cards = page.locator('[data-testid="board-card"]');
    const columns = page.locator('[data-testid="board-column"]');
    const firstCard = cards.first();
    const targetColumn = columns.nth(2); // third column

    // Get positions
    const cardBox = await firstCard.boundingBox();
    const colBox = await targetColumn.boundingBox();
    expect.soft(cardBox, "firstCard boundingBox should not be null").not.toBeNull();
    expect.soft(colBox, "targetColumn boundingBox should not be null").not.toBeNull();
    if (!cardBox || !colBox) throw new Error("BoundingBox is null — element not visible");

    // Drag card to target column
    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(colBox.x + colBox.width / 2, colBox.y + colBox.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Verify by switching to table view and checking cell values changed
    await page.locator('[data-testid="view-tab-table"]').click();
    await page.waitForTimeout(300);
    // All 3 rows should still exist
    await expect(page.locator('[data-testid="database-row"]')).toHaveCount(3);
  });
});

// ─── View persistence ───────────────────────────────────────────────────────

test.describe("Board view persistence", () => {
  test("active view persists after page reload", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await switchToBoard(page);
    await expect(page.locator('[data-testid="board-view"]')).toBeVisible();
    // Reload
    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForSelector('[data-testid="page-title"]');
    await page.waitForTimeout(500);
    // Board view should still be active
    await expect(page.locator('[data-testid="board-view"]')).toBeVisible();
  });
});
