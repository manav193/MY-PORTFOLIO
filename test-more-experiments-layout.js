const { assert, openPage } = require('./test-helpers');

const viewports = [
  [1920, 1080],
  [1440, 900],
  [1280, 800],
  [1024, 768],
  [820, 1180],
  [430, 932],
  [390, 844],
  [360, 800]
];

(async () => {
  const { browser, page, errors } = await openPage();

  try {
    for (const [width, height] of viewports) {
      await page.setViewport({ width, height });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.$eval('.more-experiments', section => section.scrollIntoView({ block: 'center' }));
      await page.waitForFunction(() => Array.from(document.querySelectorAll('.experiment-card__media img')).every(image => image.complete && image.naturalWidth > 0));

      const layout = await page.evaluate(() => {
        const section = document.querySelector('.more-experiments');
        const grid = section.querySelector('.experiments-grid');
        const cards = Array.from(grid.querySelectorAll('.experiment-card'));
        const sectionRect = section.getBoundingClientRect();
        const gridStyle = getComputedStyle(grid);

        return {
          viewportWidth: innerWidth,
          sectionWidth: sectionRect.width,
          columns: gridStyle.gridTemplateColumns.split(' ').length,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          cards: cards.map((card, index) => {
            const rect = card.getBoundingClientRect();
            const media = card.querySelector('.experiment-card__media').getBoundingClientRect();
            const image = card.querySelector('img').getBoundingClientRect();
            const content = card.querySelector('.experiment-card__content');
            const action = card.querySelector('.experiment-card__actions a');
            const actionRect = action.getBoundingClientRect();
            const paragraph = card.querySelector('p');
            return {
              index,
              left: rect.left,
              right: rect.right,
              top: rect.top,
              bottom: rect.bottom,
              width: rect.width,
              mediaWidth: media.width,
              mediaHeight: media.height,
              imageWidth: image.width,
              imageHeight: image.height,
              textClipped: content.scrollHeight > content.clientHeight || paragraph.scrollWidth > paragraph.clientWidth,
              actionVisible: actionRect.width > 0 && actionRect.height >= 44
            };
          })
        };
      });

      const mobile = width <= 600;
      assert(layout.sectionWidth >= Math.min(1100, width - 64), `${width}x${height}: experiments section is too narrow.`);
      assert(layout.columns === (mobile ? 1 : 2), `${width}x${height}: expected ${mobile ? 1 : 2} grid columns, found ${layout.columns}.`);
      assert(layout.overflow <= 1, `${width}x${height}: page has horizontal overflow.`);

      layout.cards.forEach(card => {
        assert(card.width >= (mobile ? 280 : 350), `${width}x${height}: card ${card.index} is only ${card.width}px wide.`);
        assert(card.mediaWidth > 0 && card.mediaHeight > 0 && Math.abs(card.imageWidth - card.mediaWidth) <= 1 && Math.abs(card.imageHeight - card.mediaHeight) <= 1, `${width}x${height}: card ${card.index} media is invalid.`);
        assert(card.mediaWidth / card.mediaHeight > 1.5 && card.mediaWidth / card.mediaHeight < 1.7, `${width}x${height}: card ${card.index} media ratio is broken.`);
        assert(!card.textClipped && card.actionVisible, `${width}x${height}: card ${card.index} text or action is clipped.`);
      });

      const [first, second] = layout.cards;
      const overlap = !(first.right <= second.left || second.right <= first.left || first.bottom <= second.top || second.bottom <= first.top);
      assert(!overlap, `${width}x${height}: experiment cards overlap.`);

      for (let index = 0; index < layout.cards.length; index += 1) {
        await page.$$eval('.experiment-card__actions a', (actions, activeIndex) => actions[activeIndex].scrollIntoView({ block: 'center' }), index);
        const clearOfDocks = await page.evaluate(activeIndex => {
          const action = document.querySelectorAll('.experiment-card__actions a')[activeIndex].getBoundingClientRect();
          const fixedUi = ['.os-dock-container', '.theme-dock']
            .map(selector => document.querySelector(selector))
            .filter(element => element && getComputedStyle(element).visibility !== 'hidden' && getComputedStyle(element).display !== 'none')
            .map(element => element.getBoundingClientRect());
          const overlaps = rect => !(action.right <= rect.left || action.left >= rect.right || action.bottom <= rect.top || action.top >= rect.bottom);
          return fixedUi.every(rect => !overlaps(rect));
        }, index);
        assert(clearOfDocks, `${width}x${height}: fixed dock prevents card ${index} action from being reached.`);
      }
    }

    assert(errors.length === 0, `Browser errors: ${errors.join(' | ')}`);
    console.log(`PASS more experiments layout: card sizing, media, content, actions, dock clearance, and ${viewports.length} viewports are stable.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
