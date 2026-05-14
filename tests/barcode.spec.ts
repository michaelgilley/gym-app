import { test, expect } from './fixtures';

/**
 * Barcode "Scan in" modal:
 *   - Pill is visible and openable from the top of the page.
 *   - With no member number stored, the modal opens in `empty` state and the
 *     SVG host is hidden until a number is supplied.
 *   - After setting a member number, the modal renders a Code 128 SVG
 *     containing <rect> bars and displays the digits underneath.
 *   - The displayed number is editable, and a fresh value re-renders the bars.
 *   - The number persists in localStorage across reloads.
 *   - The modal closes on the close button.
 */

test.describe('Barcode scan-in', () => {
  test('scan-in icon button is visible with an accessible label', async ({ freshPage }) => {
    const btn = freshPage.locator('#scanInBtn');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('aria-label', /scan in/i);
    // It's an icon-only button — there's a bars decoration but no visible text.
    await expect(btn.locator('.scan-in-btn__bars')).toBeVisible();
  });

  test('opening the modal with no member number shows empty state and prompts for input', async ({ freshPage }) => {
    // Stub window.prompt BEFORE clicking the pill (open triggers an immediate
    // prompt on first use).
    await freshPage.addInitScript(() => {
      (window as any).__lastPromptDefault = null;
      window.prompt = (msg?: string, def?: string) => {
        (window as any).__lastPromptDefault = def ?? null;
        return null; // user cancels
      };
    });
    await freshPage.reload();
    await freshPage.waitForSelector('.day-indicator.gym.selected');

    await freshPage.locator('#scanInBtn').click();

    const modal = freshPage.locator('#barcodeModal');
    await expect(modal).toHaveClass(/open/);
    await expect(modal).toHaveClass(/empty/);
    await expect(freshPage.locator('#barcodeEmpty')).toBeVisible();
    // SVG host should not have rendered any bars yet.
    await expect(freshPage.locator('#barcodeSvgHost rect')).toHaveCount(0);
  });

  test('setting a member number renders a Code 128 barcode and persists across reloads', async ({ freshPage }) => {
    const memberNumber = '12345678';

    // Stub prompt to return the number we want set.
    await freshPage.addInitScript((num) => {
      window.prompt = () => num as string;
    }, memberNumber);
    await freshPage.reload();
    await freshPage.waitForSelector('.day-indicator.gym.selected');

    await freshPage.locator('#scanInBtn').click();

    const modal = freshPage.locator('#barcodeModal');
    await expect(modal).toHaveClass(/open/);
    await expect(modal).not.toHaveClass(/empty/);

    // The SVG host should contain a non-trivial number of bar rects.
    const barCount = await freshPage.locator('#barcodeSvgHost rect').count();
    expect(barCount).toBeGreaterThan(10);

    // Displayed number matches what we set.
    await expect(freshPage.locator('#barcodeNumber')).toHaveText(memberNumber);

    // localStorage holds the value.
    const stored = await freshPage.evaluate(() => localStorage.getItem('gymMemberNumber'));
    expect(stored).toBe(memberNumber);

    // Reload — value persists, modal re-opens populated.
    await freshPage.reload();
    await freshPage.waitForSelector('.day-indicator.gym.selected');

    // After reload no prompt should be required to display the existing number.
    await freshPage.evaluate(() => { window.prompt = () => null; });
    await freshPage.locator('#scanInBtn').click();
    await expect(freshPage.locator('#barcodeModal')).toHaveClass(/open/);
    await expect(freshPage.locator('#barcodeModal')).not.toHaveClass(/empty/);
    await expect(freshPage.locator('#barcodeNumber')).toHaveText(memberNumber);
  });

  test('editing the member number via the pencil re-renders the barcode', async ({ freshPage }) => {
    // Seed an initial number, then on edit return a different one.
    await freshPage.addInitScript(() => {
      localStorage.setItem('gymMemberNumber', '11111');
      window.prompt = () => '99999';
    });
    await freshPage.reload();
    await freshPage.waitForSelector('.day-indicator.gym.selected');

    await freshPage.locator('#scanInBtn').click();
    await expect(freshPage.locator('#barcodeNumber')).toHaveText('11111');
    const initialBars = await freshPage.locator('#barcodeSvgHost rect').count();
    expect(initialBars).toBeGreaterThan(10);

    await freshPage.locator('.barcode-modal__edit').click();
    await expect(freshPage.locator('#barcodeNumber')).toHaveText('99999');
    const updatedBars = await freshPage.locator('#barcodeSvgHost rect').count();
    expect(updatedBars).toBeGreaterThan(10);

    const stored = await freshPage.evaluate(() => localStorage.getItem('gymMemberNumber'));
    expect(stored).toBe('99999');
  });

  test('mixed Set C + Set B encoding: 7 digits + 1 letter produces 28 bars', async ({ freshPage }) => {
    // A common gym-card pattern is a run of digits followed by a single
    // letter. The compact encoding starts in Set C (pairs of digits), then
    // switches to Set B for the trailing non-digit:
    //   StartC + dd + dd + dd + CodeB + d + L + checksum + Stop = 9 symbols.
    // Each Code 128 symbol contributes 3 bars except Stop (which carries the
    // 2-module terminator and contributes 4), giving 8*3 + 4 = 28 bars.
    // Synthetic fixture — not a real membership number.
    const SAMPLE = '1234567A';

    await freshPage.addInitScript((value) => {
      localStorage.setItem('gymMemberNumber', value as string);
      window.prompt = () => null;
    }, SAMPLE);
    await freshPage.reload();
    await freshPage.waitForSelector('.day-indicator.gym.selected');

    await freshPage.locator('#scanInBtn').click();
    await expect(freshPage.locator('#barcodeNumber')).toHaveText(SAMPLE);

    const blackBarCount = await freshPage.locator('#barcodeSvgHost rect[fill="#000"]').count();
    expect(blackBarCount).toBe(28);

    // The encoder must use Start C, three digit pairs, switch to Set B, then
    // the trailing digit and letter. The checksum is left to the impl —
    // we only assert the surrounding symbol shape.
    const symbols: number[] = await freshPage.evaluate((s) =>
      // @ts-ignore — encodeCode128 is a top-level function decl on window
      window.encodeCode128(s)
    , SAMPLE);
    expect(symbols.length).toBe(9);
    expect(symbols[0]).toBe(105); // Start C
    expect(symbols.slice(1, 4)).toEqual([12, 34, 56]); // digit pairs
    expect(symbols[4]).toBe(100); // Code B switch
    expect(symbols[5]).toBe('7'.charCodeAt(0) - 32);
    expect(symbols[6]).toBe('A'.charCodeAt(0) - 32);
    expect(symbols[symbols.length - 1]).toBe(106); // Stop
  });

  test('close button dismisses the modal', async ({ freshPage }) => {
    await freshPage.addInitScript(() => {
      localStorage.setItem('gymMemberNumber', '12345678');
      window.prompt = () => null;
    });
    await freshPage.reload();
    await freshPage.waitForSelector('.day-indicator.gym.selected');

    await freshPage.locator('#scanInBtn').click();
    const modal = freshPage.locator('#barcodeModal');
    await expect(modal).toHaveClass(/open/);

    await freshPage.locator('.barcode-modal__close').click();
    await expect(modal).not.toHaveClass(/open/);
  });
});
