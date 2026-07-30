import { test, expect } from '@playwright/test';

test.describe('NIMO shared-core Phase 1 compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => Boolean(window.NIMO?.sharedCore));
  });

  test('exposes deterministic shared intelligence without executing host navigation', async ({ page }) => {
    const before = page.url();
    const response = await page.evaluate(() => window.NIMO.processSharedQuery('Open ToolVerse'));
    expect(response.intent).toBe('open_entity');
    expect(response.actions[0]).toMatchObject({ type: 'navigate', target: 'https://tool-verse-theta.vercel.app/' });
    expect(response.executed).toBe(false);
    expect(page.url()).toBe(before);
    await expect(page.locator('body')).not.toHaveClass(/arcade-active/);
  });

  test('keeps the existing widget and multilingual host intent path operational', async ({ page }) => {
    await expect(page.locator('#nimo-widget')).toHaveCount(1);
    const legacy = await page.evaluate(() => window.NIMO.processUserQuery('ToolVerse ke baare mein batao'));
    expect(legacy.text).toContain('ToolVerse');
    const shared = await page.evaluate(() => window.NIMO.processSharedQuery('ToolVerse ke baare mein batao'));
    expect(shared.language).toBe('hinglish');
    expect(shared.entity.id).toBe('toolverse');
  });

  test('discovers locally registered ecosystem modules from manifests', async ({ page }) => {
    const results = await page.evaluate(() => ({
      modules: window.NIMO.projectFederation.getModules().map(module => module.id),
      image: window.NIMO.searchProjects('compress image')[0]?.module.id,
      gravity: window.NIMO.searchProjects('gravity game')[0]?.module.id,
      restaurant: window.NIMO.searchProjects('restaurant')[0]?.module.id,
      portfolio: window.NIMO.searchProjects('portfolio')[0]?.module.id
    }));
    expect(results.modules).toEqual(expect.arrayContaining(['arcade-os', 'nimo', 'toolverse', 'shift-zero', 'velora-bites']));
    expect(results).toMatchObject({ image: 'toolverse', gravity: 'shift-zero', restaurant: 'velora-bites', portfolio: 'arcade-os' });
  });
});
