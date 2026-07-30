import { test, expect } from '@playwright/test';

const repository = 'https://github.com/manav193/ARCADE-OS';

test.describe('Standalone ArcadeOS portfolio bridge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.ArcadeStandalone?.repository);
  });

  test('exposes a verified public repository contract', async ({ page }) => {
    const contract = await page.evaluate(() => ({
      repository: window.ArcadeStandalone.repository,
      openRepository: typeof window.ArcadeStandalone.openRepository,
      refresh: typeof window.ArcadeStandalone.refresh,
      state: document.documentElement.dataset.arcadeStandaloneBridge
    }));

    expect(contract).toEqual({
      repository,
      openRepository: 'function',
      refresh: 'function',
      state: 'ready'
    });
  });

  test('relinks the ArcadeOS project card without replacing cabinet entry', async ({ page }) => {
    const card = page.locator('[data-project-id="arcade-os"]');
    await expect(card).toHaveAttribute('data-standalone-linked', 'true');
    await expect(card.locator('h3')).toContainText('Standalone Browser System');

    const source = card.locator('[data-launch-standalone-arcade]').first();
    await expect(source).toHaveAttribute('href', repository);
    await expect(source).toHaveAttribute('target', '_blank');
    await expect(source).toHaveAttribute('rel', /noopener/);
    await expect(card.locator('[data-enter-arcade]')).toContainText('View Cabinet Experience');
  });

  test('mounts cabinet source status and boot action idempotently', async ({ page }) => {
    await expect(page.locator('[data-standalone-link-panel]')).toHaveCount(1);
    await expect(page.locator('.boot-choice [data-launch-standalone-arcade]')).toHaveCount(1);

    await page.evaluate(() => window.ArcadeStandalone.refresh());
    await expect(page.locator('[data-standalone-link-panel]')).toHaveCount(1);
    await expect(page.locator('.boot-choice [data-launch-standalone-arcade]')).toHaveCount(1);
  });

  test('repairs bridge elements after a dynamic portfolio rerender', async ({ page }) => {
    await page.evaluate(() => {
      document.querySelector('[data-standalone-link-panel]')?.remove();
      document.querySelector('[data-project-id="arcade-os"] [data-launch-standalone-arcade]')?.remove();
      document.querySelector('[data-project-id="arcade-os"]')?.appendChild(document.createElement('i'));
    });

    await expect(page.locator('[data-standalone-link-panel]')).toHaveCount(1);
    await expect(page.locator('[data-project-id="arcade-os"] [data-launch-standalone-arcade]')).toHaveCount(1);
  });
});
