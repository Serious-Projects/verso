import { expect, test } from "@playwright/test";

// ─── helpers ────────────────────────────────────────────────────────────────

async function createPage(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.waitForURL(/\/workspace/);
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

/** Fill the default 3-row database with test data for filter/sort tests */
async function fillTestData(page: import("@playwright/test").Page) {
  // Row 1: "Charlie", Status=In progress
  const titles = page.locator('[data-testid="cell-title"]');
  await titles.nth(0).click();
  await page.locator('[data-testid="cell-input-title"]').first().fill("Charlie");
  await page.locator('[data-testid="cell-input-title"]').first().press("Enter");
  await page.waitForTimeout(200);

  // Row 2: "Alice", Status=Done
  await titles.nth(1).click();
  await page.locator('[data-testid="cell-input-title"]').first().fill("Alice");
  await page.locator('[data-testid="cell-input-title"]').first().press("Enter");
  await page.waitForTimeout(200);

  // Row 3: "Bob", Status=Not started
  await titles.nth(2).click();
  await page.locator('[data-testid="cell-input-title"]').first().fill("Bob");
  await page.locator('[data-testid="cell-input-title"]').first().press("Enter");
  await page.waitForTimeout(200);

  // Set statuses
  const selects = page.locator('[data-testid="cell-select"]');
  // Row 1: In progress
  await selects.nth(0).click();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="select-dropdown"]').locator("text=In progress").click();
  await page.waitForTimeout(300);

  // Row 2: Done
  await selects.nth(1).click();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="select-dropdown"]').locator("text=Done").click();
  await page.waitForTimeout(300);

  // Row 3: Not started
  await selects.nth(2).click();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="select-dropdown"]').locator("text=Not started").click();
  await page.waitForTimeout(300);
}

// ─── Toolbar visibility ─────────────────────────────────────────────────────

test.describe("Filter/Sort/Group toolbar", () => {
  test("toolbar shows filter, sort, and group buttons", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await expect(page.locator('[data-testid="filter-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="sort-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="group-btn"]')).toBeVisible();
  });
});

// ─── Filters ────────────────────────────────────────────────────────────────

test.describe("Filters", () => {
  test("clicking Filter opens the filter panel", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await page.locator('[data-testid="filter-btn"]').click();
    await expect(page.locator('[data-testid="filter-panel"]')).toBeVisible();
    await expect(page.locator("text=No filters applied")).toBeVisible();
  });

  test("adding a filter shows a filter row", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await page.locator('[data-testid="filter-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-filter-btn"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="filter-row"]')).toBeVisible();
    // Filter button should now show count
    await expect(page.locator('[data-testid="filter-btn"]')).toContainText("Filter (1)");
  });

  test("is_not_empty filter shows only rows with a value", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);
    // Add filter on Status, operator "Is not empty"
    await page.locator('[data-testid="filter-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-filter-btn"]').click();
    await page.waitForTimeout(200);
    // Change operator to "Is not empty" via custom SelectInput
    await page.locator('[data-testid="filter-operator"]').click();
    await page.waitForTimeout(200);
    await page.locator("text=Is not empty").click();
    await page.waitForTimeout(200);
    // Close filter panel
    await page.mouse.click(10, 10);
    await page.waitForTimeout(300);
    // All 3 rows have a status set, so all 3 should show
    await expect(page.locator('[data-testid="database-row"]')).toHaveCount(3);
  });

  test("select filter narrows rows to matching status", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);
    // Add filter (defaults to Status select)
    await page.locator('[data-testid="filter-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-filter-btn"]').click();
    await page.waitForTimeout(200);
    // Click the value SelectInput and pick "Done"
    await page.locator('[data-testid="filter-value"]').click();
    await page.waitForTimeout(200);
    await page.locator("text=Done").click();
    await page.waitForTimeout(300);
    // Close filter panel
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    // Should show only 1 row (Alice with Done status)
    await expect(page.locator('[data-testid="database-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="cell-title"]').first()).toContainText("Alice");
  });

  test("removing a filter restores all rows", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);
    // Add filter with a value that matches 1 row
    await page.locator('[data-testid="filter-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-filter-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="filter-value"]').click();
    await page.waitForTimeout(200);
    await page.locator("text=Done").click();
    await page.waitForTimeout(200);
    // Remove the filter
    await page.locator('[data-testid="filter-remove"]').click();
    await page.waitForTimeout(200);
    // Close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="database-row"]')).toHaveCount(3);
  });
});

// ─── Sorts ──────────────────────────────────────────────────────────────────

test.describe("Sorts", () => {
  test("clicking Sort opens the sort panel", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await page.locator('[data-testid="sort-btn"]').click();
    await expect(page.locator('[data-testid="sort-panel"]')).toBeVisible();
    await expect(page.locator("text=No sorts applied")).toBeVisible();
  });

  test("adding a sort reorders rows alphabetically", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);
    // Before sort: Charlie, Alice, Bob (insertion order)
    const titles = page.locator('[data-testid="cell-title"]');
    await expect(titles.nth(0)).toContainText("Charlie");

    // Add sort on Name (title) ascending
    await page.locator('[data-testid="sort-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-sort-btn"]').click();
    await page.waitForTimeout(200);
    // The first sortable property is "Name" (title)
    // Close sort panel
    await page.mouse.click(10, 10);
    await page.waitForTimeout(300);

    // After sort: Alice, Bob, Charlie (A→Z)
    await expect(titles.nth(0)).toContainText("Alice");
    await expect(titles.nth(1)).toContainText("Bob");
    await expect(titles.nth(2)).toContainText("Charlie");
  });

  test("toggling sort direction reverses the order", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);

    await page.locator('[data-testid="sort-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-sort-btn"]').click();
    await page.waitForTimeout(200);
    // Toggle to Z→A
    await page.locator('[data-testid="sort-direction"]').click();
    await page.waitForTimeout(200);
    await page.mouse.click(10, 10);
    await page.waitForTimeout(300);

    const titles = page.locator('[data-testid="cell-title"]');
    await expect(titles.nth(0)).toContainText("Charlie");
    await expect(titles.nth(1)).toContainText("Bob");
    await expect(titles.nth(2)).toContainText("Alice");
  });

  test("removing a sort restores original order", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);
    const titles = page.locator('[data-testid="cell-title"]');
    // Original order
    await expect(titles.nth(0)).toContainText("Charlie");

    // Add and remove sort
    await page.locator('[data-testid="sort-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-sort-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="sort-remove"]').click();
    await page.waitForTimeout(200);
    await page.mouse.click(10, 10);
    await page.waitForTimeout(300);

    // Back to original order
    await expect(titles.nth(0)).toContainText("Charlie");
  });

  test("sort button shows count when active", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await page.locator('[data-testid="sort-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-sort-btn"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="sort-btn"]')).toContainText("Sort (1)");
  });
});

// ─── Grouping ───────────────────────────────────────────────────────────────

test.describe("Grouping", () => {
  test("clicking Group opens the group panel", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await page.locator('[data-testid="group-btn"]').click();
    await expect(page.locator('[data-testid="group-panel"]')).toBeVisible();
  });

  test("grouping by Status shows group headers", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);

    await page.locator('[data-testid="group-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="group-by-status"]').click();
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Should show group headers
    const groupHeaders = page.locator('[data-testid="group-header"]');
    await expect(groupHeaders.first()).toBeVisible();
    // Should have 3 groups (In progress, Done, Not started)
    await expect(groupHeaders).toHaveCount(3);
  });

  test("group headers show correct labels and counts", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);

    await page.locator('[data-testid="group-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="group-by-status"]').click();
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Each group should show count "1"
    const groupHeaders = page.locator('[data-testid="group-header"]');
    for (let i = 0; i < 3; i++) {
      await expect(groupHeaders.nth(i)).toContainText("1");
    }
  });

  test("collapsing a group hides its rows", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);

    await page.locator('[data-testid="group-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="group-by-status"]').click();
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // 3 groups with 1 row each = 3 data rows visible
    await expect(page.locator('[data-testid="database-row"]')).toHaveCount(3);

    // Collapse the first group
    await page.locator('[data-testid="group-toggle"]').first().click();
    await page.waitForTimeout(200);

    // Now only 2 data rows visible
    await expect(page.locator('[data-testid="database-row"]')).toHaveCount(2);
  });

  test("selecting None removes grouping", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);

    // Enable grouping
    await page.locator('[data-testid="group-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="group-by-status"]').click();
    await page.waitForTimeout(200);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="group-header"]').first()).toBeVisible();

    // Disable grouping
    await page.locator('[data-testid="group-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="group-none"]').click();
    await page.waitForTimeout(200);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // No group headers
    await expect(page.locator('[data-testid="group-header"]')).toHaveCount(0);
    // All 3 rows visible
    await expect(page.locator('[data-testid="database-row"]')).toHaveCount(3);
  });

  test("group button shows count when active", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await page.locator('[data-testid="group-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="group-by-status"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="group-btn"]')).toContainText("Group (1)");
  });
});

// ─── Filter + Sort combined ─────────────────────────────────────────────────

test.describe("Filter + Sort combined", () => {
  test("filter and sort work together", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await fillTestData(page);

    // Sort by Name ascending
    await page.locator('[data-testid="sort-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-sort-btn"]').click();
    await page.waitForTimeout(200);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // After sort: Alice, Bob, Charlie
    const titles = page.locator('[data-testid="cell-title"]');
    await expect(titles.nth(0)).toContainText("Alice");

    // Now add a filter — filter Status = "Not started" (should show only Bob)
    await page.locator('[data-testid="filter-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-filter-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="filter-value"]').click();
    await page.waitForTimeout(200);
    await page.locator("text=Not started").click();
    await page.waitForTimeout(200);
    await page.mouse.click(10, 10);
    await page.waitForTimeout(300);

    // Should show only Bob
    await expect(page.locator('[data-testid="database-row"]')).toHaveCount(1);
    await expect(titles.first()).toContainText("Bob");
  });
});
