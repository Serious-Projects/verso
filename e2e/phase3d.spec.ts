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
  const menu = page.locator(".fixed.z-50.w-72");
  await menu.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(200);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  await page.waitForSelector('[data-testid="database-block"]', { timeout: 5000 });
}

async function addDateColumn(page: import("@playwright/test").Page) {
  await page.locator('[data-testid="add-column-btn"]').click();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="add-column-menu"]').locator("text=Date").click();
  await page.waitForTimeout(200);
}

async function addUrlColumn(page: import("@playwright/test").Page) {
  await page.locator('[data-testid="add-column-btn"]').click();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="add-column-menu"]').locator("text=URL").click();
  await page.waitForTimeout(200);
}

async function fillRowTitle(page: import("@playwright/test").Page, index: number, title: string) {
  const titles = page.locator('[data-testid="cell-title"]');
  await titles.nth(index).click();
  const input = page.locator('[data-testid="cell-input-title"]').first();
  await input.fill(title);
  await input.press("Enter");
  await page.waitForTimeout(200);
}

async function setRowDate(page: import("@playwright/test").Page, index: number, day: number) {
  const dateCells = page.locator('[data-testid="cell-date"]');
  await dateCells.nth(index).click();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="date-picker-dropdown"]').locator("button", { hasText: new RegExp(`^${day}$`) }).click();
  await page.waitForTimeout(300);
}

async function setRowStatus(page: import("@playwright/test").Page, index: number, status: string) {
  const selects = page.locator('[data-testid="cell-select"]');
  await selects.nth(index).click();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="select-dropdown"]').locator(`text=${status}`).click();
  await page.waitForTimeout(300);
}

async function switchView(page: import("@playwright/test").Page, view: string) {
  await page.locator(`[data-testid="view-tab-${view}"]`).click();
  await page.waitForTimeout(300);
}

// ─── View switcher ──────────────────────────────────────────────────────────

test.describe("View switcher — Calendar & Gallery tabs", () => {
  test("database shows all four view tabs", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await expect(page.locator('[data-testid="view-tab-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-tab-board"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-tab-calendar"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-tab-gallery"]')).toBeVisible();
  });

  test("clicking Calendar tab switches to calendar view", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await switchView(page, "calendar");
    // No date column yet — should show message
    await expect(page.locator('[data-testid="calendar-no-property"]')).toBeVisible();
  });

  test("clicking Gallery tab switches to gallery view", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await switchView(page, "gallery");
    await expect(page.locator('[data-testid="gallery-view"]')).toBeVisible();
  });

  test("switching between all views works", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await switchView(page, "board");
    await expect(page.locator('[data-testid="board-view"]')).toBeVisible();
    await switchView(page, "gallery");
    await expect(page.locator('[data-testid="gallery-view"]')).toBeVisible();
    await switchView(page, "calendar");
    // Shows no-property message since no date column
    await expect(page.locator('[data-testid="calendar-no-property"]')).toBeVisible();
    await switchView(page, "table");
    await expect(page.locator('[data-testid="database-table"]')).toBeVisible();
  });
});

// ─── Calendar view ──────────────────────────────────────────────────────────

test.describe("Calendar view", () => {
  test("shows 'Add a Date column' message when no date property exists", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await switchView(page, "calendar");
    await expect(page.locator('[data-testid="calendar-no-property"]')).toBeVisible();
    await expect(page.locator("text=Add a Date column to use Calendar view")).toBeVisible();
  });

  test("shows month grid after adding a date column", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await switchView(page, "calendar");
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
    // Should show day name headers
    await expect(page.locator("text=Sun")).toBeVisible();
    await expect(page.locator("text=Sat")).toBeVisible();
    // Should have calendar cells
    const cells = page.locator('[data-testid="calendar-cell"]');
    const count = await cells.count();
    expect(count).toBeGreaterThanOrEqual(28);
    expect(count).toBeLessThanOrEqual(31);
  });

  test("shows current month and year", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await switchView(page, "calendar");
    const now = new Date();
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    await expect(page.locator(`text=${monthNames[now.getMonth()]} ${now.getFullYear()}`)).toBeVisible();
  });

  test("navigating to previous/next month works", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await switchView(page, "calendar");
    const header = page.locator('[data-testid="calendar-month-label"]');
    const initialText = await header.textContent();
    // Click next
    await page.locator('[data-testid="calendar-next"]').click();
    await page.waitForTimeout(100);
    const nextText = await header.textContent();
    expect(nextText).not.toBe(initialText);
    // Click prev to go back
    await page.locator('[data-testid="calendar-prev"]').click();
    await page.waitForTimeout(100);
    const backText = await header.textContent();
    expect(backText).toBe(initialText);
  });

  test("Today button navigates back to current month", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await switchView(page, "calendar");
    // Navigate forward 3 months
    for (let i = 0; i < 3; i++) {
      await page.locator('[data-testid="calendar-next"]').click();
      await page.waitForTimeout(50);
    }
    // Click Today
    await page.locator("text=Today").click();
    await page.waitForTimeout(100);
    const now = new Date();
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    await expect(page.locator(`text=${monthNames[now.getMonth()]} ${now.getFullYear()}`)).toBeVisible();
  });

  test("cards appear on correct dates", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    // Set row data in table view
    await fillRowTitle(page, 0, "Meeting");
    await setRowDate(page, 0, 15);
    await fillRowTitle(page, 1, "Deadline");
    await setRowDate(page, 1, 22);
    // Switch to calendar
    await switchView(page, "calendar");
    const cards = page.locator('[data-testid="calendar-card"]');
    await expect(cards).toHaveCount(2);
    await expect(cards.filter({ hasText: "Meeting" })).toBeVisible();
    await expect(cards.filter({ hasText: "Deadline" })).toBeVisible();
  });

  test("clicking + on a date cell adds a row with that date", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await switchView(page, "calendar");
    // Hover over a cell and click the + button
    const cell = page.locator('[data-testid="calendar-cell"]').nth(10);
    await cell.hover();
    await cell.locator('[data-testid="calendar-add-btn"]').click();
    await page.waitForTimeout(300);
    // Should now have a card on that cell
    await expect(cell.locator('[data-testid="calendar-card"]')).toHaveCount(1);
  });

  test("rows without dates don't appear on calendar", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await fillRowTitle(page, 0, "Has date");
    await setRowDate(page, 0, 10);
    // Row 1 has no date
    await fillRowTitle(page, 1, "No date");
    await switchView(page, "calendar");
    // Only 1 card should be visible
    await expect(page.locator('[data-testid="calendar-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="calendar-card"]').first()).toContainText("Has date");
  });

  test("calendar shows filter/sort toolbar", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await switchView(page, "calendar");
    await expect(page.locator('[data-testid="filter-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="sort-btn"]')).toBeVisible();
  });

  test("calendar view persists after reload", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await switchView(page, "calendar");
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForSelector('[data-testid="page-title"]');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
  });
});

// ─── Gallery view ───────────────────────────────────────────────────────────

test.describe("Gallery view", () => {
  test("shows gallery grid with default rows", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await switchView(page, "gallery");
    await expect(page.locator('[data-testid="gallery-grid"]')).toBeVisible();
    // 3 default rows + 1 add button
    const cards = page.locator('[data-testid="gallery-card"]');
    await expect(cards).toHaveCount(3);
  });

  test("gallery cards show row titles", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillRowTitle(page, 0, "Alpha");
    await fillRowTitle(page, 1, "Beta");
    await switchView(page, "gallery");
    const cards = page.locator('[data-testid="gallery-card"]');
    await expect(cards.nth(0)).toContainText("Alpha");
    await expect(cards.nth(1)).toContainText("Beta");
  });

  test("gallery cards show property values", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillRowTitle(page, 0, "Task A");
    await setRowStatus(page, 0, "Done");
    await switchView(page, "gallery");
    // Card should show the "Done" tag
    await expect(page.locator('[data-testid="gallery-card"]').first()).toContainText("Done");
  });

  test("gallery + button adds a new row", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await switchView(page, "gallery");
    await expect(page.locator('[data-testid="gallery-card"]')).toHaveCount(3);
    await page.locator('[data-testid="gallery-add-card"]').click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="gallery-card"]')).toHaveCount(4);
  });

  test("gallery shows placeholder image area for cards without URL", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await switchView(page, "gallery");
    // Cards without a URL prop should have a gradient placeholder (no img tag)
    const firstCard = page.locator('[data-testid="gallery-card"]').first();
    await expect(firstCard.locator("img")).not.toBeVisible();
  });

  test("gallery shows image when URL column has value", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addUrlColumn(page);
    // Set URL value on first row
    const urlCells = page.locator('[data-testid="cell-url"]');
    await urlCells.first().click();
    const input = page.locator('[data-testid="cell-input-url"]').first();
    await input.fill("https://picsum.photos/400/200");
    await input.press("Enter");
    await page.waitForTimeout(200);
    await switchView(page, "gallery");
    // First card should have an img tag
    const firstCard = page.locator('[data-testid="gallery-card"]').first();
    await expect(firstCard.locator("img")).toBeVisible();
    await expect(firstCard.locator("img")).toHaveAttribute("src", "https://picsum.photos/400/200");
  });

  test("gallery shows filter/sort toolbar", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await switchView(page, "gallery");
    await expect(page.locator('[data-testid="filter-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="sort-btn"]')).toBeVisible();
  });

  test("gallery filter narrows visible cards", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillRowTitle(page, 0, "Visible");
    await setRowStatus(page, 0, "Done");
    await fillRowTitle(page, 1, "Hidden");
    await setRowStatus(page, 1, "In progress");
    await switchView(page, "gallery");
    await expect(page.locator('[data-testid="gallery-card"]')).toHaveCount(3);
    // Add filter: Status is Done
    await page.locator('[data-testid="filter-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-filter-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="filter-value"]').click();
    await page.waitForTimeout(200);
    await page.locator("text=Done").click();
    await page.waitForTimeout(200);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    // Only 1 card should be visible
    await expect(page.locator('[data-testid="gallery-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="gallery-card"]').first()).toContainText("Visible");
  });

  test("gallery view persists after reload", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await switchView(page, "gallery");
    await expect(page.locator('[data-testid="gallery-view"]')).toBeVisible();
    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForSelector('[data-testid="page-title"]');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="gallery-view"]')).toBeVisible();
  });
});
