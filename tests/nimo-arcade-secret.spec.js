import { test, expect } from '@playwright/test';

async function sendMessage(page, text) {
  const input = page.locator('#nimo-input');
  await input.fill(text);
  await page.locator('#nimo-input-form').dispatchEvent('submit');
  await page.waitForTimeout(350);
}

test.describe('NIMO Arcade Secret Tease & Intent Routing Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8085/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(300);

    // Open NIMO panel cleanly
    await page.evaluate(() => {
      if (window.NIMO && typeof window.NIMO.openNimo === 'function') {
        window.NIMO.openNimo();
      }
    });
    await page.waitForTimeout(200);
  });

  test('TEST 1: "Do you know any Arcade secrets?" triggers secret tease without card or authorization', async ({ page }) => {
    await sendMessage(page, 'Do you know any Arcade secrets?');

    const messages = page.locator('.nimo-msg-assistant .nimo-msg-content');
    const lastMsg = await messages.last().textContent();

    // Check desired mysterious tease text
    expect(lastMsg).toContain('service layer most visitors never see');

    // MUST NOT contain project information card
    expect(lastMsg).not.toContain('MY-PORTFOLIO / ArcadeOS');
    expect(lastMsg).not.toContain('Tech:');

    // Developer authorized MUST BE FALSE
    const isAuthorized = await page.evaluate(() => document.body.classList.contains('nimo-service-authorized'));
    expect(isAuthorized).toBe(false);
  });

  test('TEST 2: "Show deeper Arcade secret" immediately after triggers override & Developer Mode', async ({ page }) => {
    // First message: Tease
    await sendMessage(page, 'Do you know any Arcade secrets?');

    await page.waitForTimeout(1900); // Throttle window reset

    // Second message: Override
    await sendMessage(page, 'Show deeper Arcade secret');

    const messages = page.locator('.nimo-msg-assistant .nimo-msg-content');
    const lastMsg = await messages.last().textContent();

    expect(lastMsg).toContain('Override accepted');
    expect(lastMsg).toContain('Authorization');

    // Developer authorized MUST BE TRUE
    const isAuthorized = await page.evaluate(() => document.body.classList.contains('nimo-service-authorized'));
    expect(isAuthorized).toBe(true);
  });

  test('TEST 3: "Tell me about ArcadeOS" still triggers normal project information card', async ({ page }) => {
    await sendMessage(page, 'Tell me about ArcadeOS');

    const messages = page.locator('.nimo-msg-assistant .nimo-msg-content');
    const lastMsg = await messages.last().textContent();

    expect(lastMsg).toContain('ArcadeOS');
    expect(lastMsg).toContain('Tech:');
  });

  test('TEST 4: "Open Arcade" still triggers normal Arcade navigation', async ({ page }) => {
    await sendMessage(page, 'Open Arcade');
    await page.waitForTimeout(400);

    const chassis = page.locator('.cabinet-chassis');
    await expect(chassis).toHaveClass(/is-scaled/);
  });
});
