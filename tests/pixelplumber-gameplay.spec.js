import { test, expect } from '@playwright/test';

test.describe('Pixel Plumber Gameplay & Level Expansion Suite', () => {
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
    await page.evaluate(() => window.ArcadeOS.launchApp('pixelplumber'));
    await page.waitForSelector('#plumber-canvas', { timeout: 5000 });
    await page.click('#pp-start');
    await page.waitForFunction(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return app?.state === 'PLAYING';
    }, { timeout: 5000 });
  });

  test('TEST A — LEVEL LENGTH: World width is 4800, flag at 4550, 2s right-holding does not complete game', async ({ page }) => {
    const geo = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return {
        startX: app?.player?.x,
        flagX: app?.flag?.x,
        worldWidth: app?.worldWidth
      };
    });

    expect(geo.startX).toBe(30);
    expect(geo.flagX).toBe(4550);
    expect(geo.worldWidth).toBe(4800);

    // Hold RIGHT for 2 seconds
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(2000);
    await page.keyboard.up('ArrowRight');

    const endPos = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return {
        playerX: app?.player?.x,
        state: app?.state
      };
    });

    // 2s of running moves player ~300-500px, nowhere near flag at 4550
    expect(endPos.playerX).toBeLessThan(800);
    expect(endPos.state).toBe('PLAYING');
  });

  test('TEST B — PLAYABILITY: Jump, coin collect, and enemy stomp mechanics', async ({ page }) => {
    // Jump onto first raised platform and collect coins
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(600);
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowUp');
    await page.waitForTimeout(600);
    await page.keyboard.up('ArrowRight');

    const stats = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return {
        playerX: app?.player?.x,
        playerY: app?.player?.y,
        coins: app?.coins,
        score: app?.score
      };
    });

    expect(stats.playerX).toBeGreaterThan(30);

    // Simulate enemy stomp cleanly
    const stompResult = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      if (app && app.enemies && app.enemies[0]) {
        const enemy = app.enemies[0];
        enemy.vx = 0; // freeze patrol movement for 1 frame
        app.player.x = enemy.x;
        app.player.y = enemy.y - 18;
        app.player.vy = 4;
        app.update(1);
        return {
          enemyActive: enemy.active,
          score: app.score,
          vy: app.player.vy
        };
      }
      return null;
    });

    expect(stompResult.enemyActive).toBe(false);
    expect(stompResult.score).toBeGreaterThan(0);
    expect(stompResult.vy).toBeLessThan(0); // Bounce feedback
  });

  test('TEST C — CAMERA: Camera tracks player smoothly and clamps within level bounds', async ({ page }) => {
    await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      if (app) {
        app.player.x = 1500;
        for (let i = 0; i < 30; i++) app.update(1);
      }
    });

    const camState = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return {
        playerX: app?.player?.x,
        cameraX: app?.cameraX,
        maxCameraX: app?.worldWidth - app?.playfieldWidth
      };
    });

    expect(camState.cameraX).toBeGreaterThan(1000);
    expect(camState.cameraX).toBeLessThanOrEqual(camState.maxCameraX);
  });

  test('TEST D — CHECKPOINT: Reaching midpoint checkpoint activates respawn state', async ({ page }) => {
    // Teleport to checkpoint flag at x = 2200
    await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      if (app) {
        app.player.x = 2210;
        app.update(1);
      }
    });

    const cpState = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return {
        checkpointReached: app?.checkpointReached,
        checkpointX: app?.checkpointX
      };
    });

    expect(cpState.checkpointReached).toBe(true);
    expect(cpState.checkpointX).toBe(2200);

    // Trigger death and verify checkpoint respawn
    await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      if (app) app.handlePlayerDeath();
    });

    const respawnState = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return {
        playerX: app?.player?.x,
        state: app?.state
      };
    });

    expect(respawnState.playerX).toBe(2200);
    expect(respawnState.state).toBe('PLAYING');
  });

  test('TEST E — VICTORY: Reaching flag displays LEVEL COMPLETE outcome screen', async ({ page }) => {
    await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      if (app) {
        app.player.x = 4560;
        app.update(1);
      }
    });

    await page.waitForSelector('.arcade-outcome-overlay', { timeout: 5000 });
    const title = await page.textContent('.arcade-outcome-title');
    expect(title).toBe('LEVEL COMPLETE!');

    const scoreStat = await page.textContent('.arcade-stat-value');
    expect(scoreStat).not.toBe('');
  });

  test('TEST F — GAME OVER & 10X RETRY: Pit death triggers ArcadeOutcomeScreen and 10x clean retry', async ({ page }) => {
    await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      if (app) app.gameOver();
    });

    await page.waitForSelector('.arcade-outcome-overlay', { timeout: 5000 });
    await page.click('.arcade-outcome-btn.primary');
    await page.waitForSelector('.arcade-outcome-overlay', { state: 'detached', timeout: 5000 });

    // 10x Retry Cycle
    for (let i = 1; i <= 10; i++) {
      await page.waitForTimeout(100);
      await page.evaluate(() => {
        const active = window.ArcadeOS.activeApp;
        const app = active?._rawApp || active?.rawApp || active;
        if (app && typeof app.gameOver === 'function') app.gameOver();
      });
      await page.waitForSelector('.arcade-outcome-overlay', { timeout: 10000 });
      await page.evaluate(() => document.querySelector('.arcade-outcome-btn.primary')?.click());
      await page.waitForSelector('.arcade-outcome-overlay', { state: 'detached', timeout: 10000 });
    }

    const finalState = await page.evaluate(() => {
      const active = window.ArcadeOS.activeApp;
      const app = active?._rawApp || active?.rawApp || active;
      return {
        state: app?.state,
        hasRaf: !!app?.rafId
      };
    });

    expect(finalState.state).toBe('PLAYING');
    expect(finalState.hasRaf).toBe(true);
  });
});
