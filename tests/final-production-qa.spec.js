import { test, expect } from '@playwright/test';

const caseStudyPages = [
  'project-arcade-os.html',
  'project-love-journey.html',
  'project-nike.html',
  'project-nimo.html',
  'project-nintendo.html',
  'project-promptai.html',
  'project-selfyy.html',
  'project-shift-zero.html',
  'project-toolverse.html',
  'project-velora-bites.html'
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'tablet portrait', width: 768, height: 1024, mobile: true },
  { name: 'mobile portrait', width: 390, height: 844, mobile: true },
  { name: 'mobile landscape', width: 844, height: 390, mobile: true }
];

function captureRuntimeFailures(page) {
  const pageErrors = [];
  const consoleErrors = [];
  const failedLocalRequests = [];

  page.on('pageerror', error => pageErrors.push(error.message || String(error)));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === 'localhost' && ['8085', '8091'].includes(url.port) && response.status() >= 400) {
      failedLocalRequests.push(`${response.status()} ${url.pathname}`);
    }
  });
  page.on('requestfailed', request => {
    const url = new URL(request.url());
    if (url.hostname === 'localhost' && ['8085', '8091'].includes(url.port)) {
      failedLocalRequests.push(`${request.failure()?.errorText || 'FAILED'} ${url.pathname}`);
    }
  });

  return { pageErrors, consoleErrors, failedLocalRequests };
}

async function waitForPortfolio(page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => typeof window.ArcadeExperience?.getState === 'function');
}

async function enterArcade(page) {
  await page.evaluate(() => window.ArcadeExperience.enterArcadeExperience('dock'));
  await page.waitForFunction(
    () => window.ArcadeExperience?.getState() === 'ARCADE_HOME' && window.ArcadeOS?.state === 'HOME',
    null,
    { timeout: 8000 }
  );
}

test.describe('Final production QA', () => {
  test('home navigation, download, project links, and local assets resolve', async ({ page, request }) => {
    const failures = captureRuntimeFailures(page);
    await waitForPortfolio(page);

    const navigation = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      const localHtml = [...new Set(links
        .map(link => link.getAttribute('href'))
        .filter(href => href && !href.includes('://') && /\.html(?:#.*)?$/i.test(href))
        .map(href => href.split('#')[0].replace(/^\/+/, '')))];
      const hashTargets = [...new Set(links
        .map(link => link.getAttribute('href'))
        .filter(href => href?.startsWith('#') && href.length > 1))];
      const missingHashTargets = hashTargets.filter(hash => !document.querySelector(hash));
      const external = links
        .map(link => link.href)
        .filter(href => /^https?:/i.test(href) && !href.startsWith(location.origin));
      return { localHtml, missingHashTargets, external };
    });

    expect(navigation.missingHashTargets).toEqual([]);
    for (const path of caseStudyPages) {
      expect(navigation.localHtml, `${path} is not linked from the portfolio`).toContain(path);
    }
    for (const path of navigation.localHtml) {
      const response = await request.get(`/${path}`);
      expect(response.ok(), `${path} did not return HTTP success`).toBe(true);
    }
    expect(navigation.external.some(href => href === 'https://github.com/manav193')).toBe(true);

    const resumeResponse = await request.get('/Manav-Agarwal-Resume.pdf');
    expect(resumeResponse.ok()).toBe(true);
    expect(resumeResponse.headers()['content-type']).toContain('pdf');
    expect((await resumeResponse.body()).byteLength).toBeGreaterThan(1_000);

    await page.waitForLoadState('networkidle');
    expect(failures.pageErrors).toEqual([]);
    expect(failures.consoleErrors).toEqual([]);
    expect(failures.failedLocalRequests).toEqual([]);
  });

  test('every case-study page keeps the shared shell, valid assets, and accessible structure', async ({ page }) => {
    test.setTimeout(120_000);

    for (const path of caseStudyPages) {
      const failures = captureRuntimeFailures(page);
      const response = await page.goto(`/${path}`);
      expect(response?.ok(), `${path} did not return HTTP success`).toBe(true);
      await page.waitForLoadState('networkidle');

      expect(await page.title(), `${path} has an empty title`).not.toBe('');
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('.os-dock')).toBeVisible();
      await expect(page.locator('#nimo-widget')).toBeAttached();

      const structure = await page.evaluate(() => {
        const ids = Array.from(document.querySelectorAll('[id]')).map(element => element.id);
        const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
        const missingAlt = Array.from(document.images)
          .filter(image => !image.hasAttribute('alt'))
          .map(image => image.currentSrc || image.src);
        const unnamedControls = Array.from(document.querySelectorAll('button, a[href], input, textarea, select'))
          .filter(element => {
            if (element.matches('input[type="hidden"]')) return false;
            const label = element.getAttribute('aria-label')
              || element.getAttribute('title')
              || element.textContent
              || element.getAttribute('placeholder')
              || (element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`)?.textContent);
            return !String(label || '').trim();
          })
          .map(element => element.outerHTML.slice(0, 160));
        return { duplicateIds, missingAlt, unnamedControls };
      });

      expect(structure.duplicateIds, `${path} contains duplicate IDs`).toEqual([]);
      expect(structure.missingAlt, `${path} contains images without alt text`).toEqual([]);
      expect(structure.unnamedControls, `${path} contains unnamed controls`).toEqual([]);
      expect(failures.pageErrors, `${path} raised uncaught errors`).toEqual([]);
      expect(failures.consoleErrors, `${path} logged console errors`).toEqual([]);
      expect(failures.failedLocalRequests, `${path} requested missing local assets`).toEqual([]);
    }
  });

  test('full-resolution case-study media loads near the viewport instead of all at once', async ({ page }) => {
    const failures = captureRuntimeFailures(page);
    await page.goto('/assets/case-studies/veldora-bites.html');
    await page.waitForLoadState('networkidle');

    const initialStates = await page.locator('img[data-fullres-src]').evaluateAll(images =>
      images.map(image => image.dataset.fullresState)
    );
    expect(initialStates.filter(state => state === 'loaded' || state === 'loading').length).toBeLessThanOrEqual(2);
    expect(initialStates.filter(state => state === 'pending').length).toBeGreaterThanOrEqual(5);

    const lastImage = page.locator('img[data-fullres-src]').last();
    await lastImage.scrollIntoViewIfNeeded();
    await expect(lastImage).toHaveAttribute('data-fullres-state', 'loaded', { timeout: 10_000 });
    expect(failures.pageErrors).toEqual([]);
    expect(failures.consoleErrors).toEqual([]);
    expect(failures.failedLocalRequests).toEqual([]);
  });

  test('all system routes open, accept keyboard navigation, close, and reopen cleanly', async ({ page }) => {
    test.setTimeout(120_000);
    const failures = captureRuntimeFailures(page);
    await waitForPortfolio(page);
    await enterArcade(page);

    const routes = await page.evaluate(() => Object.keys(window.SYSTEM_ROUTES || {}));
    expect(routes.sort()).toEqual([
      'ACHIEVEMENTS',
      'CUSTOMIZE',
      'DIAGNOSTICS',
      'PALETTE',
      'PROFILE',
      'RECORDS',
      'SETTINGS',
      'SOUNDLAB',
      'STATS'
    ]);

    for (let pass = 0; pass < 2; pass += 1) {
      for (const route of routes) {
        await page.evaluate(routeName => window.ArcadeOS.routeTo(routeName), route);
        await page.waitForFunction(
          routeName => window.ArcadeOS?.state === routeName
            && document.getElementById('arcade-app-view')?.dataset.routeStatus === 'ready',
          route,
          { timeout: 8000 }
        );

        const routeState = await page.locator('#arcade-app-view').evaluate(view => ({
          textLength: (view.textContent || '').trim().length,
          childCount: view.childElementCount,
          hasCanvas: Boolean(view.querySelector('canvas')),
          loading: Boolean(view.querySelector('.route-loading-state')),
          error: Boolean(view.querySelector('.route-error-state'))
        }));
        expect(
          routeState.textLength > 10 || routeState.hasCanvas,
          `${route} rendered neither readable content nor a canvas`
        ).toBe(true);
        expect(routeState.childCount, `${route} rendered no elements`).toBeGreaterThan(0);
        expect(routeState.loading, `${route} remained in its loading state`).toBe(false);
        expect(routeState.error, `${route} rendered an error state`).toBe(false);

        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 5000 });
      }
    }

    expect(failures.pageErrors).toEqual([]);
    expect(failures.consoleErrors).toEqual([]);
    expect(failures.failedLocalRequests).toEqual([]);
  });

  for (const viewport of viewports) {
    test(`${viewport.name} viewport keeps portfolio and active gameplay within horizontal bounds`, async ({ page }) => {
      test.setTimeout(60_000);
      const failures = captureRuntimeFailures(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForPortfolio(page);

      const portfolioGeometry = await page.evaluate(() => ({
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        dockVisible: Boolean(document.querySelector('.os-dock')),
        h1Visible: Boolean(document.querySelector('h1'))
      }));
      expect(portfolioGeometry.documentWidth - portfolioGeometry.viewportWidth).toBeLessThanOrEqual(1);
      expect(portfolioGeometry.dockVisible).toBe(true);
      expect(portfolioGeometry.h1Visible).toBe(true);

      await enterArcade(page);
      await page.evaluate(() => window.ArcadeOS.launchApp('vectordrift'));
      await page.waitForFunction(
        () => window.ArcadeOS?.state === 'APP' && window.ArcadeOS?.activeApp?._rawAppId === 'vectordrift',
        { timeout: 8000 }
      );
      await page.keyboard.press('Space');
      await page.waitForTimeout(150);

      const gameGeometry = await page.evaluate(() => {
        const view = document.getElementById('arcade-app-view');
        const canvas = view?.querySelector('canvas');
        const safe = window.ArcadeViewport?.getGameSafeRect?.() || window.getArcadeGameSafeRect?.();
        const canvasRect = canvas?.getBoundingClientRect();
        const viewRect = view?.getBoundingClientRect();
        const dock = document.querySelector('.os-dock');
        const dockRect = dock?.getBoundingClientRect();
        const dockVisible = dock && getComputedStyle(dock).visibility !== 'hidden'
          && getComputedStyle(dock).opacity !== '0';
        return {
          hasCanvas: Boolean(canvas),
          safe,
          canvasRect: canvasRect && {
            left: canvasRect.left,
            right: canvasRect.right,
            top: canvasRect.top,
            bottom: canvasRect.bottom,
            width: canvasRect.width,
            height: canvasRect.height
          },
          viewRect: viewRect && {
            left: viewRect.left,
            right: viewRect.right,
            top: viewRect.top,
            bottom: viewRect.bottom
          },
          viewportHeight: window.innerHeight,
          dockOverlapsGame: Boolean(dockVisible && dockRect && canvasRect
            && dockRect.left < canvasRect.right
            && dockRect.right > canvasRect.left
            && dockRect.top < canvasRect.bottom
            && dockRect.bottom > canvasRect.top),
          touchSurfaceReady: getComputedStyle(view).touchAction !== 'auto'
        };
      });

      expect(gameGeometry.hasCanvas).toBe(true);
      expect(gameGeometry.canvasRect.width).toBeGreaterThan(180);
      expect(gameGeometry.canvasRect.height).toBeGreaterThan(130);
      expect(gameGeometry.canvasRect.left).toBeGreaterThanOrEqual(gameGeometry.viewRect.left - 1);
      expect(gameGeometry.canvasRect.right).toBeLessThanOrEqual(gameGeometry.viewRect.right + 1);
      expect(gameGeometry.canvasRect.top).toBeGreaterThanOrEqual(gameGeometry.viewRect.top - 1);
      expect(gameGeometry.canvasRect.bottom).toBeLessThanOrEqual(gameGeometry.viewRect.bottom + 1);
      expect(gameGeometry.viewRect.top).toBeLessThan(gameGeometry.viewportHeight);
      expect(gameGeometry.viewRect.bottom).toBeGreaterThan(0);
      expect(gameGeometry.dockOverlapsGame).toBe(false);
      const canvas = page.locator('#arcade-app-view canvas');
      await canvas.dispatchEvent('pointerdown', { pointerId: 7, clientX: 220, clientY: 160, bubbles: true });
      expect(await page.evaluate(() => window.ArcadeInput.isDown('PRIMARY'))).toBe(true);
      await canvas.dispatchEvent('pointermove', { pointerId: 7, clientX: 270, clientY: 160, bubbles: true });
      expect(await page.evaluate(() => window.ArcadeInput.isDown('RIGHT'))).toBe(true);
      await canvas.dispatchEvent('pointerup', { pointerId: 7, clientX: 270, clientY: 160, bubbles: true });
      expect(await page.evaluate(() => ({
        primary: window.ArcadeInput.isDown('PRIMARY'),
        right: window.ArcadeInput.isDown('RIGHT')
      }))).toEqual({ primary: false, right: false });

      await page.keyboard.press('Escape');
      await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME');
      expect(failures.pageErrors).toEqual([]);
      expect(failures.consoleErrors).toEqual([]);
      expect(failures.failedLocalRequests).toEqual([]);
    });
  }

  test('app teardown releases active instances and keeps registries stable', async ({ page }) => {
    test.setTimeout(90_000);
    const failures = captureRuntimeFailures(page);
    await waitForPortfolio(page);
    await enterArcade(page);

    const baseline = await page.evaluate(() => ({
      registry: window.ArcadeRegistry.getAll().length,
      cards: document.querySelectorAll('#home-carousel .app-card').length,
      eventListeners: Object.values(window.ArcadeEventBus?.listeners || {})
        .reduce((total, listeners) => total + listeners.length, 0)
    }));
    const appIds = await page.evaluate(() => window.ArcadeRegistry.getAll().map(app => app.id));

    for (const appId of appIds) {
      await page.evaluate(id => window.ArcadeOS.launchApp(id), appId);
      await page.waitForFunction(
        id => window.ArcadeOS?.state === 'APP' && window.ArcadeOS?.activeApp?._rawAppId === id,
        appId
      );
      await page.keyboard.press('Space');
      await page.waitForTimeout(80);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME');

      const teardown = await page.evaluate(() => ({
        activeApp: window.ArcadeOS.activeApp,
        registry: window.ArcadeRegistry.getAll().length,
        uniqueRegistry: new Set(window.ArcadeRegistry.getAll().map(app => app.id)).size,
        cards: document.querySelectorAll('#home-carousel .app-card').length,
        appViewChildren: document.getElementById('arcade-app-view')?.childElementCount || 0
      }));
      expect(teardown.activeApp, `${appId} retained an active app after exit`).toBeNull();
      expect(teardown.registry).toBe(baseline.registry);
      expect(teardown.uniqueRegistry).toBe(baseline.registry);
      expect(teardown.cards).toBe(baseline.cards);
      expect(teardown.appViewChildren, `${appId} retained app DOM after exit`).toBe(0);
    }

    expect(failures.pageErrors).toEqual([]);
    expect(failures.consoleErrors).toEqual([]);
    expect(failures.failedLocalRequests).toEqual([]);
  });

  test('warm lifecycle remains bounded after repeated apps and system routes', async ({ page, context }) => {
    test.setTimeout(120_000);
    const failures = captureRuntimeFailures(page);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    await cdp.send('HeapProfiler.enable');

    const collectMetrics = async () => {
      await cdp.send('HeapProfiler.collectGarbage');
      const result = await cdp.send('Performance.getMetrics');
      return Object.fromEntries(result.metrics.map(metric => [metric.name, metric.value]));
    };

    await waitForPortfolio(page);
    await enterArcade(page);
    const appIds = await page.evaluate(() => window.ArcadeRegistry.getAll().map(app => app.id));
    const routes = await page.evaluate(() => Object.keys(window.SYSTEM_ROUTES || {}));

    const runWarmCycle = async () => {
      for (const appId of appIds) {
        await page.evaluate(id => window.ArcadeOS.launchApp(id), appId);
        await page.waitForFunction(
          id => window.ArcadeOS?.state === 'APP' && window.ArcadeOS?.activeApp?._rawAppId === id,
          appId
        );
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME');
      }
      for (const route of routes) {
        await page.evaluate(routeName => window.ArcadeOS.routeTo(routeName), route);
        await page.waitForFunction(
          routeName => window.ArcadeOS?.state === routeName
            && document.getElementById('arcade-app-view')?.dataset.routeStatus === 'ready',
          route
        );
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME');
      }
    };

    await runWarmCycle();
    const baseline = await collectMetrics();
    await runWarmCycle();
    const after = await collectMetrics();

    expect(after.Documents).toBe(baseline.Documents);
    expect(after.Nodes - baseline.Nodes).toBeLessThan(250);
    expect(after.JSEventListeners - baseline.JSEventListeners).toBeLessThan(20);
    expect(after.JSHeapUsedSize - baseline.JSHeapUsedSize).toBeLessThan(5 * 1024 * 1024);
    expect(failures.pageErrors).toEqual([]);
    expect(failures.consoleErrors).toEqual([]);
    expect(failures.failedLocalRequests).toEqual([]);
  });
});
