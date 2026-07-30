import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const viewports = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 }
];

const keyPages = [
  { name: 'homepage', path: '/index.html' },
  { name: 'nimo', path: '/project-nimo.html' },
  { name: 'arcadeos', path: '/project-arcade-os.html' },
  { name: 'toolverse', path: '/project-toolverse.html' },
  { name: 'velora', path: '/project-velora-bites.html' }
];

fs.mkdirSync('test-results/visual-regression', { recursive: true });

for (const viewport of viewports) {
  test(`homepage smoke ${viewport.name}`, async ({ page }) => {
    const uncaught = [];
    page.on('pageerror', error => uncaught.push(error.message));
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const response = await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('main, #main-content').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBeTruthy();
    expect(uncaught, `Uncaught errors at ${viewport.name}: ${uncaught.join(' | ')}`).toEqual([]);
  });
}

for (const item of keyPages) {
  test(`${item.name} console gate and screenshot`, async ({ page }) => {
    const uncaught = [];
    const severeConsole = [];
    page.on('pageerror', error => uncaught.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && !/favicon|third-party|net::ERR_BLOCKED_BY_CLIENT/i.test(message.text())) severeConsole.push(message.text());
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    const response = await page.goto(item.path, { waitUntil: 'networkidle' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: `test-results/visual-regression/${item.name}.png`, fullPage: true, animations: 'disabled' });
    expect(uncaught, `Uncaught errors: ${uncaught.join(' | ')}`).toEqual([]);
    expect(severeConsole, `Console errors: ${severeConsole.join(' | ')}`).toEqual([]);
  });
}
