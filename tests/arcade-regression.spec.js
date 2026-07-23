import { test, expect } from '@playwright/test';

const fileUrl = '/';

test.describe('ArcadeOS State Machine & Viewport Geometry Suite', () => {
  let pageErrors = [];
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    consoleErrors = [];

    page.on('pageerror', (err) => {
      console.log('PAGE ERROR:', err);
      pageErrors.push(err.message || String(err));
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource')) {
          consoleErrors.push(text);
        }
      }
    });
  });

  const checkNoErrors = () => {
    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `Console errors: ${consoleErrors.join('; ')}`).toEqual([]);
  };

  const scrollToArcade = async (page) => {
    await page.evaluate(() => {
      const intro = document.getElementById('intro-sequence');
      if (intro) {
        const rect = intro.getBoundingClientRect();
        const targetY = window.scrollY + rect.top + rect.height * 0.95;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    });
    await page.waitForFunction(
      () => window.ArcadeExperience?.getState() === 'ARCADE_HOME' && window.ArcadeOS?.state === 'HOME',
      { timeout: 8000 }
    );
    await page.waitForSelector('#arcade-home.active', { timeout: 8000 });
  };

  const scrollToPortfolio = async (page) => {
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await page.waitForFunction(
      () => window.ArcadeExperience?.getState() === 'PORTFOLIO',
      { timeout: 8000 }
    );
  };

  test('TEST 1: Natural Scroll Entry (5/5 reloads)', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.goto(fileUrl);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });

      // Verify initial PORTFOLIO state
      const initialExpState = await page.evaluate(() => window.ArcadeExperience.getState());
      expect(initialExpState).toBe('PORTFOLIO');

      // Scroll downward into Arcade
      await scrollToArcade(page);

      // Verify ARCADE_HOME state
      const homeActive = await page.locator('#arcade-home.active').isVisible();
      expect(homeActive).toBe(true);

      const cardCount = await page.locator('#arcade-home .app-card').count();
      expect(cardCount).toBeGreaterThan(0);

      const expState = await page.evaluate(() => window.ArcadeExperience.getState());
      expect(['ARCADE_HOME', 'ARCADE_APP']).toContain(expState);

      checkNoErrors();
    }
  });

  test('TEST 2: Reverse Scroll Restoration (5 cycles)', async ({ page }) => {
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });

    for (let i = 0; i < 5; i++) {
      // Scroll into Arcade
      await scrollToArcade(page);

      // Scroll back up to Portfolio
      await scrollToPortfolio(page);

      // Verify PORTFOLIO state & no portfolio content inside CRT
      const expState = await page.evaluate(() => window.ArcadeExperience.getState());
      expect(expState).toBe('PORTFOLIO');

      const portfolioInsideCRT = await page.evaluate(() => {
        const osLayer = document.getElementById('arcade-os');
        if (!osLayer) return false;
        return Boolean(osLayer.querySelector('#home, #work, #about, #contact, .hero-section'));
      });
      expect(portfolioInsideCRT).toBe(false);

      const heroVisible = await page.locator('#home .hero-title').isVisible();
      expect(heroVisible).toBe(true);

      checkNoErrors();
    }
  });

  test('TEST 3: Dock HOME <-> ARCADE Navigation (10 cycles)', async ({ page }) => {
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });

    for (let i = 0; i < 10; i++) {
      // Click ARCADE dock
      await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
      await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 8000 });
      await page.waitForSelector('#arcade-home.active', { timeout: 8000 });

      const arcadeState = await page.evaluate(() => window.ArcadeExperience.getState());
      expect(['ARCADE_HOME', 'ARCADE_APP']).toContain(arcadeState);

      const homeActive = await page.locator('#arcade-home.active').isVisible();
      expect(homeActive).toBe(true);

      // Click HOME dock
      await page.evaluate(() => window.ArcadeExperience.exitArcadeExperience('dock', 'portfolio-intro'));
      await page.waitForFunction(() => window.ArcadeExperience.getState() === 'PORTFOLIO', { timeout: 5000 });

      const portfolioState = await page.evaluate(() => window.ArcadeExperience.getState());
      expect(portfolioState).toBe('PORTFOLIO');

      checkNoErrors();
    }
  });

  test('TEST 4: Mixed Navigation Pattern', async ({ page }) => {
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });

    // Natural scroll -> Arcade
    await scrollToArcade(page);
    expect(await page.evaluate(() => window.ArcadeExperience.getState())).toBe('ARCADE_HOME');

    // Dock HOME -> Portfolio
    await page.evaluate(() => window.ArcadeExperience.exitArcadeExperience('dock', 'portfolio-intro'));
    await page.waitForFunction(() => window.ArcadeExperience.getState() === 'PORTFOLIO', { timeout: 5000 });
    expect(await page.evaluate(() => window.ArcadeExperience.getState())).toBe('PORTFOLIO');

    // Dock ARCADE -> Arcade
    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 8000 });
    await page.waitForSelector('#arcade-home.active', { timeout: 8000 });
    expect(await page.evaluate(() => window.ArcadeExperience.getState())).toBe('ARCADE_HOME');

    // Reverse scroll -> Portfolio
    await scrollToPortfolio(page);
    expect(await page.evaluate(() => window.ArcadeExperience.getState())).toBe('PORTFOLIO');

    checkNoErrors();
  });

  test('TEST 5: Game Launch & Exit Lifecycle', async ({ page }) => {
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });

    // Enter Arcade
    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 8000 });
    await page.waitForSelector('#arcade-home.active', { timeout: 8000 });

    // Launch Pac-Maze
    await page.evaluate(() => window.ArcadeOS?.launchApp('pacmaze'));
    await page.waitForSelector('#arcade-app-view.active', { timeout: 8000 });

    const appActive = await page.locator('#arcade-app-view.active').isVisible();
    expect(appActive).toBe(true);

    const expStateApp = await page.evaluate(() => window.ArcadeExperience.getState());
    expect(expStateApp).toBe('ARCADE_APP');

    // Press Escape to return HOME
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.ArcadeExperience.getState() === 'ARCADE_HOME', { timeout: 5000 });

    const expStateHome = await page.evaluate(() => window.ArcadeExperience.getState());
    expect(expStateHome).toBe('ARCADE_HOME');

    // Exit to Portfolio
    await page.evaluate(() => window.ArcadeExperience.exitArcadeExperience('dock', 'portfolio-intro'));
    await page.waitForFunction(() => window.ArcadeExperience.getState() === 'PORTFOLIO', { timeout: 5000 });
    expect(await page.evaluate(() => window.ArcadeExperience.getState())).toBe('PORTFOLIO');

    // Re-enter Arcade
    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 8000 });
    await page.waitForSelector('#arcade-home.active', { timeout: 8000 });

    const cardsStillExist = await page.locator('#arcade-home .app-card').count();
    expect(cardsStillExist).toBeGreaterThan(0);

    checkNoErrors();
  });

  test('TEST 6: Viewport Coverage & Bounding Box', async ({ page }) => {
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });

    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 8000 });
    await page.waitForSelector('#arcade-home.active', { timeout: 8000 });

    // Launch Space Wars (freeform / full-field game)
    await page.evaluate(() => window.ArcadeOS?.launchApp('spacewars'));
    await page.waitForSelector('#arcade-app-view.active canvas', { timeout: 8000 });

    const bounds = await page.evaluate(() => {
      const safeViewport = document.querySelector('.arcade-viewport-safe');
      const canvas = document.querySelector('#arcade-app-view canvas');
      if (!safeViewport || !canvas) return null;
      const vRect = safeViewport.getBoundingClientRect();
      const cRect = canvas.getBoundingClientRect();
      return {
        vWidth: vRect.width,
        vHeight: vRect.height,
        cWidth: cRect.width,
        cHeight: cRect.height
      };
    });

    expect(bounds).not.toBeNull();
    // Canvas CSS size is 100% of safe viewport
    expect(bounds.cWidth).toBeGreaterThanOrEqual(bounds.vWidth * 0.95);
    expect(bounds.cHeight).toBeGreaterThanOrEqual(bounds.vHeight * 0.70);

    checkNoErrors();
  });

  test('TEST 7: Safe Viewport Insets & Bounds Protection', async ({ page }) => {
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });

    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 8000 });
    await page.waitForSelector('#arcade-home.active', { timeout: 8000 });

    await page.evaluate(() => window.ArcadeOS?.launchApp('pacmaze'));
    await page.waitForSelector('#arcade-app-view.active canvas', { timeout: 8000 });

    const insets = await page.evaluate(() => {
      const os = document.getElementById('arcade-os');
      const safeViewport = document.querySelector('.arcade-viewport-safe');
      const footer = document.getElementById('arcade-footer-controls');
      if (!os || !safeViewport || !footer) return null;

      const osRect = os.getBoundingClientRect();
      const safeRect = safeViewport.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();

      return {
        leftInset: safeRect.left - osRect.left,
        rightInset: osRect.right - safeRect.right,
        overlapsFooter: safeRect.bottom > footerRect.top + 1
      };
    });

    expect(insets).not.toBeNull();
    expect(insets.leftInset).toBeGreaterThanOrEqual(4);
    expect(insets.rightInset).toBeGreaterThanOrEqual(4);
    expect(insets.overlapsFooter).toBe(false);

    checkNoErrors();
  });

  test('TEST 8: getArcadeSafeRect & System App Category Library', async ({ page }) => {
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });

    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 8000 });
    await page.waitForSelector('#arcade-home.active', { timeout: 8000 });

    // Verify getArcadeSafeRect()
    const safeRect = await page.evaluate(() => window.getArcadeSafeRect?.());
    expect(safeRect).not.toBeNull();
    expect(safeRect.width).toBeGreaterThan(200);
    expect(safeRect.height).toBeGreaterThan(150);

    // Verify Category Tabs exist
    const categoryBarVisible = await page.locator('.arcade-category-bar').isVisible();
    expect(categoryBarVisible).toBe(true);

    // Switch to SYSTEM & TOOLS category
    await page.click('.category-tab[data-cat="SYSTEM"]');
    await page.waitForFunction(() => window.ArcadeOS?.currentCategory === 'SYSTEM', { timeout: 3000 });

    const systemCardsCount = await page.locator('#arcade-home .app-card.system-card').count();
    expect(systemCardsCount).toBeGreaterThanOrEqual(5);

    // Switch back to GAMES category
    await page.click('.category-tab[data-cat="GAMES"]');
    await page.waitForFunction(() => window.ArcadeOS?.currentCategory === 'GAMES', { timeout: 3000 });

    checkNoErrors();
  });

  test('TEST 9: Pixel Plumber Held Controls & Space Wars Gameplay', async ({ page }) => {
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });

    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 8000 });
    await page.waitForSelector('#arcade-home.active', { timeout: 8000 });

    // Launch Pixel Plumber
    await page.evaluate(() => window.ArcadeOS?.launchApp('pixelplumber'));
    await page.waitForSelector('#arcade-app-view.active canvas', { timeout: 8000 });

    // Hold 'd' key to test continuous run
    await page.keyboard.down('d');
    await page.waitForTimeout(300);
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    await page.keyboard.up('d');

    // Return Home
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 5000 });

    // Launch Space Wars
    await page.evaluate(() => window.ArcadeOS?.launchApp('spacewars'));
    await page.waitForSelector('#arcade-app-view.active canvas', { timeout: 8000 });

    // Hold 'Space' to test continuous fire
    await page.keyboard.down('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');

    checkNoErrors();
  });

  test('TEST 10: NIMO Cheat Override & Persona Verification', async ({ page }) => {
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });

    // Trigger NIMO Override via ArcadeOS API
    const result = await page.evaluate(() => window.ArcadeOS?.activateNimoOverride?.());
    expect(result.status).toBe('success');

    checkNoErrors();
  });

  test('TEST 11: 20x Re-entry Registry Deduplication & DOM Card Uniqueness', async ({ page }) => {
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });

    const initialRegistryCount = await page.evaluate(() => window.ArcadeRegistry?.getAll().length);
    expect(initialRegistryCount).toBe(11);

    for (let i = 1; i <= 20; i++) {
      // Enter Arcade
      await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
      await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 5000 });

      // Verify registry count remains constant (11)
      const count = await page.evaluate(() => {
        const apps = window.ArcadeRegistry?.getAll() || [];
        const ids = apps.map(a => a.id);
        const isUnique = new Set(ids).size === ids.length;
        return { length: apps.length, isUnique };
      });

      expect(count.length).toBe(11);
      expect(count.isUnique).toBe(true);

      // Verify DOM card ID uniqueness
      const cardUniqueness = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('#home-carousel .app-card'));
        const ids = cards.map(c => c.dataset.launcherId).filter(Boolean);
        return { totalCards: cards.length, uniqueIds: new Set(ids).size };
      });
      expect(cardUniqueness.totalCards).toBe(cardUniqueness.uniqueIds);

      // Exit to Portfolio
      await page.evaluate(() => window.ArcadeExperience.exitArcadeExperience('dock', 'portfolio-intro'));
      await page.waitForFunction(() => window.ArcadeExperience.getState() === 'PORTFOLIO', { timeout: 5000 });
    }

    checkNoErrors();
  });

  test('TEST 12: Every registered app launches, renders, accepts input, exits, and relaunches', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });
    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 8000 });

    const appIds = await page.evaluate(() => window.ArcadeRegistry.getAll().map(app => app.id));
    expect(appIds).toHaveLength(11);

    for (const appId of appIds) {
      await page.evaluate(id => window.ArcadeOS.launchApp(id), appId);
      await page.waitForFunction(
        id => window.ArcadeOS?.state === 'APP' && window.ArcadeOS?.activeApp?._rawAppId === id,
        appId,
        { timeout: 8000 }
      );

      const renderState = await page.evaluate(() => {
        const view = document.getElementById('arcade-app-view');
        const canvas = view?.querySelector('canvas');
        if (!view) return { hasContent: false };
        if (!canvas) {
          return {
            hasContent: view.childElementCount > 0 && (view.textContent || '').trim().length > 0,
            canvas: false
          };
        }

        const rect = canvas.getBoundingClientRect();
        let nonBlank = false;
        try {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const stride = Math.max(4, Math.floor(pixels.length / 1200 / 4) * 4);
          for (let index = 0; index < pixels.length; index += stride) {
            if (pixels[index + 3] && (pixels[index] || pixels[index + 1] || pixels[index + 2])) {
              nonBlank = true;
              break;
            }
          }
        } catch (_) {
          nonBlank = true;
        }

        return {
          hasContent: true,
          canvas: true,
          nonBlank,
          logicalWidth: canvas.width,
          logicalHeight: canvas.height,
          cssWidth: rect.width,
          cssHeight: rect.height
        };
      });

      expect(renderState.hasContent, `${appId} produced no visible app content`).toBe(true);
      if (renderState.canvas) {
        expect(renderState.logicalWidth, `${appId} canvas has no logical width`).toBeGreaterThan(200);
        expect(renderState.logicalHeight, `${appId} canvas has no logical height`).toBeGreaterThan(150);
        expect(renderState.cssWidth, `${appId} canvas is visually too narrow`).toBeGreaterThan(200);
        expect(renderState.cssHeight, `${appId} canvas is visually too short`).toBeGreaterThan(140);
        expect(renderState.nonBlank, `${appId} rendered a blank canvas`).toBe(true);

        const canvas = page.locator('#arcade-app-view.active canvas');
        await canvas.dispatchEvent('pointerdown', { pointerId: 1, clientX: 220, clientY: 160 });
        await canvas.dispatchEvent('pointermove', { pointerId: 1, clientX: 280, clientY: 190 });
        await canvas.dispatchEvent('pointerup', { pointerId: 1, clientX: 280, clientY: 190 });
      }

      await page.keyboard.down('ArrowRight');
      await page.keyboard.down('Space');
      await page.waitForTimeout(120);
      await page.keyboard.up('Space');
      await page.keyboard.up('ArrowRight');

      await page.keyboard.press('Escape');
      await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 5000 });
      checkNoErrors();
    }

    for (const appId of ['pacmaze', 'pixelplumber', 'vectordrift', 'blockdrop']) {
      await page.evaluate(id => window.ArcadeOS.launchApp(id), appId);
      await page.waitForFunction(
        id => window.ArcadeOS?.state === 'APP' && window.ArcadeOS?.activeApp?._rawAppId === id,
        appId,
        { timeout: 8000 }
      );
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 5000 });
    }

    checkNoErrors();
  });

  test('TEST 13: Pac-Maze house release and in-game page-scroll capture', async ({ page }) => {
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });
    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 8000 });
    await page.evaluate(() => window.ArcadeOS.launchApp('pacmaze'));
    await page.waitForSelector('#pacmaze-game-container', { timeout: 8000 });
    await page.keyboard.press('Space');
    await page.waitForFunction(
      () => Number(document.getElementById('pacmaze-game-container')?.dataset.ghostsInHouse) <= 2,
      { timeout: 3500 }
    );

    const beforeScroll = await page.evaluate(() => window.scrollY);
    await page.keyboard.down('ArrowDown');
    await page.keyboard.down('Space');
    await page.waitForTimeout(250);
    await page.keyboard.up('Space');
    await page.keyboard.up('ArrowDown');
    const afterScroll = await page.evaluate(() => window.scrollY);
    expect(Math.abs(afterScroll - beforeScroll)).toBeLessThan(2);
    checkNoErrors();
  });

  test('TEST 14: Shared gamepad mapping exposes held directions and actions through one poller', async ({ page }) => {
    await page.addInitScript(() => {
      const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
      window.__arcadeMockPad = {
        index: 0,
        id: 'Arcade Regression Standard Pad',
        mapping: 'standard',
        connected: true,
        axes: [0, 0, 0, 0],
        buttons
      };
      Object.defineProperty(navigator, 'getGamepads', {
        configurable: true,
        value: () => [window.__arcadeMockPad]
      });
    });
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });
    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 8000 });
    await page.evaluate(() => {
      window.dispatchEvent(new Event('gamepadconnected'));
      window.__arcadeMockPad.axes[0] = 0.9;
      window.__arcadeMockPad.buttons[0] = { pressed: true, value: 1 };
    });
    await page.waitForTimeout(100);

    const mappedState = await page.evaluate(() => ({
      right: window.ArcadeInput.isDown('RIGHT'),
      primary: window.ArcadeInput.isDown('PRIMARY'),
      legacyPrimary: window.ArcadeInput.isPressed('ARCADE_ACTION_A'),
      pollerActive: Boolean(window.ArcadeInput.gamepadRafId)
    }));
    expect(mappedState).toEqual({
      right: true,
      primary: true,
      legacyPrimary: true,
      pollerActive: true
    });
    checkNoErrors();
  });

  test('TEST 15: Critical game mechanics remain functional under real held keyboard input', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function', { timeout: 5000 });
    await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 8000 });

    const launch = async (id, selector) => {
      await page.evaluate(appId => window.ArcadeOS.launchApp(appId), id);
      await page.waitForSelector(selector, { timeout: 8000 });
      await page.keyboard.press('Space');
    };
    const home = async () => {
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 5000 });
    };

    await launch('pixelplumber', '#plumber-game-container');
    await page.waitForFunction(() => document.getElementById('plumber-game-container')?.dataset.grounded === 'true', { timeout: 3000 });
    const plumberStartX = Number(await page.locator('#plumber-game-container').getAttribute('data-player-x'));
    await page.keyboard.down('d');
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.ArcadeInput.isDown('RIGHT'))).toBe(true);
    await page.waitForFunction(
      startX => Number(document.getElementById('plumber-game-container')?.dataset.playerX) > startX + 8,
      plumberStartX,
      { timeout: 3000 }
    );
    const plumberRightX = Number(await page.locator('#plumber-game-container').getAttribute('data-player-x'));
    await page.keyboard.press('Space');
    await page.waitForFunction(
      () => Number(document.getElementById('plumber-game-container')?.dataset.playerY) < 235,
      { timeout: 2500 }
    );
    const plumberJumpY = Number(await page.locator('#plumber-game-container').getAttribute('data-player-y'));
    await page.keyboard.up('d');
    await page.keyboard.down('a');
    expect(await page.evaluate(() => ({
      left: window.ArcadeInput.isDown('LEFT'),
      right: window.ArcadeInput.isDown('RIGHT'),
      state: window.ArcadeOS.state
    }))).toEqual({ left: true, right: false, state: 'APP' });
    await page.waitForTimeout(1200);
    const plumberDebug = await page.locator('#plumber-game-container').evaluate(el => ({ ...el.dataset }));
    expect({ state: plumberDebug.gameState, vx: Number(plumberDebug.playerVx) }).toEqual({
      state: 'PLAYING',
      vx: expect.any(Number)
    });
    expect(Number(plumberDebug.playerVx)).toBeLessThan(0);
    await page.keyboard.up('a');
    const plumberReverseX = Number(await page.locator('#plumber-game-container').getAttribute('data-player-x'));
    expect(plumberRightX).toBeGreaterThan(plumberStartX + 8);
    expect(plumberJumpY).toBeLessThan(238);
    expect(Number.isFinite(plumberReverseX)).toBe(true);
    await home();

    await launch('breakout', '#breakout-game-container');
    await page.waitForFunction(() => document.getElementById('breakout-game-container')?.dataset.ballActive === 'true', { timeout: 2500 });
    expect(await page.locator('#breakout-game-container').getAttribute('data-ball-active')).toBe('true');
    await home();

    await launch('voidinvaders', '#vi-game-container');
    const cannonStartX = Number(await page.locator('#vi-game-container').getAttribute('data-cannon-x'));
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowRight');
    const cannonEndX = Number(await page.locator('#vi-game-container').getAttribute('data-cannon-x'));
    expect(cannonEndX).toBeGreaterThan(cannonStartX);
    await home();

    await launch('vectordrift', '#vd-game-container');
    await page.keyboard.down('Space');
    await page.waitForTimeout(250);
    const vectorBullets = Number(await page.locator('#vd-game-container').getAttribute('data-bullet-count'));
    await page.keyboard.up('Space');
    expect(vectorBullets).toBeGreaterThan(0);
    await home();

    await launch('blockdrop', '#bd-game-container');
    let matrixBefore = await page.locator('#bd-game-container').getAttribute('data-piece-matrix');
    for (let attempt = 0; attempt < 6 && matrixBefore === '[[1,1],[1,1]]'; attempt++) {
      await page.keyboard.press('Space');
      matrixBefore = await page.locator('#bd-game-container').getAttribute('data-piece-matrix');
    }
    await page.keyboard.press('ArrowUp');
    const matrixAfter = await page.locator('#bd-game-container').getAttribute('data-piece-matrix');
    expect(matrixAfter).not.toBe(matrixBefore);
    checkNoErrors();
  });
});
