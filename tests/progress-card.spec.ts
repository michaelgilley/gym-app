import { test, expect } from './fixtures';

/**
 * Progress card replaces the static 4-week progression panel:
 *   - Card renders rows for each of the main compound lifts.
 *   - Rows with no history show an empty state and no sparkline.
 *   - After seeding history, the row shows the top weight and a sparkline path.
 *   - Tapping a row opens the existing history-modal shell with a chart SVG.
 *   - The old "4-Week Progression" panel is gone.
 */

// Same order as the on-page list: program order, Day A → D.
const PROGRESS_EXERCISES = [
  'Barbell bench press',
  'Barbell back squat',
  'Leg press',
  'Chest-supported row',
  'Romanian deadlift',
  'Hip thrust',
];

async function seedHistory(page: import('@playwright/test').Page, exercise: string, entries: Array<{ date: string; weight: number }>) {
  await page.evaluate(async ({ exercise, entries }) => {
    // saveWeight is hoisted to window because it's a top-level function decl.
    for (const e of entries) {
      // @ts-ignore
      await window.saveWeight(e.date, exercise, e.weight);
    }
    // @ts-ignore
    await window.renderProgressCard();
  }, { exercise, entries });
}

test.describe('Progress card', () => {
  test('renders a row for each main compound, in program order', async ({ freshPage }) => {
    const rows = freshPage.locator('.progress-row');
    await expect(rows).toHaveCount(PROGRESS_EXERCISES.length);

    // Order in the DOM must match program order (Day A → D).
    const domOrder = await rows.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.exercise || '')
    );
    expect(domOrder).toEqual(PROGRESS_EXERCISES);
  });

  test('static "4-Week Progression" panel is gone', async ({ freshPage }) => {
    await expect(freshPage.locator('text=4-Week Progression')).toHaveCount(0);
    await expect(freshPage.locator('.progression-table')).toHaveCount(0);
  });

  test('rows with no history show empty state and no sparkline path', async ({ freshPage }) => {
    const row = freshPage.locator('.progress-row[data-exercise="Barbell bench press"]');
    await expect(row.locator('.progress-row__empty')).toBeVisible();
    await expect(row.locator('svg.progress-row__spark path')).toHaveCount(0);
  });

  test('seeding history surfaces top weight and renders a sparkline', async ({ freshPage }) => {
    await seedHistory(freshPage, 'Barbell bench press', [
      { date: '2026-04-01', weight: 135 },
      { date: '2026-04-08', weight: 145 },
      { date: '2026-04-15', weight: 155 },
      { date: '2026-04-22', weight: 165 },
    ]);

    const row = freshPage.locator('.progress-row[data-exercise="Barbell bench press"]');
    await expect(row.locator('.progress-row__top')).toContainText('165');
    // Sparkline drew an SVG path.
    await expect(row.locator('svg.progress-row__spark path')).toHaveCount(1);
  });

  test('tapping a row opens the expanded chart modal', async ({ freshPage }) => {
    await seedHistory(freshPage, 'Barbell back squat', [
      { date: '2026-04-01', weight: 185 },
      { date: '2026-04-08', weight: 195 },
      { date: '2026-04-15', weight: 205 },
    ]);

    await freshPage.locator('.progress-row[data-exercise="Barbell back squat"]').click();

    const modal = freshPage.locator('#historyModal');
    await expect(modal).toHaveClass(/open/);
    await expect(freshPage.locator('#historyModalTitle')).toHaveText('Barbell back squat');
    // Expanded chart SVG with multiple data points.
    await expect(modal.locator('svg.progress-chart')).toHaveCount(1);
    await expect(modal.locator('svg.progress-chart circle')).toHaveCount(3);
    await expect(modal.locator('.progress-chart-stats')).toContainText('205');
  });
});
