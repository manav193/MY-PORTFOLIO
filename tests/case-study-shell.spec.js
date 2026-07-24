import { test, expect } from '@playwright/test';

const CASE_STUDY_ROUTES = [
  'project-arcade-os.html',
  'project-love-journey.html',
  'project-nike.html',
  'project-nimo.html',
  'project-nintendo.html',
  'project-promptai.html',
  'project-selfyy.html',
  'project-shift-zero.html',
  'project-toolverse.html',
  'project-velora-bites.html',
  'assets/case-studies/veldora-bites.html'
];

test.describe('Case-Study Shell & NIMO Isolation Suite', () => {
  for (const route of CASE_STUDY_ROUTES) {
    test(`Case-Study Exclusivity: ${route} (Desktop & Mobile)`, async ({ page }) => {
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      // Test Desktop (1920x1080)
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(`http://localhost:8085/${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      // Assert shell components
      await expect(page.locator('#nimo-widget')).toHaveCount(1);
      await expect(page.locator('#nimo-launcher')).toBeVisible();

      await expect(page.locator('.os-dock')).toHaveCount(0);
      await expect(page.locator('[data-theme-dock]')).toHaveCount(0);
      await expect(page.locator('.section-progress-rail')).toHaveCount(0);

      // Assert case study navigation link / back button is visible
      const backNav = page.locator('a[href*="index.html"], a.cs-nav-back, .cs-nav__back, a:has-text("Back"), a.brand').first();
      if (await backNav.count() > 0) {
        await expect(backNav).toBeVisible();
      }

      // Test Mobile (390x844)
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(200);

      await expect(page.locator('#nimo-widget')).toHaveCount(1);
      await expect(page.locator('#nimo-launcher')).toBeVisible();
      await expect(page.locator('.os-dock')).toHaveCount(0);
      await expect(page.locator('[data-theme-dock]')).toHaveCount(0);
      await expect(page.locator('.section-progress-rail')).toHaveCount(0);

      expect(consoleErrors).toEqual([]);
    });
  }

  test('Main Portfolio Shell Integrity (Full Component Set)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:8085/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    // Assert main portfolio has all 4 shell components
    await expect(page.locator('.os-dock')).toHaveCount(1);
    await expect(page.locator('.os-dock')).toBeVisible();

    await expect(page.locator('[data-theme-dock]')).toHaveCount(1);
    await expect(page.locator('[data-theme-dock]')).toBeVisible();

    await expect(page.locator('.section-progress-rail')).toHaveCount(1);
    await expect(page.locator('.section-progress-rail')).toBeVisible();

    await expect(page.locator('#nimo-widget')).toHaveCount(1);
    await expect(page.locator('#nimo-launcher')).toBeVisible();

    // Verify dock click works
    const workDock = page.locator('.dock-item[data-dock-action="work"]');
    await workDock.click();
    await page.waitForTimeout(300);
    await expect(workDock).toHaveClass(/dock-active/);

    // Verify NIMO opens and closes
    const nimoLauncher = page.locator('#nimo-launcher');
    await nimoLauncher.click();
    await page.waitForTimeout(200);
    await expect(page.locator('#nimo-panel')).toBeVisible();

    const nimoClose = page.locator('#nimo-close-btn');
    if (await nimoClose.count() > 0) {
      await nimoClose.click();
      await page.waitForTimeout(200);
    }
  });
});
