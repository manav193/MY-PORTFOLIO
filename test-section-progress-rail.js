const { assert, openPage } = require('./test-helpers');

const desktopViewports = [
  [1920, 1080],
  [1600, 900],
  [1440, 900],
  [1280, 800],
  [1100, 800]
];
const hiddenViewports = [
  [1024, 768],
  [820, 1180],
  [430, 932],
  [390, 844],
  [360, 800]
];

(async () => {
  const { browser, page, errors } = await openPage();

  try {
    for (const [width, height] of desktopViewports) {
      await page.setViewport({ width, height });
      await page.goto(`${new URL(page.url()).origin}/`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => window.scrollTo(0, 0));

      const initial = await page.evaluate(() => {
        const rail = document.querySelector('.section-progress-rail');
        const content = document.querySelector('.container-centered');
        const railRect = rail.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        const contentLeft = contentRect.left + parseFloat(getComputedStyle(content).paddingLeft);
        return {
          visible: getComputedStyle(rail).display !== 'none' && railRect.width > 0,
          items: rail.querySelectorAll('.section-progress-rail__link').length,
          active: rail.querySelector('[aria-current="location"]')?.dataset.sectionId,
          contentClear: railRect.right <= contentLeft,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      });
      assert(initial.visible && initial.items === 6, `${width}x${height}: rail is missing or has the wrong item count.`);
      assert(initial.active === 'home', `${width}x${height}: initial section is ${initial.active}.`);
      assert(initial.contentClear && initial.overflow <= 1, `${width}x${height}: rail overlaps content or causes overflow.`);

      const initialProgress = await page.$eval('.section-progress-rail', rail => Number(getComputedStyle(rail).getPropertyValue('--page-progress')));
      await page.$eval('#work', section => section.scrollIntoView({ block: 'center' }));
      await page.waitForFunction(() => document.querySelector('[data-section-id="work"]').getAttribute('aria-current') === 'location');
      const workProgress = await page.$eval('.section-progress-rail', rail => Number(getComputedStyle(rail).getPropertyValue('--page-progress')));
      assert(workProgress > initialProgress, `${width}x${height}: page progress did not increase.`);

      await page.$eval('#about', section => section.scrollIntoView({ block: 'center' }));
      await page.waitForFunction(() => document.querySelector('[data-section-id="about"]').getAttribute('aria-current') === 'location');

      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForFunction(() => document.querySelector('[data-section-id="contact"]').getAttribute('aria-current') === 'location');
      assert(await page.$eval('.section-progress-rail', rail => Number(getComputedStyle(rail).getPropertyValue('--page-progress')) > 0.99), `${width}x${height}: final progress is incomplete.`);

      await page.click('[data-section-id="skills"]');
      await page.waitForFunction(() => document.querySelector('[data-section-id="skills"]').getAttribute('aria-current') === 'location');
      assert(await page.evaluate(() => location.hash === '#skills'), `${width}x${height}: click navigation did not update the hash.`);

      await page.focus('[data-section-id="experience"]');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => location.hash === '#experience');

      if (width === 1440) {
        await page.goBack();
        await page.waitForFunction(() => location.hash === '#skills' && document.querySelector('[data-section-id="skills"]').getAttribute('aria-current') === 'location');
        await page.reload({ waitUntil: 'load' });
        await page.waitForFunction(() => document.querySelector('[data-section-id="skills"]').getAttribute('aria-current') === 'location');
      }

      await page.keyboard.down('Control');
      await page.keyboard.press('KeyK');
      await page.keyboard.up('Control');
      assert(await page.$eval('.section-progress-rail', rail => getComputedStyle(rail).pointerEvents === 'none'), `${width}x${height}: palette did not suppress rail interaction.`);
      await page.keyboard.press('Escape');
      assert(await page.$eval('.section-progress-rail', rail => getComputedStyle(rail).pointerEvents !== 'none'), `${width}x${height}: rail did not return after palette close.`);

      await page.evaluate(() => window.enterArcade());
      await page.waitForFunction(() => document.body.classList.contains('arcade-active'));
      assert(await page.$eval('.section-progress-rail', rail => getComputedStyle(rail).pointerEvents === 'none'), `${width}x${height}: Arcade did not suppress rail interaction.`);
      await page.evaluate(() => window.exitArcadeToPortfolio());
      await page.waitForFunction(() => !document.body.classList.contains('arcade-active'));
      assert(await page.$eval('.section-progress-rail', rail => getComputedStyle(rail).pointerEvents !== 'none'), `${width}x${height}: rail did not return after Arcade exit.`);
    }

    for (const [width, height] of hiddenViewports) {
      await page.setViewport({ width, height });
      await page.goto(`${new URL(page.url()).origin}/`, { waitUntil: 'domcontentloaded' });
      const hidden = await page.evaluate(() => {
        const rail = document.querySelector('.section-progress-rail');
        const rect = rail.getBoundingClientRect();
        return {
          display: getComputedStyle(rail).display,
          area: rect.width * rect.height,
          linkAreas: Array.from(rail.querySelectorAll('a')).reduce((sum, link) => {
            const linkRect = link.getBoundingClientRect();
            return sum + (linkRect.width * linkRect.height);
          }, 0),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      });
      assert(hidden.display === 'none' && hidden.area === 0 && hidden.linkAreas === 0, `${width}x${height}: hidden rail retains a hit area.`);
      assert(hidden.overflow <= 1, `${width}x${height}: hidden rail causes horizontal overflow.`);
    }

    assert(errors.length === 0, `Browser errors: ${errors.join(' | ')}`);
    console.log(`PASS section progress rail: manifest, progress, navigation, overlays, and ${desktopViewports.length + hiddenViewports.length} viewports are stable.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
