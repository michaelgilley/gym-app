import { test, expect } from './fixtures';

/**
 * "Use last" chip: a tap target rendered next to each weight input that
 * has prior history. Clicking it fills the input with the most recent
 * recorded weight so the user doesn't have to retype it.
 *
 * Rules:
 *   - Hidden when no history exists for the exercise.
 *   - Visible (and shows the last value) when history exists and the
 *     input is empty.
 *   - Clicking it populates the input with the last weight; saving the
 *     day persists that value (visible after a reload).
 *   - Hides once the input has any value; re-appears if the input is
 *     cleared again.
 */

test.describe('Last-weight chip', () => {
  test.beforeEach(async ({ freshPage }) => {
    await freshPage.evaluate(() => {
      (window as any).switchTab?.('A');
      document.body.setAttribute('data-active-day', 'A');
    });
  });

  test('chip is hidden when no history exists', async ({ freshPage }) => {
    await freshPage.evaluate(() => (window as any).loadWeights('A', '2026-04-30'));

    const cell = freshPage.locator(
      '.tab-content[data-day="A"] input[data-exercise="Overhead dumbbell press"]'
    ).locator('xpath=ancestor::td[1]');

    await expect(cell.locator('.last-weight-chip')).toHaveCount(0);
  });

  test('chip appears with the last weight when history exists', async ({ freshPage }) => {
    await freshPage.evaluate(async () => {
      const sw = (window as any).saveWeight;
      await sw('2026-04-15', 'Overhead dumbbell press', 50);
    });
    await freshPage.evaluate(() => (window as any).loadWeights('A', '2026-04-30'));

    const cell = freshPage.locator(
      '.tab-content[data-day="A"] input[data-exercise="Overhead dumbbell press"]'
    ).locator('xpath=ancestor::td[1]');

    const chip = cell.locator('.last-weight-chip');
    await expect(chip).toBeVisible();
    await expect(chip).toContainText('50');
  });

  test('clicking the chip fills the input with the last weight', async ({ freshPage }) => {
    await freshPage.evaluate(async () => {
      const sw = (window as any).saveWeight;
      await sw('2026-04-15', 'Overhead dumbbell press', 50);
    });
    await freshPage.evaluate(() => (window as any).loadWeights('A', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="A"] input[data-exercise="Overhead dumbbell press"]'
    );
    const cell = input.locator('xpath=ancestor::td[1]');

    await expect(input).toHaveValue('');
    await cell.locator('.last-weight-chip').click();
    await expect(input).toHaveValue('50');
  });

  test('chip hides after click and re-appears when the input is cleared', async ({ freshPage }) => {
    await freshPage.evaluate(async () => {
      const sw = (window as any).saveWeight;
      await sw('2026-04-15', 'Overhead dumbbell press', 50);
    });
    await freshPage.evaluate(() => (window as any).loadWeights('A', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="A"] input[data-exercise="Overhead dumbbell press"]'
    );
    const cell = input.locator('xpath=ancestor::td[1]');
    const chip = cell.locator('.last-weight-chip');

    await expect(chip).toBeVisible();
    await chip.click();
    await expect(chip).toBeHidden();

    await input.fill('');
    await expect(chip).toBeVisible();
  });

  test('saving after clicking the chip persists the last weight', async ({ freshPage }) => {
    await freshPage.evaluate(async () => {
      const sw = (window as any).saveWeight;
      await sw('2026-04-15', 'Overhead dumbbell press', 50);
    });
    await freshPage.evaluate(async () => {
      const di = document.getElementById('dateInput') as HTMLInputElement;
      di.value = '2026-04-30';
      await (window as any).loadWeights('A', '2026-04-30');
    });

    const input = freshPage.locator(
      '.tab-content[data-day="A"] input[data-exercise="Overhead dumbbell press"]'
    );
    const cell = input.locator('xpath=ancestor::td[1]');

    await cell.locator('.last-weight-chip').click();
    await expect(input).toHaveValue('50');

    await freshPage.locator('.save-button[data-day="A"]').click();
    await freshPage.locator('.toast, #toast, [class*="toast"]').first()
      .waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});

    // Reload from storage — the saved value should round-trip.
    const persisted = await freshPage.evaluate(async () => {
      return await (window as any).getWeight('2026-04-30', 'Overhead dumbbell press');
    });
    expect(persisted).toBe(50);
  });

  test('chip works on barbell rows too', async ({ freshPage }) => {
    await freshPage.evaluate(async () => {
      const sw = (window as any).saveWeight;
      await sw('2026-04-15', 'Barbell bench press', 185);
    });
    await freshPage.evaluate(() => (window as any).loadWeights('A', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="A"] input[data-exercise="Barbell bench press"]'
    );
    const cell = input.locator('xpath=ancestor::td[1]');

    const chip = cell.locator('.last-weight-chip');
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(input).toHaveValue('185');
  });
});
