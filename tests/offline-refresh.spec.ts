import { chromium, test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });
type GymWindow = Window & {
  saveWeight(date: string, exercise: string, weight: number): Promise<void>;
  getWeight(date: string, exercise: string): Promise<number | null>;
};


async function waitForApp(page: Page) {
  await page.waitForSelector('.day-indicator.gym.selected', { timeout: 5000 });
}

async function installApp(page: Page) {
  await page.goto('/index.html');
  await waitForApp(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;

    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
    });
  });
}

test.describe('Offline app shell and updates', () => {
  test('serves the cached app for a new navigation while offline', async ({ baseURL }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required');

    const browser = await chromium.launch();
    const context = await browser.newContext({ baseURL, serviceWorkers: 'allow' });
    const page = await context.newPage();

    try {
      await installApp(page);
      await page.evaluate(() => (window as GymWindow).saveWeight('2026-09-23', 'Bench press', 185));

      await context.setOffline(true);
      await page.goto('/index.html?refresh=offline-test');
      await waitForApp(page);

      await expect(page.locator('h1')).toBeVisible();
      const savedWeight = await page.evaluate(() =>
        (window as GymWindow).getWeight('2026-09-23', 'Bench press')
      );
      expect(savedWeight).toBe(185);
    } finally {
      await browser.close();
    }
  });

  test('reloads a cache-busted page and preserves workout data', async ({ page }) => {
    await installApp(page);
    await page.evaluate(() => (window as GymWindow).saveWeight('2026-09-23', 'Bench press', 195));

    await page.locator('#reloadLatestBtn').click();
    await page.waitForURL((url) => url.searchParams.has('refresh'));
    await waitForApp(page);

    const savedWeight = await page.evaluate(() =>
      (window as GymWindow).getWeight('2026-09-23', 'Bench press')
    );
    expect(savedWeight).toBe(195);
  });

  test('keeps the current page open when an update cannot be fetched', async ({ page, context }) => {
    await installApp(page);
    const currentUrl = page.url();

    await context.setOffline(true);
    await page.locator('#reloadLatestBtn').click();

    await expect(page.locator('.toast')).toContainText('Update unavailable');
    expect(page.url()).toBe(currentUrl);
    await expect(page.locator('.day-indicator.gym.selected')).toBeVisible();
  });
});
