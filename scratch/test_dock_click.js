import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8085/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  console.log('Clicking work dock item...');
  await page.locator('.dock-item[data-dock-action="work"]').click();
  await page.waitForTimeout(400);

  const state = await page.evaluate(() => {
    const work = document.getElementById('work');
    const workItem = document.querySelector('.dock-item[data-dock-action="work"]');
    const introItem = document.querySelector('.dock-item[data-dock-action="portfolio-intro"]');
    return {
      scrollY: window.scrollY,
      workTop: work ? work.getBoundingClientRect().top : null,
      workActive: workItem ? workItem.classList.contains('dock-active') : false,
      introActive: introItem ? introItem.classList.contains('dock-active') : false,
      activeAction: window.activeAction || null
    };
  });

  console.log('CLICK RESULT:', JSON.stringify(state, null, 2));
  await browser.close();
})();
