import { test, expect } from './fixtures';

/**
 * loadWeights() should attach a history toggle (and a "use last" chip,
 * when history exists) to EVERY weight input in the day's tab content.
 *
 * Regression: the original implementation iterated a hardcoded exercises
 * map that drifted from the HTML — Leg extension existed as an input but
 * was missing from the map, so it never got a history toggle.
 */

test.describe('loadWeights coverage', () => {
  test('every weight input on Day B gets a history toggle', async ({ freshPage }) => {
    await freshPage.evaluate(() => {
      (window as any).switchTab?.('B');
      document.body.setAttribute('data-active-day', 'B');
    });
    await freshPage.evaluate(() => (window as any).loadWeights('B', '2026-04-30'));

    const inputs = freshPage.locator('.tab-content[data-day="B"] input.weight-input');
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

  test('Leg extension gets a chip when it has history', async ({ freshPage }) => {
    await freshPage.evaluate(async () => {
      const sw = (window as any).saveWeight;
      await sw('2026-04-15', 'Leg extension', 40);
    });
    await freshPage.evaluate(() => {
      (window as any).switchTab?.('B');
      document.body.setAttribute('data-active-day', 'B');
    });
    await freshPage.evaluate(() => (window as any).loadWeights('B', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="B"] input[data-exercise="Leg extension"]'
    );
    const cell = input.locator('xpath=ancestor::td[1]');

    await expect(cell.locator('.history-toggle')).toHaveCount(1);
    const chip = cell.locator('.last-weight-chip');
    await expect(chip).toBeVisible();
    await expect(chip).toContainText('40');

    await chip.click();
    await expect(input).toHaveValue('40');
  });
});
