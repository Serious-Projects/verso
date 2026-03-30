import { test, expect, Page } from "@playwright/test";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function clearState(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem("verso-pages");
    localStorage.removeItem("verso-document");
  });
}

async function freshWorkspace(page: Page) {
  await page.goto("/workspace");
  await clearState(page);
  await page.goto("/workspace");
  await page.waitForURL(/\/workspace\/.+/, { timeout: 10000 });
  await page.waitForSelector(".verso-editor", { timeout: 10000 });
  await page.waitForSelector("[data-testid^='page-item-']", { timeout: 10000 });
}

async function getPageIdFromUrl(page: Page): Promise<string> {
  return page.url().split("/workspace/")[1];
}

async function waitForNavigation(page: Page, fromUrl: string) {
  await page.waitForURL((url) => url.href !== fromUrl && url.href.includes("/workspace/"), {
    timeout: 10000,
  });
}

/** Add a cover to the current page using the picker. */
async function addCover(page: Page, colorName: string) {
  await page.locator("[data-testid='cover-picker-btn']").hover();
  await page.getByTestId("cover-picker-btn").click();
  await page.getByTestId(`cover-color-${colorName}`).click();
  await expect(page.getByTestId("page-cover")).toBeVisible();
}

// ─── 1. Trash ────────────────────────────────────────────────────────────────

test.describe("Trash", () => {
  test("deleted page appears in trash section", async ({ page }) => {
    await freshWorkspace(page);
    const pageId = await getPageIdFromUrl(page);

    // Create second page so deletion doesn't strand navigation
    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    // Delete first page
    const pageItem = page.getByTestId(`page-item-${pageId}`);
    await pageItem.hover();
    await page.getByTestId(`delete-btn-${pageId}`).click();

    await page.getByTestId("trash-toggle").click();
    await expect(page.getByTestId(`trash-item-${pageId}`)).toBeVisible();
  });

  test("deleted page disappears from sidebar immediately", async ({ page }) => {
    await freshWorkspace(page);
    const pageId = await getPageIdFromUrl(page);

    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    const pageItem = page.getByTestId(`page-item-${pageId}`);
    await pageItem.hover();
    await page.getByTestId(`delete-btn-${pageId}`).click();

    // Must not be in the sidebar (normal pages list) anymore
    await expect(page.getByTestId(`page-item-${pageId}`)).not.toBeAttached();
  });

  test("restore button moves page back to sidebar", async ({ page }) => {
    await freshWorkspace(page);
    const pageId = await getPageIdFromUrl(page);

    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    const pageItem = page.getByTestId(`page-item-${pageId}`);
    await pageItem.hover();
    await page.getByTestId(`delete-btn-${pageId}`).click();

    await page.getByTestId("trash-toggle").click();
    await page.getByTestId(`restore-btn-${pageId}`).click();

    await expect(page.getByTestId(`page-item-${pageId}`)).toBeVisible();
  });

  test("restoring a page removes it from the trash section", async ({ page }) => {
    await freshWorkspace(page);
    const pageId = await getPageIdFromUrl(page);

    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    const pageItem = page.getByTestId(`page-item-${pageId}`);
    await pageItem.hover();
    await page.getByTestId(`delete-btn-${pageId}`).click();

    await page.getByTestId("trash-toggle").click();
    await expect(page.getByTestId(`trash-item-${pageId}`)).toBeVisible();

    await page.getByTestId(`restore-btn-${pageId}`).click();

    // Must be gone from trash and back in sidebar
    await expect(page.getByTestId(`trash-item-${pageId}`)).not.toBeAttached();
    await expect(page.getByTestId(`page-item-${pageId}`)).toBeVisible();
  });

  test("permanent delete removes page from trash", async ({ page }) => {
    await freshWorkspace(page);
    const pageId = await getPageIdFromUrl(page);

    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    const pageItem = page.getByTestId(`page-item-${pageId}`);
    await pageItem.hover();
    await page.getByTestId(`delete-btn-${pageId}`).click();

    await page.getByTestId("trash-toggle").click();
    await expect(page.getByTestId(`trash-item-${pageId}`)).toBeVisible();

    // First click arms the confirmation, second confirms
    await page.getByTestId(`perm-delete-btn-${pageId}`).click();
    await page.getByTestId(`perm-delete-confirm-btn-${pageId}`).click();

    // Gone from trash AND never reappears in sidebar
    await expect(page.getByTestId(`trash-item-${pageId}`)).not.toBeAttached();
    await expect(page.getByTestId(`page-item-${pageId}`)).not.toBeAttached();
  });

  test("multiple deleted pages all appear in trash", async ({ page }) => {
    await freshWorkspace(page);
    const firstPageId = await getPageIdFromUrl(page);

    // Create two more pages so we have 3 total
    let urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);
    const secondPageId = await getPageIdFromUrl(page);

    urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);
    // Currently on third page — delete first two

    let item = page.getByTestId(`page-item-${firstPageId}`);
    await item.hover();
    await page.getByTestId(`delete-btn-${firstPageId}`).click();

    item = page.getByTestId(`page-item-${secondPageId}`);
    await item.hover();
    await page.getByTestId(`delete-btn-${secondPageId}`).click();

    await page.getByTestId("trash-toggle").click();

    await expect(page.getByTestId(`trash-item-${firstPageId}`)).toBeVisible();
    await expect(page.getByTestId(`trash-item-${secondPageId}`)).toBeVisible();
  });
});

// ─── 2. Search ───────────────────────────────────────────────────────────────

test.describe("Search", () => {
  test("Search button opens search modal", async ({ page }) => {
    await freshWorkspace(page);
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByTestId("search-modal")).toBeVisible();
  });

  test("Cmd+K opens search modal", async ({ page }) => {
    await freshWorkspace(page);
    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("search-modal")).toBeVisible();
  });

  test("Escape closes search modal", async ({ page }) => {
    await freshWorkspace(page);
    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("search-modal")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("search-modal")).not.toBeVisible();
  });

  test("clicking backdrop closes search modal", async ({ page }) => {
    await freshWorkspace(page);
    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("search-modal")).toBeVisible();
    // Click right side of backdrop to avoid sidebar overlay (z-50) intercepting
    const backdrop = page.getByTestId("search-backdrop");
    const box = await backdrop.boundingBox();
    await backdrop.click({ position: { x: box!.width - 20, y: box!.height / 2 } });
    await expect(page.getByTestId("search-modal")).not.toBeVisible();
  });

  test("search input is auto-focused when modal opens", async ({ page }) => {
    await freshWorkspace(page);
    await page.keyboard.press("Control+k");
    await page.waitForSelector("[data-testid='search-modal']");
    // Brief wait for the setTimeout(focus, 50) in the component
    await page.waitForTimeout(100);
    await expect(page.getByTestId("search-input")).toBeFocused();
  });

  test("empty query shows all non-deleted pages", async ({ page }) => {
    await freshWorkspace(page);

    // Create a second page so we have 2
    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    await page.keyboard.press("Control+k");
    await page.waitForSelector("[data-testid='search-modal']");

    const allResults = page.locator("[data-testid^='search-result-']");
    await expect(allResults).toHaveCount(2);
  });

  test("typing filters pages by title", async ({ page }) => {
    await freshWorkspace(page);
    const titleEl = page.getByTestId("page-title");
    await titleEl.fill("Unique Alpha Page");
    await page.waitForTimeout(300);

    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    await page.keyboard.press("Control+k");
    await page.getByTestId("search-input").fill("Unique Alpha");
    await page.waitForTimeout(200);

    await expect(page.getByTestId("search-results")).toContainText("Unique Alpha Page");
    // Only 1 result matches
    const allResults = page.locator("[data-testid^='search-result-']");
    await expect(allResults).toHaveCount(1);
  });

  test("no-match query shows empty state", async ({ page }) => {
    await freshWorkspace(page);
    await page.keyboard.press("Control+k");
    await page.getByTestId("search-input").fill("zzz-absolutely-no-match-xqz");
    await page.waitForTimeout(150);
    await expect(page.getByTestId("search-results")).toContainText("No pages found");
    await expect(page.locator("[data-testid^='search-result-']")).toHaveCount(0);
  });

  test("deleted pages do not appear in search results", async ({ page }) => {
    await freshWorkspace(page);
    const pageId = await getPageIdFromUrl(page);

    // Give the page a distinctive title
    const titleEl = page.getByTestId("page-title");
    await titleEl.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("Ghost Deleted Page Xyz");
    await page.waitForTimeout(300);

    // Create a second page so we can safely delete the first
    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    // Delete the first page
    const pageItem = page.getByTestId(`page-item-${pageId}`);
    await pageItem.hover();
    await page.getByTestId(`delete-btn-${pageId}`).click();

    // Search for the deleted page's title
    await page.keyboard.press("Control+k");
    await page.getByTestId("search-input").fill("Ghost Deleted Page Xyz");
    await page.waitForTimeout(200);

    await expect(page.getByTestId(`search-result-${pageId}`)).not.toBeAttached();
    await expect(page.getByTestId("search-results")).toContainText("No pages found");
  });

  test("arrow keys change the highlighted result", async ({ page }) => {
    await freshWorkspace(page);

    // Create a second page so we have 2 results
    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    await page.keyboard.press("Control+k");
    await page.waitForSelector("[data-testid='search-modal']");

    const allResults = page.locator("[data-testid^='search-result-']");
    await expect(allResults).toHaveCount(2);

    // First result is highlighted by default (index 0)
    await expect(allResults.first()).toHaveClass(/bg-sidebar-accent/);
    await expect(allResults.nth(1)).not.toHaveClass(/bg-sidebar-accent/);

    // Arrow down — second result should become highlighted
    await page.getByTestId("search-input").press("ArrowDown");

    await expect(allResults.nth(1)).toHaveClass(/bg-sidebar-accent/);
    await expect(allResults.first()).not.toHaveClass(/bg-sidebar-accent/);

    // Arrow up — wraps back to first
    await page.getByTestId("search-input").press("ArrowUp");

    await expect(allResults.first()).toHaveClass(/bg-sidebar-accent/);
    await expect(allResults.nth(1)).not.toHaveClass(/bg-sidebar-accent/);
  });

  test("Enter navigates to the currently highlighted result", async ({ page }) => {
    await freshWorkspace(page);

    // Create a second page so there are 2 results
    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    await page.keyboard.press("Control+k");
    await page.waitForSelector("[data-testid='search-modal']");

    // Grab the first result's pageId from its data-testid attribute
    const firstResult = page.locator("[data-testid^='search-result-']").first();
    const testId = await firstResult.getAttribute("data-testid");
    const targetPageId = testId!.replace("search-result-", "");

    // Press Enter while first result is selected
    await page.getByTestId("search-input").press("Enter");

    await page.waitForURL(`/workspace/${targetPageId}`, { timeout: 8000 });
    expect(page.url()).toContain(targetPageId);
  });

  test("clicking a result navigates to that page", async ({ page }) => {
    await freshWorkspace(page);
    const firstPageId = await getPageIdFromUrl(page);

    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    await page.keyboard.press("Control+k");
    await page.waitForSelector("[data-testid='search-modal']");
    const result = page.getByTestId(`search-result-${firstPageId}`);
    await expect(result).toBeVisible();
    await result.click();

    await page.waitForURL(`/workspace/${firstPageId}`);
    expect(page.url()).toContain(firstPageId);
  });

  test("search query is cleared when modal is reopened", async ({ page }) => {
    await freshWorkspace(page);

    // Open, type something, close
    await page.keyboard.press("Control+k");
    await page.getByTestId("search-input").fill("some old query");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("search-modal")).not.toBeVisible();

    // Reopen — input must be empty
    await page.keyboard.press("Control+k");
    await page.waitForSelector("[data-testid='search-modal']");
    await expect(page.getByTestId("search-input")).toHaveValue("");
  });
});

// ─── 3. Page covers ──────────────────────────────────────────────────────────

test.describe("Page covers", () => {
  test("add cover button opens color picker", async ({ page }) => {
    await freshWorkspace(page);
    await page.locator("[data-testid='cover-picker-btn']").hover();
    await page.getByTestId("cover-picker-btn").click();
    await expect(page.getByTestId("cover-picker-panel")).toBeVisible();
  });

  test("selecting a color adds a cover to the page", async ({ page }) => {
    await freshWorkspace(page);
    await addCover(page, "amber");
    await expect(page.getByTestId("page-cover")).toBeVisible();
  });

  test("remove cover button removes the cover", async ({ page }) => {
    await freshWorkspace(page);
    await addCover(page, "rose");

    await page.getByTestId("page-cover").hover();
    await page.getByTestId("remove-cover-btn").click();
    await expect(page.getByTestId("page-cover")).not.toBeAttached();
  });

  test("cover persists after page reload", async ({ page }) => {
    await freshWorkspace(page);
    await addCover(page, "amber");

    await page.reload();
    await page.waitForSelector(".verso-editor", { timeout: 10000 });

    await expect(page.getByTestId("page-cover")).toBeVisible();
    // Verify it's the amber gradient (browser serializes hex → rgb)
    const style = await page.getByTestId("page-cover").getAttribute("style");
    expect(style).toContain("245, 158, 11"); // amber #f59e0b
  });

  test("cover is per-page — other pages have no cover", async ({ page }) => {
    await freshWorkspace(page);
    const pageId = await getPageIdFromUrl(page);
    await addCover(page, "violet");

    // Navigate to a new page
    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    // New page must not inherit the cover
    await expect(page.getByTestId("page-cover")).not.toBeAttached();

    // Navigate back — original page's cover must still be there
    const urlBefore2 = page.url();
    await page.getByTestId(`page-item-${pageId}`).click();
    await waitForNavigation(page, urlBefore2);

    await expect(page.getByTestId("page-cover")).toBeVisible();
    const style = await page.getByTestId("page-cover").getAttribute("style");
    expect(style).toContain("167, 139, 250"); // violet #a78bfa
  });

  test("switching cover color updates the gradient", async ({ page }) => {
    await freshWorkspace(page);
    await addCover(page, "amber");

    let style = await page.getByTestId("page-cover").getAttribute("style");
    expect(style).toContain("245, 158, 11"); // amber #f59e0b

    // Switch to sky
    await page.locator("[data-testid='cover-picker-btn']").hover();
    await page.getByTestId("cover-picker-btn").click();
    await page.getByTestId("cover-color-sky").click();

    style = await page.getByTestId("page-cover").getAttribute("style");
    expect(style).toContain("56, 189, 248"); // sky #38bdf8
    expect(style).not.toContain("245, 158, 11"); // amber gone
  });
});

// ─── 4. Font settings ────────────────────────────────────────────────────────

test.describe("Font settings", () => {
  test("font buttons are present in the DOM", async ({ page }) => {
    await freshWorkspace(page);
    await expect(page.getByTestId("font-default")).toBeAttached();
    await expect(page.getByTestId("font-serif")).toBeAttached();
    await expect(page.getByTestId("font-mono")).toBeAttached();
  });

  test("clicking Serif applies font-serif to title", async ({ page }) => {
    await freshWorkspace(page);
    await page.getByTestId("font-serif").click();
    await expect(page.locator(".page-title")).toHaveClass(/font-serif/);
  });

  test("clicking Mono applies font-mono to title", async ({ page }) => {
    await freshWorkspace(page);
    await page.getByTestId("font-mono").click();
    await expect(page.locator(".page-title")).toHaveClass(/font-mono/);
  });

  test("clicking Sans resets to default — removes both font classes", async ({ page }) => {
    await freshWorkspace(page);
    await page.getByTestId("font-serif").click();
    await page.getByTestId("font-default").click();
    await expect(page.locator(".page-title")).not.toHaveClass(/font-serif/);
    await expect(page.locator(".page-title")).not.toHaveClass(/font-mono/);
  });

  test("font class also applies to the editor content area", async ({ page }) => {
    await freshWorkspace(page);
    await page.getByTestId("font-mono").click();

    // The EditorContent wrapper receives the same fontClass as the title
    await expect(page.locator(".page-title")).toHaveClass(/font-mono/);
    // At least one div with font-mono should exist (EditorContent wrapper)
    await expect(page.locator("div.font-mono")).toBeVisible();
  });

  test("font setting persists after page reload", async ({ page }) => {
    await freshWorkspace(page);
    await page.getByTestId("font-serif").click();
    await expect(page.locator(".page-title")).toHaveClass(/font-serif/);

    await page.reload();
    await page.waitForSelector(".verso-editor", { timeout: 10000 });

    await expect(page.locator(".page-title")).toHaveClass(/font-serif/);
  });

  test("font settings are independent per page", async ({ page }) => {
    await freshWorkspace(page);
    const firstPageId = await getPageIdFromUrl(page);

    // Set serif on page 1
    await page.getByTestId("font-serif").click();
    await expect(page.locator(".page-title")).toHaveClass(/font-serif/);

    // Create page 2 — should have default font
    const urlBefore = page.url();
    await page.getByRole("button", { name: "New Page" }).click();
    await waitForNavigation(page, urlBefore);

    await expect(page.locator(".page-title")).not.toHaveClass(/font-serif/);
    await expect(page.locator(".page-title")).not.toHaveClass(/font-mono/);

    // Set mono on page 2
    await page.getByTestId("font-mono").click();

    // Navigate back to page 1 — must still be serif
    const urlBefore2 = page.url();
    await page.getByTestId(`page-item-${firstPageId}`).click();
    await waitForNavigation(page, urlBefore2);

    await expect(page.locator(".page-title")).toHaveClass(/font-serif/);
    await expect(page.locator(".page-title")).not.toHaveClass(/font-mono/);
  });
});
