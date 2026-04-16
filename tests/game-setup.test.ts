import { test, expect } from "@playwright/test";

const STARTING_PIECES: Record<number, Record<number, string>> = {
  1: {
    2: "S+2, S, P+1, P",
    3: "S+2, S, P, P",
    4: "S+2, S, P, P",
    5: "S+2, P",
    6: "S+2, P",
  },
  2: {
    2: "S+1, S, P+2, P",
    3: "S+1, S, P+1, P",
    4: "S+1, S, P+1, P",
    5: "S, P+2",
    6: "S, P+2",
  },
  3: { 3: "S, S, P+2, P", 4: "S+1, S, P+1, P", 5: "S+1, P+1", 6: "S+1, P+1" },
  4: { 4: "S, S, P+2, P", 5: "S, P+2", 6: "S, P+2" },
  5: { 5: "S+1, P+1", 6: "S+1, P+1" },
  6: { 6: "S+2, P" },
};

test.describe("Game Setup", () => {
  [2, 3, 4, 5, 6].forEach((playerCount) => {
    test(`create game with ${playerCount} players and verify starting pieces`, async ({
      page,
    }) => {
      // Reset the game state before testing
      await page.request.post("http://localhost:5173/api/state/reset");

      await page.goto("http://localhost:5173/");

      const playerNames = Array.from(
        { length: playerCount },
        (_, i) => `Player ${i + 1}`,
      );

      for (const name of playerNames) {
        await page.fill('input[placeholder="Your Name"]', name);
        await page.click('button:has-text("Join")');

        // Ensure we are logged in by waiting for the logout button
        await page.waitForSelector('button:has-text("Log Out")');

        // Log out to register next player
        if (name !== playerNames[playerNames.length - 1]) {
          await page.click('button:has-text("Log Out")');
        }
      }

      // Click Start Game
      await page.click('button:has-text("Start Game")');

      for (const name of playerNames) {
        const logOutVisible = await page
          .locator('button:has-text("Log Out")')
          .isVisible();
        if (logOutVisible) {
          await page.click('button:has-text("Log Out")');
        }

        await page.click(`button:has-text("${name}")`);

        await expect(page.locator('h2:has-text("Your Game")')).toBeVisible();

        const startPiecesStrong = page.locator("strong", {
          hasText: /^Starting Pieces \(/,
        });
        const boldElementText = await startPiecesStrong.textContent();

        const match = boldElementText?.match(/Starting Pieces \((\d+)\):/);
        expect(match).not.toBeNull();
        const order = parseInt(match![1], 10);

        const expectedPiecesRaw = STARTING_PIECES[order][playerCount];
        expect(expectedPiecesRaw).toBeDefined();

        const expectedPieces = expectedPiecesRaw
          .split(",")
          .map((p) => p.trim());

        const pieceDivs = startPiecesStrong.locator("~ div > div");
        await expect(pieceDivs).toHaveCount(expectedPieces.length);

        for (let i = 0; i < expectedPieces.length; i++) {
          await expect(pieceDivs.nth(i)).toHaveText(expectedPieces[i]);
        }
      }
    });
  });
});
