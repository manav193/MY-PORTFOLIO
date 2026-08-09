import { test, expect } from '@playwright/test';

const desktopViewports = [
  { width: 1920, height: 1080 },
  { width: 1600, height: 900 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 }
];

const getCabinetGeometry = async (page) => page.evaluate(() => {
  const rect = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const { x, y, width, height, right, bottom } = element.getBoundingClientRect();
    return { x, y, width, height, right, bottom };
  };

  return {
    bezel: rect('.cabinet-screen-bezel'),
    screen: rect('.screen-content-layer'),
    deck: rect('.cab-control-deck'),
    rotate: rect('[data-cabinet-rotate]'),
    root: rect('.cabinet-framing-root'),
    screenInVolume: Boolean(document.querySelector('.cab-3d-volume .screen-2d-anchor')),
    frameScale: Number.parseFloat(getComputedStyle(document.querySelector('.cabinet-framing-root')).getPropertyValue('--frame-scale')),
    rotation: getComputedStyle(document.querySelector('.cab-3d-volume')).getPropertyValue('--cab-rot-y').trim()
  };
});

const expectScreenInsideBezel = (geometry) => {
  const tolerance = 4;
  expect(geometry.screen.x).toBeGreaterThanOrEqual(geometry.bezel.x - tolerance);
  expect(geometry.screen.y).toBeGreaterThanOrEqual(geometry.bezel.y - tolerance);
  expect(geometry.screen.right).toBeLessThanOrEqual(geometry.bezel.right + tolerance);
  expect(geometry.screen.bottom).toBeLessThanOrEqual(geometry.bezel.bottom + tolerance);
};

test.describe('Cabinet framing ownership and geometry', () => {
  for (const viewport of desktopViewports) {
    test(`keeps the live screen attached at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.waitForFunction(() => document.documentElement.dataset.cabinetEnabled === 'true');
      await page.waitForTimeout(250);

      const maintenanceMode = await page.evaluate(() => document.body.classList.contains('arcade-maintenance-mode'));
      if (maintenanceMode) {
        await expect(page.locator('.arcade-maintenance-section')).toBeVisible();
        return;
      }

      const initial = await getCabinetGeometry(page);
      expect(initial.screenInVolume).toBe(true);
      expect(initial.frameScale).toBeGreaterThanOrEqual(0.66);
      expect(initial.frameScale).toBeLessThanOrEqual(1.16);
      expect(initial.rotate.width).toBeGreaterThan(0);
      expect(initial.rotate.height).toBeGreaterThan(0);
      expectScreenInsideBezel(initial);

      await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.8));
      await page.waitForTimeout(550);
      const scrolled = await getCabinetGeometry(page);
      expect(scrolled.frameScale).toBeLessThan(initial.frameScale);
      expectScreenInsideBezel(scrolled);
    });
  }

  test('keeps rotation on the cabinet volume without rewriting the framing transform', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.dataset.cabinetEnabled === 'true');

    const maintenanceMode = await page.evaluate(() => document.body.classList.contains('arcade-maintenance-mode'));
    if (maintenanceMode) {
      await expect(page.locator('.arcade-maintenance-section')).toBeVisible();
      await expect(page.locator('[data-cabinet-rotate]')).not.toBeVisible();
      return;
    }

    const rotateButton = page.locator('[data-cabinet-rotate]');
    await expect(rotateButton).toHaveCount(1);
    await rotateButton.click();
    await page.waitForTimeout(700);

    const transformState = await page.evaluate(() => ({
      rootRotation: getComputedStyle(document.querySelector('.cabinet-framing-root')).getPropertyValue('--cab-rot-y').trim(),
      volumeRotation: getComputedStyle(document.querySelector('.cab-3d-volume')).getPropertyValue('--cab-rot-y').trim(),
      screenInVolume: Boolean(document.querySelector('.cab-3d-volume .screen-2d-anchor'))
    }));
    expect(transformState.rootRotation).toBe('');
    expect(transformState.volumeRotation).toBe('25deg');
    expect(transformState.screenInVolume).toBe(true);
  });
});
