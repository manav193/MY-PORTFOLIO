import { test, expect } from '@playwright/test';

test.describe('NEON SNAKE Gameplay & Verification Suite', () => {
  test('NEON SNAKE renders, moves automatically, responds to input, handles collision, outcome screen and retry 10x', async ({ page }) => {
    test.setTimeout(60000);

    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', err => pageErrors.push(String(err)));
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('503') && !msg.text().includes('fonts.googleapis.com')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Enter ArcadeOS
    await page.evaluate(() => {
      if (window.ArcadeExperience?.enterArcadeExperience) {
        window.ArcadeExperience.enterArcadeExperience('dock');
      } else if (window.ArcadeOS?.boot) {
        window.ArcadeOS.boot();
      }
    });

    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 10000 });

    // Launch Neon Snake
    await page.evaluate(() => window.ArcadeOS.launchApp('snake'));
    await page.waitForSelector('#snake-canvas', { timeout: 5000 });

    // Verify initial canvas dimensions and safe rect
    const initialDimensions = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      const canvas = document.getElementById('snake-canvas');
      return {
        gridWidth: app?.gridWidth,
        gridHeight: app?.gridHeight,
        cellSize: app?.cellSize,
        offsetX: app?.offsetX,
        offsetY: app?.offsetY,
        canvasW: canvas?.width,
        canvasH: canvas?.height,
        headX: app?.snake?.[0]?.x,
        headY: app?.snake?.[0]?.y,
        state: app?.state
      };
    });

    expect(initialDimensions.gridWidth).toBe(24);
    expect(initialDimensions.gridHeight).toBe(16);
    expect(initialDimensions.cellSize).toBeGreaterThanOrEqual(12);
    expect(initialDimensions.headX).toBe(12);
    expect(initialDimensions.headY).toBe(8);

    // Click START GAME
    await page.click('#sn-start');
    await page.waitForFunction(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return app?.state === 'PLAYING';
    }, { timeout: 3000 });

    const startHeadX = initialDimensions.headX;

    // Wait at least 500ms for automatic movement
    await page.waitForTimeout(600);

    // Verify automatic movement towards RIGHT
    const updatedPos = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return {
        headX: app?.snake?.[0]?.x,
        headY: app?.snake?.[0]?.y,
        dir: app?.dir,
        score: app?.score
      };
    });

    expect(updatedPos.headX, 'Snake head should have moved right automatically').toBeGreaterThan(startHeadX);

    // Verify canvas pixel rendering (non-background pixels in snake & food area)
    const pixelSample = await page.evaluate(() => {
      const canvas = document.getElementById('snake-canvas');
      const ctx = canvas.getContext('2d');
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      const dpr = app.dpr || 1;
      const cs = app.cellSize;
      const ox = app.offsetX;
      const oy = app.offsetY;

      // Sample center of snake head
      const headCell = app.snake[0];
      const px = Math.round((ox + headCell.x * cs + cs / 2) * dpr);
      const py = Math.round((oy + headCell.y * cs + cs / 2) * dpr);

      const pixel = ctx.getImageData(px, py, 1, 1).data;
      return { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] };
    });

    // Snake head is bright neon green (g > 100)
    expect(pixelSample.g, 'Snake head green channel should be bright green').toBeGreaterThan(100);

    // Take screenshot of active gameplay
    await page.screenshot({ path: 'test-results/neon-snake-gameplay.png' });

    // Send direction: ArrowDown
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(400);

    const downPos = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return {
        dir: app?.dir,
        headY: app?.snake?.[0]?.y
      };
    });

    expect(downPos.dir).toBe('DOWN');

    // Force collision by driving snake into the bottom wall
    await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      if (app) {
        app.snake = [{ x: 12, y: app.gridHeight - 1 }, { x: 12, y: app.gridHeight - 2 }];
        app.dir = 'DOWN';
        app.inputQueue = ['DOWN'];
        app.update();
      }
    });

    // Verify ArcadeOutcomeScreen overlay appears
    await page.waitForSelector('.arcade-outcome-overlay', { timeout: 5000 });
    const outcomeVisible = await page.locator('.arcade-outcome-overlay').isVisible();
    expect(outcomeVisible).toBe(true);

    // Verify Retry button works and starts clean run
    await page.click('.arcade-outcome-btn.primary');
    await page.waitForFunction(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return app?.state === 'PLAYING';
    }, { timeout: 3000 });

    // Test RETRY 10 times in sequence to ensure no duplicate RAF loops or state leaks
    for (let i = 1; i <= 10; i++) {
      await page.evaluate(() => {
        const active = window.ArcadeOS.activeApp;
        const app = active?._rawApp || active?.rawApp || active;
        if (app && typeof app.gameOver === 'function') app.gameOver();
      });
      await page.waitForSelector('.arcade-outcome-overlay', { timeout: 3000 });
      await page.click('.arcade-outcome-btn.primary');
      await page.waitForFunction(() => {
        const active = window.ArcadeOS.activeApp;
        const app = active?._rawApp || active?.rawApp || active;
        return app?.state === 'PLAYING';
      }, { timeout: 3000 });
    }

    const finalState = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return {
        state: app?.state,
        snakeLen: app?.snake?.length,
        active: app?.active,
        hasRaf: !!app?.rafId
      };
    });

    expect(finalState.state).toBe('PLAYING');
    expect(finalState.snakeLen).toBe(3);
    expect(finalState.hasRaf).toBe(true);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
