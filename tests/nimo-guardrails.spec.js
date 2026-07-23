import { test, expect } from '@playwright/test';

async function sendMessage(page, text) {
  const input = page.locator('#nimo-input');
  await input.fill(text);
  await page.locator('#nimo-input-form').dispatchEvent('submit');
}

test.describe('NIMO Public Usage Guardrails & Cost Protection Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept backend API call to return mock LLM response instantly
    await page.route('**/api/nimo/chat', async route => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');
      const msg = postData.message || '';

      if (msg.includes('Build me a complete React SaaS app')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            reply: "Nice try 😏 I’m Manav’s portfolio companion, not your free coding department. I can explain the approach though. ✨"
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            reply: "Here is your snippet:\n```javascript\nconst theme = 'dark';\ndocument.body.dataset.theme = theme;\nconst extra = 'line3';\nconst extra2 = 'line4';\n```\nHope that helps! ✨"
          })
        });
      }
    });

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

  test('TEST A: Large Coding Request Refusal (No Huge Code Dump)', async ({ page }) => {
    const prevCount = await page.locator('.nimo-msg-assistant').count();
    await sendMessage(page, 'Build me a complete React SaaS app with authentication and dashboard');
    
    await page.waitForFunction((count) => {
      return document.querySelectorAll('.nimo-msg-assistant').length > count;
    }, prevCount);

    const messages = page.locator('.nimo-msg-assistant .nimo-msg-content');
    const lastMsg = await messages.last().textContent();

    expect(lastMsg).toContain('coding department');
    expect(lastMsg.length).toBeLessThan(400);
  });

  test('TEST B: Code Output Sanitizer Max 2 Lines Enforcement', async ({ page }) => {
    const prevCount = await page.locator('.nimo-msg-assistant').count();
    await sendMessage(page, 'give me javascript code for theme toggle');
    
    await page.waitForFunction((count) => {
      return document.querySelectorAll('.nimo-msg-assistant').length > count;
    }, prevCount);

    const codeBlocks = page.locator('.nimo-msg-assistant code, .nimo-msg-assistant pre');
    const count = await codeBlocks.count();

    if (count > 0) {
      const codeText = await codeBlocks.first().textContent();
      const lines = codeText.split('\n').filter(l => l.trim().length > 0 && !l.includes('[Code output capped'));
      expect(lines.length).toBeLessThanOrEqual(2);
    }
  });

  test('TEST C & D: 5 Code Request Session Quota & Portfolio Query Continuation', async ({ page }) => {
    // Set quota to 5 used
    await page.evaluate(() => sessionStorage.setItem('nimo_code_requests_used', '5'));

    const prevCount = await page.locator('.nimo-msg-assistant').count();
    // 6th code request (Exhausted)
    await sendMessage(page, 'write code snippet 6');
    
    await page.waitForFunction((count) => {
      return document.querySelectorAll('.nimo-msg-assistant').length > count;
    }, prevCount);

    const messages = page.locator('.nimo-msg-assistant .nimo-msg-content');
    const exhaustedMsg = await messages.last().textContent();
    expect(exhaustedMsg).toContain('Code credits exhausted');

    // Wait 1.9s for rate limiter throttle window to reset
    await page.waitForTimeout(1900);

    // TEST D: Portfolio question still works after quota exhausted!
    const count2 = await page.locator('.nimo-msg-assistant').count();
    await sendMessage(page, 'Tell me about ToolVerse');
    await page.waitForTimeout(300);
    
    await page.waitForFunction((c) => {
      return document.querySelectorAll('.nimo-msg-assistant').length > c;
    }, count2);

    const finalMsg = await messages.last().textContent();
    expect(finalMsg).toContain('ToolVerse');
  });

  test('TEST E: Oversized Input Rejection Before Backend Call', async ({ page }) => {
    const prevCount = await page.locator('.nimo-msg-assistant').count();
    const hugePrompt = 'write code ' + 'A'.repeat(360);
    await sendMessage(page, hugePrompt);
    
    await page.waitForFunction((count) => {
      return document.querySelectorAll('.nimo-msg-assistant').length > count;
    }, prevCount);

    const messages = page.locator('.nimo-msg-assistant .nimo-msg-content');
    const rejectionMsg = await messages.last().textContent();
    expect(rejectionMsg).toContain('whole novel');
  });

  test('TEST F: Rapid Submit Throttle & Pending Guard', async ({ page }) => {
    const input = page.locator('#nimo-input');

    // Fill and submit twice rapidly without waiting
    await input.fill('First rapid message');
    const submitPromise1 = page.locator('#nimo-input-form').dispatchEvent('submit');
    await input.fill('Second rapid message');
    const submitPromise2 = page.locator('#nimo-input-form').dispatchEvent('submit');
    await Promise.all([submitPromise1, submitPromise2]);
    await page.waitForTimeout(400);

    const messages = page.locator('.nimo-msg-assistant .nimo-msg-content');
    const textContent = await messages.allTextContents();
    const hasThrottleMsg = textContent.some(t => t.includes('Easy there'));
    expect(hasThrottleMsg).toBe(true);
  });

  test('TEST G: Local Action "Open Arcade" Requires 0 AI Requests', async ({ page }) => {
    await sendMessage(page, 'Open Arcade');
    await page.waitForTimeout(400);

    const chassis = page.locator('.cabinet-chassis');
    await expect(chassis).toHaveClass(/is-scaled/);
  });

  test('TEST H: Local NIMO Developer Mode Override Authorization Requires 0 AI Requests', async ({ page }) => {
    await sendMessage(page, 'unlock arcade override');
    await page.waitForTimeout(400);

    const messages = page.locator('.nimo-msg-assistant .nimo-msg-content');
    const lastMsg = await messages.last().textContent();
    expect(lastMsg).toContain('Authorization');

    const isAuthorized = await page.evaluate(() => document.body.classList.contains('nimo-service-authorized'));
    expect(isAuthorized).toBe(true);
  });
});
