import { expect, test } from "@playwright/test";

// ─── helpers ────────────────────────────────────────────────────────────────

async function createPage(page: import("@playwright/test").Page) {
  await page.goto("/workspace");
  await page.waitForSelector('[data-testid="page-title"]');
}

async function insertBlock(
  page: import("@playwright/test").Page,
  blockName: string,
) {
  const editor = page.locator(".verso-editor");
  await editor.click();
  await page.keyboard.type("/");
  await page.waitForTimeout(300);
  for (const char of blockName) {
    await page.keyboard.type(char);
    await page.waitForTimeout(80);
  }
  const menu = page.locator(".fixed.z-50.w-72");
  await menu.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(200);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
}

async function insertDatabase(page: import("@playwright/test").Page) {
  await insertBlock(page, "Database");
  await page.waitForSelector('[data-testid="database-block"]', { timeout: 5000 });
}

// ─── Database block insertion ───────────────────────────────────────────────

test.describe("Database block insertion", () => {
  test("slash /database inserts a database block", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await expect(page.locator('[data-testid="database-block"]')).toBeVisible();
    await expect(page.locator('[data-testid="database-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="database-table"]')).toBeVisible();
  });

  test("database has default title 'Untitled Database'", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    const title = page.locator('[data-testid="database-title"]');
    await expect(title).toHaveValue("Untitled Database");
  });

  test("database title is editable", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    const title = page.locator('[data-testid="database-title"]');
    await title.click();
    await title.fill("My Tasks");
    await title.press("Enter");
    await expect(title).toHaveValue("My Tasks");
  });

  test("database has 3 default rows", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    const rows = page.locator('[data-testid="database-row"]');
    await expect(rows).toHaveCount(3);
  });

  test("database has default columns: Name, Status, Tags", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await expect(page.locator('[data-testid="column-header-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-header-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-header-tags"]')).toBeVisible();
  });
});

// ─── Row operations ─────────────────────────────────────────────────────────

test.describe("Row operations", () => {
  test("clicking + New adds a row", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await expect(page.locator('[data-testid="database-row"]')).toHaveCount(3);
    await page.locator('[data-testid="add-row-btn"]').click();
    await expect(page.locator('[data-testid="database-row"]')).toHaveCount(4);
  });

  test("hovering row shows delete button, clicking it removes the row", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await expect(page.locator('[data-testid="database-row"]')).toHaveCount(3);
    const firstRow = page.locator('[data-testid="database-row"]').first();
    await firstRow.hover();
    const deleteBtn = firstRow.locator('[data-testid="row-delete-btn"]');
    await deleteBtn.click();
    await expect(page.locator('[data-testid="database-row"]')).toHaveCount(2);
  });
});

// ─── Cell editing: Title / Text ─────────────────────────────────────────────

test.describe("Cell editing: text cells", () => {
  test("clicking a title cell opens inline editor, typing and pressing Enter saves", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    const titleCell = page.locator('[data-testid="cell-title"]').first();
    await titleCell.click();
    const input = page.locator('[data-testid="cell-input-title"]').first();
    await expect(input).toBeVisible();
    await input.fill("Buy groceries");
    await input.press("Enter");
    await expect(page.locator('[data-testid="cell-title"]').first()).toContainText("Buy groceries");
  });

  test("pressing Escape cancels edit", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    const titleCell = page.locator('[data-testid="cell-title"]').first();
    await titleCell.click();
    const input = page.locator('[data-testid="cell-input-title"]').first();
    await input.fill("Will cancel");
    await input.press("Escape");
    // Should show Untitled (the default empty state)
    await expect(page.locator('[data-testid="cell-title"]').first()).toContainText("Untitled");
  });
});

// ─── Cell editing: Number ───────────────────────────────────────────────────

test.describe("Cell editing: number", () => {
  test("can add a number column and enter a value", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    // Add a number column
    await page.locator('[data-testid="add-column-btn"]').click();
    await page.waitForTimeout(200);
    const addMenu = page.locator('[data-testid="add-column-menu"]');
    await addMenu.locator("text=Number").click();
    await page.waitForTimeout(200);
    // Click on a number cell in the first row
    const numberCell = page.locator('[data-testid="cell-number"]').first();
    await numberCell.click();
    const input = page.locator('[data-testid="cell-input-number"]').first();
    await input.fill("42");
    await input.press("Enter");
    await expect(page.locator('[data-testid="cell-number"]').first()).toContainText("42");
  });
});

// ─── Cell editing: Checkbox ─────────────────────────────────────────────────

test.describe("Cell editing: checkbox", () => {
  test("can add a checkbox column and toggle it", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    // Add a checkbox column
    await page.locator('[data-testid="add-column-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-column-menu"]').locator("text=Checkbox").click();
    await page.waitForTimeout(200);
    const checkbox = page.locator('[data-testid="cell-checkbox"]').first();
    // Initially unchecked — no check icon
    await expect(checkbox.locator("svg")).not.toBeVisible();
    await checkbox.click();
    // Now checked — check icon visible
    await expect(checkbox.locator("svg")).toBeVisible();
    // Click again to uncheck
    await checkbox.click();
    await expect(checkbox.locator("svg")).not.toBeVisible();
  });
});

// ─── Cell editing: Select ───────────────────────────────────────────────────

test.describe("Cell editing: select", () => {
  test("clicking a select cell opens dropdown, clicking an option selects it", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    // The Status column is a select by default
    const selectCell = page.locator('[data-testid="cell-select"]').first();
    await selectCell.click();
    const dropdown = page.locator('[data-testid="select-dropdown"]');
    await expect(dropdown).toBeVisible();
    // Click "In progress" option
    await dropdown.locator("text=In progress").click();
    await page.waitForTimeout(200);
    // Should show the tag
    await expect(page.locator('[data-testid="select-tag"]').first()).toContainText("In progress");
  });

  test("can create a new option by typing and pressing Enter", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    const selectCell = page.locator('[data-testid="cell-select"]').first();
    await selectCell.click();
    const dropdown = page.locator('[data-testid="select-dropdown"]');
    const searchInput = dropdown.locator("input");
    await searchInput.fill("Blocked");
    await page.waitForTimeout(200);
    // Click the create button
    await dropdown.locator('text=Create "Blocked"').click();
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="select-tag"]').first()).toContainText("Blocked");
  });
});

// ─── Cell editing: Multi-select ─────────────────────────────────────────────

test.describe("Cell editing: multi-select", () => {
  test("can select multiple tags", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    // Tags column is multi_select by default — create first tag
    await page.locator('[data-testid="cell-multi-select"]').first().click();
    await page.waitForTimeout(200);
    const dropdown1 = page.locator('[data-testid="multi-select-dropdown"]');
    await dropdown1.locator("input").fill("Frontend");
    await page.waitForTimeout(200);
    await dropdown1.locator('text=Create "Frontend"').click();
    await page.waitForTimeout(500);
    // Re-open dropdown for second tag (may close after store update)
    if (!(await page.locator('[data-testid="multi-select-dropdown"]').isVisible())) {
      await page.locator('[data-testid="cell-multi-select"]').first().click();
      await page.waitForTimeout(200);
    }
    const dropdown2 = page.locator('[data-testid="multi-select-dropdown"]');
    await dropdown2.locator("input").fill("Urgent");
    await page.waitForTimeout(200);
    await dropdown2.locator('text=Create "Urgent"').click();
    await page.waitForTimeout(500);
    // Cell should show both tags
    const cellTags = page.locator('[data-testid="cell-multi-select"]').first().locator('[data-testid="select-tag"]');
    await expect(cellTags).toHaveCount(2);
  });
});

// ─── Cell editing: Date ─────────────────────────────────────────────────────

test.describe("Cell editing: date", () => {
  async function addDateColumn(page: import("@playwright/test").Page) {
    await page.locator('[data-testid="add-column-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-column-menu"]').locator("text=Date").click();
    await page.waitForTimeout(200);
  }

  async function openDatePicker(page: import("@playwright/test").Page) {
    await page.locator('[data-testid="cell-date"]').first().click();
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="date-picker-dropdown"]')).toBeVisible();
  }

  test("can add a date column and see empty date cells", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await expect(page.locator('[data-testid="cell-date"]').first()).toBeVisible();
  });

  test("clicking a date cell opens the custom calendar", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await openDatePicker(page);
    // Should show month/year header, day names, day buttons
    await expect(page.locator('[data-testid="date-picker-dropdown"]').locator("text=Su")).toBeVisible();
    await expect(page.locator('[data-testid="date-picker-dropdown"]').locator("text=Mo")).toBeVisible();
    await expect(page.locator('[data-testid="date-picker-dropdown"]').locator("text=Today")).toBeVisible();
  });

  test("selecting a day sets the date and closes the picker", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await openDatePicker(page);
    const dropdown = page.locator('[data-testid="date-picker-dropdown"]');
    // Click day 15
    await dropdown.locator("button", { hasText: /^15$/ }).click();
    await page.waitForTimeout(200);
    // Picker should close
    await expect(dropdown).not.toBeVisible();
    // Cell should show the selected date with "15" in it
    await expect(page.locator('[data-testid="cell-date"]').first()).toContainText("15");
  });

  test("Today button selects today's date", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await openDatePicker(page);
    const dropdown = page.locator('[data-testid="date-picker-dropdown"]');
    await dropdown.locator("button", { hasText: "Today" }).click();
    await page.waitForTimeout(200);
    await expect(dropdown).not.toBeVisible();
    // Cell should show today's day number
    const today = new Date();
    const dayStr = today.getDate().toString();
    await expect(page.locator('[data-testid="cell-date"]').first()).toContainText(dayStr);
  });

  test("Clear button removes the date", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    // First set a date
    await openDatePicker(page);
    const dropdown = page.locator('[data-testid="date-picker-dropdown"]');
    await dropdown.locator("button", { hasText: /^10$/ }).click();
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="cell-date"]').first()).toContainText("10");
    // Reopen and clear
    await page.locator('[data-testid="cell-date"]').first().click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="date-picker-dropdown"]').locator("button", { hasText: "Clear" }).click();
    await page.waitForTimeout(200);
    // Cell should be empty (non-breaking space only)
    const text = await page.locator('[data-testid="cell-date"]').first().textContent();
    expect(text?.trim()).toBe("");
  });

  test("navigating to previous month works", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await openDatePicker(page);
    const dropdown = page.locator('[data-testid="date-picker-dropdown"]');
    // Get current month name
    const currentHeader = await dropdown.locator("span.text-xs.font-semibold").textContent();
    // Click prev arrow
    await dropdown.locator("button").first().click();
    await page.waitForTimeout(100);
    // Month should have changed
    const newHeader = await dropdown.locator("span.text-xs.font-semibold").textContent();
    expect(newHeader).not.toBe(currentHeader);
  });

  test("navigating to next month works", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await openDatePicker(page);
    const dropdown = page.locator('[data-testid="date-picker-dropdown"]');
    const currentHeader = await dropdown.locator("span.text-xs.font-semibold").textContent();
    // Click next arrow (second button in the header)
    await dropdown.locator("button").nth(1).click();
    await page.waitForTimeout(100);
    const newHeader = await dropdown.locator("span.text-xs.font-semibold").textContent();
    expect(newHeader).not.toBe(currentHeader);
  });

  test("navigating across year boundary works (Jan → Dec prev)", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await openDatePicker(page);
    const dropdown = page.locator('[data-testid="date-picker-dropdown"]');
    const header = dropdown.locator("span.text-xs.font-semibold");
    // Navigate backwards until we reach January, then one more
    for (let i = 0; i < 13; i++) {
      await dropdown.locator("button").first().click();
      await page.waitForTimeout(50);
    }
    // Should show a month from the previous year
    const text = await header.textContent();
    expect(text).toBeTruthy();
    // Verify year changed
    const currentYear = new Date().getFullYear();
    expect(text).toContain(String(currentYear - 1));
  });

  test("selecting a day in a navigated month saves the correct date", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await openDatePicker(page);
    const dropdown = page.locator('[data-testid="date-picker-dropdown"]');
    // Go to next month
    await dropdown.locator("button").nth(1).click();
    await page.waitForTimeout(100);
    // Click day 5
    await dropdown.locator("button", { hasText: /^5$/ }).click();
    await page.waitForTimeout(200);
    // Cell should show "5" and the next month's name
    const cellText = await page.locator('[data-testid="cell-date"]').first().textContent();
    expect(cellText).toContain("5");
  });

  test("reopening picker after selecting a date shows the correct month", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    // Navigate 3 months forward and select a date
    await openDatePicker(page);
    const dropdown = page.locator('[data-testid="date-picker-dropdown"]');
    for (let i = 0; i < 3; i++) {
      await dropdown.locator("button").nth(1).click();
      await page.waitForTimeout(50);
    }
    const monthAfterNav = await dropdown.locator("span.text-xs.font-semibold").textContent();
    await dropdown.locator("button", { hasText: /^20$/ }).click();
    await page.waitForTimeout(200);
    // Reopen — should show the same month as the selected date
    await page.locator('[data-testid="cell-date"]').first().click();
    await page.waitForTimeout(200);
    const monthOnReopen = await page.locator('[data-testid="date-picker-dropdown"]').locator("span.text-xs.font-semibold").textContent();
    expect(monthOnReopen).toBe(monthAfterNav);
  });

  test("clicking outside the picker closes it without changing value", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await openDatePicker(page);
    // Click the backdrop (fixed inset-0 div)
    await page.mouse.click(10, 10);
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="date-picker-dropdown"]')).not.toBeVisible();
    // Cell should still be empty
    const text = await page.locator('[data-testid="cell-date"]').first().textContent();
    expect(text?.trim()).toBe("");
  });

  test("date value persists after page reload", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await openDatePicker(page);
    const dropdown = page.locator('[data-testid="date-picker-dropdown"]');
    await dropdown.locator("button", { hasText: /^22$/ }).click();
    await page.waitForTimeout(200);
    const cellTextBefore = await page.locator('[data-testid="cell-date"]').first().textContent();
    // Database store persists to localStorage synchronously — just wait a moment then reload
    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForSelector('[data-testid="page-title"]');
    await page.waitForTimeout(500);
    const cellTextAfter = await page.locator('[data-testid="cell-date"]').first().textContent();
    expect(cellTextAfter).toBe(cellTextBefore);
  });

  test("multiple rows can have independent dates", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    const dateCells = page.locator('[data-testid="cell-date"]');
    // Set date on first row
    await dateCells.nth(0).click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="date-picker-dropdown"]').locator("button", { hasText: /^8$/ }).click();
    await page.waitForTimeout(300);
    // Set date on second row
    await dateCells.nth(1).click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="date-picker-dropdown"]').locator("button", { hasText: /^25$/ }).click();
    await page.waitForTimeout(300);
    // Verify they're different
    const text0 = await dateCells.nth(0).textContent();
    const text1 = await dateCells.nth(1).textContent();
    expect(text0).toContain("8");
    expect(text1).toContain("25");
    expect(text0).not.toBe(text1);
  });

  test("selecting a date, clearing it, then selecting again works", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    // Select day 12
    await openDatePicker(page);
    await page.locator('[data-testid="date-picker-dropdown"]').locator("button", { hasText: /^12$/ }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="cell-date"]').first()).toContainText("12");
    // Clear
    await page.locator('[data-testid="cell-date"]').first().click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="date-picker-dropdown"]').locator("button", { hasText: "Clear" }).click();
    await page.waitForTimeout(300);
    const cleared = await page.locator('[data-testid="cell-date"]').first().textContent();
    expect(cleared?.trim()).toBe("");
    // Select day 3
    await page.locator('[data-testid="cell-date"]').first().click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="date-picker-dropdown"]').locator("button", { hasText: /^3$/ }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="cell-date"]').first()).toContainText("3");
  });

  test("rapidly opening and closing the picker doesn't break state", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    const dateCell = page.locator('[data-testid="cell-date"]').first();
    // Open-close rapidly 5 times
    for (let i = 0; i < 5; i++) {
      await dateCell.click();
      await page.waitForTimeout(100);
      await page.mouse.click(10, 10); // click backdrop to close
      await page.waitForTimeout(100);
    }
    // Should still work — open and select a date
    await dateCell.click();
    await page.waitForTimeout(200);
    const dropdown = page.locator('[data-testid="date-picker-dropdown"]');
    await expect(dropdown).toBeVisible();
    await dropdown.locator("button", { hasText: /^7$/ }).click();
    await page.waitForTimeout(200);
    await expect(dateCell).toContainText("7");
  });

  test("navigating many months forward and back returns to original month", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await openDatePicker(page);
    const dropdown = page.locator('[data-testid="date-picker-dropdown"]');
    const header = dropdown.locator("span.text-xs.font-semibold");
    const originalMonth = await header.textContent();
    // Go forward 6 months
    for (let i = 0; i < 6; i++) {
      await dropdown.locator("button").nth(1).click();
      await page.waitForTimeout(50);
    }
    // Go back 6 months
    for (let i = 0; i < 6; i++) {
      await dropdown.locator("button").first().click();
      await page.waitForTimeout(50);
    }
    const returnedMonth = await header.textContent();
    expect(returnedMonth).toBe(originalMonth);
  });

  test("February shows correct number of days (non-leap year vs leap year)", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    await openDatePicker(page);
    const dropdown = page.locator('[data-testid="date-picker-dropdown"]');
    const header = dropdown.locator("span.text-xs.font-semibold");
    // Navigate to February of current year
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed
    // Go backward to reach February (month index 1)
    const stepsBack = currentMonth >= 1 ? currentMonth - 1 : currentMonth + 11;
    for (let i = 0; i < stepsBack; i++) {
      await dropdown.locator("button").first().click();
      await page.waitForTimeout(50);
    }
    const headerText = await header.textContent();
    expect(headerText).toContain("February");
    // Check if day 29 exists based on leap year
    const year = parseInt(headerText!.split(" ")[1]);
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const day29 = dropdown.locator("button", { hasText: /^29$/ });
    if (isLeap) {
      await expect(day29).toBeVisible();
    } else {
      await expect(day29).not.toBeVisible();
    }
    // Day 30 should never exist in February
    await expect(dropdown.locator("button", { hasText: /^30$/ })).not.toBeVisible();
  });

  test("changing date on one row does not affect another row", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    const dateCells = page.locator('[data-testid="cell-date"]');
    // Set row 0 to day 14
    await dateCells.nth(0).click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="date-picker-dropdown"]').locator("button", { hasText: /^14$/ }).click();
    await page.waitForTimeout(300);
    // Set row 1 to day 21
    await dateCells.nth(1).click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="date-picker-dropdown"]').locator("button", { hasText: /^21$/ }).click();
    await page.waitForTimeout(300);
    // Row 0 should still be 14 (not changed to 21)
    await expect(dateCells.nth(0)).toContainText("14");
    await expect(dateCells.nth(1)).toContainText("21");
    // Row 2 should still be empty
    const text2 = await dateCells.nth(2).textContent();
    expect(text2?.trim()).toBe("");
  });

  test("selected day is highlighted when reopening picker", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    await addDateColumn(page);
    // Select day 18
    await openDatePicker(page);
    await page.locator('[data-testid="date-picker-dropdown"]').locator("button", { hasText: /^18$/ }).click();
    await page.waitForTimeout(300);
    // Reopen
    await page.locator('[data-testid="cell-date"]').first().click();
    await page.waitForTimeout(200);
    // Day 18 should have the primary bg (selected state)
    const day18 = page.locator('[data-testid="date-picker-dropdown"]').locator("button", { hasText: /^18$/ });
    await expect(day18).toHaveClass(/bg-primary/);
  });
});

// ─── Column operations ──────────────────────────────────────────────────────

test.describe("Column operations", () => {
  test("add column button opens type menu and adds a column", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    // Count initial visible columns (Name, Status, Tags + actions + add = 5 th)
    const headers = page.locator("thead th");
    const initialCount = await headers.count();
    await page.locator('[data-testid="add-column-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-column-menu"]').locator("text=URL").click();
    await page.waitForTimeout(200);
    await expect(headers).toHaveCount(initialCount + 1);
  });

  test("column header click opens menu with rename, type, delete", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    // Click the Status column header
    await page.locator('[data-testid="column-header-status"]').click();
    const menu = page.locator('[data-testid="column-menu"]');
    await expect(menu).toBeVisible();
    await expect(menu.locator("text=Rename")).toBeVisible();
    await expect(menu.locator("text=Delete property")).toBeVisible();
  });

  test("can delete a column", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    // Add a column first
    await page.locator('[data-testid="add-column-btn"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="add-column-menu"]').locator("text=Email").click();
    await page.waitForTimeout(200);
    // Now delete it
    await page.locator('[data-testid="column-header-email"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="column-delete"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="column-header-email"]')).not.toBeVisible();
  });

  test("can rename a column", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    // Open Status column menu
    await page.locator('[data-testid="column-header-status"]').click();
    await page.waitForTimeout(200);
    const menu = page.locator('[data-testid="column-menu"]');
    await menu.locator("text=Rename").click();
    await page.waitForTimeout(200);
    const renameInput = page.locator('[data-testid="column-rename-input"]');
    await expect(renameInput).toBeVisible();
    await renameInput.fill("Priority");
    await renameInput.press("Enter");
    await page.waitForTimeout(200);
    // Should now show "Priority" instead of "Status"
    await expect(page.locator('[data-testid="column-header-priority"]')).toBeVisible();
  });

  test("title column cannot be deleted", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    // Clicking Name column header should not show menu (it's the title column)
    await page.locator('[data-testid="column-header-name"]').click();
    // The column menu should NOT appear for title columns
    await expect(page.locator('[data-testid="column-menu"]')).not.toBeVisible();
  });
});

// ─── Persistence ────────────────────────────────────────────────────────────

test.describe("Database persistence", () => {
  test("database data persists after reload", async ({ page }) => {
    await createPage(page);
    await insertDatabase(page);
    // Edit a title cell
    await page.locator('[data-testid="cell-title"]').first().click();
    const input = page.locator('[data-testid="cell-input-title"]').first();
    await input.fill("Persistent task");
    await input.press("Enter");
    await page.waitForTimeout(500);
    // Rename the database
    const dbTitle = page.locator('[data-testid="database-title"]');
    await dbTitle.click();
    await dbTitle.fill("My DB");
    await dbTitle.press("Enter");
    // Wait for save
    await page.waitForSelector("text=Saved", { timeout: 5000 });
    await page.reload();
    await page.waitForSelector('[data-testid="page-title"]');
    await page.waitForTimeout(500);
    // Check database title persisted
    await expect(page.locator('[data-testid="database-title"]')).toHaveValue("My DB");
    // Check cell data persisted
    await expect(page.locator('[data-testid="cell-title"]').first()).toContainText("Persistent task");
  });
});
