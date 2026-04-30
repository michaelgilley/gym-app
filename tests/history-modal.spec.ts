import { test, expect, saveWeight } from './fixtures';

/**
 * History modal must:
 *   1. Open when the inline `history` toggle on an input cell is clicked.
 *   2. Render entries in descending date order, newest first.
 *   3. Lay out cleanly at mobile widths (visual snapshot of the open modal).
 */

test.describe('History modal', () => {
  test.beforeEach(async ({ freshPage }) => {
    await freshPage.evaluate(() => {
      (window as any).switchTab?.('A');
      document.body.setAttribute('data-active-day', 'A');
    });
  });

  test('opens via toggle and shows newest entry first', async ({ freshPage }) => {
    // Seed three entries on different dates (writing directly via saveWeight()
    // so we don't need to manipulate the date picker for each save).
    await freshPage.evaluate(async () => {
      const sw = (window as any).saveWeight;
      await sw('2026-04-01', 'Barbell bench press', 135);
      await sw('2026-04-15', 'Barbell bench press', 145);
      await sw('2026-04-29', 'Barbell bench press', 150);
    });

    // Reload weights so the toggle button is wired up for this exercise.
    await freshPage.evaluate(() => (window as any).loadWeights('A', '2026-04-30'));

    const benchCell = freshPage.locator(
      '.tab-content[data-day="A"] input[data-exercise="Barbell bench press"]'
    ).locator('xpath=..');
    await benchCell.locator('.history-toggle').click();

    const modal = freshPage.locator('.history-modal');
    await expect(modal).toHaveClass(/open/);

    const entries = modal.locator('.history-entry');
    await expect(entries).toHaveCount(3);

    // Newest first: weights should appear in 150 / 145 / 135 order.
    const weights = await entries.locator('.history-weight').allInnerTexts();
    expect(weights[0]).toContain('150');
    expect(weights[1]).toContain('145');
    expect(weights[2]).toContain('135');
  });

  test('renders cleanly at mobile width — visual snapshot', async ({ freshPage }, testInfo) => {
    await freshPage.evaluate(async () => {
      const sw = (window as any).saveWeight;
      await sw('2026-03-01', 'Barbell bench press', 115);
      await sw('2026-03-15', 'Barbell bench press', 125);
      await sw('2026-04-01', 'Barbell bench press', 135);
      await sw('2026-04-15', 'Barbell bench press', 145);
      await sw('2026-04-29', 'Barbell bench press', 150);
    });
    await freshPage.evaluate(() => (window as any).loadWeights('A', '2026-04-30'));

    const benchCell = freshPage.locator(
      '.tab-content[data-day="A"] input[data-exercise="Barbell bench press"]'
    ).locator('xpath=..');
    await benchCell.locator('.history-toggle').click();

    const card = freshPage.locator('.history-modal__card');
    await expect(card).toBeVisible();
    // Wait for pop animation to finish so the snapshot is stable.
    await freshPage.waitForTimeout(400);

    await expect(card).toHaveScreenshot('history-modal-mobile.png');
  });
});
