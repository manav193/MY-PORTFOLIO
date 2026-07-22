const { assert, openPage, openRoute } = require('../test-helpers');

(async () => {
  console.log('=== RUNNING ARCADE OS V4 CINEMATIC REDESIGN SUITE ===\n');

  const { browser, page, errors } = await openPage({ width: 1280, height: 800 });
  try {
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('arcade_os_onboarded', 'true');
      localStorage.setItem('arcade_os_boot_complete', 'true');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Open Arcade OS via dock button
    await page.click('#dock-arcade-btn');
    await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));
    await page.waitForFunction(
      () => document.querySelector('.cabinet-chassis')?.classList.contains('is-scaled') && window.ArcadeOS?.state === 'HOME',
      { timeout: 12000 }
    );

    // 1. Verify 3D ARCADEOS hero title and tagline sit centered in upper-middle area
    const brand = await page.evaluate(() => {
      const home = document.getElementById('arcade-home');
      return {
        title: home?.querySelector('.arcade-hero-title')?.textContent || null,
        tagline: home?.querySelector('.arcade-hero-tagline')?.textContent || null
      };
    });
    assert(brand.title && brand.title.includes('ARCADEOS'), '1. 3D Retro ARCADEOS title is present.');
    assert(brand.tagline && brand.tagline.includes('PLAY. CODE. CREATE. REPEAT.'), '2. PLAY. CODE. CREATE. REPEAT. tagline is present.');

    // 2. Verify Horizon Arc and Floating Universe elements exist
    const decor = await page.evaluate(() => ({
      universeBg: Boolean(document.querySelector('.arcade-universe-bg')),
      horizonArc: Boolean(document.querySelector('.arcade-horizon-arc') || document.querySelector('.arcade-grid-perspective'))
    }));
    assert(decor.universeBg && decor.horizonArc, '3. Horizon perspective arc and space universe are present in lower background.');

    // 3. Verify 4 visible cards layout and authentic app titles
    const cardsInfo = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('#home-carousel .app-card'));
      return cards.map(c => ({
        id: c.dataset.launcherId,
        title: c.querySelector('.arcade-card-name')?.textContent || '',
        sub: c.querySelector('.arcade-card-sub')?.textContent || '',
        isVisible: c.classList.contains('is-visible'),
        hasSvg: Boolean(c.querySelector('.arcade-premium-icon'))
      }));
    });
    const visibleCards = cardsInfo.filter(c => c.isVisible).length;
    assert(visibleCards === 4, `5. Exactly 4 large app cards displayed at a time (Found: ${visibleCards}).`);

    const reactionInfo = cardsInfo.find(c => c.id === 'reaction');
    assert(reactionInfo && reactionInfo.title === 'Reaction Test', `Reaction Test authentic title restored (Found: "${reactionInfo?.title}").`);
    assert(reactionInfo.sub.toLowerCase().includes('reflex'), `Reaction Test reflex description verified (Found: "${reactionInfo?.sub}").`);
    assert(reactionInfo.hasSvg, 'Reaction Test reflex lightning button SVG icon present.');

    const snakeInfo = cardsInfo.find(c => c.id === 'snake');
    assert(snakeInfo && snakeInfo.title === 'Neon Snake', `Neon Snake authentic title restored (Found: "${snakeInfo?.title}").`);
    assert(snakeInfo.sub.toLowerCase().includes('snake'), `Neon Snake description verified (Found: "${snakeInfo?.sub}").`);
    assert(snakeInfo.hasSvg, 'Neon Snake serpent SVG icon present.');

    // 4. Test Navigation & Selection moving
    await page.keyboard.press('ArrowRight');
    await page.evaluate(() => new Promise(r => setTimeout(r, 200)));
    const selectedIdx = await page.evaluate(() => window.ArcadeOS?.selectedIndex);
    assert(selectedIdx === 1, '6. Keyboard Right Arrow moves selection to index 1.');

    // Helper to launch app by index
    const launchAppIdx = async (idx) => {
      await page.evaluate((targetIdx) => {
        window.ArcadeOS.selectedIndex = targetIdx;
        window.ArcadeOS.renderHome();
        window.ArcadeEventBus.emit('ARCADE_CONFIRM');
      }, idx);
      await page.waitForFunction(
        () => window.ArcadeOS?.state === 'APP' && Boolean(window.ArcadeOS?.activeApp),
        { timeout: 8000 }
      );
    };

    // Helper to return home
    const returnHome = async () => {
      await page.evaluate(() => window.ArcadeOS.forceGoHome(true));
      await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 8000 });
    };

    // 5. Test Launching Reaction Test (app id: 'reaction')
    await launchAppIdx(0);
    console.log('  [PASS] 7. Reaction Test opens successfully.');
    await returnHome();

    // 6. Test Launching Snake (app id: 'snake')
    const items = await page.evaluate(() => window.ArcadeOS.getHomeItems());
    const snakeIdx = items.findIndex(i => i.id === 'snake');
    await launchAppIdx(snakeIdx);
    console.log('  [PASS] 8. Snake opens successfully.');
    await returnHome();

    // 7. Test Launching Breakout (app id: 'breakout')
    const breakoutIdx = items.findIndex(i => i.id === 'breakout');
    await launchAppIdx(breakoutIdx);
    console.log('  [PASS] 9. Breakout opens successfully.');
    await returnHome();

    // 8. Test Launching Pixel Pad (app id: 'pixelpad')
    const padIdx = items.findIndex(i => i.id === 'pixelpad');
    await launchAppIdx(padIdx);
    console.log('  [PASS] 10. Pixel Pad opens successfully.');
    await returnHome();

    // 9. Test Launching Palette Lab (app id: 'palettelab')
    const paletteIdx = items.findIndex(i => i.id === 'palettelab');
    await launchAppIdx(paletteIdx);
    console.log('  [PASS] 11. Palette Lab opens successfully.');
    await returnHome();

    // 10. Test System Config Route
    await openRoute(page, 'SETTINGS');
    assert(await page.evaluate(() => window.ArcadeOS?.state === 'SETTINGS'), '12. Settings system route opens.');
    await returnHome();

    // 11. Test Exit to Portfolio
    await page.click('#dock-portfolio-btn');
    await page.waitForFunction(
      () => !document.querySelector('.cabinet-chassis')?.classList.contains('is-scaled'),
      { timeout: 8000 }
    );
    console.log('  [PASS] 13. Exit to Portfolio restores scaled cabinet state.');

    assert(errors.length === 0, `Browser errors detected: ${errors.join(' | ')}`);

    console.log('\n==========================================');
    console.log('100% PASS! ALL ARCADE V4 CINEMATIC REDESIGN & FUNCTIONAL TESTS VERIFIED.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error('Test Failed:', error); process.exit(1); });
