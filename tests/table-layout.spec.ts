import { test, expect } from './fixtures';

/**
 * Workout-table cells must not visually overlap. We catch this two ways:
 *   1. Bounding-box check: for every row's cells, each cell's right edge must
 *      not extend past the next cell's left edge (within a 1px sub-pixel
 *      tolerance). Same row only — cross-row overlap is allowed and expected
 *      for borders.
 *   2. Visual snapshot of one representative day's table at mobile width.
 *
 * Run on Day A which has the busiest layout (warmup with empty 3rd col,
 * compound row with 4 cells incl. weight input + history toggle, accessory
 * rows).
 */

test.describe('Table layout', () => {
  test.beforeEach(async ({ freshPage }) => {
    await freshPage.evaluate(() => {
      (window as any).switchTab?.('A');
      document.body.setAttribute('data-active-day', 'A');
    });
  });

  test('row cells do not overlap horizontally', async ({ freshPage }) => {
    const overlaps = await freshPage.evaluate(() => {
      const TOL = 1.0; // sub-pixel rounding tolerance
      const failures: { row: number; gap: number; html: string }[] = [];
      const tables = document.querySelectorAll('.tab-content[data-day="A"] .workout-table');
      let rowIdx = 0;
      tables.forEach((table) => {
        const rows = table.querySelectorAll('tr');
        rows.forEach((row) => {
          rowIdx++;
          const cells = Array.from(row.querySelectorAll(':scope > td')) as HTMLElement[];
          const rects = cells.map((c) => c.getBoundingClientRect());
          for (let i = 0; i < rects.length - 1; i++) {
            const gap = rects[i + 1].left - rects[i].right;
            if (gap < -TOL) {
              failures.push({
                row: rowIdx,
                gap,
                html: row.outerHTML.slice(0, 200),
              });
            }
          }
        });
      });
      return failures;
    });

    expect(overlaps, `Found ${overlaps.length} overlapping cell pair(s):\n${JSON.stringify(overlaps, null, 2)}`).toEqual([]);
  });

  test('weight inputs sit fully inside their cell', async ({ freshPage }) => {
    // An input bleeding outside its td is the most common overlap symptom on
    // mobile; check every weight input on Day A.
    const escapes = await freshPage.evaluate(() => {
      const TOL = 1.0;
      const failures: { exercise: string; deltaRight: number; deltaLeft: number }[] = [];
      const inputs = document.querySelectorAll(
        '.tab-content[data-day="A"] input.weight-input'
      ) as NodeListOf<HTMLInputElement>;
      inputs.forEach((input) => {
        const cell = input.closest('td');
        if (!cell) return;
        const cr = cell.getBoundingClientRect();
        const ir = input.getBoundingClientRect();
        const deltaLeft = ir.left - cr.left;
        const deltaRight = cr.right - ir.right;
        if (deltaLeft < -TOL || deltaRight < -TOL) {
          failures.push({
            exercise: input.getAttribute('data-exercise') ?? '?',
            deltaRight,
            deltaLeft,
          });
        }
      });
      return failures;
    });

    expect(escapes, `Found ${escapes.length} input(s) escaping their cell:\n${JSON.stringify(escapes, null, 2)}`).toEqual([]);
  });

  test('Day A workout area renders cleanly — visual snapshot', async ({ freshPage }) => {
    const tabContent = freshPage.locator('.tab-content[data-day="A"]');
    await expect(tabContent).toBeVisible();
    // Stabilize: scroll to top, wait a beat for layout.
    await freshPage.evaluate(() => window.scrollTo(0, 0));
    await freshPage.waitForTimeout(200);
    await expect(tabContent).toHaveScreenshot('day-a-tables-mobile.png');
  });
});
