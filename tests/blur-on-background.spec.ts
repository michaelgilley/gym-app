import { test, expect } from './fixtures';

/**
 * iOS home-screen PWAs show a system "Undo Typing" popup on next foreground
 * when a text input is still focused (with an edit pending) at the moment
 * the app is backgrounded/locked. Fix: blur the active input on Save, and
 * on visibilitychange, so no field is focused when the phone locks.
 */

test.describe('Blur active input to avoid iOS "Undo Typing" popup', () => {
  test.beforeEach(async ({ freshPage }) => {
    await freshPage.evaluate(() => {
      (window as any).switchTab?.('A');
      document.body.setAttribute('data-active-day', 'A');
    });
  });

  test('tapping Save blurs the focused weight input', async ({ freshPage }) => {
    const input = freshPage.locator(
      '.tab-content[data-day="A"] input[data-exercise="Barbell bench press"]'
    );
    await input.fill('135');
    await expect(input).toBeFocused();

    await freshPage.locator('.save-button[data-day="A"]').click();

    await expect(input).not.toBeFocused();
  });

  test('page going hidden blurs the focused weight input', async ({ freshPage }) => {
    const input = freshPage.locator(
      '.tab-content[data-day="A"] input[data-exercise="Barbell bench press"]'
    );
    await input.fill('135');
    await expect(input).toBeFocused();

    await freshPage.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await expect(input).not.toBeFocused();
  });

  test('pagehide firing blurs the focused weight input', async ({ freshPage }) => {
    const input = freshPage.locator(
      '.tab-content[data-day="A"] input[data-exercise="Barbell bench press"]'
    );
    await input.fill('135');
    await expect(input).toBeFocused();

    await freshPage.evaluate(() => {
      window.dispatchEvent(new Event('pagehide'));
    });

    await expect(input).not.toBeFocused();
  });
});
