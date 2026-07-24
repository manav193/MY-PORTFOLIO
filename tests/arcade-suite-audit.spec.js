import { test, expect } from '@playwright/test';

test.describe('Comprehensive Arcade Games Suite Real-Browser Audit', () => {
  test.setTimeout(60000);

  const games = [
    'pacmaze',
    'flappybyte',
    'spacewars',
    'breakout',
    'neonpong',
    'voidinvaders',
    'vectordrift',
    'snake',
    'blockdrop',
    'pixelplumber'
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      if (window.ArcadeExperience?.enterArcadeExperience) {
        window.ArcadeExperience.enterArcadeExperience('dock');
      } else if (window.ArcadeOS?.boot) {
        window.ArcadeOS.boot();
      }
    });

    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 10000 });
  });

  for (const gameId of games) {
    test(`AUDIT: Game [${gameId}] — Launch, Play, CRT Bounds, Input, Loss/Win, 5x Retry & Home Cleanliness`, async ({ page }) => {
      // 1. LAUNCH & START
      await page.evaluate((id) => window.ArcadeOS.launchApp(id), gameId);
      await page.waitForSelector('.canvas-wrapper canvas', { timeout: 5000 });

      // Start gameplay programmatically or via keyboard
      await page.evaluate(() => {
        const active = window.ArcadeOS.activeApp;
        const app = active?._rawApp || active?.rawApp || active;
        if (app && typeof app.start === 'function') {
          app.start();
        }
      });
      await page.waitForTimeout(300);

      // Verify active state
      const appState = await page.evaluate(() => {
        const active = window.ArcadeOS.activeApp;
        const app = active?._rawApp || active?.rawApp || active;
        return {
          id: active?.id || active?.manifest?.id || (window.ArcadeOS.activeAppId),
          state: app?.state,
          hasCanvas: !!document.querySelector('canvas')
        };
      });

      expect(appState.hasCanvas).toBe(true);

      // 2. INPUT & GAMEPLAY LOOP
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);

      // 3. SAFE CRT VIEWPORT BOUNDS CHECK
      const bounds = await page.evaluate(() => {
        const wrapper = document.querySelector('.canvas-wrapper');
        const canvas = document.querySelector('.canvas-wrapper canvas');
        const hud = document.querySelector('.plumber-hud, .snake-hud-active, #arcade-os-hud, .hud');
        if (!wrapper || !canvas) return null;

        const wRect = wrapper.getBoundingClientRect();
        const cRect = canvas.getBoundingClientRect();
        const hRect = hud ? hud.getBoundingClientRect() : null;

        return {
          wrapper: { top: wRect.top, bottom: wRect.bottom, width: wRect.width, height: wRect.height },
          canvas: { top: cRect.top, bottom: cRect.bottom, width: cRect.width, height: cRect.height },
          hudInBounds: hRect ? (hRect.top >= wRect.top - 20 && hRect.bottom <= wRect.bottom + 20) : true
        };
      });

      expect(bounds).not.toBeNull();
      expect(bounds.canvas.width).toBeGreaterThan(100);
      expect(bounds.canvas.height).toBeGreaterThan(100);
      expect(bounds.hudInBounds).toBe(true);

      // 4. LOSS TRIGGER & OUTCOME SCREEN
      await page.evaluate(() => {
        const active = window.ArcadeOS.activeApp;
        const app = active?._rawApp || active?.rawApp || active;
        if (app && typeof app.gameOver === 'function') {
          app.state = 'PLAYING';
          app.gameOver();
        }
      });

      await page.waitForSelector('.arcade-outcome-overlay', { timeout: 10000 });
      const outcomeVisible = await page.isVisible('.arcade-outcome-overlay');
      expect(outcomeVisible).toBe(true);

      // 5. RETRY STRESS TEST (5 Cycles)
      for (let i = 1; i <= 5; i++) {
        await page.evaluate(() => document.querySelector('.arcade-outcome-btn.primary')?.click());
        await page.waitForSelector('.arcade-outcome-overlay', { state: 'detached', timeout: 5000 });
        await page.waitForTimeout(100);

        await page.evaluate(() => {
          const active = window.ArcadeOS.activeApp;
          const app = active?._rawApp || active?.rawApp || active;
          if (app && typeof app.gameOver === 'function') {
            app.state = 'PLAYING';
            app.gameOver();
          }
        });
        await page.waitForSelector('.arcade-outcome-overlay', { timeout: 5000 });
      }

      // 6. HOME EXIT & TEARDOWN CLEANLINESS
      await page.evaluate(() => document.querySelector('.arcade-outcome-btn[data-action="home"]')?.click());
      await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 5000 });

      const teardownClean = await page.evaluate(() => {
        return {
          activeApp: window.ArcadeOS.activeApp,
          overlaysCount: document.querySelectorAll('.arcade-outcome-overlay').length,
          canvasCount: document.querySelectorAll('#arcade-screen canvas').length
        };
      });

      expect(teardownClean.activeApp).toBeNull();
      expect(teardownClean.overlaysCount).toBe(0);
      expect(teardownClean.canvasCount).toBe(0);
    });
  }
});
