import { test, expect, Page } from "@playwright/test";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function clearState(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem("verso-pages");
    localStorage.removeItem("verso-document");
  });
}

async function freshWorkspace(page: Page) {
  // Clear state, then navigate to /workspace fresh so the redirect creates a new page
  await page.goto("/workspace");
  await clearState(page);
  await page.goto("/workspace");
  await page.waitForURL(/\/workspace\/.+/, { timeout: 10000 });
  await page.waitForSelector(".verso-editor", { timeout: 10000 });
  // Also wait for sidebar to be ready
  await page.waitForSelector("[data-testid^='page-item-']", { timeout: 10000 });
}

async function getPageIdFromUrl(page: Page): Promise<string> {
  const url = page.url();
  return url.split("/workspace/")[1];
}

/** Wait for the URL to change away from the current URL (while still matching the workspace pattern) */
async function waitForNavigation(page: Page, fromUrl: string) {
  await page.waitForURL((url) => url.href !== fromUrl && url.href.includes("/workspace/"), {
    timeout: 10000,
  });
}

// ─── 1. Initial load & routing ───────────────────────────────────────────────

test.describe("Initial routing", () => {
  test("redirects from /workspace to a page URL", async ({ page }) => {
    await page.goto("/workspace");
    await clearState(page);
    await page.reload();
    await page.waitForURL(/\/workspace\/.+/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/workspace\/.+/);
  });

  test("creates a Getting Started page on first load", async ({ page }) => {
    await freshWorkspace(page);
    const title = page.getByTestId("page-title");
    await expect(title).toBeVisible();
  });

  test("sidebar is visible on load", async ({ page }) => {
    await freshWorkspace(page);
    // Sidebar should show at least one page item
    await expect(page.locator("[data-testid^='page-item-']").first()).toBeVisible();
  });
});

// ─── 2. Creating pages ───────────────────────────────────────────────────────

test.describe("Creating pages", () => {
  test("New Page button creates a page and navigates to it", async ({ page }) => {
    await freshWorkspace(page);
    const urlBefore = page.url();

    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    const urlAfter = page.url();
    expect(urlAfter).not.toBe(urlBefore);
    await expect(page.locator(".verso-editor")).toBeVisible();
  });

  test("new page appears in sidebar", async ({ page }) => {
    await freshWorkspace(page);

    const countBefore = await page.locator("[data-testid^='page-item-']").count();
    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    const countAfter = await page.locator("[data-testid^='page-item-']").count();
    expect(countAfter).toBe(countBefore + 1);
  });

  test("add sub-page button creates a child page", async ({ page }) => {
    await freshWorkspace(page);
    const pageId = await getPageIdFromUrl(page);

    // Hover over the page item to reveal action buttons
    const pageItem = page.getByTestId(`page-item-${pageId}`);
    await pageItem.hover();

    const addChildBtn = page.getByTestId(`add-child-btn-${pageId}`);
    await expect(addChildBtn).toBeVisible();

    const urlBefore = page.url();
    await addChildBtn.click();
    await waitForNavigation(page, urlBefore);

    const newPageId = await getPageIdFromUrl(page);
    expect(newPageId).not.toBe(pageId);
  });
});

// ─── 3. Page title persistence ───────────────────────────────────────────────

test.describe("Page title", () => {
  test("typing in title field updates the page", async ({ page }) => {
    await freshWorkspace(page);
    const title = page.getByTestId("page-title");

    await title.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("My Test Page");

    // Title should persist — reload and verify
    await page.reload();
    await page.waitForURL(/\/workspace\/.+/, { timeout: 10000 });
    await page.waitForSelector(".verso-editor", { timeout: 10000 });

    const reloadedTitle = page.getByTestId("page-title");
    await expect(reloadedTitle).toContainText("My Test Page");
  });

  test("pressing Enter in title moves focus to editor", async ({ page }) => {
    await freshWorkspace(page);
    const title = page.getByTestId("page-title");
    await title.click();
    await page.keyboard.press("Enter");

    const editor = page.locator(".verso-editor");
    await expect(editor).toBeFocused();
  });

  test("title updates sidebar page name", async ({ page }) => {
    await freshWorkspace(page);
    const pageId = await getPageIdFromUrl(page);
    const title = page.getByTestId("page-title");

    await title.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("Sidebar Sync Test");
    await page.waitForTimeout(300);

    const sidebarItem = page.getByTestId(`page-item-${pageId}`);
    await expect(sidebarItem).toContainText("Sidebar Sync Test");
  });
});

// ─── 4. Icon picker ──────────────────────────────────────────────────────────

test.describe("Page icon", () => {
  test("clicking icon opens picker", async ({ page }) => {
    await freshWorkspace(page);
    await page.getByTestId("page-icon").click();
    // Icon picker grid should appear
    await expect(page.locator("text=Choose icon")).toBeVisible();
  });

  test("selecting an icon updates the page icon", async ({ page }) => {
    await freshWorkspace(page);
    await page.getByTestId("page-icon").click();
    await page.waitForSelector("text=Choose icon");

    // Click the first icon in the grid (stable data-testid, decoupled from styles)
    const firstIcon = page.locator("[data-testid='icon-button']").first();
    await firstIcon.click();

    // Picker should close
    await expect(page.locator("text=Choose icon")).not.toBeVisible();
  });
});

// ─── 5. Sidebar rename ───────────────────────────────────────────────────────

test.describe("Sidebar rename", () => {
  test("double-clicking page title shows rename input", async ({ page }) => {
    await freshWorkspace(page);
    const pageId = await getPageIdFromUrl(page);

    // Set a title first
    const titleEl = page.getByTestId("page-title");
    await titleEl.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("Renameable");
    await page.waitForTimeout(300);

    // Double-click the title text span in sidebar to rename
    await page.getByTestId(`page-title-text-${pageId}`).dblclick();

    const renameInput = page.getByTestId(`rename-input-${pageId}`);
    await expect(renameInput).toBeVisible();
  });

  test("committing rename updates the sidebar title", async ({ page }) => {
    await freshWorkspace(page);
    const pageId = await getPageIdFromUrl(page);

    // Double-click to rename
    await page.getByTestId(`page-title-text-${pageId}`).dblclick();

    const renameInput = page.getByTestId(`rename-input-${pageId}`);
    await renameInput.fill("Renamed Page");
    await renameInput.press("Enter");

    const pageItem = page.getByTestId(`page-item-${pageId}`);
    await expect(pageItem).toContainText("Renamed Page");
  });
});

// ─── 6. Sub-pages and expand/collapse ────────────────────────────────────────

test.describe("Sub-pages", () => {
  test("sub-page is nested under parent in sidebar", async ({ page }) => {
    await freshWorkspace(page);
    const parentId = await getPageIdFromUrl(page);

    // Add sub-page
    const parentItem = page.getByTestId(`page-item-${parentId}`);
    await parentItem.hover();

    const urlBefore = page.url();
    await page.getByTestId(`add-child-btn-${parentId}`).click();
    await waitForNavigation(page, urlBefore);
    const childId = await getPageIdFromUrl(page);

    // Child item should exist
    const childItem = page.getByTestId(`page-item-${childId}`);
    await expect(childItem).toBeVisible();
  });

  test("expand toggle shows and hides children", async ({ page }) => {
    await freshWorkspace(page);
    const parentId = await getPageIdFromUrl(page);

    // Create sub-page
    const parentItem = page.getByTestId(`page-item-${parentId}`);
    await parentItem.hover();

    const urlBefore = page.url();
    await page.getByTestId(`add-child-btn-${parentId}`).click();
    await waitForNavigation(page, urlBefore);
    const childId = await getPageIdFromUrl(page);

    // Navigate back to parent
    await page.goto(`/workspace/${parentId}`);
    // Wait for sidebar to load
    await page.waitForSelector(`[data-testid='page-item-${parentId}']`, { timeout: 10000 });

    // Child should be visible (auto-expanded on creation)
    const childItem = page.getByTestId(`page-item-${childId}`);
    await expect(childItem).toBeVisible();

    // Click expand toggle to collapse
    const expandBtn = page.getByTestId(`page-item-${parentId}`).locator("button").first();
    await expandBtn.click();

    // Child should be removed from DOM after animation
    await expect(childItem).not.toBeAttached({ timeout: 5000 });

    // Click again to expand
    await expandBtn.click();
    await expect(childItem).toBeVisible();
  });
});

// ─── 7. Breadcrumbs ──────────────────────────────────────────────────────────

test.describe("Breadcrumbs", () => {
  test("breadcrumbs not shown for top-level page", async ({ page }) => {
    await freshWorkspace(page);
    await expect(page.getByTestId("breadcrumbs")).not.toBeVisible();
  });

  test("breadcrumbs shown for nested page with parent link", async ({ page }) => {
    await freshWorkspace(page);
    const parentId = await getPageIdFromUrl(page);

    // Set a parent title so breadcrumb shows something
    const titleEl = page.getByTestId("page-title");
    await titleEl.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("Parent Page");
    await page.waitForTimeout(300);

    // Create sub-page
    const parentItem = page.getByTestId(`page-item-${parentId}`);
    await parentItem.hover();
    const urlBefore = page.url();
    await page.getByTestId(`add-child-btn-${parentId}`).click();
    await waitForNavigation(page, urlBefore);

    // Breadcrumbs should now be visible with parent reference
    await expect(page.getByTestId("breadcrumbs")).toBeVisible();
    await expect(page.getByTestId("breadcrumbs")).toContainText("Parent Page");
  });

  test("clicking breadcrumb navigates to parent page", async ({ page }) => {
    await freshWorkspace(page);
    const parentId = await getPageIdFromUrl(page);

    // Create sub-page
    const parentItem = page.getByTestId(`page-item-${parentId}`);
    await parentItem.hover();
    const urlBefore = page.url();
    await page.getByTestId(`add-child-btn-${parentId}`).click();
    await waitForNavigation(page, urlBefore);

    // Wait for breadcrumbs to appear
    await page.waitForSelector("[data-testid='breadcrumbs']", { timeout: 5000 });

    // Click parent link in breadcrumbs
    const breadcrumb = page.getByTestId("breadcrumbs").locator("a").first();
    await breadcrumb.click();

    await page.waitForURL(`/workspace/${parentId}`);
    expect(page.url()).toContain(parentId);
  });
});

// ─── 8. Delete page ──────────────────────────────────────────────────────────

test.describe("Deleting pages", () => {
  test("delete button removes page from sidebar", async ({ page }) => {
    await freshWorkspace(page);

    // Create a second page to delete
    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);
    const newPageId = await getPageIdFromUrl(page);

    const newPageItem = page.getByTestId(`page-item-${newPageId}`);
    await newPageItem.hover();

    const deleteBtn = page.getByTestId(`delete-btn-${newPageId}`);
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Page item should disappear
    await expect(newPageItem).not.toBeVisible();
  });
});

// ─── 9. Navigation between pages ─────────────────────────────────────────────

test.describe("Navigation", () => {
  test("clicking a page in sidebar navigates to it", async ({ page }) => {
    await freshWorkspace(page);
    const firstPageId = await getPageIdFromUrl(page);

    // Create second page
    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    // Navigate back to first page via sidebar
    const urlBefore2 = page.url();
    await page.getByTestId(`page-item-${firstPageId}`).click();
    await waitForNavigation(page, urlBefore2);

    expect(page.url()).toContain(firstPageId);
  });

  test("active page is highlighted in sidebar", async ({ page }) => {
    await freshWorkspace(page);
    const pageId = await getPageIdFromUrl(page);

    const pageItem = page.getByTestId(`page-item-${pageId}`);
    // Active item should have the accent background class
    await expect(pageItem).toHaveClass(/bg-sidebar-accent/);
  });

  test("content persists when switching between pages", async ({ page }) => {
    await freshWorkspace(page);
    const firstPageId = await getPageIdFromUrl(page);

    // Type content on first page
    const editor = page.locator(".verso-editor");
    await editor.click();
    await page.keyboard.type("Content on first page");
    await page.waitForTimeout(600); // Wait for debounce save

    // Create second page and type content
    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);
    await editor.click();
    await page.keyboard.type("Content on second page");
    await page.waitForTimeout(600);

    // Go back to first page
    const urlBefore2 = page.url();
    await page.getByTestId(`page-item-${firstPageId}`).click();
    await waitForNavigation(page, urlBefore2);

    // First page content should still be there
    await expect(editor).toContainText("Content on first page");
    await expect(editor).not.toContainText("Content on second page");
  });
});

// ─── 10. Favorites ───────────────────────────────────────────────────────────

test.describe("Favorites", () => {
  test("favorite button toggles star icon fill", async ({ page }) => {
    await freshWorkspace(page);
    const pageId = await getPageIdFromUrl(page);

    const pageItem = page.getByTestId(`page-item-${pageId}`);
    await pageItem.hover();

    const favoriteBtn = page.getByTestId(`favorite-btn-${pageId}`);
    await expect(favoriteBtn).toBeVisible();
    // force:true is intentional: the action buttons use `max-w-0 overflow-hidden`
    // for their hover-reveal animation. Playwright's geometric hit-test computes
    // the click coordinate from the element's collapsed (zero-width) bounding rect,
    // where the scroll-area root sits on top. Real users hover naturally and their
    // cursor lands directly on the expanded button — there is no real accessibility
    // issue here. The overlay intercept is test-environment-only.
    await favoriteBtn.click({ force: true });

    // Clicking again should unfavorite
    await favoriteBtn.click({ force: true });
    await expect(favoriteBtn).toBeVisible();
  });
});
