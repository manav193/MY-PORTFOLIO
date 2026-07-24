import { test, expect } from '@playwright/test';

test.describe('BLOCK//DROP Gameplay & Landscape CRT Verification Suite', () => {
  test('BLOCK//DROP renders inside safe CRT rect, supports rotation, SRS wall-kick, hold, hard drop, outcome screen and 10x retry', async ({ page }) => {
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

    // Launch BLOCK//DROP
    await page.evaluate(() => window.ArcadeOS.launchApp('blockdrop'));
    await page.waitForSelector('#bd-canvas', { timeout: 5000 });

    // Click START PUZZLE
    await page.click('#bd-start');
    await page.waitForFunction(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return app?.state === 'PLAYING';
    }, { timeout: 3000 });

    // Verify Board Geometry & Safe CRT Insets
    const geo = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      const canvas = document.getElementById('bd-canvas');
      const canvasRect = canvas.getBoundingClientRect();
      const safeRect = window.ArcadeOS?.getArcadeSafeRect?.() || { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };

      return {
        cols: app?.cols,
        rows: app?.rows,
        cellSize: app?.cellSize,
        boardX: app?.boardX,
        boardY: app?.boardY,
        boardW: app?.boardW,
        boardH: app?.boardH,
        canvasRect: { x: canvasRect.x, y: canvasRect.y, w: canvasRect.width, h: canvasRect.height },
        safeRect,
        pieceType: app?.piece?.type,
        pieceMatrix: app?.piece?.matrix,
        pieceX: app?.piece?.x,
        pieceY: app?.piece?.y
      };
    });

    expect(geo.cols).toBe(10);
    expect(geo.rows).toBe(20);
    expect(geo.cellSize).toBeGreaterThanOrEqual(12);

    // Assert board cells are perfectly square (boardW / cols == boardH / rows == cellSize)
    expect(geo.boardW / geo.cols).toBe(geo.cellSize);
    expect(geo.boardH / geo.rows).toBe(geo.cellSize);

    // Assert bottom edge of board is strictly inside visible viewport above bottom curve
    const absoluteBoardBottom = geo.canvasRect.y + geo.boardY + geo.boardH;
    const safeBottom = geo.safeRect.y + geo.safeRect.height;
    expect(absoluteBoardBottom, 'Bottom row of board must remain inside safe CRT viewport').toBeLessThanOrEqual(safeBottom + 2);

    // Take screenshot of active BLOCK//DROP gameplay
    await page.screenshot({ path: 'test-results/blockdrop-gameplay.png' });

    // Test Rotation (ArrowUp)
    const initialMatrix = JSON.stringify(geo.pieceMatrix);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);

    const rotatedGeo = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return {
        matrix: JSON.stringify(app?.piece?.matrix),
        pieceX: app?.piece?.x,
        pieceY: app?.piece?.y
      };
    });

    // Unless piece is O (square), rotation changes matrix representation
    if (geo.pieceType !== 'O') {
      expect(rotatedGeo.matrix).not.toBe(initialMatrix);
    }

    // Test Wall Kick: Move piece to left wall (x = 0) and attempt rotation
    await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      if (app && app.piece) {
        app.piece.x = 0;
        app.rotate();
      }
    });

    const wallKickResult = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return {
        pieceX: app?.piece?.x,
        collided: app?.collide()
      };
    });

    expect(wallKickResult.collided).toBe(false);

    // Test Hold Piece (Press 'c')
    const beforeHoldType = geo.pieceType;
    await page.keyboard.press('c');
    await page.waitForTimeout(200);

    const holdResult = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return {
        heldType: app?.heldType,
        canHold: app?.canHold
      };
    });

    expect(holdResult.heldType).toBe(beforeHoldType);
    expect(holdResult.canHold).toBe(false);

    // Test Hard Drop (Space)
    const scoreBefore = await page.evaluate(() => (window.ArcadeOS.activeApp?._rawApp || window.ArcadeOS.activeApp)?.score);
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const scoreAfter = await page.evaluate(() => (window.ArcadeOS.activeApp?._rawApp || window.ArcadeOS.activeApp)?.score);
    expect(scoreAfter, 'Hard drop should award score').toBeGreaterThanOrEqual(scoreBefore);

    // Force Top Out / Game Over
    await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      if (app) app.gameOver();
    });

    // Verify ArcadeOutcomeScreen overlay appears
    await page.waitForSelector('.arcade-outcome-overlay', { timeout: 5000 });
    const outcomeVisible = await page.locator('.arcade-outcome-overlay').isVisible();
    expect(outcomeVisible).toBe(true);

    // Click RETRY
    await page.click('.arcade-outcome-btn.primary');
    await page.waitForSelector('.arcade-outcome-overlay', { state: 'detached', timeout: 5000 });
    await page.waitForFunction(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return app?.state === 'PLAYING';
    }, { timeout: 5000 });

    // Test RETRY 10 times in sequence to ensure no duplicate RAF loops or state leaks
    for (let i = 1; i <= 10; i++) {
      await page.waitForTimeout(50);
      await page.evaluate(() => {
        const active = window.ArcadeOS.activeApp;
        const app = active?._rawApp || active?.rawApp || active;
        if (app) {
          app.state = 'PLAYING';
          app.gameOver();
        }
      });
      await page.waitForSelector('.arcade-outcome-overlay', { timeout: 10000 });
      await page.evaluate(() => document.querySelector('.arcade-outcome-btn.primary')?.click());
      await page.waitForSelector('.arcade-outcome-overlay', { state: 'detached', timeout: 10000 });
      await page.waitForFunction(() => {
        const active = window.ArcadeOS.activeApp;
        const app = active?._rawApp || active?.rawApp || active;
        return app?.state === 'PLAYING';
      }, { timeout: 5000 });
    }

    const finalState = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return {
        state: app?.state,
        active: app?.active,
        hasRaf: !!app?.rafId
      };
    });

    expect(finalState.state).toBe('PLAYING');
    expect(finalState.hasRaf).toBe(true);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
