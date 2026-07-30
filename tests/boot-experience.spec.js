import { test, expect } from '@playwright/test';

const installEventCapture = async (page, scale = 0.4) => {
  await page.addInitScript(testScale => {
    window.__ARCADE_BOOT_TEST_SCALE__ = testScale;
    window.__bootEvents = [];
    window.addEventListener('nimo:project-event', event => window.__bootEvents.push(event.detail));
  }, scale);
};

test.describe('Arcade OS boot experience', () => {
  test('first session runs the full ordered boot once', async ({ page }) => {
    await installEventCapture(page);
    await page.goto('/');
    await page.waitForFunction(() => window.__arcadeBootExperience?.mode === 'full');
    await page.waitForFunction(() => window.__bootEvents.some(event => event.type === 'systemBootCompleted'));
    const events = await page.evaluate(() => window.__bootEvents.map(event => event.type));
    expect(events).toEqual([
      'systemBootStarted', 'nimoCoreOnline', 'moduleRegistryReady', 'toolVerseRegistered', 'systemBootCompleted'
    ]);
    expect(new Set(events).size).toBe(events.length);
  });

  test('repeat visit uses the reduced returning sequence', async ({ page }) => {
    await installEventCapture(page);
    await page.goto('/');
    await expect(page.locator('.system-boot')).toHaveCount(0, { timeout: 3000 });
    await page.reload();
    await page.waitForFunction(() => window.__arcadeBootExperience?.mode === 'returning');
    await expect(page.locator('.system-boot')).toHaveCount(0, { timeout: 2000 });
  });

  test('skip control unlocks UI and leaves predictable focus', async ({ page }) => {
    await installEventCapture(page, 5);
    await page.goto('/');
    await page.locator('.system-boot__skip').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.system-boot')).toHaveCount(0, { timeout: 2000 });
    await expect(page.locator('body')).not.toHaveClass(/system-boot-active/);
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('boot module failure leaves rendered content usable', async ({ page }) => {
    await page.route('**/js/modules/boot-experience.js', route => route.abort());
    await page.goto('/');
    await expect(page.locator('.system-boot')).toHaveCount(0);
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('body')).not.toHaveCSS('opacity', '0');
  });

  test('safety timeout removes the overlay and emits completion once', async ({ page }) => {
    await page.addInitScript(() => {
      window.__ARCADE_BOOT_TEST_TIMEOUT__ = 70;
      window.__bootEvents = [];
      window.addEventListener('nimo:project-event', event => window.__bootEvents.push(event.detail));
    });
    await page.goto('/');
    await expect(page.locator('.system-boot')).toHaveCount(0, { timeout: 2000 });
    const completed = await page.evaluate(() => window.__bootEvents.filter(event => event.type === 'systemBootCompleted'));
    expect(completed).toHaveLength(1);
    expect(completed[0].detail.reason).toBe('safety-timeout');
  });

  test('reduced motion uses opacity-only boot behavior', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      window.__ARCADE_BOOT_TEST_SCALE__ = 2;
      window.__bootEvents = [];
      window.addEventListener('nimo:project-event', event => window.__bootEvents.push(event.detail));
    });
    await page.goto('/');
    await page.waitForFunction(() => window.__arcadeBootExperience?.reducedMotion === true);
    await page.waitForFunction(() => window.__bootEvents.some(event => event.type === 'systemBootCompleted'));
    const reason = await page.evaluate(() => window.__bootEvents.find(event => event.type === 'systemBootCompleted')?.detail.reason);
    expect(reason).toBe('reduced-motion');
    await expect(page.locator('.system-boot')).toHaveCount(0, { timeout: 2000 });
  });

  test('mobile boot never introduces horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installEventCapture(page);
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('internal case-study navigation never starts a new boot', async ({ page }) => {
    await installEventCapture(page);
    await page.goto('/');
    await expect(page.locator('.system-boot')).toHaveCount(0, { timeout: 3000 });
    await page.goto('/project-nimo.html');
    await expect(page.locator('.system-boot')).toHaveCount(0);
    await expect(page.locator('main.cs-premium-layout')).toBeVisible();
  });
});
