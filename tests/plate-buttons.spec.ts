import { test, expect } from './fixtures';

/**
 * +plate buttons must add to the placeholder (last session's weight) when
 * the input is empty, not silently fall back to the bar. Mirrors the
 * existing remove-pill behavior, which already uses the placeholder fallback.
 */

test.describe('Plate +buttons placeholder fallback', () => {
  test.beforeEach(async ({ freshPage }) => {
    await freshPage.evaluate(() => {
      (window as any).switchTab?.('D');
      document.body.setAttribute('data-active-day', 'D');
    });
  });

  test('clicking +25 with only a placeholder adds to the placeholder, not the bar', async ({ freshPage }) => {
    // Seed RDL history so the date with no entry shows a placeholder.
    await freshPage.evaluate(async () => {
      const sw = (window as any).saveWeight;
      await sw('2026-04-15', 'Romanian deadlift', 185);
    });

    // Reload weights for a date that has no entry — placeholder should be "185 lbs".
    await freshPage.evaluate(() => (window as any).loadWeights('D', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="D"] input[data-exercise="Romanian deadlift"]'
    );
    await expect(input).toHaveValue('');
    await expect(input).toHaveAttribute('placeholder', '185 lbs');

    // Find the +25 button in this exercise's plate panel (the panel row sits
    // immediately after the input's row).
    const panel = input.locator('xpath=ancestor::tr[1]/following-sibling::tr[1]');
    await panel.locator('.plate-btn', { hasText: '+25' }).click();

    // 185 + (25 * 2) = 235
    await expect(input).toHaveValue('235');
  });

  test('clicking +25 with no value and no history starts from the bar', async ({ freshPage }) => {
    // No history — placeholder stays "lbs".
    await freshPage.evaluate(() => (window as any).loadWeights('D', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="D"] input[data-exercise="Romanian deadlift"]'
    );
    await expect(input).toHaveValue('');
    await expect(input).toHaveAttribute('placeholder', 'lbs');

    const panel = input.locator('xpath=ancestor::tr[1]/following-sibling::tr[1]');
    await panel.locator('.plate-btn', { hasText: '+25' }).click();

    // 45 (bar) + (25 * 2) = 95
    await expect(input).toHaveValue('95');
  });

  test('clicking +25 with an explicit value adds to that value', async ({ freshPage }) => {
    await freshPage.evaluate(() => (window as any).loadWeights('D', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="D"] input[data-exercise="Romanian deadlift"]'
    );
    await input.fill('135');

    const panel = input.locator('xpath=ancestor::tr[1]/following-sibling::tr[1]');
    await panel.locator('.plate-btn', { hasText: '+25' }).click();

    await expect(input).toHaveValue('185');
  });

  test('Hip thrust (glute drive) has a plate panel, +25 from empty starts at 95', async ({ freshPage }) => {
    await freshPage.evaluate(() => (window as any).loadWeights('D', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="D"] input[data-exercise="Hip thrust"]'
    );
    await expect(input).toHaveAttribute('data-barbell', 'true');

    const panel = input.locator('xpath=ancestor::tr[1]/following-sibling::tr[1]');
    await expect(panel).toHaveClass(/plate-panel-row/);

    await panel.locator('.plate-btn', { hasText: '+25' }).click();
    // 45 (start) + (25 * 2) = 95
    await expect(input).toHaveValue('95');
  });

  test('Hip thrust reset returns to 45', async ({ freshPage }) => {
    await freshPage.evaluate(() => (window as any).loadWeights('D', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="D"] input[data-exercise="Hip thrust"]'
    );
    await input.fill('185');

    const panel = input.locator('xpath=ancestor::tr[1]/following-sibling::tr[1]');
    await panel.locator('.plate-btn--reset').click();

    await expect(input).toHaveValue('45');
  });

  test('Seated calf raise has a plate panel, +25 from empty starts at 110', async ({ freshPage }) => {
    await freshPage.evaluate(() => (window as any).loadWeights('D', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="D"] input[data-exercise="Seated calf raise"]'
    );
    await expect(input).toHaveAttribute('data-barbell', 'true');

    const panel = input.locator('xpath=ancestor::tr[1]/following-sibling::tr[1]');
    await expect(panel).toHaveClass(/plate-panel-row/);

    await panel.locator('.plate-btn', { hasText: '+25' }).click();
    // 60 (start) + (25 * 2) = 110
    await expect(input).toHaveValue('110');
  });

  test('Seated calf raise reset returns to 60', async ({ freshPage }) => {
    await freshPage.evaluate(() => (window as any).loadWeights('D', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="D"] input[data-exercise="Seated calf raise"]'
    );
    await input.fill('150');

    const panel = input.locator('xpath=ancestor::tr[1]/following-sibling::tr[1]');
    await panel.locator('.plate-btn--reset').click();

    await expect(input).toHaveValue('60');
  });

  test('Leg curl machine (iso-lateral) +25 adds 25, not 50, on top of the 8 lb start', async ({ freshPage }) => {
    await freshPage.evaluate(() => (window as any).loadWeights('D', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="D"] input[data-exercise="Leg curl machine"]'
    );
    await expect(input).toHaveAttribute('data-barbell', 'true');

    const panel = input.locator('xpath=ancestor::tr[1]/following-sibling::tr[1]');
    await expect(panel).toHaveClass(/plate-panel-row/);

    await panel.locator('.plate-btn', { hasText: '+25' }).click();
    // 8 (start) + 25 (one plate, per-leg) = 33
    await expect(input).toHaveValue('33');
  });

  test('Leg curl machine reset returns to 8', async ({ freshPage }) => {
    await freshPage.evaluate(() => (window as any).loadWeights('D', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="D"] input[data-exercise="Leg curl machine"]'
    );
    await input.fill('60');

    const panel = input.locator('xpath=ancestor::tr[1]/following-sibling::tr[1]');
    await panel.locator('.plate-btn--reset').click();

    await expect(input).toHaveValue('8');
  });

  test('Leg curl machine pill removal subtracts the single-plate weight, not double', async ({ freshPage }) => {
    await freshPage.evaluate(() => (window as any).loadWeights('D', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="D"] input[data-exercise="Leg curl machine"]'
    );
    const panel = input.locator('xpath=ancestor::tr[1]/following-sibling::tr[1]');
    await panel.locator('.plate-btn', { hasText: '+25' }).click();
    await expect(input).toHaveValue('33');

    // The breakdown meta should now show a 25-lb pill; clicking removes 25, not 50.
    await panel.locator('.plate-pill', { hasText: '25' }).click();
    await expect(input).toHaveValue('8');
  });

  test('Hip thrust label no longer says "(barbell)"', async ({ freshPage }) => {
    const cell = freshPage.locator(
      '.tab-content[data-day="D"] td.exercise-name', { hasText: 'Hip thrust' }
    );
    await expect(cell).toHaveText('Hip thrust');
  });

  test('bar reset still clears to the bar even when a placeholder is set', async ({ freshPage }) => {
    await freshPage.evaluate(async () => {
      const sw = (window as any).saveWeight;
      await sw('2026-04-15', 'Romanian deadlift', 185);
    });
    await freshPage.evaluate(() => (window as any).loadWeights('D', '2026-04-30'));

    const input = freshPage.locator(
      '.tab-content[data-day="D"] input[data-exercise="Romanian deadlift"]'
    );
    await expect(input).toHaveAttribute('placeholder', '185 lbs');

    const panel = input.locator('xpath=ancestor::tr[1]/following-sibling::tr[1]');
    await panel.locator('.plate-btn--reset').click();

    await expect(input).toHaveValue('45');
  });
});
