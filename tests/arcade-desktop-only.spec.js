import { test, expect } from '@playwright/test';

test.describe('ArcadeOS desktop-only delivery', () => {
  test('mobile blocks ArcadeOS entry and explains desktop availability', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const trigger = page.locator('[data-enter-arcade]').first();
    await expect(trigger).toHaveAttribute('aria-disabled', 'true');
    await trigger.click();
    await expect(page.locator('[data-arcade-desktop-toast]')).toContainText('desktop-only');
    await expect(page.locator('body')).not.toHaveClass(/arcade-active/);
  });

  test('desktop keeps ArcadeOS entry enabled', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const trigger = page.locator('[data-enter-arcade]').first();
    await expect(trigger).not.toHaveAttribute('aria-disabled', 'true');
  });
});
