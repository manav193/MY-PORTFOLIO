const { openPage, assert } = require('../test-helpers');

async function testAppIdentity() {
  console.log('=== RUNNING APP IDENTITY VERIFICATION SUITE ===');
  const { browser, page } = await openPage({ width: 1280, height: 800 });

  try {
    await page.evaluate(() => {
      localStorage.setItem('arcade_os_onboarded', 'true');
      localStorage.setItem('arcade_os_boot_complete', 'true');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.click('#dock-arcade-btn');
    await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));
    await page.waitForFunction(() => window.ArcadeOS?.state === 'HOME', { timeout: 12000 });

    // Verify app cards
    const cards = await page.evaluate(() => {
      const items = window.ArcadeOS.getHomeItems();
      const cardEls = Array.from(document.querySelectorAll('#home-carousel .app-card'));
      return cardEls.map(el => {
        const title = el.querySelector('.arcade-card-name')?.textContent || '';
        const sub = el.querySelector('.arcade-card-sub')?.textContent || '';
        const iconSvg = el.querySelector('.arcade-card-icon')?.innerHTML || '';
        const id = el.dataset.launcherId;
        return { id, title, sub, hasSvg: iconSvg.includes('<svg') };
      });
    });

    // Check Reaction Test
    const reactionCard = cards.find(c => c.id === 'reaction');
    assert(reactionCard, 'Reaction Test card exists.');
    assert(reactionCard.title === 'Reaction Test', `Reaction Test title restored cleanly (Found: "${reactionCard.title}").`);
    assert(reactionCard.sub.toLowerCase().includes('reflex'), `Reaction Test description mentions reflexes (Found: "${reactionCard.sub}").`);
    assert(reactionCard.hasSvg, 'Reaction Test card has SVG icon.');
    console.log('  [PASS] Reaction Test identity verified.');

    // Check Neon Snake
    const snakeCard = cards.find(c => c.id === 'snake');
    assert(snakeCard, 'Neon Snake card exists.');
    assert(snakeCard.title === 'Neon Snake', `Neon Snake title restored cleanly (Found: "${snakeCard.title}").`);
    assert(snakeCard.sub.toLowerCase().includes('snake'), `Neon Snake description mentions snake (Found: "${snakeCard.sub}").`);
    assert(snakeCard.hasSvg, 'Neon Snake card has SVG icon.');
    console.log('  [PASS] Neon Snake identity verified.');

    // Check Breakout
    const breakoutCard = cards.find(c => c.id === 'breakout');
    assert(breakoutCard, 'Breakout card exists.');
    assert(breakoutCard.title === 'Breakout', `Breakout title verified (Found: "${breakoutCard.title}").`);
    console.log('  [PASS] Breakout identity verified.');

    // Check Pixel Pad
    const pixelpadCard = cards.find(c => c.id === 'pixelpad');
    assert(pixelpadCard, 'Pixel Pad card exists.');
    assert(pixelpadCard.title === 'Pixel Pad', `Pixel Pad title verified (Found: "${pixelpadCard.title}").`);
    console.log('  [PASS] Pixel Pad identity verified.');

    console.log('\n==========================================');
    console.log('100% PASS! ALL APP IDENTITIES ACCURATELY RESTORED & VERIFIED.');
  } finally {
    await browser.close();
  }
}

testAppIdentity().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
