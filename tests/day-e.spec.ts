import { test, expect } from './fixtures';

/**
 * Day E (Friday, Arms): the 5th gym day in the rotation.
 * Wires through the same selector / tab-switching / save-and-persist
 * pipeline as A-D.
 *
 * Reference Friday for date-driven specs: 2026-05-01.
 */

test.describe('Day E (Friday)', () => {
  test('weekly schedule renders 5 gym chips including Fri=E', async ({ freshPage }) => {
    await expect(freshPage.locator('.day-indicator.gym')).toHaveCount(5);

    const tabDays = await freshPage.locator('.day-indicator.gym').evaluateAll(
      (els) => els.map((el) => (el as HTMLElement).dataset.tabDay)
    );
    expect(tabDays.sort()).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  test('Fri chip is interactive and exposes data-tab-day="E"', async ({ freshPage }) => {
    const fri = freshPage.locator('.day-indicator.gym[data-tab-day="E"]');
    await expect(fri).toHaveCount(1);
    await expect(fri).toHaveAttribute('role', 'button');
    await expect(fri).toHaveAttribute('tabindex', '0');
  });

  test('clicking the Fri chip activates Day E', async ({ freshPage }) => {
    const fri = freshPage.locator('.day-indicator.gym[data-tab-day="E"]');
    await fri.click();

    await expect(freshPage.locator('body')).toHaveAttribute('data-active-day', 'E');
    await expect(freshPage.locator('.tab-content[data-day="E"]')).toHaveClass(/\bactive\b/);
    await expect(freshPage.locator('.day-indicator.gym.selected[data-tab-day="E"]')).toHaveCount(1);
  });

  test('navigating to a Friday date activates Day E', async ({ freshPage }) => {
    await freshPage.evaluate(() => {
      const di = document.getElementById('dateInput') as HTMLInputElement;
      di.value = '2026-05-01'; // Friday
      di.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await expect(freshPage.locator('body')).toHaveAttribute('data-active-day', 'E');
    await expect(freshPage.locator('.tab-content[data-day="E"]')).toHaveClass(/\bactive\b/);
  });

  test('Day E save button persists weights and round-trips', async ({ freshPage }) => {
    await freshPage.evaluate(() => {
      const di = document.getElementById('dateInput') as HTMLInputElement;
      di.value = '2026-05-01';
      di.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const input = freshPage.locator(
      '.tab-content[data-day="E"] input[data-exercise="EZ bar curl"]'
    );
    await input.fill('65');
    await freshPage.locator('.save-button[data-day="E"]').click();
    await freshPage.locator('.toast, #toast, [class*="toast"]').first()
      .waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});

    const persisted = await freshPage.evaluate(async () => {
      return await (window as any).getWeight('2026-05-01', 'EZ bar curl');
    });
    expect(persisted).toBe(65);
  });

  test('every Day E weight input gets a history toggle', async ({ freshPage }) => {
    await freshPage.evaluate(() => {
      (window as any).switchTab?.('E');
      document.body.setAttribute('data-active-day', 'E');
    });
    await freshPage.evaluate(() => (window as any).loadWeights('E', '2026-05-01'));

    const inputs = freshPage.locator('.tab-content[data-day="E"] input.weight-input');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const exercise = await input.getAttribute('data-exercise');
      const cell = input.locator('xpath=ancestor::td[1]');
      await expect(
        cell.locator('.history-toggle'),
        `${exercise} should have a history toggle`
      ).toHaveCount(1);
    }
  });
});
