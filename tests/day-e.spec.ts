import { test, expect } from './fixtures';

/**
 * Day E (Wednesday — Arms): added as the 5th gym day in the rotation.
 * Wires through the same selector / tab-switching / save-and-persist
 * pipeline as A-D.
 *
 * Reference Wednesday for date-driven specs: 2026-04-29.
 */

test.describe('Day E (Wednesday)', () => {
  test('weekly schedule renders 5 gym chips including Wed=E', async ({ freshPage }) => {
    await expect(freshPage.locator('.day-indicator.gym')).toHaveCount(5);

    const tabDays = await freshPage.locator('.day-indicator.gym').evaluateAll(
      (els) => els.map((el) => (el as HTMLElement).dataset.tabDay)
    );
    expect(tabDays.sort()).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  test('Wed chip is interactive and exposes data-tab-day="E"', async ({ freshPage }) => {
    const wed = freshPage.locator('.day-indicator.gym[data-tab-day="E"]');
    await expect(wed).toHaveCount(1);
    await expect(wed).toHaveAttribute('role', 'button');
    await expect(wed).toHaveAttribute('tabindex', '0');
  });

  test('clicking the Wed chip activates Day E', async ({ freshPage }) => {
    const wed = freshPage.locator('.day-indicator.gym[data-tab-day="E"]');
    await wed.click();

    await expect(freshPage.locator('body')).toHaveAttribute('data-active-day', 'E');
    await expect(freshPage.locator('.tab-content[data-day="E"]')).toHaveClass(/\bactive\b/);
    await expect(freshPage.locator('.day-indicator.gym.selected[data-tab-day="E"]')).toHaveCount(1);
  });

  test('navigating to a Wednesday date activates Day E', async ({ freshPage }) => {
    await freshPage.evaluate(() => {
      const di = document.getElementById('dateInput') as HTMLInputElement;
      di.value = '2026-04-29'; // Wednesday
      di.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await expect(freshPage.locator('body')).toHaveAttribute('data-active-day', 'E');
    await expect(freshPage.locator('.tab-content[data-day="E"]')).toHaveClass(/\bactive\b/);
  });

  test('Day E save button persists weights and round-trips', async ({ freshPage }) => {
    await freshPage.evaluate(() => {
      const di = document.getElementById('dateInput') as HTMLInputElement;
      di.value = '2026-04-29';
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
      return await (window as any).getWeight('2026-04-29', 'EZ bar curl');
    });
    expect(persisted).toBe(65);
  });

  test('every Day E weight input gets a history toggle', async ({ freshPage }) => {
    await freshPage.evaluate(() => {
      (window as any).switchTab?.('E');
      document.body.setAttribute('data-active-day', 'E');
    });
    await freshPage.evaluate(() => (window as any).loadWeights('E', '2026-04-29'));

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
