import { test, expect } from './fixtures';

/**
 * "Weeks since upgrade" chip: a small informational label rendered in each
 * weight input's cell showing how many weeks it's been since the exercise's
 * weight was last INCREASED. Saves a trip into the history modal to see how
 * long a load has been held.
 *
 * Rules (see `computeWeeksSinceUpgrade` in index.html):
 *   - Hidden when there's no history, only one entry, or the weight has
 *     never strictly increased (flat / decreasing only).
 *   - When the weight has increased, counts from the MOST RECENT increase,
 *     measured against the currently-viewed workout date.
 *   - Stays visible even when the input has a value (it's informational,
 *     unlike the "use last" chip).
 */

const EX = 'Overhead dumbbell press'; // Day A, non-barbell input

function cell(page: any) {
  return page
    .locator(`.tab-content[data-day="A"] input[data-exercise="${EX}"]`)
    .locator('xpath=ancestor::td[1]');
}

test.describe('Weeks-since-upgrade chip', () => {
  test.beforeEach(async ({ freshPage }) => {
    await freshPage.evaluate(() => {
      (window as any).switchTab?.('A');
      document.body.setAttribute('data-active-day', 'A');
    });
  });

  test('no chip when there is no history', async ({ freshPage }) => {
    await freshPage.evaluate((ex) => (window as any).loadWeights('A', '2026-04-30'), EX);
    await expect(cell(freshPage).locator('.upgrade-age-chip')).toHaveCount(0);
  });

  test('no chip with a single history entry (no upgrade yet)', async ({ freshPage }) => {
    await freshPage.evaluate(async (ex) => {
      await (window as any).saveWeight('2026-04-15', ex, 50);
    }, EX);
    await freshPage.evaluate(() => (window as any).loadWeights('A', '2026-04-30'));
    await expect(cell(freshPage).locator('.upgrade-age-chip')).toHaveCount(0);
  });

  test('no chip when weight only ever held flat or dropped', async ({ freshPage }) => {
    await freshPage.evaluate(async (ex) => {
      await (window as any).saveWeight('2026-04-01', ex, 50);
      await (window as any).saveWeight('2026-04-08', ex, 50);
      await (window as any).saveWeight('2026-04-15', ex, 45);
    }, EX);
    await freshPage.evaluate(() => (window as any).loadWeights('A', '2026-04-30'));
    await expect(cell(freshPage).locator('.upgrade-age-chip')).toHaveCount(0);
  });

  test('shows weeks since the increase', async ({ freshPage }) => {
    // Increased 50 -> 55 on 2026-04-16; viewing 2026-04-30 => 14 days => 2 wk.
    await freshPage.evaluate(async (ex) => {
      await (window as any).saveWeight('2026-04-02', ex, 50);
      await (window as any).saveWeight('2026-04-16', ex, 55);
    }, EX);
    await freshPage.evaluate(() => (window as any).loadWeights('A', '2026-04-30'));

    const chip = cell(freshPage).locator('.upgrade-age-chip');
    await expect(chip).toBeVisible();
    await expect(chip).toContainText('2');
  });

  test('counts from the MOST RECENT increase', async ({ freshPage }) => {
    // Two increases: 50->55 (04-01) then 55->60 (04-23). Viewing 04-30 => 7 days => 1 wk.
    await freshPage.evaluate(async (ex) => {
      await (window as any).saveWeight('2026-04-01', ex, 55);
      await (window as any).saveWeight('2026-04-10', ex, 55);
      await (window as any).saveWeight('2026-04-23', ex, 60);
    }, EX);
    await freshPage.evaluate(() => (window as any).loadWeights('A', '2026-04-30'));

    const chip = cell(freshPage).locator('.upgrade-age-chip');
    await expect(chip).toBeVisible();
    await expect(chip).toContainText('1');
  });

  test('stays visible when the input has a value', async ({ freshPage }) => {
    await freshPage.evaluate(async (ex) => {
      await (window as any).saveWeight('2026-04-02', ex, 50);
      await (window as any).saveWeight('2026-04-16', ex, 55);
      await (window as any).saveWeight('2026-04-30', ex, 55); // a value on the viewed date
    }, EX);
    await freshPage.evaluate(() => (window as any).loadWeights('A', '2026-04-30'));

    const input = freshPage.locator(`.tab-content[data-day="A"] input[data-exercise="${EX}"]`);
    await expect(input).toHaveValue('55');
    await expect(cell(freshPage).locator('.upgrade-age-chip')).toBeVisible();
  });
});
