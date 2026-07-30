import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { window.__ARCADE_BOOT_TEST_SCALE__ = 0.02; });
});

test('command palette opens the keyboard-accessible adaptation panel', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.adaptiveSession && window.openAdaptiveSettings);
  await page.keyboard.press('Control+k');
  await expect(page.locator('[data-cmd-backdrop]')).toBeVisible();
  await page.locator('#cmd-adaptation').click();
  await expect(page.locator('#adaptive-settings')).toBeVisible();
  await expect(page.locator('#adaptive-settings [data-adaptive-close]')).toBeFocused();
});

test('NIMO receives only a normalized aggregate session summary', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.NIMO?.getAdaptiveContext?.());
  const context = await page.evaluate(() => window.NIMO.getAdaptiveContext());
  expect(context.protocol).toBe('nimo-adaptive-context');
  expect(context.currentModule).toBe('arcade-os');
  expect(context).not.toHaveProperty('query');
  expect(context).not.toHaveProperty('searchText');
});

test('reduced motion is authoritative and keeps the page usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForFunction(() => window.ArcadeFabric);
  await expect(page.locator('#machine-bg')).toHaveAttribute('data-quality', 'static');
  await expect(page.locator('#main-content')).toBeVisible();
});
