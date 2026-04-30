import { test, expect } from './fixtures';

/**
 * Day-selector invariants:
 *   - On load, exactly one chip (the auto-selected gym day) carries `.selected`.
 *   - Clicking a different gym chip moves `.selected` to that chip and clears
 *     it from the previous one.
 *   - The `body[data-active-day]` attribute follows the chip's `data-tab-day`.
 *   - The Today button restores `.selected` to the auto-snap chip.
 */

test.describe('Day selector', () => {
  test('exactly one gym chip is selected on load', async ({ freshPage }) => {
    await expect(freshPage.locator('.day-indicator.gym.selected')).toHaveCount(1);
  });

  test('clicking a different gym chip moves the selected class', async ({ freshPage }) => {
    const allGymChips = freshPage.locator('.day-indicator.gym');
    const initialSelectedDate = await freshPage.locator('.day-indicator.gym.selected').getAttribute('data-date');

    // Find a gym chip that is NOT the currently-selected one.
    const target = freshPage.locator('.day-indicator.gym').filter({
      hasNot: freshPage.locator('.selected'),
    }).first();

    const targetDate = await target.getAttribute('data-date');
    const targetTabDay = await target.getAttribute('data-tab-day');
    expect(targetDate).not.toBe(initialSelectedDate);
    expect(targetTabDay).toMatch(/^[ABCD]$/);

    await target.click();

    // Re-render is async (loadWeights). Wait until selection state catches up.
    await expect(freshPage.locator(`.day-indicator.gym.selected[data-date="${targetDate}"]`)).toHaveCount(1);
    await expect(freshPage.locator('.day-indicator.gym.selected')).toHaveCount(1);

    // body data-active-day must agree with the clicked chip.
    await expect(freshPage.locator('body')).toHaveAttribute('data-active-day', targetTabDay!);

    // The previously-selected date, if it was a gym day this week, must no
    // longer be selected.
    if (initialSelectedDate) {
      await expect(
        freshPage.locator(`.day-indicator.gym.selected[data-date="${initialSelectedDate}"]`)
      ).toHaveCount(0);
    }
  });

  test('Today button restores the auto-snap selection', async ({ freshPage }) => {
    const initialSelectedDate = await freshPage.locator('.day-indicator.gym.selected').getAttribute('data-date');

    // Move selection somewhere else first.
    const other = freshPage.locator('.day-indicator.gym').filter({
      hasNot: freshPage.locator('.selected'),
    }).first();
    await other.click();
    await expect(freshPage.locator('.day-indicator.gym.selected')).toHaveCount(1);

    await freshPage.locator('#todayBtn').click();

    // After Today: the originally-selected (auto-snap) chip is selected again.
    await expect(
      freshPage.locator(`.day-indicator.gym.selected[data-date="${initialSelectedDate}"]`)
    ).toHaveCount(1);
    await expect(freshPage.locator('.day-indicator.gym.selected')).toHaveCount(1);
  });
});
