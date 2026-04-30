import { test as base, expect, Page } from '@playwright/test';

/**
 * The app stores workouts in IndexedDB ('GymTrackerDB'). Each Playwright test
 * gets a fresh BrowserContext with empty storage, so we don't need to clear
 * IndexedDB explicitly. We just need to wait until init() has rendered the
 * weekly schedule — that's the single signal that DB open + first paint
 * are done.
 *
 * Note: the page's `let db` is a script-scoped binding (non-module script),
 * so it does NOT end up on `window`. Function declarations (`saveWeight`,
 * `loadWeights`, `switchTab`, etc.) DO leak onto window and are callable
 * from page.evaluate.
 */
async function freshLoad(page: Page) {
  await page.goto('/index.html');
  await page.waitForSelector('.day-indicator.gym.selected', { timeout: 5000 });
}

type Fixtures = {
  freshPage: Page;
};

export const test = base.extend<Fixtures>({
  freshPage: async ({ page }, use) => {
    await freshLoad(page);
    await use(page);
  },
});

export { expect };

/** Set a weight input and trigger save for a given day. */
export async function saveWeight(page: Page, day: 'A' | 'B' | 'C' | 'D', exercise: string, weight: string) {
  const input = page.locator(`.tab-content[data-day="${day}"] input[data-exercise="${exercise}"]`);
  await input.fill(weight);
  await page.locator(`.save-button[data-day="${day}"]`).click();
  // Toast appears once save resolves; wait for it as a save-finished signal.
  await page.locator('.toast, #toast, [class*="toast"]').first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  // Settle: brief wait for any celebration DOM to mount.
  await page.waitForTimeout(150);
}

/** Returns the count of celebration elements currently in the DOM. */
export async function countCelebrationElements(page: Page): Promise<number> {
  return page.evaluate(() => {
    return document.querySelectorAll('.shockwave, .aurora-flash, .plate-host').length;
  });
}
