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
  // Wait for the slash menu to be visible
  const menu = page.locator(".fixed.z-50.w-72");
  await menu.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(200);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
}

async function waitForSave(page: import("@playwright/test").Page) {
  await page.waitForSelector("text=Saved", { timeout: 5000 });
}

async function reload(page: import("@playwright/test").Page) {
  await waitForSave(page);
  await page.reload();
  await page.waitForSelector('[data-testid="page-title"]');
}

// ─── Image block ─────────────────────────────────────────────────────────────

test.describe("Image block", () => {
  test("slash /image inserts image block placeholder", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Image");
    await expect(page.locator('[data-testid="image-block-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="image-block-embed-btn"]')).toBeVisible();
  });

  test("typing URL and pressing Enter embeds the image", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Image");
    const input = page.locator('[data-testid="image-block-input"]');
    await input.fill("https://picsum.photos/800/400");
    await input.press("Enter");
    await expect(page.locator('[data-testid="image-block-img"]')).toBeVisible();
    await expect(page.locator('[data-testid="image-block-img"]')).toHaveAttribute(
      "src",
      "https://picsum.photos/800/400",
    );
  });

  test("clicking Embed button embeds the image", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Image");
    await page.locator('[data-testid="image-block-input"]').fill("https://picsum.photos/600/300");
    await page.locator('[data-testid="image-block-embed-btn"]').click();
    await expect(page.locator('[data-testid="image-block-img"]')).toBeVisible();
  });

  test("empty URL does nothing — input remains", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Image");
    // Press Enter without typing anything
    await page.locator('[data-testid="image-block-input"]').press("Enter");
    // Should still show the input (not yet embedded)
    await expect(page.locator('[data-testid="image-block-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="image-block-img"]')).not.toBeAttached();
  });

  test("Change button resets to input state", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Image");
    await page.locator('[data-testid="image-block-input"]').fill("https://picsum.photos/800/400");
    await page.locator('[data-testid="image-block-embed-btn"]').click();
    await expect(page.locator('[data-testid="image-block-img"]')).toBeVisible();

    // Hover to reveal Change button
    await page.locator('[data-testid="image-block-img"]').hover();
    await page.locator('[data-testid="image-block-change-btn"]').click({ force: true });
    await expect(page.locator('[data-testid="image-block-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="image-block-img"]')).not.toBeAttached();
  });

  test("invalid image URL shows error state", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Image");
    await page.locator('[data-testid="image-block-input"]').fill("https://this-does-not-exist-xyz.invalid/img.jpg");
    await page.locator('[data-testid="image-block-embed-btn"]').click();
    // Error appears after img onerror fires
    await expect(page.locator('[data-testid="image-block-error"]')).toBeVisible({ timeout: 5000 });
  });

  test("Change URL from error state resets to input", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Image");
    await page.locator('[data-testid="image-block-input"]').fill("https://broken.invalid/img.jpg");
    await page.locator('[data-testid="image-block-embed-btn"]').click();
    await expect(page.locator('[data-testid="image-block-error"]')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="image-block-error-change-btn"]').click();
    await expect(page.locator('[data-testid="image-block-input"]')).toBeVisible();
  });

  test("image block persists after reload", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Image");
    await page.locator('[data-testid="image-block-input"]').fill("https://picsum.photos/800/400");
    await page.locator('[data-testid="image-block-embed-btn"]').click();
    await expect(page.locator('[data-testid="image-block-img"]')).toBeVisible();
    await reload(page);
    await expect(page.locator('[data-testid="image-block-img"]')).toBeVisible();
    await expect(page.locator('[data-testid="image-block-img"]')).toHaveAttribute(
      "src",
      "https://picsum.photos/800/400",
    );
  });

  test("multiple image blocks on same page work independently", async ({ page }) => {
    await createPage(page);
    // First image block
    await insertBlock(page, "Image");
    await page.locator('[data-testid="image-block-input"]').first().fill("https://picsum.photos/400/200");
    await page.locator('[data-testid="image-block-embed-btn"]').first().click();
    await expect(page.locator('[data-testid="image-block-img"]').first()).toBeVisible();

    // Press Enter after the block to create a new paragraph, then insert second block
    await page.keyboard.press("Enter");
    await insertBlock(page, "Image");
    await page.locator('[data-testid="image-block-input"]').fill("https://picsum.photos/600/300");
    await page.locator('[data-testid="image-block-embed-btn"]').click();

    await expect(page.locator('[data-testid="image-block-img"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="image-block-img"]').nth(0)).toHaveAttribute(
      "src",
      "https://picsum.photos/400/200",
    );
    await expect(page.locator('[data-testid="image-block-img"]').nth(1)).toHaveAttribute(
      "src",
      "https://picsum.photos/600/300",
    );
  });
});

// ─── Video block ─────────────────────────────────────────────────────────────

test.describe("Video block", () => {
  test("slash /video inserts video block placeholder", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Video");
    await expect(page.locator('[data-testid="video-block-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="video-block-embed-btn"]')).toBeVisible();
  });

  test("YouTube watch URL embeds iframe", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Video");
    await page.locator('[data-testid="video-block-input"]').fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    await page.locator('[data-testid="video-block-embed-btn"]').click();
    const iframe = page.locator('[data-testid="video-block-iframe"]');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute("src", "https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  test("youtu.be short URL embeds correctly", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Video");
    await page.locator('[data-testid="video-block-input"]').fill("https://youtu.be/dQw4w9WgXcQ");
    await page.locator('[data-testid="video-block-embed-btn"]').click();
    await expect(page.locator('[data-testid="video-block-iframe"]')).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  test("Vimeo URL embeds correctly", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Video");
    await page.locator('[data-testid="video-block-input"]').fill("https://vimeo.com/123456789");
    await page.locator('[data-testid="video-block-embed-btn"]').click();
    await expect(page.locator('[data-testid="video-block-iframe"]')).toHaveAttribute(
      "src",
      "https://player.vimeo.com/video/123456789",
    );
  });

  test("invalid URL shows error message — no iframe rendered", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Video");
    await page.locator('[data-testid="video-block-input"]').fill("https://notsupported.com/video/123");
    await page.locator('[data-testid="video-block-embed-btn"]').click();
    await expect(page.locator('[data-testid="video-block-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="video-block-iframe"]')).not.toBeAttached();
  });

  test("Enter key also submits the video URL", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Video");
    const input = page.locator('[data-testid="video-block-input"]');
    await input.fill("https://youtu.be/dQw4w9WgXcQ");
    await input.press("Enter");
    await expect(page.locator('[data-testid="video-block-iframe"]')).toBeVisible();
  });

  test("video block persists after reload", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Video");
    await page.locator('[data-testid="video-block-input"]').fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    await page.locator('[data-testid="video-block-embed-btn"]').click();
    await expect(page.locator('[data-testid="video-block-iframe"]')).toBeVisible();
    await reload(page);
    await expect(page.locator('[data-testid="video-block-iframe"]')).toBeVisible();
    await expect(page.locator('[data-testid="video-block-iframe"]')).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  test("Change button resets video to input state", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Video");
    await page.locator('[data-testid="video-block-input"]').fill("https://youtu.be/dQw4w9WgXcQ");
    await page.locator('[data-testid="video-block-embed-btn"]').click();
    await expect(page.locator('[data-testid="video-block-iframe"]')).toBeVisible();

    await page.locator('[data-testid="video-block-iframe"]').hover();
    await page.locator('[data-testid="video-block-change-btn"]').click({ force: true });
    await expect(page.locator('[data-testid="video-block-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="video-block-iframe"]')).not.toBeAttached();
  });
});

// ─── File block ───────────────────────────────────────────────────────────────

test.describe("File block", () => {
  test("slash /file inserts file block placeholder", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "File");
    await expect(page.locator('[data-testid="file-block-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-block-embed-btn"]')).toBeVisible();
  });

  test("URL creates file card with extracted filename", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "File");
    await page.locator('[data-testid="file-block-input"]').fill("https://example.com/documents/report.pdf");
    await page.locator('[data-testid="file-block-embed-btn"]').click();
    await expect(page.locator('[data-testid="file-block-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-block-name"]')).toContainText("report.pdf");
  });

  test("Enter key submits file URL", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "File");
    const input = page.locator('[data-testid="file-block-input"]');
    await input.fill("https://example.com/data.csv");
    await input.press("Enter");
    await expect(page.locator('[data-testid="file-block-name"]')).toContainText("data.csv");
  });

  test("download link is present and points to correct URL", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "File");
    await page.locator('[data-testid="file-block-input"]').fill("https://example.com/files/doc.pdf");
    await page.locator('[data-testid="file-block-embed-btn"]').click();
    await expect(page.locator('[data-testid="file-block-download"]')).toHaveAttribute(
      "href",
      "https://example.com/files/doc.pdf",
    );
  });

  test("empty URL does nothing — input remains", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "File");
    await page.locator('[data-testid="file-block-input"]').press("Enter");
    await expect(page.locator('[data-testid="file-block-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-block-name"]')).not.toBeAttached();
  });

  test("Change button resets file to input state", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "File");
    await page.locator('[data-testid="file-block-input"]').fill("https://example.com/doc.pdf");
    await page.locator('[data-testid="file-block-embed-btn"]').click();
    await expect(page.locator('[data-testid="file-block-name"]')).toBeVisible();

    await page.locator('[data-testid="file-block-name"]').hover();
    await page.locator('[data-testid="file-block-change-btn"]').click({ force: true });
    await expect(page.locator('[data-testid="file-block-input"]')).toBeVisible();
  });

  test("file block persists after reload", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "File");
    await page.locator('[data-testid="file-block-input"]').fill("https://example.com/report.pdf");
    await page.locator('[data-testid="file-block-embed-btn"]').click();
    await expect(page.locator('[data-testid="file-block-name"]')).toContainText("report.pdf");
    await reload(page);
    await expect(page.locator('[data-testid="file-block-name"]')).toContainText("report.pdf");
    await expect(page.locator('[data-testid="file-block-download"]')).toHaveAttribute(
      "href",
      "https://example.com/report.pdf",
    );
  });
});

// ─── Bookmark block ────────────────────────────────────────────────────────────

test.describe("Bookmark block", () => {
  test("slash /bookmark inserts bookmark placeholder", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Bookmark");
    await expect(page.locator('[data-testid="bookmark-block-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="bookmark-block-save-btn"]')).toBeVisible();
  });

  test("URL creates a bookmark card", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Bookmark");
    await page.locator('[data-testid="bookmark-block-input"]').fill("https://github.com");
    await page.locator('[data-testid="bookmark-block-save-btn"]').click();
    await expect(page.locator('[data-testid="bookmark-block-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="bookmark-block-url"]')).toContainText("https://github.com");
  });

  test("Enter key submits bookmark URL", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Bookmark");
    const input = page.locator('[data-testid="bookmark-block-input"]');
    await input.fill("https://vercel.com");
    await input.press("Enter");
    await expect(page.locator('[data-testid="bookmark-block-card"]')).toBeVisible();
  });

  test("card href points to the saved URL", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Bookmark");
    await page.locator('[data-testid="bookmark-block-input"]').fill("https://nextjs.org");
    await page.locator('[data-testid="bookmark-block-save-btn"]').click();
    await expect(page.locator('[data-testid="bookmark-block-card"]')).toHaveAttribute(
      "href",
      "https://nextjs.org",
    );
  });

  test("empty URL does nothing — input remains", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Bookmark");
    await page.locator('[data-testid="bookmark-block-input"]').press("Enter");
    await expect(page.locator('[data-testid="bookmark-block-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="bookmark-block-card"]')).not.toBeAttached();
  });

  test("Change button resets bookmark to input state", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Bookmark");
    await page.locator('[data-testid="bookmark-block-input"]').fill("https://example.com");
    await page.locator('[data-testid="bookmark-block-save-btn"]').click();
    await expect(page.locator('[data-testid="bookmark-block-card"]')).toBeVisible();

    await page.locator('[data-testid="bookmark-block-card"]').hover();
    await page.locator('[data-testid="bookmark-block-change-btn"]').click({ force: true });
    await expect(page.locator('[data-testid="bookmark-block-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="bookmark-block-card"]')).not.toBeAttached();
  });

  test("bookmark persists after reload", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Bookmark");
    await page.locator('[data-testid="bookmark-block-input"]').fill("https://playwright.dev");
    await page.locator('[data-testid="bookmark-block-save-btn"]').click();
    await reload(page);
    await expect(page.locator('[data-testid="bookmark-block-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="bookmark-block-url"]')).toContainText("https://playwright.dev");
  });

  test("multiple bookmarks are independent", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Bookmark");
    await page.locator('[data-testid="bookmark-block-input"]').fill("https://react.dev");
    await page.locator('[data-testid="bookmark-block-save-btn"]').click();

    await page.keyboard.press("Enter");
    await insertBlock(page, "Bookmark");
    await page.locator('[data-testid="bookmark-block-input"]').fill("https://tiptap.dev");
    await page.locator('[data-testid="bookmark-block-save-btn"]').click();

    await expect(page.locator('[data-testid="bookmark-block-card"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="bookmark-block-url"]').nth(0)).toContainText("react.dev");
    await expect(page.locator('[data-testid="bookmark-block-url"]').nth(1)).toContainText("tiptap.dev");
  });
});

// ─── Table block ─────────────────────────────────────────────────────────────

test.describe("Table block", () => {
  test("slash /table inserts a 3x3 table with header row", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Table");
    await expect(page.locator(".verso-editor table")).toBeVisible();
    // 1 header row + 2 data rows = 3 rows total
    await expect(page.locator(".verso-editor table tr")).toHaveCount(3);
    // 3 columns
    await expect(page.locator(".verso-editor table tr").first().locator("th")).toHaveCount(3);
  });

  test("can type content in table cells", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Table");
    const firstCell = page.locator(".verso-editor table th").first();
    await firstCell.click();
    await page.keyboard.type("Column 1");
    await expect(firstCell).toContainText("Column 1");
  });

  test("Tab moves cursor to next cell", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Table");
    const cells = page.locator(".verso-editor table th");
    await cells.first().click();
    await page.keyboard.type("A");
    await page.keyboard.press("Tab");
    await page.keyboard.type("B");
    await expect(cells.nth(0)).toContainText("A");
    await expect(cells.nth(1)).toContainText("B");
  });

  test("Shift+Tab moves cursor to previous cell", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Table");
    const cells = page.locator(".verso-editor table th");
    await cells.nth(1).click();
    await page.keyboard.type("X");
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.type("Y");
    await expect(cells.nth(0)).toContainText("Y");
    await expect(cells.nth(1)).toContainText("X");
  });

  test("table menu appears when cursor is inside table", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Table");
    await page.locator(".verso-editor table th").first().click();
    await expect(page.locator('[data-testid="table-menu"]')).toBeVisible();
  });

  test("table menu disappears when cursor leaves table", async ({ page }) => {
    await createPage(page);

    // Type a paragraph above the table so ArrowUp can escape it
    const editor = page.locator(".verso-editor");
    await editor.click();
    await page.keyboard.type("Text before table");
    await page.keyboard.press("Enter");

    await insertBlock(page, "Table");
    await page.locator(".verso-editor table th").first().click();
    await expect(page.locator('[data-testid="table-menu"]')).toBeVisible();

    // Move cursor above the table via keyboard — avoids the overlay interception
    // issue where the floating menu covers the paragraph's click coordinates.
    await page.keyboard.press("ArrowUp");
    await expect(page.locator('[data-testid="table-menu"]')).not.toBeVisible();
  });

  test("add column after inserts a new column", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Table");
    await page.locator(".verso-editor table th").first().click();
    await expect(page.locator('[data-testid="table-menu"]')).toBeVisible();
    await page.locator('[data-testid="table-add-col-after"]').click();
    // Should now have 4 columns
    await expect(page.locator(".verso-editor table tr").first().locator("th")).toHaveCount(4);
  });

  test("add column before inserts a new column", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Table");
    await page.locator(".verso-editor table th").first().click();
    await page.locator('[data-testid="table-add-col-before"]').click();
    await expect(page.locator(".verso-editor table tr").first().locator("th")).toHaveCount(4);
  });

  test("add row after inserts a new row", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Table");
    // 3 rows initially
    await page.locator(".verso-editor table td").first().click();
    await page.locator('[data-testid="table-add-row-after"]').click();
    // Should now have 4 rows
    await expect(page.locator(".verso-editor table tr")).toHaveCount(4);
  });

  test("add row before inserts a new row", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Table");
    await page.locator(".verso-editor table td").first().click();
    await page.locator('[data-testid="table-add-row-before"]').click();
    await expect(page.locator(".verso-editor table tr")).toHaveCount(4);
  });

  test("delete column removes a column", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Table");
    await page.locator(".verso-editor table th").first().click();
    await page.locator('[data-testid="table-delete-col"]').click();
    await expect(page.locator(".verso-editor table tr").first().locator("th")).toHaveCount(2);
  });

  test("delete row removes a row", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Table");
    await page.locator(".verso-editor table td").first().click();
    await page.locator('[data-testid="table-delete-row"]').click();
    await expect(page.locator(".verso-editor table tr")).toHaveCount(2);
  });

  test("delete table removes entire table", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Table");
    await page.locator(".verso-editor table th").first().click();
    await page.locator('[data-testid="table-delete"]').click();
    await expect(page.locator(".verso-editor table")).not.toBeAttached();
  });

  test("table content persists after reload", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Table");
    const firstCell = page.locator(".verso-editor table th").first();
    await firstCell.click();
    await page.keyboard.type("Header 1");
    await reload(page);
    await expect(page.locator(".verso-editor table")).toBeVisible();
    await expect(page.locator(".verso-editor table th").first()).toContainText("Header 1");
  });

  test("table structure (rows/cols count) persists after reload", async ({ page }) => {
    await createPage(page);
    await insertBlock(page, "Table");
    // Add a column
    await page.locator(".verso-editor table th").first().click();
    await page.locator('[data-testid="table-add-col-after"]').click();
    await expect(page.locator(".verso-editor table tr").first().locator("th")).toHaveCount(4);
    await reload(page);
    await expect(page.locator(".verso-editor table tr").first().locator("th")).toHaveCount(4);
  });
});
