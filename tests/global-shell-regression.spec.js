import { test, expect } from '@playwright/test';

test.describe('Global Portfolio Shell & Arcade Boot Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8085/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('TEST 1: Home Global UI Components Presence', async ({ page }) => {
    const dock = page.locator('.os-dock');
    const palette = page.locator('[data-theme-dock]');
    const nimo = page.locator('#nimo-launcher');
    const statusRail = page.locator('.section-progress-rail');

    await expect(dock).toBeVisible();
    await expect(palette).toBeVisible();
    await expect(nimo).toBeVisible();
    await expect(page.locator('#nimo-widget')).toHaveCount(1);
    await expect(statusRail).toBeVisible();
  });

  test('TEST 2 & 3: Automatic Scroll Section Sync for Dock & Status Rail', async ({ page }) => {
    const sections = ['work', 'about', 'contact'];

    for (const sectionId of sections) {
      await page.evaluate((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'instant' });
      }, sectionId);
      await page.waitForTimeout(300);

      const activeDockItem = page.locator(`.dock-item[data-dock-action="${sectionId}"]`);
      await expect(activeDockItem).toHaveClass(/dock-active/);

      const activeRailItem = page.locator(`.section-progress-rail__link[data-section-id="${sectionId}"]`);
      await expect(activeRailItem).toHaveClass(/is-active/);
    }
  });

  test('TEST 4: Case Study Global Shell & Parent Context', async ({ page }) => {
    await page.goto('http://localhost:8085/assets/case-studies/veldora-bites.html');
    await page.waitForLoadState('domcontentloaded');

    const dock = page.locator('.os-dock');
    const palette = page.locator('[data-theme-dock]');
    const nimo = page.locator('#nimo-launcher');
    const statusRail = page.locator('.section-progress-rail');

    await expect(dock).toBeVisible();
    await expect(palette).toBeVisible();
    await expect(nimo).toBeVisible();
    await expect(page.locator('#nimo-widget')).toHaveCount(1);
    await expect(statusRail).toBeVisible();

    // WORK active as parent context
    const workDock = page.locator('.dock-item[data-dock-action="work"]');
    await expect(workDock).toHaveClass(/dock-active/);

    const workRail = page.locator('.section-progress-rail__link[data-section-id="work"]');
    await expect(workRail).toHaveClass(/is-active/);
  });

  test('TEST 5: 50/50 Dock Navigation Reliability Test', async ({ page }) => {
    const actions = ['work', 'about', 'contact', 'portfolio-intro', 'work'];
    
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const action of actions) {
        const item = page.locator(`.dock-item[data-dock-action="${action}"]`);
        await item.click();
        await page.waitForTimeout(50);
        await expect(item).toHaveClass(/dock-active/);
      }
    }
  });

  test('TEST 6: Manual Scroll Overrides Last Clicked Dock Action', async ({ page }) => {
    // Click Work
    const workDock = page.locator('.dock-item[data-dock-action="work"]');
    await workDock.click();
    await page.waitForTimeout(300);
    await expect(workDock).toHaveClass(/dock-active/);

    // Scroll to About
    await page.evaluate(() => {
      document.getElementById('about')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(300);

    const aboutDock = page.locator('.dock-item[data-dock-action="about"]');
    await expect(aboutDock).toHaveClass(/dock-active/);
    await expect(workDock).not.toHaveClass(/dock-active/);
  });

  test('TEST 7 & 8: First Arcade Boot & Fast-Path Re-entry', async ({ page }) => {
    // First entry: Trigger boot
    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
    await page.waitForTimeout(300);

    const osLayer = page.locator('#arcade-os');
    await expect(osLayer).toHaveCSS('opacity', '1');

    // Exit Arcade
    await page.evaluate(() => window.ArcadeExperience.exitArcadeExperience('dock'));
    await page.waitForTimeout(300);

    // Re-enter Arcade (Fast-path warm re-entry)
    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
    await page.waitForTimeout(200);

    const homeView = page.locator('#arcade-home');
    await expect(homeView).toHaveClass(/active/);
  });

  test('TEST 9: Reverse Scroll During Boot Cancellation', async ({ page }) => {
    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('scroll'));
    await page.waitForTimeout(100);

    // Reverse scroll
    await page.evaluate(() => window.ArcadeExperience.exitArcadeExperience('scroll'));
    await page.waitForTimeout(200);

    const expState = await page.evaluate(() => window.ArcadeExperience.getState());
    expect(expState).toBe('PORTFOLIO');
  });
});
