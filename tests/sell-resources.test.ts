import { test, expect } from "@playwright/test";

test.describe("Sell Resources", () => {
  test("calculates values, handles cities, and updates on market change", async ({
    page,
  }) => {
    // 1. Reset game state
    await page.request.post("http://localhost:5173/api/state/reset");
    await page.goto("http://localhost:5173/");

    // 2. Join game
    await page.fill('input[placeholder="Your Name"]', "Seller Player");
    await page.click('button:has-text("Join")');
    await page.waitForSelector('button:has-text("Log Out")');

    // 3. Start game
    await page.click('button:has-text("Start Game")');

    // 4. Go to Operating phase
    await page.click('button:has-text("I\'m Done Prospecting")');

    // Wait for "I'm Done Operating" button to confirm we are in Operating phase
    await expect(
      page.locator("button", { hasText: "I'm Done Operating" }),
    ).toBeVisible();

    // 5. Uncheck the default Denver market that was assigned at game start
    await page
      .locator("label", { hasText: "Denver" })
      .locator("input")
      .uncheck();

    // 6. Open Modal to test No Cities displays correctly
    await page.click('button:has-text("Calculate")');
    await expect(
      page.locator("h3", { hasText: "Sell Resources" }),
    ).toBeVisible();

    // 7. Check No Cities displays correctly
    await expect(
      page.locator("p", {
        hasText: "Select your markets on the dashboard to see lumber and coal",
      }),
    ).toBeVisible();
    await expect(
      page.locator('.sell-row:has(strong:has-text("Lumber"))'),
    ).toHaveCount(0);
    await expect(
      page.locator('.sell-row:has(strong:has-text("Coal"))'),
    ).toHaveCount(0);

    // Enter values for Gold, Silver, Copper
    const getRowInput = (resource: string) =>
      page
        .locator(".sell-row", {
          has: page.locator("strong", { hasText: resource }),
        })
        .locator("input");

    await getRowInput("Gold").fill("1");
    // Note: Playwright .fill on number inputs requires a string.
    await getRowInput("Silver").fill("1");
    await getRowInput("Copper").fill("1");

    // Gold init index 4 = 250
    // Silver init index 5 = 200
    // Copper init index 4 = 200
    // Total value = 650
    await expect(page.locator(".sell-summary")).toContainText("$650");

    await page.click('button:has-text("Cancel")');

    // 8. Check One City
    // Select Denver
    await page.locator("label", { hasText: "Denver" }).locator("input").check();

    await page.click('button:has-text("Calculate")');
    await expect(
      page.locator("h3", { hasText: "Sell Resources" }),
    ).toBeVisible();

    // The hint should be hidden
    await expect(
      page.locator("p", {
        hasText: "Select your markets on the dashboard to see lumber and coal",
      }),
    ).toHaveCount(0);

    // Lumber (Denver) and Coal (Denver) should be present
    const getCityRow = (resource: string, city: string) =>
      page
        .locator(".sell-row", {
          has: page.locator("strong", { hasText: resource }),
        })
        .filter({ has: page.locator(".sell-row-city", { hasText: city }) });

    await expect(getCityRow("Lumber", "Denver")).toBeVisible();
    await expect(getCityRow("Coal", "Denver")).toBeVisible();

    await getCityRow("Lumber", "Denver").locator("input").fill("1");
    // Denver Lumber start idx 4 = 100
    // Previous inputs (Gold, Silver, Copper) persist on the component state
    // Total = 650 + 120 (Denver Lumber index 5) = 770
    await expect(page.locator(".sell-summary")).toContainText("$770");

    await page.click('button:has-text("Cancel")');

    // 9. Check Multiple Cities
    // Select Pueblo
    await page.locator("label", { hasText: "Pueblo" }).locator("input").check();

    await page.click('button:has-text("Calculate")');
    await expect(getCityRow("Lumber", "Denver")).toBeVisible();
    await expect(getCityRow("Lumber", "Pueblo")).toBeVisible();
    await expect(getCityRow("Coal", "Denver")).toBeVisible();
    await expect(getCityRow("Coal", "Pueblo")).toBeVisible();

    await page.click('button:has-text("Cancel")');

    // 10. When Market Prices Change
    await page.goto("http://localhost:5173/market");

    // In market, change gold diff to +2.
    // Gold is the first diff input.
    const goldDiffInput = page.locator(".block-metal .diff-row input").nth(0);
    await goldDiffInput.fill("2");

    // Save results
    const savePromise = page.waitForResponse(
      (r) => r.url().includes("/api/market") && r.request().method() === "POST",
    );
    await page.click('button:has-text("Save Results")');
    await savePromise;

    // 11. Go back to Dashboard
    await page.goto("http://localhost:5173/");

    // State should reload on operating phase
    await expect(
      page.locator("button", { hasText: "I'm Done Operating" }),
    ).toBeVisible();

    // Finish operating to enter reset phase
    await page.click('button:has-text("I\'m Done Operating")');

    // Proceed to next turn
    await page.click('button:has-text("Next Turn")');
    await page.click('button:has-text("Confirm")');

    // Back in prospecting for turn 2, complete to go to operating
    await expect(
      page.locator("button", { hasText: "I'm Done Prospecting" }),
    ).toBeVisible();
    await page.click('button:has-text("I\'m Done Prospecting")');
    await expect(
      page.locator("button", { hasText: "I'm Done Operating" }),
    ).toBeVisible();

    // 12. Reopen modal
    await page.click('button:has-text("Calculate")');
    await expect(
      page.locator("h3", { hasText: "Sell Resources" }),
    ).toBeVisible();

    // Refill inputs (mounting cleared the state)
    await getRowInput("Gold").fill("1");
    // Gold was 250 (index 5). Diff +2 means index goes from 5 to 7.
    // Price = GOLD_PRICES[7] = 300.
    await expect(page.locator(".sell-summary")).toContainText("$300");

    await getRowInput("Silver").fill("1");
    await getRowInput("Copper").fill("1");
    // Silver = 200, Copper = 200. Total = 300 + 200 + 200 = 700.

    await expect(page.locator(".sell-summary")).toContainText("$700");
  });
});
