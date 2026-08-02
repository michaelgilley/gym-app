import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * Theme toggle: three states — system (default), light, dark.
 *
 * The switch works by flipping the `media` attribute on the light-theme
 * <style> element, so the no-JS path still follows the OS. Assertions here
 * look at rendered pixels (body's computed background) rather than class
 * names, and use a luminance threshold so they survive the per-day
 * palettes (each day tints --bg-0 differently in both themes).
 */

const THEME_BTN = '#themeToggle';

async function load(page: Page) {
  await page.goto('/index.html');
  await page.waitForSelector('.day-indicator.gym.selected', { timeout: 5000 });
}

/** Perceived luminance (0–255) of body's background. */
async function bodyLuma(page: Page): Promise<number> {
  return page.evaluate(() => {
    const parts = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g);
    if (!parts) return -1;
    const [r, g, b] = parts.slice(0, 3).map(Number);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  });
}

/**
 * body carries `transition: background-color 0.7s`, so a toggle lands over
 * time rather than instantly — poll instead of sampling once.
 */
async function expectRendered(page: Page, theme: 'light' | 'dark') {
  await expect
    .poll(async () => ((await bodyLuma(page)) > 128 ? 'light' : 'dark'), {
      message: `body background never settled on ${theme}`,
      timeout: 3000,
    })
    .toBe(theme);
}

const mode = (page: Page) =>
  page.evaluate(() => document.documentElement.dataset.theme ?? null);

test.describe('Theme toggle', () => {
  test('with no stored preference, follows a dark system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await load(page);
    expect(await mode(page)).toBe('system');
    await expectRendered(page, 'dark');
  });

  test('with no stored preference, follows a light system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await load(page);
    expect(await mode(page)).toBe('system');
    await expectRendered(page, 'light');
  });

  test('cycles system → light → dark → system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await load(page);

    await page.click(THEME_BTN);
    expect(await mode(page)).toBe('light');
    await expectRendered(page, 'light');

    await page.click(THEME_BTN);
    expect(await mode(page)).toBe('dark');
    await expectRendered(page, 'dark');

    await page.click(THEME_BTN);
    expect(await mode(page)).toBe('system');
    await expectRendered(page, 'dark'); // system is dark here
  });

  test('explicit dark overrides a light system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await load(page);
    await expectRendered(page, 'light');

    await page.click(THEME_BTN); // light
    await page.click(THEME_BTN); // dark
    expect(await mode(page)).toBe('dark');
    await expectRendered(page, 'dark');
  });

  test('explicit choice survives a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await load(page);
    await page.click(THEME_BTN); // light

    await page.reload();
    await page.waitForSelector('.day-indicator.gym.selected');
    expect(await mode(page)).toBe('light');
    await expectRendered(page, 'light');
  });

  test('cycling back to system resumes deferring to the OS', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await load(page);
    await page.click(THEME_BTN); // light
    await page.click(THEME_BTN); // dark
    await page.click(THEME_BTN); // system

    // Same stored state, now loaded under a light OS.
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    await page.waitForSelector('.day-indicator.gym.selected');
    expect(await mode(page)).toBe('system');
    await expectRendered(page, 'light');
  });

  test('the button reports the current theme to assistive tech', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await load(page);
    const btn = page.locator(THEME_BTN);

    const atSystem = await btn.getAttribute('aria-label');
    await page.click(THEME_BTN);
    const atLight = await btn.getAttribute('aria-label');

    expect(atSystem).toBeTruthy();
    expect(atLight).toBeTruthy();
    expect(atLight).not.toBe(atSystem);
  });

  test.describe('without JavaScript', () => {
    for (const scheme of ['light', 'dark'] as const) {
      test(`a ${scheme} system still renders ${scheme}`, async ({ browser, baseURL }) => {
        const context = await browser.newContext({
          javaScriptEnabled: false,
          colorScheme: scheme,
        });
        const page = await context.newPage();
        await page.goto(`${baseURL}/index.html`);
        await expectRendered(page, scheme);
        await context.close();
      });
    }
  });
});
