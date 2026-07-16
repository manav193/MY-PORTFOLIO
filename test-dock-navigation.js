const { assert, openPage } = require('./test-helpers');

(async () => {
  const { browser, page, errors } = await openPage({ width: 1280, height: 800 });
  try {
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    const initial = await page.evaluate(() => ({
      scaled: document.querySelector('.cabinet-chassis')?.classList.contains('is-scaled'),
      portfolioActive: document.getElementById('dock-portfolio-btn')?.classList.contains('dock-active'),
      arcadeActive: document.getElementById('dock-arcade-btn')?.classList.contains('dock-active')
    }));
    assert(!initial.scaled, 'Cabinet starts scaled.');
    assert(initial.portfolioActive && !initial.arcadeActive, 'Initial dock selection is incorrect.');

    await page.click('#dock-arcade-btn');
    await page.waitForFunction(
      () => document.querySelector('.cabinet-chassis')?.classList.contains('is-scaled')
        && window.ArcadeOS?.state === 'HOME',
      { timeout: 12000 }
    );
    const arcade = await page.evaluate(() => ({
      portfolioActive: document.getElementById('dock-portfolio-btn')?.classList.contains('dock-active'),
      arcadeActive: document.getElementById('dock-arcade-btn')?.classList.contains('dock-active'),
      apps: window.ArcadeRegistry?.getAll().length || 0,
      focusedCard: Boolean(document.querySelector('.app-card.focused'))
    }));
    assert(!arcade.portfolioActive && arcade.arcadeActive, 'Arcade dock selection did not activate.');
    assert(arcade.apps === 5 && arcade.focusedCard, 'Arcade HOME launcher is incomplete.');

    await page.click('#dock-portfolio-btn');
    await page.waitForFunction(
      () => !document.querySelector('.cabinet-chassis')?.classList.contains('is-scaled')
        && document.getElementById('dock-portfolio-btn')?.classList.contains('dock-active'),
      { timeout: 12000 }
    );
    assert(await page.evaluate(() => window.ArcadeOS?.activeApp === null), 'Portfolio exit left an app active.');

    await page.click('#dock-arcade-btn');
    await page.waitForFunction(
      () => document.querySelector('.cabinet-chassis')?.classList.contains('is-scaled')
        && window.ArcadeOS?.state === 'HOME'
        && document.getElementById('dock-arcade-btn')?.classList.contains('dock-active'),
      { timeout: 12000 }
    );
    assert(errors.length === 0, `Browser errors: ${errors.join(' | ')}`);
    console.log('PASS dock navigation: portfolio and Arcade transitions restore clean HOME state.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
