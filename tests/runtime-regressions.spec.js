import { test, expect } from '@playwright/test';

test.describe('Homepage runtime regressions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://localhost:8085/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#machine-bg .mb-svg, #machine-bg canvas'));
  });

  test('loads the interactive machine background', async ({ page }) => {
    await expect(page.locator('#machine-bg')).toHaveClass(/ready/);
    await expect(page.locator('#machine-bg .mb-svg, #machine-bg canvas')).toHaveCount(1);
  });

  test('keeps the custom cursor responsive after returning from a case study', async ({ page }) => {
    await Promise.all([
      page.waitForURL(/project-nimo\.html/),
      page.locator('a[href="project-nimo.html"]').first().click()
    ]);

    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.dataset.cursorMode === 'portfolio');
    await page.mouse.move(420, 360);

    await expect.poll(() => page.locator('[data-cursor-dot]').evaluate((dot) => dot.style.transform))
      .toContain('420px, 360px');
  });

  test('uses the persistent maintenance section without a repeating modal', async ({ page }) => {
    const arcadeDock = page.locator('[data-dock-action="arcade"]');

    await arcadeDock.click();
    await arcadeDock.click();

    await expect(page.locator('.arcade-maintenance-section')).toBeVisible();
    await expect(page.locator('#arcade-construction-overlay')).toHaveCount(0);
    await expect(arcadeDock).not.toHaveClass(/dock-active/);

    await page.locator('#work').scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    await expect(page.locator('#work')).toBeVisible();
  });
});
