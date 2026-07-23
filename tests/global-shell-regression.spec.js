import { test, expect } from '@playwright/test';

test.describe('Global Portfolio Shell & Arcade Boot Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8085/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(400);
  });

  test('TEST A — PURE SCROLL: Shell Persistence & Section Sync Across All Sections', async ({ page }) => {
    const sections = [
      { id: 'home', expectedDock: 'portfolio-intro', expectedRail: 'home' },
      { id: 'work', expectedDock: 'work', expectedRail: 'work' },
      { id: 'about', expectedDock: 'about', expectedRail: 'about' },
      { id: 'skills', expectedDock: 'about', expectedRail: 'skills' },
      { id: 'experience', expectedDock: 'about', expectedRail: 'experience' },
      { id: 'contact', expectedDock: 'contact', expectedRail: 'contact' }
    ];

    for (const sec of sections) {
      if (sec.id !== 'home') {
        const el = page.locator('#' + sec.id);
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
      }

      // Shell elements must remain visible
      await expect(page.locator('.showroom-nav')).toBeVisible();
      await expect(page.locator('#nimo-launcher')).toBeVisible();
      await expect(page.locator('[data-theme-dock]')).toBeVisible();
      await expect(page.locator('.section-progress-rail')).toBeVisible();
      await expect(page.locator('.os-dock')).toBeVisible();

      // Body must NOT have arcade-active class
      const hasArcadeActive = await page.evaluate(() => document.body.classList.contains('arcade-active'));
      expect(hasArcadeActive).toBe(false);

      // Section mapping check
      const activeDockItem = page.locator(`.dock-item[data-dock-action="${sec.expectedDock}"]`);
      await expect(activeDockItem).toHaveClass(/dock-active/);

      const activeRailItem = page.locator(`.section-progress-rail__link[data-section-id="${sec.expectedRail}"]`);
      await expect(activeRailItem).toHaveClass(/is-active/);
    }
  });

  test('TEST B — CLICK THEN SCROLL: Arcade Exit Restores Full Shell & Tracking', async ({ page }) => {
    // Click ARCADE
    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
    await page.waitForTimeout(400);

    // Verify Arcade active
    let hasArcadeActive = await page.evaluate(() => document.body.classList.contains('arcade-active'));
    expect(hasArcadeActive).toBe(true);

    // Exit Arcade to About
    await page.evaluate(() => window.ArcadeExperience.exitArcadeExperience('dock', 'about'));
    await page.waitForTimeout(400);

    // Arcade highlight cleared, body class removed
    hasArcadeActive = await page.evaluate(() => document.body.classList.contains('arcade-active'));
    expect(hasArcadeActive).toBe(false);

    const aboutDock = page.locator('.dock-item[data-dock-action="about"]');
    await expect(aboutDock).toHaveClass(/dock-active/);

    // Scroll through remaining sections
    for (const secId of ['work', 'contact']) {
      await page.locator('#' + secId).scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      await expect(page.locator('.showroom-nav')).toBeVisible();
      await expect(page.locator('#nimo-launcher')).toBeVisible();
      await expect(page.locator('[data-theme-dock]')).toBeVisible();
      await expect(page.locator('.section-progress-rail')).toBeVisible();
      await expect(page.locator('.os-dock')).toBeVisible();

      const activeDock = page.locator(`.dock-item[data-dock-action="${secId}"]`);
      await expect(activeDock).toHaveClass(/dock-active/);
    }
  });

  test('TEST C — RAPID TRANSITIONS: 10 Cycle Transitions Without Stale Body State', async ({ page }) => {
    for (let cycle = 1; cycle <= 10; cycle++) {
      // Enter Arcade
      await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
      await page.waitForTimeout(80);

      // Exit to About
      await page.evaluate(() => window.ArcadeExperience.exitArcadeExperience('dock', 'about'));
      await page.waitForTimeout(80);
    }

    await page.waitForTimeout(300);

    const expState = await page.evaluate(() => window.ArcadeExperience.getState());
    expect(expState).toBe('PORTFOLIO');

    const hasArcadeActive = await page.evaluate(() => document.body.classList.contains('arcade-active'));
    expect(hasArcadeActive).toBe(false);

    const isScaled = await page.evaluate(() => document.querySelector('.cabinet-chassis')?.classList.contains('is-scaled'));
    expect(isScaled).toBe(false);

    await expect(page.locator('.showroom-nav')).toBeVisible();
    await expect(page.locator('#nimo-launcher')).toBeVisible();
    await expect(page.locator('[data-theme-dock]')).toBeVisible();
    await expect(page.locator('.section-progress-rail')).toBeVisible();
  });

  test('TEST D — DOM UNIQUENESS: Exact 1 Component Instance', async ({ page }) => {
    await expect(page.locator('#nimo-widget')).toHaveCount(1);
    await expect(page.locator('[data-theme-dock]')).toHaveCount(1);
    await expect(page.locator('.section-progress-rail')).toHaveCount(1);
    await expect(page.locator('.os-dock')).toHaveCount(1);
  });

  test('TEST E: Case Study Global Shell & Parent Context', async ({ page }) => {
    await page.goto('http://localhost:8085/assets/case-studies/veldora-bites.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(300);

    await expect(page.locator('.os-dock')).toBeVisible();
    await expect(page.locator('[data-theme-dock]')).toBeVisible();
    await expect(page.locator('#nimo-launcher')).toBeVisible();
    await expect(page.locator('.section-progress-rail')).toBeVisible();

    // WORK active as parent context
    const workDock = page.locator('.dock-item[data-dock-action="work"]');
    await expect(workDock).toHaveClass(/dock-active/);

    const workRail = page.locator('.section-progress-rail__link[data-section-id="work"]');
    await expect(workRail).toHaveClass(/is-active/);
  });
});
