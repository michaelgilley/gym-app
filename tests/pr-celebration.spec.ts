import { test, expect, saveWeight, countCelebrationElements } from './fixtures';

/**
 * PR celebration policy (per `celebratePR` in index.html):
 *   - First-ever save for an exercise → priorMax === 0 → NO celebration.
 *   - New weight strictly greater than priorMax → celebration fires.
 *   - New weight equal to or below priorMax → NO celebration.
 *
 * The celebration randomly picks one of three effects, all of which mount a
 * DOM node: `.shockwave` | `.aurora-flash` | `.plate-host`. We assert on the
 * presence of any of these.
 */

test.describe('PR celebration', () => {
  // The Day A bench tab loads by default on init() because Monday → Day A,
  // but if today is not a gym day the app snaps to the previous gym day. We
  // explicitly switch to Day A before saving so the test is day-of-week
  // independent.
  test.beforeEach(async ({ freshPage }) => {
    await freshPage.evaluate(() => {
      // Force tab to Day A, which contains "Barbell bench press".
      (window as any).switchTab?.('A');
      // Ensure data-active-day is 'A' too so any tab-scoped lookups match.
      document.body.setAttribute('data-active-day', 'A');
    });
  });

  test('first save (no prior data) does NOT fire a celebration', async ({ freshPage }) => {
    await saveWeight(freshPage, 'A', 'Barbell bench press', '135');
    expect(await countCelebrationElements(freshPage)).toBe(0);
  });

  test('strictly higher weight fires a celebration', async ({ freshPage }) => {
    // Seed: first save establishes priorMax without celebrating.
    await saveWeight(freshPage, 'A', 'Barbell bench press', '135');
    expect(await countCelebrationElements(freshPage)).toBe(0);

    // PR: 145 > 135 → celebration must mount at least one DOM node.
    await saveWeight(freshPage, 'A', 'Barbell bench press', '145');
    expect(await countCelebrationElements(freshPage)).toBeGreaterThan(0);
  });

  test('equal weight does NOT fire a celebration', async ({ freshPage }) => {
    await saveWeight(freshPage, 'A', 'Barbell bench press', '135');
    await saveWeight(freshPage, 'A', 'Barbell bench press', '135');
    expect(await countCelebrationElements(freshPage)).toBe(0);
  });

  test('lower weight does NOT fire a celebration', async ({ freshPage }) => {
    await saveWeight(freshPage, 'A', 'Barbell bench press', '155');
    await saveWeight(freshPage, 'A', 'Barbell bench press', '135');
    expect(await countCelebrationElements(freshPage)).toBe(0);
  });
});
