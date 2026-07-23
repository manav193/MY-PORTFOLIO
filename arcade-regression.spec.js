const { test, expect } = require('@playwright/test');

test.describe('ArcadeOS Lifecycle Regression', () => {
  test('Full entry, game switching, holding inputs, and exit cycles', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for full lifecycle stress test
    let pageErrors = 0;
    let consoleErrors = 0;

    page.on('pageerror', err => {
      console.error('PAGE ERROR:', err.message);
      pageErrors++;
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon')) {
          console.error('CONSOLE ERROR:', text);
          consoleErrors++;
        }
      }
    });

    // 1. Fresh reload
    await page.goto('http://127.0.0.1:8085');
    await page.waitForLoadState('networkidle');

    // 4 cycles of heavy transitions
    for (let i = 0; i < 4; i++) {
      console.log(`--- CYCLE ${i + 1} ---`);

      // 2. Click Arcade Dock Icon
      await page.evaluate(() => {
        const dockArcade = document.querySelector('.dock-item[data-dock-action="arcade"]');
        if (dockArcade) dockArcade.click();
      });
      await page.waitForTimeout(2000);

      // Verify ArcadeOS HOME visible
      const osState = await page.evaluate(() => {
        return window.ArcadeOS ? { state: window.ArcadeOS.state, visible: window.ArcadeOS.osVisible, userExited: window.ArcadeOS.userExited, safeProgress: window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) } : null;
      });
      console.log('OS STATE BEFORE WAIT:', osState);
      
      await page.waitForFunction(() => {
        return window.ArcadeOS && window.ArcadeOS.osVisible && window.ArcadeOS.state === 'HOME';
      }, { timeout: 10000 });

      // 3. Launch Pac-Maze
      await page.evaluate(() => window.ArcadeOS.launchApp('pacmaze'));
      await page.waitForTimeout(1000);
      let activeApp = await page.evaluate(() => window.ArcadeOS.activeApp._rawAppId);
      expect(activeApp).toBe('pacmaze');

      // 4. Return Arcade HOME
      await page.evaluate(() => window.ArcadeOS.forceGoHome());
      await page.waitForTimeout(500);

      // 5. Launch Pixel Plumber
      await page.evaluate(() => window.ArcadeOS.launchApp('pixelplumber'));
      await page.waitForTimeout(1000);

      // 6. Hold D for continuous movement
      await page.keyboard.down('d');
      await page.waitForTimeout(1000);
      await page.keyboard.up('d');

      // Return Arcade HOME
      await page.evaluate(() => window.ArcadeOS.forceGoHome());
      await page.waitForTimeout(500);

      // 7. Launch Space Wars
      await page.evaluate(() => window.ArcadeOS.launchApp('spacewars'));
      await page.waitForTimeout(1000);

      // 8. Hold FIRE
      await page.keyboard.down(' ');
      await page.waitForTimeout(1000);
      await page.keyboard.up(' ');

      // Return Arcade HOME
      await page.evaluate(() => window.ArcadeOS.forceGoHome());
      await page.waitForTimeout(500);

      // 9. Exit to Portfolio HOME
      await page.evaluate(() => window.exitArcadeToPortfolio());
      await page.waitForTimeout(1500);

      // Verify cabinet is no longer owning view
      const isScaled = await page.evaluate(() => {
        return document.querySelector('.cabinet-chassis').classList.contains('is-scaled');
      });
      expect(isScaled).toBe(false);
    }

    expect(pageErrors).toBe(0);
    expect(consoleErrors).toBe(0);
  });
});
